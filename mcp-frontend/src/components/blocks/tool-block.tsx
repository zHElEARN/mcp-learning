import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Settings } from "lucide-react";
import { useState } from "react";

export function ToolBlock({
  children,
  tool,
  server,
}: {
  children?: React.ReactNode;
  tool: string;
  server: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const parseContent = (children?: React.ReactNode) => {
    if (!children) return { args: "", result: "" };

    const childArray = Array.isArray(children) ? children : [children];
    let args = "";
    let result = "";

    childArray.forEach((child) => {
      if (
        child &&
        typeof child === "object" &&
        "key" in child &&
        "props" in child
      ) {
        const element = child as {
          key: string;
          props: { children?: React.ReactNode };
        };
        if (element.key && element.key.startsWith("tool-args")) {
          args = element.props?.children
            ? String(element.props.children).trim()
            : "";
        } else if (element.key && element.key.startsWith("tool-result")) {
          result = element.props?.children
            ? String(element.props.children).trim()
            : "";
        }
      }
    });

    try {
      args = args ? JSON.stringify(JSON.parse(args), null, 2) : args;
      result = result ? JSON.stringify(JSON.parse(result), null, 2) : result;
    } catch {}

    return { args, result };
  };

  const { args, result } = parseContent(children);

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm w-full my-2">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-card-foreground">
          <Settings size={16} className="text-primary" />
          <span className="font-medium">工具调用</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-semibold">服务器:</span>
            <span className="font-mono bg-muted px-2 py-0.5 rounded">
              {server}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-semibold">函数:</span>
            <span className="font-mono bg-muted px-2 py-0.5 rounded">
              {tool}
            </span>
          </div>

          <div className="md:hidden flex items-center gap-1 text-sm">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
              {server}
            </span>
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
              {tool}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-9 p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-2">
              <Tabs defaultValue="args" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="args">参数</TabsTrigger>
                  <TabsTrigger value="result">结果</TabsTrigger>
                </TabsList>
                <TabsContent value="args">
                  <pre className="!m-0 text-xs text-muted-foreground bg-muted p-3 rounded border border-border overflow-x-hidden whitespace-pre-wrap break-words">
                    <code className="break-all">{args}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="result">
                  <pre className="!m-0 text-xs text-muted-foreground bg-muted p-3 rounded border border-border overflow-x-hidden whitespace-pre-wrap break-words">
                    <code className="break-all">{result}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
