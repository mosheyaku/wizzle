import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainPage from './components/layout/MainPage';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Vocabulary from './components/vocabulary/Vocabulary';
import Layout from './components/layout/Layout';
import useAuth from './hooks/useAuth';
import './App.css';

function App() {
  const {
    user,
    setUser,
    accessToken,
    setAccessToken,
    refreshToken,
    setRefreshToken,
    handleLoginSignupSuccess,
  } = useAuth();

  const [pdfId, setPdfId] = useState(() => {
    return localStorage.getItem('pdfId');
  });

  const handleUploadSuccess = (data) => {
    setPdfId(data.id); 
    localStorage.setItem('pdfId', data.id);
    sessionStorage.setItem('hasUploaded', 'true');
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              user={user}
              setUser={setUser}
              setAccessToken={setAccessToken}
              setRefreshToken={setRefreshToken}
            >
              <MainPage
                pdfId={pdfId}
                onUploadSuccess={handleUploadSuccess}
                user={user}
                accessToken={accessToken}
              />
            </Layout>
          }
        />

        <Route
          path="/signup"
          element={
            <Layout
              user={user}
              setUser={setUser}
              setAccessToken={setAccessToken}
              setRefreshToken={setRefreshToken}
            >
              <Signup onSignupSuccess={handleLoginSignupSuccess} />
            </Layout>
          }
        />

        <Route
          path="/login"
          element={
            <Layout
              user={user}
              setUser={setUser}
              setAccessToken={setAccessToken}
              setRefreshToken={setRefreshToken}
            >
              <Login onLoginSuccess={handleLoginSignupSuccess} />
            </Layout>
          }
        />

        <Route
          path="/vocabulary"
          element={
            <Layout
              user={user}
              setUser={setUser}
              setAccessToken={setAccessToken}
              setRefreshToken={setRefreshToken}
            >
              <Vocabulary accessToken={accessToken} />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
