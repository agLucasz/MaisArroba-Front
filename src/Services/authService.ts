const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export interface LoginPayload {
  email: string;
  senha: string;
}

// Matches LoginDTO returned by POST /api/auth/login
export interface LoginResponse {
  usuarioId: number;
  token: string;
  nome: string;
  email: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, senha: payload.senha }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Credenciais inválidas. Verifique seu e-mail e senha.');
  }

  return res.json() as Promise<LoginResponse>;
}

export function saveSession(token: string, persistent: boolean): void {
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem('ma_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('ma_token') ?? sessionStorage.getItem('ma_token');
}

export function clearSession(): void {
  localStorage.removeItem('ma_token');
  sessionStorage.removeItem('ma_token');
}
