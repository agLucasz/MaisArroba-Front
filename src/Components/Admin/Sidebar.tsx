import React from 'react';
import logo from '../../Assets/logo.png';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Tag,
  Folder,
  Package,
  BarChart2,
  Settings,
  LogOut,
  Users,
} from 'lucide-react';
import { clearSession } from '../../Services/authService';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Operacional',
    items: [
      { label: 'Dashboard',  to: '/dashboard',  icon: <LayoutDashboard size={17} /> },
      { label: 'Pedidos',    to: '/pedidos',    icon: <ShoppingCart size={17} />},
      { label: 'Pagamentos', to: '/pagamentos', icon: <CreditCard size={17} /> },
      { label: 'Clientes', to: '/clientes', icon: <Users size={17} />},
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { label: 'Produtos',    to: '/produtos',    icon: <Tag size={17} /> },
      { label: 'Categorias',  to: '/categorias',  icon: <Folder size={17} /> },
      { label: 'Estoque',     to: '/estoque',     icon: <Package size={17} /> },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Relatórios',    to: '/relatorios',    icon: <BarChart2 size={17} /> },
      { label: 'Configurações', to: '/configuracoes', icon: <Settings size={17} /> },
    ],
  },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <aside className="sidebar">

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-mark">
          <img src={logo} alt="Mais Arroba" />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">MaisArroba</span>
          <span className="sidebar-brand-role">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div className="sidebar-section" key={section.title}>
            <span className="sidebar-section-title">{section.title}</span>
            <ul className="sidebar-menu">
              {section.items.map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
                    }
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span className="sidebar-link-label">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="sidebar-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <span className="sidebar-user-email">admin</span>
        </div>
        <button
          className="sidebar-logout"
          onClick={handleLogout}
          title="Sair"
          aria-label="Sair da conta"
        >
          <LogOut size={15} />
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
