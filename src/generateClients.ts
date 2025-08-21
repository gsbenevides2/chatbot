import { createClient } from "@hey-api/openapi-ts";
import { getEnv } from "./utils/getEnv";

createClient({
	input: new URL(
		"/swagger/json",
		getEnv("DISCORD_SERVICE_ENDPOINT"),
	).toString(),
	output: "src/backend/clients/discord",
	dryRun: true,
	plugins: ["@hey-api/typescript", "@hey-api/client-fetch"],
});
