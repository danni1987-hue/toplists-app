import { Crown } from "lucide-react";
import { useState } from "react";

interface RatingStarsProps {
  value: number; // 0-5 with 0.25 increments
  onChange: (value: number) => void;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({ value, onChange, maxStars = 5, size = "sm" }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (starIndex: number, quarter: number) => {
    // quarter: 1 = 0.25, 2 = 0.5, 3 = 0.75, 4 = 1.0
    const newValue = starIndex + (quarter * 0.25);
    onChange(newValue);
    setHoverValue(null); // Clear hover after click
  };

  const handleMouseEnter = (starIndex: number, quarter: number) => {
    const newValue = starIndex + (quarter * 0.25);
    setHoverValue(newValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  // Calculate how filled each star should be (0, 0.25, 0.5, 0.75, 1.0)
  const getStarFill = (starIndex: number): number => {
    const starValue = displayValue - starIndex;
    if (starValue >= 1) return 1; // Full star
    if (starValue <= 0) return 0; // Empty star
    return Math.ceil(starValue * 4) / 4; // Round to nearest quarter
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }, (_, index) => {
          const fill = getStarFill(index);
          
          return (
            <div
              key={index}
              className="relative cursor-pointer"
              onMouseLeave={handleMouseLeave}
            >
              {/* Divide each star into 4 clickable quarters */}
              <div className="absolute inset-0 flex z-10">
                {[1, 2, 3, 4].map((quarter) => (
                  <div
                    key={quarter}
                    className="flex-1 h-full"
                    onClick={() => handleClick(index, quarter)}
                    onMouseEnter={() => handleMouseEnter(index, quarter)}
                  />
                ))}
              </div>

              {/* Background crown (empty) */}
              <Crown
                className={`${sizeClasses[size]} text-muted-foreground/30`}
                strokeWidth={1.5}
              />

              {/* Foreground crown (filled) with gradient clip */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${fill * 100}%` }}
              >
                <Crown
                  className={`${sizeClasses[size]} fill-gradient-to-r from-[#a855f7] via-[#06b6d4] to-[#14b8a6]`}
                  strokeWidth={1.5}
                  style={{
                    fill: "url(#crownGradient)",
                    stroke: "url(#crownGradient)",
                  }}
                />
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Show numeric value */}
      <span className="text-xs font-medium text-muted-foreground min-w-[2rem] tabular-nums">
        {value > 0 ? value.toFixed(2) : "0.00"}
      </span>
    </div>
  );
}