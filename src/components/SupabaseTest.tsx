"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SupabaseTest() {
  const [tables, setTables] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Supabase connection...');
        
        // Test companies table
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .limit(5);

        if (companiesError) {
          console.error('Companies error:', companiesError);
        } else {
          console.log('Companies:', companiesData);
          setCompanies(companiesData || []);
        }

        // Test users table (correct table name)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(5);

        if (usersError) {
          console.error('Users error:', usersError);
          setError(`Users error: ${usersError.message}`);
        } else {
          console.log('Users:', usersData);
          setUsers(usersData || []);
        }

        // Try alternative table names
        const alternativeNames = ['profiles', 'user', 'members', 'accounts'];
        
        for (const tableName of alternativeNames) {
          const { data: altData, error: altError } = await supabase
            .from(tableName)
            .select('*')
            .limit(2);

          if (!altError && altData) {
            console.log(`Found ${tableName} table:`, altData);
            setError(prev => prev + ` | Found table: ${tableName} with ${altData.length} records`);
          }
        }

      } catch (err) {
        console.error('Connection test error:', err);
        setError(`Connection error: ${err}`);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  if (loading) return <div>Testing database connection...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Supabase Database Test</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Companies ({companies.length}):</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(companies, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Users ({users.length}):</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 