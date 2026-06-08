import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL UNCAUGHT ERROR HAZARD:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetSystem = () => {
    try {
      localStorage.removeItem('omega_autosave');
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020406] text-red-500 font-mono flex items-center justify-center p-6 select-none relative overflow-hidden">
          {/* Neon scanline glitch backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
          
          <div className="w-full max-w-2xl bg-[#090c10] border-2 border-red-500/40 p-6 md:p-8 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col gap-6 relative z-10">
            {/* Header telemetry error */}
            <div className="flex flex-col gap-1 border-b border-red-500/20 pb-4">
              <span className="text-[10px] tracking-widest text-red-400 font-bold uppercase">// SYSTEM SECURITY CONSTRAINTS VIOLATED</span>
              <h1 className="text-xl md:text-2xl font-black text-red-500 flex items-center gap-2 animate-pulse">
                ⛈️ COGNITIVE CORE OVERFLOW DETECTED
              </h1>
            </div>

            {/* Terminal output read log */}
            <div className="bg-[#040609] border border-red-500/25 p-4 rounded text-xs leading-relaxed text-red-300 max-h-60 overflow-y-auto font-mono scrollbar-thin">
              <p className="font-bold text-red-400 mb-1">// COGNITIVE REPORT DECRYPTION FAULT:</p>
              <p className="text-white italic bg-red-950/20 px-2 py-1 rounded border border-red-500/10 mb-3 font-semibold">
                {this.state.error && this.state.error.toString()}
              </p>
              
              <div className="text-[10px] text-red-400/80 space-y-1">
                <p>&gt; TRACEPOINT STACK RECORD STAMP:</p>
                <pre className="text-[9px] text-slate-400 whitespace-pre-wrap leading-tight mt-1 ml-2 font-mono">
                  {this.state.error?.stack || 'NO DESERIALIZED STACK FOUND'}
                </pre>
              </div>
            </div>

            <p className="text-slate-400 text-xs">
              Sovereign database ledger indexing mismatch or local save data corruption might have occurred during geopolitical ticker mutations. Purge memory archives to force a hard dynamic reboot.
            </p>

            {/* System Actions CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleResetSystem}
                className="flex-1 bg-red-950/40 hover:bg-red-950/80 border-2 border-red-500/60 text-red-400 hover:text-white font-bold py-2.5 px-4 rounded text-xs tracking-wider transition-all duration-150 uppercase shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95 cursor-pointer text-center"
              >
                ☣️ PURGE AUTOSAVE LEDGER & REBOOT CORE
              </button>
              
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold py-2.5 px-5 rounded text-xs tracking-wider transition-all duration-150 uppercase active:scale-95 cursor-pointer text-center"
              >
                🔄 SOFT REFRESH PAGE
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
