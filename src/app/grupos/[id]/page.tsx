'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, Paperclip, UnlockKeyhole } from 'lucide-react';
import { groupChat } from '@/lib/data';
import type { GroupChat, GroupMessage, GroupParticipant, CheckoutInfo, TransactionData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useAnalytics } from '@/context/analytics-context';
import { useProfile } from '@/context/profile-context';
import { TypingIndicator } from '@/components/grupos/TypingIndicator';
import { useBalance } from '@/context/balance-context';
import { RewardPopup } from '@/components/reward-popup';
import { AnimatePresence } from 'framer-motion';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useToast } from '@/hooks/use-toast';

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

type Reward = {
    id: number;
    amount: number;
};

export default function GroupChatPage() {
    const router = useRouter();
    const params = useParams();
    const { trackEvent } = useAnalytics();
    const { profile, hasTiktokAccess } = useProfile();
    const { addBalance } = useBalance();
    const groupId = params.id as string;
    const { toast } = useToast();
    
    const [group, setGroup] = useState<GroupChat | null>(null);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [typingParticipant, setTypingParticipant] = useState<GroupParticipant | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isInputDisabled, setIsInputDisabled] = useState(true);
    const [showUnlockButton, setShowUnlockButton] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const unlockButtonRef = useRef<HTMLDivElement>(null); 
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [rewards, setRewards] = useState<Reward[]>([]);
    const rewardAudioRef = useRef<HTMLAudioElement | null>(null);

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    const [transaction, setTransaction] = useState<TransactionData | null>(null);


    const storageKey = `chatHistory_${groupId}`;
    const lastMessageKey = `lastMessage_${groupId}`;
    const lastMessageTimestampKey = `lastMessageTimestamp_${groupId}`;

    const triggerReward = (amount: number) => {
        const finalAmount = addBalance(amount);
        const newReward: Reward = { id: Date.now(), amount: finalAmount };
        setRewards(prev => [...prev, newReward]);
        rewardAudioRef.current?.play().catch(e => console.log("Audio play failed", e));

        setTimeout(() => {
            setRewards(prev => prev.filter(r => r.id !== newReward.id));
        }, 12000); 
    };

    const getChatHistory = () => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem(storageKey);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };
    
    const saveChatHistory = (msgs: GroupMessage[]) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(storageKey, JSON.stringify(msgs));
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.text) {
             localStorage.setItem(lastMessageKey, lastMsg.text);
             localStorage.setItem(lastMessageTimestampKey, new Date().toISOString());
        }
    };


    useEffect(() => {
        if (typeof window !== 'undefined') {
            rewardAudioRef.current = new Audio('https://madames.online/wp-content/uploads/2025/12/dinheiro.mp3');
            rewardAudioRef.current.preload = 'auto';
        }

        if (groupChat.id === groupId) {
            setGroup(groupChat);

            const history = getChatHistory();
            const conversation = groupChat.conversation;
            
            // Se for a primeira vez abrindo o chat, mostra a primeira mensagem imediatamente
            let initialMessages = history;
            let startIndex = history.length;

            if (history.length === 0 && conversation.length > 0) {
                const firstMessage = { ...conversation[0], timestamp: formatTime(new Date()) };
                initialMessages = [firstMessage];
                saveChatHistory(initialMessages);
                startIndex = 1;
            }

            if (hasTiktokAccess) {
                setMessages(initialMessages);
                setIsInputDisabled(false);
                setShowUnlockButton(false);
                return;
            }

            setMessages(initialMessages);
            
            if (startIndex >= conversation.length) {
                setIsInputDisabled(false);
                if (!hasTiktokAccess) {
                    setShowUnlockButton(true);
                }
                return;
            }

            const showNextMessage = (index: number) => {
                setTypingParticipant(null); 
                if (index < conversation.length) {
                    const nextMessage = conversation[index];
                    const sender = groupChat.participants.find(p => p.id === nextMessage.sender.id);
                    
                    // Decide o delay para a PRÓXIMA mensagem
                    const nextIsGif = conversation[index + 1]?.iframeSrc;
                    const nextDelay = nextIsGif ? 5000 : 3000;

                    // Apenas mensagens de texto possuem efeito de digitação. GIFs/Vídeos aparecem instantaneamente.
                    if (sender && sender.id !== 'user' && !nextMessage.iframeSrc) {
                        setTypingParticipant(sender);
                        animationTimeoutRef.current = setTimeout(() => {
                            setTypingParticipant(null);
                            const newMessage = { ...nextMessage, timestamp: formatTime(new Date()) };
                            setMessages(prev => {
                                const updated = [...prev, newMessage];
                                saveChatHistory(updated);
                                return updated;
                            });

                            if (newMessage.id === 'g-msg-4b') { 
                                triggerReward(30);
                            }

                            animationTimeoutRef.current = setTimeout(() => showNextMessage(index + 1), nextDelay); 
                        }, 4000); 
                    } else if (nextMessage) {
                        // Mensagens sem efeito de digitação (como o GIF da Luiza)
                        const newMessage = { ...nextMessage, timestamp: formatTime(new Date()) };
                         setMessages(prev => {
                            const updated = [...prev, newMessage];
                            saveChatHistory(updated);
                            return updated;
                        });
                        animationTimeoutRef.current = setTimeout(() => showNextMessage(index + 1), nextDelay);
                    }

                } else {
                    setIsInputDisabled(false);
                    if (!hasTiktokAccess) {
                      setShowUnlockButton(true);
                    }
                }
            };
            
            animationTimeoutRef.current = setTimeout(() => showNextMessage(startIndex), 2000);
        } else {
            router.push('/grupos');
        }

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [groupId, router, hasTiktokAccess]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, typingParticipant]);
    
    useEffect(() => {
        if (showUnlockButton && unlockButtonRef.current && !hasTiktokAccess) {
            setTimeout(() => {
                unlockButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [showUnlockButton, hasTiktokAccess]);


    const handleInputClick = () => {
        if (!isInputDisabled && !hasTiktokAccess) {
            trackEvent('attempt_send_group_message');
            setShowUpgradeDialog(true);
        }
    }

    const handleSendMessage = () => {
        if (hasTiktokAccess) {
            if (!inputValue.trim()) return;

            const newMessage: GroupMessage = {
                id: `user-msg-${Date.now()}`,
                text: inputValue.trim(),
                sender: { id: 'user', name: profile.name || 'Você' },
                timestamp: formatTime(new Date()),
            };

            setMessages(prev => {
                const updated = [...prev, newMessage];
                saveChatHistory(updated);
                return updated;
            });

            setInputValue('');
        } else {
            trackEvent('attempt_send_group_message');
            setShowUpgradeDialog(true);
        }
    };

    const handleAttachmentClick = () => {
        if (!isInputDisabled && !hasTiktokAccess) {
            trackEvent('attempt_attach_group_file');
            setShowUpgradeDialog(true);
        }
    };
    
    const handleUnlockClick = () => {
        trackEvent('click_unlock_madames_club');
        setShowUpgradeDialog(true);
    }

    const handleOpenCheckout = (info: CheckoutInfo, transaction: TransactionData) => {
        setCheckoutInfo(info);
        setTransaction(transaction);
        setShowUpgradeDialog(false);
        setIsCheckoutOpen(true);
    };

    if (!group) {
        return (
             <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                  <Logo className="w-24 h-24" />
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col h-dvh bg-background">
                <header className="flex items-center justify-between gap-4 p-3 border-b sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <BackButton href="/grupos" className="text-foreground" />
                        <Avatar className="h-10 w-10">
                            <AvatarImage 
                                src="https://i.postimg.cc/sgpX9d1B/rosto-sorridente-com-chifres-tamanho-grande-de-sorriso-emoji-amarelo-599062-10048.avif" 
                                alt={group.name} 
                                className="object-cover" 
                            />
                            <AvatarFallback>
                                <Users className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold text-lg">{group.name}</h2>
                            <p className="text-xs text-muted-foreground">218 membros</p>
                        </div>
                    </div>
                    <BalanceDisplay />
                </header>
                 <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                    <AnimatePresence>
                        {rewards.map(reward => (
                            <RewardPopup key={reward.id} amount={reward.amount} />
                        ))}
                    </AnimatePresence>
                </div>


                <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 pb-4">
                    {messages.map((message, index) => {
                        const messageId = `${message.id}-${index}`;
                        const isUser = message.sender.id === 'user';
                        const participant = isUser ? null : group.participants.find(p => p.id === message.sender.id);
                        
                        const nextMessage = messages[index + 1];
                        const isLastInGroup = !nextMessage || nextMessage.sender.id !== message.sender.id;
                        const showAvatar = !isUser && isLastInGroup;
                        
                        let messageText = message.text;
                        if ((message.id === 'g-msg-8' || message.id === 'g-msg-4b' || message.id === 'g-msg-16') && profile.name) {
                            messageText = messageText?.replace('novinho', profile.name);
                        }

                        return (
                            <div
                                key={messageId}
                                id={messageId}
                                className={cn('flex w-full items-end gap-2', {
                                    'justify-end': isUser,
                                    'justify-start': !isUser,
                                })}
                            >
                                <div className="w-8 shrink-0 self-end">
                                  {showAvatar && participant && (
                                       <Avatar className="h-8 w-8">
                                          <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                                          <AvatarFallback>{participant.name.substring(0, 2)}</AvatarFallback>
                                      </Avatar>
                                  )}
                                </div>

                                <div className={cn("flex flex-col gap-1 w-full", {
                                    "items-end": isUser,
                                    "items-start": !isUser,
                                })}>
                                     
                                    {messageText && (
                                        <div
                                            className={cn(
                                                'text-base text-left rounded-2xl max-w-[320px] p-3',
                                                {
                                                    'bg-primary text-primary-foreground': isUser,
                                                    'bg-muted text-foreground': !isUser,
                                                },
                                            )}
                                        >
                                            {!isUser && participant && (
                                                <span className="text-xs font-bold text-primary mb-1 block">{participant.name}</span>
                                            )}
                                            <p className="break-words">{messageText}</p>
                                            {message.timestamp && (
                                                <div className={cn("text-xs text-right mt-1", isUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                                                    {message.timestamp}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {message.iframeSrc && (
                                         <div className="relative max-w-[240px] w-full rounded-2xl overflow-hidden border border-border aspect-[9/16]">
                                            <iframe
                                                src={message.iframeSrc}
                                                className="w-full h-full border-0"
                                                allow="autoplay; fullscreen"
                                                allowFullScreen
                                            ></iframe>
                                             {message.timestamp && (
                                                <span className="absolute bottom-1 right-2 text-xs text-white rounded px-1 py-0.5 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                                                    {message.timestamp}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                     <TypingIndicator participant={typingParticipant} />
                     {showUnlockButton && !hasTiktokAccess && (
                        <div className="flex justify-center pt-8 pb-4" ref={unlockButtonRef}>
                            <Button
                                onClick={handleUnlockClick}
                                className="animate-pulse bg-gradient-to-r from-primary to-accent text-accent-foreground shadow-lg"
                                size="lg"
                            >
                                <UnlockKeyhole className="mr-2 h-5 w-5" />
                                Entrar no Clube das Madames
                            </Button>
                        </div>
                    )}
                </main>

                <footer className="sticky bottom-0 p-2 border-t bg-background">
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-12 w-12 shrink-0" onClick={handleAttachmentClick}>
                           <Paperclip className="h-6 w-6" />
                        </Button>
                        <Input
                            placeholder="Digite sua mensagem..."
                            className="flex-1 h-12"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            onClick={handleInputClick}
                            readOnly={isInputDisabled && !hasTiktokAccess}
                        />
                        <Button size="icon" className="h-12 w-12 shrink-0" onClick={handleSendMessage} disabled={inputValue.trim() === '' || (isInputDisabled && !hasTiktokAccess)}>
                            <Send className="icon-only-size" />
                        </Button>
                    </div>
                </footer>
            </div>
            <UpgradeDialog 
                open={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog} 
                variant="tiktok"
                onConfirm={handleOpenCheckout}
                source="group_chat"
            />
             {checkoutInfo && (
                <CheckoutDialog
                    open={isCheckoutOpen}
                    onOpenChange={setIsCheckoutOpen}
                    totalAmount={checkoutInfo.amount}
                    source={checkoutInfo.source}
                    productName={checkoutInfo.productName}
                    transaction={transaction}
                />
            )}
        </>
    );
}
