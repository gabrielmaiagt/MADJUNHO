
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AtSign, ImageIcon as ImageIcon, Heart, Send } from "lucide-react";
import type { VideoPost, VideoComment, VideoCommentReply, Profile } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useProfile } from "@/context/profile-context";


type CommentsSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: VideoPost & { comments: VideoComment[] };
    onCommentSubmit: () => void;
    profile: Profile;
};

const LIKED_COMMENTS_KEY = 'madames_liked_comments';

function getLikedComments(): Set<string> {
    if (typeof window === 'undefined') {
        return new Set();
    }
    const liked = localStorage.getItem(LIKED_COMMENTS_KEY);
    return new Set(liked ? JSON.parse(liked) : []);
}

function updateLikedComments(likedItems: Set<string>) {
    localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify(Array.from(likedItems)));
}


const CommentReply = ({ reply, onReplyClick, onLikeClick, isLiked }: { reply: VideoCommentReply; onReplyClick: () => void; onLikeClick: () => void; isLiked: boolean }) => (
    <div className="flex items-start gap-3 mt-4">
        <div className="flex-1 flex flex-col items-start">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} />
                    <AvatarFallback>{reply.user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">{reply.user.name}</p>
            </div>
            <div className="pl-10">
                <p className="text-base break-all mt-1">{reply.text}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{reply.date}</span>
                    <button className="font-semibold" onClick={onReplyClick}>Responder</button>
                </div>
            </div>
        </div>
         <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0 pt-2">
            <button onClick={onLikeClick}>
              <Heart className={cn("h-5 w-5", isLiked && "fill-primary text-primary")} />
            </button>
            {reply.likes && reply.likes > 0 && <span className="text-xs">{reply.likes}</span>}
        </div>
    </div>
);

export function CommentsSheet({ open, onOpenChange, post, onCommentSubmit, profile }: CommentsSheetProps) {
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const { hasTiktokAccess } = useProfile();

  useEffect(() => {
    // Only update comments from props if the post ID changes
    setComments(post.comments || []);
  }, [post.id]);
  
  useEffect(() => {
    // Load liked comments from localStorage when the component opens
    if (open) {
      setLikedItems(getLikedComments());
    }
  }, [open]);

  // Persist likes to localStorage whenever they change
  useEffect(() => {
    if (open) { // Only write to storage if the sheet is open
        updateLikedComments(likedItems);
    }
  }, [likedItems, open]);


  const handleLikeComment = (commentId: string) => {
    const isCurrentlyLiked = likedItems.has(commentId);

    setComments(prevComments => 
        prevComments.map(c => {
            if (c.id === commentId) {
                return { ...c, likes: isCurrentlyLiked ? c.likes - 1 : c.likes + 1 };
            }
            return c;
        })
    );
    
    setLikedItems(prevLiked => {
        const newLikedItems = new Set(prevLiked);
        if (isCurrentlyLiked) {
            newLikedItems.delete(commentId);
        } else {
            newLikedItems.add(commentId);
        }
        return newLikedItems;
    });
  };
  
  const handleLikeReply = (commentId: string, replyIndex: number) => {
      const replyId = `${commentId}-reply-${replyIndex}`;
      const isCurrentlyLiked = likedItems.has(replyId);
      
      setComments(prevComments => prevComments.map(c => {
          if (c.id === commentId && c.replies) {
              const newReplies = [...c.replies];
              const reply = newReplies[replyIndex];
              if (reply) {
                  newReplies[replyIndex] = {
                      ...reply,
                      likes: isCurrentlyLiked ? (reply.likes || 1) - 1 : (reply.likes || 0) + 1
                  };
                  return { ...c, replies: newReplies };
              }
          }
          return c;
      }));
      
      setLikedItems(prevLiked => {
        const newLikedItems = new Set(prevLiked);
        if (isCurrentlyLiked) {
            newLikedItems.delete(replyId);
        } else {
            newLikedItems.add(replyId);
        }
        return newLikedItems;
      });
  };

  const handleSubmit = () => {
      if (!commentInput.trim()) return;

      if (!hasTiktokAccess) {
        onCommentSubmit();
        return;
      }
      
      const newComment: VideoComment = {
        id: `my-comment-${Date.now()}`,
        user: {
            name: profile.name,
            avatarUrl: profile.avatarUrl || '',
        },
        text: commentInput.trim(),
        date: 'Agora',
        likes: 0,
      };

      setComments(prevComments => [newComment, ...prevComments]);
      setCommentInput('');
      onCommentSubmit();
  }

  const handleActionClick = () => {
      if (!hasTiktokAccess) {
        onCommentSubmit();
      }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[65vh] flex flex-col bg-card text-card-foreground rounded-t-2xl border-0 p-0"
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-muted-foreground/30 rounded-full" />
        
        <SheetHeader className="text-center py-4 relative border-b">
          <SheetTitle as="h3" className="text-sm font-semibold">{comments.length} comentários</SheetTitle>
           <SheetClose className="absolute right-4 top-1/2 -translate-y-1/2" />
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {comments.map((commentData) => (
              <div key={commentData.id} className="flex items-start gap-3">
                <div className="flex-1 flex flex-col items-start">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={commentData.user.avatarUrl} alt={commentData.user.name} />
                            <AvatarFallback>{commentData.user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">{commentData.user.name}</p>
                    </div>
                  <div className="pl-12">
                      <p className="text-base break-all mt-1">{commentData.text}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>{commentData.date}</span>
                          <button className="font-semibold" onClick={handleActionClick}>Responder</button>
                      </div>
                  </div>

                  {commentData.replies && commentData.replies.length > 0 && (
                      <div className="mt-4 pl-12 w-full">
                          <div className="border-l-2 border-muted pl-4">
                            {commentData.replies.map((reply, index) => (
                                <CommentReply 
                                    key={index} 
                                    reply={reply} 
                                    onReplyClick={handleActionClick} 
                                    onLikeClick={() => handleLikeReply(commentData.id, index)}
                                    isLiked={likedItems.has(`${commentData.id}-reply-${index}`)}
                                />
                            ))}
                          </div>
                      </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0 pt-2">
                    <button onClick={() => handleLikeComment(commentData.id)}>
                      <Heart className={cn("h-5 w-5", likedItems.has(commentData.id) && "fill-primary text-primary")} />
                    </button>
                    {commentData.likes > 0 && <span className="text-xs">{commentData.likes}</span>}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <SheetFooter className="px-4 py-2 border-t">
          <div className="flex w-full items-center gap-2">
            <Avatar className="h-9 w-9">
               <AvatarImage src={profile.avatarUrl} alt={profile.name} />
               <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
             <div className="flex-1 flex items-center bg-muted/50 rounded-full px-4">
                <input 
                    placeholder="Adicionar comentário..." 
                    className="flex-1 bg-transparent py-2.5 outline-none text-base placeholder:text-muted-foreground"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                 <div className="flex items-center gap-3 text-muted-foreground">
                    <AtSign className="h-5 w-5" />
                </div>
            </div>
             <button onClick={handleSubmit} className="p-2" disabled={!commentInput.trim()}>
                <Send className={cn("h-6 w-6 text-muted-foreground", commentInput.trim() && "text-white")} />
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
