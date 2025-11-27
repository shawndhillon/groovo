# Project Coding Standards & Style Guide

> This document defines how we write, structure, and organize code in this project.
> The goal is to keep the codebase **readable, modular, and easy to test**.

---

## 1. Scope & Technologies

These standards apply to:

- **Languages:** TypeScript / JavaScript
- **Framework:** Next.js (React)
- **Runtime:** Node.js
- **Styling:** Tailwind CSS (if applicable) + component libraries

If something isn’t covered here, follow:
- Official framework docs (Next.js, React, etc.)
- Existing patterns in the codebase

---

## 2. General Principles

- **Readability over cleverness**
- **Consistency over personal preference**
- **Small, focused units of code** (files, functions, components)
- **Testability** is a design goal, not an afterthought
- Prefer **explicit** over implicit behavior (clear names, clear data flow)

---

## 3. Project Structure

- Keep a **clear, predictable layout**:
  - `app/` – pages and routes
  - `app/api/` – route handelers
  - `app/components/` – shared & resusable UI components
  - `app/hooks/` – reusable hooks
  - `app/types/` – pure type conventions
  - `app/utils/` – pure utility functions
  - `app/lib/` – integration logic (DB helpers, etc.)
  - `tests/` or `__tests__/` – test files mirroring the folder structure

- **Avoid “god folders”** like `helpers/` with random stuff.  
  Group by **domain or feature** when it makes sense, e.g.:
  - `app/reviews/…`
  - `app/profile/…`
  - `app/feed/…`

---

## 4. Modular Code & File Size (Very Important for This Project)

We **do not** want giant files or “do-everything” components.

### 4.1 Single Responsibility

- Every **module, component, hook, and function** should do **one thing well**.
- If you can’t describe what it does in **one short sentence**, it’s probably doing too much.

Examples:
- Good: `useAlbumReviews` – “fetches and normalizes reviews for one album”
- Good: `ReviewCard` – “displays a single review”
- Bad: `ReviewPage` that:
  - fetches data  
  - manages all UI states  
  - renders the entire layout  
  - handles all dialogs/modals  
  - includes all small UI pieces inside one file

### 4.2 File Size Guidelines

These are **soft rules**, but use them as a warning sign:

- **React components:**  
  - Try to keep files under **200–250 lines**.  
  - If a page or component is > 300 lines, consider splitting it.
- **Hooks / utilities:**  
  - If a hook does multiple unrelated things (e.g. fetch, complex formatting, caching, and navigation), split it into smaller hooks or utils.

When to split:
- The file has multiple logical “sections” (data fetching, UI rendering, dialog logic).
- You can identify natural subcomponents (header, sidebar, list, card, dialog).

### 4.3 Page Structure (Major Pages)

For **major pages**, follow this pattern:

- **Page file** (in `app/.../page.tsx`) should:
  - Orchestrate data fetching
  - Wire together child components
  - Contain **minimal** JSX ideally

- Extract subcomponents into `/components` next to the page:
  - Example:
    - `app/album/[id]/page.tsx` – orchestrates
    - `app/album/[id]/AlbumHeader.tsx`
    - `app/album/[id]/ReviewSection.tsx`
    - `app/album/[id]/TrackList.tsx`

Each subcomponent should:
- Have a **clear single purpose**
- Receive props instead of doing its own data fetching (unless it’s really specific)

This makes:
- Code easier to read
- Each piece easier to test
- Reuse possible across pages

---

## 5. Naming Conventions

- **Files**
  - React components: `PascalCase.tsx` (`ReviewCard.tsx`)
  - Hooks: `useSomething.ts` (`useReviews.ts`)
  - Utilities: `camelCase.ts` (`formatDate.ts`)

- **Components & Functions**
  - `PascalCase` for React components
  - `camelCase` for functions, variables, and hook names
  - Hooks **must** start with `use` and follow React rules

- **Variables**
  - Descriptive but concise:
    - ✅ `albumId`, `reviewList`, `isLoading`
    - ❌ `a`, `data1`, `stuff`, `thing`

---

## 6. React / Next.js Component Conventions

- Use **function components** with hooks (no class components).
- Prefer **controlled components** for forms.
- Avoid heavy logic inside JSX. Move logic to:
  - helper functions
  - hooks (`useSomething`)
  - computed variables before the `return`

**Component layout:**

---

## 7. Code Style & Patterns

**Prefer composition over “god components”**

- Bad
  - A 600-line page.tsx
  - A hook that does everything from fetching → transforming → UI state

- Good
  - Small pieces combined together
  - Components that do one job
  - Hooks grouped by responsibility

**Prefer pure functions in `utils/`**

- No fetching. No React. No side effects.

**Prefer light page files**

Keep your `page.tsx` basically:
```tsx
import Something from "./Something";

export default async function Page() {
  const data = await getData();
  return <Something data={data} />;
}
```

--- 

## 8. State Management & Hooks

- Use local state unless multiple components need it
- Lift state only when needed
- Split hooks by responsibility

- **Example**
  - `useAlbumData` - Fetch logic
  - `useAlbumUIState` - UI open/close/toggles

- **Hooks must:**
  - Start with `use`
  - Never be conditional
  - Have "One Job"

## 9. Async & Error Handling

- Always handle async failures
- Expose meaningful error messages
- Log internal errors for debugging
- No silent failures

- **Example:**
  ```typescript
  try {
    // ...
  } catch (err) {
    console.error('Failed to fetch reviews', err);
    setError('Could not load reviews. Please try again.');
  }
  ```
