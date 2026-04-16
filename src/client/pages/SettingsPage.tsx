import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { ClientSettings } from '@/components/settings/ClientSettings';
import { StockThresholdSettings } from '@/components/settings/StockThresholdSettings';
import { EventLogSettings } from '@/components/settings/EventLogSettings';
import { ReportsSettings } from '@/components/settings/ReportsSettings'; // новый импорт

export function SettingsPage() {
  return (
    <SettingsLayout>
      <SystemSettings />
      <ClientSettings />
      <StockThresholdSettings />
      <EventLogSettings />
      <ReportsSettings />   {/* добавлено */}
    </SettingsLayout>
  );
}