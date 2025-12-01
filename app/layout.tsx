import './globals.css';

export const metadata = {
  title: 'Campfire',
  description: 'Connect with friends through shared focus sessions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}