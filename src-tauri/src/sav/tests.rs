//! Parser'ın el yazımıyla üretilmiş baytlarla doğrulanması.
//!
//! Gerçek `.sav` dosyası gerektirmez: FTS kurallarına göre bir GVAS parçası
//! kurup içinden beklenen değeri çıkarmayı sınar.

use super::parser::parse_sav_file;
use super::reader::BinaryReader;

/// FTS string: pozitif uzunluk + içerik + NUL terminatör.
fn push_string(buf: &mut Vec<u8>, s: &str) {
    let bytes = s.as_bytes();
    buf.extend_from_slice(&(bytes.len() as i32 + 1).to_le_bytes());
    buf.extend_from_slice(bytes);
    buf.push(0);
}

fn push_i32(buf: &mut Vec<u8>, v: i32) {
    buf.extend_from_slice(&v.to_le_bytes());
}

/// Etiketli alan başlığı: ad, tip, boyut, indeks.
fn push_prop_header(buf: &mut Vec<u8>, name: &str, prop_type: &str, size: i32) {
    push_string(buf, name);
    push_string(buf, prop_type);
    push_i32(buf, size);
    push_i32(buf, 0);
}

/// `StructProperty` alanı: başlık + tip adı + GUID + terminatör + alanlar + "None".
fn push_struct_prop(
    buf: &mut Vec<u8>,
    name: &str,
    struct_type: &str,
    body: impl FnOnce(&mut Vec<u8>),
) {
    push_prop_header(buf, name, "StructProperty", 0); // boyut okuyucuda kullanılmıyor
    push_string(buf, struct_type);
    buf.extend_from_slice(&[0u8; 16]); // GUID
    buf.push(0); // terminatör
    body(buf);
    push_string(buf, "None");
    push_string(buf, "Property");
}

/// `StrProperty` alanı.
fn push_str_prop(buf: &mut Vec<u8>, name: &str, value: &str) {
    push_prop_header(buf, name, "StrProperty", value.len() as i32 + 5);
    buf.push(0); // terminatør
    push_string(buf, value);
}

/// `IntProperty` alanı.
fn push_int_prop(buf: &mut Vec<u8>, name: &str, value: i32) {
    push_prop_header(buf, name, "IntProperty", 8);
    buf.push(0); // terminatör
    push_i32(buf, value);
}

/// `ArrayProperty` alanı. Elemanlar struct olmalıdır; parser yalnızca bu
/// biçimi gezebiliyor.
fn push_struct_array_prop(
    buf: &mut Vec<u8>,
    name: &str,
    element_type: &str,
    elements: &[(&str, i32)],
) {
    push_prop_header(buf, name, "ArrayProperty", 0);
    push_string(buf, "StructProperty"); // elemin iç tipi
    buf.push(0); // terminatør
    push_i32(buf, elements.len() as i32);

    // İç struct başlığı
    push_string(buf, name);
    push_string(buf, "StructProperty");
    push_i32(buf, 0);
    push_i32(buf, 0);
    push_string(buf, element_type);
    buf.extend_from_slice(&[0u8; 16]);
    buf.push(0);

    for (codename, qty) in elements {
        push_str_prop(buf, "CodeName", codename);
        push_int_prop(buf, "Quantity", *qty);
        push_string(buf, "None");
        push_string(buf, "Property");
    }
}

