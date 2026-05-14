import React, { useEffect, useRef, useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getProdutos, type ProdutoDTO } from '../../Services/produtoService';
import { getVendas, type VendaDTO, StatusVenda } from '../../Services/vendaService';
import '../../Styles/Admin/relatorio.css';

/* ── Helpers ── */

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

const STATUS_LABELS: Record<number, string> = {
  [StatusVenda.Aberto]:    'Aberto',
  [StatusVenda.Pendente]:  'Pendente',
  [StatusVenda.Pago]:      'Pago',
  [StatusVenda.Cancelado]: 'Cancelado',
};

/* ── Relatório de Produtos Modal ── */

interface RelatorioProdutosModalProps {
  onClose: () => void;
}

export const RelatorioProdutosModal: React.FC<RelatorioProdutosModalProps> = ({ onClose }) => {
  const [produtos, setProdutos] = useState<ProdutoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [generating, setGenerating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProdutos()
      .then(setProdutos)
      .finally(() => setLoading(false));
  }, []);

  const filtered = produtos.filter(p => {
    if (filtroStatus === 'ativos')   return p.ativo;
    if (filtroStatus === 'inativos') return !p.ativo;
    return true;
  });

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function gerarPDF() {
    setGenerating(true);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório de Produtos', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    const statusLabel = filtroStatus === 'todos' ? 'Todos' : filtroStatus === 'ativos' ? 'Ativos' : 'Inativos';
    doc.text(`Filtro: ${statusLabel}  |  Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 32,
      head: [['Produto', 'Embalagem', 'Qtd', 'Vl. Compra', 'Vl. Venda', 'Categorias', 'Status']],
      body: filtered.map(p => [
        p.nomeProduto,
        p.embalagem,
        p.quantidade,
        formatBRL(p.valorCompra),
        formatBRL(p.valorVenda),
        p.categorias.join(', ') || '—',
        p.ativo ? 'Ativo' : 'Inativo',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 85, 34] },
    });

    doc.save(`relatorio-produtos-${Date.now()}.pdf`);
    setGenerating(false);
  }

  return (
    <div className="modal-overlay rel-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-box rel-modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="rel-modal-title">
            <FileText size={18} />
            <span>Relatório de Produtos</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </header>

        <div className="rel-modal-body">
          <div className="rel-filter-row">
            <label className="rel-filter-label">Status</label>
            <div className="rel-radio-group">
              {(['todos', 'ativos', 'inativos'] as const).map(opt => (
                <label key={opt} className="rel-radio">
                  <input
                    type="radio"
                    name="filtroStatus"
                    value={opt}
                    checked={filtroStatus === opt}
                    onChange={() => setFiltroStatus(opt)}
                  />
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="rel-preview">
            {loading ? (
              <p className="rel-empty">Carregando…</p>
            ) : filtered.length === 0 ? (
              <p className="rel-empty">Nenhum produto encontrado.</p>
            ) : (
              <table className="rel-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Embalagem</th>
                    <th>Qtd</th>
                    <th>Vl. Venda</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.produtoId}>
                      <td>{p.nomeProduto}</td>
                      <td>{p.embalagem}</td>
                      <td>{p.quantidade}</td>
                      <td>{formatBRL(p.valorVenda)}</td>
                      <td>
                        <span className={`rel-badge ${p.ativo ? 'rel-badge--ativo' : 'rel-badge--inativo'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="rel-count">{filtered.length} produto(s)</p>
        </div>

        <footer className="rel-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="rel-btn-download"
            onClick={gerarPDF}
            disabled={generating || filtered.length === 0}
          >
            <Download size={14} />
            {generating ? 'Gerando…' : 'Baixar PDF'}
          </button>
        </footer>
      </div>
    </div>
  );
};

/* ── Relatório de Pedidos Modal ── */

interface RelatorioPedidosModalProps {
  onClose: () => void;
}

const ALL_STATUS = [StatusVenda.Aberto, StatusVenda.Pendente, StatusVenda.Pago, StatusVenda.Cancelado];

export const RelatorioPedidosModal: React.FC<RelatorioPedidosModalProps> = ({ onClose }) => {
  const [vendas, setVendas] = useState<VendaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [statusSel, setStatusSel] = useState<Set<number>>(new Set(ALL_STATUS));
  const [generating, setGenerating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getVendas()
      .then(setVendas)
      .finally(() => setLoading(false));
  }, []);

  function toggleStatus(s: number) {
    setStatusSel(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  const filtered = vendas.filter(v => {
    if (!statusSel.has(v.status)) return false;
    if (de && v.dataVenda && v.dataVenda < de) return false;
    if (ate && v.dataVenda && v.dataVenda > ate + 'T23:59:59') return false;
    return true;
  });

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function gerarPDF() {
    setGenerating(true);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório de Pedidos', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);

    const statusStr = ALL_STATUS.filter(s => statusSel.has(s)).map(s => STATUS_LABELS[s]).join(', ') || 'Nenhum';
    const periodoStr = de || ate
      ? `${de ? formatDate(de) : '—'} até ${ate ? formatDate(ate) : '—'}`
      : 'Todos os períodos';

    doc.text(`Período: ${periodoStr}  |  Status: ${statusStr}`, 14, 26);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);
    doc.setTextColor(0);

    const totalGeral = filtered.reduce((sum, v) => sum + v.valorVenda, 0);

    autoTable(doc, {
      startY: 38,
      head: [['Pedido', 'Data', 'Entrega', 'Valor', 'Status', 'Itens']],
      body: [
        ...filtered.map(v => [
          `#${v.vendaId}`,
          formatDate(v.dataVenda),
          formatDate(v.dataEntrega),
          formatBRL(v.valorVenda),
          STATUS_LABELS[v.status] ?? '—',
          v.itens.map(i => `${i.nomeProduto} x${i.quantidadeItem}`).join('; '),
        ]),
        ['', '', 'Total', formatBRL(totalGeral), '', ''],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 85, 34] },
      bodyStyles: {},
      didParseCell: (data) => {
        if (data.row.index === filtered.length && data.column.index === 2) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === filtered.length && data.column.index === 3) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    doc.save(`relatorio-pedidos-${Date.now()}.pdf`);
    setGenerating(false);
  }

  return (
    <div className="modal-overlay rel-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-box rel-modal rel-modal--lg" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="rel-modal-title">
            <FileText size={18} />
            <span>Relatório de Pedidos</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </header>

        <div className="rel-modal-body">
          <div className="rel-filters">
            <div className="rel-filter-row">
              <label className="rel-filter-label">Período</label>
              <div className="rel-date-range">
                <input
                  type="date"
                  className="rel-date-input"
                  value={de}
                  onChange={e => setDe(e.target.value)}
                  aria-label="De"
                />
                <span className="rel-date-sep">até</span>
                <input
                  type="date"
                  className="rel-date-input"
                  value={ate}
                  onChange={e => setAte(e.target.value)}
                  aria-label="Até"
                />
              </div>
            </div>

            <div className="rel-filter-row">
              <label className="rel-filter-label">Status</label>
              <div className="rel-check-group">
                {ALL_STATUS.map(s => (
                  <label key={s} className="rel-check">
                    <input
                      type="checkbox"
                      checked={statusSel.has(s)}
                      onChange={() => toggleStatus(s)}
                    />
                    {STATUS_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rel-preview">
            {loading ? (
              <p className="rel-empty">Carregando…</p>
            ) : filtered.length === 0 ? (
              <p className="rel-empty">Nenhum pedido encontrado.</p>
            ) : (
              <table className="rel-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Entrega</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.vendaId}>
                      <td>#{v.vendaId}</td>
                      <td>{formatDate(v.dataVenda)}</td>
                      <td>{formatDate(v.dataEntrega)}</td>
                      <td>{formatBRL(v.valorVenda)}</td>
                      <td>
                        <span className={`rel-badge rel-badge--${STATUS_LABELS[v.status]?.toLowerCase()}`}>
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="rel-table-total">
                    <td colSpan={3}>Total</td>
                    <td>{formatBRL(filtered.reduce((s, v) => s + v.valorVenda, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <p className="rel-count">{filtered.length} pedido(s)</p>
        </div>

        <footer className="rel-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="rel-btn-download"
            onClick={gerarPDF}
            disabled={generating || filtered.length === 0}
          >
            <Download size={14} />
            {generating ? 'Gerando…' : 'Baixar PDF'}
          </button>
        </footer>
      </div>
    </div>
  );
};
