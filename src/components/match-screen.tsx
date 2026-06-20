
"use client";

import Image from 'next/image';
import { Button } from './ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

type MatchScreenProps = {
    onContinue: () => void;
};

export function MatchScreen({ onContinue }: MatchScreenProps) {
    const router = useRouter();

    const handleChatClick = () => {
        // Here you would typically navigate to a chat screen with the matched user
        // For now, we'll trigger the onContinue flow which shows the upgrade dialog
        onContinue();
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in-50">
            <div className="w-[90vw] max-w-sm rounded-2xl overflow-hidden bg-gradient-to-b from-[#4a0e2a] to-[#1c0a1b] p-6 pt-12 shadow-2xl shadow-primary/30 text-white relative border border-primary/30">
                
                {/* Header Text */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-extrabold text-primary" style={{ textShadow: '0 0 15px hsla(var(--primary), 0.7)' }}>Match!</h1>
                    <p className="text-lg text-white/90 mt-2">Vocês se conectaram! Agora é sua chance de iniciar uma conversa inesquecível.</p>
                </div>

                {/* Profile Pictures */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="relative w-32 h-32">
                        <div className="w-full h-full rounded-full bg-gray-700 border-4 border-white/80 flex items-center justify-center">
                            {/* User placeholder */}
                            <span className="text-5xl text-gray-400">?</span>
                        </div>
                    </div>
                     <Heart className="w-10 h-10 text-primary fill-primary" />
                    <div className="relative w-32 h-32">
                        <Image
                            src="https://i.postimg.cc/Dyd1gCF1/luciana-profile.webp"
                            alt="Luciana"
                            width={128}
                            height={128}
                            className="rounded-full object-cover border-4 border-white/80"
                        />
                    </div>
                </div>

                {/* Profile Info */}
                <div className="text-center space-y-4">
                    <div>
                        <h2 className="text-3xl font-bold">Luciana, 54</h2>
                        <p className="text-white/80 text-base mt-2 leading-relaxed">
                            Empresária bem-sucedida, mãe de três filhos adultos. Adoro cozinhar, viajar e apreciar um bom vinho....
                        </p>
                    </div>
                     <div className="flex justify-center gap-2 pt-2">
                        <Badge variant="outline" className="bg-white/10 text-white/90 backdrop-blur-sm border-none">Gastronomia</Badge>
                        <Badge variant="outline" className="bg-white/10 text-white/90 backdrop-blur-sm border-none">Vinhos</Badge>
                        <Badge variant="outline" className="bg-white/10 text-white/90 backdrop-blur-sm border-none">Viagens</Badge>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-10">
                    <Button 
                        className="w-full text-lg font-bold py-6 bg-primary hover:bg-primary/90"
                        onClick={handleChatClick}
                    >
                        <MessageCircle className="mr-2" />
                        Conversar agora
                    </Button>
                </div>

            </div>
        </div>
    );
}
