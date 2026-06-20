
import { MainLayout } from "@/components/main-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";

export default function Loading() {
  return (
    <MainLayout activeTab="comunidade">
        <div className="bg-black min-h-screen text-white">
            <header className="fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm p-3 flex items-center justify-center">
                <div className="flex items-center gap-6 text-white font-semibold">
                    <Skeleton className="h-6 w-16 bg-muted/20" />
                    <Skeleton className="h-6 w-24 bg-muted/20" />
                    <Skeleton className="h-6 w-12 bg-muted/20" />
                </div>
                <div className="absolute top-3 right-3">
                    <ShoppingCart className="h-6 w-6 text-white" />
                </div>
            </header>

            <main className="pt-16 pb-28 px-3">
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col">
                            <Skeleton className="aspect-square w-full bg-muted/20" />
                            <div className="p-3 space-y-2">
                                <Skeleton className="h-4 w-3/4 bg-muted/20" />
                                <Skeleton className="h-6 w-1/2 bg-muted/20" />
                                <Skeleton className="h-4 w-full bg-muted/20" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
   </MainLayout>
  );
}
