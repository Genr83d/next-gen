const Badge = ({ children, tone = 'orange' }) => {
  const tones = {
    orange: 'bg-electric-orange/20 text-electric-orange',
    blue: 'bg-sky-500/15 text-sky-300',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default Badge;
