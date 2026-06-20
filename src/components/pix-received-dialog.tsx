
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarSign, Heart } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

type PixReceivedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
};

function AnimatedValue({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.5, stiffness: 100, damping: 15 });
  const display = useTransform(spring, (current) => 
    `R$ ${current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.p className="text-5xl font-bold text-green-400 [text-shadow:0_0_15px_rgba(34,197,94,0.5)]">{display}</motion.p>;
}

export function PixReceivedDialog({ open, onOpenChange, amount }: PixReceivedDialogProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://madames.online/wp-content/uploads/2025/12/dinheiro.mp3');
        audioRef.current.preload = 'auto';
      }

      if (open) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    
    // Cleanup function to pause audio when component unmounts or dialog closes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] sm:max-w-sm bg-black/50 text-white border-green-500/30 backdrop-blur-xl p-8 shadow-2xl shadow-green-500/20 rounded-3xl"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <DialogTitle className="sr-only">PIX Recebido</DialogTitle>
        <div className="flex flex-col items-center text-center space-y-6">
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <div className="relative">
              <div className="bg-green-500/20 p-5 rounded-full animate-pulse shadow-[0_0_30px_5px] shadow-green-500/30">
                  <DollarSign className="h-12 w-12 text-green-300" />
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold">PIX Recebido</h2>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-6 py-2">
                <AnimatedValue value={amount} />
            </div>
          </motion.div>

          <motion.div 
            className="space-y-3 pt-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
             <p className="text-base text-gray-300">
                As madames <span className="font-bold text-green-400">AMAM</span> receber curtidas... e pagam por isso!
            </p>
            <p className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Heart className="h-4 w-4 text-green-500" fill="currentColor"/>
                Continue curtindo para turbinar seu saldo.
            </p>
          </motion.div>

          <motion.div
            className="w-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
                className="w-full font-bold text-lg p-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                onClick={() => onOpenChange(false)}
            >
                CONTINUAR CURTINDO
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
