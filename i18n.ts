import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !['en', 'fr', 'es', 'ar'].includes(locale as string)) {
    locale = 'fr';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
