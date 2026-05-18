const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export interface ProdutoDTO {
  produtoId: number;
  nomeProduto: string;
  descricao?: string;
  imagemUrls: string[];
  quantidade: number;
  embalagem: string;
  valorCompra: number;
  valorVenda: number;
  categoriaIds: number[];
  categorias: string[];
  ativo: boolean;
  freteHabilitado: boolean;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
}

export interface ProdutoCreatePayload {
  nomeProduto: string;
  descricao?: string;
  imagemUrls: string[];
  quantidade: number;
  embalagem: string;
  valorCompra: number;
  valorVenda: number;
  categoriaIds: number[];
  ativo: boolean;
  freteHabilitado: boolean;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
}

export async function getProdutos(): Promise<ProdutoDTO[]> {
  const res = await fetch(`${API_URL}/api/produto`);
  if (!res.ok) throw new Error('Erro ao carregar produtos.');
  return res.json();
}

export async function createProduto(payload: ProdutoCreatePayload): Promise<void> {
  const res = await fetch(`${API_URL}/api/produto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao criar produto.');
  }
}

export async function updateProduto(id: number, payload: ProdutoCreatePayload): Promise<void> {
  const res = await fetch(`${API_URL}/api/produto/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao atualizar produto.');
  }
}

export async function deleteProduto(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/produto/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir produto.');
}

export async function uploadImagem(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/imagem`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao fazer upload da imagem.');
  }
  const data = await res.json();
  // API returns relative path like /uploads/guid.jpg — prefix with base URL
  return `${API_URL}${data.imagemUrl}`;
}
