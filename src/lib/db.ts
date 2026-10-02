import { supabase } from './supabase'
import type { DepotOut, DepotRecord } from '../types'

/** Onay anahtarları, kullanıcıya gösterilecek mesaj için `db.ts` içinde tutulur. */
const APPROVAL_MESSAGES = {
  not_approved: 'Hesabınız henüz onaylanmadı. Veri aktarımı için yönetici onayı gerekir.',
  unverifiable: 'Onay durumu doğrulanamadı. Bağlantınızı kontrol edip tekrar deneyin.',
} as const

export type ApprovalErrorCode = keyof typeof APPROVAL_MESSAGES

export class ApprovalError extends Error {
  readonly code: ApprovalErrorCode

  constructor(code: ApprovalErrorCode) {
    super(APPROVAL_MESSAGES[code])
    this.name = 'ApprovalError'
    this.code = code
  }
}

/**
 * `profiles.status` alanından onay durumunu okur.
 *
 * Sorgu hatası ile "onaysız" durumu ayırt edilir; ikisi de yazmayı
 * engeller ama mesajları farklıdır.
 */
export async function checkApproval(): Promise<{ approved: boolean; error: ApprovalError | null }> {
  if (!supabase) {
    return { approved: false, error: new ApprovalError('unverifiable') }
  }

  try {
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) {
      return { approved: false, error: new ApprovalError('unverifiable') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (error) return { approved: false, error: new ApprovalError('unverifiable') }
    if (data?.status !== 'approved') {
      return { approved: false, error: new ApprovalError('not_approved') }
    }

    return { approved: true, error: null }
  } catch {
    return { approved: false, error: new ApprovalError('unverifiable') }
  }
}

export function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function timeOfDay(): string {
  return new Date().toLocaleTimeString('tr-TR', { hour12: false })
}

/**
 * `DepotOut` -> `depots.data` sütununun beklediği JSON şekli.
 *
 * `isIntegrated` bilerek `false` yazılır. Sitenin `dbService.ts`'i alan
 * yoksa `true` varsayıyor (`if (depot.isIntegrated === undefined)`), yani
 * bu bayrağı yazmazsak taranan depolar doğrudan onaylı sayılır ve genel
 * görünümde görünür. `false` yazmak depoları "entegrasyon bekleyen"
 * durumunda tutar; bir subay sitedeki depo yönetiminden onaylayana kadar
 * orada kalırlar.
 */
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
    isIntegrated: false,
  }
}

export interface WriteResult {
  /** Toplam yazılan depo. */
  total: number
  /** Veritabanında hiç olmayan, "entegrasyon bekleyen" olarak eklenen depolar. */
  staged: number
  /** Zaten var olan, yalnızca stoğu güncellenen depolar. */
  updated: number
}

/**
 * Taramalar arasındaki en kısa süre, dakika cinsinden.
 *
 * Bekleme kuralı, eski uygulamanın davranışıdır ve paneldeki değişim
 * grafiğini bozmak için gereklidir. Parser tüm depoları tek bir zaman
 * damgasıyla damgalar; kullanıcı saniyeler içinde tekrar tararsa gerçek
 * bir stok değişikliği olmasa da her seferinde `previous`a yazılır ve
 * grafik "hiç değişmemiş" görünür.
 *
 * Bu süre içindeki taramalarda `previous` korunur, yalnızca `current`
 * güncellenir. Eşik dışındaki taramalarda eski `current`, `previous`a
 * taşınır.
 */
const DIFF_COOLDOWN_MINUTES = 15

/**
 * Taranan depoları iki tabloya yazar.
 *
 * `depots` — deponun güncel durumu. Anahtar `name` üzerinden upsert yapılır.
 *
 * Onay durumu korunur: `isIntegrated`, `subregion`, `townName` ve
 * `accessCode` alanları mevcut kayıttan alınır. Depo bir kez subay
 * tarafından entegre edildiyse, yeniden tarandığında **onayını kaybetmez**;
 * yalnızca `current` (item miktarları) güncellenir. Yeni depolar
 * `isIntegrated: false` ile "entegrasyon bekleyen" olarak eklenir.
 *
 * `depots_history` — append-only hareket dökümü, her tarama bir satır.
 * Sitedeki `latest_depot_inventories` görünümü bu tablodan türer.
 *
 * `previous`/`current` farkı: eşik dışındaki taramalarda eski `current`
 * `previous`a taşınır, böylece paneldeki değişim grafiği gerçek stok
 * değişimini gösterir. Eşik içindeki taramalarda `previous` korunur.
 * Ayrıntı için `DIFF_COOLDOWN_MINUTES`.
 *
 * `lastUpdatedBy` her kayda yazılır — panelde "bu depoyu kim taradı"
 * bilgisidir.
 *
 * Yazmadan önce kullanıcının onay durumu sunucudan doğrulanır. Supabase
 * `authenticated` rolü onay durumundan bağımsız verildiği için, oturum
 * açmış olmak tek başına yazma yetkisi anlamına gelmez. Sorgu başarısız
 * olursa yazma yapılmaz — kontrol "engelle" yönünde çalışır.
 *
 * Hiçbir satır silinmez. Eski uygulama yazmadan önce bellekteki listede
 * olmayan satırları siliyordu; geçici bir ağ hatası tüm kayıtları siliyordu.
 */
