import { TeamPage } from "./team-page";

type Params = { code: string };

export default async function TeamRoute({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  return <TeamPage code={code.toUpperCase()} />;
}
