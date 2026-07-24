"use client";

import { useEffect, useRef, useState } from "react";

/** Typewriter stream — letter by letter with optional cursor. */
export function useStreamText(
  fullText: string,
  enabled: boolean,
  opts: { chunk?: number; delayMs?: number } = {},
) {
  const chunk = opts.chunk ?? 2;
  const delayMs = opts.delayMs ?? 16;
  const [text, setText] = useState(enabled ? "" : fullText);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setText(fullText);
      setDone(true);
      return;
    }
    setText("");
    setDone(false);
    let index = 0;
    const timer = window.setInterval(() => {
      index = Math.min(fullText.length, index + chunk);
      setText(fullText.slice(0, index));
      if (index >= fullText.length) {
        window.clearInterval(timer);
        setDone(true);
      }
    }, delayMs);
    return () => window.clearInterval(timer);
  }, [fullText, enabled, chunk, delayMs]);

  return { text, done };
}

/** Render **bold** markers in analyst prose. */
export function AnalystRichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="analyst-rich__bold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Preserve line breaks from fixture answers. */
export function AnalystRichBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="analyst-rich">
      {lines.map((line, i) =>
        line.trim() === "" ? (
          <br key={i} />
        ) : (
          <p key={i} className="analyst-rich__line">
            <AnalystRichText text={line} />
          </p>
        ),
      )}
    </div>
  );
}

export function StreamingAnalystMessage({
  fullText,
  onComplete,
}: {
  fullText: string;
  onComplete?: () => void;
}) {
  const { text, done } = useStreamText(fullText, true);
  const completedRef = useRef(false);

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [done, onComplete]);

  return (
    <div className="analyst-rich analyst-rich--streaming">
      <AnalystRichBlock text={text} />
      {!done ? <span className="analyst-stream-cursor" aria-hidden /> : null}
    </div>
  );
}
