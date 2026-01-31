import Container from '../components/layout/Container';
import Badge from '../components/ui/Badge';

const About = () => {
  return (
    <section className="bg-charcoal-soft py-20">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Badge>About the Academy</Badge>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            A tech-forward academy powered by GENR8-3D Ltd.
          </h2>
          <p className="text-base text-slate-300">
            NEXT-GEN ACADEMY is the training arm of GENR8-3D Ltd, focused on hands-on technical
            education in manufacturing, electronics, and digital production. Students learn inside
            real labs, work with industry-grade tools, and build project portfolios that matter.
          </p>
          <p className="text-base text-slate-300">
            Our instructors blend engineering discipline with youth-friendly coaching so learners
            develop confidence, problem-solving skills, and professional habits that transfer
            straight into the workplace.
          </p>
        </div>
        <div className="section-grid rounded-[28px] border border-white/10 bg-charcoal p-8 shadow-card">
          <div className="space-y-6">
            {[
              {
                title: 'Hands-on instruction',
                copy: 'Every module combines theory with practical builds in our fabrication labs.',
              },
              {
                title: 'Industry partnerships',
                copy: 'Powered by GENR8-3D Ltd to keep curriculum aligned with real-world demand.',
              },
              {
                title: 'Future-ready mindset',
                copy: 'Students learn design thinking, collaboration, and safe shop practices.',
              },
            ].map((item) => (
              <div key={item.title} className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default About;
