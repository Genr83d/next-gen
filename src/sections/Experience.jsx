import Container from '../components/layout/Container';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Experience = () => {
  const images = [
    {
      src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
      alt: 'Students collaborating with laptops and electronics',
    },
    {
      src: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=800&q=80',
      alt: 'Student using lab equipment in a workshop',
    },
    {
      src: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      alt: 'Instructor guiding a student in a fabrication lab',
    },
  ];

  return (
    <section className="bg-charcoal-soft py-20">
      <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-electric-orange">
            Student Experience
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Real labs. Real mentors. Real results.
          </h2>
          <p className="text-base text-slate-300">
            Students train in modern workshops with CNC machines, electronics benches, 3D printers,
            and collaborative studios. Every cohort ends with a demo day where learners showcase
            what they built and how they solved challenges.
          </p>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-slate-300">
            <p className="text-white">Outcome-focused learning</p>
            <p className="mt-2">
              Each student leaves with a portfolio of build logs, design files, and safety
              certifications ready for apprenticeships or entrepreneurship.
            </p>
          </div>
          <Button as={Link} to="/registration" variant="ghost" size="md">
            Visit Registration
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={image.src}
              className={`overflow-hidden rounded-2xl border border-white/10 ${
                index === 0 ? 'sm:col-span-2' : ''
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Experience;
