import { Components, Theme } from "@mui/material";

export const inputsCustomizations: Components<Theme> = {
  /**
   * The previous override drew a border on the Checkbox root, which wraps the
   * SVG icon — so every box rendered as an empty square inside another empty
   * square, with the check never visible. Styling the icon itself instead
   * gives one box that actually reflects its state.
   */
  MuiCheckbox: {
    defaultProps: {
      disableRipple: true,
      size: "small",
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 6,
        color: theme.palette.border.input,
        "& .MuiSvgIcon-root": {
          fontSize: 20,
          borderRadius: 3,
        },
        "&:hover": {
          backgroundColor: "transparent",
          color: theme.palette.primary.main,
        },
        "&.Mui-checked": {
          color: theme.palette.primary.main,
        },
        "&.Mui-focusVisible .MuiSvgIcon-root": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }),
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.primary,
        "&.Mui-focused": {
          color: "inherit",
        },
        variants: [
          {
            props: { size: "small" },
            style: {
              fontSize: theme.typography.body2.fontSize,
            },
          },
        ],
      }),
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.primary,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        "&.Mui-focused": {
          color: theme.palette.text.primary,
        },
      }),
      focused: ({ theme }) => ({
        color: theme.palette.text.primary,
      }),
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        margin: 0,
        "&:hover .MuiCheckbox-root": {
          borderColor: theme.palette.primary.main,
        },
        variants: [
          {
            props: { size: "small" },
            style: {
              marginLeft: "-0.375rem",
            },
          },
          {
            props: { size: "medium" },
            style: {
              marginLeft: "-7px",
            },
          },
          {
            props: { size: "large" },
            style: {
              marginLeft: "-0.5rem",
            },
          },
        ],
      }),
      label: ({ theme }) => ({
        marginTop: "0.125rem",
        fontSize: theme.typography.body2.fontSize,
        "&.Mui-disabled": {
          color: theme.palette.text.primary,
        },
      }),
    },
  },
};
