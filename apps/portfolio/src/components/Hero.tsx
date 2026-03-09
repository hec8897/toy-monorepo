export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(139, 92, 246, 0.15) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float delay-300" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <p className="animate-fade-up opacity-0 delay-100 text-sm font-medium text-violet-400 tracking-widest uppercase mb-4">
          Welcome to my portfolio
        </p>

        <h1 className="animate-fade-up opacity-0 delay-200 text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Hi, I&apos;m{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
            Your Name
          </span>
        </h1>

        <p className="animate-fade-up opacity-0 delay-300 text-xl md:text-2xl text-gray-400 mb-4">
          Frontend Developer
          <span className="inline-block w-0.5 h-6 bg-violet-400 ml-1 align-middle animate-blink" />
        </p>

        <p className="animate-fade-up opacity-0 delay-400 text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-10">
          사용자 경험을 중심으로 생각하는 프론트엔드 개발자입니다. 아름답고 빠른
          웹을 만들어갑니다.
        </p>

        <div className="animate-fade-up opacity-0 delay-500 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#projects"
            className="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25"
          >
            View My Work
          </a>
          <a
            href="#contact"
            className="px-8 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 hover:scale-105"
          >
            Contact Me
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in">
        <span className="text-xs text-gray-600">scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gray-600 to-transparent" />
      </div>
    </section>
  );
}
