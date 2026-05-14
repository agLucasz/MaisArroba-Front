import React, { useState } from 'react';
import { Package, ShoppingCart, ChevronRight } from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import { RelatorioProdutosModal, RelatorioPedidosModal } from '../../../Components/Admin/RelatorioModal';
import '../../../Styles/Admin/relatorio.css';

type OpenModal = 'produtos' | 'pedidos' | null;

const Relatorio: React.FC = () => {
  const [open, setOpen] = useState<OpenModal>(null);

  return (
    <AdminLayout>
      <div className="rel-page">
        <h1 className="rel-page-title">Relatórios</h1>
        <p className="rel-page-sub">Selecione um relatório para visualizar e exportar em PDF.</p>

        <div className="rel-cards">
          <button className="rel-card" onClick={() => setOpen('produtos')}>
            <div className="rel-card-icon">
              <Package size={24} />
            </div>
            <div className="rel-card-body">
              <span className="rel-card-label">Relatório de Produtos</span>
              <span className="rel-card-desc">Catálogo completo com filtro por status</span>
            </div>
            <ChevronRight size={16} className="rel-card-arrow" />
          </button>

          <button className="rel-card" onClick={() => setOpen('pedidos')}>
            <div className="rel-card-icon">
              <ShoppingCart size={24} />
            </div>
            <div className="rel-card-body">
              <span className="rel-card-label">Relatório de Pedidos</span>
              <span className="rel-card-desc">Pedidos filtrados por período e status</span>
            </div>
            <ChevronRight size={16} className="rel-card-arrow" />
          </button>
        </div>
      </div>

      {open === 'produtos' && (
        <RelatorioProdutosModal onClose={() => setOpen(null)} />
      )}
      {open === 'pedidos' && (
        <RelatorioPedidosModal onClose={() => setOpen(null)} />
      )}
    </AdminLayout>
  );
};

export default Relatorio;
