import { discordClient } from "../../clients/discord";
import { AudioToText } from "../Google/AudioToText";
import { PrepareAndUploadImage } from "../Google/PrepareAndUploadImage";
import { AnthropicService, type ToolResultContent } from "./Antropic";
import { Mcp } from "./Mcp";

type ReceivedMessage =
	| {
			message: string;
			images?: string[];
			settings?: Settings;
	  }
	| {
			audio: string;
	  };

type Settings = {
	systemsMode: boolean;
};

const defaultSettings: Settings = {
	systemsMode: false,
};

export class ChatbotService {
	sendedMessageCounter = 0;
	firstMessageId: string | null = null;

	constructor(private readonly settings: Settings = defaultSettings) {
		this.settings = settings;
	}

	async sendMessage(message: string) {
		if (this.settings.systemsMode) return;
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

	async receiveMessage(message: ReceivedMessage) {
		const anthropicService = new AnthropicService();
		const mcpService = Mcp.getInstance();

		const tools = await mcpService.getTools();
		anthropicService.setTools(
			tools.map((tool) => ({
				input_schema: tool.inputSchema,
				name: tool.name,
				description: tool.description,
			})),
		);

		let textMessage = "";
		// Special for audio case
		if ("audio" in message) {
			await this.sendMessage(
				"Aguarde um momento, estou ouvindo sua mensagem...",
			);
			const audioToText = new AudioToText();
			textMessage = await audioToText.convert(message.audio);
		} else {
			textMessage = message.message;
		}
		// Special for images case
		const hasImages =
			"images" in message && message.images && message.images.length > 0;
		if (hasImages) {
			await this.sendMessage(
				"Aguarde um momento, estou preparando as imagens...",
			);
			const prepareAndUploadImage = new PrepareAndUploadImage();
			const images = await prepareAndUploadImage.prepareMultipleImages(
				"images" in message ? (message.images ?? []) : [],
			);
			anthropicService.addImagesToHistory(images);
		}

		// Continue with the conversation
		await this.sendMessage("Aguarde um momento, estou pensando...");
		this.sendedMessageCounter = 1;
		if (!this.settings.systemsMode) {
			await anthropicService.getLastThreeSessionsAndAppendToHistory();
		}
		anthropicService.addUserMessageToHistory(textMessage);
		const messageLoop = async () => {
			const response = await anthropicService.getResponse();
			for (const content of response.content) {
				if (content.type === "text") {
					await this.sendMessage(content.text);
				} else if (content.type === "tool_use") {
					const toolName = content.name;
					const toolInput = content.input;
					const toolUseID = content.id;
					const toolResponse = await mcpService.callTool(toolName, toolInput);
					anthropicService.addToolResultToHistory(
						toolUseID,
						toolResponse.content as ToolResultContent,
					);
				}
			}

			if (response.stop_reason === "end_turn") {
				return;
			} else if (response.stop_reason === "max_tokens") {
				await this.sendMessage(
					"Infelizmente, eu não tenho mais tokens para continuar a conversa. Por favor, tente novamente.",
				);
				return;
			} else if (response.stop_reason === "tool_use") {
				await messageLoop();
			} else {
				await this.sendMessage(
					"Desculpe, mas eu não consegui processar sua mensagem. Por favor, tente novamente.",
				);
				return;
			}
		};
		await messageLoop();
		if (!this.settings.systemsMode) {
			await anthropicService.saveSession();
			anthropicService.clearSession();
		}
	}

	async sendErrorMessage() {
		await this.sendMessage(
			"Desculpe, mas eu não consegui processar sua mensagem. Por favor, tente novamente.",
		);
	}
}
