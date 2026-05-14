import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Lock, LogOut, CheckCircle, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { compradorService, type RegistroCompradorDTO } from '../Services/compradorService';
import { useComprador } from '../Contexts/CompradorContext';
import '../Styles/checkout.css';

const MinhaContaComprador: React.FC = () => {
  const navigate = useNavigate();
  const { comprador, token, logout, isLoggedIn } = useComprador();

  const [nome,      setNome]      = useState('');
  const [telefone,  setTelefone]  = useState('');
  const [cep,       setCep]       = useState('');
  const [endereco,  setEndereco]  = useState('');
  const [numero,    setNumero]    = useState('');
  const [bairro,    setBairro]    = useState('');
  const [cidade,    setCidade]    = useState('');
  const [uf,        setUf]        = useState('');
  const [senha,     setSenha]     = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => { document.title = 'Minha conta — MaisArroba'; }, []);

  useEffect(() => {
    if (!isLoggedIn) navigate('/login-comprador', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!comprador) return;
    setNome(comprador.nome);
    setTelefone(comprador.telefone);
    setCep(comprador.cep);
    setEndereco(comprador.endereco);
    setNumero(comprador.numero);
    setBairro(comprador.bairro);
    setCidade(comprador.cidade);
    setUf(comprador.uf);
  }, [comprador]);

  const handleCepBlur = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await compradorService.consultarCep(digits);
      if (!data.erro) {
        setEndereco(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setUf(data.uf || '');
      }
    } catch { /* silencioso */ }
    finally { setCepLoading(false); }
  };

  const handleSave = async () => {
    if (!comprador || !token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const dto: RegistroCompradorDTO = {
        nome, documento: comprador.documento, email: comprador.email,
        senha: senha || 'NoChange@1',
        telefone, cep, endereco, numero, bairro, cidade, uf,
      };
      await compradorService.login({ email: comprador.email, senha: senha || '' });
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5233'}/api/comprador/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dto),
      });
      setSaved(true);
      setSenha('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (!comprador) return null;

  return (
    <div className="ck-page">
      <Header />

      <div className="ck-progress-bar">
        <div className="ck-progress-inner">
          <div className="ck-step ck-step--active">
            <div className="ck-step-num"><User size={12} /></div>
            <span>Minha conta</span>
          </div>
        </div>
      </div>

      <div className="ck-main" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ck-form-col" style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>

          {/* Perfil resumo */}
          <div className="ck-card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 32px' }}>
            <div className="ck-card-icon" style={{ width: 52, height: 52, borderRadius: '50%', fontSize: 20 }}>
              {comprador.nome.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
                {comprador.nome}
              </p>
              <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 2 }}>{comprador.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
                padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--fg-2)',
              }}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>

          {/* Dados pessoais */}
          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><User size={20} /></div>
              <div>
                <h2 className="ck-card-title">Dados pessoais</h2>
                <p className="ck-card-subtitle">{comprador.documento}</p>
              </div>
            </div>

            <div className="ck-fields ck-fields--2">
              <div className="ck-field">
                <label className="ck-label">Nome completo<span>*</span></label>
                <input className="ck-input" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="ck-field">
                <label className="ck-label">Telefone</label>
                <input className="ck-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><MapPin size={20} /></div>
              <div>
                <h2 className="ck-card-title">Endereço</h2>
                <p className="ck-card-subtitle">Digite o CEP para preencher automaticamente</p>
              </div>
            </div>

            <div className="ck-fields ck-fields--2">
              <div className="ck-field">
                <label className="ck-label">CEP</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ck-input"
                    placeholder="00000-000"
                    value={cep}
                    onChange={e => setCep(e.target.value)}
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
              <div className="ck-field">
                <label className="ck-label">UF</label>
                <input className="ck-input" placeholder="SP" value={uf} onChange={e => setUf(e.target.value)} />
              </div>
              <div className="ck-field">
                <label className="ck-label">Cidade</label>
                <input className="ck-input" placeholder="São Paulo" value={cidade} onChange={e => setCidade(e.target.value)} />
              </div>
              <div className="ck-field">
                <label className="ck-label">Bairro</label>
                <input className="ck-input" placeholder="Centro" value={bairro} onChange={e => setBairro(e.target.value)} />
              </div>
              <div className="ck-field">
                <label className="ck-label">Rua</label>
                <input className="ck-input" placeholder="Rua das Flores" value={endereco} onChange={e => setEndereco(e.target.value)} />
              </div>
              <div className="ck-field">
                <label className="ck-label">Número</label>
                <input className="ck-input" placeholder="123" value={numero} onChange={e => setNumero(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Alterar senha */}
          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><Lock size={20} /></div>
              <div>
                <h2 className="ck-card-title">Alterar senha</h2>
                <p className="ck-card-subtitle">Deixe em branco para manter a senha atual</p>
              </div>
            </div>

            <div className="ck-field">
              <label className="ck-label">Nova senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="ck-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="ck-api-error" style={{ marginTop: 16 }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {saved && (
              <div className="ck-info" style={{ marginTop: 16 }}>
                <CheckCircle size={16} className="ck-info-icon" />
                <p>Dados salvos com sucesso!</p>
              </div>
            )}

            <div className="ck-actions" style={{ marginTop: 24 }}>
              <Link to="/loja" className="ck-btn-back" style={{ textDecoration: 'none' }}>
                Ver produtos
              </Link>
              <button className="ck-btn-submit" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><div className="ck-spinner" /> Salvando…</>
                  : <><CheckCircle size={16} /> Salvar alterações</>
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

export default MinhaContaComprador;
