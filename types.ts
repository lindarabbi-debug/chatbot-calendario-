export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  description?: string;
  imageBase64?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
}

export interface Settings {
  triggerWord: string;
  summaryTime: string; // HH:MM
  summaryEnabled: boolean;
}

export enum AIActionType {
    CREATE_EVENT = 'CREATE_EVENT',
    READ_EVENTS = 'READ_EVENTS',
    SUMMARIZE_DAY = 'SUMMARIZE_DAY',
    OPEN_APP = 'OPEN_APP',
    GREETING = 'GREETING',
    UNKNOWN = 'UNKNOWN',
}

export interface AIResponse {
    action: AIActionType;
    eventDetails?: {
        title: string;
        date: string;
        time?: string;
        description?: string;
    };
    queryDate?: string;
    appName?: string;
    summary?: string;
    responseText?: string;
}

// Fix: Add type definitions for the Web Speech API to resolve compilation errors.
// By moving these definitions into `declare global`, they become available project-wide
// without needing to be explicitly imported, resolving compilation errors.
declare global {
  interface SpeechRecognitionAlternative {
    // FIX: Add readonly modifier to match built-in DOM types.
    readonly transcript: string;
    // FIX: Add readonly modifier to match built-in DOM types.
    readonly confidence: number;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    
    onresult: (event: SpeechRecognitionEvent) => void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;

    start: () => void;
    stop: () => void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}