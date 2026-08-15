import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import LandingPage from './LandingPage.tsx';
import './index.css';

// Every page except the landing loads as its own chunk: a visitor on `/`
// (most traffic, often on island 4G) shouldn't download the POS or the
// ordering app just to see the brand page.
const App = lazy(() => import('./App.tsx'));
const OrderPage = lazy(() => import('./OrderPage.tsx'));
const PrivacyPage = lazy(() => import('./PrivacyPage.tsx'));
const OfferPage = lazy(() => import('./OfferPage.tsx'));
const JournalPage = lazy(() => import('./JournalPage.tsx'));
const NotFoundPage = lazy(() => import('./NotFoundPage.tsx'));

// Route by path:
//   /order    → customer online ordering
//   /pos      → staff POS admin (PIN-protected)
//   /privacy  → privacy policy
//   /offer    → public offer (terms of sale)
//   /journal  → the owner's journal
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
      : path.startsWith('/journal')
        ? <JournalPage />
        : path === '/' || path === ''
          ? <LandingPage />
          : <NotFoundPage />;

// The fallback matches the site's ivory ground so the chunk swap reads as a
// quiet beat, not a flash.
const fallback = (
  <div style={{minHeight: '100vh', background: '#F2E9DC'}} />
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={fallback}>{page}</Suspense>
  </StrictMode>,
);
