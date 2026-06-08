/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface CharacterCreatorProps {
  onComplete: (params: {
    name: string;
    nationality: string;
    education: string;
    background: string;
    capital: number;
    intel: number;
    charisma: number;
    ambition: number;
    risk: number;
    connections: number;
  }) => void;
}

const backgroundPresets: Record<string, {
  intel: number;
  charisma: number;
  ambition: number;
  risk: number;
  connections: number;
  capital: number;
  desc: string;
}> = {
  Quant: { intel: 92, charisma: 31, ambition: 78, risk: 65, connections: 40, capital: 1000000000, desc: "Algorithmic dark liquidity architect. Low socialization, supreme logic." },
  Founder: { intel: 80, charisma: 88, ambition: 95, risk: 85, connections: 60, capital: 100000000, desc: "High-volatility disruptor. Master of narrative capitalization." },
  Banker: { intel: 75, charisma: 70, ambition: 85, risk: 35, connections: 80, capital: 500000000, desc: "Syndicated leverage wizard. Deep alignment with sovereign clearing houses." },
  VC: { intel: 72, charisma: 82, ambition: 90, risk: 75, connections: 85, capital: 250000000, desc: "Exponential technology scavenger. Arbitrages futurology." },
  Politician: { intel: 65, charisma: 98, ambition: 95, risk: 50, connections: 95, capital: 10000000, desc: "Sovereign bureaucrat. Captures regulatory machinery with legislative bribes." },
  'Intel Officer': { intel: 85, charisma: 55, ambition: 80, risk: 72, connections: 70, capital: 50000000, desc: "Information broker. Specializes in dark pools, blackmail, and leverage." }
};

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const [name, setName] = useState('Nikhil Sharma');
  const [nationality, setNationality] = useState('United States');
  const [education, setEducation] = useState('Ivy League PhD');
  const [background, setBackground] = useState('Quant');
  const [customCapital, setCustomCapital] = useState(1000000000);
  const [capitalSelection, setCapitalSelection] = useState('preset');

  const activePreset = backgroundPresets[background] || backgroundPresets['Quant'];

  const handleInitialize = () => {
    onComplete({
      name,
      nationality,
      education,
      background,
      capital: capitalSelection === 'preset' ? activePreset.capital : customCapital,
      intel: activePreset.intel,
      charisma: activePreset.charisma,
      ambition: activePreset.ambition,
      risk: activePreset.risk,
      connections: activePreset.connections
    });
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-4 font-mono">
      <div className="w-full max-w-2xl bg-black border border-[#FFB000] flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Panel Header */}
        <div className="p-3 border-b border-[#FFB000]/30 flex justify-between items-center bg-black">
          <div>
            <h2 className="text-[#FFB000] text-sm font-bold uppercase tracking-tight">
              INITIALIZE SYSTEM RECURSION // CODES OMEGA
            </h2>
            <div className="text-[9px] text-white/50 mt-0.5">SECURE SHELL PROTOCOL VER 4.0.25</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#FFB000]"></span>
            <span className="text-[10px] text-[#FFB000]">AWAITING AUTHORIZATION</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Identity Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold uppercase text-[10px] border-b border-[#FFB000]/15 pb-1">
              IDENTITY PARAMETERS
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#FFB000] uppercase tracking-wider">DIGNITARY CALLSIGN</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-black border border-[#FFB000]/30 p-1.5 text-white outline-none focus:border-[#FFB000] text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#FFB000] uppercase tracking-wider">GEOPOLITICAL ORBIT</label>
              <select 
                value={nationality} 
                onChange={e => setNationality(e.target.value)}
                className="bg-black border border-[#FFB000]/30 p-1.5 text-white outline-none focus:border-[#FFB000] text-xs"
              >
                <option value="United States">United States (Financial Supremacy)</option>
                <option value="China">China (State Corporatist)</option>
                <option value="European Union">European Union (Regulatory Fortress)</option>
                <option value="Switzerland">Switzerland (Offshore Sanctuaries)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#FFB000] uppercase tracking-wider">COGNITIVE ACCREDITATION</label>
              <select 
                value={education} 
                onChange={e => setEducation(e.target.value)}
                className="bg-black border border-[#FFB000]/30 p-1.5 text-white outline-none focus:border-[#FFB000] text-xs"
              >
                <option value="Ivy League PhD">Ivy League PhD (Analyst Advantage)</option>
                <option value="Self-Taught Dropout">Self-Taught Dropout (Disruption Agility)</option>
                <option value="Elite Military Academy">Elite Military Academy (Strategic Network)</option>
                <option value="State Party School">State Party School (Bureaucracy Capture)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#FFB000] uppercase tracking-wider">CAPITAL ACQUISITION FORM</label>
              <div className="flex gap-4">
                <label className="text-xs text-white/80 flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={capitalSelection === 'preset'} 
                    onChange={() => setCapitalSelection('preset')}
                    className="accent-[#FFB000]"
                  />
                  PRESET
                </label>
                <label className="text-xs text-white/80 flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={capitalSelection === 'custom'} 
                    onChange={() => setCapitalSelection('custom')}
                    className="accent-[#FFB000]"
                  />
                  CUSTOM ALLOCATION
                </label>
              </div>

              {capitalSelection === 'custom' ? (
                <input 
                  type="number" 
                  value={customCapital}
                  onChange={e => setCustomCapital(Math.max(10000, parseInt(e.target.value) || 0))}
                  className="bg-black border border-[#FFB000]/30 p-1.5 text-[#FFB000] outline-none focus:border-[#FFB000] mt-0.5 text-xs"
                />
              ) : (
                <div className="text-xs font-bold text-[#00FF00] mt-0.5 bg-black p-1.5 border border-[#FFB000]/15 text-center">
                  ${(activePreset.capital).toLocaleString()} INCEPTION FUNDS
                </div>
              )}
            </div>
          </div>

          {/* Preset Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold uppercase text-[10px] border-b border-[#FFB000]/15 pb-1">
              SELECT STRATEGIC BACKGROUND
            </h3>

            <div className="grid grid-cols-2 gap-1">
              {Object.keys(backgroundPresets).map((bg) => (
                <button
                   key={bg}
                   onClick={() => setBackground(bg)}
                   className={`p-1 font-mono text-[10px] uppercase border cursor-pointer ${
                     background === bg 
                       ? 'bg-black border-[#FFB000] text-[#FFB000] font-bold' 
                       : 'bg-black text-white/60 border-white/10 hover:border-white/30'
                   }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            <div className="p-2 bg-black border border-[#FFB000]/15 text-xs text-white/80 min-h-[4rem]">
              <span className="text-[#FFB000] uppercase font-bold text-[9px] block mb-0.5">STRATEGIST REPORT</span>
              {activePreset.desc}
            </div>

            <h3 className="text-white font-bold uppercase text-[10px] border-b border-[#FFB000]/15 pb-1">
              COEFFICIENT RATIOS
            </h3>

            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Intelligence', val: activePreset.intel },
                { label: 'Charisma', val: activePreset.charisma },
                { label: 'Ambition', val: activePreset.ambition },
                { label: 'Risk Tolerance', val: activePreset.risk },
                { label: 'Networks', val: activePreset.connections }
              ].map((stat) => (
                <div key={stat.label} className="grid grid-cols-[100px_1fr_25px] items-center gap-2 text-[10px] font-mono">
                  <span className="text-white/50 uppercase">{stat.label}</span>
                  <div className="h-1.5 bg-black border border-white/15 overflow-hidden">
                    <div 
                      className="h-full bg-[#FF1000]" 
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                  <span className="text-right text-[#FFB000] font-bold">{stat.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel Footer */}
        <div className="p-3 border-t border-[#FFB000]/30 bg-black flex justify-end">
          <button
            onClick={handleInitialize}
            className="w-full bg-[#FFB000] hover:opacity-90 text-black py-1.5 px-6 uppercase font-bold text-xs select-none cursor-pointer text-center"
          >
            INITIALIZE OMEGA CORE SYSTEM // RECURSION GO
          </button>
        </div>
      </div>
    </div>
  );
};
