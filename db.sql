-- Archivo: schema.sql
-- Base: MySQL / MariaDB 10.3+

CREATE DATABASE IF NOT EXISTS eguzkilore_patients;
USE eguzkilore_patients;

CREATE TABLE IF NOT EXISTS patients (
  `id` varchar(26) NOT NULL,
  `name` varchar(100) NOT NULL,
  `first_surname` varchar(100) NOT NULL,
  `second_surname` varchar(100) DEFAULT NULL,
  `dni` varchar(9) NOT NULL,
  `city` varchar(100) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `start_date` date NOT NULL DEFAULT '2025-01-01',
  `discharge_date` date DEFAULT NULL,
  `payment_method` varchar(50) NOT NULL,
  `request_invoice` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS frequencies (
  id VARCHAR(26) PRIMARY KEY,
  patient_id VARCHAR(26) NOT NULL,
  frequency VARCHAR(26) NOT NULL DEFAULT 'semanal',
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  CONSTRAINT fk_freq_patient
    FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
