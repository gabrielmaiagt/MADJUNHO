
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import React, { useState } from "react";
import { TiktokUpgradeContent } from "./tiktok-upgrade-content";
import { useAnalytics } from "@/context/analytics-context";
import { createStoreTransaction } from "@/ai/flows/create-store-transaction";
import { useToast } from "@/hooks/use-toast";
import { CheckoutDialog } from "./checkout-dialog";
import type { TransactionData, CheckoutInfo } from "@/lib/types";

type TiktokPaywallProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
};

export function TiktokPaywall({ open, onOpenChange, source }: TiktokPaywallProps) {
  const { trackDetailedEvent, trackError } = useAnalytics();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    const offer: CheckoutInfo = {
        amount: 18.90,
        productName: "Acesso TikTok +18",
        source: `tiktok_paywall:${source}`
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
        toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.' });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="bg-black/95 text-white border-primary/50 w-screen h-dvh max-w-full max-h-full p-0 flex flex-col rounded-none border-none"
          hideCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Acesso ao conteúdo bloqueado</DialogTitle>

          <TiktokUpgradeContent 
              onOpenChange={onOpenChange}
              title="Você atingiu o limite!"
              source={source}
              onConfirm={handleConfirm}
              isLoading={isLoading}
          />
          
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
