import type { LearningProgress } from '@/lib/learningProgress';

interface LearningBatteryProps {
  progress: LearningProgress;
}

export default function LearningBattery({ progress }: LearningBatteryProps) {
  const ratio = progress.total > 0 ? (progress.learned / progress.total) * 100 : 0;

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <div
        role="progressbar"
        aria-label="Öğrenilen kelime oranı"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.learned}
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className="shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums text-slate-600">
        {progress.learned}/{progress.total}
      </p>
    </div>
  );
}
