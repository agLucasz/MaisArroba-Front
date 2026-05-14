import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Pencil, Trash2, X, Plus, Eye } from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import {
  type ClienteDTO,
  createCliente,
  updateCliente,
  deleteCliente,
  getClientes,
} from '../../../Services/clienteService';
import '../../../Styles/Admin/cliente.css';

/* ── Helpers ── */

function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/* ── Form state ── */

interface FormState {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  uf: string;
}

const emptyForm = (): FormState => ({
  nome: '', documento: '', telefone: '', email: '',
  endereco: '', bairro: '', cidade: '', cep: '', uf: '',
});

/* ── Form fields shared component ── */

interface ClienteFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  error: string;
  loading: boolean;
  readOnly?: boolean;
  nomeRef?: React.RefObject<HTMLInputElement | null>;
}

const ClienteForm: React.FC<ClienteFormProps> = ({ form, setForm, error, loading, readOnly, nomeRef }) => {
  const off = loading || !!readOnly;
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleDocumento = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, documento: maskCpfCnpj(e.target.value) }));

  const handleTelefone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, telefone: maskTelefone(e.target.value) }));

  const handleCep = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, cep: maskCep(e.target.value) }));

  const handleUf = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, uf: e.target.value.toUpperCase().slice(0, 2) }));

  return (
    <div className="modal-body">
      {/* Nome */}
      <div className="form-field">
        <label className="form-label" htmlFor="cli-nome">Nome <span className="form-required">*</span></label>
        <div className="form-input-wrap">
          <input
            ref={nomeRef}
            id="cli-nome"
            className="form-input"
            type="text"
            placeholder="Nome completo ou razão social"
            value={form.nome}
            onChange={set('nome')}
            maxLength={150}
            disabled={off}
          />
        </div>
      </div>

      {/* Documento + Telefone */}
      <div className="form-row">
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="cli-documento">CPF / CNPJ <span className="form-required">*</span></label>
          <div className="form-input-wrap">
            <input
              id="cli-documento"
              className="form-input"
              type="text"
              placeholder="000.000.000-00"
              value={form.documento}
              onChange={handleDocumento}
              maxLength={18}
              disabled={off}
            />
          </div>
        </div>
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="cli-telefone">Telefone <span className="form-required">*</span></label>
          <div className="form-input-wrap">
            <input
              id="cli-telefone"
              className="form-input"
              type="text"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={handleTelefone}
              maxLength={15}
              disabled={off}
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="form-field">
        <label className="form-label" htmlFor="cli-email">E-mail</label>
        <div className="form-input-wrap">
          <input
            id="cli-email"
            className="form-input"
            type="email"
            placeholder="contato@exemplo.com"
            value={form.email}
            onChange={set('email')}
            maxLength={150}
            disabled={off}
          />
        </div>
      </div>

      {/* Endereço */}
      <div className="form-field">
        <label className="form-label" htmlFor="cli-endereco">Endereço</label>
        <div className="form-input-wrap">
          <input
            id="cli-endereco"
            className="form-input"
            type="text"
            placeholder="Rua, número, complemento"
            value={form.endereco}
            onChange={set('endereco')}
            maxLength={200}
            disabled={off}
          />
        </div>
      </div>

      {/* Bairro + CEP + UF */}
      <div className="form-row">
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="cli-bairro">Bairro</label>
          <div className="form-input-wrap">
            <input
              id="cli-bairro"
              className="form-input"
              type="text"
              placeholder="Bairro"
              value={form.bairro}
              onChange={set('bairro')}
              maxLength={100}
              disabled={off}
            />
          </div>
        </div>
        <div className="form-field form-field--cep">
          <label className="form-label" htmlFor="cli-cep">CEP</label>
          <div className="form-input-wrap">
            <input
              id="cli-cep"
              className="form-input"
              type="text"
              placeholder="00000-000"
              value={form.cep}
              onChange={handleCep}
              maxLength={9}
              disabled={off}
            />
          </div>
        </div>
        <div className="form-field form-field--uf">
          <label className="form-label" htmlFor="cli-uf">UF</label>
          <div className="form-input-wrap">
            <input
              id="cli-uf"
              className="form-input form-input--center"
              type="text"
              placeholder="SP"
              value={form.uf}
              onChange={handleUf}
              maxLength={2}
              disabled={off}
            />
          </div>
        </div>
      </div>

      {/* Cidade */}
      <div className="form-field">
        <label className="form-label" htmlFor="cli-cidade">Cidade</label>
        <div className="form-input-wrap">
          <input
            id="cli-cidade"
            className="form-input"
            type="text"
            placeholder="Cidade"
            value={form.cidade}
            onChange={set('cidade')}
            maxLength={100}
            disabled={off}
          />
        </div>
      </div>

      {error && <div className="modal-error" role="alert">{error}</div>}
    </div>
  );
};

