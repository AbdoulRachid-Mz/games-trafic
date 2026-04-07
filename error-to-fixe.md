
Error: Turbopack build failed with 4 errors:
./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js:2:1
Module not found: Can't resolve 'fs'
  1 | import os from 'os'
> 2 | import fs from 'fs'
    | ^^^^^^^^^^^^^^^^^^^
  3 |
  4 | import {
  5 |   mergeUserTypes,



Import traces:
  App Route:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/api/wallet/verification/route.ts

  Server Component:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/vip/page.tsx

  Middleware:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/auth.ts
    ./proxy.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/tournaments/bulk-validation.ts [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/tournaments/bulk-validation.ts [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js:1:1
Module not found: Can't resolve 'net'
> 1 | import net from 'net'
    | ^^^^^^^^^^^^^^^^^^^^^
  2 | import tls from 'tls'
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'



Import traces:
  App Route:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/api/wallet/verification/route.ts

  Server Component:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/vip/page.tsx

  Middleware:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/auth.ts
    ./proxy.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component Browser]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/tournaments/bulk-validation.ts [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/tournaments/bulk-validation.ts [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js:5:1
Module not found: Can't resolve 'perf_hooks'
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'
> 5 | import { performance } from 'perf_hooks'
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  6 |
  7 | import { stringify, handleValue, arrayParser, arraySerializer } from './types.js'
  8 | import { Errors } from './errors.js'



Import traces:
  App Route:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/api/wallet/verification/route.ts

  Server Component:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/vip/page.tsx

  Middleware:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/auth.ts
    ./proxy.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component Browser]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/tournaments/bulk-validation.ts [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/tournaments/bulk-validation.ts [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js:2:1
Module not found: Can't resolve 'tls'
  1 | import net from 'net'
> 2 | import tls from 'tls'
    | ^^^^^^^^^^^^^^^^^^^^^
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'
  5 | import { performance } from 'perf_hooks'



Import traces:
  App Route:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/api/wallet/verification/route.ts

  Server Component:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./app/vip/page.tsx

  Middleware:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/auth.ts
    ./proxy.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component Browser]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/tournaments/bulk-validation.ts [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component Browser]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/tournaments/bulk-validation.ts [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Client Component SSR]
    ./components/pages/tournaments/edition-detail/create-match-dialog.tsx [Server Component]
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
 ELIFECYCLE  Command failed with exit code 1.
