"use client";

import { useState } from "react";
import { scanPaste } from "@/app/actions";
import type { Demo } from "@/lib/demos";
import type { WebHighlight, WebScan } from "@/lib/run-scan";

const VERDICT_LABEL: Record<WebScan["verdict"], string> = {
  scam: "Scam",
  risky: "Risky",
  unclear: "Unclear",
  looks_ok: "Looks ok",
};

const VERDICT_NOTE: Record<WebScan["verdict"], string> = {
  scam: "A hard rule fired. The Canada list treats this pattern as a scam.",
  risky: "Soft signals only. This is not proof of a scam, and it is not a clean bill.",
  unclear: "No hard hit and no green flags. A quiet message is not a safe one.",
  looks_ok: "A .ca address, an interview, and a careers or jobs link, with no rule hit.",
};

function segments(text: string, highlights: WebHighlight[]) {
  const owners: string[][] = Array.from({ length: text.length }, () => []);
  for (const hit of highlights) {
    const end = Math.min(hit.end, text.length);
    for (let index = Math.max(0, hit.start); index < end; index += 1) {
      if (!owners[index].includes(hit.rule_id)) owners[index].push(hit.rule_id);
    }
  }
  const parts: { text: string; ruleIds: string[] }[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const key = owners[cursor].join("\n");
    let next = cursor + 1;
    while (next < text.length && owners[next].join("\n") === key) next += 1;
    parts.push({ text: text.slice(cursor, next), ruleIds: owners[cursor] });
    cursor = next;
  }
  return parts;
}

export function Checker({ demos }: { demos: Demo[] }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<WebScan | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function check(next = text) {
    setBusy(true);
    setError("");
    setResult(null);
    const response = await scanPaste(next);
    setBusy(false);
    if (response.error) {
      setResult(null);
      setError(response.error);
      return;
    }
    setResult(response.result ?? null);
  }

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        void check();
      }}
    >
      <label htmlFor="message">Job message</label>
      <textarea
        id="message"
        name="message"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste the posting, email, or chat here."
      />
      <div className="row">
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Check"}
        </button>
        {demos.map((demo) => (
          <button
            key={demo.id}
            className="demo"
            type="button"
            disabled={busy}
            onClick={() => {
              setText(demo.text);
              void check(demo.text);
            }}
          >
            {demo.label}
          </button>
        ))}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {result ? <Result text={text} result={result} /> : null}
    </form>
  );
}

function Result({ text, result }: { text: string; result: WebScan }) {
  const parts = segments(text, result.highlights);
  return (
    <section className="result" aria-live="polite">
      <div className={`verdict ${result.verdict}`}>
        <strong>{VERDICT_LABEL[result.verdict]}</strong>
        <span>Score {result.score}</span>
      </div>
      <p className="note">{VERDICT_NOTE[result.verdict]}</p>
      <p className="message">
        {parts.map((part, index) =>
          part.ruleIds.length > 0 ? (
            <mark key={index} title={part.ruleIds.join(", ")}>
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
      {result.rules.hits.length > 0 ? (
        <ul className="hits">
          {result.rules.hits.map((id) => (
            <li key={id}>
              <code>{id}</code>
              {result.sources[id] ? (
                <>
                  {" "}
                  <a href={result.sources[id]} target="_blank" rel="noreferrer">
                    source
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">No rule fired.</p>
      )}
      <p className="disclaimer">{result.disclaimer}</p>
    </section>
  );
}
