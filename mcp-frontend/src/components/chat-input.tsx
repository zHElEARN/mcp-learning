"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, SendHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "输入你的消息...",
}: ChatInputProps) {
  const [inputContent, setInputContent] = useState<string>("");
  const [isComposing, setIsComposing] = useState<boolean>(false);

  const handleSendMessage = () => {
    if (!inputContent.trim() || disabled) return;

    onSendMessage(inputContent.trim());
    setInputContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果正在使用输入法组合输入，则不处理回车
    if (isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleClear = () => {
    setInputContent("");
    toast.success("输入已清除");
  };

  const handleCopy = () => {
    if (inputContent) {
      navigator.clipboard.writeText(inputContent);
      toast.success("内容已复制到剪贴板");
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2 bg-background rounded-lg border shadow-sm">
          {/* 主输入区域 */}
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            className="flex-1 min-h-[100px] p-4 focus-visible:outline-none resize-none bg-transparent"
            disabled={disabled}
          />

          {/* 底部工具条 */}
          <div className="flex items-center justify-between p-2 border-t">
            {/* 左侧工具按钮 - 清除和复制按钮 */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled || !inputContent.trim()}
                onClick={handleClear}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                disabled={disabled || !inputContent.trim()}
                onClick={handleCopy}
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* 右侧发送按钮 */}
            <div className="flex items-center gap-1">
              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                onClick={handleSendMessage}
                disabled={!inputContent.trim() || disabled}
                size="icon"
                className="rounded-full w-8 h-8"
              >
                {disabled ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
