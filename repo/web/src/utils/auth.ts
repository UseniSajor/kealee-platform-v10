
// This would ideally be a Context Provider, but for simplicity we'll just make a helper
// that automatically injects the key.

export function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer frontend_key' // In real app, this comes from user session/env
    };
}
