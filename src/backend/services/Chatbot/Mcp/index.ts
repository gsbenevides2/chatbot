import { Client as SDKMCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { getEnv } from "../../../../utils/getEnv";
import { EnvironmentOAuthProvider } from "./EnvironmentOAuthProvider";

type Tools = Awaited<
	ReturnType<typeof SDKMCPClient.prototype.listTools>
>["tools"];

type ToolCallArgs = Record<string, unknown> | unknown;

export class Mcp {
	private static instance: Mcp;
	private constructor() {}
	public static getInstance(): Mcp {
		if (!Mcp.instance) {
			Mcp.instance = new Mcp();
		}
		return Mcp.instance;
	}
	public REQUEST_TIMEOUT = DEFAULT_REQUEST_TIMEOUT_MSEC * 2;

	private client = new SDKMCPClient({
		name: "mcp-client-cli",
		version: "1.0.0",
	});
	private connected = false;
	private tools: Tools = [];

	private CLIENT_URL = getEnv("MCP_SERVER_ADDRESS");

	public async connectAndSaveTools() {
		await this.getTools();
	}

	public async getConnectedClient() {
		if (!this.connected) {
			console.log("Connecting to MCP server");
			await this.client
				.connect(
					new StreamableHTTPClientTransport(new URL("/mcp", this.CLIENT_URL), {
						authProvider: new EnvironmentOAuthProvider(),
					}),
				)
				.catch((error) => {
					console.error("Error connecting to MCP server", error);
					throw error;
				});
			console.log("Connected to MCP server");
		}

		return this.client;
	}

	public async getTools(forceRefresh: boolean = false) {
		if (this.tools.length === 0 || forceRefresh) {
			const connectedClient = await this.getConnectedClient();
			console.log("Getting tools from MCP server");
			const tools = await connectedClient.listTools().catch((error) => {
				console.error("Error getting tools from MCP server", error);
				throw error;
			});
			console.log("Tools received from MCP server", tools.tools.length);
			this.tools = tools.tools;
		}
		return this.tools;
	}

	public async callTool(toolName: string, toolInput: ToolCallArgs) {
		const tool = this.tools.find((tool) => tool.name === toolName);
		if (!tool) {
			throw new Error(`Tool ${toolName} not found`);
		}
		const connectedClient = await this.getConnectedClient();
		return connectedClient.callTool(
			{
				name: toolName,
				arguments: toolInput as Record<string, unknown>,
			},
			undefined,
			{
				maxTotalTimeout: this.REQUEST_TIMEOUT,
				timeout: this.REQUEST_TIMEOUT,
			},
		);
	}
}
