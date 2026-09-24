import { Inter } from "next/font/google";
import { createTheme, lighten } from "@mui/material/styles";

import { PaletteMode, Shape, Size } from "@aces/types";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }
}

interface CustomPalette {
  gradient: {
    primaryMainLight90: string;
  };
  tertiary: {
    grayblue: string;
    yellow: string;
  };
  foreground: {
    default: string;
  };
  border: {
    light: string;
    default: string;
    input: string;
  };
}

declare module "@mui/material/styles/createPalette" {
  interface ColorRange {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  }

  interface Palette extends CustomPalette {}
  interface PaletteOptions extends CustomPalette {}
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    light: true;
    gradient: true;
  }

  interface ButtonOwnProps {
    shape?: Shape;
  }
}

declare module "@mui/material/IconButton" {
  interface IconButtonPropsColorOverrides {
    light: true;
  }

  interface IconButtonOwnProps {
    variant?: "standard" | "contained" | "outlined";
    shape?: Shape;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    light: true;
  }

  interface ChipOwnProps {
    shape?: Shape;
  }
}

declare module "@mui/material/Backdrop" {
  interface BackdropOwnProps {
    mode: PaletteMode;
  }
}

declare module "@mui/material/FormControlLabel" {
  interface FormControlLabelProps {
    size?: Size;
  }
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    textTransform?: string;
  }

  interface TypographyVariantsOptions {
    textTransform?: string;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    caption2: true;
  }
}

const defaultTheme = createTheme();

/**
 * Inter for everything. A help center is read, not admired — one neutral
 * UI face at a modest scale beats a display face at marketing sizes.
 * `headerFont` is kept as a separate export so call sites need not change.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-primary",
});

export const primaryFont = inter;
export const headerFont = inter;

export const fontWeights = {
  thin: 100,
  extraLight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
};

export const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1080,
    xl: 1440,
    xxl: 1920,
  },
};

export const componentSpacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 24,
  xxl: 34,
};

export const containerPadding = {
  xs: 5,
  sm: 8,
  md: 15,
  lg: 15,
  xl: 15,
};

export const spacing = 4;

/** Comfortable reading measure for article bodies. */
export const maxTextWidth = "720px";

export const common = {
  white: "#ffffff",
  black: "#000000",
};

export const primary = {
  light: "#5293C7",
  main: "#1F73B7",
  dark: "#144A75",
};

export const secondary = {
  light: "#5EAE91",
  main: "#038153",
  dark: "#04502E",
};

export const tertiary = {
  grayblue: "#F8F9F9",
  yellow: "#FFB648",
};

export const red = {
  light: "#FCDDD8",
  main: "#CC3340",
  dark: "#8C232C",
};

export const amber = {
  light: "#FFF7ED",
  main: "#AD5E18",
  dark: "#703B10",
};

export const blue = {
  light: "#EDF7FF",
  main: "#1F73B7",
  dark: "#144A75",
};

export const green = {
  light: "#DDF0E5",
  main: "#038153",
  dark: "#04502E",
};

export const grey = {
  50: "#FFFFFF",
  100: "#F8F9F9",
  200: "#F1F3F5",
  300: "#E9EBED",
  400: "#D8DCDE",
  500: "#C2C8CC",
  600: "#87929D",
  700: "#68737D",
  800: "#49545C",
  900: "#2F3941",
  950: "#1B1F23",
};

export const gradient = {
  primaryMainLight90: `linear-gradient(90deg, ${primary.main} 0%, ${primary.light} 100%)`,
  primaryMainLight270: `linear-gradient(270deg, ${primary.main} 0%, ${primary.light} 100%)`,
  tertiaryBlueGray90: `linear-gradient(90deg, ${tertiary.grayblue} 0%, ${lighten(tertiary.grayblue, 0.5)} 100%)`,
};

