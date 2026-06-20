
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Key } from "lucide-react";
import { useProfile } from "@/context/profile-context";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { useAnalytics } from "@/context/analytics-context";
import { useFirestore } from "@/firebase";
import { v4 as uuidv4 } from "uuid";

export default function CreateProfilePage() {
    const { profile, updateProfile, completeOnboarding } = useProfile();
    const router = useRouter();
    const { toast } = useToast();
    const { trackEvent } = useAnalytics();
    const firestore = useFirestore();

    const [name, setName] = useState(profile.name || '');
    const [avatar, setAvatar] = useState(profile.avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hasStartedFilling, setHasStartedFilling] = useState(false);

    useEffect(() => {
        trackEvent('visit_create_profile');
    }, [trackEvent]);
    
    const handleInteraction = () => {
        if (!hasStartedFilling) {
            trackEvent('start_filling_profile');
            setHasStartedFilling(true);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleInteraction();
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setAvatar(result);
                updateProfile({ avatarUrl: result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateProfile = async () => {
        if (!avatar || avatar === defaultProfile.avatarUrl) {
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
        
        trackEvent('submit_create_profile');
        
        const visitorId = localStorage.getItem('visitorId');
        const userId = profile.id || uuidv4();

        completeOnboarding({ id: userId, name, avatarUrl: avatar, anonymousVisitorId: visitorId || null });

        // Preservar UTMs na navegação
        const search = window.location.search || '';
        router.push('/welcome' + search);
    };

    const defaultProfile = {
        avatarUrl: ''
    };

    return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
             <div className="max-w-md w-full">
                <div className="flex flex-col items-center justify-center mb-6 text-center">
                    <Logo className="w-24 h-24" />
                     <h1 className="text-4xl font-extrabold mt-4" style={{ color: '#CA1854' }}>
                        Madames Online{' '}
                        <span className="animate-pulse bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent" style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
                            VIP
                        </span>
                    </h1>
                </div>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Seu Perfil</CardTitle>
                        <CardDescription>Finalize sua identificação para entrar no app.</CardDescription>
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
                                    onChange={(e) => {
                                        const newName = e.target.value;
                                        setName(newName);
                                        updateProfile({ name: newName });
                                        handleInteraction();
                                    }}
                                    placeholder="Digite seu nome"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button onClick={handleCreateProfile} className="w-full" size="lg">
                            Finalizar Perfil
                        </Button>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
