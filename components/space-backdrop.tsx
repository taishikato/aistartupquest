"use client"

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

type SpaceBackdropProps = {
  className?: string
}

type SpaceStar = {
  x: number
  y: number
  size: 2 | 3
  color: "#f0f7e6" | "#4ecdc4" | "#ffe66d"
  layer: 0 | 1 | 2
  twinkle?: boolean
  delay?: string
}

const SPACE_STARS: SpaceStar[] = [
  { x: 4, y: 12, size: 2, color: "#f0f7e6", layer: 0, twinkle: true },
  { x: 9, y: 33, size: 2, color: "#4ecdc4", layer: 1 },
  { x: 12, y: 72, size: 3, color: "#ffe66d", layer: 2, twinkle: true },
  { x: 16, y: 18, size: 2, color: "#f0f7e6", layer: 1 },
  { x: 19, y: 52, size: 2, color: "#f0f7e6", layer: 0, delay: "1.2s" },
  { x: 23, y: 9, size: 3, color: "#ffe66d", layer: 2 },
  { x: 27, y: 28, size: 2, color: "#4ecdc4", layer: 0, twinkle: true },
  { x: 31, y: 68, size: 2, color: "#f0f7e6", layer: 1 },
  { x: 34, y: 43, size: 3, color: "#f0f7e6", layer: 2, delay: "0.6s" },
  { x: 38, y: 15, size: 2, color: "#4ecdc4", layer: 0 },
  { x: 41, y: 80, size: 2, color: "#ffe66d", layer: 1, twinkle: true },
  { x: 45, y: 24, size: 2, color: "#f0f7e6", layer: 2 },
  { x: 49, y: 58, size: 3, color: "#4ecdc4", layer: 0, delay: "1.8s" },
  { x: 53, y: 36, size: 2, color: "#f0f7e6", layer: 1 },
  { x: 56, y: 7, size: 2, color: "#ffe66d", layer: 2, twinkle: true },
  { x: 60, y: 74, size: 2, color: "#f0f7e6", layer: 0 },
  { x: 64, y: 19, size: 3, color: "#4ecdc4", layer: 1 },
  { x: 67, y: 48, size: 2, color: "#f0f7e6", layer: 2, delay: "2.4s" },
  { x: 71, y: 83, size: 2, color: "#ffe66d", layer: 0, twinkle: true },
  { x: 75, y: 31, size: 2, color: "#f0f7e6", layer: 1 },
  { x: 79, y: 11, size: 3, color: "#f0f7e6", layer: 2 },
  { x: 83, y: 66, size: 2, color: "#4ecdc4", layer: 0, twinkle: true },
  { x: 87, y: 39, size: 2, color: "#ffe66d", layer: 1 },
  { x: 92, y: 22, size: 2, color: "#f0f7e6", layer: 2, delay: "0.9s" },
  { x: 96, y: 78, size: 3, color: "#4ecdc4", layer: 0 },
  { x: 6, y: 89, size: 2, color: "#f0f7e6", layer: 1 },
  { x: 14, y: 6, size: 2, color: "#ffe66d", layer: 2, twinkle: true },
  { x: 21, y: 39, size: 3, color: "#f0f7e6", layer: 0 },
  { x: 29, y: 92, size: 2, color: "#4ecdc4", layer: 1, delay: "1.5s" },
  { x: 36, y: 63, size: 2, color: "#f0f7e6", layer: 2 },
  { x: 44, y: 87, size: 3, color: "#ffe66d", layer: 0, twinkle: true },
  { x: 52, y: 13, size: 2, color: "#f0f7e6", layer: 1 },
  { x: 59, y: 45, size: 2, color: "#4ecdc4", layer: 2 },
  { x: 66, y: 91, size: 2, color: "#f0f7e6", layer: 0, delay: "2.1s" },
  { x: 73, y: 55, size: 3, color: "#ffe66d", layer: 1 },
  { x: 81, y: 88, size: 2, color: "#f0f7e6", layer: 2, twinkle: true },
  { x: 89, y: 5, size: 2, color: "#4ecdc4", layer: 0 },
  { x: 94, y: 51, size: 3, color: "#f0f7e6", layer: 1, delay: "0.3s" },
  { x: 2, y: 47, size: 2, color: "#ffe66d", layer: 2 },
  { x: 98, y: 34, size: 2, color: "#f0f7e6", layer: 0, twinkle: true },
]

function getStarStyle(star: SpaceStar): CSSProperties {
  return {
    top: `${star.y}%`,
    left: `${star.x}%`,
    width: star.size,
    height: star.size,
    backgroundColor: star.color,
    animationDelay: star.delay,
  }
}

