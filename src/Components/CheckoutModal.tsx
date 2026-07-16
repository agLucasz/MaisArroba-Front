import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, ShieldCheck, Loader, QrCode, CreditCard } from 'lucide-react';
import { type CartItem } from '../Contexts/CartContext';
import { mercadoPagoService, type FormaPagamento } from '../Services/mercadoPagoService';
import MercadoPagoLogo from './MercadoPagoLogo';
import '../Styles/checkoutModal.css';

type Step = 'cliente' | 'revisao' | 'redirecionando';

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

const EMPTY_CLIENTE: ClienteForm = {
  nome: '', cpfCnpj: '', email: '', telefone: '',
  endereco: '', numero: '', bairro: '', cep: '', cidade: '', uf: ''
};

export const CheckoutModal: React.FC<Props> = ({ items, onClose, onSuccess }) => {
  const [step,       setStep]       = useState<Step>('cliente');
  const [cliente,    setCliente]    = useState<ClienteForm>(EMPTY_CLIENTE);
  const [forma,      setForma]      = useState<FormaPagamento>('AVISTA');
  const [errors,     setErrors]     = useState<Partial<ClienteForm>>({});
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);

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

  const totalValor = items.reduce(
    (s, i) => s + (forma === 'CARTAO' ? i.produto.valorVenda : i.produto.valorAVista) * i.qty, 0
  );
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

  // ── Ações ──────────────────────────────────────────────────────────────────

  const handleClienteNext = () => {
    if (validateCliente()) setStep('revisao');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await mercadoPagoService.checkout({
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
        formaPagamento: forma,
      });

      onSuccess?.(response.vendaId);
      setStep('redirecionando');
      window.location.href = response.redirectUrl;
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao processar pagamento.');
      setLoading(false);
    }
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepIndex = { cliente: 0, revisao: 1, redirecionando: 2 }[step];

  return (
    <div
      className="co-overlay"
      onClick={e => { if (e.target === e.currentTarget && step !== 'redirecionando') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar pedido"
    >
      <div className="co-dialog">

        {/* Header */}
        <div className="co-header">
          <div>
            <h2 className="co-title">
              {step === 'redirecionando' ? 'Redirecionando…' : 'Finalizar pedido'}
            </h2>
            <p className="co-subtitle">
              {items.length} {items.length === 1 ? 'produto' : 'produtos'} — {formatBRL(totalValor)}
            </p>
          </div>
          {step !== 'redirecionando' && (
            <button className="co-close" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Steps */}
        {step !== 'redirecionando' && (
          <div className="co-steps">
            {(['cliente', 'revisao'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`co-step${stepIndex === i ? ' co-step--active' : ''}${stepIndex > i ? ' co-step--done' : ''}`}>
                  <div className="co-step-dot">
                    {stepIndex > i ? '✓' : i + 1}
                  </div>
                  <span>{s === 'cliente' ? 'Seus dados' : 'Revisão'}</span>
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

          {/* ── ETAPA 2: Revisão — escolha do grupo de preço + método na página do Mercado Pago ── */}
          {step === 'revisao' && (
            <>
              <p className="co-section-title">Forma de pagamento</p>
              <div className="co-payment-methods">
                <button
                  className={`co-method-btn${forma === 'AVISTA' ? ' co-method-btn--active' : ''}`}
                  onClick={() => setForma('AVISTA')}
                >
                  <div className="co-method-icon"><QrCode size={20} /></div>
                  <span className="co-method-label">PIX ou Boleto</span>
                  <span className="co-method-desc">Preço à vista</span>
                </button>
                <button
                  className={`co-method-btn${forma === 'CARTAO' ? ' co-method-btn--active' : ''}`}
                  onClick={() => setForma('CARTAO')}
                >
                  <div className="co-method-icon"><CreditCard size={20} /></div>
                  <span className="co-method-label">Cartão de crédito</span>
                  <span className="co-method-desc">Parcelamento na página do Mercado Pago</span>
                </button>
              </div>

              <p className="co-section-title" style={{ marginTop: 4 }}>Resumo do pedido</p>
              <div className="co-fields">
                {items.map(i => (
                  <div key={i.produto.produtoId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span>{i.qty}x {i.produto.nomeProduto}</span>
                    <span>{formatBRL((forma === 'CARTAO' ? i.produto.valorVenda : i.produto.valorAVista) * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="co-info-box">
                <div className="co-info-box-icon"><CheckCircle size={18} /></div>
                <p>Você vai concluir o pagamento na página segura do Mercado Pago.</p>
              </div>

              {/* Selo de Segurança Mercado Pago */}
              <div className="co-security-badge">
                <ShieldCheck size={16} className="co-security-shield" />
                <div className="co-security-details">
                  <p className="co-security-text">
                    Pagamento 100% seguro processado pelo <strong>Mercado Pago</strong>. Seus dados financeiros estão totalmente protegidos.
                  </p>
                  <MercadoPagoLogo height={16} />
                </div>
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
                    : <>Ir para pagamento <ChevronRight size={16} /></>
                  }
                </button>
              </div>
            </>
          )}

          {/* ── ETAPA 3: Redirecionando pro Mercado Pago ── */}
          {step === 'redirecionando' && (
            <div className="co-pix-container">
              <Loader size={28} className="co-spinner" />
              <p className="co-section-title" style={{ marginTop: 12 }}>
                Te levando para a página segura do Mercado Pago…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
