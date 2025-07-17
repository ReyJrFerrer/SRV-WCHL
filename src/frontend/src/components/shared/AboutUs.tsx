import React from 'react';
import Image from 'next/image';

const teamMembers = [
  { name: "Reynaldo Jr. Ferrer", title: "Local Developer", imageUrl: "/rey.png" },
  { name: "Jan Dale Zarate", title: "Project Manager | Business Strategist | Frontend Developer", imageUrl: "/jd.png" },
  { name: "Don Daryll Dela Concha", title: "Frontend Developer", imageUrl: "/don.jpg" },
  { name: "Tristan Redolme", title: "UI/UX Designer", imageUrl: "/tristan.jpg" },
  { name: "Princess Hannah Azradon", title: "Frontend Developer", imageUrl: "/hannah.jpg" },
];

const AboutUs: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-6xl font-bold text-slate-800 mb-4">
          Meet our Team
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto mb-12 lg:mb-16 text-lg">
          SRV is the product of a creative and driven team focused on harnessing the power of the Internet Computer to build smart, scalable solutions.
        </p>
  
        <div className="flex flex-wrap justify-center gap-8 lg:gap-20">
          {teamMembers.map((member) => (
            <div key={member.name} className="text-center group max-w-[200px] w-full">
              {/* Arched Frame Container */}
              <div className="relative w-55 h-60 bg-blue-600 rounded-t-full mx-auto mb-7 flex items-center justify-center shadow-lg">
                  {/* Circular Image Placeholder  */}
                  <div className="relative w-40 h-40 bg-gray-200 rounded-full overflow-hidden shadow-inner border-4 border-white">
                      <Image
                          src={member.imageUrl}
                          alt={member.name}
                          layout="fill"
                          objectFit="cover"
                          className="grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                  </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">{member.name}</h3>
              <p className="text-gray-500 text-sm">{member.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutUs;