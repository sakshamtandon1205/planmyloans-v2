"use client";

import { useState } from "react";
import { ControlPanelFields } from "./ControlPanel";
import type { CalculatorInputs } from "./calculatorTypes";

interface MobileInputSheetProps {
  inputs: CalculatorInputs;
  onInputChange: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
  corpus: number;
  corpusLabel: string;
  displayHorizon: number;
  onHorizonChange: (value: number) => void;
  onReset: () => void;
}

/**
 * Mobile-only bottom sheet for the planner's inputs: fixed to the viewport
 * bottom, collapsed to just its drag-handle by default, expands upward on
 * tap. Renders the exact same `ControlPanelFields` as the desktop sidebar —
 * only the surrounding chrome (fixed position, handle, transform) differs.
 */
export function MobileInputSheet({ onReset, ...fields }: MobileInputSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 transition-transform duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
      style={{ transform: open ? "translateY(0)" : "translateY(calc(100% - 58px))" }}
    >
      <div className="glass-panel mx-auto flex max-h-[78vh] w-full max-w-6xl flex-col rounded-b-none rounded-t-[20px] border-b-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-col items-center gap-2.5 pb-1.5 pt-3"
        >
          <span className="h-1 w-[38px] rounded-full bg-line-2" />
          <span className="font-heading text-[14px] font-bold text-ink">Edit inputs {open ? "▼" : "▲"}</span>
        </button>
        <div className="overflow-y-auto px-5 pb-6 pt-1.5">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="rounded-sm border border-line bg-surface-2 px-3 py-1.5 text-body-sm font-medium text-ink-2 transition-colors hover:border-indigo hover:bg-indigo-soft hover:text-indigo"
            >
              Reset
            </button>
          </div>
          <ControlPanelFields {...fields} />
        </div>
      </div>
    </div>
  );
}
