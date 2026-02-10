import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background bg-vibrant-gradient flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-x-hidden pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={title || "page"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="container mx-auto px-4 py-6 scrollbar-thin overflow-x-auto"
          >
            <div className="flex flex-col gap-6 min-w-0">
              {title && (
                <div className="flex items-center justify-between">
                  <h1 className="heading-page tracking-tight">
                    {title.split(' ').map((word, i, arr) => (
                      <span key={i} className={i === arr.length - 1 ? "text-primary" : ""}>
                        {word}{' '}
                      </span>
                    ))}
                  </h1>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
