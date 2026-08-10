"use client";

import { useEffect, useRef, useState } from "react";
import { curatedBrandLogoFor, curatedBrandLogoScaleFor } from "./brand-logos";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export function BrandMark({ name, logo }: { name: string; logo: string | null }) {
  const preferredLogo = curatedBrandLogoFor(name) || logo;
  const displayScale = curatedBrandLogoScaleFor(name);
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
        ? <img ref={imageRef} src={preferredLogo!} alt="" loading="lazy" decoding="async" style={{ transform: `scale(${displayScale})` }} onError={() => setFailedSource(preferredLogo)} />
        : <b>{initials(name)}</b>}
    </span>
    <strong>{name}</strong>
  </>;
}
