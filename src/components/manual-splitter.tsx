
"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Wallet, UploadCloud, PartyPopper, Loader2, AlertTriangle, Camera, FileImage } from "lucide-react";
import type { ManualItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { useToast } from "@/hooks/use-toast";
import { validateProofPhotoAction, processReceipt, validateReceiptPhotoAction } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const ManualSplitterResults = dynamic(() =>
    import('./manual-splitter-results').then((mod) => mod.ManualSplitterResults),
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


export function CalculatorSplitter() {
  const [items, setItems] = useState<ManualItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  const [storeName, setStoreName] = useState("");
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isPhotoValidating, setIsPhotoValidating] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);
  const proofPhotoInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const receiptScanInputRef = useRef<HTMLInputElement>(null);
  const receiptCameraInputRef = useRef<HTMLInputElement>(null);
  const [scanValidationError, setScanValidationError] = useState<string | null>(null);


  const formatRupiah = (amount: number) => {
    if (isNaN(amount)) return "Rp0";
    const roundedAmount = Math.round(amount);
    return `Rp${roundedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
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

  const handleAddItemOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  }

  const handleManualProofPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoValidationError(null);
    setIsPhotoValidating(true);

    try {
        const base64 = await resizeImage(file);
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
    } catch (error) {
       console.error("Error processing proof photo:", error);
        toast({
            variant: "destructive",
            title: "Oops, Gagal Proses!",
            description: "Gagal memproses gambar. Coba foto ulang atau pilih dari galeri.",
        });
        setPhotoValidationError("Gagal memproses gambar. Pastikan formatnya benar ya.");
    } finally {
      setIsPhotoValidating(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  }
  
  const handleReceiptFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanValidationError(null);
    setItems([]);

    try {
      const base64 = await resizeImage(file);
      const validationResult = await validateReceiptPhotoAction(base64);

      if (validationResult.error || !validationResult.data?.isReceipt) {
        setScanValidationError(validationResult.data?.reason || validationResult.error || "Yang diupload bukan struk, coba lagi.");
        return;
      }
      
      setProofPhoto(base64); // Use receipt as proof photo
      const result = await processReceipt(base64);

      if (result.error || !result.data) {
        toast({
          variant: "destructive",
          title: "Waduh, Gagal Baca Struk!",
          description: result.error,
        });
      } else {
        const scannedItems = result.data.items.map((item, index) => ({
            id: `scanned-item-${Date.now()}-${index}`,
            name: item.name,
            quantity: item.quantity,
            price: item.price / item.quantity, // Get unit price
        }));
        setItems(scannedItems);
        toast({
          title: "Struk Berhasil Dipindai!",
          description: `${scannedItems.length} item berhasil ditambahkan ke ringkasan.`,
        });
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      setScanValidationError("Gagal memproses gambar. Pastikan formatnya benar ya.");
    } finally {
      setIsScanning(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

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
        description: "Upload dulu foto bukti belanja atau struknya, biar afdol.",
      });
      return;
    }
    setIsSubmitted(true);
    setSubmissionTime(new Date());
  }

  const totalBill = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  
  const startOver = () => {
    setItems([]);
    setStoreName("");
    setProofPhoto(null);
    setPhotoValidationError(null);
    setScanValidationError(null);
    setIsSubmitted(false);
    setSubmissionTime(null);
  }

  return (
    <div className="container mx-auto p-4 md:py-8">
      {isSubmitted ? (
        <ManualSplitterResults
            items={items}
            storeName={storeName}
            proofPhoto={proofPhoto}
            submissionTime={submissionTime}
            onStartOver={startOver}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
          <aside className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>1. Masukin Info Belanja</CardTitle>
                    <CardDescription>Isi nama toko dan rincian belanja. Bisa manual atau scan struk.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input placeholder="Nama Toko (Opsional)" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mb-4"/>
                    <Tabs defaultValue="manual" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Input Manual</TabsTrigger>
                            <TabsTrigger value="scan">Scan Struk</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-2 items-end">
                                <Input placeholder="Nama item" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={handleAddItemOnEnter} />
                                <Input placeholder="Qty" type="number" value={newItemQty} onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)} onKeyDown={handleAddItemOnEnter} />
                                <Input placeholder="Harga satuan" type="number" value={newItemPrice > 0 ? newItemPrice : ""} onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)} onKeyDown={handleAddItemOnEnter} />
                                <Button onClick={addItem} className="md:col-span-3"><Plus className="h-4 w-4 mr-2" />Tambah Item</Button>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Upload Bukti Belanja (Opsional)</p>
                                <Input type="file" accept="image/*" ref={proofPhotoInputRef} onChange={handleManualProofPhotoChange} className="hidden" />
                                {isPhotoValidating ? (
                                    <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin"/></div>
                                ) : (
                                  <>
                                    <Button onClick={() => proofPhotoInputRef.current?.click()} variant="outline" className="w-full h-24 border-dashed">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <UploadCloud className="h-8 w-8" />
                                            <span>{proofPhoto ? "Ganti Foto Bukti" : "Klik buat upload bukti"}</span>
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
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="scan" className="pt-4">
                             {isScanning ? (
                                <div className="flex flex-col items-center justify-center gap-4 p-8">
                                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                  <p className="text-muted-foreground">Lagi nyeken struk, sabar ye...</p>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input type="file" accept="image/*" ref={receiptScanInputRef} onChange={handleReceiptFileChange} className="hidden" />
                                    <Input type="file" accept="image/*" capture="environment" ref={receiptCameraInputRef} onChange={handleReceiptFileChange} className="hidden" />
                                    <Button size="lg" onClick={() => receiptScanInputRef.current?.click()}>
                                      <FileImage className="mr-2 h-5 w-5" /> Upload Struk
                                    </Button>
                                    <Button size="lg" variant="secondary" onClick={() => receiptCameraInputRef.current?.click()}>
                                      <Camera className="mr-2 h-5 w-5" /> Pake Kamera
                                    </Button>
                                  </div>
                                  {scanValidationError && (
                                    <Alert variant="destructive" className="mt-4">
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertTitle>Scan Gagal!</AlertTitle>
                                      <AlertDescription>{scanValidationError}</AlertDescription>
                                    </Alert>
                                  )}
                                </>
                              )}
                        </TabsContent>
                    </Tabs>
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
