export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Automatic WebSocket protocol switching (http -> ws, https -> wss)
export const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws/stream';

// Only needed if the backend has API_KEY set (production/shared deployments).
// Leave VITE_API_KEY unset for local/dev — the backend allows unauthenticated
// requests when it has no API_KEY configured either.
export const API_KEY = import.meta.env.VITE_API_KEY || '';

export const authHeaders = () => (API_KEY ? { 'X-API-Key': API_KEY } : {});
