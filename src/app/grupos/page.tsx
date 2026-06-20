'use client';
import { MainLayout } from '@/components/main-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { groupChat, lockedChats } from '@/lib/data';
import { liveSessions } from '@/lib/live-data';
import { Users, Lock } from 'lucide-react';
import { useAnalytics } from '@/context/analytics-context';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/profile-context';
import { BalanceDisplay } from '@/components/BalanceDisplay';

export default function GruposPage() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const { hasTiktokAccess, unlockedChats } = useProfile();
  
  const [groupLastMessage, setGroupLastMessage] = useState(groupChat.lastMessage);
  const [groupLastMessageTimestamp, setGroupLastMessageTimestamp] = useState<string>(groupChat.lastMessageTimestamp || 'Agora');
  
  const [allChatsData, setAllChatsData] = useState(() => {
    return liveSessions
      .filter(session => session.videoUrl && session.chatId)
      .map(session => {
        const chatTemplate = lockedChats.find(chat => chat.id === session.chatId);
        return {
          id: session.chatId!,
          liveId: session.id,
          name: session.user.name,
          avatarUrl: session.user.avatarUrl,
          displayLastMessage: chatTemplate?.lastMessage || 'Nova conversa disponível!',
          displayTimestamp: chatTemplate?.timestamp || 'Agora',
        };
      });
  });

  useEffect(() => {
    const updateDisplayTimes = () => {
      if (typeof window === 'undefined') return;

      const savedGroupTimestamp = localStorage.getItem(`lastMessageTimestamp_${groupChat.id}`);
      const savedGroupMessage = localStorage.getItem(`lastMessage_${groupChat.id}`);

      if (savedGroupMessage) {
        setGroupLastMessage(savedGroupMessage);
      }

      if (savedGroupTimestamp) {
        const messageDate = new Date(savedGroupTimestamp);
        const now = new Date();
        const diffInSeconds = (now.getTime() - messageDate.getTime()) / 1000;
        if (diffInSeconds < 60) {
            setGroupLastMessageTimestamp('Agora');
        } else {
            setGroupLastMessageTimestamp(messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      }

      setAllChatsData(prevChats => prevChats.map(chat => {
          const savedMessage = localStorage.getItem(`lastMessage_individual_${chat.id}`);
          const savedTimestamp = localStorage.getItem(`lastMessageTimestamp_individual_${chat.id}`);
          let displayTimestamp = chat.displayTimestamp;
          let displayLastMessage = savedMessage || chat.displayLastMessage;

          if (savedTimestamp) {
              const messageDate = new Date(savedTimestamp);
              const now = new Date();
              const diffInSeconds = (now.getTime() - messageDate.getTime()) / 1000;
              if (diffInSeconds < 60) {
                  displayTimestamp = 'Agora';
              } else {
                  displayTimestamp = messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              }
          }
          return { ...chat, displayLastMessage, displayTimestamp };
      }));
    };

    updateDisplayTimes();
    const intervalId = setInterval(updateDisplayTimes, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleGroupClick = (groupId: string) => {
    trackEvent('click_open_group_chat');
    router.push(`/grupos/${groupId}`);
  }
  
  const handleLockedChatClick = (liveId: string) => {
    trackEvent('click_locked_chat');
    router.push(`/comunidade-da-live/${liveId}`);
  };

  const targetMadameNames = ['Renata', 'Vanessa', 'Luiza', 'Amanda'];
  const madameLiveSessions = liveSessions
    .filter(s => s.chatId && targetMadameNames.includes(s.user.name))
    .sort((a,b) => targetMadameNames.indexOf(a.user.name) - targetMadameNames.indexOf(b.user.name));
  
  return (
    <>
      <MainLayout activeTab="grupos">
        <div className="p-4 sm:p-6 md:p-8 pb-28">
          <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                  <h1 className="text-3xl font-bold">Conversas</h1>
                  <BalanceDisplay />
              </div>

              <div className="space-y-2">
                  <Card 
                      key={groupChat.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleGroupClick(groupChat.id)}
                  >
                      <CardHeader className="flex flex-row items-center gap-4 p-4">
                          <Avatar className="h-14 w-14">
                              <AvatarImage 
                                  src="https://i.postimg.cc/sgpX9d1B/rosto-sorridente-com-chifres-tamanho-grande-de-sorriso-emoji-amarelo-599062-10048.avif" 
                                  alt={groupChat.name}
                                  className="object-cover"
                              />
                              <AvatarFallback>
                                  <Users className="h-6 w-6 text-primary" />
                              </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                  <h3 className="font-bold text-lg">{groupChat.name}</h3>
                                  <p className="text-xs text-muted-foreground whitespace-nowrap">{groupLastMessageTimestamp}</p>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{groupLastMessage}</p>
                          </div>
                      </CardHeader>
                  </Card>

                    {/* Render Individually Unlocked Chats first */}
                    {madameLiveSessions
                        .filter(s => unlockedChats.includes(s.chatId!))
                        .map((session) => {
                            const chatInfo = allChatsData.find(c => c.id === session.chatId);
                            return (
                            <Card
                                key={session.chatId}
                                className="relative overflow-hidden cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/chat/${session.chatId}`)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4 p-4">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={session.user.avatarUrl} alt={session.user.name} />
                                        <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg">{session.user.name}</h3>
                                            <p className="text-xs text-muted-foreground whitespace-nowrap">{chatInfo?.displayTimestamp}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{chatInfo?.displayLastMessage}</p>
                                    </div>
                                </CardHeader>
                            </Card>
                            )
                        })}

                    {/* Then, render the appropriate locked previews */}
                    {madameLiveSessions
                        .filter(s => !unlockedChats.includes(s.chatId!)) // Must not be already unlocked
                        .filter(s => { // Filter by access level
                            if (hasTiktokAccess) {
                                return true; // With access, show all 4 as potential locked previews
                            } else {
                                return ['Renata', 'Vanessa'].includes(s.user.name); // Without access, only show these two
                            }
                        })
                        .map((session) => {
                            const chatInfo = allChatsData.find(c => c.id === session.chatId);
                            return (
                                <Card
                                    key={session.id}
                                    className="relative overflow-hidden cursor-pointer"
                                    onClick={() => handleLockedChatClick(session.id)}
                                >
                                    <div className="blur-sm pointer-events-none">
                                        <CardHeader className="flex flex-row items-center gap-4 p-4">
                                            <Avatar className="h-14 w-14">
                                                <AvatarImage src={session.user.avatarUrl} alt={session.user.name} />
                                                <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-bold text-lg">{session.user.name}</h3>
                                                    <p className="text-xs text-muted-foreground whitespace-nowrap">{chatInfo?.displayTimestamp}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{chatInfo?.displayLastMessage}</p>
                                            </div>
                                        </CardHeader>
                                    </div>
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                        <div className="flex items-center gap-2 text-primary font-semibold">
                                            <Lock className="h-4 w-4" />
                                            <span>Desbloquear conversa</span>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                    }
              </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
