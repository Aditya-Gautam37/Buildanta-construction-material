"use client";

import { useEffect, useRef, useState } from "react";
import { brandShowroomImageFor } from "./brand-showroom-images";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export function BrandMark({ name, logo }: { name: string; logo: string | null }) {
  // The showroom crop is already tight to the logo, so object-fit: contain
  // sizes it correctly with no forced zoom — a manual CSS scale on the raw
  // (heavily padded) source logos was clipping past the frame at large
  // values (e.g. Polycab, Sika) instead of fitting inside it.
  const preferredLogo = brandShowroomImageFor(name) || logo;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const showImage = Boolean(preferredLogo) && failedSource !== preferredLogo;

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailedSource(preferredLogo);
  }, [preferredLogo]);

  return <>
    <span className={`brand-mark ${showImage ? "has-logo" : "fallback"}`} aria-hidden="true">
      {showImage
        ? <img ref={imageRef} src={preferredLogo!} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(preferredLogo)} />
        : <b>{initials(name)}</b>}
    </span>
    <strong>{name}</strong>
  </>;
}
