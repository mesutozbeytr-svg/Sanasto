import SelectionFilterFields from '@/components/SelectionFilterFields';
import SortDropdown from '@/components/SortDropdown';
import { type GameSetupConfig, type WordCount } from '@/lib/games/gameConfig';
import type { Category, Word } from '@/lib/vocabulary';
import type { WordListSort } from '@/lib/wordSort';

type GameSort = WordListSort | 'random';

const GAME_SORT_OPTIONS: { value: GameSort; label: string }[] = [
  { value: 'added', label: 'Eklenme sırası' },
  { value: 'finnish', label: 'Fince A-Z' },
  { value: 'turkish', label: 'Türkçe A-Z' },
  { value: 'random', label: 'Karışık' },
];

interface GameFilterFieldsProps {
  config: GameSetupConfig;
  onChange: (config: GameSetupConfig) => void;
  categories: Category[];
  words: Word[];
  hideCategoryFilter?: boolean;
}

export default function GameFilterFields({ config, onChange, categories, words, hideCategoryFilter = false }: GameFilterFieldsProps) {
  const update = (patch: Partial<GameSetupConfig>) => onChange({ ...config, ...patch });

  const sortValue: GameSort = config.order === 'alphabetical' ? config.alphabetLanguage : config.order;
  const applySort = (value: GameSort) => {
    if (value === 'finnish' || value === 'turkish') {
      update({ order: 'alphabetical', alphabetLanguage: value });
      return;
    }
    update({ order: value });
  };

  return (
    <div className="space-y-6">
      <SelectionFilterFields
        categoryLabel="Ana kategoriler"
        categories={categories}
        words={words}
        filters={config}
        onChange={update}
        hideCategoryFilter={hideCategoryFilter}
        toggles={[
          {
            label: 'Sadece favoriler',
            checked: config.favoritesOnly,
            onChange: (favoritesOnly) => update({ favoritesOnly }),
          },
          {
            label: 'Daha önce yanlışlar',
            checked: config.wrongOnly,
            onChange: (wrongOnly) => update({ wrongOnly }),
          },
        ]}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-700">Kelime sıralaması</legend>
        <SortDropdown label="Kelime sıralaması" options={GAME_SORT_OPTIONS} value={sortValue} onChange={applySort} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700">Kelime sayısı</legend>
        <div className="flex items-center justify-between gap-3">
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={config.count}
            onChange={(event) => update({ count: Number(event.target.value) as WordCount })}
            aria-label="Kelime sayısı"
            className="h-2 w-full cursor-pointer accent-blue-700"
          />
          <span className="w-12 shrink-0 text-right text-lg font-bold tabular-nums text-blue-700">{config.count}</span>
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>10</span>
          <span>500</span>
        </div>
      </fieldset>
    </div>
  );
}
