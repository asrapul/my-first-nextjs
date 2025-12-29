import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a1a1e] via-[#3d2629] to-[#2a1a1e] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#2a1a1e]/80 backdrop-blur-md border-b border-[#6B4C52] z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#E8D4D8]">Andi Asyraful</h2>
          <div className="flex gap-6">
            <a href="#about" className="hover:text-[#E8D4D8] transition">
              About
            </a>
            <a href="#interests" className="hover:text-[#E8D4D8] transition">
              Interests
            </a>
            <a href="#contact" className="hover:text-[#E8D4D8] transition">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Photo Placeholder */}
          <div className="flex justify-center">
            <div className="relative w-64 h-80 rounded-lg overflow-hidden border-2 border-[#E8D4D8] shadow-2xl">
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
                <span className="px-3 py-1 bg-[#452829]/30 border border-[#E8D4D8] rounded-full text-[#E8D4D8] text-sm">
                  RPL Developer
                </span>
                <span className="px-3 py-1 bg-[#452829]/30 border border-[#E8D4D8] rounded-full text-[#E8D4D8] text-sm">
                  17 Years Old
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-200 leading-relaxed">
                Seorang siswa kelas 12 dari{" "}
                <span className="text-[#E8D4D8] font-semibold">
                  SMK Telkom Makassar
                </span>
                , jurusan{" "}
                <span className="text-[#E8D4D8] font-semibold">
                  Rekayasa Perangkat Lunak (RPL)
                </span>
                .
              </p>

              <p className="text-slate-200 leading-relaxed">
                Memiliki minat kuat di bidang teknologi informasi, khususnya
                <span className="text-[#D4B8BE]"> web development</span>,
                <span className="text-[#D4B8BE]"> software engineering</span>, dan
                <span className="text-[#D4B8BE]"> cyber security</span>.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button className="px-6 py-2 bg-[#E8D4D8] text-[#2a1a1e] rounded-lg font-semibold hover:bg-[#D4B8BE] transition">
                Learn More
              </button>
              <button className="px-6 py-2 border border-[#E8D4D8] text-[#E8D4D8] rounded-lg font-semibold hover:bg-[#E8D4D8]/10 transition">
                Get In Touch
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-[#3d2629]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-[#E8D4D8]">
            Tentang Saya
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#D4B8BE]">
                Aktivitas & Pengalaman
              </h3>
              <ul className="space-y-3 text-slate-200">
                <li className="flex gap-3">
                  <span className="text-[#E8D4D8]">✦</span>
                  <span>Aktif mengikuti berbagai lomba IT</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#E8D4D8]">✦</span>
                  <span>Bimbingan dari software engineer berpengalaman</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#E8D4D8]">✦</span>
                  <span>Tergabung dalam beberapa komunitas pembelajaran teknologi</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#D4B8BE]">
                Visi & Misi
              </h3>
              <p className="text-slate-200 leading-relaxed">
                Memiliki tujuan besar untuk mencapai kebebasan finansial di usia
                muda dan menggunakan kemampuan untuk memberi dampak positif bagi
                masyarakat Indonesia.
              </p>
              <p className="text-slate-300 leading-relaxed text-sm pt-2 text-slate-400">
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
          <h2 className="text-3xl font-bold mb-12 text-[#E8D4D8]">
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
                className="p-6 rounded-lg border border-[#6B4C52] bg-[#3d2629]/50 hover:bg-[#452829]/50 hover:border-[#E8D4D8] transition cursor-pointer group"
              >
                <h3 className="text-lg font-semibold text-[#E8D4D8] group-hover:text-[#D4B8BE] mb-2">
                  {interest.title}
                </h3>
                <p className="text-slate-400 text-sm">{interest.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-6 bg-[#2a1a1e] border-t border-[#6B4C52]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 mb-4">
            © 2025 Andi Asyraful. All rights reserved.
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="#"
              className="text-slate-400 hover:text-[#E8D4D8] transition"
            >
              GitHub
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-[#E8D4D8] transition"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-[#E8D4D8] transition"
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
