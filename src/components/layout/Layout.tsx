import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto max-w-[400px]">
      {children}
    </div>
  );
}
