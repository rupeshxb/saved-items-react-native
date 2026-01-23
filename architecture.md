# Architecture Overview: Saved Items

## 1. Project Identity
* Project Name: Saved Items
* Repository: saved-items-react-native
* Stack: React Native (Expo), TypeScript, Firebase Firestore
* Architecture Style: Feature-Based Vertical Slicing
* Author: Rupesh Bhatta
* Last Updated: January 23, 2026

## 2. High-Level Strategy
This project abandons traditional "Layered" architecture (splitting folders by file type) in favor of Feature-Based Architecture. Code is organized by domain feature (e.g., Feed, Saved, ItemDetails) rather than technical role. This improves scalability, enhances code navigation, and allows for strict separation of concerns.

### Core Principles
1. Offline-First: All data interactions assume potential network loss. We utilize Firestore's native persistence cache as the single source of truth for the UI.
2. Unidirectional Data Flow: UI components never modify state directly. They trigger Actions -> Repositories -> Server State -> UI Updates.
3. Read Optimization: The data model is structured to minimize document reads during list scrolling (denormalization where appropriate).

## 3. Directory Structure (Vertical Slicing)
We utilize Expo Router for navigation (app/) and keep business logic (src/) distinct and modular.

saved-items-react-native/
├── .gitignore
├── app.json                    # Expo Config (schemes, package names)
├── babel.config.js             # Standard Expo Babel config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── ARCHITECTURE.md             # (You have this)
├── phases.md                   # (You have this - ignored by git)
├── README.md                   # (You have this)
├── LICENSE                     # (You have this)
├── google-services.json        # Android Firebase Config (Download from Console)
├── GoogleService-Info.plist    # iOS Firebase Config (Download from Console)
│
├── assets/                     # Standard Expo Assets
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
│
├── app/                        # NAVIGATION LAYER (Expo Router)
│   ├── _layout.tsx             # Root Layout (Providers: QueryClient, Auth)
│   ├── +not-found.tsx          # Global 404 Error Screen
│   │
│   ├── (tabs)/                 # Main Tab Navigation
│   │   ├── _layout.tsx         # Tab Bar Configuration (Icons, Colors)
│   │   ├── index.tsx           # Route: / (The Feed Screen)
│   │   └── saved.tsx           # Route: /saved (The Saved Items Screen)
│   │
│   └── item/                   # Nested Routes
│       └── [id].tsx            # Route: /item/:id (Deep Link Target)
│
└── src/                        # BUSINESS LOGIC LAYER
    ├── core/                   # Shared Foundations
    │   ├── auth/
    │   │   └── index.ts        # (Optional) Auth helpers if needed
    │   ├── theme/
    │   │   └── index.ts        # Colors, Spacing constants
    │   └── ui/
    │       └── ErrorView.tsx   # Reusable Error Component
    │
    ├── features/               # Vertical Slices
    │   ├── feed/
    │   │   ├── components/
    │   │   │   └── FeedList.tsx
    │   │   ├── hooks/
    │   │   │   └── useFeedQuery.ts
    │   │   └── repository.ts   # FeedRepository (fetchItems)
    │   │
    │   ├── saved/
    │   │   ├── hooks/
    │   │   │   └── useToggleSave.ts
    │   │   └── repository.ts   # SavedRepository (toggleSave, fetchSavedIds)
    │   │
    │   └── item-details/
    │       ├── components/
    │       │   └── ItemDetailView.tsx
    │       └── repository.ts   # ItemDetailRepository (fetchById)
    │
    ├── services/               # Infrastructure
    │   └── firebase.ts         # Firebase App Initialization
    │
    └── types/                  # Global Types
        └── index.ts            # Interface Item {}

## 4. Tech Stack & Decisions

State Management: TanStack Query
- Rationale: Handles server state, caching, loading states, and background refetching efficiently. Essential for the "Offline" requirement.

List Rendering: FlashList
- Rationale: Chosen over FlatList to satisfy the 1,000+ item performance requirement. Uses view recycling to maintain 60fps.

Navigation: Expo Router
- Rationale: Provides native deep linking capability out-of-the-box (saveditems://item/123).

Data Layer: Typed Repositories
- Rationale: Decouples the UI from Firestore SDK. Allows for easy mocking during tests and strict type safety.

## 5. Data Modeling (Firestore)

### 5.1. Collection: items
The master inventory list. Read-heavy optimization.
* Path: items/{itemId}
* Model:
    interface Item {
      id: string;
      title: string;
      description: string;
      updatedAt: number; // Unix timestamp for sorting
    }

### 5.2. Collection: users/{uid}/saved
Stores user-specific relationships.
* Path: users/{uid}/saved/{itemId}
* Strategy: Idempotent Keys. The document ID is explicitly set to the Item ID.
* Content: { savedAt: number }
* Note: We do not duplicate the full item details here (normalization). The UI resolves item details by matching IDs against the items cache. This ensures data consistency (if an item description updates, the user sees it immediately).

## 6. Deep Linking Strategy
* Scheme: saveditems://item/{id}
* Flow:
    1. Cold Start: App launches -> Auth Check -> Navigation to app/item/[id].
    2. Resolution: The [id].tsx route triggers useItemDetails(id).
    3. Resilience: If the ID doesn't exist (e.g., item was deleted), the UI handles the 404 error gracefully with a "Content Unavailable" view instead of crashing.

## 7. Scalability & Performance Strategies
* Pagination: Feeds fetch data in batches of 20 using Firestore cursors (startAfter) to prevent memory overload.
* Memoization: List items are wrapped in React.memo to prevent re-rendering the entire list when a single item's state changes.
* Optimistic Updates: "Save" actions update the UI immediately via React Query's onMutate handler before the network request completes, ensuring the app feels responsive even on slow networks.

## 8. Error Handling & Edge Cases
* Network Failures: Handled implicitly by Firestore Persistence (offline read/write) and React Query retries.
* Corrupt Data: Zod schemas validate data at the Repository boundary. Malformed items are filtered out to prevent UI crashes.
* App Restart: Writes (e.g., saving an item) initiated while offline are persisted by the Firebase SDK and automatically synced upon app restart.