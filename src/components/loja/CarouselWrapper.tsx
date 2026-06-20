"use client";

import * as React from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useState } from "react";

export function CarouselWrapper({
  children,
  setApi,
}: {
  children: React.ReactNode;
  setApi: (api: CarouselApi) => void;
}) {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const handleSetApi = (api: CarouselApi) => {
    setApi(api);
    if (api) {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
      api.on("select", () => {
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
      });
    }
  };

  return (
    <Carousel className="w-full" setApi={handleSetApi}>
      {children}
      {canScrollPrev && (
        <CarouselPrevious className="absolute left-4 h-12 w-12 bg-neutral-900/80 hover:bg-neutral-800 text-white border-2 border-white/50 animate-pulse" />
      )}
      {canScrollNext && (
        <CarouselNext className="absolute right-4 h-12 w-12 bg-neutral-900/80 hover:bg-neutral-800 text-white border-2 border-white/50 animate-pulse" />
      )}
    </Carousel>
  );
}
