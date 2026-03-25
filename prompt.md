✓ Collecting page data using 7 workers in 12.3s
Erreur lors de la récupération de la session: Error: During prerendering, `headers()` rejects when the prerender is complete. Typically these errors are handled by React but if you move `headers()` to a different context by using `setTimeout`, `after`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "/api/search/suggestions".
    at new Promise (<anonymous>)
    at i (lib\auth\session.ts:11:22)
    at o (lib\auth\session.ts:31:25)
    at w (app\api\search\suggestions\route.ts:9:24)
   9 |   try {
  10 |     const session = await auth.api.getSession({
> 11 |       headers: await headers()
     |                      ^
  12 |     });
  13 |     return session;
  14 |   } catch (error) { {
  route: '/api/search/suggestions',
  expression: '`headers()`',
  digest: 'HANGING_PROMISE_REJECTION'
}
Suggestions API error: Error: Route /api/search/suggestions needs to bail out of prerendering at this point because it used nextUrl.searchParams.
    at w (app\api\search\suggestions\route.ts:10:42)
   8 |   try {
   9 |     const user = await getCurrentUser();
> 10 |     const searchParams = request.nextUrl.searchParams;
     |                                          ^
  11 |     const term = searchParams.get('term') || '';
  12 |
  13 |     if (!term || term.length < 2) { {
  digest: 'NEXT_PRERENDER_INTERRUPTED'
}
Error fetching partners: Error: Failed query: select count(*)::int from "partners" where ("partners"."is_deleted" = $1 and "partners"."status" = $2 and "partners"."verified" = $3 and "partners"."is_active" = $4 and "partners"."is_visible" = $5)
params: false,ACTIVE,true,true,true
    at async r (actions\partners.ts:200:25)
    at async n (app\partners\page.tsx:21:18)
  198 |
  199 |     // Get total count
> 200 |     const [{ count }] = await db
      |                         ^
  201 |       .select({ count: sql<number>`count(*)::int` })
  202 |       .from(partners)
  203 |       .where(whereClause); {
  query: 'select count(*)::int from "partners" where ("partners"."is_deleted" = $1 and "partners"."status" = $2 and "partners"."verified" = $3 and "partners"."is_active" = $4 and "partners"."is_visible" = $5)',
  params: [Array],
  [cause]: Error: getaddrinfo ENOTFOUND ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech
      at ignore-listed frames {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech'
  }
}
Erreur lors de la récupération de la session: Error: During prerendering, `headers()` rejects when the prerender is complete. Typically these errors are handled by React but if you move `headers()` to a different context by using `setTimeout`, `after`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "/api/search".
    at new Promise (<anonymous>)
    at i (lib\auth\session.ts:11:22)
    at o (lib\auth\session.ts:31:25)
    at w (app\api\search\route.ts:9:24)
   9 |   try {
  10 |     const session = await auth.api.getSession({
> 11 |       headers: await headers()
     |                      ^
  12 |     });
  13 |     return session;
  14 |   } catch (error) { {
  route: '/api/search',
  expression: '`headers()`',
  digest: 'HANGING_PROMISE_REJECTION'
}
Search API error: Error: Route /api/search needs to bail out of prerendering at this point because it used nextUrl.searchParams.
    at w (app\api\search\route.ts:12:42)
  10 |
  11 |     // Paramètres
> 12 |     const searchParams = request.nextUrl.searchParams;
     |                                          ^
  13 |     const term = searchParams.get('term') || '';
  14 |     const entity = searchParams.get('entity') || '';
  15 |      {
  digest: 'NEXT_PRERENDER_INTERRUPTED'
}
Error fetching partners: Error: Failed query: select count(*)::int from "partners" where ("partners"."is_deleted" = $1 and "partners"."status" = $2 and "partners"."verified" = $3 and "partners"."is_active" = $4 and "partners"."is_visible" = $5)
params: false,ACTIVE,true,true,true
    at async r (actions\partners.ts:200:25)
    at async n (app\partners\page.tsx:21:18)
  198 |
  199 |     // Get total count
> 200 |     const [{ count }] = await db
      |                         ^
  201 |       .select({ count: sql<number>`count(*)::int` })
  202 |       .from(partners)
  203 |       .where(whereClause); {
  query: 'select count(*)::int from "partners" where ("partners"."is_deleted" = $1 and "partners"."status" = $2 and "partners"."verified" = $3 and "partners"."is_active" = $4 and "partners"."is_visible" = $5)',
  params: [Array],
  [cause]: Error: getaddrinfo ENOTFOUND ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech
      at ignore-listed frames {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech'
  }
}
Erreur lors de la récupération de la session: Error: During prerendering, `headers()` rejects when the prerender is complete. Typically these errors are handled by React but if you move `headers()` to a different context by using `setTimeout`, `after`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "/api/wallet/stats".
    at new Promise (<anonymous>)
    at i (lib\auth\session.ts:11:22)
    at o (lib\auth\session.ts:31:25)
    at b (app\api\wallet\stats\route.ts:10:27)
   9 |   try {
  10 |     const session = await auth.api.getSession({
> 11 |       headers: await headers()
     |                      ^
  12 |     });
  13 |     return session;
  14 |   } catch (error) { {
  route: '/api/wallet/stats',
  expression: '`headers()`',
  digest: 'HANGING_PROMISE_REJECTION'
}
Error getting blogs: Error: Failed query: select "id", "title", "content", "images", "is_active", "created_at", "author_id" from "blogs" "blogs" where ("blogs"."is_deleted" = $1 and "blogs"."is_active" = $2) order by "blogs"."created_at" desc limit $3
params: false,true,12
    at async p (actions\blogs.ts:68:38)
  66 |     const whereConditions = buildBlogWhereConditions(filters, options);
  67 |
> 68 |     const [blogsData, totalResult] = await Promise.all([
     |                                      ^
  69 |       db.query.blogs.findMany({
  70 |         columns: BLOG_CARD_COLUMNS,
  71 |         where: whereConditions, {
  query: 'select "id", "title", "content", "images", "is_active", "created_at", "author_id" from "blogs" "blogs" where ("blogs"."is_deleted" = $1 and "blogs"."is_active" = $2) order by "blogs"."created_at" desc limit $3',
  params: [Array],
  [cause]: Error: getaddrinfo ENOTFOUND ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech
      at ignore-listed frames {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech'
  }
}
⨯ Error: Failed to fetch blogs
    at p (actions\blogs.ts:104:11)
  102 |   } catch (error) {
  103 |     console.error('Error getting blogs:', error);
> 104 |     throw new Error('Failed to fetch blogs');
      |           ^
  105 |   }
  106 | }
  107 | {
  digest: '2521792'
}
Error getting services: Error: Failed query: select "id", "title", "description", "icon", "images", "is_active", "created_at", "admin_id" from "services" "services" where ("services"."is_deleted" = $1 and "services"."is_active" = $2) order by "services"."created_at" desc limit $3
params: false,true,100
    at async o (actions\services.ts:73:41)
  71 |     const whereConditions = buildServiceWhereConditions(filters, options);
  72 |
> 73 |     const [servicesData, totalResult] = await Promise.all([
     |                                         ^
  74 |       db.query.services.findMany({
  75 |         columns: SERVICE_CARD_COLUMNS,
  76 |         where: whereConditions, {
  query: 'select "id", "title", "description", "icon", "images", "is_active", "created_at", "admin_id" from "services" "services" where ("services"."is_deleted" = $1 and "services"."is_active" = $2) order by "services"."created_at" desc limit $3',
  params: [Array],
  [cause]: Error: getaddrinfo ENOTFOUND ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech
      at ignore-listed frames {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech'
  }
}
⨯ Error: Failed to fetch services
    at o (actions\services.ts:109:11)
  107 |   } catch (error) {
  108 |     console.error('Error getting services:', error);
> 109 |     throw new Error('Failed to fetch services');
      |           ^
  110 |   }
  111 | }
  112 | {
  digest: '1920442209'
}
Error occurred prerendering page "/blogs". Read more: https://nextjs.org/docs/messages/prerender-error
Error: Failed to fetch blogs
    at p (actions\blogs.ts:104:11)
  102 |   } catch (error) {
  103 |     console.error('Error getting blogs:', error);
> 104 |     throw new Error('Failed to fetch blogs');
      |           ^
  105 |   }
  106 | }
  107 | {
  digest: '2521792'
}
Export encountered an error on /blogs/page: /blogs, exiting the build.
⨯ Next.js build worker exited with code: 1 and signal: null
 ELIFECYCLE  Command failed with exit code 1.