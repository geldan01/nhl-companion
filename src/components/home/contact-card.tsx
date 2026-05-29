const CONTACT_EMAIL = "geldan01@gmail.com";

// Friendly invitation to send feedback. Pre-fills a subject line so replies
// land recognizably in Daniel's inbox.
export function ContactCard() {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("NHL Companion feedback")}`;

  return (
    <section className="rounded-lg border border-(--border) bg-(--surface) px-4 py-4">
      <h2 className="text-sm font-semibold tracking-tight">Suggestions or bugs?</h2>
      <p className="mt-1 text-sm text-(--text-muted)">
        This app is a labour of love. Spotted something off, or have an idea to make
        it better? Reach out to Daniel directly — feedback is always welcome.
      </p>
      <a
        href={mailto}
        className="mt-3 inline-flex items-center rounded-md bg-(--accent) px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Contact Daniel
      </a>
    </section>
  );
}
