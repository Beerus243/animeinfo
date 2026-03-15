"use client";

import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type UploadImageProps = {
  onUploaded: (url: string) => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
  compact?: boolean;
};

export default function UploadImage({ onUploaded, title, description, ctaLabel, compact = false }: UploadImageProps) {
  const { messages } = useLanguage();
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setProgress(0);
    setStatus(messages.upload.signing);

    const signatureResponse = await fetch("/api/upload/image", {
      method: "POST",
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
      event.target.value = "";
      return;
    }

    setStatus(messages.upload.failed);
    event.target.value = "";
  }

  return (
    <label
      className={compact
        ? "inline-flex cursor-pointer items-center rounded-full border border-line bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent hover:bg-accent-soft dark:bg-white/10"
        : "block cursor-pointer rounded-3xl border border-dashed border-line bg-white/50 px-4 py-5 text-sm text-muted transition hover:border-accent hover:bg-accent-soft/50 dark:bg-white/5 dark:hover:bg-white/10"}
    >
      {compact ? (
        <span>{ctaLabel || messages.upload.label}</span>
      ) : (
        <>
          {title ? <span className="block text-sm font-semibold text-foreground">{title}</span> : null}
          {description ? <span className="mt-1 block text-[13px] leading-6 text-muted">{description}</span> : null}
          <span className="mt-4 inline-flex items-center rounded-full border border-line bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            {ctaLabel || messages.upload.label}
          </span>
        </>
      )}
      <input className="sr-only" onChange={handleChange} type="file" accept="image/*" />
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