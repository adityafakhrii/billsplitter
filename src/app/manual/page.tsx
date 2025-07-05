
import { AppHeader } from "@/components/app-header";
import { CalculatorSplitter } from "@/components/manual-splitter";
import Link from "next/link";

export default function ManualPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex-1">
        <CalculatorSplitter />
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-sm leading-loose text-muted-foreground">
                Bagi-bagi bill anti-ribet, biar nongkrong makin asik.
              </p>
              <Link href="/changelog" className="text-xs text-muted-foreground hover:underline">
                Riwayat Update
              </Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
