C:\Users\user\Desktop\abdoul\react projets\gt-v3>npx tsc --noEmit
actions/phases.ts:2921:23 - error TS2769: No overload matches this call.
  Overload 2 of 2, '(values: { editionId: string | SQL<unknown> | Placeholder<string, any>; phaseId: string | SQL<unknown> | Placeholder<string, any>; duration?: number | SQL<unknown> | Placeholder<...> | null | undefined; ... 36 more ...; resolution?: string | ... 3 more ... | undefined; }[]): PgInsertBase<...>', gave the following error.
    Object literal may only specify known properties, and 'editionId' does not exist in type '{ editionId: string | SQL<unknown> | Placeholder<string, any>; phaseId: string | SQL<unknown> | Placeholder<string, any>; duration?: number | SQL<unknown> | Placeholder<...> | null | undefined; ... 36 more ...; resolution?: string | ... 3 more ... | undefined; }[]'.

2921                       editionId: group.phase?.editionId,
                           ~~~~~~~~~


actions/phases.ts:2935:62 - error TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'.
  Type 'null' is not assignable to type 'number'.

2935                       scheduledTime: getDefaultScheduledTime(node.round, node.matchNumber),
                                                                  ~~~~~~~~~~

components/pages/tournaments/edition-detail/mark-complete-dialog.tsx:179:13 - error TS2322: Type '"RANDOM" | "ORDERED"' is not assignable to type '"RANDOM" | "SEQUENTIAL" | "SNAKE" | undefined'.
  Type '"ORDERED"' is not assignable to type '"RANDOM" | "SEQUENTIAL" | "SNAKE" | undefined'.

179             seedingMethod: seedMethod,
                ~~~~~~~~~~~~~

components/pages/tournaments/edition-detail/phase-organize-client.tsx:869:51 - error TS2304: Cannot find name 'handleAutoOrganize'.

869                       <AlertDialogAction onClick={handleAutoOrganize}>
                                                      ~~~~~~~~~~~~~~~~~~


Found 4 errors in 3 files.

Errors  Files
     2  actions/phases.ts:2921
     1  components/pages/tournaments/edition-detail/mark-complete-dialog.tsx:179
     1  components/pages/tournaments/edition-detail/phase-organize-client.tsx:869

C:\Users\user\Desktop\abdoul\react projets\gt-v3>