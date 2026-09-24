import { Box, Col, Container, Row, Skeleton } from "@aces/ui";

export const CollectionSkeleton = () => {
  return (
    <Box marginY={8}>
      <Container>
        <Row spacing={4}>
          {[0, 1, 2].map((i) => (
            <Col key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" width={"100%"} height={220} />
            </Col>
          ))}
        </Row>
      </Container>
    </Box>
  );
};
