const UNITS = ["µs", "ms", "s"];
const DURATION_FORMATTER = Intl.NumberFormat(undefined, {
	maximumFractionDigits: 2,
});

export function duration(duration: number | null): string {
	if (!duration) {
		return "-/-";
	}
	let unitIndex = 0;
	while (duration >= 1000 && unitIndex < UNITS.length - 1) {
		duration /= 1000;
		unitIndex++;
	}

	return `${DURATION_FORMATTER.format(duration)}${UNITS[unitIndex]}`;
}

const METHOD_COLORS = {
	GET: "32", // green
	POST: "34", // blue
	PUT: "33", // yellow
	DELETE: "31", // red
};

export function formatMethod(method: string) {
	return `\x1b[${METHOD_COLORS[method as keyof typeof METHOD_COLORS]}m${method}\x1b[0m`;
}

export function formatArrow(type: "in" | "out") {
	return `\x1b[${type === "in" ? "32" : "31"}m${type === "out" ? "<-" : "->"}\x1b[0m`;
}

export function formatBold(text: string) {
	return `\x1b[1m${text}\x1b[0m`;
}

export function showInfo(title: string, value: string) {
	return `   ${formatBold(title)} ${value}`;
}

export function formatDate(date: Date) {
	return Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(date);
}

export function formatStatus(status: number) {
	const STATUS_COLORS = {
		success: "32", // green
		info: "34", // blue
		warning: "33", // yellow
		error: "31", // red
	};
	if (status >= 200 && status < 300) {
		return `\x1b[${STATUS_COLORS.success}m${status}\x1b[0m`;
	}
	if (status >= 300 && status < 400) {
		return `\x1b[${STATUS_COLORS.info}m${status}\x1b[0m`;
	}
	if (status >= 400 && status < 500) {
		return `\x1b[${STATUS_COLORS.warning}m${status}\x1b[0m`;
	}
	if (status >= 500 && status < 600) {
		return `\x1b[${STATUS_COLORS.error}m${status}\x1b[0m`;
	}
	return `\x1b[${STATUS_COLORS.error}m${status}\x1b[0m`;
}
