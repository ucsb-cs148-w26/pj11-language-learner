import ChatsClient from "./ChatsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const params = await searchParams;
  return <ChatsClient cFromUrl={params.c ?? null} />;
}