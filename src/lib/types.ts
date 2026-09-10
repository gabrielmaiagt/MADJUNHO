

import type { LucideIcon } from 'lucide-react';

export type Module = {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'game';
  imageUrl: string;
  dataAiHint: string;
  locked: boolean;
  href?: string;
};

export type NewModule = {
    title: string;
    description: string;
    sections: {
        title: string;
        content: string | string[];
        type: 'paragraph' | 'list' | 'quote' | 'hack';
    }[];
}

export type Badge = {
  name: string;
  Icon: LucideIcon;
  color: string;
};

export type Quiz = {
  id:string;
  title: string;
  description: string;
  module: string;
};

export type ForumPost = {
  id: string;
  title: string;
  author: string;
  avatarUrl: string;
  dataAiHint: string;
  replies: number;
  views: number;
};

export type TipCard = {
  id:string;
  name: string;
  age: number;
  bio: string;
  imageUrl: string;
  dataAiHint: string;
  type: 'article' | 'video' | 'game' | 'photo-analyzer' | 'convo-analyzer' | 'profile';
  href?: string;
  locked?: boolean;
  distance?: string;
  tags?: string[];
}

export type Message = {
    id: string;
    text: string;
    sender: 'user' | 'match';
}

export type Match = {
    id: string;
    name: string;
    avatarUrl: string;
    dataAiHint: string;
    lastMessage: string;
    isNew?: boolean;
    conversation: string[];
}

export type ProfilePhotoAnalysis = {
  isGoodPhoto: boolean;
  feedback: string;
  suggestion: string;
};

export type GroupParticipant = {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint: string;
}

export type GroupMessage = {
    id: string;
    text?: string;
    iframeSrc?: string;
    sender: {
        id: string; // 'user' ou id do participante
        name: string;
    };
    timestamp?: string;
}

export type GroupChat = {
    id: string;
    name: string;
    participants: GroupParticipant[];
    lastMessage: string;
    lastMessageTimestamp?: string;
    isNew?: boolean;
    conversation: GroupMessage[];
}

export type VideoCommentReply = {
    user: {
        name: string;
        avatarUrl: string;
    };
    text: string;
    date: string;
    likes?: number;
};

export type VideoComment = {
    id: string;
    user: {
        name: string;
        avatarUrl: string;
    };
    text: string;
    date: string;
    likes: number;
    isPinned?: boolean;
    replies?: VideoCommentReply[];
};

export type VideoPost = {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  videoUrl: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments?: VideoComment[];
};

export type LiveUser = {
  name: string;
  avatarUrl: string;
};

export type LiveComment = {
  id?: number | string; // Optional ID for keying in React
  user: LiveUser;
  text?: string;
  giftMessage?: string;
  isGift?: boolean;
  giftAmount?: number;
};

export type LiveSession = {
  id: string;
  user: LiveUser;
  title: string;
  videoUrl: string;
  imageUrl: string;
  initialViewers: string;
  isLocked?: boolean;
  chatId?: string;
};

export type CustomerInfo = {
    name: string;
    email: string;
    phone: string;
    document?: string;
};

export type TransactionData = {
    id: string;
    status: string;
    pix: {
        payload: string; // This corresponds to 'pix_qr_code' from Frendz
        qr_code_base64: string | null | undefined;
    };
};

export type Testimonial = {
    id: string;
    name: string;
    avatarUrl: string;
    rating: number;
    comment: string;
};

export type ProductMedia = {
  type: 'image' | 'video';
  url: string;
};

export type Product = {
    id: string;
    name: string;
    price: number;
    discount: number | null;
    rating: number;
    sold: number;
    images: string[];
    description: string;
    testimonials: Testimonial[];
    checkoutUrl: string;
};

export type CartItem = Product & {
    quantity: number;
};

export type ChapterContent = {
    type: 'paragraph' | 'heading' | 'list' | 'quote' | 'hack' | 'tip';
    text: string;
    icon?: string;
}

export type Chapter = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  href: string;
  content?: ChapterContent[];
};

export type Profile = {
    id?: string;
    name: string;
    avatarUrl?: string;
    pixKey?: string;
    hasEarningsDoubled?: boolean;
    unlockedChats?: string[];
    hasTiktokAccess?: boolean;
    tracking?: Record<string, string | null>;
};

type EventFromJourney = {
    type: string;
    name?: string;
    path?: string;
    timestamp: string;
}

export type ConversionJourney = {
    visitorId: string;
    source: string;
    amount: number;
    timestamp: string;
    journey: EventFromJourney[];
}

type DetailedEvent = Record<string, any>;
type AppError = {
    timestamp: string;
    message: string;
    fullError?: string;
};

export type AnalyticsData = {
    uniqueVisitors: number;
    pageViews: Record<string, number>;
    events: Record<string, number>;
    detailedEvents: {
        [key: string]: DetailedEvent[];
        conversion_journeys?: ConversionJourney[];
    };
    errors: AppError[];
};


export type CheckoutInfo = {
    amount: number;
    source: string;
    productName: string;
    isStoreCheckout?: boolean;
    transaction?: TransactionData | null;
};
