
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Heart, X, Gift, Send, Play, Loader2, CheckCircle, Flame, MessageSquare, UnlockKeyhole } from 'lucide-react';
import { liveSessions, liveUsers, liveCommentsPool, giftMessagesPool } from '@/lib/live-data';
import type { LiveSession, LiveUser, LiveComment, TransactionData, CheckoutInfo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { PixDialog } from '@/components/pix-dialog';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import { useProfile } from '@/context/profile-context';
import { useAnalytics } from '@/context/analytics-context';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBalance } from '@/context/balance-context';
import { RewardPopup } from '@/components/reward-popup';
import { DuplicateEarningsDialog } from '@/components/duplicate-earnings-dialog';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { createTransaction } from '@/ai/flows/create-transaction';
import { useToast } from '@/hooks/use-toast';

type PopupType = 'duplicateEarnings' | 'giftIncentive';
type Reward = {
    id: number;
    amount: number;
};

const parseViewerCount = (count: string): number => {
    if (count.toLowerCase().includes('k')) {
        return parseFloat(count.replace('k', '').replace(',', '.')) * 1000;
    }
    return parseInt(count, 10);
};

export default function LivePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const videoId = params.videoId as string;
    
    const liveSession = liveSessions.find(s => s.id === videoId) || null;

    useEffect(() => {
        if (liveSession && !liveSession.videoUrl) {
            router.replace('/lives');
        }
    }, [liveSession, router]);

    const { profile, hasEarningsDoubled, hasTiktokAccess, unlockChat } = useProfile();
    const { trackEvent, trackDetailedEvent, trackError } = useAnalytics();
    const { addBalance } = useBalance();
    
    const [likes, setLikes] = useState(0);
    const [viewers, setViewers] = useState(0);
    const [comments, setComments] = useState<LiveComment[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showPixDialog, setShowPixDialog] = useState(false);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [sentGifts, setSentGifts] = useState<LiveComment[]>([]);
    const [isLiveFinished, setIsLiveFinished] = useState(false);
    const [showEndLiveDialog, setShowEndLiveDialog] = useState(false);
    const [showEndLiveLoading, setShowEndLiveLoading] = useState(false);
    const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [isLoadingOffer, setIsLoadingOffer] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    
    const [popupQueue, setPopupQueue] = useState<PopupType[]>([]);
    const [currentPopup, setCurrentPopup] = useState<PopupType | null>(null);
    const [currentGiftInfo, setCurrentGiftInfo] = useState<{amount: number, message: string} | null>(null);
    const [showChatUnlockInfo, setShowChatUnlockInfo] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const commentsContainerRef = useRef<HTMLDivElement | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
    const rewardAudioRef = useRef<HTMLAudioElement | null>(null);
    const isPlayingRef = useRef(true);

    const finishedStorageKey = `liveFinished_${videoId}`;
    const sentGiftStorageKey = `sentGift_${videoId}`;

    const formatCount = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.', ',') + 'k';
        }
        return num.toString();
    };
    
    const triggerReward = useCallback((amount: number) => {
        const finalAmount = addBalance(amount, true);
        const newReward: Reward = { id: Date.now(), amount: finalAmount };
        setRewards(prev => [...prev, newReward]);
        rewardAudioRef.current?.play().catch(e => {});

        const removalTimeout = setTimeout(() => {
            setRewards(prev => prev.filter(r => r.id !== newReward.id));
        }, 4000); 
        timeoutsRef.current.push(removalTimeout);
    }, [addBalance]);

    const addToPopupQueue = (popup: PopupType) => {
        setPopupQueue(prev => [...prev, popup]);
    };

    const processNextPopup = useCallback(() => {
        if (showPixDialog || showUpgradeDialog || currentPopup || isCheckoutOpen) {
            const retryTimeout = setTimeout(processNextPopup, 5000);
            timeoutsRef.current.push(retryTimeout);
            return;
        }

        if (popupQueue.length > 0) {
            const nextPopup = popupQueue[0];
            setCurrentPopup(nextPopup);
            setPopupQueue(prev => prev.slice(1));
        } else {
            setCurrentPopup(null);
        }
    }, [popupQueue, showPixDialog, showUpgradeDialog, currentPopup, isCheckoutOpen]);
    
    const handleVideoEnd = useCallback(() => {
        setIsLiveFinished(true);
        setShowEndLiveLoading(true);
        isPlayingRef.current = false;
        
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        setShowPixDialog(false);
        setShowUpgradeDialog(false);
        setIsCheckoutOpen(false);
        setCurrentPopup(null);

        try {
            localStorage.setItem(finishedStorageKey, 'true');
        } catch (error) {
            console.error('Failed to set live finished status in localStorage', error);
        }
        
        trackDetailedEvent('live_ended', { liveId: videoId });

        const dialogTimeout = setTimeout(() => {
            setShowEndLiveLoading(false);
            setShowEndLiveDialog(true);
        }, 5000);
        timeoutsRef.current.push(dialogTimeout);

    }, [finishedStorageKey, trackDetailedEvent, videoId]);

    useEffect(() => {
        if (!liveSession || !liveSession.videoUrl) return;

        try {
            if (localStorage.getItem(finishedStorageKey) === 'true') {
                handleVideoEnd();
                const savedLikes = localStorage.getItem(`liveLikes_${videoId}`);
                if (savedLikes) {
                    setLikes(parseInt(savedLikes, 10));
                }
                return;
            }
        } catch (error) {
            console.error('Failed to read live finished status from localStorage', error);
        }

        if (liveSession) {
            const savedLikes = localStorage.getItem(`liveLikes_${videoId}`);
            const initialLikes = savedLikes ? parseInt(savedLikes, 10) : (Math.floor(Math.random() * 3000) + 1500);
            setLikes(initialLikes);

            setViewers(parseViewerCount(liveSession.initialViewers));

            if (typeof window !== 'undefined') {
                rewardAudioRef.current = new Audio('/cash-sound.mp3');
                rewardAudioRef.current.preload = 'auto';
            }

            if (!hasEarningsDoubled) {
                const duplicateEarningsTimeout = setTimeout(() => {
                    addToPopupQueue('duplicateEarnings');
                }, 60000);
                timeoutsRef.current.push(duplicateEarningsTimeout);
            }
            
            const hasSentGift = localStorage.getItem(sentGiftStorageKey) === 'true';
            if (!hasSentGift) {
                const giftIncentiveTimeout = setTimeout(() => {
                    addToPopupQueue('giftIncentive');
                }, 120000);
                timeoutsRef.current.push(giftIncentiveTimeout);
            }

        } else {
            router.replace('/lives');
        }

        return () => {
            timeoutsRef.current.forEach(clearTimeout);
        };
    }, [videoId, router, hasEarningsDoubled, liveSession, finishedStorageKey, sentGiftStorageKey, handleVideoEnd]);
    
    const handleVideoContainerClick = () => {
        if (isLiveFinished) return;
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                video.play().catch(err => {
                    console.error("Play failed on click:", err);
                    setIsPlaying(false);
                });
            } else {
                video.pause();
            }
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !liveSession || !liveSession.videoUrl) return;

        const handlePlay = () => {
            setIsPlaying(true);
            isPlayingRef.current = true;
        };
        const handlePause = () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
        };
        
        const onMetadataLoaded = () => {
            const savedTime = localStorage.getItem(`liveProgress_${videoId}`);
            if (savedTime) {
                video.currentTime = parseFloat(savedTime);
            }
             if (!isLiveFinished) {
                video.play().catch(e => handlePause());
            }
        };
        
        video.addEventListener('loadedmetadata', onMetadataLoaded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        
        const saveProgress = () => {
            if (video.currentTime > 0 && !video.paused) {
                localStorage.setItem(`liveProgress_${videoId}`, String(video.currentTime));
            }
        };
        const progressInterval = setInterval(saveProgress, 3000);
        timeoutsRef.current.push(progressInterval);

        return () => {
            video.removeEventListener('loadedmetadata', onMetadataLoaded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            clearInterval(progressInterval);
            if (video.currentTime > 0) {
                localStorage.setItem(`liveProgress_${videoId}`, String(video.currentTime));
            }
        };
    }, [liveSession, videoId, isLiveFinished]);


    useEffect(() => {
        if (likes > 0) {
            localStorage.setItem(`liveLikes_${videoId}`, String(likes));
        }
    }, [likes, videoId]);


    useEffect(() => {
        if (!liveSession || !liveSession.videoUrl || !isPlaying || isLiveFinished) return;

        const scheduleComment = () => {
            if (!isPlayingRef.current || isLiveFinished) return;
            const delay = Math.random() * 4000 + 1000;
            const timeoutId = setTimeout(() => {
                setComments(prev => [...prev, {
                    id: `comment-${Date.now()}-${Math.random()}`,
                    user: liveUsers[Math.floor(Math.random() * liveUsers.length)],
                    text: liveCommentsPool[Math.floor(Math.random() * liveCommentsPool.length)],
                }].slice(-50));
                scheduleComment();
            }, delay);
            timeoutsRef.current.push(timeoutId);
        };

        const firstCommentTimeout = setTimeout(() => {
            if (isPlayingRef.current && !isLiveFinished) {
                setComments(prev => [...prev, {
                    id: `comment-${Date.now()}-${Math.random()}`,
                    user: liveUsers[Math.floor(Math.random() * liveUsers.length)],
                    text: liveCommentsPool[Math.floor(Math.random() * liveCommentsPool.length)],
                }].slice(-50));
                scheduleComment();
            }
        }, 1000);
        timeoutsRef.current.push(firstCommentTimeout);
        
        const scheduleFakeGift = () => {
            if (!isPlayingRef.current || isLiveFinished) return;
            
            const delay = Math.random() * 10000 + 30000; 

            const timeoutId = setTimeout(() => {
                const newGift: LiveComment = {
                    id: `fake-gift-${Date.now()}`,
                    user: liveUsers[Math.floor(Math.random() * liveUsers.length)],
                    isGift: true,
                    giftAmount: [10, 25, 50, 100][Math.floor(Math.random() * 4)],
                    giftMessage: giftMessagesPool[Math.floor(Math.random() * giftMessagesPool.length)]
                };
                
                setSentGifts(prev => [...prev, newGift]);
                const giftDisplayTimeout = setTimeout(() => {
                    setSentGifts(prev => prev.filter(g => g.id !== newGift.id));
                }, 30000);
                timeoutsRef.current.push(giftDisplayTimeout);

                scheduleFakeGift();
            }, delay);
            timeoutsRef.current.push(timeoutId);
        };
        
        const firstGiftTimeout = setTimeout(() => {
            if (isPlayingRef.current && !isLiveFinished) {
                 const newGift: LiveComment = {
                    id: `fake-gift-${Date.now()}`,
                    user: liveUsers[Math.floor(Math.random() * liveUsers.length)],
                    isGift: true,
                    giftAmount: [10, 25, 50, 100][Math.floor(Math.random() * 4)],
                    giftMessage: giftMessagesPool[Math.floor(Math.random() * giftMessagesPool.length)]
                };
                
                setSentGifts(prev => [...prev, newGift]);
                const giftDisplayTimeout = setTimeout(() => {
                    setSentGifts(prev => prev.filter(g => g.id !== newGift.id));
                }, 30000);
                timeoutsRef.current.push(giftDisplayTimeout);
                
                scheduleFakeGift();
            }
        }, 8000);
        timeoutsRef.current.push(firstGiftTimeout);
        
        const scheduleReward = () => {
            if (!isPlayingRef.current || isLiveFinished) return;
            const delay = 15000;
            const timeoutId = setTimeout(() => {
                triggerReward(1 + Math.random() * 0.5);
                scheduleReward();
            }, delay);
            timeoutsRef.current.push(timeoutId);
        };

        const firstRewardTimeout = setTimeout(() => {
            if (!isPlayingRef.current || isLiveFinished) return;
            triggerReward(1 + Math.random() * 0.5);

            const infoMessageTimeout = setTimeout(() => {
                if (!isPlayingRef.current || isLiveFinished) return;
                setShowChatUnlockInfo(true);

                const hideInfoTimeout = setTimeout(() => {
                    setShowChatUnlockInfo(false);
                    const restartRewardTimeout = setTimeout(() => {
                         if (!isPlayingRef.current || isLiveFinished) return;
                        triggerReward(1 + Math.random() * 0.5);
                        scheduleReward();
                    }, 3000);
                    timeoutsRef.current.push(restartRewardTimeout);
                }, 15000);
                timeoutsRef.current.push(hideInfoTimeout);
            }, 4000);
            timeoutsRef.current.push(infoMessageTimeout);

        }, 3000);
        timeoutsRef.current.push(firstRewardTimeout);

    }, [liveSession, isPlaying, isLiveFinished, triggerReward]);

    useEffect(() => {
        if (!isPlaying || isLiveFinished) return;
        const intervalId = setInterval(() => {
            setViewers(v => Math.max(200, v + Math.floor(Math.random() * 21) - 10));
        }, 5000);
        timeoutsRef.current.push(intervalId);

        return () => clearInterval(intervalId);
    }, [isPlaying, isLiveFinished]);

    useEffect(() => {
        if (!isPlaying || isLiveFinished) return;

        const scheduleLikes = () => {
            const firstLikeTimeout = setTimeout(() => {
                if (isPlayingRef.current && !isLiveFinished) {
                    const subsequentLikesInterval = setInterval(() => {
                        if (isPlayingRef.current && !isLiveFinished) {
                            setLikes(l => l + 100);
                        } else {
                            clearInterval(subsequentLikesInterval);
                        }
                    }, 20000);
                    timeoutsRef.current.push(subsequentLikesInterval);
                }
            }, 10000);
            timeoutsRef.current.push(firstLikeTimeout);
        };

        scheduleLikes();

    }, [isPlaying, isLiveFinished]);

    useEffect(() => {
        const container = commentsContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [comments]);
    
    const handleGiftComplete = (amount: number, message: string) => {
        if (!profile) return;
        
        localStorage.setItem(sentGiftStorageKey, 'true');

        const newGift: LiveComment = {
            id: `gift-${Date.now()}`,
            user: { name: profile.name || 'Você', avatarUrl: profile.avatarUrl || '' },
            isGift: true,
            giftAmount: amount,
            giftMessage: message || `Enviou R$${amount.toFixed(2)}!`
        };
        setSentGifts(prev => [...prev, newGift]);
        
        setTimeout(() => {
            setSentGifts(prev => prev.filter(g => g.id !== newGift.id));
        }, 20000);
    };
    
    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        if (hasTiktokAccess) {
            if (!profile) return; 
            const newComment: LiveComment = {
                id: `my-comment-${Date.now()}`,
                user: { name: profile.name || 'Você', avatarUrl: profile.avatarUrl || '' },
                text: inputMessage,
            };
            setComments(prev => [...prev, newComment]);
            setInputMessage('');
        } else {
            trackEvent('attempt_send_group_message');
            setShowUpgradeDialog(true);
        }
    };
    
    const handleOpenCheckout = (info: CheckoutInfo, newTransaction: TransactionData) => {
        setCurrentPopup(null);
        setShowUpgradeDialog(false);
        
        const isGift = info.source.startsWith('live_gift');
        if (isGift) {
            setShowPixDialog(false); 
        }

        setCheckoutInfo(info);
        setTransaction(newTransaction);
        setIsCheckoutOpen(true);
    };

    const handleEndLiveChat = async () => {
        if (!liveSession?.chatId) return;
        
        setIsLoadingOffer(true);
        const offer = {
            amount: 9.90,
            source: `end_of_live:${liveSession.id}:${liveSession.chatId}`,
            productName: `Chat Privado com ${liveSession.user.name}`
        };
        trackDetailedEvent('click_end_live_chat_button', { liveId: liveSession.id, chatId: liveSession.chatId, price: offer.amount });

        try {
            const params = new URLSearchParams(window.location.search);
            const utm_params_str = localStorage.getItem('utm_params');
            const utm_params = utm_params_str ? JSON.parse(utm_params_str) : {};
            const utmify_visitor_id = localStorage.getItem('utmify_visitor_id');
            const tracking = {
                utm_source: params.get('utm_source') || utm_params.utm_source,
                utm_medium: params.get('utm_medium') || utm_params.utm_medium,
                utm_campaign: params.get('utm_campaign') || utm_params.utm_campaign,
                utm_content: params.get('utm_content') || utm_params.utm_content,
                utm_term: params.get('utm_term') || utm_params.utm_term,
                utm_id: params.get('utm_id') || utm_params.utm_id,
                ref: params.get('xcod') || params.get('ref') || utm_params.xcod || utm_params.ref,
                src: params.get('src') || utm_params.src,
                sck: params.get('sck') || utm_params.sck,
                utmify_visitor_id: utmify_visitor_id,
            };

            const newTransaction = await createTransaction({ amount: offer.amount, productName: offer.productName, source: offer.source, tracking });
            if (newTransaction && newTransaction.id) {
                trackDetailedEvent('generate_pix', { amount: offer.amount, productName: offer.productName, source: offer.source });
                setTransaction(newTransaction);
                setCheckoutInfo(offer);
                setShowEndLiveDialog(false);
                setIsCheckoutOpen(true);
            } else {
                throw new Error('Falha ao gerar o PIX.');
            }
        } catch(error: any) {
            trackError(error);
            toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: error.message || 'Ocorreu um erro.' });
        } finally {
            setIsLoadingOffer(false);
        }
    }

    const handleLikeClick = () => {
        trackEvent('like_live');
        
        const newHeartId = Date.now();
        setFloatingHearts(prev => [...prev, newHeartId]);
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(id => id !== newHeartId));
        }, 2000);
    };
    
    useEffect(() => {
        if (!currentPopup && popupQueue.length > 0) {
            processNextPopup();
        }
    }, [currentPopup, popupQueue, processNextPopup]);


    const handleIncentiveClick = () => {
        handleCloseCurrentPopup();
        setShowPixDialog(true);
    }
    
    const handleCloseCurrentPopup = () => {
        if (currentPopup === 'giftIncentive') {
            setShowPixDialog(false);
        }
        setCurrentPopup(null);
    };

    const handleDialogClose = (isOpen: boolean) => {
        if (!isOpen) {
            router.back();
        }
        setShowEndLiveDialog(isOpen);
    };
    
    if (!liveSession || !liveSession.videoUrl) {
        return (
            <div className="flex h-dvh items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <>
            <div className="h-dvh w-screen bg-black text-white flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 z-0" onClick={handleVideoContainerClick}>
                    <video 
                        ref={videoRef} 
                        src={liveSession.videoUrl}
                        onEnded={handleVideoEnd}
                        onCanPlay={() => setIsVideoLoaded(true)}
                        playsInline 
                        autoPlay
                        preload="auto"
                        className={cn(
                            "w-full h-full object-cover transition-opacity duration-500",
                            isVideoLoaded ? "opacity-100" : "opacity-0"
                        )}
                    />
                     {!isPlaying && !isLiveFinished && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                            <Play className="h-20 w-20 text-white/70" fill="currentColor" />
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showEndLiveLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4 text-center p-8"
                        >
                            <Avatar className="h-24 w-24 border-4 border-primary mb-4">
                                <AvatarImage src={liveSession.user.avatarUrl} alt={liveSession.user.name} />
                                <AvatarFallback>{liveSession.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="relative">
                                <Flame className="h-16 w-16 text-primary/50" />
                            </div>
                            <p className="text-xl font-semibold mt-2">A live terminou, mas a nossa conversa só está começando…</p>
                            <Loader2 className="h-8 w-8 text-white animate-spin mt-4" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={cn("absolute inset-0 z-10 flex flex-col", (isLiveFinished || showEndLiveLoading) && "pointer-events-none")}>
                    <header className="p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm p-2 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={liveSession.user.avatarUrl} alt={liveSession.user.name} />
                                        <AvatarFallback>{liveSession.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{liveSession.user.name}</p>
                                        <p className="text-xs text-white flex items-center gap-1">
                                            <Heart className="h-3 w-3 fill-white text-white" /> {formatCount(likes)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm font-semibold">{formatCount(viewers)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <BalanceDisplay />
                                <Button size="icon" variant="ghost" className="bg-black/50 backdrop-blur-sm rounded-full h-10 w-10" onClick={() => router.back()}>
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    </header>

                    <div className="absolute top-32 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2 px-4">
                       <AnimatePresence>
                           {rewards.map(reward => (
                                <RewardPopup key={reward.id} amount={reward.amount} />
                            ))}
                        </AnimatePresence>
                        <AnimatePresence>
                            {showChatUnlockInfo && (
                                <motion.div
                                    initial={{ opacity: 0, x: -100, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 100, scale: 0.8, transition: { duration: 0.4, ease: "easeIn" } }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="bg-gradient-to-r from-purple-600/50 to-primary/50 backdrop-blur-xl text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-4 shadow-2xl shadow-primary/30 border-2 border-white/20 max-w-md"
                                >
                                    <UnlockKeyhole className="h-6 w-6 text-white shrink-0" />
                                    <span className="text-base text-left flex-1">Não saia da live. Ao final, o chat privado com {liveSession.user.name} será liberado.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="absolute bottom-20 right-4 h-96 w-20 z-20 pointer-events-none">
                        <AnimatePresence>
                            {floatingHearts.map(id => (
                                <motion.div
                                    key={id}
                                    initial={{ y: 0, opacity: 1, x: Math.random() * 40 - 20 }}
                                    animate={{ y: -400, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    className="absolute bottom-0"
                                >
                                    <Heart 
                                        className="h-8 w-8 text-red-500 fill-red-500"
                                        style={{
                                            filter: `hue-rotate(${Math.random() * 20 - 10}deg)`,
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end p-4 pb-0 overflow-hidden">
                         <div className="w-full flex flex-col items-start max-w-sm max-h-[30vh]">
                            <div className="flex flex-col-reverse gap-2 overflow-hidden">
                                <AnimatePresence>
                                    {sentGifts.map((gift) => (
                                        <motion.div
                                            key={gift.id}
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 50, transition: { duration: 0.5 } }}
                                            layout
                                            className="bg-amber-900/80 border-amber-500/50 rounded-lg p-2 flex items-center gap-3 border pointer-events-auto backdrop-blur-sm shadow-[0_0_15px_rgba(251,191,36,0.3)] max-w-sm"
                                        >
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={gift.user.avatarUrl} alt={gift.user.name} />
                                                <AvatarFallback>{gift.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-amber-300">{gift.user.name}</p>
                                                <p className="text-amber-100 text-sm whitespace-pre-wrap break-words">{gift.giftMessage}</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center shrink-0 pr-2 pl-1 text-center">
                                                <Gift className="h-6 w-6 text-amber-300" />
                                                <p className="text-base font-bold text-amber-300">R${gift.giftAmount?.toFixed(2).replace('.',',')}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div
                            ref={commentsContainerRef}
                            className="w-full overflow-y-auto no-scrollbar mask-gradient-to-top pointer-events-none mt-2 max-w-sm max-h-[25vh]"
                        >
                            <div className="flex flex-col gap-3">
                                {comments.slice(-3).map((comment) => (
                                    <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <Avatar className="h-6 w-6 mt-0.5">
                                                <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                                                <AvatarFallback className="text-xs">{comment.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="bg-black/40 backdrop-blur-sm p-2 rounded-lg min-w-0">
                                                <p className="text-xs font-semibold text-neutral-400">{comment.user.name}</p>
                                                <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 pt-2 pointer-events-auto">
                        <div className="flex items-center gap-3 mt-3">
                            <div className="relative flex-1">
                                <Input 
                                    className="bg-black/50 backdrop-blur-sm rounded-full border-neutral-600 h-12 pl-4 pr-12 text-base" 
                                    placeholder="Adicionar comentário..." 
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim()}
                                >
                                    <Send className={cn("h-5 w-5 text-neutral-400", inputMessage.trim() && "text-white")} />
                                </Button>
                            </div>
                            <Button size="icon" className="bg-black/50 backdrop-blur-sm rounded-full h-12 w-12 border border-neutral-600" onClick={handleLikeClick}>
                                <Heart className="h-6 w-6 text-white" />
                            </Button>
                            <Button size="icon" className="bg-black/50 backdrop-blur-sm rounded-full h-12 w-12 border border-neutral-600" onClick={() => setShowPixDialog(true)}>
                                <Gift className="h-6 w-6 text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
             <Dialog open={showEndLiveDialog} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-md bg-card text-card-foreground">
                    <DialogHeader className="text-center items-center space-y-3">
                        <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarImage src={liveSession.user.avatarUrl} alt={liveSession.user.name} />
                            <AvatarFallback>{liveSession.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <DialogTitle className="text-2xl font-bold">
                            Deseja Conversar com {liveSession.user.name}?
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            Desbloqueie o chat privado para receber PIX, convites exclusivos e ter conversas quentes!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
                        <Button 
                            className="w-full h-12 text-lg"
                            onClick={handleEndLiveChat}
                            disabled={isLoadingOffer}
                        >
                            {isLoadingOffer ? <Loader2 className="animate-spin" /> : <span className="font-bold">Desbloquear Chat Privado por R$ 9,90</span>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={currentPopup === 'giftIncentive'} onOpenChange={(open) => !open && handleCloseCurrentPopup()}>
                 <DialogContent className="sm:max-w-md bg-card text-card-foreground">
                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="rounded-full bg-primary/10 p-3 w-fit">
                            <Gift className="h-10 w-10 text-primary" />
                        </div>
                        <DialogTitle as="h2" className="text-3xl font-bold pt-2">Gostando da Live?</DialogTitle>
                        <DialogDescription className="text-base text-center">
                            Envie um presente para {liveSession.user.name} e sua mensagem aparecerá em destaque na live!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='pt-4'>
                        <Button 
                            className="w-full font-bold text-lg p-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={handleIncentiveClick}
                        >
                            Enviar Presente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
             <DuplicateEarningsDialog
                open={currentPopup === 'duplicateEarnings'}
                onOpenChange={(open) => !open && handleCloseCurrentPopup()}
                source="live"
            />

            <PixDialog 
                open={showPixDialog} 
                onOpenChange={setShowPixDialog} 
                onConfirm={async (offer: CheckoutInfo, transaction: TransactionData) => {
                    handleOpenCheckout(offer, transaction);
                    setCurrentGiftInfo({amount: offer.amount, message: ""});
                }}
                creatorName={liveSession.user.name}
            />
            <UpgradeDialog 
                open={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog} 
                variant="tiktok"
                onConfirm={handleOpenCheckout}
                source="live_chat"
            />
            {checkoutInfo && (
                 <CheckoutDialog
                    open={isCheckoutOpen}
                    onOpenChange={setIsCheckoutOpen}
                    totalAmount={checkoutInfo.amount}
                    source={checkoutInfo.source}
                    productName={checkoutInfo.productName}
                    transaction={transaction}
                    unlockChat={unlockChat}
                    onPaymentComplete={(amount) => {
                        if (checkoutInfo.source.startsWith('live_gift') && currentGiftInfo) {
                           handleGiftComplete(currentGiftInfo.amount, currentGiftInfo.message);
                           setCurrentGiftInfo(null);
                        }
                    }}
                />
            )}
        </>
    );
}
