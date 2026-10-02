import { en } from './en'

export const tr: Partial<Record<keyof typeof en, string>> = {
  app_title: 'Logistics Tarayıcı',
  language: 'Dil',
  loading: 'Yükleniyor...',
  sign_out: 'Çıkış',
  username_label: 'Kullanıcı adı',
  password_label: 'Şifre',
  remember_me: 'Beni hatırla',
  username_placeholder: 'logislave',
  login_button: 'Giriş Yap',
  connecting: 'Bağlanıyor...',

  login_subtitle:
    'Foxhole save dosyalarınızı lojistik veritabanına aktarmak için giriş yapın.',
  registration_note:
    'Kayıt hesap panosundan yapılır. Bu uygulama yalnızca mevcut hesabınızla veri aktarır.',
  register_redirect: 'Hesabınız yok mu? Web sitesinden kayıt olun',
  error_username: 'Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.',
  error_credentials: 'Kullanıcı adı veya şifre hatalı.',
  error_generic: 'Giriş yapılamadı. Bağlantını kontrol edip tekrar deneyin.',
  error_db_missing: 'Veritabanı yapılandırması eksik.',

  config_missing_title: 'Yapılandırma eksik',
  config_missing_desc:
    'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı değil. Proje kökündeki .env dosyasını kontrol edin.',

  save_files: 'Save dosyaları',
  not_searched: 'Henüz aranmadı.',
  show_more_files: '+{count} dosya daha',
  show_less: 'Daha az göster',
  scan_and_import: 'Tara ve İçe Aktar',
  detect: 'Otomatik Bul',

  region_count: 'Bölge',
  depot_count: 'Depo',
  item_varieties: 'Item çeşidi',
  written: 'Yazılan',
  scanned_regions: 'Okunan bölgeler',
  regions_hover_hint: 'Depoları görmek için bölgenin üzerine gelin',
  region_hover_hint: 'Bu bölgedeki depoları göster',
  storage: 'Depo',
  seaport: 'Liman',
  aircraft: 'Uçak Deposu',
  item_count: '{count} item',
  unresolved_codenames:
    '{count} codename çözümlenemedi. Oyun yeni item eklediyse codenames.json dosyasını güncellemen gerekir.',

  log_title: 'Kayıt',
  log_empty: 'Henüz işlem yok.',

  log_session_restored: 'Oturum geri yüklendi: {username}',
  log_searching: 'Save dosyaları aranıyor...',
  log_no_save_files: 'Dizinde hiç .sav dosyası yok.',
  log_files_found: '{count} save dosyası bulundu ({size}).',
  log_no_save_readable: 'Hiçbir save dosyası okunamadı.',
  log_scan_done: '{shards} shard okundu, {regions} bölgeden {depots} depo, {varieties} item çeşidi.',
  log_no_depots:
    'Foxhole harita verisini sunucudan indirir; yerel save yalnızca haritada sabitlediğin depoları içerir. Oyunda bir depoyu sabitleyip tekrar deneyin.',
  log_depots_written: '{count} depo veritabanına yazıldı.',
  log_depots_staged: '{count} yeni depo subay onayı için sıraya alındı.',
  log_depots_updated: '{count} mevcut depo güncellendi.',
  log_not_written: 'Gönderilmedi: etkin oturum yok.',
  approval_not_approved:
    'Hesabınız henüz onaylanmadı. Veri aktarımı için bir subayın onayı gerekiyor.',
  approval_unverifiable: 'Onay durumu doğrulanamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  log_unresolved: '{count} codename çözümlenemedi.',
  log_signed_out: 'Oturum kapatıldı.',
}