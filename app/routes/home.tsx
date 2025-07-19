import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Supportly: Home" },
    { name: "description", content: "Welcome to Supportly!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
