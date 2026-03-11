import SectionLabel from './ui/SectionLabel';

const STATS = [
  { value: '7+', label: '년 경력' },
  { value: '5+', label: '프로젝트' },
  { value: '20+', label: '기술 스택' },
];

export default function About() {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>About Me</SectionLabel>

        <div className="grid md:grid-cols-2 gap-16 items-center mt-12">
          {/* Profile Image Placeholder */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl rotate-6 opacity-40" />
              <div className="relative w-full h-full bg-gray-800 rounded-2xl border border-gray-700 flex items-center justify-center overflow-hidden">
                <span className="text-7xl">👨‍💻</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              팀에 실질적 기여를 중시하는
              <span className="text-violet-400"> 개발자</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              제로 베이스 환경에서 시작해 하나의 완성된 웹 서비스를 기획부터
              개발까지 주도해 성공적으로 런칭한 경험이 있습니다. 그 과정에서
              기획·디자인·마케팅·운영 등 다양한 직군과 긴밀히 협업하며 제품의 전
              과정을 함께 고민했습니다.
            </p>
            <p className="text-gray-400 leading-relaxed mb-10">
              프론트엔드 개발자로, React 기반 UI 컴포넌트 구현과 퍼블리싱은 물론
              효율적인 아키텍쳐 구조를 고민하고 안정적으로 운영하는 것을
              중점으로 근무하였습니다.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 bg-gray-900 rounded-xl border border-gray-800"
                >
                  <p className="text-2xl font-bold text-violet-400">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
