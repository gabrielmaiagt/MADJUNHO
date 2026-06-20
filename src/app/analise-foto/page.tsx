
"use client";

import { useState, useRef } from 'react';
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BackButton from '@/components/BackButton';
import { useAnalytics } from '@/context/analytics-context';
import { CheckoutDialog } from '@/components/checkout-dialog';
import type { CheckoutInfo, TransactionData } from '@/lib/types';
import { createStoreTransaction } from '@/ai/flows/create-store-transaction';
import { useToast } from '@/hooks/use-toast';


export default function AnaliseFotoPage() {
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { trackEvent, trackDetailedEvent, trackError } = useAnalytics();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    const [transaction, setTransaction] = useState<TransactionData | null>(null);


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleAnalyzeClick = async () => {
        if (!image) return;
        trackEvent('click_analyze_photo');
        setLoading(true);

        const offer = {
            amount: 19.90,
            productName: "Acesso Analistas de IA",
            source: "upgrade_dialog:analistas"
        };
        
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
                amount: offer.amount,
                productName: offer.productName,
                source: offer.source,
                tracking
            });
            trackDetailedEvent('generate_pix', { amount: offer.amount, productName: offer.productName, source: offer.source });
            setTransaction(newTransaction);
            setCheckoutInfo(offer);
            setIsCheckoutOpen(true);
        } catch (error: any) {
            trackError(error);
            toast({ variant: "destructive", title: "Erro ao gerar PIX", description: "Não foi possível criar a cobrança. Tente novamente." });
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <MainLayout activeTab="grupos">
                <main className="p-4 sm:p-6 md:p-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-4">
                            <BackButton />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle as="h1" className="text-3xl font-bold">Análise de Foto de Perfil com IA</CardTitle>
                                <CardDescription>
                                    Envie sua melhor foto e receba um feedback da nossa IA para saber se ela é ideal para seu perfil de namoro.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div 
                                    className="w-full aspect-square border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                                    onClick={triggerFileSelect}
                                >
                                    {image ? (
                                        <Image src={image} alt="Foto de perfil enviada" width={400} height={400} className="object-cover rounded-lg max-h-full w-auto" />
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <Upload className="mx-auto h-12 w-12" />
                                            <p className="mt-2">Clique para enviar uma foto</p>
                                            <p className="text-xs">PNG, JPG, WEBP</p>
                                        </div>
                                    )}
                                </div>
                                 <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileSelect}
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/webp"
                                />
                                
                                <Button className="w-full" onClick={handleAnalyzeClick} disabled={!image || loading}>
                                     {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analisando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Analisar Foto
                                        </>
                                     )}
                                </Button>

                            </CardContent>
                        </Card>
                    </div>
                </main>
            </MainLayout>
            
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
