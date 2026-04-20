import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_DIR = process.env.STORAGE_DIR || "./.storage";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function putObject(
  userId: string,
  originalName: string,
  data: Buffer
): Promise<{ storageKey: string; sizeBytes: number }> {
  const safeName = originalName.replace(/[^\w.\-]+/g, "_");
  const id = crypto.randomBytes(8).toString("hex");
  const key = path.join(userId, `${Date.now()}-${id}-${safeName}`);
  const abs = path.join(STORAGE_DIR, key);
  await ensureDir(path.dirname(abs));
  await fs.writeFile(abs, data);
  return { storageKey: key, sizeBytes: data.byteLength };
}

export async function getObject(storageKey: string): Promise<Buffer> {
  return fs.readFile(path.join(STORAGE_DIR, storageKey));
}
