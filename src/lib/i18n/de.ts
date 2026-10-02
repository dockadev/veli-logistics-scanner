import { en } from './en'

export const de: Partial<Record<keyof typeof en, string>> = {
  app_title: 'Logistik-Scanner',
  language: 'Sprache',
  loading: 'Wird geladen...',
  sign_out: 'Abmelden',
  username_label: 'Benutzername',
  password_label: 'Passwort',
  remember_me: 'Angemeldet bleiben',
  username_placeholder: 'logislave',
  login_button: 'Anmelden',
  connecting: 'Verbindung wird hergestellt...',

  login_subtitle:
    'Melden Sie sich an, um Ihre Foxhole-Speicherdateien in die Logistikdatenbank zu importieren.',
  registration_note:
    'Die Registrierung erfolgt über das Konto-Panel. Diese App importiert Daten nur mit einem bestehenden Konto.',
  register_redirect: 'Noch kein Konto? Auf der Website registrieren',
  error_username:
    'Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten.',
  error_credentials: 'Benutzername oder Passwort ist falsch.',
  error_generic:
    'Die Anmeldung konnte nicht abgeschlossen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  error_db_missing: 'Datenbankkonfiguration fehlt.',

  config_missing_title: 'Konfiguration fehlt',
  config_missing_desc:
    'VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY sind nicht gesetzt. Prüfen Sie die .env-Datei im Projektstamm.',

  save_files: 'Speicherdateien',
  not_searched: 'Noch nicht gesucht.',
  show_more_files: '+{count} weitere Dateien',
  show_less: 'Weniger anzeigen',
  scan_and_import: 'Scannen und importieren',
  detect: 'Automatisch suchen',

  region_count: 'Regionen',
  depot_count: 'Depots',
  item_varieties: 'Gegenstandsvielfalt',
  written: 'Geschrieben',
  scanned_regions: 'Gescannte Regionen',
  regions_hover_hint: 'Region überfahren, um ihre Depots zu sehen',
  region_hover_hint: 'Depots dieser Region anzeigen',
  storage: 'Lager',
  seaport: 'Seehafen',
  aircraft: 'Flugzeugdepot',
  item_count: '{count} Gegenstände',
  unresolved_codenames:
    '{count} Codenamen konnten nicht aufgelöst werden. Wenn das Spiel neue Gegenstände hinzugefügt hat, aktualisieren Sie codenames.json.',

  log_title: 'Protokoll',
  log_empty: 'Noch keine Aktivität.',

  log_session_restored: 'Sitzung wiederhergestellt: {username}',
  log_searching: 'Speicherdateien werden gesucht...',
  log_no_save_files: 'Keine .sav-Dateien im Verzeichnis gefunden.',
  log_files_found: '{count} Speicherdateien gefunden ({size}).',
  log_no_save_readable: 'Keine der Speicherdateien konnte gelesen werden.',
  log_scan_done:
    '{shards} Shards gelesen, {depots} Depots aus {regions} Regionen, {varieties} Gegenstandsvielfalten.',
  log_no_depots:
    'Foxhole lädt Kartendaten vom Server; lokale Speicher enthalten nur Depots, die Sie angeheftet haben. Heften Sie ein Depot im Spiel an und versuchen Sie es erneut.',
  log_depots_written: '{count} Depots in die Datenbank geschrieben.',
  log_depots_staged: '{count} neue Depots zur Offiziersfreigabe eingereiht.',
  log_depots_updated: '{count} bestehende Depots aktualisiert.',
  log_not_written: 'Nicht gesendet: keine aktive Sitzung.',
  approval_not_approved:
    'Ihr Konto wurde noch nicht freigegeben. Ein Offizier muss es freigeben, bevor Sie Daten importieren können.',
  approval_unverifiable:
    'Ihr Freigabestatus konnte nicht überprüft werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  log_unresolved: '{count} Codenamen konnten nicht aufgelöst werden.',
  log_signed_out: 'Abgemeldet.',
}