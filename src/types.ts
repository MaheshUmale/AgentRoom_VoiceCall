export type ParticipantRole = 'user' | 'pm_orchestrator' | 'sub_agent';

export type AgentPersonaType = 'code_architect' | 'research_analyst' | 'ux_designer' | 'qa_engineer' | 'devops_engineer' | 'data_scientist';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  personaType?: AgentPersonaType;
  title: string;
  avatarUrl?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 100
  status: 'connecting' | 'idle' | 'working' | 'speaking' | 'completed' | 'error';
  currentTask?: string;
  taskProgress?: number; // 0 to 100
  isScreenSharing?: boolean;
  screenShareContent?: string;
  joinedAt: Date;
}

export interface SubAgentTask {
  id: string;
  agentId: string;
  agentName: string;
  persona: string;
  title: string;
  description: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  outputResult?: string;
  artifactType?: 'code' | 'report' | 'design' | 'logs';
  startedAt: string;
  completedAt?: string;
}

export interface PubSubEvent {
  id: string;
  timestamp: string;
  channel: string;
  source: string; // e.g. "PM_Orchestrator", "ResearchBot_01"
  destination: string; // e.g. "ALL", "PM_Orchestrator", "CodeBot_02"
  eventType: string;
  payload: Record<string, any>;
}

export interface ContextWindowMetrics {
  totalTokensUsed: number;
  maxTokens: number;
  rollingSummaryTokens: number;
  activeAgentsCount: number;
  masterAgendaItems: { id: string; text: string; done: boolean }[];
  contextPreservationStrategy: string;
}

export interface CodeModuleSpec {
  id: 'arch_blueprint' | 'module_a' | 'module_b' | 'module_c' | 'module_d' | 'handoff_state';
  title: string;
  category: string;
  language: 'typescript' | 'python' | 'markdown' | 'yaml';
  description: string;
  code: string;
  keyFeatures: string[];
}

export interface PMInteractionResponse {
  verbalResponse: string;
  masterAgenda: { id: string; text: string; done: boolean }[];
  toolsCalled: {
    toolName: 'spawn_agent' | 'send_message_to_agent' | 'terminate_agent';
    args: Record<string, any>;
    result: string;
  }[];
  spawnedAgents?: {
    id: string;
    name: string;
    persona: AgentPersonaType;
    title: string;
    initialTask: string;
  }[];
  updatedTasks?: SubAgentTask[];
}
