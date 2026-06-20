
"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Clapperboard, Loader2, Lock, ArrowUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TiktokNav } from './tiktok-nav';
import type { VideoPost, CheckoutInfo, TransactionData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { VideoPlayer } from './video-player';
import { TiktokPaywall } from './tiktok-paywall';
import { useProfile } from '@/context/profile-context';
import { useBalance } from '@/context/balance-context';
import { RewardPopup } from './reward-popup';
import { AnimatePresence } from 'framer-motion';
import { PixReceivedDialog } from './pix-received-dialog';
import { BalanceDisplay } from './BalanceDisplay';
import { allVideos } from '@/lib/videos';
import { Button } from './ui/button';
import { DuplicateEarningsDialog } from './duplicate-earnings-dialog';

const WATCHED_VIDEOS_KEY = 'tinderace_watched_videos';
const LIKED_VIDEOS_KEY_SESSION = 'liked_videos_session';
const LAST_WATCHED_INDEX_KEY = 'madames_last_watched_index';

function getWatchedVideos(): Set<string> {
    if (typeof window === 'undefined') {
        return new Set();
    }
    const watched = localStorage.getItem(WATCHED_VIDEOS_KEY);
    return new Set(watched ? JSON.parse(watched) : []);
}

function addWatchedVideo(videoId: string) {
    const watched = getWatchedVideos();
    watched.add(videoId);
    localStorage.setItem(WATCHED_VIDEOS_KEY, JSON.stringify(Array.from(watched)));
}

function getSessionLikedVideos(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const liked = sessionStorage.getItem(LIKED_VIDEOS_KEY_SESSION);
  return new Set(liked ? JSON.parse(liked) : []);
}

function addSessionLikedVideo(videoId: string) {
  const liked = getSessionLikedVideos();
  liked.add(videoId);
  sessionStorage.setItem(LIKED_VIDEOS_KEY_SESSION, JSON.stringify(Array.from(liked)));
}


function ComunidadeFeedContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasTiktokAccess, hasEarningsDoubled, profile } = useProfile();
  const { addBalance } = useBalance();
  
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeVideo, setActiveVideo] = useState<HTMLVideoElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [rewardKey, setRewardKey] = useState(0);
  const [showPixReceived, setShowPixReceived] = useState(false);
  const [pixAmount, setPixAmount] = useState(0);
  const [showDuplicateEarningsDialog, setShowDuplicateEarningsDialog] = useState(false);
  
  const rewardAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const videoId = searchParams.get('videoId');
    
    const posts = hasTiktokAccess ? allVideos : allVideos.slice(0, 5);

    let allAvailableVideos = [...posts];

    if (videoId) {
      const selectedVideo = allAvailableVideos.find(p => p.id === videoId);
      if (selectedVideo) {
        allAvailableVideos = [selectedVideo, ...allAvailableVideos.filter(p => p.id !== videoId)];
      }
    }
    
    setVideoPosts(allAvailableVideos);
    setIsLoading(false);
    
    if (typeof window !== 'undefined') {
        rewardAudioRef.current = new Audio('/cash-sound.mp3');
        rewardAudioRef.current.preload = 'auto';
    }
  }, [searchParams, hasTiktokAccess]);

  const triggerReward = (amount: number) => {
    setLastReward(amount);
    setRewardKey(prev => prev + 1);
    rewardAudioRef.current?.play().catch(e => console.log("Audio play failed", e));
  };
  
  const handleLike = (videoId: string, isLastVideo: boolean) => {
    const watchedVideos = getWatchedVideos();
    if (!watchedVideos.has(videoId)) {
        const baseAmount = 8 + Math.random() * 7;
        const finalAmount = addBalance(baseAmount, true);
        setPixAmount(finalAmount);
        setShowPixReceived(true);
        addWatchedVideo(videoId);
        addSessionLikedVideo(videoId);
    }

    if (containerRef.current) {
        containerRef.current.scrollBy({
            top: containerRef.current.clientHeight,
            behavior: 'smooth'
        });
    }
  };

  const handlePixDialogClose = () => {
    setShowPixReceived(false);

    if (!hasEarningsDoubled && getSessionLikedVideos().size === 3) {
        setShowDuplicateEarningsDialog(true);
    }
  };


  useEffect(() => {
    const container = containerRef.current;
    if (!container || videoPosts.length === 0 || isLoading) return;

    const options = {
      root: container,
      rootMargin: '0px',
      threshold: 0.75,
    };
    
    const paywallOptions = {
        root: container,
        rootMargin: '0px',
        threshold: 0.5,
    };

    const handleVideoPlayback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;

        const index = parseInt(entry.target.getAttribute('data-index') || '0');
        
        if (entry.isIntersecting) {
          video.play().catch(error => {});
          setActiveVideo(video);
          setActiveIndex(index);
          // Salva o índice atual no localStorage
          localStorage.setItem(LAST_WATCHED_INDEX_KEY, String(index));
        } else {
          video.pause();
          video.currentTime = 0;
          if (activeVideo === video) {
            setActiveVideo(null);
          }
        }
      });
    };
    
    const handlePaywall = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasTiktokAccess) {
                setShowPaywall(true);
            }
        });
    };

    const videoObserver = new IntersectionObserver(handleVideoPlayback, options);
    const paywallObserver = new IntersectionObserver(handlePaywall, paywallOptions);
    
    const videoElements = container.querySelectorAll('[data-video-id]');
    const paywallTriggerElement = container.querySelector('#paywall-trigger');

    videoElements.forEach(el => {
        videoObserver.observe(el);
    });
    
    if (paywallTriggerElement) {
        paywallObserver.observe(paywallTriggerElement);
    }
    

    return () => {
      videoObserver.disconnect();
      paywallObserver.disconnect();
    };
  }, [videoPosts, activeVideo, hasTiktokAccess, isLoading]);
  
  // Restaura a posição do último vídeo assistido
  useEffect(() => {
    if (!isLoading && videoPosts.length > 0 && containerRef.current) {
        const videoIdFromUrl = searchParams.get('videoId');
        // Apenas restaura se não houver um videoId específico na URL (deep linking)
        if (!videoIdFromUrl) {
            const savedIndex = localStorage.getItem(LAST_WATCHED_INDEX_KEY);
            if (savedIndex) {
                const index = parseInt(savedIndex, 10);
                if (index > 0 && index < videoPosts.length) {
                    // Pequeno delay para garantir que o layout foi renderizado
                    setTimeout(() => {
                        if (containerRef.current) {
                            containerRef.current.scrollTo({
                                top: index * containerRef.current.clientHeight,
                                behavior: 'instant'
                            });
                        }
                    }, 50);
                }
            }
        }
    }
  }, [isLoading, videoPosts, searchParams]);

  useEffect(() => {
    if (activeVideo) {
      if (showPaywall) {
        activeVideo.pause();
      } else {
        activeVideo.play().catch(error => {});
      }
    }
  }, [showPaywall, activeVideo]);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  
   if (isLoading) {
    return (
       <div className="relative h-[calc(100dvh-var(--bottom-nav))] w-full bg-black flex items-center justify-center">
            <div className="absolute top-0 left-0 right-0 z-30 pt-4 px-4 bg-gradient-to-b from-black/60 to-transparent">
                <header className="flex justify-between items-center">
                    <TiktokNav activeTab="para-voce" className="mt-1.5"/>
                    <BalanceDisplay />
                </header>
            </div>
            <Loader2 className="h-10 w-10 text-primary animate-spin"/>
        </div>
    )
  }
  
   if (videoPosts.length === 0) {
    return (
       <>
        <div className="relative h-[calc(100dvh-var(--bottom-nav))] w-full bg-black flex items-center justify-center">
                 <div className="absolute top-0 left-0 right-0 z-30 pt-4 px-4 bg-gradient-to-b from-black/60 to-transparent">
                    <header className="flex justify-between items-center">
                        <TiktokNav activeTab="para-voce" className="mt-1.5"/>
                        <BalanceDisplay />
                    </header>
                </div>
                <div className="flex flex-col items-center gap-4 text-white text-center">
                    <Clapperboard className="h-12 w-12 text-muted-foreground" />
                    <p className="font-semibold text-lg">Nenhum vídeo novo para você</p>
                    <p className="text-sm text-muted-foreground">Você já assistiu a tudo. Volte mais tarde!</p>
                    {!hasTiktokAccess && (
                        <div className='mt-4'>
                            <p className='text-base font-semibold text-primary mb-2'>Quer conteúdo infinito?</p>
                            <Button
                                onClick={() => setShowPaywall(true)}
                                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold"
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                Liberar Acesso Completo
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <TiktokPaywall open={showPaywall} onOpenChange={setShowPaywall} source="feed_comunidade"/>
        </>
    )
  }

  return (
      <div className="relative h-[calc(100dvh-var(--bottom-nav))] w-full bg-black">
        <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <header className="flex justify-between items-center pointer-events-auto">
                <TiktokNav activeTab="para-voce" className="mt-1.5"/>
                <BalanceDisplay />
            </header>
        </div>

        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <AnimatePresence>
                {lastReward !== null && (
                    <RewardPopup key={rewardKey} amount={lastReward} onEnd={() => setLastReward(null)} />
                )}
            </AnimatePresence>
        </div>

        <div 
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
        >
          {videoPosts.map((post, index) => (
            <div key={post.id} data-video-id={post.id} data-index={index} className="h-full w-full snap-start flex items-center justify-center">
              <VideoPlayer 
                post={post} 
                onLike={() => handleLike(post.id, index === videoPosts.length -1)}
                onShowPaywall={() => setShowPaywall(true)}
                isNext={index === activeIndex + 1}
                isActive={index === activeIndex}
              />
            </div>
          ))}

          {hasTiktokAccess && (
            <div className="h-full w-full snap-start flex items-center justify-center bg-black p-6 text-center">
              <div className="flex flex-col items-center gap-6 text-white max-w-xs">
                <div className="bg-white/5 p-8 rounded-full border border-white/10 shadow-[0_0_30px_rgba(202,24,84,0.2)]">
                  <Clapperboard className="h-16 w-16 text-primary" />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight">Você viu tudo!</h3>
                  <p className="text-neutral-400 mt-3 text-lg leading-relaxed">
                    Por hoje é só, {profile.name || 'novinho'}. Volte mais tarde para descobrir novos conteúdos e continuar lucrando!
                  </p>
                </div>
                <Button 
                  className="mt-4 h-14 px-8 text-lg font-bold bg-white text-black hover:bg-neutral-200 transition-colors rounded-full flex items-center gap-2"
                  onClick={scrollToTop}
                >
                  <ArrowUp className="h-5 w-5" />
                  Voltar ao Topo
                </Button>
              </div>
            </div>
          )}

          {!hasTiktokAccess && <div id="paywall-trigger" className="h-[1px] w-full snap-start"></div>}
        </div>
        <TiktokPaywall open={showPaywall} onOpenChange={setShowPaywall} source="feed_comunidade"/>
        <PixReceivedDialog open={showPixReceived} onOpenChange={handlePixDialogClose} amount={pixAmount} />
        <DuplicateEarningsDialog open={showDuplicateEarningsDialog} onOpenChange={setShowDuplicateEarningsDialog} source="feed_comunidade"/>
      </div>
  );
}


export function ComunidadeFeed() {
    return (
        <Suspense fallback={<div className="bg-black h-screen flex items-center justify-center text-white">Carregando...</div>}>
            <ComunidadeFeedContent />
        </Suspense>
    )
}
