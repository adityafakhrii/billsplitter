
"use client";

import type { Bill, Participant, BillResult } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Share2, Plus } from "lucide-react";

type BillSplitterResultsProps = {
    bill: Bill;
    participants: Participant[];
    billResults: BillResult[];
    accountName: string;
    accountNumber: string;
    bankName: string;
    onShare: () => void;
    onExport: () => void;
    onStartOver: () => void;
};

const formatRupiah = (amount: number) => {
    if (isNaN(amount)) return "Rp0";
    return `Rp${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

export function BillSplitterResults({
    bill,
    participants,
    billResults,
    accountName,
    accountNumber,
    bankName,
    onShare,
    onExport,
    onStartOver
}: BillSplitterResultsProps) {
    return (
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
                <div className="flex flex-col sm:flex-row gap-2 no-print">
                    <Button onClick={onShare} size="lg" variant="outline" className="w-full"><Share2 className="mr-2" /> Share</Button>
                    <Button onClick={onExport} size="lg" variant="outline" className="w-full"><Printer className="mr-2" /> Export PDF</Button>
                </div>
                <Button onClick={onStartOver} size="lg" className="no-print">
                    <Plus className="h-4 w-4 mr-2" /> Itung Bill Baru
                </Button>
            </CardFooter>
        </Card>
    );
}
