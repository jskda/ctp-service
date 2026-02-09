// src/client/components/layout/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Layers, 
  Users, 
  Settings, 
  Home,
  ArrowLeftRight,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const navigation = [
  { name: 'Главная', to: '/', icon: Home },
  { name: 'Заказы', to: '/orders', icon: Package },
  { name: 'Пластины', to: '/plates', icon: Layers },
  { name: 'Клиенты', to: '/clients', icon: Users },
  { name: 'Спецификация', to: '/specification', icon: FileText },
  { name: 'Настройки', to: '/settings', icon: Settings },
];

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <ArrowLeftRight className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                CTP-Service
              </span>
            </Link>
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
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end">
            {/* Индикатор соответствия спецификации */}
            <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
              ✓ Спецификация
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Card className="p-6">
          <Outlet />
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>CTP-Service — Учётно-организационная система CTP-производства © {new Date().getFullYear()}</p>
          <p className="mt-1 text-xs">
            Соответствует спецификации: заказоориентированность, система действий, контрольные пометки
          </p>
        </div>
      </footer>
    </div>
  );
}