import { Head } from "fresh/runtime";
import { RouteContext, SITE_TITLE } from "@/utils.ts";
import TransferConsultationList from "@/islands/TransferConsultationList.tsx";
import type { Transfer } from "@/database.ts";

interface Data {
  transfers: Transfer[];
}

export async function handler(ctx: RouteContext) {
  // 1. pedir todas las transferencias
  const resp = await fetch(
    `http://localhost:5173/api/transfersAndConsultations`
  );

  if (!resp.ok) {
    return new Response("Error getting transfers.", { status: 500 });
  }

  const transfers: Transfer[] = await resp.json();

  // 2. renderizar
  return ctx.render(<Home transfers={transfers} />);
}

export default function Home(props: Data) {
  const { transfers } = props;
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content="CRUD transfers" />
      </Head>

      <TransferConsultationList
        initialTransfers={transfers}
      />
    </>
  );
}
