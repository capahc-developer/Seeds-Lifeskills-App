import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase';


const StudentProfileContext = createContext(null);


export const emptyStudentProfile = {
  name: '',
  age: '',
  gender: 'not-specified',
  strengths: '',
  barriers: '',
  interests: '',
  avatar: '🌱',
};


// Each adult has one student profile.
// The old shared currentStudent document is never read.

export function StudentProfileProvider({
  children,
  userId,
}) {

  const [profile, setProfile] =
    useState(emptyStudentProfile);

  const [loading, setLoading] =
    useState(Boolean(userId));

  const [error, setError] =
    useState(null);


  useEffect(() => {

    let active = true;

    setProfile(emptyStudentProfile);
    setError(null);
    setLoading(Boolean(userId));


    if (userId) {

      getDoc(
        doc(
          db,
          'studentProfiles',
          userId
        )
      )

        .then((snapshot) => {

          if (!active) {
            return;
          }


          const data =
            snapshot.exists()
              ? snapshot.data()
              : {};


          setProfile({

            name:
              data.name || '',

            age:
              data.age == null
                ? ''
                : String(data.age),

            gender:
              data.gender ||
              'not-specified',

            strengths:
              data.strengths || '',

            barriers:
              data.barriers || '',

            interests:
              data.interests || '',

            avatar:
              data.avatar || '🌱',

          });

        })

        .catch((cause) => {

          if (active) {
            setError(cause);
          }

        })

        .finally(() => {

          if (active) {
            setLoading(false);
          }

        });

    }


    return () => {
      active = false;
    };

  }, [userId]);


  async function saveProfile(
    nextProfile
  ) {

    if (!userId) {

      throw new Error(
        'Sign in before saving a student profile.'
      );

    }


    const saved = {

      name:
        nextProfile.name.trim(),

      age:
        nextProfile.age
          ? Number(
              nextProfile.age
            )
          : null,

      gender:
        nextProfile.gender ||
        'not-specified',

      strengths:
        nextProfile.strengths.trim(),

      barriers:
        nextProfile.barriers.trim(),

      interests:
        nextProfile.interests.trim(),

      avatar:
        nextProfile.avatar || '🌱',

    };


    await setDoc(

      doc(
        db,
        'studentProfiles',
        userId
      ),

      {
        ...saved,

        updatedAt:
          serverTimestamp(),
      },

      {
        merge: true,
      }

    );


    setProfile({

      ...saved,

      age:
        saved.age == null
          ? ''
          : String(saved.age),

    });

  }


  const value = useMemo(

    () => ({

      profile,
      loading,
      error,
      saveProfile,

    }),

    [
      profile,
      loading,
      error,
      userId,
    ]

  );


  return (

    <StudentProfileContext.Provider
      value={value}
    >

      {children}

    </StudentProfileContext.Provider>

  );

}


export function useStudentProfile() {

  const value =
    useContext(
      StudentProfileContext
    );


  if (!value) {

    throw new Error(
      'useStudentProfile must be used inside StudentProfileProvider'
    );

  }


  return value;

}