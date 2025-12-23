import { useEffect, useState } from "preact/hooks";
import { Consultation } from "../database.ts";
import { JSX } from "preact";

interface Props {
  transferId: string;
  consultationToEdit?: Consultation | null;
  setEditingConsultation?: (consultation: Consultation | null) => void;
  count?: number;
  amount?: number;
  onSuccess: () => void;
}

export default function ConsultationForm(
  {
    transferId,
    consultationToEdit,
    setEditingConsultation,
    count,
    amount,
    onSuccess,
  }: Props
) {
  /* ----- estados ----- */
  const [consultation_date, setConsultation_date] = useState("");

  const today = new Date().toISOString().split('T')[0];
  // const isCreate = !consultationToEdit;
  const disabled = !consultationToEdit && amount! / 50 <= count!;

  const inputCls =
    "shadow appearance-none border border-gray-300 dark:border-gray-600 " +
      "rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 " +
      "bg-white dark:bg-gray-700 leading-tight focus:outline-none " +
      "focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors";

  /* ----- carga de datos en edición ----- */
  useEffect(() => {
    consultationToEdit ?
      setConsultation_date(consultationToEdit.consultation_date.split('T')[0]) : setConsultation_date(today);
  }, [consultationToEdit]);

  /* ----- submit ----- */
  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();

    const method = consultationToEdit ? "PUT" : "POST";

    const url = consultationToEdit
      ? `/api/consultations/${consultationToEdit.id}`
      : `/api/consultations?transferId=${transferId}`;

    const payload = {
      consultation_date,
    };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const key = !consultationToEdit ? "newconsultation" : "consultationupdated";
      localStorage.setItem(key, JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
      setEditingConsultation && setEditingConsultation(null);
      onSuccess();
      /* reset form */
      setConsultation_date(today);
    } else {
      const msg = await response.text();
      alert(msg);
      return;
    }
  };



  /* ----- render ----- */
  return (
    <div>
      <form
        onSubmit={handleSubmit}
        class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-4"
      >
        <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {consultationToEdit ? "Editar Consulta" : "Añadir Consulta"}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* consultation date */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Fecha de inicio *</label>
            <input
              type="date"
              value={consultation_date}
              onInput={(e) => setConsultation_date(e.currentTarget.value)}
              class={inputCls}
            />
          </div>
        </div>

        {/* buttons */ }
        <div class="flex flex-wrap gap-2 mt-6">
          <button
            type="submit"
            disabled={disabled}
            class={`font-bold py-2 px-4 rounded transition-colors ${
disabled
? "bg-gray-400 text-gray-600 opacity-50 cursor-not-allowed"
: "cursor-pointer bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
}`}
          >
            {consultationToEdit ? "Editar" : "Crear"}
          </button>
          {consultationToEdit && (
            <button
              type="button"
              onClick={() => setEditingConsultation && setEditingConsultation(null)}
              class="cursor-pointer bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
