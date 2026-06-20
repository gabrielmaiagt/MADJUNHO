import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
    return (
        <div className={cn("relative w-24 h-24", className)}>
            <Image
                src="https://firebasestorage.googleapis.com/v0/b/mentoros-app.firebasestorage.app/o/media-hub%2FMAbrOVJfktZcWonkiLv4OS8eDc12%2F1781993204208-logo-madames.webp?alt=media&token=6b22c359-b4d6-4618-9503-7ce8ad0ef28f"
                alt="Madames Online VIP Logo"
                width={96}
                height={96}
                className=""
                priority
            />
        </div>
    );
}
