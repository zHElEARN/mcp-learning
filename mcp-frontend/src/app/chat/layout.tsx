"use client";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { NewConversationDialog } from "@/components/new-conversation-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient, type Conversation } from "@/lib/api";
import { Clock, MoreVertical, Trash2 } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ConversationsListProps {
  conversations: Conversation[];
  activeConversation: string | null;
  formatDate: (dateStr: string) => string;
  onSetActiveConversation: (id: string) => void;
  onDeleteConversation: (id: string, title: string) => Promise<void>;
  isLoading?: boolean;
}

function ConversationsList({
  conversations,
  activeConversation,
  formatDate,
  onSetActiveConversation,
  onDeleteConversation,
  isLoading = false,
}: ConversationsListProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const conversationIdFromRoute = params?.id as string | undefined;
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    conversationId: string;
    conversationTitle: string;
  }>({
    open: false,
    conversationId: "",
    conversationTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // 检查是否在聊天页面
  const isInChatPage = pathname?.startsWith("/chat/");

  // 仅在聊天页面时使用路由中的会话ID
  const currentActiveId = isInChatPage ? conversationIdFromRoute : null;

  useEffect(() => {
    // 当离开聊天页面时，清除选中状态
    if (!isInChatPage && activeConversation) {
      onSetActiveConversation("");
    }
  }, [isInChatPage, activeConversation, onSetActiveConversation]);

  // 如果没有有效路由参数且conversations为空，则不显示
  if (!currentActiveId && conversations.length === 0) {
    return (
      <div className="py-2 flex-1 px-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-sm font-medium text-gray-500">会话列表</h3>
        </div>
        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">加载中...</div>
        ) : (
          <div className="text-center text-gray-500 mt-8">暂无会话</div>
        )}
      </div>
    );
  }

  const handleConversationClick = (id: string) => {
    onSetActiveConversation(id);
    router.push(`/chat/${id}`);
  };

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // 相对时间格式化函数
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "刚刚";
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return formatDate(dateStr); // 超过一周则使用常规日期格式
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteDialog({
      open: true,
      conversationId: id,
      conversationTitle: title,
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDeleteConversation(
        deleteDialog.conversationId,
        deleteDialog.conversationTitle
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialog({
        open: false,
        conversationId: "",
        conversationTitle: "",
      });
    }
  };

  return (
    <>
      <div className="py-2 flex-1 px-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-sm font-medium text-gray-500">会话列表</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {isLoading ? (
              <div className="text-center text-gray-500 mt-8">加载中...</div>
            ) : (
              sortedConversations.map((conv) => (
                <div key={conv.id} className="flex items-center group relative">
                  <Button
                    variant={
                      conv.id === currentActiveId ? "secondary" : "ghost"
                    }
                    className="w-full justify-start text-left font-normal pl-2"
                    onClick={() => handleConversationClick(conv.id)}
                  >
                    <div className="truncate flex-grow">{conv.title}</div>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right">
                      <DropdownMenuLabel>时间信息</DropdownMenuLabel>
                      <DropdownMenuItem className="flex items-center cursor-default">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          创建日期:{" "}
                          {new Date(conv.createdAt).toLocaleString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center cursor-default">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          更新于: {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(conv.id, conv.title)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>删除会话</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        conversationTitle={deleteDialog.conversationTitle}
        isDeleting={isDeleting}
      />
    </>
  );
}

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
    <div className="flex h-screen bg-background">
      {/* 左侧会话列表 */}
      <div className="w-64 bg-card border-r flex flex-col">
        {/* 会话列表 */}
        <ConversationsList
          conversations={conversations}
          activeConversation={activeConversation}
          formatDate={formatDate}
          onSetActiveConversation={setActiveConversation}
          onDeleteConversation={handleDeleteConversation}
          isLoading={isLoading}
        />

        {/* 底部新建会话按钮 */}
        <div className="p-4 border-t bg-muted/30">
          <NewConversationDialog
            onCreateConversation={handleCreateConversation}
            isCreating={isCreating}
          />
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
