
"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { CheckoutDialog } from './checkout-dialog';
import { createStoreTransaction } from '@/ai/flows/create-store-transaction';
import type { TransactionData, CheckoutInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/context/analytics-context';

type CartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { cartItems, removeFromCart, cartTotal, cartTotalOriginal } = useCart();
  const { toast } = useToast();
  const { trackDetailedEvent, trackError } = useAnalytics();
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (cartTotal <= 0) {
      toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione itens ao carrinho para finalizar a compra.' });
      return;
    }
    const productNames = cartItems.map(item => item.name).join(', ');
    const source = 'cart_checkout';
    
    trackDetailedEvent('click_buy_now', { price: cartTotal, productName: productNames, source: source });
    
    setIsLoading(true);
    onOpenChange(false); // Close cart

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

        const newTransaction = await createStoreTransaction({
            amount: cartTotal,
            productName: productNames,
            source: source,
            tracking
        });
        setTransaction(newTransaction);
        trackDetailedEvent('generate_pix', { amount: cartTotal, productName: productNames, source: source });
        setIsCheckoutOpen(true);
    } catch(e: any) {
        trackError(e);
        toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.'});
    } finally {
        setIsLoading(false);
    }
  }

  const getOriginalPrice = (price: number, discount: number | null) => {
      if (!discount) return null;
      return price / (1 - discount / 100);
  }
  
  const totalDiscount = cartTotalOriginal - cartTotal;
  const checkoutInfo: CheckoutInfo | null = cartTotal > 0 ? {
    amount: cartTotal,
    source: 'cart_checkout',
    productName: cartItems.map(item => item.name).join(', ')
  } : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[90vw] max-w-lg bg-card text-card-foreground p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle as="h2" className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Seu Carrinho
            </SheetTitle>
          </SheetHeader>

          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <ShoppingCart className="h-20 w-20 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">Seu carrinho está vazio</h3>
              <p className="text-muted-foreground mt-2">Adicione produtos da loja para vê-los aqui.</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="px-6 py-4 space-y-4">
                  {cartItems.map(item => {
                    const originalPrice = getOriginalPrice(item.price, item.discount);
                    return (
                        <div key={item.id} className="flex items-center gap-4">
                          <Image 
                            src={item.images[0]} 
                            alt={item.name} 
                            width={80} 
                            height={80} 
                            className="rounded-md object-cover aspect-square bg-white"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-primary font-bold">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                {originalPrice && (
                                    <s className="text-sm text-muted-foreground">R$ {originalPrice.toFixed(2).replace('.', ',')}</s>
                                )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </div>
                    )
                  })}
                </div>
              </ScrollArea>
              
              <SheetFooter className="p-6 mt-auto border-t flex flex-col gap-4">
                 <div className="space-y-2 text-base">
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span>Subtotal</span>
                        <span>R$ {cartTotalOriginal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {totalDiscount > 0 && (
                         <div className="flex justify-between items-center text-destructive">
                            <span>Descontos</span>
                            <span>- R$ {totalDiscount.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                 </div>
                <Button className="w-full text-lg h-12" onClick={handleCheckout} disabled={isLoading}>
                   {isLoading ? <Loader2 className="animate-spin" /> : 'Finalizar Compra'}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
      
      {checkoutInfo && (
        <CheckoutDialog 
            isStoreCheckout={true}
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
