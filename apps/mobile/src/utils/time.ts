import { formatDistanceToNow } from 'date-fns';

export const formatRelativeTime = (isoDate?: string) => {
  if (!isoDate) {
    return undefined;
  }

  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
  } catch (error) {
    return undefined;
  }
};
