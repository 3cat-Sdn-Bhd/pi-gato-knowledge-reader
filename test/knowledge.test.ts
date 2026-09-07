import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { knowledgeDir, listTopics, readIndex, readTopic } from "../src/knowledge.ts";

function fixture() {
	const root = mkdtempSync(join(tmpdir(), "gato-kb-"));
	const dir = join(root, "knowledge");
	mkdirSync(dir);
	writeFileSync(join(dir, "Skill.md"), "# Skill index");
	writeFileSync(join(dir, "stock-sharing-queries.md"), "# stock");
	writeFileSync(join(dir, "notes.txt"), "ignored");
	return { root, dir };
}

test("knowledgeDir defaults to ./knowledge under cwd", () => {
	delete process.env.GATO_KNOWLEDGE_DIR;
	assert.equal(knowledgeDir("/a/b"), "/a/b/knowledge");
	process.env.GATO_KNOWLEDGE_DIR = "kb";
	assert.equal(knowledgeDir("/a/b"), "/a/b/kb");
	delete process.env.GATO_KNOWLEDGE_DIR;
});

test("readIndex finds Skill.md case-insensitively and returns undefined when missing", () => {
	const { dir } = fixture();
	assert.equal(readIndex(dir), "# Skill index");
	assert.equal(readIndex(join(dir, "nope")), undefined);
});

test("listTopics excludes the index and non-md files", () => {
	const { dir } = fixture();
	assert.deepEqual(listTopics(dir), ["stock-sharing-queries"]);
});

test("readTopic resolves names, strips .md, blocks traversal, lists topics on miss", () => {
	const { dir } = fixture();
	assert.deepEqual(readTopic(dir, "stock-sharing-queries"), { ok: true, text: "# stock" });
	assert.deepEqual(readTopic(dir, "Stock-Sharing-Queries.md"), { ok: true, text: "# stock" });
	assert.equal(readTopic(dir, "../../etc/passwd").ok, false);
	const miss = readTopic(dir, "missing");
	assert.equal(miss.ok, false);
	assert.match((miss as { error: string }).error, /Available: stock-sharing-queries/);
});
