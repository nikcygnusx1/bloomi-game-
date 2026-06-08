/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SimState, Market } from '../types';

interface TradingViewChartProps {
  state: SimState;
  activeTicker: string;
  onPlaceOrder: (side: 'buy' | 'sell', price: number, qty: number) => void;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ state, activeTicker, onPlaceOrder }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  const [orderPrice, setOrderPrice] = useState('150');
  const [orderQty, setOrderQty] = useState('1000');

  const market: Market | undefined = state.markets[activeTicker];

  // Monitor layout dimension changes with standard ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update starting pricing inputs when activeTicker changes
  useEffect(() => {
    if (market) {
      setOrderPrice(market.currentPrice.toFixed(2));
    }
  }, [activeTicker, state]);

  // Handle HTML5 Canvas rendering of terminal chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !market) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = dimensions;

    // Clear and paint background matching pure Immersive Bloomberg UI Noir
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const history = market.history || [];
    if (history.length === 0) {
      ctx.fillStyle = '#4b5563';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ESTABLISHING GRAPH LINK...', width / 2, height / 2);
      return;
    }

    const paddingLeft = 16;
    const paddingRight = 75;
    const paddingTop = 32;
    const paddingBottom = 40;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Boundary valuations
    let minP = Infinity;
    let maxP = -Infinity;
    let maxVol = 0;

    history.forEach((h) => {
      if (h.low < minP) minP = h.low;
      if (h.high > maxP) maxP = h.high;
      if (h.volume > maxVol) maxVol = h.volume;
    });

    const buffer = (maxP - minP) * 0.12 || 1.0;
    maxP += buffer;
    minP = Math.max(0.01, minP - buffer);

    // Grid lines count with subtle terminal color border
    const rowsGrid = 5;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    for (let i = 0; i <= rowsGrid; i++) {
      const y = paddingTop + (chartHeight * i) / rowsGrid;
      const currentPrice = maxP - ((maxP - minP) * i) / rowsGrid;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Draw price tag
      ctx.fillStyle = '#52525b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${currentPrice.toFixed(2)}`, width - paddingRight + 6, y + 3);
    }

    // Paint Candlesticks
    const length = history.length;
    const candleW = chartWidth / length;

    history.forEach((h, idx) => {
      const x = paddingLeft + idx * candleW;
      const cX = x + candleW / 2;

      // Map positions to coordinates
      const yOpen = paddingTop + chartHeight * (1 - (h.open - minP) / (maxP - minP));
      const yClose = paddingTop + chartHeight * (1 - (h.close - minP) / (maxP - minP));
      const yHigh = paddingTop + chartHeight * (1 - (h.high - minP) / (maxP - minP));
      const yLow = paddingTop + chartHeight * (1 - (h.low - minP) / (maxP - minP));

      const isBull = h.close >= h.open;
      const themeColor = isBull ? '#00ff41' : '#ff3131';

      // volume chart bars in background
      const volumeBarH = (h.volume / (maxVol || 1)) * (chartHeight * 0.22);
      ctx.fillStyle = isBull ? 'rgba(0, 255, 65, 0.06)' : 'rgba(255, 49, 49, 0.06)';
      ctx.fillRect(x + 1, height - paddingBottom - volumeBarH, candleW - 2, volumeBarH);

      // wick line drawing
      ctx.strokeStyle = themeColor;
      ctx.beginPath();
      ctx.moveTo(cX, yHigh);
      ctx.lineTo(cX, yLow);
      ctx.stroke();

      // body rect drawing
      ctx.fillStyle = themeColor;
      const bodyWidth = Math.max(2, candleW * 0.65);
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
      ctx.fillRect(cX - bodyWidth / 2, Math.min(yOpen, yClose), bodyWidth, bodyHeight);
    });

    // Draw active current ticker label
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${activeTicker} // ORDER BOOK GRAPH`, paddingLeft + 4, paddingTop - 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`VOL MAX: ${maxVol.toLocaleString()}`, paddingLeft + 180, paddingTop - 12);

  }, [dimensions, market, activeTicker]);

  const handleOrderSubmit = (side: 'buy' | 'sell') => {
    const parsedPrice = parseFloat(orderPrice);
    const parsedQty = parseFloat(orderQty);
    if (!isNaN(parsedPrice) && !isNaN(parsedQty)) {
      onPlaceOrder(side, parsedPrice, parsedQty);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={containerRef}>
      {/* Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 block w-full h-full cursor-crosshair"
        />
      </div>

      {/* Control Order Dock */}
      <div className="h-[105px] bg-black border-t border-[#FFB000]/30 p-2 grid grid-cols-1 md:grid-cols-2 gap-2 select-none">
        
        {/* Ticket Form */}
        <div className="flex flex-col justify-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/60 uppercase tracking-tight">PRICE ($)</span>
              <input 
                type="text" 
                value={orderPrice} 
                onChange={e => setOrderPrice(e.target.value)}
                className="bg-black border border-[#FFB000]/30 px-1 py-0.5 outline-none text-xs text-[#FFB000] w-20"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/60 uppercase tracking-tight">QTY</span>
              <input 
                type="text" 
                value={orderQty} 
                onChange={e => setOrderQty(e.target.value)}
                className="bg-black border border-[#FFB000]/30 px-1 py-0.5 outline-none text-xs text-[#FFB000] w-20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleOrderSubmit('buy')}
              className="bg-black hover:bg-[#00FF00]/10 border border-[#00FF00] text-[#00FF00] text-[9px] font-bold py-0.5 px-3 cursor-pointer"
            >
              GENERATE BUY LIMIT
            </button>
            <button 
              onClick={() => handleOrderSubmit('sell')}
              className="bg-black hover:bg-[#FF0000]/10 border border-[#FF0000] text-[#FF0000] text-[9px] font-bold py-0.5 px-3 cursor-pointer"
            >
              GENERATE SELL LIMIT
            </button>
          </div>
        </div>

        {/* Selected Asset Details */}
        {market && (
          <div className="text-[9px] font-mono text-white/80 flex flex-col justify-center gap-0.5 border-l border-[#FFB000]/15 pl-3">
            <div><span className="text-white/50">SECURITY CODE:</span> {market.ticker} // {market.type.toUpperCase()}</div>
            <div><span className="text-white/50">SPOT PRICE:</span> <span className="text-[#FFB000] font-bold">${market.currentPrice.toFixed(2)}</span></div>
            <div>
              <span className="text-white/50">LIQUID DEPTHS:</span> BIDS: {market.orderBook.bids.length} | ASKS: {market.orderBook.asks.length}
            </div>
            <div><span className="text-white/50">LEVERAGE:</span> 1.0x SPOT STANDARD</div>
          </div>
        )}
      </div>
    </div>
  );
};
