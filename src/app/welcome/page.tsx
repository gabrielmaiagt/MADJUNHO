
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Sparkles, Heart, PlayCircle, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/profile-context";

const earningFeatures = [
    {
        icon: Heart,
        title: "Curta Vídeos",
        description: "Curta os vídeos das madames no TikTok +18 e receba PIX a cada curtida."
    },
    {
        icon: PlayCircle,
        title: "Assista Lives",
        description: "Assista às lives das madames e obtenha ganhos a cada minuto assistido."
    },
    {
        icon: MessageSquare,
        title: "Converse com Madames",
        description: "Converse com as madames e seja recompensado a cada interação."
    }
];

export default function WelcomePage() {
    const router = useRouter();
    const { profile } = useProfile();

    const handleContinue = () => {
        // Preservar UTMs na navegação
        const search = window.location.search || '';
        router.push('/comunidade' + search);
    };

    return (
        <div className="flex flex-col min-h-dvh bg-background items-center justify-center p-4">
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
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl break-words">Bem-vindo, {profile.name}!</CardTitle>
                        <CardDescription className="text-lg pt-1">Veja como aumentar seu saldo:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {earningFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border"
                                >
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        <Button onClick={handleContinue} className="w-full" size="lg">
                            Começar a Lucrar Agora
                        </Button>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
