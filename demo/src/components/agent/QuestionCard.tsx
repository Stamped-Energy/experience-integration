"use client";
/** A question the agent asks a person. Shows why, what waits on it, quick answers with what the agent will do next, and after answering what changed. Illustrative: nothing is written. */
import Link from "next/link";
import { useState } from "react";
import type { Question } from "@/lib/demo/agent";
import { Assign } from "./Assign";

export interface QView { q: Question; owner: string; line?: string; asked: string; due?: string; answeredAt?: string }

export function QuestionCard({ v, canAnswer, canAssign, me, people, assignee }: { v: QView; canAnswer: boolean; canAssign: boolean; me: string; people: string[]; assignee?: { to: string; by: string } }) {
  const { q } = v;
  const [pick, setPick] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"" | "text" | "photo" | "else">("");
  const [done, setDone] = useState<string | null>(null);
  const chosen = q.answers.find((a) => a.id === pick);
  const answered = q.answered;
  return (
    <article className={`card qcard${q.abnormal ? " q-abn" : ""}`} data-answered={!!answered || !!done}>
      <div className="card-head">
        <span className="src">Agent question</span><span className="dotsep">·</span><span>{q.type}</span>
        {v.line ? <><span className="dotsep">·</span><span>{v.line}</span></> : null}
        <span className="right">
          {q.abnormal ? <span className="tag tag-critical">Abnormal</span> : null}
          {answered || done ? <span className="tag tag-success">Answered</span> : <span className={`tag${q.urgency === "High" ? " tag-accent" : ""}`}>{q.urgency}</span>}
          {q.plantWide ? <span className="tag">Plant-wide</span> : null}
          {!answered && !done && v.due ? <span className="muted">needed {v.due}</span> : null}
        </span>
      </div>
      <div className="card-body">
        <div className="card-block">
          <h3 className="card-title">{q.title}</h3>
          <p className="card-obs">{q.why}</p>
          <ul className="ex-ev">{q.evidence.map((e) => <li key={e.text}><span className="tag">{e.label}</span><span>{e.text}{e.id ? <span className="mono muted"> · {e.id}</span> : null}</span></li>)}</ul>
        </div>
        <div className="q-waits">
          <span className="label">Waiting on your answer</span>
          <span><Link className="link" href={q.waits.href}>{q.waits.text}</Link>. {q.meanwhile}</span>
        </div>
        {answered ? (
          <div className="q-effect">
            <span className="label">Answer from {answered.person}, {v.answeredAt}</span>
            <b>{answered.answer}</b>
            <span>What it changed: {answered.changed}</span>
            <Link className="link" href={answered.unblocked.href}>{answered.unblocked.text}</Link>
          </div>
        ) : done ? (
          <div className="q-effect" role="status">
            <span className="label">Your answer</span><b>{done}</b>
            <span>{chosen?.then ?? "I add your words to the record and tell the owner what changed."} Illustrative: nothing was written.</span>
            <button type="button" className="btn btn-sm btn-quiet" style={{ alignSelf: "flex-start" }} onClick={() => { setDone(null); setPick(null); setMode(""); }}>Undo</button>
          </div>
        ) : (
          <div className="q-answer">
            <div className="q-opts" role="radiogroup" aria-label="Quick answers">
              {q.answers.map((a) => <button key={a.id} type="button" role="radio" aria-checked={pick === a.id} className={`q-opt${pick === a.id ? " on" : ""}`} disabled={!canAnswer} onClick={() => { setPick(a.id); setMode(""); }}>{a.label}</button>)}
            </div>
            <div className="q-more">
              <button type="button" className="link-btn" disabled={!canAnswer} onClick={() => { setMode("text"); setPick(null); }}>Something else</button>
              {q.photo ? <button type="button" className="link-btn" disabled={!canAnswer} onClick={() => { setMode("photo"); setPick(null); }}>Add a photo</button> : null}
              <button type="button" className="link-btn" disabled={!canAnswer} onClick={() => { setMode("else"); setPick(null); }}>I don't know, ask someone else</button>
            </div>
            {mode === "text" ? <textarea className="q-text" rows={2} placeholder="Type your answer" value={text} onChange={(e) => setText(e.target.value)} /> : null}
            {mode === "photo" ? <div className="q-photo"><span className="q-photo-box" aria-hidden>+</span><span>{q.photo}. Demo only: the photo is not uploaded.</span></div> : null}
            {mode === "else" ? <p className="q-then">I will ask the next person in the routing for this question and tell you who answered.</p> : null}
            {chosen ? <p className="q-then"><span className="label">If you say "{chosen.label}"</span>{chosen.then}</p> : null}
            {!canAnswer ? <p className="muted" style={{ margin: 0, fontSize: 12 }}>Sent to the {v.owner.toLowerCase()}. You can see it but not answer it.</p> : null}
          </div>
        )}
      </div>
      <div className="card-foot">
        <span className="muted" style={{ fontSize: 12 }}>Sent to {v.owner} · asked {v.asked}{q.askedBy ? ` · raised by ${q.askedBy} events` : ""}</span>
        <Assign initial={assignee} people={people} canAssign={canAssign} by={me} />
        <span className="spacer" />
        {!answered && !done && canAnswer ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={!chosen && !(mode === "text" && text) && mode !== "photo" && mode !== "else"}
            onClick={() => setDone(chosen?.label ?? (mode === "text" ? text : mode === "photo" ? "Photo sent" : "Asked someone else"))}>Send answer</button>
        ) : null}
      </div>
    </article>
  );
}
