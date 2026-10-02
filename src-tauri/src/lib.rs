use serde::Serialize;
use std::time::{Duration, UNIX_EPOCH};

mod data;
mod models;
mod sav;

/// Frontend'e gönderilen save dosyası bilgisi.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFileInfo {
  pub path: String,
  pub name: String,
  pub size: u64,
  /// Unix saniye cinsinden son yazılma.
  pub modified: u64,
}

/// Tek bir item: görünen ad, adet ve `depots.data` şeklindeki kategori.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemOut {
  pub name: String,
  pub qty: i64,
  pub category: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DepotOut {
  pub location: String,
  pub region: String,
  /// "Storage Depot" / "Seaport" / "Aircraft Depot"
  pub subregion: String,
  /// Oyun etiketi: "VELI-ASH-C".
  pub tag: String,
  pub items: Vec<ItemOut>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnresolvedOut {
  pub codename: String,
  pub qty: i64,
}

/// Tek shard'ın parse sonucu.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseResult {
  pub depots: Vec<DepotOut>,
  pub unresolved: Vec<UnresolvedOut>,
  pub item_varieties: usize,
}

/// `%LOCALAPPDATA%\Foxhole\Saved\SaveGames` içindeki tüm `.sav` dosyaları.
///
/// Foxhole haritayı birden çok parçaya bölerek yazar; yalnızca "en yeni
/// dosya"yı seçmek diğer parçalardaki depoları sessizce düşürür, bu yüzden
/// hepsi döndürülür.
#[tauri::command]
fn find_save_files() -> Result<Vec<SaveFileInfo>, String> {
  let files = sav::find_save_files().map_err(|e| e.to_string())?;

  Ok(
    files
      .into_iter()
      .map(|f| SaveFileInfo {
        name: f
          .path
          .file_name()
          .map(|n| n.to_string_lossy().to_string())
          .unwrap_or_default(),
        path: f.path.to_string_lossy().to_string(),
        size: f.size,
        modified: f
          .modified
          .duration_since(UNIX_EPOCH)
          .map(|d| d.as_secs())
          .unwrap_or(0),
      })
      .collect(),
  )
}

/// Dosyayı yazma sırasında okumaktan korur.
///
/// Oyun kayıt alırken dosya önce kısalır sonra yazılır; bu arada yapılan
/// okuma yarım buffer verir ve parser bozuk sonuç üretir. Boyutun iki
/// ardışık ölçümde sabit kalmasını bekleyerek bunu önlüyoruz.
#[tauri::command]
fn read_stable_file(path: String) -> Result<Vec<u8>, String> {
  const ATTEMPTS: u32 = 5;
  const MAX_FILE_SIZE: u64 = 2 * 1024 * 1024 * 1024; // 2 GB

  let target = std::path::Path::new(&path);

  for _ in 0..ATTEMPTS {
    let first = std::fs::metadata(target).map_err(|e| e.to_string())?;
    if first.len() > MAX_FILE_SIZE {
      return Err("Dosya beklenmedik şekilde büyük.".into());
    }

    std::thread::sleep(Duration::from_millis(300));

    let second = std::fs::metadata(target).map_err(|e| e.to_string())?;
    let stable = first.len() == second.len()
      && first.modified().ok() == second.modified().ok();

    if !stable {
      continue; // hâlâ yazılıyor, yeniden dene
    }

    let bytes = std::fs::read(target).map_err(|e| e.to_string())?;

    // Okuma sırasında büyüdüyse yine yarım veri elde ederiz.
    let after = std::fs::metadata(target).map_err(|e| e.to_string())?;
    if after.len() != bytes.len() as u64 {
      continue;
    }

    return Ok(bytes);
  }

  Err("Dosya şu anda yazılıyor, birazdan tekrar deneyin.".into())
}

/// Baytları Rust'ta çözüp normalize edilmiş sonucu döndürür.
///
/// Parser'ın doğruluğu burada kalır; frontend'e megabaytlık ham veri değil,
/// item adlarına çevrilmiş depolar gider.
#[tauri::command]
fn parse_save_file(bytes: Vec<u8>) -> Result<ParseResult, String> {
  let stockpiles = sav::parse_sav_file(&bytes).map_err(|e| e.to_string())?;
  let catalog = data::ItemCatalog::load()?;

  let outcome = data::convert::stockpiles_to_depots(&stockpiles, &catalog);

  let depots = outcome
    .depots
    .into_iter()
    .map(|depot| DepotOut {
      location: depot.location,
      region: depot.region,
      subregion: depot.subregion,
      tag: depot.tag,
      items: depot
        .current
        .into_iter()
        .map(|(name, entry)| ItemOut {
          name,
          qty: entry.count,
          category: entry.category.to_string(),
        })
        .collect(),
    })
    .collect();

  let unresolved = outcome
    .unresolved
    .into_iter()
    .map(|(codename, qty)| UnresolvedOut { codename, qty })
    .collect();

  Ok(ParseResult {
    depots,
    unresolved,
    item_varieties: outcome.item_varieties,
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // `devtools(true)` hiçbir yerde çağrılmıyor; pencere `tauri.conf.json`'da
  // varsayılan `false` ile açılır. Böylece F12 ve sağ tık "Inspect"
  // debug derlemede de çalışmaz.
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      find_save_files,
      read_stable_file,
      parse_save_file
    ])
    .run(tauri::generate_context!())
    .expect("uygulama başlatılamadı");
}