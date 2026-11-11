import { useState } from 'react';
import EmptyState from '@/components/EmptyState';
import WordCard from '@/components/WordCard';
import WordFormModal from '@/components/WordFormModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useLibrary } from '@/contexts/LibraryContext';
import type { Word } from '@/lib/vocabulary';

interface WordListProps {
  words: Word[];
  emptyTitle: string;
  emptyText: string;
}

export default function WordList({ words, emptyTitle, emptyText }: WordListProps) {
  const { deleteWord } = useLibrary();
  const [editing, setEditing] = useState<Word | null>(null);
  const [deleting, setDeleting] = useState<Word | null>(null);

  if (words.length === 0) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {words.map((word) => (
          <WordCard key={word.id} word={word} onEdit={setEditing} onDelete={setDeleting} />
        ))}
      </div>

      {editing && <WordFormModal key={editing.id} word={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmModal
          title="Kelimeyi sil"
          message={`"${deleting.finnish}" kelimesi kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
          confirmLabel="Evet, sil"
          onConfirm={() => deleteWord(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
