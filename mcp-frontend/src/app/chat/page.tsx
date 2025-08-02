import { MessageCircle } from "lucide-react";

export default function EmptyConversationPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center text-muted-foreground">
        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-sm">选择左侧的会话开始聊天，或创建新的会话</p>
      </div>
    </div>
  );
}
