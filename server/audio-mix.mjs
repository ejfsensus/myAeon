import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
const state = (globalThis[Symbol.for("myAeon.audio-mix.v1")] ||= {
  jobs: new Map(),
  cache: new Map(),
});
/** The packaged asset is normalised to -35 LUFS. A further -9dB leaves ample room for speech. */
export async function mixReadingAudio(wav) {
  const key = createHash("sha256")
    .update("ambience-v1-gain035\n")
    .update(wav)
    .digest("hex");
  const cached = state.cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (state.jobs.has(key)) return state.jobs.get(key);
  if (state.jobs.size >= 2)
    throw new Error("Audio export is busy. Please retry shortly.");
  const job = (async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "aeon-mix-"));
    try {
      const input = path.join(dir, "voice.wav"),
        output = path.join(dir, "reading.m4a");
      await writeFile(input, wav);
      const seconds = (wav.length - 44) / 48000;
      if (seconds > 600 || seconds <= 0)
        throw new Error("Narration must be within ten minutes.");
      await new Promise((resolve, reject) => {
        const child = spawn(
          process.env.FFMPEG_PATH || "ffmpeg",
          [
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            input,
            "-i",
            path.resolve("public/audio/reading-ambience.m4a"),
            "-filter_complex",
            `[0:a]volume=0.95[voice];[1:a]volume=0.35,afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, seconds - 1)}:d=1[bg];[voice][bg]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95:level=0[out]`,
            "-map",
            "[out]",
            "-t",
            String(seconds),
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            output,
          ],
          { stdio: "ignore" },
        );
        const timeout = setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error("Audio export timed out."));
        }, 90000);
        child.on("error", () => {
          clearTimeout(timeout);
          reject(new Error("Audio mixer unavailable."));
        });
        child.on("exit", (code) => {
          clearTimeout(timeout);
          code === 0
            ? resolve()
            : reject(new Error("Audio export could not be completed."));
        });
      });
      const data = await readFile(output);
      for (const [id, entry] of state.cache)
        if (entry.expires < Date.now() || state.cache.size >= 4)
          state.cache.delete(id);
      state.cache.set(key, { data, expires: Date.now() + 3600000 });
      return data;
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  })();
  state.jobs.set(key, job);
  try {
    return await job;
  } finally {
    state.jobs.delete(key);
  }
}
