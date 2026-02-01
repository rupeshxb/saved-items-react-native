import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// 1. Define the User Shape (Good Practice for consistency)
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  createdAt: any;
}

export const AuthRepository = {
  
  // 2. Check if username is taken
  async isUsernameAvailable(username: string): Promise<boolean> {
    const q = query(
        collection(db, "users"), 
        where("username", "==", username.toLowerCase().trim())
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // 3. Register User
  async register(email: string, password: string, username: string) {
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    try {
        // A. Check uniqueness first
        const isAvailable = await this.isUsernameAvailable(cleanUsername);
        if (!isAvailable) {
            throw new Error("Username is already taken.");
        }

        // B. Create Auth User (Firebase Authentication)
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // C. Save User Profile to Firestore
        // Using setDoc with user.uid is BEST PRACTICE. 
        // It ensures the Document ID matches the Auth ID, satisfying security rules.
        const newUserProfile: UserProfile = {
            username: cleanUsername,
            email: cleanEmail,
            uid: user.uid,
            createdAt: serverTimestamp() // Use Server Time, not Phone Time
        };

        await setDoc(doc(db, "users", user.uid), newUserProfile);
        
        // D. Update Auth Profile (so user.displayName works immediately in the app)
        await updateProfile(user, { displayName: cleanUsername });
        
        return user;

    } catch (error: any) {
        // Clean up Firebase errors for the UI
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('That email address is already in use!');
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('That email address is invalid!');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('Password should be at least 6 characters.');
        }
        throw error; // Throw other errors (like "Username taken") as is
    }
  },
  
  // 4. Find User by Username OR Email
  async findUserByIdentity(identity: string): Promise<{ uid: string, email: string } | null> {
    const searchTerm = identity.toLowerCase().trim();
    const usersRef = collection(db, "users");

    // Check by username
    const userQuery = query(usersRef, where("username", "==", searchTerm));
    const userSnap = await getDocs(userQuery);
    
    if (!userSnap.empty) {
      const data = userSnap.docs[0].data();
      return { uid: data.uid, email: data.email };
    }

    // Check by email
    const emailQuery = query(usersRef, where("email", "==", searchTerm));
    const emailSnap = await getDocs(emailQuery);
    
    if (!emailSnap.empty) {
      const data = emailSnap.docs[0].data();
      return { uid: data.uid, email: data.email };
    }

    return null; // User not found
  }
};