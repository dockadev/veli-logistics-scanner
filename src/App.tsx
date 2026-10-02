import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { User } from '@supabase/supabase-js'
import { Login } from './components/Login'
import { LogPanel } from './components/LogPanel'
import { ScanPanel } from './components/ScanPanel'
import { SummaryPanel } from './components/SummaryPanel'
import {
  formatMb,
  nowIso,
  pruneHistory,
  recordHistory,
  timeOfDay,
  toDepotRecord,
  writeDepots,
} from './lib/db'
import { restoreSession, signOut, usernameFromUser } from './lib/auth'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { DepotOut, LogKind, LogLine, ParseResult, SaveFileInfo, ScanSummary } from './types'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [files, setFiles] = useState<SaveFileInfo[]>([])
  const [log, setLog] = useState<LogLine[]>([])
  const [summary, setSummary] = useState<ScanSummary | null>(null)

  const addLog = useCallback((message: string, kind: LogKind = 'info') => {
    setLog((prev) => [...prev.slice(-300), { time: timeOfDay(), kind, message }])
  }, [])

  // Açılışta var olan oturumu geri yükle.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!isSupabaseConfigured || !supabase) {
        setReady(true)
        return
      }
      const { user: restored } = await restoreSession(supabase)
      if (cancelled) return
      if (restored) {
        setUser(restored)
        addLog(`Oturum geri yüklendi: ${usernameFromUser(restored)}`, 'ok')
      }
      setReady(true)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [addLog])

  async function handleDetect() {
    setBusy(true)
    addLog('Save dosyaları aranıyor…')

    try {
      const found = await invoke<SaveFileInfo[]>('find_save_files')
      setFiles(found)

      if (found.length === 0) {
        addLog('Dizinde hiç .sav dosyası yok.', 'warn')
      } else {
        const size = found.reduce((sum, f) => sum + f.size, 0)
        addLog(`${found.length} save dosyası bulundu (${formatMb(size)}).`, 'ok')
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
        addLog('Hiçbir save dosyası okunamadı.', 'error')
        return
      }

      const depots = [...merged.values()]
      addLog(`${shards} shard okundu, ${depots.length} depo, ${varieties} item çeşidi.`, 'ok')

      if (depots.length === 0) {
        addLog(
          'Foxhole harita verisini sunucudan indirir; yerel save yalnızca haritada ' +
            'SABİTLEDİĞİN depoları içerir. Oyunda bir depoyu sabitleyip tekrar deneyin.',
          'warn',
        )
      }

      let written = 0
      if (supabase && user) {
        const records = depots.map((d) => toDepotRecord(d, scannedAt))
        written = await writeDepots(records, user.id)
        await recordHistory(records, user.id)
        await pruneHistory()
        addLog(`${written} depo veritabanına yazıldı.`, 'ok')
      } else {
        addLog('Oturum olmadığı için veritabanına yazılmadı.', 'warn')
      }

      if (unresolved.size > 0) {
        addLog(`${unresolved.size} codename çözümlenemedi.`, 'warn')
      }

      setSummary({
        shards,
        depots: depots.length,
        varieties,
        unresolved: [...unresolved].map(([codename, qty]) => ({ codename, qty })),
        written,
        notWritten: !(supabase && user),
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
    addLog('Oturum kapatıldı.', 'info')
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="text-[12px] text-[var(--text-dim)]">Yükleniyor…</span>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="panel max-w-[420px] p-5">
          <h1 className="text-[18px]">Yapılandırma eksik</h1>
          <p className="notice notice-danger mt-3">
            VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı değil. Proje kökündeki{' '}
            <span className="mono">.env</span> dosyasını kontrol edin.
          </p>
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
        <div className="flex items-center gap-2.5">
          <span className="brand-badge">VELI</span>
          <span className="text-[14px] text-[var(--text)]">Logistics Tarayıcı</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="mono text-[12px] text-[var(--text-muted)]">
            {usernameFromUser(user)}
          </span>
          <button type="button" onClick={handleSignOut} className="btn-ghost">
            Çıkış
          </button>
        </div>
      </header>

      <ScanPanel files={files} busy={busy} onDetect={handleDetect} onScan={handleScan} />

      {summary && <SummaryPanel summary={summary} />}

      <LogPanel lines={log} />
    </div>
  )
}