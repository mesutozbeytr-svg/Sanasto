import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import ImagePicker, { type PickedImage } from '@/components/ImagePicker';
import Modal from '@/components/Modal';
import WordImage from '@/components/WordImage';
import type { ImageDraft } from '@/components/ImageField';
import { useAuth } from '@/contexts/AuthContext';
import { findDuplicateWords, useLibrary } from '@/contexts/LibraryContext';
import { describeError } from '@/lib/errors';
import { IMAGE_SOURCE_LABELS } from '@/lib/imageSources';
import { uploadWordImage } from '@/lib/imageUpload';
import { type Word, type WordFormValues } from '@/lib/vocabulary';

interface WordFormModalProps {
  word: Word | null;
  onClose: () => void;
  defaultCategoryId?: string | null;
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

export default function WordFormModal({ word, onClose, defaultCategoryId = null }: WordFormModalProps) {
  const { user } = useAuth();
  const { categories, words, saveWord, deleteWord } = useLibrary();

  const [finnish, setFinnish] = useState(word?.finnish ?? '');
  const [turkish, setTurkish] = useState(word?.turkish ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(word?.category_id ?? defaultCategoryId);
  const [exampleFi, setExampleFi] = useState(word?.example_fi ?? '');
  const [exampleTr, setExampleTr] = useState(word?.example_tr ?? '');
  const [grammarNote, setGrammarNote] = useState(word?.grammar_note ?? '');
  const [imageCredit, setImageCredit] = useState(word?.image_credit ?? '');
  const [image, setImage] = useState<ImageDraft>({
    file: null,
    url: word?.image_url ?? null,
    source: word?.image_source ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const duplicates = useMemo(
    () => findDuplicateWords(words, finnish, word?.id ?? null),
    [words, finnish, word],
  );

  useEffect(() => {
    if (!image.file) {
      setFilePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image.file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image.file]);

  const handlePicked = (picked: PickedImage) => {
    setIsPickingImage(false);
    if (!picked.file && !picked.url) {
      setImage({ file: null, url: null, source: null });
      setImageCredit('');
      return;
    }
    setImage({ file: picked.file, url: picked.url, source: picked.source });
    if (picked.credit !== null) setImageCredit(picked.credit);
  };

  const handleRemoveImage = () => {
    setImage({ file: null, url: null, source: null });
    setImageCredit('');
  };

  const persistWord = async () => {
    setIsSaving(true);
    setError(null);
    try {
      let imageUrl = image.url;
      let imageSource = image.source;
      const credit = imageCredit;
      if (image.file) {
        if (!user) throw new Error('Oturum bulunamadı.');
        imageUrl = await uploadWordImage(user.id, image.file);
        imageSource = 'upload';
      }

      const values: WordFormValues = {
        finnish,
        turkish,
        category_id: categoryId,
        image_url: imageUrl,
        image_source: imageUrl ? imageSource : null,
        image_credit: credit,
        example_fi: exampleFi,
        example_tr: exampleTr,
        grammar_note: grammarNote,
      };
      await saveWord(values, word?.id ?? null);
      onClose();
    } catch (err) {
      setError(describeError(err));
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const missingFields = [
      !finnish.trim() && 'Fince kelime',
      !turkish.trim() && 'Türkçe anlamı',
      !categoryId && 'Ana kategori',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      setError(`Lütfen şu zorunlu alanları doldurun: ${missingFields.join(', ')}.`);
      return;
    }

    if (duplicates.length > 0) {
      setIsConfirmingDuplicate(true);
      return;
    }

    await persistWord();
  };

  const hasImage = Boolean(image.file || image.url);
  const shownImage = image.file ? filePreview : image.url;
  const sourceLabel = image.source ? IMAGE_SOURCE_LABELS[image.source] : 'Bilinmiyor';

  return (
    <Modal title={word ? 'Kelimeyi düzenle' : 'Yeni kelime ekle'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="word-finnish">Fince kelime *</label>
            <input
              id="word-finnish"
              value={finnish}
              onChange={(event) => setFinnish(event.target.value)}
              maxLength={120}
              autoComplete="off"
              className={inputClass}
              placeholder="äiti"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="word-turkish">Türkçe anlamı *</label>
            <input
              id="word-turkish"
              value={turkish}
              onChange={(event) => setTurkish(event.target.value)}
              maxLength={300}
              className={inputClass}
              placeholder="anne"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="word-category">Ana kategori *</label>
            <select id="word-category" value={categoryId ?? ''} onChange={(event) => setCategoryId(event.target.value || null)} className={inputClass} required>
              <option value="">Kategori seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Görsel</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 sm:w-40">
              {shownImage ? (
                <WordImage src={shownImage} alt={finnish || 'Kelime görseli'} fit="contain" className="h-full w-full p-2" />
              ) : (
                <ImagePlus className="h-8 w-8 text-slate-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <p className="text-sm leading-relaxed text-slate-600">
                {hasImage ? `Kaynak: ${sourceLabel}` : 'Bu kelimenin görseli yok. Görselsiz de kaydedebilirsiniz.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsPickingImage(true)}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  {hasImage ? 'Görseli değiştir' : 'Görsel seç'}
                </button>
                {hasImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Görseli kaldır
                  </button>
                )}
              </div>
              {hasImage && (
                <div>
                  <label className={labelClass} htmlFor="word-credit">Görsel kaynağı veya izin notu</label>
                  <input
                    id="word-credit"
                    value={imageCredit}
                    onChange={(event) => setImageCredit(event.target.value)}
                    maxLength={200}
                    className={inputClass}
                    placeholder="Örn: kendi fotoğrafım, Wikimedia Commons, lisanslı"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <label className={labelClass} htmlFor="word-example-fi">Örnek Fince cümle</label>
            <input id="word-example-fi" value={exampleFi} onChange={(event) => setExampleFi(event.target.value)} maxLength={300} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="word-example-tr">Örnek cümlenin Türkçe anlamı</label>
            <input id="word-example-tr" value={exampleTr} onChange={(event) => setExampleTr(event.target.value)} maxLength={300} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="word-grammar">Dilbilgisi notu</label>
            <textarea id="word-grammar" value={grammarNote} onChange={(event) => setGrammarNote(event.target.value)} maxLength={500} rows={3} className={inputClass} />
          </div>
        </section>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
          {word && (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 sm:mr-auto"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Kelimeyi sil
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
      {isPickingImage && (
        <ImagePicker
          finnish={finnish}
          turkish={turkish}
          onPick={handlePicked}
          onClose={() => setIsPickingImage(false)}
        />
      )}
      {isConfirmingDuplicate && (
        <ConfirmModal
          title="Bu Fince kelime zaten kayıtlı"
          message={`"${finnish.trim()}" kelimesi listede zaten var: ${duplicates
            .map((item) => `${item.finnish} - ${item.turkish}`)
            .join(', ')}. Yine de eklemek istiyor musunuz?`}
          confirmLabel="Yine de ekle"
          tone="primary"
          onConfirm={persistWord}
          onClose={() => setIsConfirmingDuplicate(false)}
        />
      )}
      {word && isConfirmingDelete && (
        <ConfirmModal
          title="Kelimeyi sil"
          message={`"${word.finnish}" kelimesi kalıcı olarak silinecek. Bu kelime dinleme, favori ve oyun listelerinden de kaldırılır.`}
          confirmLabel="Evet, sil"
          onConfirm={async () => {
            await deleteWord(word.id);
            onClose();
          }}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </Modal>
  );
}
