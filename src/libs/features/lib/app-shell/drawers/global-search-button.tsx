"use client";

import { useUIState } from "@aces/store";
import { Icon, IconButton } from "@aces/ui";

interface GlobalSearchButtonProps {
  color?: "primary" | "secondary";
  variant?: "standard" | "contained" | "outlined";
}

export const GlobalSearchButton = ({
  color = "primary",
  variant = "contained",
}: GlobalSearchButtonProps) => {
  const { searchOpen, setSearchOpen } = useUIState();

  const handleDrawerToggle = () => {
    setSearchOpen(!searchOpen);
  };

  return (
    <IconButton
      color={color}
      variant={variant}
      onClick={handleDrawerToggle}
      style={{
        "&:focus": {
          outline: "1px solid -webkit-focus-ring-color",
        },
      }}
    >
      <Icon
        icon="Search"
        aria-label="open search"
        aria-hidden={false}
        role="img"
      />
    </IconButton>
  );
};
