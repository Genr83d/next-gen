const styles = {
  primary:
    'bg-electric-orange text-charcoal hover:bg-electric-orange-dark shadow-glow',
  ghost:
    'border border-white/15 text-white hover:border-electric-orange hover:text-electric-orange',
  dark: 'bg-charcoal-soft text-white hover:bg-black/80 border border-white/10',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-ring ${
        styles[variant]
      } ${sizes[size]} ${disabled ? 'cursor-not-allowed opacity-70' : ''} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
};

export default Button;
