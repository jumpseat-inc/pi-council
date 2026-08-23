import { Type, type TSchema } from "typebox";

/**
 * Convert an MCP tool's JSON Schema into TypeBox for pi.registerTool.
 * Deliberately permissive: pi only needs a schema to advertise the tool to the
 * model; the MCP server remains the authoritative argument validator.
 * Anything unrecognized degrades to Type.Any() rather than failing the bridge.
 */
export function jsonSchemaToTypebox(schema: unknown): TSchema {
	if (!schema || typeof schema !== "object" || Array.isArray(schema)) return Type.Any();
	const s = schema as Record<string, unknown>;
	if (Array.isArray(s.type)) {
		const variants = (s.type as string[]).map((t) => jsonSchemaToTypebox({ ...s, type: t }));
		return unionOrAny(variants);
	}
	if (Array.isArray(s.enum) && s.enum.length > 0) {
		return unionOrAny(s.enum.map((v) => Type.Literal(v as string | number | boolean)));
	}
	if (Array.isArray(s.oneOf)) return unionOrAny(s.oneOf.map((sub) => jsonSchemaToTypebox(sub)));
	if (Array.isArray(s.anyOf)) return unionOrAny(s.anyOf.map((sub) => jsonSchemaToTypebox(sub)));
	switch (s.type) {
		case "object": {
			const props: Record<string, TSchema> = {};
			for (const [k, v] of Object.entries((s.properties ?? {}) as Record<string, unknown>)) {
				props[k] = jsonSchemaToTypebox(v);
			}
			return Type.Object(props);
		}
		case "array":
			return Type.Array(jsonSchemaToTypebox(s.items ?? {}));
		case "string":
			return Type.String();
		case "number":
			return Type.Number();
		case "integer":
			return Type.Integer();
		case "boolean":
			return Type.Boolean();
		case "null":
			return Type.Null();
		default:
			// Servers often omit type:"object" but still ship properties.
			if (s.properties) return jsonSchemaToTypebox({ ...s, type: "object" });
			return Type.Any();
	}
}

/** TypeBox unions require ≥2 members; collapse a single element. */
function unionOrAny(variants: TSchema[]): TSchema {
	if (variants.length === 0) return Type.Any();
	if (variants.length === 1) return variants[0]!;
	return Type.Union(variants);
}
