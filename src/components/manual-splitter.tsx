
"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, X, Wallet } from "lucide-react";
import type { ManualParticipant } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "./ui/separator";

export function ManualSplitter() {
  const [totalBill, setTotalBill] = useState(0);
  const [participants, setParticipants] = useState<ManualParticipant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");

  const formatRupiah = (amount: number) => {
    if (isNaN(amount)) return "Rp0";
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return formatted;
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const addParticipant = () => {
    if (newParticipantName.trim()) {
      const newParticipant: ManualParticipant = {
        id: `participant-${Date.now()}-${Math.random()}`,
        name: newParticipantName.trim(),
        initials: getInitials(newParticipantName.trim()),
        amount: 0,
      };
      setParticipants([...participants, newParticipant]);
      setNewParticipantName("");
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleAmountChange = (id: string, value: string) => {
    const amount = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, amount } : p))
    );
  };

  const handleTotalBillChange = (value: string) => {
     const amount = parseInt(value.replace(/\D/g, ""), 10) || 0;
     setTotalBill(amount);
  }

  const { totalCollected, remainingBalance } = useMemo(() => {
    const collected = participants.reduce((acc, p) => acc + p.amount, 0);
    const remaining = totalBill - collected;
    return { totalCollected: collected, remainingBalance: remaining };
  }, [participants, totalBill]);

  const startOver = () => {
    setTotalBill(0);
    setParticipants([]);
    setNewParticipantName("");
  }

  const areParticipantsAdded = participants.length > 0;

  return (
    <div className="container mx-auto p-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Masukin Total Tagihan</CardTitle>
              <CardDescription>Berapa total jajanannya? Ketik di sini ya.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Contoh: 50000"
                value={totalBill > 0 ? totalBill.toString() : ""}
                onChange={(e) => handleTotalBillChange(e.target.value)}
                className="text-2xl h-14"
              />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>2. Tambah Temen</CardTitle>
              <CardDescription>Siapa aja nih yang ikut patungan?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nama bestie"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                />
                <Button onClick={addParticipant}><Plus className="h-4 w-4 mr-2" />Gas</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4 mt-8 md:mt-0">
          {!areParticipantsAdded ? (
             <Card className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px]">
                <Wallet className="h-16 w-16 text-muted-foreground" />
                <CardTitle className="mt-4">Hasil Patungan di Sini</CardTitle>
                <CardDescription>Masukin total tagihan & tambahin temen dulu ya.</CardDescription>
            </Card>
          ) : (
             <Card>
              <CardHeader>
                <CardTitle>3. Rincian Patungan</CardTitle>
                <CardDescription>Isi siapa bayar berapa. Biar adil, bestie.</CardDescription>
              </CardHeader>
              <CardContent>
                 <ScrollArea className="h-[40vh] pr-4">
                  <div className="space-y-3">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{p.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium flex-1">{p.name}</span>
                        <Input
                            type="text"
                            placeholder="Rp0"
                            value={p.amount > 0 ? p.amount.toString() : ''}
                            onChange={(e) => handleAmountChange(p.id, e.target.value)}
                            className="w-32"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeParticipant(p.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4">
                <Separator />
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tagihan</span>
                        <span className="font-medium">{formatRupiah(totalBill)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Udah Kekumpul</span>
                        <span className="font-medium">{formatRupiah(totalCollected)}</span>
                    </div>
                     <div className={`flex justify-between font-bold text-base ${remainingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        <span>{remainingBalance > 0 ? 'Kurangnya' : 'Lebihnya'}</span>
                        <span>{formatRupiah(Math.abs(remainingBalance))}</span>
                    </div>
                 </div>
                 {remainingBalance === 0 && totalBill > 0 && (
                     <p className="text-center text-sm font-medium text-green-600 p-2 rounded-md bg-green-100 dark:bg-green-900/50">LUNAS! Mantap kali lah bestie-bestie ini.</p>
                 )}
                <Button onClick={startOver} size="lg" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Reset Semua
                </Button>
              </CardFooter>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
