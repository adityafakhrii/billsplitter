
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.2.0",
      date: "Sabtu, 06 Juli 2025",
      changes: [
        "Alur Baru: Fitur scan & input manual digabung pake tab di halaman utama & kalkulator. Makin fleksibel!",
        "Input Manual Makin Pro: Sekarang input harga satuan (bukan total), bisa nambah pajak 10%, dan pake 'Enter' buat nambah item. Sat set!",
        "Fix Bug Kamera HP: Foto struk dari kamera sekarang anti-lemot, langsung ke-scan!",
        "Tabel Anti-Geser: Rincian struk di HP sekarang pas di layar, gak perlu scroll kanan-kiri.",
        "UI & UX Level Up: Tampilan dirombak, copywriting di-makeover jadi lebih Gen Z, dan layout diperbaiki biar makin nyaman.",
        "Fix Dark Mode: Peringatan gambar salah sekarang terang benderang, gak bakal kelewat lagi.",
        "Halaman Riwayat Update: Lahirnya halaman ini (yang lagi lo baca!) yang di-makeover abis & footer sekarang jadi lebih pro!",
      ],
    },
    {
      version: "v1.1.0",
      date: "Rabu, 03 Juli 2025",
      changes: [
        "Performa NGEBUT: Aplikasi di-tuning, loading-nya sekarang lebih cepet dari pesenan dateng.",
        "Fix Tampilan di HP: Tombol-tombol gak bakal nabrak-nabrak lagi di layar kecil.",
        "Dokumentasi (README) di-update biar makin informatif & pake Bahasa Indonesia.",
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
                © {new Date().getFullYear()} PatunganYuk v1.2.0. Dibuat biar nongkrong makin asik.
            </p>
        </div>
      </footer>
    </div>
  );
}
