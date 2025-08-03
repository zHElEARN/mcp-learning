"use client";

import { ConversationsList } from "@/components/conversations-list";
import { NewConversationDialog } from "@/components/new-conversation-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { apiClient, type Conversation } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ConversationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // 加载会话列表
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch {
      toast.error("加载会话列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新会话
  const handleCreateConversation = async (title: string) => {
    try {
      setIsCreating(true);
      const newConversation = await apiClient.createConversation({ title });
      setConversations((prev) => [newConversation, ...prev]);

      // 创建成功后跳转到新会话
      router.push(`/chat/${newConversation.id}`);
    } catch (error) {
      toast.error("创建会话失败");
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // 删除会话
  const handleDeleteConversation = async (id: string, title: string) => {
    try {
      await apiClient.deleteConversation(id);
      setConversations((prev) => prev.filter((conv) => conv.id !== id));

      // 如果删除的是当前活跃会话，跳转到聊天首页
      if (activeConversation === id) {
        setActiveConversation(null);
        router.push("/chat");
      }
    } catch (error) {
      toast.error(`删除会话 "${title}" 失败`);
      throw error;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 组件挂载时加载会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <NewConversationDialog
                onCreateConversation={handleCreateConversation}
                isCreating={isCreating}
              />
            </div>
            <ThemeToggle />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <ConversationsList
            conversations={conversations}
            activeConversation={activeConversation}
            formatDate={formatDate}
            onSetActiveConversation={setActiveConversation}
            onDeleteConversation={handleDeleteConversation}
            isLoading={isLoading}
          />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
