import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import type { AppData, Entry } from "./bollini.server";

export type PublicState = {
  childName: string;
  points: number;
  entries: Entry[];
  actions: AppData["actions"];
  rewards: AppData["rewards"];
  malus: AppData["malus"];
  isAdmin: boolean;
};

export const getState = createServerFn({ method: "GET" }).handler(async (): Promise<PublicState> => {
  const s = await import("./bollini.server");
  const data = await s.readData();
  const session = await useSession<{ admin?: boolean }>(s.sessionConfig);
  return {
    childName: data.childName,
    points: s.totalPoints(data.entries),
    entries: [...data.entries].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 100),
    actions: data.actions,
    rewards: data.rewards,
    malus: data.malus ?? [],
    isAdmin: session.data.admin === true,
  };
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { pin: string }) => data)
  .handler(async ({ data }) => {
    const s = await import("./bollini.server");
    if (!s.pinMatches(String(data.pin ?? ""))) return { ok: false as const };
    const session = await useSession<{ admin?: boolean }>(s.sessionConfig);
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const s = await import("./bollini.server");
  const session = await useSession<{ admin?: boolean }>(s.sessionConfig);
  await session.clear();
  return { ok: true as const };
});

export const addEntry = createServerFn({ method: "POST" })
  .inputValidator((data: { label: string; delta: number; kind: Entry["kind"] }) => data)
  .handler(async ({ data }) => {
    const s = await import("./bollini.server");
    const session = await useSession<{ admin?: boolean }>(s.sessionConfig);
    if (!session.data.admin) throw new Error("Non autorizzato");

    const label = String(data.label ?? "").trim().slice(0, 120);
    const delta = Math.round(Number(data.delta));
    if (!label || !Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 1000) {
      throw new Error("Dati non validi");
    }
    const kind: Entry["kind"] =
      data.kind === "spend" || data.kind === "adjust" ? data.kind : "earn";

    const current = await s.readData();
    current.entries.push({ id: s.newId(), ts: new Date().toISOString(), delta, label, kind });
    await s.writeData(current);
    return { ok: true as const };
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const s = await import("./bollini.server");
    const session = await useSession<{ admin?: boolean }>(s.sessionConfig);
    if (!session.data.admin) throw new Error("Non autorizzato");
    const current = await s.readData();
    current.entries = current.entries.filter((e) => e.id !== data.id);
    await s.writeData(current);
    return { ok: true as const };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      childName: string;
      actions: AppData["actions"];
      rewards: AppData["rewards"];
      malus: AppData["malus"];
    }) => data,
  )
  .handler(async ({ data }) => {
    const s = await import("./bollini.server");
    const session = await useSession<{ admin?: boolean }>(s.sessionConfig);
    if (!session.data.admin) throw new Error("Non autorizzato");

    const current = await s.readData();
    current.childName = String(data.childName ?? "").trim().slice(0, 40) || "Campionessa";
    current.actions = (data.actions ?? []).slice(0, 40).map((a) => ({
      id: a.id || s.newId(),
      label: String(a.label).trim().slice(0, 120),
      points: Math.max(1, Math.min(100, Math.round(Number(a.points) || 1))),
      emoji: String(a.emoji || "⭐").slice(0, 4),
    }));
    current.rewards = (data.rewards ?? []).slice(0, 40).map((r) => ({
      id: r.id || s.newId(),
      label: String(r.label).trim().slice(0, 120),
      cost: Math.max(1, Math.min(1000, Math.round(Number(r.cost) || 1))),
      emoji: String(r.emoji || "🎁").slice(0, 4),
    }));
    current.malus = (data.malus ?? []).slice(0, 40).map((m) => ({
      id: m.id || s.newId(),
      label: String(m.label).trim().slice(0, 120),
      points: Math.max(1, Math.min(100, Math.round(Number(m.points) || 1))),
      emoji: String(m.emoji || "💔").slice(0, 4),
    }));
    await s.writeData(current);
    return { ok: true as const };
  });
