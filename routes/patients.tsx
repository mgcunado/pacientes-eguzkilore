import { Head } from "fresh/runtime";
import { RouteContext, SITE_TITLE } from "@/utils.ts";
import PatientList from "@/islands/PatientList.tsx";
import type { Patient } from "@/database.ts";

interface Data {
  patients: Patient[];
}

export async function handler(ctx: RouteContext) {
  const resp = await fetch("http://localhost:5173/api/patients");

  if (!resp.ok) {
    return new Response("Error getting patients.", { status: 500 });
  }

  const patients: Patient[] = await resp.json(); 

  // 👇 AHORA SÍ: Fresh 2.x requiere JSX
  return ctx.render(<Home patients={patients} />);
}

export default function Home(props: Data) {
  const { patients } = props;
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content="CRUD patients" />
      </Head>

      <PatientList initialPatients={patients} />
    </>
  );
}
