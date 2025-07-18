import React from "react";

const teamMembers = [
  {
    name: "Reynaldo Jr. Ferrer",
    title: "Local Developer",
    imageUrl: "/rey.png",
  },
  {
    name: "Jan Dale Zarate",
    title: "Project Manager | Business Strategist | Frontend Developer",
    imageUrl: "/jd.png",
  },
  {
    name: "Don Daryll Dela Concha",
    title: "Frontend Developer",
    imageUrl: "/don.jpg",
  },
  {
    name: "Tristan Redolme",
    title: "UI/UX Designer",
    imageUrl: "/tristan.jpg",
  },
  {
    name: "Princess Hannah Azradon",
    title: "Frontend Developer",
    imageUrl: "/hannah.jpg",
  },
];

const AboutUs: React.FC = () => {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-6 text-center">
        <h2 className="mb-4 text-3xl font-bold text-slate-800 lg:text-6xl">
          Meet our Team
        </h2>
        <p className="mx-auto mb-12 max-w-3xl text-lg text-gray-600 lg:mb-16">
          SRV is the product of a creative and driven team focused on harnessing
          the power of the Internet Computer to build smart, scalable solutions.
        </p>

        <div className="flex flex-wrap justify-center gap-8 lg:gap-20">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="group w-full max-w-[200px] text-center"
            >
              {/* Arched Frame Container */}
              <div className="relative mx-auto mb-7 flex h-60 w-55 items-center justify-center rounded-t-full bg-blue-600 shadow-lg">
                {/* Circular Image Placeholder  */}
                <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-inner">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                  />
                </div>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-slate-800">
                {member.name}
              </h3>
              <p className="text-sm text-gray-500">{member.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
