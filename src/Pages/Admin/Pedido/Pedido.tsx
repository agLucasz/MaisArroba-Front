import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShoppingCart, Plus, X, Search, CheckSquare, RotateCcw, Ban, User } from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import {
  type VendaDTO,
  type VendaCreateDTO,
  StatusVenda,
  getVendas,
  createVenda,
  finalizarVenda,
  reabrirVenda,
  cancelarVenda,
} from '../../../Services/vendaService';
import { getProdutos, type ProdutoDTO } from '../../../Services/produtoService';
import { getClientes, type ClienteDTO } from '../../../Services/clienteService';
import '../../../Styles/Admin/pedido.css';

/* ── Helpers ── */

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

const STATUS_LABEL: Record<number, string> = {
  [StatusVenda.Aberto]:    'Aberto',
  [StatusVenda.Pendente]:  'Pendente',
  [StatusVenda.Pago]:      'Pago',
  [StatusVenda.Cancelado]: 'Cancelado',
};

const STATUS_CLASS: Record<number, string> = {
  [StatusVenda.Aberto]:    'ped-badge--aberto',
  [StatusVenda.Pendente]:  'ped-badge--pendente',
  [StatusVenda.Pago]:      'ped-badge--pago',
  [StatusVenda.Cancelado]: 'ped-badge--cancelado',
};

/* ── VendaItem (estado local do modal) ── */

interface VendaItem {
  produtoId: number;
  nomeProduto: string;
  embalagem: string;
  valorUnitario: number;
  valorOriginal: number;
  estoque: number;
  quantidadeItem: number;
}

/* ── Product Picker Modal ── */

interface ProductPickerProps {
  produtos: ProdutoDTO[];
  onSelect: (produto: ProdutoDTO) => void;
  onClose: () => void;
}

