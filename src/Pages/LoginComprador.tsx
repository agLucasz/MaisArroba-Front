import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { compradorService } from '../Services/compradorService';
import { useComprador } from '../Contexts/CompradorContext';
import '../Styles/checkout.css';

const LoginComprador: React.FC = () => {
  const navigate      = useNavigate();
  const { login, isLoggedIn } = useComprador();

  const [email,    setEmail]    = useState('');
  const [senha,    setSenha]    = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => { document.title = 'Entrar — MaisArroba'; }, []);

  useEffect(() => {
    if (isLoggedIn) navigate('/minha-conta', { replace: true });
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await compradorService.login({ email, senha });
      await login(response.token);
      navigate('/minha-conta', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ck-page">
      <Header />

      <div className="ck-progress-bar">
        <div className="ck-progress-inner">
          <div className="ck-step ck-step--active">
            <div className="ck-step-num"><LogIn size={12} /></div>
            <span>Entrar na conta</span>
          </div>
        </div>
      </div>

      <div className="ck-main" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ck-form-col" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>

          <div className="ck-card">
            <div className="ck-card-header">
              <div className="ck-card-icon"><User size={20} /></div>
              <div>
                <h2 className="ck-card-title">Entrar na conta</h2>
                <p className="ck-card-subtitle">Use e-mail e senha cadastrados</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ck-fields">
                <div className="ck-field">
                  <label className="ck-label">E-mail<span>*</span></label>
                  <input
                    className="ck-input"
                    type="email"
                    placeholder="joao@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="ck-field">
                  <label className="ck-label">Senha<span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="ck-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      autoComplete="current-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      style={{
                        position: 'absolute', top: '50%', right: 14,
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex',
                      }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="ck-api-error" style={{ marginTop: 16 }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <div className="ck-actions" style={{ marginTop: 24 }}>
                <button className="ck-btn-submit" type="submit" disabled={loading}>
                  {loading
                    ? <><div className="ck-spinner" /> Entrando…</>
                    : <><LogIn size={16} /> Entrar</>
                  }
                </button>
              </div>
            </form>

            <div className="ck-divider" style={{ marginTop: 24, marginBottom: 20 }} />

            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--fg-3)' }}>
              Ainda não tem conta?{' '}
              <Link to="/cadastro" style={{ color: 'var(--sage-deep)', fontWeight: 700, textDecoration: 'none' }}>
                Criar conta grátis
              </Link>
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginComprador;
