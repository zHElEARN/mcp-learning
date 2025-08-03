"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api";
import { Copy, SendHorizontal, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (content: string, tools?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel?: string;
  onModelChange: (model: string) => void;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "输入你的消息...",
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const [inputContent, setInputContent] = useState<string>("");
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [tools, setTools] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const modelList = await apiClient.getModels();
        setModels(modelList);

        // 如果没有选中的模型且有可用模型，选择第一个
        if (!selectedModel && modelList.length > 0) {
          onModelChange(modelList[0]);
        }
      } catch (error) {
        console.error("获取模型列表失败:", error);
        toast.error("获取模型列表失败");
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [selectedModel, onModelChange]);

  // 获取工具列表
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoadingTools(true);
        const toolList = await apiClient.getTools();
        setTools(toolList);
        // 默认全选所有工具
        setSelectedTools(toolList);
      } catch (error) {
        console.error("获取工具列表失败:", error);
        toast.error("获取工具列表失败");
      } finally {
        setIsLoadingTools(false);
      }
    };

    fetchTools();
  }, []);

  const handleSendMessage = () => {
    if (!inputContent.trim() || disabled) return;

    onSendMessage(inputContent.trim(), selectedTools);
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

  const handleSelectAllTools = () => {
    setSelectedTools([...tools]);
  };

  const handleDeselectAllTools = () => {
    setSelectedTools([]);
  };

  const handleInvertSelection = () => {
    setSelectedTools((prev) => tools.filter((tool) => !prev.includes(tool)));
  };

  // 按 server 分组工具
  const groupedTools = tools.reduce((groups, tool) => {
    const [server, name] = tool.split(":", 2);
    if (!groups[server]) {
      groups[server] = [];
    }
    groups[server].push({ fullName: tool, name: name || tool });
    return groups;
  }, {} as Record<string, Array<{ fullName: string; name: string }>>);

  return (
    <div className="px-4 py-2">
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
            {/* 左侧工具选择 */}
            <div className="flex items-center gap-2">
              {/* 工具选择 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={disabled || isLoadingTools}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    工具
                    {selectedTools.length > 0 && `(${selectedTools.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-90 max-h-120 overflow-y-auto"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuLabel>选择工具</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* 操作按钮区域 */}
                  {!isLoadingTools && tools.length > 0 && (
                    <>
                      <div className="flex gap-1 p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={handleSelectAllTools}
                        >
                          全选
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={handleInvertSelection}
                        >
                          反选
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={handleDeselectAllTools}
                        >
                          全不选
                        </Button>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {/* 工具列表 */}
                  {isLoadingTools ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      加载中...
                    </div>
                  ) : tools.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      暂无可用工具
                    </div>
                  ) : (
                    Object.entries(groupedTools).map(
                      ([server, serverTools]) => (
                        <div key={server}>
                          <DropdownMenuLabel className="text-xs font-semibold text-primary px-2 py-1">
                            {server}
                          </DropdownMenuLabel>
                          {serverTools.map(({ fullName, name }) => (
                            <DropdownMenuCheckboxItem
                              key={fullName}
                              checked={selectedTools.includes(fullName)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTools((prev) => [
                                    ...prev,
                                    fullName,
                                  ]);
                                } else {
                                  setSelectedTools((prev) =>
                                    prev.filter((t) => t !== fullName)
                                  );
                                }
                              }}
                              onSelect={(e) => e.preventDefault()}
                              className="pl-6"
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm">{name}</span>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                          {Object.keys(groupedTools).indexOf(server) <
                            Object.keys(groupedTools).length - 1 && (
                            <DropdownMenuSeparator />
                          )}
                        </div>
                      )
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 清除和复制按钮 */}
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

            {/* 右侧模型选择和发送按钮 */}
            <div className="flex items-center gap-2">
              {/* 模型选择 */}
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedModel}
                  onValueChange={onModelChange}
                  disabled={disabled || isLoadingModels}
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue
                      placeholder={isLoadingModels ? "加载中..." : "选择模型"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6" />

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
