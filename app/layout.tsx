import './globals.css';
import PresenceProvider from '@/components/PresenceProvider';

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
        {children}
      </body>
    </html>
  );
}