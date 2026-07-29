# 🚀 AgentRoom — Multi-Agent WebRTC Orchestration & Collaborative Workspace

![AgentRoom Banner](./public/agentroom_banner.jpg)

**AgentRoom** is an AI-native, multi-agent WebRTC conference room and orchestration platform. It brings human participants and autonomous AI agents together in a real-time audio/video room equipped with low-latency event-driven message meshes, rank-prioritized task scheduling, and live agent deliverable generation.

---

## 🌟 Key Features

* **🎙️ WebRTC Real-Time Audio & Video Conference**: Real-time room streaming built on LiveKit WebRTC architecture with Voice Activity Detection (VAD) and live participant grid.
* **🧠 Lead PM Orchestrator Agent**: An intelligent Lead AI Agent that listens to user voice/text commands, breaks down complex goals into sub-tasks, and dynamically coordinates specialist agents.
* **🤖 Autonomous Sub-Agent Swarm**:
  * **💻 CodeAgent**: Formulates full-stack scaffolds, REST/GraphQL schemas, and algorithms.
  * **🔍 ResearchAgent**: Analyzes architecture docs, benchmarks, and technical requirements.
  * **🎨 DesignAgent**: Generates UI/UX design specifications, theme tokens, and layout guidelines.
  * **🛡️ Security & QA Agent**: Conducts security audits, test plan generation, and code quality checks.
* **📋 Rank-Based Master Agenda (Drag & Drop)**: Interactive Scrum Master agenda with reordering capabilities (`#1`, `#2`, `#3`), status toggles, task creation, and instant priority shifts for active agents.
* **⚡ Event-Driven Pub/Sub Mesh**: Standardized JSON event bus broadcast over WebRTC data channels and server event streams (`pm:control`, `agents:status`, `agents:output`, `room:presence`).
* **📦 Live Deliverables Workspace**: Real-time generation and inspection of structured code files, OpenAPI specs, architecture diagrams, and technical briefs.

---

## 🤖 Agents in Action: End-to-End Workflows

### Workflow 1: Sprint Architecture & Automated Code Scaffolding
1. **User Request**: The user enters the room and requests `"Design a high-throughput microservice architecture for video streaming."`
2. **PM Orchestrator**: The Lead PM Agent analyzes the prompt and broadcasts an `agent:spawn` event to spin up **ResearchAgent** and **CodeAgent**.
3. **ResearchAgent Execution**: ResearchAgent scans performance benchmarks for SFU video topologies and publishes a technical brief to `agents:output`.
4. **CodeAgent Execution**: CodeAgent reads the research brief and generates a full-stack TypeScript scaffold complete with API routes and database schemas.
5. **Deliverable Saved**: The generated code appears in the **Deliverables Tab** for instant review and export.

```
+------------------+         +--------------------+         +---------------------+
| Human Participant| ------->|  PM Orchestrator   | ------->|   Sub-Agent Swarm   |
| (Voice / Text)   |         | (Decomposes Goals) |         | (Code, Research, QA)|
+------------------+         +--------------------+         +---------------------+
                                       |                               |
                                       v                               v
                             +--------------------+         +---------------------+
                             | Master Agenda      |         | Pub/Sub Event Mesh  |
                             | (Rank Reordering)  |         | (Live Event Stream) |
                             +--------------------+         +---------------------+
```

### Workflow 2: Real-time Audio Voice Commands & Transcription
1. **Voice Activity Detection**: When the user speaks into their microphone, the WebRTC audio processor captures speech energy.
2. **Real-time Transcription**: The system converts speech to text and streams transcriptions into the live room feed.
3. **Agent Trigger**: The PM Orchestrator reads the live transcript in real-time and issues sub-task commands without interrupting the ongoing voice conversation.

---

## 🕹️ Comprehensive User Action & Option Guide

