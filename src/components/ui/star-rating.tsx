import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  maxStars?: number;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
  starClassName?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const SIZE_MAP = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  maxStars = 5,
  readOnly = false,
  size = "md",
  showLabel = false,
  className,
  starClassName,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const displayRating = hoverRating || value;
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const iconSizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => !readOnly && setHoverRating(0)}
      >
        {stars.map((star) => {
          const isFilled = star <= Math.floor(displayRating);
          const isHalf = !isFilled && star === Math.ceil(displayRating) && displayRating % 1 !== 0;

          if (readOnly) {
            return (
              <Star
                key={star}
                className={cn(
                  iconSizeClass,
                  isFilled
                    ? "fill-orange-500 text-orange-500"
                    : isHalf
                    ? "fill-orange-300 text-orange-500"
                    : "text-gray-200 fill-transparent",
                  starClassName
                )}
              />
            );
          }

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverRating(star)}
              className={cn(
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md transition-all duration-150 transform active:scale-90 hover:scale-110 p-0.5",
                star <= displayRating ? "text-orange-500" : "text-gray-300 hover:text-orange-300"
              )}
              aria-label={`Rate ${star} out of ${maxStars} stars`}
            >
              <Star
                className={cn(
                  iconSizeClass,
                  star <= displayRating
                    ? "fill-orange-500 text-orange-500 shadow-sm"
                    : "fill-transparent text-gray-300",
                  starClassName
                )}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-sm font-black text-orange-600 min-w-[20px]">
            {displayRating > 0 ? displayRating : value || 0}
          </span>
          <span className="text-xs font-bold text-gray-500 italic">
            {displayRating > 0 && RATING_LABELS[Math.round(displayRating)]
              ? `— ${RATING_LABELS[Math.round(displayRating)]}`
              : ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRating;
