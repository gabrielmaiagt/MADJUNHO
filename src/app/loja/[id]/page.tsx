
"use client";

import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Star, Tag, Check, ShoppingCart } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/main-layout';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { CartSheet } from '@/components/cart-sheet';
import { CheckoutDialog } from '@/components/checkout-dialog';
import type { TransactionData, Product, CustomerInfo } from '@/lib/types';
import { useAnalytics } from '@/context/analytics-context';
import { Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { CarouselWrapper } from '@/components/loja/CarouselWrapper';

export const dynamic = 'force-dynamic';

function getMediaType(url: string): 'image' | 'video' {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    const lowercasedUrl = url.toLowerCase();
    if (videoExtensions.some(ext => lowercasedUrl.endsWith(ext))) {
        return 'video';
    }
    return 'image';
}


export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { cartItems, addToCart } = useCart();
    const { trackDetailedEvent } = useAnalytics();

    const productId = params.id as string;
    
    const productRef = useMemoFirebase(() => firestore && productId ? doc(firestore, 'products', productId) : null, [firestore, productId]);
    const { data: product, isLoading: isLoadingProduct } = useDoc<Product>(productRef);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();

    useEffect(() => {
        if (!carouselApi) {
            return;
        }

        const handleSelect = () => {
            const slides = carouselApi.slideNodes();
            slides.forEach((slide, index) => {
                const video = slide.querySelector('video');
                if (video) {
                    if (index === carouselApi.selectedScrollSnap()) {
                        video.play().catch(e => console.error("Video play failed", e));
                    } else {
                        video.pause();
                        video.currentTime = 0;
                    }
                }
            });
        };

        carouselApi.on("select", handleSelect);
        
        // Initial check for first slide
        handleSelect();

        return () => {
            carouselApi.off("select", handleSelect);
        };
    }, [carouselApi]);
    

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            toast({
                title: "Adicionado ao Carrinho!",
                description: `${product.name} foi adicionado ao seu carrinho.`,
            });
        }
    };
    
    const handleBuyNow = async () => {
        if (!product) return;
        trackDetailedEvent('click_buy_now', { price: product.price, productName: product.name });
        setIsCheckoutOpen(true);
    }

    const getOriginalPrice = (price: number, discount: number | null) => {
        if (!discount) return null;
        return price / (1 - discount / 100);
    }

    if (isLoadingProduct) {
        return (
             <MainLayout activeTab="comunidade">
                 <div className="flex h-screen items-center justify-center bg-black">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (!product) {
         return (
             <MainLayout activeTab="comunidade">
                 <div className="flex flex-col h-screen items-center justify-center bg-black text-center p-4">
                    <h1 className="text-2xl font-bold">Produto não encontrado</h1>
                    <p className="text-muted-foreground">O produto que você está procurando não existe ou foi removido.</p>
                    <Button onClick={() => router.push('/loja')} className="mt-4">
                        Voltar para a Loja
                    </Button>
                </div>
            </MainLayout>
        );
    }
    
    const originalPrice = getOriginalPrice(product.price, product.discount);
    const cartItemCount = cartItems.length;
    const isInCart = cartItems.some(item => item.id === product.id);

    return (
        <>
             <MainLayout activeTab="comunidade">
                <div className="bg-black min-h-screen text-white pb-40">
                     <header className="fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm p-3">
                        <div className="flex items-center justify-between">
                            <BackButton className="text-white" />
                             <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(true)}>
                                <div className="relative">
                                    <ShoppingCart className="h-6 w-6 text-white" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground border-2 border-background">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </div>
                            </Button>
                        </div>
                    </header>
                    
                    <main className="pt-16">
                        <CarouselWrapper setApi={setCarouselApi}>
                            <CarouselContent>
                                {product.images.map((mediaUrl, index) => {
                                    const mediaType = getMediaType(mediaUrl);
                                    return (
                                        <CarouselItem key={index}>
                                            <div className="aspect-square relative bg-black flex items-center justify-center">
                                                {mediaType === 'video' ? (
                                                    <video
                                                        src={mediaUrl}
                                                        className="w-full h-full object-contain"
                                                        playsInline
                                                        loop
                                                        controls
                                                    />
                                                ) : (
                                                    <Image src={mediaUrl} alt={`${product.name} - mídia ${index + 1}`} fill className="object-contain bg-white"/>
                                                )}
                                            </div>
                                        </CarouselItem>
                                    )
                                })}
                            </CarouselContent>
                        </CarouselWrapper>

                        <div className="p-4 space-y-4">
                            <div className="flex items-baseline gap-3">
                                <p className="text-3xl font-bold text-green-400">
                                    R$ {product.price.toFixed(2).replace('.', ',')}
                                </p>
                                {originalPrice && (
                                    <s className="text-lg text-red-500 font-medium">
                                        R$ {originalPrice.toFixed(2).replace('.', ',')}
                                    </s>
                                )}
                                {product.discount && (
                                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-none text-sm gap-1">
                                        <Tag className="h-3 w-3 -rotate-45" /> {product.discount}% OFF
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
                            
                            <div className="flex items-center gap-4 text-sm text-neutral-300">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold">{product.rating.toFixed(1)}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4 bg-neutral-600" />
                                <span>{product.sold.toLocaleString('pt-BR')} vendidos</span>
                                <Separator orientation="vertical" className="h-4 bg-neutral-600" />
                                <div className="flex items-center gap-1 text-green-400">
                                    <Check className="h-4 w-4" />
                                    <span>Em estoque</span>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-3 mt-6">
                                <h2 className="text-lg font-semibold">Descrição</h2>
                                <p className="text-neutral-300 text-base whitespace-pre-wrap">{product.description}</p>
                            </div>

                            {product.testimonials && product.testimonials.length > 0 && (
                                <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-4 mt-6">
                                    <h2 className="text-lg font-semibold">Depoimentos ({product.testimonials.length})</h2>
                                    <div className="space-y-6">
                                        {product.testimonials.map((testimonial, index) => (
                                            <div key={index} className="flex gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold text-white">{testimonial.name}</p>
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-500'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-neutral-300 mt-1">{testimonial.comment}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>

                    <footer className="fixed bottom-[var(--bottom-nav)] left-0 right-0 z-20 bg-black/90 backdrop-blur-sm p-3 border-t border-neutral-800">
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="secondary"
                                className="h-12 flex-1 text-lg font-bold"
                                onClick={handleAddToCart}
                                disabled={isInCart}
                            >
                                {isInCart ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <Check className="h-5 w-5" />
                                        <span className="text-base font-medium">Adicionado</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                      <span className="text-base">Adicionar</span>
                                      <span className="text-base">ao carrinho</span>
                                    </div>
                                )}
                            </Button>
                             <Button
                                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground flex-1 text-xl font-bold"
                                onClick={handleBuyNow}
                             >
                               Comprar Agora
                            </Button>
                        </div>
                    </footer>
                </div>
            </MainLayout>
            <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
            {product && (
                <CheckoutDialog 
                    isStoreCheckout={true}
                    open={isCheckoutOpen}
                    onOpenChange={setIsCheckoutOpen}
                    totalAmount={product.price}
                    source={`product_page:${product.id}`}
                    productName={product.name}
                />
            )}
        </>
    );
}