| Category | UI Location | Action / Feature | Description |
| :--- | :--- | :--- | :--- |
| **Media Controls** | Bottom Bar | **Mute / Unmute Mic** | Toggles WebRTC local microphone audio capture with VAD feedback. |
| **Media Controls** | Bottom Bar | **Toggle Camera** | Starts or stops local WebRTC video feed. |
| **Media Controls** | Bottom Bar | **Screen Share** | Shares desktop workspace or browser window into the room grid. |
| **Media Controls** | Bottom Bar | **Disconnect Room** | Leaves the WebRTC session and cleans up active agent state. |
| **Agent Control** | Right Sidebar | **Spawn Agent** | Manually spins up additional specialist agents (e.g., CodeAgent, QA Agent). |
| **Agent Control** | Right Sidebar | **Direct Message** | Send isolated prompt instructions directly to a specific sub-agent. |
| **Agent Control** | Right Sidebar | **Terminate Agent** | Gracefully terminates an active agent and releases room resources. |
| **Master Agenda** | Right Sidebar | **Drag & Drop Reorder** | Drag the handle (`GripVertical`) to change task rank priorities. |
| **Master Agenda** | Right Sidebar | **Rank Buttons** | Use Up (`▲`) and Down (`▼`) arrows to adjust task priority ranks. |
| **Master Agenda** | Right Sidebar | **Task Add / Delete** | Add custom agenda items (`+`) or remove completed tasks (`Trash`). |
| **Event Stream** | Right Sidebar | **Pub/Sub Log View** | View real-time JSON protocol events passing through room data channels. |
| **Deliverables** | Right Sidebar | **Inspect & Copy** | Click on generated deliverables to view formatted code or docs with 1-click copy. |

---

## 📡 Pub/Sub Event Mesh Protocol Specification

All agents communicate asynchronously via structured JSON payloads:

```json
{
  "id": "evt_1785309100",
  "timestamp": "2026-07-29T00:10:00Z",
  "channel": "agents:status",
  "source": "CodeAgent_01",
  "destination": "PM_Orchestrator",
  "eventType": "task:progress",
  "payload": {
    "taskId": "task_api_design",
    "progressPercentage": 85,
    "currentStep": "Generating TypeScript interfaces..."
  }
}
```

### Channel Definitions:
* `pm:control`: High-priority commands sent by the PM Orchestrator to control sub-agent lifecycles.
* `agents:status`: Periodic heartbeat and progress updates sent by active sub-agents.
* `agents:output`: Deliverable outputs, generated code, and research findings.
* `room:presence`: User and agent join/leave telemetry.

---

## 🛠️ Complete Setup & Quick Start Guide

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **Gemini API Key**: (Optional, for server-side generative AI features)

---

### Step 1: Environment Configuration

Create a `.env` file in the project root directory (or copy `.env.example`):

```env
# Server Port (Default: 3000)
PORT=3000

# Google Gemini API Key (Server-side model generation)
GEMINI_API_KEY=your_gemini_api_key_here

# LiveKit WebRTC Configuration (Optional for Cloud LiveKit)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud

# Redis Pub/Sub Configuration (Optional for multi-server scaling)
REDIS_URL=redis://localhost:6379
```

---

### Step 2: Installation

Install all project dependencies:

```bash
npm install
```

---

### Step 3: Development Mode

Launch the unified Vite development server and Express backend:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

### Step 4: Production Build & Deployment

To compile the application for production:

1. **Build the Client & Server**:
   ```bash
   npm run build
   ```

2. **Start the Production Server**:
   ```bash
   npm start
   ```

The compiled output will be served from `dist/server.cjs` on port `3000`.

---

## 📐 Project Architecture

```
├── server.ts                    # Express + Vite SSR entry point & PubSub WebSocket hub
├── src/
│   ├── App.tsx                  # Main WebRTC video room layout & state hub
│   ├── types.ts                 # TypeScript interfaces for Agents, Agenda & Events
│   ├── components/
│   │   ├── AgentDashboardSidebar.tsx  # Agent Swarm, Drag & Drop Agenda, PubSub & Deliverables
│   │   ├── VideoGrid.tsx        # WebRTC video tiles, agent avatars, and audio meters
│   │   ├── ControlsBar.tsx      # Mic, Video, Screen Share & Room Disconnect controls
│   │   └── Header.tsx           # Room connection metrics, latency, and status badges
│   └── lib/                     # WebRTC & Audio synthesis utilities
├── public/
│   └── agentroom_banner.jpg     # Architectural visual banner
└── package.json                 # Build & deployment scripts
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
