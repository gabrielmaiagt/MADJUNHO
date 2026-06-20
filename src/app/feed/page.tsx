
"use client";

import { useEffect } from 'react';
import { MainLayout } from "@/components/main-layout";
import { useAnalytics } from '@/context/analytics-context';
import { ChapterCard } from '@/components/comunidade/chapter-card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { chapters } from '@/lib/feed-data';

export default function FeedPage() {
    const { trackEvent } = useAnalytics();
    const isLoading = false; // Data is now static from feed-data.ts

    useEffect(() => {
        trackEvent('visit_feed');
    }, [trackEvent]);

    return (
        <MainLayout activeTab="feed">
           <div className="p-4 sm:p-6 md:p-8 pb-28">
                <header className="mb-6">
                    <h1 className="text-4xl font-bold">Guia do Novinho</h1>
                    <p className="text-muted-foreground">Aprenda a atrair coroas ricas e transformar atenção em dinheiro.</p>
                </header>

                <div className="max-w-3xl mx-auto">
                    {isLoading ? (
                         <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : chapters && chapters.length > 0 ? (
                        <div className="space-y-4">
                            {chapters.map(chapter => (
                                <ChapterCard key={chapter.id} chapter={chapter} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Nenhum capítulo encontrado</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Volte em breve ou adicione capítulos no painel de administrador.</p>
                        </div>
                    )}
               </div>
           </div>
        </MainLayout>
    );
}
