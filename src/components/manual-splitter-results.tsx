
"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, X, PartyPopper, Share2, Printer } from "lucide-react";
import type { ManualParticipant, ManualItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { useToast } from "@/hooks/use-toast";

type ManualSplitterResultsProps = {
    items: ManualItem[];
    storeName: string;
    proofPhoto: string | null;
    submissionTime: Date | null;
    onStartOver: () => void;
};

const formatRupiah = (amount: number) => {
    if (isNaN(amount)) return "Rp0";
    const roundedAmount = Math.round(amount);
    return `Rp${roundedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const formatSubmissionTime = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
};

export function ManualSplitterResults({
    items,
    storeName,
    proofPhoto,
    submissionTime,
    onStartOver,
}: ManualSplitterResultsProps) {
    const [participants, setParticipants] = useState<ManualParticipant[]>([]);
    const [newParticipantName, setNewParticipantName] = useState("");
    const { toast } = useToast();

    const totalBill = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);

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

    const { totalCollected, remainingBalance } = useMemo(() => {
        const collected = participants.reduce((acc, p) => acc + p.amount, 0);
        const remaining = totalBill - collected;
        return { totalCollected: collected, remainingBalance: remaining };
    }, [participants, totalBill]);

    const handleExport = () => window.print();

    const handleShare = async () => {
        if (!navigator.share) {
            toast({ variant: "destructive", title: "Gagal Share", description: "Browser lo ga support fitur ini." });
            return;
        }

        let shareText = `Patungan Manual Cuy!\nTotal Tagihan: ${formatRupiah(totalBill)}\n\n`;
        participants.forEach(p => {
            shareText += `🤑 ${p.name} bayar: ${formatRupiah(p.amount)}\n`;
        });
        shareText += `\nSisa: ${formatRupiah(remainingBalance)}\n\nDibikin pake PatunganYuk! ✨`;

        try {
            await navigator.share({ title: 'Rincian Patungan Manual', text: shareText });
        } catch (error) {
            console.error('Error sharing:', error);
            toast({ variant: "destructive", title: "Gagal Share", description: "Gagal nge-share, coba lagi." });
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
            <aside className="space-y-4 printable-area">
                <Card>
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-2xl">{storeName || "Struk Belanja Patungan"}</CardTitle>
                        <CardDescription>{formatSubmissionTime(submissionTime)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {proofPhoto && <img src={proofPhoto} alt="Bukti Belanja" className="w-full rounded-lg mb-4" />}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="text-lg font-bold">
                                    <TableCell colSpan={3}>Total Keseluruhan</TableCell>
                                    <TableCell className="text-right">{formatRupiah(totalBill)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            </aside>
            <main className="space-y-4 mt-8 md:mt-0 no-print">
                 <Card>
                    <CardHeader>
                        <CardTitle>Bagi Rata</CardTitle>
                        <CardDescription>Masukin nama bestie & siapa bayar berapa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <Input placeholder="Nama bestie" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addParticipant()} />
                            <Button onClick={addParticipant}><Plus className="h-4 w-4 mr-2" />Gas</Button>
                        </div>
                        <ScrollArea className="h-[40vh] pr-4">
                            <div className="space-y-3">
                                {participants.map((p) => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <Avatar><AvatarFallback>{p.initials}</AvatarFallback></Avatar>
                                    <span className="font-medium flex-1">{p.name}</span>
                                    <Input type="text" placeholder="Rp0" value={p.amount > 0 ? p.amount.toString() : ''} onChange={(e) => handleAmountChange(p.id, e.target.value)} className="w-28" />
                                    <Button variant="ghost" size="icon" onClick={() => removeParticipant(p.id)}><X className="h-4 w-4" /></Button>
                                </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-4">
                        <Separator />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Total Tagihan</span><span className="font-medium">{formatRupiah(totalBill)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Udah Kekumpul</span><span className="font-medium">{formatRupiah(totalCollected)}</span></div>
                            <div className={`flex justify-between font-bold text-base ${remainingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}><span>{remainingBalance > 0 ? 'Kurangnya' : 'Lebihnya'}</span><span>{formatRupiah(Math.abs(remainingBalance))}</span></div>
                        </div>
                        {remainingBalance === 0 && totalBill > 0 && (
                            <div className="text-center text-sm font-medium text-green-600 p-2 rounded-md bg-green-100 dark:bg-green-900/50 flex items-center justify-center gap-2"><PartyPopper className="h-5 w-5"/>LUNAS! Mantap jiwa bestie.</div>
                        )}
                        <div className="flex gap-2"><Button onClick={handleShare} size="lg" variant="outline" className="w-full"><Share2 className="mr-2" /> Share</Button><Button onClick={handleExport} size="lg" variant="outline" className="w-full"><Printer className="mr-2"/> Export PDF</Button></div>
                        <Button onClick={onStartOver} size="lg" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Reset Semua</Button>
                    </CardFooter>
                 </Card>
            </main>
        </div>
    );
}
