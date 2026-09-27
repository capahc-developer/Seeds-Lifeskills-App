import { collection } from 'firebase/firestore';
import { auth, db } from './firebase';

export function practiceLogsForCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to view practice logs.');
  return collection(db, 'users', user.uid, 'practiceLog');
}

export function practicePlansForCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to view practice plans.');
  return collection(db, 'users', user.uid, 'practicePlans');
}
