export function createDirectChatId(userA: string, userB: string) {
  return ['dm', ...[userA, userB].sort()].join(':');
}

export function getOtherParticipantId(chatId: string, currentUserId: string) {
  const [prefix, firstUserId, secondUserId] = chatId.split(':');

  if (prefix !== 'dm' || !firstUserId || !secondUserId) {
    return null;
  }

  if (firstUserId === currentUserId) {
    return secondUserId;
  }

  if (secondUserId === currentUserId) {
    return firstUserId;
  }

  return null;
}
