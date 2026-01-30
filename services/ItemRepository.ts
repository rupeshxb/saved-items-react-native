import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp, 
  Timestamp, 
  limit 
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export interface Item {
  id: string;
  title: string;
  url?: string;
  userId: string;
  createdAt: number; 
}

export const ItemRepository = {
  // Create a new item
  async createItem(title: string, url: string): Promise<string> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, "items"), {
      title,
      url,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(), 
    });
    
    return docRef.id;
  },

  // Fetch items for the current user
  async getUserItems(): Promise<Item[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const q = query(
      collection(db, "items"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        url: data.url,
        userId: data.userId,
        // Convert Firestore Timestamp to number (milliseconds) or fallback to now
        createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
      } as Item;
    });
  }
};