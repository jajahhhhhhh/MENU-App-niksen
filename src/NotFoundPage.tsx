import React, { useEffect } from 'react';
import { NiksenLogo } from './components/NiksenLogo';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Page not found · niksen secret bar';
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center">
          <NiksenLogo variant="blue" size="lg" />
        </div>
        <p className="mt-10 font-display text-7xl tracking-tight text-emerald-600">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-stone-500">That page doesn’t exist — let’s get you back.</p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <a href="/" className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-6 py-3 rounded-full transition-colors">
            Home
          </a>
          <a href="/order" className="bg-emerald-500 hover:bg-emerald-600 text-stone-900 font-bold px-6 py-3 rounded-full transition-colors">
            Order online
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
