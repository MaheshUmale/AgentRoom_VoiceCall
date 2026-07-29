import React, { useState, useEffect, useRef } from 'react';
import { Participant, SubAgentTask, PubSubEvent, ContextWindowMetrics, AgentPersonaType } from './types';
import { Navbar } from './components/Navbar';
import { VideoGrid } from './components/VideoGrid';
import { AgentDashboardSidebar } from './components/AgentDashboardSidebar';
import { CallControls } from './components/CallControls';
import { TechSpecModal } from './components/TechSpecModal';
import { SpawnAgentModal } from './components/SpawnAgentModal';
import { createAvatarVideoStream, getMediaDevicesStream } from './utils/webrtcSim';
import { speakText, stopSpeaking } from './utils/speechSynth';

export default function App() {
  const [viewMode, setViewMode] = useState<'call' | 'tech_spec'>('call');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTechSpecOpen, setIsTechSpecOpen] = useState(false);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);

  // User Hardware Audio/Video state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [userMediaStream, setUserMediaStream] = useState<MediaStream | null>(null);

  // PM Orchestration & Speech state
  const [isPMThinking, setIsPMThinking] = useState(false);
  const [pmSpeakingText, setPmSpeakingText] = useState<string>('');

  // Bot Canvas Video Streams
  const botStreamsRef = useRef<Record<string, MediaStream>>({});
  const botCleanupRef = useRef<Record<string, () => void>>({});
  const botSpeakingCallbacksRef = useRef<Record<string, (speaking: boolean) => void>>({});

  // Participants State
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'user_human_01',
      name: 'You (Engineer)',
      role: 'user',
      title: 'Solutions Architect',
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
      audioLevel: 25,
      status: 'idle',
      joinedAt: new Date(),
    },
    {
      id: 'pm_alex_01',
      name: 'Alex',
      role: 'pm_orchestrator',
      title: 'Lead PM Orchestrator',
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
      audioLevel: 0,
      status: 'idle',
      currentTask: 'Master Agenda Monitoring',
      joinedAt: new Date(),
    },
  ]);

  // Tasks & PubSub State
  const [tasks, setTasks] = useState<SubAgentTask[]>([]);
  const [pubSubLogs, setPubSubLogs] = useState<PubSubEvent[]>([
    {
      id: 'evt_init_1',
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
      channel: 'room:presence',
      source: 'LiveKit_SFU',
      destination: 'ALL',
      eventType: 'agent:spawn',
      payload: { room: 'agent-room-101', status: 'webrtc_connected' },
    },
    {
      id: 'evt_pm_1',
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
      channel: 'pm:control',
      source: 'PM_Orchestrator',
      destination: 'ALL',
      eventType: 'agent:spawn',
      payload: { identity: 'Alex', role: 'pm_orchestrator', status: 'listening' },
    },
  ]);

  // Context Metrics State
  const [contextMetrics, setContextMetrics] = useState<ContextWindowMetrics>({
    totalTokensUsed: 3420,
    maxTokens: 128000,
    rollingSummaryTokens: 1100,
    activeAgentsCount: 0,
    masterAgendaItems: [
      { id: '1', text: 'Gather project architecture & scope from user', done: true },
      { id: '2', text: 'Design backend database schema and API routes', done: false },
      { id: '3', text: 'Conduct competitor research & tech stack benchmarks', done: false },
      { id: '4', text: 'Create Tailwind CSS design tokens and UI mockups', done: false },
      { id: '5', text: 'Run automated QA test suite and benchmarks', done: false },
    ],
    contextPreservationStrategy: 'Rolling Summary + Vector Artifact Scratchpad',
  });

  const [selectedDeliverable, setSelectedDeliverable] = useState<{
    title: string;
    content: string;
    type: string;
  } | null>(null);

  // Initialize User Webcam
  useEffect(() => {
    let active = true;
    getMediaDevicesStream(true, true).then((stream) => {
      if (active && stream) {
        setUserMediaStream(stream);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Initialize PM Canvas Stream
  useEffect(() => {
    if (!botStreamsRef.current['pm_alex_01']) {
      const pmAvatar = createAvatarVideoStream({
        name: 'Alex',
        role: 'pm_orchestrator',
        isSpeaking: false,
        status: 'listening',
      });
      botStreamsRef.current['pm_alex_01'] = pmAvatar.stream;
      botCleanupRef.current['pm_alex_01'] = pmAvatar.cleanup;
      botSpeakingCallbacksRef.current['pm_alex_01'] = pmAvatar.updateSpeaking;
    }
  }, []);

  // Spawns a Sub-Agent into the WebRTC Room
  const handleSpawnAgent = (name: string, persona: AgentPersonaType, initialTask: string) => {
    const agentId = `bot_${persona}_${Date.now().toString().slice(-4)}`;

    const titleMap: Record<string, string> = {
      code_architect: 'Principal Code Architect',
      research_analyst: 'Market & Tech Analyst',
      ux_designer: 'Senior UX/UI Designer',
      qa_engineer: 'Lead QA Automation Engineer',
    };

    const newParticipant: Participant = {
      id: agentId,
      name,
      role: 'sub_agent',
      personaType: persona,
      title: titleMap[persona] || 'Specialized AI Bot',
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
      audioLevel: 0,
      status: 'working',
      currentTask: initialTask,
      taskProgress: 15,
      joinedAt: new Date(),
    };

    // Create Canvas Avatar Stream for new bot participant
    const botAvatar = createAvatarVideoStream({
      name,
      role: 'sub_agent',
      personaType: persona,
      isSpeaking: false,
      status: 'working',
    });

    botStreamsRef.current[agentId] = botAvatar.stream;
    botCleanupRef.current[agentId] = botAvatar.cleanup;
    botSpeakingCallbacksRef.current[agentId] = botAvatar.updateSpeaking;

    setParticipants((prev) => [...prev, newParticipant]);

    // Create Task Entry
    const newTask: SubAgentTask = {
      id: `task_${Date.now()}`,
      agentId,
      agentName: name,
      persona,
      title: initialTask.slice(0, 30) + '...',
      description: initialTask,
      status: 'in_progress',
      progress: 25,
      startedAt: new Date().toLocaleTimeString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // Add Redis Pub/Sub Log Event
    const pubSubEvt: PubSubEvent = {
      id: `evt_spawn_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      channel: 'pm:control',
      source: 'PM_Orchestrator',
      destination: agentId,
      eventType: 'agent:spawn',
      payload: { name, persona, initialTask, roomName: 'agent-room-101' },
    };
    setPubSubLogs((prev) => [pubSubEvt, ...prev]);

    // Update Context Window Metrics
    setContextMetrics((prev) => ({
      ...prev,
      totalTokensUsed: prev.totalTokensUsed + 650,
      activeAgentsCount: prev.activeAgentsCount + 1,
    }));

    // Trigger Server Execution for Sub-Agent Task
    executeAgentTaskOnServer(agentId, name, persona, initialTask);
  };

  // Executes agent task via Express server route
  const executeAgentTaskOnServer = async (
    agentId: string,
    agentName: string,
    persona: string,
    taskDescription: string
  ) => {
    try {
      // Simulate task progress step
      setTimeout(() => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === agentId ? { ...p, taskProgress: 60 } : p))
        );
      }, 1500);

      const res = await fetch('/api/agents/execute-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, agentName, persona, taskDescription }),
      });

      const data = await res.json();

      // Update Participant & Task State upon completion
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === agentId
            ? { ...p, status: 'completed', taskProgress: 100, isSpeaking: true }
            : p
        )
      );

      // Trigger bot speech visual callback
      botSpeakingCallbacksRef.current[agentId]?.(true);
      setTimeout(() => {
        botSpeakingCallbacksRef.current[agentId]?.(false);
        setParticipants((prev) =>
          prev.map((p) => (p.id === agentId ? { ...p, isSpeaking: false } : p))
        );
      }, 2500);

      setTasks((prev) =>
        prev.map((t) =>
          t.agentId === agentId
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                outputResult: data.deliverable,
                artifactType: data.artifactType,
                completedAt: new Date().toLocaleTimeString(),
              }
            : t
        )
      );

      // Add Output PubSub Log
      if (data.event) {
        setPubSubLogs((prev) => [data.event, ...prev]);
      }

      // Automatically select deliverable in dashboard
      setSelectedDeliverable({
        title: `${agentName}: ${taskDescription.slice(0, 35)}...`,
        content: data.deliverable,
        type: data.artifactType,
      });

      // Update Agenda Checklist Item
      setContextMetrics((prev) => ({
        ...prev,
        masterAgendaItems: prev.masterAgendaItems.map((item, idx) => {
          if (
            (persona === 'code_architect' && idx === 1) ||
            (persona === 'research_analyst' && idx === 2) ||
            (persona === 'ux_designer' && idx === 3) ||
            (persona === 'qa_engineer' && idx === 4)
          ) {
            return { ...item, done: true };
          }
          return item;
        }),
      }));

      // PM verbalizes completion update back to user in video call
      const speechText = `Team update: ${agentName} has completed the assigned deliverable. I have logged the output in your Agent Dashboard.`;
      makePMSpeak(speechText);
    } catch (err) {
      console.error('Error executing agent task:', err);
    }
  };

  // Speaks PM Response with visual audio indicator
  const makePMSpeak = (text: string) => {
    setPmSpeakingText(text);

    // Turn on PM speaking visualizer
    setParticipants((prev) =>
      prev.map((p) => (p.role === 'pm_orchestrator' ? { ...p, isSpeaking: true } : p))
    );
    botSpeakingCallbacksRef.current['pm_alex_01']?.(true);

    speakText(
      text,
      () => {},
      () => {
        setParticipants((prev) =>
          prev.map((p) => (p.role === 'pm_orchestrator' ? { ...p, isSpeaking: false } : p))
        );
        botSpeakingCallbacksRef.current['pm_alex_01']?.(false);
      }
    );
  };

  // Handles User Voice/Text Message to PM Alex
  const handleSendToPM = async (userMessage: string) => {
    setIsPMThinking(true);

    // Update User Speech state
    setParticipants((prev) =>
      prev.map((p) => (p.role === 'user' ? { ...p, isSpeaking: true } : p))
    );
    setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => (p.role === 'user' ? { ...p, isSpeaking: false } : p))
      );
    }, 1500);

    try {
      const activeAgentList = participants.filter((p) => p.role === 'sub_agent');

      const res = await fetch('/api/pm/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, activeAgents: activeAgentList }),
      });

      const data = await res.json();
      setIsPMThinking(false);

      if (data.verbalResponse) {
        makePMSpeak(data.verbalResponse);
      }

      // Handle spawned agents from PM tool calls
      if (data.spawnedAgents && data.spawnedAgents.length > 0) {
        for (const sa of data.spawnedAgents) {
          handleSpawnAgent(sa.name, sa.persona, sa.initialTask);
        }
      }
    } catch (err) {
      setIsPMThinking(false);
      console.error('PM Orchestrate error:', err);
      makePMSpeak('I got your instructions and am coordinating with the sub-agent team now.');
    }
  };

  // Direct message to sub-agent
  const handleSendMessageToAgent = (agentId: string, message: string) => {
    const targetAgent = participants.find((p) => p.id === agentId);
    if (targetAgent) {
      const pubSubEvt: PubSubEvent = {
        id: `evt_msg_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        channel: `agent:${agentId}:control`,
        source: 'HumanUser',
        destination: targetAgent.name,
        eventType: 'task:assign',
        payload: { message },
      };
      setPubSubLogs((prev) => [pubSubEvt, ...prev]);

      // Re-trigger server execution
      executeAgentTaskOnServer(
        agentId,
        targetAgent.name,
        targetAgent.personaType || 'code_architect',
        message
      );
    }
  };

  // Terminate sub-agent
  const handleTerminateAgent = (agentId: string) => {
    botCleanupRef.current[agentId]?.();
    delete botStreamsRef.current[agentId];
    delete botCleanupRef.current[agentId];
    delete botSpeakingCallbacksRef.current[agentId];

    setParticipants((prev) => prev.filter((p) => p.id !== agentId));

    const pubSubEvt: PubSubEvent = {
      id: `evt_term_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      channel: 'pm:control',
      source: 'PM_Orchestrator',
      destination: agentId,
      eventType: 'agent:terminate',
      payload: { status: 'terminated' },
    };
    setPubSubLogs((prev) => [pubSubEvt, ...prev]);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
    setParticipants((prev) =>
      prev.map((p) => (p.role === 'user' ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  // Toggle Video
  const handleToggleVideo = () => {
    setIsVideoOff((prev) => !prev);
    setParticipants((prev) =>
      prev.map((p) => (p.role === 'user' ? { ...p, isVideoOff: !p.isVideoOff } : p))
    );
  };

  // Master Agenda Handlers
  const handleReorderAgendaItems = (newItems: { id: string; text: string; done: boolean }[]) => {
    setContextMetrics((prev) => ({
      ...prev,
      masterAgendaItems: newItems,
    }));
  };

  const handleToggleAgendaItem = (id: string) => {
    setContextMetrics((prev) => ({
      ...prev,
      masterAgendaItems: prev.masterAgendaItems.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const handleAddAgendaItem = (text: string) => {
    const newItem = {
      id: `agenda_${Date.now()}`,
      text,
      done: false,
    };
    setContextMetrics((prev) => ({
      ...prev,
      masterAgendaItems: [...prev.masterAgendaItems, newItem],
    }));
  };

  const handleDeleteAgendaItem = (id: string) => {
    setContextMetrics((prev) => ({
      ...prev,
      masterAgendaItems: prev.masterAgendaItems.filter((item) => item.id !== id),
    }));
  };

  const activeAgentsCount = participants.filter((p) => p.role === 'sub_agent').length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        participantCount={participants.length}
        activeAgentsCount={activeAgentsCount}
        roomName="agent-room-101"
        onOpenSpawnModal={() => setIsSpawnModalOpen(true)}
      />

      {/* Main Content Area */}
      {viewMode === 'call' ? (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Zoom/FaceTime Video Grid */}
          <VideoGrid
            participants={participants}
            userMediaStream={userMediaStream}
            botStreams={botStreamsRef.current}
          />

          {/* Agent Dashboard Sidebar */}
          {isSidebarOpen && (
            <AgentDashboardSidebar
              participants={participants}
              tasks={tasks}
              pubSubLogs={pubSubLogs}
              contextMetrics={contextMetrics}
              selectedDeliverable={selectedDeliverable}
              onSendMessageToAgent={handleSendMessageToAgent}
              onTerminateAgent={handleTerminateAgent}
              onSelectDeliverable={setSelectedDeliverable}
              onReorderAgendaItems={handleReorderAgendaItems}
              onToggleAgendaItem={handleToggleAgendaItem}
              onAddAgendaItem={handleAddAgendaItem}
              onDeleteAgendaItem={handleDeleteAgendaItem}
            />
          )}
        </div>
      ) : (
        /* Full Page Tech Spec View */
        <div className="flex-1 overflow-hidden p-4">
          <TechSpecModal isOpen={true} onClose={() => setViewMode('call')} />
        </div>
      )}

      {/* Bottom FaceTime Control Toolbar */}
      {viewMode === 'call' && (
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onSendToPM={handleSendToPM}
          onOpenSpawnModal={() => setIsSpawnModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenTechSpec={() => setIsTechSpecOpen(true)}
          onEndCall={() => stopSpeaking()}
          isPMThinking={isPMThinking}
          pmSpeakingText={pmSpeakingText}
        />
      )}

      {/* Modals */}
      <TechSpecModal isOpen={isTechSpecOpen} onClose={() => setIsTechSpecOpen(false)} />
      <SpawnAgentModal
        isOpen={isSpawnModalOpen}
        onClose={() => setIsSpawnModalOpen(false)}
        onSpawn={handleSpawnAgent}
      />
    </div>
  );
}
