'use client';

import { useSearchParams } from 'next/navigation';
import type { RFI } from '@/lib/types';
import { RFIFormalView } from './RFIFormalView';
import { RFIWorkflowView } from './RFIWorkflowView';

interface RFIViewRouterProps {
  rfi: RFI;
}

export function RFIViewRouter({ rfi }: RFIViewRouterProps) {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  // Default to workflow view for internal users, formal view for external/client access
  const isWorkflowView = view === 'workflow' || (!view && !searchParams.get('client'));
  
  if (isWorkflowView) {
    return <RFIWorkflowView rfi={rfi} />;
  } else {
    return <RFIFormalView rfi={rfi} />;
  }
} 