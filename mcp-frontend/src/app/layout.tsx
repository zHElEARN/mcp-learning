import { Toaster } from "@/components/ui/sonner";
import "katex/dist/katex.min.css";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="overflow-hidden">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
