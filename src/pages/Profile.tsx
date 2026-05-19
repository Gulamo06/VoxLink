import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { generateLink } from '../utils/generateLink';
import QRModal from '../components/QRModal';

export default function Profile() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Profile — VoxLink';
  }, []);

  if (!currentUser) {
    return <p className="text-white">No user found.</p>;
  }

  const inviteLink = generateLink(currentUser);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function logout() {
    clearAuth();
    // Navigation handled by App.tsx auth check
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-text-secondary">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-text">Your account</h1>
          </div>
          <button
            onClick={logout}
            className="rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-surface"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-4">
            <p className="text-sm text-text-secondary">Username</p>
            <p className="mt-2 text-lg font-semibold text-text">{currentUser.username}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-4">
            <p className="text-sm text-text-secondary">Status</p>
            <p className="mt-2 text-lg font-semibold text-text">{currentUser.status}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm uppercase tracking-[0.35em] text-text-secondary">Invite link</p>
              <p className="mt-2 truncate text-sm text-text" title={inviteLink}>
                {inviteLink}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text hover:bg-surface"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6">
        <QRModal user={currentUser} />
      </div>
    </div>
  );
}
