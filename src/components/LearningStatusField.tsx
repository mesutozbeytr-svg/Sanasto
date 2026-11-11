import MultiSelectField from '@/components/MultiSelectField';
import { LEARNING_STATUS_OPTIONS, type LearningStatus } from '@/lib/vocabulary';

interface LearningStatusFieldProps {
  statuses: LearningStatus[];
  onChange: (statuses: LearningStatus[]) => void;
}

export default function LearningStatusField({ statuses, onChange }: LearningStatusFieldProps) {
  return (
    <MultiSelectField
      label="Öğrenme durumu"
      options={LEARNING_STATUS_OPTIONS}
      selected={statuses}
      allLabel="Durum seçin"
      onChange={(selected) =>
        onChange(LEARNING_STATUS_OPTIONS.map((option) => option.value).filter((value) => selected.includes(value)))
      }
    />
  );
}
