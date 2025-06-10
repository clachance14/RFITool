"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function TestUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Database connection
  const testDatabaseConnection = async () => {
    addTestResult({ test: 'Database Connection', status: 'pending', message: 'Testing...' });
    
    try {
      const { data, error } = await supabase.from('projects').select('count').limit(1);
      if (error) throw error;
      
      addTestResult({ 
        test: 'Database Connection', 
        status: 'success', 
        message: 'Connected successfully',
        data: { count: data }
      });
    } catch (error: any) {
      addTestResult({ 
        test: 'Database Connection', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 2: Check available storage buckets
  const testStorageBuckets = async () => {
    addTestResult({ test: 'Storage Buckets', status: 'pending', message: 'Checking available buckets...' });
    
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      addTestResult({ 
        test: 'Storage Buckets', 
        status: 'success', 
        message: `Found ${data.length} buckets`,
        data: { buckets: data.map(b => ({ name: b.name, id: b.id, public: b.public })) }
      });
    } catch (error: any) {
      addTestResult({ 
        test: 'Storage Buckets', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 2.5: Create RFI_ATTACHMENTS bucket if it doesn't exist
  const createRFIBucket = async () => {
    addTestResult({ test: 'Create RFI Bucket', status: 'pending', message: 'Creating bucket...' });
    
    try {
      const { data, error } = await supabase.storage.createBucket('rfi-attachments', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: null // Allow all file types
      });
      
      if (error) {
        // Check if bucket already exists
        if (error.message.includes('already exists')) {
          addTestResult({ 
            test: 'Create RFI Bucket', 
            status: 'success', 
            message: 'Bucket already exists',
            data: { info: 'rfi-attachments bucket was already created' }
          });
          return;
        }
        throw error;
      }
      
      addTestResult({ 
        test: 'Create RFI Bucket', 
        status: 'success', 
        message: 'Bucket created successfully',
        data: { bucketName: data.name }
      });
    } catch (error: any) {
      addTestResult({ 
        test: 'Create RFI Bucket', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 3: Check rfi_attachments table schema
  const testTableSchema = async () => {
    addTestResult({ test: 'RFI Attachments Schema', status: 'pending', message: 'Checking table...' });
    
    try {
      // Try to query the table structure - first try minimal select
      const { data, error } = await supabase
        .from('rfi_attachments')
        .select('id')
        .limit(1);
      
      if (error) {
        addTestResult({ 
          test: 'RFI Attachments Schema', 
          status: 'error', 
          message: `Basic table query failed: ${error.message}`,
          data: error
        });
        return;
      }
      
             // Now try to query specific columns to see which ones exist
       const testColumns = ['id', 'rfi_id', 'file_name', 'file_path', 'file_size_bytes', 'file_type', 'uploaded_by', 'public_url', 'created_at'];
       const columnResults: Record<string, string> = {};
       
       for (const column of testColumns) {
         try {
           const { error: colError } = await supabase
             .from('rfi_attachments')
             .select(column)
             .limit(1);
           columnResults[column] = colError ? `Error: ${colError.message}` : 'OK';
         } catch (e: any) {
           columnResults[column] = `Exception: ${e?.message || 'Unknown error'}`;
         }
       }
      
      addTestResult({ 
        test: 'RFI Attachments Schema', 
        status: 'success', 
        message: 'Table exists and basic query works',
        data: { 
          sampleCount: data.length,
          columnTests: columnResults
        }
      });
    } catch (error: any) {
      addTestResult({ 
        test: 'RFI Attachments Schema', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 4: Test storage upload
  const testStorageUpload = async () => {
    if (!selectedFile) {
      addTestResult({ 
        test: 'Storage Upload', 
        status: 'error', 
        message: 'No file selected'
      });
      return;
    }

    addTestResult({ test: 'Storage Upload', status: 'pending', message: 'Uploading to storage...' });
    
    try {
      const fileName = `test-${Date.now()}-${selectedFile.name}`;
      const filePath = `test-uploads/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('rfi-attachments')
        .upload(filePath, selectedFile);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('rfi-attachments')
        .getPublicUrl(filePath);
      
      addTestResult({ 
        test: 'Storage Upload', 
        status: 'success', 
        message: 'File uploaded successfully',
        data: { 
          path: data.path, 
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl
        }
      });
      
      return { path: data.path, publicUrl: urlData.publicUrl };
    } catch (error: any) {
      addTestResult({ 
        test: 'Storage Upload', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 5: Test minimal database insertion
  const testMinimalDatabaseInsertion = async () => {
    addTestResult({ test: 'Minimal DB Insert', status: 'pending', message: 'Testing minimal insert...' });
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

             // Try inserting with only the most basic required fields
       const minimalData = {
         rfi_id: '00000000-0000-0000-0000-000000000000',
         file_name: 'test-file.txt',
         file_path: 'test/path',
         uploaded_by: user.id,
       };

      const { data, error } = await supabase
        .from('rfi_attachments')
        .insert(minimalData)
        .select()
        .single();
      
      if (error) throw error;
      
      addTestResult({ 
        test: 'Minimal DB Insert', 
        status: 'success', 
        message: 'Minimal record inserted successfully',
        data: data
      });
    } catch (error: any) {
      addTestResult({ 
        test: 'Minimal DB Insert', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 6: Test database insertion
  const testDatabaseInsertion = async (uploadResult?: any) => {
    if (!selectedFile) {
      addTestResult({ 
        test: 'Database Insertion', 
        status: 'error', 
        message: 'No file selected'
      });
      return;
    }

    addTestResult({ test: 'Database Insertion', status: 'pending', message: 'Inserting record...' });
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const insertData = {
        rfi_id: '00000000-0000-0000-0000-000000000000', // Test RFI ID
        file_name: selectedFile.name,
        file_path: uploadResult?.path || 'test-path',
        file_size_bytes: selectedFile.size,
        file_type: selectedFile.type,
        uploaded_by: user.id
      };

      addTestResult({ 
        test: 'Database Insertion Data', 
        status: 'pending', 
        message: 'Attempting to insert...',
        data: insertData
      });

      const { data, error } = await supabase
        .from('rfi_attachments')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      addTestResult({ 
        test: 'Database Insertion', 
        status: 'success', 
        message: 'Record inserted successfully',
        data: data
      });
      
      return data;
    } catch (error: any) {
      addTestResult({ 
        test: 'Database Insertion', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Test 6: Test fetching attachments
  const testFetchAttachments = async () => {
    addTestResult({ test: 'Fetch Attachments', status: 'pending', message: 'Fetching records...' });
    
    try {
      const { data, error } = await supabase
        .from('rfi_attachments')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      addTestResult({ 
        test: 'Fetch Attachments', 
        status: 'success', 
        message: `Found ${data.length} records`,
        data: data
      });
    } catch (error: any) {
      addTestResult({ 
        test: 'Fetch Attachments', 
        status: 'error', 
        message: error.message,
        data: error
      });
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    await testDatabaseConnection();
    await testStorageBuckets();
    await testTableSchema();
    await testFetchAttachments();
    
    if (selectedFile) {
      const uploadResult = await testStorageUpload();
      await testDatabaseInsertion(uploadResult);
    }
    
    setIsRunning(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">File Upload Test Environment</h1>
          
          {/* File Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Test File
            </label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>

          {/* Test Controls */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={testDatabaseConnection}
              disabled={isRunning}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test DB Connection
            </button>
            
            <button
              onClick={testStorageBuckets}
              disabled={isRunning}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Check Buckets
            </button>
            
            <button
              onClick={createRFIBucket}
              disabled={isRunning}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Create Bucket
            </button>
            
            <button
              onClick={testTableSchema}
              disabled={isRunning}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Check Schema
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
            {testResults.length === 0 && (
              <p className="text-gray-500">No tests run yet. Click "Run All Tests" to begin.</p>
            )}
            
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded-md p-4 ${
                  result.status === 'success' ? 'border-green-200 bg-green-50' :
                  result.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-500">Show Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 