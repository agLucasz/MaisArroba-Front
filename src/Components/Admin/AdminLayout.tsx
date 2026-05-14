import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import '../../Styles/Admin/admin.css';

const routeMeta: Record<string, { parent: string; label: string }> = {
  '/dashboard':    { parent: 'Operacional', label: 'Dashboard' },
  '/pedidos':      { parent: 'Operacional', label: 'Vendas' },
  '/pagamentos':   { parent: 'Operacional', label: 'Pagamentos' },
  '/clientes':     { parent: 'Operacional', label: 'Clientes' },
  '/produtos':     { parent: 'Catálogo',    label: 'Produtos' },
  '/categorias':   { parent: 'Catálogo',    label: 'Categorias' },
  '/estoque':      { parent: 'Catálogo',    label: 'Estoque' },
  '/relatorios':   { parent: 'Conta',       label: 'Relatórios' },
  '/configuracoes':{ parent: 'Conta',       label: 'Configurações' },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? { parent: '', label: '' };

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            {meta.parent && (
              <>
                <span className="admin-breadcrumb-parent">{meta.parent}</span>
                <span className="admin-breadcrumb-sep">·</span>
              </>
            )}
            <span className="admin-breadcrumb-current">{meta.label}</span>
          </div>

          <div className="admin-topbar-actions">
            <label className="admin-search">
              <Search size={14} className="admin-search-icon" />
              <input
                type="search"
                aria-label="Busca global"
              />
            </label>

            <button className="admin-topbar-btn" aria-label="Notificações">
              <Bell size={16} />
              <span className="admin-topbar-btn-dot" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          {children}
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
