/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { SimState, Market } from '../types';
import { TradingViewChart } from './TradingViewChart';

interface BloomiTradingTerminalProps {
  state: SimState;
  selectedTicker: string;
  setSelectedTicker: (sym: string) => void;
  onExecuteCommand: (cmd: string) => void;
  onModifyState: (fn: (prev: SimState) => SimState) => void;
  onLogTerminal: (msg: string, isError?: boolean) => void;
  playSyntheticSound: (type: 'tick' | 'order' | 'profit' | 'warning' | 'liquidation' | 'click' | 'alert' | 'success') => void;
}

export const BloomiTradingTerminal: React.FC<BloomiTradingTerminalProps> = ({
  state,
  selectedTicker,
  setSelectedTicker,
  onExecuteCommand,
  onModifyState,
  onLogTerminal,
  playSyntheticSound
}) => {
  const [quickQty, setQuickQty] = useState<string>('1000');
  const [quickPrice, setQuickPrice] = useState<string>('');
  const [activeSegment, setActiveSegment] = useState<'EQUITIES' | 'COMMODITIES' | 'CRYPTO'>('EQUITIES');

  const market: Market | undefined = state.markets[selectedTicker];

  // Auto-sync price when activeTicker changes
  useEffect(() => {
    if (market) {
      setQuickPrice(market.currentPrice.toFixed(2));
    }
  }, [selectedTicker]);

  const handleQuickTrade = (side: 'BUY' | 'SELL') => {
    const qty = parseInt(quickQty);
    const p = parseFloat(quickPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(p) || p <= 0) {
      onLogTerminal('REJECTED: Invalid contract price or quantity parameter.', true);
      playSyntheticSound('warning');
      return;
    }

    onExecuteCommand(`${side} ${selectedTicker} ${p.toFixed(2)} ${qty} <GO>`);
  };

  // Direct actions triggers (bypassing raw commands cleanly with feedback)
  const triggerLayoffs = () => {
    onExecuteCommand(`LAYOFFS ${selectedTicker} <GO>`);
  };

  const triggerTakeover = () => {
    onExecuteCommand(`TAKEOVER ${selectedTicker} <GO>`);
  };

  const triggerCentralBankOverride = () => {
    if (market) {
      const company = state.companies.find(c => c.ticker === selectedTicker);
      const nationId = company ? company.country : 'US';
      onExecuteCommand(`OVERRIDES ${nationId} <GO>`);
    }
  };

  const triggerDisinfoStrike = () => {
    if (market) {
      const company = state.companies.find(c => c.ticker === selectedTicker);
      const nationId = company ? company.country : 'US';
      onExecuteCommand(`STRIKE ${nationId} ${selectedTicker} <GO>`);
    }
  };

  // Filter assets based on segmented choices
  const securities = Object.keys(state.markets).filter((sym) => {
    const m = state.markets[sym];
    if (activeSegment === 'EQUITIES') return m.type === 'equity';
    if (activeSegment === 'CRYPTO') return m.type === 'crypto' || sym.includes('CORP_');
    return m.type === 'commodity' || m.type === 'derivative';
  });

  return (
    <div className="flex flex-col h-full overflow-hidden select-none font-mono text-xs text-[#ff9000] bg-[#07090d]">
      
      {/* SEGMENT INDEX TOP HEADER */}
      <div className="flex flex-wrap justify-between items-center bg-[#10141d] border border-[#1e2535] p-1 rounded-terminal mb-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] shrink-0 gap-1.5 md:flex-row flex-col">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-500 animate-ping rounded-full mr-1.5" />
          <span className="text-[10px] text-[#ff9000] font-black uppercase tracking-wider font-terminal">BLOOMI TRADING CORE // SECURITY TRADING PLATFORM v9.2</span>
        </div>
        
        {/* Ticker segments selector */}
        <div className="flex bg-[#0a0c10] border border-[#1e2535] p-0.5 rounded-terminal">
          {['EQUITIES', 'COMMODITIES', 'CRYPTO'].map((seg) => (
            <button
              key={seg}
              onClick={() => { setActiveSegment(seg as any); playSyntheticSound('tick'); }}
              className={`text-[8.5px] font-bold px-2 py-0.5 rounded-terminal cursor-pointer transition-all ${activeSegment === seg ? 'bg-amber-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* THREE-COLUMN WORKSPACE BENTO GRID */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden">
        
        {/* LEFT COLUMN: MULTI-ASSET MARKET DEPTH MONITOR */}
        <div className="w-full md:w-[210px] bg-[#0a0c0f] border border-[#1e2535] rounded-terminal flex flex-col overflow-hidden shrink-0">
          <div className="p-1.5 border-b border-[#1e2535] text-[8px] font-black text-center text-amber-500 bg-[#10141a]">
            // MULTI-ASSETS LIQUIDITY MATRIX
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#1e2535]/50">
            {securities.map((sym) => {
              const secMarket = state.markets[sym];
              const isSelected = selectedTicker === sym;
              const price = secMarket?.currentPrice ?? 0;
              
              // Calculate delta % based on history mapping
              let pctChange = 0;
              if (secMarket?.history && secMarket.history.length > 1) {
                const openVal = secMarket.history[0].open || price;
                pctChange = ((price - openVal) / openVal) * 100;
              }

              const isUp = pctChange >= 0;

              return (
                <button
                  key={sym}
                  onClick={() => { setSelectedTicker(sym); playSyntheticSound('tick'); }}
                  className={`w-full text-left p-2 cursor-pointer transition-all flex flex-col gap-0.5 font-terminal uppercase border-l-2 ${isSelected ? 'bg-amber-500/10 text-amber-500 font-extrabold border-l-amber-500 bg-[#161a25]' : 'text-slate-300 hover:bg-[#10141a] border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="truncate text-[10px] font-bold">{sym}</span>
                    <span className="text-[10px] font-black text-white">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[7px] text-slate-500">
                    <span>LIQ: ${(secMarket.liquidity / 1e6).toFixed(1)}M</span>
                    <span className={isUp ? 'text-[#00ff88]' : 'text-red-400'}>
                      {isUp ? '▲' : '▼'} {pctChange.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: ACTIVE ORDER CHART GRAPH VIEW */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-[260px]">
          <div className="flex-1 overflow-hidden">
            <TradingViewChart 
              state={state} 
              activeTicker={selectedTicker} 
              onPlaceOrder={(side, price, qty) => {
                onExecuteCommand(`${side.toUpperCase()} ${selectedTicker} ${price.toFixed(2)} ${qty} <GO>`);
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: PORTFOLIO POSITION RECONCILIATION & RAPID SHORTCUT DIRECTIVES */}
        <div className="w-full md:w-[240px] lg:w-[270px] bg-[#0a0c0f] border border-[#1e2535] rounded-terminal p-2.5 flex flex-col gap-2 shrink-0 overflow-y-auto select-none">
          
          {/* Portfolio & Cash Holding HUD */}
          <div className="border border-[#1e2535] p-2 bg-[#10141a]/60 rounded-terminal">
            <div className="flex justify-between items-center border-b border-[#1e2535] pb-1.5 mb-1.5 text-[8.5px] text-slate-400 font-black">
              <span>// PORTFOLIO RECONCILIATION</span>
              <span className="text-[#00ff88] animate-pulse">● COMPACT</span>
            </div>
            
            <div className="space-y-1 text-[9px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>NET LIQUID CASH:</span>
                <span className="font-extrabold text-[#00ff88]">${state.player.cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-[#1e2535]/40 pt-1">
                <span>HEADING TICKER:</span>
                <span className="text-white font-bold">{selectedTicker}</span>
              </div>
              <div className="flex justify-between border-b border-[#1e2535]/30 pb-0.5">
                <span>STOCKS OWNED:</span>
                <span className="text-[#00c2ff] font-extrabold">{(state.player.assets.stocks[selectedTicker] || 0).toLocaleString()} UNITS</span>
              </div>
              <div className="flex justify-between">
                <span>SHORT POSITION:</span>
                <span className="text-red-400">{(state.shorts[selectedTicker]?.qty || 0).toLocaleString()} UNITS</span>
              </div>
            </div>
          </div>

          {/* Rapid Order Form */}
          <div className="border border-[#1e2535] p-2 bg-[#10141a]/60 rounded-terminal">
            <span className="text-[8px] text-slate-400 font-black block mb-2">// QUICK PORTFOLIO EXECUTION</span>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <div className="flex-1 flex flex-col gap-0.5">
                  <label className="text-[7.5px] text-slate-400">ORDER QTY</label>
                  <input
                    type="text"
                    value={quickQty}
                    onChange={(e) => setQuickQty(e.target.value)}
                    className="bg-[#07090d] border border-[#1e2535] text-white font-bold text-[10.5px] p-1 rounded outline-none focus:border-amber-500 w-full"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <label className="text-[7.5px] text-slate-400">LIMIT PRICE</label>
                  <input
                    type="text"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                    className="bg-[#07090d] border border-[#1e2535] text-[#00ff88] font-bold text-[10.5px] p-1 rounded outline-none focus:border-amber-500 w-full"
                  />
                </div>
              </div>

              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={() => handleQuickTrade('BUY')}
                  className="flex-1 bg-amber-500 text-black font-extrabold text-[9.5px] py-1 rounded cursor-pointer hover:bg-amber-600 block uppercase"
                >
                  ACQUIRE / COVER
                </button>
                <button
                  onClick={() => handleQuickTrade('SELL')}
                  className="flex-1 bg-red-950/50 hover:bg-red-900/30 text-red-400 border border-red-700/60 font-extrabold text-[9.5px] py-1 rounded cursor-pointer block uppercase"
                >
                  DUMP / CONTRACT
                </button>
              </div>
            </div>
          </div>

          {/* Bloomberg Interactive Directives Desk (Shortcut triggers) */}
          <div className="border border-[#1e2535] p-2 bg-[#10141a]/60 rounded-terminal flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[8px] text-slate-400 font-black block mb-2">// CORPORATE INTERVENTION SHORTCUTS</span>
              
              <div className="space-y-1 font-terminal">
                <button
                  type="button"
                  onClick={triggerLayoffs}
                  className="w-full text-left p-1 border border-[#1e2535] bg-[#07090d] hover:bg-amber-950/20 rounded flex justify-between items-center cursor-pointer transition-all"
                >
                  <span>LAYOFFS DIALECTIC</span>
                  <span className="text-[7.5px] text-amber-500 font-extrabold border border-amber-500/40 px-1 rounded">EXECUTE</span>
                </button>

                <button
                  type="button"
                  onClick={triggerTakeover}
                  className="w-full text-left p-1 border border-[#1e2535] bg-[#07090d] hover:bg-amber-950/20 rounded flex justify-between items-center cursor-pointer transition-all"
                >
                  <span>ACQUIRE DEEP CONTROL</span>
                  <span className="text-[7.5px] text-[#00c2ff] font-extrabold border border-cyan-500/40 px-1 rounded">TAKEOVER</span>
                </button>

                <button
                  type="button"
                  onClick={triggerCentralBankOverride}
                  className="w-full text-left p-1 border border-[#1e2535] bg-[#07090d] hover:bg-amber-950/20 rounded flex justify-between items-center cursor-pointer transition-all"
                >
                  <span>CENTRAL BANK monetise</span>
                  <span className="text-[7.5px] text-slate-400 font-extrabold border border-[#1e2535] px-1 rounded">OVERRIDE</span>
                </button>

                <button
                  type="button"
                  onClick={triggerDisinfoStrike}
                  className="w-full text-left p-1 border border-[#1e2535] bg-[#07090d] hover:bg-amber-950/20 rounded flex justify-between items-center cursor-pointer transition-all"
                >
                  <span>NARRATIVE COLD STRIKE</span>
                  <span className="text-[7.5px] text-red-500 font-extrabold border border-red-500/40 px-1 rounded">DISINFO</span>
                </button>
              </div>
            </div>

            {/* Bloomberg order book simulation ladders */}
            <div className="border border-[#1e2535] bg-[#050608] mt-2 rounded-terminal font-terminal overflow-hidden flex-1 flex flex-col min-h-[90px] text-[7.5px]">
              <div className="bg-[#10141a] p-1 font-black text-slate-400 flex justify-between border-b border-[#1e2535]">
                <span>// ORDER LADDER SENSOR</span>
                <span className="text-amber-500 font-bold">● L2</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-0.5 p-1 font-mono leading-none">
                {market?.orderBook.asks.slice(0, 3).reverse().map((ask, idx) => (
                  <div key={`ask-${idx}`} className="flex justify-between text-red-400">
                    <span>ASK</span>
                    <span>${ask.price.toFixed(2)}</span>
                    <span className="font-bold">{ask.quantity.toLocaleString()}</span>
                  </div>
                ))}
                <div className="text-center font-bold text-white border-y border-[#1e2535]/35 py-0.5 tracking-widest my-0.5 bg-[#10141a]/40">
                  SPREAD: ${( (market?.orderBook.asks[0]?.price || 0) - (market?.orderBook.bids[0]?.price || 0) ).toFixed(2)}
                </div>
                {market?.orderBook.bids.slice(0, 3).map((bid, idx) => (
                  <div key={`bid-${idx}`} className="flex justify-between text-[#00ff88]">
                    <span>BID</span>
                    <span>${bid.price.toFixed(2)}</span>
                    <span className="font-bold">{bid.quantity.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
