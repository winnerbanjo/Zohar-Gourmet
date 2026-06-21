import React, { useState, useEffect } from 'react';
import Storefront from './pages/Storefront';
import Admin from './pages/Admin';

export default function App() {
  const [view, setView] = useState('storefront'); // 'storefront' or 'admin'

  // Hash-based routing to allow direct URLs and history navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setView('admin');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        setView('storefront');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = 'admin';
  };

  const navigateToStorefront = () => {
    window.location.hash = '';
  };

  return (
    <div className="app-container">
      {view === 'admin' ? (
        <Admin onNavigateToStorefront={navigateToStorefront} />
      ) : (
        <Storefront onNavigateToAdmin={navigateToAdmin} />
      )}
    </div>
  );
}
