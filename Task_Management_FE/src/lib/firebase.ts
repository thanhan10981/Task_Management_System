import { env } from '@/constants/env'
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import type { FirebaseError } from 'firebase/app'

export class FirebasePopupClosedError extends Error {
  constructor() {
    super('Firebase popup was closed by the user.')
    this.name = 'FirebasePopupClosedError'
  }
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)

isSupported().then((supported) => {
  if (supported) {
    getAnalytics(firebaseApp)
  }
})

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const result = await signInWithPopup(firebaseAuth, provider)
    return result.user.getIdToken()
  } catch (error) {
    const firebaseError = error as FirebaseError

    if (firebaseError.code === 'auth/configuration-not-found') {
      throw new Error('Firebase Authentication is not enabled for this project. Enable Google sign-in in Firebase Console.')
    }

    if (firebaseError.code === 'auth/popup-closed-by-user') {
      throw new FirebasePopupClosedError()
    }

    throw error
  }
}

function translateFirebaseAuthError(error: unknown) {
  const firebaseError = error as FirebaseError

  if (firebaseError.code === 'auth/configuration-not-found') {
    return new Error('Firebase Authentication is not enabled for this project. Enable the sign-in provider in Firebase Console.')
  }

  if (firebaseError.code === 'auth/invalid-credential') {
    return new Error('Invalid email or password.')
  }

  if (firebaseError.code === 'auth/email-already-in-use') {
    return new Error('Email is already in use.')
  }

  if (firebaseError.code === 'auth/user-not-found') {
    return new Error('No account was found for this email.')
  }

  if (firebaseError.code === 'auth/too-many-requests') {
    return new Error('Too many attempts. Please try again later.')
  }

  return error
}

export async function signInWithEmailPassword(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return result.user.getIdToken()
  } catch (error) {
    throw translateFirebaseAuthError(error)
  }
}

export async function registerWithEmailPassword(fullName: string, email: string, password: string) {
  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await updateProfile(result.user, { displayName: fullName })
    return result.user.getIdToken(true)
  } catch (error) {
    throw translateFirebaseAuthError(error)
  }
}

export async function sendFirebasePasswordResetEmail(email: string) {
  try {
    await sendPasswordResetEmail(firebaseAuth, email)
  } catch (error) {
    throw translateFirebaseAuthError(error)
  }
}
