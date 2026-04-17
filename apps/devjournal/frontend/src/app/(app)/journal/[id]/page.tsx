import { EntryDetailPageView } from '@/domains/journal/presentation/EntryDetailPageView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EntryDetailPage({ params }: Props) {
  const { id } = await params;
  return <EntryDetailPageView entryId={id} />;
}
