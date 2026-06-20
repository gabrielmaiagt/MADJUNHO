
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { UpgradeDialog } from './upgrade-dialog';
import { CommentsSheet } from './comments-sheet';
import type { VideoPost, CheckoutInfo, TransactionData } from '@/lib/types';
import { useAnalytics } from '@/context/analytics-context';
import { useProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import { Play, X, Heart, MessageSquareMore, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { CheckoutDialog } from './checkout-dialog';


const LIKED_VIDEOS_KEY = 'madames_liked_videos';

function getLikedVideos(): Set<string> {
    if (typeof window === 'undefined') {
        return new Set();
    }
    const liked = localStorage.getItem(LIKED_VIDEOS_KEY);
    return new Set(liked ? JSON.parse(liked) : []);
}

function updateLikedVideos(videoId: string, isLiked: boolean) {
    const liked = getLikedVideos();
    if (isLiked) {
        liked.add(videoId);
    } else {
        liked.delete(videoId);
    }
    localStorage.setItem(LIKED_VIDEOS_KEY, JSON.stringify(Array.from(liked)));
}


const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CommentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
    <circle cx="8" cy="11" r="1.5" fill="#111" />
    <circle cx="12" cy="11" r="1.5" fill="#111" />
    <circle cx="16" cy="11" r="1.5" fill="#111" />
  </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

type VideoPlayerProps = {
  post: VideoPost;
  onLike?: () => void;
  onShowPaywall: () => void;
  isNext?: boolean;
  isActive?: boolean;
}

export function VideoPlayer({ post, onLike, onShowPaywall, isNext, isActive }: VideoPlayerProps) {
    const { trackEvent } = useAnalytics();
    const { profile, hasTiktokAccess } = useProfile();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [commentCount, setCommentCount] = useState(post.comments?.length ?? 0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasBeenRewarded, setHasBeenRewarded] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    
    useEffect(() => {
        const likedVideos = getLikedVideos();
        setIsLiked(likedVideos.has(post.id));
        
        const rewardedVideos = new Set(JSON.parse(localStorage.getItem('tinderace_watched_videos') || '[]'));
        if (rewardedVideos.has(post.id)) {
            setHasBeenRewarded(true);
        }

    }, [post.id]);


    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();

        const newIsLiked = !isLiked;

        if (newIsLiked) {
            if (!hasTiktokAccess && hasBeenRewarded) {
                onShowPaywall();
                return;
            }

            setIsLiked(true);
            setLikeCount(prev => prev + 1);
            updateLikedVideos(post.id, true);
            trackEvent('like_video');

            if (!hasBeenRewarded) {
                onLike?.();
                setHasBeenRewarded(true);
            }
        } 
        else {
            setIsLiked(false);
            setLikeCount(prev => prev - 1);
            updateLikedVideos(post.id, false);
            trackEvent('unlike_video');
        }
    };

    const handleCommentClick = () => {
        trackEvent('open_comments');
        setIsCommentsOpen(true);
    };

    const handleCommentSubmit = () => {
        if (hasTiktokAccess) {
            setCommentCount(prev => prev + 1);
        } else {
            trackEvent('submit_comment');
            setShowUpgradeDialog(true);
        }
    };

    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFollowing(!isFollowing);
    };

    const handleDownload = () => {
         if (hasTiktokAccess) {
            setIsPlayerOpen(true);
        } else {
            trackEvent('click_download_video');
            setShowUpgradeDialog(true);
        }
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    };

    const handleOpenCheckout = (info: CheckoutInfo, transaction: TransactionData) => {
        setCheckoutInfo({ ...info, isStoreCheckout: true, transaction });
        setShowUpgradeDialog(false);
        setIsCheckoutOpen(true);
    };
    
    if (!post.user) return null;

    return (
        <>
            <div className="relative h-full w-full bg-black">
                <video
                    ref={videoRef}
                    src={post.videoUrl}
                    loop
                    playsInline
                    preload={isActive || isNext ? "auto" : "metadata"}
                    className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 pointer-events-none",
                        isVideoLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onPlay={() => setIsPaused(false)}
                    onPause={() => setIsPaused(true)}
                    onCanPlay={() => setIsVideoLoaded(true)}
                />

                {isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg
                            className="w-20 h-20 text-white/70"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                )}


                <div className="absolute inset-0 flex flex-col justify-end pl-4 pr-1.5 pb-4 text-white pointer-events-auto" onClick={togglePlay}>
                    <div className="flex justify-between items-end">
                    <div className="space-y-2 max-w-[calc(100%-80px)]">
                        <p className="font-bold text-lg">{post.user.name}</p>
                        <p className="text-sm">{post.caption}</p>
                    </div>

                    <div className="flex flex-col items-center gap-6 pointer-events-auto">
                        
                         <div className="relative flex flex-col items-center">
                             <Avatar className="h-12 w-12 border-2 border-white">
                                <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                                <AvatarFallback>{post.user.name.charAt(1)}</AvatarFallback>
                            </Avatar>
                            <button className="absolute -bottom-2.5" onClick={(e) => handleFollowClick(e)}>
                                {isFollowing ? (
                                    <CheckCircle className="h-5 w-5 bg-background text-primary rounded-full" />
                                ) : (
                                    <PlusCircle className="h-5 w-5 bg-primary text-primary-foreground rounded-full" />
                                )}
                            </button>
                        </div>


                        <button className="flex flex-col items-center gap-1" onClick={handleLike}>
                            <HeartIcon 
                                className={cn(
                                    "h-9 w-9 transition-colors duration-200",
                                    isLiked ? "text-primary" : "text-white"
                                )}
                            />
                            <span className="text-xs font-semibold">{likeCount.toLocaleString()}</span>
                        </button>
                        
                        <button className="flex flex-col items-center gap-1" onClick={(e) => { e.stopPropagation(); handleCommentClick(); }}>
                            <CommentIcon className="h-9 w-9 fill-white text-white" />
                            <span className="text-xs font-semibold">{commentCount.toLocaleString()}</span>
                        </button>

                        <button className="flex flex-col items-center gap-1" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                            <DownloadIcon className="h-9 w-9 fill-none text-white" />
                            <span className="text-xs font-semibold">Baixar</span>
                        </button>
                    </div>
                    </div>
                </div>
            </div>
            <UpgradeDialog 
                open={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog} 
                variant="tiktok" 
                onConfirm={handleOpenCheckout}
            />
             <CommentsSheet 
                open={isCommentsOpen} 
                onOpenChange={setIsCommentsOpen}
                post={{...post, comments: post.comments || []}}
                onCommentSubmit={handleCommentSubmit}
                profile={profile}
            />
            {checkoutInfo && (
                <CheckoutDialog
                    open={isCheckoutOpen}
                    onOpenChange={setIsCheckoutOpen}
                    isStoreCheckout={checkoutInfo.isStoreCheckout}
                    totalAmount={checkoutInfo.amount}
                    source={checkoutInfo.source}
                    productName={checkoutInfo.productName}
                    transaction={checkoutInfo.transaction}
                />
            )}
            
            {isPlayerOpen && (
                <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-in fade-in-20">
                    <video
                        src={post.videoUrl}
                        controls
                        autoPlay
                        className="w-full h-auto max-h-full"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPlayerOpen(false);
                        }}
                        className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
            )}
        </>
    );
}
