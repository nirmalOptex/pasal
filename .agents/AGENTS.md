# ChiyaPasal POS — AI Agent System Instructions

This directory contains workspace guidelines for AI coding agents working on ChiyaPasal.
Refer to [../AGENTS.md](../AGENTS.md) and [../README.md](../README.md) for the complete architecture, database entity relationships, API catalogs, and operational rules.

## Core Directives for Agents:
1. **Multi-Tenancy**: All database queries must include `business_id` (and `branch_id` when branch-scoped).
2. **TypeORM Migrations**: `synchronize: false` is enforced. Never change it to `true`. Always generate/run migrations.
3. **Module Aliases**: Any new server entry script must import `./aliases` before any `@`-aliased imports.
4. **Build Verification**: Always run `npm run build` to verify clean compilation across both `@chhiyapasal/api` and `@chhiyapasal/web` before declaring a task complete.
5. **Nepalese Hospitality Rules**: Support dual cash & Fonepay QR payments, Khata credit ledgers, and 4-digit POS PIN staff logins.
