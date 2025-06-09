import { NextRequest, NextResponse } from 'next/server';
import { createProjectSchema } from '@/lib/validations';
import { Project } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  console.log('📡 API: Received POST request to /api/projects');
  try {
    const body = await request.json();
    console.log('📡 API: Request body:', body);

    // Validate input
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      console.error('❌ API: Validation error:', result.error);
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.errors },
        { status: 400 }
      );
    }

    const projectData = result.data;
    console.log('✅ API: Validated project data:', projectData);

    // Create new project using Supabase
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        project_disciplines: projectData.project_disciplines || [],
      });

    if (error) {
      console.error('❌ API: Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ API: Created new project:', newProject);
    return NextResponse.json({ success: true, data: newProject });
  } catch (error) {
    console.error('❌ API: Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 