import { Head } from "fresh/runtime";
import { RouteContext, SITE_TITLE } from "@/utils.ts";
import FrequencyList from "@/islands/FrequencyList.tsx";
import type { Frequency } from "@/database.ts";

interface Data {
  frequencies: Frequency[];
  patientCompleteName: string;
}

export async function handler(ctx: RouteContext) {
  // 1. leer query string
  const url = new URL(ctx.req.url);
  const patientId = url.searchParams.get("patientId") ?? "";
  const name = url.searchParams!.get("name") ?? "";
  const firstSurname = url.searchParams!.get("firstSurname") ?? "";
  const secondSurname = url.searchParams!.get("secondSurname") ?? "";
  const patientCompleteName = secondSurname === "" ? `${name} ${firstSurname} ${secondSurname}` : `${name} ${firstSurname}`;

  // 2. pedir solo las frecuencias de ese paciente
  const resp = await fetch(
    `http://localhost:5173/api/frequencies?patientId=${patientId}`
  );

  if (!resp.ok) {
    return new Response("Error getting frequencies.", { status: 500 });
  }

  const frequencies: Frequency[] = await resp.json();

  // 3. renderizar con el patientId
  return ctx.render(<Home frequencies={frequencies} patientCompleteName={patientCompleteName} />);
}

export default function Home(props: Data) {
  const { frequencies, patientCompleteName } = props;
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content="CRUD frequencies" />
      </Head>

      <FrequencyList 
        initialFrequencies={frequencies}
        patientCompleteName={patientCompleteName}
      />
    </>
  );
}

// import { Head } from "fresh/runtime";
// import { RouteContext, SITE_TITLE } from "@/utils.ts";
// import FrequencyList from "@/islands/FrequencyList.tsx";
// import type { Frequency } from "@/database.ts";
//
// interface Data {
//   frequencies: Frequency[];
// }
//
// export async function handler(ctx: RouteContext) {
//   const resp = await fetch("http://localhost:5173/api/frequencies");
//
//   if (!resp.ok) {
//     return new Response("Error getting frequencies.", { status: 500 });
//   }
//
//   const frequencies: Frequency[] = await resp.json(); 
//
//   // 👇 AHORA SÍ: Fresh 2.x requiere JSX
//   return ctx.render(<Home frequencies={frequencies} />);
// }
//
// export default function Home(props: Data) {
//   const { frequencies } = props;
//   return (
//     <>
//       <Head>
//         <title>{SITE_TITLE}</title>
//         <meta name="description" content="CRUD frequencies" />
//       </Head>
//
//       <FrequencyList initialFrequencies={frequencies} />
//     </>
//   );
// }
//
