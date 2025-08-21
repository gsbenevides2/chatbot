import { getEnv } from "../../utils/getEnv";

const AUTH_SECRET = getEnv("AUTH_SECRET");

export class AuthService {
	static async verify(secret: string) {
		return secret === AUTH_SECRET;
	}
}
