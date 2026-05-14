import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, ShoppingCart, LayoutDashboard, X, Menu, User } from 'lucide-react';
import logo from '../Assets/logo.png';
import { useCart } from '../Contexts/CartContext';
import { useComprador } from '../Contexts/CompradorContext';
import '../Styles/header.css';

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { comprador, isLoggedIn } = useComprador();

  return (
    <header className="site-header">
      <div className="site-header-inner">

        {/* Logo */}
        <Link to="/" className="site-logo">
          <img src={logo} alt="MaisArroba Brasil" className="site-logo-img" />
        </Link>

        {/* Desktop nav */}
        <nav className="site-nav" aria-label="Navegação principal">
          <NavLink to="/"        className={({ isActive }) => 'site-nav-link' + (isActive ? ' site-nav-link--active' : '')}>Início</NavLink>
          <NavLink to="/loja"    className={({ isActive }) => 'site-nav-link' + (isActive ? ' site-nav-link--active' : '')}>Produtos</NavLink>
            <NavLink to="/contato" className={({ isActive }) => 'site-nav-link' + (isActive ? ' site-nav-link--active' : '')}>Contato</NavLink>
        </nav>

        {/* Actions */}
        <div className="site-header-actions">
          <button className="site-icon-btn" aria-label="Buscar">
            <Search size={17} />
          </button>
          <Link to="/carrinho" className="site-icon-btn site-cart-btn" aria-label="Carrinho" style={{ position: 'relative', textDecoration: 'none' }}>
            <ShoppingCart size={17} />
            {totalItems > 0 && (
              <span className="site-cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </Link>

          {/* Comprador: login / perfil */}
          {isLoggedIn ? (
            <Link to="/minha-conta" className="site-admin-link" title="Minha conta" style={{ maxWidth: 120 }}>
              <User size={15} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {comprador?.nome.split(' ')[0]}
              </span>
            </Link>
          ) : (
            <Link to="/login-comprador" className="site-admin-link" title="Entrar">
              <User size={15} />
              <span>Entrar</span>
            </Link>
          )}

          {/* Admin access */}
          <Link to="/login" className="site-admin-link" title="Área administrativa">
            <LayoutDashboard size={15} />
            <span>Admin</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="site-icon-btn site-menu-toggle"
            aria-label="Menu"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="site-nav-mobile" aria-label="Menu mobile">
          <NavLink to="/"        className="site-nav-mobile-link" onClick={() => setMobileOpen(false)}>Início</NavLink>
          <NavLink to="/loja"    className="site-nav-mobile-link" onClick={() => setMobileOpen(false)}>Produtos</NavLink>
          <NavLink to="/sobre"   className="site-nav-mobile-link" onClick={() => setMobileOpen(false)}>Sobre</NavLink>
          <NavLink to="/contato" className="site-nav-mobile-link" onClick={() => setMobileOpen(false)}>Contato</NavLink>
          <Link    to="/login"   className="site-nav-mobile-link site-nav-mobile-link--admin" onClick={() => setMobileOpen(false)}>
            <LayoutDashboard size={14} /> Área Admin
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
