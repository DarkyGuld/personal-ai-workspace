import React, { useState } from 'react';

interface IntelligentUIWidgetProps {
  type: string;
  props: Record<string, any>;
  initialState?: Record<string, any>;
  onStateChange?: (newState: Record<string, any>) => void;
}

export const IntelligentUIWidget: React.FC<IntelligentUIWidgetProps> = ({
  type,
  props,
  initialState = {},
  onStateChange
}) => {
  const [state, setState] = useState(initialState);

  const updateState = (key: string, val: any) => {
    const updated = { ...state, [key]: val };
    setState(updated);
    if (onStateChange) onStateChange(updated);
  };

  if (type === 'calculator') {
    const deposit = Number(props.initialDeposit || 1000);
    const months = Number(state.months !== undefined ? state.months : 12);
    const interest = Number(props.monthlyInterest || 0.05);
    const total = Math.round(deposit * Math.pow(1 + interest, months));

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 my-3 shadow-lg max-w-lg">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <h4 className="font-semibold text-indigo-400 text-base">{props.title || 'Interaktiv Kalkulator'}</h4>
          <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700/50">
            Intelligent UI
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-slate-300 mb-1">
              <span>Varighet (Måneder)</span>
              <span className="font-mono text-indigo-400 font-bold">{months} mnd</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={months}
              onChange={(e) => updateState('months', Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg flex items-center justify-between border border-slate-700/50">
            <span className="text-sm text-slate-400">Beregnet sluttbeløp:</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{total.toLocaleString('nb-NO')} kr</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    const headers: string[] = props.headers || [];
    const rows: any[][] = props.rows || [];

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 my-3 overflow-x-auto shadow-lg">
        <h4 className="font-semibold text-slate-200 mb-3">{props.title || 'Datatabell'}</h4>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-slate-700/40 hover:bg-slate-700/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 font-mono">{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 my-2">
      <p className="text-xs text-slate-400">Komponent: {type}</p>
      <pre className="text-xs text-slate-300 mt-1 overflow-x-auto">{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
};
