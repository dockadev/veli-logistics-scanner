import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { User } from '@supabase/supabase-js'
import { Login } from './components/Login'
import { LogPanel } from './components/LogPanel'
import { ScanPanel } from './components/ScanPanel'
import { SummaryPanel } from './components/SummaryPanel'
import { useLanguage } from './components/LanguageProvider'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import {
  ApprovalError,
  checkApproval,
  formatMb,
  nowIso,
  pruneHistory,
  timeOfDay,
  toDepotRecord,
  writeDepots,
} from './lib/db'
import { restoreSession, signOut, usernameFromUser } from './lib/auth'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { APP_VERSION } from './lib/version'
import type { DepotOut, LogKind, LogLine, ParseResult, RegionGroup, SaveFileInfo, ScanSummary } from './types'

/** `ApprovalError.code` -> günlük mesajı. */
const APPROVAL_LOG_KEYS = {
  not_approved: 'approval_not_approved',
  unverifiable: 'approval_unverifiable',
} as const

/**
 * Depoları bölge -> alt bölge türü -> depo etiketi şeklinde gruplar.
 *
 * Bölgeler ve alt bölgeler alfabetik sıralanır ki liste okunabilir olsun.
 */
function groupByRegion(depots: DepotOut[]): RegionGroup[] {
  const regions = new Map<string, Map<string, DepotOut[]>>()

  for (const depot of depots) {
    const subs = regions.get(depot.region) ?? new Map<string, DepotOut[]>()
    const list = subs.get(depot.subregion) ?? []
    list.push(depot)
    subs.set(depot.subregion, list)
    regions.set(depot.region, subs)
  }

  return [...regions.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, subs]) => ({
      region,
      subregions: [...subs.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([subregion, list]) => ({
          subregion,
          depots: list
            .map((depot) => ({
              tag: depot.tag,
              location: depot.location,
              itemCount: depot.items.length,
            }))
            .sort((a, b) => a.tag.localeCompare(b.tag)),
        })),
    }))
}

