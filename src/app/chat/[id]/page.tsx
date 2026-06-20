
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { lockedChats } from '@/lib/data';
import { liveSessions } from '@/lib/live-data';
import { cn } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/profile-context';
import { Loader2, Send, Paperclip, Check, Gift, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { products as allProducts } from '@/lib/product-data';
import type { Product, TransactionData, CheckoutInfo } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useBalance } from '@/context/balance-context';
import { AnimatePresence, motion } from 'framer-motion';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { DuplicateEarningsDialog } from '@/components/duplicate-earnings-dialog';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RewardPopup } from '@/components/reward-popup';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/context/analytics-context';
import { createStoreTransaction } from '@/ai/flows/create-store-transaction';

type ChatState = 'LOADING' | 'SPEAKING' | 'WAITING_FOR_USER' | 'ENDED';
type ChatMessage = {
  sender: 'user' | 'madame';
  text?: string;
  isGift?: boolean;
  giftAmount?: number;
  giftResgued?: boolean;
  timestamp?: string;
  customType?: 'product_selection' | 'incentive';
};
type ConversationTemplate = { name: string; avatarUrl: string; conversation: any[] };

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom diaa';
    if (hour < 18) return 'Boa tardee';
    return 'Boa noitee';
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};


const productSelectionOptions: Product[] = allProducts
  .filter(p => ['prod-2', 'prod-4', 'prod-3'].includes(p.id))
  .sort((a, b) => {
      const order = ['prod-2', 'prod-4', 'prod-3'];
      return order.indexOf(a.id) - order.indexOf(b.id);
  });


