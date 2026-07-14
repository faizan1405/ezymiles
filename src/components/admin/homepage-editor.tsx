"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2 } from "lucide-react";

import { saveHomepage } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField } from "./image-field";
import { RepeatableField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import type { Settings } from "@/lib/settings";

/** Every toggleable homepage section, in the order they appear on the page. */
const SECTIONS: { key: string; label: string; description: string }[] = [
  { key: "liveActivity", label: "Live activity", description: "Real booking counts from the database." },
  { key: "destinations", label: "Destination explorer", description: "Tabbed destination cards." },
  { key: "trendingInternational", label: "Trending international trips", description: "Package rail." },
  { key: "bestOfIndia", label: "Best of India", description: "Package rail (dark)." },
  { key: "tripBuilder", label: "Build your own trip", description: "Multi-step planner." },
  { key: "honeymoon", label: "Honeymoon escapes", description: "Package rail." },
  { key: "map", label: "Interactive atlas", description: "World map with destination markers." },
  { key: "family", label: "Family holidays", description: "Package rail." },
  { key: "experiences", label: "Experiences", description: "Activity category grid." },
  { key: "luxury", label: "Luxury getaways", description: "Package rail (dark)." },
  { key: "offers", label: "Special offers", description: "Live offers with coupons." },
  { key: "adventure", label: "Adventure tours", description: "Package rail." },
  { key: "whyUs", label: "Why choose us", description: "Trust points." },
  { key: "weekend", label: "Weekend breaks", description: "Package rail." },
  { key: "groupDepartures", label: "Group departures", description: "Package rail (dark)." },
  { key: "testimonials", label: "Testimonials", description: "Approved reviews only." },
  { key: "flightInclusive", label: "Flight-inclusive deals", description: "Package rail." },
  { key: "blog", label: "Travel inspiration", description: "Latest articles." },
  { key: "leadCapture", label: "Newsletter & lead capture", description: "Subscribe + consultation." },
];

const ICONS = [
  "pen-line",
  "bed-double",
  "receipt",
  "headset",
  "shield-check",
  "map-pinned",
  "stamp",
  "calendar-clock",
];

export function HomepageEditor({ homepage }: { homepage: Settings["homepage"] }) {
  const router = useRouter();

  const [values, setValues] = React.useState(() => ({
    heroHeadline: homepage.heroHeadline,
    heroSubheadline: homepage.heroSubheadline,
    heroMediaKind: homepage.heroMediaKind,
    heroVideoUrl: homepage.heroVideoUrl ?? "",
    heroSlides: homepage.heroSlides ?? [],
    sections: homepage.sections ?? {},
    liveActivityEnabled: homepage.liveActivityEnabled,
    trustPoints: homepage.trustPoints ?? [],
  }));

  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    const result = await saveHomepage(values);

    if (result.ok) {
      toast.success("Homepage updated", result.message);
      router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  const isOn = (key: string) => values.sections[key] !== false;

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="accent" onClick={save} loading={saving} loadingText="Saving">
          <Save aria-hidden />
          Save homepage
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-5">
          {/* ---------------------------------- Hero --------------------------------- */}
          <Panel title="Hero">
            <div className="space-y-4">
              <Field label="Headline" htmlFor="h-headline" required>
                <Textarea
                  id="h-headline"
                  rows={2}
                  value={values.heroHeadline}
                  onChange={(e) => setValues({ ...values, heroHeadline: e.target.value })}
                />
              </Field>

              <Field label="Supporting line" htmlFor="h-sub" required>
                <Textarea
                  id="h-sub"
                  rows={2}
                  value={values.heroSubheadline}
                  onChange={(e) => setValues({ ...values, heroSubheadline: e.target.value })}
                />
              </Field>

              <Field
                label="Hero media"
                htmlFor="h-kind"
                hint="Video plays muted on desktop only, and is replaced by the slideshow under reduced motion."
              >
                <Select
                  id="h-kind"
                  value={values.heroMediaKind}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      heroMediaKind: e.target.value as "video" | "slideshow",
                    })
                  }
                >
                  <option value="slideshow">Image slideshow</option>
                  <option value="video">Video (with slideshow fallback)</option>
                </Select>
              </Field>

              {values.heroMediaKind === "video" ? (
                <Field
                  label="Video URL (MP4)"
                  htmlFor="h-video"
                  hint="The first slide below is used as the poster image."
                >
                  <Input
                    id="h-video"
                    value={values.heroVideoUrl}
                    onChange={(e) => setValues({ ...values, heroVideoUrl: e.target.value })}
                    placeholder="https://…/hero.mp4"
                  />
                </Field>
              ) : null}
            </div>
          </Panel>

          {/* ------------------------------- Hero slides ----------------------------- */}
          <Panel
            title="Hero slides"
            action={
              <Button
                size="sm"
                variant="subtle"
                onClick={() =>
                  setValues({
                    ...values,
                    heroSlides: [...values.heroSlides, { url: "", alt: "", location: "" }],
                  })
                }
              >
                <Plus aria-hidden />
                Add slide
              </Button>
            }
          >
            {values.heroSlides.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline p-5 text-center text-sm text-muted">
                No slides set. The homepage will fall back to your featured destination images.
              </p>
            ) : (
              <ul className="space-y-4">
                {values.heroSlides.map((slide, i) => (
                  <li key={i} className="rounded-2xl border border-hairline bg-sand-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">
                        Slide {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setValues({
                            ...values,
                            heroSlides: values.heroSlides.filter((_, idx) => idx !== i),
                          })
                        }
                        aria-label={`Remove slide ${i + 1}`}
                        className="flex size-7 items-center justify-center rounded-lg text-midnight-400 hover:bg-white hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>

                    <ImageField
                      label="Image"
                      value={{ url: slide.url, alt: slide.alt }}
                      onChange={(v) => {
                        const heroSlides = [...values.heroSlides];
                        heroSlides[i] = { ...heroSlides[i], url: v.url, alt: v.alt };
                        setValues({ ...values, heroSlides });
                      }}
                      folder="general"
                      hint="Wide and dark enough for white text to stay readable."
                    />

                    <Field label="Location label" htmlFor={`hs-${i}-loc`} className="mt-3">
                      <Input
                        id={`hs-${i}-loc`}
                        value={slide.location ?? ""}
                        onChange={(e) => {
                          const heroSlides = [...values.heroSlides];
                          heroSlides[i] = { ...heroSlides[i], location: e.target.value };
                          setValues({ ...values, heroSlides });
                        }}
                        placeholder="Nusa Penida, Indonesia"
                      />
                    </Field>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ------------------------------ Trust points ----------------------------- */}
          <Panel title="Why choose us">
            <RepeatableField
              label="Trust points"
              addLabel="Add point"
              hint="Leave empty to use the built-in defaults. Never invent statistics here."
              items={values.trustPoints}
              onChange={(v) => setValues({ ...values, trustPoints: v })}
              createEmpty={() => ({ icon: "shield-check", title: "", description: "" })}
              renderRow={(point, i, update) => (
                <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                  <Field label="Icon" htmlFor={`tp-${i}-icon`}>
                    <Select
                      id={`tp-${i}-icon`}
                      value={point.icon}
                      onChange={(e) => update({ icon: e.target.value })}
                    >
                      {ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Title" htmlFor={`tp-${i}-title`}>
                    <Input
                      id={`tp-${i}-title`}
                      value={point.title}
                      onChange={(e) => update({ title: e.target.value })}
                    />
                  </Field>

                  <Field label="Description" htmlFor={`tp-${i}-desc`} className="sm:col-span-2">
                    <Textarea
                      id={`tp-${i}-desc`}
                      rows={2}
                      value={point.description}
                      onChange={(e) => update({ description: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            />
          </Panel>
        </div>

        {/* -------------------------------- Sections -------------------------------- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Panel title="Sections">
            <p className="mb-4 text-xs leading-relaxed text-muted">
              Turn any section off to hide it. Rails with no packages behind them hide themselves
              automatically, so an empty database still produces a clean page.
            </p>

            <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {SECTIONS.map((section) => (
                <ToggleField
                  key={section.key}
                  label={section.label}
                  description={section.description}
                  checked={
                    section.key === "liveActivity"
                      ? values.liveActivityEnabled && isOn(section.key)
                      : isOn(section.key)
                  }
                  onChange={(v) =>
                    setValues({
                      ...values,
                      sections: { ...values.sections, [section.key]: v },
                      ...(section.key === "liveActivity" ? { liveActivityEnabled: v } : {}),
                    })
                  }
                />
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
