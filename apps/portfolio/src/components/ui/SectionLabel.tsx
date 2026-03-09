export default function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
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
