import { Box, Skeleton } from "@aces/ui";

export const InfoPanelSkeleton = () => {
  return (
    <Box marginY={4}>
      <Skeleton variant="rectangular" width={"100%"} height={72} />
    </Box>
  );
};
