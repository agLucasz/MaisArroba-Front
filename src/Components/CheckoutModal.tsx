import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Copy, ExternalLink, Loader, QrCode, FileText, CreditCard } from 'lucide-react';
import { type CartItem } from '../Contexts/CartContext';
import { asaasService, type BillingType, type CheckoutResponse } from '../Services/asaasService';
import '../Styles/checkoutModal.css';

type Step = 'cliente' | 'pagamento' | 'resultado';

interface Props {
  items: CartItem[];
  onClose: () => void;
  onSuccess?: (vendaId: number) => void;
}

interface ClienteForm {
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
}

interface CardForm {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  installmentCount: number;
}

const EMPTY_CLIENTE: ClienteForm = {
  nome: '', cpfCnpj: '', email: '', telefone: '',
  endereco: '', numero: '', bairro: '', cep: '', cidade: '', uf: ''
};

const EMPTY_CARD: CardForm = {
  holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '', installmentCount: 1
};

const METHOD_LABELS: Record<BillingType, { label: string; icon: React.ReactNode; desc: string }> = {
  PIX:         { label: 'PIX',    icon: <QrCode size={20} />,    desc: 'Pagamento imediato via QR Code' },
  BOLETO:      { label: 'Boleto', icon: <FileText size={20} />,  desc: 'Vence em 3 dias úteis' },
  CREDIT_CARD: { label: 'Cartão', icon: <CreditCard size={20} />, desc: 'Débito ou crédito em até 12x' },
};

