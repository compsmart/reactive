'use client';

import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

