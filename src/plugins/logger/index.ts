import { randomUUIDv7 } from "bun";
import Elysia, { NotFoundError } from "elysia";
import {
	duration,
	formatArrow,
	formatDate,
	formatMethod,
	formatStatus,
	showInfo,
} from "./formatters";

function checkIfToResponse(
	// biome-ignore lint/suspicious/noExplicitAny: I don't know what type this is
	error: any,
): error is { toResponse: () => Response } {
	try {
		error.toResponse();
	} catch (_) {
		return false;
	}
	return true;
}

export function logger() {
	const app = new Elysia({
		name: "logger-bene",
	});

	app
		.onRequest((ctx) => {
			const operationId = randomUUIDv7();
			const time = process.hrtime.bigint();
			const method = ctx.request.method;
			const path = new URL(ctx.request.url).pathname;

			const ip = ctx.server?.requestIP(ctx.request)?.address;
			const port = ctx.server?.requestIP(ctx.request)?.port;
			const userAgent = ctx.request.headers.get("user-agent");

			ctx.store = {
				operationId,
				time,
			};
			ctx.set.headers["x-operation-id"] = operationId;

			console.log(`${formatArrow("in")} ${formatMethod(method)} ${path}`);
			console.log(showInfo("Received At:", formatDate(new Date())));
			console.log(showInfo("Operation ID:", operationId));
			console.log(showInfo("IP/Port:", `${ip}:${port}`));
			console.log(showInfo("UA:", userAgent || "No UserAgent"));
		})
		.onAfterResponse({ as: "global" }, async (ctx) => {
			const method = ctx.request.method;
			const path = new URL(ctx.request.url).pathname;
			if (ctx.response instanceof Error) return;
			const { operationId, time } = ctx.store as {
				operationId: string;
				time: bigint;
			};
			const timeDiff = Number(process.hrtime.bigint() - time) / 1000000;
			let status = ctx.set.status;
			if (ctx.error instanceof NotFoundError) {
				status = 404;
			}

			console.log(
				`${formatArrow("out")} ${formatMethod(method)} ${path} | ${formatStatus(status as number)}`,
			);
			console.log(showInfo("Operation ID:", operationId));
			console.log(showInfo("Time:", duration(timeDiff)));
			console.log(showInfo("Sent At:", formatDate(new Date())));

			if (status && (Number(status) < 200 || Number(status) >= 300)) {
				console.log(showInfo("Body:", JSON.stringify(ctx.body)));
				const response = ctx.response instanceof Response ? ctx.response : null;
				if (response?.bodyUsed === false) {
					const body = await response.text();
					console.log(showInfo("Response:", JSON.stringify(body)));
				} else if (checkIfToResponse(ctx.error)) {
					const response = ctx.error.toResponse() as Response;
					const body = await response.text();
					console.log(showInfo("Response:", JSON.stringify(body)));
				} else if ("code" in ctx.error) {
					console.log(showInfo("Response:", JSON.stringify(ctx.error.code)));
				}
			}
			if (status === 401) {
				const authorizationHeader = ctx.request.headers.get("authorization");
				console.log(
					showInfo("Authorization:", authorizationHeader || "No Authorization"),
				);
			}
		});

	return app;
}
