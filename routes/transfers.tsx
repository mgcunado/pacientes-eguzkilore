import { Head } from "fresh/runtime";
import { RouteContext, SITE_TITLE } from "@/utils.ts";
import TransferList from "@/islands/TransferList.tsx";
import type { Transfer } from "@/database.ts";

interface Data {
  patientId: string;
  transfers: Transfer[];
  patientCompleteName: string;
}

export async function handler(ctx: RouteContext) {
  // 1. leer query string
  const url = new URL(ctx.req.url);
  const patientId = url.searchParams.get("patientId") ?? "";
  const name = url.searchParams!.get("name") ?? "";
  const firstSurname = url.searchParams!.get("firstSurname") ?? "";
  const secondSurname = url.searchParams!.get("secondSurname") ?? "";
  // const patientCompleteName = secondSurname !== "" ? `${name} ${firstSurname} ${secondSurname}` : `${name} ${firstSurname}`;
  const patientCompleteName = url.searchParams!.get("patientCompleteName") ?
    url.searchParams!.get("patientCompleteName") ?? "" : 
    secondSurname !== "" ? `${name} ${firstSurname} ${secondSurname}` : `${name} ${firstSurname}`;



  // 2. pedir solo las transferencias de ese paciente
  const resp = await fetch(
    `http://localhost:5173/api/transfers?patientId=${patientId}`
  );

  if (!resp.ok) {
    return new Response("Error getting transfers.", { status: 500 });
  }

  const transfers: Transfer[] = await resp.json();

  // 3. renderizar con el patientId
  return ctx.render(<Home patientId={patientId} transfers={transfers} patientCompleteName={patientCompleteName} />);
}

export default function Home(props: Data) {
  const { patientId, transfers, patientCompleteName } = props;
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content="CRUD transfers" />
      </Head>

      <TransferList
        patientId={patientId}
        initialTransfers={transfers}
        patientCompleteName={patientCompleteName}
      />
    </>
  );
}
