import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { PlateTypeSettings } from '@/components/settings/PlateTypeSettings';
import { ClientSettings } from '@/components/settings/ClientSettings';
import { StockThresholdSettings } from '@/components/settings/StockThresholdSettings';
import { EventLogSettings } from '@/components/settings/EventLogSettings';

export function SettingsPage() {
  return (
    <SettingsLayout>
      <SystemSettings />
      <PlateTypeSettings />
      <ClientSettings />
      <StockThresholdSettings />
      <EventLogSettings />
    </SettingsLayout>
  );
}