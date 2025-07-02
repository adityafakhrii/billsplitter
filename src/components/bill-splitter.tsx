"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  ReceiptText,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
import type { Item, Participant, BillResult } from "@/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Upload Receipt" },
  { id: 2, name: "Add Participants" },
  { id: 3, name: "Assign Items" },
  { id: 4, name: "View Split" },
];

export function BillSplitter() {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await processReceipt(base64);

      if (result.error || !result.data) {
        toast({
          variant: "destructive",
          title: "Oh no! Something went wrong.",
          description: result.error,
        });
      } else {
        const itemsWithIds = result.data.map((item) => ({
          ...item,
          id: `item-${Date.now()}-${Math.random()}`,
          assignedTo: [],
        }));
        setItems(itemsWithIds);
        setStep(2);
      }
      setIsLoading(false);
    };
    
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
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
    // Also un-assign from items
    setItems(
      items.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((pId) => pId !== id),
      }))
    );
  };
  
  const handleAssignmentChange = (itemId: string, participantId: string, checked: boolean | "indeterminate") => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const assignedTo = checked
            ? [...item.assignedTo, participantId]
            : item.assignedTo.filter((id) => id !== participantId);
          return { ...item, assignedTo };
        }
        return item;
      })
    );
  };
  
  const handleSelectAllForItem = (itemId: string, checked: boolean | "indeterminate") => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return { ...item, assignedTo: checked ? participants.map(p => p.id) : [] };
        }
        return item;
      })
    );
  };

  const billResults = useMemo<BillResult[]>(() => {
    if (step !== 4) return [];
    
    const results: BillResult[] = participants.map((p) => ({
      participantId: p.id,
      total: 0,
      items: [],
    }));

    items.forEach((item) => {
      if (item.assignedTo.length > 0) {
        const splitPrice = item.price / item.assignedTo.length;
        item.assignedTo.forEach((pId) => {
          const result = results.find((r) => r.participantId === pId);
          if (result) {
            result.total += splitPrice;
            result.items.push({ name: item.name, price: item.price, splitPrice });
          }
        });
      }
    });

    return results;
  }, [step, items, participants]);

  const startOver = () => {
    setStep(1);
    setItems([]);
    setParticipants([]);
    setNewParticipantName("");
    setIsLoading(false);
  };
  
  const isStep2Valid = participants.length > 0;
  const isStep3Valid = items.every(item => item.assignedTo.length > 0);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="w-full text-center">
            <CardHeader>
              <ReceiptText className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="mt-4">Upload Your Receipt</CardTitle>
              <CardDescription>Take a photo or upload an image of your bill.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 p-8">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="text-muted-foreground">Extracting items, please wait...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <Input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
                  <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Users className="mr-2 h-5 w-5" /> Upload Image
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="mr-2 h-5 w-5" /> Take Photo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Add Participants</CardTitle>
              <CardDescription>Who are you splitting the bill with?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Participant's name"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                />
                <Button onClick={addParticipant}><Plus className="h-4 w-4 mr-2" />Add</Button>
              </div>
              <ScrollArea className="h-48 mt-4 pr-4">
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
                  {participants.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">No participants added yet.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Assign Items</CardTitle>
              <CardDescription>Assign each item to one or more participants.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[50vh]">
              <div className="space-y-4 pr-4">
              {items.map((item) => {
                  const allSelected = participants.length > 0 && item.assignedTo.length === participants.length;
                  const someSelected = item.assignedTo.length > 0 && !allSelected;
                  const checkboxState = allSelected ? true : (someSelected ? "indeterminate" : false);

                  return (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id={`select-all-${item.id}`} onCheckedChange={(c) => handleSelectAllForItem(item.id, c)} checked={checkboxState}/>
                            <label htmlFor={`select-all-${item.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">All</label>
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
        );
      case 4:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Final Bill Split</CardTitle>
              <CardDescription>Here's how much everyone owes.</CardDescription>
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
                            <span className="font-bold text-primary text-lg">${result.total.toFixed(2)}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-1 pl-4">
                          {result.items.map((item, index) => (
                            <li key={index} className="flex justify-between text-muted-foreground text-sm">
                              <span>{item.name} (split)</span>
                              <span>${item.splitPrice.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };
  
  const currentStepInfo = STEPS[step - 1];

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
        
        <div className="flex justify-between items-center mt-6">
          {step > 1 ? (
             <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          ) : <div />}

          {step < 4 && step > 1 && (
            <Button onClick={() => setStep(s => s + 1)} disabled={(step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid)}>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {step === 4 && (
             <Button onClick={startOver}>
              <Plus className="h-4 w-4 mr-2" /> Start New Bill
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
