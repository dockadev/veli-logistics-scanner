import { supabase } from './supabase'
import type { DepotOut, DepotRecord } from '../types'

export function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function timeOfDay(): string {
  return new Date().toLocaleTimeString('tr-TR', { hour12: false })
}

/** `DepotOut` -> `depots.data` sütununun beklediği JSON şekli. */
export function toDepotRecord(depot: DepotOut, timestamp: string): DepotRecord {
  const current: DepotRecord['current'] = {}

  for (const item of depot.items) {
    const existing = current[item.name]
    current[item.name] = {
      count: (existing?.count ?? 0) + item.qty,
      category: item.category,
    }
  }

  return {
    name: depot.location,
    customName: null,
    lastUpdated: timestamp,
    previous: null,
    current,
    townName: null,
    subregion: null,
    depotType: null,
  }
}

/**
 * Depoları `depots` tablosuna yazar.
 *
 * Bilinçli olarak hiçbir satırı silmez. Eski uygulama yazmadan önce tüm
 * satırları okuyup bellekteki listede olmayanları siliyordu; o anda geçici
 * bir ağ hatası alınırsa tüm depo kayıtları kayboluyordu.
 */
export async function writeDepots(records: DepotRecord[], userId: string): Promise<number> {
  if (records.length === 0) return 0

  const { error } = await supabase!
    .from('depots')
    .upsert(
      records.map((record) => ({
        name: record.name,
        // `data` metin sütunu; içerik JSON olarak saklanıyor.
        data: JSON.stringify(record),
        updated_by: userId,
        updated_at: nowIso(),
      })),
      { onConflict: 'name' },
    )

  if (error) {
    throw new Error(`Veritabanı hatası: ${error.message}`)
  }

  return records.length
}

/** Yedi günden eski geçmiş kayıtlarını temizler. */
export async function pruneHistory(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  await supabase!
    .from('depots_history')
    .delete()
    .lt('imported_at', sevenDaysAgo)
}

/** En son güncellenen deponun anlık görüntüsünü geçmişe ekler. */
export async function recordHistory(records: DepotRecord[], userId: string): Promise<void> {
  if (records.length === 0) return

  let newest = records[0]
  for (const record of records) {
    if (record.lastUpdated > newest.lastUpdated) newest = record
  }

  // Son 60 saniye içindeyse tekrar yazma.
  const age = Date.now() - new Date(newest.lastUpdated).getTime()
  if (age > 60_000) return

  const { data: existing } = await supabase!
    .from('depots_history')
    .select('id')
    .eq('depot_name', newest.name)
    .eq('imported_at', newest.lastUpdated)
    .limit(1)

  if (existing && existing.length > 0) return

  await supabase!.from('depots_history').insert({
    depot_name: newest.name,
    items: newest.current,
    imported_by: userId,
    imported_at: newest.lastUpdated,
  })
}
