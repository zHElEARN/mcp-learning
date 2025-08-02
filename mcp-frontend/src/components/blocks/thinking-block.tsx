import { ChevronDown, ChevronRight, SparkleIcon } from "lucide-react";
import { useState } from "react";

export function ThinkingBlock({ children }: { children?: React.ReactNode }) {
  const [showDetail, setShowDetail] = useState(true);

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm w-full my-2">
      <div
        onClick={() => {
          setShowDetail(!showDetail);
        }}
        className="cursor-pointer px-4 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <SparkleIcon size={16} className="text-blue-500" />
          <span className="font-medium">思考</span>
        </div>
        {showDetail ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </div>
      {showDetail && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-200">
          <div className="text-gray-600 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
