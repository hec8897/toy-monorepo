import {
  SiFlutter,
  SiFigma,
  SiGit,
  SiMongodb,
  SiMysql,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiReact,
  SiSlack,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVuedotjs,
} from 'react-icons/si';

import SectionLabel from './ui/SectionLabel';

const SKILL_CATEGORIES = [
  {
    category: 'Frontend',
    skills: [
      { name: 'React', icon: SiReact, color: '#61DAFB', level: 90 },
      { name: 'Next.js', icon: SiNextdotjs, color: '#ffffff', level: 85 },
      {
        name: 'Tailwind CSS',
        icon: SiTailwindcss,
        color: '#38BDF8',
        level: 80,
      },
      { name: 'Vue.js', icon: SiVuedotjs, color: '#4FC08D', level: 50 },
      { name: 'TypeScript', icon: SiTypescript, color: '#3178C6', level: 85 },
      { name: 'Flutter', icon: SiFlutter, color: '#54C5F8', level: 50 },
    ],
  },
  {
    category: 'Backend',
    skills: [
      { name: 'Node.js', icon: SiNodedotjs, color: '#68A063', level: 60 },
      { name: 'NestJS', icon: SiNestjs, color: '#E0234E', level: 60 },
      { name: 'MongoDB', icon: SiMongodb, color: '#47A248', level: 30 },
      { name: 'MySQL', icon: SiMysql, color: '#4479A1', level: 50 },
    ],
  },
  {
    category: 'Tools',
    skills: [
      { name: 'Git', icon: SiGit, color: '#F05032', level: 80 },
      { name: 'Figma', icon: SiFigma, color: '#F24E1E', level: 70 },
      { name: 'Slack', icon: SiSlack, color: '#4A154B', level: 55 },
      { name: 'Vercel', icon: SiVercel, color: '#ffffff', level: 80 },
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
                        <skill.icon size={16} color={skill.color} />
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
