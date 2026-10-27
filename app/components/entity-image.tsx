"use client";

import { useState } from "react";
import type { Kind } from "../../lib/contracts";

export function EntityImage({ src, kind }: { src?: string; kind: Kind }) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  let safe = false;
  try { safe = Boolean(src && new URL(src).protocol === "https:"); } catch {}
  return <span className={`entity-image entity-image-${kind}`} aria-hidden="true">
    {safe && failedUrl !== src ? <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(src)} /> : <span>{kind === "artist" ? "♪" : kind === "film" ? "▤" : "▣"}</span>}
  </span>;
}
