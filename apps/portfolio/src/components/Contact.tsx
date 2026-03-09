import { SectionLabel } from './About';

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    description: '코드 저장소',
    icon: '🐙',
    href: 'https://github.com/',
    color: 'hover:border-gray-600',
  },
  {
    label: 'LinkedIn',
    description: '전문 프로필',
    icon: '💼',
    href: 'https://linkedin.com/',
    color: 'hover:border-blue-700',
  },
  {
    label: 'Email',
    description: 'hello@example.com',
    icon: '✉️',
    href: 'mailto:hello@example.com',
    color: 'hover:border-violet-700',
  },
];

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>Contact</SectionLabel>

        <div className="max-w-2xl mx-auto text-center mt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            함께 일해요 👋
          </h2>
          <p className="text-gray-400 mb-12">
            새로운 기회나 프로젝트 협업에 항상 열려 있습니다. 편하게 연락주세요!
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-3 p-6 bg-gray-900 rounded-2xl border border-gray-800 ${link.color} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                <span className="text-3xl">{link.icon}</span>
                <div>
                  <p className="text-white font-medium">{link.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {link.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <a
            href="mailto:hello@example.com"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30"
          >
            ✉️ &nbsp;메일 보내기
          </a>
        </div>
      </div>
    </section>
  );
}
