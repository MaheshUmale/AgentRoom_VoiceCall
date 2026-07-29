import React, { useState } from 'react';
import { CODE_MODULES } from '../data/codeModules';
import { CodeModuleSpec } from '../types';
import {
  Code2,
  X,
  Copy,
  Check,
  FileCode,
  Layers,
  Cpu,
  Server,
  Terminal,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface TechSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechSpecModal: React.FC<TechSpecModalProps> = ({ isOpen, onClose }) => {
  const [selectedModule, setSelectedModule] = useState<CodeModuleSpec>(CODE_MODULES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedModule.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>AgentRoom Technical Architecture & Code Inspector</span>
              </h2>
              <p className="text-xs text-slate-400">
                Production-grade WebRTC Media Server, PM Orchestrator Python Engine, and Dynamic Sub-Agent Factory
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Module Selector Sidebar */}
          <div className="w-full md:w-72 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto space-y-2 shrink-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">
              Deliverable Modules
            </p>
            {CODE_MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedModule.id === mod.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-slate-100">{mod.title}</div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>{mod.category}</span>
                  <span className="font-mono text-cyan-400 font-semibold">{mod.language}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Code & Feature Details Area */}
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-900">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedModule.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedModule.description}</p>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Key Features Bullet List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedModule.keyFeatures.map((feat, i) => (
                <div key={i} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Syntax Highlighted Code Viewer */}
            <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-2 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{selectedModule.language.toUpperCase()} MODULE FILE</span>
                <span>AgentRoom Spec v2.5</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[420px]">
                {selectedModule.code}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
