
"use client";

import { useState, useRef } from "react";
import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Key, DollarSign, Target, Zap, ShieldCheck, Users, Copy, Loader2 } from "lucide-react";
import { useProfile } from "@/context/profile-context";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/context/balance-context";
import { Progress } from "@/components/ui/progress";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { Dialog, DialogHeader, DialogFooter, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { CheckoutInfo, TransactionData } from '@/lib/types';
import { createStoreTransaction } from "@/ai/flows/create-store-transaction";
import { useAnalytics } from "@/context/analytics-context";


export default function PerfilPage() {
    const { profile, updateProfile, hasEarningsDoubled } = useProfile();
    const { balance } = useBalance();
    const { toast } = useToast();
    const { trackEvent, trackDetailedEvent, trackError } = useAnalytics();

    const [name, setName] = useState(profile.name);
    const [avatar, setAvatar] = useState(profile.avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
    
    // State for checkout flow
    const [isLoadingDuplicateEarnings, setIsLoadingDuplicateEarnings] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    
    // New states for withdrawal flow
    const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
    const [isLoadingWithdrawal, setIsLoadingWithdrawal] = useState(false);


    const withdrawalGoal = 1000;
    const progress = Math.min((balance / withdrawalGoal) * 100, 100);
    const referralLink = `https://madames.online/app?ref=${profile.name.toLowerCase().replace(/\s/g, '') || 'seu-id'}`;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setAvatar(result);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSave = () => {
        if (!avatar) {
            toast({
                variant: 'destructive',
                title: "Foto de perfil obrigatória",
                description: "Por favor, adicione uma foto de perfil.",
            });
            return;
        }

        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: "Campo obrigatório",
                description: "Por favor, preencha seu nome.",
            });
            return;
        }

        updateProfile({ name, avatarUrl: avatar });
        toast({
            title: "Perfil Atualizado!",
            description: "Suas informações foram salvas com sucesso.",
        });
    };
    
    const handleDuplicateEarnings = async () => {
        setIsLoadingDuplicateEarnings(true);
        const offer: CheckoutInfo = {
            amount: 15.49,
            productName: "Duplicar Ganhos",
            source: 'duplicate_earnings:perfil'
        };
        trackDetailedEvent('click_duplicate_earnings', { price: offer.amount, productName: offer.productName, source: offer.source });
        
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
            toast({ variant: 'destructive', title: 'Erro ao gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.' });
        } finally {
            setIsLoadingDuplicateEarnings(false);
        }
    };

    const handleReferralClick = () => {
        setIsReferralDialogOpen(true);
    };

    const handleCopyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Link Copiado!",
            description: "Seu link de indicação foi copiado para a área de transferência.",
        });
    };
    
    const handleWithdrawalClick = () => {
        if (balance >= withdrawalGoal) {
            trackEvent('click_solicitar_saque');
            setIsWithdrawalDialogOpen(true);
        }
    };

    const handlePayWithdrawalFee = async () => {
        setIsLoadingWithdrawal(true);
        const offer: CheckoutInfo = {
            amount: 17.00,
            productName: "Taxa de Validação de Identidade",
            source: 'withdrawal_fee:perfil'
        };
        trackDetailedEvent('click_withdrawal_fee', { price: offer.amount });
        
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
            setIsWithdrawalDialogOpen(false); // Close this dialog
            setIsCheckoutOpen(true); // Open the main checkout dialog
        } catch (error: any) {
            trackError(error);
            toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.' });
        } finally {
            setIsLoadingWithdrawal(false);
        }
    };


    return (
        <>
            <MainLayout activeTab="perfil">
                <main className="p-4 sm:p-6 md:p-8 pb-24">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <header className="flex items-center gap-4">
                             <Avatar className="h-20 w-20 border-2 border-primary">
                                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                                <AvatarFallback>{profile.name ? profile.name.charAt(0) : <User />}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <h1 className="text-3xl font-bold break-words">Olá, {profile.name}!</h1>
                                <p className="text-muted-foreground">Gerencie seu perfil e ganhos.</p>
                            </div>
                        </header>

                        <Card className="border-primary/30 bg-primary/5">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-6 w-6" />
                                    Meta de Saque
                                </CardTitle>
                                <CardDescription>Alcance a meta de R$ {withdrawalGoal.toFixed(2).replace('.',',')} e realize seu primeiro saque.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Saldo atual</p>
                                    <p className="text-5xl font-bold text-green-400">R$ {balance.toFixed(2).replace('.', ',')}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Progress value={progress} className="h-3" />
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>R$ 0,00</span>
                                        <span>R$ {withdrawalGoal.toFixed(2).replace('.',',')}</span>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground text-left">A meta de saque foi estabelecida para garantir que os usuários interajam com as madames e aproveitem todas as oportunidades de ganho disponíveis no app.</p>

                                 <Button 
                                    className="w-full h-12 text-lg" 
                                    onClick={handleWithdrawalClick}
                                    disabled={balance < withdrawalGoal}
                                >
                                    Solicitar Saque
                                </Button>
                            </CardContent>
                        </Card>
                        
                        {!hasEarningsDoubled && (
                            <Card className="border-amber-500/30 bg-amber-950/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-400">
                                        <Zap className="h-6 w-6" />
                                        Duplique Seus Ganhos
                                    </CardTitle>
                                    <CardDescription className="text-amber-200/80">Ative o bônus 2x e dobre todos os seus ganhos no app! Atinja a meta de saque muito mais rápido.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button 
                                        className="w-full h-12 text-lg bg-amber-500 hover:bg-amber-600 text-black font-bold" 
                                        onClick={handleDuplicateEarnings}
                                        disabled={isLoadingDuplicateEarnings}
                                    >
                                        {isLoadingDuplicateEarnings ? <Loader2 className="animate-spin" /> : 'Duplicar Ganhos por R$ 15,49'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="text-center">
                                <CardTitle>Editar Informações</CardTitle>
                                <CardDescription>Mantenha seus dados atualizados.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                               <div className="flex flex-col items-center gap-2">
                                 <Label>Foto de Perfil</Label>
                                <div className="relative w-fit" onClick={handleAvatarClick}>
                                    <Avatar className="h-28 w-28 cursor-pointer">
                                        <AvatarImage src={avatar} alt={name} />
                                        <AvatarFallback>{name ? name.charAt(0) : <User />}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 border-2 border-card cursor-pointer">
                                        <Camera className="h-5 w-5" />
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome de Usuário</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        id="name" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Digite seu nome de usuário"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                                
                                <Button onClick={handleSave} className="w-full">
                                    Salvar Alterações
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </MainLayout>
            
            <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
                <DialogContent>
                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="rounded-full bg-primary/10 p-4 w-fit">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <DialogTitle className="text-3xl font-bold">Valide sua Identidade para Sacar</DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                           Para sua segurança e para cumprir as normas anti-fraude, precisamos confirmar que você é você mesmo antes de liberar seu primeiro saque.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <p className="text-sm text-center text-muted-foreground">
                            Uma taxa única de <strong>R$17,00</strong> para validação de documentos é necessária. Após a confirmação, seu saque de <strong>R$ {balance.toFixed(2).replace('.',',')}</strong> será processado.
                        </p>
                        <Button onClick={handlePayWithdrawalFee} disabled={isLoadingWithdrawal} className="w-full h-12 text-lg">
                            {isLoadingWithdrawal ? <Loader2 className="animate-spin" /> : "Pagar Taxa e Sacar (R$ 17,00)"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
                <DialogContent>
                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="rounded-full bg-primary/10 p-4 w-fit">
                            <Users className="h-10 w-10 text-primary" />
                        </div>
                        <DialogTitle className="text-3xl font-bold">Indique e Ganhe!</DialogTitle>
                        <DialogDescription className="text-base text-center">
                            Ganhe R$10,00 de saldo para cada amigo que liberar o acesso VIP usando seu link exclusivo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                         <div className="space-y-2">
                            <Label htmlFor="referral-link">Seu link de indicação</Label>
                            <div className="relative">
                                <Input id="referral-link" readOnly value={referralLink} className="pr-12 bg-muted/50" />
                                <Button size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={handleCopyReferralLink}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                         <Button onClick={handleCopyReferralLink} size="lg" className="w-full h-12 text-lg">
                            Copiar Link
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
