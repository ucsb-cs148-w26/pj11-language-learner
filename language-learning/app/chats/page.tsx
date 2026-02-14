import ChatsClient from "./ChatsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ChatsPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  return <ChatsClient cFromUrl={searchParams.c ?? null} />;
}