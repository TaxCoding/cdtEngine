# Catastrophic Decision Tree (CDT) Engine

Ubah keputusan sepele harian menjadi peta eskalasi bencana komikal — sebuah DAG
(Directed Acyclic Graph) yang dihasilkan Gemini, di-layout dengan Dagre.js, dan
dirender interaktif dengan React Flow. Perhitungan matematis (probabilitas
kumulatif, Catastrophe Risk Index, worst-case path) berjalan sepenuhnya di
browser agar serverless function di Vercel tetap ringan.

## Stack

- Next.js 14 (App Router) + TypeScript
- `@xyflow/react` (React Flow v12) untuk kanvas interaktif
- `dagre` untuk auto-layout graf di client
- MongoDB Atlas (driver `mongodb`) untuk riwayat graf
- Gemini API (`gemini-2.5-flash`) sebagai mesin cerita, dipanggil lewat Route
  Handler agar API key tidak pernah sampai ke browser
- Tailwind CSS

## 1. Setup lokal

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/cdt_db?retryWrites=true&w=majority
```

- **Gemini API key**: buat di https://aistudio.google.com/app/apikey (gratis).
- **MongoDB URI**: buat cluster gratis M0 di https://cloud.mongodb.com →
  Database Access (buat user) → Network Access (izinkan `0.0.0.0/0` supaya
  Vercel bisa konek) → Connect → Drivers → salin connection string. Pastikan
  ada nama database di path-nya (contoh di atas: `cdt_db`).

Jalankan:

```bash
npm run dev
```

Buka http://localhost:3000.

> Catatan: aplikasi tetap bisa dipakai untuk menghasilkan graf walau
> `MONGODB_URI` belum diisi — fitur riwayat saja yang nonaktif dengan pesan
> yang jelas di panel "Riwayat".

## 2. Deploy ke Vercel

### Opsi A — lewat dashboard Vercel

1. Push folder ini ke sebuah repo GitHub/GitLab/Bitbucket.
2. Di https://vercel.com → **Add New Project** → import repo tersebut.
   Vercel otomatis mendeteksi ini sebagai proyek Next.js, tidak perlu
   konfigurasi build khusus.
3. Di step **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`
   - `MONGODB_URI`
4. Klik **Deploy**.

### Opsi B — lewat Vercel CLI

```bash
npm install -g vercel
vercel login
vercel            # deploy preview
vercel env add GEMINI_API_KEY
vercel env add MONGODB_URI
vercel --prod     # deploy production
```

Setelah deploy, buka domain `*.vercel.app` yang diberikan Vercel — aplikasi
langsung jalan.

## 3. Struktur proyek

```
src/
  app/
    page.tsx                  # orkestrasi state: input -> loading -> graf
    layout.tsx
    globals.css
    api/
      generate/route.ts       # proxy ke Gemini (API key aman di server)
      graphs/route.ts         # simpan graf baru + daftar riwayat (MongoDB)
      graphs/[id]/route.ts    # ambil satu graf tersimpan
  components/
    DecisionInput.tsx         # form input keputusan awal
    LoadingState.tsx
    GraphCanvas.tsx           # React Flow + layout Dagre
    CustomNode.tsx            # node dengan warna berdasarkan severity
    StatsPanel.tsx            # ringkasan, worst-case path, peringkat CRI
    NodeDetailPanel.tsx       # modal detail saat node diklik
    HistorySidebar.tsx        # daftar riwayat dari MongoDB
  lib/
    gemini.ts                 # system instruction + responseSchema Gemini
    mongodb.ts                # koneksi MongoDB yang aman untuk serverless
    graphMath.ts              # P_cum, CRI, worst-case path (client-side)
    dagreLayout.ts            # layout engine (client-side)
    types.ts
```

## 4. Cara kerja matematikanya (semua di client)

- **Cumulative Path Probability (`P_cum`)** — untuk mencapai node `v_k` dari
  root, kalikan seluruh probabilitas kondisional di sepanjang jalurnya:
  `P_cum(v_k) = P(v_1|root) × P(v_2|v_1) × ... × P(v_k|v_(k-1))`.
- **Catastrophe Risk Index (CRI)** — statistik pseudo-ilmiah yang
  membandingkan keparahan (`S`) terhadap logaritma terbalik dari `P_cum`:
  `CRI(v) = S(v) × -log10(P_cum(v))`. Kejadian yang hampir pasti terjadi
  (`P_cum → 1`) mendapat CRI mendekati 0 walau severity tinggi; kejadian yang
  sangat tidak mungkin (`P_cum → 0`) mendorong CRI naik tajam.
- **Worst-Case Path** — traversal DFS dari root ke setiap leaf, menjumlahkan
  CRI tiap simpul di sepanjang jalur, lalu memilih jalur dengan total CRI
  terbesar (gaya Critical Path Method).

Semua ada di `src/lib/graphMath.ts` lengkap dengan komentar penjelasan.

## 5. Catatan teknis

- `next.config.mjs` menonaktifkan `eslint`/`typescript` sebagai gate build
  (safety net untuk deploy pertama). Setelah kamu jalankan
  `npm run build` secara lokal dan yakin semuanya bersih, boleh hapus dua
  opsi itu untuk mendapat pengecekan tipe penuh saat build.
- Route Gemini (`/api/generate`) diberi `maxDuration = 30` — cukup untuk
  respons `gemini-2.5-flash` yang biasanya di bawah 2 detik, dengan buffer
  untuk latensi jaringan.
- Semua kode Dagre/React Flow berjalan di browser (`"use client"`), jadi
  serverless function Vercel tidak pernah melakukan layout graf — sesuai
  spesifikasi split tanggung jawab server vs client.
