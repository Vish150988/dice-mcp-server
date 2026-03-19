import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/diceTools.js";

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------
const server = new McpServer({
  name: "dice-mcp-server",
  version: "1.0.0",
});

// Register all Dice.com tools
registerTools(server);

// ---------------------------------------------------------------------------
// Transport — stdio for local Claude Desktop usage
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Dice MCP Server running (stdio). Tools: dice_search_jobs, dice_search_contract_c2c, dice_get_job_detail");
}

main().catch((err: unknown) => {
  console.error("❌ Fatal error starting Dice MCP Server:", err);
  process.exit(1);
});
