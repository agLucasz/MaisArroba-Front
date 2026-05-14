import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Boxes, Plus, Trash2, Search, X, Eye } from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import {
  type EntradaEstoqueDTO,
  getEntradasEstoque,
  createEntradaEstoque,
  deleteEntradaEstoque,
} from '../../../Services/estoqueService';
import { getProdutos, type ProdutoDTO } from '../../../Services/produtoService';
import '../../../Styles/Admin/estoque.css';

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

/* ── Product Picker Modal ── */

interface ProductPickerProps {
  produtos: ProdutoDTO[];
  onSelect: (produto: ProdutoDTO) => void;
  onClose: () => void;
}

const ProductPickerModal: React.FC<ProductPickerProps> = ({ produtos, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = produtos.filter(p =>
    p.nomeProduto.toLowerCase().includes(search.toLowerCase()) ||
    p.embalagem.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="modal-overlay est-picker-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="est-picker-title">
        <div className="modal-header">
          <div>
            <p className="modal-title" id="est-picker-title">Selecionar produto</p>
            <p className="modal-subtitle">Clique no produto para selecionar.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="est-picker-search">
          <Search size={14} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="est-picker-list">
          {filtered.length === 0 && (
            <p className="est-picker-empty">Nenhum produto encontrado.</p>
          )}
          {filtered.map(p => (
            <button
              key={p.produtoId}
              className="est-picker-item"
              onClick={() => onSelect(p)}
            >
              <div className="est-picker-item-info">
                <span className="est-picker-item-name">{p.nomeProduto}</span>
                {p.embalagem && <span className="est-picker-item-emb">{p.embalagem}</span>}
              </div>
              <span className="est-picker-item-stock">{p.quantidade} un em estoque</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Nova Entrada Modal ── */

interface NovaEntradaModalProps {
  produtos: ProdutoDTO[];
  onClose: () => void;
  onCreated: () => void;
}

const NovaEntradaModal: React.FC<NovaEntradaModalProps> = ({ produtos, onClose, onCreated }) => {
  const [produto, setProduto]       = useState<ProdutoDTO | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [data, setData]             = useState(new Date().toISOString().slice(0, 10));
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const produtoInputRef             = useRef<HTMLInputElement>(null);

  const handleSelectProduct = (p: ProdutoDTO) => {
    setProduto(p);
    setShowPicker(false);
    setTimeout(() => produtoInputRef.current?.blur(), 50);
  };

  const handleProdutoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); setShowPicker(true); }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!produto)              { setError('Selecione um produto.'); return; }
    const qty = Number(quantidade);
    if (!qty || qty <= 0)      { setError('Informe uma quantidade válida.'); return; }
    setError('');
    setLoading(true);
    try {
      await createEntradaEstoque({
        produtoId: produto.produtoId,
        quantidadeEntrada: qty,
        dataEntrada: data,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar entrada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="modal-overlay"
        onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="est-modal-title">

          <div className="modal-header">
            <div>
              <p className="modal-title" id="est-modal-title">Nova entrada de estoque</p>
              <p className="modal-subtitle">Registre a entrada de produtos no estoque.</p>
            </div>
            <button className="modal-close" onClick={onClose} disabled={loading} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              {/* Campo produto — Enter abre picker */}
              <div className="form-field">
                <label className="form-label" htmlFor="est-produto">Produto</label>
                <div
                  className="est-produto-trigger"
                  onClick={() => !loading && setShowPicker(true)}
                >
                  <Search size={14} className="est-produto-trigger-icon" />
                  <input
                    ref={produtoInputRef}
                    id="est-produto"
                    type="text"
                    readOnly
                    placeholder="Pressione Enter ou clique para buscar..."
                    value={produto ? `${produto.nomeProduto}${produto.embalagem ? ` · ${produto.embalagem}` : ''}` : ''}
                    onKeyDown={handleProdutoKeyDown}
                    className={produto ? 'est-produto-selected' : ''}
                  />
                  {produto && (
                    <button
                      type="button"
                      className="est-produto-clear"
                      onClick={e => { e.stopPropagation(); setProduto(null); }}
                      aria-label="Limpar produto"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {produto && (
                  <p className="est-produto-hint">
                    Estoque atual: <strong>{produto.quantidade} un</strong>
                  </p>
                )}
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label className="form-label" htmlFor="est-qty">Quantidade</label>
                  <input
                    id="est-qty"
                    className="form-input"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="0"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="est-data">Data de entrada</label>
                  <input
                    id="est-data"
                    className="form-input"
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="modal-error" role="alert">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary-sm" disabled={loading}>
                {loading ? 'Salvando…' : 'Registrar entrada'}
              </button>
            </div>
          </form>

        </div>
      </div>

      {showPicker && (
        <ProductPickerModal
          produtos={produtos}
          onSelect={handleSelectProduct}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};

/* ── Visualizar Entrada Modal ── */

const VisualizarEntradaModal: React.FC<{ entrada: EntradaEstoqueDTO; onClose: () => void }> = ({ entrada, onClose }) => (
  <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="view-est-title">
      <div className="modal-header">
        <div>
          <p className="modal-title" id="view-est-title">Detalhes da entrada</p>
          <p className="modal-subtitle">Informações completas do registro.</p>
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
      </div>
      <div className="modal-body">
        <div className="form-field">
          <label className="form-label">Produto</label>
          <div className="form-input-wrap">
            <input className="form-input" type="text" value={entrada.produto} readOnly />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field form-field--grow">
            <label className="form-label">Quantidade</label>
            <div className="form-input-wrap">
              <input className="form-input" type="text" value={`${entrada.quantidadeEntrada} un`} readOnly />
            </div>
          </div>
          <div className="form-field form-field--grow">
            <label className="form-label">Data de entrada</label>
            <div className="form-input-wrap">
              <input className="form-input" type="text" value={new Date(entrada.dataEntrada).toLocaleDateString('pt-BR')} readOnly />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-primary-sm" onClick={onClose}>Fechar</button>
      </div>
    </div>
  </div>
);

/* ── Skeleton ── */

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="est-skeleton-row">
        <td><div className="est-skeleton-line" style={{ width: '55%' }} /></td>
        <td><div className="est-skeleton-line" style={{ width: 60, margin: '0 auto' }} /></td>
        <td><div className="est-skeleton-line" style={{ width: 80 }} /></td>
        <td />
      </tr>
    ))}
  </>
);

/* ── Page ── */

const Estoque: React.FC = () => {
  const [entradas, setEntradas]   = useState<EntradaEstoqueDTO[]>([]);
  const [produtos, setProdutos]   = useState<ProdutoDTO[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState<EntradaEstoqueDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing]             = useState<EntradaEstoqueDTO | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ents, prods] = await Promise.all([getEntradasEstoque(), getProdutos()]);
      setEntradas(ents);
      setProdutos(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteEntradaEstoque(deleting.estoqueId);
      setEntradas(prev => prev.filter(e => e.estoqueId !== deleting.estoqueId));
      setDeleting(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir entrada.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalEntradas = entradas.reduce((sum, e) => sum + e.quantidadeEntrada, 0);

  return (
    <AdminLayout>

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">
            {loading
              ? 'Carregando…'
              : `${entradas.length} ${entradas.length === 1 ? 'entrada' : 'entradas'} · ${totalEntradas} unidades recebidas`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nova entrada
        </button>
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>{error}</div>
      )}

      <div className="est-table-wrap">
        <table className="est-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th className="col-qty">Quantidade</th>
              <th className="col-data">Data</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && entradas.length === 0 && !error && (
              <tr>
                <td colSpan={4}>
                  <div className="est-empty">
                    <div className="est-empty-icon"><Boxes size={22} /></div>
                    <p className="est-empty-title">Nenhuma entrada registrada</p>
                    <p className="est-empty-desc">
                      Clique em "Nova entrada" para registrar a primeira movimentação.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && entradas.map(entrada => (
              <tr key={entrada.estoqueId}>
                <td>
                  <div className="est-produto-cell">
                    <div className="est-produto-dot" />
                    <span className="est-produto-nome">{entrada.produto}</span>
                  </div>
                </td>
                <td className="col-qty">
                  <span className="est-qty-badge">
                    +{entrada.quantidadeEntrada} un
                  </span>
                </td>
                <td className="col-data">
                  <span className="est-data">{formatDate(entrada.dataEntrada)}</span>
                </td>
                <td>
                  <div className="est-row-actions">
                    <button
                      className="est-action-btn"
                      title="Visualizar"
                      aria-label={`Visualizar entrada de ${entrada.produto}`}
                      onClick={() => setViewing(entrada)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="est-action-btn est-action-btn--danger"
                      title="Excluir entrada"
                      aria-label={`Excluir entrada de ${entrada.produto}`}
                      onClick={() => setDeleting(entrada)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <VisualizarEntradaModal
          entrada={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {showModal && (
        <NovaEntradaModal
          produtos={produtos}
          onClose={() => setShowModal(false)}
          onCreated={fetchAll}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Excluir entrada de "${deleting.produto}"?`}
          description={`Esta ação remove o registro de ${deleting.quantidadeEntrada} unidades. O estoque do produto não será revertido automaticamente.`}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

    </AdminLayout>
  );
};

export default Estoque;
