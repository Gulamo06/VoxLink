import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '../types';
import { generateQrData, generateLink, generateDeepLink } from '../utils/generateLink';
import { Copy, Check, Share2 } from 'lucide-react';

interface QRModalProps {
  user: User;
}

export default function QRModal({ user }: QRModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  
  const data = useMemo(() => generateQrData(user), [user]);
  const shareLink = useMemo(() => generateLink(user), [user]);
  const deepLink = useMemo(() => generateDeepLink(user), [user]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy(shareLink, 'link');
      return;
    }

    try {
      await navigator.share({
        title: `Add ${user.username} on VoxLink`,
        text: `Join me on VoxLink! Add me as a contact and we can chat and call.`,
        url: shareLink
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="w-full rounded-3xl border border-border bg-surface p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Your VoxLink ID</p>
        <h2 className="mt-2 text-2xl font-bold text-text">{user.username}</h2>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-2xl border border-border bg-background p-4">
          <QRCodeSVG 
            value={data} 
            size={220} 
            bgColor="#0a0a0a" 
            fgColor="#ffffff"
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-center text-sm text-text-secondary max-w-xs">
          Scan this code to add you as a contact
        </p>
      </div>

      {/* Share Options */}
      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-widest text-text-secondary">Share your contact</p>
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-primary/90"
        >
          <Share2 className="h-4 w-4" />
          Share Link
        </button>

        {/* Copy Links */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCopy(shareLink, 'link')}
            className="flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text transition hover:bg-surface"
          >
            {copied === 'link' ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Link
              </>
            )}
          </button>

          <button
            onClick={() => handleCopy(deepLink, 'deeplink')}
            className="flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text transition hover:bg-surface"
          >
            {copied === 'deeplink' ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Deep Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl bg-background/50 border border-border/50 px-4 py-3">
        <p className="text-xs text-text-secondary leading-relaxed">
          People can add you by scanning your QR code, clicking your link, or searching your username.
        </p>
      </div>
    </div>
  );
}
