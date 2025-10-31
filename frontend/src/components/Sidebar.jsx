import React, { useState } from "react";
import {
  Home,
  Menu,
  Compass,
  Crown,
  Trophy,
  Send,
  Swords,
  Scissors,
  Settings,
  HelpCircle,
  Bell,
  X,
  Telescope,
  LogOut,
} from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { UserAuth } from "../store/userAuthStore";

const SidebarLayout = ({ setsidebarOpen, sidebarOpen: open }) => {
  const { authUser, logout } = UserAuth();
  const [questPopup, setQuestPopup] = useState(false);
  const toggleSidebar = () => setsidebarOpen(!open);

  // 🔹 Reusable NavItem with hover tooltip
const NavItem = ({ icon, label, PageLink, badge, onClick }) => (
  <Link
    to={PageLink || "#"}
    onClick={onClick}
    className={`relative flex items-center gap-4 px-3 py-2 rounded-xl 
    hover:bg-neutral-800 transition-all cursor-pointer 
    ${open ? "justify-start w-full" : "justify-center w-full"} group`}
  >
    {/* Tooltip */}
    {!open && (
      <div
        className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 
        bg-neutral-800 text-white text-xs px-2 py-1 rounded-md opacity-0 
        group-hover:opacity-100 group-hover:translate-x-1 transition-all 
        whitespace-nowrap z-[9999]"
      >
        {label}
      </div>
    )}

    {/* Icon */}
    <div className="relative flex items-center justify-center">
      {icon}
      {badge && (
        <span className="absolute -top-1 -right-2 bg-red-500 text-xs font-bold rounded-full px-1.5">
          {badge}
        </span>
      )}
    </div>

    {open && <span className="whitespace-nowrap">{label}</span>}
  </Link>
);


  return (
    <div className="relative min-h-screen bg-[#0e0e0f] text-gray-100 flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen flex flex-col justify-between 
        bg-[#121212] border-r border-neutral-800 transition-all duration-200 z-50
        ${open ? "w-56" : "w-16"}`}
      >
        {/* --- Top Section --- */}
        <div className="flex flex-col relative">
          {/* Toggle button */}
          <div className="flex items-center justify-center py-2 pb-5 border-b border-neutral-800">
            <button
              className="p-2 rounded hover:bg-neutral-800 transition"
              onClick={toggleSidebar}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="h-6" />

          {/* --- Navigation --- */}
          <nav className="flex flex-col space-y-2">
            <NavItem PageLink="/globalChat" icon={<Home />} label="Home" />
            <NavItem PageLink="/" icon={<Telescope />} label="Search" />
            <NavItem PageLink="/explore" icon={<Compass />} label="Explore" />

            {/* Quests Popup */}
          {/* Quests Popup (fixed hover area) */}
<div className="relative">
  <div
    onMouseEnter={() => setQuestPopup(true)}
    onMouseLeave={() => setQuestPopup(false)}
    className="group"
  >
    <NavItem
      icon={<Swords />}
      label="Quests"
      onClick={() => setQuestPopup(!questPopup)}
    />

    {/* Popup Menu */}
    {questPopup && (
      <div
        className={`absolute ${
          open ? "left-full ml-3 top-0" : "left-full ml-0 top-1/2 -translate-y-1/2"
        } bg-[#1a1a1a] border border-emerald-500 shadow-[0_0_15px_rgba(0,255,150,0.4)]
        rounded-md w-44 py-2 text-sm text-gray-300 animate-fadeIn z-[99999]`}
      >
        <Link
          to="/dailychellenge"
          className="block px-4 py-2 hover:bg-emerald-600/20 transition"
          onClick={() => setQuestPopup(false)}
        >
          🗓️ Daily Quests
        </Link>
        <Link
          to="/weeklychallenge"
          className="block px-4 py-2 hover:bg-emerald-600/20 transition"
          onClick={() => setQuestPopup(false)}
        >
          📅 Weekly Quests
        </Link>
        <Link
          to="/monthlychallenge"
          className="block px-4 py-2 hover:bg-emerald-600/20 transition"
          onClick={() => setQuestPopup(false)}
        >
          🌕 Monthly Quests
        </Link>
      </div>
    )}
  </div>
</div>


            <NavItem icon={<Send />} PageLink="/buddyChat" label="Messages" />
            <NavItem icon={<Scissors />} PageLink="/postEditor" label="Drafts" />
            <NavItem icon={<Crown />} PageLink="/globalRanking" label="Rankings" />
            <NavItem
              icon={<Trophy />}
              PageLink="/statsAndRanking"
              label="User Stats"
            />
          </nav>
        </div>

        {/* --- Bottom Section --- */}
        <div className="flex flex-col border-t border-neutral-800 py-3 space-y-1">
          <NavItem icon={<Bell />} label="Notifications" PageLink="/notification" />
          <NavItem icon={<HelpCircle />} label="Support" PageLink="/support" />
          <NavItem icon={<Settings />} label="Settings" PageLink="/settings" />

          {/* Profile Card */}
          <div
            className={`relative group mx-2 mt-2 mb-4 p-2 bg-[#1a1a1a] rounded-lg flex items-center cursor-pointer hover:bg-[#222] transition
              ${open ? "gap-3" : "justify-center"}`}
          >
            {!open && (
              <div
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-neutral-800 text-white text-xs 
                px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 
                group-hover:translate-x-1 transition-all whitespace-nowrap z-[9999]"
              >
                {authUser?.username || "Profile"}
              </div>
            )}

            <img
              src={authUser?.profilePic || "/profile.png"}
              alt="profile"
              className="w-8 h-8 rounded-full object-cover border border-neutral-700"
            />

            {open && (
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {authUser?.username || "Guest"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {authUser?.email || "no-email"}
                </p>
              </div>
            )}

            {open && (
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main
        className={`flex-1 transition-all duration-300 ${
          open ? "ml-56" : "ml-16"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
