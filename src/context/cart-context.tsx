
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useAnalytics } from './analytics-context';

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartTotalOriginal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { trackDetailedEvent } = useAnalytics();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedCart = localStorage.getItem('shoppingCart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        } catch (error) {
            console.error("Failed to read cart from localStorage", error);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
            } catch (error) {
                console.error("Failed to write cart to localStorage", error);
            }
        }
    }, [cartItems, isLoaded]);

    const addToCart = (product: Product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                // If item already exists, do nothing.
                return prevItems;
            }
            trackDetailedEvent('add_to_cart', { productId: product.id, productName: product.name, price: product.price });
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };
    
    const clearCart = () => {
        setCartItems([]);
    };

    const getOriginalPrice = (price: number, discount: number | null) => {
        if (!discount) return price;
        return price / (1 - discount / 100);
    }

    const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const cartTotalOriginal = cartItems.reduce((total, item) => {
        const originalPrice = getOriginalPrice(item.price, item.discount);
        return total + (originalPrice || item.price) * item.quantity;
    }, 0);


    if (!isLoaded) {
        return null;
    }

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, cartTotal, cartTotalOriginal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

