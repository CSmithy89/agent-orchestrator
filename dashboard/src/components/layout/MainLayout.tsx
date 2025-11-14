import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {

  return (
    <div className="relative min-h-screen">
      <Header />
      <Sidebar />

      {/* Main content */}
      <main
        className={cn(
          'min-h-[calc(100vh-3.5rem)] transition-all duration-200 ease-in-out',
          'md:ml-64'
        )}
      >
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
