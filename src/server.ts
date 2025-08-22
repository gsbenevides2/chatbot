import { cors } from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import api from "./backend/api";
import { Mcp } from "./backend/services/Chatbot/Mcp";
import { coolifyHealthChecker } from "./plugins/coolify-healtcheker";
import { logger } from "./plugins/logger";
import { getProjectInfo } from "./utils/getProjectInfo";
import { sendServerReadyMessage } from "./utils/sendServerReadyMessage";

const projectInfo = getProjectInfo();
console.log(`${projectInfo.title} v${projectInfo.version}`);

await Mcp.getInstance().connectAndSaveTools();

const port = Bun.env.PORT || 3000;
const app = new Elysia()
	.use(logger())
	.use(cors())
	.use(
		swagger({
			documentation: {
				info: projectInfo,
				tags: [
					{
						name: "Chatbot",
						description: "Send Messages to the AI chatbot",
					},
					{
						name: "Coolify",
						description: "Coolify Utils",
					},
				],
				components: {
					securitySchemes: {
						headerAuth: {
							type: "apiKey",
							in: "header",
							name: "Authorization",
							description: "Authentication token",
						},
					},
				},
			},
		}),
	)
	.use(coolifyHealthChecker)
	.use(api)

	.listen(port, sendServerReadyMessage);

export type App = typeof app;
