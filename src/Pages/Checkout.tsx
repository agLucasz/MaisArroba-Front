import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, CreditCard, CheckCircle, ChevronLeft, ChevronRight,
  Copy, ExternalLink, Loader, QrCode, FileText, AlertCircle,
  Truck, MapPin, Loader2, ShieldCheck, Lock,
} from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import MercadoPagoLogo from '../Components/MercadoPagoLogo';
import { useCart } from '../Contexts/CartContext';
import { useComprador } from '../Contexts/CompradorContext';
import { mercadoPagoService, type BillingType, type CheckoutResponse } from '../Services/mercadoPagoService';
import { createCardToken } from '../Services/mercadoPago';
import {
  buscarEnderecoPorCep,
  calcularFrete,
  type OpcaoFrete,
} from '../Services/freteService';
import '../Styles/checkout.css';

type Step = 'cliente' | 'pagamento' | 'resultado';

interface ClienteForm {
  nome: string; cpfCnpj: string; email: string; telefone: string;
  endereco: string; numero: string; bairro: string; cep: string;
  cidade: string; uf: string;
}

interface CardForm {
  holderName: string; number: string; expiryMonth: string;
  expiryYear: string; ccv: string; installmentCount: number;
}

const EMPTY_CLIENTE: ClienteForm = {
  nome: '', cpfCnpj: '', email: '', telefone: '',
  endereco: '', numero: '', bairro: '', cep: '', cidade: '', uf: '',
};

const EMPTY_CARD: CardForm = {
  holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '', installmentCount: 1,
};

const METHODS: { type: BillingType; label: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
  { type: 'PIX',         label: 'PIX',    desc: 'Aprovação imediata via QR Code', icon: <QrCode size={22} />,    badge: 'Instantâneo' },
  { type: 'BOLETO',      label: 'Boleto', desc: 'Vence em 3 dias úteis',           icon: <FileText size={22} />  },
  { type: 'CREDIT_CARD', label: 'Cartão', desc: 'Crédito em até 12×',              icon: <CreditCard size={22} /> },
];

// ── Taxas de cartão ──────────────────────────────────────────────────────────
// TODO: validar/atualizar com as taxas reais do Mercado Pago antes de produção.

// MDR (taxa de processamento do cartão)
function getMDR(parcelas: number): number {
  if (parcelas <= 1) return 0.0299;
  if (parcelas <= 6) return 0.0349;
  if (parcelas <= 12) return 0.0399;
  return 0.0429;
}

// Taxa mensal de antecipação automática
function getTaxaAntecipacaoMensal(parcelas: number): number {
  return parcelas <= 1 ? 0.0115 : 0.0160;
}

// Fator total de antecipação: cada parcela n vence em n meses
// soma(n=1..k) [rate × n] / valor_total = rate × (k+1)/2
function fatorAntecipacao(parcelas: number): number {
  return getTaxaAntecipacaoMensal(parcelas) * (parcelas + 1) / 2;
}

