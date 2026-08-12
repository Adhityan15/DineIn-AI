# ADR-0001: Architecture and Implementation Baseline for Version 1

* **Status:** Approved
* **Date:** 2026-07-03

## Context
Traditional restaurant operations are fragmented, relying on manual processes and disconnected systems. The objective is to build a centralized, modular, and containerized platform utilizing Django REST Framework (DRF), React.js, and PostgreSQL, styled with Tailwind CSS, running locally in Docker Compose.

## Decisions

### 1. UI & Styling Framework
* **Decision:** Implement the frontend as a single-page application using **React.js** styled with **Tailwind CSS**.
* **Rationale:** Utility-first styling provides rapid development, responsive defaults, and a consistent layout system without custom CSS media-query bloat.

### 2. Local Development & Third-Party Mock Strategy
* **Decision:** Abstract all third-party systems through adapter interfaces. Create local mock service implementations for:
  * Google Gemini API
  * Google Maps Places API
  * SMTP Email Service
  * Twilio SMS
  * Petpooja POS
* **Rationale:** Ensures 100% offline local development in Docker, repeatable test suites, and clean codebase decoupling.

### 3. Customer Reviews Data Strategy
* **Decision:** Google Maps Reviews API will be synchronized manually. A CSV/Kaggle dataset upload pipeline will serve as a fallback demonstration data source. The review processing pipeline remains identical.

### 4. Table Reservation Scope
* **Decision:** All restaurant tables are static and fixed. Dynamic table splitting/merging is out of scope.

### 5. Automated Reservation No-Show Release
* **Decision:** Background Celery Beat scheduler automatically checks reservations. If check-in has not occurred within 15 minutes of reservation start time, status transitions to `No Show` and the table is released.

### 6. Real-Time Recipe-Based Inventory Deduction
* **Decision:** Stock level deduction occurs in real time immediately after a POS transaction order is recorded. Low stock checks and reorder recommendations are generated dynamically.

### 7. Geolocation-Validated Attendance
* **Decision:** Mark employee attendance by checking browser GPS coordinates. Restrict mark operations to a configurable radius (e.g., 100 meters) of the restaurant location. Geolocation access is mandatory.

### 8. Coding Standards & Architectural Design
* **Decision:** Code follows:
  * Clean Architecture & SOLID principles.
  * Service Layer & Repository Pattern.
  * Adapter Pattern for POS, Notification, and AI clients.
  * JWT Stateless Authentication.
  * API-level Role-Based Access Control (RBAC).

## Consequences
* High maintainability and clear boundaries between HTTP handlers, business services, and database repositories.
* Clean local Docker setup for seamless environment synchronization.
