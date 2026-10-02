import { useState, type FormEvent } from 'react'
import { ExternalLink, Loader2, Lock, LogIn, ShieldAlert, User } from 'lucide-react'
import {
  rememberUsername,
  rememberedUsername,
  setRemember,
  shouldRemember,
  signIn,
} from '../lib/auth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useLanguage } from './LanguageProvider'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SITE_REGISTRATION_URL } from '../lib/constants'
import { APP_VERSION } from '../lib/version'

const ERROR_KEYS = {
  username: 'error_username',
  credentials: 'error_credentials',
  generic: 'error_generic',
} as const

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage()
  const [username, setUsername] = useState(rememberedUsername)
  const [password, setPassword] = useState('')
  const [remember, setRememberChecked] = useState(shouldRemember)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isSupabaseConfigured || !supabase) {
      setError(t('error_db_missing'))
      return
    }

    setRemember(remember)
    rememberUsername(username)
    setBusy(true)

    const result = await signIn(supabase, username, password)
    setBusy(false)

    if (!result.ok) {
      setError(t(ERROR_KEYS[result.errorCode ?? 'generic']))
      return
    }

    onSuccess()
  }

  const ready = username.trim().length > 0 && password.length > 0 && !busy

  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-[400px]">
        {/* Dil seçici — kartın üstünde, yatayda ortalanmış. */}
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher />
        </div>

        <div className="panel head-in p-5">
          <h1 className="text-[18px] tracking-tight">{t('app_title')}</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
            {t('login_subtitle')}
          </p>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="label">{t('username_label')}</span>
              <span className="relative block">
                <User
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-dim)]"
                />
                <input
                  id="kullanici"
                  name="kullanici"
                  type="text"
                  required
                  disabled={busy}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('username_placeholder')}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  className="field mono pl-9"
                />
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="label">{t('password_label')}</span>
              <span className="relative block">
                <Lock
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-dim)]"
                />
                <input
                  id="sifre"
                  name="sifre"
                  type="password"
                  required
                  disabled={busy}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  className="field pl-9"
                />
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRememberChecked(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              <span className="text-[12px] text-[var(--text-muted)]">{t('remember_me')}</span>
            </label>

            <button type="submit" disabled={!ready} className="btn-primary mt-1">
              {busy ? (
                <>
                  <Loader2 size={14} className="spin" />
                  {t('connecting')}
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  {t('login_button')}
                </>
              )}
            </button>
          </form>

          {error && (
            <p className="notice notice-danger mt-3">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="mt-4 flex items-start gap-2 border-t border-[var(--border)] pt-4">
            <Lock size={12} className="mt-0.5 shrink-0 text-[var(--text-dim)]" />
            <p className="text-[11px] text-[var(--text-dim)]">{t('registration_note')}</p>
          </div>

          <a
            href={SITE_REGISTRATION_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-3 w-full"
          >
            <ExternalLink size={14} />
            {t('register_redirect')}
          </a>
        </div>

        <p className="mono mt-3 text-center text-[10px] text-[var(--text-dim)] opacity-60">
          v{APP_VERSION}
        </p>
      </div>
    </div>
  )
}