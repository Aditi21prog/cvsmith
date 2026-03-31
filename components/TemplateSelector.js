// components/TemplateSelector.js
export default function TemplateSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">
        Template Style
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-72 rounded-xl border border-yellow-500/60 
                   bg-slate-900/60 px-3 py-2 text-sm text-slate-100
                   shadow-inner outline-none 
                   focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
      >
        <option value="conservative">Conservative (Big 4 / IB)</option>
        <option value="modern">Modern (Corporate / Tech)</option>
        <option value="creative">Creative (Marketing / Content)</option>
      </select>
    </div>
  );
}
