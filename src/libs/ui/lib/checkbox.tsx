"use client";

import MuiCheckbox, {
  CheckboxProps as MuiCheckboxProps,
} from "@mui/material/Checkbox";

import { CustomCssProps } from "@aces/types";

interface CheckboxProps
  extends Pick<
    MuiCheckboxProps,
    "size" | "checked" | "onChange" | "disabled" | "name" | "value" | "inputProps"
  > {
  style?: CustomCssProps;
}

export function Checkbox({ size = "medium", style, ...props }: CheckboxProps) {
  return <MuiCheckbox size={size} sx={style} {...props} />;
}
