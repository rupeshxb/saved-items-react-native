

# 🛡️ SecureVault: Senior Engineering Documentation

SecureVault is a resilient, cross-platform mobile application designed to provide users with a secure digital vault for saving and sharing items. Built with **React Native (Expo)**, **TypeScript**, and **Firebase Firestore**, the project prioritizes data integrity, offline-first availability, and a robust security model.

---

## 🏗️ Architectural Overview

This project implements the **Repository Pattern** to maintain a strict separation of concerns between the UI and the data layer.

### Folder Structure Rationale

* **`/app`**: Contains the routing logic via Expo Router. View logic is kept thin, delegating all data operations to services.
* **`/services`**: The core "Engine" of the app.
* `ItemRepository.ts`: Centralizes all Firestore interactions.
* `AuthRepository.ts`: Manages user lifecycle and identity lookups.


* **`/firebaseConfig.ts`**: Handles the critical initialization of the Firebase SDK, including custom persistence and stability settings.

### Separation of Concerns

By decoupling Firestore logic from the UI, we achieve:

1. **Mockability:** The UI can be tested independently of Firebase.
2. **Schema Agnosticism:** If the database structure changes, only the Repository file requires updates.
3. **Consistency:** Centralized error handling for all network operations.

---

## 💾 Firestore Data Model & Rationale

We utilize a NoSQL document-based structure in Firestore for high-speed reads and eventual consistency.

### The `items` Collection

| Field | Type | Rationale |
| --- | --- | --- |
| `userId` | string | Used for high-performance indexed queries for "My Vault". |
| `ownerEmail` | string | Redundant data to allow shared users to see who sent the item without a secondary join. |
| `sharedEmails` | array | **Trade-off Decision:** Using an array of emails allows for simple `array-contains` queries. While limited to 1MB per doc, this is optimal for personal sharing. |
| `isPublic` | boolean | A security flag to toggle anonymous deep link access. |
| `updatedAt` | timestamp | Server-side timestamps to ensure sorting consistency across different timezones. |

---

## 🔗 Deep Linking Approach

The app leverages **Expo Linking** to handle the `securevault://items/[id]` scheme.

**The Authorization Flow:**

1. User clicks a link  Deep link handler opens the specific Item ID.
2. **State Verification:** The app checks if a user is logged in.
3. **Permission Resolution:** The `ItemRepository.subscribeToItem` listener fetches the document and performs a triple-check:
* *Is the user the owner?*
* *Is the user's email in the `sharedEmails` list?*
* *Is the item marked as `isPublic`?*


4. **Graceful Rejection:** If none are true, the user is alerted and redirected to Home, preventing "ghost" screens or crashes.

---

## ⚡ Resilience & Edge Cases (Senior Judgment)

### 1. Missing or Deleted Documents

When a document is deleted while a user is viewing it, the `onSnapshot` listener triggers a `null` response. The UI is programmed to catch this specifically, alert the user ("Item no longer available"), and navigate them back to safety.

### 2. Offline Persistence & App Restarts

* **Initialization:** We use `initializeFirestore` with `AsyncStorage` to ensure the local cache persists through app kills and OS reboots.
* **Experimental Long Polling:** Enabled to solve the common React Native issue where WebSockets hang during cellular/WiFi handovers.
* **Write Reliability:** All write operations (Create/Update/Delete) are wrapped in a `withTimeout` race. If the network is out, the UI unblocks after 2s while Firestore's internal queue waits for connectivity to sync.

---

## 📈 Scaling for Production

To scale this to **100,000+ users**, the following improvements would be made:

1. **Sub-collections for ACLs:** For items shared with thousands of users, I would move `sharedEmails` to a `permissions` sub-collection to avoid the 1MB document limit.
2. **Optimistic UI:** Implement local state updates that resolve before the server confirms, creating a "zero-latency" user experience.
3. **Security Rules:** Implement robust **Firestore Security Rules** to enforce permissions at the database level, ensuring users cannot query IDs they don't own or have access to.
4. **Cloud Functions:** Use triggers to handle cleanup (e.g., when a user deletes their account, cascade-delete their vault items).

---

## 🛠️ Known Limitations & Trade-offs

* **Search:** Currently limited to the local cache. In production, I would implement **Algolia** or **ElasticSearch** for full-text indexing.
* **Email Sharing:** Relies on users knowing exact emails. A production app would include a "User Search" autocomplete feature.

---

### **How to Run**

1. `npm install`
2. Add your Firebase credentials to `firebaseConfig.ts`.
3. `npx expo start`
