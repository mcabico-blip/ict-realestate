"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Client-side presence tracker. Mounted globally (from RootLayout) for any
 * signed-in user. Behaviors:
 *
 * 1. Sends POST /api/presence/heartbeat every 60s — but only while:
 *    - The tab is visible (document.visibilityState === "visible")
 *    - The window has focus
 *    - There's been user activity (mousemove/keydown/touchstart) in the
 *      last 3 minutes
 *
 * 2. After 4 minutes of no activity, shows a soft "Still there?" prompt.
 *    Clicking it counts as activity. Otherwise, heartbeats stop until they
 *    interact again, and the user falls offline.
 *
 * This makes "online" mean "really at the keyboard, available to chat now"
 * — not just "has a tab open in the background since yesterday."
 */
export function PresenceTracker() {
  const { status } = useSession();
  const lastActivityRef = useRef<number>(Date.now());
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const ACTIVITY_WINDOW_MS = 3 * 60 * 1000; // count as "active" if input within last 3 min
    const IDLE_PROMPT_AFTER_MS = 4 * 60 * 1000; // show "still there?" after 4 min of no input
    const HEARTBEAT_INTERVAL_MS = 60 * 1000;

    const markActive = () => {
      lastActivityRef.current = Date.now();
      setShowIdlePrompt(false);
    };

    // Hook up activity listeners — passive so we don't tax scrolling
    const events: (keyof DocumentEventMap)[] = [
      "mousemove",
      "keydown",
      "touchstart",
      "click",
      "scroll",
    ];
    events.forEach((ev) => document.addEventListener(ev, markActive, { passive: true }));
    window.addEventListener("focus", markActive);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") markActive();
    });

    const heartbeat = async () => {
      const visible = document.visibilityState === "visible";
      const focused = document.hasFocus();
      const activeRecently = Date.now() - lastActivityRef.current < ACTIVITY_WINDOW_MS;
      if (!visible || !focused || !activeRecently) return;
      try {
        await fetch("/api/presence/heartbeat", { method: "POST" });
      } catch {
        // swallow — best-effort
      }
    };

    // Immediate heartbeat + interval
    heartbeat();
    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

    // Idle check — every 30s, see if we should prompt
    const idleCheck = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor > IDLE_PROMPT_AFTER_MS && document.visibilityState === "visible") {
        setShowIdlePrompt(true);
      }
    }, 30 * 1000);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, markActive));
      window.removeEventListener("focus", markActive);
      clearInterval(interval);
      clearInterval(idleCheck);
    };
  }, [status]);

  if (!showIdlePrompt) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2">
      <p className="font-semibold text-sm text-gray-900 mb-1">Still there?</p>
      <p className="text-xs text-gray-600 mb-3">
        We&apos;ll show you as offline if you don&apos;t respond. Other users won&apos;t
        be able to chat with you while you&apos;re away.
      </p>
      <button
        onClick={() => {
          lastActivityRef.current = Date.now();
          setShowIdlePrompt(false);
          // Send an immediate heartbeat
          fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
        }}
        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Yes, I&apos;m here
      </button>
    </div>
  );
}
