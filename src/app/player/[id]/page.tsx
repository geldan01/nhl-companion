import { PlayerPage } from "./player-page";

type Params = { id: string };

export default async function PlayerRoute({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return (
      <div className="px-4 py-12 text-center text-sm text-(--text-muted)">
        Invalid player id.
      </div>
    );
  }
  return <PlayerPage id={numericId} />;
}
