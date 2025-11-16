import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            StoryTree
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Transform Your Family History into Stories
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Upload your GEDCOM file and watch as StoryTree transforms your genealogy data
            into interactive, documentary-style narratives that bring your ancestors to life.
          </p>

          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6">
              <div className="text-4xl mb-4">🌳</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Interactive Family Tree
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore your family connections with a beautiful, zoomable tree visualization
              </p>
            </div>

            <div className="p-6">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                AI-Generated Stories
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Documentary-style narratives that bring your ancestors&apos; lives into focus
              </p>
            </div>

            <div className="p-6">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Timeline & Maps
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See your family&apos;s journey across time and geography
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>StoryTree MVP v0.1 - Genealogy Storytelling Platform</p>
        </div>
      </footer>
    </div>
  );
}
