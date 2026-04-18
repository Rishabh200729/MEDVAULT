import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { isLoggedIn, getUser, clearAuth } from '../lib/api';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isEmergency = location.pathname.startsWith('/emergency');
  if (isEmergency) return null; // Hide navbar on emergency view

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const navItems = loggedIn
    ? user?.role === 'doctor'
      ? [{ to: '/doctor', label: 'Dashboard' }]
      : user?.role === 'lab'
        ? [{ to: '/lab', label: 'Upload Reports' }]
        : [
            { to: '/patient', label: 'Dashboard' },
            { to: '/patient/records', label: 'Records' },
          ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' },
      ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Shield size={24} />
        <span>MedVault AI</span>
      </Link>

      {/* Desktop Nav */}
      <div className="navbar-links" style={{ display: 'flex' }}>
        <div className="navbar-links" style={{ '@media (max-width: 768px)': { display: 'none' } } as React.CSSProperties}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {loggedIn && (
            <>
              <span style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.85rem',
                padding: '0.5rem 0.75rem',
                borderLeft: '1px solid var(--color-border)',
                marginLeft: '0.5rem',
              }}>
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'none', border: 'none', color: 'var(--color-text-secondary)',
            cursor: 'pointer', display: 'none',
          }}
          className="mobile-menu-btn"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '4rem', left: 0, right: 0,
          background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)',
          padding: '1rem', zIndex: 99, display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-link"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {loggedIn && (
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
