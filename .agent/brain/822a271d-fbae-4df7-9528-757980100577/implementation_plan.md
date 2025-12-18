# AliManager Functional Design Plan

AliManager is a streamlined project and task management platform designed specifically for Alisara to coordinate with her team. The focus is on clarity, ease of assignment, and multiple intuitive data views.

## User Review Required

> [!IMPORTANT]
> I am assuming a **Vite + React (JavaScript)** frontend and **Firebase** for backend/hosting based on the presence of `firebase-tools`.
> I also propose using **Tailwind CSS** and **Framer Motion** for a premium look and feel.
> Please confirm if this stack is acceptable or if you have other preferences.

## Proposed Changes

### Project Setup
#### [NEW] [README.md](file:///d:/MyApps/ForAlisara/AliManager/README.md)
*   Add project description and setup instructions.

#### [NEW] [Vite Initializer]
*   Run `npm create vite@latest ./ -- --template react` to generate the boilerplate.
*   Configure `vite.config.js` for clean paths and proxying if needed.

### Design System
#### [NEW] [Tailwind CSS Setup]
*   Install and configure Tailwind CSS.
*   Define a professional, soothing color palette:
    *   **Primary**: Deep Slate and Midnight Blue for depth.
    *   **Accents**: Soft Teal or Sage Green for a calming effect.
    *   **Backgrounds**: Subtle grays and off-whites for a clean, minimalist corporate feel.
    *   **Typography**: Clean sans-serif (e.g., Inter or Montserrat) for professionalism.

### Components
#### [MODIFY] [Shell.jsx](file:///d:/MyApps/ForAlisara/AliManager/src/components/Shell.jsx)
*   Add responsive logic to switch between sidebar (Desktop) and tab bar (Mobile).
*   Implement a "Mobile Drawer" for additional settings.

#### [NEW] [Manifest & PWA Config]
*   Configure `vite-plugin-pwa` for offline support and home-screen installation.
*   Define `manifest.json` with corporate branding (Teal/Slate).
*   Generate high-quality icons for iOS and Android.

---

## Responsive Design Strategy

The app will dynamically adapt to the user's device:

### 1. Mobile Experience (Handheld)
*   **Navigation**: Bottom "Tab Bar" for primary actions (Dashboard, Personnel, Analytics).
*   **Layout**: Single column layout for KPI cards and logs.
*   **Micro-interactions**: Optimize touch targets and include pull-to-refresh indicators.

### 2. Tablet & Desktop Experience (Large Screen)
*   **Navigation**: Persistent Sidebar with multi-level categorization.
*   **Layout**: Multi-column grid (up to 4 columns) for maximum data density.
*   **Charts**: Expandable charts with hover-state details.

---

---

## Functional Requirements & Data Schema

### Core Entities
#### [NEW] [Firestore Collections]
*   **`projects`**: Top-level containers with `title`, `description`, `ownerId`, and `status`.
*   **`tasks`**: Linked to projects. Fields: `title`, `requirements`, `dueDate`, `assignedTo` (array of coworker IDs), `priority`, `status` (todo, doing, done), `parentId` (for subtasks).
*   **`coworkers`**: Team members with `name`, `avatar`, and `role`.

### Specialized Views
#### [NEW] [Stacked Coworker Timelines]
*   A horizontal scrolling view where each row represents a coworker and their assigned tasks are mapped along a timeline based on due dates.
*   Synchronized horizontal scrolling across all rows for timeline alignment.

#### [NEW] [Kanban (Kaydan) Board]
*   A drag-and-drop board for workflow management (To Do, In Progress, Completed).

#### [NEW] [Gantt & Dependencies]
*   A high-level view showing task durations and inter-dependencies.

---

## Responsive Design Strategy

The app will dynamically adapt, ensuring Ali can manage "on the go":

### 1. Mobile Experience (Handheld)
*   **Navigation**: Bottom "Tab Bar" for quick access to the Kanban board and Task list.
*   **Actions**: "Quick Add" button for new tasks.

### 2. Tablet & Desktop Experience
*   **Navigation**: Sidebar for project switching and advanced views (Timelines/Gantt).
*   **Layout**: Expanded multi-pane view for detailed task editing alongside the timeline.

---

## Verification Plan

### Automated Tests
*   Run `npm run build` to ensure the project compiles correctly.
*   Run `npm run dev` and use the browser tool to verify the landing page.

### Manual Verification
*   Verify that the design meets the "WOW" factor with smooth animations and a responsive layout.
