You are a senior full-stack architect specialized in scalable TypeScript, Drizzle ORM, and Next.js applications.

Your task is to perform a **full audit and refactor** of a backend architecture involving:

* Database schema types (centralized)
* Relational query logic
* Data fetching patterns
* UI consumption (pages/components)

The current system suffers from:

* Over-fetching (too many relations fetched unnecessarily)
* Generic "WithRelations" types used everywhere
* Poor separation between listing, detail, and stats queries
* Inefficient queries impacting performance and scalability

---

# 🧩 STEP 1 — ANALYZE EXISTING STRUCTURE

1. Carefully analyze:

   * All schema types (especially `*WithRelations`)
   * All query functions (e.g. getProducts, getShopById, etc.)
   * All pages and UI usage of data

2. Identify:

   * Over-fetching patterns
   * Unnecessary relations
   * Heavy joins
   * Redundant data loading
   * Missing projections (select only needed fields)

---

# 🧠 STEP 2 — INTRODUCE VIEW MODELS (CRITICAL)

Refactor the architecture by introducing **UI-driven data models (View Models)** instead of generic relational types.

For each entity (Product, Shop, Tournament, User, etc.), define:

### 1. Minimal Types

Example:

* UserMini (id, username, profileImage)

### 2. Listing Types (Card)

Example:

* ProductCard
* ShopCard
* TournamentCard

### 3. Detail Types

Example:

* ProductDetail
* ShopDetail
* TournamentDetail

### 4. Stats Types

Example:

* ProductStats
* ShopStats
* TournamentStats

### 5. Context Types (IMPORTANT)

Combine multiple data sources:
Example:

* ProductContext = { product, stats, related }
* ShopContext = { shop, stats, topProducts }

---

# ⚙️ STEP 3 — REFACTOR DATABASE TYPES

Modify schema-level TypeScript types to:

* Remove or drastically limit `*WithRelations`
* Replace them with:

  * Base entity types
  * Composable view models
* Ensure each type reflects a **specific use-case**

---

# 🚀 STEP 4 — OPTIMIZE QUERIES

For each query:

### 1. Replace "fetch everything" with:

* Explicit `columns` selection
* Targeted `with` relations using minimal fields

### 2. Separate queries by use-case:

* getProducts → returns ProductCard[]
* getProductById → returns ProductDetail
* getProductStats → returns ProductStats

### 3. Avoid:

* Fetching full user objects
* Fetching full arrays (orders, members, etc.) unless necessary

### 4. Introduce "populate strategies":

Instead of:

```ts
populate: ['user', 'shop']
```

Use:

```ts
user: 'mini' | 'full'
shop: 'summary' | 'full'
```

---

# 📊 STEP 5 — ADD CONTEXT QUERIES

Create optimized composite queries:

Examples:

* getProductContext(id)
* getShopContext(id)
* getTournamentContext(id)

Each should:

* Fetch only required data
* Aggregate stats efficiently
* Avoid redundant queries

---

# ⚡ STEP 6 — PAGINATION & LIMITS

Standardize pagination:

* Feed: 10–20 items
* Dashboard/Admin: 20–50
* Avoid default 50 everywhere

Ensure:

* Efficient count queries
* No unnecessary joins in count

---

# 🧠 STEP 7 — DENORMALIZATION (OPTIONAL BUT RECOMMENDED)

Where relevant, add computed fields in schema:

* productCount in shops
* followerCount in shops
* participantsCount in tournaments

Avoid recomputing frequently used aggregates via joins.

---

# 🔁 STEP 8 — REVALIDATE UI PAGES

After refactoring:

1. Revisit all pages/components
2. Ensure each page:

   * Uses the correct view model
   * Does NOT depend on full relational objects
3. Remove any unnecessary props or data usage

---

# 🧪 STEP 9 — FINAL OUTPUT FORMAT

Provide:

1. ✅ Refactored types (clean, modular)
2. ✅ Refactored queries (optimized)
3. ✅ Example before/after comparisons
4. ✅ Performance improvements explanation
5. ✅ Clear separation of concerns

---

# 🚨 IMPORTANT RULES

* NEVER fetch full relations unless strictly required
* ALWAYS match data shape to UI needs
* FAVOR composition over large relational types
* OPTIMIZE for performance and scalability
* KEEP code clean, readable, and maintainable

---

Your goal is to transform this backend into a **production-grade, scalable, and efficient data layer** similar to modern high-performance applications (e.g., marketplaces, social platforms).
