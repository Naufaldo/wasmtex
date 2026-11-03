# WasmTex Studio

> **Self-hosted, browser-native LaTeX & Research Studio powered by WebAssembly.**  
> *Fork of [corca-ai/wasmtex](https://github.com/corca-ai/wasmtex).*

WasmTex Studio provides a complete, zero-install, Overleaf-style web interface for creating, managing, and compiling LaTeX documents client-side directly in the browser. Powered by WebAssembly (pdfLaTeX, XeLaTeX, LuaLaTeX), TeX Live packages stream on demand with zero local backend installation.

---

### 🇮🇩 Ringkasan (Bahasa Indonesia)

Repository ini merupakan *fork* dari **WasmTex** (oleh Corca AI). Fokus utama fork ini adalah menambahkan **Web UI yang lengkap, modern, dan mudah digunakan** (layaknya Overleaf / CorTeX) serta siap untuk **di-deploy mandiri (self-hosted)**:

- **Mode Editor Lengkap**: WYSIWYG Visual Editor, Monaco LaTeX Editor (dengan LSP & auto-complete), dan Dual Split View.
- **Manajemen Proyek**: Dashboard proyek bergaya Overleaf, ganti nama, tag/kategori, dan penyimpanan otomatis di browser.
- **Research Library**: Manajemen sitasi BibTeX dan pencarian referensi literatur.
- **Fitur Kolaborasi**: Riwayat versi (*snapshots*), *track changes / review*, komentar kontekstual, dan pencarian global (`Ctrl+Shift+F`).
- **Kompilasi Client-Side**: Kompilasi berjalan langsung di browser via WebAssembly tanpa perlu menginstal TeX Live di server/komputer.
- **Deploy Mandiri**: Siap dijalankan lokal (`npm run dev`) atau di-deploy langsung ke Cloudflare Workers (`npm run deploy`).

---

## 🚀 Features

- **🎯 Tactical Brutalist UI & Ergonomic Comfort (CorTeX Style)**: High-contrast research studio interface inspired by technical intelligence systems (editorial serif typography, monospaced telemetry data, radar frequency instruments, zero-radius industrial layout, and dark eye-friendly obsidian navbar).
- **👤 Simple Operator Authentication**:
  - Modal login dialog with Operator ID/Email and Passphrase or quick Guest Access.
  - Client-side persistent session (`localStorage`) showing active operator badge and custom authorship on new manuscripts.
- **📦 Zero-Dependency ZIP Auto-Unzip**:
  - Import complete LaTeX archives (`.zip` from Overleaf, arXiv, journals) with automatic client-side extraction via native browser `DecompressionStream('deflate-raw')`.
  - Automatic directory hierarchy creation, `main.tex` discovery, and document title extraction.
  - Supported directly on the dashboard (`⬆ IMPORT LATEX`) and inside the workspace sidebar (`⬆`).
- **📂 Clean & Dynamic Workspace**:
  - Start clean: customize files, folders (`chapters/`, `figures/`), and tags on the fly.
  - Built-in official tutorial: `Tutorial — Getting Started with LaTeX & WasmTex` showcasing math typesetting, BibTeX citations, and multi-file architecture.
  - Automatic persistence: every folder creation, file upload, text edit, and tag modification automatically persists to local browser storage (IndexedDB).
- **☁️ Cloudflare R2 Private Document Storage**:
  - Ready for private cloud backup and synchronization via Cloudflare R2 object storage.
  - Seamless Worker API endpoints (`/api/storage/<key>`) supporting `PUT`, `GET`, `DELETE`, and `LIST`.
  - 1-click `☁ R2 CLOUD` sync directly from the dashboard navbar.
- **✍️ Triple-Mode Editor**:
  - **Visual (WYSIWYG)**: Rich-text document editing for distraction-free writing.
  - **LaTeX Code**: Monaco Editor featuring full syntax highlighting, auto-completion, linting, diagnostics, and LaTeX Language Service (LSP).
  - **Split View**: Synchronized side-by-side editing with live PDF preview.
- **📚 Research Library**: BibTeX citation management, reference catalog, and 1-click citation inserting into LaTeX documents.
- **📝 Review & Track Changes**: Suggestion mode with accept/reject diffs.
- **💬 Contextual Comments**: Add comments on specific text selections, reply, and resolve threads.
- **🕒 Version History & Snapshots**: Automatic and manual snapshot checkpoints with 1-click restore.
- **🔍 Global Project Search**: Find and replace across all project files (`Ctrl+Shift+F` / `Ctrl+K`).
- **⚡ 100% Client-Side WebAssembly Compilation**: Compiles pdfLaTeX, XeLaTeX, and LuaLaTeX directly inside Web Workers.
- **🌐 Cloudflare Worker Proxy & Edge Ready**: Preconfigured with Cloudflare Workers (`wrangler.jsonc` + `worker/index.ts`) for CORS-free TeX Live package streaming and instant edge deployment.
- **🌓 Tactical Light & Dark Theme**: High-contrast off-white parchment and tactical deep-slate themes.

---

## 🛠️ Quick Start (Local Development)

### Prerequisites

- **Node.js**: `>= 20.0.0` (v22 LTS recommended)
- **npm**: `>= 10.0.0`

### 1. Installation

```bash
git clone https://github.com/<your-username>/wasmtex.git
cd wasmtex
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:6001](http://localhost:6001) in your browser. The local Vite dev server proxies TeX Live snapshot assets automatically.

### 3. Verify & Build

```bash
# TypeScript type check
npm run check

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🚢 Deployment (Self-Hosted)

### Option 1: Cloudflare Workers (Recommended Edge)

This repository includes a preconfigured Cloudflare Worker (`wrangler.jsonc` + `worker/index.ts`) that serves static assets with required COOP/COEP headers, reverse-proxies TeX Live packages, and supports private document synchronization with Cloudflare R2:

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. (Optional) Create R2 Bucket for private cloud storage
npx wrangler r2 bucket create wasmtex

# 3. Build & Deploy
npm run build
npm run deploy
```

*Note*: The R2 binding is preconfigured in `wrangler.jsonc` as `MY_BUCKET` / `DOCUMENTS_BUCKET`. If enabled, click `☁ R2 CLOUD` on the studio dashboard to backup your documents to private cloud storage.

### Option 2: Docker & Docker Compose (Self-Hosted Server)

Build and run containerized Nginx with automated COOP/COEP header injection and TeX Live snapshot reverse proxy:

```bash
# Build and run with Docker Compose
docker compose up -d --build
```

Access the studio at `http://localhost:8080`.

### Option 3: Static Hosting (Nginx / Cloudflare Pages / Caddy)

Build the static distribution files:

```bash
npm run build
```

Deploy the `./dist` directory.  
*Note*: Multi-threaded WebAssembly requires `SharedArrayBuffer`. Your server must include these HTTP response headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## 📂 Project Structure

```text
├── dist/                 # Production web build output
├── public/               # Static WASM binaries, formats, and assets
│   └── wasmtex/          # Precompiled pdfLaTeX, XeLaTeX, LuaLaTeX engines
├── src/                  # Application source
│   ├── editor/           # Monaco LaTeX editor & WYSIWYG visual editor
│   ├── features/         # Comments, review/track changes, search, version history
│   ├── library/          # Research & BibTeX reference manager
│   ├── projects/         # Overleaf-style project store & dashboard
│   ├── engine/           # WasmTex WebAssembly execution core & TeX Live streaming
│   ├── lsp/              # LaTeX language service (diagnostics, completion, outline)
│   ├── viewer/           # PDF.js viewer with SyncTeX source mapping
│   ├── main.ts           # Application entrypoint
│   └── styles.css        # Comprehensive application styles (Light / Dark)
├── worker/               # Cloudflare Worker reverse proxy & static asset handler
├── wrangler.jsonc        # Cloudflare deployment configuration
├── vite.config.ts        # Vite bundling & local proxy configuration
└── tsconfig.json         # TypeScript configuration
```

---

## 📜 Credits & License

- Core LaTeX WebAssembly SDK by **[Corca AI](https://github.com/corca-ai/wasmtex)** (WasmTex).
- UI additions, project management, visual editor, and self-hosted deployment tools by fork maintainers.
- Licensed under the **[MIT License](LICENSE)**. Third-party components and TeX engines maintain their respective licenses (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).
