"use client";

import { Github, Linkedin, Mail, Youtube, Facebook } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import digitalTwinData from "@/data/digitaltwin.json";
import ChatWidget from "./chat-widget";
import Footer from "./footer";

export default function PortfolioHero() {
  const { personal_information } = digitalTwinData;
  const careerFocusItems = personal_information.fields_of_interest.slice(0, 4);
  const [activeLink, setActiveLink] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        if (rect.top < window.innerHeight / 2) {
          setActiveLink("contact");
        } else {
          setActiveLink("home");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Simple Modern Design Elements - Black and Brown */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top right corner accent */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#2c2c2c" strokeWidth="2"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#8B6F47" strokeWidth="1.5"/>
            <circle cx="100" cy="100" r="40" fill="none" stroke="#2c2c2c" strokeWidth="1"/>
          </svg>
        </div>
        
        {/* Bottom left corner accent */}
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect x="20" y="20" width="160" height="160" fill="none" stroke="#8B6F47" strokeWidth="2"/>
            <rect x="40" y="40" width="120" height="120" fill="none" stroke="#2c2c2c" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Decorative lines */}
        <div className="absolute top-1/4 left-0 w-32 h-1 bg-gradient-to-r from-[#2c2c2c] to-transparent opacity-10"></div>
        <div className="absolute bottom-1/3 right-0 w-40 h-1 bg-gradient-to-l from-[#8B6F47] to-transparent opacity-10"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1e40af] to-[#1e3a8a] border-b border-[#1e40af]/20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-wide font-montserrat">Digital Twin Portfolio</h1>
            <div className="hidden md:flex items-center gap-8 text-[15px]">
              <button
                onClick={() => {
                  setActiveLink("home");
                  window.location.href = "#home";
                }}
                className={`font-semibold font-rubik transition-all duration-300 pb-2 ${
                  activeLink === "home"
                    ? "text-white border-b-2 border-white"
                    : "text-white/80 border-b-2 border-transparent hover:text-white"
                }`}
              >
                Home
              </button>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLink("contact");
                  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
                }}
                className={`font-rubik transition-all duration-300 pb-2 cursor-pointer ${
                  activeLink === "contact"
                    ? "text-white border-b-2 border-white"
                    : "text-white/80 border-b-2 border-transparent hover:text-white"
                }`}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div id="home" className="relative pt-20 sm:pt-24 lg:pt-32 z-10">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-10 sm:py-20 lg:py-28 bg-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 lg:gap-20 items-center">
            {/* Left Content - Full width on mobile, 5 columns on desktop */}
            <div className="lg:col-span-5 space-y-6 sm:space-y-10 order-2 lg:order-1">
              {/* Main Heading */}
              <div className="space-y-6 pr-0 sm:pr-2 lg:pr-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight sm:leading-[1.1] lg:leading-[1.15] tracking-tight cursor-default font-montserrat text-[#2c2c2c]">
                  {personal_information.name}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed max-w-xl hover:text-gray-900 hover:text-opacity-90 transition-all duration-300 ease-out cursor-default font-rubik">
                  A student at St. Paul University Philippines who wants to pursue career goals in Networking, Cloud Infrastructure, and Network Security. Passionate about building scalable solutions and advancing technical expertise through hands-on experience and continuous learning.
                </p>
              </div>
            </div>

            {/* Right Content - Profile Picture - Full width on mobile, 7 columns on desktop */}
            <div className="lg:col-span-7 order-1 lg:order-2 flex justify-center lg:justify-end pr-0 lg:pr-8">
              <div className="flex flex-col items-center gap-8 sm:gap-12">
                {/* Circular Profile Picture - Clean Border */}
                <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 flex-shrink-0">
                  {/* Subtle shadow only */}
                  <div className="relative w-full h-full rounded-full overflow-hidden border-3 border-[#2c2c2c] shadow-xl shadow-black/15 hover:shadow-2xl hover:shadow-black/25 transition-all duration-300">
                    <Image
                      src="/images/profile.jpg"
                      alt={personal_information.name}
                      width={320}
                      height={320}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fields I Want to Pursue Section */}
      <div className="relative z-10 bg-gray-100 py-6 sm:py-8 lg:py-10 pb-0">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#2c2c2c] transition-all duration-500 ease-out cursor-default font-montserrat mb-0">Fields I Want to Pursue</h2>
        </div>
      </div>

      {/* Tabs Section - Fields of Expertise */}
      <div className="relative z-10 bg-gray-100 pt-2 sm:pt-3 lg:pt-4 py-6 sm:py-8 lg:py-10 border-b-2 border-gray-300 mb-24">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 lg:gap-3">
            <button className="px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-[#2c2c2c] transition-colors duration-300 font-rubik text-sm sm:text-base border-b-2 border-transparent hover:border-[#2c2c2c]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <span>Network Engineering</span>
              </div>
            </button>
            <button className="px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-[#2c2c2c] transition-colors duration-300 font-rubik text-sm sm:text-base border-b-2 border-transparent hover:border-[#2c2c2c]">
              <div className="flex items-center gap-2">
                <span className="text-lg">☁️</span>
                <span>Cloud Networking</span>
              </div>
            </button>
            <button className="px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-[#2c2c2c] transition-colors duration-300 font-rubik text-sm sm:text-base border-b-2 border-transparent hover:border-[#2c2c2c]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <span>Network Security</span>
              </div>
            </button>
            <button className="px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-[#2c2c2c] transition-colors duration-300 font-rubik text-sm sm:text-base border-b-2 border-transparent hover:border-[#2c2c2c]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <span>Enterprise Networking</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
}
