import { useState, useRef, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";

function VideoRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showRecorder, setShowRecorder] = useState(true);
  const [authorName, setAuthorName] = useState("");

  const [metadata, setMetadata] = useState({
    title: "",
    keywords: "",
    description: "",
    author: "",
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

const { profile } = useAuth();

useEffect(() => {
  if (profile) {
    const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email || "Unknown";
    setAuthorName(fullName);
    setMetadata(prev => ({ ...prev, author: fullName }));
  }
}, [profile]);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setShowRecorder(false);
        cleanupStream();
      };

      mediaRecorder.start(1000);
      setRecording(true);
      setTimeout(stopRecording, 1800000); // Auto-stop after 30 minutes
    } catch (err: any) {
      setError("Failed to access camera/microphone. Please check permissions.");
      console.error(err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setPaused(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!videoUrl) {
      setError("No video to save.");
      return;
    }

    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const timestamp = Date.now();
    const userId = auth.currentUser?.uid || "anonymous";
    const filePath = `videos/${userId}/${timestamp}.webm`;
    const storageRef = ref(storage, filePath);

    try {
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "videos"), {
        title: metadata.title,
        keywords: metadata.keywords.split(",").map(k => k.trim()),
        description: metadata.description,
        author: metadata.author,
        timestamp: serverTimestamp(),
        videoUrl: downloadURL,
        userId,
        filePath,
      });

      alert("Video and metadata saved successfully!");
      setVideoUrl(null);
      setShowRecorder(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save video. Please try again.");
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>DoctorNerves Video Recorder</h1>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
          {showRecorder && (
            <video ref={videoRef} style={{ width: "100%", borderRadius: "8px", border: "1px solid #ccc" }} controls></video>
          )}
          {videoUrl && (
            <video src={videoUrl} controls style={{ width: "100%", borderRadius: "8px", border: "1px solid #ccc" }}></video>
          )}

          {!recording && !videoUrl && (
            <button onClick={startRecording} style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px" }}>
              Start Recording
            </button>
          )}

          {recording && (
            <div style={{ marginTop: "10px" }}>
              {paused ? (
                <button onClick={resumeRecording} style={{ marginRight: "10px", padding: "10px 20px", backgroundColor: "orange", color: "white" }}>
                  Resume
                </button>
              ) : (
                <button onClick={pauseRecording} style={{ marginRight: "10px", padding: "10px 20px", backgroundColor: "orange", color: "white" }}>
                  Pause
                </button>
              )}
              <button onClick={stopRecording} style={{ padding: "10px 20px", backgroundColor: "red", color: "white" }}>
                Stop
              </button>
            </div>
          )}
        </div>

        {videoUrl && (
          <div style={{ flex: "1 1 45%", minWidth: "300px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3>Video Metadata</h3>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={metadata.title}
              onChange={handleMetadataChange}
              style={{ padding: "8px", width: "100%" }}
            />
            <input
              type="text"
              name="keywords"
              placeholder="Keywords (comma-separated)"
              value={metadata.keywords}
              onChange={handleMetadataChange}
              style={{ padding: "8px", width: "100%" }}
            />
            <textarea
              name="description"
              placeholder="Short Description"
              value={metadata.description}
              onChange={handleMetadataChange}
              rows={3}
              style={{ padding: "8px", width: "100%" }}
            />
            <input
              type="text"
              name="author"
              value={metadata.author}
              readOnly
              style={{ padding: "8px", width: "100%", backgroundColor: "#f0f0f0" }}
            />
            <button onClick={handleSave} style={{ padding: "10px 20px", backgroundColor: "green", color: "white" }}>
              Save Video and Metadata
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoRecorderPage;