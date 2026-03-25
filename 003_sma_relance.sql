-- ============================================================================
-- Seed: sma_relance — Donnees issues des CSV metier
-- Source: apps/SMA-Relance-Mail/docs/Ossature_Dev_Co_SMA_CSV
-- Idempotent: ON CONFLICT DO NOTHING avec UUIDs deterministes
-- ============================================================================

-- Communication topics (optional: requires unsubscribe migration)
DO $$
BEGIN
    IF to_regclass('sma_relance.communication_topics') IS NOT NULL THEN
        INSERT INTO sma_relance.communication_topics (id, code, label, description, is_unsubscribable) VALUES
            ('30000001-0000-0000-0000-000000000001', 'training_reminders',   'Relances formations',            'Emails automatiques de rappel de formations a echeance.', true),
            ('30000001-0000-0000-0000-000000000002', 'training_campaigns',   'Campagnes formations',           'Emails de campagne lies a la formation.',                  true),
            ('30000001-0000-0000-0000-000000000003', 'newsletters',          'Newsletters',                    'Newsletters informatives.',                                 true),
            ('30000001-0000-0000-0000-000000000004', 'transactional_notice', 'Notifications transactionnelles','Messages transactionnels obligatoires (confirmations).',    false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Organization types
INSERT INTO sma_relance.organization_types (id, name, description) VALUES
    ('2f628a8c-ceab-5d5e-b3f7-ae59a5eecd25', 'Ergothérapeute', 'Type importe depuis CSV: Ergothérapeute'),
    ('542a86d8-96e0-5885-8337-fa9d4145fe0e', 'Pharmacie', 'Type importe depuis CSV: Pharmacie'),
    ('31231617-bd81-5e48-b3a4-89ff48887c41', 'PSDM', 'Type importe depuis CSV: PSDM')
ON CONFLICT DO NOTHING;

-- Organizations
INSERT INTO sma_relance.organizations (id, name, organization_type_id, total_employees) VALUES
    ('cec38089-c827-5716-a65d-9b28be4e2caf', 'Aeris', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('1bd311a4-c31c-57fd-be6c-152016fb98ac', 'Air + Nord', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('de01a890-b7ff-5a80-989f-ef4cd7e439dd', 'Almadia', '31231617-bd81-5e48-b3a4-89ff48887c41', 90),
    ('b8a75d9d-dad7-517e-a442-643785d5bf96', 'APA SERVICES DES WEPPES', NULL, NULL),
    ('05e832c7-e112-5f61-b7ba-1d68adaa4967', 'Auxilair', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('3172535c-6de5-5cb1-8df9-2c97ef0cf4c3', 'Boxotop', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('be0aa7c4-0f46-5a0f-9ee7-0aa201e75e66', 'DIADOM', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('871f2085-31f4-582c-bd1c-8ea8356e508e', 'DOMetVIE', NULL, NULL),
    ('efa87067-df76-5173-a8dd-31b9e80de519', 'Echo Medical', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('d9f03735-176b-5be5-b81a-b537289ace6d', 'Elia Médical Nord / Picardie', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('5cb37cf6-4252-5ba7-8250-d6c11700b611', 'ESPRIT SENIOR SERVICES', NULL, NULL),
    ('71846bf7-4826-5af9-8294-025eb6aa04b8', 'FILIERIS', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('bb1027e0-5f09-5bc4-8604-0dce4025a71b', 'FMC Médical', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('51604835-5676-5067-b479-85dce1ac1305', 'GEP Santé HDF', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('11448e45-a698-55da-ae3c-e5265d0c1dd2', 'GRANVILLE MATERIEL MEDICAL', '31231617-bd81-5e48-b3a4-89ff48887c41', 2),
    ('8a5277cd-fe94-56aa-9779-327d3357ce5b', 'GUERVILLE ERGO', '2f628a8c-ceab-5d5e-b3f7-ae59a5eecd25', NULL),
    ('321f61a0-b87b-50a4-9acb-a63804e26030', 'Hygie Medical', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('54fbcb50-2165-591f-aeb2-3612f5c84c05', 'Médical Bel Air', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('778f51b0-af31-56fa-8128-405adf44eddd', 'Médical Plus SARL', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('ae23b814-e827-5efe-b1eb-094c30a40d79', 'Médical Santé 60', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('7b7bb423-d5b2-577c-b201-6f68c150196d', 'Msante', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('f8d1115d-72f4-5202-82a3-87e97742ae05', 'MVD Medical', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('238d784f-e7dc-5d9d-bcf0-088512d90369', 'NEOSANTE', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('4033e08f-8b9e-5e21-8e5b-0e7ae5b0bd37', 'Nord Oxygène', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('dd95280e-25e1-5a81-84dd-09306d2733f4', 'Pharmacie Dehaene', '542a86d8-96e0-5885-8337-fa9d4145fe0e', NULL),
    ('7737e283-7c9d-5c4b-a086-4e1ac4d1a9f6', 'Pharmacie Louette Delaisse', '542a86d8-96e0-5885-8337-fa9d4145fe0e', NULL),
    ('03638d92-059c-580c-a3ed-b857b9717f4d', 'PRADEN MEDICAL', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('8ba2dbf4-6180-5c62-a92c-c5346e109d53', 'SANTELYS', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('823bf353-2f84-5283-b7f6-b14937dbc513', 'Santeo', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('3241eb15-25d6-59ed-a29b-019270424d39', 'Santeol', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('98aee440-cd99-542b-bcc0-4f4d9d11f7b5', 'Synapse Santé', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('caf45357-365b-5d6e-92b5-0ddac912fb11', 'SysMed Assistance', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('a45b9d59-7d9d-5d94-a233-c47a4a6a6436', 'Ventil''Home', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('df8e1089-e4b4-59bb-b64a-1fb2bfd7ea75', 'Ventil''O2', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL),
    ('fc3a4d56-72ab-564c-a2f2-fb781301d92c', 'VKMED', '31231617-bd81-5e48-b3a4-89ff48887c41', NULL)
ON CONFLICT DO NOTHING;

-- Contacts (lignes CSV sans email ignorees)
INSERT INTO sma_relance.organization_contacts (id, organization_id, first_name, last_name, email, role, is_primary) VALUES
    ('ecad85c9-d385-5f64-a527-a1cc5c9efef0', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', 'Perrine', 'Bruggeman', 'perrine.bruggeman@almadia.fr', 'RRH', true),
    ('55b370a1-3bdb-5dc3-8563-483978247efe', 'be0aa7c4-0f46-5a0f-9ee7-0aa201e75e66', 'Kelly', 'Alibert', 'kalibert@diadom.com', 'RRH', true),
    ('63fba50a-4cfc-523b-84e8-0b82e0a44649', 'efa87067-df76-5173-a8dd-31b9e80de519', 'Cyril', 'HEURLIER', 'cyril.heurlier@orange.fr', 'Gérant', true),
    ('3e104b8e-207e-5f74-a12f-37343a6fd9be', '71846bf7-4826-5af9-8294-025eb6aa04b8', 'Guillaume', 'SOUILLEZ', 'guillaume.souillez@filieris.fr', 'Chef de services', true),
    ('d2977396-fc32-5277-ab1a-0e132f82e7b7', '11448e45-a698-55da-ae3c-e5265d0c1dd2', 'Stéphane', 'Freche', 's.freche@g-2m.fr', 'Gérant', true),
    ('2b419607-41bf-5a94-b853-62d655544e15', '8a5277cd-fe94-56aa-9779-327d3357ce5b', 'Noémie', 'Guerville', 'guerville.ergo@gmail.com', 'Ergothérapeute', true),
    ('79923831-b3f6-5f5c-94a9-18581e207023', 'ae23b814-e827-5efe-b1eb-094c30a40d79', 'Charles', 'CRETE', 'c.crete@medicalsante60.fr', 'Gérant', true),
    ('605c0704-5c27-53fd-a625-256a9591bea9', 'f8d1115d-72f4-5202-82a3-87e97742ae05', 'Christelle', 'GRAMMENS', 'christelle.grammens@mvdmedical.com', 'Assistante Adminitratif', false),
    ('d414b41e-2086-54b8-a8eb-9beddb8f17e0', '238d784f-e7dc-5d9d-bcf0-088512d90369', 'Eric', 'Le BIS', 'e.lebis@neosante.fr', 'Président', true),
    ('f6c94bd6-20cf-5f32-b45b-10f4231d61de', 'dd95280e-25e1-5a81-84dd-09306d2733f4', 'Contact', 'Inconnu', 'pharmacie.cappelle@gmail.com', NULL, true),
    ('a492bdfe-0160-53a4-8da0-5c2ece5a31f0', '7737e283-7c9d-5c4b-a086-4e1ac4d1a9f6', 'DELAISSE', 'François Clément', 'fcdelaisse@hotmail.com', 'Pharmacien', true),
    ('593280e2-18e0-5437-ab2c-77ae28c48a0c', '03638d92-059c-580c-a3ed-b857b9717f4d', 'Jennifer', 'Souchon', 'jennifer.souchon@gmx.com', 'Gérante', true),
    ('b547ffed-f2dd-553a-b0c2-acd879f05def', '8ba2dbf4-6180-5c62-a92c-c5346e109d53', 'Michele', 'Dupire', 'clandrecies@santelys.fr', 'Directrice de service', true)
ON CONFLICT DO NOTHING;

-- Training courses
INSERT INTO sma_relance.training_courses (id, code, title, reminder_frequency_months, reminder_disabled, price_ht) VALUES
    ('7fbbdcf4-a068-591f-97aa-ef54ad86122d', 'MATERIEL_MEDICAL_MAINTIEN_A_DOMICILE_MAD', 'Matériel Médical maintien à domicile (MAD)', NULL, false, 190.0),
    ('627eb095-20e7-5a72-a64e-95ee8844f64d', 'PSDM_INTERVENANT', 'PSDM Intervenant', NULL, false, 600.0),
    ('f7ae53dc-67d6-5594-8779-4aa844056fa0', 'PSDM_GARANT_PRO_SANTE', 'PSDM Garant Pro Santé', NULL, false, 500.0),
    ('5b5b48fc-5851-5895-8559-5a0e860d3b57', 'SOINS_PALLIATIFS_APPROCHE_DE_LA_PERSONNE_EN_FIN_DE_VIE', 'Soins Palliatifs : Approche de la personne en fin de vie', NULL, false, 190.0),
    ('391ea14d-dfbe-57ba-a4aa-c2a2b9795c6b', 'PREVENTION_TRAITEMENT_DE_L_ESCARRE_ET_LITS_MEDICAUX', 'Prévention, traitement de l’escarre et lits médicaux', NULL, false, 210.0),
    ('e83060c7-6c7b-578c-bd96-df8b0b74391a', 'TRANSFERT_DE_PATIENTS', 'Transfert de patients', NULL, false, 120.0),
    ('b99b7a73-02cd-523c-b402-fe5692553489', 'MOBILITE', 'Mobilité', NULL, false, 120.0),
    ('481c5a61-8195-5006-925c-ba3b0f91a1e6', 'HYGIENE_ET_INCONTINENCE', 'Hygiène et incontinence', NULL, false, 80.0),
    ('8cd54802-e94e-5353-a768-1879d7384e51', 'NOMENCLATURE_VPH_ESSENTIEL', 'Nomenclature VPH ESSENTIEL', NULL, true, 80.0),
    ('e53b8431-6eb2-5c59-87e3-b2732c184c59', 'NOMENCLATURE_VPH_COMPLET', 'Nomenclature VPH COMPLET', NULL, true, 120.0)
ON CONFLICT DO NOTHING;

-- Course applicability (union Penetration + HISTO + RADAR)
INSERT INTO sma_relance.course_applicability (id, organization_id, course_id) VALUES
    ('4972ec5c-5825-569a-8cde-2c3b3bd07cf5', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '7fbbdcf4-a068-591f-97aa-ef54ad86122d'),
    ('332e94c3-5d3a-5919-810e-7b0e0e0eb8ca', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', 'e53b8431-6eb2-5c59-87e3-b2732c184c59'),
    ('6f5539b4-37d1-51d5-ba7c-08413cffb6bd', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '8cd54802-e94e-5353-a768-1879d7384e51'),
    ('f55107db-df8a-5394-a875-b57ba3527e07', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', 'f7ae53dc-67d6-5594-8779-4aa844056fa0'),
    ('b1373cd5-37b3-5857-a6c5-c6a007f79a7f', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '627eb095-20e7-5a72-a64e-95ee8844f64d'),
    ('0b404d6a-0525-555d-996f-6515cd49d84d', 'be0aa7c4-0f46-5a0f-9ee7-0aa201e75e66', 'f7ae53dc-67d6-5594-8779-4aa844056fa0'),
    ('8f752c28-74a2-5920-9915-856bae831470', '871f2085-31f4-582c-bd1c-8ea8356e508e', '7fbbdcf4-a068-591f-97aa-ef54ad86122d'),
    ('376ba3fb-593a-53c0-8f34-2c3cb8066c0e', '871f2085-31f4-582c-bd1c-8ea8356e508e', 'e53b8431-6eb2-5c59-87e3-b2732c184c59'),
    ('b88f7d42-ee74-5f80-b0b5-0bf101856817', '71846bf7-4826-5af9-8294-025eb6aa04b8', 'e53b8431-6eb2-5c59-87e3-b2732c184c59'),
    ('3d599bba-0f74-58d7-9084-2dec1c5d89f5', '71846bf7-4826-5af9-8294-025eb6aa04b8', '391ea14d-dfbe-57ba-a4aa-c2a2b9795c6b'),
    ('f7d13db2-2e3c-5a42-8c70-b34f990d4841', '11448e45-a698-55da-ae3c-e5265d0c1dd2', 'e53b8431-6eb2-5c59-87e3-b2732c184c59'),
    ('fa4ffa58-950f-5cdd-9947-af90f73ee701', '11448e45-a698-55da-ae3c-e5265d0c1dd2', '627eb095-20e7-5a72-a64e-95ee8844f64d'),
    ('1e8cdf2f-58fb-5054-bb26-31cc99dd64d1', '7b7bb423-d5b2-577c-b201-6f68c150196d', '481c5a61-8195-5006-925c-ba3b0f91a1e6'),
    ('d01bdf7a-125a-545e-a8a1-9f5082aac1b0', '7b7bb423-d5b2-577c-b201-6f68c150196d', 'f7ae53dc-67d6-5594-8779-4aa844056fa0'),
    ('eb6b7f54-413e-52a5-ba15-03bd49c3f0df', '7b7bb423-d5b2-577c-b201-6f68c150196d', '627eb095-20e7-5a72-a64e-95ee8844f64d'),
    ('6e559db6-a85b-5900-8e6a-d908548235d1', 'f8d1115d-72f4-5202-82a3-87e97742ae05', 'e53b8431-6eb2-5c59-87e3-b2732c184c59'),
    ('92100b28-9cf8-584c-a95a-9fefed619ed8', 'f8d1115d-72f4-5202-82a3-87e97742ae05', 'e83060c7-6c7b-578c-bd96-df8b0b74391a'),
    ('65f85144-4f06-586c-a1c1-0d62acef2225', '7737e283-7c9d-5c4b-a086-4e1ac4d1a9f6', '8cd54802-e94e-5353-a768-1879d7384e51'),
    ('0b5135eb-ac14-59b6-bb3b-613641f7a792', '8ba2dbf4-6180-5c62-a92c-c5346e109d53', 'e53b8431-6eb2-5c59-87e3-b2732c184c59'),
    ('a0dfabcc-967d-5c72-99c0-cb1b96965832', '8ba2dbf4-6180-5c62-a92c-c5346e109d53', '5b5b48fc-5851-5895-8559-5a0e860d3b57'),
    ('c1472777-aebc-57f6-97cf-325a60527f5e', '3241eb15-25d6-59ed-a29b-019270424d39', 'b99b7a73-02cd-523c-b402-fe5692553489'),
    ('a7016cfe-d3aa-56a8-8f91-78d71a0ae3ce', '3241eb15-25d6-59ed-a29b-019270424d39', 'f7ae53dc-67d6-5594-8779-4aa844056fa0')
ON CONFLICT DO NOTHING;

-- Training sessions (HISTO + RADAR dedoublonnees par etablissement/formation/date)
INSERT INTO sma_relance.training_sessions (id, organization_id, course_id, session_date, status, source) VALUES
    ('3a520899-c509-573e-b00b-ead974417495', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '7fbbdcf4-a068-591f-97aa-ef54ad86122d', '2025-08-18', 'completed', 'import'),
    ('539c676f-3f36-5d3a-83c2-801e18a0a15c', '11448e45-a698-55da-ae3c-e5265d0c1dd2', 'e53b8431-6eb2-5c59-87e3-b2732c184c59', '2025-09-26', 'completed', 'import'),
    ('630aaac0-d0f1-5cb9-8fb9-acca12141f54', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', 'e53b8431-6eb2-5c59-87e3-b2732c184c59', '2025-09-30', 'completed', 'import'),
    ('25afb25a-8172-5a7e-b35b-1a5e0dca1c51', 'be0aa7c4-0f46-5a0f-9ee7-0aa201e75e66', 'f7ae53dc-67d6-5594-8779-4aa844056fa0', '2025-10-01', 'completed', 'import'),
    ('88247215-8db8-56e5-9b35-690058243785', 'be0aa7c4-0f46-5a0f-9ee7-0aa201e75e66', 'f7ae53dc-67d6-5594-8779-4aa844056fa0', '2025-10-10', 'completed', 'import'),
    ('54ec063c-78aa-560c-8e02-027ce611b39a', '8ba2dbf4-6180-5c62-a92c-c5346e109d53', 'e53b8431-6eb2-5c59-87e3-b2732c184c59', '2025-10-17', 'completed', 'import'),
    ('c682b680-39a7-5bc0-9d5e-cf5750f98a6f', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', 'f7ae53dc-67d6-5594-8779-4aa844056fa0', '2025-11-03', 'completed', 'import'),
    ('ef98b705-0833-53c5-b0e9-dfe965315db8', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '627eb095-20e7-5a72-a64e-95ee8844f64d', '2025-11-03', 'completed', 'import'),
    ('3197c469-efed-5341-995c-ec4b35b7bf5d', '71846bf7-4826-5af9-8294-025eb6aa04b8', 'e53b8431-6eb2-5c59-87e3-b2732c184c59', '2025-11-03', 'completed', 'import'),
    ('a04e1737-1c4d-57a3-9683-25390f3c793f', 'f8d1115d-72f4-5202-82a3-87e97742ae05', 'e53b8431-6eb2-5c59-87e3-b2732c184c59', '2025-11-10', 'completed', 'import'),
    ('df071103-0dc4-586c-9f50-61ce69045a80', '3241eb15-25d6-59ed-a29b-019270424d39', 'f7ae53dc-67d6-5594-8779-4aa844056fa0', '2025-12-01', 'completed', 'import'),
    ('ea47edc2-fc82-5ff8-8b6e-17767e55d03b', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '627eb095-20e7-5a72-a64e-95ee8844f64d', '2025-12-08', 'completed', 'import'),
    ('7887eb97-26fc-5515-8027-aa8498d9b2a4', '7b7bb423-d5b2-577c-b201-6f68c150196d', 'f7ae53dc-67d6-5594-8779-4aa844056fa0', '2026-01-12', 'completed', 'import'),
    ('0af549ec-240f-54f9-8257-01a93842bf2a', '7b7bb423-d5b2-577c-b201-6f68c150196d', '627eb095-20e7-5a72-a64e-95ee8844f64d', '2026-01-12', 'completed', 'import'),
    ('0463fa6b-d31e-5cbe-b944-e37c1f639bc3', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '8cd54802-e94e-5353-a768-1879d7384e51', '2026-01-29', 'completed', 'import'),
    ('292e858c-f1a9-54c1-b454-fc747d82c0e6', '7737e283-7c9d-5c4b-a086-4e1ac4d1a9f6', '8cd54802-e94e-5353-a768-1879d7384e51', '2026-01-29', 'completed', 'import'),
    ('03c6c14f-11c4-5dc0-a042-6fc9f5d197fe', 'de01a890-b7ff-5a80-989f-ef4cd7e439dd', '7fbbdcf4-a068-591f-97aa-ef54ad86122d', '2026-02-13', 'completed', 'import'),
    ('1462624a-7021-53e3-8246-40bfcfadc893', '871f2085-31f4-582c-bd1c-8ea8356e508e', '7fbbdcf4-a068-591f-97aa-ef54ad86122d', '2026-02-13', 'completed', 'import')
ON CONFLICT DO NOTHING;

-- Reminder rules
INSERT INTO sma_relance.reminder_rules (id, name, is_active, offset_sign, offset_value, offset_unit, trigger_type, recipient_strategy) VALUES
    ('10000001-0000-0000-0000-000000000001', 'J-30 avant echeance', true, -1, 30, 'day', 'before', 'primary'),
    ('10000001-0000-0000-0000-000000000002', 'J-7 avant echeance',  true, -1, 7,  'day', 'before', 'primary'),
    ('10000001-0000-0000-0000-000000000003', 'Jour J',              true,  0, 0,  'day', 'on',     'primary'),
    ('10000001-0000-0000-0000-000000000004', 'J+7 apres echeance',  true,  1, 7,  'day', 'after',  'primary'),
    ('10000001-0000-0000-0000-000000000005', 'J+30 apres echeance', true,  1, 30, 'day', 'after',  'primary'),
    ('10000001-0000-0000-0000-000000000006', 'M+1 apres echeance',  true,  1, 1,  'month','after', 'primary')
ON CONFLICT DO NOTHING;

-- Email templates
INSERT INTO sma_relance.email_templates (id, key, name, subject_template, body_template) VALUES
    ('20000001-0000-0000-0000-000000000001',
     'relance_avant',
     'Relance avant echeance',
     'Formation {{course_title}} - Echeance dans {{days_until}} jours',
     'Bonjour,\n\nLa formation "{{course_title}}" pour {{organization_name}} arrive a echeance le {{due_date}}.\n\nMerci de planifier le renouvellement.\n\nCordialement,\nService Formation Almadia'),
    ('20000001-0000-0000-0000-000000000002',
     'relance_jour_j',
     'Relance jour J',
     'Formation {{course_title}} - Echeance aujourd''hui',
     'Bonjour,\n\nLa formation "{{course_title}}" pour {{organization_name}} arrive a echeance aujourd''hui ({{due_date}}).\n\nMerci de planifier le renouvellement rapidement.\n\nCordialement,\nService Formation Almadia'),
    ('20000001-0000-0000-0000-000000000003',
     'relance_apres',
     'Relance apres echeance',
     'URGENT - Formation {{course_title}} - Echeance depassee de {{days_overdue}} jours',
     'Bonjour,\n\nAttention : la formation "{{course_title}}" pour {{organization_name}} est en depassement depuis le {{due_date}} ({{days_overdue}} jours).\n\nMerci de regulariser la situation.\n\nCordialement,\nService Formation Almadia')
ON CONFLICT DO NOTHING;

-- Lier les templates aux rules
UPDATE sma_relance.reminder_rules SET template_id = '20000001-0000-0000-0000-000000000001' WHERE id IN ('10000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002');
UPDATE sma_relance.reminder_rules SET template_id = '20000001-0000-0000-0000-000000000002' WHERE id = '10000001-0000-0000-0000-000000000003';
UPDATE sma_relance.reminder_rules SET template_id = '20000001-0000-0000-0000-000000000003' WHERE id IN ('10000001-0000-0000-0000-000000000004', '10000001-0000-0000-0000-000000000005', '10000001-0000-0000-0000-000000000006');

-- Lier templates et regles au topic "relances formations" (si colonnes unsubscribe presentes)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'sma_relance'
          AND table_name = 'email_templates'
          AND column_name = 'communication_topic_id'
    ) THEN
        UPDATE sma_relance.email_templates
        SET communication_topic_id = '30000001-0000-0000-0000-000000000001'
        WHERE id IN (
            '20000001-0000-0000-0000-000000000001',
            '20000001-0000-0000-0000-000000000002',
            '20000001-0000-0000-0000-000000000003'
        )
          AND communication_topic_id IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'sma_relance'
          AND table_name = 'reminder_rules'
          AND column_name = 'communication_topic_id'
    ) THEN
        UPDATE sma_relance.reminder_rules
        SET communication_topic_id = '30000001-0000-0000-0000-000000000001'
        WHERE id IN (
            '10000001-0000-0000-0000-000000000001',
            '10000001-0000-0000-0000-000000000002',
            '10000001-0000-0000-0000-000000000003',
            '10000001-0000-0000-0000-000000000004',
            '10000001-0000-0000-0000-000000000005',
            '10000001-0000-0000-0000-000000000006'
        )
          AND communication_topic_id IS NULL;
    END IF;
END $$;
