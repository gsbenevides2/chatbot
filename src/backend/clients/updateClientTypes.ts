import { resolve } from "node:path";
import { $ } from "bun";
import { getEnv } from "../../utils/getEnv";

const packageDir = resolve(import.meta.dirname, "..", "..", "..");
// Discord
const discordClientDir = resolve(
	packageDir,
	"src",
	"backend",
	"clients",
	"discord",
);
const discordClientTypesFile = resolve(discordClientDir, "types.d.ts");
const discordUrl = new URL("/swagger/json", getEnv("DISCORD_SERVICE_ENDPOINT"));

await $`openapi-typescript ${discordUrl.toString()} -o ${discordClientTypesFile}`;
