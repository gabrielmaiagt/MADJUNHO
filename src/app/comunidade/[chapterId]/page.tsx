
'use client';
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Key } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from 'lucide-react';
import type { Chapter, ChapterContent } from "@/lib/types";
import { chapters } from "@/lib/feed-data";
import { Button } from "@/components/ui/button";

const iconComponents: { [key: string]: React.ElementType } = {
    BookOpen, Sparkles, Key,
    ...LucideIcons
};

const renderContent = (content: ChapterContent, index: number) => {
    const Icon = content.icon ? iconComponents[content.icon] : null;

    switch (content.type) {
        case 'heading':
            return (
                <h3 key={index} className="text-2xl font-semibold text-primary flex items-center gap-2">
                    {Icon && <Icon className="h-6 w-6" />}
                    {content.text}
                </h3>
            );
        case 'list':
            const items = content.text.split(';').map(item => item.trim());
            return (
                <ul key={index} className="space-y-2 list-disc pl-6">
                    {items.map((item, itemIndex) => (
                        <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>
                    ))}
                </ul>
            );
        case 'quote':
             return (
                 <blockquote key={index} className="border-l-4 border-accent pl-4 italic text-muted-foreground" dangerouslySetInnerHTML={{ __html: content.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            )
        case 'hack':
             return (
                <Card key={index} className="bg-primary/10 border-primary/20">
                    <CardHeader className="flex-row items-center gap-3">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <CardTitle as="h4" className="text-lg text-primary">Hack Psicológico</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-base text-primary-foreground/80">{content.text}</p>
                    </CardContent>
               </Card>
             );
        case 'tip':
            return (
                 <Card key={index} className="bg-yellow-500/10 border-yellow-500/20">
                    <CardHeader className="flex-row items-center gap-3">
                        <Key className="h-6 w-6 text-yellow-500" />
                        <CardTitle as="h4" className="text-lg text-yellow-400">Dica Avançada</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-base text-yellow-200/80">{content.text}</p>
                    </CardContent>
               </Card>
            );
        case 'paragraph':
        default:
            return <p key={index} dangerouslySetInnerHTML={{ __html: content.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>;
    }
};


export default function CapituloDinamicoPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.chapterId as string;
  const chapter = chapters.find(c => c.id === chapterId);
  const isLoading = false; // Data is now static

   if (isLoading) {
    return (
      <MainLayout activeTab="comunidade">
        <main className="p-4 sm:p-6 md:p-8 pb-28">
            <div className="max-w-4xl mx-auto space-y-4">
                 <Skeleton className="h-12 w-3/4" />
                 <Skeleton className="h-6 w-1/2" />
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
            </div>
        </main>
      </MainLayout>
    );
  }

  if (!chapter) {
    return (
       <MainLayout activeTab="comunidade">
        <main className="p-4 sm:p-6 md:p-8 pb-28">
            <div className="max-w-4xl mx-auto text-center">
                <p>Capítulo não encontrado.</p>
                <Button onClick={() => router.push('/comunidade')} className="mt-4">Voltar ao Feed</Button>
            </div>
        </main>
      </MainLayout>
    )
  }

  return (
    <MainLayout activeTab="comunidade">
      <main className="p-4 sm:p-6 md:p-8 pb-28">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <BackButton />
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <CardTitle as="h1" className="text-4xl font-bold">{chapter.title}</CardTitle>
                    <CardDescription className="text-lg">{chapter.description}</CardDescription>
                </div>
              </div>
               <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  objectFit="cover"
                />
              </div>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none text-foreground text-lg leading-relaxed space-y-8">
              {chapter.content?.map((contentItem, index) => renderContent(contentItem, index))}
            </CardContent>
          </Card>
        </div>
      </main>
    </MainLayout>
  );
}
