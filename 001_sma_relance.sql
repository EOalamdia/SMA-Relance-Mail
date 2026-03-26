-- ============================================================================
-- Seed: sma_relance — Donnees issues des CSV metier
-- Source: apps/SMA/docs/Ossature_Dev_Co_SMA_CSV
-- Idempotent: ON CONFLICT DO NOTHING avec UUIDs deterministes
-- Couverture CSV: Detail_Etablissements, Contacts, Detail_Formations, HISTO, Penetration, RADAR_DU_BESOIN
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

-- Organization types (CSV Nature)
INSERT INTO sma_relance.organization_types (id, name, description) VALUES
    ('310c505d-3d5f-52f3-ada1-c2ac2daca1e0', 'À renseigner', 'Type importe depuis CSV: À renseigner'),
    ('0c1080cc-c41b-5e3a-ae7d-2c90d816f39a', 'Ergothérapeute', 'Type importe depuis CSV: Ergothérapeute'),
    ('9a693e90-870a-5977-80df-407b72dddc25', 'Pharmacie', 'Type importe depuis CSV: Pharmacie'),
    ('8a239cbf-f680-58af-abb0-740a86de8de4', 'PSDM', 'Type importe depuis CSV: PSDM')
ON CONFLICT DO NOTHING;

-- Organizations (Detail_Etablissements + references from other CSVs)
INSERT INTO sma_relance.organizations (id, name, organization_type_id, total_employees) VALUES
    ('5b664a7f-af32-591c-bc11-9a63671ab746', 'Aeris', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('19c4ccdf-46d2-5b4d-8808-98cd476c10d9', 'Air + Nord', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('e57350cc-8add-5f11-bde5-bdf352abf06e', 'Almadia', '8a239cbf-f680-58af-abb0-740a86de8de4', 90),
    ('9af4b5e7-1d6b-53d1-b3b0-5cb338899b74', 'APA SERVICES DES WEPPES', NULL, NULL),
    ('21d465bd-4644-503c-a6de-d19daf37db92', 'Auxilair', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('579e9a90-88c0-54da-8886-65a92d9e48fe', 'Boxotop', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'DIADOM', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('b9456107-e6ed-5b95-ba47-89e0e87f2c1f', 'DOMetVIE', '310c505d-3d5f-52f3-ada1-c2ac2daca1e0', NULL),
    ('00425f3f-aa03-5731-9269-ea2a3d9f7c48', 'Echo Medical', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('ca18c104-255c-5e20-a842-00a03703fffa', 'Elia Médical Nord / Picardie', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('7faca1b2-caab-5090-8b6c-110fe76271a2', 'ESPRIT SENIOR SERVICES', NULL, NULL),
    ('d2edddcb-1db0-5813-9aa7-f42d67d0247d', 'FILIERIS', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('7de361c2-0c21-52a2-a873-cfba9572bc2a', 'FMC Médical', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('7ef10246-fbcd-5b7c-b2c3-c0a71a5ceb56', 'GEP Santé HDF', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('7fc5a96d-b939-5980-b3cc-4bfce1849f9d', 'GRANVILLE MATERIEL MEDICAL', '8a239cbf-f680-58af-abb0-740a86de8de4', 2),
    ('02f51aa8-e67e-5d46-9a2f-cfe8d36587fc', 'GUERVILLE ERGO', '0c1080cc-c41b-5e3a-ae7d-2c90d816f39a', NULL),
    ('08f06114-a210-5d58-b43d-a24b27dddfb1', 'Hygie Medical', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('69b17ada-773e-5d1d-ba35-e35b8ff9824d', 'Médical Bel Air', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('e21aec2a-9398-57ac-b566-72336f9d46fa', 'Médical Plus SARL', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('4db5a558-1422-54c6-8235-27f474b67313', 'Médical Santé 60', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('da1d8f04-cd25-5e3d-b228-e36139b4455a', 'Msante', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'MVD Medical', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('5033ca95-219c-54a4-8d5d-3adbf4a534b0', 'NEOSANTE', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('ecf96fa8-03f2-5d3a-845a-64c33b425272', 'Nord Oxygène', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('a306f0a1-956a-5ee2-adb6-6777aba2d57d', 'Pharmacie Dehaene', '9a693e90-870a-5977-80df-407b72dddc25', NULL),
    ('68a5abe0-b4f9-5830-be0c-829b4b72e9db', 'Pharmacie Louette Delaisse', '9a693e90-870a-5977-80df-407b72dddc25', NULL),
    ('80842876-a9ba-529f-b3dd-688c23105292', 'PRADEN MEDICAL', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'SANTELYS', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('7b84e19e-44d5-53f2-b474-1ce30e8b67f5', 'Santeo', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('3da63bd1-5fae-5436-a998-0b02c60b1463', 'Santeol', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('c2d4538d-2715-50bd-b3bc-00bace39e769', 'Synapse Santé', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('e1a757c0-0159-5b55-bcf2-26ec902775a4', 'SysMed Assistance', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('212eee2e-862b-5f97-ac45-0669e14f897d', 'Ventil''Home', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('c34a8dcc-824a-5329-a76c-6a6cdd1446dc', 'Ventil''O2', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL),
    ('a77e0177-49d8-52c4-8ba7-ffb466ed1f48', 'VKMED', '8a239cbf-f680-58af-abb0-740a86de8de4', NULL)
ON CONFLICT DO NOTHING;

-- Contacts (all Contacts.csv rows; placeholder emails generated when missing)
INSERT INTO sma_relance.organization_contacts (id, organization_id, first_name, last_name, email, role, is_primary) VALUES
    ('e3b1dd68-04fa-58ad-b3ba-4b7f80e6e678', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'Perrine', 'Bruggeman', 'perrine.bruggeman@almadia.fr', 'RRH | Décideur | Tel: 0673845585', true),
    ('7d466173-2b81-5a75-a502-3ec995e0c343', '9af4b5e7-1d6b-53d1-b3b0-5cb338899b74', 'Medhi', 'GHALEM', 'no-email+apa-services-des-weppes-medhi-ghalem-1@invalid.local', 'Assistant RH | Terrain', false),
    ('9260c27c-6e96-56c2-86a6-3050b89660eb', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'Kelly', 'Alibert', 'kalibert@diadom.com', 'RRH | Décideur | Tel: 06 80 23 25 98', true),
    ('d9546529-8de4-5636-83a4-14366e4c99dc', '00425f3f-aa03-5731-9269-ea2a3d9f7c48', 'Cyril', 'HEURLIER', 'cyril.heurlier@orange.fr', 'Gérant | Décideur', true),
    ('73fd3483-cd36-57b4-9635-9af9d5f1b660', '7faca1b2-caab-5090-8b6c-110fe76271a2', 'Medhi', 'GHALEM', 'no-email+esprit-senior-services-medhi-ghalem-1@invalid.local', 'Assistant RH | Terrain', false),
    ('adcf9d40-a284-504d-9c55-ce77000ef598', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'Guillaume', 'SOUILLEZ', 'guillaume.souillez@filieris.fr', 'Chef de services | Décideur | Tel: 06 50 42 82 59', true),
    ('b045e68e-32d5-5b9d-b401-e4844ac829f1', '7fc5a96d-b939-5980-b3cc-4bfce1849f9d', 'Stéphane', 'Freche', 's.freche@g-2m.fr', 'Gérant | Décideur | Tel: 06 25 12 06 90', true),
    ('4430282c-1cdb-5af0-8f2b-59e4a886ffa8', '02f51aa8-e67e-5d46-9a2f-cfe8d36587fc', 'Noémie', 'Guerville', 'guerville.ergo@gmail.com', 'Ergothérapeute | Décideur', true),
    ('dce02fc5-785a-56d7-b6e3-9a45516437ae', '4db5a558-1422-54c6-8235-27f474b67313', 'Charles', 'CRETE', 'c.crete@medicalsante60.fr', 'Gérant | Décideur', true),
    ('19296b24-cb2b-50c0-bfa7-25503558af03', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', 'Antoine', 'Dufeutrelle', 'no-email+msante-antoine-dufeutrelle-1@invalid.local', 'Directeur Général | Décideur', true),
    ('feff7b08-73c2-5bcd-b0a3-5d8a9f193012', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'Christelle', 'GRAMMENS', 'christelle.grammens@mvdmedical.com', 'Assistante Adminitratif | Terrain', false),
    ('8d054e76-9072-53c0-846e-470208428e4a', '5033ca95-219c-54a4-8d5d-3adbf4a534b0', 'Eric', 'Le BIS', 'e.lebis@neosante.fr', 'Président | Décideur | Tel: 06 15 37 86 40', true),
    ('12624cc3-1cb7-5fd1-80d7-360f5a4105a2', 'a306f0a1-956a-5ee2-adb6-6777aba2d57d', 'Contact', 'Inconnu', 'pharmacie.cappelle@gmail.com', 'Décideur | Tel: 03.28.64.68.41', true),
    ('38a8111f-0921-5c6c-b792-85acbae61970', '68a5abe0-b4f9-5830-be0c-829b4b72e9db', 'DELAISSE', 'François Clément', 'fcdelaisse@hotmail.com', 'Pharmacien | Décideur', true),
    ('ded6b491-544c-558d-adda-5f5d5fac1d68', '80842876-a9ba-529f-b3dd-688c23105292', 'Jennifer', 'Souchon', 'jennifer.souchon@gmx.com', 'Gérante | Décideur', true),
    ('83736792-8882-5af0-9b49-a6072f7aa5ec', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'Michele', 'Dupire', 'clandrecies@santelys.fr', 'Directrice de service | Décideur', true),
    ('7b57b6dc-e694-5a22-8248-d83247f6bfdd', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'Adeline', 'Bourghelle', 'no-email+santeol-adeline-bourghelle-1@invalid.local', 'RRH | Décideur', true)
ON CONFLICT DO NOTHING;

-- Training courses (Detail_Formations + fallback titles seen in other CSVs)
INSERT INTO sma_relance.training_courses (id, code, title, reminder_frequency_months, reminder_disabled, price_ht) VALUES
    ('10079239-56d6-5ea3-8573-10813b55d658', 'HYGIENE_ET_INCONTINENCE', 'Hygiène et incontinence', NULL, false, 80.0),
    ('ae331bf3-e980-5533-80a5-0e51dac33a41', 'MATERIEL_MEDICAL_MAINTIEN_A_DOMICILE_MAD', 'Matériel Médical maintien à domicile (MAD)', NULL, false, 190.0),
    ('a5f80383-4d94-5b95-ae04-c8028fd781b0', 'MOBILITE', 'Mobilité', NULL, false, 120.0),
    ('ebe49fe9-e17d-5e1c-9bad-828459a588f9', 'NOMENCLATURE_VPH_COMPLET', 'Nomenclature VPH COMPLET', NULL, true, 120.0),
    ('69fd28c0-8418-5cec-88f5-154e09987ade', 'NOMENCLATURE_VPH_ESSENTIEL', 'Nomenclature VPH ESSENTIEL', NULL, true, 80.0),
    ('ffc0b22d-7fb1-5b7d-8fdd-7a61b4f72ef3', 'PREVENTION_TRAITEMENT_DE_L_ESCARRE_ET_LITS_MEDICAUX', 'Prévention, traitement de l’escarre et lits médicaux', NULL, false, 210.0),
    ('a7c9eadc-53cf-5e70-8b57-5d107db65e80', 'PSDM_GARANT_PRO_SANTE', 'PSDM Garant Pro Santé', NULL, false, 500.0),
    ('885eec05-3ea8-51a7-96fa-5f39c7ce52cc', 'PSDM_INTERVENANT', 'PSDM Intervenant', NULL, false, 600.0),
    ('c026a7d4-08bb-50c0-9dd1-86efcbf8516f', 'SOINS_PALLIATIFS_APPROCHE_DE_LA_PERSONNE_EN_FIN_DE_VIE', 'Soins Palliatifs : Approche de la personne en fin de vie', NULL, false, 190.0),
    ('b29bcc51-33aa-5476-b0c5-31dec819d30f', 'TRANSFERT_DE_PATIENTS', 'Transfert de patients', NULL, false, 120.0)
ON CONFLICT DO NOTHING;

-- Course applicability (union of Penetration + RADAR_DU_BESOIN + HISTO pairs)
INSERT INTO sma_relance.course_applicability (id, organization_id, course_id) VALUES
    ('9e50f42e-dc67-5359-b774-f4068d3105e1', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'c026a7d4-08bb-50c0-9dd1-86efcbf8516f'),
    ('74180a70-aac6-51a5-840f-29a7f8065844', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9'),
    ('d7f9bc11-6af8-519f-a786-4b77215d3c41', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a5f80383-4d94-5b95-ae04-c8028fd781b0'),
    ('c9dd9790-a53c-59ae-b4ca-c4901c83bb0d', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80'),
    ('478a56b7-d2af-53bf-8769-2e9fb41f8739', '68a5abe0-b4f9-5830-be0c-829b4b72e9db', '69fd28c0-8418-5cec-88f5-154e09987ade'),
    ('b41ae96d-e04e-5842-85b0-4623b6cc90b3', '7fc5a96d-b939-5980-b3cc-4bfce1849f9d', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc'),
    ('f84e16b2-b802-5f35-ab17-1c84cf319e84', '7fc5a96d-b939-5980-b3cc-4bfce1849f9d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9'),
    ('acb90270-285f-5194-8c5f-2c19b76d0cc0', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'b29bcc51-33aa-5476-b0c5-31dec819d30f'),
    ('40a0f265-d4f1-567d-94db-d068bc51f42b', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9'),
    ('2871339a-28a5-505e-9ffd-1bd1adcda134', 'b9456107-e6ed-5b95-ba47-89e0e87f2c1f', 'ae331bf3-e980-5533-80a5-0e51dac33a41'),
    ('e54c130a-86d6-53c3-98a7-4fca5a1950fd', 'b9456107-e6ed-5b95-ba47-89e0e87f2c1f', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9'),
    ('52cc687f-76e8-533f-9d91-3efdab3dc4fc', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9'),
    ('11a44a3d-b0d6-55c6-b2f0-52afbfed1f39', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ffc0b22d-7fb1-5b7d-8fdd-7a61b4f72ef3'),
    ('ef3efb16-7662-5bc0-b00f-03d9bd62b8aa', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '10079239-56d6-5ea3-8573-10813b55d658'),
    ('1f9c523b-e398-5583-bbb8-362ba6d77175', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc'),
    ('60aad2fb-eedf-5181-8808-8b29b0b6f1c0', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80'),
    ('49b7ba15-2af8-505d-a998-2191d48b6079', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80'),
    ('39abce4e-80e8-55dd-bfa9-7f1cf90e9fc5', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade'),
    ('3ce8687b-011d-5375-aaec-908d81c37293', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc'),
    ('fc31c845-73b9-5632-9da5-153f736240b1', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80'),
    ('ae005b75-3b2c-5ad9-8c7a-0351344214ac', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41'),
    ('b196fc3c-5216-5ab8-a74a-ececfa47012e', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9')
ON CONFLICT DO NOTHING;

-- Training sessions (all HISTO rows + all RADAR rows)
INSERT INTO sma_relance.training_sessions (id, organization_id, course_id, session_date, status, source, notes) VALUES
    ('5d5dfe54-87ae-53d5-85ab-c8af6871b7fb', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2025-08-18', 'completed', 'import', 'source=HISTO.csv; row=2; stagiaire_nom=LAMARRE; stagiaire_prenom=Louise; fonction=Infirmier; statut_csv=Terminé'),
    ('db07adc9-24d0-57b6-a28e-395654478f6d', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2025-08-18', 'completed', 'import', 'source=HISTO.csv; row=3; stagiaire_nom=LELIEUX; stagiaire_prenom=Emeline; fonction=Directeur des Opérations; statut_csv=Terminé'),
    ('a41fb663-41ff-5bbe-9d5d-96d17e8e0297', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2025-08-18', 'completed', 'import', 'source=HISTO.csv; row=4; stagiaire_nom=GUILBERT; stagiaire_prenom=Franck; fonction=Stagiaire; statut_csv=Terminé'),
    ('106a343f-f4de-59c8-af01-a7a556a46106', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2025-08-18', 'completed', 'import', 'source=HISTO.csv; row=5; stagiaire_nom=KOTTO; stagiaire_prenom=Marie-Line; fonction=Stagiaire; statut_csv=Terminé'),
    ('c1b2c01b-6445-5e82-bf18-3271ae48c9e0', '7fc5a96d-b939-5980-b3cc-4bfce1849f9d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-26', 'completed', 'import', 'source=HISTO.csv; row=6; stagiaire_nom=FRECHE; stagiaire_prenom=Stéphane FRECHE; fonction=; statut_csv=Terminé'),
    ('dcd3b52d-9ade-58ec-ac96-a74da8cad1ac', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=HISTO.csv; row=7; stagiaire_nom=KUZMA; stagiaire_prenom=Steve; fonction=; statut_csv=Terminé'),
    ('34e1ca56-01dd-5a74-bebf-62dc9f2dbbb7', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=HISTO.csv; row=8; stagiaire_nom=DEFRANCE; stagiaire_prenom=Estelle; fonction=; statut_csv=Terminé'),
    ('24d907d0-00e6-5848-8e3c-c69ff7fce4c2', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=HISTO.csv; row=9; stagiaire_nom=BEKAERT; stagiaire_prenom=Emilien; fonction=; statut_csv=Terminé'),
    ('2a48ae08-efb7-5eeb-8937-637875cc7a16', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=HISTO.csv; row=10; stagiaire_nom=MOGUET; stagiaire_prenom=Sandrine; fonction=; statut_csv=Terminé'),
    ('2391760a-47f4-5618-bf84-0d0813cfc14c', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=HISTO.csv; row=11; stagiaire_nom=MALONNE; stagiaire_prenom=Benjamin; fonction=; statut_csv=Terminé'),
    ('42f78e15-54d4-598a-b1b3-f6877f20b02d', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=HISTO.csv; row=12; stagiaire_nom=PAQUE; stagiaire_prenom=Gaelle; fonction=; statut_csv=Terminé'),
    ('b9dd8d9f-d302-5eeb-bcc9-80f8a4bcae62', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-01', 'completed', 'import', 'source=HISTO.csv; row=13; stagiaire_nom=BEAUVAIS-MUTZIG; stagiaire_prenom=Aurore; fonction=; statut_csv=Terminé'),
    ('9b4924cd-06df-58ec-9e14-f9c5c6acd0c9', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-01', 'completed', 'import', 'source=HISTO.csv; row=14; stagiaire_nom=GRAPY; stagiaire_prenom=Alison; fonction=; statut_csv=Terminé'),
    ('388f8f71-990f-5f74-be35-0513834183bf', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-01', 'completed', 'import', 'source=HISTO.csv; row=15; stagiaire_nom=ANDRIEUX; stagiaire_prenom=Berenice; fonction=; statut_csv=Terminé'),
    ('7f38a998-831b-5907-84c7-027dae9f63b3', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-01', 'completed', 'import', 'source=HISTO.csv; row=16; stagiaire_nom=VIALA; stagiaire_prenom=Elise; fonction=; statut_csv=Terminé'),
    ('65bb7c76-4490-5e20-8dad-5ccff3d04394', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-01', 'completed', 'import', 'source=HISTO.csv; row=17; stagiaire_nom=BEZIA; stagiaire_prenom=Kassandra; fonction=; statut_csv=Terminé'),
    ('103c3075-7f19-558d-b3a2-99b7c381091f', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-10', 'completed', 'import', 'source=HISTO.csv; row=18; stagiaire_nom=CHAIGNE; stagiaire_prenom=Clara; fonction=; statut_csv=Terminé'),
    ('0e8ab37b-d515-5e44-9d4a-aab37c51da08', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-10-17', 'completed', 'import', 'source=HISTO.csv; row=19; stagiaire_nom=PLATEEL; stagiaire_prenom=Romain; fonction=; statut_csv=Terminé'),
    ('e5d2c617-d57b-5212-b5da-80393b508438', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-10-17', 'completed', 'import', 'source=HISTO.csv; row=20; stagiaire_nom=FAUCONNIER; stagiaire_prenom=Sébastien; fonction=; statut_csv=Terminé'),
    ('06653cba-b19e-584b-9d67-c730e922c256', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-10-17', 'completed', 'import', 'source=HISTO.csv; row=21; stagiaire_nom=GESQUIERE; stagiaire_prenom=Céline; fonction=; statut_csv=Terminé'),
    ('2722b4c5-f1ae-5ac4-8fc7-778b1d20611b', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-10-17', 'completed', 'import', 'source=HISTO.csv; row=22; stagiaire_nom=DELTOMBE; stagiaire_prenom=Jean-François; fonction=; statut_csv=Terminé'),
    ('26b2590a-9a0d-51ba-9187-d8983c6768d2', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-10-17', 'completed', 'import', 'source=HISTO.csv; row=23; stagiaire_nom=LECLERCQ; stagiaire_prenom=Pauline; fonction=; statut_csv=Terminé'),
    ('c8bb6a01-2b8f-5570-ae4b-3589aa65cc93', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=24; stagiaire_nom=MONTALBANO; stagiaire_prenom=Sandrine; fonction=; statut_csv=Terminé'),
    ('9342f9c5-22d5-5a70-8533-1871259bb485', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=25; stagiaire_nom=WALLET; stagiaire_prenom=Mélanie; fonction=; statut_csv=Terminé'),
    ('f6b7e628-ff10-56a4-ac4b-0b23c94ce34e', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=26; stagiaire_nom=LECONTE; stagiaire_prenom=Manuel; fonction=; statut_csv=Terminé'),
    ('a4cf8e30-7b94-5c33-95bd-78b6305f703c', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=27; stagiaire_nom=FORESTIER; stagiaire_prenom=Stéphane; fonction=; statut_csv=Terminé'),
    ('81ac0968-f9cd-5daa-809a-dd79c422c97e', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=28; stagiaire_nom=CLARHAUT; stagiaire_prenom=David; fonction=; statut_csv=Terminé'),
    ('f49bcf8e-a879-521f-b21c-a2c0083d4d24', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=29; stagiaire_nom=SOULLIEZ; stagiaire_prenom=Guillaume; fonction=; statut_csv=Terminé'),
    ('09891aa9-e088-54ba-bbd5-0e4f997e90ef', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=30; stagiaire_nom=LELIEUX; stagiaire_prenom=Emeline; fonction=; statut_csv=Terminé'),
    ('1329f966-d279-5e34-be22-d8b60bfa2d8d', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=31; stagiaire_nom=RECH; stagiaire_prenom=Clémence; fonction=; statut_csv=Terminé'),
    ('2f83e363-fb3b-574a-ae8b-5e19f862bc38', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=32; stagiaire_nom=PAQUE; stagiaire_prenom=Gaelle; fonction=; statut_csv=Terminé'),
    ('3b9918e7-3d1c-571c-af86-4c96ed767cfe', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=33; stagiaire_nom=DEFRANCE; stagiaire_prenom=Estelle; fonction=; statut_csv=Terminé'),
    ('f406c8fe-8fa5-5473-bccc-08c4b7fd4a49', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=34; stagiaire_nom=MOGUET; stagiaire_prenom=Sandrine; fonction=; statut_csv=Terminé'),
    ('2d24ac90-0e85-592a-ad66-6e34fb9b22bc', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=35; stagiaire_nom=MALONNE; stagiaire_prenom=Benjamin; fonction=; statut_csv=Terminé'),
    ('22a44b33-33d2-5c23-a971-74b8df72fdbf', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=36; stagiaire_nom=MAES; stagiaire_prenom=Jeremy; fonction=; statut_csv=Terminé'),
    ('d5305e13-1001-5236-b8d0-a169ea596451', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=37; stagiaire_nom=DELROCQ; stagiaire_prenom=Amandine; fonction=; statut_csv=Terminé'),
    ('46f86612-cb63-5c0d-94d5-94ce3831f3cb', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-11-03', 'completed', 'import', 'source=HISTO.csv; row=38; stagiaire_nom=GUILBERT; stagiaire_prenom=Franck; fonction=; statut_csv=Terminé'),
    ('768dde4f-85b1-5f8f-ba89-e8d2fdbf578b', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=39; stagiaire_nom=MORTREUX; stagiaire_prenom=Thierry; fonction=; statut_csv=Terminé'),
    ('d925fcd4-524e-5fdb-bed3-edfa85bca187', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=40; stagiaire_nom=GRAMMENS; stagiaire_prenom=Christelle; fonction=; statut_csv=Terminé'),
    ('c418f2dc-c5d2-5fe2-b279-c61638ed2f00', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=41; stagiaire_nom=D''HOISNE; stagiaire_prenom=Anne; fonction=; statut_csv=Terminé'),
    ('cb669675-11ee-52fe-bd44-e45550dce7a3', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=42; stagiaire_nom=FLAMENT; stagiaire_prenom=Aurélien; fonction=; statut_csv=Terminé'),
    ('75ee1a48-f00b-5e9b-bac3-da401166631d', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=43; stagiaire_nom=LECOCQ; stagiaire_prenom=Yannick; fonction=; statut_csv=Terminé'),
    ('968a771e-81c9-5ffd-90b7-36342f90566b', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=44; stagiaire_nom=HER; stagiaire_prenom=Elodie; fonction=; statut_csv=Terminé'),
    ('7eca3f9f-33c9-5a62-914c-b9b957b6c45c', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=45; stagiaire_nom=MOUTON; stagiaire_prenom=Baptiste; fonction=; statut_csv=Terminé'),
    ('483325ae-9615-5009-81a9-68b1cfc9645d', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=46; stagiaire_nom=HERENG; stagiaire_prenom=Aline; fonction=; statut_csv=Terminé'),
    ('f7e2dd74-1f39-5391-b5a8-78c28d857b18', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=47; stagiaire_nom=STEENKISTE; stagiaire_prenom=Benjamin; fonction=; statut_csv=Terminé'),
    ('f7f15270-a031-5fc7-bb9a-8619137d1015', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=HISTO.csv; row=48; stagiaire_nom=PIWCZYK; stagiaire_prenom=Franck; fonction=; statut_csv=Terminé'),
    ('f048ecf3-b2db-581c-abf9-3f995d475219', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-12-01', 'completed', 'import', 'source=HISTO.csv; row=49; stagiaire_nom=CORBIERE; stagiaire_prenom=Melanie; fonction=; statut_csv=Terminé'),
    ('46f7c47d-c217-5992-ba45-9449d7da3927', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-12-01', 'completed', 'import', 'source=HISTO.csv; row=50; stagiaire_nom=ARNAUD; stagiaire_prenom=Stephanie; fonction=; statut_csv=Terminé'),
    ('3f223f27-f7f6-561b-939b-183d3147f0b3', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-12-01', 'completed', 'import', 'source=HISTO.csv; row=51; stagiaire_nom=PUGEAT; stagiaire_prenom=Maud; fonction=; statut_csv=Terminé'),
    ('a0f63da6-7784-5a05-817c-2a0bce5a6abc', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-12-01', 'completed', 'import', 'source=HISTO.csv; row=52; stagiaire_nom=BANY; stagiaire_prenom=Samuel; fonction=; statut_csv=Terminé'),
    ('06cde718-f646-5322-ac60-30a8b81e2155', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-12-08', 'completed', 'import', 'source=HISTO.csv; row=53; stagiaire_nom=FARGE; stagiaire_prenom=Alexis; fonction=; statut_csv=Terminé'),
    ('e69d128d-ac29-585c-80b1-83c4a612c5a2', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-12-08', 'completed', 'import', 'source=HISTO.csv; row=54; stagiaire_nom=VAROQUIER; stagiaire_prenom=Clément; fonction=; statut_csv=Terminé'),
    ('033d2009-f0d8-5595-85be-376c870244d6', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-12-08', 'completed', 'import', 'source=HISTO.csv; row=55; stagiaire_nom=PETIT; stagiaire_prenom=Sébastien; fonction=; statut_csv=Terminé'),
    ('e5332914-5127-56b3-9203-5b73f9492fbe', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-12-08', 'completed', 'import', 'source=HISTO.csv; row=56; stagiaire_nom=KIBONGE; stagiaire_prenom=Christian; fonction=; statut_csv=Terminé'),
    ('49c47bb7-dfb8-5dbe-a2aa-346ea81d6f46', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=57; stagiaire_nom=LETENDARD; stagiaire_prenom=Simon Junior; fonction=; statut_csv=Terminé'),
    ('ea760a4b-3a12-5fb4-8f4b-552f6401b350', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=58; stagiaire_nom=LEPINE; stagiaire_prenom=Ambre; fonction=; statut_csv=Terminé'),
    ('7f35a4eb-c098-5c4c-a91b-621a43909170', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=59; stagiaire_nom=BODINIER; stagiaire_prenom=Mathilde; fonction=; statut_csv=Terminé'),
    ('b3036013-f5b0-5cc5-b78c-e9f5c6f203ce', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=60; stagiaire_nom=RIBET; stagiaire_prenom=Cloe; fonction=; statut_csv=Terminé'),
    ('7958160c-8b72-562c-8e77-68b28938c46f', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=61; stagiaire_nom=BAUER; stagiaire_prenom=Frederic; fonction=; statut_csv=Terminé'),
    ('2e6f66b4-7d28-5492-ac5a-0017c564c165', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=62; stagiaire_nom=PLEURDEAU; stagiaire_prenom=Elodie; fonction=; statut_csv=Terminé'),
    ('d49247f2-c1da-595e-ac8b-c3429e712297', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2026-01-12', 'completed', 'import', 'source=HISTO.csv; row=63; stagiaire_nom=DE SAINT DENIS; stagiaire_prenom=Gaetan; fonction=; statut_csv=Terminé'),
    ('b5d90063-cde8-54dd-8f63-d102cc84d236', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=64; stagiaire_nom=BERTRAND; stagiaire_prenom=Antoine-Charles; fonction=; statut_csv=Terminé'),
    ('b87ad5fa-ffda-52a9-bed9-74a9d32c8d18', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=65; stagiaire_nom=CADET; stagiaire_prenom=Kelly; fonction=; statut_csv=Terminé'),
    ('661cc877-48b4-5214-8d4a-aed843102665', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=66; stagiaire_nom=MARTEL; stagiaire_prenom=Céline; fonction=; statut_csv=Terminé'),
    ('15aa61f6-de62-5446-979f-171459e11dd3', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=67; stagiaire_nom=BALLOIS; stagiaire_prenom=Nathalie; fonction=; statut_csv=Terminé'),
    ('f584edc5-52a5-5b2b-9d80-d8c93cf750b4', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=68; stagiaire_nom=DASSONNEVILLE; stagiaire_prenom=Paul; fonction=; statut_csv=Terminé'),
    ('3d7e0e5a-9c41-5bdd-88bf-0c0d14be309e', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=69; stagiaire_nom=RECH; stagiaire_prenom=Clémence; fonction=; statut_csv=Terminé'),
    ('6f19d7e5-4a63-5477-a70b-09efeac88056', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=70; stagiaire_nom=MARGOLLE; stagiaire_prenom=Laurie; fonction=; statut_csv=Terminé'),
    ('710562b1-2528-517a-8a03-ba8912855563', '68a5abe0-b4f9-5830-be0c-829b4b72e9db', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=HISTO.csv; row=71; stagiaire_nom=DELAISSE; stagiaire_prenom=François-Clémence DELAISSE; fonction=; statut_csv=Terminé'),
    ('a6bfea9b-a4ad-5701-bc3e-4c857237cd8a', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2026-02-13', 'completed', 'import', 'source=HISTO.csv; row=72; stagiaire_nom=RECH; stagiaire_prenom=Clémence; fonction=; statut_csv=Terminé'),
    ('67c0d601-7c41-524a-a6d8-398e50187212', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2026-02-13', 'completed', 'import', 'source=HISTO.csv; row=73; stagiaire_nom=MARGOLLE; stagiaire_prenom=Laurie; fonction=; statut_csv=Terminé'),
    ('edc7d16d-3a50-5c94-9895-e1a1ddbc97b7', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2026-02-13', 'completed', 'import', 'source=HISTO.csv; row=74; stagiaire_nom=CHELBI; stagiaire_prenom=Delia; fonction=; statut_csv=Terminé'),
    ('28210747-4b99-5b51-83f1-6f5d1c396e2e', 'b9456107-e6ed-5b95-ba47-89e0e87f2c1f', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2026-02-13', 'completed', 'import', 'source=HISTO.csv; row=75; stagiaire_nom=HANON; stagiaire_prenom=Philippe; fonction=; statut_csv=Terminé'),
    ('7015bb3e-b58d-577a-a7cd-9d63b8be2562', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2026-02-13', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=2; relance_nouvelle_formation=2026-02-13 00:00:00'),
    ('95706c2b-f4d9-5fe7-8a70-06b039d0d145', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-30', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=3; relance_nouvelle_formation=Pas de relance'),
    ('4d6a62cb-099d-5d34-b2c0-bc84b44d8de0', 'e57350cc-8add-5f11-bde5-bdf352abf06e', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-11-03', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=4; relance_nouvelle_formation=2025-11-03 00:00:00'),
    ('4ea45c0a-30c4-52b8-904e-d85b4c3c5a23', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2025-12-08', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=5; relance_nouvelle_formation=2025-12-08 00:00:00'),
    ('b110064e-9926-56dd-932e-232ae537a88e', 'e57350cc-8add-5f11-bde5-bdf352abf06e', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=6; relance_nouvelle_formation=Pas de relance'),
    ('cf5dc658-b8e5-565c-83d5-fbd45fd58767', 'e124b98f-90c1-53f8-b4e1-7fb7de967ee3', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-10-10', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=7; relance_nouvelle_formation=2025-10-10 00:00:00'),
    ('11d5855f-aded-548a-b4f2-9b5d03948bca', 'b9456107-e6ed-5b95-ba47-89e0e87f2c1f', 'ae331bf3-e980-5533-80a5-0e51dac33a41', '2026-02-13', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=8; relance_nouvelle_formation=2026-02-13 00:00:00'),
    ('ac1034f9-da5b-58d0-b41a-8e138db91c61', 'd2edddcb-1db0-5813-9aa7-f42d67d0247d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-03', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=9; relance_nouvelle_formation=Pas de relance'),
    ('116f82c9-7951-535e-8481-e476e6640657', '7fc5a96d-b939-5980-b3cc-4bfce1849f9d', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-09-26', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=10; relance_nouvelle_formation=Pas de relance'),
    ('a7acc431-2cba-51dd-81dc-45ca80167ed1', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', '885eec05-3ea8-51a7-96fa-5f39c7ce52cc', '2026-01-12', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=11; relance_nouvelle_formation=2026-01-12 00:00:00'),
    ('f29abca0-b605-52c9-86aa-ee9d0c6d41a2', 'da1d8f04-cd25-5e3d-b228-e36139b4455a', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2026-01-12', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=12; relance_nouvelle_formation=2026-01-12 00:00:00'),
    ('37e6044f-b29f-5364-ad9a-6c5b3e132630', '93bcc08d-9935-5ea5-a58d-9a0fb0584dab', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-11-10', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=13; relance_nouvelle_formation=Pas de relance'),
    ('9cbdbfdd-7f13-5a95-b224-f2416c0af8d3', '68a5abe0-b4f9-5830-be0c-829b4b72e9db', '69fd28c0-8418-5cec-88f5-154e09987ade', '2026-01-29', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=14; relance_nouvelle_formation=Pas de relance'),
    ('b69b62ac-e04a-5197-988e-05b9232ab93c', '2923546e-b80a-55d3-a97a-2e9a5807e2ff', 'ebe49fe9-e17d-5e1c-9bad-828459a588f9', '2025-10-17', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=15; relance_nouvelle_formation=Pas de relance'),
    ('62e56d47-fca9-5b26-8688-97962751c289', '3da63bd1-5fae-5436-a998-0b02c60b1463', 'a7c9eadc-53cf-5e70-8b57-5d107db65e80', '2025-12-01', 'completed', 'import', 'source=RADAR_DU_BESOIN.csv; row=16; relance_nouvelle_formation=2025-12-01 00:00:00')
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
