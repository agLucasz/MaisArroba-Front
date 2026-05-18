import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search, Tag, Trash2, Pencil, X, Plus, ImagePlus, Loader2, Eye,
  Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';
import AdminLayout from '../../../Components/Admin/AdminLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import {
  type ProdutoDTO,
  createProduto,
  updateProduto,
  deleteProduto,
  getProdutos,
  uploadImagem,
} from '../../../Services/produtoService';
import { getCategorias, type CategoriaDTO } from '../../../Services/categoriaService';
import '../../../Styles/Admin/produto.css';

/* ── Helpers ── */

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getStockClass(quantidade: number): string {
  if (quantidade === 0) return 'prod-stock--zero';
  if (quantidade <= 15) return 'prod-stock--low';
  return 'prod-stock--ok';
}

function getStatus(produto: ProdutoDTO): { label: string; cls: string } {
  if (!produto.ativo)            return { label: 'Rascunho',      cls: 'prod-badge--rascunho' };
  if (produto.quantidade === 0)  return { label: 'Sem estoque',   cls: 'prod-badge--semestoque' };
  if (produto.quantidade <= 15)  return { label: 'Estoque baixo', cls: 'prod-badge--estoquelow' };
  return { label: 'Ativo', cls: 'prod-badge--ativo' };
}

/* ── Image slots (create) ── */

const MAX_IMAGES = 4;
const ACCEPTED   = 'image/jpg,image/jpeg,image/png,image/webp';

interface ImageSlot {
  file: File;
  preview: string;
}

interface ImageSlotsProps {
  slots: ImageSlot[];
  uploading: boolean;
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

const ImageSlots: React.FC<ImageSlotsProps> = ({ slots, uploading, onAdd, onRemove, onReorder }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx  = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onAdd(e.target.files);
    e.target.value = '';
  };

  const canAdd = slots.length < MAX_IMAGES && !uploading;

  return (
    <div className="modal-field">
      <span className="modal-label">
        Imagens
        {slots.length > 1 && !uploading && (
          <span className="img-reorder-hint"> · arraste para reordenar</span>
        )}
      </span>
      <div className="img-slots">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`img-slot img-slot--filled${overIdx === i ? ' img-slot--drop-here' : ''}`}
            draggable={!uploading && slots.length > 1}
            onDragStart={e => { dragIdx.current = i; e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={e => { e.preventDefault(); if (dragIdx.current !== i) setOverIdx(i); }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={e => {
              e.preventDefault();
              if (dragIdx.current !== null && dragIdx.current !== i) onReorder(dragIdx.current, i);
              dragIdx.current = null;
              setOverIdx(null);
            }}
            onDragEnd={() => { dragIdx.current = null; setOverIdx(null); }}
          >
            <img src={slot.preview} alt={`Imagem ${i + 1}`} />
            <span className="img-slot-num">{i + 1}</span>
            {!uploading && (
              <button
                type="button"
                className="img-slot-remove"
                onClick={() => onRemove(i)}
                aria-label={`Remover imagem ${i + 1}`}
              >
                <X size={12} />
              </button>
            )}
            {uploading && (
              <div className="img-slot-uploading">
                <Loader2 size={16} className="img-slot-spinner" />
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            className="img-slot img-slot--empty"
            onClick={() => inputRef.current?.click()}
            aria-label="Adicionar imagem"
          >
            <ImagePlus size={20} />
          </button>
        )}

        {Array.from({ length: Math.max(0, MAX_IMAGES - slots.length - (canAdd ? 1 : 0)) }).map((_, i) => (
          <div key={`ph-${i}`} className="img-slot img-slot--placeholder" />
        ))}
      </div>
      <p className="img-slots-hint">
        PNG, JPG ou WebP · até {MAX_IMAGES} imagens · 5 MB por arquivo
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />
    </div>
  );
};

/* ── Edit image slots (existing URLs + new files) ── */

type EditImageEntry =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; preview: string };

interface EditImageSlotsProps {
  entries: EditImageEntry[];
  uploading: boolean;
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

const EditImageSlots: React.FC<EditImageSlotsProps> = ({ entries, uploading, onAdd, onRemove, onReorder }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx  = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onAdd(e.target.files);
    e.target.value = '';
  };

