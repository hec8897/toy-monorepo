interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article>
        <h1 className="text-3xl font-bold text-gray-900">{slug}</h1>
        <p className="mt-4 text-gray-500">
          블로그 포스트 내용이 여기에 들어갑니다. (Day 13-14)
        </p>
      </article>
    </div>
  );
}
