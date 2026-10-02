use std::collections::HashMap;
use std::sync::OnceLock;

/// Unreal hex adını uygulamanın kullandığı bölge adına çevirir.
/// Bilinmeyen hex'lerde adı okunabilir hale getirip döner, hata vermez.
pub fn clean_hex_map_name(hex_name: &str) -> String {
    let base = hex_name.rsplit("::").next().unwrap_or(hex_name);
    if let Some(region) = map().get(base) {
        return region.to_string();
    }
    let trimmed = base.strip_suffix("Hex").unwrap_or(base);
    let mut out = String::with_capacity(trimmed.len() * 2);
    for (i, c) in trimmed.chars().enumerate() {
        if c.is_uppercase() && i > 0 {
            out.push(' ');
        }
        out.push(c);
    }
    out.trim().to_string()
}

fn map() -> &'static HashMap<&'static str, &'static str> {
    static MAP: OnceLock<HashMap<&'static str, &'static str>> = OnceLock::new();
    MAP.get_or_init(|| {
        [
            ("AcrithiaHex", "Acrithia"),
            ("AllodsBightHex", "Allod's Bight"),
            ("AshFieldsHex", "Ash Fields"),
            ("BasinSionnachHex", "Basin Sionnach"),
            ("BastardTongueHex", "Bastard's Tongue"),
            ("BroadPatchesHex", "Broad Patches"),
            ("CallahansPassageHex", "Callahan's Passage"),
            ("CallumsCapeHex", "Callum's Cape"),
            ("ClansheadValleyHex", "Clanshead Valley"),
            ("ColonialHomeRegionHex", "Colonial Home Region"),
            ("DeadlandsHex", "Deadlands"),
            ("DrownedValeHex", "The Drowned Vale"),
            ("EndlessShoreHex", "Endless Shore"),
            ("FarranacCoastHex", "Farranac Coast"),
            ("FishermansRowHex", "Fisherman's Row"),
            ("GodcroftsHex", "Godcrofts"),
            ("GreatMarchHex", "Great March"),
            ("HeartlandsHex", "The Heartlands"),
            ("HowlCountyHex", "Howl County"),
            ("KalokaiHex", "Kalokai"),
            ("KingsCageHex", "King's Cage"),
            ("KuuraStrandHex", "Kuura Strand"),
            ("LinnOfMercyHex", "The Linn of Mercy"),
            ("LochMorHex", "Loch Mór"),
            ("LykosIsleHex", "Lykos Isle"),
            ("MarbanHollowHex", "Marban Hollow"),
            ("MorgensCrossingHex", "Morgen's Crossing"),
            ("NevishLineHex", "Nevish Line"),
            ("OathsHex", "The Oaths"),
            ("OlavisWakeHex", "Olavi's Wake"),
            ("OnyxHex", "Ónyx"),
            ("OriginHex", "Origin"),
            ("PalantineBermHex", "Palantine Berm"),
            ("PariPeakHex", "Pari Peak"),
            ("PipersEnclaveHex", "Piper's Enclave"),
            ("ReachingTrailHex", "Reaching Trail"),
            ("ReaversPassHex", "Reaver's Pass"),
            ("RedRiverHex", "Red River"),
            ("SableportHex", "Sableport"),
            ("ShackledChasmHex", "Shackled Chasm"),
            ("SpeakingWoodsHex", "Speaking Woods"),
            ("StemaLandingHex", "Stema Landing"),
            ("SteneumHex", "Steneum"),
            ("StlicanShelfHex", "Stlican Shelf"),
            ("StonecradleHex", "Stonecradle"),
            ("StygianSwampHex", "Stygian Swamp"),
            ("TempesthavenHex", "Tempest Island"),
            ("TerminusHex", "Terminus"),
            ("TheClahstraHex", "The Clahstra"),
            ("TheDrownedValeHex", "The Drowned Vale"),
            ("TheFingersHex", "The Fingers"),
            ("TheGutterHex", "The Gutter"),
            ("TheHeartlandsHex", "The Heartlands"),
            ("TheLinnOfMercyHex", "The Linn of Mercy"),
            ("TheMoorsHex", "The Moors"),
            ("TheOarbreakerIslesHex", "The Oarbreaker Isles"),
            ("TyrantFoothillsHex", "Tyrant Foothills"),
            ("UmbralWildwoodHex", "Umbral Wildwood"),
            ("ViperPitHex", "Viper Pit"),
            ("WardenHomeRegionHex", "Warden Home Region"),
            ("WeatheredExpanseHex", "Weathered Expanse"),
            ("WestgateHex", "Westgate"),
            ("WrestaHex", "Wresta"),
        ]
        .into_iter()
        .collect()
    })
}