use crate::models::normalize_item_key;
use std::collections::HashMap;

/// Oyun codename'lerini görünen item adlarına çeviren harita ve
/// item adlarını resmi kategorilere bağlayan harita.
pub struct ItemCatalog {
    codenames: HashMap<String, String>,
    categories: HashMap<String, String>,
    /// Görünen addan normalize edilmiş anahtara resmi kategori.
    by_normalized: HashMap<String, &'static str>,
}

impl ItemCatalog {
    pub fn load() -> Result<Self, String> {
        let codenames = load_map("codenames.json")?;
        let categories = load_map("categories.json")?;

        let by_normalized = categories
            .iter()
            .filter_map(|(name, cat)| {
                let key = normalize_item_key(name);
                let cat = static_category(cat)?;
                Some((key, cat))
            })
            .collect();

        Ok(Self {
            codenames,
            categories,
            by_normalized,
        })
    }

    /// Codename'i görünen ada çevirir. `None`, `codenames.json`'ın
    /// güncellenmesi gerektiği anlamına gelir.
    pub fn display_name(&self, codename: &str) -> Option<&str> {
        self.codenames.get(codename).map(|s| s.as_str())
    }

    /// Resmi kategori karşılığı. `depots.data` içindeki `category` alanı
    /// doğrudan bu değerden gelir; website bunu okur.
    pub fn category_of(&self, item_name: &str) -> &'static str {
        let base = item_name
            .strip_suffix(" (Crate)")
            .unwrap_or(item_name)
            .trim();

        // Doğrudan eşleşme, sonra normalize edilmiş eşleşme, sonra varsayılan.
        static_category(self.categories.get(item_name).map(|s| s.as_str()).unwrap_or(""))
            .or_else(|| self.by_normalized.get(&normalize_item_key(base)).copied())
            .unwrap_or("materials")
    }
}

fn static_category(raw: &str) -> Option<&'static str> {
    match raw {
        "small_arms" => Some("small_arms"),
        "heavy_arms" => Some("heavy_arms"),
        "heavy_ammunition" => Some("heavy_ammunition"),
        "utility" => Some("utility"),
        "medical" => Some("medical"),
        "materials" => Some("materials"),
        "uniforms" => Some("uniforms"),
        "aircraft_parts" => Some("aircraft_parts"),
        "vehicles" => Some("vehicles"),
        "shippables" => Some("shippables"),
        "vehicle_crates" => Some("vehicle_crates"),
        "shippable_crates" => Some("shippable_crates"),
        _ => None,
    }
}

/// Item verisi exe'nin içine gömülür.
///
/// Dosya sisteminden okumak kurulumda "dosya bulunamadı" hatası üretiyordu
/// (resources klasörüne kopyalanan dosya exe'nin yanına gelmiyor).
/// `include_str!` derleme anında gömüp exe'yi tek parça halinde taşınabilir
/// kılıyor; güncelleme için yalnızca yeniden derlemek yeterli.
fn load_map(name: &str) -> Result<HashMap<String, String>, String> {
  let text = match name {
    "codenames.json" => include_str!("../../../codenames.json"),
    "categories.json" => include_str!("../../../categories.json"),
    other => return Err(format!("bilinmeyen veri dosyası: {other}")),
  };

  serde_json::from_str(text).map_err(|e| format!("{name} çözümlenemedi: {e}"))
}