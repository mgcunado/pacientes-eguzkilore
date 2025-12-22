import { updatePatient, deletePatient, updateFrequency, readActiveFrequency } from "@/database.ts";
import { define } from "@/utils.ts";
import client from "@/lib/sql.ts";

interface RouteContext {
  req: Request;
  params: Record<string, string>;
}

export const handler = define.handlers({
  async PUT(ctx: RouteContext): Promise<Response> {
    const { id } = ctx.params;
    const body = await ctx.req.json(); // contiene frequency

    // 1. actualizar paciente
    const res = await updatePatient(id, body);

    if (res.msg) { // DNI duplicado
      return new Response(res.msg, { status: 409 });
    }

    // const activeFrequency = await readActiveFrequency(id);
    // const activeFrequencyId = activeFrequency[0]?.id;
    //
    // const resFrequency = await updateFrequency(
    //   activeFrequencyId,
    //   {
    //     patient_id: id,
    //     frequency: body.frequency,
    //   }
    // );

    if (res.affectedRows === 0 && !body.frequency) { // no existe
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    // 2. si envían frequency → actualizar la frecuencia activa
    if (body.frequency || body.freq) {
      await client.execute(
        `UPDATE frequencies
SET frequency = ?
WHERE patient_id = ? AND end_date IS NULL;`,
        [body.frequency, id]
      );
    }

    return Response.json({ message: "Successfully updated patient" });
  },

  async DELETE(ctx: RouteContext): Promise<Response> {
    const { id } = ctx.params;

    const { affectedRows } = await deletePatient(id);
    if (affectedRows === 0) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }
    return Response.json({ message: "Successfully removed patient" });
  },
});
