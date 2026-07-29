import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  Sparkles,
  PhoneOff,
  Cpu,
  Code2,
  Volume2,
  Loader2,
  LayoutDashboard,
} from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSendToPM: (message: string) => void;
  onOpenSpawnModal: () => void;
  onToggleSidebar: () => void;
  onOpenTechSpec: () => void;
  onEndCall: () => void;
  isPMThinking: boolean;
  pmSpeakingText?: string;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onSendToPM,
  onOpenSpawnModal,
  onToggleSidebar,
  onOpenTechSpec,
  onEndCall,
  isPMThinking,
  pmSpeakingText,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isPMThinking) {
      onSendToPM(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-3 md:p-4 flex flex-col space-y-3 z-20">
      {/* Live PM Speech / Thought Banner */}
      {(isPMThinking || pmSpeakingText) && (
        <div className="max-w-3xl mx-auto w-full bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 rounded-xl p-2.5 px-4 flex items-center space-x-3 shadow-lg">
          {isPMThinking ? (
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
          ) : (
            <Volume2 className="w-4 h-4 text-indigo-400 animate-bounce shrink-0" />
          )}
          <div className="text-xs truncate flex-1">
            <span className="font-bold text-indigo-300 mr-2">Alex (PM Orchestrator):</span>
            <span className="text-slate-200">
              {isPMThinking ? 'Analyzing project scope & determining tool calls...' : pmSpeakingText}
            </span>
          </div>
        </div>
      )}

      {/* Main Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-6xl mx-auto w-full">
        {/* Left: Audio/Video Mute Toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
              isMuted
                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
              isVideoOff
                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        {/* Center: Talk / Instruct PM Input Field */}
        <form onSubmit={handleSend} className="flex-1 max-w-xl flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Talk to PM Alex (e.g. 'Alex, let's build a SaaS landing page with Postgres schema and UI mockups')"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isPMThinking}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <Sparkles className="w-4 h-4 text-indigo-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isPMThinking}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSpawnModal}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Spawn Sub-Agent"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">Spawn Agent</span>
          </button>

          <button
            onClick={onToggleSidebar}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Toggle Agent Dashboard Sidebar"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span className="hidden xl:inline">Dashboard</span>
          </button>

          <button
            onClick={onOpenTechSpec}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Inspect Technical Specification"
          >
            <Code2 className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline">Tech Spec</span>
          </button>

          <button
            onClick={onEndCall}
            className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-lg shadow-red-600/20 transition-all"
            title="End Call / Reset Room"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
