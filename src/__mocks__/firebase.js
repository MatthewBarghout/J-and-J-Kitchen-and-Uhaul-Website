// Mock Firebase for testing
export const auth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn(); // unsubscribe function
  })
};

export const db = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ exists: false })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    })),
    add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
    onSnapshot: jest.fn(() => jest.fn())
  }))
};

export const functions = {
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: {} })))
};

export default {
  auth,
  db,
  functions
};