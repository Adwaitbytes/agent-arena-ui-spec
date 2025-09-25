export default function PrivacyPage() {
  return (
    <main>
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground">Your privacy matters. This is a placeholder policy for the demo app.</p>

          <div className="prose prose-neutral dark:prose-invert mt-8">
            <h2>Data We Collect</h2>
            <p>Account info (name, email), gameplay stats (wins, losses), and content you create (prompts, outputs) solely to operate the platform.</p>
            <h2>How We Use Data</h2>
            <p>To provide matchmaking, rankings, replays, and personalization. We do not sell your data.</p>
            <h2>Security</h2>
            <p>We use industry-standard encryption and access controls. No system is perfect; report issues to support@example.com.</p>
            <h2>Your Controls</h2>
            <ul>
              <li>Download your data</li>
              <li>Delete account</li>
              <li>Opt-out of analytics</li>
            </ul>
            <p>Effective date: {new Date().getFullYear()}-01-01</p>
          </div>
        </div>
      </section>
    </main>
  );
}