/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimState, Company } from '../types';

interface CorporatePanelProps {
  state: SimState;
  onTakeover: (ticker: string) => void;
  onLayoffs: (ticker: string) => void;
}

export const CorporatePanel: React.FC<CorporatePanelProps> = ({ state, onTakeover, onLayoffs }) => {
  return (
    <div className="p-2 flex flex-col gap-2 overflow-y-auto h-full font-mono text-xs select-none bg-black text-[#FFB000]">
      <div className="flex flex-col gap-0.5 border-b border-[#FFB000]/30 pb-1.5">
        <h2 className="text-[#FFB000] font-bold uppercase text-xs tracking-tight">
          BOARDROOMS & CORPORATE ACQUISITIONS DESK
        </h2>
        <p className="text-white/60 text-[10px]">
          BUY FLOATING EQUITY SHARES TO EXECUTE HOSTILE BOARD TAKEOVERS. TRIGGERING LAYOFFS SECURES BOTTOM-LINE OPERATING MARGINS AT THE SACRIFICE OF STATE SOCIAL STABILITY index.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {state.companies.map((corp: Company) => {
          const sharesOwned = state.player.assets.stocks[corp.ticker] || 0;
          const ownershipPercent = ((sharesOwned / corp.sharesOutstanding) * 100).toFixed(2);
          const spotMarketPrice = state.markets[corp.ticker]?.currentPrice || corp.sharePrice;
          
          // Cost to execute complete float buyout (remaining shares * price * 1.25 takeover premium)
          const publicFloatShares = corp.shareholders['retail_public'] || 0;
          const takeoverCost = publicFloatShares * spotMarketPrice * 1.25;

          return (
            <div key={corp.id} className="bg-black border border-[#FFB000]/30 p-1.5 flex flex-col gap-2">
              
              {/* Card Header stats */}
              <div className="flex justify-between items-start border-b border-[#FFB000]/15 pb-1">
                <div>
                  <h3 className="text-white font-bold uppercase text-xs">
                    {corp.name} ({corp.ticker} // {corp.industry})
                  </h3>
                  <p className="text-[9px] text-[#FFB000]/80 mt-0.5">
                    HEADQUARTERS REGION: {corp.country} // TOTAL MARKET CAP: ${(corp.sharesOutstanding * spotMarketPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-white/50">DYNASTY EQUITY STAKE:</div>
                  <div className="text-[#00FF00] font-bold font-mono text-[11px] mt-0.5">
                    {ownershipPercent}% ({sharesOwned.toLocaleString()} SHRS)
                  </div>
                </div>
              </div>

              {/* Balance columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-xs">
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">CASH RESERVES</div>
                  <div className="font-bold text-white mt-0.5">
                    ${corp.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">TOTAL DEBT</div>
                  <div className="font-bold text-white mt-0.5">
                    ${corp.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">ANNUAL REVENUE</div>
                  <div className="font-bold text-white mt-0.5">
                    ${corp.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">OPERATIONAL Profit</div>
                  <div className={`font-bold mt-0.5 ${corp.profit >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
                    ${corp.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Board Directors and actions */}
              <div className="pt-1.5 border-t border-[#FFB000]/15 flex flex-wrap gap-2 justify-between items-center text-[10px]">
                <div className="flex gap-2">
                  <div>
                    <span className="text-white/50 text-[9px]">BOARD DELEGATIONS:</span>
                    <div className="flex gap-1.5 mt-0.5 font-mono">
                      {corp.board.map((b, idx) => (
                        <span key={idx} className="bg-black border border-[#FFB000]/15 px-1 py-0.5 text-white/80 text-[9px]">
                          DIR {idx + 1}: <span className="text-[#FFB000] font-bold">{b.owner}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {publicFloatShares > 0 && (
                    <button
                      onClick={() => onTakeover(corp.ticker)}
                      disabled={state.player.cash < takeoverCost}
                      className={`font-mono text-[9px] font-bold py-0.5 px-2 cursor-pointer ${
                        state.player.cash >= takeoverCost
                          ? 'bg-[#FFB000] text-black hover:opacity-90'
                          : 'bg-black text-white/20 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      ACQUIRE PUBLIC FLOAT (COST: ${(takeoverCost / 1e9).toFixed(2)}B)
                    </button>
                  )}

                  <button
                    onClick={() => onLayoffs(corp.ticker)}
                    className="bg-black border border-[#FFB000]/30 text-[#FF0000] hover:bg-[#FF0000]/10 font-mono text-[9px] font-bold py-0.5 px-2 cursor-pointer select-none"
                  >
                    DEPLOY 20% STAFF LAYOFFS
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
