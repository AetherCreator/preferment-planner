"use client";

import { useMemo, useState } from "react";
import { planBake, type BakeStep } from "@/lib/engine";

const FLAVORS = ["poolish", "biga", "levain"] as const;

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const [flavor, setFlavor] = useState<string>("levain");
  const [roomTempF, setRoomTempF] = useState<number>(72);

  const targetISO = useMemo(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    []
  );

  const steps: BakeStep[] = useMemo(
    () => planBake(targetISO, roomTempF, flavor, "bread"),
    [targetISO, roomTempF, flavor]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Preferment Planner
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Backwards-planned fermentation timeline from your target bake time.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <label className="flex flex-col text-sm text-zinc-700 dark:text-zinc-300">
            Preferment
            <select
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              className="mt-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
            >
              {FLAVORS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-zinc-700 dark:text-zinc-300">
            Room temp (°F)
            <input
              type="number"
              value={roomTempF}
              onChange={(e) => setRoomTempF(Number(e.target.value) || 72)}
              className="mt-1 w-28 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
            />
          </label>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-medium text-black dark:text-zinc-50">
            Fermentation Timeline
          </h2>
          <ol className="mt-4 border-l border-zinc-300 dark:border-zinc-700">
            {steps.map((s, i) => (
              <li key={i} className="relative pl-6 pb-6 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                  {fmt(s.iso)}
                </div>
                <div className="text-base text-black dark:text-zinc-100">
                  {s.action}
                  {s.durationMin > 0 && (
                    <span className="ml-2 text-sm text-zinc-500">
                      ({s.durationMin} min)
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
