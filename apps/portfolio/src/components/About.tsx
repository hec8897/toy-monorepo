const STATS = [
  { value: '3+', label: '년 경력' },
  { value: '20+', label: '프로젝트' },
  { value: '10+', label: '기술 스택' },
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
              개발을 즐기는{' '}
              <span className="text-violet-400">프론트엔드 개발자</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              안녕하세요! 저는 React와 Next.js를 주력으로 하는 프론트엔드
              개발자입니다. 사용자가 직접 경험하는 인터페이스에 가장 큰 가치를
              두며, 성능과 접근성을 고려한 코드를 작성합니다.
            </p>
            <p className="text-gray-400 leading-relaxed mb-10">
              새로운 기술을 빠르게 습득하고, 팀과 함께 성장하는 것을 즐깁니다.
              클린 코드와 좋은 설계에 대한 끊임없는 고민으로 더 나은
              소프트웨어를 만들어갑니다.
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-px bg-violet-500" />
      <span className="text-sm font-medium text-violet-400 tracking-widest uppercase">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

export { SectionLabel };
