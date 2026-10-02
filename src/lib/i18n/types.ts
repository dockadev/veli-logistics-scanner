export const LANGUAGES = ['en', 'tr', 'pt-BR', 'de'] as const
export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  tr: 'Türkçe',
  'pt-BR': 'Português (BR)',
  de: 'Deutsch',
}

/** Butonlarda gösterilen kısa etiket. */
export const LANGUAGE_SHORT: Record<Language, string> = {
  en: 'EN',
  tr: 'TR',
  'pt-BR': 'BR',
  de: 'DE',
}

/** Sayı/tarih biçimlendirmesi için yerel ayar. */
export const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  'pt-BR': 'pt-BR',
  de: 'de-DE',
}

export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGE_STORAGE_KEY = 'veli_lang'

/** Çevrilmemiş anahtarlar İngilizce'ye düşer. */
export type TranslationKey = keyof typeof import('./en').en
export type Dictionary = Partial<Record<TranslationKey, string>>
export type TranslateParams = Record<string, string | number>

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}