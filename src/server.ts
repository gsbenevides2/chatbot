import { cors } from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { logger } from "@grotto/logysia";
import { Elysia } from "elysia";
import api from "./backend/api";
import { coolifyHealthChecker } from "./plugins/coolify-healtcheker";
import { getProjectInfo } from "./utils/getProjectInfo";
import { sendServerReadyMessage } from "./utils/sendServerReadyMessage";

const projectInfo = getProjectInfo();
console.log(`${projectInfo.title} v${projectInfo.version}`);

const port = Bun.env.PORT || 3000;
const app = new Elysia()
	.use(
		logger({
			logIP: true,
			writer: {
				write(msg: string) {
					console.log(msg);
				},
			},
		}),
	)
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
