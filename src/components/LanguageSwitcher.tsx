import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_SHORT } from '../lib/i18n'
import { useLanguage } from './LanguageProvider'

/**
 * Dört dil düğmesi.
 *
 * Genişlikleri sabit (`w-9`) ki dil değiştiğinde düzen zıplamasın.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, language, setLanguage } = useLanguage()

  return (
    <div
      className={`flex items-center gap-1 ${compact ? '' : 'justify-center'}`}
      role="group"
      aria-label={t('language')}
    >
      {LANGUAGES.map((code) => {
        const active = code === language
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            title={LANGUAGE_LABELS[code]}
            className={`num grid h-8 w-9 shrink-0 place-items-center rounded-[6px] text-[11.5px] font-semibold transition-all duration-200 ${
              active
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent-line)]'
                : 'text-[var(--text-dim)] hover:bg-white/[0.06] hover:text-[var(--text)]'
            }`}
          >
            {LANGUAGE_SHORT[code]}
          </button>
        )
      })}
    </div>
  )
}