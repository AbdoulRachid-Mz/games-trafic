Ecmascript file had an error
  4 | import { SignalStatus, SignalType } from "@/types/api";
  5 | import { eq, and, desc, asc, sql } from "drizzle-orm";
> 6 | import { revalidatePath } from "next/cache";
    |          ^^^^^^^^^^^^^^
  7 |
  8 | // Types
  9 |

You're importing a component that needs "revalidatePath". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components



Import traces:
  Client Component Browser:
    ./actions/signals.ts [Client Component Browser]
    ./hooks/use-signals.ts [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Server Component]

  Client Component SSR:
    ./actions/signals.ts [Client Component SSR]
    ./hooks/use-signals.ts [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Server Component]


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
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/participants/organize/page.tsx

  Middleware:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/auth.ts
    ./proxy.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./actions/signals.ts [Client Component Browser]
    ./hooks/use-signals.ts [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./actions/signals.ts [Client Component SSR]
    ./hooks/use-signals.ts [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Server Component]

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
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/participants/organize/page.tsx

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
    ./actions/signals.ts [Client Component Browser]
    ./hooks/use-signals.ts [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./actions/signals.ts [Client Component SSR]
    ./hooks/use-signals.ts [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Server Component]

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
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/participants/organize/page.tsx

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
    ./actions/signals.ts [Client Component Browser]
    ./hooks/use-signals.ts [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./actions/signals.ts [Client Component SSR]
    ./hooks/use-signals.ts [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Server Component]

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
    ./app/tournaments/[tournamentId]/editions/[editionId]/dashboard/participants/organize/page.tsx

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
    ./actions/signals.ts [Client Component Browser]
    ./hooks/use-signals.ts [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Client Component Browser]
    ./app/(protected)/signals/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./actions/signals.ts [Client Component SSR]
    ./hooks/use-signals.ts [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Client Component SSR]
    ./app/(protected)/signals/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


    at <unknown> (./actions/signals.ts:6:10)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
 ELIFECYCLE  Command failed with exit code 1.