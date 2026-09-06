import * as React from "react";

import { cn } from "@/lib/utils";
import { CHRONICLE_DARK, CHRONICLE_SURFACE_BUTTON_CLASS } from "./chronicle-dark-ui";

export const ChronicleSurfaceButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(CHRONICLE_SURFACE_BUTTON_CLASS, className)}
    {...props}
  >
    {children}
  </button>
));
ChronicleSurfaceButton.displayName = "ChronicleSurfaceButton";

export function ChronicleDarkShell({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-[24px]", className)}
      style={{
        background: CHRONICLE_DARK.shell,
        boxShadow: CHRONICLE_DARK.shellShadow,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
