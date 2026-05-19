import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '../types';
import { generateQrData } from '../utils/generateLink';

interface QRModalProps {
  user: User;
}

export default function QRModal({ user }: QRModalProps) {
  const data = useMemo(() => generateQrData(user), [user]);

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Your VoxLink ID</p>
          <h2 className="mt-1 text-lg font-semibold text-text">{user.username}</h2>
        </div>
      </div>
      <div className="flex justify-center">
        <QRCodeSVG value={data} size={196} bgColor="#0a0a0a" fgColor="#ffffff" />
      </div>
      <p className="mt-4 text-center text-sm text-text-secondary">Scan this code to add you as a contact.</p>
    </div>
  );
}
