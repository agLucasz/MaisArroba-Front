// Inicialização do SDK client-side do Mercado Pago (MP.js v2, carregado em index.html).
// Usado para tokenizar dados de cartão no navegador — o backend nunca recebe PAN/CVV.

declare global {
  interface Window {
    MercadoPago: new (publicKey: string) => MercadoPagoInstance;
  }
}

interface CardTokenPayload {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface CardTokenResult {
  id: string;
}

interface MercadoPagoInstance {
  createCardToken: (payload: CardTokenPayload) => Promise<CardTokenResult>;
}

let instance: MercadoPagoInstance | null = null;

export function getMercadoPago(): MercadoPagoInstance {
  if (instance) return instance;

  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
  if (!publicKey) {
    throw new Error('VITE_MP_PUBLIC_KEY não configurada.');
  }
  if (!window.MercadoPago) {
    throw new Error('SDK do Mercado Pago não carregado (script sdk.mercadopago.com ausente).');
  }

  instance = new window.MercadoPago(publicKey);
  return instance;
}

export interface CreateCardTokenInput {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  cpfCnpj: string;
}

export async function createCardToken(input: CreateCardTokenInput): Promise<string> {
  const mp = getMercadoPago();
  const docLimpo = input.cpfCnpj.replace(/\D/g, '');

  const result = await mp.createCardToken({
    cardNumber: input.number.replace(/\s/g, ''),
    cardholderName: input.holderName,
    cardExpirationMonth: input.expiryMonth,
    cardExpirationYear: input.expiryYear,
    securityCode: input.ccv,
    identificationType: docLimpo.length > 11 ? 'CNPJ' : 'CPF',
    identificationNumber: docLimpo,
  });

  return result.id;
}
