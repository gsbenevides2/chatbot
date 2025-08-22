import Anthropic from "@anthropic-ai/sdk";
import type {
	ImageBlockParam,
	TextBlockParam,
} from "@anthropic-ai/sdk/resources";
import { getEnv } from "../../../../utils/getEnv";

const ANTHROPIC_API_KEY = getEnv("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = getEnv("ANTHROPIC_MODEL");
const ANTHROPIC_SYSTEM_PROMPT = await Bun.file("./prompt.md").text();
const ANTHROPIC_MAX_TOKENS = Number(
	getEnv("ANTHROPIC_MAX_TOKENS", false, "1000"),
);

export type ToolResultContent =
	| Array<TextBlockParam | ImageBlockParam>
	| string;

export type Tool = Anthropic.Tool;

export class AnthropicService {
	client = new Anthropic({
		apiKey: ANTHROPIC_API_KEY,
	});

	tools: Tool[] = [];

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

	addImagesToHistory(images: string[]) {
		if (images.length === 0) return;
		this.messageHistory.push({
			role: "user",
			content: images.map((image) => ({
				type: "image",
				source: { type: "url", url: image },
			})),
		});
	}

	addCurrentResultToHistory(messages: Anthropic.ContentBlock[]) {
		this.messageHistory.push({
			role: "assistant",
			content: messages,
		});
	}

	addToolResultToHistory(toolUseID: string, toolResult: ToolResultContent) {
		this.messageHistory.push({
			role: "user",
			content: [
				{
					type: "tool_result",
					tool_use_id: toolUseID,
					content: toolResult,
				},
			],
		});
	}

	setTools(tools: Tool[]) {
		this.tools = tools;
	}

	async getResponse() {
		const response = await this.client.messages.create({
			model: ANTHROPIC_MODEL,
			system: this.systemPrompt,
			messages: this.messageHistory,
			max_tokens: ANTHROPIC_MAX_TOKENS,
			tools: this.tools,
		});

		this.addCurrentResultToHistory(response.content);

		return response;
	}
}
