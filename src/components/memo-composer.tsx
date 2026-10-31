"use client";

import { useState, useTransition } from "react";
import { postAccountUpdateAction } from "@/lib/admin-create";
import { buttonClasses } from "@/components/ui";

export function MemoComposer({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ error?: string; success?: string }>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function post() {
    startTransition(async () => {
      const result = await postAccountUpdateAction(accountId, title, body);
      setMsg(result);
      if (result.success) {
        setTitle("");
        setBody("");
      }
    });
  }

  return (
    <div className="space-y-3 px-5 py-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Subject (e.g. Hold placed on check #1042)"
        className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Write the memo as the bank would write it to the customer…"
        className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
      />
      {msg.error && <p className="text-xs text-red-600">{msg.error}</p>}
      {msg.success && <p className="text-xs text-emerald-600">{msg.success}</p>}
      <button onClick={post} disabled={pending} className={buttonClasses("primary")}>
        {pending ? "Posting…" : "Post secure message"}
      </button>
    </div>
  );
}
