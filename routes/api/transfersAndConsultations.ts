import { readAllTransfers } from "@/database.ts";
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET() {
    // const url = new URL(ctx.req.url);
    // const patientId = url.searchParams.get("patientId"); // ?patientId=01HA...
    // if (!patientId) {
    //   return new Response("Query param patientId required", { status: 400 });
    // }
    const transfers = await readAllTransfers();
    return Response.json(transfers);
  }
});
