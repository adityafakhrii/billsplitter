# PatunganYuk 🧾✨

*Bagi-bagi bill anti-ribet, biar nongkrong makin asik.*

PatunganYuk adalah aplikasi pembagi tagihan cerdas yang dirancang untuk membuat berbagi pengeluaran dengan teman menjadi mudah dan menyenangkan. Dengan kekuatan AI, aplikasi ini dapat secara otomatis memindai dan mem-parsing struk, atau kamu bisa memilih entri manual untuk kontrol lebih.

[![Lisensi: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Genkit](https://img.shields.io/badge/Genkit-AI-blue?logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🚀 Fitur Utama

-   **🤖 Scan Struk dengan AI**: Jepret foto strukmu, dan AI kami akan secara otomatis mengekstrak item, jumlah, harga, dan total.
-   **🖼️ Validasi Gambar Cerdas**: Aplikasi secara cerdas memverifikasi apakah gambar yang diunggah adalah struk yang valid (untuk pemindaian) atau bukti pembelian yang benar (untuk input manual), dan menolak gambar yang tidak relevan.
-   **✍️ Mode Input Manual**: Tidak punya struk? Tidak masalah. Tambahkan item, harga, dan jumlah secara manual dengan mudah.
-   **👥 Manajemen Peserta Fleksibel**: Tambah atau hapus teman yang ikut patungan dengan gampang.
-   **✅ Penentuan Item per Orang**: Tentukan setiap item untuk satu atau lebih peserta. Sempurna untuk hidangan individu maupun yang dibagi bersama.
-   **💸 Perhitungan Otomatis & Akurat**: Secara otomatis menghitung bagian setiap orang, dengan cerdas menangani pajak dan total.
-   **💳 Info Pembayaran**: Tambahkan detail rekening bank secara opsional ke ringkasan akhir untuk mempermudah transfer.
-   **📲 Bagikan & Ekspor**: Bagikan rincian akhir dengan teman-temanmu melalui aplikasi pesan apa pun atau ekspor PDF yang rapi untuk catatanmu.
-   **📱 Responsif & Mobile-First**: Didesain agar terlihat dan berfungsi dengan baik di perangkat apa pun, dari ponsel hingga desktop.
-   **🌙 Mode Terang & Gelap**: Beralih antara tema untuk kenyamanan melihat, baik siang maupun malam.

## 🛠️ Tumpukan Teknologi

Proyek ini dibangun dengan tumpukan teknologi modern, kuat, dan skalabel:

-   **Framework**: [Next.js](https://nextjs.org/) (dengan App Router)
-   **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Komponen UI**: [ShadCN UI](https://ui.shadcn.com/)
-   **Integrasi AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
-   **Ikon**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## ⚙️ Mulai Cepat

Ikuti instruksi ini untuk menjalankan proyek di mesin lokalmu.

### Prasyarat

-   [Node.js](https://nodejs.org/en/) (v20 atau lebih baru direkomendasikan)
-   Klien npm (`npm`, `yarn`, `pnpm`, atau `bun`)

### 1. Kloning Repositori

```bash
git clone https://github.com/your-username/patunganyuk.git
cd patunganyuk
```

### 2. Instal Dependensi

Instal paket yang diperlukan menggunakan manajer paket pilihanmu:

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Siapkan Variabel Lingkungan

Fitur AI di aplikasi ini ditenagai oleh Google AI API. Kamu akan memerlukan kunci API untuk mengaktifkannya.

1.  Dapatkan kunci API dari [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Buat file bernama `.env` di root proyek jika belum ada.
3.  Tambahkan kunci API-mu ke file `.env` seperti ini:

    ```env
    GOOGLE_API_KEY=KUNCI_API_KAMU_DI_SINI
    ```

    **Catatan**: File `.env` sudah termasuk dalam `.gitignore` untuk mencegah kunci rahasiamu terkirim ke repositori.

### 4. Jalankan Server Pengembangan

Proyek ini memerlukan dua server pengembangan untuk berjalan bersamaan: satu untuk aplikasi Next.js dan satu untuk Genkit (backend AI).

-   **Terminal 1: Jalankan Aplikasi Next.js**

    ```bash
    npm run dev
    ```

    Aplikasi akan tersedia di `http://localhost:9002`.

-   **Terminal 2: Jalankan Server AI Genkit**

    ```bash
    npm run genkit:watch
    ```

    Perintah ini memulai server Genkit dalam mode watch, yang memungkinkanmu untuk memeriksa dan menguji alur AI di `http://localhost:3400`.

## 📂 Struktur Proyek

Berikut adalah gambaran umum direktori utama dalam proyek:

```
.
├── src
│   ├── app/                # Halaman Next.js menggunakan App Router
│   ├── components/         # Komponen React yang dapat digunakan kembali (UI & logika)
│   │   └── ui/             # Komponen UI dari ShadCN
│   ├── ai/                 # Konfigurasi dan alur AI Genkit
│   │   ├── flows/          # Logika AI untuk tugas seperti parsing struk
│   │   └── genkit.ts       # Konfigurasi plugin Genkit
│   ├── lib/                # Fungsi utilitas dan server actions
│   └── types/              # Definisi tipe TypeScript
├── public/                 # Aset statis
└── ...                     # File konfigurasi
```

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.

---
Dibuat dengan ❤️ untuk semua bestie yang benci matematika rumit setelah makan enak.
---
