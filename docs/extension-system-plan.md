# Extension System — Implementation Plan

WasmTex menyediakan **2 layer integrasi**:
1. **High-Level Ready-to-Use Helpers (Factory)**: Siap pakai, user cukup oper config (API key, token, endpoint). Tidak perlu tulis plumbing.
2. **Low-Level ExtensionContext + Tooling**: Untuk user yang mau bikin custom extension sendiri dari nol.

Pola ini sama persis dengan `createBiberBackend({ endpoint })` yang sudah ada di WasmTex core.

---

## 1. Developer Experience: Cara User Pakai

User **tidak perlu** coding fetch / WebSocket / mapping sendiri. Cukup import helper dan pass config:

```typescript
import { WasmTex } from 'wasmtex'
import {
  createGitHubExtension,
  createLanguageToolExtension,
  createZoteroExtension,
  createKnitrExtension,
} from 'wasmtex/extensions'

const editor = new WasmTex('#editor', '#preview', {
  extensions: [
    // 1. GitHub: sync repo, user isi token & repo
    createGitHubExtension({
      token: userSettings.githubToken,
      owner: 'alice',
      repo: 'phd-thesis',
      branch: 'main',
    }),

    // 2. Grammar Checker: user pilih endpoint (cloud atau self-hosted)
    createLanguageToolExtension({
      endpoint: userSettings.ltEndpoint ?? 'https://api.languagetoolplus.com',
      apiKey: userSettings.ltApiKey, // optional
      language: 'en-US',
      debounceMs: 500,
    }),

    // 3. Reference Manager: Zotero auto-sync + cite completion
    createZoteroExtension({
      apiKey: userSettings.zoteroApiKey,
      userId: userSettings.zoteroUserId,
      collection: 'thesis',
      targetBibFile: 'references.bib',
    }),

    // 4. R / Knitr: pre-compile hook via user's R server
    createKnitrExtension({
      endpoint: userSettings.rServerEndpoint ?? 'http://localhost:8787',
      filePattern: /\.Rnw$/i,
    }),
  ]
})

await editor.init()
```

User juga bisa pasang/lepas dinamis kapan saja (misal setelah user input API key di UI settings):

```typescript
// Setelah user simpan API key di modal/settings
const ext = createZoteroExtension({ apiKey, userId })
const unbind = editor.registerExtension(ext)

// Jika user revoke / ganti key:
unbind()
```

---

## 2. Arsitektur 2-Tier

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 1: Ready-to-Use Factories (wasmtex/extensions)                    │
│                                                                        │
│  createGitHubExtension(config)                                         │
│  createLanguageToolExtension(config)                                   │
│  createZoteroExtension(config)                                         │
│  createKnitrExtension(config)                                          │
│                                                                        │
│  User cuma pass: { apiKey, token, endpoint, repo, ... }               │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Developer Tooling / Utilities (untuk bikin custom extension)   │
│                                                                        │
│  • mapProseOffsets(prose, textOffset)  — map plain text → LaTeX line:col│
│  • debounce(fn, ms)                    — hindari spam API              │
│  • diffFiles(oldFiles, newFiles)       — compute dirty files            │
│  • formatBibtexItem(entry)             — format citation hover/item    │
├────────────────────────────────────────────────────────────────────────┤
│ Core SDK: ExtensionContext & Registry (wasmtex/core)                   │
│                                                                        │
│  VFS (getFile, setFile) │ Compiler (compile, getPdf) │ Editor (Monaco) │
│  pushDiagnostics()      │ registerCompletionProvider()                 │
│  registerPreCompileHook()│ registerCommand()                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detail Ready-to-Use Helpers (Yang SDK Sediakan)

### 3.1 `createGitHubExtension(config)`

SDK sudah handle logic Git over HTTP via GitHub REST API:
- `pull()`: fetch git tree + blob content → inject ke VFS
- `push(commitMessage)`: diff VFS dengan remote → create tree → commit → update ref
- Register editor command `github.pull` dan `github.push`

```typescript
export interface GitHubExtensionConfig {
  token: string
  owner: string
  repo: string
  branch?: string       // default 'main'
  autoPullOnInit?: boolean // default true
}

export function createGitHubExtension(config: GitHubExtensionConfig): WasmTexExtension
```

### 3.2 `createLanguageToolExtension(config)`

SDK sudah handle:
- Ekstraksi visible prose dari LaTeX via AST `wasmtex/syntax`
- Debounce request (tidak spam API saat user ngetik)
- Mapping error offset dari response LanguageTool balik ke baris & kolom file LaTeX asli
- Render wavy underline di Monaco editor via `pushDiagnostics`
- Quick-fix action (klik error → pilih kata pengganti)

```typescript
export interface LanguageToolExtensionConfig {
  endpoint: string         // e.g. 'https://api.languagetoolplus.com' atau 'http://localhost:8081'
  apiKey?: string          // untuk premium account (optional)
  username?: string        // untuk premium account (optional)
  language?: string        // default 'en-US'
  debounceMs?: number      // default 600ms
  filterRuleIds?: string[] // rule yang mau di-ignore
}

export function createLanguageToolExtension(config: LanguageToolExtensionConfig): WasmTexExtension
```

