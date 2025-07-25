import React from 'react';
import { useAccount } from 'wagmi';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  
  return (
    <div className={`max-w-[400px] min-h-screen`}>
      {children}
    </div>
  );
}
