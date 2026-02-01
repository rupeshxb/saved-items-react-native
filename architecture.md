

# Architecture Overview: Saved Items

## 1. Project Identity

* **Project Name:** Saved Items / SecureVault
* **Repository:** `saved-items-react-native`
* **Stack:** React Native (Expo SDK 51+), TypeScript, Firebase Firestore
* **Architecture Style:** Feature-Based Vertical Slicing
* **Author:** Rupesh Bhatta
* **Last Updated:** Feb 2, 2026

## 2. High-Level Strategy

This project utilizes **Feature-Based Vertical Slicing**. Instead of organizing by technical type (all hooks in one folder, all styles in another), code is grouped by business domain. This minimizes "folder hopping" during development and ensures that a feature like "Sharing" or "Item Management" is a self-contained module.

### Core Principles

1. **Offline-First Resilience:** The architecture treats the local Firestore cache as the primary data source. UI components subscribe to streams that resolve locally before syncing globally.
2. **Unidirectional Data Flow:** Data flows from Firestore -> Repository -> Hook -> UI. Actions flow from UI -> Repository -> Firestore. This prevents "state drift" across screens.
3. **Graceful Degradation:** The system is designed to handle "partial success" states, such as when a user is authenticated but the network is unavailable, or when a shared link refers to a deleted document.

## 3. Directory Structure (Vertical Slicing)

The project structure separates the **Navigation Layer** (Expo Router) from the **Business Logic Layer** (Source code).

```text
saved-items-react-native/
├── app/                        # NAVIGATION LAYER (Expo Router)
│   ├── (auth)/                 # Auth Group (Login, Register)
│   ├── (tabs)/                 # Main Tab Navigation (Home/My Vault, Shared)
│   │   ├── _layout.tsx         # Tab Configuration
│   │   ├── index.tsx           # Route: / (My Vault)
│   │   └── shared.tsx          # Route: /shared (Shared with Me)
│   ├── item/                   # Nested Routes
│   │   └── [id].tsx            # Route: /item/:id (Deep Link Target)
│   └── _layout.tsx             # Root Provider (Auth, Theme, Persistence)
│
├── src/                        # BUSINESS LOGIC LAYER
│   ├── core/                   # Shared Foundations
│   │   ├── theme/              # Color Palette, Typography
│   │   └── ui/                 # Atomic Components (Buttons, Inputs, ErrorViews)
│   │
│   ├── features/               # Vertical Slices (Domain Logic)
│   │   ├── vault/              # "My Items" Feature
│   │   │   ├── components/     # Vault-specific UI
│   │   │   ├── hooks/          # useVaultItems.ts
│   │   │   └── repository.ts   # Logic for fetching owned items
│   │   ├── sharing/            # Sharing & Permissions Feature
│   │   │   ├── hooks/          # useShareAction.ts
│   │   │   └── repository.ts   # Logic for Public/Email sharing
│   │   └── details/            # Item Detailed View Feature
│   │       ├── components/     # Detail Modals
│   │       └── repository.ts   # Logic for single-item subscription
│   │
│   ├── services/               # Infrastructure (Framework wrappers)
│   │   ├── firebase.ts         # Firestore/Auth Initialization & Persistence Config
│   │   └── auth-service.ts     # User Identity Logic
│   │
│   └── types/                  # Global TypeScript Definitions
│       └── index.ts            # Item, User, and Permission interfaces
│
├── firebaseConfig.js           # Firebase Keys & Offline Configuration
├── app.json                    # Expo Config (Deep Link Scheme: securevault)
└── README.md                   # Engineering Documentation

```

## 4. Tech Stack & Decisions

* **State Management: Firestore Snapshots & React Hooks**
* *Rationale:* Eliminates the need for Redux/Zustand by treating the Firestore Cache as the global state. UI updates in real-time across all devices/tabs.


* **Navigation: Expo Router (Typed)**
* *Rationale:* Provides native-feeling deep linking (e.g., `securevault://item/123`) and file-based routing that scales with the feature tree.


* **Data Layer: Typed Repositories**
* *Rationale:* Encapsulates complex Firestore queries. If the backend migrated from Firebase to Supabase, only the `repository.ts` files would change.


* **Reliability: experimentalForceLongPolling**
* *Rationale:* Chosen over standard WebSockets to ensure stable data sync during mobile network handovers (LTE to WiFi).



## 5. Data Modeling (Firestore)

### 5.1. Collection: `items`

The primary collection. Structured to handle both ownership and collaborative access.

* **Path:** `/items/{itemId}`
* **Model:**

```typescript
interface Item {
  id: string;
  title: string;
  description: string;
  url: string;
  userId: string;          // Owner UID
  ownerEmail: string;      // Denormalized for UI performance
  sharedEmails: string[];  // ACL (Access Control List)
  isPublic: boolean;       // Toggle for deep-link accessibility
  updatedAt: Timestamp;    // Server-side timestamp
}

```

### 5.2. Modeling Strategy: Denormalization

We store `ownerEmail` and `ownerName` directly inside the item document.

* *Rationale:* This avoids "N+1" query problems where the app would otherwise have to fetch a user document for every item in a list just to show who shared it.

## 6. Deep Linking Strategy

* **Scheme:** `securevault://item/{id}`
* **Flow:**
1. **Entry:** Link opens `app/item/[id].tsx`.
2. **Auth Guard:** App checks if user is logged in; if not, redirects to Login while caching the target ID.
3. **Permission Check:** Repository attempts to fetch the ID.
4. **Security Resolution:** If user is not the owner AND not in `sharedEmails` AND `isPublic` is false, the UI triggers an "Access Denied" state.
5. **Resilience:** If the document is missing (404), the `subscribeToItem` listener detects the null snapshot and redirects to a "Content Unavailable" screen.



## 7. Scalability & Performance Strategies

* **Index Optimization:** Custom Firestore indexes are used for `userId` + `updatedAt` to ensure `O(1)` query performance regardless of database size.
* **Write Timeout Pattern:** All writes are wrapped in a promise race. This ensures the UI never "hangs" waiting for a network acknowledgment during offline usage.
* **Snapshot Lifecycle:** Listeners are automatically detached when components unmount to prevent memory leaks and unnecessary battery drain.

## 8. Error Handling & Edge Cases

* **Corrupt Local Data:** The system utilizes `onAuthStateChanged` to force-clear local state if an auth token becomes invalid or corrupted.
* **App Restarts during Write:** Firebase's internal "Write-Ahead Log" persists pending changes to local storage. Upon restart, the SDK automatically resumes syncing these changes to the server.
* **Invalid Shared Links:** Handled via a Global Error Boundary in `app/_layout.tsx` that catches navigation errors and malformed UUIDs.