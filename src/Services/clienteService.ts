const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export interface ClienteDTO {
  clienteId: number;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  uf: string;
}

export async function getClientes(): Promise<ClienteDTO[]> {
  const res = await fetch(`${API_URL}/api/cliente`);
  if (!res.ok) throw new Error('Erro ao carregar clientes.');
  return res.json();
}

export async function createCliente(nome: string, documento: string, telefone: string, email: string, endereco: string, bairro: string, cidade: string, cep: string, uf: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/cliente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, documento, telefone, email, endereco, bairro, cidade, cep, uf }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao criar cliente.');
  }
}

export async function updateCliente(clienteId: number, nome: string, documento: string, telefone: string, email: string, endereco: string, bairro: string, cidade: string, cep: string, uf: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/cliente/${clienteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, documento, telefone, email, endereco, bairro, cidade, cep, uf }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao atualizar cliente.');
  }
}

export async function deleteCliente(clienteId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/cliente/${clienteId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir cliente.');
}
