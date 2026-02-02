// hooks/use-competition-editions.ts
import { useEntityList } from './use-entity-list';
import { CompetitionEdition, EditionFilters } from '@/types';

export function useCompetitionEditions(competitionId: number, defaultFilters: Partial<EditionFilters> = {}) {
  return useEntityList<CompetitionEdition>({
    entityType: 'editions',
    defaultFilters: {
      competition_id: competitionId,
      with_competition: false,
      with_fighters: true,
      with_regions: true,
      with_phases: true,
      ...defaultFilters,
    },
    withRelations: true,
  });
}