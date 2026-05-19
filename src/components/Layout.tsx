import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { key: '/', label: 'Chats' },
  { key: '/contacts', label: 'Contacts' },
  { key: '/rooms', label: 'Rooms' },
  { key: '/profile', label: 'Profile' }
] as const;

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen pb-20">
      {children}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`flex-1 rounded-full px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary text-primary-text'
                    : 'border border-border bg-surface text-text-secondary hover:bg-background'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
