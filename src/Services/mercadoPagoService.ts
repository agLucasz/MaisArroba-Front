const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface CheckoutItem {
  produtoId: number;
  quantidade: number;
}

export interface ClienteCheckout {
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
}

// O cartão nunca chega cru ao backend: o token é gerado no client via MP.js.
export interface CardData {
  token: string;
  installmentCount: number;
}

export interface CheckoutRequest {
  itens: CheckoutItem[];
  cliente: ClienteCheckout;
  billingType: BillingType;
  observacao?: string;
  cartao?: CardData;
}

export interface CheckoutResponse {
  vendaId: number;
  mercadoPagoPaymentId: string;
  billingType: BillingType;
  status: string;
  value: number;
  pixPayload?: string;
  pixQrCodeBase64?: string;
  pixExpirationDate?: string;
  boletoUrl?: string;
  boletoBarCode?: string;
  invoiceUrl?: string;
  message?: string;
}

export interface PaymentStatusResponse {
  mercadoPagoPaymentId: string;
  billingType: string;
  status: string;
  value: number;
  paidAt?: string;
  vendaId: number;
  vendaStatus: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as { message?: string }).message
      ?? `Erro ${res.status} ao processar pagamento.`;
    throw new Error(msg);
  }

  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as { message?: string }).message ?? `Erro ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export const mercadoPagoService = {
  checkout: (req: CheckoutRequest) =>
    post<CheckoutResponse>('/api/pagamento/checkout', req),

  getStatus: (vendaId: number) =>
    get<PaymentStatusResponse>(`/api/pagamento/venda/${vendaId}/status`),

  healthCheck: () =>
    get<{ status: string }>('/api/pagamento/health'),
};
