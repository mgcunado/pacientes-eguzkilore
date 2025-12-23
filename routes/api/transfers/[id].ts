import { updateTransfer, deleteTransfer } from "@/database.ts";
import { define } from "@/utils.ts";

interface RouteContext {
  req: Request;
  params: Record<string, string>;
}

export const handler = define.handlers({
  async PUT(ctx: RouteContext): Promise<Response> {
    const { id } = ctx.params;
    const body = await ctx.req.json();

    const { affectedRows } = await updateTransfer(id, body);
    if (affectedRows === 0) {
      return Response.json({ error: "Transfer not found" }, { status: 404 });
    }
    return Response.json({ message: "Successfully updated transfer" });
  },

  async DELETE(ctx: RouteContext): Promise<Response> {
    const { id } = ctx.params;

    const { affectedRows } = await deleteTransfer(id);
    if (affectedRows === 0) {
      return Response.json({ error: "Transfer not found" }, { status: 404 });
    }
    return Response.json({ message: "Successfully removed transfer" });
  },
});

