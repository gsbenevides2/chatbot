import { Elysia, StatusMap, t } from "elysia";
import { ChatbotService } from "../../services/Chatbot";

export const ChatbotController = new Elysia({
	prefix: "/chatbot",
	detail: {
		tags: ["Chatbot"],
		description: "Send  Messages to the AI chatbot",
		security: [
			{
				headerAuth: [],
			},
		],
	},
}).post(
	"/",
	({ body, status }) => {
		if ("message" in body) {
			const chatbotService = new ChatbotService();
			chatbotService.receiveMessage(body.message);
		}
		status(StatusMap["No Content"], undefined);
	},
	{
		body: t.Union(
			[
				t.Object(
					{
						message: t.String({
							title: "Message",
							description: "The message to be sent to the chatbot",
							examples: ["Hello, how are you?"],
							minLength: 1,
						}),
						images: t.Optional(
							t.Array(
								t.String({
									title: "Image",
									description: "The image to be sent to the chatbot",
									examples: ["https://example.com/image.png"],
									format: "uri",
								}),
								{
									title: "Images",
									description: "The images to be sent to the chatbot",
									examples: [["https://example.com/image.png"]],
								},
							),
						),
					},
					{
						title: "Chatbot object with text and images",
						description:
							"Chatbot object with the message to be sent and the images to be sent",
						examples: [
							{
								message: "Hello, how are you?",
								images: ["https://example.com/image.png"],
							},
						],
					},
				),
				t.Object(
					{
						audio: t.String({
							title: "Audio",
							description: "The audio to be sent to the chatbot",
							examples: ["https://example.com/audio.mp3"],
							format: "uri",
						}),
					},
					{
						title: "Chatbot object with audio",
						description:
							"Chatbot object with the audio converted to text and to be sent to AI",
						examples: [
							{
								audio: "https://example.com/audio.mp3",
							},
						],
					},
				),
			],
			{
				title: "Chatbot object with text and images or audio",
				description:
					"Chatbot object with the message to be sent and the images to be sent or the audio to be sent",
				examples: [
					{
						message: "Hello, how are you?",
						images: ["https://example.com/image.png"],
					},
					{
						audio: "https://example.com/audio.mp3",
					},
				],
			},
		),
		response: {
			[StatusMap["No Content"]]: t.Undefined({
				title: "No content",
				description: "No content",
			}),
		},
		detail: {
			summary: "Send a message",
			description: "Send a message to the AI chatbot",
			security: [
				{
					headerAuth: [],
				},
			],
		},
	},
);
