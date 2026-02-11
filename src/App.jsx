import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Registration from './pages/Registration';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <div className="min-h-screen bg-charcoal text-slate-100">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
