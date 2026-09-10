"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Globe,
  BriefcaseBusiness,
  GraduationCap,
  Award,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { User } from "@/types";
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/profile/${encodeURIComponent(username)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Profile not found");
        setUser(data.user);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Profile not found",
        ),
      )
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <ProfileSkeleton />;
  if (error || !user)
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Profile unavailable
        </h1>
        <p className="mt-2 text-gray-500">
          {error || "This profile does not exist."}
        </p>
        <Link
          href="/gigs"
          className="mt-6 inline-block rounded-lg bg-[#1dbf73] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Explore gigs
        </Link>
      </main>
    );

  const metrics = user.sellerMetrics;
  const languages = (user.languages || []).map((language) =>
    typeof language === "string"
      ? language
      : `${language.language} (${language.proficiency})`,
  );
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <img
              src={user.avatar || "/images/default-avatar.png"}
              alt={user.name}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-emerald-50"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1dbf73]">
                {user.profileCompletion?.percentage || 0}% profile complete
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {user.name}
              </h1>
              <p className="mt-1 text-gray-500">@{user.username}</p>
              <h2 className="mt-4 text-lg font-medium text-gray-800">
                {user.headline || "Freelance professional"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                {user.country && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={15} />
                    {[user.city, user.state, user.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
                <span>Member since {user.memberSince || "recently"}</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 px-5 py-4 text-center">
              <p className="text-2xl font-bold text-[#168f58]">
                {metrics?.averageRating?.toFixed(1) || "0.0"}
              </p>
              <div className="flex justify-center text-amber-500">
                <Star size={15} fill="currentColor" />
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                {metrics?.totalReviews || user.reviewCount || 0} reviews
              </p>
            </div>
          </div>
          <p className="mt-7 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600">
            {user.bio || "This freelancer has not added a biography yet."}
          </p>
        </section>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(user.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                  >
                    {skill}
                  </span>
                ))}
                {!user.skills?.length && (
                  <p className="text-sm text-gray-500">No skills added yet.</p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <BriefcaseBusiness size={20} />
                Experience
              </h2>
              <div className="mt-5 space-y-5">
                {(user.experience || []).map((item) => (
                  <div
                    key={item._id}
                    className="border-l-2 border-emerald-200 pl-4"
                  >
                    <h3 className="font-semibold text-gray-900">{item.role}</h3>
                    <p className="text-sm text-[#168f58]">{item.company}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                ))}
                {!user.experience?.length && (
                  <p className="text-sm text-gray-500">
                    No experience added yet.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <GraduationCap size={20} />
                Education
              </h2>
              <div className="mt-5 space-y-4">
                {(user.education || []).map((item) => (
                  <div key={item._id}>
                    <h3 className="font-semibold text-gray-900">
                      {item.degree}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.school}
                      {item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}
                    </p>
                  </div>
                ))}
                {!user.education?.length && (
                  <p className="text-sm text-gray-500">
                    No education added yet.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Award size={20} />
                Certifications
              </h2>
              <div className="mt-5 space-y-4">
                {(user.certifications || []).map((item) => (
                  <div key={item._id}>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.issuer}
                      {item.year ? ` · ${item.year}` : ""}
                    </p>
                  </div>
                ))}
                {!user.certifications?.length && (
                  <p className="text-sm text-gray-500">
                    No certifications added yet.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Portfolio</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {(user.portfolio || []).map((item) => (
                  <article
                    key={item._id}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </article>
                ))}
                {!user.portfolio?.length && (
                  <p className="text-sm text-gray-500">
                    No portfolio projects added yet.
                  </p>
                )}
              </div>
            </section>
          </div>
          <aside className="h-fit space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-gray-900">Seller statistics</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Level</dt>
                  <dd className="font-medium">
                    {metrics?.level || "New Seller"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Response rate</dt>
                  <dd className="font-medium">{metrics?.responseRate || 0}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Response time</dt>
                  <dd className="font-medium">
                    {metrics?.responseTime || "Not set"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Completed orders</dt>
                  <dd className="font-medium">
                    {metrics?.completedOrders || 0}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-gray-900">Languages</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {languages.map((language) => (
                  <p key={language}>{language}</p>
                ))}
                {!languages.length && <p>No languages added yet.</p>}
              </div>
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-gray-900">Online presence</h2>
              <div className="mt-3 space-y-2 text-sm">
                {Object.entries(user.socialLinks || {})
                  .filter(([, value]) => value)
                  .map(([key, value]) => (
                    <a
                      key={key}
                      href={String(value)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[#168f58] hover:underline"
                    >
                      <Globe size={14} />
                      {key}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                {!Object.values(user.socialLinks || {}).some(Boolean) && (
                  <p className="text-gray-500">No links added yet.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
