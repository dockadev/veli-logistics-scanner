use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Debug)]
pub enum ShardError {
  Io(String),
}

impl std::fmt::Display for ShardError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ShardError::Io(m) => write!(f, "Dosya hatası: {m}"),
    }
  }
}

#[derive(Debug, Clone)]
pub struct SaveFile {
  pub path: PathBuf,
  pub size: u64,
  pub modified: SystemTime,
}

/// Foxhole'un save dosyalarının bulunduğu dizin.
pub fn save_dir() -> Option<PathBuf> {
  let local = std::env::var_os("LOCALAPPDATA")?;
  Some(PathBuf::from(local).join("Foxhole").join("Saved").join("SaveGames"))
}

/// `UserData.sav` gibi harita verisi içermeyen dosyaları eler.
///
/// Oyun ayrıca `UserData.sav` yazar; bu dosya harita/depo bilgisi tutmaz,
/// yalnızca oyuncu tercihlerini saklar. GVAS imzası taşımadığı için parse
/// sırasında hata üretir — kullanıcıya anlamsız bir uyarı göstermemek adına
/// taramadan tamamen çıkarılır.
fn is_ignored(path: &Path) -> bool {
  path
    .file_name()
    .and_then(|n| n.to_str())
    .map(|name| name.eq_ignore_ascii_case("UserData.sav"))
    .unwrap_or(false)
}

/// Dizindeki tüm `.sav` dosyalarını, en yeni yazılan önce gelecek şekilde döndürür.
///
/// Foxhole haritayı birden çok parçaya bölerek yazar
/// (`..._MapData_1.sav`, `..._MapData_2.sav`, ...). Yalnızca "en yeni dosya"
/// seçmek diğer parçalardaki depoları sessizce düşürür; bu yüzden hepsi döndürülür.
pub fn find_save_files() -> Result<Vec<SaveFile>, ShardError> {
  let dir = save_dir().ok_or_else(|| {
    ShardError::Io("LOCALAPPDATA bulunamadı (uygulama yalnızca Windows'ta çalışır)".into())
  })?;

  if !dir.exists() {
    return Err(ShardError::Io(format!(
      "SaveGames dizini bulunamadı: {}",
      dir.display()
    )));
  }

  let mut files: Vec<SaveFile> = Vec::new();

  let entries = fs::read_dir(&dir).map_err(|e| ShardError::Io(format!("{}: {e}", dir.display())))?;

  for entry in entries.flatten() {
    let path = entry.path();
    if path.extension().and_then(|e| e.to_str()) != Some("sav") {
      continue;
    }
    if is_ignored(&path) {
      continue;
    }
    let Ok(meta) = entry.metadata() else { continue };
    if !meta.is_file() {
      continue;
    }

    files.push(SaveFile {
      path,
      size: meta.len(),
      modified: meta.modified().unwrap_or(SystemTime::UNIX_EPOCH),
    });
  }

  files.sort_by(|a, b| b.modified.cmp(&a.modified));
  Ok(files)
}