The **frontend UI** of your application is located inside the Next.js repository folder:
`c:/Users/Sheikhkaifsadiq/Desktop/url_saas/compliance-link-router`

Within that folder, the actual visual frontend code is separated into two main directories:

### 1. The Pages (`src/app/`)
This folder controls the routes (URLs) and the main layouts of the website.
* `src/app/page.tsx` - This is the landing/marketing page.
* `src/app/layout.tsx` - The root layout (controls fonts and global metadata).
* `src/app/globals.css` - The massive CSS file containing all your colors, animations, and Tailwind variables.
* `src/app/(dashboard)/` - This folder holds all the inner dashboard pages (like `/dashboard`, `/links`, `/analytics`, `/settings`, etc.).

### 2. The Components (`src/components/`)
This folder contains the reusable UI pieces that the pages use to build the interface.
* `src/components/layout/` - Contains the `Navbar.tsx` and `Sidebar.tsx`.
* `src/components/ui/` - Contains all your basic buttons, badges, modals, and input fields.
* `src/components/dashboard/` - Contains complex UI pieces like the `TrafficChart.tsx`, `MLScoreGauge.tsx`, and `StatsGrid.tsx`.
* `src/components/settings/` - Contains the layout pieces specifically for the settings page (like Profile, API Keys, etc.).

*(Note: The `src/app/api/` folder contains backend Edge functions, not frontend visual files, and `oracle-ml-engine/` is completely backend Python code.)*
