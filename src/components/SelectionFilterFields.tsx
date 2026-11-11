import CategoryFilterField from '@/components/CategoryFilterField';
import LearningStatusField from '@/components/LearningStatusField';
import type { Category, Word } from '@/lib/vocabulary';
import type { WordSelectionFilters } from '@/lib/wordFilters';

export interface SelectionToggle {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SelectionFilterFieldsProps {
  categoryLabel: string;
  categories: Category[];
  words: Word[];
  filters: WordSelectionFilters;
  onChange: (patch: Partial<WordSelectionFilters>) => void;
  toggles: SelectionToggle[];
  hideCategoryFilter?: boolean;
}

export default function SelectionFilterFields({
  categoryLabel,
  categories,
  words,
  filters,
  onChange,
  toggles,
  hideCategoryFilter = false,
}: SelectionFilterFieldsProps) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 sm:grid-cols-2 ${hideCategoryFilter ? '' : 'lg:grid-cols-3'}`}>
        {!hideCategoryFilter && (
          <CategoryFilterField
            label={categoryLabel}
            categories={categories}
            words={words}
            selected={filters.categoryIds}
            onChange={(categoryIds) => onChange({ categoryIds })}
          />
        )}
        <LearningStatusField
          statuses={filters.learningStatuses}
          onChange={(learningStatuses) => onChange({ learningStatuses })}
        />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {toggles.map((toggle) => (
          <label key={toggle.label} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={toggle.checked}
              onChange={(event) => toggle.onChange(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            {toggle.label}
          </label>
        ))}
      </div>
    </div>
  );
}
