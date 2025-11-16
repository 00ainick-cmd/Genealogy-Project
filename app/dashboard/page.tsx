import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            StoryTree
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">
              {session.user.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session.user.name || session.user.email}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your family trees and stories
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🌳</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No projects yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start your family story by uploading a GEDCOM file from Ancestry.com or
            another genealogy platform.
          </p>
          <Button variant="primary" size="lg">
            Create Your First Project
          </Button>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl mb-3">📤</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Upload GEDCOM
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Import your family tree from any genealogy platform
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI-Generated Stories
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transform genealogy data into engaging narratives
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Share with Family
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create secure links to share your family story
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
