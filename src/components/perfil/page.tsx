
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
import { DuplicateEarningsDialog } from "../duplicate-earnings-dialog";


export default function PerfilPage() {
    const { profile, updateProfile, hasEarningsDoubled } = useProfile();
    const { balance } = useBalance();
    const { toast } = useToast();
    const { trackDetailedEvent, trackError } = useAnalytics();

    const [name, setName] = useState(profile.name);
    const [avatar, setAvatar] = useState(profile.avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isDuplicateEarningsOpen, setIsDuplicateEarningsOpen] = useState(false);
    const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
    
    const withdrawalGoal = 500;
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
        updateProfile({ name, avatarUrl: avatar });
        toast({
            title: "Perfil Atualizado!",
            description: "Suas informações foram salvas com sucesso.",
        });
    };
    
    const handleDuplicateEarnings = async () => {
        setIsDuplicateEarningsOpen(true);
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
                                <p className="text-muted-foreground">Gerencie seu perfil e seus ganhos.</p>
                            </div>
                        </header>

                        <Card className="border-primary/30 bg-primary/5">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-6 w-6" />
                                    Meta para Saque
                                </CardTitle>
                                <CardDescription>Alcance a meta de R$ {withdrawalGoal.toFixed(2).replace('.',',')} para realizar seu primeiro saque.</CardDescription>
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
                                    onClick={handleReferralClick}
                                >
                                    <Users className="mr-2 h-5 w-5" />
                                    Indique e Ganhe R$10
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
                                    <CardDescription className="text-amber-200/80">Ative o bônus 2x e dobre TODOS os seus ganhos no app! Atinja sua meta de saque muito mais rápido.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full h-12 text-lg bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={handleDuplicateEarnings}>
                                        Duplicar Ganhos por R$ 15,49
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

            <DuplicateEarningsDialog 
                open={isDuplicateEarningsOpen} 
                onOpenChange={setIsDuplicateEarningsOpen}
                source="perfil"
            />
        </>
    );
}
