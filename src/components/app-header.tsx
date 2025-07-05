
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from "@/components/theme-toggle";
import { ReceiptText, Pencil, MoreVertical, ScanLine, Moon, Sun, Calculator } from "lucide-react";
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

  // --- Theme logic ---
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // This effect runs once on mount to set the initial theme from localStorage or system preference.
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = (savedTheme as "light" | "dark") || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);
  
  useEffect(() => {
    // This effect runs whenever the theme state changes to update the DOM and localStorage.
    if (theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === "light" ? "dark" : "light"));
  };
  // --- End Theme logic ---

  const desktopLink = isManualPage ? (
    <Link href="/" passHref>
      <Button variant="outline">
        <ScanLine className="mr-2 h-4 w-4" />
        Bagi per Item
      </Button>
    </Link>
  ) : (
    <Link href="/manual" passHref>
      <Button variant="outline">
        <Calculator className="mr-2 h-4 w-4" />
        Kalkulator Patungan
      </Button>
    </Link>
  );

  const mobileLink = isManualPage ? (
    <DropdownMenuItem asChild>
      <Link href="/">
        <ScanLine className="mr-2 h-4 w-4" />
        <span>Bagi per Item</span>
      </Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem asChild>
      <Link href="/manual">
        <Calculator className="mr-2 h-4 w-4" />
        <span>Kalkulator Patungan</span>
      </Link>
    </DropdownMenuItem>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <ReceiptText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Patungan</span>Yuk
          </h1>
        </Link>
        <div className="flex items-center">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-4">
            {desktopLink}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
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
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleTheme(); }}>
                   {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                   <span>Ganti Tema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
