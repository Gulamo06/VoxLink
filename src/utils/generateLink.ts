import { User } from '../types';

export function generateLink(user: User) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://voxlink.vercel.app';
  return `${origin}/?invite=${encodeURIComponent(user.id)}`;
}

export function generateQrData(user: User) {
  return JSON.stringify({ type: 'voxlink', userId: user.id });
}
