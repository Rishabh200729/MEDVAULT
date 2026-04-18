const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function api<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Something went wrong');
  }

  return res.json();
}

export async function uploadFile(
  endpoint: string,
  file: File,
  token: string,
  extraParams: Record<string, string> = {}
) {
  const formData = new FormData();
  formData.append('file', file);

  const queryParams = new URLSearchParams(extraParams).toString();
  const url = `${API_BASE}${endpoint}${queryParams ? `?${queryParams}` : ''}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }

  return res.json();
}

// Auth helper
const TOKEN_KEY = 'medvault_token';
const USER_KEY = 'medvault_user';

export function saveAuth(token: string, user: { medical_id: string; role: string; name: string }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): { medical_id: string; role: string; name: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
