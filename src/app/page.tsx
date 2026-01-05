'use client'

import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const { theme } = useTheme();

  // Theme-based classes
  const isDark = theme === 'dark';
  
  const bgGradient = isDark 
    ? 'bg-gradient-to-b from-[#2a1a1e] via-[#3d2629] to-[#2a1a1e]' 
    : 'bg-gradient-to-b from-gray-50 via-white to-gray-50';
  
  const textColor = isDark ? 'text-white' : 'text-gray-800';
  const navBg = isDark ? 'bg-[#2a1a1e]/80' : 'bg-white/80';
  const navBorder = isDark ? 'border-[#6B4C52]' : 'border-gray-200';
  const navTitle = isDark ? 'text-[#E8D4D8]' : 'text-[#667eea]';
  const navLink = isDark ? 'hover:text-[#E8D4D8]' : 'hover:text-[#667eea]';
  const navLinkText = isDark ? 'text-gray-300' : 'text-gray-600';
  
  const accentColor = isDark ? 'text-[#E8D4D8]' : 'text-[#667eea]';
  const accentBg = isDark ? 'bg-[#E8D4D8]' : 'bg-[#667eea]';
  const accentText = isDark ? 'text-[#2a1a1e]' : 'text-white';
  const secondaryAccent = isDark ? 'text-[#D4B8BE]' : 'text-[#764ba2]';
  
  const tagBg = isDark ? 'bg-[#452829]/30 border-[#E8D4D8]' : 'bg-[#667eea]/10 border-[#667eea]';
  const tagText = isDark ? 'text-[#E8D4D8]' : 'text-[#667eea]';
  
  const sectionBg = isDark ? 'bg-[#3d2629]/50' : 'bg-gray-100';
  const cardBg = isDark 
    ? 'border-[#6B4C52] bg-[#3d2629]/50 hover:bg-[#452829]/50 hover:border-[#E8D4D8]' 
    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-[#667eea] shadow-sm';
  
  const mutedText = isDark ? 'text-slate-200' : 'text-gray-600';
  const footerBg = isDark ? 'bg-[#2a1a1e] border-[#6B4C52]' : 'bg-gray-100 border-gray-200';
  const footerText = isDark ? 'text-slate-400' : 'text-gray-500';
  const footerLink = isDark ? 'hover:text-[#E8D4D8]' : 'hover:text-[#667eea]';

  return (
    <div className={`min-h-screen ${bgGradient} ${textColor} font-sans`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full ${navBg} backdrop-blur-md border-b ${navBorder} z-50`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h2 className={`text-xl font-bold ${navTitle}`}>Andi Asyraful</h2>
          <div className="flex items-center gap-6">
            <div className="flex gap-6">
              <a href="#about" className={`${navLinkText} ${navLink} transition`}>
                About
              </a>
              <a href="#interests" className={`${navLinkText} ${navLink} transition`}>
                Interests
              </a>
              <a href="#contact" className={`${navLinkText} ${navLink} transition`}>
                Contact
              </a>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Photo */}
          <div className="flex justify-center">
            <div className={`relative w-64 h-80 rounded-lg overflow-hidden border-2 ${isDark ? 'border-[#E8D4D8]' : 'border-[#667eea]'} shadow-2xl`}>
              <Image
                src="/Image/profile.jpg"
                alt="Andi Asyraful"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Introduction */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-bold mb-2">Andi Asyraful</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 ${tagBg} border rounded-full ${tagText} text-sm`}>
                  RPL Developer
                </span>
                <span className={`px-3 py-1 ${tagBg} border rounded-full ${tagText} text-sm`}>
                  17 Years Old
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <p className={`${mutedText} leading-relaxed`}>
                Seorang siswa kelas 12 dari{" "}
                <span className={`${accentColor} font-semibold`}>
                  SMK Telkom Makassar
                </span>
                , jurusan{" "}
                <span className={`${accentColor} font-semibold`}>
                  Rekayasa Perangkat Lunak (RPL)
                </span>
                .
              </p>

              <p className={`${mutedText} leading-relaxed`}>
                Memiliki minat kuat di bidang teknologi informasi, khususnya
                <span className={secondaryAccent}> web development</span>,
                <span className={secondaryAccent}> software engineering</span>, dan
                <span className={secondaryAccent}> cyber security</span>.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button className={`px-6 py-2 ${accentBg} ${accentText} rounded-lg font-semibold hover:opacity-90 transition`}>
                Learn More
              </button>
              <button className={`px-6 py-2 border ${isDark ? 'border-[#E8D4D8] text-[#E8D4D8] hover:bg-[#E8D4D8]/10' : 'border-[#667eea] text-[#667eea] hover:bg-[#667eea]/10'} rounded-lg font-semibold transition`}>
                Get In Touch
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`py-20 px-6 ${sectionBg}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl font-bold mb-12 ${accentColor}`}>
            Tentang Saya
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${secondaryAccent}`}>
                Aktivitas & Pengalaman
              </h3>
              <ul className={`space-y-3 ${mutedText}`}>
                <li className="flex gap-3">
                  <span className={accentColor}>✦</span>
                  <span>Aktif mengikuti berbagai lomba IT</span>
                </li>
                <li className="flex gap-3">
                  <span className={accentColor}>✦</span>
                  <span>Bimbingan dari software engineer berpengalaman</span>
                </li>
                <li className="flex gap-3">
                  <span className={accentColor}>✦</span>
                  <span>Tergabung dalam beberapa komunitas pembelajaran teknologi</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${secondaryAccent}`}>
                Visi & Misi
              </h3>
              <p className={`${mutedText} leading-relaxed`}>
                Memiliki tujuan besar untuk mencapai kebebasan finansial di usia
                muda dan menggunakan kemampuan untuk memberi dampak positif bagi
                masyarakat Indonesia.
              </p>
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} leading-relaxed text-sm pt-2`}>
                Saat ini berada di fase menentukan langkah masa depan, termasuk
                mempertimbangkan kuliah di Indonesia atau Jerman, dengan
                ketertarikan pada sistem kuliah sambil bekerja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interests Section */}
      <section id="interests" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl font-bold mb-12 ${accentColor}`}>
            Area of Interest
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Web Development",
                desc: "Building modern web applications with latest technologies",
              },
              {
                title: "Software Engineering",
                desc: "Designing robust and scalable software solutions",
              },
              {
                title: "Cyber Security",
                desc: "Protecting systems and data from digital threats",
              },
            ].map((interest, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border ${cardBg} transition cursor-pointer group`}
              >
                <h3 className={`text-lg font-semibold ${accentColor} group-hover:opacity-80 mb-2`}>
                  {interest.title}
                </h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-sm`}>{interest.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={`py-12 px-6 ${footerBg} border-t`}>
        <div className="max-w-4xl mx-auto text-center">
          <p className={`${footerText} mb-4`}>
            © 2025 Andi Asyraful. All rights reserved.
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="#"
              className={`${footerText} ${footerLink} transition`}
            >
              GitHub
            </a>
            <a
              href="#"
              className={`${footerText} ${footerLink} transition`}
            >
              LinkedIn
            </a>
            <a
              href="#"
              className={`${footerText} ${footerLink} transition`}
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
