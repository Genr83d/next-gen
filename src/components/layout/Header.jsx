import { Link, NavLink } from 'react-router-dom';
import Container from './Container';
import Button from '../ui/Button';
import logo from '../../assets/next-gen.svg';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-charcoal/90 backdrop-blur">
      <Container className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
          <img
            src={logo}
            alt="Next-Gen Academy"
            className="h-10 w-auto sm:h-12 md:h-14"
          />
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
