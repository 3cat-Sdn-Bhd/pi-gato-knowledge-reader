import assert from "node:assert/strict";
import { test } from "node:test";
import { CountryMarkdownError, filterCountryMarkdown } from "../src/country.ts";

test("filters inline and block directives", () => {
	const content = "Generic my[MY text]ph[PH text]\n:::my\nMY block\n:::\nGeneric\n:::ph\t\nPH block\n:::\t\n";
	assert.equal(filterCountryMarkdown(content, "MY"), "Generic MY text\nMY block\nGeneric\n");
	assert.equal(filterCountryMarkdown(content, "PH"), "Generic PH text\nGeneric\nPH block\n");
});

test("inline preserves content and supports bracket depth", () => {
	const content = String.raw`Before my[  [nested] \\ [value]  ] after my[]`;
	assert.equal(filterCountryMarkdown(content, "MY"), String.raw`Before   [nested] \\ [value]   after `);
});

test("inline marker requires boundary and cannot span lines", () => {
	const content = "army[not a directive] my[first\nsecond] ph[kept]";
	assert.equal(filterCountryMarkdown(content, "PH"), "army[not a directive] my[first\nsecond] kept");
});

test("malformed and unclosed directives stay unchanged", () => {
	const content = "my[unclosed\n:::my trailing text\nblock\n :::\n:::ph\nunclosed block";
	assert.equal(filterCountryMarkdown(content, "MY"), content);
});

test("block preserves CRLF content", () => {
	assert.equal(filterCountryMarkdown("before\r\n:::ph\t\r\ninside\r\n:::\t\r\nafter", "PH"), "before\r\ninside\r\nafter");
});

test("directives are case sensitive", () => {
	assert.equal(
		filterCountryMarkdown("MY[generic] Ph[generic] my[Malaysia] ph[Philippines]", "MY"),
		"MY[generic] Ph[generic] Malaysia ",
	);
});

test("empty directives are valid", () => {
	assert.equal(filterCountryMarkdown("a my[] b\n:::my\n:::\nc", "MY"), "a  b\nc");
});

test("nested or overlapping directives fail without leaking content", () => {
	for (const content of ["my[outer ph[inner]]", "my[outer my[inner]]", ":::my\nph[inner]\n:::\n", ":::my\n:::ph\n:::\n:::\n"]) {
		assert.throws(() => filterCountryMarkdown(content, "MY"), CountryMarkdownError);
	}
	assert.throws(() => filterCountryMarkdown("my[secret ph[secret]]", "MY"), (e: Error) => !e.message.includes("secret"));
});

test("malformed nested marker is generic", () => {
	assert.equal(filterCountryMarkdown("my[MY and PH[generic]]", "MY"), "MY and PH[generic]");
});
