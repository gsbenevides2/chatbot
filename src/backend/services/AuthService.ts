import { StatusMap } from "elysia";
import { getEnv } from "../../utils/getEnv";

const AUTH_SECRET = getEnv("AUTH_SECRET");

export class AuthService {
	static async verify(secret: string) {
		return secret === AUTH_SECRET;
	}
}

export class UnauthorizedError extends Error {
	status: number = StatusMap.Unauthorized;
	message = "Unauthorized";
	constructor() {
		super();
		this.name = "Unauthorized";
	}

	toResponse() {
		return Response.json(
			{
				error: this.message,
			},
			{
				status: this.status,
			},
		);
	}
}
