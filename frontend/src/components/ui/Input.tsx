type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`flex-1 px-5 py-3.5 bg-(--surface) border border-(--border) 
                  rounded-2xl focus:border-(--accent) outline-none 
                  text-(--text-1) placeholder:text-(--text-3) ${className}`}
      {...props}
    />
  );
}