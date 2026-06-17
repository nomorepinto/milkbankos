# Design System: Human Milk Bank Management System
**Project ID:** 3112350855526039281

## 1. Visual Theme & Atmosphere

Clinical precision management UI for human milk banking. Corporate modern minimalism with data-dense layouts, flat tonal layering, and violet primary accents. Professional reliability for clinicians, lab technicians, and administrative staff.

## 2. Color Palette & Roles

- **Page Background** (#EEF2FF / #f8f9ff) – Main canvas
- **Primary Violet** (#AB8AFF / #6a48b9) – Actions, active nav, processing states
- **Primary Dark** (#23005c / #3B0764) – Top navigation bar, login branding panel
- **Secondary Blue** (#60A5FA / #0060ac) – Verified / completion states
- **Tertiary Pink** (#F472B6 / #a43073) – Fail / critical alerts
- **On Surface** (#0b1c30) – Headings and primary text
- **On Surface Variant** (#494552) – Body and secondary text
- **Outline Variant** (#cbc3d4) – Borders and dividers
- **Surface Container Lowest** (#ffffff) – Cards and inputs

## 3. Typography Rules

**Font:** Plus Jakarta Sans throughout.

- **Headline LG:** 30px / 700 – Page titles
- **Headline MD:** 24px / 600 – Section headers
- **Headline SM:** 20px / 600 – Card titles
- **Body MD:** 14px / 400 – Default body
- **Label MD:** 12px / 600 uppercase – Field labels, table headers
- **Data Tabular:** 13px / 500 – Inventory and lab tables

## 4. Component Stylings

* **Buttons:** 8px radius; primary uses primary-container fill; secondary outlined primary
* **Cards:** 12px radius, white surface, 1px outline-variant border
* **Status Chips:** 8px pill capsules with semantic tint backgrounds
* **Inputs:** White bg, outline-variant border, 2px primary focus ring
* **Data Tables:** Zebra rows on surface-container-low, label-md headers

## 5. Layout Principles

12-column desktop grid, 16px gutters, responsive collapse to stacked mobile layouts. Fixed top nav (64px) on authenticated screens. Login is centered split-panel without app chrome.

## 6. Design System Notes for Stitch Generation

**DESIGN SYSTEM (REQUIRED):**
- Platform: Responsive web, desktop-first admin with tablet support
- Theme: Light, clinical, corporate modern, flat structured
- Background: Light indigo (#EEF2FF / #f8f9ff)
- Primary Accent: Violet (#AB8AFF) for CTAs and active states
- Nav Bar: Deep violet (#23005c) with white text
- Text Primary: Near-navy (#0b1c30)
- Text Secondary: Slate variant (#494552)
- Verified/Success: Blue (#60A5FA)
- Pending: Violet (#AB8AFF)
- Fail/Error: Pink (#F472B6) / red error tokens
- Font: Plus Jakarta Sans
- Icons: Material Symbols Outlined
- Buttons: 8px radius, no gradients
- Cards: 12px radius, tonal borders not heavy shadows
- Layout: Fixed top nav + scrollable main content, max-width 1440px
