# 🎲 dice-mcp-server

A **Model Context Protocol (MCP) server** that connects Claude to [Dice.com](https://www.dice.com) — the #1 job board for tech professionals.

Search for **contract, C2C, and full-time tech jobs** directly from Claude Desktop — no browser needed.

---

## 📋 Table of Contents

- [What It Does](#what-it-does)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Claude Desktop Setup](#claude-desktop-setup)
- [How to Use](#how-to-use)
- [Available Tools](#available-tools)
- [API Key Rotation](#api-key-rotation)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## What It Does

Once installed, you can ask Claude things like:

- *"Search Dice for remote C2C Data Architect roles"*
- *"Find contract Power BI jobs posted this week on Dice"*
- *"Show me Lead BI Engineer contracts with Snowflake"*
- *"Get full details on this Dice job: https://www.dice.com/job-detail/..."*

Claude will search Dice.com in real time and return matching jobs with salary, company, location, skills, and direct links.

---

## Prerequisites

Before you begin, make sure you have:

| Requirement | Version | Check |
|-------------|---------|-------|
| [Node.js](https://nodejs.org) | v18 or higher | `node --version` |
| [Git](https://git-scm.com) | Any recent version | `git --version` |
| [Claude Desktop](https://claude.ai/download) | Latest | Download from claude.ai |


---

## Installation

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Vish150988/dice-mcp-server.git
cd dice-mcp-server
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Build the Project

```bash
npm run build
```

> ✅ This compiles the TypeScript source into the `dist/` folder.
> The entry point will be at `dist/index.js`.

---

## Claude Desktop Setup

### Step 4 — Find Your Claude Desktop Config File

| OS | Config File Location |
|----|----------------------|
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

### Step 5 — Add the Dice MCP Server

Open the config file in any text editor and add the `dice` entry inside `mcpServers`:

**Windows:**
```json
{
  "mcpServers": {
    "dice": {
      "command": "node",
      "args": ["C:/Users/YOUR_USERNAME/dice-mcp-server/dist/index.js"]
    }
  }
}
```

**macOS / Linux:**
```json
{
  "mcpServers": {
    "dice": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dice-mcp-server/dist/index.js"]
    }
  }
}
```

> ⚠️ Replace `YOUR_USERNAME` with your actual username and adjust the path to where you cloned the repo.

### Step 6 — Restart Claude Desktop

Fully quit Claude Desktop and reopen it.

- **Windows:** Right-click the Claude icon in the system tray → **Quit**, then reopen
- **macOS:** Claude menu → **Quit Claude**, then reopen

### Step 7 — Verify It's Working

Click the **🔧 tools icon** in the Claude Desktop chat box.
You should see these 3 tools listed under **dice**:

- `dice_search_jobs`
- `dice_search_contract_c2c`
- `dice_get_job_detail`


---

## How to Use

Just talk to Claude naturally! Here are some example prompts:

### General Search
- *"Search Dice for Senior Data Engineer jobs in Austin TX"*
- *"Find remote Snowflake jobs posted this week"*
- *"Show me full-time Python Developer roles in New York"*

### Contract and C2C Search
- *"Find C2C Data Architect contracts on Dice"*
- *"Search for remote contract Power BI roles posted today"*
- *"Show Lead BI Engineer C2C jobs with Databricks"*

### Job Details
- *"Get full details on this job: https://www.dice.com/job-detail/abc-123"*
- *"Tell me more about the first result"*

---

## Available Tools

### dice_search_jobs
General-purpose search with all filters: query, location, radius, employmentType (FULLTIME/PARTTIME/CONTRACTS/THIRD_PARTY), workplaceType (Remote/On-Site/Hybrid), postedDate (ONE/THREE/SEVEN/THIRTY days), page, pageSize.

### dice_search_contract_c2c
Pre-filtered for remote contract and C2C roles. Searches both CONTRACTS and THIRD_PARTY types simultaneously and deduplicates results. Parameters: query, location, postedDate, page, pageSize.

### dice_get_job_detail
Get full details of a specific job by its Dice URL or ID.

---

## API Key Rotation

This server uses Dice.com's internal API. If the key expires, you'll see this error:

```
DICE API KEY EXPIRED OR INVALID (HTTP 403)
```

### How to get a new key (2 minutes):

1. Open Chrome and go to https://www.dice.com/jobs
2. Press **F12** to open DevTools
3. Click the **Network** tab
4. Search for any job (e.g. "Data Engineer")
5. Find a request to `job-search-api.svc.dhigroupinc.com`
6. Click it and go to the **Headers** tab
7. Copy the value of `x-api-key`
8. Open `src/constants.ts` in the project
9. Replace the `x-api-key` value in `REQUEST_HEADERS`
10. Run `npm run build` then restart Claude Desktop

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tools not showing in Claude Desktop | Make sure you fully quit and reopened Claude Desktop |
| `Cannot find module` error | Run `npm install` then `npm run build` in the project folder |
| `API KEY EXPIRED` error | Follow the API Key Rotation steps above |
| `RATE LIMITED` error | Wait 30-60 seconds and try again |
| No results returned | Try broader keywords or remove filters |
| Push rejected on git | Run `git push origin main --force` |

---

## Project Structure

```
dice-mcp-server/
├── src/
│   ├── index.ts                  # Main entry point (stdio transport)
│   ├── constants.ts              # API URL, headers, filter values
│   ├── types.ts                  # TypeScript interfaces
│   ├── schemas/
│   │   └── searchSchemas.ts      # Zod validation schemas for all tools
│   ├── services/
│   │   ├── diceApi.ts            # Dice.com HTTP client + key rotation check
│   │   └── formatter.ts          # Response formatters (job cards, lists)
│   └── tools/
│       └── diceTools.ts          # MCP tool registrations (all 3 tools)
├── dist/                         # Compiled JavaScript (run by Claude Desktop)
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## Tech Stack

- **TypeScript** with strict mode
- **MCP SDK** (`@modelcontextprotocol/sdk`) — stdio transport
- **Axios** — HTTP requests to Dice API
- **Zod** — runtime input validation

---

## License

MIT — free to use, modify, and distribute.

---

## Author

Built by [Vish150988](https://github.com/Vish150988)
