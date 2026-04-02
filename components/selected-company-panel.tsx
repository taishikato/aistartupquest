"use client"

import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpRight,
  MapPin,
} from "lucide-react"

import type { Company } from "@/lib/company"
import { cn } from "@/lib/utils"
import {
  CompanyCategoryTag,
  CompanyLogoBadge,
} from "@/components/company-identity"

export type SelectedCompanyPanelProps = {
  company: Company
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function SelectedCompanyPanel({
  company,
  collapsed,
  onToggleCollapsed,
}: SelectedCompanyPanelProps) {
  return (
    <aside
      className={cn(
        "hidden h-full min-h-0 overflow-hidden border-r-3 border-[#1a1a2e] bg-[#151527] text-[#f0f7e6] lg:flex",
        collapsed ? "w-14 flex-col items-center py-5" : "flex-col"
      )}
    >
      {collapsed ? (
        <div className="flex h-full w-full flex-col items-center gap-3 px-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand selected company panel"
            className="inline-flex size-10 items-center justify-center border-2 border-[#3a3a5e] bg-[#23233b] text-[#4ecdc4] transition-colors hover:border-[#4ecdc4] hover:bg-[#4ecdc4] hover:text-[#1a1a2e]"
          >
            <ArrowRightToLine className="size-4" />
          </button>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="font-(family-name:--font-pixel) text-[8px] tracking-[0.24em] text-[#ffe66d] [writing-mode:vertical-rl]">
              ENCOUNTER
            </div>
            <CompanyLogoBadge company={company} compact />
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col p-5">
          <div className="flex items-center justify-between border-2 border-[#3a3a5e] bg-[#23233b] px-3 py-2">
            <span className="font-(family-name:--font-pixel) text-[8px] tracking-[0.24em] text-[#ffe66d] uppercase">
              Encounter
            </span>
            <div className="flex items-center gap-2">
              <span className="font-(family-name:--font-pixel) text-[7px] tracking-[0.2em] text-[#4ecdc4] uppercase">
                Selected company
              </span>
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse selected company panel"
                className="inline-flex size-7 items-center justify-center border-2 border-[#3a3a5e] bg-[#1a1a2e] text-[#4ecdc4] transition-colors hover:border-[#4ecdc4] hover:bg-[#4ecdc4] hover:text-[#1a1a2e]"
              >
                <ArrowLeftToLine className="size-3.5" />
              </button>
            </div>
          </div>

          <div
            key={company.slug}
            className="selected-company-panel mt-4 flex min-h-0 flex-1 flex-col overflow-hidden border-2 border-[#3a3a5e] bg-[#1a1a2e]"
          >
            <div className="border-b-2 border-[#3a3a5e] bg-[#23233b] px-4 py-3">
              <div className="flex items-center gap-2">
                <CompanyCategoryTag company={company} filled />
                {company.mapSprite === "boss" ? (
                  <span className="font-(family-name:--font-pixel) text-[8px] tracking-[0.18em] text-[#ff8a4c] uppercase">
                    Boss encounter
                  </span>
                ) : null}
              </div>
            </div>

            <div className="selected-company-stage flex flex-1 flex-col justify-between overflow-hidden px-5 py-6">
              <div className="selected-company-intro flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-(family-name:--font-pixel) text-[8px] tracking-[0.22em] text-[#4ecdc4] uppercase">
                    On the board
                  </div>
                  <h2 className="mt-3 text-[30px] leading-[1.05] font-bold tracking-tight text-[#f0f7e6]">
                    {company.name}
                  </h2>
                </div>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${company.name}`}
                  className="inline-flex size-10 shrink-0 items-center justify-center border-2 border-[#3a3a5e] bg-[#23233b] text-[#4ecdc4] transition-colors hover:border-[#4ecdc4] hover:bg-[#4ecdc4] hover:text-[#1a1a2e]"
                >
                  <ArrowUpRight className="size-4" />
                </a>
              </div>

              <div className="selected-company-figure mt-6 flex flex-1 items-center justify-center">
                <div
                  className={cn(
                    "relative flex h-full w-full max-w-[320px] flex-col items-center justify-center",
                    company.mapSprite === "boss" &&
                      "selected-company-figure-boss"
                  )}
                >
                  <div className="selected-company-ring absolute top-1/2 left-1/2 size-[220px] -translate-x-1/2 -translate-y-1/2 border border-[#4ecdc4]/30" />
                  <div className="selected-company-ring selected-company-ring-delayed absolute top-1/2 left-1/2 size-[170px] -translate-x-1/2 -translate-y-1/2 border border-[#ffe66d]/25" />
                  <div className="selected-company-sprite relative z-10 flex flex-col items-center">
                    <div className="border-2 border-[#4a4a72] bg-[#23233b] p-4 shadow-[6px_6px_0px_rgba(26,26,46,0.9)]">
                      <CompanyLogoBadge company={company} large />
                    </div>
                    <div className="mt-3 h-3 w-28 bg-[#0f1020]/60 shadow-[0_0_0_1px_rgba(78,205,196,0.12)]" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="line-clamp-4 text-sm leading-6 text-[#f0f7e6]/78">
                  {company.shortDescription}
                </p>

                <div className="grid gap-3 border-t-2 border-[#3a3a5e] pt-4">
                  <div className="flex items-start gap-2 text-sm text-[#f0f7e6]/72">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#4ecdc4]" />
                    <span>{company.locationLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-[#f0f7e6]/72">
                    <span className="font-(family-name:--font-pixel) text-[8px] tracking-[0.18em] text-[#ffe66d] uppercase">
                      Founded
                    </span>
                    <span>{company.founded}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-[#f0f7e6]/72">
                    <span className="font-(family-name:--font-pixel) text-[8px] tracking-[0.18em] text-[#ffe66d] uppercase">
                      Source
                    </span>
                    <a
                      href={company.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4ecdc4] underline-offset-2 hover:underline"
                    >
                      View reference
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .selected-company-panel {
          animation: selected-company-enter 220ms ease-out;
        }

        .selected-company-stage {
          background:
            linear-gradient(
              180deg,
              rgba(33, 36, 62, 0.96) 0%,
              rgba(26, 26, 46, 1) 48%,
              rgba(20, 19, 36, 1) 100%
            ),
            repeating-linear-gradient(
              0deg,
              rgba(78, 205, 196, 0.05) 0,
              rgba(78, 205, 196, 0.05) 1px,
              transparent 1px,
              transparent 28px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(78, 205, 196, 0.05) 0,
              rgba(78, 205, 196, 0.05) 1px,
              transparent 1px,
              transparent 28px
            );
        }

        .selected-company-sprite {
          animation: selected-company-pop 260ms ease-out;
        }

        .selected-company-ring {
          animation: selected-company-ring 2.2s ease-in-out infinite;
        }

        .selected-company-ring-delayed {
          animation-delay: 0.45s;
        }

        .selected-company-figure-boss .selected-company-ring {
          border-color: rgba(255, 138, 76, 0.3);
        }

        @keyframes selected-company-enter {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes selected-company-pop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes selected-company-ring {
          0%,
          100% {
            opacity: 0.45;
            transform: translate(-50%, -50%) scale(0.96);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.03);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .selected-company-panel,
          .selected-company-sprite,
          .selected-company-ring {
            animation: none !important;
          }
        }
      `}</style>
    </aside>
  )
}
