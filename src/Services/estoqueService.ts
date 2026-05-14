const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export interface EntradaEstoqueDTO {
  estoqueId: number;
  produtoId: number;
  produto: string;
  quantidadeEntrada: number;
  dataEntrada: string;
}

export interface EntradaEstoqueCreateDTO {
  produtoId: number;
  quantidadeEntrada: number;
  dataEntrada: string;
}

export async function getEntradasEstoque(): Promise<EntradaEstoqueDTO[]> {
  const res = await fetch(`${API_URL}/api/entrada-estoque`);
  if (!res.ok) throw new Error('Erro ao carregar entradas de estoque.');
  return res.json();
}

export async function createEntradaEstoque(payload: EntradaEstoqueCreateDTO): Promise<void> {
  const res = await fetch(`${API_URL}/api/entrada-estoque`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao registrar entrada de estoque.');
  }
}

export async function deleteEntradaEstoque(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/entrada-estoque/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir entrada de estoque.');
}
