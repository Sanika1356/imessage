import { useState, useRef, useEffect } from "react";
import { Mic, X, Send } from "lucide-react";
import toast from "react-hot-toast";

export function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access microphone");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoice(audioBlob);
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 px-4 py-3 rounded-lg">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              Recording...
            </span>
          </div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {formatTime(recordingTime)}
          </span>
          <div className="flex-1" />
          <button
            onClick={stopRecording}
            className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
          >
            <Mic className="h-5 w-5" />
          </button>
        </>
      ) : audioBlob ? (
        <>
          <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1" />
          <button
            onClick={handleCancel}
            className="rounded-full p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={handleSend}
            className="rounded-full bg-green-600 p-2 text-white hover:bg-green-700"
          >
            <Send className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
