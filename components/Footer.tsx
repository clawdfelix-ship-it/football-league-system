import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-white text-xl font-bold mb-4 tracking-tight">What is Zenex</h3>
          <p className="mb-4 text-sm leading-relaxed">
            Zenex is a brand that fuses Eastern wisdom with modern sportsmanship, deriving its name from two core concepts: "Zen" (禪) and "Ex" (Excellence).
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-1 text-sm">• Zen (禪)</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Originating from Eastern Zen philosophy, it symbolizes inner peace, focus, and self-improvement. It emphasizes achieving a state of mental tranquility and concentration through meditation and practice, aligning perfectly with the focus, inner calm, and self-transcendence required in sports. In Hong Kong culture, Zen conveys balance, harmony, and inner strength—the very spiritual essence Zenex pursues.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-1 text-sm">• Ex (Excellence)</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Derived from "Excellence," it represents distinction, breaking limits, and continuous self-improvement. It embodies a proactive, striving athletic attitude, echoing the realistic spirit of Hong Kong society—competitive, success-oriented, and excellence-driven.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm leading-relaxed italic border-l-4 border-blue-500 pl-4 mb-6">
              "Zenex integrates the inner peace of 'Zen' with the outward drive of 'Ex,' conveying that sports is not just a physical challenge but a spiritual journey of internal and external cultivation. The brand encourages users to bravely pursue excellence and break through their limits while maintaining inner peace and focus."
            </p>
            
            <div className="flex gap-4 justify-end mt-4">
              <div className="relative h-24 w-36 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                <Image 
                  src="/ref1.jpg" 
                  alt="Zenex Reference 1" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <div className="relative h-24 w-36 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                <Image 
                  src="/ref2.jpeg" 
                  alt="Zenex Reference 2" 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-6 mt-6 text-xs text-slate-500 flex justify-between items-center">
            <p>&copy; {new Date().getFullYear()} ZENEX-SPORTS LeagueCenter. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}