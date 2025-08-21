import { t } from "elysia";

export const ChatbotSchema = t.Union([
	t.Object(
		{
			message: t.String({
				title: "Mensagem de texto",
				examples: ["Olá, como vai?", "Como você está?"],
				description: "Mensagem de texto",
			}),
			images: t.Optional(
				t.Array(
					t.String({
						title: "URL da imagem",
						examples: [
							"https://example.com/image.png",
							"https://example.com/image.jpg",
						],
						description: "URL da imagem",
					}),
					{
						title: "Lista de URLs de imagens",
						examples: [
							[
								"https://example.com/image.png",
								"https://example.com/image.jpg",
							],
						],
						description: "Lista de URLs de imagens",
					},
				),
			),
		},
		{
			title: "Mensagem com texto",
			examples: [
				{
					message: "Olá, como vai?",
					images: [
						"https://example.com/image.png",
						"https://example.com/image.jpg",
					],
				},
			],
			description: "Mensagem com imagens",
		},
	),
	t.Object(
		{
			audio: t.Optional(
				t.String({
					title: "URL do áudio",
					examples: [
						"https://example.com/audio.mp3",
						"https://example.com/audio.wav",
					],
					description: "URL do áudio",
				}),
			),
		},
		{
			title: "Mensagem com áudio",
			examples: [
				{
					audio: "https://example.com/audio.mp3",
				},
			],
			description: "Mensagem com áudio",
		},
	),
]);
