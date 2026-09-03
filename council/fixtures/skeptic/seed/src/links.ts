export interface MarkdownLink {
	text: string;
	url: string;
}

const LINK_RE = /(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function extractLinks(markdown: string): MarkdownLink[] {
	const links: MarkdownLink[] = [];
	for (const match of markdown.matchAll(LINK_RE)) {
		links.push({ text: match[1] ?? "", url: match[2] ?? "" });
	}
	return links;
}
