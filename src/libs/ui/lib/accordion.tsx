import React from "react";
import MuiAccordion, {
  AccordionProps as MuiAccordionProps,
} from "@mui/material/Accordion";
import MuiAccordionDetails, {
  AccordionDetailsProps as MuiAccordionDetailsProps,
} from "@mui/material/AccordionDetails";
import MuiAccordionSummary, {
  AccordionSummaryProps as MuiAccordionSummaryProps,
} from "@mui/material/AccordionSummary";

import { CustomCssProps } from "@aces/types";
import { Box, FlexBox, Icon, Text } from "@aces/ui";
import { palette } from "@aces/theme";

interface AccordionProps {
  style?: CustomCssProps;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  style,
  children,
  ...props
}) => {
  return (
    <Box style={style} {...props}>
      {children}
    </Box>
  );
};

interface AccordionItemProps
  extends Pick<MuiAccordionProps, "children" | "defaultExpanded"> {
  style?: CustomCssProps;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  style,
  children,
  defaultExpanded = false,
  ...props
}) => {
  return (
    <MuiAccordion defaultExpanded={defaultExpanded} sx={style} {...props}>
      {children}
    </MuiAccordion>
  );
};

interface AccordionItemTriggerProps
  extends Pick<MuiAccordionSummaryProps, "children"> {
  expandIconPosition?: "start" | "end";
  disableGutters?: boolean;
  style?: CustomCssProps;
}

export const AccordionItemTrigger: React.FC<AccordionItemTriggerProps> = ({
  expandIconPosition = "end",
  disableGutters = false,
  style,
  children,
  ...props
}) => {
  return (
    <MuiAccordionSummary
      expandIcon={false}
      sx={{
        ...(disableGutters && {
          paddingLeft: 0,
          paddingRight: 0,
        }),
        ...(expandIconPosition === "start" && {
          gap: 4,
          "& .MuiAccordionSummary-expandIconWrapper": {
            order: -1,
          },
        }),
        "& .collapsIconWrapper": {
          display: "block",
        },
        "& .expandIconWrapper": {
          display: "none",
        },
        "&.Mui-expanded .collapsIconWrapper": {
          display: "none",
        },
        "&.Mui-expanded .expandIconWrapper": {
          display: "block",
        },
        "&.Mui-expanded": {
          borderBottom: "none !important",
        },
        ...style,
      }}
      {...props}
    >
      <FlexBox
        alignItems={"center"}
        flexDirection={expandIconPosition === "start" ? "row-reverse" : "row"}
        justifyContent={
          expandIconPosition === "start" ? "flex-start" : "space-between"
        }
        width={"100%"}
      >
        <Text.SubtitleSmall component="div">{children}</Text.SubtitleSmall>
        <Box>
          <Box className="expandIconWrapper">
            <Icon icon="Remove" color={palette.primary.main} />
          </Box>
          <Box className="collapsIconWrapper">
            <Icon icon="Add" color={palette.primary.main} />
          </Box>
        </Box>
      </FlexBox>
    </MuiAccordionSummary>
  );
};

interface AccordionItemContentProps
  extends Pick<MuiAccordionDetailsProps, "children"> {
  style?: CustomCssProps;
}

export const AccordionItemContent: React.FC<AccordionItemContentProps> = ({
  style,
  children,
  ...props
}) => {
  return (
    <MuiAccordionDetails sx={style} {...props}>
      {children}
    </MuiAccordionDetails>
  );
};
