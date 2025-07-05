
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.2.0",
      date: "Jumat, 26 Juli 2024",
      changes: [
        "Re-write semua copywriting biar lebih Gen Z dan asik.",
        "Nambahin halaman changelog (yang lagi lo liat sekarang).",
        "Perbaikan layout di halaman Kalkulator Patungan.",
      ],
    },
    {
        version: "v1.1.0",
        date: "Kamis, 25 Juli 2024",
        changes: [
          "Nambahin mode 'Input Manual' di halaman utama (Bagi per Item).",
          "Nambahin mode 'Scan Struk' di halaman Kalkulator Patungan.",
          "Benerin bug loading kamera yang gak kelar-kelar di mobile.",
          "Benerin layout tabel Rincian Struk biar gak geser-geser di HP."
        ],
    },
    {
      version: "v1.0.0",
      date: "Rabu, 24 Juli 2024",
      changes: [
        "Peluncuran perdana aplikasi PatunganYuk!",
        "Fitur utama: Scan Struk & Bagi per Item, Kalkulator Patungan.",
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
