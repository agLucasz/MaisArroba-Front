const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export interface EnderecoFrete {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface OpcaoFrete {
  transportadora: string;
  servico: string;
  valor: number;
  prazo: number;
  entregaEstimada: string | null;
}

export interface ResultadoFrete {
  endereco: EnderecoFrete;
  fretes: OpcaoFrete[];
}

export async function calcularFrete(
  cep: string,
  produtoId: number,
  signal?: AbortSignal
): Promise<ResultadoFrete> {
  const response = await fetch(`${API_BASE}/api/frete/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cep, produtoId }),
    signal,
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(erro.message ?? `Erro HTTP ${response.status}`);
  }

  return response.json();
}

export async function buscarEnderecoPorCep(
  cep: string,
  signal?: AbortSignal
): Promise<EnderecoFrete> {
  const cepLimpo = cep.replace(/\D/g, '');
  const response = await fetch(`${API_BASE}/api/frete/endereco/${cepLimpo}`, { signal });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({ message: 'CEP não encontrado' }));
    throw new Error(erro.message ?? `Erro HTTP ${response.status}`);
  }

  return response.json();
}
