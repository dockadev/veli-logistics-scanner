/// Serileştirilebilir item kaydı. `category`, `depots.data` JSON'undaki
/// değerlerle birebir aynıdır:
/// `item` | `crate` | `vehicle` | `crate_vehicle` | `structure`
#[derive(Debug, Clone, serde::Serialize)]
pub struct ItemEntryRecord {
  pub count: i64,
  pub category: &'static str,
}

/// "250mm \"Fury\" Shell" ile "250mm “Fury” Shell" aynı item'dır.
/// Website ve bot tarafıyla aynı normalizasyonu uygular; kesme/şablon
/// karakterleri de kaldırılır.
pub fn normalize_item_key(name: &str) -> String {
  name
    .chars()
    .filter(|c| c.is_ascii_alphanumeric())
    .flat_map(|c| c.to_lowercase())
    .collect()
}