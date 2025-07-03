import Link from 'next/link';
import { BillSplitter } from "@/components/bill-splitter";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReceiptText, Pencil, MoreVertical } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
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
          <div className="flex items-center">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-4">
               <Link href="/manual" passHref>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  Input Manual
                </Button>
              </Link>
              <ThemeToggle />
            </nav>

            {/* Mobile Nav */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Buka menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/manual">
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Input Manual</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                     <div className="flex items-center justify-between w-full">
                        <span>Ganti Tema</span>
                        <ThemeToggle />
                      </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
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
