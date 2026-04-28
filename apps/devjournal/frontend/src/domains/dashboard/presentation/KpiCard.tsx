import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
}

export function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {icon ? (
          <span className="text-xl text-gray-400" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <span className="text-3xl font-semibold text-gray-900">{value}</span>
    </div>
  );
}
