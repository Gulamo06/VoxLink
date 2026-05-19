import { User } from '../types';

export function generateLink(user: User) {
  return `voxlink://user/${encodeURIComponent(user.id)}`;
}

export function generateQrData(user: User) {
  return JSON.stringify({ type: 'voxlink', userId: user.id });
}
