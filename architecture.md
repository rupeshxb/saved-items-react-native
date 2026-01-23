# Architecture Overview

This document provides a high-level overview of the architecture for the Saved Item Vault mobile application. It is intended to help contributors quickly understand the system structure, data flow, and key design decisions. This document should evolve alongside the codebase as features and complexity grow.

---

## 1. Project Structure

The project follows a layered architecture that clearly separates UI, domain logic, and data access. This structure is designed to scale as the application grows while keeping responsibilities well-defined.

```
[Project Root]/
├── src/
│   ├── screens/            # Application screens (navigation-level UI)
│   ├── components/         # Reusable UI components
│   ├── domain/
│   │   ├── models/         # Core domain models (e.g., Item)
│   │   ├── repositories/   # Repository interfaces (contracts)
│   │   └── usecases/       # Business logic / application use cases
│   ├── data/
│   │   ├── firebase/       # Firebase configuration and Firestore implementations
│   │   └── cache/          # Local persistence and caching abstractions
│   ├── state/              # Global state management
│   ├── navigation/         # Navigation and deep linking configuration
│   ├── utils/              # Shared utilities and error handling
│   └── types/              # Shared TypeScript types
├── docs/                   # Additional documentation
├── README.md               # Project overview and setup instructions
├── ARCHITECTURE.md         # This document
├── app.json                # Expo configuration
└── package.json            # Dependencies and scripts
```

This structure enforces a strict separation of concerns and prevents UI components from directly accessing Firebase or business logic.

---

## 2. High-Level System Diagram

```
[User]
  |
  v
[React Native App (Expo)]
  |
  v
[Domain Layer (Use Cases)]
  |
  v
[Repository Interfaces]
  |
  v
[Firestore Repository Implementation]
  |
  v
[Firebase Firestore]
```

Deep linking flows bypass the list screen and route directly to the item detail screen after validation and data retrieval.

---

## 3. Core Components

### 3.1. Mobile Application

Name: Saved Item Vault (Mobile App)

Description:
A React Native mobile application that allows authenticated users to browse items, save and unsave them, view their saved items, and share items via deep links. The app is designed to work reliably across restarts and in offline conditions.

Technologies:

* React Native
* Expo
* TypeScript
* Expo Linking

Deployment:

* Android and iOS builds via Expo (planned)

---

### 3.2. Data Access Layer

Name: Firestore Item Repository

Description:
Implements repository interfaces responsible for retrieving and persisting item data and user-specific saved state. This layer isolates Firebase SDK usage from the rest of the application.

Technologies:

* Firebase Firestore
* Firebase Authentication

Deployment:

* Firebase-managed infrastructure

---

## 4. Data Stores

### 4.1. Primary Data Store

Name: Firestore Database

Type: Firebase Firestore

Purpose:
Stores application data including globally accessible items and user-specific saved state.

Key Collections:

* items
* users/{userId}/savedItems

## 5. External Integrations / APIs

Service: Firebase Authentication
Purpose: User authentication (anonymous or email-based)
Integration Method: Firebase SDK

Service: Expo Linking
Purpose: Deep linking and routing shared item links
Integration Method: Expo Linking API

---

## 6. Deployment & Infrastructure

Cloud Provider: Firebase / Google Cloud Platform

Key Services Used:

* Firestore
* Firebase Authentication

CI/CD:
Not configured for this assignment (out of scope)

Monitoring & Logging:
Console logging and defensive error handling at application boundaries

---

## 7. Security Considerations

Authentication:
Firebase Authentication ensures all saved-item operations are scoped to an authenticated user.

Authorization:
Firestore security rules restrict saved items to the owning user.
Items are globally readable to support sharing via links.

Data Encryption:
TLS for data in transit
Encryption at rest handled by Firebase

---

## 8. Development & Testing Environment

Local Setup:

* Install dependencies via npm install
* Run locally using expo start

Testing:

* Automated testing is limited for this assignment due to time constraints
* Repository abstractions are designed to be testable

Code Quality Tools:

* TypeScript
* ESLint

---

## 9. Future Considerations / Roadmap

* Add pagination and cursor-based loading for large item lists
* Introduce background sync and retry strategies
* Add analytics and structured logging
* Expand saved items to support collections or tagging
* Introduce automated tests for domain use cases

## 10. Project Identification

Project Name: Saved Item Vault
Repository: saved-item-react-native
Primary Developer: Rupesh Bhatta
Date of Last Update: 2026-01-23

---

## 11. Glossary / Acronyms

Item: A piece of content (e.g., article or resource) that can be saved and shared
Repository Pattern: An abstraction layer that isolates data access logic from business logic
Offline-First: An approach where the app remains usable without network connectivity

