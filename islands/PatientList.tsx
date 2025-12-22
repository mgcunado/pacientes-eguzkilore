import { useState, useEffect, useMemo } from "preact/hooks";
import { Patient, Frequency } from "../database.ts";
import PatientForm from "./PatientForm.tsx";
import { MapPinIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, CreditCardIcon, CoinsStackIcon, ReceiptIcon, ClockIcon, CheckCalendarIcon, CuentaDniIcon, AscIcon, DescIcon } from "@/utils/iconsSvg.tsx";
import { inputCls } from "../utils/constants.ts";

interface Props {
  initialPatients: Patient[];
}

export default function PatientList({ initialPatients }: Props) {
  const [patients, setPatients] = useState(initialPatients);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de que desea eliminar este paciente?")) {
      const response = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (response.ok) {
        setPatients(patients.filter((p) => p.id !== id));
      } else {
        alert("Error deleting patient.");
      }
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    location.hash = "";
    setTimeout(() => (location.hash = "patient-form"), 0);
  };

  /* ------- banner ------- */
  type BannerKind = "new" | "updated" | null;
  const [banner, setBanner] = useState<BannerKind>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const check = (key: "newpatient" | "patientupdated"): BannerKind => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const { expiry } = JSON.parse(raw);
        const remain = expiry - Date.now();
        if (remain <= 0) { localStorage.removeItem(key); return null; }
        return key === "newpatient" ? "new" : "updated";
      } catch { localStorage.removeItem(key); return null; }
    };

    const newB = check("newpatient");
    const updB = check("patientupdated");
    const kind = newB || updB;
    if (!kind) { setBanner(null); return; }

    setBanner(kind);
    const remain = JSON.parse(localStorage.getItem(kind === "new" ? "newpatient" : "patientupdated")!).expiry - Date.now();
    const t = setTimeout(() => {
      localStorage.removeItem(kind === "new" ? "newpatient" : "patientupdated");
      setBanner(null);
    }, remain);
    return () => clearTimeout(t);
  }, [tick]);

  const refreshPatients = async () => {
    const res = await fetch("/api/patients");
    if (res.ok) setPatients(await res.json());
  };

  const refreshAndBanner = () => {
    refreshPatients();
    setTick((t) => t + 1);
  };

  const formatDateES = (iso: string) =>
    new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(iso));

  /* ------- filters ------- */
  type sortDir = "asc" | "desc";

  const [filterMonth, setFilterMonth] = useState("Todos"); // valor por defecto
  const [sortKey, setSortKey] = useState<"name" | "first_surname" | "payment_method" | "frequency">("name");
  const [sortDir, setSortDir] = useState<Record<typeof sortKey, sortDir>>({
    name: "asc",
    first_surname: "asc",
    payment_method: "asc",
    frequency: "asc",
  });
  const [filterFreq, setFilterFreq] = useState("Todas");

  const sortedPatients = useMemo(() => {
    const copy = [...patients];
    const dir = sortDir[sortKey];
    copy.sort((a, b) => {
      let res = 0;
      switch (sortKey) {
        case "name":
          res = a.name.localeCompare(b.name);
          break;
        case "first_surname":
          res = a.first_surname.localeCompare(b.first_surname);
          break;
        case "payment_method":
          res = a.payment_method.localeCompare(b.payment_method);
          break;
        case "frequency": {
          const order = ["Semanal", "Quincenal", "Cada 3 semanas", "Mensual", "Bimensual"];
          const fa = a.frequencies.at(-1)?.frequency ?? "";
          const fb = b.frequencies.at(-1)?.frequency ?? "";

          res = order.indexOf(fa) - order.indexOf(fb);

          if (res === 0) res = a.name.localeCompare(b.name); // desempate por nombre
          break;
        }
      }
      return dir === "desc" ? -res : res; // ← invierte si es descendente
    });
    return copy;
  }, [patients, sortKey, sortDir]);

  /* ---- filtro cruzado (mes + frecuencia) ---- */
  const filteredPatients = useMemo(() => {

    const [y, m] = filterMonth === "Todos" ? [0, 0] : filterMonth.split("-").map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = filterMonth === "Todos" ? new Date() : new Date(y, m, 0, 23, 59, 59);

    return sortedPatients.filter(p => {
      // 1. mes (solo si se ha elegido uno)
      if (filterMonth !== "Todos") {
        const patStart = new Date(p.start_date);
        const patEnd = p.discharge_date ? new Date(p.discharge_date) : new Date(8640000000000000);
        if (patStart > monthEnd || patEnd < monthStart) return false;
      }

      // 2. frecuencia vigente (siempre)
      const candidates = p.frequencies
      .filter(f => new Date(f.start_date) <= monthEnd)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      const displayFreq = (candidates.find(f => !f.end_date) ?? candidates.at(0)) as Frequency | undefined;

      // 3. filtro de frecuencia (solo si se ha elegido una)
      if (filterFreq !== "Todas") {
        if (!displayFreq || displayFreq.frequency !== filterFreq) return false;
      }

      // adjuntamos la freq que aparecerá en la fila
      (p as Patient & { _displayFreq?: Frequency })._displayFreq = displayFreq;
      return true;
    });
  }, [sortedPatients, filterMonth, filterFreq]);

  /* ---------------------- */
  /* | render | */
  /* ---------------------- */
  return (
    <div class="p-5 mx-auto w-[80%] mb-5">
      <div id="patient-form" class="scroll-mt-20">
        <PatientForm
          patientToEdit={editingPatient}
          setEditingPatient={setEditingPatient}
          onSuccess={refreshAndBanner}
        />
      </div>

      <h1 id="patient-list" class="text-3xl font-bold mt-12 text-gray-900 dark:text-gray-100">Listado de pacientes</h1>

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
        {/*
        <label class="text-slate-700 dark:text-white text-right text-xl">Ordenar por:</label>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.currentTarget.value as any)}
          class={inputCls + " cursor-pointer border border-2 border-slate-800"}
        >
          <option value="name">Nombre</option>
          <option value="first_surname">Primer apellido</option>
          <option value="payment_method">Método de pago</option>
          <option value="frequency">Frecuencia</option>
        </select>
        */}

        <label class="text-slate-700 dark:text-white text-right text-xl">Frecuencia:</label>
        <select
          value={filterFreq === "Todas" ? "" : filterFreq}
          onChange={e => setFilterFreq(e.currentTarget.value || "Todas")}
          class={inputCls + " border border-2 border-slate-800"}
        >
          <option value="">Seleccione frecuencia</option>
          <option value="Semanal">Semanal</option>
          <option value="Quincenal">Quincenal</option>
          <option value="Cada 3 semanas">Cada 3 semanas</option>
          <option value="Mensual">Mensual</option>
          <option value="Bimensual">Bimensual</option>
        </select>
        <button
          type="button"
          onClick={() => setFilterFreq("Todas")}
          class={`cursor-pointer px-3 py-1 rounded border ${
filterFreq === "Todas"
? "bg-blue-700 hover:bg-blue-900 text-white"
: "bg-white dark:bg-gray-800 text-blue-600 border-blue-600"
}`}
        >
          Todas
        </button>

      </div>

      {/*<div class="grid grid-cols-5 gap-2 items-center">*/}
      <div class="flex items-center gap-4">
        {/* texto */}
        <span class="text-slate-700 dark:text-white text-right text-xl">
          Ordenar por:
        </span>

        {/* botones */}
        {[
          { key: "name", label: "Nombre" },
          { key: "first_surname", label: "Primer apellido" },
          { key: "payment_method", label: "Método de pago" },
          { key: "frequency", label: "Frecuencia" },
        ].map(({ key, label }) => (
            <div key={key} class="flex items-center gap-1">
              {/* botón texto */}
              <button
                type="button"
                onClick={() => setSortKey(key as "name" | "first_surname" | "payment_method" | "frequency")}
                class={`px-3 py-2 rounded border transition-colors ${ sortKey === key ? "bg-blue-600 text-white border-blue-600" : "cursor-pointer bg-white dark:bg-cyan-950 text-white border-cyan-900 hover:bg-blue-50 dark:hover:bg-purple-900" }`}
              >
                {label}
              </button>

              {/* icono dirección (clickeable) */}
              {/*class="p-1 rounded hover:text-white dark:hover:text-white"*/}
              <button
                type="button"
                onClick={() =>
                  setSortDir(prev => ({
                    ...prev,
                    [key as typeof sortKey]: prev[key as typeof sortKey] === "asc" ? "desc" : "asc" }))
                }
                class={`-ml-2 px-3 py-3 rounded border transition-colors text-white ${ sortKey === key ? "cursor-pointer bg-blue-600 border-blue-600 hover:text-blue-50 dark:hover:text-slate-950" : "bg-white dark:bg-cyan-950 border-cyan-900" }`}

                // title={sortDir[key as typeof sortKey] === "asc" ? "Orden ascendente" : "Orden descendente"}
              >
                {sortDir[key as typeof sortKey] === "asc"
                  ? <AscIcon class="h-4 w-4" />
                  : <DescIcon class="h-4 w-4" />
                }
              </button>
            </div>
          ))}
      </div>
      {/* -- end filters -- */}

      {banner && (
        <div class="mb-4 p-8 rounded bg-blue-200 text-black-800 border-blue-900 m-4 text-center text-xl font-bold">
          {banner === "new" ? "Nuevo paciente creado!" : "Paciente actualizado!"}
        </div>
      )}

      {/* listado activo-inactivo */}
      {filteredPatients.length ? (
        <ul class="space-y-4">
          {filteredPatients.map((p: Patient) => (
            <li
              key={p.id}
              class="mt-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex justify-between items-center"
            >
              <div class="w-[78%]">

                <div class="flex justify-between items-center mt-0 mb-6">
                  <h2 class="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                    {
                      sortKey === "first_surname"

                        ? `${p.first_surname}${p.second_surname ? " " + p.second_surname : "" }, ${p.name}`.trim()
                        : `${p.name} ${p.first_surname} ${p.second_surname ?? ""}`.trim()
                    }
                  </h2>

                  <div class="text-base text-gray-600 dark:text-slate-700 mr-10" >
                    <CuentaDniIcon class="h-7 w-7 text-slate-500 dark:text-slate-700 inline" /> { p.dni }
                    {/*"DNI: " + p.dni*/}
                  </div>
                </div>

                <div class="grid gap-4 mt-2" style={{ gridTemplateColumns: "32% 18% 18% 32%" }}>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <CalendarIcon class="h-5 w-5 text-green-500 dark:text-green-500 inline mr-1" /> { formatDateES(p.start_date) }
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    {/* <ClockIcon class="h-5 w-5 text-blue-500 dark:text-blue-500 inline mr-1" /> {(p.frequencies.find((f: any) => f.end_date === null)?.frequency) || '---'} */}
                    {/*<ClockIcon class="h-5 w-5 text-blue-500 dark:text-blue-500 inline mr-1" />
                    {
                      filterMonth === "Todos" ?
                        (p.frequencies.find((f: any) => f.end_date === null)?.frequency) || '---' :
                        (p as any)._displayFreq?.frequency ?? "-"
                    }*/}
                    <ClockIcon class="h-5 w-5 text-blue-500 inline mr-1" />
                    {(p as Patient & { _displayFreq?: Frequency })._displayFreq?.frequency ?? "-"}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <PhoneIcon class="h-5 w-5 text-purple-500 dark:text-purple-500 inline mr-1" /> {p.phone}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    <MapPinIcon class="h-6 w-6 text-orange-500 dark:text-orange-600 inline -mr-1" /> {p.city}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    {p.email && (
                      <>
                        <EnvelopeIcon class="h-5 w-5 text-gray-200 dark:text-gray-200 inline mr-1" />
                        {p.email}
                      </>
                    )}
                  </div>

                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    {p.payment_method === "Efectivo" ? (
                      <>
                        <CoinsStackIcon class="h-5 w-5 text-amber-500 dark:text-amber-500 inline mr-1" />
                        {p.payment_method}
                      </>
                    ) : (
                        <>
                          <CreditCardIcon class="h-5 w-5 text-amber-500 dark:text-amber-500 inline mr-1" />
                          {p.payment_method}
                        </>
                      )}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    {p.request_invoice ? (
                      <>
                        <ReceiptIcon class="h-5 w-5 text-orange-800 dark:text-orange-600 inline mr-1" /> Factura
                      </>
                    ) : null}
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 text-left pr-4">
                    {p.discharge_date && (
                      <>
                        <CheckCalendarIcon class="h-5 w-5 text-red-500 dark:text-red-500 inline mr-1" />
                        { formatDateES(p.discharge_date) }
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div class="w-[22%] grid grid-cols-2 gap-2">
                <div class="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    class="cursor-pointer w-4/5 mx-auto bg-slate-400 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-600 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    Editar
                  </button>
                </div>
                <div class="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    class="cursor-pointer w-4/5 mx-auto bg-pink-400 hover:bg-pink-500 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-bold py-1 px-2 rounded text-sm"
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
            No se han encontrado pacientes!
          </p>
        )}
    </div>
  );
}
