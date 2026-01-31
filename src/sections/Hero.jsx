import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-charcoal pb-24 pt-20">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid opacity-60" />
      <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-accent-radial blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-64 w-64 rounded-full bg-cool-radial blur-3xl" />

      <Container className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-electric-orange">
              Powered by GENR8-3D Ltd
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Build the skills to engineer, fabricate, and create the future.
            </h1>
            <p className="max-w-xl text-base text-slate-300 sm:text-lg">
              NEXT-GEN ACADEMY delivers immersive, hands-on technical training in CNC machining,
              electronics, 3D printing, game creation, and CSEC electrical. Students graduate ready
              to build real-world solutions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button as={Link} to="/registration" size="lg">
                Register Now
              </Button>
              <Button as="a" href="#courses" variant="ghost" size="lg">
                Explore Courses
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Hands-on labs', value: '30+ hrs' },
                { label: 'Industry tools', value: 'CNC + CAD' },
                { label: 'Job-ready skills', value: 'Project-based' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-fade-up-delay">
            <div className="absolute -left-6 top-8 h-24 w-24 animate-float-slow rounded-2xl border border-white/20 bg-white/10" />
            <div className="rounded-[28px] border border-white/10 bg-charcoal-soft p-6 shadow-card">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Upcoming Cohort</p>
                  <span className="rounded-full bg-electric-orange/20 px-3 py-1 text-xs font-semibold text-electric-orange">
                    Limited Seats
                  </span>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Start Date</span>
                    <span className="font-semibold text-white">March 2026</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Formats</span>
                    <span className="font-semibold text-white">Weekday + Weekend</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Location</span>
                    <span className="font-semibold text-white">Innovation Park Lab</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-black/40 p-4 text-xs text-slate-300">
                  "The training environment feels like a real engineering studio. You design, build,
                  and test every week."
                  <span className="mt-2 block text-electric-orange">- Student Cohort 05</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
