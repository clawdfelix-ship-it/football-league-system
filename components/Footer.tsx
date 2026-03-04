'use client';

import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-white text-xl font-bold mb-4 tracking-tight">
            {isZh ? 'Zenex 是什麼' : 'What is Zenex'}
          </h3>
          <p className="mb-4 text-sm leading-relaxed">
            {isZh 
              ? 'Zenex 是一個融合東方智慧與現代運動精神的品牌，名稱源自兩個核心概念：「Zen」（禪）與「Ex」（卓越）。'
              : 'Zenex is a brand that fuses Eastern wisdom with modern sportsmanship, deriving its name from two core concepts: "Zen" (禪) and "Ex" (Excellence).'}
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-1 text-sm">• Zen (禪)</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                {isZh
                  ? '源自東方禪宗哲學，象徵內心的平靜、專注與自我修養。它強調透過冥想與修練達到心靈的寧靜與集中，這與運動所需的專注力、內心平靜及自我超越完美契合。在香港文化中，禪傳遞了平衡、和諧與內在力量——這正是 Zenex 追求的精神本質。'
                  : 'Originating from Eastern Zen philosophy, it symbolizes inner peace, focus, and self-improvement. It emphasizes achieving a state of mental tranquility and concentration through meditation and practice, aligning perfectly with the focus, inner calm, and self-transcendence required in sports. In Hong Kong culture, Zen conveys balance, harmony, and inner strength—the very spiritual essence Zenex pursues.'}
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-1 text-sm">• Ex (Excellence)</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                {isZh
                  ? '源自「Excellence」（卓越），代表傑出、突破極限與持續自我提升。它體現了一種積極進取的運動態度，呼應了香港社會的現實精神——競爭、成就導向與追求卓越。'
                  : 'Derived from "Excellence," it represents distinction, breaking limits, and continuous self-improvement. It embodies a proactive, striving athletic attitude, echoing the realistic spirit of Hong Kong society—competitive, success-oriented, and excellence-driven.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm leading-relaxed italic border-l-4 border-blue-500 pl-4 mb-6">
              {isZh
                ? '"Zenex 結合了「Zen」的內在平靜與「Ex」的外在驅動力，傳達出運動不僅是身體的挑戰，更是一場內外兼修的心靈旅程。品牌鼓勵用戶勇敢追求卓越、突破極限，同時保持內心的平和與專注。"'
                : '"Zenex integrates the inner peace of \'Zen\' with the outward drive of \'Ex,\' conveying that sports is not just a physical challenge but a spiritual journey of internal and external cultivation. The brand encourages users to bravely pursue excellence and break through their limits while maintaining inner peace and focus."'}
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
              <span className="hover:text-white cursor-pointer transition-colors">
                {isZh ? '私隱政策' : 'Privacy Policy'}
              </span>
              <span className="hover:text-white cursor-pointer transition-colors">
                {isZh ? '服務條款' : 'Terms of Service'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
