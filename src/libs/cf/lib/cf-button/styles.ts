import { ButtonColor, ButtonVariant } from "@aces/ui";

/**
 * Kept out of `index.tsx` so `render.tsx` can import it without depending on
 * the module that imports `render.tsx` — that cycle crashes at runtime with a
 * temporal-dead-zone error rather than failing to compile.
 *
 * Values must match the `in` validation on `button.buttonStyle`.
 */
export enum ButtonStyleType {
  PrimaryOutline = "Primary Outline",
  Knockout = "Knockout",
  KnockoutOutline = "Knockout Outline",
}

export const buttonStyles: Record<
  ButtonStyleType,
  { color: ButtonColor; variant: ButtonVariant }
> = {
  [ButtonStyleType.PrimaryOutline]: { color: "primary", variant: "outlined" },
  [ButtonStyleType.Knockout]: { color: "secondary", variant: "contained" },
  [ButtonStyleType.KnockoutOutline]: { color: "secondary", variant: "outlined" },
};
