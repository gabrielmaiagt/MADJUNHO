

"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Tag, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { CartSheet } from "@/components/cart-sheet";
import { useAnalytics } from "@/context/analytics-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Product } from "@/lib/types";
import { BalanceDisplay } from "@/components/BalanceDisplay";

export const dynamic = 'force-dynamic';

// Fallback image for invalid domains
const FALLBACK_IMAGE_URL = 'https://i.postimg.cc/yd4CRpPL/image.png';

function getMediaType(url: string): 'image' | 'video' {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    const lowercasedUrl = url.toLowerCase();
    if (videoExtensions.some(ext => lowercasedUrl.endsWith(ext))) {
        return 'video';
    }
    return 'image';
}

const ProductMedia = ({ src, alt }: { src: string; alt: string }) => {
    const mediaType = getMediaType(src);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Sanitize image URL
    let imageUrl = src;
    if (imageUrl && imageUrl.includes('conexaointensa.online')) {
        imageUrl = FALLBACK_IMAGE_URL;
    }

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.5; // Play slower for preview
        }
    }, []);

    if (mediaType === 'video') {
        return (
            <video
                ref={videoRef}
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                playsInline
                autoPlay
                loop
                muted // Videos should be muted in a feed
            />
        );
    }

    return (
        <Image 
            src={imageUrl} 
            alt={alt} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
            data-ai-hint="hot product"
        />
    );
};


export default function LojaPage() {
    const { cartItems } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { trackEvent } = useAnalytics();
    const firestore = useFirestore();

    const productsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'products');
    }, [firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    useEffect(() => {
        trackEvent('visit_store');
    }, [trackEvent]);

    const getOriginalPrice = (price: number, discount: number | null) => {
        if (!discount) return null;
        return price / (1 - discount / 100);
    }
    const cartItemCount = cartItems.length;
    
    const showLoadingSkeleton = isLoadingProducts || !products;

    return (
        <>
                <div className="bg-black min-h-screen text-white">
                    <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 bg-gradient-to-b from-black/60 to-transparent">
                        <header className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-white">Loja</h1>
                             <BalanceDisplay />
                        </header>
                    </div>

                    <main className="pt-20 pb-28 px-3">
                        {showLoadingSkeleton ? (
                             <div className="grid grid-cols-2 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col">
                                        <Skeleton className="aspect-square w-full bg-muted/20" />
                                        <div className="p-3 space-y-2">
                                            <Skeleton className="h-4 w-3/4 bg-muted/20" />
                                            <Skeleton className="h-6 w-1/2 bg-muted/20" />
                                            <Skeleton className="h-4 w-full bg-muted/20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <>
                                {products && products.length === 0 ? (
                                    <div className="text-center py-20">
                                        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-semibold">Nenhum produto na loja</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">Volte em breve ou adicione produtos no painel de administrador.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {products?.map((product) => {
                                            const originalPrice = getOriginalPrice(product.price, product.discount);
                                            const firstMediaUrl = product.images?.[0] || FALLBACK_IMAGE_URL;

                                            return (
                                            <Link href={`/loja/${product.id}`} key={product.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col cursor-pointer group">
                                                <div className="aspect-square relative">
                                                    <ProductMedia src={firstMediaUrl} alt={product.name} />
                                                </div>
                                                <div className="p-3 flex flex-col flex-grow">
                                                    <p className="text-sm text-neutral-300 flex-grow min-h-[40px]">{product.name}</p>
                                                    <div className="flex items-baseline gap-2 mt-2">
                                                        <p className="text-lg font-bold text-green-500">
                                                            R$ {product.price.toFixed(2).replace('.', ',')}
                                                        </p>
                                                        {originalPrice && (
                                                            <s className="text-xs text-red-500">
                                                                R$ {originalPrice.toFixed(2).replace('.', ',')}
                                                            </s>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {product.discount && (
                                                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-none text-xs gap-1">
                                                                <Tag className="h-3 w-3 -rotate-45" /> {product.discount}% OFF
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
                                                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                        <span>{product.rating.toFixed(1)}</span>
                                                        <span className="h-3 border-l border-neutral-600"></span>
                                                        <span>{product.sold.toLocaleString('pt-BR')} vendidos</span>
                                                    </div>
                                                </div>
                                            </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                    {/* Floating Cart Button */}
                    <div className="fixed bottom-[calc(var(--bottom-nav)_+_1rem)] right-4 z-30">
                        <Button
                            size="icon"
                            className="h-16 w-16 rounded-full bg-primary shadow-lg relative"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart className="h-8 w-8 text-white" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-base font-bold text-primary border-2 border-primary">
                                    {cartItemCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
           <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
        </>
    );
}
