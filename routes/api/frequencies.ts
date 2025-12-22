import {
  Frequency,
  addFrequency,
  readFrequencies,
} from "@/database.ts";
import { ulid } from "ulid/mod.ts";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const patientId = url.searchParams.get("patientId"); // ?patientId=01HA...
    if (!patientId) {
      return new Response("Query param patientId required", { status: 400 });
    }
    const freqs = await readFrequencies(patientId);
    return Response.json(freqs);
  },

  async POST(ctx): Promise<Response> {
    const url = new URL(ctx.req.url);
    const patientId = url.searchParams.get("patientId");

    const raw = await ctx.req.json();

    // validaciones mínimas
    const labels: Record<string, string> = {
      start_date: "Falta introducir la fecha de inicio",
      frequency:  "Falta introducir la frecuencia",
    };

    const req = ['start_date','frequency'];
    for (const k of req) {
      if (!raw[k]) {
        return new Response(labels[k], { status: 400 });
      }
    }

    const newFreq: Frequency = {
      id: ulid(),
      patient_id: patientId!,
      frequency: raw.frequency,
      start_date: raw.start_date,
      // end_date: raw.end_date ?? null,
    };

    if (!newFreq.patient_id || !newFreq.start_date) {
      return new Response("Faltaron patient_id o start_date!", { status: 400 });
    }

    const res = await addFrequency(newFreq);
    if (!res.inserted) {
      // alert(res.msg); // esto paraliza el servidor
      return new Response(res.msg, { status: 400 });
    }

    return Response.json(newFreq, { status: 201 });
  }
});
