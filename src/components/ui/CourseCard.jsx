import Badge from './Badge';

const CourseCard = ({ course }) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-charcoal-soft p-6 shadow-card transition hover:-translate-y-1 hover:border-electric-orange/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{course.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{course.summary}</p>
        </div>
        <Badge>{course.level}</Badge>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        {course.highlights.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-electric-orange" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{course.duration}</span>
        <span>{course.track}</span>
      </div>
    </div>
  );
};

export default CourseCard;
