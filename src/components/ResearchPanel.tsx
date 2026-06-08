/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimState, ResearchNode } from '../types';
import { TestTube, CheckCircle, Lock, Cpu, Sparkles } from 'lucide-react';

interface ResearchPanelProps {
  state: SimState;
  onModifyState: (modifier: (prev: SimState) => SimState) => void;
  onLogTerminal: (msg: string, isErr?: boolean) => void;
  playSyntheticSound: (type: 'tick' | 'order' | 'click' | 'alert' | 'success') => void;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({
  state,
  onModifyState,
  onLogTerminal,
  playSyntheticSound
}) => {
  const handleUnlockNode = (nodeId: string) => {
    const node: ResearchNode | undefined = state.researchTree?.[nodeId];
    if (!node) return;

    if (node.unlocked) {
      onLogTerminal('REJECTED: Selected research vector has already been spliced into deep cores.', true);
      playSyntheticSound('alert');
      return;
    }

    if (state.biomass < node.cost) {
      onLogTerminal(`REJECTED: Insufficient somatic biomass reserves. Splicing requires ${node.cost} CORE biomass (Available: ${state.biomass}).`, true);
      playSyntheticSound('alert');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.biomass -= node.cost;
      if (next.researchTree && next.researchTree[nodeId]) {
        next.researchTree[nodeId].unlocked = true;
        onLogTerminal(`RESEARCH SPLICE DEPLOYED: Successfully unlocked "${node.name}". Benefits synthesized safely into production pipelines.`);
        playSyntheticSound('success');
      }
      return next;
    });
  };

  const nodesList: ResearchNode[] = state.researchTree ? (Object.values(state.researchTree) as ResearchNode[]) : [];

  return (
    <div className="h-full flex flex-col bg-[#0a0c0f] overflow-hidden p-3 gap-3 font-mono">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-[#1e2535] pb-2 select-none">
        <div>
          <h2 className="text-white text-md font-black tracking-wider uppercase font-sans">CLIMATE-FINANCE RESEARCH LABS</h2>
          <p className="text-[10px] text-slate-500 uppercase leading-none mt-1">
            Spend bio-synthetic somatic cores collected from crop yields to crack sovereign climate shielding.
          </p>
        </div>
        <div className="bg-[#0c1015] border border-emerald-900 px-3 py-1.5 rounded-terminal flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#00ff88] animate-spin" />
          <div className="text-right">
            <span className="text-[8.5px] text-slate-400 block uppercase tracking-wide leading-none">SOMATIC CORE BIOMASS</span>
            <span className="text-[#00ff88] text-sm font-black leading-none block mt-0.5">{state.biomass} CORE</span>
          </div>
        </div>
      </div>

      {/* Grid listing of nodes */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
        {nodesList.map((node) => {
          const canAfford = state.biomass >= node.cost;
          return (
            <div
              key={node.id}
              className={`border p-3 rounded-terminal flex flex-col justify-between transition-all select-none ${node.unlocked ? 'bg-emerald-950/20 border-emerald-900/40 shadow-[0_0_10px_rgba(16,185,129,0.03)]' : 'bg-[#0f1318] border-[#1e2535] hover:border-slate-800'}`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-terminal ${node.unlocked ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                      <TestTube className="w-4 h-4" />
                    </div>
                    <h3 className="text-white font-bold text-[11.5px] tracking-wide uppercase">{node.name}</h3>
                  </div>
                  <div>
                    {node.unlocked ? (
                      <span className="bg-[#00ff88] text-black text-[7.5px] px-1.5 py-0.5 rounded-terminal font-black flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-black" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-terminal ${canAfford ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-800' : 'bg-red-950/30 text-red-500 border border-red-900'}`}>
                        {node.cost} BIO
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[9.5px] text-[#e8edf5]/80 leading-relaxed mt-2.5 font-sans">
                  {node.description}
                </p>

                {/* Benefits List */}
                <div className="mt-3 flex flex-col gap-1 border-t border-slate-900 pt-2.5">
                  <span className="text-[8px] text-[#00c2ff] font-bold uppercase block tracking-wider">// STRUCTURAL PAYOUT METRICS:</span>
                  {node.benefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex gap-1.5 items-start text-[9px] text-[#00ff88] leading-normal uppercase">
                      <Cpu className="w-3 h-3 text-[#00ff88]/60 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3.5">
                {node.unlocked ? (
                  <div className="w-full bg-emerald-950/40 text-emerald-400 border border-emerald-900 text-[9px] font-bold py-1 px-3 rounded-terminal uppercase text-center flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    SYNTHESIZED CORES CONFIRMED
                  </div>
                ) : (
                  <button
                    onClick={() => handleUnlockNode(node.id)}
                    disabled={!canAfford}
                    className={`w-full py-1.5 px-3 rounded-terminal text-[10px] font-black cursor-pointer uppercase transition-all flex justify-center items-center gap-1.5 ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.1)]' : 'bg-red-950/30 border border-red-900 text-red-400/80 hover:bg-red-950/50'}`}
                  >
                    {!canAfford && <Lock className="w-3.5 h-3.5" />}
                    SPLICE DNA VECTOR
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
