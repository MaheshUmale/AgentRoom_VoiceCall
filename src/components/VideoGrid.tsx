import React, { useRef, useEffect } from 'react';
import { Participant } from '../types';
import {
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Cpu,
  CheckCircle2,
  Loader2,
  Monitor,
  Volume2,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface VideoGridProps {
  participants: Participant[];
  userMediaStream: MediaStream | null;
  botStreams: Record<string, MediaStream>;
  onSelectParticipant?: (participant: Participant) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  userMediaStream,
  botStreams,
  onSelectParticipant,
}) => {
  // Grid columns styling based on total participant count
  const getGridColsClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1 max-w-3xl';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto flex items-center justify-center bg-slate-950">
      <div className={`w-full grid gap-4 ${getGridColsClass(participants.length)} mx-auto transition-all`}>
        {participants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            userMediaStream={userMediaStream}
            botStream={botStreams[participant.id]}
            onClick={() => onSelectParticipant?.(participant)}
          />
        ))}
      </div>
    </div>
  );
};

interface ParticipantCardProps {
  participant: Participant;
  userMediaStream: MediaStream | null;
  botStream?: MediaStream;
  onClick?: () => void;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  userMediaStream,
  botStream,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach MediaStream to video element
  useEffect(() => {
    if (!videoRef.current) return;

    if (participant.role === 'user' && userMediaStream) {
      videoRef.current.srcObject = userMediaStream;
    } else if (botStream) {
      videoRef.current.srcObject = botStream;
    }
  }, [participant.role, userMediaStream, botStream]);

  const isPM = participant.role === 'pm_orchestrator';
  const isSubAgent = participant.role === 'sub_agent';

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col bg-slate-900/90 shadow-xl cursor-pointer ${
        isPM
          ? 'border-indigo-500/80 ring-2 ring-indigo-500/50 shadow-indigo-500/20 hover:border-indigo-400'
          : participant.isSpeaking
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-emerald-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Video Stream Container */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* PM Orchestrator Distinction Badge */}
        {isPM && (
          <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-lg border border-indigo-400/30 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>PM ORCHESTRATOR</span>
          </div>
        )}

        {/* Sub-Agent Persona Badge */}
        {isSubAgent && (
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 text-cyan-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-cyan-500/30 flex items-center space-x-1 shadow">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>SUB-AGENT BOT</span>
          </div>
        )}

        {/* Active Task / Status Pill top right */}
        {participant.currentTask && (
          <div className="absolute top-3 right-3 z-10 max-w-[180px] bg-slate-900/90 backdrop-blur text-slate-200 text-[10px] px-2.5 py-1 rounded-md border border-slate-700 truncate flex items-center space-x-1 shadow">
            {participant.status === 'working' ? (
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
            ) : participant.status === 'completed' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <Flame className="w-3 h-3 text-indigo-400 shrink-0" />
            )}
            <span className="truncate">{participant.currentTask}</span>
          </div>
        )}

        {/* Real Video Element or Canvas Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.role === 'user'} // mute local user video feedback
          className={`w-full h-full object-cover transition-opacity ${
            participant.isVideoOff ? 'hidden' : 'block'
          }`}
        />

        {/* Fallback Avatar view if video is turned off */}
        {participant.isVideoOff && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner ${
                isPM
                  ? 'bg-gradient-to-tr from-indigo-800 to-purple-800 text-indigo-200 border-2 border-indigo-400/50'
                  : isSubAgent
                  ? 'bg-slate-800 text-cyan-300 border-2 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-200 border-2 border-slate-700'
              }`}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-300">{participant.name}</p>
            <p className="text-[10px] text-slate-500">{participant.title}</p>
          </div>
        )}

        {/* Audio Waveform Indicator on Video Bottom */}
        {participant.isSpeaking && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-center space-x-1 bg-slate-950/70 backdrop-blur py-1 px-3 rounded-full border border-emerald-500/30">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <div className="flex space-x-1 items-end h-3">
              <span className="w-1 bg-emerald-400 animate-pulse h-2 rounded-full" />
              <span className="w-1 bg-emerald-400 animate-pulse h-3 rounded-full delay-75" />
              <span className="w-1 bg-emerald-400 animate-pulse h-1.5 rounded-full delay-150" />
              <span className="w-1 bg-emerald-400 animate-pulse h-3 rounded-full delay-100" />
            </div>
            <span className="text-[10px] font-medium text-emerald-300 ml-1">Speaking</span>
          </div>
        )}
      </div>

      {/* Participant Footer Card */}
      <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-100 truncate">{participant.name}</span>
            {isPM && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">{participant.title}</p>
        </div>

        <div className="flex items-center space-x-1.5 ml-2">
          {participant.isMuted ? (
            <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="p-1.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
              <Mic className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Task Progress Bar for Working Sub-Agents */}
      {isSubAgent && participant.taskProgress !== undefined && participant.taskProgress > 0 && (
        <div className="h-1 bg-slate-800 w-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${participant.taskProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
