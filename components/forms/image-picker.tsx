"use client";

import { useEffect, useRef, useState } from "react";
import { CameraAddIcon, TrashBinTrashIcon } from "@solar-icons/react/linear";

import { CustomerAvatar } from "@/components/customer-avatar";
import { Button } from "@/components/ui/button";

const MAX_SIDE = 512;

/** Center-crops to a square and shrinks, so uploads stay around 50 KB. */
async function toAvatar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const target = Math.min(side, MAX_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = target;
  canvas.getContext("2d")!.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    target,
    target,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("Could not process image");
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export function ImagePicker({
  name,
  onChange,
}: {
  /** Used for the initials preview */
  name: string;
  onChange: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose an image file");
    try {
      const avatar = await toAvatar(file);
      setPreview(URL.createObjectURL(avatar));
      onChange(avatar);
    } catch {
      setError("Could not read that image");
    }
  }

  function clear() {
    setPreview(null);
    onChange(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <CustomerAvatar name={name || "?"} imageUrl={preview} size="xl" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <CameraAddIcon /> {preview ? "Change photo" : "Add photo"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <TrashBinTrashIcon /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Optional. JPG, PNG or WebP.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
