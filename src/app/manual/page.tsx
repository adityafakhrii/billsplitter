import Link from 'next/link';
import { ManualSplitter } from "@/components/manual-splitter";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReceiptText, ScanLine } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function ManualPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              <span className="text-primary">Patungan</span>Yuk
            </h1>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-4">
             <Link href="/" passHref>
              <Button variant="outline">
                <ScanLine className="mr-2 h-4 w-4" />
                Scan Struk
              </Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <ManualSplitter />
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
