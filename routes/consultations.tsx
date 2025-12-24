import { Head } from "fresh/runtime";
import { RouteContext, SITE_TITLE } from "@/utils.ts";
import ConsultationList from "@/islands/ConsultationList.tsx";
import type { Consultation } from "@/database.ts";

interface Data {
  transferId: string;
  transferDate: string;
  consultations: Consultation[];
  patientId: string;
  patientCompleteName: string;
  amount: number;
}

export async function handler(ctx: RouteContext) {
  // 1. leer query string
  const url = new URL(ctx.req.url);
  const transferId = url.searchParams.get("transferId") ?? "";
  const transferDate = url.searchParams.get("transferDate") ?? "";
  const name = url.searchParams!.get("name") ?? "";
  const firstSurname = url.searchParams!.get("firstSurname") ?? "";
  const secondSurname = url.searchParams!.get("secondSurname") ?? "";
  // const patientCompleteName = secondSurname === "" ? `${name} ${firstSurname} ${secondSurname}` : `${name} ${firstSurname}`;
  const patientId = url.searchParams!.get("patientId") ?? "";
  // const patientCompleteName = url.searchParams!.get("patientCompleteName") ?? "";
  const patientCompleteName = url.searchParams!.get("patientCompleteName") ?
    url.searchParams!.get("patientCompleteName") ?? "" : 
    secondSurname !== "" ? `${name} ${firstSurname} ${secondSurname}` : `${name} ${firstSurname}`;

  const amount = url.searchParams!.get("amount") ?? "";

  // 2. pedir solo las consultationencias de ese paciente
  const resp = await fetch(
    `http://localhost:5173/api/consultations?transferId=${transferId}`
  );

  if (!resp.ok) {
    return new Response("Error getting consultations.", { status: 500 });
  }

  const consultations: Consultation[] = await resp.json();

  // 3. renderizar con el transferId
  return ctx.render(<Home 
    transferId={transferId}
    transferDate={transferDate}
    consultations={consultations} 
    patientId={patientId}
    patientCompleteName={patientCompleteName}
    amount={Number(amount)}
  />);
}

export default function Home(props: Data) {
  const { 
    transferId,
    transferDate,
    consultations, 
    patientId,
    patientCompleteName,
    amount,  
  } = props;
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content="CRUD consultations" />
      </Head>

      <ConsultationList
        transferId={transferId}
        transferDate={transferDate}
        initialConsultations={consultations}
        patientId={patientId}
        patientCompleteName={patientCompleteName}
        amount={amount}
      />
    </>
  );
}

