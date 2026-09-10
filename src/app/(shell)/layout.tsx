"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useProfile } from "@/context/profile-context";
import { useAnalytics } from "@/context/analytics-context";
import { BottomNav } from "@/components/bottom-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

type NavTab = 'comunidade' | 'grupos' | 'perfil' | 'admin' | 'feed';

const validTabs: NavTab[] = ['comunidade', 'grupos', 'perfil', 'admin'];

function getActiveTab(pathname: string): NavTab {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/perfil')) return 'perfil';
  if (pathname.startsWith('/feed')) return 'feed';
  if (
    pathname.startsWith('/grupos') ||
    pathname.startsWith('/analise-bio') ||
    pathname.startsWith('/analise-conversa') ||
    pathname.startsWith('/analise-foto') ||
    pathname.startsWith('/laboratorio-ia')
  ) {
    return 'grupos';
  }
  return 'comunidade'; // /comunidade, /comunidade/[chapterId], /lives, /loja, /loja/[id]
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const { isProfileCreated } = useProfile();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const showBottomNav = validTabs.includes(activeTab);

  useEffect(() => {
    // Allow direct access to /admin page
    if (!isProfileCreated && pathname !== '/admin') {
      router.replace('/create');
    }
  }, [isProfileCreated, pathname, router]);

  useEffect(() => {
    // Track tab clicks
    const handleTabClick = (tab: NavTab) => {
      trackEvent(`click_nav_${tab}`);
    };

    const navElement = document.querySelector('nav');
    if (navElement) {
      const links = navElement.querySelectorAll('a');
      links.forEach(link => {
        const href = link.getAttribute('href');
        const tabName = href?.replace('/', '') as NavTab;
        if (validTabs.includes(tabName)) {
          link.addEventListener('click', () => handleTabClick(tabName));
        } else if (href === '/comunidade') {
          link.addEventListener('click', () => handleTabClick('comunidade'));
        }
      });
    }
  }, [trackEvent]);

  // If not profile created and trying to access a protected route, show a loader.
  if (!isProfileCreated && pathname !== '/admin') {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Logo className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <main className={cn(
        "flex-1",
        // Na aba comunidade (Feed e Lives), deixamos que as páginas controlem seus próprios scrolls
        activeTab === 'comunidade' ? "overflow-hidden" : "overflow-y-auto"
      )}>
        {children}
      </main>
      {showBottomNav && (isProfileCreated || pathname === '/admin') && <BottomNav activeTab={activeTab} />}
      <PwaInstallPrompt />
    </div>
  );
}
