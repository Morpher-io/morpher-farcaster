import React from 'react';
import { useAccount } from 'wagmi';
import { Link, useLocation } from 'react-router-dom';
import { usePortfolioStore } from '../../store/portfolio';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}



export function Layout({ children }: LayoutProps) {
  const { isConnected } = useAccount();
  const { tradeComplete } = usePortfolioStore();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
  { path: '/', label: t('menu.HOME'), image: 'home' },
  { path: '/portfolio', label: t('menu.PORTFOLIO'), image: 'portfolio' },
  { path: '/leaderboard', label: t('menu.LEADERBOARD'), image: 'leaderboard' },
  { path: '/history', label: t('menu.HISTORY'), image: 'history' },

];

  return (
    <div className="mx-auto flex h-screen max-w-[400px] flex-col">
      <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      {isConnected && !tradeComplete && (
        <footer className="shrink-0 border-t border-border bg-background">
          <nav className="flex h-16 items-center justify-around ">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 text-xs text-muted-foreground hover:bg-gray-100 p-2 ',
                  location.pathname === item.path && 'text-primary',
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 bg-muted-foreground',
                    location.pathname === item.path && 'bg-primary',
                  )}
                  style={{
                    mask: `url(/src/assets/icons/${item.image.toLowerCase()}.svg) no-repeat center / contain`,
                    WebkitMask: `url(/src/assets/icons/${item.image.toLowerCase()}.svg) no-repeat center / contain`,
                  }}
                />
                <span className='mt-0 font-semibold'>{item.label}</span>
              </Link>
            ))}
          </nav>
        </footer>
      )}
    </div>
  );
}
