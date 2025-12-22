export const locales = ['en', 'fr', 'es', 'ar'] as const;
export type Locale = (typeof locales)[number];
