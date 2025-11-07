'use client';

import { useEffect, useState } from 'react';
import { auth, firestore } from '@/lib/firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [testResults, setTestResults] = useState<{
    auth: boolean;
    firestore: boolean;
  }>({
    auth: false,
    firestore: false,
  });

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    setStatus('Testing Firebase connection...');
    const results = { auth: false, firestore: false };

    try {
      // Test Authentication
      setStatus('Testing Authentication...');
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        results.auth = true;
        console.log('✅ Auth connected:', userCredential.user.uid);
      }

      // Test Firestore
      setStatus('Testing Firestore...');
      const testCollection = collection(firestore, 'test');
      const docRef = await addDoc(testCollection, {
        test: true,
        timestamp: new Date(),
      });

      if (docRef.id) {
        results.firestore = true;
        console.log('✅ Firestore connected:', docRef.id);

        // Read test
        const snapshot = await getDocs(testCollection);
        console.log('✅ Firestore read test: ', snapshot.size, 'documents');
      }

      setTestResults(results);
      setStatus('Firebase connection test complete!');
    } catch (error) {
      console.error('Firebase test error:', error);
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Firebase Connection Test</h1>

          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold mb-4">{status}</p>

            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span>Authentication:</span>
                <span className={testResults.auth ? 'text-green-600' : 'text-red-600'}>
                  {testResults.auth ? '✅ Connected' : '❌ Not Connected'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Firestore:</span>
                <span className={testResults.firestore ? 'text-green-600' : 'text-red-600'}>
                  {testResults.firestore ? '✅ Connected' : '❌ Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={testFirebaseConnection}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Re-test Connection
          </button>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Note: Make sure to add your Firebase configuration to .env.local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}