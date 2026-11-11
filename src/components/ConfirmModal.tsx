import { useState } from 'react';
import Modal from '@/components/Modal';
import { describeError } from '@/lib/errors';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsWorking(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(describeError(err));
      setIsWorking(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} maxWidthClass="max-w-md">
      <p className="text-slate-700">{message}</p>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isWorking}
          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isWorking}
          className={`rounded-xl px-5 py-3 font-semibold text-white transition disabled:opacity-50 ${
            tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-700 hover:bg-blue-800'
          }`}
        >
          {isWorking ? (tone === 'danger' ? 'Siliniyor...' : 'Lütfen bekleyin...') : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
