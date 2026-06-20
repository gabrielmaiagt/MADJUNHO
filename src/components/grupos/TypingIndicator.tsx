"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GroupParticipant } from "@/lib/types";

export const TypingIndicator = ({
  participant,
}: {
  participant: GroupParticipant | null;
}) => {
  if (!participant) return null;

  return (
    <div className="flex items-end gap-2 justify-start mb-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={participant.avatarUrl} alt={participant.name} />
        <AvatarFallback>{participant.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 items-start">
        <span className="text-xs text-muted-foreground ml-3">
          {participant.name}
        </span>
        <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1">
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]" />
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]" />
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};
