'use client';

import { useState } from 'react';

import { useGetConcepts } from '@/domains/concepts/application/useGetConcepts';
import { useGetUserConcepts } from '@/domains/concepts/application/useGetUserConcepts';
import { useSearchConcepts } from '@/domains/concepts/application/useSearchConcepts';
import { ConceptList } from '@/domains/concepts/presentation/components/ConceptList';
import { ConceptSearch } from '@/domains/concepts/presentation/components/ConceptSearch';
import { UserConceptList } from '@/domains/concepts/presentation/components/UserConceptList';

type Tab = 'all' | 'my';

export function ConceptsPageView() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: allConcepts,
    isLoading: isAllLoading,
    isError: isAllError,
  } = useGetConcepts();
  const { data: userConcepts, isLoading: isUserLoading } = useGetUserConcepts();
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSearchConcepts(searchQuery);

  const isSearching = searchQuery.length > 0;
  const displayConcepts = isSearching
    ? (searchResults ?? [])
    : (allConcepts ?? []);
  const isConceptsLoading = isSearching ? isSearchLoading : isAllLoading;
  const isConceptsError = isSearching ? isSearchError : isAllError;

  return (
    <div className="p-6 space-y-6">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'all'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          전체 개념
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'my'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          내 학습 개념
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <ConceptSearch value={searchQuery} onChange={setSearchQuery} />
          <ConceptList
            concepts={displayConcepts}
            isLoading={isConceptsLoading}
            isError={isConceptsError}
          />
        </div>
      )}

      {activeTab === 'my' && (
        <UserConceptList
          userConcepts={userConcepts ?? []}
          isLoading={isUserLoading}
        />
      )}
    </div>
  );
}
