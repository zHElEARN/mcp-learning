"use client";

import { ChatInput } from "@/components/chat-input";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { apiClient, type Message } from "@/lib/api";
import { Bot, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isUserScrolled, setIsUserScrolled] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 获取对话数据
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setIsLoadingData(true);
        setError(null);
        const conversation = await apiClient.getConversation(conversationId);
        setMessageList(conversation.messages || []);
      } catch {
        setError("获取对话数据失败，请刷新页面重试");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  const handleSendMessage = async (messageContent: string) => {
    if (isLoading || !messageContent.trim()) return;

    // 重置手动滚动状态，确保新消息能自动滚动
    setIsUserScrolled(false);

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessageList((prev) => [...prev, userMessage]);
    const userQuery = messageContent.trim();
    setIsLoading(true);

    try {
      // 调用聊天接口
      const response = await apiClient.sendMessage(
        conversationId,
        userQuery,
        selectedModel
      );

      if (!response.ok || !response.body) {
        throw new Error("请求失败或响应体为空");
      }

      // 创建助手消息
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessageList((prev) => [...prev, assistantMessage]);
      setIsLoading(false); // 开始流式响应后停止加载指示器
      setIsStreaming(true); // 开始流式状态

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let currentContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          if (event.startsWith("data: ")) {
            const jsonString = event.slice(6).trim();
            const data = JSON.parse(jsonString);

            currentContent += data.content;

            // 更新助手消息内容
            setMessageList((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: currentContent }
                  : msg
              )
            );
          }
        }
      }
    } catch {
      toast.error("发送消息失败");

      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，发送消息时出现错误，请重试。",
        createdAt: new Date().toISOString(),
      };

      setMessageList((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    // 只有在用户没有手动滚动时才自动滚动
    if (!isUserScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageList, isUserScrolled]);

  // 检测用户滚动行为
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px 容差

      // 如果用户滚动到了底部，重置手动滚动状态
      if (isAtBottom) {
        setIsUserScrolled(false);
      } else {
        // 如果用户向上滚动，标记为手动滚动
        setIsUserScrolled(true);
      }
    };

    chatContainer.addEventListener("scroll", handleScroll);
    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, [chatContainerRef.current]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 加载状态 */}
      {isLoadingData && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-600 dark:text-gray-300">
              正在加载对话...
            </div>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && !isLoadingData && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 text-center max-w-md">
            <div className="text-red-500 text-lg">😞</div>
            <div className="text-gray-800 dark:text-gray-200 font-medium">
              加载失败
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      )}

      {/* 正常对话界面 */}
      {!isLoadingData && !error && (
        <>
          {/* 对话区域 */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {messageList.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* AI头像 - 仅在AI消息时显示在左侧 */}
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}

                  {/* 消息内容区域 */}
                  <div
                    className={`flex flex-col space-y-1 ${
                      message.role === "user"
                        ? "items-end max-w-[70%]"
                        : "flex-1"
                    }`}
                  >
                    {/* 消息标识 */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      {message.role === "user" && <User className="w-3 h-3" />}
                      <span className="font-medium">
                        {message.role === "user" ? "用户" : "AI助手"}
                      </span>
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString(
                          "zh-CN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>

                    {/* 消息内容 */}
                    <div
                      className={
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-full"
                          : "w-full"
                      }
                    >
                      {message.role === "user" ? (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                  </div>

                  {/* 用户头像 - 仅在用户消息时显示在右侧 */}
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* 加载指示器 - 仅在等待连接时显示 */}
              {isLoading && !isStreaming && (
                <div className="flex gap-3 justify-start">
                  {/* AI头像 */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>

                  {/* 加载内容 */}
                  <div className="flex flex-col space-y-1 flex-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">AI助手</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 用户输入区域 */}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder="输入你的消息..."
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </>
      )}
    </div>
  );
}
