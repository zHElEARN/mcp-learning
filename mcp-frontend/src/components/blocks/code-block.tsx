"use client";

import { Check, Copy } from "lucide-react";
import { ComponentProps, useRef, useState } from "react";

export const CodeBlock = ({ children, ...props }: ComponentProps<"pre">) => {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  return (
    <pre
      {...props}
      ref={ref}
      className={`${props.className ?? ""} group relative`}
    >
      <button
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md border bg-white text-zinc-500 opacity-0 transition-all group-hover:opacity-100"
        onClick={async () => {
          await navigator.clipboard.writeText(
            ref.current?.querySelector("code")?.innerText ?? ""
          );
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {children}
    </pre>
  );
};
