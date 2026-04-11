'use client';

import { useCreateEntry } from '@/domains/journal/application/useCreateEntry';
import { useDeleteEntry } from '@/domains/journal/application/useDeleteEntry';
import { useGetEntries } from '@/domains/journal/application/useGetEntries';
import { JournalForm } from '@/domains/journal/presentation/components/JournalForm';
import { JournalList } from '@/domains/journal/presentation/components/JournalList';

export function JournalPageView() {
  const { data: entries, isLoading, isError } = useGetEntries();
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
        deletingId={deleteMutation.variables}
      />
    </div>
  );
}
