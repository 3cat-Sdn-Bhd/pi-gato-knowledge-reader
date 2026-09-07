import { readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const INDEX_FILE = "skill.md";

export function knowledgeDir(cwd: string): string {
	return resolve(cwd, process.env.GATO_KNOWLEDGE_DIR ?? "knowledge");
}

function listFiles(dir: string): string[] {
	try {
		return readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".md"));
	} catch {
		return [];
	}
}

// Case-insensitive so `Skill.md` and `skill.md` both work on Linux.
export function readIndex(dir: string): string | undefined {
	const file = listFiles(dir).find((f) => f.toLowerCase() === INDEX_FILE);
	return file ? readFileSync(join(dir, file), "utf8") : undefined;
}

export function listTopics(dir: string): string[] {
	return listFiles(dir)
		.filter((f) => f.toLowerCase() !== INDEX_FILE)
		.map((f) => f.slice(0, -3))
		.sort();
}

export function readTopic(dir: string, topic: string): { ok: true; text: string } | { ok: false; error: string } {
	// basename() stops path traversal from model-supplied input.
	const name = basename(topic.trim()).replace(/\.md$/i, "");
	const file = listFiles(dir).find((f) => f.toLowerCase() === `${name.toLowerCase()}.md`);
	if (!file) {
		return { ok: false, error: `Unknown skill "${topic}". Available: ${listTopics(dir).join(", ") || "(none)"}` };
	}
	return { ok: true, text: readFileSync(join(dir, file), "utf8") };
}
