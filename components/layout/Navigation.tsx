"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Sparkles, FileText, File, LayoutTemplate, FileCode, CheckSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/UserNav";
import { RESUME_TEMPLATE_CATEGORIES } from "@/lib/resume-template-catalog";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useTheme } from "@/contexts/ThemeContext";
import { useSession } from "next-auth/react";

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const user = session?.user;
  const navRef = useRef<HTMLElement | null>(null);
  const navContentRef = useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Pages that show the simplified header (Logo + Theme Toggle only)
  const simplifiedPaths = [
    "/dashboard",
    "/resume",
    "/cv",
    "/cover-letter",
    "/ats-checker",
    "/editor",
    "/ai-resume-optimizer",
    "/career-management"
  ];

  const isSimplified = simplifiedPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const setHeaderVars = () => {
      const navElement = navRef.current;
      if (!navElement) return;

      const navRect = navElement.getBoundingClientRect();
      document.documentElement.style.setProperty("--app-header-height", `${navRect.height}px`);

      const navContent = navContentRef.current;
      if (navContent) {
        const contentRect = navContent.getBoundingClientRect();
        const offset = contentRect.bottom - navRect.top;
        document.documentElement.style.setProperty("--app-header-offset", `${offset}px`);
      }
    };

    setHeaderVars();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => setHeaderVars());
    if (navRef.current) {
      observer.observe(navRef.current);
    }
    if (navContentRef.current) {
      observer.observe(navContentRef.current);
    }
    window.addEventListener("resize", setHeaderVars);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", setHeaderVars);
    };
  }, []);

  const templateItems = [
    { label: "All Templates", href: "/templates" },
    ...RESUME_TEMPLATE_CATEGORIES.map((category) => ({
      label: category.label,
      href: `/templates/${category.slug}`,
    })),
  ];

  const navDropdowns = [
    {
      label: "Templates",
      items: templateItems,
    },
    {
      label: "Tools",
      items: [
        { label: "Resume Builder", href: "/resume/start" },
        { label: "Cover Letter Builder", href: "/cover-letter/start" },
        { label: "ATS Checker", href: "/ats-checker" },
        { label: "AI Resume Optimizer", href: "/ai-resume-optimizer" },
        { label: "Career Management", href: "/career-management" },
        { label: "Cover Letter Templates", href: "/cover-letter/templates" },
      ],
    },
    {
      label: "Resume",
      items: [
        { label: "Resume Builder", href: "/resume/start" },
        { label: "Import", href: "/resume/start" },
        { label: "Templates", href: "/templates" },
        { label: "ATS Checker", href: "/ats-checker" },
      ],
    },
    {
      label: "CV",
      items: [
        { label: "CV Builder", href: "/cv/start" },
        { label: "Import", href: "/cv/start" },
        { label: "Templates", href: "/cv/new" },
      ],
    },
    {
      label: "Cover Letter",
      items: [
        { label: "Builder", href: "/cover-letter/start" },
        { label: "Import", href: "/cover-letter/start" },
        { label: "Templates", href: "/cover-letter/templates" },
      ],
    },
    {
      label: "Career Blog",
      items: [
        { label: "All Articles", href: "/career-blog" },
      ],
    },
    {
      label: "About",
      items: [
        { label: "About Us", href: "/about" },
        { label: "Our Story", href: "/about/story" },
        { label: "Contact", href: "/contact" },
        { label: "Press", href: "/about/press" },
        { label: "Careers", href: "/about/careers" },
      ],
    },
  ];

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={navContentRef}
          className={`flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ${
            isScrolled 
              ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50' 
              : 'bg-transparent'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
              ResuPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isSimplified && (
            <div className="hidden md:flex items-center">
              <NavigationMenu viewport={false}>
                <NavigationMenuList className="gap-2">
                  {navDropdowns.map((group) => (
                    <NavigationMenuItem key={group.label}>
                      <NavigationMenuTrigger className="h-auto bg-transparent px-2 py-1 text-sm font-medium text-gray-700 hover:bg-transparent hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 data-[state=open]:bg-transparent">
                        {group.label}
                      </NavigationMenuTrigger>
                      {group.label === "Templates" ? (
                        <NavigationMenuContent className="min-w-[560px] w-[560px] rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900/95">
                          <ul className="grid grid-cols-2 gap-1 max-h-[60vh] overflow-y-auto">
                            {group.items.map((item) => (
                              <li key={item.label}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={item.href}
                                    className="block w-full whitespace-nowrap rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-purple-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-purple-400"
                                  >
                                    {item.label}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      ) : (
                        <NavigationMenuContent className="w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900/95">
                          <ul className="space-y-1">
                            {group.items.map((item) => (
                              <li key={item.label}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={item.href}
                                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-purple-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-purple-400"
                                  >
                                    {item.label}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-gray-300" />
            )}
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {!isSimplified && (
                    <Link href="/dashboard">
                      <Button
                        variant="default"
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-full px-6"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <UserNav />
                </>
              ) : (
                !isSimplified && (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="text-gray-700 dark:text-gray-300">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/choose-builder">
                      <Button
                        variant="default"
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-full px-6"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )
              )}
            </div>

            {/* Mobile Menu Button */}
            {(!isSimplified || pathname === "/dashboard") && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 space-y-2 max-h-[80vh] overflow-y-auto">
              {pathname === "/dashboard" ? (
                <div className="space-y-6 py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">Resume</h3>
                    <div className="space-y-1">
                      <Link href="/resume/start" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><FileText className="w-4 h-4" /> Resume Builder</Link>
                      <Link href="/resume/start" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><File className="w-4 h-4" /> Import Resume</Link>
                      <Link href="/templates" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><LayoutTemplate className="w-4 h-4" /> Templates</Link>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">CV</h3>
                    <div className="space-y-1">
                      <Link href="/cv/start" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><FileCode className="w-4 h-4" /> CV Builder</Link>
                      <Link href="/cv/start" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><File className="w-4 h-4" /> Import CV</Link>
                      <Link href="/cv/new" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><LayoutTemplate className="w-4 h-4" /> Templates</Link>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">Cover Letter</h3>
                    <div className="space-y-1">
                      <Link href="/cover-letter/start" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><FileText className="w-4 h-4" /> Cover Letter Builder</Link>
                      <Link href="/cover-letter/start" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><File className="w-4 h-4" /> Import Document</Link>
                      <Link href="/cover-letter/templates" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><LayoutTemplate className="w-4 h-4" /> Templates</Link>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">Tools</h3>
                    <div className="space-y-1">
                      <Link href="/ats-checker" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><CheckSquare className="w-4 h-4" /> ATS Checker</Link>
                      <Link href="/ai-resume-optimizer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Sparkles className="w-4 h-4" /> AI Resume Optimizer</Link>
                      <Link href="/career-management" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Eye className="w-4 h-4" /> Career Management</Link>
                    </div>
                  </div>
                </div>
              ) : !isSimplified ? (
                <>
              <Accordion type="multiple" className="space-y-1">
                {navDropdowns.map((group) => (
                  <AccordionItem
                    key={group.label}
                    value={group.label}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <AccordionTrigger className="px-4 py-3 text-sm font-medium text-gray-700 hover:no-underline dark:text-gray-300">
                      {group.label}
                    </AccordionTrigger>
                    <AccordionContent className="px-2">
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-purple-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-purple-400"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <hr className="border-gray-200 dark:border-gray-700 my-2" />
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-purple-600 dark:text-purple-400 font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-center rounded-lg font-medium"
                  >
                    Get Started
                  </Link>
                </div>
              )}
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
