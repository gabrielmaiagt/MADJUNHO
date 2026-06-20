
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAnalytics } from '@/context/analytics-context';
import type { TransactionData, CheckoutInfo } from '@/lib/types';
import { createTransaction } from '@/ai/flows/create-transaction';


type PixDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (offer: CheckoutInfo, transaction: TransactionData) => void;
  creatorName?: string;
};

export function PixDialog({ open, onOpenChange, onConfirm, creatorName = 'a madame' }: PixDialogProps) {
  const { toast } = useToast();
  const { trackDetailedEvent, trackError } = useAnalytics();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  

  const handleSendPix = async () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount < 10 || numericAmount > 100) {
        toast({ variant: 'destructive', title: 'Valor inválido', description: 'Defina um valor entre R$10,00 e R$100,00.' });
        return;
    }
    setLoading(true);

    const offer: CheckoutInfo = {
      amount: numericAmount,
      source: `live_gift:${creatorName}`,
      productName: `Presente para ${creatorName}`,
    };

    try {
        const params = new URLSearchParams(window.location.search);
        const tracking = {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_content: params.get('utm_content'),
            utm_term: params.get('utm_term'),
            utm_id: params.get('utm_id'),
            ref: params.get('xcod') || params.get('ref'),
            src: params.get('src'),
            sck: params.get('sck'),
        };
        
        const newTransaction = await createTransaction({ 
          amount: numericAmount,
          productName: offer.productName,
          source: offer.source,
          tracking
        });
        trackDetailedEvent('generate_pix', { amount: numericAmount, productName: offer.productName, source: offer.source });
        onConfirm(offer, newTransaction);
        onOpenChange(false);
    } catch (error: any) {
        trackError(error);
        toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: error.message || 'Ocorreu um erro.' });
    } finally {
        setLoading(false);
    }
  };

  const handleDialogStateChange = (isOpen: boolean) => {
    if (!isOpen) {
        // Reset state when closing
        setAmount('');
        setMessage('');
        setLoading(false);
    }
    onOpenChange(isOpen);
  }

  const quickAmounts = [10, 25, 50, 100];

  return (
    <Dialog open={open} onOpenChange={handleDialogStateChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
            <>
                <DialogHeader className="items-center text-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-3 w-fit">
                    <Gift className="h-10 w-10 text-primary" />
                  </div>
                  <DialogTitle as="h2" className="text-3xl font-bold pt-2">Enviar Presente</DialogTitle>
                  <DialogDescription className="text-base text-center">
                    Apoie a {creatorName} com o valor que tocar seu coração! Sua mensagem aparecerá em destaque na live.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="pix-amount" className="sr-only">Valor do PIX</Label>
                    <div className="relative pt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">R$</span>
                      <Input
                        id="pix-amount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9,.]/g, '');
                          setAmount(value);
                        }}
                        placeholder="0,00"
                        className="h-14 pl-10 text-3xl font-bold text-center"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map(val => (
                      <Button 
                        key={val}
                        variant="outline"
                        onClick={() => setAmount(String(val))}
                      >
                        R${val}
                      </Button>
                    ))}
                  </div>

                  <div>
                     <Label htmlFor="pix-message" className="text-muted-foreground text-sm">Mensagem (opcional)</Label>
                      <Textarea 
                        id="pix-message"
                        placeholder={`Sua mensagem para ${creatorName}...`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1"
                        maxLength={150}
                      />
                  </div>

                </div>

                <Button 
                    className="w-full font-bold text-lg p-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSendPix}
                    disabled={loading || !amount}
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Gerar PIX'}
                </Button>
            </>
      </DialogContent>
    </Dialog>
  );
}
