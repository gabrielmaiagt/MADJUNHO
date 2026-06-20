
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type TiktokNavProps = {
    activeTab: 'lives' | 'para-voce';
    className?: string;
}

const navItems = [
    { name: 'lives', href: '/lives', label: 'Lives' },
    { name: 'para-voce', href: '/comunidade', label: 'Para você' },
] as const;

export function TiktokNav({ activeTab, className }: TiktokNavProps) {
  return (
    <div className={cn("w-full flex justify-center", className)}>
        <div className="flex items-center gap-6 text-white font-semibold">
            {navItems.map(({ name, href, label }) => {
                const isActive = activeTab === name;
                return (
                    <Link 
                        key={name} 
                        href={href} 
                        className={cn(
                            "relative flex items-center gap-1.5 pb-2", // Added pb-2 for spacing the underline
                            isActive ? "text-white" : "text-white/70"
                        )}
                    >
                        {name === 'lives' && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                        )}
                        <span>{label}</span>
                        {isActive && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                        )}
                    </Link>
                )
            })}
        </div>
    </div>
  );
}
