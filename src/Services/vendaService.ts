import { getToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export enum StatusVenda {
  Aberto    = 0,
  Pendente  = 1,
  Pago      = 2,
  Cancelado = 3,
}

export enum StatusEntrega {
  Pendente = 0,
  Entregue = 1,
}

export interface VendaItemDTO {
  vendaItemId: number;
  produtoId: number;
  nomeProduto: string;
  quantidadeItem: number;
  valorItem?: number;
  observacao?: string;
}

export interface VendaDTO {
  vendaId: number;
  itens: VendaItemDTO[];
  valorVenda: number;
  dataVenda?: string;
  dataEntrega?: string;
  observacao?: string;
  status: StatusVenda;
  statusEntrega: StatusEntrega;
  clienteId?: number;
  nomeCliente?: string;
}

export interface VendaItemCreateDTO {
  produtoId: number;
  quantidadeItem: number;
  valorItem?: number;
  observacao?: string;
}

export interface VendaCreateDTO {
  itens: VendaItemCreateDTO[];
  clienteId?: number;
  dataEntrega?: string;
  observacao?: string;
}

export async function getVendas(): Promise<VendaDTO[]> {
  const res = await fetch(`${API_URL}/api/venda`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Erro ao carregar pedidos.');
  return res.json();
}

export async function createVenda(payload: VendaCreateDTO): Promise<void> {
  const res = await fetch(`${API_URL}/api/venda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao criar pedido.');
  }
}

export async function finalizarVenda(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/venda/${id}/finalizar`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao finalizar pedido.');
  }
}

export async function reabrirVenda(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/venda/${id}/reabrir`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao reabrir pedido.');
  }
}

export async function cancelarVenda(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/venda/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao cancelar pedido.');
  }
}
