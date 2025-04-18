interface SpeechToTextOptions {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  language?: string;
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private options: SpeechToTextOptions;

  constructor(options: SpeechToTextOptions) {
    this.options = options;
    this.initRecognition();
  }

  private initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.options.onError('Speech recognition is not supported in this browser.');
      return;
    }

    // @ts-ignore - SpeechRecognition is not in the TypeScript types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.language || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.options.onStart();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        this.options.onResult(transcript);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.options.onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.options.onEnd();
      };
    }
  }

  public start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Speech recognition start error:', error);
        this.options.onError('Failed to start speech recognition.');
      }
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Speech recognition stop error:', error);
      }
    }
  }

  public toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  public isSupported(): boolean {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }
}

export default SpeechToTextService;
