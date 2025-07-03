import { AppHeader } from "@/components/app-header";
import { BillSplitter } from "@/components/bill-splitter";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex-1">
        <BillSplitter />
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
