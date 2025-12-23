import {
  Transfer,
  addTransfer,
  readTransfers,
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
    const transfers = await readTransfers(patientId);
    return Response.json(transfers);
  },

  async POST(ctx): Promise<Response> {
    const url = new URL(ctx.req.url);
    const patientId = url.searchParams.get("patientId");

    const raw = await ctx.req.json();

    // validaciones mínimas
    const labels: Record<string, string> = {
      transfer_date: "Falta introducir la fecha de transferencia",
      amount:  "Falta introducir la cantidad",
    };

    const req = ['transfer_date','amount'];
    for (const k of req) {
      if (!raw[k]) {
        return new Response(labels[k], { status: 400 });
      }
    }

    const newFreq: Transfer = {
      id: ulid(),
      patient_id: patientId!,
      amount: raw.amount,
      transfer_date: raw.transfer_date,
      // end_date: raw.end_date ?? null,
    };

    if (!newFreq.patient_id || !newFreq.transfer_date) {
      return new Response("Faltaron patient_id o transfer_date!", { status: 400 });
    }

    const res = await addTransfer(newFreq);
    if (!res.inserted) {
      // alert(res.msg); // esto paraliza el servidor
      return new Response(res.msg, { status: 400 });
    }

    return Response.json(newFreq, { status: 201 });
  }
});

