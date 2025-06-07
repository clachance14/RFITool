import { Bell } from 'lucide-react';

export default function Header() {
  // Placeholder user info
  const user = { name: 'John Doe', email: 'john.doe@example.com' };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <span className="text-2xl font-bold tracking-wide text-gray-800">RFI Ware</span>
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Bell className="h-6 w-6 text-gray-500" />
          <span className="sr-only">View notifications</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="font-semibold text-gray-800 text-lg">{user.name}</span>
          <span className="text-gray-500 text-sm">{user.email}</span>
        </div>
      </div>
    </header>
  );
} 