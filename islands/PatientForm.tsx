import { useEffect, useState } from "preact/hooks";
import { Patient } from "../database.ts";
import { JSX } from "preact";
import { inputCls } from "../utils/constants.ts";

interface Props {
  patientToEdit?: Patient | null;
  setEditingPatient?: (patient: Patient | null) => void;
  onSuccess: () => void;
}

export default function PatientForm(
  { patientToEdit, setEditingPatient, onSuccess }: Props
) {
  /* ----- estados ----- */
  const [name, setName] = useState("");
  const [first_surname, setFirst_surname] = useState("");
  const [second_surname, setSecond_surname] = useState("");
  const [dni, setDni] = useState("");
  const [city, setCity] = useState("Irun");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [start_date, setStart_date] = useState("");
  const [discharge_date, setDischarge_date] = useState("");
  const [payment_method, setPayment_method] = useState("Efectivo");
  const [request_invoice, setRequest_invoice] = useState(false);
  const [frequency, setFrequency] = useState("Semanal");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const patientCompleteName = patientToEdit
  ? `${name} ${first_surname}${second_surname ? ` ${second_surname}` : ''}`.trim()
  : '';

  /* ----- carga de datos en edición ----- */
  useEffect(() => {
    if (patientToEdit) {
      setName(patientToEdit.name);
      setFirst_surname(patientToEdit.first_surname);
      setSecond_surname(patientToEdit.second_surname ?? "");
      setDni(patientToEdit.dni);
      setCity(patientToEdit.city);
      setPhone(patientToEdit.phone);
      setEmail(patientToEdit.email ?? "");
      // setStart_date(patientToEdit.start_date);
      setStart_date(patientToEdit.start_date.split('T')[0]);
      setDischarge_date(patientToEdit.discharge_date?.split('T')[0] ?? "");
      setPayment_method(patientToEdit.payment_method);
      setRequest_invoice(patientToEdit.request_invoice);
      setFrequency(patientToEdit.frequencies.at(-1)?.frequency ?? "");
    } else {
      setName("");
      setFirst_surname("");
      setSecond_surname("");
      setDni("");
      setCity("Irun");
      setPhone("");
      setEmail("");
      // setStart_date("");
      setStart_date("2025-01-01");
      setDischarge_date("");
      setPayment_method("Efectivo");
      setRequest_invoice(false);
      setFrequency("Semanal");
    }
  }, [patientToEdit]);

  /* ----- submit ----- */
  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();

    // validaciones basicas
    // if (!name || !first_surname || !dni || !city || !phone || !payment_method) {
    // alert("Los campos requeridos son: nombre, primer apellido, dni, ciudad, y teléfono.");
    // return;
    // }

    const labels: Record<string, string> = {
      name: "Nombre",
      first_surname: "Primer apellido",
      dni: "DNI",
      city: "Ciudad",
      phone: "Teléfono",
      payment_method: "Método de pago",
    };

    const missing = Object.entries({
      name,
      first_surname,
      dni,
      city,
      phone,
      payment_method,
    })
    .filter(([, value]) => !value)
    .map(([key]) => labels[key]);

    if (missing.length === 1) {
      alert(`El campo ${missing[0]} es requerido!`);
      return;
    } else if (missing.length >= 2) {
      const last = missing.pop();
      const list = missing.join(", ") + " y " + last;
      alert(`Los campos ${list} son requeridos!`);
      return;
    }

    if (email && !emailRegex.test(email)) {
      alert("Correo electrónico no válido.");
      return;
    }

    const method = patientToEdit ? "PUT" : "POST";
    const url = patientToEdit
      ? `/api/patients/${patientToEdit.id}`
      : "/api/patients";

    const payload = {
      name,
      first_surname: first_surname,
      second_surname: second_surname || null,
      dni,
      city,
      phone,
      email: email || null,
      start_date,
      discharge_date: discharge_date || null,
      payment_method,
      request_invoice,
      frequency,
    };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const key = !patientToEdit ? "newpatient" : "patientupdated";
      localStorage.setItem(key, JSON.stringify({ value: "ok", expiry: Date.now() + 6_000 }));
      setEditingPatient && setEditingPatient(null);
      onSuccess();
      /* reset form */
      setName("");
      setFirst_surname("");
      setSecond_surname("");
      setDni("");
      setCity("");
      setPhone("");
      setEmail("");
      setStart_date("2025-01-01");
      setDischarge_date("");
      setPayment_method("");
      setRequest_invoice(false);
      setFrequency("");

      setTimeout(() => (location.hash = "patient-list"), 0);
    } else {
      const msg = await response.text(); // ← texto que devuelve el servidor
      alert(msg || "Error saving patient.");
    }
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 9); // solo 0-9 y max 9
    const parts = digits.match(/.{1,3}/g) ?? []; // trozos de 3
    return parts.join(" "); // 656 456 325
  };

  const dniKeyFilter = (e: JSX.TargetedEvent<HTMLInputElement, KeyboardEvent>) => {
    const pos = e.currentTarget.selectionStart ?? 0;
    const char = e.key;

    if (char.length !== 1) return; // teclas especiales

    if (pos < 8 && !/[0-9]/.test(char)) return e.preventDefault();
    if (pos === 8 && !/[A-Z]/i.test(char)) return e.preventDefault(); // i para aceptar minúscula
  };

  /* ----- render ----- */
  return (
    <div>
      <form
        onSubmit={handleSubmit}
        class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-4"
      >
        <div class="flex items-center justify-between mt-0 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {patientToEdit ? "Edit Patient" : "Añadir Paciente"}
          </h2>

          {/* info campos obligatorios */ }
          <div class="text-gray-700 dark:text-gray-600 font-bold inline mr-41">
            * Datos obligatorios
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* name */}
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Nombre *</label>
            <input
              type="text"
              value={name}
              onInput={(e) => setName(e.currentTarget.value)}
              class={inputCls}
              placeholder="Nombre"
            />
          </div>

          {/* first surname */}
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Primer apellido *</label>
            <input
              type="text"
              value={first_surname}
              onInput={(e) => setFirst_surname(e.currentTarget.value)}
              class={inputCls}
              placeholder="Primer apellido"
            />
          </div>

          {/* second surname */}
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Segundo apellido</label>
            <input
              type="text"
              value={second_surname}
              onInput={(e) => setSecond_surname(e.currentTarget.value)}
              class={inputCls}
              placeholder="Segundo apellido"
            />
          </div>

          {/* city */}
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Localidad *</label>
            <select
              value={city}
              onChange={(e) => setCity(e.currentTarget.value)}
              class={inputCls}
            >
              <option value="Irun">Irun</option>
              <option value="Hondarribia">Hondarribia</option>
              <option value="Hendaia">Hendaia</option>
              <option value="Oiartzun">Oiartzun</option>
              <option value="Oronoz">Oronoz</option>
            </select>
          </div>

          {/* phone */}
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Teléfono *</label>
            <input
              type="text"
              value={phone}
              onBeforeInput={(e) => {
                const c = e.data ?? '';// e.data es null para Backspace, Delete, flechas, etc., por lo que se ignoran y permiten.
                if (c && !/^[0-9]$/.test(c)) e.preventDefault();
              }}
              onInput={(e) => setPhone(formatPhone(e.currentTarget.value))}
              class={inputCls}
              placeholder="Teléfono"
              maxLength={11} // 9 dígitos + 2 espacios
            />
          </div>

          {/* email */}
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class={inputCls}
              placeholder="Email"
            />
          </div>

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
              {patientToEdit ? "Frecuencia activa" : "Frecuencia inicial *"}
            </label>
            <select value={frequency} onChange={(e) => setFrequency(e.currentTarget.value)} class={inputCls}>
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Cada 3 semanas">Cada 3 semanas</option>
              <option value="Mensual">Mensual</option>
              <option value="Bimensual">Bimensual</option>
            </select>
          </div>

          {/* payment method */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Método de pago *</label>
            <select
              value={payment_method}
              onChange={(e) => setPayment_method(e.currentTarget.value)}
              class={inputCls}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>

          {/* discharge date */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Fecha de alta</label>
            <input
              type="date"
              value={discharge_date}
              onInput={(e) => setDischarge_date(e.currentTarget.value)}
              class={inputCls}
            />
          </div>

          {/* dni */ }
          <div>
            <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Dni</label>
            <input
              type="text"
              value={dni}
              onKeyPress={dniKeyFilter}
              onInput={(e) => setDni(e.currentTarget.value.toUpperCase())}
              class={inputCls}
              placeholder="Dni"
              maxLength={9} // 8 dígitos + 1 letra en mayúscula
            />
          </div>

          {/* request invoice */ }
          <div class="flex items-center">
            <input
              id="inv"
              type="checkbox"
              checked={request_invoice}
              onChange={(e) => setRequest_invoice(e.currentTarget.checked)}
              class="h-4 w-4 mt-8 mr-2"
            />
            <label for="inv" class="text-gray-700 dark:text-gray-300 font-bold inline mr-1 mt-8">Solicita factura</label>
          </div>
        </div>

        {/* buttons */ }
        <div class="flex flex-wrap gap-2 mt-6">
          <button
            type="submit"
            class="cursor-pointer bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            {patientToEdit ? "Editar" : "Crear"}
          </button>
          {patientToEdit && (
            <button
              type="button"
              onClick={() => setEditingPatient && setEditingPatient(null)}
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
