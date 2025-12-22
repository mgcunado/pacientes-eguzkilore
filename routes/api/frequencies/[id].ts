import { updateFrequency, deleteFrequency } from "@/database.ts";
import { define } from "@/utils.ts";

interface RouteContext {
  req: Request;
  params: Record<string, string>;
}

export const handler = define.handlers({
  async PUT(ctx: RouteContext): Promise<Response> {
    const { id } = ctx.params;
    const body = await ctx.req.json(); // { startDate?, endDate? }

    const { affectedRows } = await updateFrequency(id, body);
    if (affectedRows === 0) {
      return Response.json({ error: "Frequency not found" }, { status: 404 });
    }
    return Response.json({ message: "Successfully updated frequency" });
  },

  async DELETE(ctx: RouteContext): Promise<Response> {
    const { id } = ctx.params;

    const { affectedRows } = await deleteFrequency(id);
    if (affectedRows === 0) {
      return Response.json({ error: "Frequency not found" }, { status: 404 });
    }
    return Response.json({ message: "Successfully removed frequency" });
  },
});