export const palette = {
  mode: "light",
  common: {
    white: common.white,
    black: common.black,
  },
  primary: {
    light: primary.light,
    main: primary.main,
    dark: primary.dark,
    contrastText: common.white,
  },
  secondary: {
    main: secondary.main,
    light: secondary.light,
    dark: secondary.dark,
    contrastText: common.white,
  },
  tertiary: {
    grayblue: tertiary.grayblue,
    yellow: tertiary.yellow,
  },
  error: {
    light: red.light,
    main: red.main,
    dark: red.dark,
    contrastText: common.white,
  },
  success: {
    light: green.light,
    main: green.main,
    dark: green.dark,
    contrastText: common.white,
  },
  warning: {
    light: amber.light,
    main: amber.main,
    dark: amber.dark,
    contrastText: common.white,
  },
  info: {
    light: blue.light,
    main: blue.main,
    dark: blue.dark,
    contrastText: common.white,
  },
  grey: {
    ...grey,
  },
  gradient: {
    primaryMainLight90: gradient.primaryMainLight90,
    primaryMainLight270: gradient.primaryMainLight270,
    tertiaryBlueGray90: gradient.tertiaryBlueGray90,
  },
  divider: grey[400],
  text: {
    primary: grey[900],
    secondary: grey[700],
  },
  background: {
    default: common.white,
    paper: common.white,
  },
  foreground: {
    default: grey[900],
  },
  border: {
    light: grey[300],
    default: grey[400],
    input: grey[500],
  },
};

export const shape = {
  borderRadius: 4,
};

/**
 * Help-center type scale. The previous scale peaked at 100px, which suits a
 * marketing hero and actively hurts a page of instructions — headings need to
 * separate sections, not dominate them. Body copy sits at 15-16px with loose
 * leading for sustained reading.
 */
export const typography = {
  fontFamily: primaryFont.style.fontFamily,
  h1: {
    fontFamily: headerFont.style.fontFamily,
    fontSize: defaultTheme.typography.pxToRem(32),
    lineHeight: 1.25,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    [`@media (max-width:${breakpoints.values.md}px)`]: {
      fontSize: defaultTheme.typography.pxToRem(26),
    },
  },
  h2: {
    fontFamily: headerFont.style.fontFamily,
    fontSize: defaultTheme.typography.pxToRem(22),
    lineHeight: 1.35,
    fontWeight: 600,
    letterSpacing: "-0.005em",
    [`@media (max-width:${breakpoints.values.md}px)`]: {
      fontSize: defaultTheme.typography.pxToRem(20),
    },
  },
  h3: {
    fontFamily: headerFont.style.fontFamily,
    fontSize: defaultTheme.typography.pxToRem(18),
    lineHeight: 1.4,
    fontWeight: 600,
  },
  h4: {
    fontFamily: headerFont.style.fontFamily,
    fontSize: defaultTheme.typography.pxToRem(16),
    lineHeight: 1.45,
    fontWeight: 600,
  },
  h5: {
    fontFamily: headerFont.style.fontFamily,
    fontSize: defaultTheme.typography.pxToRem(15),
    lineHeight: 1.45,
    fontWeight: 600,
  },
  h6: {
    fontFamily: primaryFont.style.fontFamily,
    fontSize: defaultTheme.typography.pxToRem(14),
    lineHeight: 1.45,
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(16),
    lineHeight: 1.6,
  },
  // Header navigation. Deliberately sentence case — the uppercase tracking
  // this carried before reads as a marketing nav, not a support site.
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    lineHeight: 1.5,
    fontWeight: 500,
    letterSpacing: 0,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(15),
    lineHeight: 1.6,
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(16),
    lineHeight: 1.7,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    lineHeight: 1.5,
  },
  caption2: {
    fontSize: defaultTheme.typography.pxToRem(13),
    lineHeight: 1.5,
  },
  link: {
    color: palette.primary.main,
    "&:hover": {
      color: palette.primary.dark,
    },
  },
};
