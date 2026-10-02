use super::props::{PropValue, Props, parse_struct_properties};
use super::reader::BinaryReader;
use super::regions::clean_hex_map_name;
use std::collections::BTreeMap;

#[derive(Debug)]
pub enum SavError {
    NotGvas,
    UnexpectedProperty(String),
}

impl std::fmt::Display for SavError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SavError::NotGvas => write!(f, "Geçersiz save dosyası (GVAS imzası bulunamadı)"),
            SavError::UnexpectedProperty(t) => write!(f, "Beklenmeyen özellik tipi: {t}"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct Stockpile {
    pub location: String,
    pub region: String,
    /// (oyun codename'i, kutu mu) -> adet. Ekrana ad çevirisi veri katmanında yapılır.
    pub items: BTreeMap<(String, bool), i64>,
}

const PINNED_TOOLTIPS: &[u8] = b"PinnedMapToolTipsC";

/// Bir GVAS save dosyasındaki özel/rezerv depoları okur.
///
/// Oyun yalnızca `PinnedMapToolTipsC` dizisini ilgilendirdiğimiz için
/// dosyanın geri kalanı (harita durumu, oyuncular, savaş verisi) atlanır.
pub fn parse_sav_file(bytes: &[u8]) -> Result<Vec<Stockpile>, SavError> {
    if bytes.len() < 4 || &bytes[..4] != b"GVAS" {
        return Err(SavError::NotGvas);
    }

    let Some(pin_idx) = find_subslice(bytes, PINNED_TOOLTIPS) else {
        // Pinlenmiş tooltip yok; bu bir hata değil, sadece veri yok.
        return Ok(Vec::new());
    };

    if pin_idx < 4 {
        return Ok(Vec::new());
    }

    let mut reader = BinaryReader::new(bytes);
    reader.offset = pin_idx - 4;

    reader.read_string(); // PinnedMapToolTipsC
    let prop_type = reader.read_string();
    if prop_type != "ArrayProperty" {
        return Err(SavError::UnexpectedProperty(prop_type));
    }
    reader.read_i32(); // boyut
    reader.read_i32(); // indeks
    let inner_type = reader.read_string();
    reader.read_u8(); // terminator

    if inner_type != "StructProperty" {
        return Ok(Vec::new());
    }

    let element_count = reader.read_i32();

    reader.read_string(); // PinnedMapToolTipsC
    reader.read_string(); // StructProperty
    reader.read_i32(); // boyut
    reader.read_i32(); // indeks
    reader.read_string(); // PinnedMapToolTipSaveData
    reader.skip(16); // GUID
    reader.read_u8(); // terminator

    let mut result: Vec<Stockpile> = Vec::new();

    for _ in 0..element_count.max(0) {
        if reader.remaining() == 0 {
            break;
        }
        let tooltip = parse_struct_properties(&mut reader);
        collect_tooltips(&tooltip, &mut result);
    }

    Ok(result)
}

fn collect_tooltips(tooltip: &Props, out: &mut Vec<Stockpile>) {
    let region = tooltip
        .get("MapId")
        .map(|v| clean_hex_map_name(v.as_str()))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Unknown Region".to_string());

    let initial = tooltip.get("InitalMapItemDetails"); // oyundaki yazım hatası bilinçli
    let structure_type = detect_structure_type(initial);

// Aynı depo bilgisi birden fazla kaynakta tekrarlanabilir;
    // eski uygulamanın yaptığı gibi en dolu kaynak kazanır.
    for source in [
        initial,
        tooltip.get("RecentMapItemDetails"),
        Some(&PropValue::Struct {
            struct_type: String::new(),
            fields: tooltip.clone(),
        }),
    ] {
        let Some(source) = source else { continue };
        let Some(list) = source.field("ReserveStockpileInfoList") else { continue };

        for stockpile in list.as_array() {
            let tag = stockpile
                .field("StockpileName")
                .map(|v| v.as_str().to_string())
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "Unknown Tag".to_string());

            let Some(info) = stockpile.field("StockpileInfo") else { continue };

            let items = extract_items(info);

            let location = format!("{region} - {structure_type} - {tag}");

            match out.iter_mut().find(|s| s.location == location) {
                Some(existing) => {
                    if !items.is_empty() || existing.items.is_empty() {
                        existing.items = items;
                        existing.region = region.clone();
                    }
                }
                None => out.push(Stockpile {
                    location,
                    region: region.clone(),
                    items,
                }),
            }
        }
    }
}

fn detect_structure_type(initial: Option<&PropValue>) -> &'static str {
    let Some(structures) = initial
        .and_then(|d| d.field("StockpileInfo"))
        .and_then(|i| i.field("Structures"))
    else {
        return "Storage Depot";
    };

    let has = |target: &str| {
        structures
            .as_array()
            .iter()
            .any(|s| s.field("CodeName").map(|c| c.as_str()) == Some(target))
    };

    if has("Seaport") {
        "Seaport"
    } else if has("AircraftDepot") {
        "Aircraft Depot"
    } else {
        "Storage Depot"
    }
}

/// Altı kaynak diziyi tek düz item haritasına indirger.
fn extract_items(info: &PropValue) -> BTreeMap<(String, bool), i64> {
    let mut items: BTreeMap<(String, bool), i64> = BTreeMap::new();

    for (field, is_crate) in [
        ("Items", false),
        ("ItemCrates", true),
        ("Vehicles", false),
        ("VehicleCrates", true),
        ("Structures", false),
        ("StructureCrates", true),
    ] {
        let Some(entries) = info.field(field) else { continue };
        for entry in entries.as_array() {
            let Some(codename) = entry.field("CodeName").map(|c| c.as_str()) else {
                continue;
            };
            if codename.is_empty() {
                continue;
            }
            let qty = entry.field("Quantity").map(|q| q.as_int()).unwrap_or(0);
            *items.entry((codename.to_string(), is_crate)).or_insert(0) += qty;
        }
    }

    items
}

fn find_subslice(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack.windows(needle.len()).position(|w| w == needle)
}