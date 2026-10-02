import { DEFAULT_LANGUAGE, isLanguage, type Dictionary, type Language, type TranslationKey, type TranslateParams } from './types'

import { en } from './en'

/** Her dil ayrı bir chunk — yalnızca seçilen dil indirilir. */
const LOADERS: Record<Language, () => Promise<Dictionary>> = {
  en: () => import('./en').then((m) => m.en),
  tr: () => import('./tr').then((m) => m.tr),
  de: () => import('./de').then((m) => m.de),
  'pt-BR': () => import('./pt-BR').then((m) => m.ptBR),
}

export function resolveLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE
}

/**
 * İngilizce yedek olarak statik import edilir; diğer diller ayrı chunk'a
 * düşsün diye yalnızca onlar dinamik import edilir.
 */
export function loadDictionary(language: Language): Promise<Dictionary> {
  if (language === 'en') return Promise.resolve(en)
  return LOADERS[language]().catch(() => en)
}

/** Aktif dil → İngilizce → anahtarın kendisi. `{ad}` yer tutucuları doldurulur. */
export function translate(
  dictionary: Dictionary,
  key: TranslationKey,
  params?: TranslateParams,
): string {
  let text = dictionary[key] ?? en[key] ?? String(key)

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }

  return text
}

export * from './types'