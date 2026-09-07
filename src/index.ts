import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { COUNTRIES, type Country, DEFAULT_COUNTRY, filterCountryMarkdown, isCountry } from "./country.ts";
import { knowledgeDir, listTopics, readIndex, readTopic } from "./knowledge.ts";

const COUNTRY_ENTRY = "gato-country";

export default function gatoKnowledgeReader(pi: ExtensionAPI) {
	let country: Country = DEFAULT_COUNTRY;

	const showCountry = (ctx: { hasUI: boolean; ui: { setStatus(key: string, text: string): void } }) => {
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

	pi.on("before_agent_start", (event, ctx) => {
		const index = readIndex(knowledgeDir(ctx.cwd));
		if (!index) return;
		return { systemPrompt: `${event.systemPrompt}\n\n${filterCountryMarkdown(index, country)}` };
	});

	pi.registerTool({
		name: "read_skill",
		label: "Read Skill",
		description:
			"Read a skill topic from the knowledge base. Pass the topic name as listed in the Topic list (for example `stock-sharing-queries`).",
		promptSnippet: "Read a knowledge-base skill topic by name",
		promptGuidelines: ["Use read_skill with the topic name whenever the guidelines tell you to read a skill."],
		parameters: Type.Object({
			skill: Type.String({ description: "Topic name, without the .md extension" }),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const dir = knowledgeDir(ctx.cwd);
			const result = readTopic(dir, params.skill);
			if (!result.ok) return { content: [{ type: "text", text: result.error }], isError: true };
			return {
				content: [{ type: "text", text: filterCountryMarkdown(result.text, country) }],
				details: { skill: params.skill, country, topics: listTopics(dir) },
			};
		},
	});
}
