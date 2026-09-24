import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfBaseComponent } from "@aces/types";
import { typography } from "@aces/theme";
import { Box, FlexBox } from "@aces/ui";

import { CfMenuItemType, isCfMenuItem, MenuLink } from "../menus";

interface PrivacyNavigationProps extends Pick<CfBaseComponent, "id" | "lang"> {
  data: CfMenuItemType[];
}

export const PrivacyNavigation = ({
  data,
  id,
  lang,
}: PrivacyNavigationProps) => {
  return (
    <FlexBox
      alignItems="center"
      justifyContent={{ xs: "center", md: "flex-end" }}
      flexDirection={{ xs: "column", md: "row" }}
      marginTop={{ xs: 1, md: 5 }}
      {...ContentfulLivePreview.getProps({
        entryId: id,
        fieldId: "privacyNavigation",
        locale: lang,
      })}
    >
      {data.map((item, index) => {
        const typename = item.__typename;

        if (!typename) {
          return null;
        }

        switch (typename) {
          case "MenuItem":
            if (isCfMenuItem(item)) {
              return (
                <Box
                  key={index}
                  style={{
                    marginLeft: { xs: 0, md: index !== 0 ? 8 : 0 },
                    marginTop: { xs: 2, md: 0 },
                  }}
                >
                  <MenuLink
                    link={item.link}
                    title={item.title}
                    lang={lang}
                    fontSize={typography.caption2.fontSize}
                    hoverEffect
                  />
                </Box>
              );
            }
            break;
          default:
            return null;
        }
      })}
    </FlexBox>
  );
};
