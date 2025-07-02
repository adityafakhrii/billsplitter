"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import {
  Camera,
  Loader2,
  Plus,
  ReceiptText,
  Trash2,
  Users,
  X,
  FileImage,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { processReceipt } from "@/lib/actions";
import type { Item, Participant, Bill, BillResult } from "@/types";
import { Separator } from "./ui/separator";


export function BillSplitter() {
  const [bill, setBill] = useState<Bill | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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
      setReceiptImage(base64); // For preview
      const result = await processReceipt(base64);

      if (result.error || !result.data) {
        toast({
          variant: "destructive",
          title: "Waduh, Error Gengs!",
          description: result.error,
        });
        setReceiptImage(null); // Clear image on error
      } else {
        const billData: Bill = {
          ...result.data,
          items: result.data.items.map((item) => ({
            ...item,
            id: `item-${Date.now()}-${Math.random()}`,
            assignedTo: [],
          })),
        };
        setBill(billData);
      }
      setIsLoading(false);
    };

    event.target.value = "";
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
  };

  const isAssignmentComplete = bill?.items.every(item => item.assignedTo.length > 0) ?? false;
  const areParticipantsAdded = participants.length > 0;

  return (
    <div className="container mx-auto p-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
        <aside className="space-y-4">
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
                    <Users className="mr-2 h-5 w-5" /> Upload Gambar
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
        </aside>

        <main className="space-y-4 mt-8 md:mt-0">
          {!bill ? (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px]">
                <FileImage className="h-16 w-16 text-muted-foreground" />
                <CardTitle className="mt-4">Hasilnya Nanti di Sini</CardTitle>
                <CardDescription>Upload struk dulu, ntar detail patungannya muncul di sini.</CardDescription>
            </Card>
          ) : (
            <>
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
                 <Card>
                  <CardHeader>
                    <CardTitle>3. Bagi-Bagi Item</CardTitle>
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
                <Card>
                  <CardHeader>
                    <CardTitle>4. Rincian Patungan</CardTitle>
                    <CardDescription>Nih, totalan masing-masing. Cekidot!</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                                        <span>Pajak (antehan)</span>
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
                        <span>Total Belanja</span>
                        <span>{formatRupiah(bill.total)}</span>
                    </div>
                    <Button onClick={startOver} size="lg">
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
