import { useState, type FormEvent } from 'react'
import { Loader2, Lock, LogIn, ShieldAlert, User } from 'lucide-react'
import { signIn, setRemember } from '../lib/auth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const ERRORS: Record<string, string> = {
  username: 'Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.',
  credentials: 'Kullanıcı adı veya şifre hatalı.',
  generic: 'Giriş yapılamadı. Bağlantını kontrol edip tekrar deneyin.',
}

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRememberChecked] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isSupabaseConfigured || !supabase) {
      setError('Veritabanı yapılandırması eksik.')
      return
    }

    setRemember(remember)
    setBusy(true)

    const result = await signIn(supabase, username, password)
    setBusy(false)

    if (!result.ok) {
      setError(ERRORS[result.errorCode ?? 'generic'])
      return
    }

    onSuccess()
  }

  const ready = username.trim().length > 0 && password.length > 0 && !busy

  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-[400px]">
        <div className="panel head-in p-5">
          <span className="brand-badge">VELI</span>

          <h1 className="mt-4 text-[18px] tracking-tight">Logistics Tarayıcı</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
            Foxhole save dosyalarını okuyup veritabanına aktarmak için giriş yapın.
          </p>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="label">Kullanıcı adı</span>
              <span className="relative">
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
                  placeholder="ornek_kullanici"
                  autoComplete="username"
                  className="field mono pl-9"
                />
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="label">Şifre</span>
              <span className="relative">
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
                  autoComplete="current-password"
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
              <span className="text-[12px] text-[var(--text-muted)]">Beni hatırla</span>
            </label>

            <button type="submit" disabled={!ready} className="btn-primary mt-1">
              {busy ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Bağlanıyor…
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Giriş Yap
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

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
            <Lock size={12} className="shrink-0 text-[var(--text-dim)]" />
            <p className="text-[11px] text-[var(--text-dim)]">
              Kayıt hesap panosundan yapılır. Bu uygulama yalnızca mevcut hesabınızla veri
              aktarır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
