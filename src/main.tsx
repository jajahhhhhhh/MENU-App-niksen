import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import OrderPage from './OrderPage.tsx';
import LandingPage from './LandingPage.tsx';
import PrivacyPage from './PrivacyPage.tsx';
import OfferPage from './OfferPage.tsx';
import NotFoundPage from './NotFoundPage.tsx';
import './index.css';

// Route by path:
//   /order    → customer online ordering
//   /pos      → staff POS admin (PIN-protected)
//   /privacy  → privacy policy
//   /offer    → public offer (terms of sale)
//   /         → public brand landing page
//   (other)   → 404 not found
const path = window.location.pathname;
const page = path.startsWith('/order')
  ? <OrderPage />
  : path.startsWith('/pos')
    ? <App />
    : path.startsWith('/privacy')
      ? <PrivacyPage />
      : path.startsWith('/offer')
        ? <OfferPage />
        : path === '/' || path === ''
          ? <LandingPage />
          : <NotFoundPage />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
);
