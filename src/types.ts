export interface User {
  email: string;
  name: string;
  createdAt: number;
  usageCount: number;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 encoding for images or string content for text files
  size: number;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  image?: {
    data: string; // Base64 url
    type: string;
  };
  attachedFile?: {
    name: string;
    content: string;
    size: number;
  };
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface UserStats {
  limitExceeded: boolean;
  timeLeftSeconds: number;
  usageCount: number;
  maxUsage: number;
}
