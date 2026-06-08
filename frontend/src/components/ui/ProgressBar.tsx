interface ProgressBarProps {
  progress: number;
  className?: string;
}

export default function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  return (
    <div className={`h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}