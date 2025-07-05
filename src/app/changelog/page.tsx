
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.4.0",
      date: "Sabtu, 06 Juli 2025",
      changes: [
        "Input Manual Makin Pro: Sekarang masukinnya harga satuan, bukan total. Biar makin detail & akurat!",
        "Fitur Pajak di Input Manual: Mau nambahin pajak 10%? Centang aja, kelar.",
        "'Enter' Jadi Shortcut: Gak perlu klik tombol lagi, `Enter` aja buat nambah item. Sat set!",
      ],
    },
    {
      version: "v1.3.0",
      date: "Sabtu, 06 Juli 2025",
      changes: [
          "Dark Mode Makin Jelas: Alert merah sekarang terang benderang, gak bakal kelewat lagi.",
          "Copywriting Makeover: Semua tulisan di-update jadi lebih Gen Z & asik.",
          "Layout Makin Rapi: Tab di 'Kalkulator Patungan' udah bener posisinya & Qty defaultnya kosong.",
      ],
    },
    {
      version: "v1.2.0",
      date: "Sabtu, 06 Juli 2025",
      changes: [
          "REVOLUSI UI/UX: Sekarang ada tab 'Input Manual' di halaman utama & 'Scan Struk' di Kalkulator Patungan. Super fleksibel!",
          "Fix Bug Kamera HP: Foto struk dari kamera sekarang anti-lemot, langsung ke-scan!",
          "Tabel Anti-Geser: Rincian struk di HP sekarang pas di layar, gak perlu scroll kanan-kiri.",
      ],
    },
    {
      version: "v1.1.0",
      date: "Rabu, 03 Juli 2025",
      changes: [
        "Performa NGEBUT: Aplikasi di-tuning, loading-nya sekarang lebih cepet dari pesenan dateng. Skor performa naik drastis!",
        "Fix Tampilan di HP: Tombol-tombol gak bakal nabrak-nabrak lagi di layar kecil.",
        "Dokumentasi (README) di-update biar makin informatif.",
      ],
    },
    {
      version: "v1.0.0",
      date: "Senin, 01 Juli 2025",
      changes: [
        "LAHIRNYA PATUNGANYUK! 🎉 Peluncuran perdana aplikasi pembagi bill paling sat set.",
        "Fitur Awal: Scan Struk AI, Bagi per Item, Kalkulator Patungan, Validasi Struk Cerdas.",
        "Banyak perbaikan awal buat kalkulasi, format Rupiah, dan tampilan biar makin stabil.",
      ],
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto p-4 md:py-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Riwayat Update</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Perkembangan terbaru dari aplikasi PatunganYuk. Biar lo gak ketinggalan info!
            </p>

            <div className="space-y-8">
                {updates.map((update) => (
                    <Card key={update.version}>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0">
                                <Badge variant="outline" className="w-fit">{update.version}</Badge>
                                <CardTitle className="text-xl sm:text-2xl">{update.date}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                {update.changes.map((change, index) => (
                                    <li key={index}>{change}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              Bagi-bagi bill anti-ribet, biar nongkrong makin asik.
            </p>
        </div>
      </footer>
    </div>
  );
}
