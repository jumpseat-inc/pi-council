import { extractLinks } from "./links.ts";

function usage(): never {
	console.error("usage: links-cli <file>");
	process.exit(2);
}

const args = process.argv.slice(2);
if (args.length !== 1) usage();

const file = args[0];
let markdown: string;
try {
	markdown = await Bun.file(file).text();
} catch {
	console.error(`cannot read ${file}`);
	process.exit(1);
}

for (const link of extractLinks(markdown)) {
	console.log(`${link.text} <${link.url}>`);
}
