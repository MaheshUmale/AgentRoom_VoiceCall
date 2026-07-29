import React from 'react';
import { Sparkles, Code2, Users, Shield, Cpu, Play } from 'lucide-react';

interface NavbarProps {
  viewMode: 'call' | 'tech_spec';
  setViewMode: (mode: 'call' | 'tech_spec') => void;
  participantCount: number;
  activeAgentsCount: number;
  roomName: string;
  onOpenSpawnModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  participantCount,
  activeAgentsCount,
  roomName,
  onOpenSpawnModal,
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-20">
      {/* Brand & Room Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              AgentRoom
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
              v2.5 LiveKit
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Zoom/FaceTime Multi-Agent WebRTC Conference
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-mono font-medium">#{roomName}</span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{participantCount} Participants</span>
          <span className="text-slate-600">•</span>
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-semibold">{activeAgentsCount} Sub-Agents</span>
        </div>
      </div>

      {/* Action Buttons & View Mode Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onOpenSpawnModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow border border-cyan-400/30 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Spawn Sub-Agent</span>
          <span className="sm:hidden">Spawn</span>
        </button>

        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
          <button
            onClick={() => setViewMode('call')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'call'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Video Call
          </button>
          <button
            onClick={() => setViewMode('tech_spec')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'tech_spec'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tech Spec</span>
          </button>
        </div>
      </div>
    </header>
  );
};
