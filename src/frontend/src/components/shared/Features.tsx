import React from "react";

const features = [
  {
    title: "Service Discovery",
    description:
      "Easily browse categories, search for specific services, or view providers on a map to find exactly what you need.",
    imagePlaceholder: "/blueBall.png",
  },
  {
    title: "Detailed Provider Profiles",
    description:
      "View comprehensive profiles of service providers, including their skills, service offerings, and pricing packages.",
    imagePlaceholder: "/ovalorange.png",
  },
  {
    title: "Seamless Booking System",
    description:
      "Request services, set schedules and locations, and communicate directly with providers via in-platform messaging.",
    imagePlaceholder: "/capsuleguy.png",
  },
  {
    title: "Authentic Ratings & Reviews",
    description:
      "Make informed decisions with genuine feedback from clients who have booked and paid for services, building community trust.",
    imagePlaceholder: "/blueoval.png",
  },
];

export default function Features() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center lg:mb-16">
          <h1 className="mb-6 text-4xl font-bold text-slate-800 lg:text-8xl">
            How does SRV work?
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              // MODIFIED: Changed bg-yellow-100 to bg-yellow-300 for a brighter color
              className="flex flex-col items-center rounded-xl bg-yellow-200 p-6 text-center shadow-md transition-shadow duration-300 hover:shadow-lg"
            >
              <h3 className="mb-3 text-xl font-semibold text-slate-800">
                {feature.title}
              </h3>{" "}
              {/* Made text darker for better contrast */}
              <div className="mb-4 flex h-24 w-24 items-center justify-center">
                <img
                  src={feature.imagePlaceholder}
                  alt={feature.title}
                  className="max-h-full max-w-full"
                />
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {feature.description}
              </p>{" "}
              {/* Made text darker for better contrast */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
