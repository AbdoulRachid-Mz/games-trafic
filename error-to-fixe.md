C:\Users\user\Desktop\abdoul\react projets\gt-v3>npx tsc --noEmit
actions/messages.ts:442:23 - error TS2339: Property 'read' does not exist on type 'PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 20 more ...; createdAt: PgColumn<....'.

442           eq(messages.read, false),
                          ~~~~

actions/messages.ts:464:23 - error TS2339: Property 'read' does not exist on type 'PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 20 more ...; createdAt: PgColumn<....'.

464           eq(messages.read, false),
                          ~~~~

actions/messages.ts:495:49 - error TS2339: Property 'read' does not exist on type 'PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 20 more ...; createdAt: PgColumn<....'.

495         .where(and(whereConditions, eq(messages.read, true))),
                                                    ~~~~

actions/messages.ts:499:49 - error TS2339: Property 'read' does not exist on type 'PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 20 more ...; createdAt: PgColumn<....'.

499         .where(and(whereConditions, eq(messages.read, false))),
                                                    ~~~~

actions/messages.ts:935:33 - error TS2339: Property 'read' does not exist on type 'PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 20 more ...; createdAt: PgColumn<....'.

935     conditions.push(eq(messages.read, filters.isRead));
                                    ~~~~

actions/user-stats.ts:1116:94 - error TS2339: Property 'read' does not exist on type 'PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: true; hasDefault: true; ... 6 more ...; generated: undefined; }, {}, {}>; ... 20 more ...; createdAt: PgColumn<....'.

1116       unread: sql<number>`COUNT(CASE WHEN ${messages.recipientId} = ${userId} AND ${messages.read} = false THEN 1 END)`,
                                                                                                  ~~~~

app/chats/[chatId]/page.tsx:282:11 - error TS2322: Type '{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | "SHOP" | ... 18 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }[]' is not assignable to type 'ChatMessage[]'.
  Type '{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | "SHOP" | ... 18 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }' is not assignable to type 'ChatMessage'.
    Types of property 'readBy' are incompatible.
      Type 'string[] | null' is not assignable to type 'string[] | undefined'.
        Type 'null' is not assignable to type 'string[] | undefined'.

282           messages={messages}
              ~~~~~~~~

  components/pages/chats/message-list.tsx:20:3
    20   messages: ChatMessage[];
         ~~~~~~~~
    The expected type comes from property 'messages' which is declared here on type 'IntrinsicAttributes & MessageListProps'

app/chats/layout.tsx:38:32 - error TS2322: Type '{ children: (false | Element)[]; direction: string; className: string; }' is not assignable to type 'IntrinsicAttributes & HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string | undefined; ... 10 more ...; style?: CSSProperties | undefined; }'.
  Property 'direction' does not exist on type 'IntrinsicAttributes & HTMLAttributes<HTMLDivElement> & { children?: ReactNode; className?: string | undefined; ... 10 more ...; style?: CSSProperties | undefined; }'.

38           <ResizablePanelGroup direction="horizontal" className="h-full">
                                  ~~~~~~~~~

components/comments/comment-list.tsx:42:5 - error TS2322: Type '(id: string, userId: string) => Promise<{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; ... 15 more ...; isOpenToPublic: boolean | null; }>' is not assignable to type 'MutationFunction<{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | ... 19 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }, string>'.
  Types of parameters 'userId' and 'context' are incompatible.
    Type 'MutationFunctionContext' is not assignable to type 'string'.

42     mutationFn: markMessageAsRead,
       ~~~~~~~~~~

  node_modules/.pnpm/@tanstack+query-core@5.90.20/node_modules/@tanstack/query-core/build/modern/hydration-BlEVG2Lp.d.ts:1201:5
    1201     mutationFn?: MutationFunction<TData, TVariables>;
             ~~~~~~~~~~
    The expected type comes from property 'mutationFn' which is declared here on type 'UseMutationOptions<{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | ... 19 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }, Error, string, unknown>'

