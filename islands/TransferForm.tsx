import { useEffect, useState } from "preact/hooks";
import { Transfer } from "../database.ts";
import { JSX } from "preact";

interface Props {
  patientId: string;
  patientCompleteName: string;
  transferToEdit?: Transfer | null;
  setEditingTransfer?: (transfer: Transfer | null) => void;
  onSuccess: () => void;
}

export default function TransferForm(
  {
    patientId,
    patientCompleteName,
    transferToEdit,
    setEditingTransfer,
    onSuccess,
  }: Props
) {
  /* ----- estados ----- */
  const [transfer_date, setTransfer_date] = useState("");
  const [amount, setAmount] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const inputCls =
    "shadow appearance-none border border-gray-300 dark:border-gray-600 " +
      "rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 " +
      "bg-white dark:bg-gray-700 leading-tight focus:outline-none " +
      "focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors";

  /* ----- carga de datos en edición ----- */
  const [original, setOriginal] = useState({ transfer_date: "", amount: 0 });

  useEffect(() => {
    if (transferToEdit) {
      setTransfer_date(transferToEdit.transfer_date.split('T')[0]);
      setAmount(transferToEdit.amount);
      setOriginal({                                   // ← guarda originales
        transfer_date: transferToEdit.transfer_date.split('T')[0],
        amount: transferToEdit.amount
      });

    } else {
      setTransfer_date(today);
      setAmount(0);
      setOriginal({ transfer_date: today, amount: 0 });
    }
  }, [transferToEdit]);

  /* ----- submit ----- */
  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    // setError(null);

    const method = transferToEdit ? "PUT" : "POST";

    const url = transferToEdit
      ? `/api/transfers/${transferToEdit.id}`
      : `/api/transfers?patientId=${patientId}`;

    const payload = {
      transfer_date,
      amount,
    };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const key = !transferToEdit ? "newtransfer" : "transferupdated";
      localStorage.setItem(key, JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
      setEditingTransfer && setEditingTransfer(null);
      onSuccess();
      /* reset form */
      setTransfer_date(today);
      setAmount(0);
    } else {
      const msg = await response.text();
      alert(msg);
      return;
    }
  };

  const hasChanged =
    transfer_date !== original.transfer_date ||
      amount !== original.amount;

  /* ----- render ----- */
  return (
    <div>
      <form
        onSubmit={handleSubmit}
        class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-4"
      >
        <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {transferToEdit ? "Editar Transferencia" : "Añadir Transferencia"}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* transfer date */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Fecha de inicio *</label>
            <input
              type="date"
              value={transfer_date}
              onInput={(e) => setTransfer_date(e.currentTarget.value)}
              class={inputCls}
            />
          </div>

          {/* transfer */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              {transferToEdit ? "Editar Transferencia *" : " Nueva Transferencia *"}
            </label>
            <select value={amount} onChange={e => setAmount(Number(e.currentTarget.value))} class={inputCls}>
              <option value="0">-- seleccione --</option>
              <option value="50">50 €</option>
              <option value="100">100 €</option>
              <option value="150">150 €</option>
              <option value="200">200 €</option>
              <option value="250">250 €</option>
            </select>
          </div>
        </div>

        {/* buttons */ }
        <div class="flex flex-wrap gap-2 mt-6">
          <button
            type="submit"
            disabled={!hasChanged}
            class={`font-bold py-2 px-4 rounded transition-colors ${ !hasChanged
            ? "bg-gray-400 text-gray-600 opacity-50 cursor-not-allowed"
            : "cursor-pointer bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
            }`}
          >
            {transferToEdit ? "Editar" : "Crear"}
          </button>
          {transferToEdit && (
            <button
              type="button"
              onClick={() => setEditingTransfer && setEditingTransfer(null)}
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
