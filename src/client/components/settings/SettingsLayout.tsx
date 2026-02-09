import { useState } from 'react';
import { Settings, Users, Database, AlertTriangle, Clock, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const settingsSections = [
  { id: 'system', label: 'Система', icon: Settings },
  { id: 'plate-types', label: 'Типы пластин', icon: Database },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'stock', label: 'Остатки', icon: AlertTriangle },
  { id: 'events', label: 'Лог событий', icon: Clock },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Управление системными настройками и параметрами
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {children}
      </Tabs>
    </div>
  );
}