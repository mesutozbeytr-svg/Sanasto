import { BookOpenCheck } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  text: string;
}

export default function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <BookOpenCheck className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-slate-600">{text}</p>
    </div>
  );
}
