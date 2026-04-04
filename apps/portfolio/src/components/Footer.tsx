export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <p>
          Built with <span className="text-violet-500">Next.js</span> &{' '}
          <span className="text-violet-500">Tailwind CSS</span>
        </p>
        <p>© {new Date().getFullYear()} Your Name. All rights reserved.</p>
      </div>
    </footer>
  );
}
