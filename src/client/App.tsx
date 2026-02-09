// src/client/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { PlatesPage } from './pages/PlatesPage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SpecificationPage } from './pages/SpecificationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="plates" element={<PlatesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="specification" element={<SpecificationPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}