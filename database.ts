import client from "./lib/sql.ts";

/////////////////////////////////
// ---------- PATIENT ----------
/////////////////////////////////
export interface Patient {
  id: string;
  name: string;
  first_surname: string;
  second_surname?: string | null;
  dni: string;
  city: string;
  phone: string;
  email?: string | null;
  start_date: string; // ISO date
  discharge_date?: string | null;
  payment_method: string;
  request_invoice: boolean;
  frequencies: Array<{
    frequency: string;
    start_date: string;
    end_date?: string | null;
  }>;
}

// export async function readPatients(): Promise<Patient[]> {
// const res = await client.execute(
// "SELECT * FROM patients ORDER BY start_date DESC, id DESC"
// );
// return res.rows as Patient[];
// }

export async function readPatients(): Promise<Patient[]> {
  const sql = `
SELECT p.*,
JSON_ARRAYAGG(
JSON_OBJECT(
'frequency', f.frequency,
'start_date', f.start_date,
'end_date', f.end_date
)
) AS frequencies
FROM patients p
JOIN frequencies f ON f.patient_id = p.id
GROUP BY p.id
ORDER BY p.start_date DESC, p.id DESC;
`;

  const res = await client.execute(sql);

  return res.rows?.map((r: any) => ({
    ...r,
    frequencies: JSON.parse(r.frequencies), // array limpio
  })) as Patient[];
}

