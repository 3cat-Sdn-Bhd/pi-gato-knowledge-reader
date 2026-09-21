import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { COUNTRIES, type Country, CountryMarkdownError, DEFAULT_COUNTRY, filterCountryMarkdown, isCountry } from "./country.ts";
import { filterSystemPrompt, isKnowledgePath } from "./prompt.ts";

const COUNTRY_ENTRY = "gato-country";

export default function gatoKnowledgeReader(pi: ExtensionAPI) {
	let country: Country = DEFAULT_COUNTRY;

	const showCountry = (ctx: ExtensionContext) => {
		if (ctx.hasUI) ctx.ui.setStatus(COUNTRY_ENTRY, `country: ${country}`);
	};

	pi.on("session_start", (_event, ctx) => {
		for (const entry of ctx.sessionManager.getEntries()) {
			if (entry.type === "custom" && entry.customType === COUNTRY_ENTRY && isCountry(entry.data)) {
				country = entry.data;
			}
		}
		showCountry(ctx);
	});

	pi.registerCommand("country", {
		description: `Select the knowledge-base country (${COUNTRIES.join(", ")})`,
		getArgumentCompletions: (prefix) => {
			const items = COUNTRIES.filter((c) => c.startsWith(prefix.toUpperCase())).map((c) => ({ value: c, label: c }));
			return items.length ? items : null;
		},
		handler: async (args, ctx) => {
			const typed = args.trim().toUpperCase();
			const choice = isCountry(typed) ? typed : ctx.hasUI ? await ctx.ui.select("Knowledge country", [...COUNTRIES]) : undefined;
			if (!choice || !isCountry(choice)) return;
			country = choice;
			pi.appendEntry(COUNTRY_ENTRY, country);
			showCountry(ctx);
			ctx.ui.notify(`Knowledge country: ${country}`, "info");
		},
	});

	// The operator validates the knowledge base in this session; a bad directive must be impossible to miss.
	const reportError = (where: string, error: unknown, ctx: ExtensionContext) => {
		if (!(error instanceof CountryMarkdownError)) throw error;
		const message = `KNOWLEDGE BASE ERROR in ${where}: ${error.message}. Report this to the user and do nothing else.`;
		if (ctx.hasUI) ctx.ui.notify(message, "error");
		return message;
	};

	pi.on("before_agent_start", (event, ctx) => {
		try {
			return { systemPrompt: filterSystemPrompt(event.systemPrompt, country) };
		} catch (error) {
			return { systemPrompt: reportError("system prompt (AGENTS.md or a skill description)", error, ctx) };
		}
	});

	pi.on("tool_result", (event, ctx) => {
		const path = String((event.input as { path?: unknown }).path ?? "");
		if (event.toolName !== "read" || !isKnowledgePath(path, ctx.cwd)) return;
		try {
			return {
				content: event.content.map((p) => (p.type === "text" ? { ...p, text: filterCountryMarkdown(p.text, country) } : p)),
			};
		} catch (error) {
			return { content: [{ type: "text", text: reportError(path, error, ctx) }], isError: true };
		}
	});
}
