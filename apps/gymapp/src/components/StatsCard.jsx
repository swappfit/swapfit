export default function StatsCard({ title, value, icon, change, positive = true, color = "from-blue-500 to-blue-700" }) { // Default color updated
  return (
    <div className="bg-[#2a2d34] p-6 rounded-xl shadow-xl border border-[#3e4046] hover:shadow-2xl transition-all duration-300 transform hover:scale-105"> {/* Darker background, rounded, border */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p> {/* Lighter gray text */}
          <p className="text-2xl font-bold text-gray-100 mt-1">{value}</p> {/* White text */}
          {change && ( // Only show change if it exists
            <p className={`text-xs mt-1 ${positive ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div
          className={`text-4xl w-14 h-14 rounded-full bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}