import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <Image
              src="/romeo-logo.svg"
              alt="Romeo Logo"
              width={140}
              height={30}
              priority
            />
            <div className="hidden md:block">
              <Link href="/login" className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm px-5 py-2">
                Login
              </Link>
            </div>
            <button className="md:hidden" aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="py-16 md:py-24 px-6 md:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Effortless <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF5252] to-[#B71C1C]">Reservations</span> Made Simple
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto md:mx-0">
                  Romeo is a minimalist reservation system designed for simplicity and efficiency. No clutter, just results.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link href="/signup" className="rounded-full transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-base px-6 py-3">
                    Get Started Free
                  </Link>
                  <Link href="#demo" className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base px-6 py-3">
                    View Demo
                  </Link>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="aspect-square max-w-md mx-auto relative">
                  <div className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#FF5252]/10 to-[#B71C1C]/10 backdrop-blur-sm border border-[#FF5252]/20 shadow-xl">
                    <div className="absolute top-4 left-4 right-4">
                      <div className="h-4 w-24 bg-[#FF5252]/20 rounded-full mb-2"></div>
                      <div className="h-10 w-full bg-[#FF5252]/10 rounded-lg"></div>
                    </div>
                    <div className="absolute top-24 left-4 right-4 bottom-4">
                      <div className="grid grid-cols-3 gap-2 h-full">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="bg-[#FF5252]/5 rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 px-6 md:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Beautifully Minimal. Powerfully Effective.</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Romeo strips away the complexity of reservation management, leaving only what matters.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Intuitive Calendar",
                  description: "Simple, clean calendar interface that makes managing bookings effortless."
                },
                {
                  title: "Smart Notifications",
                  description: "Automated reminders that keep everyone on the same page, always."
                },
                {
                  title: "Customizable Views",
                  description: "Adapt the system to your workflow, not the other way around."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm transition-all hover:shadow-md">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5252] to-[#B71C1C] mb-6 flex items-center justify-center text-white">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 py-12 px-6 md:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <Image
                src="/romeo-logo.svg"
                alt="Romeo Logo"
                width={120}
                height={25}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">© {new Date().getFullYear()} Romeo. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacy</Link>
              <Link href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Terms</Link>
              <Link href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Contact</Link>
              <Link href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
