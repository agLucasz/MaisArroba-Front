import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Lock, ChevronLeft, Eye, EyeOff, CheckCircle, AlertCircle,
  MapPin, Phone, FileText, Loader,
} from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { compradorService, type RegistroCompradorDTO } from '../Services/compradorService';
import { useComprador } from '../Contexts/CompradorContext';
import '../Styles/checkout.css';

interface Form extends RegistroCompradorDTO {
  confirmarSenha: string;
}

const EMPTY: Form = {
  nome: '', documento: '', email: '', senha: '', confirmarSenha: '',
  telefone: '', cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '',
};

type DocType = 'cpf' | 'cnpj';

const Cadastro: React.FC = () => {
  const navigate   = useNavigate();
  const { login }  = useComprador();

  const [form,       setForm]       = useState<Form>(EMPTY);
  const [docType,    setDocType]    = useState<DocType>('cpf');
  const [errors,     setErrors]     = useState<Partial<Record<keyof Form, string>>>({});
  const [loading,    setLoading]    = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjCheck,  setCnpjCheck]  = useState<{ ok: boolean; nome?: string } | null>(null);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [showPass,   setShowPass]   = useState(false);
  const [showPass2,  setShowPass2]  = useState(false);

  useEffect(() => { document.title = 'Criar conta — MaisArroba'; }, []);

  const set = (key: keyof Form, value: string) =>
    setForm(p => ({ ...p, [key]: value }));

  // ── CEP auto-preenchimento ─────────────────────────────────────────────────

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await compradorService.consultarCep(digits);
      if (data.erro) return;
      setForm(p => ({
        ...p,
        endereco: data.logradouro || '',
        bairro:   data.bairro     || '',
        cidade:   data.localidade || '',
        uf:       data.uf         || '',
      }));
    } catch { /* ignora erro silencioso no auto-fill */ }
    finally { setCepLoading(false); }
  };

  // ── CNPJ validação ─────────────────────────────────────────────────────────

  const handleCnpjBlur = async () => {
    if (docType !== 'cnpj') return;
    const digits = form.documento.replace(/\D/g, '');
    if (digits.length !== 14) return;
    setCnpjCheck(null);
    try {
      const data = await compradorService.consultarCnpj(digits);
      setCnpjCheck({ ok: true, nome: data.razao_social as string | undefined });
    } catch {
      setCnpjCheck({ ok: false });
    }
  };

  // ── Validação ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.nome.trim())      e.nome      = 'Nome obrigatório';
    if (!form.documento.trim()) e.documento = `${docType === 'cpf' ? 'CPF' : 'CNPJ'} obrigatório`;
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'E-mail inválido';
    if (!form.senha)            e.senha     = 'Senha obrigatória';
    if (form.senha !== form.confirmarSenha)
      e.confirmarSenha = 'As senhas não coincidem';
    if (docType === 'cnpj' && cnpjCheck?.ok === false)
      e.documento = 'CNPJ inválido ou não encontrado';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const { confirmarSenha: _, ...dto } = form;
      const response = await compradorService.registrar(dto);
      await login(response.token);
      navigate('/minha-conta', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  // ── Campo helper ───────────────────────────────────────────────────────────

  const field = (
    key: keyof Form, label: string, placeholder?: string,
    type = 'text', required = false,
    extra?: React.ReactNode,
  ) => (
    <div className="ck-field">
      <label className="ck-label">{label}{required && <span>*</span>}</label>
      <div style={{ position: 'relative' }}>
        <input
          className={`ck-input${errors[key] ? ' ck-input--error' : ''}`}
          type={type}
          placeholder={placeholder}
          value={form[key] as string}
          onChange={e => set(key, e.target.value)}
          onBlur={key === 'cep' ? handleCepBlur : key === 'documento' ? handleCnpjBlur : undefined}
          style={extra ? { paddingRight: 44 } : undefined}
        />
        {extra}
      </div>
      {errors[key] && <span className="ck-error"><AlertCircle size={12} />{errors[key]}</span>}
    </div>
  );

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)',
        display: 'flex', alignItems: 'center',
      }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="ck-page">
      <Header />

      {/* Barra de progresso faux — 1 etapa */}
      <div className="ck-progress-bar">
        <div className="ck-progress-inner">
          <div className="ck-step ck-step--active">
            <div className="ck-step-num">1</div>
            <span>Criar conta</span>
          </div>
        </div>
      </div>

      <div className="ck-main" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ck-form-col" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>

          {/* Tipo de documento */}
          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><User size={20} /></div>
              <div>
                <h2 className="ck-card-title">Dados pessoais</h2>
                <p className="ck-card-subtitle">Crie sua conta para comprar sem precisar digitar seus dados toda vez</p>
              </div>
            </div>

            {/* Tipo do documento */}
            <div className="ck-methods" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
              <button
                className={`ck-method${docType === 'cpf' ? ' ck-method--active' : ''}`}
                onClick={() => { setDocType('cpf'); set('documento', ''); setCnpjCheck(null); }}
              >
                <div className="ck-method-icon"><User size={18} /></div>
                <span className="ck-method-name">Pessoa Física</span>
                <span className="ck-method-desc">CPF</span>
              </button>
              <button
                className={`ck-method${docType === 'cnpj' ? ' ck-method--active' : ''}`}
                onClick={() => { setDocType('cnpj'); set('documento', ''); setCnpjCheck(null); }}
              >
                <div className="ck-method-icon"><FileText size={18} /></div>
                <span className="ck-method-name">Pessoa Jurídica</span>
                <span className="ck-method-desc">CNPJ</span>
              </button>
            </div>

            <div className="ck-fields ck-fields--2">
              {field('nome', 'Nome completo', 'João da Silva', 'text', true)}
              <div className="ck-field">
                <label className="ck-label">
                  {docType === 'cpf' ? 'CPF' : 'CNPJ'}<span>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`ck-input${errors.documento ? ' ck-input--error' : ''}`}
                    placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={form.documento}
                    onChange={e => { set('documento', e.target.value); setCnpjCheck(null); }}
                    onBlur={handleCnpjBlur}
                  />
                </div>
                {errors.documento && <span className="ck-error"><AlertCircle size={12} />{errors.documento}</span>}
                {docType === 'cnpj' && cnpjCheck?.ok === true && (
                  <span style={{ fontSize: 12, color: 'var(--sage-deep)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <CheckCircle size={12} /> {cnpjCheck.nome ?? 'CNPJ válido'}
                  </span>
                )}
                {docType === 'cnpj' && cnpjCheck?.ok === false && (
                  <span className="ck-error"><AlertCircle size={12} />CNPJ inválido ou não encontrado</span>
                )}
              </div>
              {field('email',    'E-mail',    'joao@email.com', 'email', true)}
              {field('telefone', 'Telefone',  '(11) 99999-9999', 'tel')}
            </div>
          </div>

          {/* Endereço */}
          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><MapPin size={20} /></div>
              <div>
                <h2 className="ck-card-title">Endereço</h2>
                <p className="ck-card-subtitle">Informe seu CEP — os campos serão preenchidos automaticamente</p>
              </div>
            </div>

            <div className="ck-fields ck-fields--2">
              <div className="ck-field">
                <label className="ck-label">CEP</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ck-input"
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={e => set('cep', e.target.value)}
                    onBlur={handleCepBlur}
                    style={{ paddingRight: cepLoading ? 40 : undefined }}
                  />
                  {cepLoading && (
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }}>
                      <Loader size={16} />
                    </span>
                  )}
                </div>
              </div>
              {field('uf',       'UF',     'SP')}
              {field('cidade',   'Cidade', 'São Paulo')}
              {field('bairro',   'Bairro', 'Centro')}
              {field('endereco', 'Rua',    'Rua das Flores')}
              {field('numero',   'Número', '123')}
            </div>
          </div>

          {/* Senha */}
          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><Lock size={20} /></div>
              <div>
                <h2 className="ck-card-title">Senha de acesso</h2>
                <p className="ck-card-subtitle">Mínimo 8 caracteres, com maiúsculas, números e símbolo</p>
              </div>
            </div>

            <div className="ck-fields">
              {field('senha',          'Senha',          '••••••••', showPass  ? 'text' : 'password', true, eyeBtn(showPass,  () => setShowPass(p  => !p)))}
              {field('confirmarSenha', 'Confirmar senha','••••••••', showPass2 ? 'text' : 'password', true, eyeBtn(showPass2, () => setShowPass2(p => !p)))}
            </div>

            <div className="ck-info" style={{ marginTop: 20 }}>
              <CheckCircle size={16} className="ck-info-icon" />
              <p>Seus dados ficam salvos para agilizar próximas compras. Você pode alterá-los a qualquer momento em <strong>Minha conta</strong>.</p>
            </div>

            {apiError && (
              <div className="ck-api-error" style={{ marginTop: 16 }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                {apiError}
              </div>
            )}

            <div className="ck-actions" style={{ marginTop: 24 }}>
              <Link to="/login-comprador" className="ck-btn-back" style={{ textDecoration: 'none' }}>
                <ChevronLeft size={15} /> Já tenho conta
              </Link>
              <button className="ck-btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? <><div className="ck-spinner" /> Criando conta…</>
                  : <><CheckCircle size={16} /> Criar conta</>
                }
              </button>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cadastro;
