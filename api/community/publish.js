/**
 * Community Agent Publish API
 *
 * This serverless function handles publishing agents to the community gallery.
 * It uses GitHub API to update the community-agents.json file in the repository.
 *
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal access token with repo write permissions
 * - GITHUB_REPO: Repository in format "owner/repo" (e.g., "skwapong/agent-builder-wizard-tdllm")
 */

export const config = {
    runtime: 'edge',
};

const GITHUB_API_BASE = 'https://api.github.com';
const COMMUNITY_FILE_PATH = 'community-agents.json';

export default async function handler(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    // Only allow POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    try {
        const body = await request.json();
        const { name, description, author, tags, data } = body;

        // Validate required fields
        if (!name || !author || !data) {
            return new Response(JSON.stringify({
                error: 'Missing required fields',
                message: 'name, author, and data are required'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        // Get GitHub credentials from environment
        const githubToken = process.env.GITHUB_TOKEN;
        const githubRepo = process.env.GITHUB_REPO || 'skwapong/agent-builder-wizard-tdllm';

        if (!githubToken) {
            console.error('GITHUB_TOKEN not configured');
            return new Response(JSON.stringify({
                error: 'Server configuration error',
                message: 'GitHub integration not configured. Please contact the administrator.'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        // Fetch current community-agents.json from GitHub
        const [owner, repo] = githubRepo.split('/');
        const getFileUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${COMMUNITY_FILE_PATH}`;

        const fileResponse = await fetch(getFileUrl, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'TD-Agent-Builder',
            },
        });

        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            console.error('Failed to fetch community file:', fileResponse.status, errorText);
            throw new Error('Failed to fetch community agents file');
        }

        const fileData = await fileResponse.json();
        const currentContent = JSON.parse(atob(fileData.content));
        const sha = fileData.sha;

        // Generate new agent ID
        const newId = `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create new agent entry
        const newAgent = {
            id: newId,
            name: name,
            description: description || '',
            author: author,
            tags: tags || [],
            downloads: 0,
            publishedAt: new Date().toISOString(),
            data: data,
        };

        // Add to agents array
        currentContent.agents = currentContent.agents || [];
        currentContent.agents.unshift(newAgent); // Add at beginning (newest first)
        currentContent.lastUpdated = new Date().toISOString();

        // Update file on GitHub
        const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentContent, null, 2))));

        const updateResponse = await fetch(getFileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'TD-Agent-Builder',
            },
            body: JSON.stringify({
                message: `Add community agent: ${name}`,
                content: newContent,
                sha: sha,
                branch: 'main',
            }),
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update file:', updateResponse.status, errorText);
            throw new Error('Failed to publish agent to community');
        }

        const updateResult = await updateResponse.json();

        return new Response(JSON.stringify({
            success: true,
            message: 'Agent published successfully',
            agentId: newId,
            commit: updateResult.commit?.sha,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error) {
        console.error('Publish error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to publish',
            message: error.message || 'An unexpected error occurred'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
