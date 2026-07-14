"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { buildQueryString, futureDateInput, toDateInput } from "@/lib/utils";

export function HotelSearchBar({
  cities,
  defaults,
}: {
  cities: string[];
  defaults: { q?: string; checkIn?: string; checkOut?: string };
}) {
  const router = useRouter();
  const today = toDateInput(new Date());

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    router.push(
      `/hotels${buildQueryString({
        q: String(form.get("q") ?? ""),
        checkIn: String(form.get("checkIn") ?? ""),
        checkOut: String(form.get("checkOut") ?? ""),
        rooms: String(form.get("rooms") ?? ""),
        adults: String(form.get("adults") ?? ""),
      })}`,
    );
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-tile lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]"
    >
      <Field label="City or property" htmlFor="h-q">
        <Input
          id="h-q"
          name="q"
          defaultValue={defaults.q}
          placeholder="Goa, Udaipur, Dubai…"
          list="hotel-city-list"
        />
        <datalist id="hotel-city-list">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="Check-in" htmlFor="h-in">
        <Input
          id="h-in"
          name="checkIn"
          type="date"
          min={today}
          defaultValue={defaults.checkIn ?? futureDateInput(14)}
        />
      </Field>

      <Field label="Check-out" htmlFor="h-out">
        <Input
          id="h-out"
          name="checkOut"
          type="date"
          min={today}
          defaultValue={defaults.checkOut ?? futureDateInput(17)}
        />
      </Field>

      <Field label="Rooms" htmlFor="h-rooms">
        <Select id="h-rooms" name="rooms" defaultValue="1">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Guests" htmlFor="h-adults">
        <Select id="h-adults" name="adults" defaultValue="2">
          {[1, 2, 3, 4, 5, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-end">
        <Button type="submit" size="lg" variant="accent" className="h-12 w-full lg:w-auto lg:px-7">
          <Search aria-hidden />
          Search
        </Button>
      </div>
    </form>
  );
}
