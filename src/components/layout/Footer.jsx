import Container from './Container';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-charcoal-soft">
      <Container className="grid gap-6 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">NEXT-GEN ACADEMY</h3>
          <p className="text-sm text-slate-300">
            Powered by GENR8-3D Ltd. Building tomorrow's engineers with hands-on skills in
            fabrication, electronics, and digital design.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="font-semibold uppercase tracking-wide text-slate-200">Contact</p>
          <p>+1 (868) 555-0148</p>
          <p>admissions@nextgenacademy.com</p>
          <p>Innovation Park, Port of Spain</p>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="font-semibold uppercase tracking-wide text-slate-200">Hours</p>
          <p>Mon - Fri: 8:00am - 6:00pm</p>
          <p>Sat: 9:00am - 2:00pm</p>
          <p>Sun: Closed</p>
        </div>
      </Container>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-400">
        (c) {new Date().getFullYear()} NEXT-GEN ACADEMY. Powered by GENR8-3D Ltd.
      </div>
    </footer>
  );
};

export default Footer;
