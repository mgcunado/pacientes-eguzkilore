import { useEffect, useState } from "preact/hooks";
import { Frequency } from "../database.ts";
import { JSX } from "preact";

interface Props {
  patientId: string;
  activeFrequency: string | undefined;
  lastInactiveFrequency?: string | null;
  frequencyToEdit?: Frequency | null;
  setEditingFrequency?: (frequency: Frequency | null) => void;
  onSuccess: () => void;
}

export default function FrequencyForm(
  {
    patientId,
    activeFrequency,
    lastInactiveFrequency,
    frequencyToEdit,
    setEditingFrequency,
    onSuccess,
  }: Props
) {
  /* ----- estados ----- */
  const [start_date, setStart_date] = useState("");
  const [frequency, setFrequency] = useState("");
  // const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const inputCls =
    "shadow appearance-none border border-gray-300 dark:border-gray-600 " +
      "rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 " +
      "bg-white dark:bg-gray-700 leading-tight focus:outline-none " +
      "focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors";

  /* ----- carga de datos en edición ----- */
  useEffect(() => {
    if (frequencyToEdit) {
      // setStart_date(frequencyToEdit.start_date);
      setStart_date(frequencyToEdit.start_date.split('T')[0]);
      setFrequency(frequencyToEdit.frequency);
    } else {
      setStart_date(today);
      // setFrequency(activeFrequency === "Semanal" ? "Quincenal" : "Semanal");
      setFrequency("");
    }
  }, [frequencyToEdit]);

  /* ----- submit ----- */
  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    // setError(null);

    const method = frequencyToEdit ? "PUT" : "POST";

    const url = frequencyToEdit
      ? `/api/frequencies/${frequencyToEdit.id}`
      : `/api/frequencies?patientId=${patientId}`;

    const payload = {
      start_date,
      frequency,
    };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const key = !frequencyToEdit ? "newfrequency" : "frequencyupdated";
      localStorage.setItem(key, JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
      setEditingFrequency && setEditingFrequency(null);
      onSuccess();
      /* reset form */
      setStart_date(today);
      // setFrequency(activeFrequency === "Semanal" ? "Quincenal" : "Semanal");
      setFrequency("");
    } else {
      const msg = await response.text();
      // setError(msg);
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
          {frequencyToEdit ? "Editar Frecuencia" : "Añadir Frecuencia"}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* start date */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Fecha de inicio *</label>
            <input
              type="date"
              value={start_date}
              onInput={(e) => setStart_date(e.currentTarget.value)}
              class={inputCls}
            />
          </div>

          {/* frequency */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">
          {frequencyToEdit ? "Editar Frecuencia *" : " Nueva Frecuencia *"}
            </label>
            <select value={frequency} onChange={(e) => setFrequency(e.currentTarget.value)} class={inputCls}>
              <option value="">-- seleccione --</option>
              <option value="Semanal"
                disabled={
                  (!frequencyToEdit && activeFrequency === "Semanal") ||
                    (!!frequencyToEdit && lastInactiveFrequency === "Semanal")
                }>
                Semanal
              </option>

              <option value="Quincenal"
                disabled={
                  (!frequencyToEdit && activeFrequency === "Quincenal") ||
                    (!!frequencyToEdit && lastInactiveFrequency === "Quincenal")
                }>
                Quincenal
              </option>

              <option value="Cada 3 semanas"
                disabled={
                  (!frequencyToEdit && activeFrequency === "Cada 3 semanas") ||
                    (!!frequencyToEdit && lastInactiveFrequency === "Cada 3 semanas")
                }>
                Cada 3 semanas
              </option>

              <option value="Mensual"
                disabled={
                  (!frequencyToEdit && activeFrequency === "Mensual") ||
                    (!!frequencyToEdit && lastInactiveFrequency === "Mensual")
                }>
                Mensual
              </option>

              <option value="Bimensual"
                disabled={
                  (!frequencyToEdit && activeFrequency === "Bimensual") ||
                    (!!frequencyToEdit && lastInactiveFrequency === "Bimensual")
                }>
                Bimensual
              </option>
            </select>
          </div>
        </div>

        {/* buttons */ }
        <div class="flex flex-wrap gap-2 mt-6">
          <button
            type="submit"
            class="cursor-pointer bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            {frequencyToEdit ? "Editar" : "Crear"}
          </button>
          {frequencyToEdit && (
            <button
              type="button"
              onClick={() => setEditingFrequency && setEditingFrequency(null)}
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
