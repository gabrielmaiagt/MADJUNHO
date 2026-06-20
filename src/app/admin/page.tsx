
"use client";

import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Eye, ShoppingCart, BarChart3, DollarSign, Video, CheckCircle, Edit, Trash, PlusCircle, BookOpen, Clapperboard, QrCode, MousePointerClick, PlayCircle, Pointer, Trash2, AlertTriangle, Wand2, Loader2, Code, Copy, TestTube2, ShoppingBasket, UserPlus, UserX, Route, Eraser, Map, LayoutDashboard, FileBox, LineChart, Wrench, Activity, Package, Binary, Link as LinkIcon, Handshake, Filter, TrendingUp, Clock, Key, Wifi } from "lucide-react";
import { useAnalytics, defaultAnalyticsData } from "@/context/analytics-context";
import { useEffect, useState, useMemo } from "react";
import { useProfile } from "@/context/profile-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Product, Chapter, VideoPost, AnalyticsData, ConversionJourney, TransactionData, Profile as UserProfile } from "@/lib/types";
import { ProductForm } from "@/components/admin/product-form";
import { ChapterForm } from "@/components/admin/chapter-form";
import { VideoPostForm } from "@/components/admin/video-post-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCollection, useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, orderBy, query, where, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { liveSessions } from "@/lib/live-data";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { analyzePaymentError, type AnalyzePaymentErrorOutput } from "@/ai/flows/analyze-payment-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTransaction } from "@/ai/flows/create-transaction";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const eventLabels: Record<string, string> = {
    visit_feed: 'Visitaram Feed de Conteúdo',
    visit_store: 'Visitaram a Loja',
    visit_lives: 'Visitaram a Página de Lives',
    add_to_cart: 'Adicionaram ao Carrinho',
    click_buy_now: 'Clicaram em Comprar Agora',
    generate_pix: 'Geraram PIX',
    pix_paid: 'Pagaram PIX (Conversão)',
    click_upgrade_tiktok: 'Cliques Upgrade TikTok +18',
    visit_live_session: 'Entraram em uma Live',
    click_chapter: 'Clicaram em um Capítulo',
    click_open_group_chat: 'Entraram na Conversa em Grupo',
    attempt_send_group_message: 'Tentaram Enviar Mensagem no Grupo',
    attempt_attach_group_file: 'Tentaram Anexar Arquivo no Grupo',
    click_unlock_ia_analysts: 'Clicaram para Desbloquear Analistas de IA',
    click_nav_comunidade: 'Navegaram para Comunidade (TikTok)',
    click_nav_grupos: 'Navegaram para Grupos (Conversas)',
    click_nav_perfil: 'Navegaram para Perfil',
    click_ai_tool_photo: 'Usaram Ferramenta de Análise de Foto',
    click_ai_tool_bio: 'Usaram Ferramenta de Análise de Bio',
    click_ai_tool_conversation: 'Usaram Ferramenta de Análise de Conversa',
    click_analyze_photo: 'Iniciaram Análise de Foto',
    click_analyze_bio: 'Iniciaram Análise de Bio',
    click_analyze_conversation: 'Iniciaram Análise de Conversa',
    like_video: 'Curtiram um Vídeo',
    unlike_video: 'Descurtiram um Vídeo',
    open_comments: 'Abriram Comentários',
    submit_comment: 'Tentaram Enviar Comentário',
    click_user_profile_in_feed: 'Clicaram no Perfil (Feed)',
    click_download_video: 'Tentaram Baixar Vídeo',
    visit_create_profile: 'Visitaram Criação de Perfil',
    start_filling_profile: 'Iniciaram Preenchimento de Perfil',
    submit_create_profile: 'Concluíram Perfil',
    pageView: 'Visitou a página',
    event: 'Realizou o evento',
    detailedEvent: 'Realizou o evento detalhado',
    live_ended: 'Finalizaram a Live',
    click_end_live_chat_button: 'Cliques para Chat Privado',
    click_duplicate_earnings: 'Cliques em Duplicar Ganhos',
};

const sourceLabels: Record<string, string> = {
    'product_page': 'Página de Produto',
    'cart_checkout': 'Carrinho de Compras',
    'live_gift': 'Presente na Live',
    'end_of_live': 'Oferta Fim de Live',
    'private_chat': 'Chat Privado',
    'duplicate_earnings:perfil': 'Duplicar Ganhos (Perfil)',
    'duplicate_earnings:live': 'Duplicar Ganhos (Live)',
    'duplicate_earnings:feed_comunidade': 'Duplicar Ganhos (Feed)',
    'upgrade_dialog:madames': 'Upgrade: Clube das Madames (Chat)',
    'upgrade_dialog:clube': 'Upgrade: Clube Online (Loja)',
    'upgrade_dialog:analistas': 'Upgrade: Analistas IA (Ferramentas)',
    'upgrade_dialog:curtidas': 'Upgrade: Curtidas (Feed)',
    'upgrade_dialog:tiktok': 'Upgrade: TikTok +18 (Genérico)',
    'tiktok_paywall:feed_comunidade': 'Paywall TikTok (Feed Comunidade)',
    'upgrade_dialog:live_chat': 'Upgrade: Envio Msg (Live)',
    'upgrade_dialog:group_chat': 'Upgrade: Envio Msg (Grupo)',
    'upgrade_dialog:locked_chat': 'Upgrade: Chat Bloqueado (Conversas)',
    'direct': 'Tráfego Direto',
    'up': 'Upsell (Página de Vendas)',
    'email': 'Email de Boas-Vindas',
};

const visitorSourceLabels: Record<string, string> = {
    'visitor_from_up': 'Upsell (Página de Vendas)',
    'visitor_from_email': 'Email de Boas-Vindas',
    'visitor_from_direct': 'Tráfego Direto',
}

const FALLBACK_IMAGE_URL = 'https://i.postimg.cc/yd4CRpPL/image.png';

type UserWithActivity = UserProfile & { id: string; createdAt: any; totalSpent: number; events: any[], tracking?: Record<string, string> };
type WebhookLog = { id: string, payload: any; receivedAt: any; }

