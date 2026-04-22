dans @contextScopeItemMentionCannot find name 'match'. Did you mean 'Math'?ts(2552)
lib.es5.d.ts(769, 13): 'Math' is declared here.
any.

dans phase.ts: getBracketNodeById: Object literal may only specify known properties, but 'match' does not exist in type '{ phase?: true | { columns?: { id?: boolean | undefined; editionId?: boolean | undefined; name?: boolean | undefined; description?: boolean | undefined; phaseType?: boolean | undefined; ... 16 more ...; updatedAt?: boolean | undefined; } | undefined; with?: { ...; } | undefined; extras?: Record<...> | ... 1 more ......'. Did you mean to write 'matches'?ts(2561)
(property) match: boolean | undefined

dans  calculateGroupStandings: Type 'Map<string, ParticipantStats>' is not assignable to type 'Map<string, ParticipantStats & { participantId: string; }>'.
  Type 'ParticipantStats' is not assignable to type 'ParticipantStats & { participantId: string; }'.
    Property 'participantId' is missing in type 'ParticipantStats' but required in type '{ participantId: string; }'.ts(2322)
phases.ts(2768, 45): 'participantId' is declared here.

Object literal may only specify known properties, and 'participantId' does not exist in type 'ParticipantStats'.ts(2353)
(property) participantId: string

apres on fait : "npx tsc --noEmit" pour voir les erreurs