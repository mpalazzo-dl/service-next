"use client";

import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfInfoPanelProps, InfoPanelType } from "./render";
import { generateId } from "@aces/utils";
import { Box, FlexBox, Icon, IconEnum } from "@aces/ui";

import { CfRichTextRenderClient } from "../cf-rich-text-render/client";

/**
 * Callout used inside Knowledge article bodies — the KB equivalent of an
 * admonition. `type` drives colour, icon and the accessibility role: Danger
 * announces assertively, the other two are polite.
 */
const PANEL_STYLES: Record<
  InfoPanelType,
  { icon: keyof typeof IconEnum; color: string; background: string; role: string }
> = {
  Info: {
    icon: "InfoOutlined",
    color: "info.main",
    background: "info.light",
    role: "status",
  },
  Warning: {
    icon: "WarningOutlined",
    color: "warning.dark",
    background: "warning.light",
    role: "status",
  },
  Danger: {
    icon: "ReportProblemOutlined",
    color: "error.main",
    background: "error.light",
    role: "alert",
  },
};

export const CfInfoPanelRenderClient = ({
  internalTitle,
  type = "Info",
  text,
  __typename,
  id,
  lang,
  preview,
}: CfInfoPanelProps) => {
  const style = PANEL_STYLES[type] ?? PANEL_STYLES.Info;

  return (
    <Box
      id={generateId(internalTitle)}
      data-component={__typename}
      role={style.role}
      marginY={4}
      padding={4}
      borderRadius={1}
      style={{
        backgroundColor: style.background,
        borderLeft: "4px solid",
        borderLeftColor: style.color,
      }}
    >
      <FlexBox gap={3} alignItems={"flex-start"}>
        <Icon icon={style.icon} color={style.color} size={22} aria-hidden />
        <Box style={{ flex: 1 }}>
          {text && (
            <CfRichTextRenderClient
              richTextDocument={text.json}
              lang={lang}
              preview={preview}
              {...ContentfulLivePreview.getProps({
                entryId: id,
                fieldId: "text",
                locale: lang,
              })}
            />
          )}
        </Box>
      </FlexBox>
    </Box>
  );
};
