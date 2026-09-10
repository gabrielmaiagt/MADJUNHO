
"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import type { TipCard } from "@/lib/types";

type MatchToastProps = {
  tip: TipCard;
};

export function MatchToast({ tip }: MatchToastProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0">
        <Image
          src={tip.imageUrl}
          alt={tip.name}
          fill
          sizes="48px"
          className="rounded-full object-cover border-2 border-primary"
        />
      </div>
      <div className="flex flex-col">
        <p className="font-bold text-base text-foreground">
          {tip.name} curtiu você
        </p>
        <div className="flex items-center gap-1.5">
          <Heart className="h-4 w-4 fill-primary text-primary" />
          <p className="text-sm text-muted-foreground">Agora mesmo</p>
        </div>
      </div>
    </div>
  );
}
