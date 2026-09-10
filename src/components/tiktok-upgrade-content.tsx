
"use client";

import { Button } from "@/components/ui/button";
import { Clock, Download, Radio, Flame, MessageCircle, PlayCircle, Users, UnlockKeyhole, Star, Quote, Infinity, Loader2, Coins } from "lucide-react";
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
  { icon: Coins, text: "Ganhe PIX curtindo" },
  { icon: Infinity, text: "Vídeos ilimitados" },
  { icon: PlayCircle, text: "Lives exclusivas" },
  { icon: UnlockKeyhole, text: "Clube das Madames" },
  { icon: MessageCircle, text: "Comente à vontade" },
  { icon: Download, text: "Baixe em alta qualidade" },
];

const stats = [
  { icon: Flame, value: "500+", label: "vídeos picantes" },
  { icon: Radio, value: "12", label: "lives por semana" },
  { icon: Star, value: "4.9", label: "avaliação média" },
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

        <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col justify-center items-center px-4 sm:p-6 text-center pt-6 sm:pt-6">
                 <div className="flex justify-center items-center gap-2 text-primary">
                    <TiktokIcon className="h-7 w-7 sm:h-10 sm:w-10 md:h-12 md:w-12"/>
                    <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold">+18</span>
                </div>

                {title && (
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-2 sm:mt-4 text-primary animate-pulse">
                        {title}
                    </h1>
                )}

                <p className="text-sm sm:text-lg text-neutral-300 mt-2 sm:mt-3 max-w-md">
                    Desbloqueie tudo isso agora:
                </p>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-8 mb-4 sm:mb-6 w-full max-w-md text-left">
                {benefits.map((benefit, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border",
                            index === 0
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-white/5 border-white/10",
                            index === benefits.length - 1 && benefits.length % 2 === 1 && "col-span-2 justify-center"
                        )}
                    >
                    <benefit.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0", index === 0 ? "text-green-400" : "text-primary")} />
                    <span className={cn("text-xs sm:text-base font-medium leading-tight", index === 0 ? "text-green-300" : "text-neutral-200")}>{benefit.text}</span>
                    </div>
                ))}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-md mb-4 sm:mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center gap-1 bg-white/5 p-2.5 sm:p-3 rounded-lg border border-white/10">
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        <span className="text-base sm:text-xl font-extrabold text-white leading-none">{stat.value}</span>
                        <span className="text-[10px] sm:text-xs text-neutral-400 text-center leading-tight">{stat.label}</span>
                    </div>
                ))}
                </div>

                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 text-left mb-2">
                    <Quote className="h-5 w-5 text-primary/60 mb-1" />
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                        &ldquo;Já recuperei os R$18,90 só curtindo vídeo, e ainda tenho as lives liberadas todo dia. Vale muito.&rdquo;
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] sm:text-xs font-semibold text-neutral-400">Marcos R. · assinante verificado</span>
                        <div className="flex gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
        
        <div className="p-3 sm:p-6 bg-black/50 border-t border-primary/20 mt-auto shrink-0">
            <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-sm mx-auto">
                <div className="w-full bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg p-1.5 sm:p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5"/>
                        <p className="font-bold text-xs sm:text-sm">Oferta acaba em: <span className="font-mono">{formatTime(timeLeft)}</span></p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm sm:text-lg text-neutral-400">De <s className="line-through">R$99,90</s> por apenas</p>
                    <p className="text-3xl sm:text-4xl font-bold text-green-400">R$18,90</p>
                    <p className="text-xs text-neutral-400">(Pagamento único, acesso vitalício)</p>
                </div>

                <Button
                    className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <> <UnlockKeyhole className="mr-2 h-5 w-5 md:mr-3 md:h-6 md:w-6" /> LIBERAR ACESSO COMPLETO </>}
                </Button>

                 <div className="flex items-center gap-2 text-xs sm:text-sm text-green-400 animate-pulse">
                    <Users className="h-4 w-4 shrink-0" />
                    <p>{viewers} homens estão desbloqueando agora...</p>
                </div>
            </div>
        </div>
    </>
  );
}
