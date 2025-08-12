import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './ui/App';
import Dashboard from './routes/Dashboard';
import RfcPage from './routes/RfcPage';
import RisksPage from './routes/RisksPage';
import RcaPage from './routes/RcaPage';
import IcCautionPage from './routes/IcCautionPage';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'rfc', element: <RfcPage /> },
      { path: 'risks', element: <RisksPage /> },
      { path: 'rca', element: <RcaPage /> },
      { path: 'ic-caution', element: <IcCautionPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);


