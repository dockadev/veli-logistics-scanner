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
  /** "Storage Depot" / "Seaport" / "Aircraft Depot" */
  subregion: string
  /** Oyun etiketi: "VELI-ASH-C". `location` bu değer + bölge + türden üretilir. */
  tag: string
  items: ItemOut[]
}

/** Bölge başına okunan depolar, alt bölge türüne göre gruplanmış. */
export interface RegionGroup {
  region: string
  /** alt bölge türü -> o türdeki depolar */
  subregions: SubregionGroup[]
}

export interface SubregionGroup {
  subregion: string
  depots: DepotTag[]
}

/** Panelde gösterilen kısa depo etiketi. */
export interface DepotTag {
  /** "VELI-ASH-C" */
  tag: string
  location: string
  itemCount: number
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
  /**
   * Onay durumu. `false` = entegrasyon bekliyor, subay onayı gerekli.
   * `true` = entegre, sitede görünür.
   *
   * Sitenin `dbService.ts`'i bu alanı yoksa `true` varsayıyor; bu yüzden
   * her kayıtta açıkça yazılmalı, yoksa depo doğrudan onaylı sayılır.
   */
  isIntegrated: boolean
  /** Subayın girdiği depo şifresi. Sadece entegrasyon sonrası dolar ve
   *  yeniden taramada korunur; yeni depoda `null` kalır. */
  accessCode?: string | null
  isCodePublic?: boolean
  /** Güncelleme yapan kullanıcı adı. Panelde "kim taradı" bilgisidir. */
  lastUpdatedBy?: string | null
}

export type LogKind = 'info' | 'ok' | 'warn' | 'error'

export interface LogLine {
  time: string
  kind: LogKind
  message: string
}

export interface ScanSummary {
  /** Okunan MapData parçası sayısı. */
  shards: number
  depots: number
  varieties: number
  unresolved: UnresolvedOut[]
  written: number
  notWritten: boolean
  /** Bölge -> alt bölge -> depo sayısı. */
  regions: RegionGroup[]
}