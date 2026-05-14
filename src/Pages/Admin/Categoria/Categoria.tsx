import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Folder, Pencil, Trash2, X, Plus, Eye } from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import {
  type CategoriaDTO,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategorias,
} from '../../../Services/categoriaService';
import '../../../Styles/Admin/categoria.css';

/* ── Nova Categoria Modal ── */

interface ModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const NovaCategoriaModal: React.FC<ModalProps> = ({ onClose, onCreated }) => {
  const [nome, setNome]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) { setError('Informe um nome para a categoria.'); return; }
    setError('');
    setLoading(true);
    try {
      await createCategoria(trimmed);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <div className="modal-header">
          <div>
            <p className="modal-title" id="modal-title">Nova categoria</p>
            <p className="modal-subtitle">Informe o nome para criar a categoria.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="form-label" htmlFor="cat-nome">Nome da categoria</label>
              <div className="form-input-wrap">
                <input
                  ref={inputRef}
                  id="cat-nome"
                  className="form-input"
                  type="text"
                  placeholder="Ex: Suplementos Minerais"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {error && <div className="modal-error" role="alert">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? 'Criando…' : 'Criar categoria'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Editar Categoria Modal ── */

interface EditModalProps {
  categoria: CategoriaDTO;
  onClose: () => void;
  onSaved: () => void;
}

const EditarCategoriaModal: React.FC<EditModalProps> = ({ categoria, onClose, onSaved }) => {
  const [nome, setNome]       = useState(categoria.nomeCategoria);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) { setError('Informe um nome para a categoria.'); return; }
    setError('');
    setLoading(true);
    try {
      await updateCategoria(categoria.categoriaId, trimmed);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-cat-title">

        <div className="modal-header">
          <div>
            <p className="modal-title" id="edit-cat-title">Editar categoria</p>
            <p className="modal-subtitle">Altere o nome da categoria.</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="form-label" htmlFor="edit-cat-nome">Nome da categoria</label>
              <div className="form-input-wrap">
                <input
                  ref={inputRef}
                  id="edit-cat-nome"
                  className="form-input"
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  maxLength={100}
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
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Visualizar Categoria Modal ── */

const VisualizarCategoriaModal: React.FC<{ categoria: CategoriaDTO; onClose: () => void }> = ({ categoria, onClose }) => (
  <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="view-cat-title">
      <div className="modal-header">
        <div>
          <p className="modal-title" id="view-cat-title">Detalhes da categoria</p>
          <p className="modal-subtitle">Informações completas do registro.</p>
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
      </div>
      <div className="modal-body">
        <div className="form-field">
          <label className="form-label">Nome</label>
          <div className="form-input-wrap">
            <input className="form-input" type="text" value={categoria.nomeCategoria} readOnly />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-primary-sm" onClick={onClose}>Fechar</button>
      </div>
    </div>
  </div>
);

/* ── Skeleton rows ── */

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <tr className="cat-skeleton-row" key={i}>
        <td><div className="cat-skeleton-line" style={{ width: '60%' }} /></td>
        <td><div className="cat-skeleton-line" style={{ width: '24px', margin: '0 auto' }} /></td>
        <td />
      </tr>
    ))}
  </>
);

/* ── Page ── */

const Categoria: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<CategoriaDTO | null>(null);
  const [deleting, setDeleting]     = useState<CategoriaDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing]             = useState<CategoriaDTO | null>(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCategoria(deleting.categoriaId);
      setCategorias(prev => prev.filter(c => c.categoriaId !== deleting.categoriaId));
      setDeleting(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir categoria.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const total = categorias.length;

  return (
    <AdminLayout>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">
            {loading
              ? 'Carregando…'
              : `${total} ${total === 1 ? 'categoria' : 'categorias'} · organize seus produtos`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nova categoria
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="cat-table-wrap">
        <table className="cat-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="col-ordem">Ordem</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && categorias.length === 0 && !error && (
              <tr>
                <td colSpan={3}>
                  <div className="cat-empty">
                    <div className="cat-empty-icon"><Folder size={22} /></div>
                    <p className="cat-empty-title">Nenhuma categoria cadastrada</p>
                    <p className="cat-empty-desc">
                      Clique em "Nova categoria" para adicionar a primeira.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && categorias.map((cat, index) => (
              <tr key={cat.categoriaId}>
                <td>
                  <div className="cat-name-cell">
                    <div className="cat-color-swatch" />
                    <span className="cat-name">{cat.nomeCategoria}</span>
                  </div>
                </td>
                <td className="cat-order">{index + 1}</td>
                <td>
                  <div className="cat-row-actions">
                    <button
                      className="cat-action-btn"
                      title="Visualizar"
                      aria-label={`Visualizar ${cat.nomeCategoria}`}
                      onClick={() => setViewing(cat)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="cat-action-btn"
                      title="Editar"
                      aria-label={`Editar ${cat.nomeCategoria}`}
                      onClick={() => setEditing(cat)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="cat-action-btn cat-action-btn--danger"
                      title="Excluir"
                      aria-label={`Excluir ${cat.nomeCategoria}`}
                      onClick={() => setDeleting(cat)}
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
        <VisualizarCategoriaModal
          categoria={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Modal novo */}
      {showModal && (
        <NovaCategoriaModal
          onClose={() => setShowModal(false)}
          onCreated={fetchCategorias}
        />
      )}

      {/* Modal editar */}
      {editing && (
        <EditarCategoriaModal
          categoria={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchCategorias}
        />
      )}

      {/* Confirm delete */}
      {deleting && (
        <ConfirmDialog
          title={`Excluir "${deleting.nomeCategoria}"?`}
          description="Esta ação não pode ser desfeita. A categoria será removida permanentemente."
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

    </AdminLayout>
  );
};

export default Categoria;
