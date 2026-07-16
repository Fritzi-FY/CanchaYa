const API_URL = 'http://localhost:3000/api';

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
        throw new Error(errorData.message || `Error en la petición: ${response.status}`);
    }

    return response.json();
}