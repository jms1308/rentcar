const API_URL = '/api';

const handleResponse = async (res: Response) => {
  if (res.status === 401 || res.status === 403) {
    const isLoginPage = window.location.pathname === '/login';
    if (!isLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }
  }
  
  if (!res.ok) {
    const text = await res.text();
    let message = `Xatolik: ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message || message;
    } catch (e) {
      message = text || message;
    }
    throw new Error(message);
  }
  
  return res.json();
};

export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res);
  },
  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  postFormData: async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      body: formData
    });
    return handleResponse(res);
  },
  put: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  putFormData: async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      body: formData
    });
    return handleResponse(res);
  },
  delete: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res);
  },
  download: async (endpoint: string, filename: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) return handleResponse(res);
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
