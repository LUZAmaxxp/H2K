import { messages } from '@/config/messages';

export function useTranslations() {
  const t = (key: string) => {
    return messages[key as keyof typeof messages] || key;
  };
  return { t, isLoading: false };
}
