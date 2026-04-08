'use client';

import { JournalForm } from '@/features/journal/components/JournalForm';
import { JournalList } from '@/features/journal/components/JournalList';
import { useCreateEntry } from '@/features/journal/hooks/useCreateEntry';
import { useDeleteEntry } from '@/features/journal/hooks/useDeleteEntry';
import { useEntries } from '@/features/journal/hooks/useEntries';

export default function JournalPage() {
  const { data: entries, isLoading, isError } = useEntries();
  const createMutation = useCreateEntry();
  const deleteMutation = useDeleteEntry();

  return (
    <div className="p-6 space-y-8">
      <JournalForm
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />
      <JournalList
        entries={entries ?? []}
        isLoading={isLoading}
        isError={isError}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
