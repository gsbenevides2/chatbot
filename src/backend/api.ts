import { Elysia } from "elysia";
import { ChatbotController } from "./controllers/Chatbot/Controller";
import { AuthService } from "./services/AuthService";

const api = new Elysia({
	prefix: "/api",
})
	.onBeforeHandle(async ({ headers, status }) => {
		const token = headers?.authorization;
		if (!token) {
			return status(401, {
				error: "Unauthorized",
			});
		}
		const decoded = await AuthService.verify(token);
		if (!decoded) {
			return status(401, {
				error: "Unauthorized",
			});
		}
	})
	.use(ChatbotController);

export default api;
