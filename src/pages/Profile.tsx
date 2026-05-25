import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import QRModal from '../components/QRModal';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../store/useAuthStore';
import { generateLink } from '../utils/generateLink';

export default function Profile() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Profile - VoxLink';
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
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const user = currentUser;
    const file = event.target.files?.[0];

    if (!user || !file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      setUploadMessage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be 5 MB or smaller.');
      setUploadMessage(null);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const updatedUser = await profileService.updateProfilePicture(user, file);
      updateCurrentUser(updatedUser);
      setUploadMessage('Profile picture updated.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update profile picture.';
      setUploadError(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
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

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-border bg-background p-5">
            <div className="flex flex-col items-center text-center">
              <Avatar
                username={currentUser.username}
                avatar={currentUser.avatar}
                size={112}
                className="rounded-3xl text-2xl"
              />
              <p className="mt-4 text-sm uppercase tracking-[0.28em] text-text-secondary">
                Profile picture
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                PNG, JPG, or WEBP up to 5 MB.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-5 inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Change photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              {uploadMessage ? (
                <p className="mt-3 text-sm text-emerald-400">{uploadMessage}</p>
              ) : null}
              {uploadError ? (
                <p className="mt-3 text-sm text-red-400">{uploadError}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-text-secondary">Username</p>
                <p className="mt-2 text-lg font-semibold text-text">{currentUser.username}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm text-text-secondary">Status</p>
                <p className="mt-2 text-lg font-semibold text-text">{currentUser.status}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-background p-4">
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
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6">
        <QRModal user={currentUser} />
      </div>
    </div>
  );
}
