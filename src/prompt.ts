import { relative, resolve } from "node:path";
import { type Country, filterCountryMarkdown } from "./country.ts";

// A skill whose description is written wholly as `my[...]` is country-specific.
const EMPTY_SKILL = /[ \t]*<skill>\s*<name>[^<]*<\/name>\s*<description>\s*<\/description>\s*<location>[^<]*<\/location>\s*<\/skill>\n?/g;

export function filterSystemPrompt(prompt: string, country: Country): string {
	return filterCountryMarkdown(prompt, country).replace(EMPTY_SKILL, "");
}

export function isKnowledgePath(path: string, cwd: string): boolean {
	const rel = relative(cwd, resolve(cwd, path));
	if (rel.startsWith("..")) return false;
	return rel === "AGENTS.md" || rel.startsWith(".agents/skills/");
}
