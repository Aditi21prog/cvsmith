// components/InputBox.js
export default function InputBox({ label, ...props }) {
  return (
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-300">{label}</label>
      <input
        {...props}
        className="w-full rounded-xl p-3 bg-[#0f172a] text-white border border-gray-600 focus:border-gold focus:ring-gold"
      />
    </div>
  );
}
