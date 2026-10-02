use super::reader::BinaryReader;
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub enum PropValue {
    #[default]
    None,
    Int(i64),
    Str(String),
    Struct {
        #[allow(dead_code)]
        struct_type: String,
        fields: HashMap<String, PropValue>,
    },
    Array(Vec<PropValue>),
}

impl PropValue {
    pub fn as_str(&self) -> &str {
        match self {
            PropValue::Str(s) => s,
            _ => "",
        }
    }

    pub fn as_int(&self) -> i64 {
        match self {
            PropValue::Int(i) => *i,
            _ => 0,
        }
    }

    pub fn as_array(&self) -> &[PropValue] {
        match self {
            PropValue::Array(v) => v,
            _ => &[],
        }
    }

    pub fn field(&self, name: &str) -> Option<&PropValue> {
        match self {
            PropValue::Struct { fields, .. } => fields.get(name),
            _ => None,
        }
    }
}

pub type Props = HashMap<String, PropValue>;

/// Etiketli özellik listesini okur. "None" veya boş isimli alan listeyi bitirir.
pub fn parse_struct_properties(reader: &mut BinaryReader) -> Props {
    let mut props = Props::new();

    loop {
        if reader.remaining() == 0 {
            break;
        }
        let name = reader.read_string();
        if name.is_empty() || name == "None" {
            break;
        }

        let prop_type = reader.read_string();
        let size = reader.read_i32();
        reader.read_i32(); // index, daima sıfır

        let value = match prop_type.as_str() {
            "StructProperty" => {
                let struct_type = reader.read_string();
                reader.skip(16); // GUID
                reader.read_u8(); // terminator

                match struct_type.as_str() {
                    "Vector2D" => {
                        reader.read_f32();
                        reader.read_f32();
                        PropValue::None
                    }
                    "DateTime" => PropValue::Int(reader.read_i64()),
                    _ => PropValue::Struct {
                        struct_type,
                        fields: parse_struct_properties(reader),
                    },
                }
            }
            "EnumProperty" => {
                reader.read_string(); // enum type
                reader.read_u8(); // terminator
                PropValue::Str(reader.read_string())
            }
            "StrProperty" | "NameProperty" => {
                reader.read_u8(); // terminator
                PropValue::Str(reader.read_string())
            }
            "Int16Property" => {
                reader.read_u8(); // terminator
                PropValue::Int(reader.read_i16() as i64)
            }
            "IntProperty" => {
                reader.read_u8(); // terminator
                PropValue::Int(reader.read_i32() as i64)
            }
            "ArrayProperty" => {
                let inner_type = reader.read_string();
                reader.read_u8(); // terminator
                let count = reader.read_i32();

                if inner_type == "StructProperty" {
                    reader.read_string(); // dizi özellik adı
                    reader.read_string(); // dizi özellik tipi
                    reader.read_i64(); // dizi özellik boyutu
                    reader.read_string(); // eleman struct tipi
                    reader.skip(16); // GUID
                    reader.read_u8(); // terminator

                    let mut items = Vec::with_capacity(count.max(0) as usize);
                    for _ in 0..count.max(0) {
                        if reader.remaining() == 0 {
                            break;
                        }
                        items.push(PropValue::Struct {
                            struct_type: String::new(),
                            fields: parse_struct_properties(reader),
                        });
                    }
                    PropValue::Array(items)
                } else {
                    reader.skip(size.saturating_sub(4).max(0) as usize);
                    PropValue::Array(Vec::new())
                }
            }
            _ => {
                reader.read_u8(); // terminator
                reader.skip(size.max(0) as usize);
                PropValue::None
            }
        };

        props.insert(name, value);
    }

    props
}