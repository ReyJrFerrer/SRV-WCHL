import React from "react";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const WhyChooseUsSection: React.FC = () => {
  const reasons = [
    {
      icon: <ShieldCheckIcon className="mb-4 h-10 w-10 text-blue-600" />,
      title: "Beripikado at Maaasahan",
      description:
        "Kumonekta sa mga freelance provider; tinutulungan ka ng SRV na pagkatiwalaan ang kanilang kredibilidad at kakayahan, na lumalayo sa impormal na mga paraan.",
    },
    {
      icon: <UserGroupIcon className="mb-4 h-10 w-10 text-blue-600" />,
      title: "Platform na Nakatuon sa Kliyente",
      description:
        "Madaling tumuklas, maghambing, at humanap ng mga provider batay sa iyong partikular na pangangailangan, lokasyon, at tunay na rating ng user.",
    },
    {
      icon: <RocketLaunchIcon className="mb-4 h-10 w-10 text-blue-600" />,
      title: "Nagpapalakas sa mga Provider",
      description:
        "Maaaring ipakita ng mga service provider ang kanilang mga kasanayan, pamahalaan ang availability, at bumuo ng mapapatunayang reputasyon sa pamamagitan ng tunay na feedback mula sa kliyente.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-blue-500 py-20 lg:py-28">
      <div className="relative z-10 container mx-auto px-6">
        <div className="mb-12 flex justify-center">
          <div className="rounded-full bg-yellow-400 px-8 py-3 shadow-lg">
            <h1 className="text-3xl font-bold text-slate-800 lg:text-6xl">
              Bakit SRV ang piliin mo?
            </h1>
          </div>
        </div>

        <div className="relative mt-16 flex flex-col items-center">
          <div className="relative z-20 -mb-20 w-48 lg:absolute lg:-top-24 lg:-left-0 lg:mx-0 lg:-mb-0 lg:w-64">
            <img
              src="/cp.png"
              alt="SRV application on a smartphone"
              className="w-full h-auto"
            />
          </div>

          <div className="relative z-10 w-full rounded-2xl bg-white px-6 pt-28 pb-12 shadow-2xl lg:pt-8 lg:pr-12 lg:pl-64">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {reasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4 rounded-full bg-blue-100 p-4">
                    {reason.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-800">
                    {reason.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {reason.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
