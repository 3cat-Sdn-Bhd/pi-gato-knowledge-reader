export const COUNTRIES = ["MY", "PH"] as const;
export type Country = (typeof COUNTRIES)[number];
export const DEFAULT_COUNTRY: Country = "MY";

export function isCountry(value: string): value is Country {
	return (COUNTRIES as readonly string[]).includes(value);
}

type Directive = { start: number; contentStart: number; contentEnd: number; end: number; country: Country };

const LINE_START = String.raw`(?:(?<=\n)|(?<=\r)|^)`;
const LINE_END = String.raw`(?:\r\n|\r|\n|$)`;
const BLOCK_OPEN = new RegExp(String.raw`${LINE_START}:::(my|ph)[ \t]*${LINE_END}`, "g");
const BLOCK_CLOSE = new RegExp(String.raw`${LINE_START}:::[ \t]*${LINE_END}`, "g");
const INLINE_MARKER = /(?:my|ph)\[/g;
const WORD = /[A-Za-z0-9_]/;

// `my[...]` and `ph[...]` on one line; brackets nest, a preceding word char cancels the marker.
function inlineDirectives(markdown: string): Directive[] {
	const directives: Directive[] = [];
	for (const marker of markdown.matchAll(INLINE_MARKER)) {
		if (marker.index > 0 && WORD.test(markdown[marker.index - 1])) continue;
		const contentStart = marker.index + marker[0].length;
		let depth = 1;
		for (let i = contentStart; i < markdown.length; i++) {
			const ch = markdown[i];
			if (ch === "\r" || ch === "\n") break;
			if (ch === "[") depth++;
			else if (ch === "]" && --depth === 0) {
				directives.push({
					start: marker.index,
					contentStart,
					contentEnd: i,
					end: i + 1,
					country: marker[0].slice(0, 2).toUpperCase() as Country,
				});
				break;
			}
		}
	}
	return directives;
}

// `:::my` ... `:::` on their own lines.
function blockDirectives(markdown: string): Directive[] {
	const directives: Directive[] = [];
	for (const opening of markdown.matchAll(BLOCK_OPEN)) {
		BLOCK_CLOSE.lastIndex = opening.index + opening[0].length;
		const closing = BLOCK_CLOSE.exec(markdown);
		if (!closing) continue;
		directives.push({
			start: opening.index,
			contentStart: opening.index + opening[0].length,
			contentEnd: closing.index,
			end: closing.index + closing[0].length,
			country: opening[1].toUpperCase() as Country,
		});
	}
	return directives;
}

export class CountryMarkdownError extends Error {}

export function filterCountryMarkdown(markdown: string, country: Country): string {
	const directives = [...inlineDirectives(markdown), ...blockDirectives(markdown)].sort((a, b) => a.start - b.start);
	for (let i = 1; i < directives.length; i++) {
		if (directives[i].start < directives[i - 1].end) {
			throw new CountryMarkdownError("Knowledge has nested or overlapping country directives");
		}
	}
	const parts: string[] = [];
	let cursor = 0;
	for (const d of directives) {
		parts.push(markdown.slice(cursor, d.start));
		if (d.country === country) parts.push(markdown.slice(d.contentStart, d.contentEnd));
		cursor = d.end;
	}
	parts.push(markdown.slice(cursor));
	return parts.join("");
}
