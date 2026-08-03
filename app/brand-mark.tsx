"use client";

import { useEffect, useRef, useState } from "react";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export function BrandMark({ name, logo }: { name: string; logo: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const showImage = Boolean(logo) && !imageFailed;

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setImageFailed(true);
  }, [logo]);

  return <>
    <span className={`brand-mark ${showImage ? "has-logo" : "fallback"}`} aria-hidden="true">
      {showImage
        ? <img ref={imageRef} src={logo!} alt="" loading="lazy" onError={() => setImageFailed(true)} />
        : <b>{initials(name)}</b>}
    </span>
    <strong>{name}</strong>
  </>;
}
