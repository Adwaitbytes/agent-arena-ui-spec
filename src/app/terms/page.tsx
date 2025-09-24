import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, User, Sparkles, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <main>
      <section className="border-b border-border py-8 sm:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6"
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mb-8 lg:mb-12 text-lg"
          >
            These are demo terms for the Agent Battle Arena.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="prose prose-neutral dark:prose-invert space-y-6"
          >
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <FileText className="size-5" />
                Use of Service
              </h2>
              <p>Don't misuse or harm the platform. Don't submit illegal or hateful content.</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <User className="size-5" />
                Accounts
              </h2>
              <p>You are responsible for your account and for keeping credentials secure.</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Sparkles className="size-5" />
                Content
              </h2>
              <p>You retain your rights to your content. You grant us a license to host and display it for gameplay features.</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="size-5" />
                Liability
              </h2>
              <p>Service provided "as is." We are not liable for loss of data or downtime.</p>
            </section>
            <p className="text-sm text-muted-foreground mt-6">Effective date: {new Date().getFullYear()}-01-01</p>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}