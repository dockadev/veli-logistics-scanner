import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Sanal e-posta şeması.
 *
 * Kullanıcılar gerçek e-posta adresi değil, `kullaniciadi@pars-logistics.local`
 * biçiminde bir adresle kayıt olur; bu adres hiçbir yere gönderilmez.
 * Website ile birebir aynıdır (`site/components/auth/AuthProvider.tsx`).
 */
export const EMAIL_DOMAIN = 'pars-logistics.local'

const USERNAME_RE = /^[a-zA-Z0-9_]+$/

export type AuthErrorCode = 'username' | 'credentials' | 'generic'

export interface AuthResult {
  ok: boolean
  errorCode?: AuthErrorCode
}

/** Kullanıcı adını Supabase'in beklediği sanal e-posta adresine çevirir. */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export function isValidUsername(name: string): boolean {
  return USERNAME_RE.test(name.trim())
}

const REMEMBER_KEY = 'veli_remember'

export function shouldRemember(): boolean {
  return localStorage.getItem(REMEMBER_KEY) !== 'false'
}

export function setRemember(value: boolean): void {
  localStorage.setItem(REMEMBER_KEY, value ? 'true' : 'false')
}

export async function signIn(
  client: SupabaseClient,
  username: string,
  password: string,
): Promise<AuthResult> {
  const name = username.trim()

  if (!USERNAME_RE.test(name)) {
    return { ok: false, errorCode: 'username' }
  }

  const { error } = await client.auth.signInWithPassword({
    email: usernameToEmail(name),
    password,
  })

  if (error) {
    return {
      ok: false,
      errorCode: error.message.toLowerCase().includes('invalid login')
        ? 'credentials'
        : 'generic',
    }
  }

  return { ok: true }
}

/**
 * Var olan oturumu geri yükler.
 *
 * "Beni hatırla" işaretlenmemişse oturum düşürülür — website'deki davranışın aynısı.
 */
export async function restoreSession(
  client: SupabaseClient,
): Promise<{ session: Session | null; user: User | null }> {
  if (!shouldRemember()) {
    await client.auth.signOut().catch(() => {})
    return { session: null, user: null }
  }

  const { data } = await client.auth.getSession()
  return { session: data.session, user: data.session?.user ?? null }
}

export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut().catch(() => {})
}

/** Oturumdaki kullanıcının kullanıcı adı. */
export function usernameFromUser(user: User | null): string {
  if (!user) return ''
  const meta = user.user_metadata as { username?: string } | undefined
  if (meta?.username) return meta.username
  // Sanal e-posta biçiminden geri çevir.
  return (user.email ?? '').split('@')[0] ?? ''
}

export { supabase }
