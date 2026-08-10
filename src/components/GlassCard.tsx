import type { ElementType, ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Small stat-card tier: cheaper blur, tighter radius. Use for dense grids of many cards. */
  size?: "default" | "sm";
  as?: ElementType;
}

/**
 * The app's frosted-glass surface. `size="sm"` exists for grids with many
 * simultaneous cards (ResultCards) — a lighter blur radius there keeps
 * paint cost down without dropping the effect.
 */
export function GlassCard({ children, className = "", size = "default", as: Component = "div" }: GlassCardProps) {
  const glassClass = size === "sm" ? "glass-panel-sm" : "glass-panel";
  return <Component className={`${glassClass} ${className}`}>{children}</Component>;
}
