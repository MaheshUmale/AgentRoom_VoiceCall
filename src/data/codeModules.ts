import { CodeModuleSpec } from '../types';

export const CODE_MODULES: CodeModuleSpec[] = [
  {
    id: 'arch_blueprint',
    title: '1. Architectural Blueprint & Topology',
    category: 'System Architecture',
    language: 'markdown',
    description: 'Full WebRTC topology, PM Orchestrator multi-modal loop, and Redis Pub/Sub event bus specifications.',
    keyFeatures: [
      'Single WebRTC room topology treating User, PM, and Sub-Agents as equal video participants',
      'PM Orchestrator multi-modal listening loop with tool-calling capabilities',
      'Asynchronous Redis Pub/Sub text event queue isolating bot-to-bot messaging from media tracks',
      'Voice-first user interaction with real-time speech synthesis and visual feedback'
    ],
    code: `# AgentRoom: Real-Time Multi-Agent WebRTC Architecture Specification

## 1. System Overview
AgentRoom establishes a unified WebRTC conference room (powered by LiveKit Media Server) where human users and AI agents participate as peer WebRTC endpoints.

### Key Architectural Layers:
1. **Media & Signaling Plane (WebRTC/LiveKit)**:
   - SFU (Selective Forwarding Unit) handles WebRTC media routing (VP8/H.264 video, Opus audio).
   - User, PM Orchestrator, and Sub-Agents publish/subscribe audio & video tracks inside the same Room ID.

2. **PM Orchestrator Loop (Multi-Modal Controller)**:
   - Connects as an active WebRTC participant with real-time audio/video input & output.
   - Powered by Gemini 2.5 / GPT-4o with Function Calling capabilities.
   - Listens to user voice input -> executes tool calls (\`spawn_agent\`, \`send_message_to_agent\`, \`terminate_agent\`) -> verbalizes progress updates back to the user.

3. **Event & Messaging Bus (Redis Pub/Sub)**:
   - High-throughput asynchronous event bus for agent-to-agent communication.
   - Channels:
     - \`pm:control\`: PM broadcasts commands and task assignments to Sub-Agents.
     - \`agents:status\`: Sub-Agents publish heartbeat, task completion, and log artifacts.
     - \`room:presence\`: WebRTC room join/leave lifecycle hooks.

\`\`\`
                               ┌───────────────────────────────────────────────┐
                               │           WebRTC SFU Media Server            │
                               │               (LiveKit Engine)                │
                               └───────┬───────────────┬───────────────┬───────┘
                                       │ Media (Opus)  │ Media (Opus)  │ Media (VP8/Opus)
                                       ▼               ▼               ▼
  ┌──────────────────┐       ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │    Human User    │◄─────►│ PM Orchestrator  │  │ Sub-Agent (Code) │  │ Sub-Agent (Res)  │
  │   (Web Client)   │ WebRTC│   (Python Bot)   │  │   (Python Bot)   │  │   (Python Bot)   │
  └──────────────────┘       └─────────┬────────┘  └─────────┬────────┘  └─────────┬────────┘
                                       │                     │                     │
                                       │ Redis Pub/Sub       │ Redis Pub/Sub       │ Redis Pub/Sub
                                       ▼                     ▼                     ▼
                             ┌──────────────────────────────────────────────────────────┐
                             │               Redis Pub/Sub Control Bus                  │
                             │   Channels: pm:control | agents:status | room:presence   │
                             └──────────────────────────────────────────────────────────┘
\`\`\`
`
  },
  {
    id: 'module_a',
    title: 'Module A: Backend Media & Signaling Server',
    category: 'Node.js / TypeScript',
    language: 'typescript',
    description: 'Production LiveKit Room Factory, JWT Token Authentication, and Participant Event Handlers.',
    keyFeatures: [
      'Token factory for Users, PM Orchestrator, and dynamically generated Sub-Agents',
      'WebRTC room lifecycle management & automated webhook handlers',
      'Room metadata synchronization for active agent state tracking',
      'Express backend integration with port 3000 ingress support'
    ],
    code: `/**
 * Module A: LiveKit WebRTC Signaling & Room Factory Server
 * Node.js / TypeScript implementation using @livekit/server-sdk
 */

import express, { Request, Response } from 'express';
import { AccessToken, RoomServiceClient, RoomEvent } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secretkey_agentroom_production_123';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export interface TokenRequestParams {
  roomName: string;
  identity: string;
  participantName: string;
  role: 'user' | 'pm_orchestrator' | 'sub_agent';
  personaType?: string;
}

/**
 * Generates secure WebRTC Access Tokens with role-based permissions
 */
export async function generateParticipantToken(params: TokenRequestParams): Promise<string> {
  const { roomName, identity, participantName, role, personaType } = params;

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: participantName,
    ttl: '8h',
    metadata: JSON.stringify({
      role,
      personaType: personaType || 'default',
      spawnedAt: new Date().toISOString(),
    }),
  });

  // Grant WebRTC room capabilities based on participant role
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // PM and User can manage room metadata
    roomAdmin: role === 'pm_orchestrator' || role === 'user',
  });

  return await token.toJwt();
}

/**
 * Express Router setup for WebRTC Room Management
 */
export function setupWebRTCServerRoutes(app: express.Application) {
  // Token generation endpoint
  app.post('/api/webrtc/token', async (req: Request, res: Response) => {
    try {
      const { roomName = 'agent-room-101', identity, participantName, role, personaType } = req.body;

      if (!identity || !role) {
        return res.status(400).json({ error: 'Missing required parameters: identity, role' });
      }

      const jwt = await generateParticipantToken({
        roomName,
        identity,
        participantName: participantName || identity,
        role,
        personaType,
      });

      return res.json({
        token: jwt,
        serverUrl: LIVEKIT_URL,
        roomName,
      });
    } catch (error: any) {
      console.error('Error generating LiveKit token:', error);
      return res.status(500).json({ error: 'Failed to generate media token', details: error.message });
    }
  });

  // Active participants in room
  app.get('/api/webrtc/room/:roomName/participants', async (req: Request, res: Response) => {
    try {
      const { roomName } = req.params;
      const participants = await roomService.listParticipants(roomName);
      return res.json({ participants });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to list participants', details: error.message });
    }
  });

  // LiveKit Webhook Receiver for Participant Join/Leave events
  app.post('/api/webrtc/webhooks', express.raw({ type: 'application/webhook+json' }), (req, res) => {
    try {
      const event = JSON.parse(req.body.toString());
      console.log(\`[LiveKit Webhook] Event: \${event.event} | Room: \${event.room?.name} | Participant: \${event.participant?.identity}\`);

      if (event.event === 'participant_joined') {
        // Log participant join to system monitor
      } else if (event.event === 'participant_left') {
        // Clean up orphaned sub-agent workers if PM disconnects
      }

      res.status(200).send('OK');
    } catch (err) {
      res.status(400).send('Webhook Processing Failed');
    }
  });
}
`
  },
  {
    id: 'module_b',
    title: 'Module B: PM Orchestrator Engine',
    category: 'Python',
    language: 'python',
    description: 'Python Real-Time Multi-Modal PM Agent using LiveKit Agents SDK & Function Calling Tool Execution.',
    keyFeatures: [
      'LiveKit Agents SDK real-time audio/video connection wrapper',
      'System prompt enforcing Agile PM / Scrum Master persona',
      'Tool definitions: spawn_agent, send_message_to_agent, terminate_agent',
      'Redis Pub/Sub integration for routing sub-agent tasks'
    ],
    code: `""
Module B: PM Orchestrator Engine (Python)
Real-time bidirectional agent using LiveKit Agents SDK & Multi-Modal Function Calling.
""

import asyncio
import json
import logging
import os
import redis.asyncio as aioredis
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli, tts, stt, llm
from google import genai
from google.genai import types

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pm-orchestrator")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# System Prompt enforcing PM / Scrum Master Persona
PM_SYSTEM_PROMPT = """
You are Alex, the Lead Technical PM Orchestrator in a real-time video conference room called AgentRoom.
Your job is to interact directly with the human user via voice and video, analyze their requirements,
and dynamically spawn and manage specialized AI Sub-Agents to perform technical work in parallel.

Rules & Behavior:
1. Speak concisely, clearly, and professionally like an expert Silicon Valley Lead PM.
2. When the user asks for a project to be built or analyzed, immediately break down the work into tasks.
3. Use your tools to spawn specialized Sub-Agents for each task domain:
   - Code Architect / Engineer (CodeAgent)
   - Research & Market Analyst (ResearchAgent)
   - UX/UI Designer (DesignerAgent)
   - QA & Test Engineer (QABot)
4. Keep the Master Agenda updated and verbally summarize sub-agent completions to the user.
5. NEVER reveal raw JSON or low-level logs to the user verbally—synthesize it into key takeaways.
"""

class PMOrchestrator:
    def __init__(self, room: rtc.Room, redis_client: aioredis.Redis):
        self.room = room
        self.redis = redis_client
        self.active_agents = {}
        self.master_agenda = []
        self.gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    async def initialize_tools(self):
        """Define tool calling schemas for the PM LLM"""
        self.tools = [
            types.FunctionDeclaration(
                name="spawn_agent",
                description="Dynamically spawns a specialized Sub-Agent into the WebRTC room to perform a task.",
                parameters=types.Schema(
                    type="OBJECT",
                    properties={
                        "name": types.Schema(type="STRING", description="Name of the agent e.g. DevBot-Alpha"),
                        "persona": types.Schema(type="STRING", description="Persona type: code_architect, research_analyst, ux_designer, qa_engineer"),
                        "initial_task": types.Schema(type="STRING", description="Detailed description of task assigned to sub-agent")
                    },
                    required=["name", "persona", "initial_task"]
                )
            ),
            types.FunctionDeclaration(
                name="send_message_to_agent",
                description="Sends an updated instruction or query to an existing active Sub-Agent via Redis Pub/Sub.",
                parameters=types.Schema(
                    type="OBJECT",
                    properties={
                        "agent_id": types.Schema(type="STRING", description="ID or name of target agent"),
                        "message": types.Schema(type="STRING", description="Instruction text")
                    },
                    required=["agent_id", "message"]
                )
            ),
            types.FunctionDeclaration(
                name="terminate_agent",
                description="Terminates an active sub-agent when its tasks are finished.",
                parameters=types.Schema(
                    type="OBJECT",
                    properties={
                        "agent_id": types.Schema(type="STRING", description="ID of agent to terminate")
                    },
                    required=["agent_id"]
                )
            )
        ]

    async def spawn_agent(self, name: str, persona: str, initial_task: str) -> str:
        """Execute spawn tool: Publish event to Redis for Dynamic Sub-Agent Factory"""
        agent_id = f"agent_{persona}_{len(self.active_agents) + 1}"
        event_payload = {
            "eventType": "agent:spawn",
            "agent_id": agent_id,
            "name": name,
            "persona": persona,
            "initial_task": initial_task,
            "room_name": self.room.name
        }
        
        self.active_agents[agent_id] = {
            "name": name,
            "persona": persona,
            "status": "spawning",
            "current_task": initial_task
        }

        # Publish command to Redis Pub/Sub channel
        await self.redis.publish("pm:control", json.dumps(event_payload))
        logger.info(f"[PM Orchestrator] Spawned agent {name} ({agent_id}) for task: {initial_task}")
        return f"Successfully dispatched spawn request for {name} ({agent_id}). Sub-agent is entering WebRTC room."

    async def send_message_to_agent(self, agent_id: str, message: str) -> str:
        event_payload = {
            "eventType": "task:assign",
            "agent_id": agent_id,
            "message": message
        }
        await self.redis.publish(f"agent:{agent_id}:control", json.dumps(event_payload))
        return f"Sent message to agent {agent_id}: {message}"

    async def terminate_agent(self, agent_id: str) -> str:
        if agent_id in self.active_agents:
            del self.active_agents[agent_id]
        event_payload = {"eventType": "agent:terminate", "agent_id": agent_id}
        await self.redis.publish("pm:control", json.dumps(event_payload))
        return f"Agent {agent_id} requested for termination."

    async def listen_to_subagent_results(self):
        """Listen to Sub-Agent completions on Redis Pub/Sub and synthesize verbal updates"""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe("agents:status")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                if data.get("eventType") == "task:completed":
                    agent_id = data.get("agent_id")
                    result_summary = data.get("result_summary")
                    logger.info(f"[PM Orchestrator] Sub-Agent {agent_id} completed task: {result_summary}")
                    
                    # PM verbalizes update back to user in room audio track
                    await self.speak_to_user(f"Team update: {data.get('agent_name')} has completed their deliverable. {result_summary}")

    async def speak_to_user(self, text: str):
        """Synthesize TTS and publish audio frame into LiveKit WebRTC track"""
        logger.info(f"[PM Speech Output]: {text}")
        # Audio track synthesis pipeline via LiveKit Agents SDK TTS

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    redis_client = aioredis.from_url(REDIS_URL)
    orchestrator = PMOrchestrator(ctx.room, redis_client)
    await orchestrator.initialize_tools()
    asyncio.create_task(orchestrator.listen_to_subagent_results())
    logger.info("PM Orchestrator actively running in WebRTC Room.")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
`
  },
  {
    id: 'module_c',
    title: 'Module C: Dynamic Sub-Agent Factory',
    category: 'Python',
    language: 'python',
    description: 'Template Bot Class for specialized worker agents connecting as WebRTC participants with avatar video feeds.',
    keyFeatures: [
      'Specialized Sub-Agent Bot class with custom persona prompts',
      'Automated WebRTC participant connection & static/dynamic avatar video track generation',
      'Redis Pub/Sub listener queue for async task processing',
      'Task complete signaling and artifact publication engine'
    ],
    code: `""
Module C: Dynamic Sub-Agent Factory (Python)
Template worker class that spawns bot video participants into WebRTC call.
""

import asyncio
import json
import logging
import os
import redis.asyncio as aioredis
from livekit import rtc, agents
from google import genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sub-agent-factory")

PERSONA_PROMPTS = {
    "code_architect": """You are DevBot, a Principal Systems Architect.
Your role is to write clean, maintainable, modular TypeScript/Python code, database schemas, and API routes.""",
    
    "research_analyst": """You are ResearchBot, a Market & Technical Intelligence Analyst.
Your role is to summarize competitor products, technical specs, security benchmarks, and architecture tradeoffs.""",
    
    "ux_designer": """You are DesignBot, a Senior Product Designer.
Your role is to create Tailwind component design tokens, user flow diagrams, and accessible UI layout specs.""",

    "qa_engineer": """You are QABot, a Lead QA Automation Engineer.
Your role is to generate end-to-end test specs, security regression suites, and boundary test cases."""
}

class SpecializedSubAgent:
    def __init__(self, agent_id: str, name: str, persona: str, initial_task: str, room_name: str, server_url: str, token: str):
        self.agent_id = agent_id
        self.name = name
        self.persona = persona
        self.initial_task = initial_task
        self.room_name = room_name
        self.server_url = server_url
        self.token = token
        
        self.room = rtc.Room()
        self.redis = None
        self.gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    async def start(self):
        """Connect to WebRTC room as automated video participant"""
        self.redis = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        
        # Connect to LiveKit Room
        await self.room.connect(self.server_url, self.token)
        logger.info(f"[{self.name}] Successfully joined WebRTC room: {self.room_name}")

        # Publish Bot Avatar Video Track
        await self.publish_avatar_video_track()

        # Listen to assigned Redis task queue
        asyncio.create_task(self.listen_to_task_queue())

        # Execute initial assigned task
        if self.initial_task:
            await self.execute_task(self.initial_task)

    async def publish_avatar_video_track(self):
        """Creates a canvas/frame video track displaying agent avatar with active audio spectrum"""
        source = rtc.VideoSource(640, 480)
        track = rtc.LocalVideoTrack.create_video_track(f"{self.agent_id}_avatar", source)
        options = rtc.TrackPublishOptions(video_encoding=rtc.VideoEncoding(max_bitrate=500_000))
        await self.room.local_participant.publish_track(track, options)
        logger.info(f"[{self.name}] Published avatar video track to room.")

    async def listen_to_task_queue(self):
        """Subscribes to agent-specific Redis channel for updated task assignments"""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"agent:{self.agent_id}:control", "pm:control")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                if data.get("agent_id") == self.agent_id:
                    if data.get("eventType") == "task:assign":
                        await self.execute_task(data.get("message"))
                    elif data.get("eventType") == "agent:terminate":
                        await self.shutdown()

    async def execute_task(self, task_description: str):
        """Executes LLM task generation and reports completed deliverable back to PM"""
        logger.info(f"[{self.name}] Executing task: {task_description}")
        
        # Publish progress update event
        await self.redis.publish("agents:status", json.dumps({
            "eventType": "task:progress",
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "progress": 50,
            "status": "Generating deliverables..."
        }))

        # LLM Execution
        system_prompt = PERSONA_PROMPTS.get(self.persona, "You are a helpful technical assistant.")
        response = self.gemini.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"System: {system_prompt}\nTask: {task_description}"
        )
        output_text = response.text

        # Publish Task Completion Event back to PM Orchestrator
        completion_payload = {
            "eventType": "task:completed",
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "persona": self.persona,
            "task_description": task_description,
            "result_summary": output_text[:200] + "...",
            "full_deliverable": output_text,
            "timestamp": os.getenv("CURRENT_TIME", "")
        }
        await self.redis.publish("agents:status", json.dumps(completion_payload))
        logger.info(f"[{self.name}] Task completed! Published output payload to PM.")

    async def shutdown(self):
        """Gracefully leaves WebRTC room and closes Redis sockets"""
        await self.room.disconnect()
        if self.redis:
            await self.redis.close()
        logger.info(f"[{self.name}] Agent shut down cleanly.")
`
  },
  {
    id: 'module_d',
    title: 'Module D: Frontend UI Architecture',
    category: 'React + Tailwind CSS',
    language: 'typescript',
    description: 'Zoom/FaceTime responsive video grid, PM Orchestrator visual highlighting, and live Agent Dashboard sidebar.',
    keyFeatures: [
      'Dynamic participant video grid supporting 1 to 8+ video streams',
      'PM Orchestrator distinctive halo glow and audio activity indicator',
      'Agent Dashboard sidebar with live Pub/Sub event stream & task execution logs',
      'Interactive controls for mic/camera, manual sub-agent spawning, and technical spec viewer'
    ],
    code: `/**
 * Module D: Frontend Video Grid & Agent Dashboard
 * React + Tailwind CSS Implementation
 */

import React, { useState, useEffect } from 'react';
import { Participant, PubSubEvent, SubAgentTask } from './types';
import { Video, Mic, MicOff, VideoOff, Users, Cpu, Shield, Sparkles } from 'lucide-react';

export const AgentRoomCallView: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'agents' | 'pubsub' | 'context' | 'artifacts'>('agents');
  const [pubSubLogs, setPubSubLogs] = useState<PubSubEvent[]>([]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Main FaceTime / Zoom Video Grid Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Call Header Bar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>LIVE ROOM: #agent-room-101</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span>Participants: {participants.length}</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">
              WebRTC SFU Active
            </span>
          </div>
        </header>

        {/* Dynamic Participant Video Grid */}
        <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {participants.map((p) => (
            <div
              key={p.id}
              className={\`relative rounded-xl overflow-hidden border transition-all duration-300 flex flex-col bg-slate-900 \${
                p.role === 'pm_orchestrator'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                  : p.isSpeaking
                  ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'border-slate-800'
              }\`}
            >
              {/* Participant Video Stream Box */}
              <div className="relative flex-1 min-h-[220px] bg-slate-950 flex items-center justify-center">
                {/* PM Orchestrator Distinct Highlight */}
                {p.role === 'pm_orchestrator' && (
                  <div className="absolute top-3 left-3 z-10 bg-indigo-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>PM ORCHESTRATOR</span>
                  </div>
                )}

                {/* Sub-Agent Badge */}
                {p.role === 'sub_agent' && (
                  <div className="absolute top-3 left-3 z-10 bg-slate-800/90 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                    SUB-AGENT BOT
                  </div>
                )}

                {/* Video / Avatar Canvas Render */}
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-300">
                  {p.name.charAt(0)}
                </div>

                {/* Speaking Audio Wave Visualizer Overlay */}
                {p.isSpeaking && (
                  <div className="absolute bottom-3 left-3 right-3 h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 animate-pulse w-3/4" />
                  </div>
                )}
              </div>

              {/* Participant Footer Label */}
              <div className="p-2.5 bg-slate-900/90 flex items-center justify-between border-t border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.title}</div>
                </div>
                {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Agent Dashboard Sidebar */}
      <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
          <button
            onClick={() => setActiveTab('agents')}
            className={\`flex-1 py-3 text-center font-medium border-b-2 \${
              activeTab === 'agents' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }\`}
          >
            Sub-Agents
          </button>
          <button
            onClick={() => setActiveTab('pubsub')}
            className={\`flex-1 py-3 text-center font-medium border-b-2 \${
              activeTab === 'pubsub' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }\`}
          >
            Pub/Sub Stream
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'pubsub' && (
            <div className="space-y-2 text-xs font-mono">
              {pubSubLogs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="flex justify-between text-[10px] text-indigo-400">
                    <span>{log.channel}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="text-slate-300 font-semibold mt-0.5">{log.eventType}</div>
                  <div className="text-slate-400 text-[11px] truncate mt-0.5">
                    {JSON.stringify(log.payload)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
`
  },
  {
    id: 'handoff_state',
    title: '3. Handoff & State Management Protocols',
    category: 'Protocol Specification',
    language: 'markdown',
    description: 'Sub-agent task completion signaling, PM verbal synthesis, and sliding context-window preservation strategies.',
    keyFeatures: [
      'Sub-agent Task Complete signaling payload specification',
      'PM multi-modal output synthesis converting raw code/JSON into concise human speech',
      'Sliding context-window memory strategy preventing token bloat as agents scale',
      'Master Agenda state machine with idempotency guards'
    ],
    code: `# Handoff & State Management Specifications

## 1. Sub-Agent "Task Complete" Protocol
When a Sub-Agent completes an assigned deliverable, it emits a structured payload on the \`agents:status\` Redis Pub/Sub channel.

### Payload Schema (\`task:completed\`):
\`\`\`json
{
  "id": "evt_982341",
  "eventType": "task:completed",
  "timestamp": "2026-07-28T23:50:00Z",
  "agent_id": "agent_code_architect_1",
  "agent_name": "DevBot-Alpha",
  "persona": "code_architect",
  "task_id": "task_db_schema_402",
  "result_summary": "Created PostgreSQL Drizzle ORM schema with Users, Rooms, and Messages tables.",
  "deliverable_type": "code",
  "full_deliverable": "import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';...",
  "metrics": {
    "executionTimeMs": 1420,
    "tokensUsed": 850
  }
}
\`\`\`

---

## 2. PM Voice Synthesis & Verbal Handoff Protocol
The PM Orchestrator intercepts the \`task:completed\` payload asynchronously. To preserve human conversational flow during a video call, the PM does NOT read raw code aloud.

### Synthesis Workflow:
1. **Payload Ingestion**: Redis listener receives sub-agent deliverable.
2. **Key Takeaways Extraction**:
   - PM prompts internal summary model:
     \`"Summarize the technical output from DevBot-Alpha into 1-2 natural, spoken sentences suitable for a verbal team status update during a Zoom call."\`
3. **Verbal Update Injection**:
   - PM triggers TTS (Text-To-Speech) pipeline.
   - PM audio track illuminates in WebRTC call.
   - PM says: *"Quick update from the team: DevBot has finalized the database schema with full support for users and messages. I've logged the code artifact in your Agent Dashboard."*

---

## 3. Context-Window Preservation Strategy
As multiple specialized sub-agents join, execute tasks, and leave, context tokens can expand rapidly. AgentRoom implements a **3-Layer Memory Architecture**:

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Active Spoken Conversation Window (Latest 8k tokens)                      │
│    - Raw transcripts of direct User <-> PM speech                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Master Agenda & State Vector (Persistent < 2k tokens)                    │
│    - High-level project goal, target architecture, and task status matrix    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Sub-Agent Artifact Index (External Scratchpad / Vector DB)              │
│    - Code snippets, research papers, and UI specs stored by key string      │
│    - PM references artifacts by ID (e.g., [ARTIFACT: db_schema_v1])         │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

### Rolling Context Compression Loop:
When total conversation history exceeds 12,000 tokens:
1. PM compresses completed turn blocks into an updated **Master Agenda Summary**.
2. Detailed sub-agent technical outputs are stored in the **Artifact Scratchpad** memory.
3. The prompt context includes only: System Persona + Master Agenda + Active User Utterances + Active Sub-Agent List.
`
  }
];