export default function App() {
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [files, setFiles] = useState<SaveFileInfo[]>([])
  const [log, setLog] = useState<LogLine[]>([])
  const [summary, setSummary] = useState<ScanSummary | null>(null)

  const addLog = useCallback(
    (message: string, kind: LogKind = 'info') => {
      setLog((prev) => [...prev.slice(-300), { time: timeOfDay(), kind, message }])
    },
    [],
  )

  // Açılışta var olan oturumu geri yükle ve onay durumunu doğrula.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!isSupabaseConfigured || !supabase) {
        setReady(true)
        return
      }
      const { user: restored } = await restoreSession(supabase)
      if (cancelled) return
      if (!restored) {
        setReady(true)
        return
      }

      // Oturum onay anlamına gelmez. `profiles.status` sunucudan okunur;
      // onaysız veya doğrulanamayan kullanıcı içeriye alınmaz.
      const { approved, error } = await checkApproval()
      if (cancelled) return

      if (!approved) {
        await supabase.auth.signOut().catch(() => {})
        if (cancelled) return
        setReady(true)
        addLog(error ? t(APPROVAL_LOG_KEYS[error.code]) : t('approval_not_approved'), 'warn')
        return
      }

      setUser(restored)
      addLog(t('log_session_restored', { username: usernameFromUser(restored) }), 'ok')
      setReady(true)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [addLog, t])

  async function handleDetect() {
    setBusy(true)
    addLog(t('log_searching'))

    try {
      const found = await invoke<SaveFileInfo[]>('find_save_files')
      setFiles(found)

      if (found.length === 0) {
        addLog(t('log_no_save_files'), 'warn')
      } else {
        const size = found.reduce((sum, f) => sum + f.size, 0)
        addLog(t('log_files_found', { count: found.length, size: formatMb(size) }), 'ok')
      }
    } catch (error) {
      addLog(String(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleScan() {
    setBusy(true)
    const scannedAt = nowIso()
    const unresolved = new Map<string, number>()
    const merged = new Map<string, DepotOut>()
    let shards = 0
    let varieties = 0

    try {
      for (const file of files) {
        let bytes: number[]
        try {
          bytes = await invoke<number[]>('read_stable_file', { path: file.path })
        } catch (error) {
          // Dosya şu anda yazılıyor olabilir; atla, tüm taramayı bozma.
          addLog(`${file.name}: ${String(error)}`, 'warn')
          continue
        }

        let parsed: ParseResult
        try {
          parsed = await invoke<ParseResult>('parse_save_file', { bytes })
        } catch (error) {
          const text = String(error)
          // GVAS imzası olmayan dosyalar (UserData.sav) hata değildir.
          const level = text.includes('GVAS') ? ('warn' as const) : ('error' as const)
          addLog(`${file.name}: ${text}`, level)
          continue
        }

        shards += 1
        varieties = Math.max(varieties, parsed.itemVarieties)

        for (const item of parsed.unresolved) {
          unresolved.set(item.codename, (unresolved.get(item.codename) ?? 0) + item.qty)
        }

        for (const depot of parsed.depots) {
          // Aynı depo birden çok shard'da geçebilir; en dolu kayıt kazanır.
          const existing = merged.get(depot.location)
          if (!existing || depot.items.length > existing.items.length) {
            merged.set(depot.location, depot)
          }
        }
      }

      if (shards === 0) {
        addLog(t('log_no_save_readable'), 'error')
        return
      }

      const depots = [...merged.values()]
      const regions = groupByRegion(depots)

      addLog(
        t('log_scan_done', {
          shards,
          depots: depots.length,
          regions: regions.length,
          varieties,
        }),
        'ok',
      )

      if (depots.length === 0) {
        addLog(t('log_no_depots'), 'warn')
      }

      let written = 0
      if (supabase && user) {
        const records = depots.map((d) => toDepotRecord(d, scannedAt))
        try {
          const result = await writeDepots(records, user.id, usernameFromUser(user))
          await pruneHistory()

          if (result.staged > 0) {
            addLog(t('log_depots_staged', { count: result.staged }), 'ok')
          }
          if (result.updated > 0) {
            addLog(t('log_depots_updated', { count: result.updated }), 'ok')
          }

          written = result.total
        } catch (error) {
          const key = error instanceof ApprovalError ? error.code : null
          addLog(key ? t(APPROVAL_LOG_KEYS[key]) : String(error), 'error')
        }
      } else {
        addLog(t('log_not_written'), 'warn')
      }

      if (unresolved.size > 0) {
        addLog(t('log_unresolved', { count: unresolved.size }), 'warn')
      }

      setSummary({
        shards,
        depots: depots.length,
        varieties,
        unresolved: [...unresolved].map(([codename, qty]) => ({ codename, qty })),
        written,
        notWritten: !(supabase && user),
        regions,
      })
    } catch (error) {
      addLog(String(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    if (supabase) await signOut(supabase)
    setUser(null)
    setFiles([])
    setSummary(null)
    addLog(t('log_signed_out'), 'info')
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="text-[12px] text-[var(--text-dim)]">{t('loading')}</span>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="panel max-w-[420px] p-5">
          <h1 className="text-[18px]">{t('config_missing_title')}</h1>
          <p className="notice notice-danger mt-3">{t('config_missing_desc')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Login
        onSuccess={async () => {
          const { data } = await supabase!.auth.getUser()
          setUser(data.user)
        }}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      <header className="panel flex items-center justify-between px-4 py-2.5">
        <span className="text-[14px] text-[var(--text)]">{t('app_title')}</span>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <span className="mono text-[12px] text-[var(--text-muted)]">
            {usernameFromUser(user)}
          </span>
          <button type="button" onClick={handleSignOut} className="btn-ghost">
            {t('sign_out')}
          </button>
        </div>
      </header>

      <ScanPanel files={files} busy={busy} onDetect={handleDetect} onScan={handleScan} />

      {summary && <SummaryPanel summary={summary} />}

      <LogPanel lines={log} />

      {/* Sürüm bilgisi — hata bildirimlerinde kullanılabilmesi için. */}
      <footer className="shrink-0 text-right">
        <span className="mono text-[10px] text-[var(--text-dim)] opacity-60">
          v{APP_VERSION}
        </span>
      </footer>
    </div>
  )
}