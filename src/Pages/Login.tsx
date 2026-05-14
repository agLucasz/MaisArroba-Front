import React, { useState } from 'react';
import logo from '../Assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { login, saveSession } from '../Services/authService';
import '../Styles/auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, senha });
      saveSession(res.token, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">

      {/* ── Left Panel ── */}
      <div className="auth-left">

        {/* Logo */}
        <Link to="/" className="auth-logo">
          <div className="auth-logo-mark">
            <img src={logo} alt="Mais Arroba" />
          </div>
          <div className="auth-logo-text">
            <span className="auth-logo-name">Mais Arroba</span>
            <span className="auth-logo-role">Admin</span>
          </div>
        </Link>

        {/* Form area */}
        <div className="auth-form-wrap">
          <h1 className="auth-heading">Bem-vindo</h1>
          <p className="auth-subheading">Entre na sua conta para acessar o painel administrativo.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* E-mail */}
            <div className="form-field"> 
              <label className="form-label" htmlFor="email">E-mail</label>
              <div className="form-input-wrap">
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="form-field">
              <div className="form-field-header">
                <label className="form-label" htmlFor="senha">Senha</label>
              </div>
              <div className="form-input-wrap">
                <input
                  id="senha"
                  className="form-input has-action"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="form-input-action"
                  onClick={() => setShowSenha(v => !v)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="auth-error" role="alert">{error}</div>}

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar no painel →'}
            </button>

          </form>

          <div className="auth-divider" style={{ margin: '28px 0' }} />


        </div>

        {/* Footer */}
        <footer className="auth-footer">
          <span>Mais Arroba</span>
        </footer>

      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">

        <span className="auth-right-label">Painel Administrativo</span>

        <div className="auth-right-content">
          <h2 className="auth-right-headline">
            Suplementação Mineral<br />
            para <span>gado.</span>
          </h2>
          <p className="auth-right-desc">
            Gerencie produtos, pedidos e pagamentos em um só lugar.
          </p>
        </div>


      </div>

    </div>
  );
};

export default Login;
