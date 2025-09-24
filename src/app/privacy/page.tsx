import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Shield, Sparkles, Lock, User } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main>
      <section className="border-b border-border py-8 sm:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6"
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mb-8 lg:mb-12 text-lg"
          >
            Your privacy matters. This is a placeholder policy for the demo app.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="prose prose-neutral dark:prose-invert space-y-6"
          >
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Shield className="size-5" />
                Data We Collect
              </h2>
              <p>Account info (name, email), gameplay stats (wins, losses), and content you create (prompts, outputs) solely to operate the platform.</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Sparkles className="size-5" />
                How We Use Data
              </h2>
              <p>To provide matchmaking, rankings, replays, and personalization. We do not sell your data.</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Lock className="size-5" />
                Security
              </h2>
              <p>We use industry-standard encryption and access controls. No system is perfect; report issues to support@example.com.</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <User className="size-5" />
                Your Controls
              </h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Download your data</li>
                <li>Delete account</li>
                <li>Opt-out of analytics</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">Effective date: {new Date().getFullYear()}-01-01</p>
            </section>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}