"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SocketState = "idle" | "connecting" | "open" | "closed";

/**
 * A WebSocket that reconnects on its own (1s, 2s, 4s … up to 15s) and reports its state.
 * `onOpen` runs on every (re)connect, so callers can re-sync anything missed while offline.
 * A close code of 4401 (bad token) stops retrying.
 */
export function useSocket(
  url: string | null,
  handlers: { onMessage: (data: Record<string, unknown>) => void; onOpen?: () => void; onAuthFail?: () => void },
) {
  const [state, setState] = useState<SocketState>("idle");
  const ws = useRef<WebSocket | null>(null);
  const h = useRef(handlers);
  const queue = useRef<string[]>([]);

  useEffect(() => {
    h.current = handlers;
  });

  useEffect(() => {
    if (!url) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = () => {
      setState("connecting");
      const sock = new WebSocket(url);
      ws.current = sock;
      sock.onopen = () => {
        tries = 0;
        setState("open");
        h.current.onOpen?.();
        for (const m of queue.current.splice(0)) sock.send(m);
      };
      sock.onmessage = (e) => {
        try {
          h.current.onMessage(JSON.parse(e.data));
        } catch {
          /* ignore malformed frames */
        }
      };
      sock.onclose = (e) => {
        if (ws.current === sock) ws.current = null;
        if (stopped) return;
        setState("closed");
        if (e.code === 4401) {
          h.current.onAuthFail?.();
          return;
        }
        timer = setTimeout(connect, Math.min(15000, 1000 * 2 ** tries++));
      };
    };

    // Reconnect straight away when the tab comes back or the network returns.
    const kick = () => {
      if (!ws.current && !stopped) {
        clearTimeout(timer);
        tries = 0;
        connect();
      }
    };
    connect();
    window.addEventListener("online", kick);
    document.addEventListener("visibilitychange", kick);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("online", kick);
      document.removeEventListener("visibilitychange", kick);
      ws.current?.close();
      ws.current = null;
      setState("idle");
    };
  }, [url]);

  /** Send now, or queue until the socket is back. Messages are queued; typing signals are not. */
  const send = useCallback((data: Record<string, unknown>, queueIfOffline = true) => {
    const text = JSON.stringify(data);
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(text);
    else if (queueIfOffline) queue.current.push(text);
  }, []);

  return { state, send };
}