components/pages/chats/message-input.tsx:142:9 - error TS2451: Cannot redeclare block-scoped variable 'handleVoiceRecord'.

142   const handleVoiceRecord = () => {
            ~~~~~~~~~~~~~~~~~

components/pages/chats/message-input.tsx:147:9 - error TS2451: Cannot redeclare block-scoped variable 'handleVoiceRecord'.

147   const handleVoiceRecord = () => {
            ~~~~~~~~~~~~~~~~~

hooks/use-messages.ts:507:5 - error TS2322: Type '(id: string, userId: string) => Promise<{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; ... 15 more ...; isOpenToPublic: boolean | null; }>' is not assignable to type 'MutationFunction<{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | ... 19 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }, string>'.
  Types of parameters 'userId' and 'context' are incompatible.
    Type 'MutationFunctionContext' is not assignable to type 'string'.

507     mutationFn: markMessageAsRead,
        ~~~~~~~~~~

  node_modules/.pnpm/@tanstack+query-core@5.90.20/node_modules/@tanstack/query-core/build/modern/hydration-BlEVG2Lp.d.ts:1201:5
    1201     mutationFn?: MutationFunction<TData, TVariables>;
             ~~~~~~~~~~
    The expected type comes from property 'mutationFn' which is declared here on type 'UseMutationOptions<{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | ... 19 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }, Error, string, unknown>'

hooks/use-messages.ts:537:20 - error TS2339: Property 'previousMessage' does not exist on type '{}'.

537       if (context?.previousMessage) {
                       ~~~~~~~~~~~~~~~

hooks/use-messages.ts:538:74 - error TS2339: Property 'previousMessage' does not exist on type '{}'.

538         queryClient.setQueryData(messageKeys.detail(_variables), context.previousMessage);
                                                                             ~~~~~~~~~~~~~~~

hooks/use-messages.ts:540:20 - error TS2339: Property 'previousUnreadCount' does not exist on type '{}'.

540       if (context?.previousUnreadCount !== undefined) {
                       ~~~~~~~~~~~~~~~~~~~

hooks/use-messages.ts:543:19 - error TS2339: Property 'previousUnreadCount' does not exist on type '{}'.

543           context.previousUnreadCount
                      ~~~~~~~~~~~~~~~~~~~

hooks/use-messages.ts:851:39 - error TS2339: Property 'read' does not exist on type 'MessageWithRelations'.

851       unread: messages.filter(m => !m.read && m.recipientId),
                                          ~~~~

types/chat.ts:31:18 - error TS2430: Interface 'ChatMessage' incorrectly extends interface '{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | "SHOP" | ... 18 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }'.
  Types of property 'audioUrl' are incompatible.
    Type 'string | undefined' is not assignable to type 'string | null'.
      Type 'undefined' is not assignable to type 'string | null'.

31 export interface ChatMessage extends Message {
                    ~~~~~~~~~~~

utils/chat-helpers.ts:68:49 - error TS2339: Property 'read' does not exist on type '{ id: string; isActive: boolean | null; isDeleted: boolean | null; createdAt: Date | null; userId: string | null; entityId: string | null; entityType: "PRODUCT" | "POST" | "SHOP" | ... 18 more ... | null; ... 14 more ...; isOpenToPublic: boolean | null; }'.

68     (msg) => msg.recipientId === userId && !msg.read && !msg.isDeleted
                                                   ~~~~


Found 19 errors in 9 files.

Errors  Files
     5  actions/messages.ts:442
     1  actions/user-stats.ts:1116
     1  app/chats/[chatId]/page.tsx:282
     1  app/chats/layout.tsx:38
     1  components/comments/comment-list.tsx:42
     2  components/pages/chats/message-input.tsx:142
     6  hooks/use-messages.ts:507
     1  types/chat.ts:31
     1  utils/chat-helpers.ts:68