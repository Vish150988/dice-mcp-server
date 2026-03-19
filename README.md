# dice-mcp-server

A **Model Context Protocol (MCP) server** for [Dice.com](https://www.dice.com) — the #1 job board for tech professionals.

Enables Claude and other MCP clients to **search Dice.com jobs directly**, with full support for:
- 🔍 Keyword + location search
- 💼 Contract / C2C / Third-Party filtering
- 🏠 Remote / Hybrid / On-Site filtering
- 📅 Recency filters (1, 3, 7, 30 days)
- 📄 Full job detail retrieval

---

## Tools

| Tool | Description |
|------|-------------|
| `dice_search_jobs` | Search Dice.com with full filter support |
| `dice_search_contract_c2c` | Pre-filtered search for contract & C2C roles |
| `dice_get_job_detail` | Get full description for a specific job |

---

## Installation

### 1. Clone & Build

```bash
git clone https://github.com/YOUR_USERNAME/dice-mcp-server.git
cd dice-mcp-server
npm install
npm run build
```

### 2. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dice": {
      "command": "node",
      "args": ["/absolute/path/to/dice-mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop — Dice.com search will now be available!

---

## Usage Examples

- *"Search Dice for remote contract Data Architect roles posted in the last 7 days"*
- *"Find C2C Snowflake Engineer contracts on Dice"*
- *"Search Dice for Lead BI Engineer roles with a salary above $75/hr"*

---

## Tech Stack

- **TypeScript** + **MCP SDK** (`@modelcontextprotocol/sdk`)
- **Axios** for HTTP requests
- **Zod** for runtime input validation
- Transport: **stdio** (local) / **Streamable HTTP** (remote)

---

## Notes

This server uses Dice.com's internal search API. It is intended for **personal use only**. No official API partnership exists. The API endpoint or headers may change — PRs to update them are welcome.

---

## License

MIT
