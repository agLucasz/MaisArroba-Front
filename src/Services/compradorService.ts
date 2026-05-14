const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5233/api';

export interface RegistroCompradorDTO {
  nome:      string;
  documento: string;
  email:     string;
  senha:     string;
  telefone?: string;
  cep?:      string;
  endereco?: string;
  numero?:   string;
  bairro?:   string;
  cidade?:   string;
  uf?:       string;
}

export interface LoginCompradorDTO {
  email: string;
  senha: string;
}

export interface CompradorAuthResponse {
  usuarioId: number;
  nome:      string;
  email:     string;
  token:     string;
}

export interface CompradorPerfilDTO {
  usuarioId: number;
  nome:      string;
  documento: string;
  telefone:  string;
  email:     string;
  cep:       string;
  endereco:  string;
  numero:    string;
  bairro:    string;
  cidade:    string;
  uf:        string;
}

export interface CepResponse {
  logradouro: string;
  bairro:     string;
  localidade: string;
  uf:         string;
  cep:        string;
  erro?:      boolean;
}

export interface CnpjResponse {
  razao_social?: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  cnpj?: string;
  [key: string]: unknown;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro ?? data?.title ?? 'Erro na requisição');
  return data as T;
}

async function get<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro ?? data?.title ?? 'Erro na requisição');
  return data as T;
}

export const compradorService = {
  registrar: (dto: RegistroCompradorDTO) =>
    post<CompradorAuthResponse>('/comprador/registrar', dto),

  login: (dto: LoginCompradorDTO) =>
    post<CompradorAuthResponse>('/comprador/login', dto),

  getPerfil: (token: string) =>
    get<CompradorPerfilDTO>('/comprador/perfil', token),

  consultarCep: async (cep: string): Promise<CepResponse> => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) throw new Error('CEP inválido');
    const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json() as CepResponse;
    if (data.erro) throw new Error('CEP não encontrado');
    return data;
  },

  consultarCnpj: (cnpj: string) =>
    get<CnpjResponse>(`/validacao/cnpj/${cnpj.replace(/\D/g, '')}`),
};
