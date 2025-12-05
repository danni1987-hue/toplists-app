export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="relative inline-block">
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path 
          d="M2.75 17.25h18.5M2 9.134a.75.75 0 0 1 1.28-.536L7 12.317l3.25-6.5a.75.75 0 0 1 1.273-.073L15 9.86l3.744-4.118a.75.75 0 0 1 1.256.544v10.964a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V9.133Z" 
          fill="url(#crownGradient)" 
          stroke="url(#crownGradient)" 
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-0 blur-md opacity-70">
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M2.75 17.25h18.5M2 9.134a.75.75 0 0 1 1.28-.536L7 12.317l3.25-6.5a.75.75 0 0 1 1.273-.073L15 9.86l3.744-4.118a.75.75 0 0 1 1.256.544v10.964a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V9.133Z" 
            fill="#8b5cf6"
          />
        </svg>
      </div>
    </div>
  );
}

export function LogoWithText({ className = "", iconClassName = "h-7 w-7" }: { className?: string; iconClassName?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo className={iconClassName} />
      <h1 className="bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">
        TopLists
      </h1>
    </div>
  );
}
