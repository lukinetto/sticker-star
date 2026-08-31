import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getState,
  login,
  logout,
  addEntry,
  deleteEntry,
  saveSettings,
  decideRequest,
  clearDecidedRequests,
} from "@/lib/bollini.functions";


const stateQuery = queryOptions({
  queryKey: ["bollini-state"],
  queryFn: () => getState(),
});

export const Route = createFileRoute("/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(stateQuery),
  head: () => ({
    meta: [
      { title: "Area genitori — Bollini" },
      { name: "description", content: "Pannello per assegnare, togliere e gestire i bollini." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Area genitori — Bollini" },
      { property: "og:description", content: "Gestione punti, azioni e premi." },
    ],
  }),
  errorComponent: () => <div className="p-10 text-center">Errore nell'area genitori.</div>,
  component: Admin,
});

function Admin() {
  const { data } = useSuspenseQuery(stateQuery);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["bollini-state"] });

  const doLogin = useServerFn(login);
  const doLogout = useServerFn(logout);
  const doAdd = useServerFn(addEntry);
  const doDelete = useServerFn(deleteEntry);
  const doSave = useServerFn(saveSettings);
  const doDecide = useServerFn(decideRequest);
  const doClear = useServerFn(clearDecidedRequests);


  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [label, setLabel] = useState("");
  const [delta, setDelta] = useState(1);
  const [childName, setChildName] = useState(data.childName);
  const [actions, setActions] = useState(data.actions);
  const [rewards, setRewards] = useState(data.rewards);
  const [malus, setMalus] = useState(data.malus);
  const [saved, setSaved] = useState(false);

  const pendingRequests = data.requests.filter((r) => r.status === "pending");
  const decidedRequests = data.requests.filter((r) => r.status !== "pending");


  if (!data.isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <form
          className="card-pop p-8 text-center"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await doLogin({ data: { pin } });
            if (res.ok) {
              setPinError(false);
              await refresh();
            } else setPinError(true);
          }}
        >
          <h1 className="text-3xl font-bold">Area genitori</h1>
          <p className="mt-2 text-sm text-muted-foreground">Inserisci il PIN per continuare.</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            className="mt-6 w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-center font-display text-2xl tracking-[0.4em] outline-none focus:border-ring"
            placeholder="••••"
          />
          {pinError && <p className="mt-3 text-sm font-semibold text-destructive">PIN errato</p>}
          <button type="submit" className="btn-pop btn-pop-hover mt-6 w-full bg-primary text-primary-foreground">
            Entra
          </button>
          <Link to="/" className="mt-4 block text-sm text-muted-foreground underline">
            Torna alla bacheca
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Area genitori</h1>
        <div className="flex gap-2">
          <Link to="/" className="btn-pop btn-pop-hover border-2 border-border bg-card text-sm">
            Bacheca
          </Link>
          <button
            className="btn-pop btn-pop-hover bg-secondary text-sm text-secondary-foreground"
            onClick={async () => {
              await doLogout({});
              await refresh();
            }}
          >
            Esci
          </button>
        </div>
      </header>

      <section className="card-pop mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">
            Richieste di {data.childName}
            {pendingRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-accent px-3 py-1 font-display text-sm text-accent-foreground">
                {pendingRequests.length} da approvare
              </span>
            )}
          </h2>
          {decidedRequests.length > 0 && (
            <button
              className="text-sm text-muted-foreground underline"
              onClick={async () => {
                await doClear({});
                await refresh();
              }}
            >
              pulisci le richieste già decise
            </button>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Nessuna richiesta in attesa.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="min-w-40 flex-1 font-semibold leading-tight">
                  {r.kind === "earn" ? "Dichiara: " : "Chiede: "}
                  {r.label}
                  {r.note && (
                    <span className="block text-xs text-muted-foreground">“{r.note}”</span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    {new Date(r.ts).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span className="font-display font-bold">
                  {r.kind === "earn" ? `+${r.points}` : `−${r.points}`}
                </span>
                <button
                  className="btn-pop btn-pop-hover bg-mint text-sm text-mint-foreground"
                  onClick={async () => {
                    await doDecide({ data: { id: r.id, approve: true } });
                    await refresh();
                  }}
                >
                  Approva
                </button>
                <button
                  className="btn-pop btn-pop-hover bg-destructive text-sm text-destructive-foreground"
                  onClick={async () => {
                    await doDecide({ data: { id: r.id, approve: false } });
                    await refresh();
                  }}
                >
                  Rifiuta
                </button>
              </li>
            ))}
          </ul>
        )}

        {decidedRequests.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            {decidedRequests.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-muted-foreground">
                <span>{r.emoji}</span>
                <span className="flex-1">{r.label}</span>
                <span
                  className={r.status === "approved" ? "text-primary" : "text-destructive"}
                >
                  {r.status === "approved" ? "approvata" : "rifiutata"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>


      <section className="card-pop mt-6 p-6">
        <h2 className="text-xl font-bold">Assegna bollini rapidi</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.actions.map((a) => (
            <button
              key={a.id}
              className="btn-pop btn-pop-hover bg-mint text-sm text-mint-foreground"
              onClick={async () => {
                await doAdd({ data: { label: a.label, delta: a.points, kind: "earn" } });
                await refresh();
              }}
            >
              {a.emoji} {a.label} +{a.points}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {data.malus.map((m) => (
            <button
              key={m.id}
              className="btn-pop btn-pop-hover bg-destructive text-sm text-destructive-foreground"
              onClick={async () => {
                await doAdd({ data: { label: `Malus: ${m.label}`, delta: -m.points, kind: "adjust" } });
                await refresh();
              }}
            >
              {m.emoji} {m.label} −{m.points}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {data.rewards.map((r) => (
            <button
              key={r.id}
              className="btn-pop btn-pop-hover bg-sunny text-sm text-sunny-foreground"
              onClick={async () => {
                await doAdd({
                  data: { label: `Premio: ${r.label}`, delta: -r.cost, kind: "spend" },
                });
                await refresh();
              }}
            >
              {r.emoji} {r.label} −{r.cost}
            </button>
          ))}
        </div>

        <form
          className="mt-6 flex flex-wrap items-end gap-3 border-t border-border pt-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!label.trim() || !delta) return;
            await doAdd({
              data: { label, delta, kind: delta > 0 ? "earn" : "spend" },
            });
            setLabel("");
            setDelta(1);
            await refresh();
          }}
        >
          <label className="flex-1">
            <span className="text-sm font-semibold">Motivo</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-input bg-background px-3 py-2 outline-none focus:border-ring"
              placeholder="Es. Ha aiutato con la spesa"
            />
          </label>
          <label className="w-28">
            <span className="text-sm font-semibold">Bollini</span>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border-2 border-input bg-background px-3 py-2 outline-none focus:border-ring"
            />
          </label>
          <button className="btn-pop btn-pop-hover bg-primary text-primary-foreground">
            Aggiungi
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Usa un numero negativo per togliere bollini.
        </p>
      </section>

      <section className="card-pop mt-6 p-6">
        <h2 className="text-xl font-bold">Storico</h2>
        <ul className="mt-3 divide-y divide-border">
          {data.entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2">
              <span className="w-14 font-display font-bold">
                {e.delta > 0 ? `+${e.delta}` : e.delta}
              </span>
              <span className="flex-1">{e.label}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(e.ts).toLocaleString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                className="text-sm text-destructive underline"
                onClick={async () => {
                  await doDelete({ data: { id: e.id } });
                  await refresh();
                }}
              >
                elimina
              </button>
            </li>
          ))}
          {data.entries.length === 0 && (
            <li className="py-3 text-muted-foreground">Nessun movimento.</li>
          )}
        </ul>
      </section>

      <section className="card-pop mt-6 p-6">
        <h2 className="text-xl font-bold">Impostazioni</h2>
        <label className="mt-4 block max-w-xs">
          <span className="text-sm font-semibold">Nome di tua figlia</span>
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-input bg-background px-3 py-2 outline-none focus:border-ring"
          />
        </label>

        <h3 className="mt-6 font-display text-lg font-bold">Azioni che fanno guadagnare</h3>
        <div className="mt-2 space-y-2">
          {actions.map((a, i) => (
            <div key={a.id} className="flex gap-2">
              <input
                value={a.emoji}
                onChange={(e) =>
                  setActions(actions.map((x, j) => (i === j ? { ...x, emoji: e.target.value } : x)))
                }
                className="w-14 rounded-xl border-2 border-input bg-background px-2 py-2 text-center"
              />
              <input
                value={a.label}
                onChange={(e) =>
                  setActions(actions.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)))
                }
                className="flex-1 rounded-xl border-2 border-input bg-background px-3 py-2"
              />
              <input
                type="number"
                value={a.points}
                onChange={(e) =>
                  setActions(
                    actions.map((x, j) => (i === j ? { ...x, points: Number(e.target.value) } : x)),
                  )
                }
                className="w-20 rounded-xl border-2 border-input bg-background px-2 py-2"
              />
              <button
                className="px-2 text-destructive"
                onClick={() => setActions(actions.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn-pop btn-pop-hover bg-secondary text-sm text-secondary-foreground"
            onClick={() =>
              setActions([
                ...actions,
                { id: `new-${Date.now()}`, label: "Nuova azione", points: 1, emoji: "⭐" },
              ])
            }
          >
            + Aggiungi azione
          </button>
        </div>

        <h3 className="mt-6 font-display text-lg font-bold">Premi</h3>
        <div className="mt-2 space-y-2">
          {rewards.map((r, i) => (
            <div key={r.id} className="flex gap-2">
              <input
                value={r.emoji}
                onChange={(e) =>
                  setRewards(rewards.map((x, j) => (i === j ? { ...x, emoji: e.target.value } : x)))
                }
                className="w-14 rounded-xl border-2 border-input bg-background px-2 py-2 text-center"
              />
              <input
                value={r.label}
                onChange={(e) =>
                  setRewards(rewards.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)))
                }
                className="flex-1 rounded-xl border-2 border-input bg-background px-3 py-2"
              />
              <input
                type="number"
                value={r.cost}
                onChange={(e) =>
                  setRewards(
                    rewards.map((x, j) => (i === j ? { ...x, cost: Number(e.target.value) } : x)),
                  )
                }
                className="w-20 rounded-xl border-2 border-input bg-background px-2 py-2"
              />
              <button
                className="px-2 text-destructive"
                onClick={() => setRewards(rewards.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn-pop btn-pop-hover bg-secondary text-sm text-secondary-foreground"
            onClick={() =>
              setRewards([
                ...rewards,
                { id: `new-${Date.now()}`, label: "Nuovo premio", cost: 10, emoji: "🎁" },
              ])
            }
          >
            + Aggiungi premio
          </button>
        </div>

        <h3 className="mt-6 font-display text-lg font-bold">Malus (bollini che si perdono)</h3>
        <div className="mt-2 space-y-2">
          {malus.map((m, i) => (
            <div key={m.id} className="flex gap-2">
              <input
                value={m.emoji}
                onChange={(e) =>
                  setMalus(malus.map((x, j) => (i === j ? { ...x, emoji: e.target.value } : x)))
                }
                className="w-14 rounded-xl border-2 border-input bg-background px-2 py-2 text-center"
              />
              <input
                value={m.label}
                onChange={(e) =>
                  setMalus(malus.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)))
                }
                className="flex-1 rounded-xl border-2 border-input bg-background px-3 py-2"
              />
              <input
                type="number"
                value={m.points}
                onChange={(e) =>
                  setMalus(
                    malus.map((x, j) => (i === j ? { ...x, points: Number(e.target.value) } : x)),
                  )
                }
                className="w-20 rounded-xl border-2 border-input bg-background px-2 py-2"
              />
              <button
                className="px-2 text-destructive"
                onClick={() => setMalus(malus.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn-pop btn-pop-hover bg-secondary text-sm text-secondary-foreground"
            onClick={() =>
              setMalus([
                ...malus,
                { id: `new-${Date.now()}`, label: "Nuovo malus", points: 1, emoji: "💔" },
              ])
            }
          >
            + Aggiungi malus
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            className="btn-pop btn-pop-hover bg-primary text-primary-foreground"
            onClick={async () => {
              await doSave({ data: { childName, actions, rewards, malus } });
              setSaved(true);
              await refresh();
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            Salva impostazioni
          </button>
          {saved && <span className="text-sm font-semibold text-primary">Salvato ✓</span>}
        </div>
      </section>
    </div>
  );
}
