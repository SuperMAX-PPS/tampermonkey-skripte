// ==UserScript==
// @name         SuperMAX 2.8.9
// @author       Frank Luhn, Berliner Woche ©2025 (optimiert für PPS unter PEIQ)
// @namespace    https://pps.berliner-woche.de
// @version      2.8.9
// @description  Ersetzt Text in allen ProseMirror-Feldern, Artikelbeschreibung und Notizen bei STRG + S. Updates via GitHub.
// @updateURL    https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @downloadURL  https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @match        https://pps.berliner-woche.de/*
// @grant        none
// ==/UserScript==

console.log("SuperMAX läuft!");



(function () {
    'use strict';

    console.log("🚀 SuperMAX v2.8.9 gestartet");

    // --- BEGIN: replacements Array (aus deinem Originalskript kopieren!) ---
     const replacements = [

    // Opening
        [/(?<!Kar)(S|s)amstag/g, "$1onnabend"],
        [/\s+\b\t\s*(\(?\d+)/g, "¿$1"], // Telefonzeichen in PPS unter PEIQ
        [/\b(Telefon|Tel\.)\s*(\(?\d+)/g, "¿$2"],
        [/\b(\d{1,4})\s*[–-]\s*(\d{1,4})\b/g, "$1-$2"],

   // Autorenkürzel Debugging
        [/\s+\bcs\b/g, "\u202Fcs"], // Christian Sell
        [/\s+\bFL\b/g, "\u202FL"], // Frank Luhn
        [/\s+\bgo\b/g, "\u202Fgo"], // Simone Gogol-Grützner
        [/\s+\bmv\b/g, "\u202Fmv"], // Michael Vogt
        [/\s+\bmy\b/g, "\u202Fmy"], // Manuela Frey
        [/\s+\bst\b/g, "\u202Fst"], // Hendrik Stein
        [/\s+\bpam\b/g, "\u202Fpam"], // Pamela Rabe
        [/\s+\bPR\b/g, "\u202FPR"], // Pamela Rabe
        [/\s+\bpb\b/g, "\u202Fpb"], // Parvin Buchta
        [/\s+\bpet\b/g, "\u202Fpet"], // Peter Erdmann
        [/\s+\bsabka\b/g, "\u202Fsabka"], // Sabine Kalkus
        [/\s+\bsus\b/g, "\u202Fsus"], // Susanne Schilp
        [/\s+\btf\b/g, "\u202Ftf"], // Thomas Frey
        [/\s+\bRR\b/g, "\u202FRR"], // Ratgeber-Redaktion
        [/\s+\bakz/g, "\u202Fakz"], // Ratgeber-Redaktion
        [/\s+\bBZfE/g, "\u202FBZfE"], // Ratgeber-Redaktion
        [/\s+\bDEKRA Info\b/g, "\u202FDEKRA Info"], // Ratgeber-Redaktion
        [/\s+\bdjd\b/g, "\u202Fdjd"], // Ratgeber-Redaktion
        [/\s+\bIPM\b/g, "\u202FIPM"], // Ratgeber-Redaktion
        [/\s+\bIVH\b/g, "\u202FIVH"], // Ratgeber-Redaktion
        [/\s+\bProMotor/g, "\u202FProMotor"], // Ratgeber-Redaktion
        [/\s+\btxn\b/g, "\u202Ftxn"], // Ratgeber-Redaktion

    // Shortcuts für Insttitutionen, Organisationen und Vereine
        [/#ABDA/g, "Bundesvereinigung Deutscher Apothekenverbände (ABDA)"],
        [/#ADAC/g, "ADAC (Allgemeiner Deutscher Automobil-Club)"],
        [/#ADFC/g, "ADFC (Allgemeiner Deutscher Fahrrad-Club)"],
        [/#AGB/g, "Amerika-Gedenkbibliothek (AGB)"],
        [/#ASB/g, "Arbeiter-Samariter-Bund (ASB)"],
        [/#AvD/g, "AvD (Automobilclub von Deutschland)"],
        [/#AVUS/g, "AVUS (Automobil-Verkehrs- und Übungsstraße)"],
        [/#BA/g, "Bundesagentur für Arbeit (BA)"],
        [/#BBAW/g, "Berlin-Brandenburgische Akademie der Wissenschaften (BBAW)"],
        [/#BBB/g, "Berliner Bäder-Betriebe (BBB)"],
        [/#BDI/g, "Bundesverband der deutschen Industrie (BDI)"],
        [/#Behala/g, "Behala (Berliner Hafen- und Lagerhaus-Betriebe)"],
        [/#BER/g, "Flughafen Berlin-Brandenburg „Willy Brandt“ (BER)"],
        [/#BerlAVG/g, "Berliner Ausschreibungs- und Vergabegesetz (BerlAVG)"],
        [/#BEW/g, "Berliner Fernwärmeanbieter Berliner Energie und Wärme (BEW)"],
        [/#BFD/g, "Bundesfreiwilligendienst (BFD)"],
        [/#BfV/g, "Bundesamt für Verfassungsschutz (BfV)"],
        [/#BGB/g, "Bürgerliches Gesetzbuch (BGB)"],
        [/#BGBl\./g, "Bundesgesetzblatt (BGBl.)"],
        [/#BHT/g, "Berliner Hochschule für Technik (BHT)"],
        [/#BIS/g, "Berliner Institut für Sozialforschung (BIS)"],
        [/#BMI/g, "BMI (Body-Mass-Index)"],
        [/#BSW/g, "Bündnis Sahra Wagenknecht (BSW)"],
        [/#BSR/g, "Berliner Stadtreinigung (BSR)"],
        [/#BuBS/g, "Berliner unabhängige Beschwerdestelle (BuBS)"],
        [/#BVG/g, "Berliner Verkehrsbetriebe (BVG)"],
        [/#BVV/g, "Bezirksverordnetenversammlung (BVV)"],
        [/#BWB/g, "Berliner Wasserbetriebe (BWB)"],
        [/#CSD/g, "Christopher Street Day (CSD)"],
        [/#DAB/g, "Digital Audio Broadcasting (DAB)"],
        [/#DB/g, "Deutsche Bahn (DB)"],
        [/#DFB/g, "Deutsche Fußball-Bund (DFB)"],
        [/#DFFB/g, "Deutsche Film- und Fernsehakademie Berlin (DFFB)"],
        [/#DGB/g, "Deutscher Gewerkschaftsbund (DGB)"],
        [/#DHZB/g, "Deutsches Herzzentrum Berlin (DHZB)"],
        [/#DIHK/g, "Deutscher Industrie- und Handelskammertag (DIHK)"],
        [/#DLF/g, "Deutschlandfunk (DLF)"],
        [/#DLRG/g, "Deutsche Lebens-Rettungs-Gesellschaft (DLRG)"],
        [/#DOSB/g, "Deutscher Olympischer Sportbund (DOSB)"],
        [/#DRK/g, "Deutsches Rotes Kreuz (DRK)"],
        [/#DSB/g, "Deutscher Sportbund (DSB)"],
        [/#DVB/g, "Digital Video Broadcasting (DVB)"],
        [/#DWD/g, "Deutscher Wetterdienst (DWD)"],
        [/#EDEKA/g, "Edeka"],
        [/#EHB/g, "Evangelische Hochschulen Berlin (EHB)"],
        [/#EnEG/g, "Energieeinsparungsgesetz (EnEG)"],
        [/#EnEV/g, "Energieeinsparverordnung (EnEV)"],
        [/#EU/g, "Europäische Union (EU)"],
        [/#EVZ/g, "Europäisches Verbraucherzentrum Deutschland (EVZ)"],
        [/#EWG/g, "Europäischen Wirtschaftsgemeinschaft (EWG)"],
        [/#EZB/g, "EZB (Europäische Zentralbank)"],
        [/#FEZ/g, "FEZ Kinder- und Jugendfreizeitzentrum Wuhlheide"],
        [/#FFS/g, "FUNKE Foto Service"],
        [/#FÖJ/g, "FÖJ (Freiwilliges Ökologisches Jahr)"],
        [/#FSJ/g, "FSJ (Freiwilliges Soziales Jahr)"],
        [/#FU/g, "Freie Universität Berlin (FU Berlin)"],
        [/#GKV/g, "Gesetzliche Krankenversicherung (GKV)"],
        [/#HTW/g, "Hochschuhe für Technik und Wirtschaft Berlin (HTW)"],
        [/#HU/g, "Humboldt-Universität zu Berlin (HU Berlin)"],
        [/#HWK/g, "Handwerkskammer Berlin (HWK Berlin)"],
        [/#HWR/g, "Hochschule für Wirtschaft und Recht Berlin (HWR)"],
        [/#HZB/g, "Helmholtz-Zentrum Berlin (HZB)"],
        [/#IBAN/g, "IBAN (International Bank Account Number)"],
        [/#IFAF/g, "IFAF Berlin – Institut für angewandte Forschung Berlin "],
        [/#IHK/g, "Industrie- und Handelskammer zu Berlin (IHK Berlin)"],
        [/#IKEA/g, "Ikea"],
        [/#ILA/g, "Internationale Luft- und Raumfahrtausstellung Berlin (ILA)"],
        [/#IRT/g, "Institut für Rundfunktechnik (IRT)"],
        [/#ISTAF/g, "ISTAF (Internationales Stadionfest Berlin)"],
        [/#ITB/g, "ITB (Internationale Tourismus-Börse)"],
        [/#JDZB/g, "Japanisch-Deutsches Zentrum Berlin (JDZB)"],
        [/#KaDeWe/g, "KaDeWe (Kaufhaus des Westens)"],
        [/#KV/g, "Kassenärztliche Vereinigung (KV)"],
        [/#KMV/g, "Krankenhaus des Maßregelvollzugs Berlin (KMV)"],
        [/#LABO/g, "Landesamt für Bürger- und Ordnungsangelegenheiten (LABO)"],
        [/#LAF/g, "Landesamt für Flüchtlingsangelegenheiten (LAF)"],
        [/#Lageso/g, "Landesamt für Gesundheit und Soziales Berlin (Lageso)"],
        [/#LEA/g, "Landesamt für Einwanderung (LEA)"],
        [/#MABB/g, "Medienanstalt Berlin-Brandenburg (MABB)"],
        [/#MDK/g, "Medizinischer Dienst der Krankenversicherung (MDK)"],
        [/#NABU/g, "NABU (Naturschutzbund Deutschland)"],
        [/#ÖPNV/g, "Öffentlicher Personennahverkehr (ÖPNV)"],
        [/#QM/g, "Quartiersmanagement (QM)"],
        [/#RAW/g, "RAW (Reichsbahnausbesserungswerk)"],
        [/#RBB/g, "Rundfunk Berlin-Brandenburg (RBB)"],
        [/#RDE/g, "Luftschadstoff-Emissionen im realen Betrieb (RDE)"],
        [/#RV/g, "Rentenversicherung (RV)"],
        [/#SGB/g, "Sozialgesetzbuch (SGB)"],
        [/#SLZB/g, "Schul- und Leistungssportzentrum Berlin (SLZB)"],
        [/#SPK/g, "Stiftung Preußischer Kulturbesitz (SPK)"],
        [/#SPSG/g, "Stiftung Preußische Schlösser und Gärten Berlin-Brandenburg (SPSG)"],
        [/#Stasi/g, "Ministerium für Staatssicherheit der DDR (MfS)"],
        [/#StGB/g, "Strafgesetzbuch (StGB)"],
        [/#StVO/g, "Straßenverkehrs-Ordnung (StVO)"],
        [/#StVZO/g, "Straßenverkehrs-Zulassungs-Ordnung (StVZO)"],
        [/#SV/g, "Sozialversicherung (SV)"],
        [/#SWP/g, "Stiftung Wissenschaft und Politik (SWP)"],
        [/#THW/g, "Technisches Hilfswerk (THW)"],
        [/#TU/g, "Technische Universität Berlin (TU Berlin)"],
        [/#UdK/g, "Universität der Künste Berlin (UdK Berlin)"],
        [/#UKB/g, "Unfallkrankenhaus Berlin (ukb)"],
        [/#VBB/g, "Verkehrsverbund Berlin-Brandenburg (VBB)"],
        [/#VgV/g, "Vergabeverfahren nach der Vergabeverordnung (VgV)"],
        [/#VHS/g, "Volkshochschule (VHS)"],
        [/#VIZ/g, "Verkehrsinformationszentrale (VIZ)"],
        [/#VÖBB/g, "Verbund der Öffentlichen Bibliotheken Berlins (VÖBB)"],
        [/#ZEV/g, "Zentrum für Europäischen Verbraucherschutz (ZEV)"],
        [/#ZIB/g, "Konrad-Zuse-Zentrum für Informationstechnik Berlin (ZIB)"],
        [/#ZLB/g, "Zentral- und Landesbibliothek Berlin (ZLB)"],
        [/#ZOB/g, "ZOB (Zentraler Omnibusbahnhof)"],

    // Shortcuts für Textphrasen
        [/#FRE/g, "Der Eintritt ist kostenfrei. Eine Anmeldung ist nicht erforderlich."],
        [/#FRA/g, "Der Eintritt ist kostenfrei, um Anmeldung wird gebeten unter "],
        [/#TIP/g, "Der Eintritt ist kostenfrei, Spenden werden erbeten."],
        [/#WIA/g, "Weitere Informationen und Anmeldung unter "],
        [/#WIU/g, "Weitere Informationen unter "],

    // Richtig Gendern (setzt automatisch weibliche Form voran)
        [/\bAnwohner und Anwohnerinnen/g, "Anwohnerinnen und Anwohner"],
        [/\bArbeitnehmer und Arbeitnehmerinnen/g, "Arbeitnehmerinnen und Arbeitnehmer"],
        [/arbeitnehmer[\\*\\:\\|]innenfreundliche/gi, "arbeitnehmerfreundliche"],
        [/\bÄrzte und Ärztinnen/g, "Ärztinnen und Ärzte"],
        [/\bAussteller und Ausstellerinnen/g, "Ausstellerinnen und Aussteller"],
        [/\bAutofahrer und Autofahrerinnen/g, "Autofahrerinnen und Autofahrer"],
        [/\bAutoren und Autorinnen/g, "Autorinnen und Autoren"],
        [/\bBesucher und Besucherinnen/g, "Besucherinnen und Besucher"],
        [/\bBürger und Bürgerinnen/g, "Bürgerinnen und Bürger"],
        [/\bErzieher und Erzieherinnen/g, "Erzieherinnen und Erzieher"],
        [/\bExperten und Expertinnen/g, "Expertinnen und Experten"],
        [/\bGärtner und Gärtnerinnen/g, "Gärtnerinnen und Gärtner"],
        [/\bHändler und Händlerinnen/g, "Händlerinnen und Händler"],
        [/\bHandwerker und Handwerkerinnen/g, "Handwerkerinnen und Handwerker"],
        [/\bKollegen und Kolleginnen/g, "Kolleginnen und Kollegen"],
        [/\bKunden und Kundinnen/g, "Kundinnen und Kunden"],
        [/\bKünstler und Künstlerinnen/g, "Künstlerinnen und Künstler"],
        [/\bLehrer und Lehrerinnen/g, "Lehrerinnen und Lehrer"],
        [/\bLeser und Leserinnen/g, "Leserinnen und Leser"],
        [/\bMediziner und Medizinerinnen/g, "Medizinerinnen und Mediziner"],
        [/\bMieter und Mieterinnen/g, "Mieterinnen und Mieter"],
        [/\bMitarbeiter und Mitarbeiterinnen/g, "Mitarbeiterinnen und Mitarbeiter"],
        [/\bNutzer und Nutzerinnen/g, "Nutzerinnen und Nutzer"],
        [/\bPatienten und Patientinnen/g, "Patientinnen und Patienten"],
        [/\bPfleger und Pflegerinnen/g, "Pflegerinnen und Pfleger"],
        [/\bPolitiker und Politikerinnen/g, "Politikerinnen und Politiker"],
        [/\bRadfahrer und Radfahrerinnen/g, "Radfahrerinnen und Radfahrer"],
        [/\bSchüler und Schülerinnen/g, "Schülerinnen und Schüler"],
        [/\bSenioren und Seniorinnen/g, "Seniorinnen und Senioren"],
        [/\bSpender und Spenderinnen/g, "Spenderinnen und Spender"],
        [/\bStudenten und Studentinnen/g, "Studentinnen und Studenten"],
        [/\bUnternehmer und Unternehmerinnen/g, "Unternehmerinnen und Unternehmer"],
        [/\bUrlauber und Urlauberinnen/g, "Urlauberinnen und Urlauber"],
        [/\bVerbraucher und Verbraucherinnen/g, "Verbraucherinnen und Verbraucher"],
        [/\bWähler und Wählerinnen/g, "Wählerinnen und Wähler"],
        [/\bZuhörer und Zuhörerinnen/g, "Zuhörerinnen und Zuhörer"],

    // Genderfrei per Hashtag
        [/#Anwohner(?:innen und Anwohner|en und Anwohnerinnen| und Anwohnerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Anwohnende/gi, "Anwohner"],
        [/#Arbeitnehmer(?:innen und Arbeitnehmer| und Arbeitnehmerinnen|[\\*\\:\\|]innen|Innen)/gi, "Arbeitnehmer"],
        [/#Ärzt(?:e und Ärztinnen|innen und Ärzte|[\\*\\:\\|]innen|Innen)/gi, "Ärzte"],
        [/#Aussteller(?:innen und Aussteller|en und Ausstellerinnen| und Ausstellerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Aussteller"],
        [/#Autofahrer(?:innen und Autofahrer| und Autofahrerinnen|[\\*\\:\\|]innen|Innen)|#Autofahrende/gi, "Autofahrer"],
        [/#Autor(?:innen und Autor|en und Autorinnen| und Autorinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Autoren"],
        [/#Berliner(?:innen und Berliner|en und Berlinerinnen| und Berlinerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Berliner"],
        [/#Besucher(?:innen und Besucher|en und Besucherinnen| und Besucherinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Besuchende/gi, "Besucher"],
        [/#Bürger(?:innen und Bürger|en und Bürgerinnen| und Bürgerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Bürger"],
        [/#Erzieher(?:innen und Erzieher|en und Erzieherinnen| und Erzieherinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Erziehende/gi, "Erzieher"],
        [/#Expert(?:innen und Experten|en und Expertinnen| und Expertinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Experten"],
        [/#Gärtner(?:innen und Gärtner|en und Gärtnerinnen| und Gärtnerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Gärtner"],
        [/#Gäst(?:e und Gästinnen|innen und Gäste|[\\*\\:\\|]innen|Innen)?/gu, "Gäste"],
        [/#Händler(?:innen und Händler|en und Händlerinnen| und Händlerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Händler"],
        [/#Handwerker(?:innen und Handwerker|en und Handwerkerinnen| und Handwerkerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Handwerker"],
        [/#Kolleg(?:innen und Kollegen|en und Kolleginnen| und Kolleginnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Kollegen"],
        [/#Kund(?:innen und Kunden|en und Kundinnen| und Kundinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Kunden"],
        [/#Künstler(?:innen und Künstler|en und Künstlerinnen| und Künstlerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Künstler"],
        [/#Lehrer(?:innen und Lehrer|en und Lehrerinnen| und Lehrerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Lehrende/gi, "Lehrer"],
        [/#Leser(?:innen und Leser|en und Leserinnen| und Leserinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Lesende/gi, "Leser"],
        [/#Mediziner(?:innen und Mediziner|en und Medizinerinnen| und Medizinerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Mediziner"],
        [/#Mieter(?:innen und Mieter|en und Mieterinnen| und Mieterinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Mietende/gi, "Mieter"],
        [/#Mitarbeiter(?:innen und Mitarbeiter|en und Mitarbeiterinnen| und Mitarbeiterinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Mitarbeitende/gi, "Mitarbeiter"],
        [/#Patient(?:innen und Patienten|en und Patientinnen| und Patientinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Patienten"],
        [/#Pfleger(?:innen und Pfleger|en und Pflegerinnen| und Pflegerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Pflegende/gi, "Pfleger"],
        [/#Politiker(?:innen und Politiker|en und Politikerinnen| und Politikerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Politiker"],
        [/#Radfahrer(?:innen und Radfahrer|en und Radfahrerinnen| und Radfahrerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Radfahrende/gi, "Radfahrer"],
        [/#Schüler(?:innen und Schüler|en und Schülerinnen| und Schülerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Schüler"],
        [/#Senior(?:innen und Senioren|en und Seniorinnen| und Seniorinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Senioren"],
        [/#Spender(?:innen und Spender|en und Spenderinnen| und Spenderinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Spendende/gi, "Spender"],
        [/#Student(?:innen und Studenten|en und Studentinnen| und Studentinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Studierende/gi, "Studenten"],
        [/#Unternehmer(?:innen und Unternehmer|en und Unternehmerinnen| und Unternehmerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Unternehmer"],
        [/#Urlauber(?:innen und Urlauber|en und Urlauberinnen| und Urlauberinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Urlauber"],
        [/#Verbraucher(?:innen und Verbraucher|en und Verbraucherinnen| und Verbraucherinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Verbraucher"],
        [/#Wähler(?:innen und Wähler|en und Wählerinnen| und Wählerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Wählende/gi, "Wähler"],
        [/#Zuhörer(?:innen und Zuhörer|en und Zuhörerinnen| und Zuhörerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Zuhörende/gi, "Zuhörer"],

    // Technische Größen
        // Prozentangaben in Worte fassen
        [/(\d+)\s*%/g, "$1 Prozent"],

        // Kohlendioxid mit tief gestellter Ziffer
        [/\bCO2\b/g, "CO₂"],

        // Temperaturen
        [/(\d+)\s*°C/g, "$1 Grad Celsius"],

        // Winkel
        [/360°\-/g, "360-Grad-"],

        // Geschwindigkeiten
        [/\bTempo\s(\d{1,3})(\s*km\/h)/g, "Tempo $1"],
        [/\((\d+)\s*(kmh|km\/h|Stundenkilometer)\)/g, "($1 km/h)"],
        [/\b(\d+)\s*(kmh|km\/h|Stundenkilometer)\b/g, "$1 Kilometer pro Stunde"],
        [/\((\d+)\s*(m\/s)\)/g, "($1 m/s)"],
        [/\b(\d+)\s*(m\/s)\b/g, "$1 Meter je Sekunde"],

        // Flächenmaße
        [/\((\d+)\s*(qkm|km2|km²)\)/g, "($1 km²)"],
        [/\b(\d+)\s*(qkm|km2|km²)\b/g, "$1 Quadratkilometer"],
        [/\((\d+)\s*(qm|m2|m²)\)/g, "($1 m²)"],
        [/\b(\d+)\s*(qm|m2|m²)\b/g, "$1 Quadratmeter"],
        [/\((\d+)\s*(qcm|cm2|cm²)\)/g, "($1 cm²)"],
        [/\b(\d+)\s*(qcm|cm2|cm²)\b/g, "$1 Quadratzentimeter"],
        [/\((\d+)\s*(qmm|mm2|mm²)\)/g, "($1 mm²)"],
        [/\b(\d+)\s*(qmm|mm2|mm²)\b/g, "$1 Quadratmillimeter"],
        [/\b(\d+)\s*ha\b/g, "$1 Hektar"],

        // Volumenmaße
        [/\((\d+)\s*(km3|km³)\)/g, "($1 km³)"],
        [/\b(\d+)\s*(km3|km³)\b/g, "$1 Kubikkilometer"],
        [/\((\d+)\s*(m3|m³)\)/g, "($1 m³)"],
        [/\b(\d+)\s*(m3|m³)\b/g, "$1 Kubikmeter"],
        [/\((\d+)\s*(ccm|cm³)\)/g, "($1 cm³)"],
        [/\b(\d+)\s*(ccm|cm³)\b/g, "$1 Kubikzentimeter"],
        [/\((\d+)\s*(mm3|mm³)\)/g, "($1 mm³)"],
        [/\b(\d+)\s*(mm3|mm³)\b/g, "$1 Kubikmillimeter"],

         // Flüssigkeitsmaße
        [/\((\d+)\s*(l|Ltr\.)\)/g, "($1 l)"],
        [/\b(\d+)\s*(l|Ltr\.)\b/g, "$1 Liter"],
        [/\((\d+)\s*(cl)\)/g, "($1 cl)"],
        [/\b(\d+)\s*(cl)\b/g, "$1 Zentiliter"],
        [/\((\d+)\s*(ml)\)/g, "($1 ml)"],
        [/\b(\d+)\s*(ml)\b/g, "$1 Milliliter"],

        // Längenmaße (mit Lookaheads zur Absicherung)
        [/\((\d+)\s*(km)(?![\/²³a-zA-Z])\)/g, "($1 km)"],
        [/\b(\d+)\s*(km)(?![\/²³a-zA-Z])\b/g, "$1 Kilometer"],
        [/\b(\d+)\s*(m)(?![²³\/a-zA-Z])\b/g, "$1 Meter"],
        [/\b(\d+)\s*(cm)(?![²³a-zA-Z])\b/g, "$1 Zentimeter"],
        [/\b(\d+)\s*(mm)(?![²³a-zA-Z])\b/g, "$1 Millimeter"],
        [/\((\d+)\s*(µm)\)/g, "($1 µm)"],
        [/\b(\d+)\s*(µm)\b/g, "$1 Mikrometer"],
        [/\((\d+)\s*(nm)\)/g, "($1 nm)"],
        [/\b(\d+)\s*(nm)\b/g, "$1 Nanometer"],

        // Gewichte
        [/\((\d+)\s*(t|To\.)\)/g, "($1 Tonnen)"],
        [/\b(\d+)\s*(t|To\.)(?![a-zA-Z])\b/g, "$1 Tonnen"],
        [/\((\d+)\s*(kg)\)/g, "($1 kg)"],
        [/\b(\d+)\s*(kg)(?![a-zA-Z])\b/g, "$1 Kilogramm"],
        [/\((\d+)\s*(g)\)/g, "($1 g)"],
        [/\b(\d+)\s*(g)(?![a-zA-Z])\b/g, "$1 Gramm"],
        [/\((\d+)\s*(mg)\)/g, "($1 mg)"],
        [/\b(\d+)\s*(mg)(?![a-zA-Z])\b/g, "$1 Milligramm"],

        // Speicherkapazitäten
        [/(\d+)\s*(kB|KB|kByte)/g, "$1 Kilobyte"],
        [/(\d+)\s*(MB|MByte)/g, "$1 Megabyte"],
        [/(\d+)\s*(GB|GByte)/g, "$1 Gigabyte"],
        [/(\d+)\s*(TB|TByte)/g, "$1 Terabyte"],

        // Datenübertragungsraten
        [/(\d+)\s*(Kbit\/s)/g, "$1 Kilobit je Sekunde"],
        [/(\d+)\s*(Mbit\/s)/g, "$1 Megabit je Sekunde"],
        [/(\d+)\s*(Gbit\/s)/g, "$1 Gigabit je Sekunde"],
        [/(\d+)\s*(Tbit\/s)/g, "$1 Terabit je Sekunde"],
        [/(\d+)\s*(kb|Kbit)/g, "$1 Kilobit"],
        [/(\d+)\s*(Mb|Mbit)/g, "$1 Megabit"],
        [/(\d+)\s*(Gb|Gbit)/g, "$1 Gigabit"],
        [/(\d+)\s*(Tb|Tbit)/g, "$1 Terabit"],

        // Währungen
        [/(\d+)\s*(\$)/g, "$1 Dollar"],
        [/(\d+)\s*(€|EUR)/g, "$1 Euro"],

   // Abkürzungen
        [/\bu\.\s*a\.(?![a-zA-Z])/g, "unter anderem"],
        [/\bu\.\s*ä\.(?![a-zA-Z])/g, "und ähnliche"],
        [/\bu\.(?!\s*(a\.|ä\.|s\.|k\.|v\.|w\.|z\.|n\.|m\.|l\.|r\.|t\.|d\.|b\.|c\.|x\.|y\.|j\.|h\.|g\.|f\.|e\.|q\.|p\.))\b/g, "und"],
        [/\bo\.(?![a-zA-Z])\b/g, "oder"],
        [/\b(abzgl\.|abzügl\.)/g, "abzüglich"],
        [/\b[Bb][Aa][Ff][Öö][Gg]\b/g, "BAföG"],
        [/\b\s*bzw\./g, "beziehungsweise"],
        [/\b(Bf\.|Bhf\.)/g, "Bahnhof"],
        [/\b(ca\.|zirka)/g, "circa"],
        [/\b(eigtl\.|eigentl\.)/g, "eigentlich"],
        [/\bEv\./g, "Evangelische"],
        [/\bevtl\./g, "eventuell"],
        [/\b(inkl\.|incl\.|inclusive)/g, "inklusive"],
        [/\bKath\./g, "Katholische"],
        [/\bLKW(s?)\b/g, "Lkw$1"],
        [/\bPKW(s?)\b/g, "Pkw$1"],
        [/\b(rd\.|rnd\.)/g, "rund"],
        [/\bSCHUFA\b/g, "Schufa"],
        [/\b(tägl\.|tgl\.)/g, "täglich"],
        [/\bteilw\./g, "teilweise"],
        [/\bugs\./g, "umgangssprachlich"],
        [/\bUNESCO\b/g, "Unesco"],
        [/\b(usw\.|etc\.)/g, "und so weiter"],
        [/\bvgl\./g, "vergleiche"],
        [/\bz\.\s?b\./gi, "zum Beispiel"],
        [/\bzzgl\./g, "zuzüglich"],

    // Bildunterschriften
        [/\(v\.l\.n\.r\.\)/g, "(von links)"],
        [/\(v\.l\.\)/g, "(von links)"],
        [/\(v\.r\.\)/g, "(von rechts)"],
        [/\(m\.\)/g, "(mittig)"],
        [/\(l\.\)/g, "(links)"],
        [/\(r\.\)/g, "(rechts)"],
        [/\s*[,•/|]?\s*FFS\s*$/gi, " / FUNKE\u202FFoto\u202FServices"],
        [/\bFFS\b/gi, "FUNKE Foto Services"],
        [/\s*?[,•/|]?\s*?Funke\s*?Foto\s*?Services?/gi, "\u202F/\u202FFUNKE\u202FFoto\u202FServices"],
        [/\s*?[,•/|]?\s*?Adobe\s*?Stock/g, "\u202F/\u202FAdobeStock"],

   // Lokales
        [/(^|\s)(in\s)?Berlin-Charlottenburg/g, ""],
        [/(^|\s)(in\s)?Berlin-Friedrichshain/g, ""],
        [/(^|\s)(in\s)?Berlin-Hellersdorf/g, ""],
        [/(^|\s)(in\s)?Berlin-Hohenschönhausen/g, ""],
        [/(^|\s)(in\s)?Berlin-Köpenick/g, ""],
        [/(^|\s)(in\s)?Berlin-Kreuzberg/g, ""],
        [/(^|\s)(in\s)?Berlin-Lichtenberg/g, ""],
        [/(^|\s)(in\s)?Berlin-Marzahn/g, ""],
        [/(^|\s)(in\s)?Berlin-Mitte/g, ""],
        [/(^|\s)(in\s)?Berlin-Neukölln/g, ""],
        [/(^|\s)(in\s)?Berlin-Pankow/g, ""],
        [/(^|\s)(in\s)?Berlin-Prenzlauer Berg/g, ""],
        [/(^|\s)(in\s)?Berlin-Reinickendorf/g, ""],
        [/(^|\s)(in\s)?Berlin-Schöneberg/g, ""],
        [/(^|\s)(in\s)?Berlin-Spandau/g, ""],
        [/(^|\s)(in\s)?Berlin-Steglitz/g, ""],
        [/(^|\s)(in\s)?Berlin-Tempelhof/g, ""],
        [/(^|\s)(in\s)?Berlin-Treptow/g, ""],
        [/(^|\s)(in\s)?Berlin-Weißensee/g, ""],
        [/(^|\s)(in\s)?Berlin-Wilmersdorf/g, ""],
        [/(^|\s)(in\s)?Berlin-Zehlendorf/g, ""],

   // Unwörter und Ungetüme
        [/\bABC-Schütze(n?)\b/g, "Abc-Schütze$1"],
        [/\bAlkopops/g, "Alcopops"],
        [/\bAlptr(aum|äume)\\b/g, "Albtr$1"],
        [/\bAntiaging/g, "Anti-Aging"],
        [/\bBroccoli/g, "Brokkoli"],
        [/\bBezirksbürgermeister/g, "Bürgermeister"],
        [/\bBezirkstadtr/g, "Stadtr"],
        [/(B|b?)üfett/g, "$1uffet"],
        [/\bCoffein/g, "Koffein"],
        [/\bdie Tickethotline lautet/g, "Eintrittskarten gibt es unter"],
        [/\bDisko/g, "Disco"],
        [/ehemalige(n?) DDR/g, "DDR"],
        [/\bFahrkosten/g, "Fahrtkosten"],
        [/\bFahrtzeit/g, "Fahrzeit"],
        [/\bHandikap/g, "Handicap"],
        [/\bHappyend/g, "Happy End"],
        [/\bHighend/g, "High-End"],
        [/\bHighheels/g, "High Heels"],
        [/\bHiphop/g, "Hip-Hop"],
        [/\b(Hot-Dog|Hot Dog)/g, "Hotdog"],
        [/\bihre eigen(e|en?)/g, "ihre"],
        [/\bihr eigen(er|es?)/g, "ihr"],
        [/\bin keinster Weise/g, "in keiner Weise"],
        [/\bJoga/g, "Yoga"],
        [/\bJunk-Food/g, "Junkfood"],
        [/\b(Kabrio|Caprio)/g, "Cabrio"],
        [/\bKickoff/g, "Kick-off"],
        [/\bKräcker/g, "Cracker"],
        [/\b(Long Drink|Long-Drink)/g, "Longdrink"],
        [/\bLoveparade/g, "Love-Parade"],
        [/\bmacht keinen Sinn\b/g, "ergibt keinen Sinn"],
        [/\bMund-zu-Mund-Propaganda\b/g, "Mundpropaganda"],
        [/\bParagraph/g, "Paragraf"],
        [/\bPlayoff/g, "Play-off"],
        [/\bPoetryslam/g, "Poetry-Slam"],
        [/\b(Prime-Time|Prime Time)/g, "Primetime"],
        [/\bRiesterrente/g, "Riester-Rente"],
        [/\bRock'n'Roll/g, "Rock 'n' Roll"],
        [/\bRock-and-Roll/g, "Rock and Roll"],
        [/\b(Rukola|Rukolla|Rukkolla|Rukkola)/g, "Rucola"],
        [/\bscheinbar/g, "anscheinend"],
        [/\bso genannte/g, "sogenannte"],
        [/\b(so dass|so daß|sodaß)/g, "sodass"],
        [/\bsorg(en|t|te|ten?)\\b\\s+für\\s+Streit/g, "führ$1 zu Streit"],
        [/\bspiegelverkehrt/g, "seitenverkehrt"],
        [/\b(Standby|Stand-By)/g, "Stand-by"],
        [/\bvon Bernd Meyer\b/g, "von Bernd S. Meyer"],
        [/\b(Voranmeldung|vorherige Anmeldung|vorheriger Anmeldung)/g, "Anmeldung"],
        [/\bvorprogrammiert/g, "programmiert"],
        [/\bWissens nach\b/g, "Wissens"],

    // Online und Multimedia
        [/\b(Email|EMail|eMail|e-Mail|E–Mail)/g, "E-Mail"],
        [/\b(PDF-Datei|PDF-Dokument|PDF–Datei|PDF–Dokument)/g, "PDF"],
        [/\b(PIN-Code|PIN-Nummer)/g, "PIN"],
        [/\b(Spammail|Spam–Mail)/g, "Spam-Mail"],
        [/\b(https:\/\/www\.|http:\/\/www\.)/g, "www."],
        [/(\.com|\.de|\.info)\/(?=\s|\.|$)(?![¬#%+\/])/gi, "$1"],

    // Formatierung von Zahlen, Datums- und Zeitangaben
        // Korrekte Maßstabsangaben
        [/\bMaßstab(?:\s+von)?\s+(\d+)[\s.:]+(\d{2,3})\b/g, "Maßstab $1:$2"],

        // Tausendertrennzeichen optimieren
        [/\b(\d{2,3})((?:\s+|\.){1})(\d{3})\b/g, "$1\u202F$3"],
        [/\b(\d{1,3})((?:\s+|\.){1})(\d{3})((?:\s+|\.){1})(\d{3})\b/g, "$1\u202F$3\u202F$5"],
        [/\b(\d{1})(?:(?![\u202F])(?:\s+|\.))(\d{3})\b/g, "$1$2"],

        // Kalendermonate 2025
        [/(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(\s*)(2025|25)/g, "$1. $2"],
        [/\.\s*0?1\.(2025|25)\b/g, ". Januar"],
        [/\.\s*0?2\.(2025|25)\b/g, ". Februar"],
        [/\.\s*0?3\.(2025|25)\b/g, ". März"],
        [/\.\s*0?4\.(2025|25)\b/g, ". April"],
        [/\.\s*0?5\.(2025|25)\b/g, ". Mai"],
        [/\.\s*0?6\.(2025|25)\b/g, ". Juni"],
        [/\.\s*0?7\.(2025|25)\b/g, ". Juli"],
        [/\.\s*0?8\.(2025|25)\b/g, ". August"],
        [/\.\s*0?9\.(2025|25)\b/g, ". September"],
        [/\.\s*10\.(2025|25)\b/g, ". Oktober"],
        [/\.\s*11\.(2025|25)\b/g, ". November"],
        [/\.\s*12\.(2025|25)\b/g, ". Dezember"],
        [/\bletzte Woche\b/g, "vergangene Woche"],
        [/\bletzten Monat\b/g, "vergangenen Monat"],
        [/\bletztes Quartal\b/g, "vergangenes Quartal"],
        [/\bletzes Jahr\b/g, "vergangenes Jahr"],

        // Wochentage und Datumsangaben formatieren
        [/\b(Mo|Di|Mi|Do|Fr|Sa|So)\./g, "$1"], // Punkt bei abgekürztem Wochentag entfernen
        [/\bvon\s+(Mo|Di|Mi|Do|Fr|Sa|So)\b/g, "$1"],
        [/\s*(Mo|Di|Mi|Do|Fr|Sa|So)\s*zwischen\b/g, "$1"],
        [/\b(Mo|Di|Mi|Do|Fr|Sa|So)\s*(bis|und|–|-)\s*(Mo|Di|Mi|Do|Fr|Sa|So)\b/g, "$1-$3"],
        [/\b(Mo)\s*(bis|und|–|-)\s*(Di)\b/g, "$1/$3"],
        [/\b(Di)\s*(bis|und|–|-)\s*(Mi)\b/g, "$1/$3"],
        [/\b(Mi)\s*(bis|und|–|-)\s*(Do)\b/g, "$1/$3"],
        [/\b(Do)\s*(bis|und|–|-)\s*(Fr)\b/g, "$1/$3"],
        [/\b(Fr)\s*(bis|und|–|-)\s*(Sa)\b/g, "$1/$3"],
        [/\b(Sa)\s*(bis|und|–|-)\s*(So)\b/g, "$1/$3"],
        [/\b(So)\s*(bis|und|–|-)\s*(Mo)\b/g, "$1/$3"],
        [/\b(Mo(?:–Fr)?|Di|Mi|Do|Fr|Sa|So|Sa\/So)\s+von\s+(?=\d{1,2}[.:]\d{2})/g, "$1 "],
        [/\b(montags|dienstags|mittwochs|donnerstags|freitags|sonnabends|sonntags)\s*[-–]\s*(montags|dienstags|mittwochs|donnerstags|freitags|sonnabends|sonntags)\b/g, "$1 bis $2"],
        [/\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Sonnabend|Sonntag)\s*[-–]\s*(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Sonnabend|Sonntag)\b/g, "$1 bis $2"],
        [/\b(Sonnabend)\s*(bis)\s*(Sonntag)\b/g, "$1 und $3"],
        [/\b(sonnabends)\s*(bis)\s*(sonntags)\b/g, "$1 und $3"],
        [/Montag,\s*de[nmr]/gi, "Montag,"],
        [/Dienstag,\s*de[nmr]/gi, "Dienstag,"],
        [/Mittwoch,\s*de[nmr]/gi, "Mittwoch,"],
        [/Donnerstag,\s*de[nmr]/gi, "Donnerstag,"],
        [/Freitag,\s*de[nmr]/gi, "Freitag,"],
        [/Karsamstag,\s*de[nmr]/gi, "Karsamstag,"],
        [/Sonnabend,\s*de[nmr]/gi, "Sonnabend,"],
        [/Sonntag,\s*de[nmr]/gi, "Sonntag,"],

        // Uhrzeiten und Öffnungszeiten einheitlich formatieren
        [/\b(?<!Maßstab(?:\s+von)?\s+)(\d{1,2}):(\d{2})\b/g, "$1.$2"],
        [/\b0(\d)\.(\d{2})\b/g, "$1.$2"],
        [/\b(\d{1,2})\.00\b/g, "$1"],
        [/\b(Mo|Di|Mi|Do|Fr|Sa|So)\s+(\d{1,2}(?:[.:]\d{2})?)\s*(bis|und|–|-)\s*(\d{1,2}(?:[.:]\d{2})?)\b/g, "$1 $2-$4"],
        [/\bvon\s+(\d{1,2}(?:[.:]\d{2})?)\s*[-–]\s*(\d{1,2}(?:[.:]\d{2})?)\b/g, "von $1 bis $2"],
        [/\bzwischen\s+(\d{1,2}(?:[.:]\d{2})?)\s*(?:[-–]|bis)\s*(\d{1,2}(?:[.:]\d{2})?)\b/g, "zwischen $1 und $2"],

        // Finishing
        [/\b(auf|unter):/g, "$1"], // Doppelpunkt entfernen
        [/\s{2,}/g, " "], // Mehrere Leerzeichen reduzieren
        [/\.{3}/g, "…"], // Drei Punkte durch Auslassungszeichen ersetzen
        [/([!?.,:;])\1+/g, "$1"], // Zwei gleiche Satzzeichen auf eines reduzieren
        [/(\b[a-zA-ZäöüÄÖÜß]{2,})\s*–\s*([a-zA-ZäöüÄÖÜß]{2,}\b)/g, "$1\u202F–\u202F$2"], // Bindestrich mit optionalen Leerzeichen wird Gedankenstrich
        [/(\b[a-zA-ZäöüÄÖÜß]{2,})\s-\s([a-zA-ZäöüÄÖÜß]{2,}\b)/g, "$1\u202F–\u202F$2"], // Bindestrich mit Leerzeichen wird Gedankenstrich
        [/\s*?xo\s*?/g, "#+\u2022\u202F"], // Listenformatierung
        [/(\d)(\s+)(\d)/g, "$1\u202F$3"], // Geschützte Leerzeichen in Telefonnummern
        [/(\s*?)\u202F(\s*?)/g, "\u202F"], // Geschützte Leerzeichen filtern
        [/(?<=\b[A-Za-zÄÖÜäöüß]{3,})\s+\/\s+(?=[A-Za-zÄÖÜäöüß]{3,}\b)/g, "\u202F/\u202F"], // Slash zwischen zwei Wörtern formatieren
        [/(?<=\b[0-9])(\s*?)(\/)(\s*?)(?=\b[0-9])/g, "$3"], // Slash zwischen zwei Zahlen formatieren
        [/(?<=\w|\d)\s+(?=[;,:.?!])/g, ""], // Leerzeichen vor Satzzeichen entfernen
        [/(?<=[.?!])\s+(?=(?![\p{L}\p{N}#„“"]).*$)/gu, ""], // Leerzeichen nach Satzzeichen entfernen

    ];
    // --- END: replacements Array ---

    function applyReplacementsWithCursorTracking(text, cursorPos) {
        let beforeCursor = text.slice(0, cursorPos);
        let afterCursor = text.slice(cursorPos);

        let newBefore = beforeCursor;
        let newAfter = afterCursor;

        replacements.forEach(([pattern, replacement]) => {
            newBefore = newBefore.replace(pattern, (...args) => {
                return replacement.replace(/\$(\d+)/g, (_, n) => args[parseInt(n)]);
            });
            newAfter = newAfter.replace(pattern, (...args) => {
                return replacement.replace(/\$(\d+)/g, (_, n) => args[parseInt(n)]);
            });
        });

        const newText = newBefore + newAfter;
        const newCursorPos = newBefore.length;

        return { result: newText, newCursorPos };
    }

    // Ersetzt nur Textknoten, erhält alle Formatierungen!
    function replaceTextNodes(el) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            let original = node.nodeValue;
            let replaced = original;
            replacements.forEach(([pattern, replacement]) => {
                replaced = replaced.replace(pattern, (...args) => {
                    return replacement.replace(/\$(\d+)/g, (_, n) => args[parseInt(n)]);
                });
            });
            if (replaced !== original) {
                node.nodeValue = replaced;
            }
        }
    }

    // Für alle ProseMirror-Felder
    function replaceInProseMirror(el) {
        if (!el || !el.isContentEditable || !el.classList.contains('ProseMirror')) return;
        replaceTextNodes(el);
        console.log("✏️ Ersetzung (ProseMirror, TreeWalker): Formatierungen erhalten");
    }

    // Für Inputs/Textareas
    function replaceInInput(input) {
        if (!input || typeof input.value !== 'string') return;
        const original = input.value;
        const updated = applyReplacementsWithCursorTracking(original, original.length).result;
        if (updated !== original) {
            input.value = updated;
            console.log("✏️ Ersetzung (input/textarea):", updated);
        }
    }

    // Cursor ans Ende setzen (für ProseMirror)
    function setCursorToEnd(el) {
        if (!el || !el.isContentEditable) return;
        let range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false); // ans Ende
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function manualReplaceAll() {
        console.log("🧰 Manuelle Ersetzung ausgelöst (STRG+S, ALLE Felder)");

        // Aktives Feld merken (für Cursor)
        let active = document.activeElement;

        // Alle ProseMirror-Editoren (alle relevanten Felder)
        const proseMirrors = document.querySelectorAll('.ProseMirror[contenteditable="true"]');
        proseMirrors.forEach(el => {
            replaceInProseMirror(el);
        });

        // Artikelbeschreibung (Dateiname)
        const moduleTitle = document.querySelector('#moduleTitle');
        if (moduleTitle) replaceInInput(moduleTitle);

        // Notizen
        const positionInfo = document.querySelector('#positionInfo');
        if (positionInfo) replaceInInput(positionInfo);

        // Cursor im aktiven ProseMirror ans Ende setzen
        if (active && active.isContentEditable && active.classList.contains('ProseMirror')) {
            setCursorToEnd(active);
        }
    }

    // Automatische Listener für Inputs/Textareas (optional, falls noch benötigt)
    function attachListeners(root = document.body) {
        const inputs = root.querySelectorAll('input[type="text"], textarea');
        inputs.forEach(input => {
            if (input.id === 'moduleTitle' || input.id === 'positionInfo') return;
            if (input.dataset.replacerAttached) return;
            input.dataset.replacerAttached = "true";
            input.addEventListener('blur', () => {
                const original = input.value;
                const updated = applyReplacementsWithCursorTracking(original, original.length).result;
                if (updated !== original) {
                    input.value = updated;
                    console.log("✏️ Ersetzung (input/textarea):", updated);
                }
            });
        });
    }

    attachListeners();

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    attachListeners(node);
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            manualReplaceAll();
        }
    });

})();
