import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';

const CallToAction = () => {
  return (
    <section className="py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-charcoal-soft via-charcoal to-black px-8 py-14">
          <div className="pointer-events-none absolute -right-12 top-0 h-56 w-56 rounded-full bg-electric-orange/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-electric-orange">
                Ready to join?
              </p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Secure your seat in the next cohort.
              </h2>
              <p className="text-base text-slate-300">
                Complete the registration form and our admissions team will confirm your placement,
                schedule, and onboarding checklist.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button as={Link} to="/registration" size="lg">
                Start Registration
              </Button>
              <Button as="a" href="mailto:admissions@nextgenacademy.com" variant="ghost" size="lg">
                Ask Admissions
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CallToAction;
