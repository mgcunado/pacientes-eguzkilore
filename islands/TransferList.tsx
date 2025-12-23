import { useState, useEffect } from "preact/hooks";
import { Transfer } from "../database.ts";
import TransferForm from "./TransferForm.tsx";
import { CalendarIcon, CoinsStackIcon } from "@/utils/iconsSvg.tsx";

interface Props {
  patientId: string;
  initialTransfers: Transfer[];
  patientCompleteName: string;
}

export default function TransferList({ patientId, initialTransfers, patientCompleteName }: Props) {
  const [transfers, setTransfers] = useState(initialTransfers);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta transferencia?")) return;

    const response = await fetch(`/api/transfers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Error borrando la transferencia!");
      return;
    }

    localStorage.setItem("transferdeleted", JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
    refreshAndBanner(); // recarga lista y fuerza banner
  };

  const handleEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    location.hash = "";
    setTimeout(() => (location.hash = "transfer-form"), 0);
  };

  /* ------- banner ------- */
  type BannerKind = "new" | "updated" | "deleted" | null;
  const [banner, setBanner] = useState<BannerKind>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const check = (key: "newtransfer" | "transferupdated" | "transferdeleted"): BannerKind => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const { expiry } = JSON.parse(raw);
        const remain = expiry - Date.now();
        if (remain <= 0) { localStorage.removeItem(key); return null; }
        return key === "newtransfer" ? "new" : key === "transferupdated" ? "updated" : "deleted";
      } catch { localStorage.removeItem(key); return null; }
    };

    const newB = check("newtransfer");
    const updB = check("transferupdated");
    const delB = check("transferdeleted");
    const kind = newB || updB || delB;
    if (!kind) { setBanner(null); return; }

    setBanner(kind);
    const remain = JSON.parse(localStorage.getItem(kind === "new" ? "newtransfer" : kind === "updated" ? "transferupdated" : "transferdeleted")!).expiry - Date.now();
    const t = setTimeout(() => {
      localStorage.removeItem(kind === "new" ? "newtransfer" : kind === "updated" ? "transferupdated" : "transferdeleted");
      setBanner(null);
    }, remain);
    return () => clearTimeout(t);
  }, [tick]);

  const refreshTransfers = async () => {
    // const res = await fetch(`/api/transfers?patientId=${transfers[0].patient_id}`);
    const res = await fetch(`/api/transfers?patientId=${patientId}`);
    if (res.ok) setTransfers(await res.json());
  };

  const refreshAndBanner = () => {
    refreshTransfers();
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
      <div id="transfer-form" class="scroll-mt-20">
        <TransferForm
          patientId={patientId}
          patientCompleteName={patientCompleteName}
          transferToEdit={editingTransfer}
          setEditingTransfer={setEditingTransfer}
          onSuccess={refreshAndBanner}
        />
      </div>

      <div class="flex items-center justify-between mt-12">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Listado de transferencias de {patientCompleteName}:
        </h1>

        <a
          href="./patients"
          class="text-base text-slate-600 hover:text-slate-600 dark:text-slate-800 dark:hover:text-slate-900 underline text-xl font-bold"
        >
          Regresar al Listado de Pacientes
        </a>
      </div>

      {banner && (
        <div class="mb-4 p-8 rounded bg-blue-200 text-black-800 border-blue-900 m-4 text-center text-xl font-bold">
          {banner === "new" && "Nueva transferencia creada!"}
          {banner === "updated" && "Transferencia actualizada!"}
          {banner === "deleted" && "Transferencia eliminada!"}
        </div>
      )}

      {transfers.length ? (
        <ul class="space-y-4">
          {transfers.map((p) => (
            <li
              key={p.id}
              class="mt-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex justify-between items-center"
            >
              <div class="w-[70%]">
                <div class="grid gap-4 mt-2" style={{ gridTemplateColumns: "32% 18% 18% 32%" }}>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <CalendarIcon class="h-5 w-5 text-green-500 dark:text-green-500 inline mr-1" /> { formatDateES(p.transfer_date) }
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <CoinsStackIcon class="h-5 w-5 text-amber-500 dark:text-amber-500 inline mr-1" /> {(p.amount)} €
                  </div>
                </div>
              </div>
              <div class="w-[30%]">
                <div class="grid grid-cols-2 gap-2">
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

                <div class="w-full">
                  {(
                    <button
                      type="button"
                      onClick={() => {
                        location.href = `consultations?transferId=${p!.id}&transferDate=${p!.transfer_date}&amount=${p!.amount}&patientId=${patientId}&patientCompleteName=${patientCompleteName}`;
                      }}
                      class="w-full cursor-pointer bg-yellow-700 hover:bg-yellow-800 dark:bg-yellow-800 dark:hover:bg-yellow-900 text-white font-bold py-2 px-4 mx-0 mt-5 rounded"
                    >
                      Vincular Nueva Consulta
                    </button>
                  )}
                </div>

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
