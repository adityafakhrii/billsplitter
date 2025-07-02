
"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import {
  Camera,
  Loader2,
  Plus,
  Users,
  X,
  FileImage,
  Pencil,
  Share2,
  Printer
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { processReceipt, validateReceiptPhotoAction } from "@/lib/actions";
import type { Item, Participant, Bill, BillResult } from "@/types";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";


export function BillSplitter() {
  const [bill, setBill] = useState<Bill | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // State for editing items
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // State for bank details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const formatRupiah = (amount: number) => {
    if (isNaN(amount)) return "Rp0";
    return `Rp${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setReceiptImage(null);
    setBill(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;

      // 1. Validate if it's a receipt first
      const validationResult = await validateReceiptPhotoAction(base64);

      if (validationResult.error || !validationResult.data?.isReceipt) {
        toast({
          variant: "destructive",
          title: "Ini Bukan Struk Deh Kayaknya",
          description: validationResult.data?.reason || validationResult.error || "Coba upload foto struk yang bener, ya.",
        });
        setIsLoading(false);
        if (event.target) event.target.value = "";
        return; // Stop processing
      }
      
      // 2. If valid, proceed to extract items
      setReceiptImage(base64);
      const result = await processReceipt(base64);

      if (result.error || !result.data) {
        toast({
          variant: "destructive",
          title: "Waduh, Error Gengs!",
          description: result.error,
        });
        setReceiptImage(null);
      } else {
        const itemsWithId = result.data.items.map((item) => ({
          ...item,
          id: `item-${Date.now()}-${Math.random()}`,
          assignedTo: [],
        }));
        
        const billData: Bill = {
          items: itemsWithId,
          subtotal: result.data.subtotal,
          tax: result.data.tax,
          total: result.data.total,
        };
        setBill(billData);
      }
      setIsLoading(false);
    };

    if (event.target) event.target.value = "";
  };
  
  const addParticipant = () => {
    if (newParticipantName.trim()) {
      const newParticipant: Participant = {
        id: `participant-${Date.now()}-${Math.random()}`,
        name: newParticipantName.trim(),
        initials: getInitials(newParticipantName.trim()),
      };
      setParticipants([...participants, newParticipant]);
      setNewParticipantName("");
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
    if (!bill) return;
    const newItems = bill.items.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.filter((pId) => pId !== id),
    }));
    setBill({ ...bill, items: newItems });
  };

  const handleAssignmentChange = (itemId: string, participantId: string, checked: boolean | "indeterminate") => {
    if (!bill) return;
    const newItems = bill.items.map((item) => {
      if (item.id === itemId) {
        const assignedTo = checked
          ? [...item.assignedTo, participantId]
          : item.assignedTo.filter((id) => id !== participantId);
        return { ...item, assignedTo };
      }
      return item;
    });
    setBill({ ...bill, items: newItems });
  };

  const handleSelectAllForItem = (itemId: string, checked: boolean | "indeterminate") => {
    if (!bill) return;
    const newItems = bill.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, assignedTo: checked ? participants.map(p => p.id) : [] };
      }
      return item;
    });
    setBill({ ...bill, items: newItems });
  };

  const handleSaveEdit = () => {
    if (!bill || !editingItem) return;

    const newItems = bill.items.map(item => 
      item.id === editingItem.id ? editingItem : item
    );
    const newSubtotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTax = newSubtotal * 0.11; // Recalculate tax, assuming 11%
    const newTotal = newSubtotal + newTax;

    setBill({
      ...bill,
      items: newItems,
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal
    });
    setIsEditing(false);
    setEditingItem(null);
  }

  const handleExport = () => {
    window.print();
  }

  const handleShare = async () => {
    if (!bill || !navigator.share) {
      toast({
        variant: "destructive",
        title: "Gagal Share",
        description: "Browser lo ga support fitur ini, bestie.",
      });
      return;
    }
    
    let shareText = `PatunganYuk! Total Tagihan: ${formatRupiah(bill.total)}\n\n`;

    billResults.forEach(result => {
        const p = participants.find(p => p.id === result.participantId);
        if(p) {
            shareText += `🤑 ${p.name} bayar: ${formatRupiah(result.total)}\n`
        }
    });

    if(accountName && accountNumber && bankName) {
        shareText += `\nTransfer ke:\nBank: ${bankName}\nNo. Rek: ${accountNumber}\na.n. ${accountName}\n\n`;
    }

    shareText += "Dibikin pake PatunganYuk! ✨";

    try {
        await navigator.share({
            title: 'Rincian Patungan Bill',
            text: shareText,
        });
    } catch (error) {
        console.error('Error sharing:', error);
        toast({
            variant: "destructive",
            title: "Gagal Share",
            description: "Gagal nge-share, coba lagi ntar ya.",
        });
    }
  };
  
  const billResults = useMemo<BillResult[]>(() => {
    if (!bill || participants.length === 0) return [];

    const participantSubtotals = new Map<string, number>();
    participants.forEach(p => participantSubtotals.set(p.id, 0));

    const itemDetails = new Map<string, {name: string, price: number, splitPrice: number}[]>();
    participants.forEach(p => itemDetails.set(p.id, []));

    bill.items.forEach((item) => {
      if (item.assignedTo.length > 0) {
        const splitPrice = item.price / item.assignedTo.length;
        item.assignedTo.forEach((pId) => {
          participantSubtotals.set(pId, (participantSubtotals.get(pId) || 0) + splitPrice);
          const currentItems = itemDetails.get(pId) || [];
          itemDetails.set(pId, [...currentItems, { name: item.name, price: item.price, splitPrice }]);
        });
      }
    });

    const totalClaimedSubtotal = Array.from(participantSubtotals.values()).reduce((a, b) => a + b, 0);
    const taxAmount = bill.tax || 0;

    const results: BillResult[] = participants.map((p) => {
      const participantId = p.id;
      const subtotal = participantSubtotals.get(participantId) || 0;
      const taxShare = totalClaimedSubtotal > 0 ? (subtotal / totalClaimedSubtotal) * taxAmount : 0;
      const total = subtotal + taxShare;
      
      return {
        participantId: participantId,
        total: total,
        items: itemDetails.get(participantId) || [],
        taxShare: taxShare,
      };
    });

    return results;
  }, [bill, participants]);

  const startOver = () => {
    setBill(null);
    setParticipants([]);
    setNewParticipantName("");
    setReceiptImage(null);
    setIsLoading(false);
    setBankName("");
    setAccountNumber("");
    setAccountName("");
  };

  const isAssignmentComplete = bill?.items.every(item => item.assignedTo.length > 0) ?? false;
  const areParticipantsAdded = participants.length > 0;

  return (
    <div className="container mx-auto p-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
        <aside className="space-y-4 no-print">
          <Card>
            <CardHeader>
              <CardTitle>1. Upload Struk</CardTitle>
              <CardDescription>Foto atau upload gambar struknya. Biar cepet.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 p-8">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="text-muted-foreground">Lagi nyeken struk, sabar ye...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <Input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
                  <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                    <FileImage className="mr-2 h-5 w-5" /> Upload Gambar
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="mr-2 h-5 w-5" /> Pake Kamera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {receiptImage && (
            <Card>
              <CardHeader>
                <CardTitle>Penampakan Struk</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={receiptImage} alt="Receipt preview" className="rounded-lg w-full" />
              </CardContent>
            </Card>
          )}

          {bill && (
            <Card>
              <CardHeader>
                <CardTitle>Rincian Struk</CardTitle>
                <CardDescription>Ini detail dari struk yang di-scan, cek lagi ya. Kalo ada yang salah, pencet tombol edit.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Item</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Nama Item</Label>
                          <Input id="name" value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="quantity" className="text-right">Qty</Label>
                          <Input id="quantity" type="number" value={editingItem.quantity} onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 0})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="price" className="text-right">Harga</Label>
                          <Input id="price" type="number" value={editingItem.price} onChange={(e) => setEditingItem({...editingItem, price: parseInt(e.target.value) || 0})} className="col-span-3" />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button onClick={handleSaveEdit}>Simpan Perubahan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center w-[50px]">Qty</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsEditing(true); }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    {bill.subtotal != null && bill.subtotal > 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>Subtotal</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(bill.subtotal)}</TableCell>
                      </TableRow>
                    )}
                    {bill.tax != null && bill.tax > 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>Pajak</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(bill.tax)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="text-base">
                      <TableCell colSpan={3} className="font-bold">Total Belanja</TableCell>
                      <TableCell className="text-right font-bold">{formatRupiah(bill.total)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          )}
        </aside>

        <main className="space-y-4 mt-8 md:mt-0">
          {!bill ? (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px] no-print">
                <FileImage className="h-16 w-16 text-muted-foreground" />
                <CardTitle className="mt-4">Hasilnya Nanti di Sini</CardTitle>
                <CardDescription>Upload struk dulu, ntar detail patungannya muncul di sini.</CardDescription>
            </Card>
          ) : (
            <>
              <Card className="no-print">
                <CardHeader>
                  <CardTitle>2. Info Rekening (Opsional)</CardTitle>
                  <CardDescription>Biar gampang, masukin info rekening buat transfer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input placeholder="Nama Bank (Contoh: BCA)" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    <Input placeholder="Nomor Rekening" type="number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                    <Input placeholder="Nama Pemilik Rekening" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                </CardContent>
              </Card>

              <Card className="no-print">
                <CardHeader>
                  <CardTitle>3. Tambah Temen</CardTitle>
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
                  <ScrollArea className="h-32 mt-4 pr-4">
                    <div className="space-y-2">
                      {participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-md bg-secondary p-2">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{p.initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeParticipant(p.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {participants.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">Belum ada temen, tambahin dulu gih.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {areParticipantsAdded && (
                 <Card className="no-print">
                  <CardHeader>
                    <CardTitle>4. Bagi-Bagi Item</CardTitle>
                    <CardDescription>Pilih siapa mesen apa. Kalo rame-rame, centang "Semua".</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[40vh]">
                    <div className="space-y-4 pr-4">
                    {bill.items.map((item) => {
                        const allSelected = participants.length > 0 && item.assignedTo.length === participants.length;
                        const someSelected = item.assignedTo.length > 0 && !allSelected;
                        const checkboxState = allSelected ? true : (someSelected ? "indeterminate" : false);

                        return (
                          <div key={item.id} className="rounded-lg border p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">{item.name} (x{item.quantity})</p>
                                <p className="text-sm text-muted-foreground">{formatRupiah(item.price)}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Checkbox id={`select-all-${item.id}`} onCheckedChange={(c) => handleSelectAllForItem(item.id, c)} checked={checkboxState}/>
                                  <label htmlFor={`select-all-${item.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Semua</label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              {participants.map((p) => (
                                <div key={p.id} className="flex items-center space-x-2">
                                    <Checkbox id={`${item.id}-${p.id}`} checked={item.assignedTo.includes(p.id)} onCheckedChange={(c) => handleAssignmentChange(item.id, p.id, c)} />
                                    <label htmlFor={`${item.id}-${p.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{p.name}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
             
              {isAssignmentComplete && (
                <Card className="printable-area">
                  <CardHeader>
                    <CardTitle>5. Rincian Patungan</CardTitle>
                    <CardDescription className="no-print">Nih, totalan masing-masing. Cekidot!</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Bank Info for Print */}
                    {accountName && (
                        <div className="hidden print:block mb-4 p-4 border rounded-lg bg-secondary">
                            <h3 className="font-bold mb-2">Info Transfer:</h3>
                            <p><strong>Bank:</strong> {bankName}</p>
                            <p><strong>No. Rekening:</strong> {accountNumber}</p>
                            <p><strong>Atas Nama:</strong> {accountName}</p>
                        </div>
                    )}

                    <Accordion type="single" collapsible className="w-full" defaultValue={`participant-${billResults[0]?.participantId}`}>
                      {billResults.map((result) => {
                        const participant = participants.find(p => p.id === result.participantId);
                        if (!participant) return null;
                        return (
                          <AccordionItem value={`participant-${result.participantId}`} key={result.participantId}>
                            <AccordionTrigger>
                              <div className="flex justify-between w-full pr-4">
                                  <div className="flex items-center gap-3">
                                      <Avatar><AvatarFallback>{participant.initials}</AvatarFallback></Avatar>
                                      <span className="font-semibold">{participant.name}</span>
                                  </div>
                                  <span className="font-bold text-primary text-lg">{formatRupiah(result.total)}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-1 pl-4 text-muted-foreground text-sm">
                                {result.items.map((item, index) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{item.name} (patungan)</span>
                                    <span>{formatRupiah(item.splitPrice)}</span>
                                  </li>
                                ))}
                                {result.taxShare > 0 && (
                                    <li className="flex justify-between">
                                        <span>Pajak</span>
                                        <span>{formatRupiah(result.taxShare)}</span>
                                    </li>
                                )}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  </CardContent>
                   <CardFooter className="flex-col items-stretch gap-4">
                    <Separator />
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total Keseluruhan</span>
                        <span>{formatRupiah(bill.total)}</span>
                    </div>
                    <div className="flex gap-2 no-print">
                      <Button onClick={handleShare} size="lg" variant="outline" className="w-full"><Share2 className="mr-2" /> Share</Button>
                      <Button onClick={handleExport} size="lg" variant="outline" className="w-full"><Printer className="mr-2"/> Export PDF</Button>
                    </div>
                    <Button onClick={startOver} size="lg" className="no-print">
                        <Plus className="h-4 w-4 mr-2" /> Itung Bill Baru
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