const PixDialogWithTimer = ({ open, onOpenChange, transaction }: { open: boolean, onOpenChange: (open: boolean) => void, transaction: TransactionData | null }) => {
    const { toast } = useToast();
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
        if (open) {
            setTimeLeft(600); // Reset timer
            const timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [open]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const handleCopyPix = () => {
        if (transaction?.pix.payload) {
            navigator.clipboard.writeText(transaction.pix.payload);
            toast({ title: "PIX Copiado!", description: "O código foi copiado." });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>PIX Gerado com Sucesso!</DialogTitle>
                    <DialogDescription>Use o QR Code ou o código abaixo para pagar.</DialogDescription>
                </DialogHeader>
                {transaction && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        {transaction.pix.qr_code_base64 && (
                            <Image src={`data:image/png;base64,${transaction.pix.qr_code_base64}`} alt="PIX QR Code" width={256} height={256} className="rounded-lg bg-white" />
                        )}
                        <div className="w-full bg-destructive/10 border border-destructive/20 text-destructive p-2 rounded-lg flex items-center justify-center gap-2 text-center">
                            <Clock className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-semibold">
                                Expira em: <span className="font-mono">{formatTime(timeLeft)}</span>
                            </p>
                        </div>
                        <div className="w-full space-y-2">
                            <Label className="sr-only text-center w-full block">PIX Copia e Cola</Label>
                            <div className="relative cursor-pointer group" onClick={handleCopyPix}>
                                <Textarea readOnly value={transaction.pix.payload} className="pr-12 text-xs h-28 bg-muted resize-none cursor-pointer group-hover:bg-muted/80 transition-colors" />
                                <div className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-md group-hover:bg-primary/20">
                                    <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="w-full" variant="outline">Fechar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};


export default function AdminPage() {
    const { toast } = useToast();
    const { clearAnalytics } = useAnalytics();
    const firestore = useFirestore();
    const { profile, hasTiktokAccess, setTiktokAccess, adminUnlocked, setAdminUnlock } = useProfile();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("overview");
    const [selectedUser, setSelectedUser] = useState<UserWithActivity | null>(null);

    const userTotalGenerated = useMemo(() => {
        if (!selectedUser?.events) return 0;
        return selectedUser.events
            .filter(e => e.name === 'generate_pix' && typeof e.value === 'number')
            .reduce((sum, e) => sum + e.value, 0);
    }, [selectedUser]);

    const userSessionDuration = useMemo(() => {
        if (!selectedUser?.events || selectedUser.events.length < 2) return "N/A";
        const timestamps = selectedUser.events.map(e => new Date(e.timestamp).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        return formatDistanceToNowStrict(minTime, { unit: 'minute', locale: ptBR, addSuffix: false });
    }, [selectedUser]);


    const analyticsRef = useMemoFirebase(() => firestore ? doc(firestore, 'analytics', 'summary') : null, [firestore]);
    const { data: analyticsData, isLoading: isLoadingAnalytics } = useDoc<AnalyticsData>(analyticsRef);
    
    // Online Users
    const fiveMinutesAgo = useMemo(() => new Date(Date.now() - 5 * 60 * 1000), []);
    const presenceQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(
        collection(firestore, "presence"),
        where("last_seen", ">", Timestamp.fromDate(fiveMinutesAgo))
      );
    }, [firestore, fiveMinutesAgo]);
    const { data: onlineUsers } = useCollection(presenceQuery);

    const [liveViews, setLiveViews] = useState<{ name: string; avatar: string; views: number }[]>([]);
    const [clickTracking, setClickTracking] = useState<{ name: string; value: number }[]>([]);
    const [abandonedCartData, setAbandonedCartData] = useState<{ name: string; count: number }[]>([]);
    const [isAnalyzingError, setIsAnalyzingError] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalyzePaymentErrorOutput | null>(null);
    const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
    const [conversionSources, setConversionSources] = useState<{ name: string; count: number }[]>([]);
    const [visitorSources, setVisitorSources] = useState<{ name: string; count: number }[]>([]);
    const [salesByProduct, setSalesByProduct] = useState<{ name: string; count: number }[]>([]);
    const [webhookFilter, setWebhookFilter] = useState<'all' | 'paid' | 'created'>('all');
    const [tiktokSalesBySource, setTiktokSalesBySource] = useState<{ name: string; count: number }[]>([]);
    const [duplicateSalesBySource, setDuplicateSalesBySource] = useState<{ name: string; count: number }[]>([]);


    const [pixAmount, setPixAmount] = useState('');
    const [generatedPix, setGeneratedPix] = useState<TransactionData | null>(null);
    const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
    const [isGeneratingPix, setIsGeneratingPix] = useState(false);

    const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const chaptersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'chapters') : null, [firestore]);
    const { data: chapters, isLoading: isLoadingChapters } = useCollection<Chapter>(chaptersQuery);

    const videoPostsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'videoPosts') : null, [firestore]);
    const { data: videoPosts, isLoading: isLoadingVideoPosts } = useCollection<VideoPost>(videoPostsQuery);
    
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserWithActivity>(usersQuery);

    const webhooksQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'webhook_logs'), orderBy('receivedAt', 'desc')) : null, [firestore]);
    const { data: webhookLogs, isLoading: isLoadingWebhooks } = useCollection<WebhookLog>(webhooksQuery);


    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [isChapterFormOpen, setIsChapterFormOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

    const [isVideoPostFormOpen, setIsVideoPostFormOpen] = useState(false);
    const [selectedVideoPost, setSelectedVideoPost] = useState<VideoPost | null>(null);
    
    const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
    
    const currentAnalytics = analyticsData || defaultAnalyticsData;
    
    
    useEffect(() => {
        if (!isLoadingAnalytics && currentAnalytics) {
            const events = currentAnalytics.events || {};
            const detailedEvents = currentAnalytics.detailedEvents || {};
            
            const liveVisitEvents = detailedEvents['visit_live_session'] || [];
            const viewsPerLive = liveVisitEvents.reduce((acc, event) => {
                if (event.liveId) {
                    acc[event.liveId] = (acc[event.liveId] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            setLiveViews(Object.entries(viewsPerLive).map(([liveId, views]) => {
                const liveInfo = liveSessions.find(l => l.id === liveId);
                return { name: liveInfo?.user.name || `Live #${liveId}`, avatar: liveInfo?.user.avatarUrl || '', views };
            }).sort((a, b) => b.views - a.views));

            setClickTracking(Object.entries(events)
                .filter(([key]) => !key.endsWith('_amount') && !key.startsWith('visitor_from_'))
                .map(([key, value]) => ({ name: eventLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: value as number }))
                .sort((a, b) => b.value - a.value)
            );
            
            const addToCartEvents = detailedEvents['add_to_cart'] || [];
            const abandonedCounts = addToCartEvents.reduce((acc, event) => {
                if (event.productName) { acc[event.productName] = (acc[event.productName] || 0) + 1; }
                return acc;
            }, {} as Record<string, number>);
            setAbandonedCartData(Object.entries(abandonedCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

            const paidEvents = detailedEvents.pix_paid || [];
            
            const sourcesCount = paidEvents.reduce((acc, event) => {
                let sourceKey = event.source || 'direct';
                const sourceName = sourceLabels[sourceKey] || sourceKey;
                acc[sourceName] = (acc[sourceName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            setConversionSources(Object.entries(sourcesCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));


            const productSalesCount = paidEvents.reduce((acc, event) => {
                if(event.productName) {
                    acc[event.productName] = (acc[event.productName] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
            setSalesByProduct(Object.entries(productSalesCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));


            setVisitorSources(Object.entries(events)
                .filter(([key]) => key.startsWith('visitor_from_'))
                .map(([key, value]) => ({ name: visitorSourceLabels[key] || key, count: value as number }))
                .sort((a, b) => b.count - a.count)
            );

            // Sales by source for specific products
            const tiktokSales: Record<string, number> = {};
            const duplicateSales: Record<string, number> = {};

            paidEvents.forEach(event => {
                const sourceName = sourceLabels[event.source] || event.source || 'Desconhecida';
                if (event.productName === 'Acesso TikTok +18') {
                    tiktokSales[sourceName] = (tiktokSales[sourceName] || 0) + 1;
                } else if (event.productName === 'Duplicar Ganhos') {
                    duplicateSales[sourceName] = (duplicateSales[sourceName] || 0) + 1;
                }
            });

            setTiktokSalesBySource(Object.entries(tiktokSales).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count));
            setDuplicateSalesBySource(Object.entries(duplicateSales).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count));
        }
    }, [isLoadingAnalytics, currentAnalytics]);

    const handleClearAnalytics = () => {
        clearAnalytics();
        toast({ title: "Dados Apagados!", description: "Os dados de análise foram limpos." });
    };
    
    const handleClearBrowserData = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            toast({ title: "Cache Limpo!", description: "Dados do app limpos. A página será recarregada." });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao Limpar", description: "Não foi possível limpar os dados do navegador." });
        }
    };

    const handleProductFormSubmit = (values: Product) => {
        if (!firestore) return;
        const id = selectedProduct?.id || values.id || `prod-${Date.now()}`;
        const docRef = doc(firestore, 'products', id);
        const productToSave: Product = { ...values, id: id, sold: selectedProduct?.sold || 0, rating: selectedProduct?.rating || 5, checkoutUrl: selectedProduct?.checkoutUrl || '' };
        setDoc(docRef, productToSave, { merge: true }).catch(serverError => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: productToSave })));
        toast({ title: "Sucesso!", description: `Produto ${selectedProduct ? 'atualizado' : 'adicionado'}.` });
        setIsProductFormOpen(false);
        setSelectedProduct(null);
    };

    const handleDeleteProduct = (productId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'products', productId);
        deleteDoc(docRef).catch(serverError => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
        toast({ title: "Produto excluído", description: "O produto foi removido." });
    };

    const handleChapterFormSubmit = (values: Omit<Chapter, 'id' | 'href'> & { href?: string }) => {
        if (!firestore) return;
        const id = selectedChapter?.id || `chapter-${Date.now()}`;
        const docRef = doc(firestore, 'chapters', id);
        const chapterToSave: Chapter = { id, ...values, href: values.href || `/comunidade/${id}` };
        setDoc(docRef, chapterToSave, { merge: true }).catch(serverError => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: chapterToSave })));
        toast({ title: "Sucesso!", description: `Capítulo ${selectedChapter ? 'atualizado' : 'adicionado'}.` });
        setIsChapterFormOpen(false);
        setSelectedChapter(null);
    };

    const handleDeleteChapter = (chapterId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'chapters', chapterId);
        deleteDoc(docRef).catch(serverError => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
        toast({ title: "Capítulo excluído", description: "O capítulo foi removido." });
    };
    
    const handleVideoPostFormSubmit = (values: Omit<VideoPost, 'id'>) => {
        if (!firestore) return;
        const id = selectedVideoPost?.id || `video-${Date.now()}`;
        const docRef = doc(firestore, 'videoPosts', id);
        const videoPostToSave: VideoPost = { id, ...values };
        setDoc(docRef, videoPostToSave, { merge: true }).catch(serverError => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: videoPostToSave })));
        toast({ title: "Sucesso!", description: `Vídeo ${selectedVideoPost ? 'atualizado' : 'adicionado'}.` });
        setIsVideoPostFormOpen(false);
        setSelectedVideoPost(null);
    };

    const handleDeleteVideoPost = (videoPostId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'videoPosts', videoPostId);
        deleteDoc(docRef).catch(serverError => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
        toast({ title: "Vídeo excluído", description: "O vídeo foi removido." });
    };

    const handleAnalyzeError = async (errorMessage: string) => {
        setIsAnalyzingError(true);
        setIsAnalysisDialogOpen(true);
        setAnalysisResult(null);
        try {
            const result = await analyzePaymentError({ errorMessage });
            setAnalysisResult(result);
        } catch (e) {
            console.error("Error analyzing payment error:", e);
            toast({ variant: 'destructive', title: "Erro na Análise", description: "Não foi possível analisar o erro." });
            setIsAnalysisDialogOpen(false);
        } finally {
            setIsAnalyzingError(false);
        }
    };
    
    const handleGeneratePix = async () => {
        const numericAmount = parseFloat(pixAmount.replace(',', '.'));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast({ variant: 'destructive', title: 'Valor Inválido', description: 'Por favor, insira um valor positivo.' });
            return;
        }
        setIsGeneratingPix(true);
        try {
            const result = await createTransaction({ amount: numericAmount });
            if (result && result.id) {
                setGeneratedPix(result);
                setIsPixDialogOpen(true);
            } else { throw new Error('Falha ao gerar o PIX.'); }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao Gerar PIX', description: error.message || 'Ocorreu um erro.' });
        } finally {
            setIsGeneratingPix(false);
        }
    };

    const handleCopyPix = () => {
        if (generatedPix?.pix.payload) {
            navigator.clipboard.writeText(generatedPix.pix.payload);
            toast({ title: "PIX Copiado!", description: "O código foi copiado." });
        }
    };

    const handleToggleTiktokAccess = (checked: boolean) => {
        setTiktokAccess(checked);
        toast({ title: `Acesso TikTok +18 ${checked ? 'Ativado' : 'Desativado'}`, description: `Experiência VIP ${checked ? 'habilitada' : 'desabilitada'}.` });
    };
    
    const handleUserClick = (user: UserWithActivity) => {
        setSelectedUser(user);
        setIsUserDetailOpen(true);
    };
    
    const getFormattedDate = (date: any, dateFormat: string = 'dd/MM/yyyy') => {
        if (!date) return 'Data desconhecida';
        try {
            // Check if it's a Firestore Timestamp
            if (date && typeof date.toDate === 'function') {
                return format(date.toDate(), dateFormat, { locale: ptBR });
            }
            // Check if it's a valid date string or number
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                return format(d, dateFormat, { locale: ptBR });
            }
        } catch (e) {
            // Fallback for any other unexpected format
            return String(date);
        }
        return 'Data inválida';
    };


    const filteredWebhooks = useMemo(() => {
        if (!webhookLogs) return [];
        if (webhookFilter === 'all') return webhookLogs;
        if (webhookFilter === 'paid') {
            return webhookLogs.filter(log => log.payload?.event === 'transaction.processed' && (log.payload?.data?.transaction?.status === 'paid' || log.payload?.data?.status === 'paid'));
        }
        if (webhookFilter === 'created') {
            return webhookLogs.filter(log => log.payload?.event === 'transaction.created');
        }
        return webhookLogs;
    }, [webhookLogs, webhookFilter]);


    const isLoading = isLoadingAnalytics || isLoadingProducts || isLoadingChapters || isLoadingVideoPosts || isLoadingUsers || !users || isLoadingWebhooks;

    if (isLoading) {
        return (
             <MainLayout activeTab="admin">
                <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            </MainLayout>
        );
    }
    
    const { uniqueVisitors = 0, events = {}, errors = [], detailedEvents = {} } = currentAnalytics;
    const recentErrors = Array.isArray(errors) ? errors : [];
    const pixPaid = events['pix_paid'] || 0;
    const pixGenerated = events['generate_pix'] || 0;
    const totalRevenue = events['pix_paid_amount'] || 0;
    const conversionRate = uniqueVisitors > 0 ? pixPaid / uniqueVisitors : 0;
    
    const liveEndedCount = events['live_ended'] || 0;
    const endLiveChatClicks = events['click_end_live_chat_button'] || 0;

    const profileCreateVisits = events['visit_create_profile'] || 0;
    const profileCreateStarts = events['start_filling_profile'] || 0;
    const profileCreateSubmits = events['submit_create_profile'] || 0;
    const profileAbandonmentRate = profileCreateVisits > 0 ? ((profileCreateVisits - profileCreateSubmits) / profileCreateVisits) : 0;
    
    // TikTok +18 Funnel
    const tiktokClicks = events['click_upgrade_tiktok'] || 0;
    const tiktokPixGenerated = (detailedEvents['generate_pix'] || []).filter(e => e.productName === 'Acesso TikTok +18').length;
    const tiktokPixPaid = (detailedEvents['pix_paid'] || []).filter(e => e.productName === 'Acesso TikTok +18').length;
    const tiktokRevenue = (detailedEvents['pix_paid'] || []).filter(e => e.productName === 'Acesso TikTok +18').reduce((sum, e) => sum + e.amount, 0);
    const tiktokConversionRate = tiktokClicks > 0 ? (tiktokPixPaid / tiktokClicks) * 100 : 0;

    // Duplicate Earnings Funnel
    const duplicateClicks = events['click_duplicate_earnings'] || 0;
    const duplicatePixGenerated = (detailedEvents['generate_pix'] || []).filter(e => e.productName === 'Duplicar Ganhos').length;
    const duplicatePixPaid = (detailedEvents['pix_paid'] || []).filter(e => e.productName === 'Duplicar Ganhos').length;
    const duplicateRevenue = (detailedEvents['pix_paid'] || []).filter(e => e.productName === 'Duplicar Ganhos').reduce((sum, e) => sum + e.amount, 0);
    const duplicateConversionRate = duplicateClicks > 0 ? (duplicatePixPaid / duplicateClicks) * 100 : 0;

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{onlineUsers?.length ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Ativos nos últimos 5 minutos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueVisitors}</div>
                        <p className="text-xs text-muted-foreground">Total de usuários que visitaram o app.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</div>
                        <p className="text-xs text-muted-foreground">Soma de todos os pagamentos confirmados.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">PIX Gerados</CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pixGenerated}</div>
                        <p className="text-xs text-muted-foreground">Total de transações PIX iniciadas.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">PIX Pagos</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pixPaid}</div>
                        <p className="text-xs text-muted-foreground">Total de transações PIX confirmadas.</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <TrendingUp className="h-5 w-5 text-primary" />
                             Funil de Vendas - TikTok +18
                        </CardTitle>
                         <CardDescription>Performance da oferta de acesso VIP.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-primary/10 p-2"><MousePointerClick className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Cliques</p><p className="text-xl font-bold">{tiktokClicks}</p></div></div>
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-primary/10 p-2"><QrCode className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">PIX Gerados</p><p className="text-xl font-bold">{tiktokPixGenerated}</p></div></div>
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-primary/10 p-2"><CheckCircle className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Vendas</p><p className="text-xl font-bold">{tiktokPixPaid}</p></div></div>
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-green-500/10 p-2"><DollarSign className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Receita</p><p className="text-xl font-bold">R$ {tiktokRevenue.toFixed(2)}</p></div></div>
                            <div className="col-span-2 flex items-center justify-center gap-3 rounded-lg border p-4 bg-primary/5">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Taxa de Conversão (Clique -&gt; Venda)</p>
                                    <p className="text-2xl font-bold text-primary">{tiktokConversionRate.toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                         {tiktokSalesBySource.length > 0 && (
                            <div className="pt-4">
                                <h4 className="font-semibold mb-2">Vendas por Origem:</h4>
                                <div className="space-y-1 text-sm">
                                    {tiktokSalesBySource.map(item => (
                                        <div key={item.name} className="flex justify-between items-center"><span className="text-muted-foreground">{item.name}</span><span className="font-bold">{item.count}</span></div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <TrendingUp className="h-5 w-5 text-amber-400" />
                             Funil de Vendas - Duplicar Ganhos
                        </CardTitle>
                         <CardDescription>Performance da oferta de bônus 2x.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-amber-500/10 p-2"><MousePointerClick className="h-5 w-5 text-amber-400" /></div><div><p className="text-sm text-muted-foreground">Cliques</p><p className="text-xl font-bold">{duplicateClicks}</p></div></div>
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-amber-500/10 p-2"><QrCode className="h-5 w-5 text-amber-400" /></div><div><p className="text-sm text-muted-foreground">PIX Gerados</p><p className="text-xl font-bold">{duplicatePixGenerated}</p></div></div>
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-amber-500/10 p-2"><CheckCircle className="h-5 w-5 text-amber-400" /></div><div><p className="text-sm text-muted-foreground">Vendas</p><p className="text-xl font-bold">{duplicatePixPaid}</p></div></div>
                            <div className="flex items-center gap-3 rounded-lg border p-3"><div className="rounded-full bg-green-500/10 p-2"><DollarSign className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Receita</p><p className="text-xl font-bold">R$ {duplicateRevenue.toFixed(2)}</p></div></div>
                             <div className="col-span-2 flex items-center justify-center gap-3 rounded-lg border p-4 bg-amber-500/5">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Taxa de Conversão (Clique -&gt; Venda)</p>
                                    <p className="text-2xl font-bold text-amber-400">{duplicateConversionRate.toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                        {duplicateSalesBySource.length > 0 && (
                            <div className="pt-4">
                                <h4 className="font-semibold mb-2">Vendas por Origem:</h4>
                                <div className="space-y-1 text-sm">
                                    {duplicateSalesBySource.map(item => (
                                        <div key={item.name} className="flex justify-between items-center"><span className="text-muted-foreground">{item.name}</span><span className="font-bold">{item.count}</span></div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Funil de Criação de Perfil
                        </CardTitle>
                        <CardDescription>Métricas de conversão da tela de criação de perfil.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        <div className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Visitas</p><p className="text-xl font-bold">{profileCreateVisits}</p></div>
                        </div>
                        <div className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-primary/10 p-2"><Edit className="h-5 w-5 text-primary" /></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Iniciaram</p><p className="text-xl font-bold">{profileCreateStarts}</p></div>
                        </div>
                        <div className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-primary/10 p-2"><UserPlus className="h-5 w-5 text-primary" /></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Concluíram</p><p className="text-xl font-bold">{profileCreateSubmits}</p></div>
                        </div>
                        <div className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-destructive/10 p-2"><UserX className="h-5 w-5 text-destructive" /></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Abandono</p><p className="text-xl font-bold">{(profileAbandonmentRate * 100).toFixed(1)}%</p></div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" />Visualizações de Lives</CardTitle>
                        <CardDescription>Visualizações por cada sessão de live.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="divide-y divide-border">
                            {liveViews.length > 0 ? liveViews.map(live => (
                                <div key={live.name} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-4">
                                        <Image src={live.avatar} alt={live.name} width={40} height={40} className="rounded-full object-cover bg-white"/>
                                        <p className="font-semibold">{live.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-lg font-bold"><Eye className="h-5 w-5 text-muted-foreground" />{live.views}</div>
                                </div>
                            )) : (<p className="text-muted-foreground text-center py-4">Nenhuma live foi visualizada ainda.</p>)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Handshake className="h-5 w-5" />
                            Engajamento nas Lives
                        </CardTitle>
                        <CardDescription>Métricas de interação ao final das lives.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-primary/10 p-2"><CheckCircle className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Finalizaram a Live</p>
                                <p className="text-xl font-bold">{liveEndedCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-primary/10 p-2"><MousePointerClick className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cliques para Chat Privado</p>
                                <p className="text-xl font-bold">{endLiveChatClicks}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const renderUsers = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários Cadastrados
                </CardTitle>
                <CardDescription>
                    Lista de todos os usuários que criaram um perfil no aplicativo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="divide-y divide-border">
                    {users && users.length > 0 ? (
                        users.map(user => (
                            <div key={user.id} className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 px-2 rounded-md" onClick={() => handleUserClick(user)}>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Entrou em: {getFormattedDate(user.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500">R$ {(user.totalSpent || 0).toFixed(2).replace('.', ',')}</p>
                                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Nenhum usuário cadastrado ainda.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    const renderContentManagement = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Gerenciar Produtos</CardTitle>
                            <CardDescription>Adicione, edite ou remova produtos da loja.</CardDescription>
                        </div>
                        <Button onClick={() => { setSelectedProduct(null); setIsProductFormOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-border">
                        {products?.map(product => {
                            let imageUrl = product.images?.[0] || FALLBACK_IMAGE_URL;
                            if (imageUrl.includes('conexaointensa.online')) imageUrl = FALLBACK_IMAGE_URL;
                            return (
                            <AlertDialog key={product.id}>
                              <div className="flex items-center justify-between py-4">
                                  <div className="flex items-center gap-4"><Image src={imageUrl} alt={product.name} width={64} height={64} className="rounded-md object-cover bg-white"/><div><p className="font-semibold">{product.name}</p><p className="text-sm text-muted-foreground">R$ {product.price.toFixed(2).replace('.', ',')}</p></div></div>
                                  <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm" onClick={() => { setSelectedProduct(product); setIsProductFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Editar</Button>
                                      <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-2" /> Excluir</Button></AlertDialogTrigger>
                                  </div>
                              </div>
                               <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        )})}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Gerenciar Capítulos</CardTitle><CardDescription>Adicione, edite ou remova capítulos do feed de conteúdo.</CardDescription></div>
                        <Button onClick={() => { setSelectedChapter(null); setIsChapterFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Capítulo</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-border">
                        {chapters?.map(chapter => (
                             <AlertDialog key={chapter.id}>
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-4"><Image src={chapter.imageUrl} alt={chapter.title} width={64} height={64} className="rounded-md object-cover bg-white"/><div><p className="font-semibold">{chapter.title}</p><p className="text-sm text-muted-foreground">{chapter.description}</p></div></div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setSelectedChapter(chapter); setIsChapterFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Editar</Button>
                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-2" /> Excluir</Button></AlertDialogTrigger>
                                    </div>
                                </div>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o capítulo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div><CardTitle className="flex items-center gap-2"><Clapperboard className="h-5 w-5" />Gerenciar Vídeos</CardTitle><CardDescription>Adicione, edite ou remova vídeos do feed TikTok +18.</CardDescription></div>
                        <Button onClick={() => { setSelectedVideoPost(null); setIsVideoPostFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Vídeo</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-border">
                        {videoPosts?.map(video => (
                            <AlertDialog key={video.id}>
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center"><Video className="h-8 w-8 text-muted-foreground"/></div>
                                        <div><p className="font-semibold">@{video.user?.name || 'Usuário inválido'}</p><p className="text-sm text-muted-foreground truncate max-w-xs">{video.caption}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setSelectedVideoPost(video); setIsVideoPostFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Editar</Button>
                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-2" /> Excluir</Button></AlertDialogTrigger>
                                    </div>
                                </div>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o vídeo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteVideoPost(video.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderMetrics = () => (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Route className="h-5 w-5" />Vendas por Origem</CardTitle><CardDescription>De qual parte do app as vendas estão vindo.</CardDescription></CardHeader>
                    <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">
                        {conversionSources.length > 0 ? conversionSources.map(item => (
                            <div key={item.name}><div className="flex justify-between items-center text-sm mb-1"><span className="text-muted-foreground truncate pr-4" title={item.name}>{item.name}</span><span className="font-bold">{item.count}</span></div><Separator /></div>
                        )) : (<p className="text-muted-foreground text-center py-4">Nenhuma venda registrada ainda.</p>)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" />Visitantes por Origem</CardTitle><CardDescription>Canais de tráfego que mais trazem novos usuários.</CardDescription></CardHeader>
                    <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">{visitorSources.length > 0 ? visitorSources.map(item => (<div key={item.name}><div className="flex justify-between items-center text-sm mb-1"><span className="text-muted-foreground truncate pr-4" title={item.name}>{item.name}</span><span className="font-bold">{item.count}</span></div><Separator /></div>)) : (<p className="text-muted-foreground text-center py-4">Nenhum visitante por origem rastreado.</p>)}</CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Vendas por Produto</CardTitle>
                    <CardDescription>Quais produtos da loja estão vendendo mais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">
                    {salesByProduct.length > 0 ? salesByProduct.map(item => (
                        <div key={item.name}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-muted-foreground truncate pr-4" title={item.name}>{item.name}</span>
                                <span className="font-bold">{item.count}</span>
                            </div>
                            <Separator />
                        </div>
                    )) : (<p className="text-muted-foreground text-center py-4">Nenhum produto vendido ainda.</p>)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Pointer className="h-5 w-5" />Rastreamento de Cliques</CardTitle><CardDescription>Total de cliques nos principais eventos do site.</CardDescription></CardHeader>
                <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">{clickTracking.length > 0 ? clickTracking.map(item => (<div key={item.name}><div className="flex justify-between items-center text-sm mb-1"><span className="text-muted-foreground">{item.name}</span><span className="font-bold">{item.value.toLocaleString('pt-BR')}</span></div><Separator /></div>)) : (<p className="text-muted-foreground text-center py-4">Nenhum clique rastreado ainda.</p>)}</CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-5 w-5" />Carrinhos Abandonados</CardTitle><CardDescription>Produtos mais adicionados e não comprados.</CardDescription></CardHeader>
                <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">{abandonedCartData.length > 0 ? abandonedCartData.map(item => (<div key={item.name}><div className="flex justify-between items-center text-sm mb-1"><span className="text-muted-foreground truncate pr-4" title={item.name}>{item.name}</span><span className="font-bold">{item.count}</span></div><Separator /></div>)) : (<p className="text-muted-foreground text-center py-4">Nenhum carrinho abandonado ainda.</p>)}</CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Log de Erros Recentes</CardTitle><CardDescription>Últimos erros capturados. Analise os erros de pagamento com a IA para obter soluções.</CardDescription></CardHeader>
                <CardContent><div className="divide-y divide-border max-h-96 overflow-y-auto">{recentErrors.length > 0 ? recentErrors.map((error, index) => (<div key={index} className="py-3 space-y-2"><div className="flex justify-between items-start"><div><p className="text-sm font-semibold">{getFormattedDate(error.timestamp, "dd/MM/yyyy HH:mm:ss")}</p><p className="mt-1 text-xs text-destructive">{error.message}</p></div><div className="flex items-center gap-2">{error.fullError && (<Popover><PopoverTrigger asChild><Button size="sm" variant="outline"><Code className="mr-2 h-4 w-4" />Ver JSON</Button></PopoverTrigger><PopoverContent className="w-96"><pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded-md font-mono">{error.fullError}</pre></PopoverContent></Popover>)}<Button size="sm" variant="outline" onClick={() => handleAnalyzeError(error.message)}><Wand2 className="mr-2 h-4 w-4" />Analisar com IA</Button></div></div></div>)) : (<p className="text-muted-foreground text-center py-4">Nenhum erro registrado nesta sessão.</p>)}</div></CardContent>
            </Card>
        </div>
    );

    const renderTools = () => (
         <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />Gerador de PIX Manual</CardTitle><CardDescription>Crie uma cobrança PIX para testes ou para um usuário específico.</CardDescription></CardHeader>
                <CardContent><div className="flex items-end gap-4"><div className="flex-1 space-y-2"><Label htmlFor="pix-amount">Valor (R$)</Label><Input id="pix-amount" type="text" inputMode='decimal' placeholder="Ex: 19,90" value={pixAmount} onChange={(e) => setPixAmount(e.target.value.replace(/[^0-9,.]/g, ''))}/></div><Button onClick={handleGeneratePix} disabled={isGeneratingPix || !pixAmount}>{isGeneratingPix ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar PIX'}</Button></div></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Ferramentas de Teste</CardTitle><CardDescription>Simule diferentes níveis de acesso de usuário.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5"><Label htmlFor="tiktok-access-switch" className="text-base">Acesso TikTok +18 (VIP)</Label><p className="text-sm text-muted-foreground">Simula um usuário VIP para ver conteúdos bloqueados.</p></div>
                        <Switch id="tiktok-access-switch" checked={hasTiktokAccess} onCheckedChange={handleToggleTiktokAccess}/>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5"><Label htmlFor="admin-unlock-switch" className="text-base">Desbloquear Todos os Chats</Label><p className="text-sm text-muted-foreground">Permite acesso direto via URL aos chats privados.</p></div>
                        <Switch id="admin-unlock-switch" checked={adminUnlocked} onCheckedChange={setAdminUnlock}/>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eraser className="h-5 w-5" />Limpeza de Dados</CardTitle><CardDescription>Resete os dados do app ou do navegador para simular um novo usuário.</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="outline"><Eraser className="mr-2 h-4 w-4" />Limpar Cache do App</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Limpar dados de teste?</AlertDialogTitle><AlertDialogDescription>Essa ação limpará todos os dados do app salvos no seu navegador (localStorage). A página será recarregada.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearBrowserData}>Sim, Limpar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Apagar Dados de Análise</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá apagar permanentemente todos os dados de análise.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearAnalytics}>Continuar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
    
    const renderWebhooks = () => (
         <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Binary className="h-5 w-5" />
                            Logs de Webhooks Recebidos
                        </CardTitle>
                        <CardDescription>
                            Aqui estão os últimos webhooks de pagamento recebidos do gateway.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant={webhookFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setWebhookFilter('all')}><Filter className="mr-2 h-4 w-4" />Todos</Button>
                        <Button variant={webhookFilter === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => setWebhookFilter('paid')}><CheckCircle className="mr-2 h-4 w-4" />Pagos</Button>
                        <Button variant={webhookFilter === 'created' ? 'default' : 'outline'} size="sm" onClick={() => setWebhookFilter('created')}><QrCode className="mr-2 h-4 w-4" />Gerados</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="divide-y divide-border max-h-screen overflow-y-auto">
                    {filteredWebhooks?.map((log) => {
                        const event = log.payload?.event || 'Evento Desconhecido';
                        const data = log.payload?.data?.transaction || log.payload?.data;
                        const status = data?.status || 'N/A';
                        const amount = data?.total_amount ? (data.total_amount / 100).toFixed(2).replace('.',',') : 'N/A';

                        const getStatusBadge = (status: string) => {
                          switch (status) {
                            case 'paid':
                              return <Badge variant="default" className="bg-green-500/80">Pago</Badge>;
                            case 'pending':
                              return <Badge variant="secondary">Pendente</Badge>;
                            case 'failed':
                              return <Badge variant="destructive">Falhou</Badge>;
                            default:
                              return <Badge variant="outline">{status}</Badge>;
                          }
                        };

                        return (
                            <div key={log.id} className="py-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{event}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {getFormattedDate(log.receivedAt, "dd/MM/yyyy HH:mm:ss")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {getStatusBadge(status)}
                                        {amount !== 'N/A' && <p className="font-bold text-green-500">R$ {amount}</p>}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button size="sm" variant="outline"><Code className="mr-2 h-4 w-4" />Ver Payload</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[500px]">
                                                <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded-md font-mono">{JSON.stringify(log.payload, null, 2)}</pre>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                     {filteredWebhooks?.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum webhook com este filtro encontrado.</p>}
                </div>
            </CardContent>
        </Card>
    );

    const renderTrackingTab = () => (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Rastreamento de Usuários (UTM)
                </CardTitle>
                <CardDescription>
                    Usuários que se cadastraram com parâmetros de rastreamento (UTM).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="divide-y divide-border max-h-screen overflow-y-auto">
                    {users?.filter(u => u.tracking && Object.keys(u.tracking).length > 0).map((user) => (
                        <div key={user.id} className="py-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                     <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-white">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Entrou em: {getFormattedDate(user.createdAt, "dd/MM/yyyy HH:mm")}
                                        </p>
                                    </div>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button size="sm" variant="outline"><Code className="mr-2 h-4 w-4" />Ver Usuário</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[500px]">
                                        <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded-md font-mono">{JSON.stringify(user, null, 2)}</pre>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {user.tracking && (
                                <div className="p-3 bg-muted/50 rounded-md border">
                                    <p className="text-xs font-semibold mb-2">Parâmetros de Rastreamento:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                        {Object.entries(user.tracking).filter(([_, value]) => value).map(([key, value]) => (
                                            <div key={key} className="truncate">
                                                <span className="text-muted-foreground">{key}: </span> 
                                                <span className="font-mono bg-background/50 px-1 py-0.5 rounded" title={value as string}>{value as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                     {users?.filter(u => u.tracking && Object.keys(u.tracking).length > 0).length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum usuário com dados de rastreamento encontrado.</p>}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <MainLayout activeTab="admin">
             <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 md:p-8 pb-28">
                <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-10 w-10 text-primary" />
                        <h1 className="text-4xl font-bold">Painel do Administrador</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">Acompanhe o engajamento e as métricas de conversão do seu público.</p>
                </header>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-6">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="users">Usuários</TabsTrigger>
                        <TabsTrigger value="content">Conteúdo</TabsTrigger>
                        <TabsTrigger value="metrics">Métricas</TabsTrigger>
                        <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
                        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                        <TabsTrigger value="tools">Ferramentas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">{renderOverview()}</TabsContent>
                    <TabsContent value="users">{renderUsers()}</TabsContent>
                    <TabsContent value="content">{renderContentManagement()}</TabsContent>
                    <TabsContent value="metrics">{renderMetrics()}</TabsContent>
                    <TabsContent value="tracking">{renderTrackingTab()}</TabsContent>
                    <TabsContent value="webhooks">{renderWebhooks()}</TabsContent>
                    <TabsContent value="tools">{renderTools()}</TabsContent>
                </Tabs>
            </div>
            
            <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
                <DialogContent className="max-w-3xl">
                    {selectedUser && (
                        <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-4">
                                 <Avatar className="h-12 w-12">
                                    <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />
                                    <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    {selectedUser.name}
                                    <DialogDescription>
                                        Entrou em: {getFormattedDate(selectedUser.createdAt, 'dd/MM/yyyy HH:mm')}
                                    </DialogDescription>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <Card className="col-span-2 sm:col-span-1">
                                <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm"><span>ID do Usuário:</span><span className="font-mono text-xs truncate pl-4">{selectedUser.id}</span></div>
                                    <Separator />
                                    <div className="flex justify-between text-sm"><span>Total Gerado (PIX):</span><span className="font-bold text-yellow-400">R$ {userTotalGenerated.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm"><span>Total Gasto (Pago):</span><span className="font-bold text-green-500">R$ {(selectedUser.totalSpent || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm"><span>Total de Eventos:</span><span>{selectedUser.events?.length || 0}</span></div>
                                </CardContent>
                            </Card>
                             <Card className="col-span-2 sm:col-span-1">
                                <CardHeader><CardTitle>Engajamento</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Tempo de Sessão Ativa</p>
                                            <p className="text-lg font-bold">{userSessionDuration}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedUser.tracking && Object.values(selectedUser.tracking).some(v => v) && (
                                <Card className="col-span-2">
                                    <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5"/>Rastreamento de Origem (UTM)</CardTitle></CardHeader>
                                    <CardContent className="p-4 bg-muted/50 rounded-md border">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                            {Object.entries(selectedUser.tracking).filter(([_, value]) => value).map(([key, value]) => (
                                                <div key={key} className="truncate">
                                                    <span className="text-muted-foreground">{key}: </span>
                                                    <span className="font-mono bg-background/50 px-1.5 py-1 rounded" title={value as string}>{value as string}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                             <Card className="col-span-2">
                                <CardHeader><CardTitle className="flex items-center gap-2"><Activity/>Log de Atividades</CardTitle></CardHeader>
                                <CardContent className="max-h-80 overflow-y-auto">
                                    <div className="space-y-4">
                                        {[...(selectedUser.events || [])].reverse().map((event, index) => {
                                            const isPaid = event.name === 'pix_paid';
                                            const isGenerated = event.name === 'generate_pix';
                                            let icon = <Activity className="h-4 w-4 text-primary" />;
                                            if (isPaid) icon = <CheckCircle className="h-4 w-4 text-green-500" />;
                                            if (isGenerated) icon = <QrCode className="h-4 w-4 text-yellow-500" />;
                                            
                                            return (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                        {icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm">
                                                            {eventLabels[event.name] || event.name}
                                                            {event.path && <span className="font-mono text-xs text-muted-foreground ml-2">{event.path}</span>}
                                                            {typeof event.value === 'number' && (
                                                                <span className={`font-bold ml-2 ${isPaid ? 'text-green-500' : 'text-yellow-500'}`}>
                                                                    R$ {event.value.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {getFormattedDate(event.timestamp, 'dd/MM/yy HH:mm:ss')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}><DialogContent className="sm:max-w-[625px]"><DialogHeader><DialogTitle>{selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle><DialogDescription>Preencha os detalhes do produto abaixo. Clique em salvar quando terminar.</DialogDescription></DialogHeader><ProductForm product={selectedProduct} onSubmit={handleProductFormSubmit} onCancel={() => setIsProductFormOpen(false)} /></DialogContent></Dialog>
            <Dialog open={isChapterFormOpen} onOpenChange={setIsChapterFormOpen}><DialogContent className="sm:max-w-[625px]"><DialogHeader><DialogTitle>{selectedChapter ? 'Editar Capítulo' : 'Adicionar Novo Capítulo'}</DialogTitle><DialogDescription>Preencha os detalhes do capítulo abaixo. Clique em salvar quando terminar.</DialogDescription></DialogHeader><ChapterForm chapter={selectedChapter} onSubmit={handleChapterFormSubmit} onCancel={() => setIsChapterFormOpen(false)} /></DialogContent></Dialog>
            <Dialog open={isVideoPostFormOpen} onOpenChange={setIsVideoPostFormOpen}><DialogContent className="sm:max-w-[625px]"><DialogHeader><DialogTitle>{selectedVideoPost ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}</DialogTitle><DialogDescription>Preencha os detalhes do vídeo abaixo. Clique em salvar quando terminar.</DialogDescription></DialogHeader><VideoPostForm videoPost={selectedVideoPost} onSubmit={handleVideoPostFormSubmit} onCancel={() => setIsVideoPostFormOpen(false)} /></DialogContent></Dialog>
            <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary"/>Análise do Erro com IA</DialogTitle><DialogDescription>A inteligência artificial analisou o erro e forneceu as seguintes informações.</DialogDescription></DialogHeader>{isAnalyzingError ? (<div className="flex flex-col items-center justify-center space-y-3 py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p>Analisando o erro...</p></div>) : analysisResult ? (<div className="space-y-4 pt-4"><div><h3 className="font-bold text-lg">Análise do Problema</h3><p className="text-muted-foreground">{analysisResult.analysis}</p></div><div><h3 className="font-bold text-lg">Causa Provável</h3><p className="text-muted-foreground">{analysisResult.possibleCause}</p></div><div><h3 className="font-bold text-lg">Sugestão para Resolução</h3><p className="text-muted-foreground">{analysisResult.suggestion}</p></div></div>) : (<div className="text-center py-10"><p>Não foi possível obter uma análise.</p></div>)}</DialogContent></Dialog>
            <PixDialogWithTimer open={isPixDialogOpen} onOpenChange={setIsPixDialogOpen} transaction={generatedPix} />
        </MainLayout>
    );
}
