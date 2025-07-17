import React from 'react';
import { CpuChipIcon, WrenchScrewdriverIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface SDGInfo {
  sdgNumber: string;
  title: string;
  description: string;
  icon: JSX.Element; 
  colorHex: string; 
  textColorHex?: string; 
  isPrimary?: boolean;
}

const sdgData: SDGInfo[] = [
  {
    sdgNumber: "SDG 9",
    title: "Industry, Innovation, and Infrastructure",
    description: "Integrating blockchain into e-commerce brings innovation to a mature industry while promoting public adoption of the technology and strengthening the platform’s infrastructure.",
    icon: <CpuChipIcon className="h-8 w-8" />,
    colorHex: "#FD6925", 
    textColorHex: "#FFFFFF",
  },
  {
    sdgNumber: "SDG 8",
    title: "Decent Work and Economic Growth",
    description: "SRV provides a professional platform for service transactions, promoting mutual respect and creating job opportunities for skilled but unemployed individuals.",
    icon: <WrenchScrewdriverIcon className="h-8 w-8" />, 
    colorHex: "#A21942", 
    textColorHex: "#FFFFFF",
    isPrimary: true,
  },
  {
    sdgNumber: "SDG 17",
    title: "Partnerships for the Goals",
    description: "SRV fosters collaboration among service providers, clients, and support staff through technology, aligning with the SDG goals of partnership and knowledge sharing.",
    icon: <UserGroupIcon className="h-8 w-8" />, 
    colorHex: "#19486A",
    textColorHex: "#FFFFFF",
  },
];

const SDGSection: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-6 text-center">
       <h1 className="text-3xl lg:text-6xl font-bold text-slate-800 mb-4">
          Our Commitment to Sustainable Development
        </h1>
        <p className="text-gray-600 max-w-3xl mx-auto mb-12 lg:mb-16 text-lg">
          SRV is dedicated to making a positive impact by aligning our platform with key Sustainable Development Goals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sdgData.map((sdg) => (
            <div
              key={sdg.sdgNumber}
              className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center
                          ${sdg.isPrimary
                            ? 'bg-yellow-100 border-2 border-yellow-300 hover:shadow-yellow-300/40'
                            : 'bg-white hover:shadow-lg'}`} 
            >
              {/* Icon container styled with official SDG color */}
              <div
                className="mx-auto mb-6 flex items-center justify-center h-20 w-20 rounded-full"
                style={{ backgroundColor: sdg.colorHex, color: sdg.textColorHex || '#FFFFFF' }} // Apply SDG color and icon text color
              >
                {React.cloneElement(sdg.icon, { className: `h-10 w-10` })} {/* Ensure icon size is consistent */}
              </div>

              <h3 className={`text-xl font-semibold mb-3 ${sdg.isPrimary ? 'text-yellow-700' : 'text-slate-700'}`}>
                {sdg.sdgNumber}: {sdg.title}
              </h3>
              <p className={`text-sm leading-relaxed ${sdg.isPrimary ? 'text-gray-700' : 'text-gray-600'}`}>
                {sdg.description}
              </p>
              {sdg.isPrimary && (
                <div className="mt-auto pt-4 text-xs font-semibold text-yellow-600 uppercase tracking-wider"> {/* mt-auto pushes to bottom */}
                  Primary Focus
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SDGSection;