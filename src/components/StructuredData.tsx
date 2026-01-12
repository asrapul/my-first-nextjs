export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Andi Asyraful',
    url: 'https://andiasyraful.vercel.app',
    jobTitle: 'Web Developer',
    description: 'Web Developer & Software Engineer dengan passion di bidang teknologi. Fokus pada Frontend Development, Mobile Apps, dan Cyber Security.',
    knowsAbout: ['Next.js', 'React', 'TypeScript', 'Flutter', 'JavaScript', 'Tailwind CSS', 'Cyber Security'],
    sameAs: [
      'https://github.com/asrapul',
      'https://www.linkedin.com/in/andi-asyraful-amal-ilham-8b09b730a/',
      'https://www.instagram.com/asrapulamal',
    ],
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: 'SMK Telkom Makassar',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
