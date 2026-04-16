import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to local to ensure the session is saved across reloads
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Erro ao definir persistência do Firebase Auth:", err);
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile) {
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, profile, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    throw error;
  }
}

export async function saveVideo(video: any) {
  try {
    const docRef = doc(collection(db, 'videos'));
    await setDoc(docRef, {
      ...video,
      id: docRef.id,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar vídeo:", error);
    throw error;
  }
}

export async function isUsernameAvailable(username: string, currentUid?: string): Promise<boolean> {
  if (username.length < 3) return false;
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return true;
  if (currentUid && querySnapshot.docs[0].id === currentUid) return true;
  
  return false;
}
