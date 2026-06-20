
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useProfile } from './profile-context';

type BalanceContextType = {
    balance: number;
    addBalance: (amount: number, canBeDoubled?: boolean) => number; // Returns the amount actually added
};

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
    const { hasEarningsDoubled } = useProfile();
    const [balance, setBalance] = useState<number>(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedBalance = localStorage.getItem('userBalance');

            if (storedBalance) {
                setBalance(parseFloat(storedBalance));
            } else {
                const initialBalance = 700;
                setBalance(initialBalance);
                localStorage.setItem('userBalance', String(initialBalance));
            }
        } catch (error) {
            console.error("Failed to read from localStorage", error);
        }
        setIsLoaded(true);
    }, []);

    const addBalance = useCallback((amount: number, canBeDoubled: boolean = false): number => {
        const amountToAdd = (canBeDoubled && hasEarningsDoubled) ? amount * 2 : amount;
        setBalance(prevBalance => {
            const newBalance = prevBalance + amountToAdd;
            try {
                localStorage.setItem('userBalance', String(newBalance));
            } catch (error) {
                console.error("Failed to write to localStorage", error);
            }
            return newBalance;
        });
        return amountToAdd;
    }, [hasEarningsDoubled]);
    
    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <BalanceContext.Provider value={{ balance, addBalance }}>
            {children}
        </BalanceContext.Provider>
    );
};

export const useBalance = () => {
    const context = useContext(BalanceContext);
    if (context === undefined) {
        throw new Error('useBalance must be used within a BalanceProvider');
    }
    return context;
};
