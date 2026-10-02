/** Rust tarafından döndürülen tipler — `src-tauri/src/lib.rs` ile eşleşir. */

export interface SaveFileInfo {
  path: string
  name: string
  size: number
  /** Unix saniye cinsinden son yazılma. */
  modified: number
}

export type ItemCategory = 'item' | 'crate' | 'vehicle' | 'crate_vehicle' | 'structure'

export interface ItemOut {
  name: string
  qty: number
  category: ItemCategory
}

export interface DepotOut {
  /** "Ash Fields - Seaport - VELI-ASH-C" */
  location: string
  region: string
  items: ItemOut[]
}

export interface UnresolvedOut {
  /** Oyun codename'i; `codenames.json`'da karşılığı yok. */
  codename: string
  qty: number
}

export interface ParseResult {
  depots: DepotOut[]
  unresolved: UnresolvedOut[]
  itemVarieties: number
}

export interface ItemRecord {
  count: number
  category: ItemCategory
}

/** `depots.data` sütunundaki JSON şekli — website'in okuduğu yapı. */
export interface DepotRecord {
  name: string
  customName: string | null
  lastUpdated: string
  previous: Record<string, ItemRecord> | null
  current: Record<string, ItemRecord>
  townName: string | null
  subregion: string | null
  depotType: string | null
}

export type LogKind = 'info' | 'ok' | 'warn' | 'error'

export interface LogLine {
  time: string
  kind: LogKind
  message: string
}

export interface ScanSummary {
  shards: number
  depots: number
  varieties: number
  unresolved: UnresolvedOut[]
  written: number
  notWritten: boolean
}