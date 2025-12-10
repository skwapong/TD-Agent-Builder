/**
 * Live Presence Tracking API
 *
 * Tracks online users using in-memory storage (resets on cold start).
 * For production, consider using Vercel KV or Redis.
 */

// In-memory presence store (persists across warm function invocations)
// Note: This resets on cold starts, but works well for real-time tracking
const presenceStore = global.presenceStore || new Map();
global.presenceStore = presenceStore;

const SESSION_TIMEOUT = 30000; // 30 seconds - consider user offline after this

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    // Handle GET - return current count
    if (req.method === 'GET') {
        cleanupStale();
        res.status(200).json({ count: presenceStore.size });
        return;
    }

    // Handle POST - update presence
    if (req.method === 'POST') {
        try {
            // Parse body - handle both JSON and text
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }

            const { sessionId, action } = body || {};

            if (!sessionId) {
                res.status(400).json({ error: 'sessionId required' });
                return;
            }

            const now = Date.now();

            // Cleanup stale sessions first
            cleanupStale();

            switch (action) {
                case 'join':
                case 'ping':
                    presenceStore.set(sessionId, now);
                    break;
                case 'leave':
                    presenceStore.delete(sessionId);
                    break;
                default:
                    presenceStore.set(sessionId, now);
            }

            res.status(200).json({
                count: presenceStore.size,
                sessionId: sessionId
            });

        } catch (error) {
            console.error('Presence error:', error);
            res.status(500).json({ error: 'Internal error', count: presenceStore.size });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};

// Cleanup sessions older than SESSION_TIMEOUT
function cleanupStale() {
    const now = Date.now();
    for (const [sessionId, timestamp] of presenceStore.entries()) {
        if (now - timestamp > SESSION_TIMEOUT) {
            presenceStore.delete(sessionId);
        }
    }
}
