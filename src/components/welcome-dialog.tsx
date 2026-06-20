
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Sparkles, Heart, PlayCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type WelcomeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const handleContinue = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] sm:max-w-md bg-transparent text-card-foreground border-0 p-0 shadow-none"
        hideCloseButton={true}
      >
        <div className="max-w-md w-full">
            <div className="flex flex-col items-center justify-center mb-6 text-center">
                <Logo className="w-24 h-24" />
                  <h1 className="text-4xl font-extrabold mt-4" style={{'color': '#CA1854'}}>
                    Madames Online{' '}
                    <span className="animate-pulse bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent" style={{'textShadow': '0 0 10px rgba(255,215,0,0.5)'}}>
                        VIP
                    </span>
                </h1>
            </div>
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Seu acesso foi liberado!</CardTitle>
                    <CardDescription className="text-lg pt-1">Veja como aumentar seu saldo:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Heart className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Curta Vídeos do TikTok +18</h3>
                                <p className="text-sm text-muted-foreground">Curta os vídeos no feed e veja seu saldo subir a cada interação.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <PlayCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Assista às Lives</h3>
                                <p className="text-sm text-muted-foreground">Participe das transmissões ao vivo e ganhe recompensas por minuto assistido.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Converse com Madames</h3>
                                <p className="text-sm text-muted-foreground">Interaja nos chats privados ou em grupo. Quanto mais você conversa, mais você lucra.</p>
                            </div>
                        </div>
                    </div>
                    
                    <Button onClick={handleContinue} className="w-full h-12 text-lg" size="lg">
                        <Sparkles className="mr-2 h-5 w-5"/>
                        Começar a Lucrar Agora
                    </Button>
                </CardContent>
            </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
