import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "../../../../utils/getEnv";

const ANTHROPIC_API_KEY = getEnv("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = getEnv("ANTHROPIC_MODEL");
const ANTHROPIC_SYSTEM_PROMPT = await Bun.file("./prompt.md").text();
const ANTHROPIC_MAX_TOKENS = Number(
	getEnv("ANTHROPIC_MAX_TOKENS", false, "1000"),
);

export class AnthropicService {
	client = new Anthropic({
		apiKey: ANTHROPIC_API_KEY,
	});

	systemPrompt: Anthropic.TextBlockParam[] = [
		{
			type: "text",
			text: ANTHROPIC_SYSTEM_PROMPT,
			cache_control: {
				type: "ephemeral",
			},
		},
	];

	messageHistory: Anthropic.MessageParam[] = [];

	addUserMessageToHistory(message: string) {
		this.messageHistory.push({
			role: "user",
			content: [{ type: "text", text: message }],
		});
	}

	addCurrentResultToHistory(messages: Anthropic.ContentBlock[]) {
		this.messageHistory.push({
			role: "assistant",
			content: messages,
		});
	}

	async getResponse() {
		const response = await this.client.messages.create({
			model: ANTHROPIC_MODEL,
			system: this.systemPrompt,
			messages: this.messageHistory,
			max_tokens: ANTHROPIC_MAX_TOKENS,
		});

		this.addCurrentResultToHistory(response.content);

		return response;
	}
}
