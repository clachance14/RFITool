'use client';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export default function TestToastPage() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: 'Success!',
      description: 'Link copied to clipboard! This will disappear in 2 seconds or when you click anywhere.',
    });
  };

  const showErrorToast = () => {
    toast({
      title: 'Error',
      description: 'Failed to copy link. Try again.',
      variant: 'destructive',
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Toast Notification Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Test the New Toast System</h2>
          <p className="text-gray-600 mb-4">
            These toasts will auto-dismiss after 2 seconds, or you can click anywhere to dismiss them immediately.
          </p>
        </div>

        <div className="flex space-x-4">
          <Button onClick={showSuccessToast} className="bg-green-600 hover:bg-green-700">
            Show Success Toast
          </Button>
          
          <Button onClick={showErrorToast} variant="destructive">
            Show Error Toast
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Toasts appear in the top-right corner</li>
            <li>• Auto-dismiss after 2 seconds</li>
            <li>• Click anywhere on the page to dismiss immediately</li>
            <li>• Hover effect shows they're interactive</li>
            <li>• Success toasts are green, error toasts are red</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 