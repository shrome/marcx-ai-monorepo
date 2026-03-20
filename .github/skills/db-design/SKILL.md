---
name: db-design
description: Design and plan clean, production-grade database schemas. Use this skill when the user asks to design a database, plan a schema, model entities and relationships, design tables/collections, plan indexes, or architect data storage for an application. Produces normalized, scalable, well-documented database structures.
license: MIT
---

This skill guides the design of clean, production-grade database schemas that are normalized, performant, and maintainable. The goal is to produce schemas with clear intent — no ambiguity, no redundancy, and no hidden complexity.

The user provides application requirements, domain models, or feature descriptions. They may also provide an existing schema to review or refactor.

## Design Thinking

Before writing any DDL or schema code, deeply understand the domain:

- **Domain**: What is the business problem? What are the core entities and their lifecycles?
- **Access Patterns**: How will data be read and written? What queries will be frequent?
- **Scale**: Expected data volume, read/write ratios, growth trajectory.
- **Consistency Requirements**: Is strong consistency required or is eventual consistency acceptable?
- **Technology Choice**: SQL (PostgreSQL, MySQL) vs NoSQL (MongoDB, DynamoDB) vs hybrid — justify the choice.

**CRITICAL**: Schema design is not just about storing data — it encodes business rules. Every constraint, relation, and naming decision communicates intent to future developers.

## Schema Design Process

Follow this structured process for every design task:

### 1. Entity Discovery
- Identify all primary entities (nouns in the domain)
- Identify value objects (data that has no independent identity, e.g., addresses, money amounts)
- Identify events and audit trails if needed
- Distinguish between entities that exist independently vs. those that are subordinate

### 2. Relationship Mapping
- Map all relationships: one-to-one, one-to-many, many-to-many
- Resolve many-to-many relationships with explicit junction/bridge tables
- Apply cardinality and optionality constraints (nullable vs NOT NULL, UNIQUE)
- Identify ownership: which entity "owns" another (drives FK direction and cascade rules)

### 3. Normalization
Apply normalization deliberately:
- **1NF**: Atomic values only — no arrays in columns, no repeating groups
- **2NF**: All non-key attributes depend on the whole primary key (relevant for composite PKs)
- **3NF**: No transitive dependencies — non-key columns should depend only on the key
- **BCNF / 4NF**: Apply when dealing with complex multi-valued dependencies
- **Controlled Denormalization**: Denormalize only with explicit justification (performance, query simplification) — always document why

### 4. Column Design
- Use precise, unambiguous data types — never use `TEXT` where `VARCHAR(n)`, `INT`, `BOOLEAN`, or `ENUM` is appropriate
- Use `TIMESTAMPTZ` (timezone-aware) over bare `TIMESTAMP` for all timestamps
- Prefer `BIGINT` or `UUID` for primary keys; use `UUID` for distributed systems
- Always have `created_at` and `updated_at` audit columns on mutable tables
- Use `NUMERIC`/`DECIMAL` for money — never `FLOAT` or `DOUBLE`
- Soft-delete pattern: use `deleted_at TIMESTAMPTZ` instead of boolean `is_deleted`
- Never store derived/computed values unless justified for performance (and document it)

### 5. Constraints & Integrity
- **NOT NULL** everywhere possible — nullability is a deliberate design decision, not a default
- **UNIQUE** constraints on natural keys and external identifiers (e.g., email, slug, external IDs)
- **CHECK** constraints to enforce domain rules at the DB level (e.g., `amount > 0`, valid status enums)
- **FK constraints** with explicit `ON DELETE` and `ON UPDATE` rules — never leave these implicit
- Use partial indexes and conditional constraints for soft-delete patterns
- Prefer DB-level constraints over application-level validation for critical invariants

### 6. Indexing Strategy
Design indexes based on access patterns:
- Every FK column should have an index (PostgreSQL does not auto-index FKs)
- Composite indexes: order columns by selectivity (most selective first), then by query pattern
- Partial indexes for filtered queries (e.g., `WHERE deleted_at IS NULL`)
- Covering indexes for read-heavy, critical query paths
- Avoid over-indexing: each index slows writes — justify every index with a specific query
- Consider `GIN` indexes for JSONB columns, full-text search, or array containment queries

