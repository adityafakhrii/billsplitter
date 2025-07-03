"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from "@/components/theme-toggle";
import { ReceiptText, Pencil, MoreVertical, ScanLine } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const pathname = usePathname();
  const isManualPage = pathname === '/manual';

  const desktopLink = isManualPage ? (
    <Link href="/" passHref>
      <Button variant="outline">
        <ScanLine className="mr-2 h-4 w-4" />
        Scan Struk
      </Button>
    </Link>
  ) : (
    <Link href="/manual" passHref>
      <Button variant="outline">
        <Pencil className="mr-2 h-4 w-4" />
        Input Manual
      </Button>
    </Link>
  );

  const mobileLink = isManualPage ? (
    <DropdownMenuItem asChild>
      <Link href="/">
        <ScanLine className="mr-2 h-4 w-4" />
        <span>Scan Struk</span>
      </Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem asChild>
      <Link href="/manual">
        <Pencil className="mr-2 h-4 w-4" />
        <span>Input Manual</span>
      </Link>
    </DropdownMenuItem>
  );

  return (
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
            {desktopLink}
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
                {mobileLink}
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
  );
}