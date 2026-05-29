import { Hero } from "@/components/home/hero";
import { SeasonModule } from "@/components/home/season-module";
import { NewsFeed } from "@/components/home/news-feed";
import { ContactCard } from "@/components/home/contact-card";

export function HomeView() {
  return (
    <div>
      <Hero />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <SeasonModule />
        </div>
        <aside className="flex flex-col gap-6">
          <NewsFeed />
          <ContactCard />
        </aside>
      </div>
    </div>
  );
}
