# MilkBankOS — Site Vision & Constitution

> **AGENT INSTRUCTION:** Read this file before every iteration.

## 1. Core Identity

* **Project Name:** MilkBankOS (Human Milk Bank Management System)
* **Stitch Project ID:** `3112350855526039281`
* **Mission:** Staff-facing UI for donor management, milk inventory, lab results, beneficiary dispensing, and collection logistics.
* **Target Audience:** Clinicians, lab technicians, milk bank administrators
* **Voice:** Clinical, precise, trustworthy

## 2. Visual Language

* **Primary:** Clinical precision, data-dense
* **Secondary:** Corporate modern minimal
* **Tertiary:** Maternal warmth via soft violet palette

## 3. Architecture & File Structure

* **Next.js routes:** `app/(app)/{slug}/page.tsx`
* **Components:** `components/milkbank/`
* **Mock data:** `lib/data/mockData.ts`
* **Stitch assets:** `.stitch/designs/{slug}.html` + `.png`
* **Navigation:** Shared `AppShell` top nav (login excluded)

## 4. Live Sitemap (Current State)

* [x] `login` — Screen 1: Login - Human Milk Bank
* [x] `donor-registration` — Screen 2: Donor Registration
* [x] `milk-donation-log` — Screen 3: Milk Donation Log
* [x] `inventory-lab-results` — Screen 4: Inventory & Laboratory Results
* [x] `data-export` — Screen 5: Data Export Tool
* [x] `beneficiary-dispensing` — Screen 6: Beneficiary Dispensing Record
* [x] `beneficiary-registration` — Screen 7: Beneficiary Registration
* [x] `donor-community-map` — Screen 8: Donor Community Map
* [x] `donor-directory` — Screen 9: Donor Directory - Mom's Act
* [x] `collection-point-logistics` — Screen 10: Collection Point Logistics
* [x] `onsite-collection-terminal` — Screen 11: Onsite Collection Terminal

## 5. The Roadmap (Backlog)

### Backend phase (future)
- [ ] Supabase schema and auth
- [ ] API routes and server actions
- [ ] Real data persistence

## 6. Creative Freedom Guidelines

Loop complete — all 11 Stitch screens integrated.

## 7. Rules of Engagement

1. Do not recreate pages in Section 4 without user request
2. UI-only with mock data until backend phase
3. Preserve Stitch design tokens in globals.css