export const CheckoutModal: React.FC<Props> = ({ items, onClose, onSuccess }) => {
  const [step,       setStep]       = useState<Step>('cliente');
  const [billing,    setBilling]    = useState<BillingType>('PIX');
  const [cliente,    setCliente]    = useState<ClienteForm>(EMPTY_CLIENTE);
  const [card,       setCard]       = useState<CardForm>(EMPTY_CARD);
  const [errors,     setErrors]     = useState<Partial<ClienteForm & CardForm>>({});
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [result,     setResult]     = useState<CheckoutResponse | null>(null);
  const [copied,     setCopied]     = useState(false);

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const totalValor = items.reduce((s, i) => s + i.produto.valorAVista * i.qty, 0);
  const formatBRL  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ── Validação ──────────────────────────────────────────────────────────────

  const validateCliente = (): boolean => {
    const e: Partial<ClienteForm> = {};
    if (!cliente.nome.trim())    e.nome    = 'Nome obrigatório';
    if (!cliente.cpfCnpj.trim()) e.cpfCnpj = 'CPF/CNPJ obrigatório';
    if (cliente.email && !/\S+@\S+\.\S+/.test(cliente.email))
      e.email = 'E-mail inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateCard = (): boolean => {
    if (billing !== 'CREDIT_CARD') return true;
    const e: Partial<CardForm> = {};
    if (!card.holderName.trim())  e.holderName  = 'Nome no cartão obrigatório';
    if (card.number.replace(/\s/g, '').length < 15) e.number = 'Número inválido';
    if (!card.expiryMonth)        e.expiryMonth = 'Mês inválido';
    if (!card.expiryYear)         e.expiryYear  = 'Ano inválido';
    if (card.ccv.length < 3)      e.ccv         = 'CVV inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Ações ──────────────────────────────────────────────────────────────────

  const handleClienteNext = () => {
    if (validateCliente()) setStep('pagamento');
  };

  const handleSubmit = async () => {
    if (!validateCard()) return;

    setLoading(true);
    setApiError(null);

    try {
      const response = await asaasService.checkout({
        itens: items.map(i => ({ produtoId: i.produto.produtoId, quantidade: i.qty })),
        cliente: {
          nome:     cliente.nome,
          cpfCnpj: cliente.cpfCnpj,
          email:    cliente.email || undefined,
          telefone: cliente.telefone || undefined,
          endereco: cliente.endereco || undefined,
          numero:   cliente.numero || undefined,
          bairro:   cliente.bairro || undefined,
          cep:      cliente.cep || undefined,
          cidade:   cliente.cidade || undefined,
          uf:       cliente.uf || undefined,
        },
        billingType: billing,
        cartao: billing === 'CREDIT_CARD' ? {
          holderName:      card.holderName,
          number:          card.number.replace(/\s/g, ''),
          expiryMonth:     card.expiryMonth,
          expiryYear:      card.expiryYear,
          ccv:             card.ccv,
          installmentCount: card.installmentCount,
        } : undefined,
      });

      setResult(response);
      setStep('resultado');
      onSuccess?.(response.vendaId);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixPayload = () => {
    if (!result?.pixPayload) return;
    navigator.clipboard.writeText(result.pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Helpers de campo ──────────────────────────────────────────────────────

  const field = (
    key: keyof ClienteForm,
    label: string,
    placeholder?: string,
    type = 'text'
  ) => (
    <div className="co-field">
      <label className="co-label">{label}</label>
      <input
        className={`co-input${errors[key] ? ' co-input--error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={cliente[key]}
        onChange={e => setCliente(p => ({ ...p, [key]: e.target.value }))}
      />
      {errors[key] && <span className="co-error-msg">{errors[key]}</span>}
    </div>
  );

  const cardField = (
    key: keyof CardForm,
    label: string,
    placeholder?: string,
    type = 'text'
  ) => (
    <div className="co-field">
      <label className="co-label">{label}</label>
      <input
        className={`co-input${errors[key] ? ' co-input--error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={card[key] as string}
        onChange={e => setCard(p => ({ ...p, [key]: e.target.value }))}
        maxLength={key === 'number' ? 19 : undefined}
      />
      {errors[key] && <span className="co-error-msg">{String(errors[key])}</span>}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepIndex = { cliente: 0, pagamento: 1, resultado: 2 }[step];

  return (
    <div
      className="co-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar pedido"
    >
      <div className="co-dialog">

        {/* Header */}
        <div className="co-header">
          <div>
            <h2 className="co-title">
              {step === 'resultado' ? 'Pedido realizado!' : 'Finalizar pedido'}
            </h2>
            <p className="co-subtitle">
              {items.length} {items.length === 1 ? 'produto' : 'produtos'} — {formatBRL(totalValor)}
            </p>
          </div>
          <button className="co-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        {step !== 'resultado' && (
          <div className="co-steps">
            {(['cliente', 'pagamento'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`co-step${stepIndex === i ? ' co-step--active' : ''}${stepIndex > i ? ' co-step--done' : ''}`}>
                  <div className="co-step-dot">
                    {stepIndex > i ? '✓' : i + 1}
                  </div>
                  <span>{s === 'cliente' ? 'Seus dados' : 'Pagamento'}</span>
                </div>
                {i < 1 && <div className="co-step-line" />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="co-body">

          {/* ── ETAPA 1: Dados do cliente ── */}
          {step === 'cliente' && (
            <>
              <p className="co-section-title">Identificação</p>
              <div className="co-fields co-fields--2">
                {field('nome',     'Nome completo *', 'João da Silva')}
                {field('cpfCnpj', 'CPF / CNPJ *',    '000.000.000-00')}
                {field('email',   'E-mail',           'joao@email.com', 'email')}
                {field('telefone','Telefone',         '(11) 99999-9999', 'tel')}
              </div>

              <p className="co-section-title" style={{ marginTop: 4 }}>Endereço (opcional)</p>
              <div className="co-fields co-fields--2">
                {field('cep',      'CEP',        '00000-000')}
                {field('uf',       'UF',         'SP')}
                {field('cidade',   'Cidade',     'São Paulo')}
                {field('bairro',   'Bairro',     'Centro')}
                {field('endereco', 'Rua',        'Rua das Flores')}
                {field('numero',   'Número',     '123')}
              </div>

              <div className="co-actions">
                <button className="co-btn-next" onClick={handleClienteNext}>
                  Continuar
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── ETAPA 2: Método de pagamento ── */}
          {step === 'pagamento' && (
            <>
              <p className="co-section-title">Forma de pagamento</p>
              <div className="co-payment-methods">
                {(Object.entries(METHOD_LABELS) as [BillingType, typeof METHOD_LABELS[BillingType]][]).map(([type, meta]) => (
                  <button
                    key={type}
                    className={`co-method-btn${billing === type ? ' co-method-btn--active' : ''}`}
                    onClick={() => setBilling(type)}
                  >
                    <div className="co-method-icon">{meta.icon}</div>
                    <span className="co-method-label">{meta.label}</span>
                    <span className="co-method-desc">{meta.desc}</span>
                  </button>
                ))}
              </div>

              {/* Cartão — campos extras */}
              {billing === 'CREDIT_CARD' && (
                <>
                  <p className="co-section-title" style={{ marginTop: 4 }}>Dados do cartão</p>
                  <div className="co-fields">
                    {cardField('holderName', 'Nome no cartão *', 'JOÃO DA SILVA')}
                    {cardField('number',     'Número do cartão *', '0000 0000 0000 0000')}
                  </div>
                  <div className="co-fields co-fields--3">
                    {cardField('expiryMonth', 'Mês *', '12')}
                    {cardField('expiryYear',  'Ano *', '2030')}
                    {cardField('ccv',         'CVV *', '123')}
                  </div>
                  <div className="co-field">
                    <label className="co-label">Parcelas</label>
                    <select
                      className="co-input"
                      value={card.installmentCount}
                      onChange={e => setCard(p => ({ ...p, installmentCount: Number(e.target.value) }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}x sem juros</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="co-info-box">
                <div className="co-info-box-icon"><CheckCircle size={18} /></div>
                <p>Os preços são definidos após análise. Nossa equipe confirmará os valores antes de processar a cobrança.</p>
              </div>

              {apiError && (
                <p style={{ color: 'oklch(0.55 0.18 25)', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {apiError}
                </p>
              )}

              <div className="co-actions">
                <button className="co-btn-back" onClick={() => setStep('cliente')}>
                  <ChevronLeft size={14} /> Voltar
                </button>
                <button className="co-btn-next" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <><div className="co-spinner" /> Processando…</>
                    : <>Confirmar pedido <ChevronRight size={16} /></>
                  }
                </button>
              </div>
            </>
          )}

          {/* ── ETAPA 3: Resultado ── */}
          {step === 'resultado' && result && (
            <>
              {/* PIX */}
              {result.billingType === 'PIX' && (
                <div className="co-pix-container">
                  <p className="co-section-title">Escaneie o QR Code para pagar</p>
                  {result.pixQrCodeBase64
                    ? <img
                        src={`data:image/png;base64,${result.pixQrCodeBase64}`}
                        alt="QR Code PIX"
                        className="co-pix-qr"
                      />
                    : <div className="co-pix-qr-ph"><Loader size={24} /></div>
                  }

                  {result.pixPayload && (
                    <>
                      <button className="co-pix-payload" onClick={copyPixPayload} title="Clique para copiar">
                        {result.pixPayload}
                      </button>
                      <p className="co-copy-hint">
                        {copied ? '✓ Copiado!' : 'Clique no código para copiar'}
                      </p>
                      <button
                        className="co-btn-next"
                        style={{ width: '100%' }}
                        onClick={copyPixPayload}
                      >
                        <Copy size={15} />
                        {copied ? 'Copiado!' : 'Copiar código PIX'}
                      </button>
                    </>
                  )}

                  {result.pixExpirationDate && (
                    <p style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                      Expira em: {new Date(result.pixExpirationDate).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              {/* Boleto */}
              {result.billingType === 'BOLETO' && (
                <div className="co-pix-container">
                  <p className="co-section-title">Boleto gerado — vence em 3 dias</p>

                  {result.boletoBarCode && (
                    <div
                      className="co-boleto-barcode"
                      onClick={() => navigator.clipboard.writeText(result.boletoBarCode!)}
                      title="Clique para copiar"
                    >
                      {result.boletoBarCode}
                    </div>
                  )}

                  <div className="co-boleto-actions">
                    {result.boletoUrl && (
                      <a
                        href={result.boletoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="co-boleto-link"
                      >
                        <ExternalLink size={15} />
                        Abrir boleto
                      </a>
                    )}
                    {result.boletoBarCode && (
                      <button
                        className="co-btn-back"
                        style={{ flex: 1 }}
                        onClick={() => navigator.clipboard.writeText(result.boletoBarCode!)}
                      >
                        <Copy size={14} /> Copiar código
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Cartão */}
              {result.billingType === 'CREDIT_CARD' && (
                <div className="co-card-success">
                  <div className="co-success-icon">
                    <CheckCircle size={32} />
                  </div>
                  <p className="co-success-title">Pagamento aprovado!</p>
                  <p className="co-success-desc">
                    Seu pedido #{result.vendaId} foi registrado com sucesso.
                    Nossa equipe entrará em contato para confirmar a entrega.
                  </p>
                  {result.invoiceUrl && (
                    <a
                      href={result.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="co-boleto-link"
                      style={{ marginTop: 8 }}
                    >
                      <ExternalLink size={15} />
                      Ver recibo
                    </a>
                  )}
                </div>
              )}

              <div className="co-info-box" style={{ marginTop: 8 }}>
                <div className="co-info-box-icon"><CheckCircle size={18} /></div>
                <p>
                  Pedido #{result.vendaId} registrado. Você receberá confirmação por e-mail
                  assim que o pagamento for processado.
                </p>
              </div>

              <button className="co-btn-next" onClick={onClose}>
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
