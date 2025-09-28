import React from 'react';
import { LendingForms } from '../components/LendingForms';
import { LendingBorrow } from '@/components/LendingBorrow';

const LendingPlatform: React.FC = () => {
  return (
    <div className="min-h-screen global-bg from-blue-50 to-indigo-100">
        <LendingBorrow />
        <LendingForms />
      
    </div>
  );
};

export default LendingPlatform;
