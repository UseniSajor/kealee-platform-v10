'use client';

import React from 'react';
import {StaffManagement} from '@permits/src/components/jurisdiction-staff/staff-management';
import {useParams} from 'next/navigation';

export default function JurisdictionStaffPage() {
  const params = useParams();
  const jurisdictionId = params.jurisdictionId as string;

  return <StaffManagement jurisdictionId={jurisdictionId} />;
}
