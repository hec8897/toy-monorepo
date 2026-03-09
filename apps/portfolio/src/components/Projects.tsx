import SectionLabel from './ui/SectionLabel';

const PROJECTS = [
  {
    title: 'E-Commerce Platform',
    description:
      '병행 수입/수출 셀러를 위한 상품 관리 플랫폼. 올리브영 랭킹 크롤링, 매출 통계, 상품 등록 자동화 기능을 제공합니다.',
    tags: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL'],
    color: 'from-violet-600 to-fuchsia-600',
    emoji: '🛍️',
    github: '#',
    demo: '#',
  },
  {
    title: 'Portfolio Website',
    description:
      '모던한 디자인의 개인 포트폴리오 사이트. Next.js App Router와 Tailwind CSS로 제작했습니다.',
    tags: ['Next.js', 'Tailwind CSS', 'TypeScript'],
    color: 'from-cyan-600 to-blue-600',
    emoji: '💼',
    github: '#',
    demo: '#',
  },
  {
    title: 'Dashboard App',
    description:
      '실시간 데이터 시각화 대시보드. Chart.js와 React Query를 활용해 효율적인 데이터 패칭과 렌더링을 구현했습니다.',
    tags: ['React', 'Chart.js', 'React Query', 'TailwindCSS'],
    color: 'from-emerald-600 to-teal-600',
    emoji: '📊',
    github: '#',
    demo: '#',
  },
];

export default function Projects() {
  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>Projects</SectionLabel>

        <div className="flex flex-col md:flex-row md:items-end justify-between mt-6 mb-12 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            주요 프로젝트
          </h2>
          <a
            href="#"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            모든 프로젝트 보기 →
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PROJECTS.map((project) => (
            <div
              key={project.title}
              className="group flex flex-col bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
            >
              {/* Thumbnail */}
              <div
                className={`h-40 bg-gradient-to-br ${project.color} flex items-center justify-center`}
              >
                <span className="text-5xl">{project.emoji}</span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 bg-gray-800 text-gray-400 rounded-md border border-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-4 text-sm">
                  <a
                    href={project.github}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <span>⌥</span> GitHub
                  </a>
                  <a
                    href={project.demo}
                    className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <span>↗</span> Live Demo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
