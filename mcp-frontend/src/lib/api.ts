import { toast } from "sonner";

export const API_BASE_URL = "http://localhost:5678";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface CreateConversationRequest {
  title: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 对于 204 响应（删除操作），不尝试解析 JSON
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      toast.error(
        `请求失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
      throw error;
    }
  }

  // 获取所有会话
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>("/conversations/");
  }

  // 获取单个会话详情
  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`);
  }

  // 创建新会话
  async createConversation(
    data: CreateConversationRequest
  ): Promise<Conversation> {
    return this.request<Conversation>("/conversations/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // 删除会话
  async deleteConversation(id: string): Promise<void> {
    await this.request<void>(`/conversations/${id}`, {
      method: "DELETE",
    });
  }

  // 发送聊天消息 - 返回流式响应
  async sendMessage(conversationId: string, query: string): Promise<Response> {
    const url = `${this.baseUrl}/conversations/${conversationId}/chat`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }
}

export const apiClient = new ApiClient();
