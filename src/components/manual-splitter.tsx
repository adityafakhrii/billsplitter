
"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import { Plus, Trash2, X, Wallet, UploadCloud, PartyPopper, Loader2, Share2, Printer, AlertTriangle } from "lucide-react";
import type { ManualParticipant, ManualItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { useToast } from "@/hooks/use-toast";
import { validateProofPhotoAction } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


export function ManualSplitter() {
  const [items, setItems] = useState<ManualItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  const [storeName, setStoreName] = useState("");
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isPhotoValidating, setIsPhotoValidating] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);
  const proofPhotoInputRef = useRef<HTMLInputElement>(null);
  
  const [participants, setParticipants] = useState<ManualParticipant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);
  const { toast } = useToast();

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

  const addItem = () => {
    if(newItemName.trim() && newItemQty > 0 && newItemPrice > 0) {
      const newItem: ManualItem = {
        id: `manual-item-${Date.now()}`,
        name: newItemName.trim(),
        quantity: newItemQty,
        price: newItemPrice
      };
      setItems([...items, newItem]);
      setNewItemName("");
      setNewItemQty(1);
      setNewItemPrice(0);
    } else {
      toast({
        variant: "destructive",
        title: "Eits, ga lengkap!",
        description: "Nama, Kuantitas, sama Harga itemnya isi dulu dong.",
      });
    }
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  }

  const handleProofPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoValidationError(null);
    setIsPhotoValidating(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await validateProofPhotoAction(base64);
        if (result.error || !result.data) {
            setPhotoValidationError(result.error || "Gagal validasi foto.");
            setProofPhoto(null);
        } else if (!result.data.isValid) {
            setPhotoValidationError(result.data.reason);
            setProofPhoto(null);
        } else {
            setProofPhoto(base64);
        }
        setIsPhotoValidating(false);
    }
    if (e.target) e.target.value = "";
  }

  const handleSubmitItems = () => {
    if(items.length === 0) {
       toast({
        variant: "destructive",
        title: "Barang belum diisi!",
        description: "Minimal masukin satu barang dulu, bestie.",
      });
      return;
    }
    if(!proofPhoto) {
       toast({
        variant: "destructive",
        title: "Bukti belanjanya mana?",
        description: "Upload dulu foto tempat belanjanya, biar afdol.",
      });
      return;
    }
    setIsSubmitted(true);
    setSubmissionTime(new Date());
  }

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

  const startOver = () => {
    setItems([]);
    setStoreName("");
    setProofPhoto(null);
    setPhotoValidationError(null);
    setParticipants([]);
    setIsSubmitted(false);
    setSubmissionTime(null);
  }

  const formatSubmissionTime = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  }

  return (
    <div className="container mx-auto p-4 md:py-8">
      {isSubmitted ? (
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
            <aside className="space-y-4 printable-area">
                <Card>
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-2xl">{storeName || "Struk Belanja Patungan"}</CardTitle>
                        <CardDescription>{formatSubmissionTime(submissionTime)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <img src={proofPhoto!} alt="Bukti Belanja" className="w-full rounded-lg mb-4" />
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
                                    <Input type="text" placeholder="Rp0" value={p.amount > 0 ? p.amount.toString() : ''} onChange={(e) => handleAmountChange(p.id, e.target.value)} className="w-32" />
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
                        <Button onClick={startOver} size="lg" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Reset Semua</Button>
                    </CardFooter>
                 </Card>
            </main>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
          <aside className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>1. Masukin Info Belanja</CardTitle>
                    <CardDescription>Isi nama toko dan item belanjaan satu-satu ya.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input placeholder="Nama Toko" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-2 items-end">
                            <Input placeholder="Nama item" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                            <Input placeholder="Qty" type="number" value={newItemQty} onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)} min="1" />
                            <Input placeholder="Harga satuan" type="number" value={newItemPrice > 0 ? newItemPrice : ""} onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)} />
                            <Button onClick={addItem} className="md:col-span-3"><Plus className="h-4 w-4 mr-2" />Tambah Item</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>2. Upload Bukti Belanja</CardTitle>
                    <CardDescription>Fotoin tempat belanjanya, jangan struknya ya.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input type="file" accept="image/*" ref={proofPhotoInputRef} onChange={handleProofPhotoChange} className="hidden" />
                    {isPhotoValidating ? (
                        <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : (
                      <>
                        <Button onClick={() => proofPhotoInputRef.current?.click()} variant="outline" className="w-full h-24 border-dashed">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <UploadCloud className="h-8 w-8" />
                                <span>{proofPhoto ? "Ganti Foto" : "Klik buat upload"}</span>
                            </div>
                        </Button>
                        {photoValidationError && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Foto Ditolak!</AlertTitle><AlertDescription>{photoValidationError}</AlertDescription></Alert>}
                        {proofPhoto && !photoValidationError && (
                            <div className="mt-4">
                                <img src={proofPhoto} alt="Proof" className="rounded-lg w-full max-h-48 object-cover" />
                            </div>
                        )}
                      </>
                    )}
                </CardContent>
            </Card>
          </aside>
          <main className="space-y-4 mt-8 md:mt-0">
             <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Belanja</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] pr-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[200px]">
                                <Wallet className="h-16 w-16 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Belum ada barang, nih.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                        <TableHead className="text-center w-10">Hapus</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.quantity} x {formatRupiah(item.price)}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatRupiah(item.quantity * item.price)}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                    <Separator />
                    <div className="flex justify-between font-bold text-xl">
                        <span>Total</span>
                        <span>{formatRupiah(totalBill)}</span>
                    </div>
                    <Button onClick={handleSubmitItems} size="lg"><PartyPopper className="h-4 w-4 mr-2"/>Lanjut ke Patungan</Button>
                </CardFooter>
             </Card>
          </main>
        </div>
      )}
    </div>
  );
}
