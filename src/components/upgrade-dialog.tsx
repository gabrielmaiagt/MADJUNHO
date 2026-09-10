
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UnlockKeyhole, Sparkles, HeartCrack, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useAnalytics } from "@/context/analytics-context";
import { TiktokUpgradeContent } from "./tiktok-upgrade-content";
import type { TransactionData } from "@/lib/types";
import { createStoreTransaction } from "@/ai/flows/create-store-transaction";
import { useToast } from "@/hooks/use-toast";


type CheckoutInfo = {
    amount: number;
    source: string;
    productName: string;
};

type UpgradeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'madames' | 'analistas' | 'curtidas' | 'tiktok' | 'clube';
  onConfirm: (info: CheckoutInfo, transaction: TransactionData) => void;
  source?: string;
};

const contentByVariant = {
    madames: {
        icon: UnlockKeyhole,
        title: "Clube das Madames",
        description: "Desbloqueie fotos e vídeos explícitos, conversas ilimitadas e convites exclusivos das madames — tudo no mais absoluto sigilo.",
        cta: "Entrar no Clube por R$25,40",
        amount: 25.40,
        productName: "Acesso Clube das Madames"
    },
    clube: {
        icon: UnlockKeyhole,
        title: "Clube Madames Online",
        description: "Para acessar o carrinho e os produtos exclusivos, você precisa fazer parte do nosso clube. Tenha acesso a conteúdos e ofertas que ninguém mais vê.",
        cta: "Entrar no Clube por R$19,90",
        amount: 19.90,
        productName: "Acesso Clube Online"
    },
    tiktok: {
        productName: "Acesso TikTok +18",
        amount: 18.90
    },
    analistas: {
        icon: Sparkles,
        title: "Analistas de IA Ouro",
        description: "Receba análises ilimitadas de perfil, bio e conversas com nossa IA avançada para otimizar suas chances de match.",
        cta: "Desbloquear Análises por R$19,90",
        amount: 19.90,
        productName: "Acesso Analistas de IA"
    },
    curtidas: {
        icon: HeartCrack,
        title: "Suas Curtidas Acabaram",
        description: "Mas a chance de conquistar la mulher que você deseja não precisa acabar. Tenha curtidas ilimitadas e muito mais com o Madames Online VIP.",
        cta: "Curtidas Ilimitadas por R$19,90",
        amount: 19.90,
        productName: "Acesso Curtidas Ilimitadas"
    }
}


export function UpgradeDialog({ open, onOpenChange, variant = 'madames', onConfirm, source }: UpgradeDialogProps) {
  const { trackDetailedEvent, trackError } = useAnalytics();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async (offer: CheckoutInfo) => {
    setIsLoading(true);
    try {
        const params = new URLSearchParams(window.location.search);
        const utm_params_str = localStorage.getItem('utm_params');
        const utm_params = utm_params_str ? JSON.parse(utm_params_str) : {};
        const utmify_visitor_id = localStorage.getItem('utmify_visitor_id');

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

        const transaction = await createStoreTransaction({ 
            amount: offer.amount,
            productName: offer.productName,
            source: offer.source,
            tracking
        });
        trackDetailedEvent('generate_pix', { amount: offer.amount, productName: offer.productName, source: offer.source });
        onConfirm(offer, transaction);
        onOpenChange(false);
    } catch(e: any) {
        trackError(e);
        toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.'});
    } finally {
        setIsLoading(false);
    }
  }
  
  if (variant === 'tiktok') {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                hideCloseButton={false}
                className="bg-black/95 text-white border-primary/50 w-screen h-dvh max-w-full max-h-full p-0 flex flex-col rounded-none border-none sm:h-auto sm:max-w-lg sm:rounded-lg"
            >
                <TiktokUpgradeContent 
                    onOpenChange={onOpenChange} 
                    onConfirm={() => handleConfirm({ 
                        amount: contentByVariant.tiktok.amount, 
                        source: `upgrade_dialog:${source || variant}`, 
                        productName: contentByVariant.tiktok.productName 
                    })}
                    isLoading={isLoading}
                    source={source || variant}
                />
            </DialogContent>
        </Dialog>
    )
  }
  
  const selectedVariant = contentByVariant[variant];
  if (!selectedVariant || !selectedVariant.icon) return null;

  const { icon: Icon, title, description, cta, amount, productName } = selectedVariant;

  const handleButtonClick = () => {
    handleConfirm({ amount, source: `upgrade_dialog:${source || variant}`, productName });
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-3 w-fit">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle as="h2" className="text-3xl font-bold pt-2">{title}</DialogTitle>
          <DialogDescription className="text-base">
          {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Button 
                className="w-full font-bold text-lg p-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleButtonClick}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="animate-spin" /> : cta}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
