import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  loadDictionary,
  resolveLanguage,
  translate,
  type Dictionary,
  type Language,
  type TranslationKey,
  type TranslateParams,
} from '../lib/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (next: Language) => void
  t: (key: TranslationKey, params?: TranslateParams) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/** Provider dışında çağrılırsa (HMR, izole render) İngilizce'ye düşer. */
const FALLBACK: LanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, params) => translate({}, key, params),
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // localStorage yalnızca ilk render'da okunur; sonraki değişiklikler
  // setLanguage ile yönetilir.
  const [language, setLanguageState] = useState<Language>(() =>
    resolveLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)),
  )
  const [dictionary, setDictionary] = useState<Dictionary>({})

  useEffect(() => {
    void loadDictionary(language).then(setDictionary)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    if (next === language) return
    setLanguageState(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }, [language])

  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => translate(dictionary, key, params),
    [dictionary],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext) ?? FALLBACK
}