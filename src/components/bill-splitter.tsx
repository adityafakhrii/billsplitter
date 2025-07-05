
"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import dynamic from 'next/dynamic';
import {
  Camera,
  Loader2,
  Plus,
  Users,
  X,
  FileImage,
  Pencil,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { processReceipt, validateReceiptPhotoAction } from "@/lib/actions";
import type { Item, Participant, Bill, BillResult } from "@/types";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BillSplitterResults = dynamic(() =>
  import('./bill-splitter-results').then((mod) => mod.BillSplitterResults),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div> 
  }
);

const resizeImage = (file: File, maxWidth: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      const imgSrc = event.target?.result;
      if (!imgSrc) {
        return reject(new Error("Failed to read file."));
      }
      img.src = imgSrc as string;
      img.onload = () => {
        if (img.width <= maxWidth) {
          resolve(img.src);
          return;
        }

        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};


export function BillSplitter() {
  const [bill, setBill] = useState<Bill | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // State for manual entry
  const [manualItems, setManualItems] = useState<Omit<Item, 'id' | 'assignedTo'>[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

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
    setValidationError(null);

    try {
      const base64 = await resizeImage(file);
      
      const validationResult = await validateReceiptPhotoAction(base64);

      if (validationResult.error || !validationResult.data?.isReceipt) {
        setValidationError(validationResult.data?.reason || validationResult.error || "Coba upload foto struk yang bener, ya.");
        return;
      }
      
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
    } catch (error) {
       console.error("Error processing image:", error);
        toast({
            variant: "destructive",
            title: "Oops, Gagal Proses!",
            description: "Gagal memproses gambar. Coba foto ulang atau pilih dari galeri.",
        });
        setValidationError("Gagal memproses gambar. Pastikan formatnya benar ya.");
    } finally {
      setIsLoading(false);
      if (event.target) {
          event.target.value = "";
      }
    }
  };

  const addManualItem = () => {
      if (!newItemName || newItemQty <= 0 || newItemPrice <= 0) {
          toast({
              variant: "destructive",
              title: "Data Item Belum Lengkap",
              description: "Nama, Kuantitas, dan Harga harus diisi dengan benar.",
          });
          return;
      }
      setManualItems([...manualItems, { name: newItemName, quantity: newItemQty, price: newItemQty * newItemPrice }]);
      setNewItemName("");
      setNewItemQty(1);
      setNewItemPrice(0);
  };

  const removeManualItem = (index: number) => {
      setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const processManualItems = () => {
    if (manualItems.length === 0) {
        toast({
            variant: "destructive",
            title: "Belum Ada Item",
            description: "Tambahin dulu minimal satu item buat dihitung.",
        });
        return;
    }

    const itemsWithId = manualItems.map((item) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random()}`,
        assignedTo: [],
    }));

    const total = itemsWithId.reduce((acc, item) => acc + item.price, 0);

    const billData: Bill = {
        items: itemsWithId,
        total: total,
        subtotal: total,
        tax: 0
    };
    setBill(billData);
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
  
    // Recalculate price based on quantity if needed, assuming price in modal is total price.
    // For now, let's assume price is total for that item line.
    const updatedItem = { ...editingItem };
  
    const newItems = bill.items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
  
    // Recalculate totals
    const newSubtotal = newItems.reduce((acc, item) => acc + item.price, 0);
    const newTax = bill.tax || 0;
    const newTotal = newSubtotal + newTax;
  
    setBill({
      ...bill,
      items: newItems,
      subtotal: newSubtotal,
      total: newTotal
    });
  
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleRemoveTax = () => {
    if (!bill) return;

    const newTotal = bill.subtotal || bill.items.reduce((acc, item) => acc + item.price, 0);

    setBill({
      ...bill,
      tax: 0,
      total: newTotal
    });
  };

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
    setValidationError(null);
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setManualItems([]);
  };

  const isAssignmentComplete = bill?.items.every(item => item.assignedTo.length > 0) ?? false;
  const areParticipantsAdded = participants.length > 0;

  return (
    <div className="container mx-auto p-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
        <aside className="space-y-4 no-print">
         
         {!bill && (
             <Card>
                <CardHeader>
                  <CardTitle>1. Masukin Rincian Belanja</CardTitle>
                  <CardDescription>Bisa scan struk otomatis atau input manual satu-satu.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="scan" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="scan">Scan Struk</TabsTrigger>
                            <TabsTrigger value="manual">Input Manual</TabsTrigger>
                        </TabsList>
                        <TabsContent value="scan" className="pt-4">
                              {isLoading ? (
                                <div className="flex flex-col items-center justify-center gap-4 p-8">
                                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                  <p className="text-muted-foreground">Lagi nyeken struk, sabar ye...</p>
                                </div>
                              ) : (
                                <>
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
                                  {validationError && (
                                    <Alert variant="destructive" className="mt-4">
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertTitle>Foto Ditolak!</AlertTitle>
                                      <AlertDescription>{validationError}</AlertDescription>
                                    </Alert>
                                  )}
                                </>
                              )}
                        </TabsContent>
                        <TabsContent value="manual" className="pt-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-2 items-end">
                                    <Input placeholder="Nama item" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                                    <Input placeholder="Qty" type="number" value={newItemQty} onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)} />
                                    <Input placeholder="Total Harga" type="number" value={newItemPrice > 0 ? newItemPrice : ""} onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)} />
                                </div>
                                <Button onClick={addManualItem} className="w-full"><Plus className="mr-2"/>Tambah Item</Button>
                                
                                {manualItems.length > 0 && (
                                  <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="text-right">Harga</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {manualItems.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.name} (x{item.quantity})</TableCell>
                                                    <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeManualItem(index)}><Trash2 className="h-4 w-4" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Button onClick={processManualItems} size="lg" className="w-full">Proses & Lanjut</Button>
                                  </>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
             </Card>
         )}

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
                      <TableHead className="p-2 md:px-2 md:py-3 w-full">Item</TableHead>
                      <TableHead className="text-center p-1 md:px-1 md:py-3 w-[40px]">Qty</TableHead>
                      <TableHead className="text-right p-2 md:px-2 md:py-3 w-[90px]">Harga</TableHead>
                      <TableHead className="text-center p-1 md:px-1 md:py-3 w-[40px]">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium p-2 break-words">{item.name}</TableCell>
                        <TableCell className="text-center p-2">{item.quantity}</TableCell>
                        <TableCell className="text-right p-2 whitespace-nowrap">{formatRupiah(item.price)}</TableCell>
                        <TableCell className="p-1 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setIsEditing(true); }}>
                              <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    {bill.subtotal != null && bill.subtotal > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="p-2">Subtotal</TableCell>
                        <TableCell className="text-right font-medium p-2 whitespace-nowrap">{formatRupiah(bill.subtotal)}</TableCell>
                      </TableRow>
                    )}
                    {bill.tax != null && bill.tax > 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="p-2">Pajak</TableCell>
                        <TableCell className="text-right font-medium p-2 whitespace-nowrap">{formatRupiah(bill.tax)}</TableCell>
                        <TableCell className="text-center p-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveTax}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="text-base">
                      <TableCell colSpan={3} className="font-bold p-2">Total Belanja</TableCell>
                      <TableCell className="text-right font-bold p-2 whitespace-nowrap">{formatRupiah(bill.total)}</TableCell>
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
                <CardDescription>Input data belanja dulu, ntar detail patungannya muncul di sini.</CardDescription>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
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
                <BillSplitterResults
                    bill={bill}
                    participants={participants}
                    billResults={billResults}
                    accountName={accountName}
                    accountNumber={accountNumber}
                    bankName={bankName}
                    onShare={handleShare}
                    onExport={handleExport}
                    onStartOver={startOver}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
