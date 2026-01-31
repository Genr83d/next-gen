import { Link, NavLink } from 'react-router-dom';
import Container from './Container';
import Button from '../ui/Button';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-charcoal/90 backdrop-blur">
      <Container className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-orange text-charcoal shadow-glow">
            NG
          </span>
          <span className="tracking-wide">
            NEXT-GEN <span className="text-electric-orange">ACADEMY</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `transition ${
                isActive ? 'text-electric-orange' : 'text-slate-200 hover:text-white'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/registration"
            className={({ isActive }) =>
              `transition ${
                isActive ? 'text-electric-orange' : 'text-slate-200 hover:text-white'
              }`
            }
          >
            Registration
          </NavLink>
          <Button as={Link} to="/registration" variant="primary" size="sm">
            Register Now
          </Button>
        </nav>
      </Container>
    </header>
  );
};

export default Header;
