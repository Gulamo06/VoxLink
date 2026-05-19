import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export function formatTime(timestamp: string) {
  try {
    return formatDistanceToNowStrict(parseISO(timestamp), { addSuffix: true });
  } catch {
    return timestamp;
  }
}
