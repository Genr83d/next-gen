import Container from '../components/layout/Container';
import CourseCard from '../components/ui/CourseCard';
import { courses } from '../data/courses';

const Courses = () => {
  return (
    <section id="courses" className="scroll-mt-24 py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-electric-orange">
              Courses Offered
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Industry-ready courses designed for growth.
            </h2>
            <p className="max-w-2xl text-base text-slate-300">
              Each track blends theory, lab time, and real projects. Programs can expand easily as
              GENR8-3D introduces new technologies.
            </p>
          </div>
          <p className="text-sm text-slate-400">New electives launch every term.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Courses;
