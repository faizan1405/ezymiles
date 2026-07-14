"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";

import { saveSiteSettings } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField } from "./image-field";
import { StringListField, ToggleField } from "./field-kits";
import { EmailTemplateManager, type EmailTemplateRow } from "./email-template-manager";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { CURRENCIES, CURRENCY_META } from "@/config/site";
import type { Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export function SettingsEditor({
  settings,
  integrationStatus,
  emailTemplates,
}: {
  settings: Settings;
  integrationStatus: Record<string, boolean>;
  emailTemplates: EmailTemplateRow[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState(() => ({
    brand: { ...settings.brand },
    contact: { ...settings.contact },
    social: { ...settings.social },
    announcement: {
      enabled: settings.announcement.enabled,
      intervalMs: settings.announcement.intervalMs,
      items: settings.announcement.items ?? [],
    },
    payments: { ...settings.payments },
    features: { ...settings.features },
    maintenance: { ...settings.maintenance },
    seo: { ...settings.seo, keywords: settings.seo.keywords ?? [] },
    rates: { ...settings.currency.rates } as Record<string, number>,
    about: { ...settings.about },
  }));

  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);

    const result = await saveSiteSettings({
      brand: values.brand,
      contact: values.contact,
      social: values.social,
      announcement: values.announcement,
      payments: values.payments,
      features: values.features,
      maintenance: values.maintenance,
      seo: values.seo,
      currency: { rates: values.rates },
      about: values.about,
    });

    if (result.ok) {
      toast.success("Settings saved", result.message);
      router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="accent" onClick={save} loading={saving} loadingText="Saving">
          <Save aria-hidden />
          Save settings
        </Button>
      </div>

      {/* ---------------------------- Integration status --------------------------- */}
      <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Razorpay", "razorpay"],
          ["Stripe", "stripe"],
          ["Cloudinary", "cloudinary"],
          ["Google login", "google"],
          ["SMTP email", "smtp"],
          ["Live flights", "liveFlights"],
        ].map(([label, key]) => {
          const on = integrationStatus[key];
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold",
                on
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-hairline bg-white text-muted",
              )}
            >
              {on ? (
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <XCircle className="size-3.5 shrink-0" aria-hidden />
              )}
              {label}
            </div>
          );
        })}
      </div>

      <p className="mb-6 rounded-2xl bg-sand-50 p-4 text-xs leading-relaxed text-muted">
        Integrations are configured with environment variables, not from this page — secrets never
        travel through the browser. A greyed-out badge above means the corresponding feature degrades
        gracefully rather than breaking.
      </p>

      <Tabs defaultValue="brand">
        <TabsList className="mb-6 rounded-full bg-white p-1">
          {[
            ["brand", "Brand & contact"],
            ["announcement", "Announcement"],
            ["payments", "Payments"],
            ["features", "Features"],
            ["seo", "SEO"],
            ["currency", "Currency"],
            ["about", "About & Founder"],
            ["email", "Email templates"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ================================ BRAND ================================ */}
        <TabsContent value="brand" className="space-y-5">
          <Panel title="Brand">
            <div className="space-y-4">
              <Field label="Brand name" htmlFor="s-name" required>
                <Input
                  id="s-name"
                  value={values.brand.name}
                  onChange={(e) =>
                    setValues({ ...values, brand: { ...values.brand, name: e.target.value } })
                  }
                  placeholder="Replace [TRAVEL BRAND NAME] with the real name"
                />
              </Field>

              <Field label="Tagline" htmlFor="s-tagline" required>
                <Input
                  id="s-tagline"
                  value={values.brand.tagline}
                  onChange={(e) =>
                    setValues({ ...values, brand: { ...values.brand, tagline: e.target.value } })
                  }
                />
              </Field>

              <ImageField
                label="Logo"
                value={{ url: values.brand.logoUrl ?? "", alt: values.brand.name }}
                onChange={(v) =>
                  setValues({ ...values, brand: { ...values.brand, logoUrl: v.url } })
                }
                folder="brand"
                hint="Replaces the built-in wordmark everywhere. SVG or transparent PNG."
              />
            </div>
          </Panel>

          <Panel title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" htmlFor="s-phone" required>
                <Input
                  id="s-phone"
                  value={values.contact.phone}
                  onChange={(e) =>
                    setValues({ ...values, contact: { ...values.contact, phone: e.target.value } })
                  }
                />
              </Field>

              <Field label="WhatsApp" htmlFor="s-whatsapp" required hint="Include the country code.">
                <Input
                  id="s-whatsapp"
                  value={values.contact.whatsapp}
                  onChange={(e) =>
                    setValues({ ...values, contact: { ...values.contact, whatsapp: e.target.value } })
                  }
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Email" htmlFor="s-email" required>
                <Input
                  id="s-email"
                  type="email"
                  value={values.contact.email}
                  onChange={(e) =>
                    setValues({ ...values, contact: { ...values.contact, email: e.target.value } })
                  }
                />
              </Field>

              <Field label="Office hours" htmlFor="s-hours">
                <Input
                  id="s-hours"
                  value={values.contact.officeHours ?? ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      contact: { ...values.contact, officeHours: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Office address" htmlFor="s-address" required className="sm:col-span-2">
                <Textarea
                  id="s-address"
                  rows={2}
                  value={values.contact.address}
                  onChange={(e) =>
                    setValues({ ...values, contact: { ...values.contact, address: e.target.value } })
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Social links">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["instagram", "facebook", "youtube", "linkedin", "x"] as const).map((key) => (
                <Field key={key} label={key === "x" ? "X (Twitter)" : key} htmlFor={`s-${key}`}>
                  <Input
                    id={`s-${key}`}
                    value={values.social[key] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, social: { ...values.social, [key]: e.target.value } })
                    }
                    placeholder="https://…"
                  />
                </Field>
              ))}
            </div>
          </Panel>
        </TabsContent>

        {/* ============================= ANNOUNCEMENT ============================ */}
        <TabsContent value="announcement">
          <Panel title="Announcement bar">
            <div className="space-y-5">
              <ToggleField
                label="Show the announcement bar"
                description="The thin strip above the header. Rotates between the messages below."
                checked={values.announcement.enabled}
                onChange={(v) =>
                  setValues({
                    ...values,
                    announcement: { ...values.announcement, enabled: v },
                  })
                }
              />

              <Field
                label="Rotation interval (ms)"
                htmlFor="s-interval"
                hint="3000–20000. Slower is kinder."
              >
                <Input
                  id="s-interval"
                  type="number"
                  min={3000}
                  max={20000}
                  step={500}
                  value={values.announcement.intervalMs}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      announcement: { ...values.announcement, intervalMs: Number(e.target.value) },
                    })
                  }
                />
              </Field>

              <fieldset>
                <div className="mb-2 flex items-center justify-between">
                  <legend className="text-[0.8125rem] font-semibold text-midnight-800">
                    Messages
                  </legend>
                  <Button
                    type="button"
                    size="sm"
                    variant="subtle"
                    onClick={() =>
                      setValues({
                        ...values,
                        announcement: {
                          ...values.announcement,
                          items: [...values.announcement.items, { text: "", emphasis: "", href: "" }],
                        },
                      })
                    }
                  >
                    <Plus aria-hidden />
                    Add message
                  </Button>
                </div>

                <ul className="space-y-3">
                  {values.announcement.items.map((item, i) => (
                    <li key={i} className="rounded-2xl border border-hairline bg-sand-50/60 p-4">
                      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_10rem_auto]">
                        <Field label="Badge" htmlFor={`an-${i}-badge`}>
                          <Input
                            id={`an-${i}-badge`}
                            value={item.emphasis ?? ""}
                            onChange={(e) => {
                              const items = [...values.announcement.items];
                              items[i] = { ...items[i], emphasis: e.target.value };
                              setValues({
                                ...values,
                                announcement: { ...values.announcement, items },
                              });
                            }}
                            placeholder="Early bird"
                          />
                        </Field>

                        <Field label="Message" htmlFor={`an-${i}-text`}>
                          <Input
                            id={`an-${i}-text`}
                            value={item.text}
                            onChange={(e) => {
                              const items = [...values.announcement.items];
                              items[i] = { ...items[i], text: e.target.value };
                              setValues({
                                ...values,
                                announcement: { ...values.announcement, items },
                              });
                            }}
                          />
                        </Field>

                        <Field label="Link (optional)" htmlFor={`an-${i}-href`}>
                          <Input
                            id={`an-${i}-href`}
                            value={item.href ?? ""}
                            onChange={(e) => {
                              const items = [...values.announcement.items];
                              items[i] = { ...items[i], href: e.target.value };
                              setValues({
                                ...values,
                                announcement: { ...values.announcement, items },
                              });
                            }}
                            placeholder="/packages"
                          />
                        </Field>

                        <div className="flex items-end pb-1">
                          <button
                            type="button"
                            onClick={() =>
                              setValues({
                                ...values,
                                announcement: {
                                  ...values.announcement,
                                  items: values.announcement.items.filter((_, idx) => idx !== i),
                                },
                              })
                            }
                            aria-label={`Remove message ${i + 1}`}
                            className="flex size-10 items-center justify-center rounded-lg text-midnight-400 hover:bg-white hover:text-red-600"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </div>
          </Panel>
        </TabsContent>

        {/* =============================== PAYMENTS ============================== */}
        <TabsContent value="payments">
          <Panel title="Payments">
            <div className="space-y-5">
              <ToggleField
                label="Allow deposit payments"
                description="Lets travellers hold a booking with a part-payment, then settle the balance before travel."
                checked={values.payments.partialPaymentEnabled}
                onChange={(v) =>
                  setValues({
                    ...values,
                    payments: { ...values.payments, partialPaymentEnabled: v },
                  })
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Deposit %" htmlFor="s-deposit" hint="Of the total, collected up-front.">
                  <Input
                    id="s-deposit"
                    type="number"
                    min={5}
                    max={100}
                    value={values.payments.depositPercent}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        payments: { ...values.payments, depositPercent: Number(e.target.value) },
                      })
                    }
                  />
                </Field>

                <Field
                  label="Balance due (days before travel)"
                  htmlFor="s-balance"
                >
                  <Input
                    id="s-balance"
                    type="number"
                    min={1}
                    max={120}
                    value={values.payments.balanceDueDaysBeforeTravel}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        payments: {
                          ...values.payments,
                          balanceDueDaysBeforeTravel: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>

                <Field label="Default tax %" htmlFor="s-tax">
                  <Input
                    id="s-tax"
                    type="number"
                    min={0}
                    max={30}
                    value={values.payments.taxPercentDefault}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        payments: { ...values.payments, taxPercentDefault: Number(e.target.value) },
                      })
                    }
                  />
                </Field>

                <Field label="Service fee (INR)" htmlFor="s-fee" hint="0 = no fee. Be honest about this.">
                  <Input
                    id="s-fee"
                    type="number"
                    min={0}
                    value={values.payments.serviceFeeINR}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        payments: { ...values.payments, serviceFeeINR: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
              </div>

              <ToggleField
                label="Use Stripe instead of Razorpay"
                description="Only switch this on once StripeProvider is implemented — otherwise checkout falls back to holding bookings for manual payment."
                checked={values.payments.stripeEnabled}
                onChange={(v) =>
                  setValues({
                    ...values,
                    payments: { ...values.payments, stripeEnabled: v },
                  })
                }
              />
            </div>
          </Panel>
        </TabsContent>

        {/* =============================== FEATURES ============================== */}
        <TabsContent value="features">
          <Panel title="Feature toggles">
            <p className="mb-4 text-xs leading-relaxed text-muted">
              Switching a module off hides it from the header, footer, homepage search and mobile
              menu. Existing bookings are unaffected.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["flightsEnabled", "Flights"],
                  ["hotelsEnabled", "Hotels"],
                  ["activitiesEnabled", "Activities"],
                  ["visaEnabled", "Visa assistance"],
                  ["cabsEnabled", "Cabs & transfers"],
                  ["wishlistEnabled", "Wishlist"],
                  ["reviewsEnabled", "Reviews"],
                  ["blogEnabled", "Blog"],
                ] as const
              ).map(([key, label]) => (
                <ToggleField
                  key={key}
                  label={label}
                  checked={values.features[key]}
                  onChange={(v) =>
                    setValues({ ...values, features: { ...values.features, [key]: v } })
                  }
                />
              ))}
            </div>
          </Panel>

          <Panel title="Maintenance mode" className="mt-5">
            <div className="space-y-4">
              <ToggleField
                label="Site under maintenance"
                description="Visitors see the message below instead of the site. Staff stay signed in and can still preview the live site and use /admin."
                checked={values.maintenance.enabled}
                onChange={(v) =>
                  setValues({ ...values, maintenance: { ...values.maintenance, enabled: v } })
                }
              />

              <Field label="Maintenance message" htmlFor="maintenance-message">
                <Textarea
                  id="maintenance-message"
                  rows={3}
                  value={values.maintenance.message}
                  onChange={(e) =>
                    setValues({ ...values, maintenance: { ...values.maintenance, message: e.target.value } })
                  }
                />
              </Field>
            </div>
          </Panel>
        </TabsContent>

        {/* ================================== SEO =============================== */}
        <TabsContent value="seo">
          <Panel title="Search engine defaults">
            <div className="space-y-4">
              <Field label="Default title" htmlFor="s-seotitle" required>
                <Input
                  id="s-seotitle"
                  value={values.seo.defaultTitle}
                  onChange={(e) =>
                    setValues({ ...values, seo: { ...values.seo, defaultTitle: e.target.value } })
                  }
                />
              </Field>

              <Field
                label="Title template"
                htmlFor="s-template"
                required
                hint="%s is replaced by the page title."
              >
                <Input
                  id="s-template"
                  value={values.seo.titleTemplate}
                  onChange={(e) =>
                    setValues({ ...values, seo: { ...values.seo, titleTemplate: e.target.value } })
                  }
                  placeholder="%s — Brand Name"
                />
              </Field>

              <Field label="Default description" htmlFor="s-seodesc" required>
                <Textarea
                  id="s-seodesc"
                  rows={3}
                  value={values.seo.defaultDescription}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      seo: { ...values.seo, defaultDescription: e.target.value },
                    })
                  }
                />
              </Field>

              <StringListField
                label="Keywords"
                value={values.seo.keywords}
                onChange={(v) => setValues({ ...values, seo: { ...values.seo, keywords: v } })}
              />

              <Field label="Google site verification" htmlFor="s-gsv">
                <Input
                  id="s-gsv"
                  value={values.seo.googleSiteVerification ?? ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      seo: { ...values.seo, googleSiteVerification: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
          </Panel>
        </TabsContent>

        {/* =============================== CURRENCY ============================== */}
        <TabsContent value="currency">
          <Panel title="Display exchange rates">
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              These affect display only. Every booking is charged in INR — a stale rate here can never
              change what a customer actually pays. Update them when they drift.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {CURRENCIES.filter((c) => c !== "INR").map((code) => (
                <Field
                  key={code}
                  label={`${code} per 1 INR`}
                  htmlFor={`rate-${code}`}
                  hint={CURRENCY_META[code].label}
                >
                  <Input
                    id={`rate-${code}`}
                    type="number"
                    step="0.0001"
                    min={0}
                    value={values.rates[code] ?? CURRENCY_META[code].rateFromINR}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        rates: { ...values.rates, [code]: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          </Panel>
        </TabsContent>

        {/* ================================ ABOUT ================================ */}
        <TabsContent value="about" className="space-y-5">
          <Panel title="About Us Section">
            <div className="space-y-4">
              <Field label="About Title" htmlFor="ab-title" required>
                <Input
                  id="ab-title"
                  value={values.about.aboutTitle}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, aboutTitle: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="About Description" htmlFor="ab-text" required hint="Use double newlines to separate paragraphs.">
                <Textarea
                  id="ab-text"
                  rows={10}
                  value={values.about.aboutText}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, aboutText: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Highlighted Message" htmlFor="ab-highlight" required>
                <Input
                  id="ab-highlight"
                  value={values.about.aboutHighlight}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, aboutHighlight: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Our Philosophy Section">
            <div className="space-y-4">
              <Field label="Philosophy Title" htmlFor="ab-ph-title" required>
                <Input
                  id="ab-ph-title"
                  value={values.about.philosophyTitle}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, philosophyTitle: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Philosophy Text" htmlFor="ab-ph-text" required hint="Use double newlines to separate paragraphs.">
                <Textarea
                  id="ab-ph-text"
                  rows={8}
                  value={values.about.philosophyText}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, philosophyText: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Founder's Note Section">
            <div className="space-y-4">
              <Field label="Section Heading" htmlFor="ab-fd-heading" required hint="Shown above the letter on the About page and the homepage preview.">
                <Input
                  id="ab-fd-heading"
                  value={values.about.founderHeading}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, founderHeading: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Founder Name" htmlFor="ab-fd-name" required>
                <Input
                  id="ab-fd-name"
                  value={values.about.founderName}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, founderName: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Founder Role" htmlFor="ab-fd-role" required>
                <Input
                  id="ab-fd-role"
                  value={values.about.founderRole}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, founderRole: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Founder's Story" htmlFor="ab-fd-story" required hint="The full letter. Use double newlines to separate paragraphs, and wrap text in **double asterisks** to bold it.">
                <Textarea
                  id="ab-fd-story"
                  rows={12}
                  value={values.about.founderStory}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, founderStory: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Primary highlighted quote" htmlFor="ab-fd-quote" required hint="Shown as the main pull-quote on the About page and homepage preview.">
                <Textarea
                  id="ab-fd-quote"
                  rows={2}
                  value={values.about.founderQuote}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, founderQuote: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="Secondary highlighted quote" htmlFor="ab-fd-quote2" hint="A short tagline-style quote — also appears in the site footer.">
                <Input
                  id="ab-fd-quote2"
                  value={values.about.founderQuoteSecondary}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      about: { ...values.about, founderQuoteSecondary: e.target.value },
                    })
                  }
                />
              </Field>

              <ImageField
                label="Founder Photograph"
                value={{ url: values.about.founderImageUrl ?? "", alt: values.about.founderName }}
                onChange={(v) =>
                  setValues({
                    ...values,
                    about: { ...values.about, founderImageUrl: v.url },
                  })
                }
                folder="brand"
                hint="Admins can upload the real founder photo. If empty, the website renders a premium profile placeholder."
              />

              <ImageField
                label="Founder Signature"
                value={{ url: values.about.founderSignatureUrl ?? "", alt: `${values.about.founderName} signature` }}
                onChange={(v) =>
                  setValues({
                    ...values,
                    about: { ...values.about, founderSignatureUrl: v.url },
                  })
                }
                folder="brand"
                hint="Optional. Upload a transparent PNG of the signature. If empty, a stylised text signature is shown instead."
              />
            </div>
          </Panel>
        </TabsContent>

        {/* ============================== EMAIL TEMPLATES ========================= */}
        <TabsContent value="email">
          <EmailTemplateManager templates={emailTemplates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
