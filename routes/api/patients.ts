import { ulid } from "ulid/mod.ts";
import { define } from "@/utils.ts";

import {
  Patient,
  addPatient,
  readPatients,
  addFrequency,
} from "@/database.ts";

export const handler = define.handlers({
  async GET() {
    const patients = await readPatients();
    return Response.json(patients);
  },

  async POST(ctx): Promise<Response> {
    const body = await ctx.req.json(); // contiene frequency

    // validaciones mínimas
    // const req = ['name','first_surname','dni','city','phone','payment_method','frequency'];
    // for(const k of req) if(!body[k]) return new Response(`Missing ${k}`,{status:400});

    const pid = ulid();
    const newPat: Patient = { id: pid, ...body };

    // await addPatient(newPat);        // inserta patient

    const res = await addPatient(newPat);
    if (!res.inserted) return new Response(res.msg ?? "DNI duplicado", { status: 409 });

    await addFrequency({             // inserta su 1ª frecuencia
      id: ulid(),
      patient_id: pid,
      frequency: body.frequency,
      start_date: body.start_date,
      end_date: null
    });

    return Response.json(newPat, {status:201});
  }
});
