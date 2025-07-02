import { BillSplitter } from "@/components/bill-splitter";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReceiptText } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              <span className="text-primary">Bill</span>Splitter
            </h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <BillSplitter />
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              A smarter way to share expenses.
            </p>
        </div>
      </footer>
    </div>
  );
}
