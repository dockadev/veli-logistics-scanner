export const en = {
  // Genel
  app_title: 'Logistics Scanner',
  language: 'Language',
  loading: 'Loading...',
  sign_out: 'Sign Out',
  username_label: 'Username',
  password_label: 'Password',
  remember_me: 'Remember Me',
  username_placeholder: 'logislave',
  login_button: 'Log In',
  connecting: 'Connecting...',

  // Giriş ekranı
  login_subtitle:
    'Sign in to import your Foxhole save files into the logistics database.',
  registration_note:
    'Registration is handled from the account panel. This app only imports data with an existing account.',
  register_redirect: 'No account yet? Register on the website',
  error_username: 'Username may only contain letters, numbers and underscore.',
  error_credentials: 'Incorrect username or password.',
  error_generic: 'Sign-in could not be completed. Check your connection and try again.',
  error_db_missing: 'Database configuration is missing.',

  // Yapılandırma hatası
  config_missing_title: 'Configuration missing',
  config_missing_desc: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Check the .env file in the project root.',

  // Tarama paneli
  save_files: 'Save files',
  not_searched: 'Not searched yet.',
  show_more_files: '+{count} more files',
  show_less: 'Show less',
  scan_and_import: 'Scan and Import',
  detect: 'Detect',

  // Özet paneli
  region_count: 'Regions',
  depot_count: 'Depots',
  item_varieties: 'Item varieties',
  written: 'Written',
  scanned_regions: 'Scanned regions',
  regions_hover_hint: 'Hover a region to list its depots',
  region_hover_hint: 'Show the depots in this region',
  // Depo türleri — Rust `storage` / `seaport` / `aircraft` kimliklerini çevirir.
  storage: 'Storage Depot',
  seaport: 'Seaport',
  aircraft: 'Aircraft Depot',
  item_count: '{count} items',
  unresolved_codenames: '{count} codenames could not be resolved. If the game added new items, update codenames.json.',

  // Günlük
  log_title: 'Log',
  log_empty: 'No activity yet.',

  // Günlük mesajları
  log_session_restored: 'Session restored: {username}',
  log_searching: 'Searching for save files...',
  log_no_save_files: 'No .sav files found in the directory.',
  log_files_found: 'Found {count} save files ({size}).',
  log_no_save_readable: 'None of the save files could be read.',
  log_scan_done: 'Read {shards} shards, {depots} depots across {regions} regions, {varieties} item varieties.',
  log_no_depots: 'Foxhole downloads map data from the server; local saves only contain depots you have pinned. Pin a depot in game and try again.',
  log_depots_written: 'Wrote {count} depots to the database.',
  log_depots_staged: 'Queued {count} new depots for officer approval.',
  log_depots_updated: 'Updated {count} existing depots.',
  log_not_written: 'Not submitted: no active session.',
  approval_not_approved: 'Your account has not been approved yet. An officer must approve it before you can import data.',
  approval_unverifiable: 'Could not verify your approval status. Check your connection and try again.',
  log_unresolved: '{count} codenames could not be resolved.',
  log_signed_out: 'Signed out.',
} as const