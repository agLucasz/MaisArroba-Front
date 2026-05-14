const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export interface FormaPagamentoDTO {
  formaPagamentoId: number;
  nomeFormaPagamento: string;
}

export async function getFormasPagamento(): Promise<FormaPagamentoDTO[]> {
  const res = await fetch(`${API_URL}/api/forma_pagamento`);
  if (!res.ok) throw new Error('Erro ao carregar formas de pagamento.');
  return res.json();
}

export async function createFormaPagamento(nomeFormaPagamento: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/forma_pagamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeFormaPagamento }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao criar forma de pagamento.');
  }
}

export async function updateFormaPagamento(id: number, nomeFormaPagamento: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/forma_pagamento/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeFormaPagamento }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao atualizar forma de pagamento.');
  }
}

export async function deleteFormaPagamento(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/forma_pagamento/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir forma de pagamento.');
}
