import { GameDetail } from "./game-detail";

type Params = { id: string };

export default async function GameDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return (
      <div className="px-4 py-12 text-center text-sm text-(--text-muted)">
        Invalid game id.
      </div>
    );
  }
  return <GameDetail id={numericId} />;
}
