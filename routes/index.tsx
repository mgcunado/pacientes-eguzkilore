import { Head } from "fresh/runtime";
import { SITE_TITLE } from "@/utils.ts";

export function handler() {

  return {
    props: {},
  };
}

export default function Home() {
   // bg-[#86efac]
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content="" />
      </Head>
      <div class="text-4xl font-bold text-white dark:text-white p-20 text-center">
        Bienvenido a pacientes Eguzkilore!
      </div>
    </>
  );
}
