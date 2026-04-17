import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { ClientSettings } from '@/components/settings/ClientSettings';
import { StockThresholdSettings } from '@/components/settings/StockThresholdSettings';
import { EventLogSettings } from '@/components/settings/EventLogSettings';
import { ReportsSettings } from '@/components/settings/ReportsSettings';
import { DeveloperSettings } from '@/components/settings/DeveloperSettings';

export function SettingsPage() {
  return (
    <SettingsLayout>
      <SystemSettings />
      <ClientSettings />
      <StockThresholdSettings />
      <DeveloperSettings />
      <EventLogSettings />
      <ReportsSettings />
    </SettingsLayout>
  );
}