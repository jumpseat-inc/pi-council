import { extractLinks, type MarkdownLink } from "./links.ts";

function usage(): never {
	console.error("usage: links-cli [--json] <file>");
	process.exit(2);
}

const args = process.argv.slice(2);
const json = args[0] === "--json";
if (json) args.shift();
if (args.length !== 1) usage();

const file = args[0];
let markdown: string;
try {
	markdown = await Bun.file(file).text();
} catch {
	console.error(`cannot read ${file}`);
	process.exit(1);
}

const links: MarkdownLink[] = extractLinks(markdown);
if (json) {
	console.log(JSON.stringify(links, null, 2));
} else {
	for (const link of links) {
		console.log(`${link.text} <${link.url}>`);
	}
}
