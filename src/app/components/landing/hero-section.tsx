import { ArrowRight, Cloud, Server, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero py-24 md:py-36">
      {/* Floating icons */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] opacity-10"
      >
        <Cloud className="h-20 w-20 text-primary-foreground" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-16 right-[15%] opacity-10"
      >
        <Server className="h-16 w-16 text-primary-foreground" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute top-32 right-[25%] opacity-10"
      >
        <Database className="h-14 w-14 text-primary-foreground" />
      </motion.div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-6xl"
        >
          AI-Powered Cloud Cost Comparison Across Providers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/75"
        >
          An AI-powered application that estimates and compares cloud
          infrastructure costs across leading cloud providers based on
          user-provided usage, architecture, and workload data.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10"
        >
          <Link href="/estimation">
            <Button
              size="lg"
              variant="secondary"
              className="text-base font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              Start estimating
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
