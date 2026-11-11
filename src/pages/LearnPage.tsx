import { useMemo, useState, type FormEvent } from 'react';
import { ChevronRight, Pencil, Plus, Sparkles, X } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';
import LearningBattery from '@/components/LearningBattery';
import Modal from '@/components/Modal';
import { useLibrary } from '@/contexts/LibraryContext';
import { describeError } from '@/lib/errors';
import { getLearningProgress } from '@/lib/learningProgress';
import { DEFAULT_CATEGORY_NAMES, type Category } from '@/lib/vocabulary';
import CategoryDetailPage from '@/pages/CategoryDetailPage';

interface LearnPageProps {
  initialCategoryId?: string | null;
}

const DRAG_MIME = 'text/category-id';

export default function LearnPage({ initialCategoryId = null }: LearnPageProps) {
  const {
    categories,
    words,
    addCategory,
    renameCategory,
    deleteCategory,
    seedDefaultCategories,
    reorderCategories,
  } = useLibrary();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const wordsByCategory = useMemo(() => {
    const grouped = new Map<string, typeof words>();
    for (const word of words) {
      if (!word.category_id) continue;
      const list = grouped.get(word.category_id) ?? [];
      list.push(word);
      grouped.set(word.category_id, list);
    }
    return grouped;
  }, [words]);

  const uncategorizedWords = useMemo(() => words.filter((word) => !word.category_id), [words]);

  const UNCAT_ID = '__uncategorized__';
  const selectedCategory: Category | null = selectedCategoryId
    ? selectedCategoryId === UNCAT_ID
      ? { id: UNCAT_ID, name: 'Kategorisiz kelimeler', position: -1, created_at: '' }
      : categories.find((category) => category.id === selectedCategoryId) ?? null
    : null;

  const existingNames = new Set(categories.map((category) => category.name.toLocaleLowerCase('tr-TR')));
  const missingDefaults = DEFAULT_CATEGORY_NAMES.filter(
    (name) => !existingNames.has(name.toLocaleLowerCase('tr-TR')),
  ).length;

  const runAction = async (action: () => Promise<unknown>): Promise<boolean> => {
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    }
  };

  const handleAddCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (await runAction(() => addCategory(name))) {
      setNewCategory('');
      setShowAddForm(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    await runAction(() => seedDefaultCategories());
    setIsSeeding(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteCategory(pendingDelete.id);
    setPendingDelete(null);
    setEditingCategory(null);
  };

  const handleDragStart = (event: React.DragEvent, categoryId: string) => {
    setDraggedId(categoryId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_MIME, categoryId);
  };

  const handleDragOver = (event: React.DragEvent, categoryId: string) => {
    if (!draggedId || draggedId === categoryId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetId(categoryId);
  };

  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    const sourceId = draggedId;
    setDraggedId(null);
    setDropTargetId(null);
    if (!sourceId || sourceId === targetId) return;
    const ids = categories.map((category) => category.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    void runAction(() => reorderCategories(ids));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const pendingDeleteMessage = (() => {
    if (!pendingDelete) return '';
    const count = wordsByCategory.get(pendingDelete.id)?.length ?? 0;
    const wordNote =
      count > 0
        ? `Bu kategorideki ${count} kelime silinmez, yalnızca kategori bilgisi temizlenir.`
        : 'Bu kategoride kelime yok.';
    return `"${pendingDelete.name}" kategorisi silinecek. ${wordNote}`;
  })();

  if (selectedCategory) {
    return (
      <CategoryDetailPage
        category={selectedCategory}
        onBack={() => setSelectedCategoryId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Öğren</h1>
          <p className="mt-1 text-sm text-slate-600">
            Bir kategori seçin, kelimelerini inceleyin ve oyunlarla pekiştirin.
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        {showAddForm ? (
          <form onSubmit={handleAddCategory} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              maxLength={80}
              placeholder="Yeni kategori adı"
              aria-label="Yeni kategori adı"
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewCategory(''); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" /> Vazgeç
              </button>
              <button
                type="submit"
                disabled={!newCategory.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-40"
              >
                <Plus className="h-5 w-5" /> Ekle
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-8 py-3 font-semibold text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-100 hover:shadow-md sm:w-auto"
            >
              <Plus className="h-5 w-5" /> Kategori ekle
            </button>
          </div>
        )}

        {missingDefaults > 0 && (
          <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900">
              Hazır konu listesinde {missingDefaults} kategori henüz yok. İsterseniz hepsini tek seferde ekleyebilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> {isSeeding ? 'Ekleniyor...' : 'Hazır listeyi ekle'}
            </button>
          </div>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      </section>

      {categories.length === 0 ? (
        <EmptyState
          title="Henüz kategori yok"
          text="Yukarıdan kendi kategorinizi ekleyin ya da hazır konu listesini tek seferde ekleyin."
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Kategorileri sıralamak için bir kategoriye basılı tutup yukarı veya aşağı sürükleyin.
          </p>

          <div className="grid gap-3">
            {categories.map((category) => {
              const categoryWords = wordsByCategory.get(category.id) ?? [];
              const progress = getLearningProgress(categoryWords);
              const isDragged = draggedId === category.id;
              const isDropTarget = dropTargetId === category.id && !isDragged;
              return (
                <article
                  key={category.id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, category.id)}
                  onDragOver={(event) => handleDragOver(event, category.id)}
                  onDrop={(event) => handleDrop(event, category.id)}
                  onDragEnd={handleDragEnd}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                    isDragged ? 'opacity-40' : isDropTarget ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className="flex min-w-0 flex-1 flex-col gap-2 px-5 py-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-900">{category.name}</h3>
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                      </div>
                      <LearningBattery progress={progress} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(category)}
                      aria-label={`${category.name} kategorisini düzenle`}
                      className="flex shrink-0 items-center border-l border-slate-100 px-3 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {uncategorizedWords.length > 0 && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(UNCAT_ID)}
                className="flex min-w-0 w-full flex-col gap-2 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-bold text-slate-900">Kategorisiz kelimeler</h3>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <LearningBattery progress={getLearningProgress(uncategorizedWords)} />
              </button>
            </article>
          )}
        </>
      )}

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onRename={(name) => renameCategory(editingCategory.id, name)}
          onRequestDelete={() => setPendingDelete(editingCategory)}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Kategoriyi sil"
          message={pendingDeleteMessage}
          confirmLabel="Evet, sil"
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function CategoryEditModal({
  category,
  onRename,
  onRequestDelete,
  onClose,
}: {
  category: Category;
  onRename: (name: string) => Promise<void>;
  onRequestDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Ad boş bırakılamaz.');
      return;
    }
    if (trimmed === category.name) {
      onClose();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onRename(trimmed);
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Kategoriyi düzenle" onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="cat-edit-name">Kategori adı</label>
          <input
            id="cat-edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoFocus
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
          >
            Kategoriyi sil
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-blue-700 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
