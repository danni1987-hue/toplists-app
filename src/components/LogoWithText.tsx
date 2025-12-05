import { Crown } from "lucide-react";

export function LogoWithText() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <Crown 
          className="w-8 h-8" 
          style={{
            fill: "url(#crown)",
            stroke: "url(#crown)",
          }}
        />
        <svg width="0" height="0">
          <defs>
            <linearGradient id="crown" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent" style={{
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text"
      }}>
        TopLists
      </span>
    </div>
  );
}