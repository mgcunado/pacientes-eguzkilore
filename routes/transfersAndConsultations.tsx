import { Head } from "fresh/runtime";
import { RouteContext, SITE_TITLE } from "@/utils.ts";
import TransferConsultationList from "@/islands/TransferConsultationList.tsx";
import type { Transfer } from "@/database.ts";

interface Data {
  // patientId: string;
  transfers: Transfer[];
  // patientCompleteName: string;
}

export async function handler(ctx: RouteContext) {
  // 1. leer query string
  // const url = new URL(ctx.req.url);
  // const patientId = url.searchParams.get("patientId") ?? "";
  // const name = url.searchParams!.get("name") ?? "";
  // const firstSurname = url.searchParams!.get("firstSurname") ?? "";
  // const secondSurname = url.searchParams!.get("secondSurname") ?? "";
  // const patientCompleteName = secondSurname === "" ? `${name} ${firstSurname} ${secondSurname}` : `${name} ${firstSurname}`;

  // 2. pedir todas las transferencias
  const resp = await fetch(
    `http://localhost:5173/api/transfersAndConsultations`
  );

  if (!resp.ok) {
    return new Response("Error getting transfers.", { status: 500 });
  }

  const transfers: Transfer[] = await resp.json();

  // 3. renderizar
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
