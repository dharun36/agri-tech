import React from "react";
import {
  FaSeedling,
  FaChartLine,
  FaCalendarAlt,
  FaUserCircle,
  FaClipboardList,
} from "react-icons/fa";

const LandingPage = () => {
  return (
    <div className="flex h-screen font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-8">
        <FaClipboardList className="text-xl" title="Dashboard" />
        <FaSeedling className="text-xl" title="Crops" />
        <FaChartLine className="text-xl" title="Reports" />
        <FaCalendarAlt className="text-xl" title="Calendar" />
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search crops, prices, and schemes"
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm">Welcome,</span>
            <FaUserCircle className="text-2xl text-gray-600" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* My Crops */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-semibold">My Crops</h3>
                <button className="text-xs px-2 py-1 bg-lime-100 text-lime-700 rounded">
                  + New query
                </button>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Market price check</span>
                  <span className="text-gray-500 text-xs">Due today</span>
                </div>
                <div className="flex justify-between">
                  <span>Paddy Harvest</span>
                  <span className="text-gray-500 text-xs">Due tomorrow</span>
                </div>
                <div className="flex justify-between">
                  <span>Soil quality report</span>
                  <span className="text-gray-500 text-xs">Due today</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <button className="bg-gray-100 px-3 py-1 text-xs rounded">View all queries</button>
                <button className="bg-black text-white px-3 py-1 text-xs rounded">Upgrade Plan</button>
              </div>
            </div>

            {/* Crop Health Placeholder */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Total Crop Health</h3>
              <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                Crop Health Chart (Coming Soon)
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Upcoming Events</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="block font-medium">Oct 2: Crop disease workshop</span>
                  <span className="text-xs text-gray-500">10:00–11:30 · Mr. Patel</span>
                </li>
                <li className="bg-gray-100 p-2 rounded">
                  <span className="block font-medium">Oct 5: Market trends seminar</span>
                  <span className="text-xs text-gray-500">14:00–15:30 · Registration required</span>
                </li>
                <li>
                  <span className="block font-medium">Oct 8: Soil health session</span>
                  <span className="text-xs text-gray-500">09:00–10:00 · Ms. Gupta</span>
                </li>
                <li>
                  <span className="block font-medium">Weekly sync</span>
                  <span className="text-xs text-gray-500">15:00–16:00 · Recurring</span>
                </li>
                <li>
                  <span className="block font-medium">Weekly market update</span>
                  <span className="text-xs text-gray-500">16:00–17:30 · Monthly review</span>
                </li>
              </ul>
              <button className="mt-4 text-xs text-blue-600 hover:underline">See full schedule</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
