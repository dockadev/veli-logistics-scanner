# Veli Logistics Tracker

A desktop app that reads Foxhole game save files and imports depot inventories
into the VELI logistics dashboard.

It reads the depots you pinned in game, resolves item codenames to their
display names, and writes them to the database. New depots are added in an
"awaiting approval" state; a logistics officer approves them from the web
panel, after which they appear on the site.

## Features

- **Shard support** — Foxhole writes the map as several `.sav` parts. The app
  reads all of them; picking only the newest file silently drops depots from
  the other shards.
- **Partial-write protection** — The game truncates a save before writing it.
  The app waits until the file size is stable, then reads it.
- **Approved depots are preserved** — Once a depot is integrated, rescanning
  does not strip its approval, subregion or access code; only the stock is
  updated.
- **Stock diff** — `previous` / `current` back the change graph in the panel.
  A 15-minute cooldown keeps repeat scans from flattening that graph.
- **Four languages** — English, Turkish, German and Brazilian Portuguese. Only
  the selected language is loaded.
- **Unresolved items** — When the game adds new items, their raw codenames are
  listed and you are told to update `codenames.json`.

## Requirements

- Windows 10 or later
- [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)
  — usually already present on Windows 10/11

## Setup

Requires:

- [Node.js](https://nodejs.org/) 20 or later
- [Rust](https://rustup.rs/) (stable)

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable (anon) key |

## Development

```bash
npm run tauri dev
```

## Tests

```bash
npm run build                                    # type-check + frontend build
cargo test --manifest-path src-tauri/Cargo.toml  # parser tests
```

## Build

```bash
npm run tauri build -- --no-bundle --ci
```

This produces `src-tauri/target/release/veli-scanner.exe`, which CI renames to
`Veli-Logistics-Tracker-<version>.exe`. No installer is produced; the exe is
downloaded and run directly.

## GitHub Actions

Every push to `master` runs the tests (Rust parser tests plus a frontend
type-check and build). Pushing a `v*` tag builds the exe and uploads it to
the [Releases](https://github.com/dockadev/veli-logistics-scanner/releases)
page. Supabase values come from Actions secrets.

Tests are deliberately kept out of the tag job: running them there would
compile the ~300-crate Tauri dependency tree twice, once for `cargo test`
and again for the release build.

## Architecture

Rust is limited to reading and parsing save files; auth, UI and database work
live in the frontend. There are three Tauri commands:

| Command | Purpose |
|---|---|
| `find_save_files` | Lists `.sav` files in the `SaveGames` directory |
| `read_stable_file` | Protects the read while the game is writing |
| `parse_save_file` | Parses bytes into depots and unresolved items |

Item codenames (`codenames.json`) and categories (`categories.json`) are
embedded into the exe at build time; no sidecar files are needed.

## Security

The anon (publishable) key is present in the app as plain text, which is how
Supabase designs client applications to work. Actual protection lives in the
Supabase RLS policies: data is readable only by users whose
`profiles.status = 'approved'`. The app additionally verifies approval status
against the server before writing.

A service role key or any other secret must not be placed in `.env`; `.env` is
gitignored.

Depot approvals are not automatic: a new depot is written with
`isIntegrated: false` and only appears on the site after a logistics officer
approves it from the web panel. Rescanning an approved depot keeps its
approval, subregion and access code intact — only the stock figures move.

## License

Private use.