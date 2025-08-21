import { discordClient } from "../../clients/discord";
import { AnthropicService } from "./Antropic";

export class ChatbotService {
	sendedMessageCounter = 0;
	firstMessageId: string | null = null;

	async sendMessage(message: string) {
		if (this.sendedMessageCounter === 0) {
			const firstMessage = await discordClient.post(`/api/messages/`, {
				message: message,
			});

			if (firstMessage.status !== 201 || !firstMessage.data) {
				throw new Error("Failed to send first message");
			}
			this.sendedMessageCounter++;
			this.firstMessageId = firstMessage.data.messageId;
		} else if (this.sendedMessageCounter === 1 && this.firstMessageId) {
			await discordClient.post(
				`/api/messages/{messageId}`,
				{
					message: message,
				},
				{
					params: {
						messageId: this.firstMessageId,
					},
				},
			);
			this.sendedMessageCounter++;
		} else {
			await discordClient.post(`/api/messages/`, {
				message: message,
			});
			this.sendedMessageCounter++;
		}
	}

	async receiveMessage(message: string) {
		await this.sendMessage(
			"Aguarde um momento, estou processando sua mensagem...",
		);
		const anthropicService = new AnthropicService();

		anthropicService.addUserMessageToHistory(message);
		while (true) {
			const response = await anthropicService.getResponse();
			for (const content of response.content) {
				if (content.type === "text") {
					await this.sendMessage(content.text);
				} else if (content.type === "tool_use") {
				}
			}

			if (response.stop_reason === "end_turn") {
				break;
			} else if (response.stop_reason === "max_tokens") {
				await this.sendMessage(
					"Infelizmente, eu não tenho mais tokens para continuar a conversa. Por favor, tente novamente.",
				);
				break;
			} else {
				await this.sendMessage(
					"Desculpe, mas eu não consegui processar sua mensagem. Por favor, tente novamente.",
				);
				break;
			}
		}
	}
}
