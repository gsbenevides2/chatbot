export const fetcherLogger = async (
	url: string | URL,
	options: RequestInit | undefined,
) => {
	const response = await fetch(url, options);
	if (url instanceof URL) {
		console.log("MCP Fetcher", url.toString());
	} else {
		console.log("MCP Fetcher", url);
	}
	console.log(`   Method: ${options?.method ?? "GET"}`);
	console.log(`   Body: ${options?.body ?? "No body"}`);
	console.log(`   Headers: ${JSON.stringify(options?.headers)}`);
	console.log(`   Response: ${response.status} ${response.statusText}`);
	const clone = response.clone();
	console.log(`   Response Text: ${await clone.text()}`);
	return response;
};
