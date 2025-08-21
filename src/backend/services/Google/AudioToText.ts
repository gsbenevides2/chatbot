import fs, { type ReadStream } from "node:fs";
import { SpeechClient } from "@google-cloud/speech";
import axios from "axios";
import { fileSync } from "tmp";

export class AudioToText {
	client = new SpeechClient({
		scopes: ["https://www.googleapis.com/auth/cloud-platform"],
		fallback: "rest",
	});

	async convert(audioUrl: string) {
		const tmpFile = fileSync();
		const response = await axios.get<ReadStream>(audioUrl, {
			responseType: "stream",
			transformResponse: (data) => data,
		});
		await new Promise<void>((resolve) => {
			response.data
				.pipe(fs.createWriteStream(tmpFile.name))
				.once("finish", resolve);
		});
		const content = fs.readFileSync(tmpFile.name);
		const base64Content = content.toString("base64");
		const [audioText] = await this.client.recognize({
			audio: {
				content: base64Content,
			},
			config: {
				languageCode: "pt-BR",
				encoding: "OGG_OPUS",
				sampleRateHertz: 48000,
			},
		});
		const transcription = audioText.results
			?.map((result) => result.alternatives?.[0]?.transcript)
			.join("\n");
		return transcription ?? "";
	}
}
