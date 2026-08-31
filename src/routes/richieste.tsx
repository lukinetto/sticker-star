import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getState, createRequest } from "@/lib/bollini.functions";

const stateQuery = queryOptions({
  queryKey: ["bollini-state"],
  queryFn: () => getState(),
});

export const Route = createFileRoute("/richieste")({
  loader: ({ context }) => context.queryClient.ensureQueryData(stateQuery),
  head: () => ({
    meta: [
      { title: "Le mie richieste — Bollini" },
      {
        name: "description",
        content:
          "Dichiara quello che hai fatto per guadagnare bollini e chiedi di spenderli per un premio.",
      },
      { property: "og:title", content: "Le mie richieste — Bollini" },
      {
        property: "og:description",
        content: "Richiedi bollini per le cose fatte bene e chiedi i premi che vuoi.",
      },
    ],
  }),
  errorComponent: () => <div className="p-10 text-center">Ops, riprova tra poco.</div>,
  component: Richieste,
});

function Richieste() {
  const { data } = useSuspenseQuery(stateQuery);
  const qc = useQueryClient();
  const send = useServerFn(createRequest);

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pending = data.requests.filter((r) => r.status === "pending");
  const decided = data.requests.filter((r) => r.status !== "pending").slice(0, 10);
  const isPending = (kind: "earn" | "spend", label: string) =>
    pending.some((r) => r.kind === kind && r.label === label);

  async function ask(kind: "earn" | "spend", refId: string, label: string) {
    setBusy(refId);
    try {
      const res = await send({ data: { kind, refId, ...(note.trim() ? { note: note.trim() } : {}) } });
      setToast(
        res.ok
          ? kind === "earn"
            ? `Richiesta inviata: ${label} ✋`
            : `Hai chiesto: ${label} 🎁`
          : "Questa richiesta è già in attesa!",
      );
      setNote("");
      await qc.invalidateQueries({ queryKey: ["bollini-state"] });
    } catch {
      setToast("Non è riuscita, riprova!");
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 2600);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Le richieste di
          </p>
          <h1 className="text-4xl font-extrabold text-foreground">{data.childName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sunny px-4 py-2 font-display text-lg font-bold text-sunny-foreground">
            {data.points} 🏅
          </span>
          <Link
            to="/"
            className="btn-pop btn-pop-hover border-2 border-border bg-card text-sm text-muted-foreground"
          >
            Bacheca
          </Link>
        </div>
      </header>

      {toast && (
        <div className="card-pop mt-5 bg-mint/60 px-5 py-3 font-display text-lg font-bold text-mint-foreground">
          {toast}
        </div>
      )}

      <section className="card-pop mt-6 p-6">
        <h2 className="text-2xl font-bold">Ho fatto una cosa da bravi! ✋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tocca quello che hai fatto: mamma o papà lo controlleranno e ti daranno i bollini.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-semibold">Vuoi aggiungere un messaggio? (facoltativo)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. Ho fatto anche il letto!"
            className="mt-1 w-full rounded-xl border-2 border-input bg-background px-3 py-2 outline-none focus:border-ring"
          />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.actions.map((a) => {
            const waiting = isPending("earn", a.label);
            return (
              <button
                key={a.id}
                disabled={waiting || busy === a.id}
                onClick={() => ask("earn", a.id, a.label)}
                className={`btn-pop btn-pop-hover flex items-center gap-3 text-left ${
                  waiting ? "cursor-not-allowed bg-secondary text-secondary-foreground opacity-70" : "bg-mint text-mint-foreground"
                }`}
              >
                <span className="text-3xl">{a.emoji}</span>
                <span className="flex-1 font-semibold leading-tight">
                  {a.label}
                  {waiting && <span className="block text-xs font-bold uppercase">in attesa…</span>}
                </span>
                <span className="font-display text-lg font-extrabold">+{a.points}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-pop mt-6 p-6">
        <h2 className="text-2xl font-bold">Vorrei spendere i bollini 🎁</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Scegli un premio: la richiesta arriva ai genitori, che dicono sì o no.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.rewards.map((r) => {
            const waiting = isPending("spend", r.label);
            const enough = data.points >= r.cost;
            return (
              <button
                key={r.id}
                disabled={waiting || !enough || busy === r.id}
                onClick={() => ask("spend", r.id, r.label)}
                className={`btn-pop flex items-center gap-3 text-left ${
                  waiting || !enough
                    ? "cursor-not-allowed bg-secondary text-secondary-foreground opacity-70"
                    : "btn-pop-hover bg-sunny text-sunny-foreground"
                }`}
              >
                <span className="text-3xl">{r.emoji}</span>
                <span className="flex-1 font-semibold leading-tight">
                  {r.label}
                  {waiting ? (
                    <span className="block text-xs font-bold uppercase">in attesa…</span>
                  ) : !enough ? (
                    <span className="block text-xs font-bold uppercase">
                      ti mancano {r.cost - data.points} bollini
                    </span>
                  ) : null}
                </span>
                <span className="font-display text-lg font-extrabold">−{r.cost}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-pop mt-6 p-6">
        <h2 className="text-2xl font-bold">Le mie richieste</h2>
        {pending.length === 0 && decided.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Non hai ancora fatto richieste.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {[...pending, ...decided].map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="flex-1 font-semibold leading-tight">
                  {r.label}
                  {r.note && <span className="block text-xs text-muted-foreground">“{r.note}”</span>}
                </span>
                <span className="font-display text-sm font-bold">
                  {r.kind === "earn" ? `+${r.points}` : `−${r.points}`}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    r.status === "pending"
                      ? "bg-sunny text-sunny-foreground"
                      : r.status === "approved"
                        ? "bg-mint text-mint-foreground"
                        : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {r.status === "pending" ? "in attesa" : r.status === "approved" ? "sì!" : "no"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
