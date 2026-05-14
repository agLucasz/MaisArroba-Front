import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title, description, confirmLabel = 'Excluir', loading, onConfirm, onCancel,
}) => (
  <div
    className="confirm-overlay"
    onClick={e => { if (e.target === e.currentTarget && !loading) onCancel(); }}
  >
    <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-icon">
        <AlertTriangle size={22} />
      </div>
      <p className="confirm-title" id="confirm-title">{title}</p>
      <p className="confirm-desc">{description}</p>
      <div className="confirm-actions">
        <button className="btn-ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button className="btn-danger-sm" onClick={onConfirm} disabled={loading}>
          {loading ? 'Excluindo…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
