import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../../store/userAuthStore";
import { SquareMenu, Menu } from "lucide-react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "../ui/Navbar2.jsx";

const Layout = ({ children, sidebarOpen, setsidebarOpen }) => {
  const { authUser, logout } = UserAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    // globalChat buddyChat
    { name: "Daily Challenges", link: "/dailychellenge" },
    { name: "Weekly Challenges", link: "/weeklychallenge" },
    { name: "Monthly Challenges", link: "/monthlychallenge" },
    { name: "Global Rankings", link: "/globalRanking" },
    { name: "Stats and Ranking", link: "/statsAndRanking" },
    { name: "Comunity Chat", link: "/globalChat" },
    { name: "Rival Buddy", link: "/buddyChat" },
  ];

  return (
    <div className="relative w-full mr-10 ">
      {/* Navbar */}
      <Navbar>
        <NavBody>
          <div className="flex gap-2">
            <div
              onClick={() => setsidebarOpen(!sidebarOpen)}
              className="cursor-pointer flex items-center"
            >
              <SquareMenu className="h-6 " />
            </div>
            <NavbarLogo />
          </div>
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary" onClick={logout}>
              Logout
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <div className="flex gap-2 ">
              <SquareMenu
                onClick={() => {
                  setsidebarOpen(!sidebarOpen);
                  console.log(sidebarOpen);
                }}
                className=" h-16"
              />

              <NavbarLogo />
            </div>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                to={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-base-content"
              >
                <span className="block">{item.name}</span>
              </Link>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                variant="primary"
                className="w-full"
              >
                Logout
              </NavbarButton>
              {/* <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Book a call
              </NavbarButton> */}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Page Content */}
      <div className="">{children}</div>
    </div>
  );
};

export default Layout;