export default function IndividualChatPage() {
    const router = useRouter();
    const params = useParams();
    const chatId = params.id as string;
    const { toast } = useToast();
    const { trackDetailedEvent, trackError } = useAnalytics();
    const { profile, unlockedChats, adminUnlocked } = useProfile();
    const { addBalance } = useBalance();

    // Core State
    const [chatState, setChatState] = useState<ChatState>('LOADING');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    
    // Data & Refs
    const [chatTemplate, setChatTemplate] = useState<ConversationTemplate | null>(null);
    const conversationIndexRef = useRef(0);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const productSelectionRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(messages.length);

    // UI State
    const [isTyping, setIsTyping] = useState(false);
    const [lastReward, setLastReward] = useState<number | null>(null);
    const [rewardKey, setRewardKey] = useState(0);
    const rewardAudioRef = useRef<HTMLAudioElement | null>(null);
    const [showDuplicateEarningsDialog, setShowDuplicateEarningsDialog] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isGiftCheckout, setIsGiftCheckout] = useState(false);
    const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
    const [isGiftPurchased, setIsGiftPurchased] = useState(false);


    const currentTotal = useMemo(() => {
        return [...selectedProducts].reduce((acc, id) => {
            const product = productSelectionOptions.find(p => p.id === id);
            return acc + (product?.price || 0);
        }, 0);
    }, [selectedProducts]);


    // LocalStorage Keys
    const storageKey = `chatHistory_v2_${chatId}`;
    const indexStorageKey = `chatIndex_v2_${chatId}`;
    const lastMessageKey = `lastMessage_individual_${chatId}`;
    const lastMessageTimestampKey = `lastMessageTimestamp_individual_${chatId}`;
    
    const updateMessages = (newMessages: ChatMessage[]) => {
      localStorage.setItem(storageKey, JSON.stringify(newMessages));
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage?.text) {
        localStorage.setItem(lastMessageKey, lastMessage.text);
        localStorage.setItem(lastMessageTimestampKey, new Date().toISOString());
      }
      setMessages(newMessages);
    }
    
    // --- 1. Initialization Effect ---
    useEffect(() => {
        const isIndividuallyUnlocked = unlockedChats.includes(chatId);
        const hasAccess = isIndividuallyUnlocked || adminUnlocked;

        if (!hasAccess) {
            router.replace('/grupos');
            return;
        }

        if (typeof window !== 'undefined') {
            rewardAudioRef.current = new Audio('https://madames.online/wp-content/uploads/2025/12/dinheiro.mp3');
            rewardAudioRef.current.preload = 'auto';

            const savedIsGiftPurchased = localStorage.getItem(`isGiftPurchased_${chatId}`) === 'true';
            setIsGiftPurchased(savedIsGiftPurchased);
        }

        const liveSessionForChat = liveSessions.find(l => l.chatId === chatId);
        const template = lockedChats.find(c => c.id === chatId);

        if (!template || !liveSessionForChat) {
            router.replace('/grupos');
            return;
        }

        const combinedData: ConversationTemplate = {
            name: liveSessionForChat.user.name,
            avatarUrl: liveSessionForChat.user.avatarUrl,
            conversation: template.conversation,
        };
        setChatTemplate(combinedData);

        const savedHistory = localStorage.getItem(storageKey);
        const savedIndex = localStorage.getItem(indexStorageKey);
        
        const initialMessages = savedHistory ? JSON.parse(savedHistory) : [];
        const initialIndex = savedIndex ? parseInt(savedIndex, 10) : 0;

        setMessages(initialMessages);
        conversationIndexRef.current = initialIndex;

        // Corrected logic to prevent premature state setting
        if (combinedData.conversation) {
            if (localStorage.getItem(`isGiftPurchased_${chatId}`) === 'true') {
                setChatState('WAITING_FOR_USER'); // If already purchased, chat is open.
            } else if (initialIndex >= combinedData.conversation.length) {
                setChatState('ENDED');
            } else if (initialMessages.length === 0) {
                setChatState('SPEAKING');
            } else {
                const lastConvStep = combinedData.conversation[initialIndex - 1];
                if (lastConvStep?.type === 'user_prompt') {
                    setChatState('WAITING_FOR_USER');
                } else {
                    setChatState('SPEAKING');
                }
            }
        }
        
        return () => {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            timeoutsRef.current.forEach(clearTimeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, adminUnlocked, router]);

    // --- 2. Conversation Driver Effect ---
    const processNextStep = useCallback(() => {
        if (!chatTemplate || chatState !== 'SPEAKING') return;

        const index = conversationIndexRef.current;
        if (index >= chatTemplate.conversation.length) {
            setChatState('ENDED');
            return;
        }

        const currentStep = chatTemplate.conversation[index];
        setIsTyping(false);

        const advanceAndContinue = (delay: number) => {
            conversationIndexRef.current++;
            localStorage.setItem(indexStorageKey, String(conversationIndexRef.current));
            animationTimeoutRef.current = setTimeout(processNextStep, delay);
        };

        switch (currentStep.type) {
            case 'madame':
                setIsTyping(true);
                animationTimeoutRef.current = setTimeout(() => {
                    let text = currentStep.text || '';
                    if (index === 0 && text.includes('Boa noitee')) {
                        text = text.replace(/Boa (noitee|diaa|tardee)/, getGreeting());
                    }
                    const newMessage: ChatMessage = { sender: 'madame', text, timestamp: formatTime(new Date()) };

                    updateMessages([...messages, newMessage]);
                    setIsTyping(false);
                    advanceAndContinue(1500);
                }, 7000);
                break;
            case 'incentive':
                setIsTyping(true);
                animationTimeoutRef.current = setTimeout(() => {
                    const incentiveMessage: ChatMessage = {
                        sender: 'madame',
                        customType: 'incentive',
                        text: currentStep.text,
                        timestamp: formatTime(new Date())
                    };
                    updateMessages([...messages, incentiveMessage]);
                    setIsTyping(false);
                    advanceAndContinue(100);
                }, 7000);
                break;
            case 'user_prompt':
                setChatState('WAITING_FOR_USER');
                break;
            
            case 'reward':
                animationTimeoutRef.current = setTimeout(() => {
                    if (currentStep.amount) {
                         const newMessage: ChatMessage = {
                            sender: 'madame',
                            isGift: true,
                            giftAmount: currentStep.amount,
                            giftResgued: false,
                            timestamp: formatTime(new Date()),
                        };
                        updateMessages([...messages, newMessage]);
                    }
                    advanceAndContinue(1500);
                }, 5000);
                break;

            case 'product_selection':
                animationTimeoutRef.current = setTimeout(() => {
                    const productSelectionMessage: ChatMessage = { sender: 'madame', customType: 'product_selection', timestamp: formatTime(new Date()) };
                    updateMessages([...messages, productSelectionMessage]);
                    advanceAndContinue(100);
                }, 5000);
                break;
            
            default:
                 advanceAndContinue(100); // Skip unknown steps
                 break;
        }
    }, [chatTemplate, chatState, indexStorageKey, storageKey, messages]);

    useEffect(() => {
        if (chatState === 'SPEAKING' && chatTemplate && !isGiftPurchased) {
            processNextStep();
        }
        return () => {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        }
    }, [chatState, chatTemplate, processNextStep, isGiftPurchased]);

    // This is the core logic for handling the gift click.
    // It's wrapped in useCallback to ensure it has the latest `isGiftPurchased` state.
    const handleGiftClick = useCallback((messageIndex: number) => {
        const giftMessage = messages[messageIndex];
        if (!giftMessage || !giftMessage.isGift || giftMessage.giftResgued) {
            return;
        }
        
        // If the gift has already been purchased, redeem it.
        const isAlreadyPurchased = localStorage.getItem(`isGiftPurchased_${chatId}`) === 'true';

        if (isAlreadyPurchased) {
            if (giftMessage.giftAmount) {
                const finalAmount = addBalance(giftMessage.giftAmount);
                setLastReward(finalAmount);
                setRewardKey(prev => prev + 1);
                rewardAudioRef.current?.play().catch(e => {});

                const rewardTimeout = setTimeout(() => {
                    setLastReward(null);
                }, 12000);
                timeoutsRef.current.push(rewardTimeout);

                // Mark THIS gift as rescued in the UI and localStorage.
                setMessages(prev => {
                    const updated = [...prev];
                    updated[messageIndex] = { ...updated[messageIndex], giftResgued: true };
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                    return updated;
                });
            }
        } else {
            // If the gift has NOT been purchased, scroll to the products.
            productSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [messages, addBalance, storageKey, chatId]);


    // --- User Actions ---
    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: inputValue.trim(), timestamp: formatTime(new Date()) };
        updateMessages([...messages, userMessage]);
        setInputValue('');
        
        // Don't resume the simulation if a gift has been purchased. Let the user chat freely.
        const isAlreadyPurchased = localStorage.getItem(`isGiftPurchased_${chatId}`) === 'true';
        if (isAlreadyPurchased) return;

        if (chatState === 'WAITING_FOR_USER') {
            conversationIndexRef.current++; // Move past the 'user_prompt' step
            localStorage.setItem(indexStorageKey, String(conversationIndexRef.current));
            setChatState('SPEAKING'); // Resume simulation
        }
    };
    
    const handleProductSelect = (productId: string) => {
        setSelectedProducts(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(productId)) newSelection.delete(productId);
            else newSelection.add(productId);
            return newSelection;
        });
    };

    const handleConfirmOrder = async () => {
        if (selectedProducts.size === 0) return;

        setIsConfirmingOrder(true);
        setIsGiftCheckout(true); // This flow is always for a gift
        const productNames = productSelectionOptions.filter(p => selectedProducts.has(p.id)).map(p => p.name).join(', ');
        
        const offer: CheckoutInfo = {
            amount: currentTotal,
            source: `private_chat:${chatId}`,
            productName: productNames,
        };
        trackDetailedEvent('click_buy_now', { price: offer.amount, productName: offer.productName, source: offer.source });
        
        try {
            const params = new URLSearchParams(window.location.search);
            const tracking = {
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign'),
                utm_content: params.get('utm_content'),
                utm_term: params.get('utm_term'),
                utm_id: params.get('utm_id'),
                ref: params.get('xcod') || params.get('ref'),
                src: params.get('src'),
                sck: params.get('sck'),
            };

            const newTransaction = await createStoreTransaction({
                amount: offer.amount,
                productName: offer.productName,
                source: offer.source,
                tracking
            });
            trackDetailedEvent('generate_pix', { amount: offer.amount, productName: offer.productName, source: offer.source });
            setTransaction(newTransaction);
            setCheckoutInfo(offer);
            setIsCheckoutOpen(true);

        } catch (error: any) {
            trackError(error);
            toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: 'Não foi possível criar a cobrança. Tente novamente.' });
        } finally {
            setIsConfirmingOrder(false);
        }
    };
    
    const handlePaymentComplete = (amount: number) => {
        if (isGiftCheckout) {
            setIsGiftPurchased(true);
            localStorage.setItem(`isGiftPurchased_${chatId}`, 'true');
            setChatState('WAITING_FOR_USER'); // Re-enable chat

            toast({
                title: "Compra aprovada!",
                description: "Agora você pode resgatar seu presente e continuar a conversa.",
            });
        }
    };
    
    // --- Auto-scroll ---
    useEffect(() => {
        // Only scroll to bottom if new messages are added or typing indicator appears,
        // not when a message is just updated (like redeeming a gift).
        if (scrollContainerRef.current) {
            if (messages.length > prevMessagesLength.current || isTyping) {
                 scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages, isTyping]);


    // --- Render Logic ---
    if (chatState === 'LOADING' || !chatTemplate) {
        return (
            <div className="flex h-dvh items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const isInputDisabled = chatState !== 'WAITING_FOR_USER';

    return (
        <div className="flex flex-col h-dvh bg-background">
            <header className="flex items-center justify-between gap-4 p-3 border-b sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <BackButton href="/grupos" className="text-foreground" />
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} className="object-cover" />
                        <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-bold text-lg">{chatTemplate.name}</h2>
                         {isTyping ? (
                            <span className="text-sm font-semibold text-green-500">digitando...</span>
                        ) : (
                            <span className="text-sm font-semibold text-green-500">online</span>
                        )}
                    </div>
                </div>
                <BalanceDisplay />
            </header>

            <AnimatePresence>
                {lastReward !== null && (
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                        <RewardPopup key={rewardKey} amount={lastReward} />
                    </div>
                )}
            </AnimatePresence>

            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
                {messages.map((message, index) => {
                    const isUser = message.sender === 'user';
                    const nextMessage = messages[index + 1];
                    const isLastInGroup = !nextMessage || nextMessage.sender !== message.sender;

                    if (message.customType === 'product_selection') {
                        return (
                            <motion.div
                                key={`${index}-product-selection`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                                ref={productSelectionRef}
                            >
                                <div className="flex w-full items-end gap-2 justify-start">
                                    <div className="w-8 shrink-0 self-end">
                                        {isLastInGroup && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} />
                                                <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                    <div className="w-full max-w-md bg-muted rounded-2xl rounded-bl-none p-4 space-y-3">
                                        <p className="text-left text-foreground mb-3">Adquira um ou mais produtos personalizados abaixo para resgatar seu presente:</p>
                                        {productSelectionOptions.map((product) => (
                                            <label key={product.id} htmlFor={product.id} className="flex items-center gap-4 p-3 bg-background rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
                                                <Checkbox id={product.id} checked={selectedProducts.has(product.id)} onCheckedChange={() => handleProductSelect(product.id)} className="h-6 w-6"/>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-foreground">{product.name}</p>
                                                    <p className="text-primary font-bold">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                                </div>
                                            </label>
                                        ))}
                                        <div>
                                            <Separator className="bg-border/50 my-2" />
                                            <div className="flex justify-between items-center text-lg mt-1">
                                                <span className="font-semibold text-white">Total:</span>
                                                <span className="font-bold text-primary">R$ {currentTotal.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>
                                        <Button className="w-full" onClick={handleConfirmOrder} disabled={selectedProducts.size === 0 || isConfirmingOrder}>
                                            {isConfirmingOrder ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Confirmar Pedido
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }

                    if (message.customType === 'incentive') {
                        return (
                            <motion.div
                                key={`${index}-incentive`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={cn('flex w-full items-end gap-2 justify-start')}
                            >
                                <div className="w-8 shrink-0 self-end">
                                    {isLastInGroup && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} />
                                            <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                                <div className={cn('text-base rounded-2xl max-w-xs md:max-w-md p-3 shadow-sm bg-muted text-foreground rounded-bl-none')}>
                                    <p className="whitespace-pre-wrap break-words">{message.text || 'Ah… e só pra deixar claro: quanto mais produtos adquirir, mais mimos vai ganhar 🤩'}</p>
                                    <div className={cn("text-xs text-right mt-1 text-muted-foreground/70")}>
                                        {message.timestamp}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }
                     
                     if (message.isGift) {
                        if (message.giftResgued) {
                            return (
                                <motion.div
                                    key={`${index}-gift-rescued`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className='flex w-full items-end gap-2 justify-start'
                                >
                                    <div className="w-8 shrink-0 self-end">
                                        {isLastInGroup && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} />
                                                <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                    <div className="flex flex-col bg-gradient-to-r from-gray-700/30 to-gray-800/30 border-gray-600/50 cursor-default rounded-2xl rounded-bl-none p-4 max-w-md border transition-colors shadow-[0_0_15px_rgba(128,128,128,0.2)]">
                                        <div className="flex flex-col items-center mb-3">
                                            <div className="mb-2 bg-gradient-to-br from-gray-400 to-gray-600 p-2 rounded-full shadow-[0_0_10px_rgba(128,128,128,0.5)]">
                                                <Gift className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <span className="text-white text-sm">{chatTemplate.name} te enviou um presente</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-3 mb-2 border border-gray-600/30 flex items-center justify-center">
                                            <span className="text-gray-400 text-2xl font-bold">R${message.giftAmount?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="flex justify-center">
                                            <span className="text-sm font-medium bg-gray-700 text-gray-300 px-4 py-1.5 rounded-full border border-gray-600/30">
                                                Resgatado
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }
                        return (
                             <motion.div
                                key={`${index}-gift`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className='flex w-full items-end gap-2 justify-start'
                            >
                                <div className="w-8 shrink-0 self-end">
                                  {isLastInGroup && (
                                       <Avatar className="h-8 w-8">
                                          <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} />
                                          <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                  )}
                                </div>
                                <div className="flex flex-col bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-500/50 rounded-2xl rounded-bl-none p-4 max-w-md border transition-colors shadow-[0_0_15px_rgba(255,191,0,0.2)]">
                                    <div className="flex flex-col items-center mb-3">
                                        <div className="mb-2 bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-full shadow-[0_0_10px_rgba(255,191,0,0.5)]">
                                            <Gift className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <span className="text-white text-sm">{chatTemplate.name} te enviou um presente</span>
                                        </div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 mb-2 border border-amber-500/30 flex items-center justify-center">
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 text-2xl font-bold">
                                            R${message.giftAmount?.toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <div
                                        onClick={() => handleGiftClick(index)}
                                        className="flex justify-center cursor-pointer"
                                    >
                                        <span
                                            className={cn(
                                                "text-sm font-medium bg-white text-gray-900 px-4 py-1.5 rounded-full border border-amber-500/30 animate-pulse"
                                            )}
                                        >
                                            Clique para resgatar
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn('flex w-full items-end gap-2', {
                                'justify-end': isUser,
                                'justify-start': !isUser,
                            })}
                        >
                            <div className="w-8 shrink-0 self-end">
                              {isLastInGroup && !isUser && (
                                   <Avatar className="h-8 w-8">
                                      <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} />
                                      <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                              )}
                            </div>
                            <div className={cn(
                                'text-base rounded-2xl max-w-xs md:max-w-md p-3 shadow-sm',
                                isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'
                            )}>
                                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                <div className={cn("text-xs text-right mt-1", isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                                    {message.timestamp}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                {isTyping && (
                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end gap-2 justify-start"
                     >
                        <Avatar className="h-8 w-8 self-end">
                            <AvatarImage src={chatTemplate.avatarUrl} alt={chatTemplate.name} />
                            <AvatarFallback>{chatTemplate.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1">
                          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
                        </div>
                    </motion.div>
                )}
            </main>
             <footer className="sticky bottom-0 p-2 border-t bg-background z-10 space-y-2">
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0 text-muted-foreground">
                       <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                        placeholder="Digite sua mensagem..."
                        className="flex-1 h-12 bg-muted"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isInputDisabled}
                    />
                    <Button size="icon" className="h-12 w-12 shrink-0" onClick={handleSendMessage} disabled={isInputDisabled || !inputValue.trim()}>
                        <Send className="icon-only-size" />
                    </Button>
                </div>
            </footer>
             <DuplicateEarningsDialog
                open={showDuplicateEarningsDialog}
                onOpenChange={setShowDuplicateEarningsDialog}
                source="private_chat"
            />
             {checkoutInfo && (
                 <CheckoutDialog
                    open={isCheckoutOpen}
                    onOpenChange={setIsCheckoutOpen}
                    totalAmount={checkoutInfo.amount}
                    source={checkoutInfo.source}
                    productName={checkoutInfo.productName}
                    transaction={transaction}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}
        </div>
    );
}
