/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimState, LaboratoryStaff } from '../types';
import { Users, Heart, Zap, Sparkles, AlertTriangle, Cpu, CircleDollarSign } from 'lucide-react';

interface StaffPanelProps {
  state: SimState;
  onModifyState: (modifier: (prev: SimState) => SimState) => void;
  onLogTerminal: (msg: string, isErr?: boolean) => void;
  playSyntheticSound: (type: 'tick' | 'order' | 'click' | 'alert' | 'success') => void;
}

const APPLICANT_POOL = [
  { id: 'ap_1', name: 'Dr. Evelyn Moss', role: 'BIOLOGIST', salary: 140000, skill: 85, trait: 'Resist blight' },
  { id: 'ap_2', name: 'Dominik Vance', role: 'QUANT', salary: 180000, skill: 79, trait: 'Arbitrage Speed' },
  { id: 'ap_3', name: 'Jax Sterling', role: 'ENGINEER', salary: 110000, skill: 72, trait: 'Reactor safety' },
  { id: 'ap_4', name: 'Agent Blackout', role: 'SPY', salary: 160000, skill: 88, trait: 'Disinfo wars' },
  { id: 'ap_5', name: 'Storm Squad', role: 'DISASTER_CREW', salary: 90000, skill: 65, trait: 'Lightning repair' }
];

