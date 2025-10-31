import React from "react";
import { MenuIcon } from "lucide-react";
import { Link } from "react-router-dom";
const SimpleNavbar = ({ setsidebarOpen, sidebarOpen, children }) => {
  return (
    <div className="relative w-full">
       <div className="fixed z-20 top-0 left-0 w-full  text-white p-4">
  <div className="flex justify-between items-center max-w-[190px] ">
    {/* Left - Menu icon */}
    <MenuIcon 
      onClick={() => setsidebarOpen(!sidebarOpen)} 
      className="cursor-pointer mb-2"
    />

    {/* Center - Logo + Text */}
    <Link to={"/globalChat"} className="flex items-center gap-2">
      <img src="/unloklogo.png" className="w-10  object-contain" alt="UnloK Logo" />
      <span className="font-bold mb-2 text-lg">UnloK</span>
    </Link>

    {/* Right - Empty space or placeholder for future icons */}
    
  </div>
</div>
 

      <div>{children}</div>
    </div>
  );
};

export default SimpleNavbar;
