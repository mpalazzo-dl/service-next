import { headers } from "next/headers";

import { getLocale, defaultLocale } from "@aces/i18n";
import { Container, FlexBox, Text } from "@aces/ui";

export default async function Custom404() {
  const headersList = await headers();
  const acceptLang = headersList.get("accept-language");
  const userLang = acceptLang?.split(",")[0] || defaultLocale;

  const t = await getLocale(userLang, "errors");

  return (
    <FlexBox flex={1}>
      <Container style={{ display: "flex", flex: 1 }}>
        <FlexBox alignItems={"center"} justifyContent="center" flex={1}>
          <Text fontWeight={600}>{t.notFound}</Text>
        </FlexBox>
      </Container>
    </FlexBox>
  );
}