### 3.3 `createZoteroExtension(config)`

SDK sudah handle:
- Fetch bibliography dari Zotero Web API format BibTeX
- Tulis otomatis ke VFS (`references.bib` atau path pilihan user)
- Auto-complete key di dalam `\cite{...}` (ambil dari metadata cache)
- Sync command `zotero.sync`

```typescript
export interface ZoteroExtensionConfig {
  apiKey: string
  userId: string
  collection?: string      // optional filter by collection
  targetBibFile?: string   // default 'references.bib'
  autoSyncOnInit?: boolean // default true
  syncIntervalMs?: number  // polling interval (0 = manual only, default 0)
}

export function createZoteroExtension(config: ZoteroExtensionConfig): WasmTexExtension
```

### 3.4 `createKnitrExtension(config)`

SDK sudah handle:
- Filter file berekstensi target (misal `.Rnw`, `.Rtex`)
- Jalankan `registerPreCompileHook`: kirim source ke endpoint server R
- Server mereturn `.tex` yang sudah dieksekusi output/gambar-nya
- Inject `.tex` hasil knit ke VFS sebelum WASM compiler jalan

```typescript
export interface KnitrExtensionConfig {
  endpoint: string         // HTTP endpoint server R (contoh: Plumber / custom container)
  filePattern?: RegExp     // default /\.Rnw$/i
  timeoutMs?: number       // default 30000
}

export function createKnitrExtension(config: KnitrExtensionConfig): WasmTexExtension
```

---

## 4. Helper Tooling untuk Custom Extension

Jika user mau bikin extension untuk tool lain (misal: Mendeley, GitLab, Python/Jupyter preprocessor, DeepL):

```typescript
// Import utility functions dari wasmtex/extensions/utils:
import {
  mapProseOffsets,
  debounce,
  diffVfs,
  extractCitationsFromBib,
} from 'wasmtex/extensions/utils'
```

| Utility | Fungsi |
| --- | --- |
| `mapProseOffsets(proseBlocks, offset)` | Mengubah plain-text offset (dari response grammar/spell checker) menjadi `{ line, column }` di source LaTeX asli. Menghitung masking command dan math mode. |
| `debounce(fn, ms)` | Utilitas debounce standar untuk mencegah spam network request saat event `filechange`. |
| `diffVfs(snapshot, currentVfs)` | Menghitung file mana saja yang ditambah, diubah, atau dihapus (berguna untuk extension Git / sync storage). |
| `extractCitationsFromBib(bibContent)` | Helper ringan parser `.bib` untuk mengambil daftar citation key + metadata (title, author, year). |

---

## 5. Scope & Jadwal Implementasi

```
Phase 0: Core Registry & ExtensionContext                  [1 minggu]
├── src/extensions/types.ts           — Interface & types
├── src/extensions/registry.ts        — Registry lifecycle & error isolation
├── src/extensions/context.ts         — Context wrapper & event binder
├── src/extensions/diagnostics.ts     — Monaco marker channel isolation
├── src/extensions/completion.ts      — Completion provider adapter
└── src/extensions/pre-compile.ts     — Pre-compile hook runner

Phase 1: Developer Utilities                               [3 hari]
├── src/extensions/utils/prose-map.ts — LaTeX AST ↔ Plaintext offset mapper
├── src/extensions/utils/debounce.ts  — Debounce helper
└── src/extensions/utils/vfs-diff.ts  — Dirty check & diff helper

Phase 2: Ready-to-Use Extension Factories                  [1.5 minggu]
├── src/extensions/factories/github.ts       — createGitHubExtension()
├── src/extensions/factories/languagetool.ts — createLanguageToolExtension()
├── src/extensions/factories/zotero.ts       — createZoteroExtension()
└── src/extensions/factories/knitr.ts        — createKnitrExtension()

Phase 3: Integration & Testing                             [4 hari]
├── Export entrypoint wasmtex/extensions
├── Integration tests dengan mock servers (GitHub, LT, Zotero, R)
└── Dokumentasi panduan setup dan API reference
```

**Total waktu: ~3.5 minggu.**

---

## 6. Struktur File yang Dibangun

```
src/extensions/
├── types.ts                      # Base interfaces (WasmTexExtension, ExtensionContext, etc.)
├── registry.ts                   # ExtensionRegistry manager
├── context.ts                    # ExtensionContext implementation
├── diagnostics.ts                # External diagnostics channel
├── completion.ts                 # External completion adapter
├── pre-compile.ts                # Pre-compile hook pipeline
├── utils/
│   ├── prose-map.ts              # Source-to-prose offset mapping
│   ├── debounce.ts               # Timer debounce utility
│   └── vfs-diff.ts               # VFS snapshot comparison
├── factories/
│   ├── github.ts                 # createGitHubExtension
│   ├── languagetool.ts           # createLanguageToolExtension
│   ├── zotero.ts                 # createZoteroExtension
│   └── knitr.ts                  # createKnitrExtension
└── index.ts                      # Entrypoint: wasmtex/extensions
```

Zero breaking change terhadap runtime WasmTex yang sudah ada.
User tinggal pilih: pakai factory siap pakai (isi API key), atau pakai toolkit untuk bikin kustom.
