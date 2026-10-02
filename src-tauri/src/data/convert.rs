use super::catalog::ItemCatalog;
use crate::models::ItemEntryRecord;
use crate::sav::Stockpile;
use std::collections::{BTreeMap, HashSet};

#[derive(Debug, Default)]
pub struct ScanOutcome {
  pub depots: Vec<ConvertedDepot>,
  /// `codenames.json`'da karşılığı olmayan oyun codename'leri.
  pub unresolved: BTreeMap<String, i64>,
  pub item_varieties: usize,
}

/// Bir depo, dönüştürülmüş hâliyle birlikte.
#[derive(Debug)]
pub struct ConvertedDepot {
  pub location: String,
  pub region: String,
  /// Görünen item adı -> adet + kategori.
  pub current: BTreeMap<String, ItemEntryRecord>,
}

/// Ham codename'leri görünen item adlarına çevirip depo kayıtları üretir.
///
/// Çözümlenemeyen codename'ler bilerek atlanır: eski uygulama bunları ham
/// kod olarak veritabanına yazıyordu, bu da oyunda yeni bir item eklendiğinde
/// depoda okunmayan bir isim beliriyordu. Burada onlar raporlanır.
pub fn stockpiles_to_depots(
    stockpiles: &[Stockpile],
    catalog: &ItemCatalog,
) -> ScanOutcome {
    let mut outcome = ScanOutcome::default();
    let mut unresolved: BTreeMap<String, i64> = BTreeMap::new();
    let mut varieties: HashSet<String> = HashSet::new();

    for stockpile in stockpiles {
        let mut current: BTreeMap<String, ItemEntryRecord> = BTreeMap::new();

        for ((codename, is_crate), qty) in &stockpile.items {
            let Some(base) = catalog.display_name(codename) else {
                *unresolved.entry(codename.to_string()).or_insert(0) += *qty;
                continue;
            };

            let name = if *is_crate {
                format!("{base} (Crate)")
            } else {
                base.to_string()
            };

            let category = db_category(catalog, &name);
            let entry = current
                .entry(name.clone())
                .or_insert(ItemEntryRecord { count: 0, category });
            entry.count += *qty;
            varieties.insert(name);
        }

        outcome.depots.push(ConvertedDepot {
            location: stockpile.location.clone(),
            region: stockpile.region.clone(),
            current,
        });
    }

    outcome.unresolved = unresolved;
    outcome.item_varieties = varieties.len();
    outcome
}

/// `item_categories.ts` içindeki resmi kategoriye göre, `depots.data`
/// JSON'unda kullanılan beş değerli tip.
fn db_category(catalog: &ItemCatalog, item_name: &str) -> &'static str {
    let official = catalog.category_of(item_name);
    let is_crate = item_name.ends_with("(Crate)");

    match official {
        "vehicles" => {
            if is_crate {
                "crate_vehicle"
            } else {
                "vehicle"
            }
        }
        "shippables" => "structure",
        _ => {
            if is_crate {
                "crate"
            } else {
                "item"
            }
        }
    }
}