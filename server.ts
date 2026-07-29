import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// In-Memory Pub/Sub and Room State for live AgentRoom session
interface PubSubEventPayload {
  id: string;
  timestamp: string;
  channel: string;
  source: string;
  destination: string;
  eventType: string;
  payload: Record<string, any>;
}

const pubSubEvents: PubSubEventPayload[] = [];
let masterAgenda = [
  { id: '1', text: 'Gather project architecture requirements from user', done: true },
  { id: '2', text: 'Design backend database schema and API routing layer', done: false },
  { id: '3', text: 'Conduct market & competitor analysis', done: false },
  { id: '4', text: 'Define UI component design system and wireframes', done: false },
  { id: '5', text: 'Run test suite and verify end-to-end functionality', done: false },
];

function logPubSubEvent(
  channel: string,
  source: string,
  destination: string,
  eventType: string,
  payload: Record<string, any>
) {
  const event: PubSubEventPayload = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
    channel,
    source,
    destination,
    eventType,
    payload,
  };
  pubSubEvents.unshift(event);
  if (pubSubEvents.length > 50) {
    pubSubEvents.pop();
  }
  return event;
}

// Initial System Events
logPubSubEvent('room:presence', 'System_SFU', 'ALL', 'room:initialized', {
  roomName: 'agent-room-101',
  status: 'active',
  webrtcEngine: 'LiveKit SFU',
});

logPubSubEvent('pm:control', 'PM_Orchestrator', 'ALL', 'agent:spawn', {
  agent_id: 'pm_alex_01',
  name: 'Alex',
  role: 'pm_orchestrator',
  title: 'Lead PM Orchestrator',
  status: 'active_listening',
});

// Tool Definitions for PM Orchestrator
const spawnAgentTool: FunctionDeclaration = {
  name: 'spawn_agent',
  description: 'Spawns a specialized Sub-Agent into the WebRTC room to perform a specific task.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Name of the sub-agent e.g. DevBot, ResearchBot, DesignBot' },
      persona: {
        type: Type.STRING,
        description: 'Persona type: code_architect, research_analyst, ux_designer, qa_engineer',
      },
      initial_task: { type: Type.STRING, description: 'Detailed initial task description assigned to the agent' },
    },
    required: ['name', 'persona', 'initial_task'],
  },
};

const sendMessageTool: FunctionDeclaration = {
  name: 'send_message_to_agent',
  description: 'Sends an updated instruction or query to an existing sub-agent via Redis Pub/Sub.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      agent_id: { type: Type.STRING, description: 'Target agent identity' },
      message: { type: Type.STRING, description: 'Instruction message' },
    },
    required: ['agent_id', 'message'],
  },
};

const terminateAgentTool: FunctionDeclaration = {
  name: 'terminate_agent',
  description: 'Terminates an active sub-agent when its work is complete.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      agent_id: { type: Type.STRING, description: 'Target agent ID' },
    },
    required: ['agent_id'],
  },
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebRTC Token Generator
app.post('/api/webrtc/token', (req, res) => {
  const { roomName = 'agent-room-101', identity, participantName, role, personaType } = req.body;
  const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.agentroom_${role}_${identity}_${Date.now()}`;
  res.json({
    token: mockJwt,
    serverUrl: 'wss://agentroom.livekit.cloud',
    roomName,
    identity,
    role,
    personaType,
  });
});

// Get PubSub Log Events
app.get('/api/pubsub/events', (req, res) => {
  res.json({ events: pubSubEvents, agenda: masterAgenda });
});

// PM Orchestrate Endpoint
app.post('/api/pm/orchestrate', async (req: Request, res: Response) => {
  try {
    const { userMessage, activeAgents = [] } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    logPubSubEvent('room:presence', 'HumanUser', 'PM_Orchestrator', 'speech:transcript', {
      text: userMessage,
    });

    const spawnedAgentsList: any[] = [];
    const toolsCalledList: any[] = [];
    let verbalSpeechResponse = '';

    if (aiClient) {
      try {
        const systemInstruction = `You are Alex, the Lead Technical PM Orchestrator in AgentRoom (a real-time WebRTC video conference).
Your role is to listen to the user, understand their project goals, and call tools to spawn specialized AI sub-agents to complete technical tasks in parallel.
Available personas for spawn_agent:
- code_architect (Name: DevBot - Code Architect)
- research_analyst (Name: ResearchBot - Market Analyst)
- ux_designer (Name: DesignBot - UX Designer)
- qa_engineer (Name: QABot - Test Engineer)

Instructions:
1. Always call spawn_agent if the user asks to build, research, design, or test anything that requires sub-agents!
2. Speak concisely, clearly, and professionally as an expert Lead Technical PM in 2-3 spoken sentences.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [spawnAgentTool, sendMessageTool, terminateAgentTool] }],
          },
        });

        // Check tool calls
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            if (call.name === 'spawn_agent') {
              const args = call.args as any;
              const agentId = `bot_${args.persona}_${Date.now().toString().slice(-4)}`;
              const titleMap: Record<string, string> = {
                code_architect: 'Principal Code Architect',
                research_analyst: 'Market & Tech Analyst',
                ux_designer: 'Senior UX/UI Designer',
                qa_engineer: 'Lead QA Automation Engineer',
              };

              const newAgent = {
                id: agentId,
                name: args.name || `Bot_${args.persona}`,
                persona: args.persona,
                title: titleMap[args.persona] || 'Specialized AI Worker',
                initialTask: args.initial_task,
              };

              spawnedAgentsList.push(newAgent);

              logPubSubEvent('pm:control', 'PM_Orchestrator', 'ALL', 'agent:spawn', {
                agent_id: agentId,
                name: newAgent.name,
                persona: args.persona,
                task: args.initial_task,
              });

              toolsCalledList.push({
                toolName: 'spawn_agent',
                args,
                result: `Successfully spawned ${newAgent.name} (${agentId}) for task: ${args.initial_task}`,
              });
            } else if (call.name === 'send_message_to_agent') {
              const args = call.args as any;
              logPubSubEvent('pm:control', 'PM_Orchestrator', args.agent_id, 'task:assign', {
                agent_id: args.agent_id,
                message: args.message,
              });
              toolsCalledList.push({
                toolName: 'send_message_to_agent',
                args,
                result: `Sent message to ${args.agent_id}`,
              });
            }
          }
        }

        verbalSpeechResponse = response.text || '';
      } catch (err: any) {
        console.warn('Gemini API call warning:', err.message);
      }
    }

    // Fallback if no LLM key or text empty
    if (!verbalSpeechResponse) {
      if (userMessage.toLowerCase().includes('build') || userMessage.toLowerCase().includes('app') || userMessage.toLowerCase().includes('landing')) {
        const newAgent = {
          id: `bot_code_${Date.now().toString().slice(-4)}`,
          name: 'DevBot - Code Architect',
          persona: 'code_architect',
          title: 'Principal Systems Architect',
          initialTask: 'Design high-performance database schema and Express API endpoints.',
        };
        spawnedAgentsList.push(newAgent);
        logPubSubEvent('pm:control', 'PM_Orchestrator', 'ALL', 'agent:spawn', {
          agent_id: newAgent.id,
          name: newAgent.name,
          persona: newAgent.persona,
          task: newAgent.initialTask,
        });
        verbalSpeechResponse = `Understood. I am spawning DevBot to architect the system and database schema right away.`;
      } else {
        verbalSpeechResponse = `Got it. I am coordinating with the team and updating our master agenda for the project.`;
      }
    }

    res.json({
      verbalResponse: verbalSpeechResponse,
      masterAgenda,
      toolsCalled: toolsCalledList,
      spawnedAgents: spawnedAgentsList,
    });
  } catch (error: any) {
    console.error('PM Orchestration error:', error);
    res.status(500).json({ error: 'Failed to orchestrate PM loop', details: error.message });
  }
});

