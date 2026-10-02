/// GVAS (Unreal) save dosyalarındaki FTS string kurallarına göre bayt okur.
///
/// Her okuma önce sınır denetler; taşma durumunda sıfır/boş döner ve
/// `offset`'i ilerletmez. Bu, bozuk veya yarım dosyalarda panik yerine
/// zarif bir şekilde devam etmemizi sağlar.
pub struct BinaryReader<'a> {
    buffer: &'a [u8],
    pub offset: usize,
}

impl<'a> BinaryReader<'a> {
    pub fn new(buffer: &'a [u8]) -> Self {
        Self { buffer, offset: 0 }
    }

    pub fn remaining(&self) -> usize {
        self.buffer.len().saturating_sub(self.offset)
    }

    pub fn read_i32(&mut self) -> i32 {
        if self.remaining() < 4 {
            return 0;
        }
        let mut b = [0u8; 4];
        b.copy_from_slice(&self.buffer[self.offset..self.offset + 4]);
        self.offset += 4;
        i32::from_le_bytes(b)
    }

    /// Unreal 64-bit tam sayıları int32'ye sığdırmaz; yalnızca alt yarısı
    /// kullanılır (boyutlar, tick sayıları bu aralıkta).
    pub fn read_i64(&mut self) -> i64 {
        let low = self.read_i32();
        self.read_i32();
        low as i64
    }

    pub fn read_i16(&mut self) -> i16 {
        if self.remaining() < 2 {
            return 0;
        }
        let mut b = [0u8; 2];
        b.copy_from_slice(&self.buffer[self.offset..self.offset + 2]);
        self.offset += 2;
        i16::from_le_bytes(b)
    }

    pub fn read_f32(&mut self) -> f32 {
        if self.remaining() < 4 {
            return 0.0;
        }
        let mut b = [0u8; 4];
        b.copy_from_slice(&self.buffer[self.offset..self.offset + 4]);
        self.offset += 4;
        f32::from_le_bytes(b)
    }

    pub fn read_u8(&mut self) -> u8 {
        if self.remaining() < 1 {
            return 0;
        }
        let v = self.buffer[self.offset];
        self.offset += 1;
        v
    }

    pub fn skip(&mut self, n: usize) {
        self.offset = self.offset.saturating_add(n).min(self.buffer.len());
    }

    /// Uzunluk işareti FTS konvansiyonunu taşır:
    /// pozitif = UTF-8, negatif = UTF-16LE, sıfır = boş string.
    /// Uzunluk, sondaki NUL terminatörü de içerir.
    pub fn read_string(&mut self) -> String {
        if self.remaining() < 4 {
            return String::new();
        }
        let len = self.read_i32();

        if len == 0 {
            return String::new();
        }

        if len < 0 {
            let u16_len = len.unsigned_abs() as usize;
            let byte_len = u16_len.saturating_mul(2);
            if self.remaining() < byte_len || byte_len < 2 {
                return String::new();
            }
            // Son birim NUL terminatörü; içeriğe dahil edilmez.
            let content = &self.buffer[self.offset..self.offset + byte_len - 2];
            self.offset += byte_len;

            let units: Vec<u16> = content
                .chunks_exact(2)
                .map(|c| u16::from_le_bytes([c[0], c[1]]))
                .collect();
            return String::from_utf16_lossy(&units);
        }

        let len = len as usize;
        if self.remaining() < len {
            return String::new();
        }
        // Sondaki NUL terminatörünü dahil etme.
        let content = &self.buffer[self.offset..self.offset + len - 1];
        self.offset += len;
        String::from_utf8_lossy(content).into_owned()
    }
}