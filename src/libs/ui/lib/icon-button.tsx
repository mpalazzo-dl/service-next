import React from "react";
import MuiIconButton, {
  IconButtonProps as MuiIconButtonProps,
} from "@mui/material/IconButton";

import { CustomCssProps } from "@aces/types";

export interface IconButtonProps
  extends Pick<
    MuiIconButtonProps,
    | "id"
    | "color"
    | "size"
    | "variant"
    | "shape"
    | "onClick"
    | "children"
    | "aria-label"
    | "disabled"
  > {
  style?: CustomCssProps;
}

export const IconButton = React.forwardRef(
  (
    {
      color = "primary",
      size = "medium",
      shape = "circular",
      variant = "standard",
      style,
      onClick,
      children,
      id,
      disabled,
    }: IconButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <MuiIconButton
        id={id}
        ref={ref}
        color={color}
        size={size}
        shape={shape}
        variant={variant}
        sx={style}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </MuiIconButton>
    );
  },
);

IconButton.displayName = "IconButton";
