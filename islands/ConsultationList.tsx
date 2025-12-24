import { useState, useEffect } from "preact/hooks";
import { Consultation } from "../database.ts";
import ConsultationForm from "./ConsultationForm.tsx";
import { CalendarIcon } from "@/utils/iconsSvg.tsx";

interface Props {
  transferId: string;
  transferDate: string;
  initialConsultations: Consultation[];
  patientId: string;
  patientCompleteName: string;
  amount: number;
}

export default function ConsultationList({
  transferId,
  transferDate,
  initialConsultations,
  patientId,
  patientCompleteName,
  amount
}: Props) {
  const [consultations, setConsultations] = useState(initialConsultations);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta consulta?")) return;

    const response = await fetch(`/api/consultations/${id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Error borrando la consulta!");
      return;
    }

    localStorage.setItem("consultationdeleted", JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
    refreshAndBanner();
  };

  const handleEdit = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    location.hash = "";
    setTimeout(() => (location.hash = "consultation-form"), 0);
  };

  /* ------- banner ------- */
  type BannerKind = "new" | "updated" | "deleted" | null;
  const [banner, setBanner] = useState<BannerKind>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const check = (key: "newconsultation" | "consultationupdated" | "consultationdeleted"): BannerKind => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const { expiry } = JSON.parse(raw);
        const remain = expiry - Date.now();
        if (remain <= 0) { localStorage.removeItem(key); return null; }
        return key === "newconsultation" ? "new" : key === "consultationupdated" ? "updated" : "deleted";
      } catch { localStorage.removeItem(key); return null; }
    };

    const newB = check("newconsultation");
    const updB = check("consultationupdated");
    const delB = check("consultationdeleted");
    const kind = newB || updB || delB;
    if (!kind) { setBanner(null); return; }

    setBanner(kind);
    const remain = JSON.parse(localStorage.getItem(kind === "new" ? "newconsultation" : kind === "updated" ? "consultationupdated" : "consultationdeleted")!).expiry - Date.now();
    const t = setTimeout(() => {
      localStorage.removeItem(kind === "new" ? "newconsultation" : kind === "updated" ? "consultationupdated" : "consultationdeleted");
      setBanner(null);
    }, remain);
    return () => clearTimeout(t);
  }, [tick]);

  const refreshConsultations = async () => {
    const res = await fetch(`/api/consultations?transferId=${transferId}`);
    if (res.ok) setConsultations(await res.json());
  };

  const refreshAndBanner = () => {
    refreshConsultations();
    setTick((t) => t + 1);
  };

  const formatDateES = (iso: string) =>
    new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(iso));

  /* ------- render ------- */
  return (
    <div class="p-5 mx-auto w-[80%] mb-5">
      <div id="consultation-form" class="scroll-mt-20">
        <ConsultationForm
          transferId={transferId}
          consultationToEdit={editingConsultation}
          setEditingConsultation={setEditingConsultation}
          count={consultations.length}
          amount={amount}
          onSuccess={refreshAndBanner}
        />
      </div>

      <div class="grid gap-4 mt-2" style={{ gridTemplateColumns: "60% 40%" }}>

        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          Consultas de {patientCompleteName}: <br />
          <span class="text-xl text-gray-700 dark:text-gray-400">
            (vinculadas a la Transferencia que realizó el {formatDateES(transferDate)})
          </span>
        </h1>

        <div class="flex flex-col mr-8 text-right">
          <a
            href={`./transfers?patientId=${patientId}&patientCompleteName=${patientCompleteName}`}
            class="w-full text-base text-slate-600 hover:text-slate-600 dark:text-slate-800 dark:hover:text-slate-900 underline text-xl font-bold mt-4"
          >
            Transferencias del paciente
          </a>
          <a
            href="./transfersAndConsultations"
            class="w-full text-base text-slate-600 hover:text-slate-600 dark:text-slate-800 dark:hover:text-slate-900 underline text-xl font-bold mt-4"
          >
            Listado de todas las Transferencias
          </a>
        </div>
      </div>

      {banner && (
        <div class="mb-4 p-8 rounded bg-blue-200 text-black-800 border-blue-900 m-4 text-center text-xl font-bold">
          {banner === "new" && "Nueva consulta creada!"}
          {banner === "updated" && "Consulta actualizada!"}
          {banner === "deleted" && "Consulta eliminada!"}
        </div>
      )}

      {consultations.length ? (
        <ul class="space-y-4">
          {consultations.map((p) => (
            <li
              key={p.id}
              class="mt-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex justify-between items-center"
            >
              <div class="w-[78%]">
                <div class="grid gap-4 mt-2" style={{ gridTemplateColumns: "32% 18% 18% 32%" }}>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <CalendarIcon class="h-5 w-5 text-green-500 dark:text-green-500 inline mr-1" /> { formatDateES(p.consultation_date) }
                  </div>
                </div>
              </div>
              <div class="w-[22%] grid grid-cols-2 gap-2">
                <div class="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    class={`w-4/5 mx-auto text-white font-bold py-1 px-2 rounded text-sm bg-slate-400 dark:bg-slate-500 cursor-pointer hover:bg-slate-500 dark:hover:bg-slate-600' }`}
                  >
                    Editar
                  </button>
                </div>
                <div class="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    class={`w-4/5 mx-auto text-white font-bold py-1 px-2 rounded text-sm bg-pink-400 dark:bg-pink-500 cursor-pointer hover:bg-pink-500 dark:hover:bg-pink-600' }`}
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
            No se han encontrado consultas!
          </p>
        )}
    </div>
  );
}
