import { createFileRoute } from "@tanstack/react-router";
import { GeApp } from "@/components/ge/GeApp";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <GeApp />;
}
