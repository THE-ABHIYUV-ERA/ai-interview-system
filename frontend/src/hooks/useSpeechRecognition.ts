"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Extend the Window interface for SpeechRecognition since it's not standard yet
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition({ onResult }: { onResult: (text: string, isFinal: boolean) => void }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until stopped
      recognition.interimResults = true; // Send partial results
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          onResult(finalTranscript, true);
        }
        if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. You can continue by typing your answer.');
        } else if (event.error === 'no-speech') {
          // just ignore no-speech, it happens when silent
        } else if (event.error === 'network') {
          setError('Voice recognition is temporarily unavailable.');
        } else {
          setError('Voice input could not be started.');
        }
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current || listening) return;
    try {
      recognitionRef.current.start();
      setError(null);
    } catch (err) {
      setError('Voice input could not be started.');
      setListening(false);
    }
  }, [supported, listening]);

  const stop = useCallback(() => {
    if (!supported || !recognitionRef.current || !listening) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      // ignore
    }
  }, [supported, listening]);

  return {
    supported,
    listening,
    error,
    start,
    stop,
  };
}
