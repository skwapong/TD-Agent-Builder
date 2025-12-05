/**
 * TD LLM API Proxy Server
 *
 * This server proxies requests to the Treasure Data LLM API,
 * handling authentication and CORS for the browser-based wizard.
 *
 * Usage:
 *   1. Copy .env.example to .env and configure your TD API key
 *   2. Run: node proxy-server.js
 *   3. Server starts on http://localhost:3001
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }
}

loadEnv();

// Configuration
const PORT = process.env.PORT || 3001;
const TD_API_KEY = process.env.TD_API_KEY;
const TD_LLM_BASE_URL = process.env.TD_LLM_BASE_URL || 'https://llm-api-development.us01.treasuredata.com';
const TD_AGENT_ID = process.env.TD_AGENT_ID;
const STATIC_DIR = __dirname;

// CORS headers
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Max-Age': '86400'
};

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.md': 'text/markdown'
};

// Parse request body
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : null);
            } catch (e) {
                resolve(body);
            }
        });
        req.on('error', reject);
    });
}

// Make HTTPS request to TD LLM API
function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            resolve(res);
        });

        req.on('error', reject);

        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }

        req.end();
    });
}

// Serve static files
function serveStatic(req, res, filePath) {
    const fullPath = path.join(STATIC_DIR, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(STATIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Handle API proxy requests
async function handleApiProxy(req, res, apiPath) {
    if (!TD_API_KEY) {
        res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'TD_API_KEY not configured',
            message: 'Please set TD_API_KEY in your .env file'
        }));
        return;
    }

    const url = new URL(TD_LLM_BASE_URL);
    const targetPath = apiPath.startsWith('/api') ? apiPath : `/api${apiPath}`;

    const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: targetPath,
        method: req.method,
        headers: {
            'Authorization': `TD1 ${TD_API_KEY}`,
            'Content-Type': req.headers['content-type'] || 'application/vnd.api+json',
            'Accept': req.headers['accept'] || 'application/vnd.api+json'
        }
    };

    console.log(`📤 ${req.method} ${TD_LLM_BASE_URL}${targetPath}`);

    try {
        let body = null;

        if (req.method === 'POST' || req.method === 'PUT') {
            body = await parseBody(req);

            // Inject agent ID if configured and not provided
            if (body && typeof body === 'object' && body.data?.attributes && !body.data.attributes.agentId && TD_AGENT_ID) {
                body.data.attributes.agentId = TD_AGENT_ID;
                console.log('✅ Injected agentId from environment:', TD_AGENT_ID);
            }
        }

        const proxyRes = await makeRequest(options, body);

        console.log(`📥 TD API Response: ${proxyRes.statusCode}`);

        // Check if this is a streaming response
        const isStreaming = req.headers['accept']?.includes('text/event-stream') ||
                           proxyRes.headers['content-type']?.includes('text/event-stream');

        if (isStreaming) {
            // Stream the response
            res.writeHead(proxyRes.statusCode, {
                ...CORS_HEADERS,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            proxyRes.on('data', chunk => {
                res.write(chunk);
            });

            proxyRes.on('end', () => {
                res.end();
            });

            proxyRes.on('error', (err) => {
                console.error('Stream error:', err);
                res.end();
            });

        } else {
            // Buffer and return the response
            let responseData = '';
            proxyRes.on('data', chunk => responseData += chunk);
            proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode, {
                    ...CORS_HEADERS,
                    'Content-Type': proxyRes.headers['content-type'] || 'application/json'
                });
                res.end(responseData);
            });
        }

    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Proxy error',
            message: error.message
        }));
    }
}

// Main request handler
const server = http.createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    // Health check endpoint
    if (urlPath === '/health') {
        res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            message: 'TD LLM Proxy Server is running',
            configured: !!TD_API_KEY,
            agentId: TD_AGENT_ID ? 'configured' : 'not set',
            baseUrl: TD_LLM_BASE_URL
        }));
        return;
    }

    // API proxy routes
    if (urlPath.startsWith('/api/')) {
        await handleApiProxy(req, res, urlPath);
        return;
    }

    // Static file serving
    let filePath = urlPath;
    if (filePath === '/') {
        filePath = '/index.html';
    }

    serveStatic(req, res, filePath);
});

// Start server
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       TD LLM API Proxy Server - Agent Builder Wizard       ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Server:     http://localhost:${PORT}                       ║`);
    console.log(`║  📡 TD LLM API: ${TD_LLM_BASE_URL.substring(0, 44).padEnd(44)} ║`);
    console.log(`║  🔑 API Key:    ${TD_API_KEY ? '✅ Configured' : '❌ NOT SET - Add to .env'.padEnd(44)}     ║`);
    console.log(`║  🤖 Agent ID:   ${TD_AGENT_ID ? TD_AGENT_ID.substring(0, 30).padEnd(30) : 'Not set (optional)'.padEnd(30)}               ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  Open http://localhost:3001 in your browser to start       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    if (!TD_API_KEY) {
        console.log('⚠️  Warning: TD_API_KEY is not configured!');
        console.log('   Please create a .env file with your TD API key.');
        console.log('   Copy .env.example to .env and add your key.');
        console.log('');
    }
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try a different port or stop the other process.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down proxy server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
