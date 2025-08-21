import { Elysia, StatusMap, t } from "elysia";

export const coolifyHealthChecker = new Elysia({
	detail: {
		summary: "Coolify Utils",
		description: "Health check for coolify",
	},
}).get(
	"/health",
	() => {
		return "OK";
	},
	{
		tags: ["Coolify"],
		response: {
			[StatusMap["OK"]]: t.String({
				description: "Health check for coolify",
				examples: ["OK"],
			}),
		},
	},
);
