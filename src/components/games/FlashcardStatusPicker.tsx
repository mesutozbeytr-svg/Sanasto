import { useState } from 'react';
import { BookOpen, CheckCircle2, Circle, RotateCw } from 'lucide-react';
import { LEARNING_STATUS_OPTIONS, type LearningStatus } from '@/lib/vocabulary';

const STATUS_ICON: Record<LearningStatus, { Icon: typeof Circle; className: string }> = {
  not_studied: { Icon: Circle, className: 'bg-slate-100 text-slate-600' },
  learning: { Icon: BookOpen, className: 'bg-blue-50 text-blue-700' },
  learned: { Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  review: { Icon: RotateCw, className: 'bg-amber-50 text-amber-700' },
};

interface FlashcardStatusPickerProps {
  status: LearningStatus;
  disabled: boolean;
  onSelect: (status: LearningStatus) => void;
}

export default function FlashcardStatusPicker({ status, disabled, onSelect }: FlashcardStatusPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = LEARNING_STATUS_OPTIONS.find((option) => option.value === status);
  const { Icon, className } = STATUS_ICON[status];

  const handleSelect = (next: LearningStatus) => {
    setIsOpen(false);
    onSelect(next);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-label={`Öğrenme durumu: ${current?.label ?? ''}. Değiştirmek için dokunun`}
        title={current?.label}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 active:scale-95 disabled:opacity-60 ${className}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="group"
          aria-label="Öğrenme durumunu seçin"
          className="animate-modal-in grid w-full max-w-sm grid-cols-2 gap-2"
        >
          {LEARNING_STATUS_OPTIONS.map((option) => {
            const isActive = option.value === status;
            const OptionIcon = STATUS_ICON[option.value].Icon;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelect(option.value)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <OptionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
