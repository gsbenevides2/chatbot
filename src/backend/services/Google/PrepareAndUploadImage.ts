import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Storage } from "@google-cloud/storage";
import axios from "axios";
import { randomUUIDv7 } from "bun";
import sharp from "sharp";
import { fileSync } from "tmp";

export class PrepareAndUploadImage {
	storageClient = new Storage({
		scopes: ["https://www.googleapis.com/auth/cloud-platform"],
	});

	bucketName = "gui-dev-br.appspot.com";

	async prepareImage(imagePath: string) {
		let sharpImage = sharp(fs.readFileSync(imagePath));
		const metadata = await sharpImage.metadata();

		if (!metadata.width || !metadata.height) {
			throw new Error("Could not determine image dimensions");
		}

		const MAX_WIDTH = 8000;
		const MAX_HEIGHT = 8000;
		const MAX_SIZE = 1024 * 1024 * 5; // 5MB

		const originalWidth = metadata.width;
		const originalHeight = metadata.height;

		let newWidth = originalWidth;
		let newHeight = originalHeight;

		// Check if resizing is needed
		if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
			let ratio = 1;

			if (originalWidth > originalHeight) {
				ratio = MAX_WIDTH / originalWidth;
			} else {
				ratio = MAX_HEIGHT / originalHeight;
			}

			// Calculate new dimensions
			newWidth = Math.floor(originalWidth * ratio);
			newHeight = Math.floor(originalHeight * ratio);

			// Apply resize
			sharpImage = sharpImage.resize(newWidth, newHeight);
		}

		let quality = 100;
		let imageBuffer: Buffer;

		// Progressively reduce quality until file size is below MAX_SIZE
		while (true) {
			if (quality < 0) {
				throw new Error("Image size is too large");
			}

			imageBuffer = await sharpImage.jpeg({ quality }).toBuffer();

			if (imageBuffer.length < MAX_SIZE) {
				break;
			}

			quality -= 10;
		}

		return imageBuffer;
	}

	private createPersistentDownloadUrl(fileName: string, downloadToken: string) {
		const pathName = path.join(
			"v0",
			"b",
			this.bucketName,
			"o",
			encodeURIComponent(fileName),
		);

		const url = new URL(pathName, "https://firebasestorage.googleapis.com");
		url.searchParams.set("alt", "media");
		url.searchParams.set("token", downloadToken);

		return url.toString();
	}

	async prepareAndUploadImage(imageUrl: string) {
		const tmpFile = fileSync();
		const response = await axios.get(imageUrl, { responseType: "stream" });
		await new Promise<void>((resolve) => {
			response.data
				.pipe(fs.createWriteStream(tmpFile.name))
				.once("finish", resolve);
		});
		const imageBuffer = await this.prepareImage(tmpFile.name);
		const downloadToken = randomUUID();
		const bucket = this.storageClient.bucket(this.bucketName);
		const fileName = `ai/${randomUUIDv7()}.jpeg`;
		const blob = bucket.file(fileName);
		await blob.save(imageBuffer);
		await blob.setMetadata({
			metadata: {
				firebaseStorageDownloadTokens: downloadToken,
			},
		});
		return this.createPersistentDownloadUrl(fileName, downloadToken);
	}

	async prepareMultipleImages(imageUrls: string[]) {
		const images = await Promise.all(
			imageUrls.map(this.prepareAndUploadImage.bind(this)),
		);
		return images;
	}
}
