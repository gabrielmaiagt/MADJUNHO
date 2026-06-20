
"use client";

import { motion, useSpring, useTransform, useAnimation } from "framer-motion";
import { useBalance } from "@/context/balance-context";
import { useEffect, useRef } from "react";
import Link from 'next/link';
import { cn } from "@/lib/utils";


export function BalanceDisplay() {
    const { balance } = useBalance();
    const prevBalanceRef = useRef(balance);
    const controls = useAnimation();
    
    const spring = useSpring(balance, {
        mass: 0.8,
        stiffness: 75,
        damping: 15,
    });
    
    const display = useTransform(spring, (current) => 
        `R$${current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );

    useEffect(() => {
        spring.set(balance);

        if (balance > prevBalanceRef.current) {
            // Pulse animation for the container
            controls.start({
                scale: [1, 1.15, 1],
                transition: { duration: 0.5, ease: "easeInOut", times: [0, 0.5, 1] }
            });
        }
        prevBalanceRef.current = balance;

    }, [balance, spring, controls]);

    return (
        <Link href="/perfil" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
            <motion.div 
                animate={controls}
                className={cn(
                    "bg-emerald-900/80 backdrop-blur-sm font-semibold py-1 px-3 rounded-full flex items-center gap-1.5 shadow-md text-sm sm:text-base border border-emerald-500/30 cursor-pointer",
                    "transition-transform"
                )}
            >
                <div className="flex items-baseline gap-1">
                    <span className="text-white/80">Saldo:</span>
                    <motion.p className="text-green-400 [text-shadow:0_0_15px_rgba(34,197,94,0.5)]">{display}</motion.p>
                </div>
            </motion.div>
        </Link>
    );
}