  const canAdd = entries.length < MAX_IMAGES && !uploading;

  return (
    <div className="modal-field">
      <span className="modal-label">
        Imagens
        {entries.length > 1 && !uploading && (
          <span className="img-reorder-hint"> · arraste para reordenar</span>
        )}
      </span>
      <div className="img-slots">
        {entries.map((entry, i) => {
          const preview = entry.kind === 'existing' ? entry.url : entry.preview;
          return (
            <div
              key={i}
              className={`img-slot img-slot--filled${overIdx === i ? ' img-slot--drop-here' : ''}`}
              draggable={!uploading && entries.length > 1}
              onDragStart={e => { dragIdx.current = i; e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={e => { e.preventDefault(); if (dragIdx.current !== i) setOverIdx(i); }}
              onDragLeave={() => setOverIdx(null)}
              onDrop={e => {
                e.preventDefault();
                if (dragIdx.current !== null && dragIdx.current !== i) onReorder(dragIdx.current, i);
                dragIdx.current = null;
                setOverIdx(null);
              }}
              onDragEnd={() => { dragIdx.current = null; setOverIdx(null); }}
            >
              <img src={preview} alt={`Imagem ${i + 1}`} />
              <span className="img-slot-num">{i + 1}</span>
              {!uploading && (
                <button
                  type="button"
                  className="img-slot-remove"
                  onClick={() => onRemove(i)}
                  aria-label={`Remover imagem ${i + 1}`}
                >
                  <X size={12} />
                </button>
              )}
              {uploading && entry.kind === 'new' && (
                <div className="img-slot-uploading">
                  <Loader2 size={16} className="img-slot-spinner" />
                </div>
              )}
            </div>
          );
        })}

        {canAdd && (
          <button
            type="button"
            className="img-slot img-slot--empty"
            onClick={() => inputRef.current?.click()}
            aria-label="Adicionar imagem"
          >
            <ImagePlus size={20} />
          </button>
        )}

        {Array.from({ length: Math.max(0, MAX_IMAGES - entries.length - (canAdd ? 1 : 0)) }).map((_, i) => (
          <div key={`ph-${i}`} className="img-slot img-slot--placeholder" />
        ))}
      </div>
      <p className="img-slots-hint">
        PNG, JPG ou WebP · até {MAX_IMAGES} imagens · 5 MB por arquivo
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />
    </div>
  );
};

/* ── Rich Text Editor ── */

const RTE_TOOLS = [
  { cmd: 'bold',                icon: <Bold size={13} />,         title: 'Negrito (Ctrl+B)' },
  { cmd: 'italic',              icon: <Italic size={13} />,       title: 'Itálico (Ctrl+I)' },
  { cmd: 'sep' },
  { cmd: 'insertUnorderedList', icon: <List size={13} />,         title: 'Lista com marcadores' },
  { cmd: 'insertOrderedList',   icon: <ListOrdered size={13} />,  title: 'Lista numerada' },
  { cmd: 'sep' },
  { cmd: 'justifyLeft',         icon: <AlignLeft size={13} />,    title: 'Alinhar à esquerda' },
  { cmd: 'justifyCenter',       icon: <AlignCenter size={13} />,  title: 'Centralizar' },
  { cmd: 'justifyRight',        icon: <AlignRight size={13} />,   title: 'Alinhar à direita' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef    = useRef<HTMLDivElement>(null);
  const initialised  = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialised.current) {
      editorRef.current.innerHTML = value;
      initialised.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, undefined);
  };

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        {RTE_TOOLS.map((t, i) =>
          t.cmd === 'sep'
            ? <div key={i} className="rte-sep" />
            : (
              <button
                key={i}
                type="button"
                className="rte-btn"
                title={t.title}
                onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              >
                {t.icon}
              </button>
            )
        )}
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
      />
    </div>
  );
};

/* ── Novo Produto Modal ── */

interface ModalProps {
  categorias: CategoriaDTO[];
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = {
  nomeProduto: '',
  descricao: '',
  embalagem: '',
  valorCompra: '',
  valorVenda: '',
  quantidade: '',
  categoriaId: '',
  ativo: true,
  freteHabilitado: true,
  peso: '',
  altura: '',
  largura: '',
  comprimento: '',
};

const NovoProdutoModal: React.FC<ModalProps> = ({ categorias, onClose, onCreated }) => {
  const [form, setForm]           = useState(emptyForm);
  const [slots, setSlots]         = useState<ImageSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const firstRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  useEffect(() => {
    return () => slots.forEach(s => URL.revokeObjectURL(s.preview));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading && !uploading) onClose();
  };

  const handleAddImages = (files: FileList) => {
    const remaining = MAX_IMAGES - slots.length;
    const added = Array.from(files).slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSlots(prev => [...prev, ...added]);
  };

  const handleRemoveImage = (index: number) => {
    setSlots(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReorderImages = (from: number, to: number) => {
    setSlots(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const catId = Number(form.categoriaId);
    if (!form.nomeProduto.trim()) { setError('Informe o nome do produto.'); return; }
    if (!catId)                   { setError('Selecione uma categoria.'); return; }
    if (!form.embalagem.trim())   { setError('Informe a embalagem.'); return; }

    setError('');

    let imagemUrls: string[] = [];
    if (slots.length > 0) {
      setUploading(true);
      try {
        imagemUrls = await Promise.all(slots.map(s => uploadImagem(s.file)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar imagens.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setLoading(true);
    try {
      await createProduto({
        nomeProduto:     form.nomeProduto.trim(),
        descricao:       form.descricao.trim() || undefined,
        imagemUrls,
        quantidade:      Number(form.quantidade) || 0,
        embalagem:       form.embalagem.trim(),
        valorCompra:     parseFloat(form.valorCompra) || 0,
        valorVenda:      parseFloat(form.valorVenda) || 0,
        categoriaIds:    [catId],
        ativo:           form.ativo,
        freteHabilitado: form.freteHabilitado,
        peso:            parseFloat(form.peso) || 0,
        altura:          parseFloat(form.altura) || 0,
        largura:         parseFloat(form.largura) || 0,
        comprimento:     parseFloat(form.comprimento) || 0,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto.');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || uploading;

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal-lg" role="dialog" aria-modal="true" aria-labelledby="prod-modal-title">

        <div className="modal-lg-header">
          <p className="modal-lg-title" id="prod-modal-title">Novo produto</p>
          <button className="modal-close-btn" onClick={onClose} disabled={busy} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-lg-body--cols">

            {/* ── Coluna esquerda: dados do produto ── */}
            <div className="modal-col modal-col--left">

              <div className="modal-field">
                <label className="modal-label" htmlFor="p-nome">Nome do produto</label>
                <input
                  ref={firstRef}
                  id="p-nome"
                  className="modal-input"
                  type="text"
                  placeholder="Ex.: MaisArroba Pasto Premium"
                  value={form.nomeProduto}
                  onChange={set('nomeProduto')}
                  maxLength={150}
                />
              </div>

              <div className="modal-row modal-row-2">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="p-cat">Categoria</label>
                  <select
                    id="p-cat"
                    className="modal-input modal-input--select"
                    value={form.categoriaId}
                    onChange={set('categoriaId')}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(c => (
                      <option key={c.categoriaId} value={c.categoriaId}>{c.nomeCategoria}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="p-embalagem">Embalagem</label>
                  <input
                    id="p-embalagem"
                    className="modal-input"
                    type="text"
                    placeholder="Ex.: 30 kg"
                    value={form.embalagem}
                    onChange={set('embalagem')}
                  />
                </div>
              </div>

              <div className="modal-row modal-row-3">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="p-compra">Preço de compra</label>
                  <input
                    id="p-compra"
                    className="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valorCompra}
                    onChange={set('valorCompra')}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="p-venda">Preço de venda</label>
                  <input
                    id="p-venda"
                    className="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valorVenda}
                    onChange={set('valorVenda')}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="p-qtd">Estoque</label>
                  <input
                    id="p-qtd"
                    className="modal-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.quantidade}
                    onChange={set('quantidade')}
                  />
                </div>
              </div>

              <div className="modal-field">
                <span className="modal-label">Frete</span>
                <label className="frete-toggle">
                  <input
                    type="checkbox"
                    className="prod-check"
                    checked={form.freteHabilitado}
                    onChange={e => setForm(prev => ({ ...prev, freteHabilitado: e.target.checked }))}
                  />
                  <span className="frete-toggle-text">Habilitar cálculo de frete para este produto</span>
                </label>
              </div>

              <div className={`frete-fields${!form.freteHabilitado ? ' frete-fields--disabled' : ''}`}>
                <div className="modal-row modal-row-2">
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="p-peso">Peso (kg)</label>
                    <input
                      id="p-peso"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="0.500"
                      value={form.peso}
                      onChange={set('peso')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="p-altura">Altura (cm)</label>
                    <input
                      id="p-altura"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="15"
                      value={form.altura}
                      onChange={set('altura')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                </div>

                <div className="modal-row modal-row-2">
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="p-largura">Largura (cm)</label>
                    <input
                      id="p-largura"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="11"
                      value={form.largura}
                      onChange={set('largura')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="p-comprimento">Comprimento (cm)</label>
                    <input
                      id="p-comprimento"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="20"
                      value={form.comprimento}
                      onChange={set('comprimento')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-field">
                <span className="modal-label">Status</span>
                <div className="status-options">
                  <button
                    type="button"
                    className={`status-option${form.ativo ? ' status-option--active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, ativo: true }))}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    className={`status-option${!form.ativo ? ' status-option--active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, ativo: false }))}
                  >
                    Rascunho
                  </button>
                </div>
              </div>

              {error && <div className="modal-error" role="alert">{error}</div>}
            </div>

            {/* ── Coluna direita: descrição e imagens ── */}
            <div className="modal-col modal-col--right">

              <div className="modal-field">
                <label className="modal-label">Descrição</label>
                <RichTextEditor
                  value={form.descricao}
                  onChange={html => setForm(prev => ({ ...prev, descricao: html }))}
                  placeholder="Descrição comercial do produto..."
                />
              </div>

              <ImageSlots
                slots={slots}
                uploading={uploading}
                onAdd={handleAddImages}
                onRemove={handleRemoveImage}
                onReorder={handleReorderImages}
              />

            </div>
          </div>

          <div className="modal-lg-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-sm" disabled={busy}>
              {uploading ? 'Enviando imagens…' : loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Editar Produto Modal ── */

interface EditProdutoModalProps {
  produto: ProdutoDTO;
  categorias: CategoriaDTO[];
  onClose: () => void;
  onSaved: () => void;
}

const EditarProdutoModal: React.FC<EditProdutoModalProps> = ({ produto, categorias, onClose, onSaved }) => {
  const [form, setForm] = useState({
    nomeProduto:     produto.nomeProduto,
    descricao:       produto.descricao ?? '',
    embalagem:       produto.embalagem,
    valorCompra:     produto.valorCompra.toString(),
    valorVenda:      produto.valorVenda.toString(),
    quantidade:      produto.quantidade.toString(),
    categoriaId:     produto.categoriaIds[0]?.toString() ?? '',
    ativo:           produto.ativo,
    freteHabilitado: produto.freteHabilitado,
    peso:            produto.peso?.toString() ?? '0',
    altura:          produto.altura?.toString() ?? '0',
    largura:         produto.largura?.toString() ?? '0',
    comprimento:     produto.comprimento?.toString() ?? '0',
  });
  const [entries, setEntries]     = useState<EditImageEntry[]>(
    produto.imagemUrls.map(url => ({ kind: 'existing', url }))
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const firstRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  useEffect(() => {
    return () => {
      entries.forEach(e => { if (e.kind === 'new') URL.revokeObjectURL(e.preview); });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading && !uploading) onClose();
  };

  const handleAddImages = (files: FileList) => {
    const remaining = MAX_IMAGES - entries.length;
    const added: EditImageEntry[] = Array.from(files).slice(0, remaining).map(file => ({
      kind: 'new',
      file,
      preview: URL.createObjectURL(file),
    }));
    setEntries(prev => [...prev, ...added]);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries(prev => {
      const entry = prev[index];
      if (entry.kind === 'new') URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReorderEntries = (from: number, to: number) => {
    setEntries(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const catId = Number(form.categoriaId);
    if (!form.nomeProduto.trim()) { setError('Informe o nome do produto.'); return; }
    if (!catId)                   { setError('Selecione uma categoria.'); return; }
    if (!form.embalagem.trim())   { setError('Informe a embalagem.'); return; }

    setError('');

    const newEntries = entries.filter((e): e is Extract<EditImageEntry, { kind: 'new' }> => e.kind === 'new');

    let uploadedUrls: string[] = [];
    if (newEntries.length > 0) {
      setUploading(true);
      try {
        uploadedUrls = await Promise.all(newEntries.map(e => uploadImagem(e.file)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar imagens.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Preserva a ordem definida pelo drag-and-drop
    let newIdx = 0;
    const imagemUrls = entries.map(e =>
      e.kind === 'existing' ? e.url : uploadedUrls[newIdx++]);

    setLoading(true);
    try {
      await updateProduto(produto.produtoId, {
        nomeProduto:     form.nomeProduto.trim(),
        descricao:       form.descricao.trim() || undefined,
        imagemUrls,
        quantidade:      Number(form.quantidade) || 0,
        embalagem:       form.embalagem.trim(),
        valorCompra:     parseFloat(form.valorCompra) || 0,
        valorVenda:      parseFloat(form.valorVenda) || 0,
        categoriaIds:    [catId],
        ativo:           form.ativo,
        freteHabilitado: form.freteHabilitado,
        peso:            parseFloat(form.peso) || 0,
        altura:          parseFloat(form.altura) || 0,
        largura:         parseFloat(form.largura) || 0,
        comprimento:     parseFloat(form.comprimento) || 0,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto.');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || uploading;

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal-lg" role="dialog" aria-modal="true" aria-labelledby="prod-edit-title">

        <div className="modal-lg-header">
          <p className="modal-lg-title" id="prod-edit-title">Editar produto</p>
          <button className="modal-close-btn" onClick={onClose} disabled={busy} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-lg-body--cols">

            {/* ── Coluna esquerda: dados do produto ── */}
            <div className="modal-col modal-col--left">

              <div className="modal-field">
                <label className="modal-label" htmlFor="pe-nome">Nome do produto</label>
                <input
                  ref={firstRef}
                  id="pe-nome"
                  className="modal-input"
                  type="text"
                  value={form.nomeProduto}
                  onChange={set('nomeProduto')}
                  maxLength={150}
                />
              </div>

              <div className="modal-row modal-row-2">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="pe-cat">Categoria</label>
                  <select
                    id="pe-cat"
                    className="modal-input modal-input--select"
                    value={form.categoriaId}
                    onChange={set('categoriaId')}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(c => (
                      <option key={c.categoriaId} value={c.categoriaId}>{c.nomeCategoria}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="pe-embalagem">Embalagem</label>
                  <input
                    id="pe-embalagem"
                    className="modal-input"
                    type="text"
                    value={form.embalagem}
                    onChange={set('embalagem')}
                  />
                </div>
              </div>

              <div className="modal-row modal-row-3">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="pe-compra">Preço de compra</label>
                  <input
                    id="pe-compra"
                    className="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valorCompra}
                    onChange={set('valorCompra')}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="pe-venda">Preço de venda</label>
                  <input
                    id="pe-venda"
                    className="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valorVenda}
                    onChange={set('valorVenda')}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="pe-qtd">Estoque</label>
                  <input
                    id="pe-qtd"
                    className="modal-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantidade}
                    onChange={set('quantidade')}
                  />
                </div>
              </div>

              <div className="modal-field">
                <span className="modal-label">Frete</span>
                <label className="frete-toggle">
                  <input
                    type="checkbox"
                    className="prod-check"
                    checked={form.freteHabilitado}
                    onChange={e => setForm(prev => ({ ...prev, freteHabilitado: e.target.checked }))}
                  />
                  <span className="frete-toggle-text">Habilitar cálculo de frete para este produto</span>
                </label>
              </div>

              <div className={`frete-fields${!form.freteHabilitado ? ' frete-fields--disabled' : ''}`}>
                <div className="modal-row modal-row-2">
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="pe-peso">Peso (kg)</label>
                    <input
                      id="pe-peso"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="0.500"
                      value={form.peso}
                      onChange={set('peso')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="pe-altura">Altura (cm)</label>
                    <input
                      id="pe-altura"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="15"
                      value={form.altura}
                      onChange={set('altura')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                </div>

                <div className="modal-row modal-row-2">
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="pe-largura">Largura (cm)</label>
                    <input
                      id="pe-largura"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="11"
                      value={form.largura}
                      onChange={set('largura')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="pe-comprimento">Comprimento (cm)</label>
                    <input
                      id="pe-comprimento"
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="20"
                      value={form.comprimento}
                      onChange={set('comprimento')}
                      disabled={!form.freteHabilitado}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-field">
                <span className="modal-label">Status</span>
                <div className="status-options">
                  <button
                    type="button"
                    className={`status-option${form.ativo ? ' status-option--active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, ativo: true }))}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    className={`status-option${!form.ativo ? ' status-option--active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, ativo: false }))}
                  >
                    Rascunho
                  </button>
                </div>
              </div>

              {error && <div className="modal-error" role="alert">{error}</div>}
            </div>

            {/* ── Coluna direita: descrição e imagens ── */}
            <div className="modal-col modal-col--right">

              <div className="modal-field">
                <label className="modal-label">Descrição</label>
                <RichTextEditor
                  value={form.descricao}
                  onChange={html => setForm(prev => ({ ...prev, descricao: html }))}
                />
              </div>

              <EditImageSlots
                entries={entries}
                uploading={uploading}
                onAdd={handleAddImages}
                onRemove={handleRemoveEntry}
                onReorder={handleReorderEntries}
              />

            </div>
          </div>

          <div className="modal-lg-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-sm" disabled={busy}>
              {uploading ? 'Enviando imagens…' : loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ── Visualizar Produto Modal ── */

interface VisualizarProdutoModalProps {
  produto: ProdutoDTO;
  categorias: CategoriaDTO[];
  onClose: () => void;
}

const VisualizarProdutoModal: React.FC<VisualizarProdutoModalProps> = ({ produto, categorias, onClose }) => {
  const catNome = categorias.find(c => c.categoriaId === produto.categoriaIds[0])?.nomeCategoria ?? produto.categorias[0] ?? '—';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-lg" role="dialog" aria-modal="true" aria-labelledby="view-prod-title">

        <div className="modal-lg-header">
          <p className="modal-lg-title" id="view-prod-title">Detalhes do produto</p>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>

        <div className="modal-lg-body">

          <div className="modal-field">
            <label className="modal-label">Nome do produto</label>
            <input className="modal-input" type="text" value={produto.nomeProduto} readOnly />
          </div>

          <div className="modal-row modal-row-2">
            <div className="modal-field">
              <label className="modal-label">Categoria</label>
              <input className="modal-input" type="text" value={catNome} readOnly />
            </div>
            <div className="modal-field">
              <label className="modal-label">Embalagem</label>
              <input className="modal-input" type="text" value={produto.embalagem} readOnly />
            </div>
          </div>

          <div className="modal-row modal-row-3">
            <div className="modal-field">
              <label className="modal-label">Preço de compra</label>
              <input className="modal-input" type="text" value={formatBRL(produto.valorCompra)} readOnly />
            </div>
            <div className="modal-field">
              <label className="modal-label">Preço de venda</label>
              <input className="modal-input" type="text" value={formatBRL(produto.valorVenda)} readOnly />
            </div>
            <div className="modal-field">
              <label className="modal-label">Estoque</label>
              <input className="modal-input" type="text" value={`${produto.quantidade} un`} readOnly />
            </div>
          </div>

          <div className="modal-row modal-row-4">
            <div className="modal-field">
              <label className="modal-label">Peso</label>
              <input className="modal-input" type="text" value={`${produto.peso ?? 0} kg`} readOnly />
            </div>
            <div className="modal-field">
              <label className="modal-label">Altura</label>
              <input className="modal-input" type="text" value={`${produto.altura ?? 0} cm`} readOnly />
            </div>
            <div className="modal-field">
              <label className="modal-label">Largura</label>
              <input className="modal-input" type="text" value={`${produto.largura ?? 0} cm`} readOnly />
            </div>
            <div className="modal-field">
              <label className="modal-label">Comprimento</label>
              <input className="modal-input" type="text" value={`${produto.comprimento ?? 0} cm`} readOnly />
            </div>
          </div>

          {produto.descricao && (
            <div className="modal-field">
              <label className="modal-label">Descrição</label>
              <textarea className="modal-textarea" value={produto.descricao} readOnly />
            </div>
          )}

          {produto.imagemUrls.length > 0 && (
            <div className="modal-field">
              <span className="modal-label">Imagens</span>
              <div className="img-slots">
                {produto.imagemUrls.map((url, i) => (
                  <div key={i} className="img-slot img-slot--filled">
                    <img src={url} alt={`Imagem ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-field">
            <span className="modal-label">Status</span>
            <div className="status-options">
              <button type="button" className={`status-option${produto.ativo ? ' status-option--active' : ''}`} disabled>Ativo</button>
              <button type="button" className={`status-option${!produto.ativo ? ' status-option--active' : ''}`} disabled>Rascunho</button>
            </div>
          </div>

        </div>

        <div className="modal-lg-footer">
          <button className="btn-primary-sm" onClick={onClose}>Fechar</button>
        </div>

      </div>
    </div>
  );
};

/* ── Skeleton ── */

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}>
        <td className="col-check"><div className="prod-skeleton-line" style={{ width: 16, height: 16, borderRadius: 4 }} /></td>
        <td><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="prod-skeleton-line" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="prod-skeleton-line" style={{ width: '65%', marginBottom: 6 }} />
            <div className="prod-skeleton-line" style={{ width: '35%', height: 10 }} />
          </div>
        </div></td>
        <td><div className="prod-skeleton-line" style={{ width: '80%' }} /></td>
        <td><div className="prod-skeleton-line" style={{ width: 70, marginLeft: 'auto' }} /></td>
        <td><div className="prod-skeleton-line" style={{ width: 50, marginLeft: 'auto' }} /></td>
        <td><div className="prod-skeleton-line" style={{ width: 60 }} /></td>
        <td />
      </tr>
    ))}
  </>
);

/* ── Page ── */

const Produto: React.FC = () => {
  const [produtos, setProdutos]     = useState<ProdutoDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState<number | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<ProdutoDTO | null>(null);
  const [deleting, setDeleting]     = useState<ProdutoDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewing, setViewing]             = useState<ProdutoDTO | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prods, cats] = await Promise.all([getProdutos(), getCategorias()]);
      setProdutos(prods);
      setCategorias(cats);
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
      await deleteProduto(deleting.produtoId);
      setProdutos(prev => prev.filter(p => p.produtoId !== deleting.produtoId));
      setDeleting(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir produto.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = produtos.filter(p => {
    const matchSearch = p.nomeProduto.toLowerCase().includes(search.toLowerCase());
    const matchTab    = activeTab === null || p.categoriaIds.includes(activeTab);
    return matchSearch && matchTab;
  });

  const countForCat = (catId: number) =>
    produtos.filter(p => p.categoriaIds.includes(catId)).length;

  return (
    <AdminLayout>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">
            {loading
              ? 'Carregando…'
              : `${produtos.length} ${produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'} · ${produtos.filter(p => p.ativo).length} ativos`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} />
            Novo produto
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {/* Toolbar */}
      <div className="prod-toolbar">
        <label className="prod-search">
          <Search size={14} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar produtos"
          />
        </label>

        <div className="prod-tabs">
          <button
            className={`prod-tab${activeTab === null ? ' prod-tab--active' : ''}`}
            onClick={() => setActiveTab(null)}
          >
            Todos
            <span className="prod-tab-count">· {produtos.length}</span>
          </button>
          {categorias.map(cat => {
            const count = countForCat(cat.categoriaId);
            if (count === 0) return null;
            return (
              <button
                key={cat.categoriaId}
                className={`prod-tab${activeTab === cat.categoriaId ? ' prod-tab--active' : ''}`}
                onClick={() => setActiveTab(cat.categoriaId)}
              >
                {cat.nomeCategoria}
                <span className="prod-tab-count">· {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="prod-table-wrap">
        <table className="prod-table">
          <thead>
            <tr>
              <th className="col-check"><input type="checkbox" className="prod-check" aria-label="Selecionar todos" /></th>
              <th>Produto</th>
              <th>Categoria</th>
              <th className="col-preco">Preço</th>
              <th className="col-estoque">Estoque</th>
              <th>Status</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && filtered.length === 0 && !error && (
              <tr>
                <td colSpan={7}>
                  <div className="prod-empty">
                    <div className="prod-empty-icon"><Tag size={22} /></div>
                    <p className="prod-empty-title">
                      {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </p>
                    <p className="prod-empty-desc">
                      {search
                        ? `Sem resultados para "${search}". Tente outro termo.`
                        : 'Clique em "Novo produto" para adicionar o primeiro.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filtered.map(prod => {
              const status = getStatus(prod);
              return (
                <tr key={prod.produtoId}>
                  <td className="col-check">
                    <input type="checkbox" className="prod-check" aria-label={`Selecionar ${prod.nomeProduto}`} />
                  </td>
                  <td>
                    <div className="prod-cell">
                      <div className="prod-thumb">
                        {prod.imagemUrls.length > 0
                          ? <img src={prod.imagemUrls[0]} alt={prod.nomeProduto} />
                          : <div className="prod-thumb-placeholder" />}
                      </div>
                      <div className="prod-info">
                        <p className="prod-name">{prod.nomeProduto}</p>
                        {prod.embalagem && <p className="prod-meta">{prod.embalagem}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prod-cats">
                      {prod.categorias.map(cat => (
                        <span key={cat} className="prod-cat-tag">
                          <span className="prod-cat-dot" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="col-preco">
                    <span className="prod-price">{formatBRL(prod.valorVenda)}</span>
                  </td>
                  <td className="col-estoque">
                    <span className={`prod-stock ${getStockClass(prod.quantidade)}`}>
                      {prod.quantidade} un
                    </span>
                  </td>
                  <td>
                    <span className={`prod-badge ${status.cls}`}>{status.label}</span>
                  </td>
                  <td>
                    <div className="prod-row-actions">
                      <button
                        className="prod-action-btn"
                        title="Visualizar"
                        aria-label={`Visualizar ${prod.nomeProduto}`}
                        onClick={() => setViewing(prod)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="prod-action-btn"
                        title="Editar"
                        aria-label={`Editar ${prod.nomeProduto}`}
                        onClick={() => setEditing(prod)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="prod-action-btn prod-action-btn--danger"
                        title="Excluir"
                        aria-label={`Excluir ${prod.nomeProduto}`}
                        onClick={() => setDeleting(prod)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal visualizar */}
      {viewing && (
        <VisualizarProdutoModal
          produto={viewing}
          categorias={categorias}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Modal novo */}
      {showModal && (
        <NovoProdutoModal
          categorias={categorias}
          onClose={() => setShowModal(false)}
          onCreated={fetchAll}
        />
      )}

      {/* Modal editar */}
      {editing && (
        <EditarProdutoModal
          produto={editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
          onSaved={fetchAll}
        />
      )}

      {/* Confirm delete */}
      {deleting && (
        <ConfirmDialog
          title={`Excluir "${deleting.nomeProduto}"?`}
          description="Esta ação não pode ser desfeita. O produto será removido permanentemente."
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

    </AdminLayout>
  );
};

export default Produto;
