"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    synthRef.current = window.speechSynthesis;
    
    // Ensure cleanup on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported || !synthRef.current) return;
    
    // Stop any ongoing speech
    stop();

    if (!text.trim()) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      
      utterance.onstart = () => {
        setSpeaking(true);
      };
      
      utterance.onend = () => {
        setSpeaking(false);
      };
      
      utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setSpeaking(false);
      };

      synthRef.current.speak(utterance);
    } catch (e) {
      console.error("Failed to speak", e);
      setSpeaking(false);
    }
  }, [supported, stop]);

  return {
    supported,
    speaking,
    speak,
    stop,
  };
}