const ProductPickerModal: React.FC<ProductPickerProps> = ({ produtos, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = produtos.filter(p =>
    p.nomeProduto.toLowerCase().includes(search.toLowerCase()) ||
    p.embalagem.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="modal-overlay ped-picker-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="picker-title">
        <div className="modal-header">
          <div>
            <p className="modal-title" id="picker-title">Selecionar produto</p>
            <p className="modal-subtitle">Clique no produto para adicioná-lo à venda.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="ped-picker-search">
          <Search size={14} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="ped-picker-list">
          {filtered.length === 0 && (
            <p className="ped-picker-empty">Nenhum produto encontrado.</p>
          )}
          {filtered.map(p => (
            <button
              key={p.produtoId}
              className="ped-picker-item"
              onClick={() => onSelect(p)}
              disabled={p.quantidade === 0}
            >
              <div className="ped-picker-item-info">
                <span className="ped-picker-item-name">{p.nomeProduto}</span>
                {p.embalagem && <span className="ped-picker-item-emb">{p.embalagem}</span>}
              </div>
              <div className="ped-picker-item-meta">
                <span className="ped-picker-item-price">{formatBRL(p.valorVenda)}</span>
                <span className={`ped-picker-item-stock${p.quantidade === 0 ? ' ped-picker-item-stock--zero' : ''}`}>
                  {p.quantidade === 0 ? 'Sem estoque' : `${p.quantidade} un`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Cliente Picker Modal ── */

interface ClientePickerProps {
  clientes: ClienteDTO[];
  onSelect: (cliente: ClienteDTO) => void;
  onClose: () => void;
}

const ClientePickerModal: React.FC<ClientePickerProps> = ({ clientes, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.documento.includes(search) ||
    c.cidade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="modal-overlay ped-picker-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cliente-picker-title">
        <div className="modal-header">
          <div>
            <p className="modal-title" id="cliente-picker-title">Selecionar cliente</p>
            <p className="modal-subtitle">Clique no cliente para vinculá-lo à venda.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="ped-picker-search">
          <Search size={14} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Buscar por nome, documento ou cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="ped-picker-list">
          {filtered.length === 0 && (
            <p className="ped-picker-empty">Nenhum cliente encontrado.</p>
          )}
          {filtered.map(c => (
            <button
              key={c.clienteId}
              className="ped-picker-item"
              onClick={() => onSelect(c)}
            >
              <div className="ped-picker-item-info">
                <span className="ped-picker-item-name">{c.nome}</span>
                <span className="ped-picker-item-emb">{c.documento}{c.cidade ? ` · ${c.cidade}` : ''}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Nova Venda Modal (PDV) ── */

interface NovaVendaModalProps {
  produtos: ProdutoDTO[];
  clientes: ClienteDTO[];
  onClose: () => void;
  onCreated: () => void;
}

const NovaVendaModal: React.FC<NovaVendaModalProps> = ({ produtos, clientes, onClose, onCreated }) => {
  const [itens, setItens]                       = useState<VendaItem[]>([]);
  const [dataEntrega, setDataEntrega]           = useState('');
  const [observacao, setObservacao]             = useState('');
  const [showPicker, setShowPicker]             = useState(false);
  const [showClientePicker, setShowClientePicker] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteDTO | null>(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');
  const searchRef                               = useRef<HTMLInputElement>(null);

  const handleSelectCliente = (cliente: ClienteDTO) => {
    setClienteSelecionado(cliente);
    setShowClientePicker(false);
  };

  const handleSelectProduct = (produto: ProdutoDTO) => {
    setItens(prev => {
      const existing = prev.find(i => i.produtoId === produto.produtoId);
      if (existing) {
        return prev.map(i =>
          i.produtoId === produto.produtoId
            ? { ...i, quantidadeItem: Math.min(i.quantidadeItem + 1, i.estoque) }
            : i
        );
      }
      return [...prev, {
        produtoId:      produto.produtoId,
        nomeProduto:    produto.nomeProduto,
        embalagem:      produto.embalagem,
        valorUnitario:  produto.valorVenda,
        valorOriginal:  produto.valorVenda,
        estoque:        produto.quantidade,
        quantidadeItem: 1,
      }];
    });
    setShowPicker(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleQtyChange = (produtoId: number, qty: number) => {
    setItens(prev =>
      prev.map(i =>
        i.produtoId === produtoId
          ? { ...i, quantidadeItem: Math.max(1, Math.min(qty || 1, i.estoque)) }
          : i
      )
    );
  };

  const handlePriceChange = (produtoId: number, valor: string) => {
    const num = parseFloat(valor.replace(',', '.'));
    setItens(prev =>
      prev.map(i =>
        i.produtoId === produtoId
          ? { ...i, valorUnitario: isNaN(num) ? 0 : Math.max(0, num) }
          : i
      )
    );
  };

  const handleRemoveItem = (produtoId: number) => {
    setItens(prev => prev.filter(i => i.produtoId !== produtoId));
  };

  const totalVenda = itens.reduce((sum, i) => sum + i.valorUnitario * i.quantidadeItem, 0);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (itens.length === 0) { setError('Adicione ao menos um produto à venda.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload: VendaCreateDTO = {
        itens: itens.map(i => ({
          produtoId:      i.produtoId,
          quantidadeItem: i.quantidadeItem,
          valorItem:      i.valorUnitario !== i.valorOriginal ? i.valorUnitario : undefined,
        })),
        clienteId:   clienteSelecionado?.clienteId,
        dataEntrega: dataEntrega || undefined,
        observacao:  observacao.trim() || undefined,
      };
      await createVenda(payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar venda.');
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
        <div className="pdv-modal" role="dialog" aria-modal="true" aria-labelledby="venda-modal-title">

          {/* Header */}
          <div className="pdv-header">
            <p className="pdv-title" id="venda-modal-title">Nova venda</p>
            <button className="modal-close-btn" onClick={onClose} disabled={loading} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="pdv-body">

            {/* ── Coluna esquerda: produtos ── */}
            <div className="pdv-left">

              {/* Busca */}
              <div className="pdv-search-wrap">
                <div
                  className="ped-search-trigger"
                  onClick={() => !loading && setShowPicker(true)}
                >
                  <Search size={14} className="ped-search-trigger-icon" />
                  <input
                    ref={searchRef}
                    type="text"
                    readOnly
                    placeholder="Clique ou pressione Enter para adicionar produto..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); setShowPicker(true); }
                    }}
                  />
                </div>
              </div>

              {/* Lista de itens */}
              <div className="pdv-items-wrap">
                {itens.length === 0 ? (
                  <div className="pdv-items-empty">
                    <ShoppingCart size={28} />
                    <span>Nenhum produto adicionado</span>
                  </div>
                ) : (
                  <div className="ped-items-list">
                    {/* Cabeçalho da lista */}
                    <div className="pdv-items-head">
                      <span>Produto</span>
                      <span className="pdv-col-qty">Qtd</span>
                      <span className="pdv-col-price">Preço unit.</span>
                      <span className="pdv-col-total">Total</span>
                      <span className="pdv-col-rm" />
                    </div>

                    {itens.map(item => (
                      <div key={item.produtoId} className="ped-item-row">
                        <div className="ped-item-info">
                          <span className="ped-item-name">{item.nomeProduto}</span>
                          {item.embalagem && <span className="ped-item-emb">{item.embalagem}</span>}
                        </div>
                        <div className="ped-item-controls">
                          <input
                            type="number"
                            className="ped-item-qty"
                            value={item.quantidadeItem}
                            min={1}
                            max={item.estoque}
                            onChange={e => handleQtyChange(item.produtoId, Number(e.target.value))}
                          />
                          <div className="pdv-price-wrap">
                            <span className="pdv-price-prefix">R$</span>
                            <input
                              type="number"
                              className="pdv-item-price"
                              value={item.valorUnitario}
                              min={0}
                              step={0.01}
                              onChange={e => handlePriceChange(item.produtoId, e.target.value)}
                              title="Preço unitário (editável para desconto)"
                            />
                            {item.valorUnitario !== item.valorOriginal && (
                              <span className="pdv-price-original">{formatBRL(item.valorOriginal)}</span>
                            )}
                          </div>
                          <span className="ped-item-total">
                            {formatBRL(item.valorUnitario * item.quantidadeItem)}
                          </span>
                          <button
                            type="button"
                            className="ped-item-remove"
                            onClick={() => handleRemoveItem(item.produtoId)}
                            aria-label={`Remover ${item.nomeProduto}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Coluna direita: resumo + ações ── */}
            <div className="pdv-right">

              {/* Cliente (opcional) */}
              <div className="pdv-client-section">
                <span className="pdv-client-label">Cliente (opcional)</span>
                {clienteSelecionado ? (
                  <div className="pdv-client-selected">
                    <User size={13} className="pdv-client-icon" />
                    <span className="pdv-client-name">{clienteSelecionado.nome}</span>
                    <button
                      type="button"
                      className="pdv-client-clear"
                      onClick={() => setClienteSelecionado(null)}
                      aria-label="Remover cliente"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="ped-search-trigger pdv-client-trigger"
                    onClick={() => !loading && setShowClientePicker(true)}
                  >
                    <Search size={14} className="ped-search-trigger-icon" />
                    <input
                      type="text"
                      readOnly
                      placeholder="Pressione Enter para buscar..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); setShowClientePicker(true); }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="pdv-summary">
                <div className="pdv-summary-row">
                  <span className="pdv-summary-label">Itens</span>
                  <span className="pdv-summary-val">{itens.reduce((s, i) => s + i.quantidadeItem, 0)}</span>
                </div>
                <div className="pdv-summary-divider" />
                <div className="pdv-summary-row pdv-summary-total">
                  <span>Total</span>
                  <span>{formatBRL(totalVenda)}</span>
                </div>
              </div>

              <div className="pdv-fields">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="venda-entrega">Previsão de entrega</label>
                  <input
                    id="venda-entrega"
                    className="modal-input"
                    type="date"
                    value={dataEntrega}
                    onChange={e => setDataEntrega(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="venda-obs">Observação</label>
                  <textarea
                    id="venda-obs"
                    className="modal-textarea"
                    placeholder="Informações adicionais..."
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {error && <div className="modal-error" role="alert">{error}</div>}

              <div className="pdv-actions">
                <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-sm pdv-btn-submit" disabled={loading}>
                  {loading ? 'Salvando…' : 'Registrar venda'}
                </button>
              </div>

            </div>
          </form>

        </div>
      </div>

      {showPicker && (
        <ProductPickerModal
          produtos={produtos}
          onSelect={handleSelectProduct}
          onClose={() => { setShowPicker(false); searchRef.current?.focus(); }}
        />
      )}

      {showClientePicker && (
        <ClientePickerModal
          clientes={clientes}
          onSelect={handleSelectCliente}
          onClose={() => setShowClientePicker(false)}
        />
      )}
    </>
  );
};

/* ── Skeleton ── */

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}>
        <td><div className="ped-skeleton-line" style={{ width: 36 }} /></td>
        <td><div className="ped-skeleton-line" style={{ width: '65%' }} /></td>
        <td><div className="ped-skeleton-line" style={{ width: 90 }} /></td>
        <td><div className="ped-skeleton-line" style={{ width: 80, marginLeft: 'auto' }} /></td>
        <td><div className="ped-skeleton-line" style={{ width: 76 }} /></td>
        <td><div className="ped-skeleton-line" style={{ width: 76 }} /></td>
        <td><div className="ped-skeleton-line" style={{ width: 68 }} /></td>
        <td />
      </tr>
    ))}
  </>
);

/* ── Page ── */

type PendingAction = { vendaId: number; type: 'finalizar' | 'cancelar' | 'reabrir' };

const CONFIRM_CFG: Record<PendingAction['type'], { title: string; description: string; label: string }> = {
  finalizar: {
    title:       'Finalizar venda?',
    description: 'A venda será marcada como paga e o estoque será deduzido. Esta ação não pode ser desfeita.',
    label:       'Finalizar',
  },
  cancelar: {
    title:       'Cancelar venda?',
    description: 'A venda será cancelada permanentemente. Esta ação não pode ser desfeita.',
    label:       'Cancelar venda',
  },
  reabrir: {
    title:       'Reabrir venda?',
    description: 'A venda voltará ao status Aberto e novos itens poderão ser adicionados.',
    label:       'Reabrir',
  },
};

const Pedido: React.FC = () => {
  const [vendas, setVendas]               = useState<VendaDTO[]>([]);
  const [produtos, setProdutos]           = useState<ProdutoDTO[]>([]);
  const [clientes, setClientes]           = useState<ClienteDTO[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vs, ps, cs] = await Promise.all([getVendas(), getProdutos(), getClientes()]);
      setVendas(vs);
      setProdutos(ps);
      setClientes(cs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      if (pendingAction.type === 'finalizar') await finalizarVenda(pendingAction.vendaId);
      if (pendingAction.type === 'cancelar')  await cancelarVenda(pendingAction.vendaId);
      if (pendingAction.type === 'reabrir')   await reabrirVenda(pendingAction.vendaId);
      setPendingAction(null);
      await fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao processar ação.');
      setActionLoading(false);
    }
  };

  const canFinalizar = (s: StatusVenda) => s === StatusVenda.Aberto || s === StatusVenda.Pendente;
  const canCancelar  = (s: StatusVenda) => s !== StatusVenda.Pago && s !== StatusVenda.Cancelado;
  const canReabrir   = (s: StatusVenda) => s === StatusVenda.Pendente;

  const total   = vendas.length;
  const abertos = vendas.filter(v => v.status === StatusVenda.Aberto || v.status === StatusVenda.Pendente).length;
  const pagos   = vendas.filter(v => v.status === StatusVenda.Pago).length;

  return (
    <AdminLayout>

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Vendas</h1>
          <p className="page-subtitle">
            {loading
              ? 'Carregando…'
              : `${total} ${total === 1 ? 'venda' : 'vendas'} · ${abertos} em aberto · ${pagos} pagas`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nova venda
        </button>
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>{error}</div>
      )}

      <div className="ped-table-wrap">
        <table className="ped-table">
          <thead>
            <tr>
              <th className="col-id">#</th>
              <th>Produtos</th>
              <th className="col-cliente">Cliente</th>
              <th className="col-valor">Total</th>
              <th className="col-data">Data</th>
              <th className="col-data">Entrega</th>
              <th>Status</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && vendas.length === 0 && !error && (
              <tr>
                <td colSpan={8}>
                  <div className="ped-empty">
                    <div className="ped-empty-icon"><ShoppingCart size={22} /></div>
                    <p className="ped-empty-title">Nenhuma venda registrada</p>
                    <p className="ped-empty-desc">
                      Clique em "Nova venda" para registrar a primeira.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && vendas.map(venda => (
              <tr key={venda.vendaId}>
                <td className="col-id">
                  <span className="ped-id">#{venda.vendaId}</span>
                </td>
                <td>
                  <div className="ped-itens-col">
                    {venda.itens.length === 0 && (
                      <span className="ped-item-none">Sem itens</span>
                    )}
                    {venda.itens.slice(0, 2).map(item => (
                      <span key={item.vendaItemId} className="ped-item-tag">
                        {item.nomeProduto} × {item.quantidadeItem}
                      </span>
                    ))}
                    {venda.itens.length > 2 && (
                      <span className="ped-item-more">+{venda.itens.length - 2} mais</span>
                    )}
                  </div>
                </td>
                <td className="col-cliente">
                  {venda.nomeCliente
                    ? <span className="ped-cliente">{venda.nomeCliente}</span>
                    : <span className="ped-cliente-none">—</span>}
                </td>
                <td className="col-valor">
                  <span className="ped-valor">{formatBRL(venda.valorVenda)}</span>
                </td>
                <td className="col-data">
                  <span className="ped-data">{formatDate(venda.dataVenda)}</span>
                </td>
                <td className="col-data">
                  <span className="ped-data">{formatDate(venda.dataEntrega)}</span>
                </td>
                <td>
                  <span className={`ped-badge ${STATUS_CLASS[venda.status]}`}>
                    {STATUS_LABEL[venda.status]}
                  </span>
                </td>
                <td>
                  <div className="ped-row-actions">
                    {canFinalizar(venda.status) && (
                      <button
                        className="ped-action-btn ped-action-btn--finalizar"
                        title="Finalizar venda"
                        aria-label={`Finalizar venda #${venda.vendaId}`}
                        onClick={() => setPendingAction({ vendaId: venda.vendaId, type: 'finalizar' })}
                      >
                        <CheckSquare size={14} />
                      </button>
                    )}
                    {canReabrir(venda.status) && (
                      <button
                        className="ped-action-btn ped-action-btn--reabrir"
                        title="Reabrir venda"
                        aria-label={`Reabrir venda #${venda.vendaId}`}
                        onClick={() => setPendingAction({ vendaId: venda.vendaId, type: 'reabrir' })}
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    {canCancelar(venda.status) && (
                      <button
                        className="ped-action-btn ped-action-btn--cancelar"
                        title="Cancelar venda"
                        aria-label={`Cancelar venda #${venda.vendaId}`}
                        onClick={() => setPendingAction({ vendaId: venda.vendaId, type: 'cancelar' })}
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <NovaVendaModal
          produtos={produtos}
          clientes={clientes}
          onClose={() => setShowModal(false)}
          onCreated={fetchAll}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          title={CONFIRM_CFG[pendingAction.type].title}
          description={CONFIRM_CFG[pendingAction.type].description}
          confirmLabel={CONFIRM_CFG[pendingAction.type].label}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

    </AdminLayout>
  );
};

export default Pedido;
