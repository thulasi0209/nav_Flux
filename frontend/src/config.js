export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Automatic WebSocket protocol switching (http -> ws, https -> wss)
export const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws/stream';
