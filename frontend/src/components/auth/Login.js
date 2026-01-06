import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Popup from '../popup/Popup';
import './AuthBase.css';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/token/`,
        {
          username: formData.email,
          password: formData.password,
        }
      );

      localStorage.setItem('accessToken', res.data.access);
      localStorage.setItem('refreshToken', res.data.refresh);

      const userRes = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/me/`,
        {
          headers: {
            Authorization: `Bearer ${res.data.access}`,
          },
        }
      );

      const userData = userRes.data;

      onLoginSuccess(userData, {
        access: res.data.access,
        refresh: res.data.refresh,
      });


      setShowPopup(true);
    } catch (err) {
      console.error('Login error:', err.response);
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const flat = Object.entries(errors)
          .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg[0] : msg}`)
          .join('\n');
        setError(flat);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    navigate('/');
  };

  return (
    <>
      <div className="form-container">
        <h2 className="form-title">Login to Your Account</h2>
        <form onSubmit={handleSubmit} className="form" noValidate autoComplete="off">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="off"
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
              role="button"
              tabIndex={0}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="form-button" type="submit">
            Login
          </button>
        </form>
      </div>

      {showPopup && (
        <Popup
          message="Successfully logged in!🎉"
          onClose={handlePopupClose}
        />
      )}
    </>
  );
}
