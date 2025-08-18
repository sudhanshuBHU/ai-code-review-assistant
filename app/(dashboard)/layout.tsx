// app/(dashboard)/layout.tsx

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

// This is a placeholder for a proper UserNav component
const UserNav = () => {
  // In a real app, you'd fetch user details here to show their name/avatar
  return (
    <div className="flex items-center space-x-4">
      {/* <p>User Menu</p> */}
      <Link href="/api/auth/signout?callbackUrl=/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
        Sign Out
      </Link>
    </div>
  );
};


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // If you want to redirect to a specific page after sign-in, you can add a callbackUrl
    // e.g., redirect('/api/auth/signin?callbackUrl=/dashboard');
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                AI Review Assistant
              </Link>
              <nav className="hidden md:flex md:ml-10 md:space-x-8">
                {/* <Link href="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  Dashboard
                </Link> */}
                {/* <Link href="/settings" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  Settings
                </Link> */}
              </nav>
            </div>
            <UserNav />
          </div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}