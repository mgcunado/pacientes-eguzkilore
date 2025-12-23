import { useState, useEffect } from "preact/hooks";
import { Frequency } from "../database.ts";
import FrequencyForm from "./FrequencyForm.tsx";
import { CalendarIcon, ClockIcon } from "@/utils/iconsSvg.tsx";

interface Props {
  initialFrequencies: Frequency[];
  patientCompleteName: string;
}

export default function FrequencyList({ initialFrequencies, patientCompleteName }: Props) {
  const [frequencies, setFrequencies] = useState(initialFrequencies);
  const [editingFrequency, setEditingFrequency] = useState<Frequency | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta frecuencia?")) return;

    const response = await fetch(`/api/frequencies/${id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Error borrando la frecuencia!");
      return;
    }

    localStorage.setItem("frequencydeleted", JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
    refreshAndBanner(); // recarga lista y fuerza banner
  };

  const handleEdit = (frequency: Frequency) => {
    setEditingFrequency(frequency);
    location.hash = "";
    setTimeout(() => (location.hash = "frequency-form"), 0);
  };

  /* ------- banner ------- */
  type BannerKind = "new" | "updated" | "deleted" | null;
  const [banner, setBanner] = useState<BannerKind>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const check = (key: "newfrequency" | "frequencyupdated" | "frequencydeleted"): BannerKind => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const { expiry } = JSON.parse(raw);
        const remain = expiry - Date.now();
        if (remain <= 0) { localStorage.removeItem(key); return null; }
        return key === "newfrequency" ? "new" : key === "frequencyupdated" ? "updated" : "deleted";
      } catch { localStorage.removeItem(key); return null; }
    };

    const newB = check("newfrequency");
    const updB = check("frequencyupdated");
    const delB = check("frequencydeleted");
    const kind = newB || updB || delB;
    if (!kind) { setBanner(null); return; }

    setBanner(kind);
    const remain = JSON.parse(localStorage.getItem(kind === "new" ? "newfrequency" : kind === "updated" ? "frequencyupdated" : "frequencydeleted")!).expiry - Date.now();
    const t = setTimeout(() => {
      localStorage.removeItem(kind === "new" ? "newfrequency" : kind === "updated" ? "frequencyupdated" : "frequencydeleted");
      setBanner(null);
    }, remain);
    return () => clearTimeout(t);
  }, [tick]);

  const refreshFrequencies = async () => {
    const res = await fetch(`/api/frequencies?patientId=${frequencies[0].patient_id}`);
    if (res.ok) setFrequencies(await res.json());
  };

  const refreshAndBanner = () => {
    refreshFrequencies();
    setTick((t) => t + 1);
  };

  const formatDateES = (iso: string) =>
    new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(iso));

  const activeFrequency = frequencies.find((f) => f.end_date === null)?.frequency;
  const lastInactiveFrequency = frequencies
    .filter((f) => f.end_date !== null) // solo finalizadas
    .sort((a, b) => b.id.localeCompare(a.id))[0]?.frequency;

  /* ------- render ------- */
  return (
    <div class="p-5 mx-auto w-[80%] mb-5">
      <div id="frequency-form" class="scroll-mt-20">
        <FrequencyForm
          patientId={frequencies[0].patient_id}
          activeFrequency={activeFrequency}
          lastInactiveFrequency={lastInactiveFrequency}
          frequencyToEdit={editingFrequency}
          setEditingFrequency={setEditingFrequency}
          onSuccess={refreshAndBanner}
        />
      </div>

      <div class="flex items-center justify-between mt-12">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Listado de frecuencias de {patientCompleteName}:
        </h1>

        <a
          href="./patients#patient-list"
          class="text-base text-slate-600 hover:text-slate-600 dark:text-slate-800 dark:hover:text-slate-900 underline text-xl font-bold"
        >
          Regresar al Listado de Pacientes
        </a>
      </div>

      {banner && (
        <div class="mb-4 p-8 rounded bg-blue-200 text-black-800 border-blue-900 m-4 text-center text-xl font-bold">
          {banner === "new" && "Nueva frecuencia creada!"}
          {banner === "updated" && "Frecuencia actualizada!"}
          {banner === "deleted" && "Frecuencia eliminada!"}
        </div>
      )}

      {frequencies.length ? (
        <ul class="space-y-4">
          {frequencies.map((p) => (
            <li
              key={p.id}
              class="mt-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex justify-between items-center"
            >
              <div class="w-[78%]">
                <div class="grid gap-4 mt-2" style={{ gridTemplateColumns: "32% 18% 18% 32%" }}>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <CalendarIcon class="h-5 w-5 text-green-500 dark:text-green-500 inline mr-1" /> { formatDateES(p.start_date) }
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <ClockIcon class="h-5 w-5 text-blue-500 dark:text-blue-500 inline mr-1" /> {(p.frequency)}
                  </div>
                </div>
              </div>
              <div class="w-[22%] grid grid-cols-2 gap-2">
                <div class="flex justify-center">
                  <button
                    type="button"
                    onClick={() => p.end_date ? undefined : handleEdit(p)}
                    disabled={!!p.end_date}
                    class={`w-4/5 mx-auto text-white font-bold py-1 px-2 rounded text-sm bg-slate-400 dark:bg-slate-500 ${p.end_date ? ' opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-500 dark:hover:bg-slate-600' }`}
                  >
                    Editar
                  </button>
                </div>
                <div class="flex justify-center">
                  <button
                    type="button"
                    onClick={() => p.end_date ? undefined : handleDelete(p.id)}
                    disabled={!!p.end_date || frequencies.length === 1} // doble negación → boolean
                    class={`w-4/5 mx-auto text-white font-bold py-1 px-2 rounded text-sm bg-pink-400 dark:bg-pink-500 ${p.end_date || frequencies.length === 1 ? ' opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-pink-500 dark:hover:bg-pink-600' }`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
          <p class="text-red-600 dark:text-white text-center py-8 text-3xl font-semibold bg-slate-500 border-2 border-slate-900 rounded-2xl mt-2">
            No se han encontrado frecuencias!
          </p>
        )}
    </div>
  );
}