export async function writeDepots(
  records: DepotRecord[],
  userId: string,
  username: string | null,
): Promise<WriteResult> {
  if (records.length === 0) return { total: 0, staged: 0, updated: 0 }

  const { approved, error: approvalError } = await checkApproval()
  if (!approved) {
    throw approvalError ?? new ApprovalError('not_approved')
  }

  const stamp = nowIso()

  // `lastUpdatedBy` panelde "bu depoyu kim taradı" bilgisidir.
  records.forEach((r) => {
    r.lastUpdatedBy = username
  })

  // Onay durumunu korumak için mevcut kayıtlar okunur.
  const { data: existingRows } = await supabase!
    .from('depots')
    .select('name, data')
    .in(
      'name',
      records.map((r) => r.name),
    )

  const existingByName = new Map<string, DepotRecord>()
  for (const row of existingRows ?? []) {
    if (typeof row.data === 'string') {
      try {
        existingByName.set(row.name, JSON.parse(row.data) as DepotRecord)
      } catch {
        // Bozuk JSON: onay durumu bilinmiyor, güvenli taraf seçilir.
      }
    }
  }

  let staged = 0

  const merged = records.map((record) => {
    const existing = existingByName.get(record.name)

    // Yeni depo: onay bekleyen olarak eklenir.
    if (!existing) {
      staged += 1
      return record
    }

    const prevTime = new Date(existing.lastUpdated).getTime()
    const currTime = new Date(record.lastUpdated).getTime()
    const withinCooldown =
      !Number.isNaN(prevTime) &&
      !Number.isNaN(currTime) &&
      Math.abs(currTime - prevTime) < DIFF_COOLDOWN_MINUTES * 60_000

    // Bekleme süresi dolmadıysa `previous` aynen korunur, yoksa eski
    // stok `previous`a taşınır ve grafik gerçek değişimi gösterir.
    const previous =
      existing.lastUpdated === record.lastUpdated || withinCooldown
        ? existing.previous ?? null
        : existing.current

    // Mevcut depo: yalnızca stok güncellenir, onay ve subregion korunur.
    // `isIntegrated` alanı yoksa onaylı varsayılır (sitenin varsayılanıyla
    // aynı davranış); bu durum eski kayıtlarda zaten onaylı demektir.
    return {
      ...record,
      previous,
      subregion: existing.subregion ?? record.subregion,
      townName: existing.townName ?? record.townName,
      isIntegrated: existing.isIntegrated ?? true,
      accessCode: existing.accessCode ?? null,
      isCodePublic: existing.isCodePublic ?? false,
      depotType: existing.depotType ?? record.depotType,
    } as DepotRecord
  })

  const { error: depotError } = await supabase!
    .from('depots')
    .upsert(
      merged.map((record) => ({
        name: record.name,
        data: JSON.stringify(record),
        updated_by: userId,
        updated_at: stamp,
      })),
      { onConflict: 'name' },
    )

  if (depotError) {
    throw new Error(`Depo yazılamadı: ${depotError.message}`)
  }

  await recordHistory(merged, userId)

  return { total: merged.length, staged, updated: merged.length - staged }
}

/**
 * Taranan depoların hareket dökümünü `depots_history` tablosuna yazar.
 *
 * Bu tablo "depo başına tek satır" değil, her taramada bir satır büyüyen
 * bir günlük defterdir; sitedeki `latest_depot_inventories` görünümü
 * `DISTINCT ON (depot_name) ... ORDER BY imported_at DESC` ile bundan
 * "her depo için en son kayıt" üretir.
 *
 * Koruma: son yazma 60 saniye içindeyse yeni satır eklenmez. Kullanıcı
 * "Tara ve İçe Aktar"a arka arkaya basarsa stok değişmemiştir; koruma
 * olmazsa defter aynı verinin kopyalarıyla şişer ve paneldeki değişim
 * grafiği anlamsızlaşırdı.
 *
 * Kıyaslama en son yazılan *depo*ye göre yapılır, tüm kayıtlara göre
 * değil: farklı depoları ardışık taramak da engellenmemelidir.
 */
async function recordHistory(records: DepotRecord[], userId: string): Promise<void> {
  if (records.length === 0) return

  const stamp = records[0].lastUpdated

  const { data: recent } = await supabase!
    .from('depots_history')
    .select('imported_at')
    .order('imported_at', { ascending: false })
    .limit(1)

  const lastWrite = recent?.[0]?.imported_at
  if (lastWrite && Date.now() - new Date(lastWrite).getTime() < 60_000) return

  const { error } = await supabase!
    .from('depots_history')
    .insert(
      records.map((record) => ({
        depot_name: record.name,
        items: record.current,
        imported_by: userId,
        imported_at: stamp,
      })),
    )

  if (error) {
    throw new Error(`Geçmiş yazılamadı: ${error.message}`)
  }
}

/** Yedi günden eski geçmiş kayıtlarını temizler. */
export async function pruneHistory(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  await supabase!
    .from('depots_history')
    .delete()
    .lt('imported_at', sevenDaysAgo)
}
