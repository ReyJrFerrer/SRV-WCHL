import React from 'react';
 
 const features = [
   {
     title: 'Service Discovery',
     description: 'Easily browse categories, search for specific services, or view providers on a map to find exactly what you need.',
     imagePlaceholder: '/blueBall.png'  
   },
   {
     title: 'Detailed Provider Profiles',
     description: 'View comprehensive profiles of service providers, including their skills, service offerings, and pricing packages.',
     imagePlaceholder: '/ovalorange.png' 
   },
   {
     title: 'Seamless Booking System',
     description: 'Request services, set schedules and locations, and communicate directly with providers via in-platform messaging.',
     imagePlaceholder: '/capsuleguy.png'
   },
   {
     title: 'Authentic Ratings & Reviews',
     description: 'Make informed decisions with genuine feedback from clients who have booked and paid for services, building community trust.',
     imagePlaceholder: '/blueoval.png' 
   },
 ];
 
 export default function Features() {
   return (
     <section className="py-16 lg:py-24 bg-white">
       <div className="container mx-auto px-6">
         <div className="text-center mb-12 lg:mb-16">
           <h1 className="text-4xl lg:text-8xl font-bold text-slate-800 mb-6">How does SRV work?</h1> 
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {features.map((feature, index) => (
             <div 
                key={index} 
                // MODIFIED: Changed bg-yellow-100 to bg-yellow-300 for a brighter color
                className="bg-yellow-200 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
             >
               <h3 className="text-xl font-semibold mb-3 text-slate-800">{feature.title}</h3> {/* Made text darker for better contrast */}
               <div className="w-24 h-24 flex items-center justify-center mb-4">
                 <img src={feature.imagePlaceholder} alt={feature.title} className="max-w-full max-h-full" />
               </div>
               <p className="text-slate-700 text-sm leading-relaxed">{feature.description}</p> {/* Made text darker for better contrast */}
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 }