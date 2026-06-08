interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  children, 
  className = "", 
  ...props 
}: ButtonProps) {
  const base = "px-6 py-3 rounded-2xl font-medium transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed";

  const styles = variant === 'primary' 
    ? "btn-primary" 
    : "border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-1)]";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}