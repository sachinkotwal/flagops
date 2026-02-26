# **App Name**: FlagOps

## Core Features:

- Optimizely & Firestore Data Sync: Integrate with Optimizely's REST API to fetch feature flag data and establish Firebase Firestore as the source of truth for custom governance metadata (owner, team, notes), continuously synchronizing to provide a unified dataset.
- Intelligent Flag Analyzer: Utilize an automated rule engine, coupled with an AI-powered tool for intelligent suggestions, to identify governance violations (e.g., naming inconsistencies, missing owners, staleness) and proactively recommend actionable corrections.
- Executive Dashboard Overview: Display a high-level dashboard visualizing overall flag health with key statistics, a health score gauge, and data-driven charts showing flag distribution by team and violation types.
- Interactive Flag Management Table: Present a comprehensive, searchable, and filterable table of all flags, offering detailed insights into each flag's Optimizely configuration and governance status, with inline editing capabilities for owner and team.
- Grouped Violations Report: Provide a dedicated tab that categorizes and highlights flags based on specific governance violations (e.g., naming, missing owner, stale), making it easy for users to identify and prioritize issues.
- Future Feature Creation Placeholder: Include a read-only, disabled preview of the future flag creation interface, designed to demonstrate the envisioned flow for enforcing naming conventions and governance at the point of creation.

## Style Guidelines:

- Primary color: '#60a0ff'. A vibrant, tech-infused blue (HSL: 216°, 100%, 69%) to highlight interactive elements and convey clarity, ensuring high visibility against the dark backdrop.
- Background color: '#0c0e14'. A profound, almost black canvas (HSL: 226°, 31%, 6%) with a subtle cool undertone, providing a spacious and immersive environment suitable for information density.
- Accent color: '#b080ff'. A compelling secondary accent (HSL: 260°, 100%, 75%) introducing dynamic contrast and supporting visual hierarchy, particularly for charts and key indicators.
- Semantic colors: '#50dc78' (Success Green), '#f0c040' (Warning Yellow), '#ff6b6b' (Error Red). A focused palette for immediate status communication, utilizing vivid green for success, warm yellow for warnings, and strong red for errors.
- Text colors: '#ffffff' (Primary), 'rgba(255,255,255,0.45)' (Secondary), 'rgba(255,255,255,0.35)' (Muted). A thoughtful gradation of white to manage information density and focus, providing optimal legibility on a dark background.
- Headline and body text: 'DM Sans' (sans-serif) for its modern readability. Stat values and flag keys: 'JetBrains Mono' (monospace) to evoke a precise, programmatic feel for technical details. Note: currently only Google Fonts are supported.
- Utilize minimalist, vector-based icons that align with a functional, developer-focused aesthetic. Prioritize clarity and intuitive representation of governance concepts and data points within the dark theme.
- An information-dense, dark-themed layout featuring cards with subtle rounded borders, segmented sections, and clear grid-based data displays. Emphasize consistent padding, robust spacing, and blurred, sticky header navigation for a refined, professional feel.
- Implement subtle, functional animations across the interface. These include staggered fade-in and slide-up effects for cards and chart elements, smooth stroke transitions for gauges, and snappy 'cubic-bezier(0.23, 1, 0.32, 1)' easing for all movements, ensuring a responsive and polished user experience.