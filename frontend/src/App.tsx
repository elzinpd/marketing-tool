import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Header from './components/Header';
import OAuthCallback from './pages/OAuthCallback';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

const PrivateRouteComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route
            path="/"
            element={
              <PrivateRouteComponent>
                <div>
                  <Header />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Dashboard />
                  </main>
                </div>
              </PrivateRouteComponent>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRouteComponent>
                <div>
                  <Header />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Admin />
                  </main>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 