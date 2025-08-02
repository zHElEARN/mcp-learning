import { ChevronDown, ChevronRight, Settings } from "lucide-react";
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
  const [showDetail, setShowDetail] = useState(true);
  const [activeTab, setActiveTab] = useState<"result" | "args">("args");

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
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm w-full my-2">
      <div
        onClick={() => {
          setShowDetail(!showDetail);
        }}
        className="cursor-pointer px-4 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <Settings size={16} className="text-green-500" />
          <span className="font-medium">工具调用</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            函数: {tool}
          </span>
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            服务器: {server}
          </span>
          {showDetail ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
        </div>
      </div>

      {showDetail && (
        <div className="border-t border-gray-200">
          <div className="flex border-b border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("args");
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "args"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              参数
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("result");
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "result"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              结果
            </button>
          </div>

          <div className="px-4">
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-hidden whitespace-pre-wrap break-words">
              <code className="break-all">
                {activeTab === "result" ? result : args}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