// Sub-Agent Execute Task Endpoint
app.post('/api/agents/execute-task', async (req: Request, res: Response) => {
  try {
    const { agentId, agentName, persona, taskDescription } = req.body;

    logPubSubEvent('agents:status', agentName || agentId, 'PM_Orchestrator', 'task:progress', {
      agent_id: agentId,
      status: 'in_progress',
      progress: 50,
      task: taskDescription,
    });

    let generatedOutput = '';
    let artifactType = 'code';

    if (aiClient) {
      try {
        const prompt = `You are ${agentName} (${persona}). Execute the following task and return a high-quality production deliverable:
Task: ${taskDescription}`;

        const aiRes = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        generatedOutput = aiRes.text || '';
      } catch (err: any) {
        console.warn('Sub-Agent Gemini generation fallback:', err.message);
      }
    }

    if (!generatedOutput) {
      if (persona === 'code_architect') {
        artifactType = 'code';
        generatedOutput = `// Generated Database Schema & API Route
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomCode: text('room_code').notNull(),
  status: text('status').default('active'),
});`;
      } else if (persona === 'research_analyst') {
        artifactType = 'report';
        generatedOutput = `# Competitor & Tech Spec Research Report
- Top Competitor 1: High latency WebRTC signaling (Avg 320ms) -> We achieve < 110ms via SFU routing.
- Top Competitor 2: Lacks real-time voice synthesis tool loop -> AgentRoom features real-time PM speech.
- Recommendation: Deploy Redis Pub/Sub cluster for agent event bus with <5ms message dispatch.`;
      } else if (persona === 'ux_designer') {
        artifactType = 'design';
        generatedOutput = `/* Tailwind CSS Token Tokens & Layout Spec */
- Canvas Background: bg-slate-950
- PM Highlight Accent: ring-2 ring-indigo-500 shadow-indigo-500/20
- Video Grid Cell Gap: gap-4 p-4
- Voice Spectrum Bar: animate-pulse bg-emerald-400`;
      } else {
        artifactType = 'logs';
        generatedOutput = `[QA TEST SUITE PASSED]
- WebRTC Peer Connection: OK (100% 200 OK)
- Redis Pub/Sub Event Loop: 0 dropped packets
- PM Voice Synthesis: Pass (200ms latency)`;
      }
    }

    const completionEvent = logPubSubEvent('agents:output', agentName, 'PM_Orchestrator', 'task:completed', {
      agent_id: agentId,
      agent_name: agentName,
      persona,
      task_id: `task_${Date.now()}`,
      result_summary: `${agentName} successfully finished deliverable for: ${taskDescription}`,
      full_deliverable: generatedOutput,
      artifactType,
    });

    res.json({
      status: 'completed',
      event: completionEvent,
      deliverable: generatedOutput,
      artifactType,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to execute agent task', details: error.message });
  }
});

// Vite Development or Static Production Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgentRoom Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
