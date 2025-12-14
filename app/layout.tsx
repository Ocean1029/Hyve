import './globals.css';
import PresenceProvider from '@/components/PresenceProvider';
import LocationTracker from '@/components/LocationTracker';

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
        {children}
      </body>
    </html>
  );
}