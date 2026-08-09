import type { ReactNode } from "react";

type CommunityGalleryArchitectureProps = {
  children: ReactNode;
};

/**
 * Presentation boundary for the source-backed Community Gallery architecture.
 * The editable architecture account lives in community-gallery.md; this
 * component must not contain a second copy of those facts.
 */
export function CommunityGalleryArchitecture({
  children,
}: CommunityGalleryArchitectureProps) {
  return (
    <div className="knowledge-architecture-source" data-source-owner="community-gallery.md">
      {children}
    </div>
  );
}
