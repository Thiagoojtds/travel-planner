const BASE_URL = '/api';

export function getAuthPin(): string {
  return localStorage.getItem('transfrete_pin') || '';
}

export function setAuthPin(pin: string) {
  localStorage.setItem('transfrete_pin', pin);
}

export function clearAuthPin() {
  localStorage.removeItem('transfrete_pin');
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const pin = getAuthPin();
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (pin) {
    headers.set('x-access-pin', pin);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Se o endpoint não for de verificação, aciona evento de lock
    if (!endpoint.startsWith('/auth')) {
      window.dispatchEvent(new CustomEvent('auth:required'));
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Acesso não autorizado. Insira o PIN.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na requisição: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) searchParams.append(key, String(val));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return request<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string) => {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};
