import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ConfirmLogoutPopup from './ConfirmLogoutPopup';
import './Layout.css';

export default function Layout({ children, user, setUser, setAccessToken, setRefreshToken }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const confirmLogout = () => {
    localStorage.clear();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setShowLogoutPopup(false);
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className={`top-nav ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="site-title-link" onClick={() => setMenuOpen(false)}>
          <h1 className="site-title">Wizzle PDF Viewer</h1>
        </Link>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <nav>
          {user && (
            <span className="nav-user" title="Connected">
              <span className="user-name-frame">{user.first_name}</span>
            </span>
          )}
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          {user && (
            <Link to="/vocabulary" className="nav-link" onClick={() => setMenuOpen(false)}>
              My Words
            </Link>
          )}
          {!user && location.pathname !== '/login' && (
            <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}
          {!user && location.pathname !== '/signup' && (
            <Link to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>
              Sign Up
            </Link>
          )}
          {user && (
            <button
              className="nav-link logout-btn"
              onClick={() => {
                setShowLogoutPopup(true);
                setMenuOpen(false);
              }}
              type="button"
            >
              Logout
            </button>
          )}
        </nav>
      </header>

      {showLogoutPopup && (
        <ConfirmLogoutPopup
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutPopup(false)}
        />
      )}

      <main>{children}</main>
    </>
  );
}
