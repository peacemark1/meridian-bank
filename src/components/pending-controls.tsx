"use client";

import { useTransition } from "react";
import { postPendingNowAction, declinePendingAction } from "@/lib/pending-actions";
import { buttonClasses } from "@/components/ui";

export function PendingControls({ transactionId }: { transactionId: string }) {
  const [pending, startTransition] = useTransition();

  function postNow() {
    startTransition(async () => {
      await postPendingNowAction(transactionId);
    });
  }
  function decline() {
    if (!window.confirm("Decline this pending item? It will not post.")) return;
    startTransition(async () => {
      await declinePendingAction(transactionId);
    });
  }

  return (
    <div className="flex gap-2">
      <button onClick={postNow} disabled={pending} className={buttonClasses("gold") + " !px-3 !py-1 text-xs"}>
        Post now
      </button>
      <button onClick={decline} disabled={pending} className={buttonClasses("ghost") + " !px-3 !py-1 text-xs"}>
        Decline
      </button>
    </div>
  );
}
