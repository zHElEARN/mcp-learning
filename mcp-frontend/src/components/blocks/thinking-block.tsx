import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkle } from "lucide-react";
import { useState } from "react";

export function ThinkingBlock({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm w-full my-2">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-card-foreground">
          <Sparkle size={16} className="text-primary" />
          <span className="font-medium">思考过程</span>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4">
              <div className="text-muted-foreground text-sm leading-relaxed">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
