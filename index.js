// pages/index.js
import { useState, useEffect, useRef } from 'react';

const lines = [
  "We should ‘finish the ‘project for our ‘history ‘class",
  "‘Peter is re‘vising for his e‘xam ‘next ‘week.",
  "‘Students will ‘spend more ‘time ‘working with ‘other ‘classmates.",
  "I ‘like to ‘watch ‘videos that ‘help me ‘learn ‘new ‘things",
  "I have ‘installed some ‘apps on my ‘phone"
];

export default function Home() {
  const [activeLineIndex, setActiveLineIndex] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  // Initialize Web Speech API recognition if available
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until user stops
      recognition.interimResults = false; // Only final results
      recognition.lang = "en-US";
      
      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        setTranscript(finalTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  // Request microphone permission
  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      alert("Microphone access granted.");
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access denied.");
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setRecording(false);
    // When the recording stops, wait a brief moment for final results then evaluate
    setTimeout(() => {
      evaluatePronunciation();
    }, 500);
  };

  // Compare the spoken transcript with the expected line text
  const evaluatePronunciation = () => {
    if (activeLineIndex === null) return;
    // Remove the special “‘” characters to compare pure words
    const expectedText = lines[activeLineIndex].replace(/‘/g, "'");
    const recognizedText = transcript.trim();
    
    // Split texts into words (ignoring extra spaces and punctuation)
    const expectedWords = expectedText.split(/\s+/);
    const recognizedWords = recognizedText.split(/\s+/);
    
    // Very simple comparison: if a word (ignoring case) does not match, mark it as mispronounced.
    const errors = expectedWords.map((word, idx) => {
      // Remove punctuation from word for a fair comparison
      const cleanExpected = word.replace(/[.,?!]/g, "");
      const cleanRecognized = (recognizedWords[idx] || "").replace(/[.,?!]/g, "");
      return cleanExpected.toLowerCase() === cleanRecognized.toLowerCase() ? null : word;
    }).filter(word => word !== null);

    setFeedbacks(prev => ({
      ...prev,
      [activeLineIndex]: { recognizedText, errors }
    }));
  };

  // Helper function to format each line by highlighting stressed syllables
  const formatLine = (line) => {
    // Replace occurrences of “‘word” with a span wrapped version.
    // We assume each stressed syllable is prefixed by the special character.
    const formatted = line.replace(/‘(\S+)/g, "<span class='stress'>'$1</span>");
    return formatted;
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Pronunciation Checker</h1>
        <img src="/ai-robot.png" alt="AI Robot" className="robot-image" />
      </header>
      <main className="content">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`line-box ${activeLineIndex === index ? "active" : ""}`}
            onClick={() => setActiveLineIndex(index)}
          >
            <p
              dangerouslySetInnerHTML={{ __html: formatLine(line) }}
            ></p>
            {feedbacks[index] && (
              <div className="feedback">
                <p>
                  <strong>Your reading:</strong> {feedbacks[index].recognizedText}
                </p>
                {feedbacks[index].errors.length > 0 ? (
                  <p>
                    <strong>Mispronounced words:</strong>{" "}
                    {feedbacks[index].errors.join(", ")}
                  </p>
                ) : (
                  <p>
                    <strong>Excellent!</strong> All words pronounced correctly!
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </main>
      <div className="controls">
        <button onClick={requestMicrophoneAccess}>
          Request Microphone Access
        </button>
        {!recording ? (
          <button onClick={startRecording} disabled={activeLineIndex === null}>
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
      </div>

      {/* CSS-in-JS styling */}
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72, #2a5298);
          color: #fff;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          position: relative;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .robot-image {
          width: 80px;
          height: 80px;
        }
        .content {
          margin-top: 30px;
        }
        .line-box {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s, background 0.3s;
          cursor: pointer;
        }
        .line-box.active {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px);
        }
        .line-box:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .feedback {
          margin-top: 10px;
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 5px;
          font-size: 0.9rem;
        }
        .controls {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
          z-index: 100;
        }
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          background: #ff5722;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover:not(:disabled) {
          background: #e64a19;
        }
        button:disabled {
          background: #999;
          cursor: not-allowed;
        }
        .stress {
          color: #ffd700;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
