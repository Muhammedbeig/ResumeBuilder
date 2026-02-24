"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScaledPreviewDocumentProps = {
  elementId: string;
  withScale?: boolean;
  maxWidth?: number;
  pageWidth: number;
  pageHeight: number;
  getScale: (availableWidth?: number) => number;
  contentClassName: string;
  children: ReactNode;
};

export function ScaledPreviewDocument({
  elementId,
  withScale = true,
  maxWidth,
  pageWidth,
  pageHeight,
  getScale,
  contentClassName,
  children,
}: ScaledPreviewDocumentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastHeightRef = useRef(pageHeight);
  const [contentHeight, setContentHeight] = useState(pageHeight);

  useEffect(() => {
    if (!withScale) return;
    const element = contentRef.current;
    if (!element) return;

    const measure = () => {
      const nextHeight = Math.max(pageHeight, element.scrollHeight || pageHeight);
      if (Math.abs(nextHeight - lastHeightRef.current) < 1) return;
      lastHeightRef.current = nextHeight;
      setContentHeight(nextHeight);
    };

    const scheduleMeasure = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };

    scheduleMeasure();
    const observer = new ResizeObserver(() => scheduleMeasure());
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [withScale, pageHeight]);

  const scale = withScale ? getScale(maxWidth) : 1;
  const scaledWidth = pageWidth * scale;
  const scaledHeight = contentHeight * scale;

  return (
    <div
      className={withScale ? "overflow-hidden" : undefined}
      style={withScale ? { width: scaledWidth, height: scaledHeight } : undefined}
    >
      <div
        className={withScale ? "transition-transform duration-200" : undefined}
        style={
          withScale
            ? {
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: pageWidth,
              }
            : undefined
        }
      >
        <div ref={contentRef} id={elementId} className={contentClassName}>
          {children}
        </div>
      </div>
    </div>
  );
}
