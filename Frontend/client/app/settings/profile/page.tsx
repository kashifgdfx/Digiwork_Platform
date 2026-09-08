'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { Education, Experience, Certification, PortfolioItem } from '@/types';

const tabs = ['Personal Information', 'Professional Information', 'Skills', 'Languages', 'Education', 'Certifications', 'Experience', 'Portfolio', 'Social Links'] as const;
type Tab = typeof tabs[number];

type FieldMap = Record<string, string>;
const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#1dbf73] focus:ring-2 focus:ring-emerald-100';

function languageLabel(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'language' in value) return `${String(value.language)} (${String((value as { proficiency?: string }).proficiency || '')})`;
  return '';
}

export default function ProfileSettingsPage() {
  const { currentUser, updateProfile, addProfileItem, updateProfileItem, deleteProfileItem, uploadAvatar } = useApp();
  const [tab, setTab] = useState<Tab>('Personal Information');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<FieldMap>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!currentUser) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-gray-500">Loading profile...</div>;

  const setField = (key: string, value: string) => setFields((previous) => ({ ...previous, [key]: value }));
  const resetForm = () => { setFields({}); setEditingId(null); };
  const feedback = (text: string) => { setMessage(text); setError(''); setTimeout(() => setMessage(''), 3000); };
  const fail = (text: string) => { setError(text); setMessage(''); };

  const saveBasic = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: fields.name ?? currentUser.name,
        username: fields.username ?? currentUser.username,
        phone: fields.phone ?? currentUser.phone,
        country: fields.country ?? currentUser.country,
        state: fields.state ?? currentUser.state,
        city: fields.city ?? currentUser.city,
        timezone: fields.timezone ?? currentUser.timezone,
      });
      feedback('Personal information saved.');
    } catch (err) { fail(err instanceof Error ? err.message : 'Unable to save profile.'); }
    finally { setSaving(false); }
  };

  const saveProfessional = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ headline: fields.headline ?? currentUser.headline, bio: fields.bio ?? currentUser.bio });
      feedback('Professional information saved.');
    } catch (err) { fail(err instanceof Error ? err.message : 'Unable to save profile.'); }
    finally { setSaving(false); }
  };

  const saveSocial = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ socialLinks: { ...(currentUser.socialLinks || {}), ...fields } });
      feedback('Social links saved.');
    } catch (err) { fail(err instanceof Error ? err.message : 'Unable to save links.'); }
    finally { setSaving(false); }
  };

  const saveCollection = async (event: FormEvent, collection: string, item: Record<string, unknown>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateProfileItem(collection, editingId, item);
      else await addProfileItem(collection, item);
      resetForm();
      feedback(`${collection[0].toUpperCase()}${collection.slice(1)} saved.`);
    } catch (err) { fail(err instanceof Error ? err.message : 'Unable to save item.'); }
    finally { setSaving(false); }
  };

  const removeItem = async (collection: string, id: string) => {
    setSaving(true);
    try { await deleteProfileItem(collection, id); feedback('Item deleted.'); }
    catch (err) { fail(err instanceof Error ? err.message : 'Unable to delete item.'); }
    finally { setSaving(false); }
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return fail('Please select an image file.');
    if (file.size > 3 * 1024 * 1024) return fail('Avatar must be smaller than 3MB.');
    const reader = new FileReader();
    reader.onload = async () => {
      try { await uploadAvatar(String(reader.result)); feedback('Profile picture updated.'); }
      catch (err) { fail(err instanceof Error ? err.message : 'Unable to upload avatar.'); }
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (item: Record<string, unknown>) => {
    setEditingId(String(item._id || ''));
    setFields(Object.entries(item).reduce<FieldMap>((result, [key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') result[key] = String(value);
      return result;
    }, {}));
  };

  const renderCollection = (collection: 'languages' | 'education' | 'certifications' | 'experience' | 'portfolio') => {
    const values = (currentUser[collection] || []) as unknown as Array<Record<string, unknown>>;
    const configs: Record<string, Array<[string, string, string]>> = {
      languages: [['language', 'Language', 'text'], ['proficiency', 'Proficiency', 'text']],
      education: [['school', 'School', 'text'], ['degree', 'Degree', 'text'], ['fieldOfStudy', 'Field of study', 'text'], ['fromYear', 'From year', 'number'], ['toYear', 'To year', 'number']],
      certifications: [['title', 'Certification', 'text'], ['issuer', 'Issuer', 'text'], ['year', 'Year', 'number']],
      experience: [['company', 'Company', 'text'], ['role', 'Role', 'text'], ['description', 'Description', 'text'], ['startDate', 'Start date', 'date'], ['endDate', 'End date', 'date']],
      portfolio: [['title', 'Title', 'text'], ['description', 'Description', 'text'], ['image', 'Image URL', 'url']],
    };
    const form = configs[collection].reduce<Record<string, unknown>>((result, [key]) => {
      result[key] = fields[key] || undefined;
      return result;
    }, {});
    if (collection === 'experience') form.currentlyWorking = fields.currentlyWorking === 'true';
    return <div className="space-y-6">
      <form onSubmit={(event) => saveCollection(event, collection, form)} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {configs[collection].map(([key, label, type]) => <label key={key} className={key === 'description' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span><input className={inputClass} type={type} value={fields[key] || ''} onChange={(event) => setField(key, event.target.value)} required={['language', 'proficiency', 'school', 'degree', 'title', 'issuer', 'company', 'role', 'startDate'].includes(key)} /></label>)}
        </div>
        {collection === 'experience' && <label className="mt-4 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={fields.currentlyWorking === 'true'} onChange={(event) => setField('currentlyWorking', String(event.target.checked))} /> I currently work here</label>}
        <div className="mt-5 flex gap-2"><button disabled={saving} className="rounded-lg bg-[#1dbf73] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{editingId ? 'Update' : 'Add'} {collection}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button>}</div>
      </form>
      <div className="space-y-3">{values.map((item) => <div key={String(item._id)} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"><div><h3 className="font-semibold text-gray-900">{String(item.title || item.role || item.school || item.language || '')}</h3><p className="mt-1 text-sm text-gray-500">{String(item.description || item.degree || item.proficiency || item.issuer || item.company || '')}</p></div><div className="flex shrink-0 gap-3 text-sm"><button onClick={() => startEdit(item)} className="font-medium text-[#1dbf73]">Edit</button><button onClick={() => removeItem(collection, String(item._id))} className="font-medium text-red-600">Delete</button></div></div>)}</div>
      {!values.length && <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Nothing added yet.</p>}
    </div>;
  };

  return <main className="min-h-screen bg-gray-50 py-8"><div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#1dbf73]">Account settings</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Edit your profile</h1><p className="mt-2 text-sm text-gray-500">Keep your professional profile current so clients know who they are hiring.</p></div><Link href={`/profile/${currentUser.username}`} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">View public profile</Link></div>
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><div className="mb-4 flex items-center gap-3 border-b border-gray-100 p-2 pb-4"><img src={currentUser.avatar || '/images/default-avatar.png'} alt={currentUser.name} className="h-12 w-12 rounded-full object-cover" /><div className="min-w-0"><p className="truncate font-semibold text-gray-900">{currentUser.name}</p><p className="text-xs text-gray-500">{currentUser.profileCompletion?.percentage || 0}% complete</p></div></div>{tabs.map((item) => <button key={item} onClick={() => { setTab(item); resetForm(); }} className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${tab === item ? 'bg-emerald-50 font-semibold text-[#168f58]' : 'text-gray-600 hover:bg-gray-50'}`}>{item}</button>)}</aside>
      <section>
        {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {tab === 'Personal Information' && <form onSubmit={saveBasic} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Personal information</h2><p className="text-sm text-gray-500">How clients identify and contact you.</p></div><label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold">Change photo<input type="file" accept="image/*" onChange={handleAvatar} className="hidden" /></label></div><div className="grid gap-4 sm:grid-cols-2">{[['name', 'Full name'], ['username', 'Username'], ['phone', 'Phone'], ['country', 'Country'], ['state', 'State'], ['city', 'City'], ['timezone', 'Timezone']].map(([key, label]) => <label key={key}><span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span><input className={inputClass} value={fields[key] ?? String(currentUser[key as keyof typeof currentUser] || '')} onChange={(event) => setField(key, event.target.value)} required={key === 'name' || key === 'username'} /></label>)}</div><button disabled={saving} className="mt-6 rounded-lg bg-[#1dbf73] px-5 py-2.5 text-sm font-semibold text-white">Save changes</button></form>}
        {tab === 'Professional Information' && <form onSubmit={saveProfessional} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Professional information</h2><div className="mt-5 space-y-4"><label><span className="mb-1.5 block text-sm font-medium text-gray-700">Professional headline</span><input className={inputClass} value={fields.headline ?? (currentUser.headline || '')} onChange={(event) => setField('headline', event.target.value)} /></label><label><span className="mb-1.5 block text-sm font-medium text-gray-700">Bio</span><textarea className={`${inputClass} min-h-40`} value={fields.bio ?? (currentUser.bio || '')} onChange={(event) => setField('bio', event.target.value)} /></label></div><button disabled={saving} className="mt-6 rounded-lg bg-[#1dbf73] px-5 py-2.5 text-sm font-semibold text-white">Save changes</button></form>}
        {tab === 'Skills' && <div className="space-y-5"><form onSubmit={(event) => { event.preventDefault(); void addProfileItem('skills', { skill: fields.skill }).then(() => { setField('skill', ''); feedback('Skill added.'); }).catch((err: unknown) => fail(err instanceof Error ? err.message : 'Unable to add skill.')); }} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><input className={inputClass} placeholder="Add a skill" value={fields.skill || ''} onChange={(event) => setField('skill', event.target.value)} /><button className="rounded-lg bg-[#1dbf73] px-4 py-2 text-sm font-semibold text-white">Add</button></form><div className="flex flex-wrap gap-2">{(currentUser.skills || []).map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{skill}<button type="button" onClick={() => void deleteProfileItem('skills', skill).then(() => feedback('Skill removed.')).catch((err: unknown) => fail(err instanceof Error ? err.message : 'Unable to remove skill.'))}>×</button></span>)}</div></div>}
        {tab === 'Languages' && renderCollection('languages')}
        {tab === 'Education' && renderCollection('education')}
        {tab === 'Certifications' && renderCollection('certifications')}
        {tab === 'Experience' && renderCollection('experience')}
        {tab === 'Portfolio' && renderCollection('portfolio')}
        {tab === 'Social Links' && <form onSubmit={saveSocial} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Social links</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{['website', 'linkedin', 'github', 'twitter', 'instagram'].map((key) => <label key={key}><span className="mb-1.5 block text-sm font-medium capitalize text-gray-700">{key}</span><input className={inputClass} value={fields[key] ?? (currentUser.socialLinks?.[key as keyof typeof currentUser.socialLinks] || '')} onChange={(event) => setField(key, event.target.value)} /></label>)}</div><button disabled={saving} className="mt-6 rounded-lg bg-[#1dbf73] px-5 py-2.5 text-sm font-semibold text-white">Save links</button></form>}
      </section>
    </div>
  </div></main>;
}
