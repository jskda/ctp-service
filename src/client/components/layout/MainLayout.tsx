// src/client/components/layout/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Layers, 
  Users, 
  Settings, 
  ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart } from 'lucide-react';

const navigation = [
  { name: 'Заказы', to: '/orders', icon: Package },
  { name: 'Пластины', to: '/plates', icon: Layers },
  { name: 'Клиенты', to: '/clients', icon: Users },
  { name: 'Аналитика', to: '/analytics', icon: BarChart },
  { name: 'Настройки', to: '/settings', icon: Settings },
];

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Логотип слева */}
            <Link to="/orders" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Логотип" className="h-10 w-auto" />
            </Link>
            
            {/* Навигация справа */}
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 transition-colors hover:text-foreground/80',
                      location.pathname === item.to
                        ? 'text-foreground'
                        : 'text-foreground/60'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>CTP-Service — Учётно-организационная система CTP-производства © {new Date().getFullYear()}</p>
          <p className="mt-1 text-xs">
            <a 
              href="https://github.com/your-repo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Документация на GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}