export function SpaceBackdrop({ className }: SpaceBackdropProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-[#0a0a1f]",
        className
      )}
      aria-hidden="true"
    >
      <style>{`
        @keyframes sq-space-twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes sq-space-drift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(34px, -22px, 0); }
        }

        @keyframes sq-space-bob {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }

        @keyframes sq-space-spin {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }

        @keyframes sq-space-orbit {
          0% { transform: translate3d(-12vw, 0, 0); }
          50% { transform: translate3d(50vw, 5vh, 0); }
          100% { transform: translate3d(115vw, -2vh, 0); }
        }

        @keyframes sq-space-wander {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-52px, -34px, 0); }
          50% { transform: translate3d(-110px, 8px, 0); }
          75% { transform: translate3d(-48px, 44px, 0); }
        }

        @keyframes sq-space-planet {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-46px, 28px, 0); }
          50% { transform: translate3d(-84px, -8px, 0); }
          75% { transform: translate3d(-38px, -36px, 0); }
        }

        @keyframes sq-space-shoot {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          4% { opacity: 1; }
          14% { transform: translate3d(42vw, 14vh, 0); opacity: 0; }
          100% { transform: translate3d(42vw, 14vh, 0); opacity: 0; }
        }

        .sq-space-twinkle {
          animation: sq-space-twinkle 4s ease-in-out infinite;
        }

        .sq-space-drift-slow {
          animation: sq-space-drift 26s ease-in-out infinite alternate;
        }

        .sq-space-drift-slower {
          animation: sq-space-drift 38s ease-in-out infinite alternate-reverse;
        }

        .sq-space-bob {
          animation: sq-space-bob 5s ease-in-out infinite;
        }

        .sq-space-spin {
          animation: sq-space-spin 12s ease-in-out infinite;
        }

        .sq-space-orbit {
          animation: sq-space-orbit 70s linear infinite;
        }

        .sq-space-wander {
          animation: sq-space-wander 36s ease-in-out infinite;
        }

        .sq-space-planet {
          animation: sq-space-planet 48s ease-in-out infinite;
        }

        .sq-space-shoot {
          animation: sq-space-shoot 11s linear infinite;
        }

        .sq-space-shoot-late {
          animation: sq-space-shoot 17s linear infinite;
          animation-delay: 6s;
        }
      `}</style>

      {[0, 1, 2].map((layer) => (
        <div
          key={layer}
          className="absolute inset-0"
          style={{
            animation: `sq-space-drift ${40 + layer * 14}s ease-in-out infinite alternate`,
          }}
        >
          {SPACE_STARS.filter((star) => star.layer === layer).map((star) => (
            <span
              key={`${star.x}-${star.y}`}
              className={cn(
                "absolute block",
                star.twinkle || star.delay ? "sq-space-twinkle" : null
              )}
              style={getStarStyle(star)}
            />
          ))}
        </div>
      ))}

      <div className="sq-space-planet absolute top-[12%] right-[8%] h-14 w-16">
        <div className="absolute top-6 left-1/2 h-2 w-[52px] -translate-x-1/2 -rotate-[18deg] border-[4px] border-[#342414] bg-[#8a5fae]" />
        <div className="absolute top-3 left-1/2 size-7 -translate-x-1/2 border-[4px] border-[#342414] bg-[#b07ab0]" />
      </div>

      <div className="sq-space-drift-slow absolute bottom-[16%] left-[9%] size-[14px] border-[3px] border-[#342414] bg-[#d9d9c9]" />

      <div className="sq-space-orbit absolute top-[14%] left-0">
        <div className="sq-space-spin relative h-5 w-[46px]">
          <div className="absolute top-1 left-0 h-1.5 w-3.5 border-2 border-[#342414] bg-[#4466aa]" />
          <div className="absolute top-0 left-1/2 h-3.5 w-2.5 -translate-x-1/2 border-2 border-[#342414] bg-[#c0c0c8]" />
          <div className="absolute top-1 right-0 h-1.5 w-3.5 border-2 border-[#342414] bg-[#4466aa]" />
        </div>
      </div>

      <div className="sq-space-shoot absolute top-[8%] left-[4%] h-[2px] w-[10px] bg-[#f0f7e6]" />
      <div className="sq-space-shoot-late absolute top-[30%] left-[36%] h-[2px] w-[10px] bg-[#dff7ff]" />

      <div className="sq-space-wander absolute right-[10%] bottom-[12%]">
        {/* Decorative pixel sprite should render as a raw img. */}
        <img
          src="/map-assets/startup-robot-monster.png"
          alt=""
          width={64}
          height={64}
          className="sq-space-bob h-16 w-16 opacity-95 [image-rendering:pixelated]"
        />
      </div>
    </div>
  )
}
