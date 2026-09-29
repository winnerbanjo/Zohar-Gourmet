import React, { useState, useEffect } from 'react';
import Storefront from './pages/Storefront';
import Admin from './pages/Admin';
import { getSnapshot, refreshDatabase } from './utils/database';

export default function App() {
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        await refreshDatabase();
        if (active) { setReady(Boolean(getSnapshot())); setSyncError(''); }
      } catch { if (active) setSyncError('Unable to connect to the store. Check your connection and try again.'); }
    };
    const resume = () => { if (!document.hidden) refresh(); };
    const onError = () => setSyncError('Your change was saved, but the latest store data could not be loaded. Please refresh.');
    refresh();
    const timer = setInterval(resume, 10000);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    window.addEventListener('zohar-sync-error', onError);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active = false; clearInterval(timer);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('zohar-sync-error', onError);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);
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

  if (!ready) return <main style={{ padding: '48px 24px', textAlign: 'center' }}><h2>Zohar Gourmet</h2><p role="status">{syncError || 'Loading the latest menu…'}</p>{syncError && <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>}</main>;

  return (
    <div className="app-container">
      {syncError && <div role="alert" style={{ padding: 12, background: "#fff3cd", textAlign: "center" }}>{syncError}</div>}
      {view === 'admin' ? (
        <Admin onNavigateToStorefront={navigateToStorefront} />
      ) : (
        <Storefront onNavigateToAdmin={navigateToAdmin} />
      )}
    </div>
  );
}
