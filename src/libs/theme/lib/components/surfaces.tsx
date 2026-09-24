import { Components, Theme } from "@mui/material";
import { palette, shape } from "../config";

/* eslint-disable import/prefer-default-export */
export const surfacesCustomizations: Components<Theme> = {
  MuiAccordion: {
    defaultProps: {
      disableGutters: true,
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundColor: "transparent",
        boxShadow: "none",
        margin: 0,
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      expandIconWrapper: {
        color: "inherit",
      },
      root: {
        borderTop: `1px solid ${palette.border.default} !important`,
        borderBottom: `1px solid ${palette.border.default} !important`,
        borderRight: `1px solid ${palette.border.default} !important`,
        borderLeft: `1px solid ${palette.border.default} !important`,
        borderRadius: shape.borderRadius,
        padding: "14px 18px !important",
        fontWeight: 500,
        "&:hover": {
          backgroundColor: palette.grey[100],
        },
      },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        background: `${palette.common.white} !important`,
        paddingRight: "20px !important",
        paddingLeft: "20px !important",
        borderBottom: `1px solid ${palette.border.default} !important`,
        borderRight: `1px solid ${palette.border.default} !important`,
        borderLeft: `1px solid ${palette.border.default} !important`,
        borderRadius: `0 0 ${shape.borderRadius} ${shape.borderRadius}`,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      elevation1: {
        boxShadow: "0 1px 3px rgba(47, 57, 65, 0.08)",
      },
      elevation2: {
        boxShadow: "0 4px 12px rgba(47, 57, 65, 0.12)",
      },
    },
  },
  // Help-center cards are defined by a hairline border, not a drop shadow;
  // a page of shadowed cards reads as a dashboard.
  MuiCard: {
    styleOverrides: {
      root: {
        boxShadow: "none",
        border: `1px solid ${palette.border.default}`,
        borderRadius: shape.borderRadius,
        transition: "border-color 120ms ease, box-shadow 120ms ease",
      },
    },
  },
};
