// Determinación dinámica de la URL de la API según el entorno
const API_URL = window.CUSTOM_API_URL || 
  (window.location.origin && window.location.origin !== 'null' && !window.location.href.startsWith('file://')
    ? (window.location.origin.includes(':3000') || window.location.origin.includes(':8080')
        ? `${window.location.origin}/api`
        : `${window.location.protocol}//${window.location.hostname}:3000/api`)
    : 'http://localhost:3000/api');

// Helper centralizado para hacer peticiones HTTP fácilmente
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    // Configurar cabeceras por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Si tenemos un token guardado, lo adjuntamos como Bearer (Requisito de tus tests de integración)
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Error en la petición: ${response.status}`);
    }

    return response.json();
}