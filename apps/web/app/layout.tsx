import './globals.css';
import PresenceProvider from '@/components/presence/PresenceProvider';
import LocationTracker from '@/components/presence/LocationTracker';
import SensorPermissionProvider from '@/components/sensor/SensorPermissionProvider';
import SwipePreviewProvider from '@/components/common/SwipePreviewProvider';

export const metadata = {
  title: 'Hyve',
  description: 'Connect with friends through shared focus sessions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PresenceProvider />
        <LocationTracker />
        <SensorPermissionProvider>
          <SwipePreviewProvider>
            {children}
          </SwipePreviewProvider>
        </SensorPermissionProvider>
      </body>
    </html>
  );
}