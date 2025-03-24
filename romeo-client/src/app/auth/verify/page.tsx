'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verify } from '@/services/authService';
import networkService from '@/services/networkService';

/**
 * Verification page component
 * This page is used to handle verification of magic links
 */
export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your magic link...');

  useEffect(() => {
    // Extract token from URL query parameters
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    // Function to verify the token
    const verifyToken = async () => {
      try {
        // Call the verify endpoint with the token
        const response = await verify(token);
        
        // If successful, store the token and user information
        if (response.success && response.data?.token) {
          networkService.setToken(response.data.token);
          
          setStatus('success');
          setMessage('Verification successful! Redirecting to dashboard...');
          
          // Redirect to home page or dashboard after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          throw new Error('Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verification failed.');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Magic Link Verification
        </h1>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          )}
          
          {status === 'success' && (
            <div className="text-green-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
          
          <p className="text-center text-gray-700">{message}</p>
          
          {status === 'error' && (
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 