import { useState, type FormEvent } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { describeError } from '@/lib/errors';

interface InlineNameEditorProps {
  value: string;
  label: string;
  onSave: (name: string) => Promise<void>;
  textClassName?: string;
}

export default function InlineNameEditor({ value, label, onSave, textClassName = 'font-semibold text-slate-900' }: InlineNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setDraft(value);
    setError(null);
    setIsEditing(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) {
      setError('Ad boş bırakılamaz.');
      return;
    }
    if (name === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(name);
      setIsEditing(false);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className={`truncate ${textClassName}`}>{value}</span>
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${label} adını düzenle`}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={80}
          aria-label={`${label} yeni adı`}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={isSaving}
          aria-label="Kaydet"
          className="shrink-0 rounded-lg bg-blue-700 p-2 text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          aria-label="Vazgeç"
          className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </form>
  );
}
