"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { Bot, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ChatHeaderProps {
  selectedModel?: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ChatHeader({
  selectedModel,
  onModelChange,
  disabled = false,
}: ChatHeaderProps) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

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

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* 左侧标题 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-800">AI 对话</h1>
          </div>
        </div>

        {/* 右侧模型选择 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">模型:</span>
          </div>

          <Select
            value={selectedModel}
            onValueChange={onModelChange}
            disabled={disabled || isLoadingModels}
          >
            <SelectTrigger className="w-48">
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
      </div>
    </div>
  );
}
