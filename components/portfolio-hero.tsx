"use client";

import { Github, Linkedin, Mail, Youtube, Facebook, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import digitalTwinData from "@/data/digitaltwin.json";
import ChatWidget from "./chat-widget";
import Footer from "./footer";
import EmailModal from "./email-modal";

export default function PortfolioHero() {
  const { personal_information } = digitalTwinData;
  const careerFocusItems = personal_information.fields_of_interest.slice(0, 4);
  const [activeLink, setActiveLink] = useState("home");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);

  const nextProject = () => {
    setCurrentProjectIndex((prev) => (prev + 1) % digitalTwinData.projects.length);
  };

  const prevProject = () => {
    setCurrentProjectIndex((prev) => (prev - 1 + digitalTwinData.projects.length) % digitalTwinData.projects.length);
  };

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
            <div className="flex items-center">
              <Image
                src="/images/logo.svg"
                alt="Digital Twin Portfolio Logo"
                width={200}
                height={50}
                className="h-11 w-auto"
                priority
              />
            </div>
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
      <div id="home" className="relative pt-20 sm:pt-24 lg:pt-32 z-10 h-[70vh]">
        {/* Wallpaper Background - Only for Hero */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/wallpaper.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-10 sm:py-20 lg:py-28 relative z-10">
          <div className="flex items-center justify-center h-full">
            {/* Centered Content */}
            <div className="space-y-6 sm:space-y-10 text-center max-w-4xl">
              {/* Main Heading */}
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight sm:leading-[1.1] lg:leading-[1.15] tracking-tight cursor-default font-montserrat text-amber-400 drop-shadow-2xl hover:scale-110 hover:text-yellow-300 transition-all duration-500">
                  My Portfolio
                </h1>
                <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in-up animation-delay-400">
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#2563eb] text-white font-bold rounded-2xl hover:bg-[#1d4ed8] transition-all shadow-lg hover:shadow-xl font-montserrat text-lg"
                  >
                    Know More
                  </a>
                  <button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-transparent text-white font-bold hover:bg-white/10 transition-all font-montserrat text-lg group rounded-2xl"
                  >
                    <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    Email Me
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trainings & Certifications Section */}
      <div className="relative z-10 bg-gray-100 py-6 sm:py-8 lg:py-10 pb-0">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#2c2c2c] transition-all duration-500 ease-out cursor-default font-montserrat mb-0">Trainings & Certifications</h2>
        </div>
      </div>

      {/* Tabs Section - Certifications */}
      <div className="relative z-10 bg-gray-100 pt-2 sm:pt-3 lg:pt-4 py-6 sm:py-8 lg:py-10 mb-12">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ITS Networking Card */}
            <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              {/* Certificate Image */}
              <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                <Image
                  src="/images/its-networking-cert.jpg"
                  alt="ITS Networking Certificate"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* Card Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-montserrat">ITS Networking</h3>
                  <p className="text-sm text-gray-600 font-rubik">Professional certification in network fundamentals and administration.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Networking</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Certified</span>
                </div>
              </div>
            </div>

            {/* TCON 2024 Card */}
            <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              {/* Event Image */}
              <div className="w-full h-64 bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
                <Image
                  src="/images/tcon7.jpg"
                  alt="TCON 7 Event"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* Card Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-montserrat">TCON 7</h3>
                  <p className="text-sm text-gray-600 font-rubik">The Ultimate Tech Event in the North</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">HackTheNorth</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">UNIT 3500</span>
                </div>
              </div>
            </div>

            {/* SPUP CyberSummit 2024 Card */}
            <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              {/* Event Image */}
              <div className="w-full h-64 bg-gradient-to-br from-green-50 to-green-100 overflow-hidden">
                <Image
                  src="/images/ite-convention.jpg"
                  alt="ITE Convention 2023"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* Card Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-montserrat">ITE Convention 2023</h3>
                  <p className="text-sm text-gray-600 font-rubik">Driving Sustainable Development Through Innovation of Technology for a Better Future.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Workshop</span>
                </div>
              </div>
            </div>

        
          </div>
        </div>
      </div>

      {/* About Me Section */}
      <div id="about" className="relative z-10 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-16 sm:py-20 lg:py-24">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#2c2c2c] font-montserrat mb-4">About Me</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto"></div>
          </div>

          {/* Bio Section with Image */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 mb-16">
            {/* Image Column */}
            <div className="lg:col-span-2 flex items-start justify-center">
              <div className="relative w-full max-w-md space-y-16">
                <div className="relative w-80 h-80 mx-auto rounded-full overflow-hidden shadow-2xl border-[6px] border-white hover:shadow-3xl hover:scale-105 transition-all duration-500">
                  <Image
                    src="/images/profile.jpg"
                    alt="About Me"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Decorative gradient ring behind image */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                  <div className="w-80 h-80 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 opacity-20 blur-2xl"></div>
                </div>
                
                {/* Recent Projects Section */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-blue-200/50 hover:border-blue-300">
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 font-montserrat">Recent Projects</h3>
                    
                    {/* Project Display */}
                    <div className="space-y-4">
                      {/* Project Image */}
                      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden">
                        <Image
                          src={`/images/project${currentProjectIndex + 1}.jpg`}
                          alt={digitalTwinData.projects[currentProjectIndex].name}
                          width={400}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Project Info */}
                      <a
                        href={digitalTwinData.projects[currentProjectIndex].github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 group border border-blue-200 hover:border-blue-400"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                            <Github className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors font-montserrat text-sm">
                              {digitalTwinData.projects[currentProjectIndex].name}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-3 font-rubik">
                              {digitalTwinData.projects[currentProjectIndex].description}
                            </p>
                          </div>
                        </div>
                      </a>
                      
                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={prevProject}
                          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          aria-label="Previous project"
                        >
                          <ChevronLeft className="w-5 h-5 text-blue-600" />
                        </button>
                        <span className="text-sm text-gray-600 font-rubik">
                          {currentProjectIndex + 1} / {digitalTwinData.projects.length}
                        </span>
                        <button
                          onClick={nextProject}
                          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          aria-label="Next project"
                        >
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border-2 border-blue-200/50 hover:shadow-3xl transition-all duration-500 hover:border-blue-300">
                
                <div className="space-y-7 text-gray-800 font-serif text-[18px] leading-[1.9]">
                  <p className="first-letter:text-[5rem] first-letter:font-black first-letter:text-transparent first-letter:bg-clip-text first-letter:bg-gradient-to-br first-letter:from-blue-600 first-letter:to-indigo-600 first-letter:float-left first-letter:mr-4 first-letter:leading-[0.85] first-letter:mt-2">
                    As an aspiring {digitalTwinData.personal_information.career_focus} professional based in {digitalTwinData.personal_information.location}, I am passionate about building robust network infrastructure and staying at the forefront of technological innovation.
                  </p>
                  
                  <div className="space-y-6 pt-4">
                    <p className="text-[17px]">
                      Currently pursuing a <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{digitalTwinData.education.degree}</span> with specialization in <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">{digitalTwinData.education.specialization}</span>. My academic journey is driven by a deep passion for {digitalTwinData.education.career_pursuit}.
                    </p>
                    
                    <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-l-4 border-green-600 p-6 rounded-r-2xl shadow-sm">
                      <p className="text-[17px] leading-relaxed">
                        <span className="font-bold text-green-900 block mb-2">🎯 Short-term Goals:</span>
                        <span className="block mb-4 ml-4">{digitalTwinData.goals.short_term.join(", ")}</span>
                        <span className="font-bold text-emerald-900 block mb-2">🚀 Long-term Goals:</span>
                        <span className="block ml-4">{digitalTwinData.goals.long_term.join(", ")}</span>
                        <span className="block mt-4 italic text-gray-700">These ambitions reflect my unwavering commitment to continuous growth in both technology and leadership.</span>
                      </p>
                    </div>
                    
                    <p className="text-[17px]">
                      My technical expertise spans across various <span className="font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-lg">technical domains</span> including <span className="font-semibold">{digitalTwinData.skills.technical_skills?.slice(0, 3).join(", ")}</span>. I'm also highly proficient in <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">networking technologies</span> such as <span className="font-semibold">{digitalTwinData.skills.networking_skills?.slice(0, 3).join(", ")}</span>, demonstrating a comprehensive and well-rounded skill set in both software development and network infrastructure.
                    </p>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200 shadow-sm">
                      <p className="text-[17px]">
                        <span className="font-bold text-purple-900 block mb-3">💡 Fields of Interest:</span>
                        <span className="block ml-4 leading-relaxed">{digitalTwinData.personal_information.fields_of_interest?.join(", ")}, reflecting my diverse curiosity and unwavering commitment to staying at the forefront of technological innovation.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Email Modal */}
      <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
}
