import {
  Consultation,
  addConsultation,
  readConsultations,
} from "@/database.ts";
import { ulid } from "ulid/mod.ts";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const transferId = url.searchParams.get("transferId");
    if (!transferId) {
      return new Response("Query param transferId required", { status: 400 });
    }
    const constultations = await readConsultations(transferId);
    return Response.json(constultations);
  },

  async POST(ctx): Promise<Response> {
    const url = new URL(ctx.req.url);
    const transferId = url.searchParams.get("transferId");

    const raw = await ctx.req.json();

    // validaciones mínimas
    const labels: Record<string, string> = {
      consultation_date: "Falta introducir la fecha de consulta",
    };

    const req = ['consultation_date'];
    for (const k of req) {
      if (!raw[k]) {
        return new Response(labels[k], { status: 400 });
      }
    }

    const newFreq: Consultation = {
      id: ulid(),
      transfer_id: transferId!,
      consultation_date: raw.consultation_date,
    };

    if (!newFreq.transfer_id || !newFreq.consultation_date) {
      return new Response("Faltaron transfer_id o consultation_date!", { status: 400 });
    }

    const res = await addConsultation(newFreq);
    if (!res.inserted) {
      // alert(res.msg); // esto paraliza el servidor
      return new Response(res.msg, { status: 400 });
    }

    return Response.json(newFreq, { status: 201 });
  }
});
