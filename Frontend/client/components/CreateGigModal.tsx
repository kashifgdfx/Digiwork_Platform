'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { mockCategories } from '@/data/mockData';
import { ImagePlus, PlusCircle, X, Trash2 } from 'lucide-react';

// Gig interface define kar rahe hain taaki TypeScript ko type pata ho
export interface Gig {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  startingPrice: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  ordersInQueue?: number;
  description?: string;
  tags?: string[];
  faqs?: { question: string; answer: string }[];
  packages?: any;
}

interface CreateGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  gigToEdit?: Gig | null;
  onGigSaved?: (savedGig: Gig) => void;
}

export const CreateGigModal: React.FC<CreateGigModalProps> = ({ 
  isOpen, 
  onClose, 
  gigToEdit, 
  onGigSaved 
}) => {
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

  // FAQs state
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    { question: '', answer: '' }
  ]);

  // Jab bhi `gigToEdit` aaye ya modal khule, agar edit mode hai toh form ko pre-fill kar do
// Safe useEffect with optional chaining to prevent crashes
  useEffect(() => {
    if (gigToEdit) {
      const rawTitle = gigToEdit.title || '';
      const cleanTitle = rawTitle.startsWith('I will ') 
        ? rawTitle.replace('I will ', '') 
        : rawTitle;
        
      setTitle(cleanTitle);
      setCategory(gigToEdit.category || mockCategories[0].name);
      setSubcategory(gigToEdit.subcategory || mockCategories[0].subcategories[0]);
      setDescription(gigToEdit.description || '');
      setPrice(gigToEdit.startingPrice || 50);
      setDeliveryDays(gigToEdit.packages?.basic?.deliveryDays || 3);
      setImageUrl(gigToEdit.images?.[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80');
      setTagsInput(gigToEdit.tags ? gigToEdit.tags.join(', ') : '');
      setFaqs(gigToEdit.faqs && gigToEdit.faqs.length > 0 ? gigToEdit.faqs : [{ question: '', answer: '' }]);
    } else {
      // Reset form for New Gig
      setTitle('');
      setCategory(mockCategories[0].name);
      setSubcategory(mockCategories[0].subcategories[0]);
      setDescription('');
      setPrice(50);
      setDeliveryDays(3);
      setImageUrl('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80');
      setTagsInput('React, Next.js, Design');
      setFaqs([{ question: '', answer: '' }]);
    }
  }, [gigToEdit, isOpen]);
  if (!isOpen) return null;

  const currentCategoryObj = mockCategories.find((c) => c.name === category);

  // FAQ Handlers
  const handleAddFaqField = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFaqField = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][field] = value;
    setFaqs(updatedFaqs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const filteredFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
    const finalTitle = title.startsWith('I will') ? title : `I will ${title}`;

    const gigData = {
      // Preserve fields the editor does not expose (seller, moderation state, etc.).
      ...(gigToEdit || {}),
      id: gigToEdit?.id || Date.now().toString(),
      title: finalTitle,
      description,
      category,
      subcategory,
      startingPrice: Number(price),
      images: [imageUrl],
      tags,
      faqs: filteredFaqs,
      packages: {
        ...(gigToEdit?.packages || {}),
        basic: { ...(gigToEdit?.packages?.basic || {}), name: 'Basic', title: 'Starter Package', description: 'Includes initial deliverables and standard resolution assets.', price: Number(price), deliveryDays: Number(deliveryDays), revisions: 2, features: [{ name: 'Core Deliverable', included: true }, { name: 'Source Files', included: true }] },
        standard: { ...(gigToEdit?.packages?.standard || {}), name: 'Standard', title: 'Standard Package', description: 'Comprehensive deliverables with priority support and extra revisions.', price: Number(price) * 2, deliveryDays: Math.min(Number(deliveryDays) + 2, 7), revisions: 4, features: [{ name: 'Core Deliverable', included: true }, { name: 'Source Files', included: true }, { name: 'Commercial Rights', included: true }] },
        premium: { ...(gigToEdit?.packages?.premium || {}), name: 'Premium', title: 'VIP Enterprise Package', description: 'Full end-to-end deliverables with unlimited revisions and expedited delivery.', price: Number(price) * 4, deliveryDays: Math.min(Number(deliveryDays) + 4, 10), revisions: 'Unlimited', features: [{ name: 'Core Deliverable', included: true }, { name: 'Source Files', included: true }, { name: 'Commercial Rights', included: true }, { name: 'VIP Support', included: true }] },
      },
    };

    if (onGigSaved) {
      onGigSaved(gigData);
    } else {
      addGig(gigData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-2 text-[#1dbf73]">
            <PlusCircle size={22} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              {gigToEdit ? 'Edit Gig' : 'Create a New Gig'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          <form id="create-gig-form" onSubmit={handleSubmit} className="space-y-4">
            
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
                placeholder="Describe your gig in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
              />
            </div>

            {/* FAQs Section */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  FAQs
                </label>
                <button
                  type="button"
                  onClick={handleAddFaqField}
                  className="text-xs text-[#1dbf73] font-semibold hover:underline flex items-center gap-1"
                >
                  <PlusCircle size={14} /> Add FAQ
                </button>
              </div>
              
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative space-y-2">
                    {faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFaqField(index)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <input
                      type="text"
                      placeholder="Question (e.g. Do you provide source files?)"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-[#1dbf73]"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-[#1dbf73]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Image URL */}
            <div className="pt-2 border-t border-gray-100">
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
              <div className="flex flex-wrap gap-2 mt-2">
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
                    className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-[#1dbf73] rounded border border-gray-200 transition-colors"
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
                placeholder="e.g. Next.js, Logo, SEO"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1dbf73]"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            form="create-gig-form"
            type="submit"
            className="px-6 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
          >
            {gigToEdit ? 'Save Changes' : 'Publish Gig'}
          </button>
        </div>

      </div>
    </div>
  );
};
