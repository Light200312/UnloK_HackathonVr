import React, { useState, useEffect } from "react";
import { CardSpotlight } from "../components/ui/card-spotlight";
import { Link } from "react-router-dom";



import { useThemeStore } from "../store/useThemeStore"; // ✅ Import your store

const themes = [
   "halloween", "forest", "black", "luxury",
  "dracula", "night", "coffee", "dim", "nord"
];

const ThemeSwitcher = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="p-4 space-y-4 w-full max-w-4xl border-4 border-primary rounded-lg z-10 mt-12 mb-12 bg-primary/20 backdrop-blur-md">
      <h1 className="text-3xl font-bold text-white">Theme Switcher</h1>
      <p className="text-base text-slate-200">
        Current theme: <span className="font-medium">{theme}</span>
      </p>

      <select
        className="select select-bordered text-base-content w-full max-w-xs"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
      >
        {themes.map((themeName) => (
          <option className="text-base-content" key={themeName} value={themeName}>
            {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
          </option>
        ))}
      </select>

      <div className="mt-4 p-4 border rounded-lg bg-primary/20 backdrop-blur-md shadow">
        <p className="text-lg font-semibold text-white">Preview:</p>
        <p className="text-base text-slate-200">This text will adapt to the selected theme.</p>
        <button className="btn btn-primary mt-2">Primary Button</button>
      </div>
    </div>
  );
};

const LandingPage = () => {
 const {theme}=useThemeStore()
  useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
}, [theme]);
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-4 bg-base-100 relative text-white"
      style={{
        backgroundImage: `url(./challengebg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay to enhance contrast */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      {/* Hero Section */}
      <CardSpotlight className="w-full max-w-4xl p-6 border-4 border-primary rounded-lg z-10 mt-12 bg-primary/20 backdrop-blur-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Unlok
          </h1>
          <p className="text-slate-200 mb-6">
            Unlock your potential with personalized stats, challenges, and a global community to inspire your journey of self-improvement.
          </p>
          <Link
            to="/register"
            className="btn btn-primary text-base"
          >
            Get Started
          </Link>
        </div>
      </CardSpotlight>

      {/* Features Section */}
      <CardSpotlight className="w-full max-w-4xl p-6 border-4 border-primary rounded-lg z-10 mt-12 bg-primary/20 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Features */}
          {[
            {
              title: "Personalized User Stats",
              desc: "Track your strength, stamina, IQ, EQ, and more with tailored insights.",
            },
            {
              title: "Daily, Weekly, Monthly Challenges",
              desc: "Engage in challenges to build your character and boost your stats.",
            },
            {
              title: "Global Ranking of Users",
              desc: "See where you stand among users worldwide.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-base-200/50 border-2 border-primary rounded-lg shadow"
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-300">{feature.desc}</p>
            </div>
          ))}

          {/* Coming Soon */}
          {[
            "Community to Share Progress",
            "Groups & Chat Buddy",
            "Monitor Progress in Specific Fields",
          ].map((title, i) => (
            <div
              key={i}
              className="p-4 bg-base-200/30 border-2 border-base-300 rounded-lg opacity-70"
            >
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                {title}
              </h3>
              <p className="text-slate-400">Coming Soon</p>
            </div>
          ))}
        </div>
      </CardSpotlight>

      {/* Quick Links */}
      <CardSpotlight className="w-full max-w-4xl p-6 border-4 border-primary rounded-lg z-10 mt-12 mb-12 bg-primary/20 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Quick Links
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
          {[
            { name: "GitHub", url: "https://github.com/yourusername" },
            { name: "Instagram", url: "https://instagram.com/yourusername" },
            { name: "Facebook", url: "https://facebook.com/yourusername" },
          ].map((link, i) => (
            <Link
              key={i}
              to={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary text-base"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* ThemeSwitcher embedded here */}
        <ThemeSwitcher />
      </CardSpotlight>
    </div>
  );
};

export default LandingPage;
