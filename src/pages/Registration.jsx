import Container from '../components/layout/Container';
import RegistrationForm from '../components/forms/RegistrationForm';
import { courses } from '../data/courses';

const Registration = () => {
  return (
    <section className="bg-charcoal pb-20 pt-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-electric-orange">
                Registration
              </p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Reserve your seat at NEXT-GEN ACADEMY.
              </h1>
              <p className="text-base text-slate-300">
                Complete the form below to register for your preferred courses. After submission,
                you will receive a printable PDF copy for your records.
              </p>
            </div>
            <RegistrationForm />
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-charcoal-soft p-6 shadow-card">
              <h2 className="text-lg font-semibold text-white">What happens next?</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-electric-orange" />
                  Admissions reviews your submission within 48 hours.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-electric-orange" />
                  You will receive scheduling confirmation and onboarding details.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-electric-orange" />
                  Your PDF form is ready to print and bring to orientation.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                Course Catalog
              </h3>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <span>{course.title}</span>
                    <span className="text-xs text-slate-400">{course.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-charcoal-soft p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                Need help?
              </h3>
              <p className="mt-3 text-sm text-slate-300">
                Email admissions@nextgenacademy.com or call +1 (868) 555-0148 for support.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
};

export default Registration;
