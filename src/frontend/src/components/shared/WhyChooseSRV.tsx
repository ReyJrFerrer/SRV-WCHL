import React from 'react';
import Image from "next/image"; 
import { ShieldCheckIcon, UserGroupIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';


  const WhyChooseUsSection: React.FC = () => {
    const reasons = [
      {
        icon: <ShieldCheckIcon className="h-10 w-10 text-blue-600 mb-4" />,
        title: "Beripikado at Maaasahan",
        description: "Kumonekta sa mga freelance provider; tinutulungan ka ng SRV na pagkatiwalaan ang kanilang kredibilidad at kakayahan, na lumalayo sa impormal na mga paraan."
      },
      {
        icon: <UserGroupIcon className="h-10 w-10 text-blue-600 mb-4" />,
        title: "Platform na Nakatuon sa Kliyente",
        description: "Madaling tumuklas, maghambing, at humanap ng mga provider batay sa iyong partikular na pangangailangan, lokasyon, at tunay na rating ng user."
      },
      {
        icon: <RocketLaunchIcon className="h-10 w-10 text-blue-600 mb-4" />,
        title: "Nagpapalakas sa mga Provider",
        description: "Maaaring ipakita ng mga service provider ang kanilang mga kasanayan, pamahalaan ang availability, at bumuo ng mapapatunayang reputasyon sa pamamagitan ng tunay na feedback mula sa kliyente."
      }
    ];

    return (
        <section className="relative bg-blue-500 py-20 lg:py-28 overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex justify-center mb-12">
                <div className="bg-yellow-400 rounded-full py-3 px-8 shadow-lg">
                    <h1 className="text-3xl lg:text-6xl font-bold text-slate-800">
                        Bakit SRV ang piliin mo?
                    </h1>
                </div>
            </div>
            
            <div className="relative mt-16 flex flex-col items-center">

              <div className="relative w-48 lg:absolute lg:w-64 lg:-top-24 lg:-left-0 z-20 -mb-20 lg:mx-0 lg:-mb-0">
                <Image
                  src="/cp.png" 
                  alt="SRV application on a smartphone"
                  width={700}
                  height={520}
                />
              </div>
              
              <div className="w-full bg-white rounded-2xl shadow-2xl pt-28 pb-12 px-6 lg:pt-8 lg:pl-64 lg:pr-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {reasons.map((reason, index) => (
                       <div key={index} className="text-center flex flex-col items-center">
                      <div className="bg-blue-100 p-4 rounded-full mb-4">
                        {reason.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">{reason.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{reason.description}</p>
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