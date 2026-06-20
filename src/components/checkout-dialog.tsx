
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, CheckCircle, Loader2, Clock } from "lucide-react";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { TransactionData, CheckoutInfo } from '@/lib/types';
import { useCart } from '@/context/cart-context';
import { useAnalytics } from '@/context/analytics-context';
import { useProfile } from '@/context/profile-context';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { checkTransactionStatus } from '@/ai/flows/check-transaction-status';
import QRCode from 'qrcode';

type CheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  transaction?: TransactionData | null;
  source?: string;
  productName?: string;
  onPaymentComplete?: (amount: number) => void;
  isStoreCheckout?: boolean;
  unlockChat?: (chatId: string) => void;
};

export function CheckoutDialog({ open, onOpenChange, totalAmount, transaction: initialTransaction, source = 'unknown', productName = 'N/A', onPaymentComplete, isStoreCheckout = false, unlockChat }: CheckoutDialogProps) {
  const { toast } = useToast();
  const { clearCart } = useCart();
  const router = useRouter();
  const { trackDetailedEvent, trackError } = useAnalytics();
  const { setTiktokAccess, setHasEarningsDoubled } = useProfile();

  const [step, setStep] = useState<'payment' | 'confirmed'>('payment');
  const [transaction, setTransaction] = useState<TransactionData | null>(initialTransaction || null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  const grantAccess = useCallback(() => {
    onPaymentComplete?.(totalAmount);
    const tiktokAccessSources = ['tiktok_paywall', 'upgrade_dialog:tiktok', 'upgrade_dialog:madames', 'upgrade_dialog:clube'];
    const isLiveChatSource = source.startsWith('end_of_live:');
    
    if (tiktokAccessSources.some(s => source.startsWith(s))) {
        setTiktokAccess(true);
    }
    
    if (source.startsWith('duplicate_earnings')) {
      setHasEarningsDoubled(true);
    }

    if (isLiveChatSource) {
        const [, liveId, chatId] = source.split(':');
        if (chatId && unlockChat) {
            unlockChat(chatId);
            setTimeout(() => {
                onOpenChange(false);
                router.push(`/chat/${chatId}`);
            }, 1500);
        }
    }

    setStep('confirmed');
    
    if (isStoreCheckout) {
      clearCart();
    }
  }, [onPaymentComplete, totalAmount, source, setTiktokAccess, setHasEarningsDoubled, isStoreCheckout, clearCart, onOpenChange, router, unlockChat]);

  // Generate QR Code locally when transaction is loaded
  useEffect(() => {
    if (transaction?.pix.payload) {
      QRCode.toDataURL(transaction.pix.payload, { width: 300, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => {
          console.error("Failed to generate QR Code:", err);
          trackError(err);
        });
    }
  }, [transaction, trackError]);

  // Polling logic (2 seconds interval)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (open && step === 'payment' && transaction?.id) {
      interval = setInterval(async () => {
        try {
          const { status } = await checkTransactionStatus({ transactionId: transaction.id });
          if (status === 'approved' || status === 'paid') {
            clearInterval(interval);
            grantAccess();
          } else if (status === 'failed' || status === 'refunded') {
            clearInterval(interval);
            toast({ variant: 'destructive', title: 'Pagamento Falhou', description: 'A transação expirou ou foi cancelada.' });
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, step, transaction, grantAccess, toast]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTransaction(null);
        setStep('payment');
        setQrCodeUrl('');
      }, 300);
      return;
    }
    if (initialTransaction) {
        setTransaction(initialTransaction);
    }
  }, [open, initialTransaction]);
  
  useEffect(() => {
    if (open && step === 'payment') {
      setTimeLeft(600);
      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open, step]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleCopyToClipboard = () => {
    if (transaction?.pix.payload) {
        navigator.clipboard.writeText(transaction.pix.payload);
        toast({ title: 'Copiado!', description: 'O código PIX foi copiado.' });
    }
  };
  
  const handleCheckPayment = async () => {
    if (!transaction?.id) return;
    setIsCheckingStatus(true);
    try {
      const { status } = await checkTransactionStatus({ transactionId: transaction.id });
      if (status === 'approved' || status === 'paid') {
        grantAccess();
      } else {
        toast({
          title: "Pagamento Pendente",
          description: "Ainda não recebemos a confirmação do seu pagamento. Aguarde ou tente novamente.",
        });
      }
    } catch (error: any) {
      trackError(error);
      toast({
        variant: "destructive",
        title: "Erro ao Verificar",
        description: "Não foi possível verificar o status. Tente novamente.",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent 
        className="sm:max-w-md bg-card text-card-foreground"
        hideCloseButton={step === 'payment'}
        onInteractOutside={(e) => {
          if (step === 'payment') {
            e.preventDefault();
          }
        }}
      >
        {step === 'payment' ? (
          !transaction ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h2 className="text-2xl font-bold">Gerando seu PIX...</h2>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">Pagamento PIX</DialogTitle>
                <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <QrCode className="h-8 w-8 text-primary" />
                  <span>Pague para confirmar</span>
                </h2>
                <DialogDescription className="text-center">
                  Escaneie o QR Code ou copie o código para pagar no app do seu banco.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center text-center space-y-4 pt-4">
                {qrCodeUrl ? (
                  <div className="relative p-2 bg-white rounded-lg">
                    <Image src={qrCodeUrl} alt="PIX QR Code" width={256} height={256} />
                  </div>
                ) : (
                  <div className="w-[256px] h-[256px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                <div className="w-full bg-destructive/10 border border-destructive/20 text-destructive p-2 rounded-lg flex items-center justify-center gap-2 text-center">
                  <Clock className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">
                    Expira em: <span className="font-mono">{formatTime(timeLeft)}</span>
                  </p>
                </div>

                <div className="w-full space-y-2">
                    <Label className="text-sm font-bold text-left">PIX Copia e Cola:</Label>
                    <div className="relative cursor-pointer group" onClick={handleCopyToClipboard}>
                        <Textarea 
                            readOnly 
                            value={transaction.pix.payload} 
                            className="pr-12 text-xs h-28 bg-muted resize-none cursor-pointer group-hover:bg-muted/80 transition-colors"
                        />
                        <div className="absolute right-1 top-1 h-9 w-9 flex items-center justify-center rounded-md group-hover:bg-primary/20">
                            <Copy className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </div>
                
                <Button onClick={handleCheckPayment} disabled={isCheckingStatus} className="w-full">
                  {isCheckingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Verificar Pagamento
                </Button>

                <div className="w-full bg-primary/10 border border-primary/20 text-primary-foreground/80 p-3 rounded-lg flex items-center gap-3 text-left">
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin" />
                  <p className="text-sm font-semibold">
                    Aguardando confirmação. O acesso será liberado automaticamente após o pagamento.
                  </p>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-3xl font-bold">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground">Seu acesso foi liberado! Aproveite o conteúdo VIP.</p>
            <Button className="w-full mt-6" onClick={() => onOpenChange(false)}>Começar a usar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
