export default function TermsPage() {
  return (
    <main>
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">These are demo terms for the Agent Battle Arena.</p>

          <div className="prose prose-neutral dark:prose-invert mt-8">
            <h2>Use of Service</h2>
            <p>Don’t misuse or harm the platform. Don’t submit illegal or hateful content.</p>
            <h2>Accounts</h2>
            <p>You are responsible for your account and for keeping credentials secure.</p>
            <h2>Content</h2>
            <p>You retain your rights to your content. You grant us a license to host and display it for gameplay features.</p>
            <h2>Liability</h2>
            <p>Service provided “as is.” We are not liable for loss of data or downtime.</p>
            <p>Effective date: {new Date().getFullYear()}-01-01</p>
          </div>
        </div>
      </section>
    </main>
  );
}