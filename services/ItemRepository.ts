import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const COLLECTION_NAME = 'items';

// HELPER: Forces a promise to "finish" after 2 seconds if the network is slow/offline
// This ensures the UI doesn't hang forever during write operations.
const withTimeout = (promise: Promise<any>, ms = 2000) => {
    const timeout = new Promise((resolve) => setTimeout(resolve, ms));
    return Promise.race([promise, timeout]);
};

export const ItemRepository = {
  
  // 1. CREATE ITEM
  createItem: async (title: string, description: string, url: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docData = {
      title,
      description,
      url,
      userId: user.uid,
      ownerEmail: user.email,
      ownerName: user.displayName || "Unknown",
      sharedEmails: [], 
      isPublic: false,  
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await withTimeout(addDoc(collection(db, COLLECTION_NAME), docData));
  },

  // 2. GET MY ITEMS
  getMyItems: (callback: (items: any[]) => void) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const q = query(
        collection(db, COLLECTION_NAME), 
        where("userId", "==", user.uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },

  // 3. GET SHARED ITEMS
  getSharedItems: (callback: (items: any[]) => void) => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    const q = query(
        collection(db, COLLECTION_NAME), 
        where("sharedEmails", "array-contains", user.email)
    );
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },

  // 4. SUBSCRIBE TO SINGLE ITEM (Crucial for Edge Cases & Deep Linking)
  subscribeToItem: (itemId: string, callback: (item: any | null) => void) => {
    const itemRef = doc(db, COLLECTION_NAME, itemId);
    return onSnapshot(itemRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Requirement: Handle missing or deleted Firestore documents
        callback(null); 
      }
    }, (error) => {
        console.error("Error fetching item:", error);
        callback(null); 
    });
  },

  // 5. SHARE VIA EMAIL
  shareItem: async (itemId: string, targetUserId: string, targetUserEmail: string) => {
      const itemRef = doc(db, COLLECTION_NAME, itemId);
      await withTimeout(updateDoc(itemRef, {
          sharedEmails: arrayUnion(targetUserEmail),
          updatedAt: serverTimestamp()
      }));
  },

  // 6. UNSHARE VIA EMAIL
  unshareItem: async (itemId: string, emailToRemove: string) => {
      const itemRef = doc(db, COLLECTION_NAME, itemId);
      await withTimeout(updateDoc(itemRef, {
          sharedEmails: arrayRemove(emailToRemove),
          updatedAt: serverTimestamp()
      }));
  },

  // 7. TOGGLE PUBLIC LINK STATUS
  setPublicStatus: async (itemId: string, isPublic: boolean) => {
    const itemRef = doc(db, COLLECTION_NAME, itemId);
    await withTimeout(updateDoc(itemRef, { 
      isPublic,
      updatedAt: serverTimestamp() 
    }));
  },

  // 8. DELETE ITEM
  deleteItem: async (itemId: string) => {
    const itemRef = doc(db, COLLECTION_NAME, itemId);
    await withTimeout(deleteDoc(itemRef));
  },

  // 9. UPDATE ITEM
  updateItem: async (itemId: string, data: any) => {
    const itemRef = doc(db, COLLECTION_NAME, itemId);
    await withTimeout(updateDoc(itemRef, {
      ...data,
      updatedAt: serverTimestamp()
    }));
  }
};