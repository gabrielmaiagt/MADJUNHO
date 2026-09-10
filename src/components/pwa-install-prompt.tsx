"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, SquarePlus, X } from "lucide-react";
import Logo from "./Logo";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "pwaInstallPromptShown";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register the service worker (required for installability on most browsers).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;

    if (isIos()) {
      setPlatform("ios");
      setOpen(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  };

  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="sm:max-w-sm bg-card text-card-foreground">
        <DialogHeader className="items-center text-center space-y-3">
          <Logo className="h-14 w-14" />
          <DialogTitle className="text-2xl font-bold">
            {platform === "ios" ? "Instale o app no seu iPhone" : "Instale o app"}
          </DialogTitle>
          <DialogDescription>
            {platform === "ios"
              ? "Adicione à Tela de Início para abrir direto, sem precisar do navegador."
              : "Instale para abrir mais rápido, direto da tela inicial."}
          </DialogDescription>
        </DialogHeader>

        {platform === "ios" ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
              <p className="text-sm">
                Toque no ícone de <Share className="inline h-4 w-4 mx-1 -mt-0.5" /> <strong>Compartilhar</strong>, na barra do Safari.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
              <p className="text-sm">
                Escolha <SquarePlus className="inline h-4 w-4 mx-1 -mt-0.5" /> <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
              <p className="text-sm">Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior.</p>
            </div>
            <Button onClick={dismiss} className="w-full h-12 text-lg mt-2">
              Entendi
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <Button onClick={handleInstallClick} className="w-full h-12 text-lg">
              <Download className="mr-2 h-5 w-5" />
              Instalar agora
            </Button>
            <Button onClick={dismiss} variant="ghost" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Agora não
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
