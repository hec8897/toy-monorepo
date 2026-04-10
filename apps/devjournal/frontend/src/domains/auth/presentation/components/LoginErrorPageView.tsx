'use client';

import { useRouter } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: '로그인을 취소했습니다.',
  server_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  no_code: '잘못된 접근입니다.',
};

const DEFAULT_MESSAGE = '인증에 실패했습니다.';

interface Props {
  reason?: string;
}

export function LoginErrorPageView({ reason }: Props) {
  const router = useRouter();
  const message = (reason && ERROR_MESSAGES[reason]) ?? DEFAULT_MESSAGE;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-center text-lg font-semibold text-gray-900">
          로그인 실패
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">{message}</p>
        <button
          onClick={() => router.replace('/login')}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          다시 로그인
        </button>
      </div>
    </div>
  );
}
