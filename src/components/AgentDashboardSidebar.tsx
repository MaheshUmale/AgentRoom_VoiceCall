import React, { useState } from 'react';
import { Participant, SubAgentTask, PubSubEvent, ContextWindowMetrics } from '../types';
import {
  Cpu,
  Terminal,
  ListTodo,
  FileCode,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Check,
  Zap,
  Activity,
  Layers,
  BarChart2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Plus,
  Bot,
} from 'lucide-react';

interface AgentDashboardSidebarProps {
  participants: Participant[];
  tasks: SubAgentTask[];
  pubSubLogs: PubSubEvent[];
  contextMetrics: ContextWindowMetrics;
  selectedDeliverable: { title: string; content: string; type: string } | null;
  onSendMessageToAgent: (agentId: string, message: string) => void;
  onTerminateAgent: (agentId: string) => void;
  onSelectDeliverable: (item: { title: string; content: string; type: string }) => void;
  onReorderAgendaItems?: (newItems: { id: string; text: string; done: boolean }[]) => void;
  onToggleAgendaItem?: (id: string) => void;
  onAddAgendaItem?: (text: string) => void;
  onDeleteAgendaItem?: (id: string) => void;
}

export const AgentDashboardSidebar: React.FC<AgentDashboardSidebarProps> = ({
  participants,
  tasks,
  pubSubLogs,
  contextMetrics,
  selectedDeliverable,
  onSendMessageToAgent,
  onTerminateAgent,
  onSelectDeliverable,
  onReorderAgendaItems,
  onToggleAgendaItem,
  onAddAgendaItem,
  onDeleteAgendaItem,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'pubsub' | 'agenda' | 'deliverables'>('agents');
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Drag and Drop & Agenda state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newAgendaText, setNewAgendaText] = useState('');

  const subAgents = participants.filter((p) => p.role === 'sub_agent');

  const handleSend = (agentId: string) => {
    const text = messageInputs[agentId];
    if (text && text.trim()) {
      onSendMessageToAgent(agentId, text);
      setMessageInputs((prev) => ({ ...prev, [agentId]: '' }));
    }
  };

  const handleCopyDeliverable = () => {
    if (selectedDeliverable) {
      navigator.clipboard.writeText(selectedDeliverable.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Agenda Item handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...contextMetrics.masterAgendaItems];
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);

    if (onReorderAgendaItems) {
      onReorderAgendaItems(items);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveItem = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= contextMetrics.masterAgendaItems.length) return;

    const items = [...contextMetrics.masterAgendaItems];
    const [removed] = items.splice(currentIndex, 1);
    items.splice(targetIndex, 0, removed);

    if (onReorderAgendaItems) {
      onReorderAgendaItems(items);
    }
  };

  const handleToggleItem = (id: string) => {
    if (onToggleAgendaItem) {
      onToggleAgendaItem(id);
    } else if (onReorderAgendaItems) {
      const updated = contextMetrics.masterAgendaItems.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      );
      onReorderAgendaItems(updated);
    }
  };

  const handleAddAgenda = () => {
    if (newAgendaText.trim()) {
      if (onAddAgendaItem) {
        onAddAgendaItem(newAgendaText.trim());
      } else if (onReorderAgendaItems) {
        const newItem = {
          id: `agenda_${Date.now()}`,
          text: newAgendaText.trim(),
          done: false,
        };
        onReorderAgendaItems([...contextMetrics.masterAgendaItems, newItem]);
      }
      setNewAgendaText('');
    }
  };

  const handleDeleteAgenda = (id: string) => {
    if (onDeleteAgendaItem) {
      onDeleteAgendaItem(id);
    } else if (onReorderAgendaItems) {
      const updated = contextMetrics.masterAgendaItems.filter((item) => item.id !== id);
      onReorderAgendaItems(updated);
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-l border-slate-800/80 flex flex-col h-full shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-sm text-slate-100 tracking-tight">Agent Dashboard</span>
        </div>
        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
          Redis Pub/Sub Connected
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-3 text-center font-semibold transition-colors flex items-center justify-center space-x-1 border-b-2 ${
            activeTab === 'agents'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Sub-Agents ({subAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pubsub')}
          className={`flex-1 py-3 text-center font-semibold transition-colors flex items-center justify-center space-x-1 border-b-2 ${
            activeTab === 'pubsub'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Pub/Sub</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 py-3 text-center font-semibold transition-colors flex items-center justify-center space-x-1 border-b-2 ${
            activeTab === 'agenda'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('deliverables')}
          className={`flex-1 py-3 text-center font-semibold transition-colors flex items-center justify-center space-x-1 border-b-2 ${
            activeTab === 'deliverables'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Artifacts</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Tab 1: Sub-Agents & Tasks */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            {subAgents.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
                <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-slate-300">No Active Sub-Agents</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Speak to PM Alex in the video call or click "Spawn Sub-Agent" to spin up worker bots.
                </p>
              </div>
            ) : (
              subAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-xs">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{agent.name}</h4>
                        <p className="text-[10px] text-slate-400">{agent.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onTerminateAgent(agent.id)}
                      title="Terminate Agent"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {agent.currentTask && (
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Current Task</span>
                        <span className="font-mono text-cyan-400">{agent.status}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{agent.currentTask}</p>
                    </div>
                  )}

                  {/* Direct Message Input to Sub-Agent */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Send command to agent..."
                      value={messageInputs[agent.id] || ''}
                      onChange={(e) =>
                        setMessageInputs((prev) => ({ ...prev, [agent.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleSend(agent.id)}
                      className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleSend(agent.id)}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Redis Pub/Sub Event Stream */}
        {activeTab === 'pubsub' && (
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-2">
              <span>Channel Filter: ALL</span>
              <span className="text-indigo-400">{pubSubLogs.length} Events</span>
            </div>

            {pubSubLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/90 hover:border-slate-700 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-cyan-400 font-bold">{log.channel}</span>
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-200 font-semibold text-[11px]">
                  <span className="text-indigo-400">{log.source}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-slate-400">{log.destination}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                    {log.eventType}
                  </span>
                </div>
                <pre className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded overflow-x-auto text-wrap">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Master Agenda & Context Window */}
        {activeTab === 'agenda' && (
          <div className="space-y-5">
            {/* Context Window Utilization Meter */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200">Context Window Utilization</span>
                <span className="font-mono text-indigo-400">
                  {contextMetrics.totalTokensUsed.toLocaleString()} / {contextMetrics.maxTokens.toLocaleString()} tokens
                </span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${(contextMetrics.totalTokensUsed / contextMetrics.maxTokens) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Strategy: Rolling Summary Memory + External Artifact Scratchpad
              </p>
            </div>

            {/* Master Agenda Checklist with Drag-and-Drop & Rank Prioritization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Scrum Master Agenda</span>
                </h4>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {contextMetrics.masterAgendaItems.filter((i) => i.done).length} / {contextMetrics.masterAgendaItems.length} Done
                </span>
              </div>

              {/* Add New Agenda Item Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add task to master agenda..."
                  value={newAgendaText}
                  onChange={(e) => setNewAgendaText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAgenda()}
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
                <button
                  onClick={handleAddAgenda}
                  disabled={!newAgendaText.trim()}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                  title="Add Agenda Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                <span>Tip: Drag handle or use rank arrows to reorder task priorities.</span>
              </p>

              {/* Rank-prioritized Drag-and-Drop Task List */}
              <div className="space-y-2">
                {contextMetrics.masterAgendaItems.map((item, index) => {
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group relative p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all duration-150 ${
                        isDragging
                          ? 'opacity-40 bg-indigo-950/40 border-dashed border-indigo-500 scale-[0.99]'
                          : isDragOver
                          ? 'border-indigo-400 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                          : item.done
                          ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-indigo-400 p-0.5 rounded transition-colors shrink-0"
                          title="Drag to reorder priority"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Rank Priority Badge */}
                        <span className="shrink-0 text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          #{index + 1}
                        </span>

                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleItem(item.id)}
                          className="shrink-0 focus:outline-none"
                          title={item.done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>

                        {/* Item Text */}
                        <span
                          onClick={() => handleToggleItem(item.id)}
                          className={`cursor-pointer truncate text-xs flex-1 ${
                            item.done ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                          title={item.text}
                        >
                          {item.text}
                        </span>
                      </div>

                      {/* Rank Controls: Up, Down, Delete */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          title="Move Up in Priority"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === contextMetrics.masterAgendaItems.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          title="Move Down in Priority"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-0.5"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Sub-Agent Artifact Viewer */}
        {activeTab === 'deliverables' && (
          <div className="space-y-3">
            {tasks.filter((t) => t.outputResult).length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
                <FileCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">No Artifacts Generated Yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sub-agent outputs (code, reports, wireframes) will appear here as tasks finish.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">Generated Technical Outputs</h4>
                  {selectedDeliverable && (
                    <button
                      onClick={handleCopyDeliverable}
                      className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {/* List of Deliverable Selector Buttons */}
                <div className="flex flex-col space-y-1.5">
                  {tasks
                    .filter((t) => t.outputResult)
                    .map((task) => (
                      <button
                        key={task.id}
                        onClick={() =>
                          onSelectDeliverable({
                            title: `${task.agentName}: ${task.title}`,
                            content: task.outputResult || '',
                            type: task.artifactType || 'code',
                          })
                        }
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          selectedDeliverable?.title.includes(task.agentName)
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-slate-100">{task.agentName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{task.title}</div>
                      </button>
                    ))}
                </div>

                {/* Content Box */}
                {selectedDeliverable && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-indigo-300">{selectedDeliverable.title}</p>
                    <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-80">
                      {selectedDeliverable.content}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
