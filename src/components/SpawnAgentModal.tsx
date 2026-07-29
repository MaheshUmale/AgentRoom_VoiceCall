import React, { useState } from 'react';
import { AgentPersonaType } from '../types';
import { Cpu, X, Play, Sparkles, Code2, Search, Layout, ShieldCheck } from 'lucide-react';

interface SpawnAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (name: string, persona: AgentPersonaType, initialTask: string) => void;
}

export const SpawnAgentModal: React.FC<SpawnAgentModalProps> = ({
  isOpen,
  onClose,
  onSpawn,
}) => {
  const [persona, setPersona] = useState<AgentPersonaType>('code_architect');
  const [name, setName] = useState('DevBot - Code Architect');
  const [task, setTask] = useState('Architect high-performance database schema and Express API endpoints.');

  if (!isOpen) return null;

  const handlePersonaChange = (p: AgentPersonaType) => {
    setPersona(p);
    if (p === 'code_architect') {
      setName('DevBot - Code Architect');
      setTask('Architect high-performance database schema and Express API endpoints.');
    } else if (p === 'research_analyst') {
      setName('ResearchBot - Market Analyst');
      setTask('Analyze top 3 competitor features, WebRTC signaling performance, and market pricing.');
    } else if (p === 'ux_designer') {
      setName('DesignBot - UX Designer');
      setTask('Create responsive Tailwind design system tokens, color palettes, and component layouts.');
    } else if (p === 'qa_engineer') {
      setName('QABot - Test Engineer');
      setTask('Generate automated end-to-end regression test suite and WebRTC stress benchmarks.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && task.trim()) {
      onSpawn(name.trim(), persona, task.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Spawn Specialized Sub-Agent</h3>
              <p className="text-xs text-slate-400">Dispatches an automated worker bot into the WebRTC call</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Persona Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Select Agent Persona</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePersonaChange('code_architect')}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2 transition-all ${
                  persona === 'code_architect'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Code2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Code Architect</div>
                  <div className="text-[10px] text-slate-400">Code, Schemas, APIs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaChange('research_analyst')}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2 transition-all ${
                  persona === 'research_analyst'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Search className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Market Analyst</div>
                  <div className="text-[10px] text-slate-400">Research & Specs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaChange('ux_designer')}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2 transition-all ${
                  persona === 'ux_designer'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Layout className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">UX/UI Designer</div>
                  <div className="text-[10px] text-slate-400">Tailwind & Wireframes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaChange('qa_engineer')}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2 transition-all ${
                  persona === 'qa_engineer'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">QA Automation</div>
                  <div className="text-[10px] text-slate-400">Tests & Regressions</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Agent Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Initial Task Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Initial Task Description</label>
            <textarea
              rows={3}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Spawn Sub-Agent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
