"use client";

import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type UploadImageProps = {
  onUploaded: (url: string) => void;
};

export default function UploadImage({ onUploaded }: UploadImageProps) {
  const { messages } = useLanguage();
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus(messages.upload.signing);

    const adminToken = window.localStorage.getItem("animeinfo-admin-token") || "";

    const signatureResponse = await fetch("/api/upload/image", {
      method: "POST",
      headers: { "x-admin-token": adminToken },
    });
    const signature = await signatureResponse.json();

    if (!signatureResponse.ok) {
      setStatus(signature.error || messages.upload.signatureFailed);
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    payload.append("api_key", signature.apiKey);
    payload.append("timestamp", String(signature.timestamp));
    payload.append("signature", signature.signature);
    payload.append("folder", signature.folder);

    setStatus(messages.upload.uploading);

    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
      request.upload.addEventListener("progress", (uploadEvent) => {
        if (!uploadEvent.lengthComputable) {
          return;
        }

        setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
      });
      request.addEventListener("load", () => {
        try {
          resolve(JSON.parse(request.responseText));
        } catch (error) {
          reject(error);
        }
      });
      request.addEventListener("error", () => reject(new Error("Upload failed")));
      request.send(payload);
    });

    if (data.secure_url) {
      onUploaded(String(data.secure_url));
      setProgress(100);
      setStatus(messages.upload.uploaded);
      return;
    }

    setStatus(messages.upload.failed);
  }

  return (
    <label className="block rounded-2xl border border-dashed border-line bg-white/50 px-4 py-5 text-sm text-muted">
      {messages.upload.label}
      <input className="mt-3 block w-full" onChange={handleChange} type="file" accept="image/*" />
      {progress > 0 && progress < 100 ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <span className="mt-2 block text-xs">{progress}%</span>
        </div>
      ) : null}
      {status ? <span className="mt-3 block">{status}</span> : null}
    </label>
  );
}