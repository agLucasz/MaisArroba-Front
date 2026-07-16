import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, CheckCircle, ChevronLeft, ChevronRight,
  Loader, AlertCircle, QrCode, CreditCard,
  Truck, Loader2, ShieldCheck, Lock,
} from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import MercadoPagoLogo from '../Components/MercadoPagoLogo';
import { useCart } from '../Contexts/CartContext';
import { useComprador } from '../Contexts/CompradorContext';
import { mercadoPagoService, type FormaPagamento } from '../Services/mercadoPagoService';
import {
  buscarEnderecoPorCep,
  calcularFrete,
  type OpcaoFrete,
} from '../Services/freteService';
import '../Styles/checkout.css';

type Step = 'cliente' | 'revisao' | 'redirecionando';

interface ClienteForm {
  nome: string; cpfCnpj: string; email: string; telefone: string;
  endereco: string; numero: string; bairro: string; cep: string;
  cidade: string; uf: string;
}

const EMPTY_CLIENTE: ClienteForm = {
  nome: '', cpfCnpj: '', email: '', telefone: '',
  endereco: '', numero: '', bairro: '', cep: '', cidade: '', uf: '',
};

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'cliente',        label: 'Seus dados' },
  { key: 'revisao',        label: 'Revisão'     },
  { key: 'redirecionando', label: 'Pagamento'   },
];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { comprador, isLoggedIn } = useComprador();

  const [step,     setStep]     = useState<Step>('cliente');
  const [cliente,  setCliente]  = useState<ClienteForm>(EMPTY_CLIENTE);
  const [forma,    setForma]    = useState<FormaPagamento>('AVISTA');
  const [errors,   setErrors]   = useState<Partial<ClienteForm>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
    if (items.length === 0 && step !== 'redirecionando') navigate('/carrinho', { replace: true });
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

  const totalEfetivo = items.reduce(
    (s, i) => s + (forma === 'CARTAO' ? i.produto.valorVenda : i.produto.valorAVista) * i.qty, 0
  );
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

  // ── Submit ───────────────────────────────────────────────────

  const handleSubmit = async () => {
    setLoading(true);
    setApiError(null);
    try {
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
        formaPagamento: forma,
      });
      clearCart();
      setStep('redirecionando');
      window.location.href = response.redirectUrl;
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao processar pagamento.');
      setLoading(false);
    }
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

      {/* ══ REDIRECIONANDO ══ */}
      {step === 'redirecionando' && (
        <div className="ck-result">
          <div className="ck-result-hero">
            <div className="ck-result-check">
              <Loader size={36} strokeWidth={1.8} />
            </div>
            <h1 className="ck-result-title">Te levando para o Mercado Pago…</h1>
            <p className="ck-result-desc">
              Você vai concluir o pagamento na página segura do Mercado Pago.
            </p>
          </div>
        </div>
      )}

      {/* ══ FORMULÁRIO — layout 2 colunas ══ */}
      {step !== 'redirecionando' && (
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
                  <button className="ck-btn-submit" onClick={() => { if (validateCliente()) setStep('revisao'); }}>
                    Continuar <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── ETAPA 2: Revisão — escolha do grupo de preço + método na página do Mercado Pago ── */}
            {step === 'revisao' && (
              <div className="ck-card">
                <div className="ck-card-header">
                  <div className="ck-card-icon"><ShieldCheck size={20} /></div>
                  <div>
                    <h2 className="ck-card-title">Forma de pagamento</h2>
                    <p className="ck-card-subtitle">Escolha o preço antes de ir para o Mercado Pago</p>
                  </div>
                </div>

                <div className="ck-methods">
                  <button
                    className={`ck-method${forma === 'AVISTA' ? ' ck-method--active' : ''}`}
                    onClick={() => setForma('AVISTA')}
                  >
                    <span className="ck-method-badge">Preço à vista</span>
                    <div className="ck-method-icon"><QrCode size={22} /></div>
                    <span className="ck-method-name">PIX ou Boleto</span>
                    <span className="ck-method-desc">Aprovação imediata via QR Code ou vencimento em 3 dias</span>
                  </button>
                  <button
                    className={`ck-method${forma === 'CARTAO' ? ' ck-method--active' : ''}`}
                    onClick={() => setForma('CARTAO')}
                  >
                    <div className="ck-method-icon"><CreditCard size={22} /></div>
                    <span className="ck-method-name">Cartão de crédito</span>
                    <span className="ck-method-desc">Escolha o parcelamento na página do Mercado Pago</span>
                  </button>
                </div>

                <div className="ck-info" style={{ marginTop: 16, marginBottom: 8 }}>
                  <CheckCircle size={16} className="ck-info-icon" />
                  <p>Você vai concluir o pagamento na página segura do Mercado Pago.</p>
                </div>

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
                      : <>Ir para pagamento <ChevronRight size={16} /></>
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
                    <span className="ck-summary-row-val">{formatBRL((forma === 'CARTAO' ? produto.valorVenda : produto.valorAVista) * qty)}</span>
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
                    {formatBRL(totalEfetivo + (freteSelected?.valor ?? 0))}
                  </span>
                </div>
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
