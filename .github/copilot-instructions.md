# Copilot UI Instructions - SaaS Dashboard Design System

## 🎯 Goal

Generate modern, clean, production-ready SaaS dashboard UI similar to:

* Linear
* Notion
* ClickUp
* Modern admin dashboards

---

## 🧱 Layout Rules

* Always use a **sidebar + main content layout**
* Sidebar:

  * Fixed left
  * Vertical icons + active state
* Main content:

  * Use container with padding (p-6 or p-8)
  * Use grid system for sections

---

## 🧩 Component Design

### Cards (IMPORTANT)

* EVERYTHING should be inside cards
* Card style:

  * `bg-white`
  * `rounded-xl`
  * `shadow-sm`
  * `p-4` or `p-6`
  * `border border-gray-100`

---

### Buttons

* Primary:

  * `bg-indigo-500 text-white`
  * `rounded-lg px-4 py-2`
* Secondary:

  * `bg-gray-100 text-gray-700`
* Always add hover:

  * `hover:bg-indigo-600`

---

### Inputs

* `border border-gray-200 rounded-lg px-3 py-2`
* Focus:

  * `focus:ring-2 focus:ring-indigo-500`

---

## 🎨 Colors

* Primary: `indigo-500 / blue-500`
* Background: `gray-50`
* Card: `white`
* Text:

  * title: `text-gray-900`
  * secondary: `text-gray-500`

---

## 📏 Spacing

* Use consistent spacing:

  * `p-4`, `p-6`
  * `gap-4`, `gap-6`
  * `mt-4`, `mb-4`
* Avoid tight layouts

---

## 👥 UI Patterns

### Avatar Group

* Use overlapping avatars:

  * `flex -space-x-2`

---

### Tags / Labels

* Small rounded badges:

  * `px-2 py-1 text-xs rounded-md`
* Colors:

  * blue, green, orange, purple

---

### Progress Bar

* Use rounded full bar:

  * `h-2 rounded-full bg-gray-200`
  * inner: `bg-indigo-500`

---

### Tables / Lists

* Use clean table:

  * no heavy borders
  * `divide-y divide-gray-100`
* Row hover:

  * `hover:bg-gray-50`

---

## 🧠 UX Rules

* Always show:

  * loading state
  * empty state
  * hover effect
* Buttons must have hover + active states
* Disable button when loading

---

## ⚙️ Behavior

* Use Composition API (`<script setup lang="ts">`)
* Use `ref` and `computed`
* Separate UI and logic

---

## 🚫 Avoid

* No inline CSS
* No crowded UI
* No random colors
* No large monolithic components
* No inconsistent spacing

---

## 🧩 Example Structure

* Sidebar
* Header (search + user avatar)
* Content sections:

  * Stats cards
  * Main content (grid)
  * Secondary panels (right sidebar optional)

---

## 🎯 Final Requirement

Generated UI must be:

* Clean
* Minimal
* Spacious
* Consistent
* Professional SaaS quality

---

## ✨ UI Excellence Rules (Mandatory)

* Every generated screen must feel production-ready, not demo-like.
* Use strong visual hierarchy:

  * clear title, subtitle, section headings
  * clear primary vs secondary actions
* Add polished states:

  * loading skeletons
  * empty states with CTA
  * error states with retry actions
* Keep micro-interactions meaningful:

  * hover, active, disabled states for all buttons
  * subtle transitions for cards, tables, and dialogs
* Ensure responsive behavior for desktop + tablet + mobile.

---

## 🏗️ Code Architecture Rules (Mandatory)

### 1) Constants Management

* Do NOT place feature-specific constants in shared/global constant files.
* Each feature must own its constants in local files.
* Use global constants only for app-wide values.
* No magic numbers/strings inside components or services.

### 2) Types and Interfaces Management

* Do NOT declare interface/type inside service files.
* Put interfaces/types in dedicated files:

  * `types/*.types.ts` for domain data
  * `dto/*.dto.ts` for request/response payload contracts
* Services only import and use those types.

### 3) Validation Policy

* Validation must be in DTO layer only (`class-validator`, `class-transformer`).
* Service layer must NOT contain input validation logic for DTO fields.
* Service layer focuses on:

  * business logic
  * orchestration
  * authorization checks
  * persistence
* Any request payload rule must be declared in DTO decorators.

### 4) Service Responsibilities

* Keep service files focused and small.
* Extract reusable helper logic into separate helper/utility files.
* No mixed concerns (UI mapping, validation, and persistence in one place).

### 5) File Organization

* Prefer this structure per module:

  * `controller/` for transport layer
  * `dto/` for validation contracts
  * `service/` for business logic
  * `types/` for domain types/interfaces
  * `constants/` for module-level constants

---

## ✅ PR Review Safety Checklist

When generating or refactoring code, always self-check:

* Are constants in the correct module file?
* Are all interfaces/types moved out of service files?
* Is validation implemented in DTO instead of service?
* Is service focused on business logic only?
* Is the UI consistent with the SaaS design system above?
