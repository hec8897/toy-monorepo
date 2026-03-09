import SectionLabel from './ui/SectionLabel';

const SKILL_CATEGORIES = [
  {
    category: 'Frontend',
    skills: [
      { name: 'React', icon: '⚛️', level: 90 },
      { name: 'Next.js', icon: '▲', level: 85 },
      { name: 'TypeScript', icon: '🔷', level: 85 },
      { name: 'Tailwind CSS', icon: '🎨', level: 90 },
    ],
  },
  {
    category: 'Backend',
    skills: [
      { name: 'Node.js', icon: '🟢', level: 70 },
      { name: 'NestJS', icon: '🐱', level: 65 },
      { name: 'PostgreSQL', icon: '🐘', level: 60 },
      { name: 'REST API', icon: '🔌', level: 80 },
    ],
  },
  {
    category: 'Tools',
    skills: [
      { name: 'Git', icon: '🌿', level: 85 },
      { name: 'Docker', icon: '🐳', level: 55 },
      { name: 'Figma', icon: '🎭', level: 70 },
      { name: 'Vercel', icon: '▲', level: 80 },
    ],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="py-24 px-6 bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>Skills</SectionLabel>

        <h2 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-12">
          기술 스택
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {SKILL_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold text-violet-400 mb-6">
                {cat.category}
              </h3>
              <div className="flex flex-col gap-5">
                {cat.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{skill.icon}</span>
                        <span className="text-sm text-gray-300">
                          {skill.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
