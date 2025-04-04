import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/v1/auth/me');
        if (response.ok) {
          const user = await response.json();
          setIsSuperuser(user.is_superuser);
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };

    checkUserRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img
              src="/graphics/logo.png"
              alt="TechArena Logo"
              className="h-8 w-auto"
            />
            <span className="ml-2 text-xl font-semibold text-primary-600">TechArena</span>
          </div>
          <div className="flex items-center space-x-8">
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-primary-600">Dashboard</a>
              {isSuperuser && (
                <a href="/admin" className="text-gray-600 hover:text-primary-600">Admin</a>
              )}
            </nav>
            <button
              onClick={handleLogout}
              className="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 