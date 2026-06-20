
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { useAnalytics } from "@/context/analytics-context";
import { createStoreTransaction } from "@/ai/flows/create-store-transaction";
import { useToast } from "@/hooks/use-toast";
import { CheckoutDialog } from "./checkout-dialog";
import type { TransactionData, CheckoutInfo } from "@/lib/types";

type DuplicateEarningsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string; // e.g., 'perfil' or 'live'
};

export function DuplicateEarningsDialog({ open, onOpenChange, source }: DuplicateEarningsDialogProps) {
    const { trackDetailedEvent, trackError } = useAnalytics();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);

    const handleUpgradeClick = async () => {
        setIsLoading(true);
        const offer: CheckoutInfo = {
            amount: 15.49,
            productName: "Duplicar Ganhos",
            source: `duplicate_earnings:${source}`
        };
        try {
            const params = new URLSearchParams(window.location.search);
            const utmify_visitor_id = localStorage.getItem('utmify_visitor_id');
            const utm_params_str = localStorage.getItem('utm_params');
            const utm_params = utm_params_str ? JSON.parse(utm_params_str) : {};

            const tracking = {
                utm_source: params.get('utm_source') || utm_params.utm_source,
                utm_medium: params.get('utm_medium') || utm_params.utm_medium,
                utm_campaign: params.get('utm_campaign') || utm_params.utm_campaign,
                utm_content: params.get('utm_content') || utm_params.utm_content,
                utm_term: params.get('utm_term') || utm_params.utm_term,
                utm_id: params.get('utm_id') || utm_params.utm_id,
                ref: params.get('xcod') || params.get('ref') || utm_params.xcod || utm_params.ref,
                src: params.get('src') || utm_params.src,
                sck: params.get('sck') || utm_params.sck,
                utmify_visitor_id: utmify_visitor_id,
            };

            const newTransaction = await createStoreTransaction({ 
                amount: offer.amount, 
                productName: offer.productName,
                source: offer.source,
                tracking
            });
            trackDetailedEvent('generate_pix', { amount: offer.amount, productName: offer.productName, source: offer.source });
            setTransaction(newTransaction);
            setCheckoutInfo(offer);
            onOpenChange(false); // Close current dialog
            setIsCheckoutOpen(true); // Open checkout dialog
        } catch (error: any) {
            trackError(error);
            toast({ variant: 'destructive', title: 'Erro ao gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.' });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-yellow-900 via-background to-background border-amber-500/50">
                <DialogHeader className="items-center text-center space-y-4">
                    <div className="rounded-full bg-amber-500/10 p-4 w-fit border border-amber-500/30">
                        <Zap className="h-10 w-10 text-amber-400" />
                    </div>
                    <DialogTitle as="h2" className="text-3xl font-bold text-amber-400">Duplique Seus Ganhos</DialogTitle>
                    <DialogDescription className="text-base text-amber-200/80">
                        Ative o bônus 2x e dobre todos os seus ganhos no app! Atinja a meta de saque muito mais rápido.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Button 
                        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                        onClick={handleUpgradeClick}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Duplicar Ganhos por R$ 15,49'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        {checkoutInfo && (
            <CheckoutDialog
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                totalAmount={checkoutInfo.amount}
                source={checkoutInfo.source}
                productName={checkoutInfo.productName}
                transaction={transaction}
            />
        )}
    </>
  );
}
