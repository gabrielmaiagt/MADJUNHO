
"use client";

import { MainLayout } from "@/components/main-layout";
import { ComunidadeFeed } from '@/components/comunidade-feed';

export default function ComunidadePage() {
    return (
        <MainLayout activeTab="comunidade">
           <ComunidadeFeed />
        </MainLayout>
    );
}
