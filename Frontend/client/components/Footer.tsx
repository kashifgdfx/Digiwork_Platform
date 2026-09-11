import React from 'react';
import Link from 'next/link';
import { Globe, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20 pt-16 pb-12 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Column 1 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Categories</h4>
            <ul className="space-y-2.5">
              <li><Link href="/gigs?category=Graphics%20%26%20Design" className="hover:underline">Graphics & Design</Link></li>
              <li><Link href="/gigs?category=Digital%20Marketing" className="hover:underline">Digital Marketing</Link></li>
              <li><Link href="/gigs?category=Writing%20%26%20Translation" className="hover:underline">Writing & Translation</Link></li>
              <li><Link href="/gigs?category=Video%20%26%20Animation" className="hover:underline">Video & Animation</Link></li>
              <li><Link href="/gigs?category=Music%20%26%20Audio" className="hover:underline">Music & Audio</Link></li>
              <li><Link href="/gigs?category=Programming%20%26%20Tech" className="hover:underline">Programming & Tech</Link></li>
              <li><Link href="/gigs?category=AI%20Services" className="hover:underline">AI Services</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">About</h4>
            <ul className="space-y-2.5">
              <li><span className="hover:underline cursor-pointer">Careers</span></li>
              <li><span className="hover:underline cursor-pointer">Press & News</span></li>
              <li><span className="hover:underline cursor-pointer">Partnerships</span></li>
              <li><span className="hover:underline cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:underline cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:underline cursor-pointer">Investor Relations</span></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Support & Education</h4>
            <ul className="space-y-2.5">
              <li><span className="hover:underline cursor-pointer">Help & Support</span></li>
              <li><span className="hover:underline cursor-pointer">Trust & Safety</span></li>
              <li><span className="hover:underline cursor-pointer">Selling on Digiwork</span></li>
              <li><span className="hover:underline cursor-pointer">Buying on Digiwork</span></li>
              <li><span className="hover:underline cursor-pointer">Digiwork Guides</span></li>
              <li><span className="hover:underline cursor-pointer">Learn Online Courses</span></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li><span className="hover:underline cursor-pointer">Customer Success Stories</span></li>
              <li><span className="hover:underline cursor-pointer">Community Hub</span></li>
              <li><span className="hover:underline cursor-pointer">Forum</span></li>
              <li><span className="hover:underline cursor-pointer">Events</span></li>
              <li><span className="hover:underline cursor-pointer">Blog</span></li>
              <li><span className="hover:underline cursor-pointer">Creators Network</span></li>
            </ul>
          </div>

          {/* Column 5 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Business Solutions</h4>
            <ul className="space-y-2.5">
              <li><span className="hover:underline cursor-pointer">Digiwork Pro</span></li>
              <li><span className="hover:underline cursor-pointer">Project Management</span></li>
              <li><span className="hover:underline cursor-pointer">ClearVoice Content</span></li>
              <li><span className="hover:underline cursor-pointer">Working Not Working</span></li>
              <li><span className="hover:underline cursor-pointer">Enterprise Services</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-gray-900">
              Digiwork<span className="text-[#1dbf73]">.</span>
            </span>
            <span>© 2026 Digiwork International Ltd. Production Clone.</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900">
              <Globe size={14} />
              <span>English</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
              <span>USD ($)</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span>Crafted with</span>
              <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
              <span>for elite engineering</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
