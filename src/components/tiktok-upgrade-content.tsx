
"use client";

import { Button } from "@/components/ui/button";
import { Clock, Download, Radio, Lock, MessageCircle, PlayCircle, Users, UnlockKeyhole, X, Infinity, Loader2, Heart } from "lucide-react";
import { useAnalytics } from "@/context/analytics-context";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { DialogHeader, DialogTitle } from "./ui/dialog";
import { TiktokIcon } from "./icons/TiktokIcon";

type TiktokUpgradeContentProps = {
    onOpenChange: (open: boolean) => void;
    title?: string;
    onConfirm: () => void;
    isLoading: boolean;
    source: string;
};

const benefits = [
  { icon: Infinity, text: "Vídeos ilimitados (curta quantos quiser)" },
  { icon: PlayCircle, text: "Lives exclusivas (obtenha mais ganhos)" },
  { icon: UnlockKeyhole, text: "Acesso ao Clube das Madames" },
  { icon: MessageCircle, text: "Comente e interaja sem restrições" },
  { icon: Download, text: "Baixe todos os vídeos em alta qualidade" },
];

const OFFER_DURATION = 10 * 60; // 10 minutes in seconds
const TIMER_REMAINING_KEY = 'tiktokOfferTimeLeft';
const VIEWER_COUNT_KEY = 'tiktokOfferViewerCount';


export function TiktokUpgradeContent({ onOpenChange, title, onConfirm, isLoading, source }: TiktokUpgradeContentProps) {
  const { trackEvent } = useAnalytics();
  const [timeLeft, setTimeLeft] = useState(OFFER_DURATION);
  const [viewers, setViewers] = useState(87);

  useEffect(() => {
    // Load remaining time from localStorage on component mount
    const savedTimeLeft = localStorage.getItem(TIMER_REMAINING_KEY);
    const initialTime = (savedTimeLeft && !isNaN(parseInt(savedTimeLeft, 10))) ? parseInt(savedTimeLeft, 10) : OFFER_DURATION;
    setTimeLeft(initialTime);

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Cleanup interval on unmount
    return () => {
        clearInterval(timerId);
        // Save the last time when component unmounts
        setTimeLeft(prevTime => {
            localStorage.setItem(TIMER_REMAINING_KEY, String(prevTime));
            return prevTime;
        });
    };
  }, []);

  useEffect(() => {
    // Load viewer count from localStorage on component mount
    const savedViewerCount = localStorage.getItem(VIEWER_COUNT_KEY);
    const initialViewers = (savedViewerCount && !isNaN(parseInt(savedViewerCount, 10))) ? parseInt(savedViewerCount, 10) : 87;
    setViewers(initialViewers);

    const viewerInterval = setInterval(() => {
        setViewers(v => v + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    
    return () => {
        clearInterval(viewerInterval);
        // Save the last viewer count when component unmounts
        // We need to use the functional form of setViewers to get the latest value
        setViewers(currentViewers => {
            localStorage.setItem(VIEWER_COUNT_KEY, String(currentViewers));
            return currentViewers;
        });
    };
  }, []);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleUpgrade = () => {
    trackEvent('click_upgrade_tiktok');
    onConfirm();
  };

  return (
    <>
        <DialogHeader className="sr-only">
          <DialogTitle>{title || "Desbloquear Acesso Completo"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
            <div className="flex flex-col justify-center items-center p-4 sm:p-6 text-center pt-8 sm:pt-6">
                 <div className="flex justify-center items-center gap-3 text-primary">
                    <TiktokIcon className="h-10 w-10 md:h-12 md:w-12"/>
                    <span className="text-4xl md:text-5xl font-extrabold">+18</span>
                </div>

                {title && (
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-primary animate-pulse">
                        {title}
                    </h1>
                )}

                <p className="text-base md:text-lg text-neutral-300 mt-3 max-w-md">
                    Libere agora o acesso completo ao TikTok +18 e desbloqueie tudo que você merece:
                </p>
                
                <div className="space-y-3 my-6 md:my-8 w-full max-w-md text-left">
                {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                    <benefit.icon className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-base font-medium text-neutral-200">{benefit.text}</span>
                    </div>
                ))}
                </div>
            </div>
        </ScrollArea>
        
        <div className="p-4 sm:p-6 bg-black/50 border-t border-primary/20 mt-auto">
            <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                <div className="w-full bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="h-5 w-5"/>
                        <p className="font-bold text-sm">Esta oferta acaba em: <span className="font-mono">{formatTime(timeLeft)}</span></p>
                    </div>
                </div>

                <div className="text-center my-2">
                    <p className="text-lg text-neutral-400">De <s className="line-through">R$99,90</s> por apenas</p>
                    <p className="text-4xl font-bold text-green-400">R$18,90</p>
                    <p className="text-xs text-neutral-400">(Pagamento único, acesso vitalício)</p>
                </div>

                <Button
                    className="w-full h-14 md:h-16 text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <> <UnlockKeyhole className="mr-2 h-5 w-5 md:mr-3 md:h-6 md:w-6" /> LIBERAR ACESSO COMPLETO </>}
                </Button>
                
                 <div className="flex items-center gap-2 text-sm text-green-400 animate-pulse mt-2">
                    <Users className="h-4 w-4" />
                    <p>{viewers} homens estão desbloqueando agora...</p>
                </div>
            </div>
        </div>
    </>
  );
}