// export async function addPatient(p: Patient): Promise<void> {
export async function addPatient(p: Patient): Promise<{ inserted: boolean; msg?: string }> {
  const exists = await client.execute(
    "SELECT 1 FROM patients WHERE dni = ? LIMIT 1",
    [p.dni]
  );
  if (exists.rows?.length) {
    return { inserted: false, msg: "El DNI ya está registrado!" };
  }
  await client.execute(

    `INSERT INTO patients(id, name, first_surname, second_surname, dni, city,
phone, email, start_date, discharge_date,
payment_method, request_invoice)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.id,
      p.name,
      p.first_surname,
      p.second_surname ?? null,
      p.dni,
      p.city,
      p.phone,
      p.email ?? null,
      p.start_date,
      p.discharge_date ?? null,
      p.payment_method,
      p.request_invoice ? 1 : 0
    ]
  );

  return { inserted: true };
}

export async function updatePatient( id: string, p: Partial<Patient>
): Promise<{ affectedRows: number; msg?: string }> {
  // const counter = await client.execute(
  //   "SELECT count(dni) FROM patients WHERE dni = ?",
  //   [p.dni]
  // );
  // onst count = Number((res.rows?.[0] as any)?.c ?? 0);
  // const count = Number(res.rows?.[0]?.c ?? 0);
  // if (counter === 2) {
  //   return { affectedRows: 2, msg: "El DNI ya está registrado en otro paciente!" };
  // }

  const resDni = await client.execute(
    "SELECT COUNT(*) AS c FROM patients WHERE dni = ? AND id <> ?",
    [p.dni, id]
  );

  const count = Number((resDni.rows?.[0] as any)?.c ?? 0);
  if (count > 0) {
    return { affectedRows: 0, msg: "El DNI ya está registrado en otro paciente!" };
  }

  const res = await client.execute(
    `UPDATE patients
SET name = ?,
first_surname = ?,
second_surname = ?,
dni = ?,
city = ?,
phone = ?,
email = ?,
start_date = ?,
discharge_date = ?,
payment_method = ?,
request_invoice = ?
WHERE id = ?`,
    [
      p.name,
      p.first_surname,
      p.second_surname ?? null,
      p.dni,
      p.city,
      p.phone,
      p.email ?? null,
      p.start_date,
      p.discharge_date ?? null,
      p.payment_method,
      p.request_invoice ? 1 : 0,
      id
    ]
  );
  return { affectedRows: res.affectedRows! };
}

// export async function deletePatient(
// id: string
// ): Promise<{ affectedRows: number }> {
// const res = await client.execute(
// "DELETE FROM patients WHERE id = ?",
// [id]
// );
// return { affectedRows: res.affectedRows! };
// }

export async function deletePatient(id: string): Promise<{ affectedRows: number }> {
  // 1. elimina las frecuencias del paciente
  await client.execute(
    "DELETE FROM frequencies WHERE patient_id = ?",
    [id]
  );

  // 2. elimina el paciente
  const res = await client.execute(
    "DELETE FROM patients WHERE id = ?",
    [id]
  );

  return { affectedRows: res.affectedRows! };
}

// ---------- FREQUENCY ----------
export interface Frequency {
  id: string;
  patient_id: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
}

export async function readFrequencies(patientId: string): Promise<Frequency[]> {
  const res = await client.execute(
    "SELECT * FROM frequencies WHERE patient_id = ? ORDER BY id DESC",
    [patientId]
  );
  return res.rows as Frequency[];
}


export async function readActiveFrequency(patientId: string): Promise<Frequency[]> {
  const res = await client.execute(
    "SELECT * FROM frequencies WHERE patient_id = ? AND end_date IS NULL ORDER BY start_date",
    [patientId]
  );
  return res.rows as Frequency[];
}

export async function addFrequency(f: Frequency): Promise<{ inserted: boolean; msg?: string }> {
  // 1. ¿existe frecuencia activa?
  const rows = await client.execute(
    "SELECT start_date FROM frequencies WHERE patient_id = ? AND end_date IS NULL LIMIT 1",
    [f.patient_id]
  );
  const last = rows.rows![0] as any; // primera fila o undefined

  if (last && new Date(f.start_date) <= new Date(last.start_date)) {
    return { inserted: false, msg: "La fecha de inicio de la nueva frecuencia es anterior o igual a la frecuencia activa!" };
  }

  // 2. cerrar anterior
  await client.execute(
    `UPDATE frequencies SET end_date = DATE_SUB(?, INTERVAL 1 DAY)
WHERE patient_id = ? AND end_date IS NULL`,
    [f.start_date, f.patient_id]
  );

  // 3. insertar nueva
  await client.execute(
    "INSERT INTO frequencies(id, patient_id, frequency, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
    [f.id, f.patient_id, f.frequency, f.start_date, f.end_date ?? null]
  );

  return { inserted: true };
}

export async function updateFrequency(
  id: string,
  f: Partial<Frequency>
): Promise<{ affectedRows: number }> {
  const res = await client.execute(
    "UPDATE frequencies SET frequency = ?, start_date = ?, end_date = ? WHERE id = ?",
    [f.frequency, f.start_date, f.end_date ?? null, id]
  );
  return { affectedRows: res.affectedRows! };
}

export async function deleteFrequency(id: string): Promise<{ affectedRows: number; msg?: string }> {
  // 1. paciente de la fila que van a borrar
  const row = await client.execute(
    "SELECT patient_id FROM frequencies WHERE id = ?",
    [id]
  );
  // const patientId = (row.rows[0] as any)?.patient_id;
  const patientId = row.rows?.[0]?.patient_id;
  if (!patientId) return { affectedRows: 0 };

  // 2. ¿cuántas quedan para ese paciente?
  const total = await client.execute(
    "SELECT COUNT(*) as c FROM frequencies WHERE patient_id = ?",
    [patientId]
  );
  const count = Number((total.rows?.[0] as any)?.c ?? 0);

  // 2.1 solo 1 → no se puede borrar
  if (count === 1) {
    return { affectedRows: 0, msg: "No se puede eliminar la única frecuencia activa." };
  }

  // 2.2 hay varias → borrar y re-activar la más reciente
  await client.execute("DELETE FROM frequencies WHERE id = ?", [id]);

  await client.execute(
    `UPDATE frequencies
SET end_date = NULL
WHERE patient_id = ?
ORDER BY id DESC
LIMIT 1`,
    [patientId]
  );

  return { affectedRows: 1 };
}

// export async function deleteFrequency(
// id: string
// ): Promise<{ affectedRows: number }> {
// const res = await client.execute(
// "DELETE FROM frequencies WHERE id = ?",
// [id]
// );
// return { affectedRows: res.affectedRows! };
// }
