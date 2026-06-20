import { Flame, MessageCircle, User, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type BottomNavProps = {
    activeTab: 'feed' | 'matches' | 'chats' | 'profile';
}

const navItems = [
    { name: 'feed', href: '/', Icon: Flame },
    { name: 'matches', href: '/matches', Icon: Star },
    { name: 'chats', href: '/chat', Icon: MessageCircle },
    { name: 'profile', href: '/perfil', Icon: User },
] as const;


export function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <header className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 border-t">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <nav className="flex items-center justify-around h-20">
          {navItems.map(({ name, href, Icon }) => (
             <Link key={name} href={href} className={cn(
                "flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary",
                activeTab === name && "text-primary"
             )}>
                <Icon className="h-7 w-7" />
                <span className="text-xs font-medium capitalize">{name === 'feed' ? 'Descobrir' : name === 'profile' ? 'Perfil' : name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
