const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export interface CategoriaDTO {
  categoriaId: number;
  nomeCategoria: string;
}

export async function getCategorias(): Promise<CategoriaDTO[]> {
  const res = await fetch(`${API_URL}/api/categoria`);
  if (!res.ok) throw new Error('Erro ao carregar categorias.');
  return res.json();
}

export async function createCategoria(nomeCategoria: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/categoria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeCategoria }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao criar categoria.');
  }
}

export async function updateCategoria(id: number, nomeCategoria: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/categoria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeCategoria }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao atualizar categoria.');
  }
}

export async function deleteCategoria(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/categoria/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir categoria.');
}
