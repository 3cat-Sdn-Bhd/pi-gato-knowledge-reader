import assert from "node:assert/strict";
import { test } from "node:test";
import { filterSystemPrompt, isKnowledgePath } from "../src/prompt.ts";

const prompt = [
	"Base my[MY rules]ph[PH rules]",
	"<available_skills>",
	"  <skill>",
	"    <name>shared</name>",
	"    <description>Shared my[(MY)]ph[(PH)]</description>",
	"    <location>/kb/.agents/skills/shared/SKILL.md</location>",
	"  </skill>",
	"  <skill>",
	"    <name>my-only</name>",
	"    <description>my[Only for Malaysia]</description>",
	"    <location>/kb/.agents/skills/my-only/SKILL.md</location>",
	"  </skill>",
	"</available_skills>",
].join("\n");

test("MY keeps every skill and filters descriptions", () => {
	const out = filterSystemPrompt(prompt, "MY");
	assert.match(out, /^Base MY rules\n/);
	assert.match(out, /<description>Shared \(MY\)<\/description>/);
	assert.match(out, /<description>Only for Malaysia<\/description>/);
	assert.doesNotMatch(out, /my\[|ph\[/);
});

test("PH drops a skill whose description is wholly MY", () => {
	const out = filterSystemPrompt(prompt, "PH");
	assert.match(out, /<description>Shared \(PH\)<\/description>/);
	assert.doesNotMatch(out, /my-only/);
	assert.doesNotMatch(out, /my\[|ph\[/);
	assert.equal(out.match(/<skill>/g)?.length, 1);
});

test("isKnowledgePath covers AGENTS.md and .agents/skills only", () => {
	const cwd = "/kb";
	assert.equal(isKnowledgePath("AGENTS.md", cwd), true);
	assert.equal(isKnowledgePath("/kb/AGENTS.md", cwd), true);
	assert.equal(isKnowledgePath(".agents/skills/x/SKILL.md", cwd), true);
	assert.equal(isKnowledgePath("/kb/.agents/skills/x/ref.md", cwd), true);
	assert.equal(isKnowledgePath("src/index.ts", cwd), false);
	assert.equal(isKnowledgePath("/other/.agents/skills/x/SKILL.md", cwd), false);
	assert.equal(isKnowledgePath("../AGENTS.md", cwd), false);
});
