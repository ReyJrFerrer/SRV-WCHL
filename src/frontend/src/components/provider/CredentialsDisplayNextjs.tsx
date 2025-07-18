import React from 'react';
import { 
  PlusIcon, 
  UserIcon, 
  ShieldCheckIcon, 
  CheckBadgeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { FrontendProfile } from '../../services/authCanisterService';

// Placeholder credential interface
interface Credential {
  id: string;
  title: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

interface CredentialsDisplayProps {
  provider: FrontendProfile;
  className?: string;
}

const CredentialsDisplayNextjs: React.FC<CredentialsDisplayProps> = ({ provider, className = '' }) => {
  // Placeholder credentials data - this would eventually come from the backend
  const placeholderCredentials: Credential[] = [
    {
      id: '1',
      title: 'Lorem Ipsum Dolor',
      issuingAuthority: 'Authority',
      issueDate: new Date('2023-01-15'),
      expiryDate: new Date('2025-01-15'),
      verificationStatus: 'VERIFIED'
    },
    {
      id: '2',
      title: 'Lorem Ipum',
      issuingAuthority: 'Authority',
      issueDate: new Date('2023-06-10'),
      expiryDate: new Date('2024-06-10'),
      verificationStatus: 'VERIFIED'
    },
    {
      id: '3',
      title: 'Lorem Ipsum Dolor Met',
      issuingAuthority: 'Authority',
      issueDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      verificationStatus: 'PENDING'
    }
  ];

  // Placeholder verification status - this would come from the backend
  const verificationData = {
    identityVerified: provider.isVerified || true,
    backgroundCheckPassed: true,
    verificationStatus: 'VERIFIED' as const
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className={`credentials-section ${className}`}>
      <div className="section-header flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-700">Mga Credential at Veripikasyon</h2>
        <Link href="/provider/credentials/add">
          <button className="add-button bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors">
            <PlusIcon className="h-5 w-5" />
          </button>
        </Link>
      </div>
      
      {/* Provider Info */}
      <div className="provider-info mb-4 p-3 bg-gray-50 rounded-lg">
        {/* <p className="text-sm text-gray-600">
          Credentials for: <span className="font-semibold text-gray-800">{provider.name}</span>
        </p> */}
        {/* <p className="text-xs text-gray-500">ID: {provider.id}</p> */}
      </div>
      
      <div className="verification-badges flex gap-3 mb-4 flex-wrap">
        {verificationData.identityVerified && (
          <div className="verification-badge flex items-center bg-blue-600 text-white px-3 py-1 rounded-full">
            <UserIcon className="h-4 w-4 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">Identity Verified</span>
          </div>
        )}
        
        {verificationData.backgroundCheckPassed && (
          <div className="verification-badge flex items-center bg-blue-600 text-white px-3 py-1 rounded-full">
            <ShieldCheckIcon className="h-4 w-4 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">Background Verified</span>
          </div>
        )}
        
        {verificationData.verificationStatus === 'VERIFIED' && (
            <div className="verification-badge flex items-center bg-blue-600 text-white px-3 py-1 rounded-full">
            <CheckBadgeIcon className="h-4 w-4 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">{verificationData.verificationStatus}</span>
          </div>
        )}
      </div>
      
      {placeholderCredentials.length > 0 ? (
        <div className="space-y-4">
          {placeholderCredentials.map((credential) => (
            <div key={credential.id} className="credential-card bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2 mt-1" />
                  <div>
                    <h3 className="font-semibold text-black">{credential.title}</h3>
                    <p className="text-sm text-gray-700">Issued by: {credential.issuingAuthority}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {formatDate(credential.issueDate)}
                      {credential.expiryDate && ` • Expires: ${formatDate(credential.expiryDate)}`}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        credential.verificationStatus === 'VERIFIED' 
                          ? 'bg-green-100 text-green-800'
                          : credential.verificationStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {credential.verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>
                {credential.verificationStatus === 'VERIFIED' && (
                  <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg text-center">
          <p className="text-black">You haven't added any credentials yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Add credentials to build trust with potential clients
          </p>
          <Link href="/provider/credentials/add">
            <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Credentials
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CredentialsDisplayNextjs;