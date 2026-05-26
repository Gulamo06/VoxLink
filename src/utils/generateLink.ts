import { User } from '../types';

export function generateLink(user: User) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://voxlink.vercel.app';
  return `${origin}/?invite=${encodeURIComponent(user.id)}`;
}

/**
 * Generates shareable VoxLink invitation data with user information
 * Compatible with both QR code scanning and direct link sharing
 */
export function generateQrData(user: User) {
  // Creates a comprehensive invitation link that includes user info
  const inviteLink = generateLink(user);
  return JSON.stringify({ 
    type: 'voxlink',
    version: '1.0',
    userId: user.id,
    username: user.username,
    inviteLink: inviteLink
  });
}

/**
 * Generates a deep link for VoxLink contact invitations
 */
export function generateDeepLink(user: User) {
  return `voxlink://contact/${user.id}?username=${encodeURIComponent(user.username)}`;
}

/**
 * Parses VoxLink invitation data from QR code or link
 */
export function parseVoxLinkInvite(data: string): { userId: string; username?: string; inviteLink?: string } | null {
  try {
    // Try to parse as JSON first (QR code data)
    const parsed = JSON.parse(data);
    if (parsed.type === 'voxlink' && parsed.userId) {
      return {
        userId: parsed.userId,
        username: parsed.username,
        inviteLink: parsed.inviteLink
      };
    }
  } catch (e) {
    // Not JSON, try other formats
  }

  // Try to parse as deep link
  const deepLinkMatch = data.match(/voxlink:\/\/contact\/([a-z0-9-]+)/);
  if (deepLinkMatch) {
    const urlParams = new URL(data.replace('voxlink://', 'https://')).searchParams;
    return {
      userId: deepLinkMatch[1],
      username: urlParams.get('username') || undefined
    };
  }

  // Try to extract userId from invite link
  const inviteLinkMatch = data.match(/\?invite=([a-z0-9-]+)/i);
  if (inviteLinkMatch) {
    return {
      userId: decodeURIComponent(inviteLinkMatch[1])
    };
  }

  return null;
}
