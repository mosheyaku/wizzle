import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || !parsed.first_name) {
        localStorage.removeItem('user');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);

  useEffect(() => {
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');

    if (
      user &&
      (!storedAccess || storedAccess !== accessToken || !storedRefresh || storedRefresh !== refreshToken)
    ) {
      console.warn('Tokens mismatched or missing. Logging out user.');
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.clear();
    }
  }, [accessToken, refreshToken, user]);

  useEffect(() => {
    const validateToken = async () => {
      try {
        await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/me/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (err) {
        console.warn('Token invalid. Logging out.');
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.clear();
      }
    };

    if (user && accessToken) {
      validateToken();
    }
  }, [user, accessToken]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (refreshToken) {
        try {
          const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/token/refresh/`, {
            refresh: refreshToken,
          });
          setAccessToken(res.data.access);
          localStorage.setItem('accessToken', res.data.access);
          console.log('🔁 Access token refreshed.');
        } catch (err) {
          console.warn('⚠️ Token refresh failed. Logging out.');
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
          localStorage.clear();
        }
      }
    }, 12 * 60 * 1000); // every 12 minutes

    return () => clearInterval(interval);
  }, [refreshToken]);

  const handleLoginSignupSuccess = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (tokens) {
      setAccessToken(tokens.access);
      setRefreshToken(tokens.refresh);
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return {
    user,
    setUser,
    accessToken,
    setAccessToken,
    refreshToken,
    setRefreshToken,
    handleLoginSignupSuccess,
    logout,
  };
}