export const StaffPanel: React.FC<StaffPanelProps> = ({
  state,
  onModifyState,
  onLogTerminal,
  playSyntheticSound
}) => {

  const handleHireStaff = (applicant: typeof APPLICANT_POOL[number]) => {
    if (state.player.cash < applicant.salary) {
      onLogTerminal('REJECTED: Insufficient financial runway to contract selected agent.', true);
      playSyntheticSound('alert');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= Math.floor(applicant.salary / 4); // pre-debit first week
      
      const newStaff: LaboratoryStaff = {
        id: 'stf_' + Date.now(),
        name: applicant.name,
        role: applicant.role as 'QUANT' | 'BIOLOGIST' | 'ENGINEER' | 'SPY' | 'DISASTER_CREW',
        salary: applicant.salary,
        skill: applicant.skill,
        stress: 15,
        loyalty: 85,
        trait: applicant.trait
      };

      if (!next.labStaff) next.labStaff = [];
      next.labStaff.push(newStaff);
      onLogTerminal(`CONTRACT SIGNED: Recruited operational agent ${applicant.name.toUpperCase()} as ${applicant.role}. Weekly salary of $${Math.floor(applicant.salary / 52).toLocaleString()} activated.`);
      playSyntheticSound('success');
      return next;
    });
  };

  const handleFireStaff = (id: string, name: string) => {
    onModifyState((prev) => {
      const next = { ...prev };
      next.labStaff = next.labStaff.filter(s => s.id !== id);
      onLogTerminal(`CONTRACT TERMINATED: Discharged field agent ${name.toUpperCase()} instantly. Weekly salary cleared.`);
      playSyntheticSound('success');
      return next;
    });
  };

  const handleBonus = (id: string, name: string) => {
    const bonusCost = 5000000; // $5.0M
    if (state.player.cash < bonusCost) {
      onLogTerminal('REJECTED: Insufficient liquid reserves to fulfill cash bonus parameter.', true);
      playSyntheticSound('alert');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= bonusCost;
      const target = next.labStaff.find(s => s.id === id);
      if (target) {
        target.stress = Math.max(0, target.stress - 35);
        target.loyalty = Math.min(100, target.loyalty + 15);
        onLogTerminal(`STRESS BONUS DISTRIBUTED: Distributed $${bonusCost.toLocaleString()} cash bonus directive to ${name.toUpperCase()}. Stress indexes subsided.`);
        playSyntheticSound('success');
      }
      return next;
    });
  };

  const handleTraining = (id: string, name: string) => {
    const trainCost = 10000000; // $10.0M
    if (state.player.cash < trainCost) {
      onLogTerminal('REJECTED: Insufficient financial clearance to execute somatic training routines.', true);
      playSyntheticSound('alert');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= trainCost;
      const target = next.labStaff.find(s => s.id === id);
      if (target) {
        target.skill = Math.min(100, target.skill + 12);
        onLogTerminal(`NEURAL IMPLANT ACTIVATED: Injected cognitive training protocols into ${name.toUpperCase()}. Technical competency index increased to ${target.skill}%.`);
        playSyntheticSound('success');
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0a0c0f] overflow-hidden p-3 gap-3 font-mono">
      
      {/* LEFT COLUMN: ACTIVE STAFF ROSTER LISTS */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#06080a] p-2.5 border border-[#1e2535] rounded-terminal">
        <h3 className="text-white text-xs font-black uppercase tracking-wider mb-2 select-none border-b border-[#1e2535] pb-1 flex justify-between items-center">
          <span>ACTIVE FIELD STAFF DIRECTORY ({state.labStaff?.length || 0})</span>
          <span className="text-[#00c2ff]">STATUS_LIVE</span>
        </h3>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 font-sans">
          {!state.labStaff || state.labStaff.length === 0 ? (
            <div className="text-center text-slate-500 font-mono text-[10px] py-8 uppercase tracking-wider">
              No active human operations. All sections running entirely autonomously.
            </div>
          ) : (
            state.labStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-[#0f1318] border border-[#1e2535] p-2.5 rounded-terminal flex justify-between items-start gap-4"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-center select-none font-mono">
                    <span className="text-white text-xs font-bold uppercase">{staff.name}</span>
                    <span className="text-[#00c2ff] text-[8.5px] font-bold uppercase p-0.5 px-1 bg-[#141920] border border-[#1e2535] rounded-terminal">{staff.role}</span>
                  </div>

                  <p className="text-[9.5px] text-yellow-500 uppercase mt-1 font-mono">// BOOSTER TRAIT: {staff.trait}</p>

                  <div className="grid grid-cols-3 gap-2 mt-2.5 font-mono text-[9px] text-[#a6adbb]">
                    <div>
                      <span className="text-slate-500 uppercase block select-none">Technical Skill</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">{staff.skill}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block select-none">Stress Load</span>
                      <span className={`font-bold block mt-0.5 ${staff.stress > 70 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{staff.stress}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase block select-none">Loyalty Node</span>
                      <span className="text-purple-400 font-bold block mt-0.5">{staff.loyalty}%</span>
                    </div>
                  </div>
                </div>

                {/* Micro management actions */}
                <div className="flex flex-col gap-1.5 font-mono text-[9px] shrink-0">
                  <button
                    onClick={() => handleBonus(staff.id, staff.name)}
                    className="bg-[#141920] hover:border-emerald-700 text-slate-300 px-2 py-1 rounded-terminal border border-[#1e2535] cursor-pointer"
                  >
                    BONUS (-$5M)
                  </button>
                  <button
                    onClick={() => handleTraining(staff.id, staff.name)}
                    className="bg-[#141920] hover:border-[#00c2ff] text-slate-300 px-2 py-1 rounded-terminal border border-[#1e2535] cursor-pointer"
                  >
                    TRAIN (-$10M)
                  </button>
                  <button
                    onClick={() => handleFireStaff(staff.id, staff.name)}
                    className="bg-red-950/20 text-red-400 border border-red-900 hover:bg-red-950 px-2 py-0.5 rounded-terminal cursor-pointer"
                  >
                    DISCHARGE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: RECRUITMENT AGENCY POOL */}
      <div className="w-full md:w-[270px] flex flex-col overflow-hidden bg-[#06080a] p-2.5 border border-[#1e2535] rounded-terminal shrink-0">
        <h3 className="text-white text-xs font-black uppercase tracking-wider mb-2 select-none border-b border-[#1e2535] pb-1 flex justify-between items-center">
          <span>FIELD RECRUITMENT MARKET</span>
          <span className="text-emerald-500 animate-pulse">TALENT_ON_TAP</span>
        </h3>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 font-sans select-none">
          {APPLICANT_POOL.map((ap) => (
            <div
              key={ap.id}
              className="bg-[#0f1318] border border-[#1e2535] hover:border-slate-800 p-2 rounded-terminal flex flex-col gap-1.5"
            >
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-slate-100 font-bold uppercase">{ap.name}</span>
                <span className="text-yellow-500 text-[8px] uppercase">{ap.role}</span>
              </div>
              
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>BOOSTER: {ap.trait}</span>
                <span className="text-white font-bold">SKILL: {ap.skill}%</span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-900 font-mono">
                <span className="text-slate-400 text-[9px]">Salary: <strong className="text-emerald-400">${(ap.salary / 1000).toFixed(0)}K/Wk</strong></span>
                <button
                  onClick={() => handleHireStaff(ap)}
                  className="bg-emerald-500 text-black hover:bg-[#00ff88] text-[8.5px] font-black px-2 py-1 rounded-terminal cursor-pointer transition-all"
                >
                  HIRE CONTRACTOR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
