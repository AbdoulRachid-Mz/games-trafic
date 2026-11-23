// @/components/ui/visually-hidden.tsx

import * as React from "react";

export const VisuallyHidden = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  function VisuallyHidden({ children, ...props }, ref) {
    return (
      <span
        ref={ref}
        {...props}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
          ...props.style,
        }}
      >
        {children}
      </span>
    );
  }
);
VisuallyHidden.displayName = "VisuallyHidden";
