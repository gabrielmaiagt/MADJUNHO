"use client";

import { useState, useEffect } from 'react';
import { MainLayout } from "@/components/main-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Eye, Lock } from "lucide-react";
import { useRouter } from 'next/navigation';
import { liveSessions } from '@/lib/live-data';
import { TiktokNav } from '@/components/tiktok-nav';
import { useAnalytics } from '@/context/analytics-context';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/profile-context';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import type { CheckoutInfo } from '@/lib/types';
import { CheckoutDialog } from '@/components/checkout-dialog';


const parseViewerCount = (count: string): number => {
    if (count.toLowerCase().includes('k')) {
        return parseFloat(count.replace('k', '').replace(',', '.')) * 1000;
    }
    return parseInt(count, 10);
};

const formatCount = (num: number): string => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.', ',') + 'k';
    }
    return num.toString();
};

export default function LivesPage() {
    const router = useRouter();
    const { hasTiktokAccess } = useProfile();
    const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
    const { trackEvent, trackDetailedEvent } = useAnalytics();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);


    const displayableLives = hasTiktokAccess 
        ? liveSessions.filter(live => live.videoUrl) 
        : liveSessions;

    useEffect(() => {
        trackEvent('visit_lives');
        
        const firstLives = displayableLives.filter(l => l.videoUrl).slice(0, 2);
        firstLives.forEach(live => {
            const video = document.createElement('video');
            video.src = live.videoUrl;
            video.preload = 'auto';
        });
    }, [trackEvent, displayableLives]);

    useEffect(() => {
        const initialCounts = liveSessions.reduce((acc, live) => {
            acc[live.id] = parseViewerCount(live.initialViewers);
            return acc;
        }, {} as Record<string, number>);
        setViewerCounts(initialCounts);
    }, []);
    
    const handleLiveClick = (liveId: string, isLocked?: boolean, hasVideo?: boolean) => {
        if (!hasVideo && hasTiktokAccess) {
            return;
        }

        if (isLocked && !hasTiktokAccess) {
            trackEvent('click_locked_live');
            setShowUpgradeDialog(true);
        } else {
            trackDetailedEvent('visit_live_session', { liveId });
            router.push(`/comunidade-da-live/${liveId}`);
        }
    };

    const handleOpenCheckout = (info: CheckoutInfo) => {
        setCheckoutInfo({ ...info, isStoreCheckout: true });
        setShowUpgradeDialog(false);
        setIsCheckoutOpen(true);
    };

    return (
        <>
            <MainLayout activeTab="comunidade">
                <div className="flex flex-col h-full bg-black">
                    {/* Cabeçalho Fixo - Impede que o scroll suba além daqui */}
                    <div className="z-20 pt-4 px-4 pb-4 bg-gradient-to-b from-black to-black/80 border-b border-white/5">
                        <header className="flex justify-between items-center max-w-7xl mx-auto">
                            <TiktokNav activeTab="lives" className="mt-1.5"/>
                            <BalanceDisplay />
                        </header>
                    </div>
                    
                    {/* Área de Conteúdo com Scroll Próprio */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-32">
                        <div className="grid grid-cols-2 gap-4 max-w-7xl mx-auto">
                            {displayableLives.map(live => {
                                const isActuallyLocked = live.isLocked || !live.videoUrl;
                                const isWatchable = !!live.videoUrl;
                                const shouldShowLive = isWatchable || !hasTiktokAccess;

                                return (
                                <Card 
                                    key={live.id} 
                                    className="relative overflow-hidden cursor-pointer group aspect-square"
                                    onClick={() => handleLiveClick(live.id, isActuallyLocked, isWatchable)}
                                >
                                    <Image 
                                        src={live.imageUrl} 
                                        alt={live.user.name} 
                                        fill 
                                        unoptimized={live.user.name === 'Renata'}
                                        className={cn(
                                            "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        )}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    
                                    {shouldShowLive ? (
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="destructive" className="flex items-center gap-1.5 animate-pulse">
                                                <div className="h-2 w-2 bg-white rounded-full"></div>
                                                LIVE
                                            </Badge>
                                        </div>
                                    ) : (
                                         <div className="absolute top-2 left-2">
                                            <Badge variant="secondary" className="bg-black/60 text-white">
                                                Offline
                                            </Badge>
                                        </div>
                                    )}
                                    
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary" className="flex items-center gap-1 bg-black/40 text-white border-none">
                                            <Eye className="h-3 w-3" /> {formatCount(viewerCounts[live.id] || parseViewerCount(live.initialViewers))}
                                        </Badge>
                                    </div>

                                    {isActuallyLocked && !hasTiktokAccess && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                                            <Lock className="h-10 w-10 text-white" />
                                            <Badge variant="default" className="mt-2 bg-primary">Exclusivo</Badge>
                                        </div>
                                    )}

                                    <div className="absolute bottom-2 left-3">
                                        <p className="font-bold text-white text-shadow-lg">{live.user.name}</p>
                                    </div>
                                </Card>
                            )})}
                        </div>
                    </div>
                </div>
            </MainLayout>
            <UpgradeDialog 
                open={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog} 
                variant="tiktok"
                onConfirm={handleOpenCheckout}
            />
            {checkoutInfo && (
                 <CheckoutDialog
                    open={isCheckoutOpen}
                    onOpenChange={setIsCheckoutOpen}
                    isStoreCheckout={checkoutInfo.isStoreCheckout}
                    totalAmount={checkoutInfo.amount}
                    source={checkoutInfo.source}
                    productName={checkoutInfo.productName}
                />
            )}
        </>
    );
}
