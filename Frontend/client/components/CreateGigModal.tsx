'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { mockCategories } from '@/data/mockData';
import { ImagePlus, PlusCircle, X } from 'lucide-react';

interface CreateGigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGigModal: React.FC<CreateGigModalProps> = ({ isOpen, onClose }) => {
  const { addGig } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(mockCategories[0].name);
  const [subcategory, setSubcategory] = useState(mockCategories[0].subcategories[0]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(50);
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80'
  );
  const [tagsInput, setTagsInput] = useState('React, Next.js, Design');

  if (!isOpen) return null;

  const currentCategoryObj = mockCategories.find((c) => c.name === category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addGig({
      title: title.startsWith('I will') ? title : `I will ${title}`,
      description,
      category,
      subcategory,
      startingPrice: Number(price),
      images: [imageUrl],
      tags,
      packages: {
        basic: {
          name: 'Basic',
          title: 'Starter Package',
          description: 'Includes initial deliverables and standard resolution assets.',
          price: Number(price),
          deliveryDays: Number(deliveryDays),
          revisions: 2,
          features: [
            { name: 'Core Deliverable', included: true },
            { name: 'Source Files', included: true },
          ],
        },
        standard: {
          name: 'Standard',
          title: 'Standard Package',
          description: 'Comprehensive deliverables with priority support and extra revisions.',
          price: Number(price) * 2,
          deliveryDays: Math.min(Number(deliveryDays) + 2, 7),
          revisions: 4,
          features: [
            { name: 'Core Deliverable', included: true },
            { name: 'Source Files', included: true },
            { name: 'Commercial Rights', included: true },
          ],
        },
        premium: {
          name: 'Premium',
          title: 'VIP Enterprise Package',
          description: 'Full end-to-end deliverables with unlimited revisions and expedited delivery.',
          price: Number(price) * 4,
          deliveryDays: Math.min(Number(deliveryDays) + 4, 10),
          revisions: 'Unlimited',
          features: [
            { name: 'Core Deliverable', included: true },
            { name: 'Source Files', included: true },
            { name: 'Commercial Rights', included: true },
            { name: 'VIP Support', included: true },
          ],
        },
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6 text-[#1dbf73]">
          <PlusCircle size={22} />
          <h3 className="text-xl font-bold text-gray-900">Create a New Gig</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Gig Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. design a high converting Shopify store"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Title should be clear and punchy. It will automatically start with &apos;I will&apos;.
            </p>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const selectedCat = mockCategories.find((c) => c.name === e.target.value);
                  if (selectedCat) setSubcategory(selectedCat.subcategories[0]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73] bg-white"
              >
                {mockCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Subcategory
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73] bg-white"
              >
                {currentCategoryObj?.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Delivery Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Starting Price ($ USD)
              </label>
              <input
                type="number"
                min={5}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Basic Delivery Time (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe your gig in detail: what will you provide, what tools do you use, and why should buyers choose you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
            />
          </div>

          {/* Image URL with preset options */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ImagePlus size={14} />
              <span>Cover Image URL</span>
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
            />
            {/* Quick preset thumbnail selector */}
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-gray-400 self-center">Presets:</span>
              {[
                { label: 'Code', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80' },
                { label: 'Design', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=900&auto=format&fit=crop&q=80' },
                { label: 'Video', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900&auto=format&fit=crop&q=80' },
                { label: 'AI', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80' },
              ].map((p, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setImageUrl(p.url)}
                  className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-emerald-50 hover:text-[#1dbf73] rounded border border-gray-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Search Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Next.js, Logo, SEO, Writing"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
            >
              Publish Gig
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
