import './global.css';

export const metadata = {
  title: 'Portfolio | Frontend Developer',
  description: '프론트엔드 개발자 포트폴리오',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
