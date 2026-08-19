import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spidy AI - Superhero Production AI Assistant',
  description: 'Production-ready AI Assistant platform featuring Red & Black superhero glassmorphism, multi-LLM router, document AI, voice interface, and specialized productivity tools.',
  icons: {
    icon: '/images.jpg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-spidy-dark text-white bg-spider-grid bg-[size:32px_32px] antialiased selection:bg-spidy-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
