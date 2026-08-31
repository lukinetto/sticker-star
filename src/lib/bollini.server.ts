import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";

export type Entry = {
  id: string;
  ts: string;
  delta: number;
  label: string;
  kind: "earn" | "spend" | "adjust";
};

export type Action = { id: string; label: string; points: number; emoji: string };
export type Reward = { id: string; label: string; cost: number; emoji: string };
export type Malus = { id: string; label: string; points: number; emoji: string };

export type Request = {
  id: string;
  ts: string;
  kind: "earn" | "spend";
  label: string;
  emoji: string;
  points: number;
  note?: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: string;
};

export type AppData = {
  childName: string;
  entries: Entry[];
  actions: Action[];
  rewards: Reward[];
  malus: Malus[];
  requests: Request[];
};


const DEFAULT_DATA: AppData = {
  childName: "Campionessa",
  actions: [
    { id: "a1", label: "Riordino la mia camera", points: 3, emoji: "🧸" },
    { id: "a2", label: "Compiti finiti senza farmelo ripetere", points: 5, emoji: "📚" },
    { id: "a3", label: "Apparecchio o sparecchio la tavola", points: 2, emoji: "🍽️" },
    { id: "a4", label: "Mi lavo i denti la sera senza discutere", points: 1, emoji: "🪥" },
    { id: "a5", label: "Aiuto in casa senza che me lo chiedano", points: 4, emoji: "✨" },
  ],
  rewards: [
    { id: "r1", label: "30 minuti di TV in più", cost: 10, emoji: "📺" },
    { id: "r2", label: "Scelgo io la cena", cost: 20, emoji: "🍕" },
    { id: "r3", label: "Gelato al parco", cost: 30, emoji: "🍦" },
    { id: "r4", label: "Pomeriggio con un'amica", cost: 50, emoji: "🎈" },
    { id: "r5", label: "Cinema in famiglia", cost: 80, emoji: "🎬" },
  ],
  malus: [
    { id: "m1", label: "Non ascolto quando me lo ripetono", points: 2, emoji: "🙉" },
    { id: "m2", label: "Lascio la camera in disordine", points: 3, emoji: "🌪️" },
    { id: "m3", label: "Rispondo male a mamma o papà", points: 5, emoji: "😤" },
    { id: "m4", label: "Litigo con il fratello o la sorella", points: 4, emoji: "⚡" },
  ],
  entries: [],
  requests: [],

};

function dataFile() {
  const dir = process.env["DATA_DIR"] || path.join(process.cwd(), "data");
  return path.join(dir, "bollini.json");
}

let memory: AppData | null = null;

export async function readData(): Promise<AppData> {
  try {
    const raw = await fs.readFile(dataFile(), "utf8");
    const parsed = JSON.parse(raw) as AppData;
    memory = { ...DEFAULT_DATA, ...parsed };
    return memory;
  } catch {
    if (!memory) memory = structuredClone(DEFAULT_DATA);
    return memory;
  }
}

export async function writeData(data: AppData): Promise<void> {
  memory = data;
  try {
    const file = dataFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Impossibile scrivere il file dati, uso la memoria:", err);
  }
}

export function newId() {
  try {
    return randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function totalPoints(entries: Entry[]) {
  return entries.reduce((sum, e) => sum + e.delta, 0);
}

export function pinMatches(input: string) {
  const expected = process.env["ADMIN_PIN"] || "1234";
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const sessionConfig = {
  password:
    process.env["SESSION_SECRET"] ||
    "cambia-questo-valore-con-una-stringa-lunga-almeno-32-caratteri",
  name: "bollini-admin",
  maxAge: 60 * 60 * 24 * 30,
  cookie: {
    httpOnly: true,
    secure: process.env["COOKIE_SECURE"] === "true",
    sameSite: "lax" as const,
    path: "/",
  },
};