### 7. Naming Conventions
Follow strict, consistent naming:
- **Tables**: `snake_case`, plural nouns (e.g., `users`, `order_items`, `audit_logs`)
- **Columns**: `snake_case`, singular, descriptive (e.g., `user_id`, `created_at`, `is_active`)
- **Primary Keys**: always named `id` (or `{table_singular}_id` if using surrogate keys across joins)
- **Foreign Keys**: `{referenced_table_singular}_id` (e.g., `user_id`, `organization_id`)
- **Junction Tables**: `{table_a}_{table_b}` in alphabetical order (e.g., `role_users`, `tag_posts`)
- **Indexes**: `idx_{table}_{columns}` (e.g., `idx_orders_user_id`, `idx_users_email`)
- **Constraints**: `{table}_{column}_{type}` (e.g., `users_email_unique`, `orders_amount_check`)
- **Enums**: `{domain}_{type}_enum` (e.g., `order_status_enum`)

## Output Format

Always produce:

1. **Entity-Relationship Summary** — brief prose or table describing entities, their purpose, and key relationships
2. **Schema DDL** — complete, runnable SQL `CREATE TABLE` statements (or equivalent for NoSQL) with all constraints, defaults, and comments
3. **Index Definitions** — separate `CREATE INDEX` statements with justification comments
4. **Migration Notes** — if modifying an existing schema, include safe migration steps
5. **Design Decisions Log** — brief bullet list of non-obvious decisions and their rationale (e.g., why UUID over serial, why denormalized column X, why soft-delete)
6. **Query Examples** — 2–3 representative queries that validate the schema supports the key access patterns

## Quality Checklist

Before finalizing any schema, verify:
- [ ] Every table has a primary key
- [ ] All FK columns are indexed
- [ ] All `NOT NULL` constraints are intentional
- [ ] No raw `TEXT`/`BLOB` where a stricter type applies
- [ ] Money values use `NUMERIC`, not float
- [ ] Timestamps are timezone-aware
- [ ] `created_at` / `updated_at` present on all mutable tables
- [ ] No many-to-many without a junction table
- [ ] Cascade rules defined on all FKs
- [ ] Naming conventions followed consistently
- [ ] Design decisions documented

## Database-Specific Guidance

### PostgreSQL
- Use `UUID` with `gen_random_uuid()` (pg 13+) or `uuid_generate_v4()` for PKs in distributed contexts
- Use `JSONB` (not `JSON`) for semi-structured data; add GIN indexes
- Use table inheritance or partitioning for large time-series or multi-tenant data
- Use `GENERATED ALWAYS AS IDENTITY` over `SERIAL` for auto-increment PKs
- Leverage `EXCLUSION CONSTRAINTS` for range-based uniqueness (e.g., no overlapping bookings)

### MySQL / MariaDB
- Use `InnoDB` engine always (never MyISAM)
- Use `BIGINT UNSIGNED AUTO_INCREMENT` or `CHAR(36)` for UUIDs
- Be explicit with `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
- Avoid `ENUM` columns — prefer a lookup table or `VARCHAR` with CHECK constraint

### Multi-tenant Schemas
Choose an isolation strategy and apply it consistently:
- **Row-level** (`tenant_id` column on every table): simplest, use RLS in PostgreSQL
- **Schema-per-tenant**: strong isolation, more ops overhead
- **Database-per-tenant**: strongest isolation, highest cost
- Always include `tenant_id` in composite indexes for row-level isolation

### Soft Deletes
Use `deleted_at TIMESTAMPTZ DEFAULT NULL` pattern:
- Add partial index `WHERE deleted_at IS NULL` to all frequent queries
- Use DB views or application-level query scoping to filter soft-deleted rows by default
- Never reuse IDs of soft-deleted records

## Anti-Patterns to Avoid

- **God tables**: tables with 50+ columns are a schema smell — decompose them
- **EAV (Entity-Attribute-Value)**: avoid unless absolutely necessary — use JSONB instead
- **Storing arrays in a single column**: use a child table or JSONB with GIN index
- **Nullable FKs without intent**: every nullable FK should have a documented reason
- **Using `VARCHAR(255)` everywhere**: choose meaningful, domain-appropriate lengths
- **Missing audit columns**: every table that mutates should have `created_at`/`updated_at`
- **Application-only constraints**: critical business rules belong in the database
- **Premature optimization**: don't denormalize before measuring actual query performance
