"use client";

import { MessageSquare, User, BarChart3, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import React from 'react';
import { useProfile } from '@/context/profile-context';
import { TiktokIcon } from './icons/TiktokIcon';


const navItems = [
    { name: 'grupos', href: '/grupos', Icon: MessageSquare },
    { name: 'comunidade', href: '/comunidade', Icon: TiktokIcon },
    { name: 'perfil', href: '/perfil', Icon: User },
] as const;

type NavTab = typeof navItems[number]['name'] | 'admin' | 'feed';

const adminNavItem = { name: 'admin', href: '/admin', Icon: BarChart3 };

export function BottomNav({ activeTab }: { activeTab: NavTab }) {
  const { profile } = useProfile();
  const isAdmin = profile.name.toLowerCase().includes('admin');

  const finalNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <header className="bg-card/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 border-t shrink-0" style={{height: 'var(--bottom-nav)'}}>
      <div className="container mx-auto px-4 sm:px-6 md:px-8 h-full">
        <nav className="flex items-center justify-around h-full">
          {finalNavItems.map(({ name, href, Icon }) => {
             const isActive = activeTab === name;
             return (
                <Link key={name} href={href} className={cn(
                    "flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary w-20 text-center",
                    isActive && "text-primary"
                )}>
                    <Icon className={cn("h-7 w-7", (isActive && name !== 'comunidade' && name !== 'grupos') && "fill-current")} />
                    <span className="text-xs font-medium capitalize">
                    {
                        {
                        'feed': 'Guia',
                        'grupos': 'Conversas',
                        'comunidade': 'TikTok +18',
                        'perfil': 'Perfil',
                        'admin': 'Admin'
                        }[name]
                    }
                    </span>
                </Link>
             )
          })}
        </nav>
      </div>
    </header>
  );
}