/* ── Novo Cliente Modal ── */

interface ModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const NovoClienteModal: React.FC<ModalProps> = ({ onClose, onCreated }) => {
  const [form, setForm]       = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const nomeRef               = useRef<HTMLInputElement>(null);

  useEffect(() => { nomeRef.current?.focus(); }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.nome.trim())      { setError('Informe o nome do cliente.'); return; }
    if (!form.documento.trim()) { setError('Informe o CPF ou CNPJ.'); return; }
    if (!form.telefone.trim())  { setError('Informe o telefone.'); return; }
    setError('');
    setLoading(true);
    try {
      await createCliente(
        form.nome.trim(), form.documento, form.telefone,
        form.email.trim(), form.endereco.trim(), form.bairro.trim(),
        form.cidade.trim(), form.cep, form.uf,
      );
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="cli-modal-title">

        <div className="modal-header">
          <div>
            <p className="modal-title" id="cli-modal-title">Novo cliente</p>
            <p className="modal-subtitle">Preencha os dados para cadastrar o cliente.</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <ClienteForm form={form} setForm={setForm} error={error} loading={loading} nomeRef={nomeRef} />
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? 'Salvando…' : 'Criar cliente'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Editar Cliente Modal ── */

interface EditModalProps {
  cliente: ClienteDTO;
  onClose: () => void;
  onSaved: () => void;
}

const EditarClienteModal: React.FC<EditModalProps> = ({ cliente, onClose, onSaved }) => {
  const [form, setForm] = useState<FormState>({
    nome:      cliente.nome,
    documento: cliente.documento,
    telefone:  cliente.telefone,
    email:     cliente.email,
    endereco:  cliente.endereco,
    bairro:    cliente.bairro,
    cidade:    cliente.cidade,
    cep:       cliente.cep,
    uf:        cliente.uf,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const nomeRef               = useRef<HTMLInputElement>(null);

  useEffect(() => { nomeRef.current?.focus(); }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.nome.trim())      { setError('Informe o nome do cliente.'); return; }
    if (!form.documento.trim()) { setError('Informe o CPF ou CNPJ.'); return; }
    if (!form.telefone.trim())  { setError('Informe o telefone.'); return; }
    setError('');
    setLoading(true);
    try {
      await updateCliente(
        cliente.clienteId,
        form.nome.trim(), form.documento, form.telefone,
        form.email.trim(), form.endereco.trim(), form.bairro.trim(),
        form.cidade.trim(), form.cep, form.uf,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="cli-edit-title">

        <div className="modal-header">
          <div>
            <p className="modal-title" id="cli-edit-title">Editar cliente</p>
            <p className="modal-subtitle">Altere os dados do cliente.</p>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <ClienteForm form={form} setForm={setForm} error={error} loading={loading} nomeRef={nomeRef} />
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

/* ── Visualizar Cliente Modal ── */

const VisualizarClienteModal: React.FC<{ cliente: ClienteDTO; onClose: () => void }> = ({ cliente, onClose }) => {
  const form: FormState = {
    nome: cliente.nome, documento: cliente.documento, telefone: cliente.telefone,
    email: cliente.email, endereco: cliente.endereco, bairro: cliente.bairro,
    cidade: cliente.cidade, cep: cliente.cep, uf: cliente.uf,
  };
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="view-cli-title">
        <div className="modal-header">
          <div>
            <p className="modal-title" id="view-cli-title">Detalhes do cliente</p>
            <p className="modal-subtitle">Informações completas do registro.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>
        <ClienteForm
          form={form}
          setForm={() => {}}
          error=""
          loading={false}
          readOnly
        />
        <div className="modal-footer">
          <button className="btn-primary-sm" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton rows ── */

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr className="cat-skeleton-row" key={i}>
        <td><div className="cat-skeleton-line" style={{ width: '55%' }} /></td>
        <td><div className="cat-skeleton-line" style={{ width: '80%' }} /></td>
        <td><div className="cat-skeleton-line" style={{ width: '70%' }} /></td>
        <td><div className="cat-skeleton-line" style={{ width: '60%' }} /></td>
        <td />
      </tr>
    ))}
  </>
);

/* ── Page ── */

const Cliente: React.FC = () => {
  const [clientes, setClientes]   = useState<ClienteDTO[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<ClienteDTO | null>(null);
  const [deleting, setDeleting]   = useState<ClienteDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing]             = useState<ClienteDTO | null>(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCliente(deleting.clienteId);
      setClientes(prev => prev.filter(c => c.clienteId !== deleting.clienteId));
      setDeleting(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cliente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const total = clientes.length;

  return (
    <AdminLayout>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">
            {loading
              ? 'Carregando…'
              : `${total} ${total === 1 ? 'cliente' : 'clientes'} cadastrado${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Novo cliente
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
        <table className="cli-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="cli-col-doc">Documento</th>
              <th className="cli-col-tel">Telefone</th>
              <th className="cli-col-cidade">Cidade / UF</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && clientes.length === 0 && !error && (
              <tr>
                <td colSpan={5}>
                  <div className="cat-empty">
                    <div className="cat-empty-icon"><Users size={22} /></div>
                    <p className="cat-empty-title">Nenhum cliente cadastrado</p>
                    <p className="cat-empty-desc">
                      Clique em "Novo cliente" para adicionar o primeiro.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && clientes.map(cli => (
              <tr key={cli.clienteId}>
                <td>
                  <div className="cli-name-cell">
                    <div className="cli-avatar">
                      {cli.nome.trim().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="cli-name">{cli.nome}</span>
                      {cli.email && <p className="cli-email">{cli.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="cli-doc">{cli.documento || <span className="cli-empty-field">—</span>}</td>
                <td className="cli-tel">{cli.telefone || <span className="cli-empty-field">—</span>}</td>
                <td className="cli-cidade">
                  {cli.cidade
                    ? <>{cli.cidade}{cli.uf && <span className="cli-uf"> · {cli.uf}</span>}</>
                    : <span className="cli-empty-field">—</span>}
                </td>
                <td>
                  <div className="cat-row-actions">
                    <button
                      className="cat-action-btn"
                      title="Visualizar"
                      aria-label={`Visualizar ${cli.nome}`}
                      onClick={() => setViewing(cli)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="cat-action-btn"
                      title="Editar"
                      aria-label={`Editar ${cli.nome}`}
                      onClick={() => setEditing(cli)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="cat-action-btn cat-action-btn--danger"
                      title="Excluir"
                      aria-label={`Excluir ${cli.nome}`}
                      onClick={() => setDeleting(cli)}
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
        <VisualizarClienteModal
          cliente={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Modal novo */}
      {showModal && (
        <NovoClienteModal
          onClose={() => setShowModal(false)}
          onCreated={fetchClientes}
        />
      )}

      {/* Modal editar */}
      {editing && (
        <EditarClienteModal
          cliente={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchClientes}
        />
      )}

      {/* Confirm delete */}
      {deleting && (
        <ConfirmDialog
          title={`Excluir "${deleting.nome}"?`}
          description="Esta ação não pode ser desfeita. O cliente será removido permanentemente."
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

    </AdminLayout>
  );
};

export default Cliente;
