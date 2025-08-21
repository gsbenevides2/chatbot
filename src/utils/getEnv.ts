export function getEnv(
	key: string,
	required: boolean = true,
	defaultValue?: string,
) {
	const value = Bun.env[key];
	if (!value && required) {
		throw new Error(`Environment variable ${key} is not set`);
	} else if (!value && !required) {
		return defaultValue as string;
	}
	return value as string;
}
