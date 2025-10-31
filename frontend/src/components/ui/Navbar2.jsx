import React, { useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

// === MAIN NAVBAR WRAPPER ===
export const Navbar = ({ children, className }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll({ target: ref });
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100);
  });

  return (
    <motion.div
      ref={ref}
      style={{ position: "fixed" }}
      className={cn("inset-x-0 top-2 z-40 w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { visible })
          : child
      )}
    </motion.div>
  );
};

// === NAVBAR BODY ===
export const NavBody = ({ children, className, visible }) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(0,0,0,0.1)"
          : "none",
        width: visible ? "40%" : "100%",
        y: visible ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      style={{ minWidth: "800px" }}
      className={cn(
        "relative z-[60] mx-auto hidden max-w-7xl flex-row items-center justify-between rounded-full px-4 py-2 lg:flex",
        visible ? "bg-base-200/80 shadow-lg" : "bg-transparent",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

// === DESKTOP NAV ITEMS ===
// === DESKTOP NAV ITEMS WITH DROPDOWN FOR FIRST 3 ===
export const NavItems = ({ items, className, onItemClick }) => {
  const [hovered, setHovered] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);

  const QuestItems = items.slice(0, 5); // first 3 go in dropdown
  const CommunityItems = items.slice(5, 7); // first 3 go in dropdown
  // const normalItems = items.slice(5); // rest stay inline

  return (
    <motion.div
      onMouseLeave={() => {
        setHovered(null);
        setDropdownOpen(false);
        setDropdownOpen2(false);
      }}
      className={cn(
        "hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-base-content/70 transition duration-200 hover:text-base-content lg:flex lg:space-x-2",
        className
    )}
    >
      {/* DROPDOWN PARENT */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
         
          className="relative px-16 py-2 text-base-content/70 rounded-full hover:bg-base-300 transition"
        >
          Quests
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1  flex flex-col rounded-lg bg-base-100 shadow-lg border border-base-300 overflow-hidden z-50"
            >
              {QuestItems.map((item, idx) => (
                <RouterLink
                  key={`dropdown-${idx}`}
                  to={item.link}
                  onClick={onItemClick}
                  className="px-4 py-2 text-sm text-base-content hover:bg-base-200 transition"
                >
                  {item.name}
                </RouterLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
       {/* DROPDOWN PARENT */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen2(!dropdownOpen2)}
         
          className="relative px-16 py-2 text-base-content/70 rounded-full hover:bg-base-300 transition"
        >
          Community
        </button>

        <AnimatePresence>
          {dropdownOpen2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-8  flex flex-col rounded-lg bg-base-100 shadow-lg border border-base-300 overflow-hidden z-50"
            >
              {CommunityItems.map((item, idx) => (
                <RouterLink
                  key={`dropdown-${idx}`}
                  to={item.link}
                  onClick={onItemClick}
                  className="px-4 py-2 text-sm text-base-content hover:bg-base-200 transition"
                >
                  {item.name}
                </RouterLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NORMAL ITEMS */}
      {/* {CommunityItems.map((item, idx) => (
        <RouterLink
          key={`link-${idx}`}
          to={item.link}
          onClick={onItemClick}
          onMouseEnter={() => setHovered(idx)}
          className="relative px-4 py-2 text-base-content/70"
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-base-300"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </RouterLink>
      ))} */}
    </motion.div>
  );
};


// === MOBILE NAV WRAPPERS ===
export const MobileNav = ({ children, className, visible }) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(0,0,0,0.1)"
          : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "4px" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      className={cn(
        "relative z-50 mx-auto text-base-content flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between px-0 py-2 lg:hidden",
        visible ? "bg-base-200/80 shadow-lg" : "bg-transparent",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({ children, className }) => (
  <div className={cn("flex w-full flex-row items-center justify-between", className)}>
    {children}
  </div>
);

export const MobileNavMenu = ({ children, className, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg border-4 border-primary bg-base-100 px-4 py-8 shadow-lg",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({ isOpen, onClick }) =>
  isOpen ? (
    <IconX className="text-base-content" onClick={onClick} />
  ) : (
    <IconMenu2 className="text-base-content" onClick={onClick} />
  );

// === LOGO ===
export const NavbarLogo = () => (
  <RouterLink
    to="/"
    className="relative z-20 mr-1 flex items-center px-2 py-1 text-sm font-normal text-base-content"
  >
    <img className="invert" src="./logo2.png" alt="logo" width={40} height={40} />
    <span className="font-bold text-2xl text-base-content">Unlok</span>
  </RouterLink>
);

// === BUTTON COMPONENT ===
export const NavbarButton = ({
  href,
  as: Tag = RouterLink,
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "px-4 py-2 rounded-md text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "bg-primary text-primary-content shadow",
    secondary:
      "bg-base-200 text-base-content shadow",
    dark:
      "bg-neutral text-neutral-content shadow",
    gradient:
      "bg-gradient-to-b from-primary to-secondary text-white shadow",
  };

  return (
    <Tag
      to={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