/// `PinnedMapToolTipsC` dizisini içeren geçerli bir GVAS dosyası üretir.
fn build_sav(codename: &str, qty: i32) -> Vec<u8> {
    let mut buf = Vec::new();
    buf.extend_from_slice(b"GVAS");
    buf.extend_from_slice(&[0u8; 32]); // başlık dolgusu

    push_prop_header(&mut buf, "PinnedMapToolTipsC", "ArrayProperty", 0);
    push_string(&mut buf, "StructProperty");
    buf.push(0); // terminatør
    push_i32(&mut buf, 1); // eleman sayısı

    push_string(&mut buf, "PinnedMapToolTipsC");
    push_string(&mut buf, "StructProperty");
    push_i32(&mut buf, 0);
    push_i32(&mut buf, 0);
    push_string(&mut buf, "PinnedMapToolTipSaveData");
    buf.extend_from_slice(&[0u8; 16]);
    buf.push(0);

    push_str_prop(&mut buf, "MapId", "EWorldConquestMapId::AshFieldsHex");

    // tooltip.InitalMapItemDetails.ReserveStockpileInfoList[0]
    push_struct_prop(&mut buf, "InitalMapItemDetails", "MapItemDetailsSaveData", |b| {
        push_prop_header(b, "ReserveStockpileInfoList", "ArrayProperty", 0);
        push_string(b, "StructProperty");
        b.push(0);
        push_i32(b, 1);
        push_string(b, "ReserveStockpileInfoList");
        push_string(b, "StructProperty");
        push_i32(b, 0);
        push_i32(b, 0);
        push_string(b, "StockpileInfoSaveData");
        b.extend_from_slice(&[0u8; 16]);
        b.push(0);

        push_str_prop(b, "StockpileName", "VELI-ASH-C");

        push_struct_prop(b, "StockpileInfo", "StockpileInfoSaveData", |b| {
            push_struct_array_prop(
                b,
                "Items",
                "StockpileItemSaveData",
                &[(codename, qty)],
            );
        });
    });

    push_string(&mut buf, "None");
    push_string(&mut buf, "Property");

    buf
}

#[test]
fn parses_pinned_stockpile() {
    let bytes = build_sav("BasicMaterials", 42);
    let result = parse_sav_file(&bytes).expect("parse başarısız olmamalı");

    assert_eq!(result.len(), 1, "tek depo bekleniyordu");
    let depot = &result[0];

    assert_eq!(depot.region, "Ash Fields");
    assert_eq!(depot.location, "Ash Fields - Storage Depot - VELI-ASH-C");
    assert_eq!(
        depot.items.get(&("BasicMaterials".to_string(), false)),
        Some(&42)
    );
}

#[test]
fn rejects_non_gvas() {
    let bytes: &[u8] = b"NOPE this is not a save file at all";
    assert!(parse_sav_file(bytes).is_err());
}

#[test]
fn gvas_without_pinned_tooltips_is_not_an_error() {
    let mut bytes = b"GVAS".to_vec();
    bytes.extend_from_slice(&[0u8; 64]);
    let result = parse_sav_file(&bytes).expect("hata olmamalı");
    assert!(result.is_empty());
}

#[test]
fn truncated_input_does_not_panic() {
    let bytes = build_sav("BasicMaterials", 7);
    for cut in [4, 20, 64, 128, bytes.len() / 2, bytes.len() - 1] {
        if cut < bytes.len() {
            let _ = parse_sav_file(&bytes[..cut]);
        }
    }
}

#[test]
fn reader_reads_utf16_strings() {
    let mut buf = Vec::new();
    let text: Vec<u16> = "Ónyx".encode_utf16().collect();
    // Negatif uzunluk = UTF-16LE, son birim NUL terminatör.
    buf.extend_from_slice(&(-((text.len() + 1) as i32)).to_le_bytes());
    for unit in text {
        buf.extend_from_slice(&unit.to_le_bytes());
    }
    buf.extend_from_slice(&[0, 0]);

    let mut reader = BinaryReader::new(&buf);
    assert_eq!(reader.read_string(), "Ónyx");
}

#[test]
fn reader_strips_nul_terminator_from_ascii_strings() {
    let mut buf = Vec::new();
    push_string(&mut buf, "Seaport");
    let mut reader = BinaryReader::new(&buf);
    assert_eq!(reader.read_string(), "Seaport");
}

#[test]
fn known_hex_maps_to_display_region() {
    assert_eq!(
        super::regions::clean_hex_map_name("EWorldConquestMapId::OnyxHex"),
        "Ónyx"
    );
    assert_eq!(
        super::regions::clean_hex_map_name("EWorldConquestMapId::AshFieldsHex"),
        "Ash Fields"
    );
}

#[test]
fn unknown_hex_is_humanized() {
    assert_eq!(
        super::regions::clean_hex_map_name("EWorldConquestMapId::BrandNewZoneHex"),
        "Brand New Zone"
    );
}