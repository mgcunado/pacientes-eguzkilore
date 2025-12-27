import { useState, useMemo } from "preact/hooks";
import { Transfer } from "../database.ts";
import { CalendarIcon, CoinsStackIcon } from "@/utils/iconsSvg.tsx";
import { inputCls } from "../utils/constants.ts";

interface Props {
  initialTransfers: Transfer[];
}

export default function TransferList({ initialTransfers, }: Props) {
  const [transfers, setTransfers] = useState(initialTransfers);

  const refreshTransfers = async () => {
    const res = await fetch(`/api/transfers`);
    if (res.ok) setTransfers(await res.json());
  };

  const refreshAndBanner = () => {
    refreshTransfers();
    // setTick((t) => t + 1);
  };

  const formatDateES = (iso: string) =>
    new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(iso));

  /* ------- filters ------- */
  const [filterMonth, setFilterMonth] = useState("Todos"); // valor por defecto

const filteredTransfers = useMemo(() => {
  if (filterMonth === "Todos") return transfers;

  const [y, m] = filterMonth.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0, 23, 59, 59);

  return transfers.filter(t => {
    // solo transferencias que tengan ≥1 consulta REAL en el mes
    const realDates = t.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970);
    return realDates.some(d => new Date(d.consultation_date) >= monthStart && new Date(d.consultation_date) <= monthEnd);
  }).map(t => ({
    ...t,
    consultations: t.consultations
      .filter(d => d && new Date(d.consultation_date).getFullYear() > 1970) // ← quita null/1970
      .filter(d => new Date(d.consultation_date) >= monthStart && new Date(d.consultation_date) <= monthEnd)
  }));
}, [transfers, filterMonth]);

  /* ------- render ------- */
  return (
    <div class="p-5 mx-auto w-[80%] mb-5">
      <div class="flex items-center justify-between mt-12">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Listado de transferencias:
        </h1>

        <a
          href="./patients#patient-list"
          class="text-base text-slate-600 hover:text-slate-600 dark:text-slate-800 dark:hover:text-slate-900 underline text-xl font-bold"
        >
          Regresar al Listado de Pacientes
        </a>
      </div>

      {/* -- filters -- */}

      <div class="bg-cyan-950 grid grid-cols-1 md:grid-cols-3 items-center gap-5 p-3 rounded mt-4 mb-2">
        <label class="text-slate-700 dark:text-white text-right text-xl">Seleccione Mes:</label>
        <input
          type="month"
          value={filterMonth === "Todos" ? "" : filterMonth}
          onChange={(e) => setFilterMonth(e.currentTarget.value || "Todos")}
          class={inputCls + " border border-2 border-slate-800"}
          placeholder="Seleccione mes"
        />
        <button
          type="button"
          onClick={() => setFilterMonth("Todos")}
          class={`cursor-pointer px-3 py-1 rounded border ${
filterMonth === "Todos"
? "bg-blue-700 hover:bg-blue-900 text-white"
: "bg-white dark:bg-gray-800 text-blue-600 border-blue-600"
}`}
        >
          Todos
        </button>
      </div>

      {filteredTransfers.length ? (
        <ul class="space-y-4">
          {filteredTransfers.map((p) => (
            <li
              key={p.id}
              class="mt-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex justify-between items-center"
            >
              <div class="w-[44%]">
                <div class="w-full text-gray-400 text-xl mb-2">
                  {`${p.name} ${p.first_surname} ${p.second_surname ?? ""}`.trim()}
                </div>
                <div class="grid gap-4 mt-2" style={{ gridTemplateColumns: "50% 50%" }}>
                  <div class="text-gray-600 dark:text-gray-400 text-center pr-0">
                    <CalendarIcon class="h-5 w-5 text-green-500 dark:text-green-500 inline mr-1" /> { formatDateES(p.transfer_date) }
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <CoinsStackIcon class="h-5 w-5 text-amber-500 dark:text-amber-500 inline mr-1" /> {(p.amount)} €
                  </div>
                </div>

                {p.amount / 50 > p.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970).length && (
                  <div class="w-full text-yellow-300 text-lg mt-8">
                    {p.amount / 50 - p.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970).length === 1
                      ? "Falta 1 consulta para cubrir la transferencia!"
                      : `Faltan ${p.amount / 50 - p.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970).length} consultas para cubrir la transferencia!`}
                  </div>
                )}
                {p.amount / 50 > p.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970).length && (
                  <div class="w-[70%]">
                    {(
                      <button
                        type="button"
                        onClick={() => {
                          location.href = `consultations?transferId=${p!.id}&transferDate=${p!.transfer_date}&amount=${p!.amount}&patientId=${p!.patient_id}&name=${p!.name}&firstSurname=${p!.first_surname}&secondSurname=${p!.second_surname}`;
                        }}
                        class="w-full cursor-pointer bg-yellow-700 hover:bg-yellow-800 dark:bg-yellow-800 dark:hover:bg-yellow-900 text-white font-bold py-2 px-4 mx-0 mt-5 rounded"
                      >
                        Vincular Consulta{p!.amount === 50 ? "" : "s"}
                      </button>
                    )}
                  </div>
                )}

              </div>
              <div class="w-[56%]">
                {p.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970).length === 0 ? (
                  <p class="text-gray-500 text-xl">No existe todavía ninguna consulta vinculada</p>
                ) : (
                    <>
                      <div class="w-full text-gray-400 text-xl mb-2">
                        {p.consultations.filter(d => d && new Date(d.consultation_date).getFullYear() > 1970).length === 1
                          ? "1 Consulta vinculada:"
                          : "Consultas vinculadas:"}
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        {p.consultations.map((c, idx) => (
                          <div
                            key={idx}
                            class="py-2 px-1 bg-gray-100 dark:bg-gray-400 rounded-lg text-center"
                          >
                            {formatDateES(c.consultation_date)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
          <p class="text-red-600 dark:text-white text-center py-8 text-3xl font-semibold bg-slate-500 border-2 border-slate-900 rounded-2xl mt-2">
            No se han encontrado transferencias!
          </p>
        )}
    </div>
  );
}
