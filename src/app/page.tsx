'use client'

import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div className={`min-h-screen font-sans overflow-hidden relative transition-colors duration-500 ${
      isDark 
        ? 'bg-[#0a0a0f] text-white' 
        : 'bg-gradient-to-br from-slate-50 via-white to-violet-50 text-gray-900'
    }`}>
      
      {/* Custom SVG Cursor */}
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-[9999] transition-opacity duration-200 hidden md:block ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-4px, -4px)',
        }}
      >
        {/* Main Cursor SVG - Purple Arrow */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <filter id="cursorGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M4 4L4 24L10 18L16 28L20 26L14 16L22 16L4 4Z"
            fill="url(#cursorGradient)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
            filter="url(#cursorGlow)"
          />
        </svg>
        
        {/* Blur Trail Effect */}
        <div 
          className="absolute -inset-4 rounded-full opacity-30 blur-xl"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>
      
      {/* Cursor Styles */}
      <style jsx global>{`
        @media (min-width: 768px) {
          * { cursor: none !important; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -30px) scale(1.1); }
          50% { transform: translate(100px, 20px) scale(0.9); }
          75% { transform: translate(30px, 50px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, 40px) scale(1.15); }
          66% { transform: translate(40px, -50px) scale(0.85); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(-80px, 60px) rotate(180deg) scale(1.2); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(30px) translateY(-20px); }
          50% { transform: translateX(60px) translateY(10px); }
          75% { transform: translateX(20px) translateY(30px); }
          100% { transform: translateX(0) translateY(0); }
        }
      `}</style>

      {/* Enhanced Animated Background with Floating Blur Circles */}
      <div className="absolute inset-0 overflow-hidden">
        {isDark ? (
          <>
            {/* Large floating orbs */}
            <div 
              className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/25 via-violet-500/15 to-transparent rounded-full blur-3xl"
              style={{ animation: 'float1 20s ease-in-out infinite' }}
            />
            <div 
              className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl"
              style={{ animation: 'float2 25s ease-in-out infinite' }}
            />
            <div 
              className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 rounded-full blur-3xl"
              style={{ animation: 'float3 18s ease-in-out infinite' }}
            />
            
            {/* Medium floating orbs */}
            <div 
              className="absolute top-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-violet-400/15 to-fuchsia-400/10 rounded-full blur-2xl"
              style={{ animation: 'breathe 8s ease-in-out infinite' }}
            />
            <div 
              className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-gradient-to-l from-cyan-400/15 to-blue-400/10 rounded-full blur-2xl"
              style={{ animation: 'breathe 10s ease-in-out infinite', animationDelay: '2s' }}
            />
            
            {/* Small accent orbs */}
            <div 
              className="absolute top-1/2 left-1/4 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl"
              style={{ animation: 'drift 15s ease-in-out infinite' }}
            />
            <div 
              className="absolute bottom-1/4 left-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"
              style={{ animation: 'drift 12s ease-in-out infinite', animationDelay: '3s' }}
            />
            <div 
              className="absolute top-2/3 right-1/5 w-48 h-48 bg-amber-500/8 rounded-full blur-2xl"
              style={{ animation: 'breathe 7s ease-in-out infinite', animationDelay: '1s' }}
            />
          </>
        ) : (
          <>
            {/* Large floating orbs - Light Mode */}
            <div 
              className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-300/40 via-violet-200/25 to-transparent rounded-full blur-3xl"
              style={{ animation: 'float1 20s ease-in-out infinite' }}
            />
            <div 
              className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-300/35 via-blue-200/20 to-transparent rounded-full blur-3xl"
              style={{ animation: 'float2 25s ease-in-out infinite' }}
            />
            <div 
              className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-fuchsia-300/30 to-purple-200/20 rounded-full blur-3xl"
              style={{ animation: 'float3 18s ease-in-out infinite' }}
            />
            
            {/* Medium floating orbs */}
            <div 
              className="absolute top-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-violet-200/30 to-fuchsia-200/20 rounded-full blur-2xl"
              style={{ animation: 'breathe 8s ease-in-out infinite' }}
            />
            <div 
              className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-gradient-to-l from-cyan-200/30 to-blue-200/20 rounded-full blur-2xl"
              style={{ animation: 'breathe 10s ease-in-out infinite', animationDelay: '2s' }}
            />
            
            {/* Small accent orbs */}
            <div 
              className="absolute top-1/2 left-1/4 w-40 h-40 bg-pink-300/20 rounded-full blur-2xl"
              style={{ animation: 'drift 15s ease-in-out infinite' }}
            />
            <div 
              className="absolute bottom-1/4 left-1/2 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl"
              style={{ animation: 'drift 12s ease-in-out infinite', animationDelay: '3s' }}
            />
            <div 
              className="absolute top-2/3 right-1/5 w-48 h-48 bg-amber-200/20 rounded-full blur-2xl"
              style={{ animation: 'breathe 7s ease-in-out infinite', animationDelay: '1s' }}
            />
          </>
        )}
      </div>

      {/* Grid Pattern */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]' 
          : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'
      } bg-[size:100px_100px]`} />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-xl backdrop-blur-sm transition-all hover:scale-110 ${
          isDark 
            ? 'bg-white/10 border border-white/10 hover:bg-white/20' 
            : 'bg-gray-900/10 border border-gray-200 hover:bg-gray-900/20'
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Glass Card */}
          <div className={`backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-500 ${
            isDark 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-white/70 border border-gray-200/50 shadow-violet-200/20'
          }`}>
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
              {/* Profile Photo with Filter */}
              <div 
                className="relative group"
                onMouseEnter={() => setIsPhotoHovered(true)}
                onMouseLeave={() => setIsPhotoHovered(false)}
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 rounded-2xl blur transition-all duration-700 ${
                  isPhotoHovered 
                    ? 'opacity-100 scale-105' 
                    : 'opacity-50'
                } ${
                  isDark 
                    ? 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500' 
                    : 'bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400'
                }`} />
                
                {/* Photo Container */}
                <div className={`relative w-48 h-56 md:w-56 md:h-64 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                  isDark ? 'border-white/20' : 'border-violet-200'
                } ${isPhotoHovered ? 'scale-[1.02]' : ''}`}>
                  <Image
                    src="/Image/profile_picture.png"
                    alt="Andi Asyraful"
                    fill
                    className={`object-cover transition-all duration-700 ease-out ${
                      isPhotoHovered 
                        ? 'grayscale-0 brightness-105 contrast-105 saturate-110' 
                        : 'grayscale-[30%] brightness-95 contrast-110 saturate-90'
                    }`}
                    priority
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${
                    isPhotoHovered ? 'opacity-0' : 'opacity-100'
                  }`}>
                    <div className={`absolute inset-0 ${
                      isDark 
                        ? 'bg-gradient-to-t from-violet-900/40 via-transparent to-cyan-900/20' 
                        : 'bg-gradient-to-t from-violet-500/20 via-transparent to-fuchsia-500/10'
                    }`} />
                  </div>
                  
                  {/* Shine Effect on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transition-transform duration-700 ${
                    isPhotoHovered ? 'translate-x-full' : '-translate-x-full'
                  }`} />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className={`text-4xl md:text-5xl font-bold bg-clip-text text-transparent ${
                    isDark 
                      ? 'bg-gradient-to-r from-white via-violet-200 to-cyan-200' 
                      : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600'
                  }`}>
                    Andi Asyraful
                  </h1>
                  <p className={`text-lg mt-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    SMK Telkom Makassar • Rekayasa Perangkat Lunak
                  </p>
                </div>

                <p className={`leading-relaxed max-w-lg ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  Web Developer & Software Engineer dengan passion di bidang teknologi. 
                  Fokus pada <span className={isDark ? 'text-violet-400' : 'text-violet-600 font-medium'}>Frontend Development</span>, 
                  <span className={isDark ? 'text-fuchsia-400' : 'text-fuchsia-600 font-medium'}> Mobile Apps</span>, dan 
                  <span className={isDark ? 'text-cyan-400' : 'text-cyan-600 font-medium'}> Cyber Security</span>.
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {['Next.js', 'React', 'Flutter', 'JavaScript', 'Tailwind'].map((tech) => (
                    <span
                      key={tech}
                      className={`px-3 py-1 text-sm rounded-full transition-all cursor-default ${
                        isDark 
                          ? 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-violet-500/50' 
                          : 'bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-400'
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex gap-4 pt-4 justify-center md:justify-start">
                  <a
                    href="https://github.com/asrapul"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-3 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/50' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-violet-50 hover:border-violet-300'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${isDark ? 'text-white/70 group-hover:text-violet-400' : 'text-gray-500 group-hover:text-violet-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                  
                  <a
                    href="https://www.linkedin.com/in/andi-asyraful-amal-ilham-8b09b730a/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-3 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-cyan-50 hover:border-cyan-300'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${isDark ? 'text-white/70 group-hover:text-cyan-400' : 'text-gray-500 group-hover:text-cyan-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  
                  <a
                    href="mailto:lenovotk3t@outlook.com"
                    className={`group p-3 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/50' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-fuchsia-50 hover:border-fuchsia-300'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${isDark ? 'text-white/70 group-hover:text-fuchsia-400' : 'text-gray-500 group-hover:text-fuchsia-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                  
                  <a
                    href="https://www.instagram.com/asrapulamal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-3 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/50' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-pink-50 hover:border-pink-300'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${isDark ? 'text-white/70 group-hover:text-pink-400' : 'text-gray-500 group-hover:text-pink-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className={`grid grid-cols-3 gap-4 mt-10 pt-8 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>5+</p>
                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Projects</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className={`w-6 h-6 ${isDark ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>10+</p>
                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Technologies</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>LKS</p>
                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Cyber Sec</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className={`text-center text-sm mt-6 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            © 2025 Andi Asyraful • Built with Next.js
          </p>
        </div>
      </div>


    </div>
  );
}