// Loja absorve 1x–3x (MDR + antecipação); cliente absorve 4x+ via gross-up
// fórmula: valorBase / (1 - MDR - fatorAntecipacao)
function calcTotalComTaxa(total: number, parcelas: number): number {
  if (parcelas <= 3) return total;
  const mdr = getMDR(parcelas);
  const ant = fatorAntecipacao(parcelas);
  return Math.round((total / (1 - mdr - ant)) * 100) / 100;
}

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'cliente',   label: 'Seus dados'  },
  { key: 'pagamento', label: 'Pagamento'   },
  { key: 'resultado', label: 'Confirmação' },
];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { comprador, isLoggedIn } = useComprador();

  const [step,     setStep]     = useState<Step>('cliente');
  const [billing,  setBilling]  = useState<BillingType>('PIX');
  const [cliente,  setCliente]  = useState<ClienteForm>(EMPTY_CLIENTE);
  const [card,     setCard]     = useState<CardForm>(EMPTY_CARD);
  const [errors,   setErrors]   = useState<Partial<ClienteForm & CardForm>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result,   setResult]   = useState<CheckoutResponse | null>(null);
  const [copied,   setCopied]   = useState(false);

  // Frete
  const [cepFretes,      setCepFretes]      = useState<OpcaoFrete[]>([]);
  const [freteSelected,  setFreteSelected]  = useState<OpcaoFrete | null>(null);
  const [freteGratis,    setFreteGratis]    = useState(false);
  const [loadingCep,     setLoadingCep]     = useState(false);
  const [cepErro,        setCepErro]        = useState<string | null>(null);
  const cepAbortRef = useRef<AbortController | null>(null);
  const cepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = 'Finalizar pedido — MaisArroba';
  }, []);

  useEffect(() => {
    if (items.length === 0 && step !== 'resultado') navigate('/carrinho', { replace: true });
  }, [items, step, navigate]);

  // Pré-preenche dados do comprador logado
  useEffect(() => {
    if (!comprador) return;
    setCliente({
      nome:      comprador.nome,
      cpfCnpj:   comprador.documento,
      email:     comprador.email,
      telefone:  comprador.telefone,
      cep:       comprador.cep,
      endereco:  comprador.endereco,
      numero:    comprador.numero,
      bairro:    comprador.bairro,
      cidade:    comprador.cidade,
      uf:        comprador.uf,
    });
  }, [comprador]);

  // CEP → auto-fill address + freight options
  useEffect(() => {
    if (cepTimerRef.current) clearTimeout(cepTimerRef.current);

    const cepLimpo = cliente.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setCepFretes([]);
      setFreteSelected(null);
      setCepErro(null);
      setFreteGratis(false);
      return;
    }

    cepTimerRef.current = setTimeout(async () => {
      cepAbortRef.current?.abort();
      cepAbortRef.current = new AbortController();
      const signal = cepAbortRef.current.signal;

      setLoadingCep(true);
      setCepErro(null);

      try {
        const end = await buscarEnderecoPorCep(cepLimpo, signal);
        setCliente(prev => ({
          ...prev,
          cidade:   end.cidade    || prev.cidade,
          uf:       end.uf        || prev.uf,
          bairro:   end.bairro    || prev.bairro,
          endereco: end.logradouro || prev.endereco,
        }));

        const firstProduto = items[0]?.produto;
        if (firstProduto) {
          if (firstProduto.freteHabilitado === false) {
            setFreteGratis(true);
            setCepFretes([]);
            setFreteSelected(null);
          } else {
            setFreteGratis(false);
            const resultado = await calcularFrete(cepLimpo, firstProduto.produtoId, signal);
            setCepFretes(resultado.fretes);
            setFreteSelected(resultado.fretes[0] ?? null);
          }
        }
      } catch (e: unknown) {
        if ((e as Error).name === 'AbortError') return;
        const msg = (e as Error).message ?? 'CEP não encontrado.';
        if (msg === 'Frete Grátis') {
          setFreteGratis(true);
          setCepFretes([]);
          setFreteSelected(null);
          setCepErro(null);
        } else {
          setCepErro(msg);
          setCepFretes([]);
          setFreteSelected(null);
          setFreteGratis(false);
        }
      } finally {
        setLoadingCep(false);
      }
    }, 600);

    return () => { if (cepTimerRef.current) clearTimeout(cepTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.cep]);

  // Cleanup on unmount
  useEffect(() => () => {
    cepAbortRef.current?.abort();
    if (cepTimerRef.current) clearTimeout(cepTimerRef.current);
  }, []);

  const totalCartao  = items.reduce((s, i) => s + i.produto.valorVenda * i.qty, 0);
  const totalAVista  = items.reduce((s, i) => s + i.produto.valorAVista * i.qty, 0);
  const valorEfetivo = billing === 'CREDIT_CARD'
    ? calcTotalComTaxa(totalCartao, card.installmentCount)
    : totalAVista;
  const formatBRL  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const stepIndex  = STEP_LABELS.findIndex(s => s.key === step);

  // ── Validação ────────────────────────────────────────────────

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
    if (!card.holderName.trim())              e.holderName  = 'Nome no cartão obrigatório';
    if (card.number.replace(/\s/g, '').length < 15) e.number = 'Número inválido';
    if (!card.expiryMonth)                    e.expiryMonth = 'Mês inválido';
    if (!card.expiryYear)                     e.expiryYear  = 'Ano inválido';
    if (card.ccv.length < 3)                  e.ccv         = 'CVV inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateCard()) return;
    setLoading(true);
    setApiError(null);
    try {
      let cartao;
      if (billing === 'CREDIT_CARD') {
        const token = await createCardToken({
          number:      card.number,
          holderName:  card.holderName,
          expiryMonth: card.expiryMonth,
          expiryYear:  card.expiryYear,
          ccv:         card.ccv,
          cpfCnpj:     cliente.cpfCnpj,
        });
        cartao = { token, installmentCount: card.installmentCount };
      }

      const response = await mercadoPagoService.checkout({
        itens: items.map(i => ({ produtoId: i.produto.produtoId, quantidade: i.qty })),
        cliente: {
          nome:     cliente.nome,
          cpfCnpj: cliente.cpfCnpj,
          email:    cliente.email   || undefined,
          telefone: cliente.telefone || undefined,
          endereco: cliente.endereco || undefined,
          numero:   cliente.numero  || undefined,
          bairro:   cliente.bairro  || undefined,
          cep:      cliente.cep     || undefined,
          cidade:   cliente.cidade  || undefined,
          uf:       cliente.uf      || undefined,
        },
        billingType: billing,
        cartao,
      });
      setResult(response);
      setStep('resultado');
      clearCart();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Campo helpers ────────────────────────────────────────────

  const clienteField = (
    key: keyof ClienteForm, label: string, placeholder?: string,
    type = 'text', required = false,
  ) => (
    <div className="ck-field">
      <label className="ck-label">
        {label}{required && <span>*</span>}
      </label>
      <input
        className={`ck-input${errors[key] ? ' ck-input--error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={cliente[key]}
        onChange={e => setCliente(p => ({ ...p, [key]: e.target.value }))}
      />
      {errors[key] && <span className="ck-error">{errors[key]}</span>}
    </div>
  );

  const cardField = (
    key: keyof CardForm, label: string, placeholder?: string,
    type = 'text', maxLen?: number,
  ) => (
    <div className="ck-field">
      <label className="ck-label">{label}<span>*</span></label>
      <input
        className={`ck-input${errors[key] ? ' ck-input--error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={card[key] as string}
        maxLength={maxLen}
        onChange={e => setCard(p => ({ ...p, [key]: e.target.value }))}
      />
      {errors[key] && <span className="ck-error">{String(errors[key])}</span>}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="ck-page">
      <Header />

      {/* Barra de progresso */}
      <div className="ck-progress-bar">
        <div className="ck-progress-inner">
          {STEP_LABELS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={`ck-step${stepIndex === i ? ' ck-step--active' : ''}${stepIndex > i ? ' ck-step--done' : ''}`}>
                <div className="ck-step-num">
                  {stepIndex > i ? <CheckCircle size={13} /> : i + 1}
                </div>
                <span>{s.label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`ck-step-connector${stepIndex > i ? ' ck-step-connector--done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══ RESULTADO — layout centralizado ══ */}
      {step === 'resultado' && result && (
        <div className="ck-result">

          {/* Hero */}
          <div className="ck-result-hero">
            <div className="ck-result-check">
              <CheckCircle size={36} strokeWidth={1.8} />
            </div>
            <h1 className="ck-result-title">
              {result.billingType === 'CREDIT_CARD' ? 'Pagamento aprovado!' : 'Pedido realizado!'}
            </h1>
            <span className="ck-result-order">Pedido #{result.vendaId}</span>
            <p className="ck-result-desc">
              {result.billingType === 'CREDIT_CARD'
                ? 'Seu pagamento foi processado com sucesso. Nossa equipe entrará em contato para confirmar a entrega.'
                : 'Seu pedido foi registrado. Complete o pagamento abaixo para confirmar.'
              }
            </p>
            {result.invoiceUrl && (
              <a href={result.invoiceUrl} target="_blank" rel="noopener noreferrer" className="ck-btn-boleto-primary" style={{ marginTop: 4 }}>
                <ExternalLink size={15} /> Ver recibo
              </a>
            )}
          </div>

          {/* PIX */}
          {result.billingType === 'PIX' && (
            <div className="ck-pix-box">
              <p className="ck-pix-title">Escaneie o QR Code para pagar</p>
              {result.pixQrCodeBase64
                ? <img src={`data:image/png;base64,${result.pixQrCodeBase64}`} alt="QR Code PIX" className="ck-pix-qr" />
                : <div className="ck-pix-qr-ph"><Loader size={28} /></div>
              }
              {result.pixPayload && (
                <>
                  <div className="ck-pix-payload-wrap">
                    <textarea className="ck-pix-payload" rows={3} readOnly value={result.pixPayload} />
                    <button className="ck-pix-copy-btn" onClick={() => copyText(result.pixPayload!)} title="Copiar">
                      <Copy size={14} />
                    </button>
                  </div>
                  <button className="ck-btn-copy-full" onClick={() => copyText(result.pixPayload!)}>
                    <Copy size={15} />
                    {copied ? 'Copiado!' : 'Copiar código PIX'}
                  </button>
                </>
              )}
              {result.pixExpirationDate && (
                <p className="ck-pix-exp">
                  Expira em: {new Date(result.pixExpirationDate).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Boleto */}
          {result.billingType === 'BOLETO' && (
            <div className="ck-boleto-box">
              <p className="ck-boleto-title">Boleto gerado — vence em 3 dias úteis</p>
              {result.boletoBarCode && (
                <div className="ck-boleto-barcode" onClick={() => copyText(result.boletoBarCode!)} title="Clique para copiar">
                  {result.boletoBarCode}
                </div>
              )}
              <div className="ck-boleto-row">
                {result.boletoUrl && (
                  <a href={result.boletoUrl} target="_blank" rel="noopener noreferrer" className="ck-btn-boleto-primary">
                    <ExternalLink size={15} /> Abrir boleto
                  </a>
                )}
                {result.boletoBarCode && (
                  <button className="ck-btn-boleto-secondary" onClick={() => copyText(result.boletoBarCode!)}>
                    <Copy size={14} /> Copiar código
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ações pós-resultado */}
          <div className="ck-result-actions">
            <Link to="/" className="ck-btn-home">
              <ChevronLeft size={15} /> Início
            </Link>
            <Link to="/loja" className="ck-btn-shop">
              Continuar comprando
            </Link>
          </div>
        </div>
      )}

      {/* ══ FORMULÁRIO — layout 2 colunas ══ */}
      {step !== 'resultado' && (
        <div className="ck-main">

          {/* Coluna esquerda — formulário */}
          <div className="ck-form-col">

            {/* ── ETAPA 1: Dados do cliente ── */}
            {step === 'cliente' && (
              <div className="ck-card">
                <div className="ck-card-header">
                  <div className="ck-card-icon"><User size={20} /></div>
                  <div>
                    <h2 className="ck-card-title">Identificação</h2>
                    <p className="ck-card-subtitle">Informe seus dados para o pedido</p>
                  </div>
                </div>

                {isLoggedIn ? (
                  <div className="ck-info" style={{ marginBottom: 24 }}>
                    <CheckCircle size={16} className="ck-info-icon" />
                    <p>
                      Logado como <strong>{comprador?.nome}</strong>. Seus dados foram preenchidos automaticamente.{' '}
                      <Link to="/minha-conta" style={{ color: 'var(--sage-deep)', fontWeight: 700, textDecoration: 'none' }}>
                        Editar perfil
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="ck-info" style={{ marginBottom: 24 }}>
                    <User size={16} className="ck-info-icon" />
                    <p>
                      Tem conta?{' '}
                      <Link to="/login-comprador" style={{ color: 'var(--sage-deep)', fontWeight: 700, textDecoration: 'none' }}>
                        Entre para preencher seus dados automaticamente
                      </Link>
                    </p>
                  </div>
                )}

                <div className="ck-fields ck-fields--2">
                  {clienteField('nome',     'Nome completo',  'João da Silva',      'text', true)}
                  {clienteField('cpfCnpj',  'CPF / CNPJ',     '000.000.000-00',     'text', true)}
                  {clienteField('email',    'E-mail',         'joao@email.com',     'email')}
                  {clienteField('telefone', 'Telefone',       '(11) 99999-9999',    'tel')}
                </div>

                <div className="ck-divider" style={{ marginTop: 24, marginBottom: 20 }} />

                <h3 className="ck-label" style={{ marginBottom: 16 }}>Endereço <span style={{ color: 'var(--fg-3)', textTransform: 'none', fontWeight: 500 }}>(opcional)</span></h3>
                <div className="ck-fields ck-fields--2">
                  {clienteField('cep',      'CEP',    '00000-000')}
                  {clienteField('uf',       'UF',     'SP')}
                  {clienteField('cidade',   'Cidade', 'São Paulo')}
                  {clienteField('bairro',   'Bairro', 'Centro')}
                  {clienteField('endereco', 'Rua',    'Rua das Flores')}
                  {clienteField('numero',   'Número', '123')}
                </div>

                {/* Frete */}
                {(loadingCep || cepFretes.length > 0 || cepErro || freteGratis) && (
                  <div className="ck-frete">
                    <div className="ck-frete-header">
                      <Truck size={15} />
                      <span>{freteGratis ? 'Frete' : 'Frete estimado'}</span>
                      {loadingCep && <Loader2 size={14} className="ck-frete-spinner" />}
                    </div>

                    {cepErro && (
                      <p className="ck-frete-error">{cepErro}</p>
                    )}

                    {freteGratis && (
                      <div className="ck-frete-gratis">
                        <div className="ck-frete-gratis-icon">
                          <Truck size={18} />
                        </div>
                        <div className="ck-frete-gratis-info">
                          <span className="ck-frete-gratis-titulo">Frete Grátis</span>
                          <span className="ck-frete-gratis-sub">Entrega sem custo adicional</span>
                        </div>
                        <span className="ck-frete-gratis-valor">R$ 0,00</span>
                      </div>
                    )}

                    {cepFretes.length > 0 && (
                      <div className="ck-frete-opcoes">
                        {cepFretes.map((f, i) => (
                          <label
                            key={i}
                            className={`ck-frete-opcao${freteSelected === f ? ' ck-frete-opcao--active' : ''}`}
                          >
                            <input
                              type="radio"
                              name="ck-frete"
                              checked={freteSelected === f}
                              onChange={() => setFreteSelected(f)}
                            />
                            <div className="ck-frete-opcao-info">
                              <span className="ck-frete-opcao-nome">
                                {f.transportadora} — {f.servico}
                              </span>
                              <span className="ck-frete-opcao-prazo">
                                {f.prazo} dia{f.prazo !== 1 ? 's' : ''} úteis
                              </span>
                            </div>
                            <span className="ck-frete-opcao-valor">
                              {f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="ck-actions" style={{ marginTop: 28 }}>
                  <button className="ck-btn-back" onClick={() => navigate('/carrinho')}>
                    <ChevronLeft size={15} /> Carrinho
                  </button>
                  <button className="ck-btn-submit" onClick={() => { if (validateCliente()) setStep('pagamento'); }}>
                    Continuar <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── ETAPA 2: Pagamento ── */}
            {step === 'pagamento' && (
              <div className="ck-card">
                <div className="ck-card-header">
                  <div className="ck-card-icon"><CreditCard size={20} /></div>
                  <div>
                    <h2 className="ck-card-title">Forma de pagamento</h2>
                    <p className="ck-card-subtitle">Escolha como deseja pagar</p>
                  </div>
                </div>

                <div className="ck-methods">
                  {METHODS.map(m => (
                    <button
                      key={m.type}
                      className={`ck-method${billing === m.type ? ' ck-method--active' : ''}`}
                      onClick={() => setBilling(m.type)}
                    >
                      {m.badge && <span className="ck-method-badge">{m.badge}</span>}
                      <div className="ck-method-icon">{m.icon}</div>
                      <span className="ck-method-name">{m.label}</span>
                      <span className="ck-method-desc">{m.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Campos do cartão */}
                {billing === 'CREDIT_CARD' && (
                  <>
                    <div className="ck-divider" style={{ marginTop: 24, marginBottom: 20 }} />
                    <h3 className="ck-label" style={{ marginBottom: 16 }}>Dados do cartão</h3>
                    <div className="ck-fields">
                      {cardField('holderName', 'Nome no cartão', 'JOÃO DA SILVA')}
                      {cardField('number',     'Número',         '0000 0000 0000 0000', 'text', 19)}
                    </div>
                    <div className="ck-fields ck-fields--1-1-2" style={{ marginTop: 16 }}>
                      {cardField('expiryMonth', 'Mês', '12')}
                      {cardField('expiryYear',  'Ano', '2030')}
                      {cardField('ccv',         'CVV', '123', 'text', 4)}
                    </div>
                    <div className="ck-field" style={{ marginTop: 16 }}>
                      <label className="ck-label">Parcelas</label>
                      <select
                        className="ck-input"
                        value={card.installmentCount}
                        onChange={e => setCard(p => ({ ...p, installmentCount: Number(e.target.value) }))}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                          const totalN   = calcTotalComTaxa(totalCartao, n);
                          const parcela  = formatBRL(totalN / n);
                          const temJuros = n > 3;
                          return (
                            <option key={n} value={n}>
                              {n}x de {parcela}{temJuros ? ` (total ${formatBRL(totalN)})` : ' • sem juros'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </>
                )}

                {apiError && (
                  <div className="ck-api-error" style={{ marginTop: 16 }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    {apiError}
                  </div>
                )}

                {/* Garantia do Mercado Pago inline */}
                <div className="ck-security-inline" style={{ marginTop: 16 }}>
                  <ShieldCheck size={16} className="ck-security-inline-icon" />
                  <span>Pagamento processado de forma segura via <strong>Mercado Pago</strong>. Criptografia SSL ativa.</span>
                </div>

                <div className="ck-actions" style={{ marginTop: 24 }}>
                  <button className="ck-btn-back" onClick={() => setStep('cliente')}>
                    <ChevronLeft size={15} /> Voltar
                  </button>
                  <button className="ck-btn-submit" onClick={handleSubmit} disabled={loading}>
                    {loading
                      ? <><div className="ck-spinner" /> Processando…</>
                      : <>Confirmar pedido <ChevronRight size={16} /></>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna direita — resumo */}
          <aside className="ck-summary-col">
            <div className="ck-summary-card">
              <div className="ck-summary-head">
                <span className="ck-summary-head-title">Resumo do pedido</span>
                <span className="ck-summary-count">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
              </div>

              <div className="ck-summary-items">
                {items.map(({ produto, qty }) => {
                  const img = produto.imagemUrls?.[0];
                  return (
                    <div key={produto.produtoId} className="ck-summary-item">
                      {img
                        ? <img src={img} alt={produto.nomeProduto} className="ck-summary-img" />
                        : <div className="ck-summary-img-ph" />
                      }
                      <div>
                        <p className="ck-summary-name">{produto.nomeProduto}</p>
                        {produto.embalagem && (
                          <p className="ck-summary-meta">{produto.embalagem}</p>
                        )}
                      </div>
                      <span className="ck-summary-qty">× {qty}</span>
                    </div>
                  );
                })}
              </div>

              <div className="ck-summary-foot">
                {items.map(({ produto, qty }) => (
                  <div key={produto.produtoId} className="ck-summary-row">
                    <span className="ck-summary-row-label">
                      {produto.nomeProduto} <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>× {qty}</span>
                    </span>
                    <span className="ck-summary-row-val">{formatBRL((billing === 'CREDIT_CARD' ? produto.valorVenda : produto.valorAVista) * qty)}</span>
                  </div>
                ))}
                {freteSelected && (
                  <div className="ck-summary-row">
                    <span className="ck-summary-row-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Truck size={12} style={{ color: 'var(--sage-deep)', flexShrink: 0 }} />
                      {freteSelected.servico}
                    </span>
                    <span className="ck-summary-row-val">{formatBRL(freteSelected.valor)}</span>
                  </div>
                )}
                {freteGratis && (
                  <div className="ck-summary-row ck-summary-row--gratis">
                    <span className="ck-summary-row-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Truck size={12} style={{ flexShrink: 0 }} />
                      Frete Grátis
                    </span>
                    <span className="ck-summary-row-val">R$ 0,00</span>
                  </div>
                )}
                <div className="ck-summary-total">
                  <span className="ck-summary-total-label">Total</span>
                  <span className="ck-summary-total-val">
                    {formatBRL(valorEfetivo + (freteSelected?.valor ?? 0))}
                  </span>
                </div>
                {billing === 'CREDIT_CARD' && card.installmentCount > 3 && (
                  <p className="ck-summary-fee-note">
                    Inclui MDR + antecipação ({((getMDR(card.installmentCount) + fatorAntecipacao(card.installmentCount)) * 100).toFixed(2).replace('.', ',')}%)
                  </p>
                )}
              </div>
            </div>

            {/* Selo de Segurança Mercado Pago */}
            <div className="ck-security-card">
              <div className="ck-security-header">
                <ShieldCheck size={20} className="ck-security-shield-icon" />
                <div>
                  <h4 className="ck-security-title">Compra 100% Segura</h4>
                  <p className="ck-security-subtitle">Sua segurança é nossa prioridade</p>
                </div>
              </div>
              
              <div className="ck-security-divider" />
              
              <div className="ck-security-mp-info">
                <span className="ck-security-mp-label">Processado por:</span>
                <div className="ck-security-mp-logo-wrapper">
                  <MercadoPagoLogo height={18} />
                </div>
              </div>
              
              <p className="ck-security-text">
                Todos os pagamentos são processados de forma segura através do <strong>Mercado Pago</strong>. Criptografia SSL avançada protege suas informações financeiras de ponta a ponta.
              </p>
              
              <div className="ck-security-features">
                <div className="ck-security-feature">
                  <Lock size={13} />
                  <span>Dados do cartão não são salvos no site</span>
                </div>
                <div className="ck-security-feature">
                  <CheckCircle size={13} />
                  <span>Compra garantida ou seu dinheiro de volta</span>
                </div>
              </div>
            </div>

          </aside>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Checkout;
