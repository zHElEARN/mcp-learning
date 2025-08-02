import {
  createElement,
  Fragment,
  ReactElement,
  useEffect,
  useState,
} from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode, { Options } from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { CodeBlock } from "./blocks/code-block";
import { ThinkingBlock } from "./blocks/thinking-block";
import { ToolBlock } from "./blocks/tool-block";

export function MarkdownRenderer({ content }: { content: string }) {
  const [renderedContent, setRenderedContent] = useState<ReactElement | null>(
    null
  );

  useEffect(() => {
    const parseMarkdown = async () => {
      const prettyCodeOptions: Options = {
        theme: "github-light",
        defaultLang: "text",
      };

      const customSchema = {
        ...defaultSchema,
        tagNames: [
          ...(defaultSchema.tagNames || []),
          "thinking-block",
          "tool-block",
          "tool-args",
          "tool-result",
        ],
        attributes: {
          ...defaultSchema.attributes,
          "thinking-block": [],
          "tool-block": ["tool", "server"],
          "tool-args": [],
          "tool-result": [],
        },
      };

      const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSanitize, customSchema)
        .use(rehypeKatex, {
          throwOnError: false,
          strict: false,
        })
        .use(rehypePrettyCode, prettyCodeOptions)
        .use(rehypeReact, {
          createElement,
          Fragment,
          jsx,
          jsxs,
          components: {
            pre: CodeBlock,
            "thinking-block": ThinkingBlock,
            "tool-block": ToolBlock,
            "tool-args": ({ children }: { children?: React.ReactNode }) =>
              createElement("tool-args", {}, children),
            "tool-result": ({ children }: { children?: React.ReactNode }) =>
              createElement("tool-result", {}, children),
          },
        })
        .process(content);

      setRenderedContent(file.result as ReactElement);
    };

    parseMarkdown();
  }, [content]);

  return <div className="prose max-w-none">{renderedContent}</div>;
}
