
"use client";

import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';


type RewardPopupProps = {
  amount: number;
  onEnd?: () => void; // Optional callback for when animation finishes
};

export function RewardPopup({ amount, onEnd }: RewardPopupProps) {
    const { hasEarningsDoubled } = useProfile();
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onAnimationComplete={() => onEnd?.()}
      className="bg-green-500/20 backdrop-blur-md text-white font-bold py-1.5 pl-2 pr-4 rounded-full flex items-center gap-2 shadow-lg border-2 border-green-400"
    >
       <div className="relative flex items-center justify-center bg-green-900/50 rounded-full h-8 w-8">
            <DollarSign className="h-5 w-5 text-green-300" />
        </div>
      <span className="text-base">+ R${amount.toFixed(2).replace('.', ',')}</span>
    </motion.div>
  );
}
