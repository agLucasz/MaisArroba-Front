import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, Pencil, Trash2, X, Plus, Eye } from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import {
  type FormaPagamentoDTO,
  createFormaPagamento,
  updateFormaPagamento,
  deleteFormaPagamento,
  getFormasPagamento,
} from '../../../Services/formaPagamentoService';
import '../../../Styles/Admin/formaPagamento.css';

/* ── Nova Forma de Pagamento Modal ── */

interface ModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const NovaFormaPagamentoModal: React.FC<ModalProps> = ({ onClose, onCreated }) => {
  const [nome, setNome]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) { setError('Informe um nome para a forma de pagamento.'); return; }
    setError('');
    setLoading(true);
    try {
      await createFormaPagamento(trimmed);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar forma de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-modal-overlay" onClick={handleOverlay} onKeyDown={handleKeyDown}>
      <div className="fp-modal" role="dialog" aria-modal="true" aria-labelledby="fp-modal-title">

        <div className="fp-modal-header">
          <div>
            <p className="fp-modal-title" id="fp-modal-title">Nova forma de pagamento</p>
            <p className="fp-modal-subtitle">Informe o nome para criar o método.</p>
          </div>
          <button className="fp-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fp-modal-body">
            <div className="form-field">
              <label className="form-label" htmlFor="fp-nome">Nome</label>
              <div className="form-input-wrap">
                <input
                  ref={inputRef}
                  id="fp-nome"
                  className="form-input"
                  type="text"
                  placeholder="Ex.: PIX, Boleto, Cartão de crédito"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {error && <div className="fp-modal-error" role="alert">{error}</div>}
          </div>

          <div className="fp-modal-footer">
            <button type="button" className="fp-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="fp-btn-primary" disabled={loading}>
              {loading ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Editar Forma de Pagamento Modal ── */

interface EditModalProps {
  forma: FormaPagamentoDTO;
  onClose: () => void;
  onSaved: () => void;
}

const EditarFormaPagamentoModal: React.FC<EditModalProps> = ({ forma, onClose, onSaved }) => {
  const [nome, setNome]       = useState(forma.nomeFormaPagamento);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) { setError('Informe um nome para a forma de pagamento.'); return; }
    setError('');
    setLoading(true);
    try {
      await updateFormaPagamento(forma.formaPagamentoId, trimmed);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar forma de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-modal-overlay" onClick={handleOverlay}>
      <div className="fp-modal" role="dialog" aria-modal="true" aria-labelledby="fp-edit-title">

        <div className="fp-modal-header">
          <div>
            <p className="fp-modal-title" id="fp-edit-title">Editar forma de pagamento</p>
            <p className="fp-modal-subtitle">Altere o nome do método.</p>
          </div>
          <button className="fp-modal-close" onClick={onClose} disabled={loading} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fp-modal-body">
            <div className="form-field">
              <label className="form-label" htmlFor="fp-edit-nome">Nome</label>
              <div className="form-input-wrap">
                <input
                  ref={inputRef}
                  id="fp-edit-nome"
                  className="form-input"
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {error && <div className="fp-modal-error" role="alert">{error}</div>}
          </div>

          <div className="fp-modal-footer">
            <button type="button" className="fp-btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="fp-btn-primary" disabled={loading}>
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Visualizar Forma de Pagamento Modal ── */

const VisualizarFormaPagamentoModal: React.FC<{ forma: FormaPagamentoDTO; onClose: () => void }> = ({ forma, onClose }) => (
  <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="view-fp-title">
      <div className="modal-header">
        <div>
          <p className="modal-title" id="view-fp-title">Detalhes da forma de pagamento</p>
          <p className="modal-subtitle">Informações completas do registro.</p>
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
      </div>
      <div className="modal-body">
        <div className="form-field">
          <label className="form-label">Nome</label>
          <div className="form-input-wrap">
            <input className="form-input" type="text" value={forma.nomeFormaPagamento} readOnly />
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
    {Array.from({ length: 4 }).map((_, i) => (
      <tr key={i}>
        <td><div className="fp-skeleton-line" style={{ width: '55%' }} /></td>
        <td><div className="fp-skeleton-line" style={{ width: 24, margin: '0 auto' }} /></td>
        <td />
      </tr>
    ))}
  </>
);

/* ── Page ── */

const FormaPagamento: React.FC = () => {
  const [formas, setFormas]         = useState<FormaPagamentoDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<FormaPagamentoDTO | null>(null);
  const [deleting, setDeleting]     = useState<FormaPagamentoDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing]             = useState<FormaPagamentoDTO | null>(null);

  const fetchFormas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFormasPagamento();
      setFormas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar formas de pagamento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFormas(); }, [fetchFormas]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteFormaPagamento(deleting.formaPagamentoId);
      setFormas(prev => prev.filter(f => f.formaPagamentoId !== deleting.formaPagamentoId));
      setDeleting(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir forma de pagamento.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const total = formas.length;

  return (
    <AdminLayout>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Formas de Pagamento</h1>
          <p className="page-subtitle">
            {loading
              ? 'Carregando…'
              : `${total} ${total === 1 ? 'método cadastrado' : 'métodos cadastrados'}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nova forma de pagamento
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="fp-table-wrap">
        <table className="fp-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="col-ordem">Ordem</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && formas.length === 0 && !error && (
              <tr>
                <td colSpan={3}>
                  <div className="fp-empty">
                    <div className="fp-empty-icon"><CreditCard size={22} /></div>
                    <p className="fp-empty-title">Nenhuma forma de pagamento cadastrada</p>
                    <p className="fp-empty-desc">
                      Clique em "Nova forma de pagamento" para adicionar o primeiro método.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && formas.map((forma, index) => (
              <tr key={forma.formaPagamentoId}>
                <td>
                  <div className="fp-name-cell">
                    <div className="fp-icon-wrap">
                      <CreditCard size={15} />
                    </div>
                    <span className="fp-name">{forma.nomeFormaPagamento}</span>
                  </div>
                </td>
                <td className="fp-order">{index + 1}</td>
                <td>
                  <div className="fp-row-actions">
                    <button
                      className="fp-action-btn"
                      title="Visualizar"
                      aria-label={`Visualizar ${forma.nomeFormaPagamento}`}
                      onClick={() => setViewing(forma)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="fp-action-btn"
                      title="Editar"
                      aria-label={`Editar ${forma.nomeFormaPagamento}`}
                      onClick={() => setEditing(forma)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="fp-action-btn fp-action-btn--danger"
                      title="Excluir"
                      aria-label={`Excluir ${forma.nomeFormaPagamento}`}
                      onClick={() => setDeleting(forma)}
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

      {/* Modal visualizar */}
      {viewing && (
        <VisualizarFormaPagamentoModal
          forma={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Modal novo */}
      {showModal && (
        <NovaFormaPagamentoModal
          onClose={() => setShowModal(false)}
          onCreated={fetchFormas}
        />
      )}

      {/* Modal editar */}
      {editing && (
        <EditarFormaPagamentoModal
          forma={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchFormas}
        />
      )}

      {/* Confirm delete */}
      {deleting && (
        <ConfirmDialog
          title={`Excluir "${deleting.nomeFormaPagamento}"?`}
          description="Esta ação não pode ser desfeita. O método de pagamento será removido permanentemente."
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

    </AdminLayout>
  );
};

export default FormaPagamento;
