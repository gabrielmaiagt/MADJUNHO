
"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Chapter } from "@/lib/types";
import { useAnalytics } from "@/context/analytics-context";
import { BookOpen } from "lucide-react";

type ChapterCardProps = {
    chapter: Chapter;
}

export function ChapterCard({ chapter }: ChapterCardProps) {
    const { trackEvent } = useAnalytics();

    const handleClick = () => {
        trackEvent('click_chapter');
    };

    return (
        <Link href={chapter.href} onClick={handleClick}>
            <Card className="overflow-hidden cursor-pointer group hover:bg-muted/50 transition-colors mb-4">
                <div className="flex items-center gap-4 p-4">
                     <div className="bg-primary/10 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{chapter.title}</h3>
                        <p className="text-sm text-muted-foreground">{chapter.description}</p>
                    </div>
                </div>
            </Card>
        </Link>
    )
}

    