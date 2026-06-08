interface StepHeaderProps {
  step: string;
  title: string;
  subtitle?: string;
}

export default function StepHeader({ step, title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-1">{step}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-[var(--text-2)] mt-2">{subtitle}</p>}
    </div>
  );
}