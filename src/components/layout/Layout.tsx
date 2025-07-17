import React from 'react';
import { useAccount } from 'wagmi';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isConnected } = useAccount();
  
  return (
    <div className={`max-w-[400px]`}>
      {children}
    </div>
  );
}
