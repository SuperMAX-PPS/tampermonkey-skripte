// ==UserScript==
// @name        SuperMAX 4.3.1
// @namespace   https://pps.berliner-woche.de
// @version 4.3.1
// @author      Frank Luhn, Berliner Woche ©2025 (optimiert für PPS unter PEIQ)
// @description OneClick (STRG+S) mit RegEx (Basis/Hashtag) auf Head/Sub/Body/BU, SuperERASER (STRG+E), SuperLINK (STRG+ALT+L), SuperRED+NOTES (STRG+ALT+R), SuperPORT (STRG+ALT+P). Fixes: BU-Handling via Editor-API/Layout-Kacheln, Termin-Logik (Listen/Monat), TAG-Joiner konfigurierbar, Regex-Fixes (extractExistingPrefix, kwFromCurrent, Hashtag-Patterns). – 4.2.4: BU-Handling (aktives Feld zuerst, robustere Caption-Erkennung, Navigation angepasst). – 4.2.6: Bei Start in BU wird Body garantiert mitbearbeitet; Fokus bleibt Text.
// @updateURL   https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @downloadURL https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @match       https://pps.berliner-woche.de/*
// @connect     bwurl.de
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// ==/UserScript==

/****************************
 * KONFIG
 *****************************/
const SMX_STORE_KEYS = { SETTINGS:'smx_settings_v1', YOURLS_TOKEN:'yourlsToken', NOTES_PHRASES:'sn_phrases_v16', NOTES_TAG_TABLE:'sn_tag_table_v16', NOTES_PHRASES_EXCL:'sn_phrases_exclude_v1' };
const CFG_DEFAULTS = {
  FEATURES:{ runHashtagOnOneClick:true, saveAfterOneClick:false, confirmOverwrite:true },
  REGEX:{
    base:[
        // Basics
        { pattern: "(?<!Kar)(S|s)amstag", flags: "gu", replacement: "$(1)onnabend" },  // Samstag wird Sonnabend inklusive Feiertagsregelung
        { pattern: "Die drei \\?{3}", flags: "gu", replacement: "DREI_FRAGE" }, // Debugging
        { pattern: "Die drei !{3}", flags: "gu", replacement: "DREI_AUSRUFE" }, // Debugging
        { pattern: "\\b(\\d{1,4})\\s*[–-]\\s*(\\d{1,4})\\b", flags: "gu", replacement: "$(1)-$(2)" }, // Gedankenstrich zwischen zwei Zahlen wird Bindestrich
        { pattern: "(\\b[a-zA-ZäöüÄÖÜß]{2,})\\s*–\\s*([a-zA-ZäöüÄÖÜß]{2,}\\b)", flags: "gu", replacement: "$(1)\u202F–\u202F$(2)" }, // Gedankenstrich mit Leerzeichen wird Gedankenstrich mit geschütztem Leerzeichen
        { pattern: "(\\b[a-zA-ZäöüÄÖÜß]{2,})\\s-\\s([a-zA-ZäöüÄÖÜß]{2,}\\b)", flags: "gu", replacement: "$(1)\u202F–\u202F$(2)" },   // Bindestrich mit Leerzeichen wird Gedankenstrich mit geschütztem Leerzeichen
        { pattern: "(?<=\\b[a-zA-ZäöüÄÖÜß]{3,})\\s*/\\s*(?=[a-zA-ZäöüÄÖÜß]{3,}\\b)", flags: "gu", replacement: "\u202F/\u202F" },    // Slash zwischen zwei Wörtern mit geschützten Leerzeichen
        { pattern: "(\\(?\\d+)(\\s*)(/)(\\s*)(\\(?\\d+)", flags: "gu", replacement: "$(1)$(3)$(5)" }, // Slash zwischen zwei Zahlen ohne Leerzeichen

        // Richtig Gendern (setzt automatisch weibliche Form voran)
        { pattern: "\\bAnwohner und Anwohnerinnen", flags: "gu", replacement: "Anwohnerinnen und Anwohner" },
        { pattern: "\\bArbeitnehmer und Arbeitnehmerinnen", flags: "gu", replacement: "Arbeitnehmerinnen und Arbeitnehmer" },
        { pattern: "Ärzte und Ärztinnen", flags: "gu", replacement: "Ärztinnen und Ärzte" },
        { pattern: "\\bAussteller und Ausstellerinnen", flags: "gu", replacement: "Ausstellerinnen und Aussteller" },
        { pattern: "\\bAutofahrer und Autofahrerinnen", flags: "gu", replacement: "Autofahrerinnen und Autofahrer" },
        { pattern: "\\bAutoren und Autorinnen", flags: "gu", replacement: "Autorinnen und Autoren" },
        { pattern: "\\bBesucher und Besucherinnen", flags: "gu", replacement: "Besucherinnen und Besucher" },
        { pattern: "\\bBewerber und Bewerberinnen", flags: "gu", replacement: "Bewerberinnen und Bewerber" },
        { pattern: "\\bBürger und Bürgerinnen", flags: "gu", replacement: "Bürgerinnen und Bürger" },
        { pattern: "\\bErzieher und Erzieherinnen", flags: "gu", replacement: "Erzieherinnen und Erzieher" },
        { pattern: "\\bExperten und Expertinnen", flags: "gu", replacement: "Expertinnen und Experten" },
        { pattern: "\\bGärtner und Gärtnerinnen", flags: "gu", replacement: "Gärtnerinnen und Gärtner" },
        { pattern: "\\bHändler und Händlerinnen", flags: "gu", replacement: "Händlerinnen und Händler" },
        { pattern: "\\bHandwerker und Handwerkerinnen", flags: "gu", replacement: "Handwerkerinnen und Handwerker" },
        { pattern: "\\bKollegen und Kolleginnen", flags: "gu", replacement: "Kolleginnen und Kollegen" },
        { pattern: "\\bKunden und Kundinnen", flags: "gu", replacement: "Kundinnen und Kunden" },
        { pattern: "\\bKünstler und Künstlerinnen", flags: "gu", replacement: "Künstlerinnen und Künstler" },
        { pattern: "\\bLehrer und Lehrerinnen", flags: "gu", replacement: "Lehrerinnen und Lehrer" },
        { pattern: "\\bLeser und Leserinnen", flags: "gu", replacement: "Leserinnen und Leser" },
        { pattern: "\\bMediziner und Medizinerinnen", flags: "gu", replacement: "Medizinerinnen und Mediziner" },
        { pattern: "\\bMieter und Mieterinnen", flags: "gu", replacement: "Mieterinnen und Mieter" },
        { pattern: "\\bMitarbeiter und Mitarbeiterinnen", flags: "gu", replacement: "Mitarbeiterinnen und Mitarbeiter" },
        { pattern: "\\bNutzer und Nutzerinnen", flags: "gu", replacement: "Nutzerinnen und Nutzer" },
        { pattern: "\\bPatienten und Patientinnen", flags: "gu", replacement: "Patientinnen und Patienten" },
        { pattern: "\\bPfleger und Pflegerinnen", flags: "gu", replacement: "Pflegerinnen und Pfleger" },
        { pattern: "\\bPolitiker und Politikerinnen", flags: "gu", replacement: "Politikerinnen und Politiker" },
        { pattern: "\\bRadfahrer und Radfahrerinnen", flags: "gu", replacement: "Radfahrerinnen und Radfahrer" },
        { pattern: "\\bSchüler und Schülerinnen", flags: "gu", replacement: "Schülerinnen und Schüler" },
        { pattern: "\\bSenioren und Seniorinnen", flags: "gu", replacement: "Seniorinnen und Senioren" },
        { pattern: "\\bSpender und Spenderinnen", flags: "gu", replacement: "Spenderinnen und Spender" },
        { pattern: "\\bStudenten und Studentinnen", flags: "gu", replacement: "Studentinnen und Studenten" },
        { pattern: "\\bTeilnehmer und Teilnehmerinnen", flags: "gu", replacement: "Teilnehmerinnen und Teilnehmer" },
        { pattern: "\\bUnternehmer und Unternehmerinnen", flags: "gu", replacement: "Unternehmerinnen und Unternehmer" },
        { pattern: "\\bUrlauber und Urlauberinnen", flags: "gu", replacement: "Urlauberinnen und Urlauber" },
        { pattern: "\\bVerbraucher und Verbraucherinnen", flags: "gu", replacement: "Verbraucherinnen und Verbraucher" },
        { pattern: "\\bWähler und Wählerinnen", flags: "gu", replacement: "Wählerinnen und Wähler" },
        { pattern: "\\bZuhörer und Zuhörerinnen", flags: "gu", replacement: "Zuhörerinnen und Zuhörer" },

        // Formatierung von Zahlen, Datums- und Zeitangaben
        // Korrekte Maßstabsangaben
        { pattern: "Maßstab(?:\\s+von)?\\s+(\\d+)[\\s.:]+(\\d+)", flags: "gu", replacement: "Maßstab $(1):$(2)" },

        // Tausendertrennzeichen optimieren
        { pattern: "(?:^|\\b)(\\d{1,3})[\\.\\s\\u0020](\\d{3})[\\.\\s\\u0020]?(\\d{3})[\.\\s\\u0020]?(\\d{3})(?:\\b|$)", flags: "gu", replacement: "$(1)\u202F$(2)\u202F$(3)\u202F$(4)" }, // 13–10-stellig
        { pattern: "(?:^|\\b)(\\d{1,3})[\\.\\s\\u0020](\\d{3})[\\.\\s\\u0020]?(\\d{3})(?:\\b|$)", flags: "gu", replacement: "$(1)\u202F$(2)\u202F$(3)" }, // 9–7-stellig
        { pattern: "(?:^|\\b)(\\d{1,3})[\\.\\s\\u0020](\\d{3})(?:\\b|$)", flags: "gu", replacement: "$(1)\u202F$(2)" }, // 6–5-stellig
        { pattern: "(?:^|\\b)(\\d{1})[\\.\\s\\u202F](\\d{3})(?:\\b|$)", flags: "gu", replacement: "$(1)$(2)" }, // 4-stellig ohne Dezimal

        // Telefonzeichen in PPS unter PEIQ
        { pattern: "\\b(?:Telefon|Tel\\.|t)\\s*:?\\s+(?=[(+]?\\s*\\d)", flags: "giu", replacement: "¿" },

        // Kalendermonate mit Regeln zu 2025
        { pattern: "(\\d{1,2})\\.\\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(\\s*)(2025|25)", flags: "gu", replacement: "$(1). $(2)" },
        { pattern: "\\.\\s*0?1\\.(2025|25)\\b", flags: "gu", replacement: ". Januar" },
        { pattern: "\\.\\s*0?2\\.(2025|25)\\b", flags: "gu", replacement: ". Februar" },
        { pattern: "\\.\\s*0?3\\.(2025|25)\\b", flags: "gu", replacement: ". März" },
        { pattern: "\\.\\s*0?4\\.(2025|25)\\b", flags: "gu", replacement: ". April" },
        { pattern: "\\.\\s*0?5\\.(2025|25)\\b", flags: "gu", replacement: ". Mai" },
        { pattern: "\\.\\s*0?6\\.(2025|25)\\b", flags: "gu", replacement: ". Juni" },
        { pattern: "\\.\\s*0?7\\.(2025|25)\\b", flags: "gu", replacement: ". Juli" },
        { pattern: "\\.\\s*0?8\\.(2025|25)\\b", flags: "gu", replacement: ". August" },
        { pattern: "\\.\\s*0?9\\.(2025|25)\\b", flags: "gu", replacement: ". September" },
        { pattern: "\\.\\s*10\\.(2025|25)\\b", flags: "gu", replacement: ". Oktober" },
        { pattern: "\\.\\s*11\\.(2025|25)\\b", flags: "gu", replacement: ". November" },
        { pattern: "\\.\\s*12\\.(2025|25)\\b", flags: "gu", replacement: ". Dezember" },
        { pattern: "\\.\\s*0?1\\.(2026|26)\\b", flags: "gu", replacement: ". Januar" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?1\\.", flags: "gu", replacement: "$(1). Januar" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?2\\.", flags: "gu", replacement: "$(1). Februar" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?3\\.", flags: "gu", replacement: "$(1). März" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?4\\.", flags: "gu", replacement: "$(1). April" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?5\\.", flags: "gu", replacement: "$(1). Mai" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?6\\.", flags: "gu", replacement: "$(1). Juni" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?7\\.", flags: "gu", replacement: "$(1). Juli" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?8\\.", flags: "gu", replacement: "$(1). August" },
        { pattern: "\\b(\\d{1,2})\\.\\s*0?9\\.", flags: "gu", replacement: "$(1). September" },
        { pattern: "\\b(\\d{1,2})\\.\\s*10\\.", flags: "gu", replacement: "$(1). Oktober" },
        { pattern: "\\b(\\d{1,2})\\.\\s*11\\.", flags: "gu", replacement: "$(1). November" },
        { pattern: "\\b(\\d{1,2})\\.\\s*12\\.", flags: "gu", replacement: "$(1). Dezember" },
        { pattern: "\\b0([1-9])\\. (?=Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)", flags: "gu", replacement: "$(1). " },
        { pattern: "\\b(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\\s*[-–]\\s*(\\d{1,2})", flags: "gu", replacement: "$(1) bis $(2)" },

        // Wochentage und Datumsangaben formatieren
        { pattern: "\\b(Mo|Di|Mi|Do|Fr|Sa|So)\\.", flags: "gu", replacement: "$(1)" }, // Punkt bei abgekürztem Wochentag entfernen
        { pattern: "\\bvon\\s+(Mo|Di|Mi|Do|Fr|Sa|So)\\b", flags: "gu", replacement: "$(1)" },
        { pattern: "\\s*(Mo|Di|Mi|Do|Fr|Sa|So)\\s*zwischen\\b", flags: "gu", replacement: "$(1)" },
        { pattern: "\\b(Mo|Di|Mi|Do|Fr|Sa|So)\\s*(bis|und|–|-)\\s*(Mo|Di|Mi|Do|Fr|Sa|So)\\b", flags: "gu", replacement: "$(1)-$(3)" },
        { pattern: "\\b(Mo)\\s*(bis|und|–|-)\\s*(Di)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(Di)\\s*(bis|und|–|-)\\s*(Mi)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(Mi)\\s*(bis|und|–|-)\\s*(Do)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(Do)\\s*(bis|und|–|-)\\s*(Fr)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(Fr)\\s*(bis|und|–|-)\\s*(Sa)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(Sa)\\s*(bis|und|–|-)\\s*(So)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(So)\\s*(bis|und|–|-)\\s*(Mo)\\b", flags: "gu", replacement: "$(1)/$(3)" },
        { pattern: "\\b(Mo(?:–Fr)?|Di|Mi|Do|Fr|Sa|So|Sa/So)\\s+von\\s+(?=\\d{1,2}[.:]\\d{2})", flags: "gu", replacement: "$(1) " },
        { pattern: "\\b(montags|dienstags|mittwochs|donnerstags|freitags|sonnabends|sonntags)\\s*[-–]\\s*(montags|dienstags|mittwochs|donnerstags|freitags|sonnabends|sonntags)\\b", flags: "gu", replacement: "$(1) bis $(2)" },
        { pattern: "\\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Sonnabend|Sonntag)\\s*[-–]\\s*(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Sonnabend|Sonntag)\\b", flags: "gu", replacement: "$(1) bis $(2)" },
        { pattern: "\\b(Sonnabend)\\s*(bis)\\s*(Sonntag)\\b", flags: "gu", replacement: "$(1) und $(3)" },
        { pattern: "\\b(sonnabends)\\s*(bis)\\s*(sonntags)\\b", flags: "gu", replacement: "$(1) und $(3)" },
        { pattern: "Montag,\\s*de[nmr]", flags: "giu", replacement: "Montag," },
        { pattern: "Dienstag,\\s*de[nmr]", flags: "giu", replacement: "Dienstag," },
        { pattern: "Mittwoch,\\s*de[nmr]", flags: "giu", replacement: "Mittwoch," },
        { pattern: "Donnerstag,\\s*de[nmr]", flags: "giu", replacement: "Donnerstag," },
        { pattern: "Freitag,\\s*de[nmr]", flags: "giu", replacement: "Freitag," },
        { pattern: "Karsamstag,\\s*de[nmr]", flags: "giu", replacement: "Karsamstag," },
        { pattern: "Sonnabend,\\s*de[nmr]", flags: "giu", replacement: "Sonnabend," },
        { pattern: "Sonntag,\\s*de[nmr]", flags: "giu", replacement: "Sonntag," },
        { pattern: "Montag(\\(?\\d+)", flags: "gu", replacement: "Montag $(1)" }, // Leerzeichen nach Wochentag
        { pattern: "Dienstag(\\(?\\d+)", flags: "gu", replacement: "Dienstag $(1)" }, // Leerzeichen nach Wochentag
        { pattern: "Mittwoch(\\(?\\d+)", flags: "gu", replacement: "Mittwoch $(1)" }, // Leerzeichen nach Wochentag
        { pattern: "Donnerstag(\\(?\\d+)", flags: "gu", replacement: "Donnerstag $(1)" }, // Leerzeichen nach Wochentag
        { pattern: "Freitag(\\(?\\d+)", flags: "gu", replacement: "Freitag $(1)" }, // Leerzeichen nach Wochentag
        { pattern: "Sonnabend(\\(?\\d+)", flags: "gu", replacement: "Sonnabend $(1)" }, // Leerzeichen nach Wochentag
        { pattern: "Sonntag(\\(?\\d+)", flags: "gu", replacement: "Sonntag $(1)" }, // Leerzeichen nach Wochentag

        // Uhrzeiten und Öffnungszeiten einheitlich formatieren
        { pattern: "(?<!Maßstab(?:\\s+von)?\\s+)(\\d{1,2}):(\\d{2})", flags: "gu", replacement: "$(1).$(2)" }, // Funktioniert nur in PPS von PEIQ!
        { pattern: "\\b0(\\d)\\.(\\d{2})\\b", flags: "gu", replacement: "$(1).$(2)" },
        { pattern: "\\b(\\d{1,2})\\.00\\b", flags: "gu", replacement: "$(1)" },
        { pattern: "\\b(Mo|Di|Mi|Do|Fr|Sa|So)\\s+(\\d{1,2}(?:[.:]\\d{2})?)\\s*(bis|und|–|-)\\s*(\\d{1,2}(?:[.:]\\d{2})?)\\b", flags: "gu", replacement: "$(1) $(2)-$(4)" },
        { pattern: "\\bvon\\s+(\\d{1,2}(?:[.:]\\d{2})?)\\s*[-–]\\s*(\\d{1,2}(?:[.:]\\d{2})?)\\b", flags: "gu", replacement: "von $(1) bis $(2)" },
        { pattern: "\\bzwischen\\s+(\\d{1,2}(?:[.:]\\d{2})?)\\s*(?:[-–]|bis)\\s*(\\d{1,2}(?:[.:]\\d{2})?)\\b", flags: "gu", replacement: "zwischen $(1) und $(2)" },

        // Technische Größen
        // Prozentangaben in Worte fassen
        { pattern: "(\\d+)\\s*%", flags: "gu", replacement: "$(1) Prozent" },

        // Kohlendioxid mit tief gestellter Ziffer
        { pattern: "\\bCO2\\b", flags: "gu", replacement: "CO₂" },
        { pattern: "#CO₂", flags: "gu", replacement: "Kohlendioxid (CO₂)" }, // Ausgeschriebene Fassung per Hashtag

        // Temperaturen
        { pattern: "(\\d+)\\s*°C", flags: "gu", replacement: "$(1) Grad Celsius" },

        // Winkel
        { pattern: "360°\\-", flags: "g", replacement: "360-Grad-" },

        // Geschwindigkeiten
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(kmh|km/h|Stundenkilometer)\\b", flags: "gu", replacement: "$(1) Kilometer pro Stunde" },
        { pattern: "\\bTempo\\s(\\d{1,3})(\\s*km/h)", flags: "gu", replacement: "Tempo $(1)" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(m/s)\\b", flags: "gu", replacement: "$(1) Meter je Sekunde" },

        // Energie und Leistung
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(kWh)\\b", flags: "gu", replacement: "$(1) Kilowattstunden" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(MWh)\\b", flags: "gu", replacement: "$(1) Megawattstunden" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(GWh)\\b", flags: "gu", replacement: "$(1) Gigawattstunden" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(TWh)\\b", flags: "gu", replacement: "$(1) Terrawattstunden" },

        // Flächenmaße
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(qkm|km2|km²)", flags: "gu", replacement: "$(1) Quadratkilometer" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(qm|m2|m²)", flags: "gu", replacement: "$(1) Quadratmeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(qcm|cm2|cm²)", flags: "gu", replacement: "$(1) Quadratzentimeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(qmm|mm2|mm²)", flags: "gu", replacement: "$(1) Quadratmillimeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*ha\\b", flags: "gu", replacement: "$(1) Hektar" },

        // Volumenmaße
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(km3|km³)", flags: "gu", replacement: "$(1) Kubikkilometer" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(m3|m³)", flags: "gu", replacement: "$(1) Kubikmeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(ccm|cm³)", flags: "gu", replacement: "$(1) Kubikzentimeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(mm3|mm³)", flags: "gu", replacement: "$(1) Kubikmillimeter" },

        // Flüssigkeitsmaße
        { pattern: "\\b(\\d+(?:[.,]\\d+)?)\\s*(l)\\b", flags: "gu", replacement: "$(1) Liter" },
        { pattern: "\\b(\\d+(?:[.,]\\d+)?)\\s*(ltr\.)", flags: "giu", replacement: "$(1) Liter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(cl)\\b", flags: "gu", replacement: "$(1) Zentiliter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(ml)\\b", flags: "gu", replacement: "$(1) Milliliter" },

        // Längenmaße (mit Lookaheads zur Absicherung)
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(km)(?![/²³a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Kilometer" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(m)(?![²³/a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Meter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(cm)(?![²³a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Zentimeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(mm)(?![²³a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Millimeter" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(µm)\\b", flags: "gu", replacement: "$(1) Mikrometer" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(nm)\\b", flags: "gu", replacement: "$(1) Nanometer" },

        // Gewichte
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(t|To\\.)(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Tonnen" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(kg)(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Kilogramm" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(g)(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Gramm" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(mg)(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Milligramm" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(µg)(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Mikrogramm" },
        { pattern: "\\b(\\d+(?:,\\d+)?)\\s*(ng)(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "$(1) Nanogramm" },

        // Speicherkapazitäten
        { pattern: "(\\d+(?:,\\d+)?)\\s*(kB|KB|kByte)", flags: "gu", replacement: "$(1) Kilobyte" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(MB|MByte)", flags: "gu", replacement: "$(1) Megabyte" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(GB|GByte)", flags: "gu", replacement: "$(1) Gigabyte" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(TB|TByte)", flags: "gu", replacement: "$(1) Terabyte" },

        // Datenübertragungsraten
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Kbit/s)", flags: "gu", replacement: "$(1) Kilobit je Sekunde" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Mbit/s)", flags: "gu", replacement: "$(1) Megabit je Sekunde" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Gbit/s)", flags: "gu", replacement: "$(1) Gigabit je Sekunde" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Tbit/s)", flags: "gu", replacement: "$(1) Terabit je Sekunde" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(kb|Kbit)", flags: "gu", replacement: "$(1) Kilobit" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Mb|Mbit)", flags: "gu", replacement: "$(1) Megabit" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Gb|Gbit)", flags: "gu", replacement: "$(1) Gigabit" },
        { pattern: "(\\d+(?:,\\d+)?)\\s*(Tb|Tbit)", flags: "gu", replacement: "$(1) Terabit" },

        // Währungen
        { pattern: "(\\d+)\\s*(€|EUR)", flags: "gu", replacement: "$(1) Euro" },
        { pattern: "(\\d+)\\s*(ct|Ct)", flags: "gu", replacement: "$(1) Cent" },

        // Abkürzungen
        { pattern: "\\bd\\.\\s?h\\.", flags: "giu", replacement: "das heißt" },
        { pattern: "\\bu\\.\\s*a\\.(?![a-zA-ZäöüÄÖÜß])", flags: "gu", replacement: "unter anderem" },
        { pattern: "\\bu\\.\\s*ä\\.(?![a-zA-ZäöüÄÖÜß])", flags: "gu", replacement: "und ähnliche" },
        { pattern: "\\bu\\.(?!\\s*(a\\.|ä\\.|s\\.|k\\.|v\\.|w\\.|z\\.|n\\.|m\\.|l\\.|r\\.|t\\.|d\\.|b\\.|c\\.|x\\.|y\\.|j\\.|h\\.|g\\.|f\\.|e\\.|q\\.|p\\.))\\b", flags: "gu", replacement: "und" },
        { pattern: "\\bo\\.(?![a-zA-ZäöüÄÖÜß])\\b", flags: "gu", replacement: "oder" },
        { pattern: "\\b(abzgl\\.|abzügl\\.)", flags: "gu", replacement: "abzüglich" },
        { pattern: "\\b[Bb][Aa][Ff][Öö][Gg]\\b", flags: "gu", replacement: "BAföG" },
        { pattern: "\\bbzw\\.", flags: "gu", replacement: "beziehungsweise" },
        { pattern: "\\b(Bf\\.|Bhf\\.)", flags: "gu", replacement: "Bahnhof" },
        { pattern: "\\b(ca\\.|zirka)", flags: "gu", replacement: "circa" },
        { pattern: "\\b(eigtl\\.|eigentl\\.)", flags: "gu", replacement: "eigentlich" },
        { pattern: "\\bEv\\.", flags: "gu", replacement: "Evangelische" },
        { pattern: "\\bevtl\\.", flags: "gu", replacement: "eventuell" },
        { pattern: "\\bggf\\.", flags: "gu", replacement: "gegebenenfalls" },
        { pattern: "\\b(inkl\\.|incl\\.|inclusive)", flags: "gu", replacement: "inklusive" },
        { pattern: "\\bKath\\.", flags: "gu", replacement: "Katholische" },
        { pattern: "\\bLKW(s?)\\b", flags: "gu", replacement: "Lkw$(1)" },
        { pattern: "\\bPKW(s?)\\b", flags: "gu", replacement: "Pkw$(1)" },
        { pattern: "\\b(rd\\.|rnd\\.)", flags: "gu", replacement: "rund" },
        { pattern: "\\bSCHUFA\\b", flags: "gu", replacement: "Schufa" },
        { pattern: "([Ss])tr\\.", flags: "gu", replacement: "$(1)traße" },
        { pattern: "\\b(tägl\\.|tgl\\.)", flags: "gu", replacement: "täglich" },
        { pattern: "\\bteilw\\.", flags: "gu", replacement: "teilweise" },
        { pattern: "\\bugs\\.", flags: "gu", replacement: "umgangssprachlich" },
        { pattern: "\\bUNESCO\\b", flags: "gu", replacement: "Unesco" },
        { pattern: "\\b(usw\\.|etc\\.)", flags: "gu", replacement: "und so weiter" },
        { pattern: "\\bvgl\\.", flags: "gu", replacement: "vergleiche" },
        { pattern: "\\bz\\.\\s?b\\.", flags: "giu", replacement: "zum Beispiel" },
        { pattern: "\\bzzgl\\.", flags: "gu", replacement: "zuzüglich" },

        // Bildunterschriften
        { pattern: "\\(v\\.l\\.n\\.r\\.\\)", flags: "gu", replacement: "(von links)" },
        { pattern: "\\(v\\.l\\.\\)", flags: "gu", replacement: "(von links)" },
        { pattern: "\\(v\\.r\\.\\)", flags: "gu", replacement: "(von rechts)" },
        { pattern: "\\(m\\.\\)", flags: "gu", replacement: "(mittig)" },
        { pattern: "\\(l\\.\\)", flags: "gu", replacement: "(links)" },
        { pattern: "\\(r\\.\\)", flags: "gu", replacement: "(rechts)" },
        { pattern: "\\bFFS\\b", flags: "giu", replacement: "FUNKE Foto Services" },
        { pattern: "Foto:\\s*/\\s*", flags: "giu", replacement: "Foto: " }, // Fotonachweis von eingehenden Slash bereinigen

        // Lokales
        { pattern: "\\bBerlin-Adlershof", flags: "gu", replacement: "Adlershof" },
        { pattern: "\\bBerlin-Altglienicke", flags: "gu", replacement: "Altglienicke" },
        { pattern: "\\bBerlin-Alt-Hohenschönhausen", flags: "gu", replacement: "Alt-Hohenschönhausen" },
        { pattern: "\\bBerlin-Althohenschönhausen", flags: "gu", replacement: "Alt-Hohenschönhausen" },
        { pattern: "\\bBerlin-Alt-Treptow", flags: "gu", replacement: "Alt-Treptow" },
        { pattern: "\\bBerlin-Alttreptow", flags: "gu", replacement: "Alt-Treptow" },
        { pattern: "\\bBerlin-Baumschulenweg", flags: "gu", replacement: "Baumschulenweg" },
        { pattern: "\\bBerlin-Berlin", flags: "gu", replacement: "Berlin" },
        { pattern: "\\bBerlin-Biesdorf", flags: "gu", replacement: "Biesdorf" },
        { pattern: "\\bBerlin-Blankenburg", flags: "gu", replacement: "Blankenburg" },
        { pattern: "\\bBerlin-Blankenfelde", flags: "gu", replacement: "Blankenfelde" },
        { pattern: "\\bBerlin-Bohnsdorf", flags: "gu", replacement: "Bohnsdorf" },
        { pattern: "\\bBerlin-Borsigwalde", flags: "gu", replacement: "Borsigwalde" },
        { pattern: "\\bBerlin-Britz", flags: "gu", replacement: "Britz" },
        { pattern: "\\bBerlin-Buch", flags: "gu", replacement: "Buch" },
        { pattern: "\\bBerlin-Buckow", flags: "gu", replacement: "Buckow" },
        { pattern: "\\bBerlin-Charlottenburg", flags: "gu", replacement: "Charlottenburg" },
        { pattern: "\\bBerlin-Charlottenburg-Nord", flags: "gu", replacement: "Charlottenburg-Nord" },
        { pattern: "\\bBerlin-Charlottenburg-Wilmersdorf", flags: "gu", replacement: "Charlottenburg-Wilmersdorf" },
        { pattern: "\\bBerlin-Dahlem", flags: "gu", replacement: "Dahlem" },
        { pattern: "\\bBerlin-Falkenberg", flags: "gu", replacement: "Falkenberg" },
        { pattern: "\\bBerlin-Falkenhagener Feld", flags: "gu", replacement: "Falkenhagener Feld" },
        { pattern: "\\bBerlin-Fennpfuhl", flags: "gu", replacement: "Fennpfuhl" },
        { pattern: "\\bBerlin-Französisch Buchholz", flags: "gu", replacement: "Französisch Buchholz" },
        { pattern: "\\bBerlin-Friedenau", flags: "gu", replacement: "Friedenau" },
        { pattern: "\\bBerlin-Friedrichsfelde", flags: "gu", replacement: "Friedrichsfelde" },
        { pattern: "\\bBerlin-Friedrichshagen", flags: "gu", replacement: "Friedrichshagen" },
        { pattern: "\\bBerlin-Friedrichshain", flags: "gu", replacement: "Friedrichshain" },
        { pattern: "\\bBerlin-Friedrichshain-Kreuzberg", flags: "gu", replacement: "Friedrichshain-Kreuzberg" },
        { pattern: "\\bBerlin-Frohnau", flags: "gu", replacement: "Frohnau" },
        { pattern: "\\bBerlin-Gatow", flags: "gu", replacement: "Gatow" },
        { pattern: "\\bBerlin-Gesundbrunnen", flags: "gu", replacement: "Gesundbrunnen" },
        { pattern: "\\bBerlin-Gropiusstadt", flags: "gu", replacement: "Gropiusstadt" },
        { pattern: "\\bBerlin-Grünau", flags: "gu", replacement: "Grünau" },
        { pattern: "\\bBerlin-Grunewald", flags: "gu", replacement: "Grunewald" },
        { pattern: "\\bBerlin-Hakenfelde", flags: "gu", replacement: "Hakenfelde" },
        { pattern: "\\bBerlin-Halensee", flags: "gu", replacement: "Halensee" },
        { pattern: "\\bBerlin-Hansaviertel", flags: "gu", replacement: "Hansaviertel" },
        { pattern: "\\bBerlin-Haselhorst", flags: "gu", replacement: "Haselhorst" },
        { pattern: "\\bBerlin-Heiligensee", flags: "gu", replacement: "Heiligensee" },
        { pattern: "\\bBerlin-Heinersdorf", flags: "gu", replacement: "Heinersdorf" },
        { pattern: "\\bBerlin-Hellersdorf", flags: "gu", replacement: "Hellersdorf" },
        { pattern: "\\bBerlin-Hermsdorf", flags: "gu", replacement: "Hermsdorf" },
        { pattern: "\\bBerlin-Johannisthal", flags: "gu", replacement: "Johannisthal" },
        { pattern: "\\bBerlin-Karlshorst", flags: "gu", replacement: "Karlshorst" },
        { pattern: "\\bBerlin-Karow", flags: "gu", replacement: "Karow" },
        { pattern: "\\bBerlin-Kaulsdorf", flags: "gu", replacement: "Kaulsdorf" },
        { pattern: "\\bBerlin-Kladow", flags: "gu", replacement: "Kladow" },
        { pattern: "\\bBerlin-Konradshöhe", flags: "gu", replacement: "Konradshöhe" },
        { pattern: "\\bBerlin-Köpenick", flags: "gu", replacement: "Köpenick" },
        { pattern: "\\bBerlin-Kreuzberg", flags: "gu", replacement: "Kreuzberg" },
        { pattern: "\\bBerlin-Lankwitz", flags: "gu", replacement: "Lankwitz" },
        { pattern: "\\bBerlin-Lichtenberg", flags: "gu", replacement: "Lichtenberg" },
        { pattern: "\\bBerlin-Lichtenrade", flags: "gu", replacement: "Lichtenrade" },
        { pattern: "\\bBerlin-Lichterfelde", flags: "gu", replacement: "Lichterfelde" },
        { pattern: "\\bBerlin-Lübars", flags: "gu", replacement: "Lübars" },
        { pattern: "\\bBerlin-Mahlsdorf", flags: "gu", replacement: "Mahlsdorf" },
        { pattern: "\\bBerlin-Malchow", flags: "gu", replacement: "Malchow" },
        { pattern: "\\bBerlin-Mariendorf", flags: "gu", replacement: "Mariendorf" },
        { pattern: "\\bBerlin-Marienfelde", flags: "gu", replacement: "Marienfelde" },
        { pattern: "\\bBerlin-Märkisches Viertel", flags: "gu", replacement: "Märkisches Viertel" },
        { pattern: "\\bBerlin-Marzahn", flags: "gu", replacement: "Marzahn" },
        { pattern: "\\bBerlin-Marzahn-Hellersdorf", flags: "gu", replacement: "Marzahn-Hellersdorf" },
        { pattern: "\\bBerlin-Mitte", flags: "gu", replacement: "Mitte" },
        { pattern: "\\bBerlin-Moabit", flags: "gu", replacement: "Moabit" },
        { pattern: "\\bBerlin-Müggelheim", flags: "gu", replacement: "Müggelheim" },
        { pattern: "\\bBerlin-Neu-Hohenschönhausen", flags: "gu", replacement: "Neu-Hohenschönhausen" },
        { pattern: "\\bBerlin-Neuhohenschönhausen", flags: "gu", replacement: "Neu-Hohenschönhausen" },
        { pattern: "\\bBerlin-Neukölln", flags: "gu", replacement: "Neukölln" },
        { pattern: "\\bBerlin-Niederschöneweide", flags: "gu", replacement: "Niederschöneweide" },
        { pattern: "\\bBerlin-Niederschönhausen", flags: "gu", replacement: "Niederschönhausen" },
        { pattern: "\\bBerlin-Nikolassee", flags: "gu", replacement: "Nikolassee" },
        { pattern: "\\bBerlin-Oberschöneweide", flags: "gu", replacement: "Oberschöneweide" },
        { pattern: "\\bBerlin-Pankow", flags: "gu", replacement: "Pankow" },
        { pattern: "\\bBerlin-Plänterwald", flags: "gu", replacement: "Plänterwald" },
        { pattern: "\\bBerlin-Prenzlauer Berg", flags: "gu", replacement: "Prenzlauer Berg" },
        { pattern: "\\bBerlin-Rahnsdorf", flags: "gu", replacement: "Rahnsdorf" },
        { pattern: "\\bBerlin-Reinickendorf", flags: "gu", replacement: "Reinickendorf" },
        { pattern: "\\bBerlin-Rosenthal", flags: "gu", replacement: "Rosenthal" },
        { pattern: "\\bBerlin-Rudow", flags: "gu", replacement: "Rudow" },
        { pattern: "\\bBerlin-Rummelsburg", flags: "gu", replacement: "Rummelsburg" },
        { pattern: "\\bBerlin-Schlachtensee", flags: "gu", replacement: "Schlachtensee" },
        { pattern: "\\bBerlin-Schmargendorf", flags: "gu", replacement: "Schmargendorf" },
        { pattern: "\\bBerlin-Schmöckwitz", flags: "gu", replacement: "Schmöckwitz" },
        { pattern: "\\bBerlin-Schöneberg", flags: "gu", replacement: "Schöneberg" },
        { pattern: "\\bBerlin-Siemensstadt", flags: "gu", replacement: "Siemensstadt" },
        { pattern: "\\bBerlin-Spandau", flags: "gu", replacement: "Spandau" },
        { pattern: "\\bBerlin-Stadtrandsiedlung Malchow", flags: "gu", replacement: "Stadtrandsiedlung Malchow" },
        { pattern: "\\bBerlin-Steglitz", flags: "gu", replacement: "Steglitz" },
        { pattern: "\\bBerlin-Steglitz-Zehlendorf", flags: "gu", replacement: "Steglitz-Zehlendorf" },
        { pattern: "\\bBerlin-Tegel", flags: "gu", replacement: "Tegel" },
        { pattern: "\\bBerlin-Tempelhof", flags: "gu", replacement: "Tempelhof" },
        { pattern: "\\bBerlin-Tempelhof-Schöneberg", flags: "gu", replacement: "Tempelhof-Schöneberg" },
        { pattern: "\\bBerlin-Tiergarten", flags: "gu", replacement: "Tiergarten" },
        { pattern: "\\bBerlin-Treptow-Köpenick", flags: "gu", replacement: "Treptow-Köpenick" },
        { pattern: "\\bBerlin-Waidmannslust", flags: "gu", replacement: "Waidmannslust" },
        { pattern: "\\bBerlin-Wartenberg", flags: "gu", replacement: "Wartenberg" },
        { pattern: "\\bBerlin-Wedding", flags: "gu", replacement: "Wedding" },
        { pattern: "\\bBerlin-Weißensee", flags: "gu", replacement: "Weißensee" },
        { pattern: "\\bBerlin-Westend", flags: "gu", replacement: "Westend" },
        { pattern: "\\bBerlin-Wilhelmsruh", flags: "gu", replacement: "Wilhelmsruh" },
        { pattern: "\\bBerlin-Wilhelmstadt", flags: "gu", replacement: "Wilhelmstadt" },
        { pattern: "\\bBerlin-Wilmersdorf", flags: "gu", replacement: "Wilmersdorf" },
        { pattern: "\\bBerlin-Wittenau", flags: "gu", replacement: "Wittenau" },
        { pattern: "\\bBerlin-Zehlendorf", flags: "gu", replacement: "Zehlendorf" },

        // Unwörter und Ungetüme
        { pattern: "\\bABC-Schütze(n?)\\b", flags: "gu", replacement: "Abc-Schütze$(1)" }, // Nicht-Militärische-Schreibweise
        { pattern: "\\bAlkopops", flags: "gu", replacement: "Alcopops" },
        { pattern: "\\bAlptr(aum|äume)\\b", flags: "gu", replacement: "Albtr$(1)" },
        { pattern: "\\bAntiaging", flags: "gu", replacement: "Anti-Aging" },
        { pattern: "\\bBroccoli", flags: "gu", replacement: "Brokkoli" },
        { pattern: "\\bBezirksbürgermeister", flags: "gu", replacement: "Bürgermeister" },
        { pattern: "\\bBezirksparlament", flags: "gu", replacement: "Bezirksverordnetenversammlung (BVV)" },
        { pattern: "\\bBezirkstadtr", flags: "gu", replacement: "Stadtr" },
        { pattern: "\\bBVV-Vorsteh", flags: "gu", replacement: "BV-Vorsteh" },
        { pattern: "(B|b?)üfett", flags: "gu", replacement: "$(1)uffet" },
        { pattern: "\\bCoffein", flags: "gu", replacement: "Koffein" },
        { pattern: "\\bEintritt beträgt", flags: "gu", replacement: "Eintritt kostet" },
        { pattern: "\\bdie Tickethotline lautet", flags: "gu", replacement: "Eintrittskarten gibt es unter" },
        { pattern: "\\bDisko", flags: "gu", replacement: "Disco" },
        { pattern: "ehemalige(n?) DDR", flags: "gu", replacement: "DDR" },
        { pattern: "\\bElternvertretende", flags: "gu", replacement: "Elternvertreter" },
        { pattern: "\\bFahrkosten", flags: "gu", replacement: "Fahrtkosten" },
        { pattern: "\\bFahrtzeit", flags: "gu", replacement: "Fahrzeit" },
        { pattern: "\\bHandikap", flags: "gu", replacement: "Handicap" },
        { pattern: "\\bHappyend", flags: "gu", replacement: "Happy End" },
        { pattern: "\\bHighend", flags: "gu", replacement: "High-End" },
        { pattern: "\\bHighheels", flags: "gu", replacement: "High Heels" },
        { pattern: "\\bHiphop", flags: "gu", replacement: "Hip-Hop" },
        { pattern: "\\b(Hot-Dog|Hot Dog)", flags: "gu", replacement: "Hotdog" },
        { pattern: "\\bihre eigen(e|en?)", flags: "gu", replacement: "ihre" },
        { pattern: "\\bihr eigen(er|es?)", flags: "gu", replacement: "ihr" },
        { pattern: "\\bin keinster Weise", flags: "gu", replacement: "in keiner Weise" },
        { pattern: "\\bJoga", flags: "gu", replacement: "Yoga" },
        { pattern: "\\bJunk-Food", flags: "gu", replacement: "Junkfood" },
        { pattern: "\\b(Kabrio|Caprio)", flags: "gu", replacement: "Cabrio" },
        { pattern: "\\bKarsonnabend", flags: "gu", replacement: "Karsamstag" },
        { pattern: "\\bKickoff", flags: "gu", replacement: "Kick-off" },
        { pattern: "\\bKräcker", flags: "gu", replacement: "Cracker" },
        { pattern: "\\b(Long Drink|Long-Drink)", flags: "gu", replacement: "Longdrink" },
        { pattern: "\\bLoveparade", flags: "gu", replacement: "Love-Parade" },
        { pattern: "\\bmacht keinen Sinn\\b", flags: "gu", replacement: "ergibt keinen Sinn" },
        { pattern: "\\bmacht Sinn\\b", flags: "gu", replacement: "ergibt Sinn" },
        { pattern: "\\bMund-zu-Mund-Propaganda\\b", flags: "gu", replacement: "Mundpropaganda" },
        { pattern: "\\bOstersonnabend", flags: "gu", replacement: "Karsamstag" },
        { pattern: "\\bParagraph", flags: "gu", replacement: "Paragraf" },
        { pattern: "\\bPlayoff", flags: "gu", replacement: "Play-off" },
        { pattern: "\\bPoetryslam", flags: "gu", replacement: "Poetry-Slam" },
        { pattern: "\\b(Prime-Time|Prime Time)", flags: "gu", replacement: "Primetime" },
        { pattern: "\\bRiesterrente", flags: "gu", replacement: "Riester-Rente" },
        { pattern: "\\bRock'n'Roll", flags: "gu", replacement: "Rock\u202F'n'\u202FRoll" },
        { pattern: "\\bRock-and-Roll", flags: "gu", replacement: "Rock and Roll" },
        { pattern: "\\b(Rukola|Rukolla|Rukkolla|Rukkola)", flags: "gu", replacement: "Rucola" },
        { pattern: "\\bscheinbar", flags: "gu", replacement: "anscheinend" },
        { pattern: "\\bso genannt(e|en|er|es?)", flags: "gu", replacement: "sogenannt$(1)" },
        { pattern: "\\b(so dass|so daß|sodaß)", flags: "gu", replacement: "sodass" },
        { pattern: "\\bsorg(en|t|te|ten?)\\b\\s+für\\s+Streit", flags: "gu", replacement: "führ$(1) zu Streit" },
        { pattern: "\\bspiegelverkehrt", flags: "gu", replacement: "seitenverkehrt" },
        { pattern: "\\b(Standby|Stand-By)", flags: "gu", replacement: "Stand-by" },
        { pattern: "(S|s?)trasse", flags: "gu", replacement: "$(1)traße" },
        { pattern: "\\bvon Bernd Meyer\\b", flags: "gu", replacement: "von Bernd S. Meyer" },
        { pattern: "\\b(Voranmeldung|vorherige Anmeldung|vorheriger Anmeldung)", flags: "gu", replacement: "Anmeldung" },
        { pattern: "\\bvorprogrammiert", flags: "gu", replacement: "programmiert" },
        { pattern: "\\bWissens nach\\b", flags: "gu", replacement: "Wissens" },

        // Online und Multimedia
        { pattern: "\\b(PDF-Datei|PDF-Dokument|PDF–Datei|PDF–Dokument)", flags: "gu", replacement: "PDF" },
        { pattern: "\\b(PIN-Code|PIN-Nummer)", flags: "gu", replacement: "PIN" },
        { pattern: "\\b(Email|EMail|eMail|e-Mail|E–Mail)", flags: "gu", replacement: "E-Mail" },
        { pattern: "\\b(Spammail|Spam–Mail)", flags: "gu", replacement: "Spam-Mail" },
        { pattern: "\\b(auf|unter):(?=\\s*(¿|https?://|www\\.))", flags: "gu", replacement: "$(1)" }, // Doppelpunkt entfernen
        { pattern: "\\b(https:\\s*//\\s*|http:\\s*//\\s*)", flags: "gu", replacement: "" },
        { pattern: "(\\s*?/\\s*?)([0-9a-zA-ZäöüÄÖÜß\\-_.~+=&%$§|?#:]{1,})(\\s*?/\\s*?)([0-9a-zA-ZäöüÄÖÜß\\-_.~+=&%$§|?#:]{1,})", flags: "gu", replacement: "/$(2)/$(4)" }, // zwei Slashs in URL ohne Leerzeichen
        { pattern: "(\\s*?/\\s*?)([0-9a-zA-ZäöüÄÖÜß\\-_.~+=&%$§|?#:]{1,})(\\s*?/\\s*?)", flags: "gu", replacement: "/$(2)/" }, // zwei Slashs in URL ohne Leerzeichen
        { pattern: "(\\.)([a-zA-ZäöüÄÖÜß]{2,6})(\\s*?/\\s*?)([0-9a-zA-ZäöüÄÖÜß\\-_.~+=&%$§|?#:]{1,})", flags: "gu", replacement: ".$(2)/$(4)" }, // ein Slash nach Domainendung ohne Leerzeichen
        { pattern: "\\.(com|de|info|berlin|org|net)(/\\s|/\\.)", flags: "gu", replacement: ".$(1)." }, // Slash am Ende einer URL entfernen.

        // Finishing
        { pattern: "\\u0020{2,}", flags: "gu", replacement: " " }, // Mehrere Leerzeichen reduzieren
        { pattern: "\\.{3}", flags: "gu", replacement: "…" }, // Drei Punkte durch Auslassungszeichen ersetzen
        { pattern: "(\\b[…]{1})\\s*([a-zA-ZäöüÄÖÜß]{2,}\\b)", flags: "gu", replacement: "…\u202F$(2)" }, // Auslassungszeichen mit geschütztem Leerzeichen zum Satzbeginn
        { pattern: "(\\b[a-zA-ZäöüÄÖÜß]{2,})\\s*…", flags: "gu", replacement: "$(1)\u202F…" }, // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende
        { pattern: "\\u202F…\\s*\\.", flags: "gu", replacement: "\u202F…" }, // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende ohne Punkt
        { pattern: "\\u202F…\\s*!", flags: "gu", replacement: "\u202F…!" }, // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende mit Ausrufezeichen
        { pattern: "\\u202F…\\s*\\?", flags: "gu", replacement: "\u202F…?" }, // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende mit Fragezeichen
        { pattern: "\\s*?xo\\s*?", flags: "gu", replacement: "#+\u2022\u202F" }, // Listenformatierung (Übergangsweise > siehe Strukturierte Daten mit STRG+ALT+S)
        { pattern: "(\\u0020?)\\u202F(\\u0020?)", flags: "gu", replacement: "\u202F" }, // Geschützte Leerzeichen filtern
        { pattern: "(?<=\\w|\\d)\\u0020+(?=[;,:.?!])", flags: "gu", replacement: "" }, // Leerzeichen vor Satzzeichen entfernen
        { pattern: "([…!?.,:;])\\1+", flags: "gu", replacement: "$(1)" }, // Doppelte Satzzeichen entfernen
        { pattern: "DREI_FRAGE", flags: "gu", replacement: "Die drei ???" }, // Debugging
        { pattern: "DREI_AUSRUFE", flags: "gu", replacement: "Die drei !!!" }, // Debugging],
    ],
    // FIX: Hashtag-Patterns ohne unnötige Escapes (u-Flag kompatibel)
    hashtag:[
        { pattern: "#ABDA", flags: "gu", replacement: "Bundesvereinigung Deutscher Apothekenverbände (ABDA)" },
        { pattern: "#ADAC", flags: "gu", replacement: "ADAC (Allgemeiner Deutscher Automobil-Club)" },
        { pattern: "#ADFC", flags: "gu", replacement: "ADFC (Allgemeiner Deutscher Fahrrad-Club)" },
        { pattern: "#AGB", flags: "gu", replacement: "Amerika-Gedenkbibliothek (AGB)" },
        { pattern: "#ASB", flags: "gu", replacement: "Arbeiter-Samariter-Bund (ASB)" },
        { pattern: "#AvD", flags: "gu", replacement: "AvD (Automobilclub von Deutschland)" },
        { pattern: "#AVUS", flags: "gu", replacement: "AVUS (Automobil-Verkehrs- und Übungsstraße)" },
        { pattern: "#BA", flags: "gu", replacement: "Bundesagentur für Arbeit (BA)" },
        { pattern: "#BAB", flags: "gu", replacement: "Berliner Beauftragte zur Aufarbeitung der SED-Diktatur (BAB)" },
        { pattern: "#BBAW", flags: "gu", replacement: "Berlin-Brandenburgische Akademie der Wissenschaften (BBAW)" },
        { pattern: "#BBB", flags: "gu", replacement: "Berliner Bäder-Betriebe (BBB)" },
        { pattern: "#BDI", flags: "gu", replacement: "Bundesverband der deutschen Industrie (BDI)" },
        { pattern: "#Behala", flags: "gu", replacement: "Behala (Berliner Hafen- und Lagerhaus-Betriebe)" },
        { pattern: "#BER", flags: "gu", replacement: "Flughafen Berlin-Brandenburg „Willy Brandt“ (BER)" },
        { pattern: "#BerlAVG", flags: "gu", replacement: "Berliner Ausschreibungs- und Vergabegesetz (BerlAVG)" },
        { pattern: "#BEW", flags: "gu", replacement: "Berliner Fernwärmeanbieter Berliner Energie und Wärme (BEW)" },
        { pattern: "#BFD", flags: "gu", replacement: "Bundesfreiwilligendienst (BFD)" },
        { pattern: "#BfV", flags: "gu", replacement: "Bundesamt für Verfassungsschutz (BfV)" },
        { pattern: "#BGB", flags: "gu", replacement: "Bürgerliches Gesetzbuch (BGB)" },
        { pattern: "#BGBl\\.", flags: "gu", replacement: "Bundesgesetzblatt (BGBl.)" },
        { pattern: "#BHT", flags: "gu", replacement: "Berliner Hochschule für Technik (BHT)" },
        { pattern: "#BIS", flags: "gu", replacement: "Berliner Institut für Sozialforschung (BIS)" },
        { pattern: "#BMI", flags: "gu", replacement: "BMI (Body-Mass-Index)" },
        { pattern: "#BMV", flags: "gu", replacement: "Berliner Mieterverein (BMV)" },
        { pattern: "#BSW", flags: "gu", replacement: "Bündnis Sahra Wagenknecht (BSW)" },
        { pattern: "#BSR", flags: "gu", replacement: "Berliner Stadtreinigung (BSR)" },
        { pattern: "#BUND", flags: "gu", replacement: "Bund für Umwelt und Naturschutz Deutschland (BUND)" },
        { pattern: "#BuBS", flags: "gu", replacement: "Berliner unabhängige Beschwerdestelle (BuBS)" },
        { pattern: "#BVG", flags: "gu", replacement: "Berliner Verkehrsbetriebe (BVG)" },
        { pattern: "#BVV", flags: "gu", replacement: "Bezirksverordnetenversammlung (BVV)" },
        { pattern: "#BWB", flags: "gu", replacement: "Berliner Wasserbetriebe (BWB)" },
        { pattern: "#CO2", flags: "gu", replacement: "Kohlendioxid (CO₂)" },
        { pattern: "#CO₂", flags: "gu", replacement: "Kohlendioxid (CO₂)" },
        { pattern: "#CSD", flags: "gu", replacement: "Christopher Street Day (CSD)" },
        { pattern: "#DAB", flags: "gu", replacement: "Digital Audio Broadcasting (DAB)" },
        { pattern: "#DB", flags: "gu", replacement: "Deutsche Bahn (DB)" },
        { pattern: "#DFB", flags: "gu", replacement: "Deutsche Fußball-Bund (DFB)" },
        { pattern: "#DFFB", flags: "gu", replacement: "Deutsche Film- und Fernsehakademie Berlin (DFFB)" },
        { pattern: "#DGB", flags: "gu", replacement: "Deutscher Gewerkschaftsbund (DGB)" },
        { pattern: "#DHZB", flags: "gu", replacement: "Deutsches Herzzentrum Berlin (DHZB)" },
        { pattern: "#DIHK", flags: "gu", replacement: "Deutscher Industrie- und Handelskammertag (DIHK)" },
        { pattern: "#DLF", flags: "gu", replacement: "Deutschlandfunk (DLF)" },
        { pattern: "#DLRG", flags: "gu", replacement: "Deutsche Lebens-Rettungs-Gesellschaft (DLRG)" },
        { pattern: "#DNR", flags: "gu", replacement: "Deutsche Naturschutzring (DNR)" },
        { pattern: "#DOSB", flags: "gu", replacement: "Deutscher Olympischer Sportbund (DOSB)" },
        { pattern: "#DRK", flags: "gu", replacement: "Deutsches Rotes Kreuz (DRK)" },
        { pattern: "#DSB", flags: "gu", replacement: "Deutscher Sportbund (DSB)" },
        { pattern: "#DSD", flags: "gu", replacement: "Deutsche Stiftung Denkmalschutz (DSD)" },
        { pattern: "#DVB", flags: "gu", replacement: "Digital Video Broadcasting (DVB)" },
        { pattern: "#DWD", flags: "gu", replacement: "Deutscher Wetterdienst (DWD)" },
        { pattern: "#EDEKA", flags: "gu", replacement: "Edeka" },
        { pattern: "#EHB", flags: "gu", replacement: "Evangelische Hochschulen Berlin (EHB)" },
        { pattern: "#EnEG", flags: "gu", replacement: "Energieeinsparungsgesetz (EnEG)" },
        { pattern: "#EnEV", flags: "gu", replacement: "Energieeinsparverordnung (EnEV)" },
        { pattern: "#EU", flags: "gu", replacement: "Europäische Union (EU)" },
        { pattern: "#EVZ", flags: "gu", replacement: "Europäisches Verbraucherzentrum Deutschland (EVZ)" },
        { pattern: "#EWG", flags: "gu", replacement: "Europäischen Wirtschaftsgemeinschaft (EWG)" },
        { pattern: "#EZB", flags: "gu", replacement: "EZB (Europäische Zentralbank)" },
        { pattern: "#FEZ", flags: "gu", replacement: "Freizeit- und Erholungszentrum (FEZ-Berlin)" },
        { pattern: "#FFS", flags: "gu", replacement: "FUNKE Foto Service" },
        { pattern: "#FÖJ", flags: "gu", replacement: "FÖJ (Freiwilliges Ökologisches Jahr)" },
        { pattern: "#FSJ", flags: "gu", replacement: "FSJ (Freiwilliges Soziales Jahr)" },
        { pattern: "#FU", flags: "gu", replacement: "Freie Universität Berlin (FU Berlin)" },
        { pattern: "#GKV", flags: "gu", replacement: "Gesetzliche Krankenversicherung (GKV)" },
        { pattern: "#HTW", flags: "gu", replacement: "Hochschule für Technik und Wirtschaft Berlin (HTW)" },
        { pattern: "#HU", flags: "gu", replacement: "Humboldt-Universität zu Berlin (HU Berlin)" },
        { pattern: "#HWK", flags: "gu", replacement: "Handwerkskammer Berlin (HWK Berlin)" },
        { pattern: "#HWR", flags: "gu", replacement: "Hochschule für Wirtschaft und Recht Berlin (HWR)" },
        { pattern: "#HZB", flags: "gu", replacement: "Helmholtz-Zentrum Berlin (HZB)" },
        { pattern: "#IBAN", flags: "gu", replacement: "IBAN (International Bank Account Number)" },
        { pattern: "#IFAF", flags: "gu", replacement: "IFAF Berlin – Institut für angewandte Forschung Berlin" },
        { pattern: "#IFSS", flags: "gu", replacement: "Institut für Soziale Stadtentwicklung (IFSS)" },
        { pattern: "#IGeL", flags: "gu", replacement: "Individuelle Gesundheitsleistungen (IGeL)" },
        { pattern: "#IHK", flags: "gu", replacement: "Industrie- und Handelskammer zu Berlin (IHK Berlin)" },
        { pattern: "#IKEA", flags: "gu", replacement: "Ikea" },
        { pattern: "#ILA", flags: "gu", replacement: "Internationale Luft- und Raumfahrtausstellung Berlin (ILA)" },
        { pattern: "#IPF", flags: "gu", replacement: "Infozentrum für Prävention und Früherkennung (IPF)" },
        { pattern: "#IRT", flags: "gu", replacement: "Institut für Rundfunktechnik (IRT)" },
        { pattern: "#ISTAF", flags: "gu", replacement: "ISTAF (Internationales Stadionfest Berlin)" },
        { pattern: "#ITB", flags: "gu", replacement: "ITB (Internationale Tourismus-Börse)" },
        { pattern: "#JDZB", flags: "gu", replacement: "Japanisch-Deutsches Zentrum Berlin (JDZB)" },
        { pattern: "#KaDeWe", flags: "gu", replacement: "KaDeWe (Kaufhaus des Westens)" },
        { pattern: "#KI", flags: "gu", replacement: "Künstliche Intelligenz (KI)" },
        { pattern: "#KV", flags: "gu", replacement: "Kassenärztliche Vereinigung (KV)" },
        { pattern: "#KMV", flags: "gu", replacement: "Krankenhaus des Maßregelvollzugs Berlin (KMV)" },
        { pattern: "#LABO", flags: "gu", replacement: "Landesamt für Bürger- und Ordnungsangelegenheiten (LABO)" },
        { pattern: "#LAF", flags: "gu", replacement: "Landesamt für Flüchtlingsangelegenheiten (LAF)" },
        { pattern: "#Lageso", flags: "gu", replacement: "Landesamt für Gesundheit und Soziales Berlin (Lageso)" },
        { pattern: "#LEA", flags: "gu", replacement: "Landesamt für Einwanderung (LEA)" },
        { pattern: "#MABB", flags: "gu", replacement: "Medienanstalt Berlin-Brandenburg (MABB)" },
        { pattern: "#MDK", flags: "gu", replacement: "Medizinischer Dienst der Krankenversicherung (MDK)" },
        { pattern: "#MEK", flags: "gu", replacement: "Museum Europäischer Kulturen (MEK)" },
        { pattern: "#MRT", flags: "gu", replacement: "Magnetresonanztomografie (MRT)" },
        { pattern: "#NABU", flags: "gu", replacement: "NABU (Naturschutzbund Deutschland)" },
        { pattern: "#NBB", flags: "gu", replacement: "Netzgesellschaft Berlin-Brandenburg (NBB)" },
        { pattern: "#ÖPNV", flags: "gu", replacement: "Öffentlicher Personennahverkehr (ÖPNV)" },
        { pattern: "#QM", flags: "gu", replacement: "Quartiersmanagement (QM)" },
        { pattern: "#RAW", flags: "gu", replacement: "RAW (Reichsbahnausbesserungswerk)" },
        { pattern: "#RBB", flags: "gu", replacement: "Rundfunk Berlin-Brandenburg (RBB)" },
        { pattern: "#RDE", flags: "gu", replacement: "Luftschadstoff-Emissionen im realen Betrieb (RDE)" },
        { pattern: "#RV", flags: "gu", replacement: "Rentenversicherung (RV)" },
        { pattern: "#SGB", flags: "gu", replacement: "Sozialgesetzbuch (SGB)" },
        { pattern: "#SLZB", flags: "gu", replacement: "Schul- und Leistungssportzentrum Berlin (SLZB)" },
        { pattern: "#SPK", flags: "gu", replacement: "Stiftung Preußischer Kulturbesitz (SPK)" },
        { pattern: "#SPSG", flags: "gu", replacement: "Stiftung Preußische Schlösser und Gärten Berlin-Brandenburg (SPSG)" },
        { pattern: "#Stasi", flags: "gu", replacement: "Ministerium für Staatssicherheit der DDR (MfS)" },
        { pattern: "#StGB", flags: "gu", replacement: "Strafgesetzbuch (StGB)" },
        { pattern: "#StVO", flags: "gu", replacement: "Straßenverkehrs-Ordnung (StVO)" },
        { pattern: "#StVZO", flags: "gu", replacement: "Straßenverkehrs-Zulassungs-Ordnung (StVZO)" },
        { pattern: "#SWP", flags: "gu", replacement: "Stiftung Wissenschaft und Politik (SWP)" },
        { pattern: "#THW", flags: "gu", replacement: "Technisches Hilfswerk (THW)" },
        { pattern: "#TU", flags: "gu", replacement: "Technische Universität Berlin (TU Berlin)" },
        { pattern: "#UdK", flags: "gu", replacement: "Universität der Künste Berlin (UdK Berlin)" },
        { pattern: "#UKB", flags: "gu", replacement: "Unfallkrankenhaus Berlin (ukb)" },
        { pattern: "#VBB", flags: "gu", replacement: "Verkehrsverbund Berlin-Brandenburg (VBB)" },
        { pattern: "#VgV", flags: "gu", replacement: "Vergabeverfahren nach der Vergabeverordnung (VgV)" },
        { pattern: "#VHS", flags: "gu", replacement: "Volkshochschule (VHS)" },
        { pattern: "#VIZ", flags: "gu", replacement: "Verkehrsinformationszentrale (VIZ)" },
        { pattern: "#VÖBB", flags: "gu", replacement: "Verbund der Öffentlichen Bibliotheken Berlins (VÖBB)" },
        { pattern: "#ZEV", flags: "gu", replacement: "Zentrum für Europäischen Verbraucherschutz (ZEV)" },
        { pattern: "#ZIB", flags: "gu", replacement: "Konrad-Zuse-Zentrum für Informationstechnik Berlin (ZIB)" },
        { pattern: "#ZLB", flags: "gu", replacement: "Zentral- und Landesbibliothek Berlin (ZLB)" },
        { pattern: "#ZOB", flags: "gu", replacement: "ZOB (Zentraler Omnibusbahnhof)" },

        // Shortcuts für Textphrasen
        { pattern: "#FRE", flags: "gu", replacement: "Der Eintritt ist kostenfrei. Eine Anmeldung ist nicht erforderlich." },
        { pattern: "#FRA", flags: "gu", replacement: "Der Eintritt ist kostenfrei, um Anmeldung wird gebeten unter " },
        { pattern: "#TIP", flags: "gu", replacement: "Der Eintritt ist kostenfrei, Spenden werden erbeten." },
        { pattern: "#WIA", flags: "gu", replacement: "Weitere Informationen und Anmeldung unter " },
        { pattern: "#WIU", flags: "gu", replacement: "Weitere Informationen unter " },

        // Spitzenkandidaten
        { pattern: "##(?:Steffen Krach|Krach)\\b", flags: "gu", replacement: "Steffen Krach (SPD), im Gespräch als Spitzenkandidat für die Berliner Abgeordnetenhauswahl 2026#+" },
        { pattern: "#(?:Steffen Krach|Krach)\\b", flags: "gu", replacement: "Steffen Krach (SPD)" },
        { pattern: "##(?:Werner Graf|Graf)\\b", flags: "gu", replacement: "Werner Graf (Bündnis 90/Die Grüne), im Gespräch als Spitzenkandidat für die Berliner Abgeordnetenhauswahl 2026#+" },
        { pattern: "#(?:Werner Graf|Graf)\\b", flags: "gu", replacement: "Werner Graf (Bündnis 90/Die Grüne)" },

        // Senatsmitglieder – www.berlin.de/rbmskzl/politik/senat/senatsmitglieder/
        { pattern: "##(?:Cansel Kiziltepe|Kiziltepe)\\b", flags: "gu", replacement: "Cansel Kiziltepe (SPD), Senatorin für Arbeit, Soziales, Gleichstellung, Integration, Vielfalt und Antidiskriminierung#+" },
        { pattern: "#(?:Cansel Kiziltepe|Kiziltepe)\\b", flags: "gu", replacement: "Cansel Kiziltepe (SPD)" },
        { pattern: "##(?:Christian Gaebler|Gaebler)\\b", flags: "gu", replacement: "Christian Gaebler (SPD), Senator für Stadtentwicklung, Bauen und Wohnen#+" },
        { pattern: "#(?:Christian Gaebler|Gaebler)\\b", flags: "gu", replacement: "Christian Gaebler (SPD)" },
        { pattern: "##(?:Felor Badenberg|Badenberg)\\b", flags: "gu", replacement: "Felor Badenberg (CDU), Senatorin für Justiz und Verbraucherschutz#+" },
        { pattern: "#(?:Felor Badenberg|Badenberg)\\b", flags: "gu", replacement: "Felor Badenberg (CDU)" },
        { pattern: "##(?:Ina Czyborra|Czyborra)\\b", flags: "gu", replacement: "Ina Czyborra (SPD), Senatorin für Wissenschaft, Gesundheit und Pflege#+" },
        { pattern: "#(?:Ina Czyborra|Czyborra)\\b", flags: "gu", replacement: "Ina Czyborra (SPD)" },
        { pattern: "##(?:Franziska Giffey|Giffey)\\b", flags: "gu", replacement: "Franziska Giffey (SPD), Bürgermeisterin und Senatorin für Wirtschaft, Energie und Betriebe#+" },
        { pattern: "#(?:Franziska Giffey|Giffey)\\b", flags: "gu", replacement: "Franziska Giffey (SPD)" },
        { pattern: "##(?:Iris Spranger|Spranger)\\b", flags: "gu", replacement: "Iris Spranger (SPD), Senatorin für Inneres und Sport#+" },
        { pattern: "#(?:Iris Spranger|Spranger)\\b", flags: "gu", replacement: "Iris Spranger (SPD)" },
        { pattern: "##(?:Katharina Günther-Wünsch|Günther-Wünsch)\\b", flags: "gu", replacement: "Katharina Günther-Wünsch (CDU), Senatorin für Bildung, Jugend und Familie#+" },
        { pattern: "#(?:Katharina Günther-Wünsch|Günther-Wünsch)\\b", flags: "gu", replacement: "Katharina Günther-Wünsch (CDU)" },
        { pattern: "##(?:Kai Wegner|Wegner)\\b", flags: "gu", replacement: "Regierender Bürgermeister Kai Wegner (CDU)#+" },
        { pattern: "#(?:Kai Wegner|Wegner)\\b", flags: "gu", replacement: "Kai Wegner (CDU)" },
        { pattern: "##(?:Sarah Wedl-Wilson|Wedl-Wilson)\\b", flags: "gu", replacement: "Sarah Wedl-Wilson (parteilos), Senatorin für Kultur und Gesellschaftlichen Zusammenhalt#+" },
        { pattern: "#(?:Sarah Wedl-Wilson|Wedl-Wilson)\\b", flags: "gu", replacement: "Sarah Wedl-Wilson (parteilos)" },
        { pattern: "##(?:Stefan Evers|Evers)\\b", flags: "gu", replacement: "Stefan Evers (CDU), Bürgermeister und Senator für Finanzen#+" },
        { pattern: "#(?:Stefan Evers|Evers)\\b", flags: "gu", replacement: "Stefan Evers (CDU)" },
        { pattern: "##(?:Ute Bonde|Bonde)\\b", flags: "gu", replacement: "Ute Bonde (CDU), Senatorin für Mobilität, Verkehr, Klimaschutz und Umwelt#+" },
        { pattern: "#(?:Ute Bonde|Bonde)\\b", flags: "gu", replacement: "Ute Bonde (CDU)" },

        // Charlottenburg-Wilmersdorf – www.berlin.de/ba-charlottenburg-wilmersdorf/politik/bezirksamt/
        { pattern: "##(?:Astrid Duda|Duda)\\b", flags: "gu", replacement: "Astrid Duda (CDU), Stadträtin für Bürgerdienste und Soziales#+" },
        { pattern: "#(?:Astrid Duda|Duda)\\b", flags: "gu", replacement: "Astrid Duda (CDU)" },
        { pattern: "##(?:Judith Stückler|Stückler)\\b", flags: "gu", replacement: "BV-Vorsteherin Judith Stückler (CDU)#+" },
        { pattern: "#(?:Judith Stückler|Stückler)\\b", flags: "gu", replacement: "Judith Stückler (CDU)" },
        { pattern: "##(?:Christoph Brzezinski|Brzezinski)\\b", flags: "gu", replacement: "Christoph Brzezinski (CDU), Stadtrat für Stadtentwicklung, Liegenschaften und IT#+" },
        { pattern: "#(?:Christoph Brzezinski|Brzezinski)\\b", flags: "gu", replacement: "Christoph Brzezinski (CDU)" },
        { pattern: "##(?:Heike Schmitt-Schmelz|Schmitt-Schmelz)\\b", flags: "gu", replacement: "Heike Schmitt-Schmelz (SPD), Stadträtin für Schule, Sport, Weiterbildung und Kultur#+" },
        { pattern: "#(?:Heike Schmitt-Schmelz|Schmitt-Schmelz)\\b", flags: "gu", replacement: "Heike Schmitt-Schmelz (SPD)" },
        { pattern: "##(?:Kirstin Bauch|Bauch)\\b", flags: "gu", replacement: "Kirstin Bauch (Bündnis 90/Die Grüne), Bürgermeisterin und Stadträtin für Finanzen, Personal und Wirtschaftsförderung#+" },
        { pattern: "#(?:Kirstin Bauch|Bauch)\\b", flags: "gu", replacement: "Kirstin Bauch (Bündnis 90/Die Grüne)" },
        { pattern: "##(?:Oliver Schruoffeneger|Schruoffeneger)\\b", flags: "gu", replacement: "Oliver Schruoffeneger (Bündnis 90/Die Grüne), Stadtrat für Ordnung, Umwelt, Straßen und Grünflächen#+" },
        { pattern: "#(?:Oliver Schruoffeneger|Schruoffeneger)\\b", flags: "gu", replacement: "Oliver Schruoffeneger (Bündnis 90/Die Grüne)" },
        { pattern: "##(?:Simon Hertel|Hertel)\\b", flags: "gu", replacement: "Simon Hertel (CDU), Stadtrat für Jugend und Gesundheit#+" },
        { pattern: "#(?:Simon Hertel|Hertel)\\b", flags: "gu", replacement: "Simon Hertel (CDU)" },
        { pattern: "##(?:Dagmar Kempf|Kempf)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteherin Dagmar Kempf (Bündnis 90/Die Grünen)#+" },
        { pattern: "#(?:Dagmar Kempf|Kempf)\\b", flags: "gu", replacement: "Dagmar Kempf (Bündnis 90/Die Grünen)" },

        // Friedrichshain-Kreuzberg – www.berlin.de/ba-friedrichshain-kreuzberg/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Andy Hehmke|Hehmke)\\b", flags: "gu", replacement: "Andy Hehmke (SPD), Stadtrat für Schule, Sport und Facility Management#+" },
        { pattern: "#(?:Andy Hehmke|Hehmke)\\b", flags: "gu", replacement: "Andy Hehmke (SPD)" },
        { pattern: "##(?:Annika Gerold|Gerold)\\b", flags: "gu", replacement: "Annika Gerold (Bündnis 90/Die Grünen), Stadträtin für Verkehr, Grünflächen, Ordnung und Umwelt#+" },
        { pattern: "#(?:Annika Gerold|Gerold)\\b", flags: "gu", replacement: "Annika Gerold (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Werner Heck|Heck)\\b", flags: "gu", replacement: "BV-Vorsteher Werner Heck (Bündnis 90/Die Grünen)#+" },
        { pattern: "#(?:Werner Heck|Heck)\\b", flags: "gu", replacement: "Werner Heck (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Clara Herrmann|Herrmann)\\b", flags: "gu", replacement: "Clara Herrmann (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Finanzen, Personal, Wirtschaft, Kultur, Diversity und Klima#+" },
        { pattern: "#(?:Clara Herrmann|Herrmann)\\b", flags: "gu", replacement: "Clara Herrmann (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Florian Schmidt|Schmidt)\\b", flags: "gu", replacement: "Florian Schmidt (Bündnis 90/Die Grünen), Stadtrat für Bauen, Planen, Kooperative Stadtentwicklung#+" },
        { pattern: "#(?:Florian Schmidt|Schmidt)\\b", flags: "gu", replacement: "Florian Schmidt (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Max Kindler|Kindler)\\b", flags: "gu", replacement: "Max Kindler (CDU), Stadtrat für Jugend, Familie und Gesundheit#+" },
        { pattern: "#(?:Max Kindler|Kindler)\\b", flags: "gu", replacement: "Max Kindler (CDU)" },
        { pattern: "##(?:Regine Sommer-Wetter|Sommer-Wetter)\\b", flags: "gu", replacement: "Regine Sommer-Wetter (Die Linke), Stellvertretende Bürgermeisterin und Stadträtin für Arbeit, Bürgerdienste und Soziales#+" },
        { pattern: "#(?:Regine Sommer-Wetter|Sommer-Wetter)\\b", flags: "gu", replacement: "Regine Sommer-Wetter (Die Linke)" },
        { pattern: "##(?:Ulrike Juda|Juda)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteherin Ulrike Juda (Die Linke)#+" },
        { pattern: "#(?:Ulrike Juda|Juda)\\b", flags: "gu", replacement: "Ulrike Juda (Die Linke)" },

        // Lichtenberg – www.berlin.de/ba-lichtenberg/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Gregor Hoffmann|Hoffmann)\\b", flags: "gu", replacement: "BV-Vorsteher Gregor Hoffmann (CDU)#+" },
        { pattern: "#(?:Gregor Hoffmann|Hoffmann)\\b", flags: "gu", replacement: "Gregor Hoffmann (CDU)" },
        { pattern: "##(?:Camilla Schuler|Schuler)\\b", flags: "gu", replacement: "Camilla Schuler (Die Linke), Stellvertretende Bürgermeisterin und Stadträtin für Stadtentwicklung, Bauen, Facility Management und Jugend und Familie#+" },
        { pattern: "#(?:Camilla Schuler|Schuler)\\b", flags: "gu", replacement: "Camilla Schuler (Die Linke)" },
        { pattern: "##(?:Catrin Gocksch|Gocksch)\\b", flags: "gu", replacement: "Catrin Gocksch (CDU), Stadträtin für Soziales, Arbeit, Gesundheit und Bürgerdienste#+" },
        { pattern: "#(?:Catrin Gocksch|Gocksch)\\b", flags: "gu", replacement: "Catrin Gocksch (CDU)" },
        { pattern: "##(?:Filiz Keküllüoğlu|Keküllüoğlu)\\b", flags: "gu", replacement: "Filiz Keküllüoğlu (Bündnis 90/Die Grünen), Stadträtin für Verkehr, Grünflächen, Ordnung, Umwelt und Naturschutz#+" },
        { pattern: "#(?:Filiz Keküllüoğlu|Keküllüoğlu)\\b", flags: "gu", replacement: "Filiz Keküllüoğlu (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Martin Schaefer|Schaefer)\\b", flags: "gu", replacement: "Martin Schaefer (CDU), Bürgermeister und Stadtrat für Personal, Finanzen, Wirtschaft, Kultur und Sozialraumplanung#+" },
        { pattern: "#(?:Martin Schaefer|Schaefer)\\b", flags: "gu", replacement: "Martin Schaefer (CDU)" },
        { pattern: "##(?:Sandy Mattes|Mattes)\\b", flags: "gu", replacement: "Sandy Mattes (SPD), Stadträtin für Geschäftsbereichs Schule und Sport#+" },
        { pattern: "#(?:Sandy Mattes|Mattes)\\b", flags: "gu", replacement: "Sandy Mattes (SPD)" },
        { pattern: "##(?:Kerstin Zimmer|Zimmer)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteherin Kerstin Zimmer (Die Linke)#+" },
        { pattern: "#(?:Kerstin Zimmer|Zimmer)\\b", flags: "gu", replacement: "Kerstin Zimmer (Die Linke)" },

        // Marzahn-Hellersdorf – www.berlin.de/ba-marzahn-hellersdorf/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Stefan Suck|Suck)\\b", flags: "gu", replacement: "BV-Vorsteher Stefan Suck (CDU)#+" },
        { pattern: "#(?:Stefan Suck|Suck)\\b", flags: "gu", replacement: "Stefan Suck (CDU)" },
        { pattern: "##(?:Gordon Lemm|Lemm)\\b", flags: "gu", replacement: "Gordon Lemm (SPD), Stadtrat für Jugend, Familie und Gesundheit#+" },
        { pattern: "#(?:Gordon Lemm|Lemm)\\b", flags: "gu", replacement: "Gordon Lemm (SPD)" },
        { pattern: "##(?:Heike Wessoly|Wessoly)\\b", flags: "gu", replacement: "Heike Wessoly (CDU), Stadträtin für Stadtentwicklung#+" },
        { pattern: "#(?:Heike Wessoly|Wessoly)\\b", flags: "gu", replacement: "Heike Wessoly (CDU)" },
        { pattern: "##(?:Juliane Witt|Witt)\\b", flags: "gu", replacement: "Juliane Witt (Die Linke), Stadträtin für Soziales und Bürgerdienste#+" },
        { pattern: "#(?:Juliane Witt|Witt)\\b", flags: "gu", replacement: "Juliane Witt (Die Linke)" },
        { pattern: "##(?:Nadja Zivkovic|Zivkovic)\\b", flags: "gu", replacement: "Nadja Zivkovic (CDU), Bürgermeisterin und Stadträtin für Wirtschaftsförderung, Straßen, Grünflächen, Umwelt- und Naturschutz, Personal und Finanzen#+" },
        { pattern: "#(?:Nadja Zivkovic|Zivkovic)\\b", flags: "gu", replacement: "Nadja Zivkovic (CDU)" },
        { pattern: "##(?:Stefan Bley|Bley)\\b", flags: "gu", replacement: "Stefan Bley (CDU), Stadtrat für Schule, Sport, Weiterbildung, Kultur und Facility Management#+" },
        { pattern: "#(?:Stefan Bley|Bley)\\b", flags: "gu", replacement: "Stefan Bley (CDU)" },
        { pattern: "##(?:Luise Lehmann|Lehmann)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteherin Luise Lehmann (SPD)#+" },
        { pattern: "#(?:Luise Lehmann|Lehmann)\\b", flags: "gu", replacement: "Luise Lehmann (SPD)" },

        // Mitte – www.berlin.de/ba-mitte/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Benjamin Fritz|Fritz)\\b", flags: "gu", replacement: "Benjamin Fritz (CDU), Stadtrat für Schule und Sport#+" },
        { pattern: "#(?:Benjamin Fritz|Fritz)\\b", flags: "gu", replacement: "Benjamin Fritz (CDU)" },
        { pattern: "##(?:Jelisaweta Kamm|Kamm)\\b", flags: "gu", replacement: "BV-Vorsteherin Jelisaweta Kamm (Bündnis 90/Die Grünen)#+" },
        { pattern: "#(?:Jelisaweta Kamm|Kamm)\\b", flags: "gu", replacement: "Jelisaweta Kamm (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Carsten Spallek|Spallek)\\b", flags: "gu", replacement: "Carsten Spallek (CDU), Stellvertretender Bürgermeister und Stadtrat für Soziales und Bürgerdienste#+" },
        { pattern: "#(?:Carsten Spallek|Spallek)\\b", flags: "gu", replacement: "Carsten Spallek (CDU)" },
        { pattern: "##(?:Christoph Keller|Keller)\\b", flags: "gu", replacement: "Christoph Keller (Die Linke), Stadtrat für Jugend, Familie und Gesundheit#+" },
        { pattern: "#(?:Christoph Keller|Keller)\\b", flags: "gu", replacement: "Christoph Keller (Die Linke)" },
        { pattern: "##(?:Christopher Schriner|Schriner)\\b", flags: "gu", replacement: "Christopher Schriner (Bündnis 90/Die Grünen), Stadtrat für Ordnung, Umwelt, Natur, Straßen und Grünflächen#+" },
        { pattern: "#(?:Christopher Schriner|Schriner)\\b", flags: "gu", replacement: "Christopher Schriner (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Ephraim Gothe|Gothe)\\b", flags: "gu", replacement: "Ephraim Gothe (SPD), Stadtrat für Stadtentwicklung und Facility Management#+" },
        { pattern: "#(?:Ephraim Gothe|Gothe)\\b", flags: "gu", replacement: "Ephraim Gothe (SPD)" },
        { pattern: "##(?:Stefanie Remlinger|Remlinger)\\b", flags: "gu", replacement: "Stefanie Remlinger (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Personal und Finanzen sowie Weiterbildung und Kultur#+" },
        { pattern: "#(?:Stefanie Remlinger|Remlinger)\\b", flags: "gu", replacement: "Stefanie Remlinger (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Martin Leuschner|Leuschner)\\b", flags: "gu", replacement: "Stellvertretender BV-Vorsteher Martin Leuschner (CDU)#+" },
        { pattern: "#(?:Martin Leuschner|Leuschner)\\b", flags: "gu", replacement: "Martin Leuschner (CDU)" },

        // Neukölln – www.berlin.de/ba-neukoelln/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Karsten Schulze|Schulze)\\b", flags: "gu", replacement: "BV-Vorsteher Karsten Schulze (CDU)#+" },
        { pattern: "#(?:Karsten Schulze|Schulze)\\b", flags: "gu", replacement: "Karsten Schulze (CDU)" },
        { pattern: "##(?:Gerrit Kringel|Kringel)\\b", flags: "gu", replacement: "Gerrit Kringel (CDU), Stellvertretender Bürgermeister und Stadtrat für Ordnung#+" },
        { pattern: "#(?:Gerrit Kringel|Kringel)\\b", flags: "gu", replacement: "Gerrit Kringel (CDU)" },
        { pattern: "##(?:Hannes Rehfeldt|Rehfeldt)\\b", flags: "gu", replacement: "Hannes Rehfeldt (CDU), Stadtrat für Soziales und Gesundheit#+" },
        { pattern: "#(?:Hannes Rehfeldt|Rehfeldt)\\b", flags: "gu", replacement: "Hannes Rehfeldt (CDU)" },
        { pattern: "##(?:Janine Wolter|Wolter)\\b", flags: "gu", replacement: "Janine Wolter (SPD), Stadträtin für Bildung, Kultur und Sport#+" },
        { pattern: "#(?:Janine Wolter|Wolter)\\b", flags: "gu", replacement: "Janine Wolter (SPD)" },
        { pattern: "##(?:Jochen Biedermann|Biedermann)\\b", flags: "gu", replacement: "Jochen Biedermann (Bündnis 90/Die Grünen), Stadtrat für Stadtentwicklung, Umwelt und Verkehr#+" },
        { pattern: "#(?:Jochen Biedermann|Biedermann)\\b", flags: "gu", replacement: "Jochen Biedermann (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Martin Hikel|Hikel)\\b", flags: "gu", replacement: "Martin Hikel (SPD), Bürgermeister und Stadtrat für Bürgerdienste, Facility Management, Gleichstellung und Wirtschaftsförderung#+" },
        { pattern: "#(?:Martin Hikel|Hikel)\\b", flags: "gu", replacement: "Martin Hikel (SPD)" },
        { pattern: "##(?:Sarah Nagel|Nagel)\\b", flags: "gu", replacement: "Sarah Nagel (Die Linke), Stadträtin für Jugend#+" },
        { pattern: "#(?:Sarah Nagel|Nagel)\\b", flags: "gu", replacement: "Sarah Nagel (Die Linke)" },
        { pattern: "##(?:Lars Oeverdieck|Oeverdieck)\\b", flags: "gu", replacement: "Stellvertretender BV-Vorsteher Lars Oeverdieck (SPD)#+" },
        { pattern: "#(?:Lars Oeverdieck|Oeverdieck)\\b", flags: "gu", replacement: "Lars Oeverdieck (SPD)" },

        // Pankow – www.berlin.de/ba-pankow/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Oliver Jütting|Jütting)\\b", flags: "gu", replacement: "BV-Vorsteher Oliver Jütting (Bündnis 90/Die Grünen)#+" },
        { pattern: "#(?:Oliver Jütting|Jütting)\\b", flags: "gu", replacement: "Oliver Jütting (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Cornelius Bechtler|Bechtler)\\b", flags: "gu", replacement: "Cornelius Bechtler (Bündnis 90/Die Grünen), Stadtrat für Stadtentwicklung und Bürgerdienste#+" },
        { pattern: "#(?:Cornelius Bechtler|Bechtler)\\b", flags: "gu", replacement: "Cornelius Bechtler (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Dominique Krössin|Krössin)\\b", flags: "gu", replacement: "Dominique Krössin (Die Linke), Stadträtin für Geschäftsbereichs Soziales und Gesundheit#+" },
        { pattern: "#(?:Dominique Krössin|Krössin)\\b", flags: "gu", replacement: "Dominique Krössin (Die Linke)" },
        { pattern: "##(?:Cordelia Koch|Koch)\\b", flags: "gu", replacement: "Cordelia Koch (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Finanzen, Personal, Weiterbildung und Kultur, Wirtschaftsförderung#+" },
        { pattern: "#(?:Cordelia Koch|Koch)\\b", flags: "gu", replacement: "Cordelia Koch (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Jörn Pasternack|Pasternack)\\b", flags: "gu", replacement: "Jörn Pasternack (CDU), Stadtrat für Schule, Sport und Facility Management#+" },
        { pattern: "#(?:Jörn Pasternack|Pasternack)\\b", flags: "gu", replacement: "Jörn Pasternack (CDU)" },
        { pattern: "##(?:Manuela Anders-Granitzki|Anders-Granitzki)\\b", flags: "gu", replacement: "Manuela Anders-Granitzki (CDU), Stellvertretende Bürgermeisterin und Stadträtin für Ordnungsamt, Straßen- und Grünflächenamt und dem Umwelt- und Naturschutzamt#+" },
        { pattern: "#(?:Manuela Anders-Granitzki|Anders-Granitzki)\\b", flags: "gu", replacement: "Manuela Anders-Granitzki (CDU)" },
        { pattern: "##(?:Rona Tietje|Tietje)\\b", flags: "gu", replacement: "Rona Tietje (SPD), Stadträtin für Jugend und Familie#+" },
        { pattern: "#(?:Rona Tietje|Tietje)\\b", flags: "gu", replacement: "Rona Tietje (SPD)" },
        { pattern: "##(?:David Paul|Paul)\\b", flags: "gu", replacement: "Stellvertretender BV-Vorsteher David Paul (CDU)#+" },
        { pattern: "#(?:David Paul|Paul)\\b", flags: "gu", replacement: "David Paul (CDU)" },

        // Reinickendorf – www.berlin.de/ba-reinickendorf/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:Alexander Ewers|Ewers)\\b", flags: "gu", replacement: "Alexander Ewers (SPD), Stadtrat für Jugend und Familie#+" },
        { pattern: "#(?:Alexander Ewers|Ewers)\\b", flags: "gu", replacement: "Alexander Ewers (SPD)" },
        { pattern: "##(?:BV-Vorsteherin Kerstin Köppen|Köppen)\\b", flags: "gu", replacement: "BV-Vorsteherin Kerstin Köppen (CDU)#+" },
        { pattern: "#(?:Kerstin Köppen|Köppen)\\b", flags: "gu", replacement: "Kerstin Köppen (CDU)" },
        { pattern: "##(?:Emine Demirbüken-Wegner|Demirbüken-Wegner)\\b", flags: "gu", replacement: "Emine Demirbüken-Wegner (CDU), Bürgermeisterin und Stadträtin für Finanzen, Personal und Bürgerdienste#+" },
        { pattern: "#(?:Emine Demirbüken-Wegner|Demirbüken-Wegner)\\b", flags: "gu", replacement: "Emine Demirbüken-Wegner (CDU)" },
        { pattern: "##(?:Harald Muschner|Muschner)\\b", flags: "gu", replacement: "Harald Muschner (CDU), Stadtrat für Bildung, Sport, Kultur und Facility Management#+" },
        { pattern: "#(?:Harald Muschner|Muschner)\\b", flags: "gu", replacement: "Harald Muschner (CDU)" },
        { pattern: "##(?:Julia Schrod-Thiel|Schrod-Thiel)\\b", flags: "gu", replacement: "Julia Schrod-Thiel (CDU), Stadträtin für Ordnung, Umwelt und Verkehr#+" },
        { pattern: "#(?:Julia Schrod-Thiel|Schrod-Thiel)\\b", flags: "gu", replacement: "Julia Schrod-Thiel (CDU)" },
        { pattern: "##(?:Korinna Stephan|Stephan)\\b", flags: "gu", replacement: "Korinna Stephan (Bündnis 90/Die Grünen), Stadträtin für Stadtentwicklung#+" },
        { pattern: "#(?:Korinna Stephan|Stephan)\\b", flags: "gu", replacement: "Korinna Stephan (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Sevda Boyraci|Boyraci)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteherin Sevda Boyraci (SPD)#+" },
        { pattern: "#(?:Sevda Boyraci|Boyraci)\\b", flags: "gu", replacement: "Sevda Boyraci (SPD)" },
        { pattern: "##(?:Uwe Brockhausen|Brockhausen)\\b", flags: "gu", replacement: "Uwe Brockhausen (SPD), Stellvertretender Bürgermeister und Stadtrat für Soziales und Gesundheit#+" },
        { pattern: "#(?:Uwe Brockhausen|Brockhausen)\\b", flags: "gu", replacement: "Uwe Brockhausen (SPD)" },

        // Steglitz-Zehlendorf – www.berlin.de/ba-steglitz-zehlendorf/politik-und-verwaltung/bezirksamt/
        { pattern: "##(?:René Rögner-Francke|Rögner-Francke)\\b", flags: "gu", replacement: "BV-Vorsteher René Rögner-Francke (CDU)#+" },
        { pattern: "#(?:René Rögner-Francke|Rögner-Francke)\\b", flags: "gu", replacement: "René Rögner-Francke (CDU)" },
        { pattern: "##(?:Carolina Böhm|Böhm)\\b", flags: "gu", replacement: "Carolina Böhm (SPD), Stadträtin für Jugend und Gesundheit#+" },
        { pattern: "#(?:Carolina Böhm|Böhm)\\b", flags: "gu", replacement: "Carolina Böhm (SPD)" },
        { pattern: "##(?:Maren Schellenberg|Schellenberg)\\b", flags: "gu", replacement: "Maren Schellenberg (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Finanzen, Personal und Facility Management#+" },
        { pattern: "#(?:Maren Schellenberg|Schellenberg)\\b", flags: "gu", replacement: "Maren Schellenberg (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Patrick Steinhoff|Steinhoff)\\b", flags: "gu", replacement: "Patrick Steinhoff (CDU), Stadtrat für Stadtentwicklung, Schule und Sport#+" },
        { pattern: "#(?:Patrick Steinhoff|Steinhoff)\\b", flags: "gu", replacement: "Patrick Steinhoff (CDU)" },
        { pattern: "##(?:Sören Grawert|Grawert)\\b", flags: "gu", replacement: "Stellvertretender BV-Vorsteher Sören Grawert (FDP)#+" },
        { pattern: "#(?:Sören Grawert|Grawert)\\b", flags: "gu", replacement: "Sören Grawert (FDP)" },
        { pattern: "##(?:Tim Richter|Richter)\\b", flags: "gu", replacement: "Tim Richter (CDU), Stellvertretender Bürgermeister und Stadtrat für Bürgerdienste, Soziales, Bildung und Kultur#+" },
        { pattern: "#(?:Tim Richter|Richter)\\b", flags: "gu", replacement: "Tim Richter (CDU)" },
        { pattern: "##(?:Urban Aykal|Aykal)\\b", flags: "gu", replacement: "Urban Aykal (Bündnis 90/Die Grünen), Stadtrat für Ordnung, Umwelt- und Naturschutz, Straßen und Grünflächen#+" },
        { pattern: "#(?:Urban Aykal|Aykal)\\b", flags: "gu", replacement: "Urban Aykal (Bündnis 90/Die Grünen)" },

        // Spandau – www.berlin.de/ba-spandau/politik-und-verwaltung/bezirksamt/das-kollegium/
        { pattern: "##(?:Christian Heck|Heck)\\b", flags: "gu", replacement: "BV-Vorsteher Christian Heck (CDU)#+" },
        { pattern: "#(?:Christian Heck|Heck)\\b", flags: "gu", replacement: "Christian Heck (CDU)" },
        { pattern: "##(?:Carola Brückner|Brückner)\\b", flags: "gu", replacement: "Carola Brückner (SPD), Stellvertretende Bürgermeisterin und Stadträtin für Bildung, Kultur, Sport und Facility Management#+" },
        { pattern: "#(?:Carola Brückner|Brückner)\\b", flags: "gu", replacement: "Carola Brückner (SPD)" },
        { pattern: "##(?:Frank Bewig|Bewig)\\b", flags: "gu", replacement: "Frank Bewig (CDU), Bürgermeister und Stadtrat für Personal, Finanzen und Wirtschaftsförderung#+" },
        { pattern: "#(?:Frank Bewig|Bewig)\\b", flags: "gu", replacement: "Frank Bewig (CDU)" },
        { pattern: "##(?:Gregor Kempert|Kempert)\\b", flags: "gu", replacement: "Gregor Kempert (SPD), Stadtrat für Abteilung Soziales und Bürgerdienste#+" },
        { pattern: "#(?:Gregor Kempert|Kempert)\\b", flags: "gu", replacement: "Gregor Kempert (SPD)" },
        { pattern: "##(?:Uwe Ziesak|Ziesak)\\b", flags: "gu", replacement: "Stellvertretender BV-Vorsteher Uwe Ziesak (SPD)#+" },
        { pattern: "#(?:Uwe Ziesak|Ziesak)\\b", flags: "gu", replacement: "Uwe Ziesak (SPD)" },
        { pattern: "##(?:Tanja Franzke|Franzke)\\b", flags: "gu", replacement: "Tanja Franzke (CDU), Stadträtin für Jugend und Gesundheit#+" },
        { pattern: "#(?:Tanja Franzke|Franzke)\\b", flags: "gu", replacement: "Tanja Franzke (CDU)" },
        { pattern: "##(?:Thorsten Schatz|Schatz)\\b", flags: "gu", replacement: "Thorsten Schatz (CDU), Stadtrat für Bauen, Planen, Umwelt- und Naturschutz#+" },
        { pattern: "#(?:Thorsten Schatz|Schatz)\\b", flags: "gu", replacement: "Thorsten Schatz (CDU)" },

        // Tempelhof-Schöneberg – www.berlin.de/ba-tempelhof-schoeneberg/politik-und-verwaltung/
        { pattern: "##(?:Stefan Böltes|Böltes)\\b", flags: "gu", replacement: "BV-Vorsteher Stefan Böltes (SPD)#+" },
        { pattern: "#(?:Stefan Böltes|Böltes)\\b", flags: "gu", replacement: "Stefan Böltes (SPD)" },
        { pattern: "##(?:Saskia Ellenbeck|Ellenbeck)\\b", flags: "gu", replacement: "Saskia Ellenbeck (Bündnis 90/Die Grünen), Stadträtin für Ordnung, Straßen, Grünflächen, Umwelt und Naturschutz#+" },
        { pattern: "#(?:Saskia Ellenbeck|Ellenbeck)\\b", flags: "gu", replacement: "Saskia Ellenbeck (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Eva Majewski|Majewski)\\b", flags: "gu", replacement: "Eva Majewski (CDU), Stadträtin für Stadtentwicklung und Facility Management#+" },
        { pattern: "#(?:Eva Majewski|Majewski)\\b", flags: "gu", replacement: "Eva Majewski (CDU)" },
        { pattern: "##(?:Jörn Oltmann|Oltmann)\\b", flags: "gu", replacement: "Jörn Oltmann (Bündnis 90/Die Grünen), Bürgermeister für Finanzen, Personal, Wirtschaftsförderung und Koordination#+" },
        { pattern: "#(?:Jörn Oltmann|Oltmann)\\b", flags: "gu", replacement: "Jörn Oltmann (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Matthias Steuckardt|Steuckardt)\\b", flags: "gu", replacement: "Matthias Steuckardt (CDU), Stellvertretender Bürgermeister und Stadtrat für Bürgerdienste, Soziales und Senioren#+" },
        { pattern: "#(?:Matthias Steuckardt|Steuckardt)\\b", flags: "gu", replacement: "Matthias Steuckardt (CDU)" },
        { pattern: "##(?:Oliver Schworck|Schworck)\\b", flags: "gu", replacement: "Oliver Schworck (SPD), Stadtrat für Jugend und Gesundheit#+" },
        { pattern: "#(?:Oliver Schworck|Schworck)\\b", flags: "gu", replacement: "Oliver Schworck (SPD)" },
        { pattern: "##(?:Martina Zander-Rade|Zander-Rade)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteherin Martina Zander-Rade (Bündnis 90/Die Grünen)#+" },
        { pattern: "#(?:Martina Zander-Rade|Zander-Rade)\\b", flags: "gu", replacement: "Martina Zander-Rade (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Tobias Dollase|Dollase)\\b", flags: "gu", replacement: "Tobias Dollase (parteilos für die CDU), Stadtrat für Schule, Sport, Weiterbildung und Kultur#+" },
        { pattern: "#(?:Tobias Dollase|Dollase)\\b", flags: "gu", replacement: "Tobias Dollase (parteilos für die CDU)" },

        // Treptow-Köpenick – www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksamt/artikel.5752.php
        { pattern: "##(?:André Grammelsdorff|Grammelsdorff)\\b", flags: "gu", replacement: "André Grammelsdorff (CDU), Stellvertretender Bürgermeister und Stadtrat für Jugend#+" },
        { pattern: "#(?:André Grammelsdorff|Grammelsdorff)\\b", flags: "gu", replacement: "André Grammelsdorff (CDU)" },
        { pattern: "##(?:Bernd Geschanowski|Geschanowski)\\b", flags: "gu", replacement: "Bernd Geschanowski (AfD), Stadtrat für Öffentliche Ordnung#+" },
        { pattern: "#(?:Bernd Geschanowski|Geschanowski)\\b", flags: "gu", replacement: "Bernd Geschanowski (AfD)" },
        { pattern: "##(?:Peter Groos|Groos)\\b", flags: "gu", replacement: "BV-Vorsteher Peter Groos (SPD)#+" },
        { pattern: "#(?:Peter Groos|Groos)\\b", flags: "gu", replacement: "Peter Groos (SPD)" },
        { pattern: "##(?:Carolin Weingart|Weingart)\\b", flags: "gu", replacement: "Carolin Weingart (Die Linke), Stadträtin für Soziales, Gesundheit, Arbeit und Teilhabe#+" },
        { pattern: "#(?:Carolin Weingart|Weingart)\\b", flags: "gu", replacement: "Carolin Weingart (Die Linke)" },
        { pattern: "##(?:Claudia Leistner|Leistner)\\b", flags: "gu", replacement: "Claudia Leistner (Bündnis 90/Die Grünen), Stadträtin für Stadtentwicklung, Straßen, Grünflächen und Umwelt#+" },
        { pattern: "#(?:Claudia Leistner|Leistner)\\b", flags: "gu", replacement: "Claudia Leistner (Bündnis 90/Die Grünen)" },
        { pattern: "##(?:Marco Brauchmann|Brauchmann)\\b", flags: "gu", replacement: "Marco Brauchmann (CDU), Stadtrat für Weiterbildung, Schule, Kultur und Sport#+" },
        { pattern: "#(?:Marco Brauchmann|Brauchmann)\\b", flags: "gu", replacement: "Marco Brauchmann (CDU)" },
        { pattern: "##(?:Oliver Igel|Igel)\\b", flags: "gu", replacement: "Oliver Igel (SPD), Bürgermeister und Stadtrat für Bürgerdienste, Personal, Finanzen, Immobilien und Wirtschaft#+" },
        { pattern: "#(?:Oliver Igel|Igel)\\b", flags: "gu", replacement: "Oliver Igel (SPD)" },
        { pattern: "##(?:André Schubert|Schubert)\\b", flags: "gu", replacement: "Stellvertretende BV-Vorsteher André Schubert (Die Linke)#+" },
        { pattern: "#(?:André Schubert|Schubert)\\b", flags: "gu", replacement: "André Schubert (Die Linke)" },

        // Genderfrei per Hashtag
        // IRREGULÄRE FORMEN
        { pattern: "#(?:Ärztinnen\\s*und\\s*Ärzte|Ärzte\\s*und\\s*Ärztinnen)\\b", flags: "giu", replacement: "Ärzte" },
        { pattern: "#(?:[ÄA]rzt)(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Ärzte" },
        { pattern: "#(?:Gästinnen\\s*und\\s*Gäste|Gäste\\s*und\\s*Gästinnen)\\b", flags: "giu", replacement: "Gäste" },
        { pattern: "#Gäst(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Gäste" },
        { pattern: "#(?:Studentinnen\\s*und\\s*Studenten|Studenten\\s*und\\s*Studentinnen)\\b", flags: "giu", replacement: "Studenten" },
        { pattern: "#Student(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Studenten" },
        { pattern: "#Studierende\\b", flags: "giu", replacement: "Studenten" },

        // REGULÄRE FORMEN (Doppelform + Markerform)
        { pattern: "#(?:Anwohnerinnen\\s*und\\s*Anwohner|Anwohner\\s*und\\s*Anwohnerinnen)\\b", flags: "giu", replacement: "Anwohner" },
        { pattern: "#Anwohner(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Anwohner" },
        { pattern: "#Anwohnende\\b", flags: "giu", replacement: "Anwohner" },
        { pattern: "#(?:Arbeitnehmerinnen\\s*und\\s*Arbeitnehmer|Arbeitnehmer\\s*und\\s*Arbeitnehmerinnen)\\b", flags: "giu", replacement: "Arbeitnehmer" },
        { pattern: "#Arbeitnehmer(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Arbeitnehmer" },
        { pattern: "#Arbeitnehmende\\b", flags: "giu", replacement: "Arbeitnehmer" },
        { pattern: "#(?:Ausstellerinnen\\s*und\\s*Aussteller|Aussteller\\s*und\\s*Ausstellerinnen)\\b", flags: "giu", replacement: "Aussteller" },
        { pattern: "#Aussteller(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Aussteller" },
        { pattern: "#Ausstellende\\b", flags: "giu", replacement: "Aussteller" },
        { pattern: "#(?:Autofahrerinnen\\s*und\\s*Autofahrer|Autofahrer\\s*und\\s*Autofahrerinnen)\\b", flags: "giu", replacement: "Autofahrer" },
        { pattern: "#Autofahrer(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Autofahrer" },
        { pattern: "#Autodahrende\\b", flags: "giu", replacement: "Autofahrer" },
        { pattern: "#(?:Autorinnen\\s*und\\s*Autoren|Autoren\\s*und\\s*Autorinnen)\\b", flags: "giu", replacement: "Autoren" },
        { pattern: "#Autor(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Autoren" },
        { pattern: "#(?:Berlinerinnen\\s*und\\s*Berliner|Berliner\\s*und\\s*Berlinerinnen)\\b", flags: "giu", replacement: "Berliner" },
        { pattern: "#Berliner(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Berliner" },
        { pattern: "#(?:Besucherinnen\\s*und\\s*Besucher|Besucher\\s*und\\s*Besucherinnen)\\b", flags: "giu", replacement: "Besucher" },
        { pattern: "#Besucher(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Besucher" },
        { pattern: "#(?:Bewerberinnen\\s*und\\s*Bewerber|Bewerber\\s*und\\s*Bewerberinnen)\\b", flags: "giu", replacement: "Bewerber" },
        { pattern: "#Bewerber(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Bewerber" },
        { pattern: "#Bewerbende\\b", flags: "giu", replacement: "Bewerber" },
        { pattern: "#(?:Bürgerinnen\\s*und\\s*Bürger|Bürger\\s*und\\s*Bürgerinnen)\\b", flags: "giu", replacement: "Bürger" },
        { pattern: "#Bürger(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Bürger" },
        { pattern: "#(?:Erzieherinnen\\s*und\\s*Erzieher|Erzieher\\s*und\\s*Erzieherinnen)\\b", flags: "giu", replacement: "Erzieher" },
        { pattern: "#Erzieher(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Erzieher" },
        { pattern: "#(?:Expertinnen\\s*und\\s*Experten|Experten\\s*und\\s*Expertinnen)\\b", flags: "giu", replacement: "Experten" },
        { pattern: "#Expert(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Experten" },
        { pattern: "#(?:Gärtnerinnen\\s*und\\s*Gärtner|Gärtner\\s*und\\s*Gärtnerinnen)\\b", flags: "giu", replacement: "Gärtner" },
        { pattern: "#Gärtner(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Gärtner" },
        { pattern: "#(?:Händlerinnen\\s*und\\s*Händler|Händler\\s*und\\s*Händlerinnen)\\b", flags: "giu", replacement: "Händler" },
        { pattern: "#Händler(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Händler" },
        { pattern: "#(?:Handwerkerinnen\\s*und\\s*Handwerker|Handwerker\\s*und\\s*Handwerkerinnen)\\b", flags: "giu", replacement: "Handwerker" },
        { pattern: "#Handwerker(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Handwerker" },
        { pattern: "#(?:Kolleginnen\\s*und\\s*Kollegen|Kollegen\\s*und\\s*Kolleginnen)\\b", flags: "giu", replacement: "Kollegen" },
        { pattern: "#Kolleg(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Kollegen" },
        { pattern: "#(?:Künstlerinnen\\s*und\\s*Künstler|Künstler\\s*und\\s*Künstlerinnen)\\b", flags: "giu", replacement: "Künstler" },
        { pattern: "#Künstler(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Künstler" },
        { pattern: "#(?:Kundinnen\\s*und\\s*Kunden|Kunden\\s*und\\s*Kundinnen)\\b", flags: "giu", replacement: "Kunden" },
        { pattern: "#Kund(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Kunden" },
        { pattern: "#(?:Lehrerinnen\\s*und\\s*Lehrer|Lehrer\\s*und\\s*Lehrerinnen)\\b", flags: "giu", replacement: "Lehrer" },
        { pattern: "#Lehrer(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Lehrer" },
        { pattern: "#Lehrende\\b", flags: "giu", replacement: "Lehrer" },
        { pattern: "#(?:Leserinnen\\s*und\\s*Leser|Leser\\s*und\\s*Leserinnen)\\b", flags: "giu", replacement: "Leser" },
        { pattern: "#Leser(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Leser" },
        { pattern: "#Lesende\\b", flags: "giu", replacement: "Leser" },
        { pattern: "#(?:Medizinerinnen\\s*und\\s*Mediziner|Mediziner\\s*und\\s*Medizinerinnen)\\b", flags: "giu", replacement: "Mediziner" },
        { pattern: "#Mediziner(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Mediziner" },
        { pattern: "#(?:Mieterinnen\\s*und\\s*Mieter|Mieter\\s*und\\s*Mieterinnen)\\b", flags: "giu", replacement: "Mieter" },
        { pattern: "#Mieter(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Mieter" },
        { pattern: "#Mietende\\b", flags: "giu", replacement: "Mieter" },
        { pattern: "#(?:Mitarbeiterinnen\\s*und\\s*Mitarbeiter|Mitarbeiter\\s*und\\s*Mitarbeiterinnen)\\b", flags: "giu", replacement: "Mitarbeiter" },
        { pattern: "#Mitarbeiter(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Mitarbeiter" },
        { pattern: "#Mitarbeitende\\b", flags: "giu", replacement: "Mitarbeiter" },
        { pattern: "#(?:Patientinnen\\s*und\\s*Patienten|Patienten\\s*und\\s*Patientinnen)\\b", flags: "giu", replacement: "Patienten" },
        { pattern: "#Patient(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Patienten" },
        { pattern: "#(?:Pflegerinnen\\s*und\\s*Pfleger|Pfleger\\s*und\\s*Pflegerinnen)\\b", flags: "giu", replacement: "Pfleger" },
        { pattern: "#Pfleger(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Pfleger" },
        { pattern: "#Pflegende\\b", flags: "giu", replacement: "Pfleger" },
        { pattern: "#(?:Politikerinnen\\s*und\\s*Politiker|Politiker\\s*und\\s*Politikerinnen)\\b", flags: "giu", replacement: "Politiker" },
        { pattern: "#Politiker(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Politiker" },
        { pattern: "#(?:Radfahrerinnen\\s*und\\s*Radfahrer|Radfahrer\\s*und\\s*Radfahrerinnen)\\b", flags: "giu", replacement: "Radfahrer" },
        { pattern: "#Radfahrer(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Radfahrer" },
        { pattern: "#Radfahrende\\b", flags: "giu", replacement: "Radfahrer" },
        { pattern: "#(?:Rentnerinnen\\s*und\\s*Rentner|Rentner\\s*und\\s*Rentnerinnen)\\b", flags: "giu", replacement: "Rentner" },
        { pattern: "#Rentner(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Rentner" },
        { pattern: "#(?:Schülerinnen\\s*und\\s*Schüler|Schüler\\s*und\\s*Schülerinnen)\\b", flags: "giu", replacement: "Schüler" },
        { pattern: "#Schüler(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Schüler" },
        { pattern: "#(?:Seniorinnen\\s*und\\s*Senioren|Senioren\\s*und\\s*Seniorinnen)\\b", flags: "giu", replacement: "Senioren" },
        { pattern: "#Senior(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Senioren" },
        { pattern: "#(?:Soldatinnen\\s*und\\s*Soldaten|Soldaten\\s*und\\s*Soldatinnen)\\b", flags: "giu", replacement: "Soldaten" },
        { pattern: "#Soldat(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Soldaten" },
        { pattern: "#(?:Spenderinnen\\s*und\\s*Spender|Spender\\s*und\\s*Spenderinnen)\\b", flags: "giu", replacement: "Spender" },
        { pattern: "#Spender(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Spender" },
        { pattern: "#Spendende\\b", flags: "giu", replacement: "Spender" },
        { pattern: "#(?:Teilnehmerinnen\\s*und\\s*Teilnehmer|Teilnehmer\\s*und\\s*Teilnehmerinnen)\\b", flags: "giu", replacement: "Teilnehmer" },
        { pattern: "#Teilnehmer(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Teilnehmer" },
        { pattern: "#Teilnehmende\\b", flags: "giu", replacement: "Teilnehmer" },
        { pattern: "#(?:Urlauberinnen\\s*und\\s*Urlauber|Urlauber\\s*und\\s*Urlauberinnen)\\b", flags: "giu", replacement: "Urlauber" },
        { pattern: "#Urlauber(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Urlauber" },
        { pattern: "#(?:Verbraucherinnen\\s*und\\s*Verbraucher|Verbraucher\\s*und\\s*Verbraucherinnen)\\b", flags: "giu", replacement: "Verbraucher" },
        { pattern: "#Verbraucher(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Verbraucher" },
        { pattern: "#(?:Vermieterinnen\\s*und\\s*Vermieter|Vermieter\\s*und\\s*Vermieterinnen)\\b", flags: "giu", replacement: "Vermieter" },
        { pattern: "#Vermieter(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Vermieter" },
        { pattern: "#Vermietende\\b", flags: "giu", replacement: "Vermieter" },
        { pattern: "#(?:Wählerinnen\\s*und\\s*Wähler|Wähler\\s*und\\s*Wählerinnen)\\b", flags: "giu", replacement: "Wähler" },
        { pattern: "#Wähler(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Wähler" },
        { pattern: "#Wählende\\b", flags: "giu", replacement: "Wähler" },
        { pattern: "#(?:Zuhörerinnen\\s*und\\s*Zuhörer|Zuhörer\\s*und\\s*Zuhörerinnen)\\b", flags: "giu", replacement: "Zuhörer" },
        { pattern: "#Zuhörer(?:\\*|:|\\|)?innen\\b", flags: "giu", replacement: "Zuhörer" },
        { pattern: "#Zuhörende\\b", flags: "giu", replacement: "Zuhörer" },
    ]
  },
  SUPERRED:{
    filenameOrder:'S!', joiner:'_', useKW:true, kwMode:'redaktionsschluss', redaktionsschlussWeekday:1, appearanceWeekday:6,
    maxEditionCodes:3, multiEditionJoiner:'#',
    editionMap:{
      CH:['Charlottenburg-Nord','Charlottenburg-Wilmersdorf','Charlottenburg','Westend'],
      HL:['Alt-Hohenschönhausen','Falkenberg','Fennpfuhl','Friedrichsfelde','Karlshorst','Lichtenberg','Malchow','Neu-Hohenschönhausen','Rummelsburg','Wartenberg'],
      HM:['Biesdorf','Hellersdorf','Kaulsdorf','Mahlsdorf','Marzahn-Hellersdorf','Marzahn'],
      KT:['Adlershof','Altglienicke','Alt-Treptow','Baumschulenweg','Bohnsdorf','Friedrichshagen','Grünau','Johannisthal','Köpenick','Müggelheim','Niederschöneweide','Oberschöneweide','Plänterwald','Rahnsdorf','Schmöckwitz','Treptow-Köpenick'],
      MI:['Friedrichshain-Kreuzberg','Friedrichshain','Gesundbrunnen','Hansaviertel','Kreuzberg','Mitte','Moabit','Tiergarten','Wedding'],
      NK:['Britz','Buckow','Gropiusstadt','Neukölln','Rudow'],
      PW:['Blankenburg','Blankenfelde','Buch','Französisch Buchholz','Heinersdorf','Karow','Niederschönhausen','Pankow','Prenzlauer Berg','Rosenthal','Stadtrandsiedlung Malchow','Weißensee','Wilhelmsruh'],
      RE:['Borsigwalde','Frohnau','Heiligensee','Hermsdorf','Konradshöhe','Lübars','Märkisches Viertel','Reinickendorf','Tegel','Waidmannslust','Wittenau'],
      ST:['Lankwitz','Lichterfelde','Steglitz-Zehlendorf','Steglitz'],
      SV:['Falkenhagener Feld','Gatow','Hakenfelde','Haselhorst','Kladow','Siemensstadt','Spandau','Wilhelmstadt'],
      TH:['Friedenau','Lichtenrade','Mariendorf','Marienfelde','Schöneberg','Tempelhof-Schöneberg','Tempelhof'],
      WI:['Charlottenburg-Wilmersdorf','Grunewald','Halensee','Schmargendorf','Wilmersdorf'],
      ZD:['Dahlem','Nikolassee','Schlachtensee','Steglitz-Zehlendorf','Zehlendorf'],
      DL:['Berlin','Chance der Woche','Stadtspaziergang']
    },
    localityBlacklist:['mitte'], prefixMaxWords:3,
    requireEightDigitId:false, missingIdPlaceholder:'',
    stichwortSuffixes:['zentrum','markt','straße','platz','park','bahnhof','feld','brücke','tunnel','gasse','schaden','schäden','wahl','schule','ferien','fest','kirch','kreuz','turm','bad','bibliothek','messe','bau','club','filiale','heim','stadion','halle','garten','hof','kinder','plan','wache','feuer','wettbewerb','lauf','denkmal','stadtspaziergang','könig','krankheit','schloss','führung','biotop','kiez','treff','streik','betreuung','bühne','szene','woche','monat','jahr','festival','burg','berg','stiftung','ehrung','ausschreibung','weg', 'wind', 'krise' ],
    containsStems:[ {label:'bad',pattern:'b(?:a\nä)d(?:er)?'}, {label:'bahnhof',pattern:'bahnhof'}, {label:'bau',pattern:'bau'}, {label:'brücke',pattern:'brücke'}, {label:'bühne',pattern:'bühne'}, {label:'club',pattern:'club'}, {label:'denkmal',pattern:'denkmal'}, {label:'fest',pattern:'fest'}, {label:'garten',pattern:'garten'}, {label:'heim',pattern:'heim'}, {label:'hof',pattern:'hof'}, {label:'kiez',pattern:'kiez'}, {label:'kinder',pattern:'kinder'}, {label:'kirch',pattern:'kirch'}, {label:'könig',pattern:'könig'}, {label:'kreuz',pattern:'kreuz'}, {label:'lange\u0020nacht',pattern:'lange\u0020nacht'}, {label:'lauf',pattern:'lauf'}, {label:'markt',pattern:'markt'}, {label:'messe',pattern:'messe'}, {label:'park',pattern:'park'}, {label:'plan',pattern:'plan'}, {label:'platz',pattern:'platz'}, {label:'schaden',pattern:'schaden'}, {label:'schul',pattern:'schul'}, {label:'schloss',pattern:'schlo(?:ß\nss)'}, {label:'stadion',pattern:'stadion'}, {label:'straße',pattern:'stra(?:ß\nss)e(?:n)?'}, {label:'treff',pattern:'treff'}, {label:'turm',pattern:'turm'}, {label:'wahl',pattern:'wahl'}, {label:'weg',pattern:'weg'}, {label:'wettbewerb',pattern:'wettbewerb'}, {label:'zentrum',pattern:'zentrum'} ],
    ignoreExact:['bauer','gogol-grützner'],
    CAPTION:{ labelFallbacks:['bildunterschrift','bildunterschriften','bildtext','bildtexte','caption','captions','untertitel','fotounterzeile','bu'], fieldSelectors:['.ProseMirror[contenteditable="true"][aria-label*="bild" i]', '.ProseMirror[contenteditable="true"][aria-label*="caption" i]', '.ProseMirror[contenteditable="true"][aria-label*="bildtext" i]', '.ProseMirror[contenteditable="true"][aria-label*="bildunterschrift" i]', 'textarea[aria-label*="bild" i]', 'textarea[placeholder*="bild" i]', 'textarea[aria-label*="bildtext" i]', 'textarea[aria-label*="bildunterschrift" i]', 'input[aria-label*="bild" i]', 'input[placeholder*="bild" i]', 'input[aria-label*="bildtext" i]', 'input[aria-label*="bildunterschrift" i]'], scanMode:'auto', maxCaptionsPerRun:12 }
  },
  NOTES:{ warnIfNonTrivialExisting:true, tagMaxCount:6, sep:' || ', phraseWholeWord:false, inlineSep:' || ',
          tagJoiner:' | ',
          phrasesDefault:'29. Februar, alles für deutschland, durch den rost, eskimo, getürkt, hitler, gestern, heute, ==morgen==, letzte, mohrenstraße, nächste, neger, selbstmord, suizid, tatsächlich, unserer redaktion, vergasung, vermutlich, wahrscheinlich, zigeuner',
          phrasesExcludeDefault:'guten morgen, morgenpost, morgens',
          tagTableDefault:'BAUEN: abriss, archiologe, architekt, ausgrabung, bagger, bauabnahme, bauantrag, bauarbeit, baubeginn, bauen, baufällig, baugenehmigung, baugrube, bauherr, bauleitung, baumaßnahme, baupläne, baustelle, baustopp, bauverzögerung, bebauung, brückenbau, dachausbau, denkmalschutz, ersatzverkehr, fertigstellung, glasfassade, gleisbau, grundstück, hochbau, immobilie, innenausbau, lückenbau, mietwohnung, modularbau, planfeststellung, randbebauung, restaurierung, richtfest, rückbau, signalbau, spatenstich, sperrung, stahlbeton, straßenbau, streckenausbau, streckenbau, tiefbau, wohnungsbau, wolkenkratzer\nBERLIN: airport, arena, bellevue, berlin, botschaft, brandenburger tor, charité, eats music hall, fanmeile, fernsehturm, flughafen, forst, friedrichstadtpalast, funkturm, hauptbahnhof, hauptstadt, helios, humboldtforum, kanzleramt, karneval, lange nacht, leuchtturm, marathon, mauerfall, mauerweg, museumsinsel, olympia, philarmonie, regierender, reichstag, ringbahn, rotes rathaus, schirmherr, senat, siegessäule, silvester, stadtautobahn, stadtring, tempelhofer feld, tempodrom, tiergarten, tierheim, tierpark, tourismus, touristen, vivantes, vöbb, waldbühne, wiedervereinigung, zoo\nBILDUNG: abitur, abschluss, absolvent, akadem, ausbilder, azubi, bachelor, bildung, deutschkurs, diplom, elternabend, exmatrikulation, expolingua, fakultät, forscher, forscher, forschung, gymnasium, hochschule, hörsaal, jobmedi, jobwunder, klausur, lehramt, lehrstelle, lernen, master, numerus, oberstufe, praktika, praktikum, quereinsteiger, quereinstieg, rechenschwäche, schüler, semester, seminar, sprachkurs, studenten, studium, stuzubi, symposium, universität, unterricht, vhs, volontär, volontariat, wissenschaft, workshop, zeugniss\nBLAULICHT: autorennen, bestechung, blitzer, bombe, brand, dealer, delikt, dieb, drogen, entschärf, erfroren, ertrunken, evakuier, explo, festgenommen, feuerwehreinsatz, freispruch, gestoßen, gestürzt, gewalt, hausbesetzer, illegal, justiz, messer, mord, opfer, polizei, raser, räuber, razzia, reanimation, schmuggel, schüsse, schwerverletzt, sondereinsatz, straftat, täter, tatort, todesfolge, töte, überfall, übergriff, unerlaubt, unfall, unglück, verdächt, vergift, verurteilt, waffe, zoll\nKINDER: arche, baby, basteln, boys, einschulung, ferien, fez, freizeittreff, girls, grundschule, hausaufgaben, hüpfburg, jugend, jungen, karussell, kinder, klassenfahrt, leiheltern, lesepaten, mädchen, mitmach, musikschule, nachhilfe, nachwuchs, pfadfinder, plansche, plüschtier, ponyreiten, puppentheater, rummel, schulanfang, schulbeginn, schülerhilfe, schülerlotse, schulgarten, schwimmkurs, seepferd, seifenkisten, spaßbad, spielen, spielplatz, spielstraße, spielzeug, streichelzoo, taschengeld, teenager, ufafabrik, verkehrslotse, verkehrsschule, zuckerwatte\nKULTUR: aufführung, ausstellung, ballett, bibliothek, buch, bühne, chor, eintritt, event, feiern, festival, feuerwerk, film, freizeit, galerie, kabarett, karten, kino, komödie, konzert, kreative, kultur, kunst, lesung, markt, museen, museum, musical, musik, nacht, opern, orgel, party, planetarium, premiere, programm, rennbahn, revue, show, spaziergang, sternwarte, tänze, theater, ticket, trödel, veranstalt, verlag, vernisage, vortrag, weihnacht\nLEUTE: artist, ausgezeichnet, autor, benannt, beobachtet, biografie, deportiert, eltern, erfinder, erinnerung, erlebt, erzählt, geboren, geburt, gedenken, gegründet, gelebt, gelehrter, gesammelt, geschwister, gestorben, heimat, heirat, hinterblieben, histori, hochzeit, jährig, jubilar, maler, memoiren, migriert, musiker, mutter, persönliche, produzent, regisseur, rückkehr, ruhestätte, schriftsteller, stolperstein, tausendsasser, überleb, vater, verdienste, vergangenheit, verlassen, verlobt, versteckt, weltenbummler, zeitzeuge\nLOKALES: anbindung, anlieger, anwohner, behörde, bezirk, bolzpl, brache, brennpunkt, bürger, dorfanger, dorfkern, einwohner, fahrradstraße, freibad, haltestelle, heimatmuseum, höfe, hotspot, hundeauslauf, kathedrale, kiez, kirche, kita, kleingärten, krankenhaus, kriminalität, lokal, marktplatz, moschee, nachbar, nähe, nahversorg, ordnungs, parkranger, problem, promenade, quartier, rathaus, rohrbruch, schule, schwimmbad, siedlung, stätte, stromausfall, umbenennung, versammlung, viertel, volkspark, wache, wochenmarkt\nPOLITIK: abgeordnete, afd, anfrage, ausschuss, beschluss, bündnis, bürgermeister, bürgersprechstunde, bürokrat, bvv, cdu, christdemo, debatte, demokrat, demonstr, diplomat, extrem, fdp, feindlich, gesetze, gesetzlich, haushaltsplan, haushaltssperre, kandid, kanzler, koalition, kommission, kundge, kürzung, liberale, minister, nominier, opposition, panther, partei, politi, präsident, proteste, provokation, radikal, regier, rüstung, sozialdemo, spd, stadtrat, stellvertret, vorsitz, wahlen, wähler, wehrpflicht\nSERVICE: anmeld, aufruf, auktion, befragung, beteiligung, broschüre, bürgeramt, bürgerbüro, bürgertelefon, bwurl, download, flyer, fördergeld, fundbüro, gewinnspiel, gratis, hotline, informationen, infos, internet, jobcenter, kontakt, kostenfrei, kostenlos, kummer, mail, nummer, öffnungszeit, ombudsstelle, pdf, pflegehilfe, portal, ratgeber, schiedss, schlichter, schlichtung, selbsthilfe, service, silbernetz, sozialladen, sprechstunde, sprechzeit, teilnahme, teilnehm, tourist, verbraucher, verlosung, versteigerung, webseite, website\nSOZIALES: ambulant, armut, barrierearm, barrierefrei, bedürftig, bürgergeld, caritas, diakonie, dlrg, drk, drogenberatung, ehrenamt, engagiert, feuerwehr, freiwillig, gemeinwohl, gesundheitsamt, grundsicherung, handicap, heime, helfe, hitzeplan, hospiz, inklusion, integration, kältehilfe, klinik, kranker, lageso, migra, obdach, opferhilfe, paliativ, patientenberatung, samariter, schuldnerberatung, seelsorge, seniorenhilfe, silbernet, solidarität, sozial, spende, stationär, stiftung, stützpunkt, suchthilfe, tafel, unterstütz, versicher, wohngeld\nSPORT: alba, athlet, bäder, becken, billard, boxen, bundesliga, eisbären, eiskunstlauf, finale, fitness, füchse, fußball, handball, hertha, hockey, istaf, judo, karate, landesliga, läufer, leistungsschau, mannschaft, medaille, meisterschaft, parcour, pferde, rekord, ruder, schach, schwimm, segel, sommerspiele, sport, sporthalle, stadion, tennis, titelkampf, titelvertei, trainer, training, triat, turnhalle, turnier, volley, wasserball, wettrennen, winterspiele, workout, zehnkampf\nUMWELT: abfall, abgase, abwasser, artenschutz, aufforst, bäume, begrünung, bienen, biotop, brunnen, dünger, düngung, energie, erneuerbare, fällarbeiten, fällungen, flora, gewässer, grünanlage, hitze, kläranlage, klärwerk, klima, lärmschutz, müll, nachhaltig, natur, ökolog, pestizid, pflanz, pfuhl, photovoltaik, regenwasser, repair, reservat, rieselfeld, schadstoff, schreberg, schwamm, solar, starkregen, strom, stürme, treibhaus, umwelt, vogelschutz, wasser, wetter, windkraft, windräder\nVERKEHR: abschlepp, abzweig, ampel, autobahn, avus, bahn, bike, brücke, busse, bvg, dreieck, eisenbahn, elterntaxi, fähre, fahrrad, fahrzeug, flieg, flug, fuhrpark, garage, geschwindigkeit, jelbi, knöllchen, kontrolle, kreuzung, linie, lkw, öpnv, padelec, pkw, poller, roller, s-bahn, schiene, schulweg, scooter, shuttle, spurig, stellpl, stvo, tram, transport, tunnel, u-bahn, überweg, umleitung, verbindung, verkehr, zebrastreifen, züge\nWIRTSCHAFT: angestellte, arbeit, autovermiet, bankrott, baumarkt, baumärkte, business, center, dienstleist, discounter, erfolgsgeschichte, fachkräfte, firma, frainchise, funding, gastro, geschäft, gewerb, gewerkschaft, händler, handwerk, hotel, imbiss, industrie, insolvenz, investi, käufer, konkurs, kunde, kundschaft, lieferdienst, marken, markthalle, neueröffn, passage, produkte, räumungsverkauf, schließung, schwarzarbeit, sortiment, späti, start-up, steuer, streik, umsatz, unternehme, verkaufsfläche, warenh, wiedereröffn, wirtschaft' },
  SITE:{ id:'PEIQ_PPS', saveButtonSelector:'button.preSaveButton' }
};

/****************************
 * Utils
 *****************************/
function deepMerge(base, over){ if(Array.isArray(base)&&Array.isArray(over)) return over??base; if(typeof base==='object'&&typeof over==='object'&&base&&over){ const out={...base}; for(const k of Object.keys(over)) out[k]=deepMerge(base[k], over[k]); return out; } return over??base; }
function loadCfg(){ const raw=(typeof GM_getValue==='function')? GM_getValue(SMX_STORE_KEYS.SETTINGS,'{}'):'{}'; let user; try{ user=JSON.parse(raw);}catch{ user={}; } return deepMerge(CFG_DEFAULTS, user); }
function saveCfg(cfg){ if(typeof GM_setValue==='function') GM_setValue(SMX_STORE_KEYS.SETTINGS, JSON.stringify(cfg)); }
let CFG = loadCfg();
const qs=(s,r=document)=>r.querySelector(s); const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
const isVisible=el=>{ if(!el) return false; const r=el.getBoundingClientRect(); const st=getComputedStyle(el); return (r.width&&r.height)&&st.visibility!=='hidden'&&st.display!=='none'&&st.opacity!=='0'; };
function clickChain(el){ const fire=t=>el?.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); try{fire('pointerdown');fire('mousedown');fire('mouseup');fire('click');}catch{el?.click?.();}}
function smxToast(msg,ms=1600){ try{ const t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;right:18px;top:18px;z-index:2147483647;background:#0b1e2d;color:#fff;border:1px solid #0d3a5c;border-radius:8px;padding:8px 10px;font:12.5px/1.35 system-ui,Segoe UI,Arial;box-shadow:0 6px 18px rgba(0,0,0,.25);opacity:.98;transition:opacity .35s ease'; document.body.appendChild(t); setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 380); }, ms);}catch{} }
function smxCreateOverlayBox(html){ const wrap=document.createElement('div'); wrap.style.cssText='position:fixed; inset:0; z-index:2147483647; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.35)'; const box=document.createElement('div'); box.style.cssText='background:#0b1e2d; color:#fff; border:1px solid #0d3a5c; border-radius:12px; max-width:820px; width:min(96vw,820px); box-shadow:0 12px 36px rgba(0,0,0,.4); font:13px/1.4 system-ui, Segoe UI, Arial; padding:14px;'; box.innerHTML=html; wrap.appendChild(box); document.body.appendChild(wrap); return {wrap, box}; }

/****************************
 * RegEx Engine
 *****************************/
function compileRegexRules(specs){ return (specs??[]).map(o=>{ if(Array.isArray(o)&&o[0] instanceof RegExp) return o; if(o&&o.re instanceof RegExp) return [o.re, String(o.replacement??'')]; const pat=String(o?.pattern??''); let flags=String(o?.flags??'gu'); if(!flags.includes('g')) flags+='g'; flags=Array.from(new Set(flags.split(''))).join(''); return [ new RegExp(pat, flags), String(o?.replacement??'') ]; }); }
let baseReplacements=compileRegexRules(CFG.REGEX.base); let hashtagReplacements=compileRegexRules(CFG.REGEX.hashtag);
function applyReplacements(text, rules) {
  let out = text;
  rules.forEach(([pattern, replacement]) => {
    out = out.replace(pattern, (...args) => {
      // args = [match, g1, g2, ..., offset, input, groups?]
      const maybeGroups = args[args.length - 1];
      const hasGroupsObj = (maybeGroups && typeof maybeGroups === 'object' && !(maybeGroups instanceof String));
      const capCount = args.length - (hasGroupsObj ? 3 : 2);
      return String(replacement).replace(/\$\((\d+)\)/g, (_m, n) => {
        const i = parseInt(n, 10);
        if (!Number.isFinite(i) || i < 1 || i > capCount) return '';
        const v = args[i];
        return (v == null) ? '' : String(v);
      });
    });
  });
  return out;
}
function replaceTextNodesWithRules(el, rules){
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  let n, changed = false;
  while ((n = w.nextNode())) {
    const orig = n.nodeValue;
    const rep  = applyReplacements(orig, rules);
    if (rep !== orig) {
      n.nodeValue = rep; // only text node content changes → structure/marks stay
      changed = true;
    }
  }
  return changed;
}
function forcePreviewRefresh(pm){ try{ if(!pm) return; pm.blur(); pm.dispatchEvent(new Event('blur',{bubbles:true})); setTimeout(()=>{ pm.focus(); pm.dispatchEvent(new InputEvent('input',{bubbles:true})); pm.dispatchEvent(new Event('change',{bubbles:true})); }, 15);}catch{} }
function reactSafeReplaceInPM(el, rules){
  if (!el) return false;
  let target = el;
  if (!target.isContentEditable) {
    const inner = el.querySelector?.('[contenteditable="true"]');
    if (inner) target = inner;
  }
  if (!target || !target.isContentEditable) return false;

  // Replace text-node-wise → preserve formatting/paragraphs/links
  const changed = replaceTextNodesWithRules(target, rules);

  if (changed) {
    try { target.dispatchEvent(new InputEvent('input', {bubbles:true})); } catch {}
    try { target.dispatchEvent(new Event('change', {bubbles:true})); } catch {}
    forcePreviewRefresh(target);
  }
  return changed;
}
function replaceInputWithRules(input, rules){ if(!input || typeof input.value!=='string') return false; const orig=input.value; const upd=applyReplacements(orig, rules); if(upd!==orig){ input.value=upd; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; } return false; }
function setCursorToEnd(el){ if(!el) return; let target=el; if(!target.isContentEditable){ const inner=el.querySelector?.('[contenteditable="true"]'); if(inner) target=inner; } if(!target || !target.isContentEditable) return; const range=document.createRange(); range.selectNodeContents(target); range.collapse(false); const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }

/*************************************
 * SuperMAX-Menü (Einstellungen)
 *************************************/
GM_registerMenuCommand('SuperMAX – Einstellungen', ()=>{
  try{ const box=document.createElement('div'); box.style.cssText='position:fixed;right:18px;top:18px;z-index:2147483647;background:#0b1e2d;color:#fff;border:1px solid #0d3a5c;border-radius:10px;padding:14px;max-width:560px;font:13px/1.35 system-ui,Segoe UI,Arial'; box.innerHTML=`
    <div style="font-weight:700;margin-bottom:8px">SuperMAX – Einstellungen</div>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperMAX-OneClick </b>(STRG+S)</li>
        <li><input type="checkbox" id="smx_opt_hash" style="transform:translateY(1px)"/> Hashtag-Regeln mitlaufen lassen</li>
    </ul>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperRED </b>(STRG+ALT+R)</li>
      <li>Vorlage für Artikelbeschreibung wählen:</li>
        <select id="smx_fn_order" style="width:100%;padding:6px;border-radius:6px;background:#07233a;color:#fff;border:1px solid #0d3a5c">
          <option value="H">KW#AKZ_12345678_Überschrift (Stichwort)</option>
          <option value="S">KW#AKZ_12345678_Stichwort (Überschrift)</option>
          <option value="S!">KW#AKZ_12345678_Stichwort</option>
      </select>
    </ul>
    <div style="margin-top:12px">
      <button id="smx_cfg_save" style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">Speichern</button>
      <button id="smx_cfg_cancel" style="margin-left:6px;background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">Abbrechen</button>
    </div>
    </div>`;
    document.body.appendChild(box);
    box.querySelector('#smx_fn_order').value = CFG.SUPERRED.filenameOrder;
    box.querySelector('#smx_opt_hash').checked = !!CFG.FEATURES.runHashtagOnOneClick;
    const close=()=>{ try{ box.remove(); }catch{} };
    box.querySelector('#smx_cfg_cancel').addEventListener('click', close);
    box.querySelector('#smx_cfg_save').addEventListener('click', ()=>{ CFG.SUPERRED.filenameOrder = box.querySelector('#smx_fn_order').value; CFG.FEATURES.runHashtagOnOneClick = !!box.querySelector('#smx_opt_hash').checked; saveCfg(CFG); close(); smxToast('SuperMAX: Einstellungen gespeichert.'); });
  }catch(err){ console.error('Settings-Dialog Fehler:', err); smxToast('Einstellungen konnten nicht geöffnet werden.'); }
});
GM_registerMenuCommand('SuperMAX – Tastaturkürzel', ()=>{
  try{ const box=document.createElement('div'); box.style.cssText='position:fixed;right:18px;top:18px;z-index:2147483647;background:#0b1e2d;color:#fff;border:1px solid #0d3a5c;border-radius:10px;padding:14px;max-width:560px;font:13px/1.35 system-ui,Segoe UI,Arial'; box.innerHTML=`
    <div style="font-weight:700;margin-bottom:8px">SuperMAX – Tastaturkürzel</div>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperMAX Tastaturkürzel:</b></li>
      <li>STRG+S > OneClick</li>
      <li>• SuperERASER → SuperMAX* → SuperRED</li>
      <li>• SuperLINK → SuperMAX* → SuperRED</li>
      <li>STRG+ALT+S > *Hashtag-Textphrasen ersetzen</li>
    </ul>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperERASER Tastaturkürzel:</b></li>
      <li>STRG+E > Umbrüche, Makros und Links entfernen</li>
    </ul>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperLINK Tastaturkürzel:</b></li>
      <li>STRG+ALT+L > URL kürzen mit YOURLS</li>
      <li>Menü > YOURLS-Token setzen/anzeigen/löschen</li>
    </ul>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperPORT Tastaturkürzel:</b></li>
      <li>STRG+ALT+P > Artikel an Zwischenablage</li>
      <li>STRG+V > Artikel aus Zwischenablage</li>
      <li>STRG+ALT+P > Artikel an Redaktionssystem</li>
    </ul>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperRED Tastaturkürzel:</b></li>
      <li>STRG+ALT+R > Artikelbeschreibung erzeugen</li>
      <li>STRG+ALT+R > Notizen mit Textanalyse erzeugen</li>
    </ul>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>Auch hilfreich im PPS Texteditor:</b></li>
      <li>STRG+A > Alles markieren</li>
      <li>STRG+C > Auswahl kopieren</li>
      <li>STRG+X > Auswahl ausschneiden</li>
      <li>STRG+V > Auswahl einfügen</li>
      <li>STRG+Z > Aktion rückgängig machen</li>
      <li>STRG+Y > Aktion wieder herstellen</li>
      <li>STRG+SHIFT+S > Speichern und schließen</li>
    </ul>
    <div style="margin-top:12px"><button id="smx_cfg_cancel" style="margin-left:6px;background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">Schließen</button></div>`;
   document.body.appendChild(box); const close=()=>{ try{ box.remove(); }catch{} }; box.querySelector('#smx_cfg_cancel').addEventListener('click', close); }catch(err){ console.error('Shortcut-Menü Fehler:', err); }
});
GM_registerMenuCommand('SuperLINK – Token-Setting', () => {
  try { openSuperLinkSettingsOverlay(); }
  catch { smxToast('SuperLINK: Overlay-Fehler.'); }

function openSuperLinkSettingsOverlay() {
  const KEY = SMX_STORE_KEYS.YOURLS_TOKEN;
  const current = (typeof GM_getValue === 'function') ? GM_getValue(KEY, '') : '';

  const html = `
    <div style="font-weight:700;margin-bottom:8px">SuperLINK – Token-Setting</div>
    <div style="opacity:.9;margin-bottom:10px">
      Hier kannst Du den <b>YOURLS-Token</b> für <code>bwurl.de</code> hinterlegen, testen und verwalten.
    </div>
    <label style="display:block;margin:8px 0 6px;opacity:.9">Token</label>
    <div style="display:flex;gap:8px;align-items:center">
      <input id="smx_sl_token" type="password"
             value="${current ? String(current).replace(/"/g,'&quot;') : ''}"
             style="flex:1 1 auto;background:#061826;color:#fff;border:1px solid #12456a;border-radius:6px;padding:8px 10px;outline:none">
      <button id="smx_sl_show"  style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">anzeigen</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center">
      <button id="smx_sl_save"   style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Speichern</button>
      <button id="smx_sl_test"   style="background:#3a6fb0;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Token testen</button>
      <button id="smx_sl_copy"   style="background:#3a6fb0;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Kopieren</button>
      <button id="smx_sl_paste"  style="background:#3a6fb0;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Einfügen</button>
      <button id="smx_sl_clear"  style="background:#b03a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Löschen</button>
      <div id="smx_sl_status"    style="margin-left:auto;min-height:20px;opacity:.95"></div>
    </div>
    <div style="margin-top:14px;text-align:right">
      <button id="smx_sl_close"  style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Schließen</button>
    </div>
  `;

  const { wrap, box } = smxCreateOverlayBox(html);
  const $ = (sel) => box.querySelector(sel);
  const input = $('#smx_sl_token');
  const statusEl = $('#smx_sl_status');

  function setStatus(msg, type = 'info') {
    // type: info | ok | err
    const color = type === 'ok' ? '#8bc34a' : (type === 'err' ? '#ff5252' : '#cfd8dc');
    statusEl.innerHTML = `<span style="color:${color}">${msg || ''}</span>`;
  }

  function persistToken(val) {
    try { GM_setValue(KEY, String(val || '')); smxToast('Token gespeichert.'); }
    catch { smxToast('Fehler beim Speichern.'); }
  }

  async function copyToken() {
    try {
      await navigator.clipboard?.writeText(input.value || '');
      smxToast('Token kopiert.');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = input.value || '';
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); smxToast('Token kopiert.'); }
      catch { smxToast('Kopieren fehlgeschlagen.'); }
      finally { ta.remove(); }
    }
  }

  async function pasteToken() {
    try {
      const txt = await navigator.clipboard?.readText?.();
      if (txt != null) { input.value = (txt || '').trim(); smxToast('Token eingefügt.'); }
      else smxToast('Zwischenablage leer oder blockiert.');
    } catch { smxToast('Einfügen nicht möglich.'); }
  }

  function testToken() {
    const tok = (input.value || '').trim();
    if (!tok) { setStatus('Kein Token eingegeben.', 'err'); return; }

    const btn = $('#smx_sl_test');
    btn.disabled = true; setStatus('Teste Token …', 'info');

    const testUrl = 'https://example.com/?smx_test=' + Date.now();
    const api = 'https://bwurl.de/yourls-api.php?action=shorturl&format=simple'
              + '&signature=' + encodeURIComponent(tok)
              + '&url=' + encodeURIComponent(testUrl);

    try {
      GM_xmlhttpRequest({
        method: 'GET',
        url: api,
        onload: (resp) => {
          btn.disabled = false;
          const out = (resp.responseText || '').trim();
          if (/^https?:\/\/\S+$/.test(out)) {
            setStatus('Token ok ✓', 'ok');
          } else {
            setStatus('Token ungültig (Antwort unerwartet).', 'err');
          }
        },
        onerror: () => { btn.disabled = false; setStatus('Netzwerk-/API-Fehler.', 'err'); }
      });
    } catch {
      btn.disabled = false; setStatus('Request nicht möglich.', 'err');
    }
  }

  // UI-Events
  $('#smx_sl_show')?.addEventListener('click', () => {
    const t = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', t);
    $('#smx_sl_show').textContent = (t === 'password') ? 'anzeigen' : 'verbergen';
  });

  $('#smx_sl_save')?.addEventListener('click', () => {
    persistToken(input.value.trim());
    setStatus('Gespeichert.', 'ok');
  });

  $('#smx_sl_test')?.addEventListener('click', testToken);
  $('#smx_sl_copy')?.addEventListener('click', copyToken);
  $('#smx_sl_paste')?.addEventListener('click', pasteToken);

  $('#smx_sl_clear')?.addEventListener('click', () => {
    input.value = '';
    persistToken('');
    setStatus('Token gelöscht.', 'ok');
  });

  $('#smx_sl_close')?.addEventListener('click', () => wrap.remove());
  wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });

  // Tastatur-Shortcuts (Enter = speichern, ESC = schließen)
  document.addEventListener('keydown', function onKey(e) {
    if (!document.body.contains(wrap)) { document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape') { e.preventDefault(); wrap.remove(); document.removeEventListener('keydown', onKey); }
    if (e.key === 'Enter')  { e.preventDefault(); $('#smx_sl_save').click(); }
  });

  // Fokus ins Feld
  setTimeout(() => input?.focus?.(), 50);
}
});
GM_registerMenuCommand('SuperPORT – Zwischenablage (Vorschau)', ()=>{ try{ runSuperPORT(); }catch{ smxToast('SuperPORT: nicht verfügbar.'); } });

/****************************
 * SuperLINK + SuperERASER
 *****************************/
function performSuperEraserOnSelection(){ const sel=window.getSelection(); const range=sel?.rangeCount>0? sel.getRangeAt(0):null; const txt=sel?.toString()||''; if(!range || !txt.trim()){ smxToast('SuperERASER: Bitte Text auswählen.'); return false; } const cleaned = txt.replace(/(\r\n|\n|\r)/gm,' ').replace(/[\u200B\uFEFF]/g,'').replace(/<o:p>.*?<\/o:p>/gi,'').replace(/<span[^>]*mso-[^>]*>.*?<\/span>/gi,'').replace(/\s{2,}/g,' ').trim(); try{ range.deleteContents(); range.insertNode(document.createTextNode(cleaned)); sel.removeAllRanges(); }catch{ document.execCommand('insertText', false, cleaned); } const pm=document.activeElement?.closest?.('.ProseMirror[contenteditable="true"], [contenteditable="true"]'); if(pm) forcePreviewRefresh(pm); return true; }
window.addEventListener('keydown', e=>{ if(e.ctrlKey && !e.altKey && e.key.toLowerCase()==='e'){ e.preventDefault(); performSuperEraserOnSelection(); } }, true);
async function performShortenSelectedUrl(){ const active=document.activeElement; if(!active){ smxToast('SuperLINK: Kein aktives Feld.'); return false; } const sel=window.getSelection(); const range=sel?.rangeCount>0? sel.getRangeAt(0):null; const raw=(sel?.toString()||'').trim(); if(!range||!raw){ smxToast('SuperLINK: Keine URL markiert.'); return false; } let url=raw; if(!/^https?:\/\//i.test(url)) url='https://'+url; if(!/^https?:\/\/\S+$/.test(url)){ smxToast('SuperLINK: Ungültige URL.'); return false; } const signature=GM_getValue(SMX_STORE_KEYS.YOURLS_TOKEN,''); if(!signature){ smxToast('SuperLINK: Kein YOURLS-Token gesetzt.'); return false; } const api='https://bwurl.de/yourls-api.php?action=shorturl&format=simple&signature='+encodeURIComponent(signature)+'&url='+encodeURIComponent(url); return new Promise((resolve)=>{ GM_xmlhttpRequest({ method:'GET', url: api, onload: resp=>{ const shortUrl=(resp.responseText||'').trim(); if(/^https?:\/\/\S+$/.test(shortUrl)){ try{ range.deleteContents(); range.insertNode(document.createTextNode(shortUrl)); window.getSelection().removeAllRanges(); }catch{ document.execCommand('insertText', false, shortUrl); } smxToast('SuperLINK: ShortURL eingefügt.'); resolve(true); } else { smxToast('SuperLINK: Ungültige YOURLS-Antwort.'); resolve(false); } }, onerror: ()=>{ smxToast('SuperLINK: Verbindungsfehler.'); resolve(false); } }); }); }
window.addEventListener('keydown', e=>{ const k=e.key?.toLowerCase?.()||''; if((e.ctrlKey&&e.altKey&&k==='l')||(e.ctrlKey&&e.shiftKey&&k==='l')){ e.preventDefault(); performShortenSelectedUrl(); } }, true);

/****************************
 * SuperRED + NOTES (vollständig)
 *****************************/
(function(){
 'use strict';
 console.log('[SuperRED] 4.3.1 geladen @', location.href);
 function normalizeSpace(s){ return (s??'').replace(/[\u00A0\u2005]/g,' ').replace(/\s+/g,' ').trim(); }
 const deepQSA=(selector, root=document)=>{ const out=new Set(); function walk(n){ if(!n) return; if(n.querySelectorAll) n.querySelectorAll(selector).forEach(el=>out.add(el)); const all=n.querySelectorAll? n.querySelectorAll('*'):[]; all.forEach(el=>{ if(el.shadowRoot) walk(el.shadowRoot);}); } walk(root); return Array.from(out); };
 const deepQS=(selector, root=document)=>{ const list=deepQSA(selector, root); return list.length? list[0]:null; };
 const textFromProseMirror=(el)=>{ if(!el) return ''; const clone=el.cloneNode(true); clone.querySelectorAll('a').forEach(a=>a.replaceWith(document.createTextNode(a.textContent||''))); return normalizeSpace(clone.innerText||clone.textContent||''); };
 const SUPERRED_CONFIG={ navSelectors:{ headline:'#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect[data-label="headline"]', subline:'#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect[data-label="subheadline"]', body:'#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect[data-label="text"]' }, labelFallbacks:{ headline:['überschrift','headline','titel'], subline:['unterzeile','subheadline','vorspann','teaser'], body:['text','fließtext','body','artikeltext'], caption:(CFG.SUPERRED.CAPTION?.labelFallbacks)||['bildunterschrift','bildtext','caption','untertitel','fotounterzeile','bu'] }, timeouts:{ pmMount:4400, between:60 } };
 async function waitFor(checkFn, timeoutMs=2800, intervalMs=70){ return new Promise((resolve,reject)=>{ const start=performance.now(); (function loop(){ try{ const val=checkFn(); if(val) return resolve(val);}catch{} if(performance.now()-start>=timeoutMs) return reject(new Error('waitFor: timeout')); setTimeout(loop, intervalMs); })(); }); }
 function getActivePM(){ const pms=deepQSA('.ProseMirror[contenteditable="true"]').filter(isVisible); return pms[0]||null; }
 async function waitForActivePM(){ await new Promise(r=>setTimeout(r, SUPERRED_CONFIG.timeouts.between)); const pm=await waitFor(()=>{ const el=getActivePM(); return el&&isVisible(el)? el:null; }, SUPERRED_CONFIG.timeouts.pmMount, 70); await new Promise(r=>setTimeout(r,40)); return pm; }
 // Caption-Erkennung
 const CAPTION_CFG={ ...CFG.SUPERRED.CAPTION };
 const _norm=s=>(s||'').toLowerCase().trim();
 function getAssociatedLabelText(el){ try{ const id=el.getAttribute?.('id'); if(id){ const lab=document.querySelector(`label[for="${CSS.escape(id)}"]`); if(lab) return _norm(lab.textContent); } }catch{} const scope=el.closest('li,section,fieldset,form,div')||el.parentElement; const lab2=scope?.querySelector('label'); return _norm(lab2?.textContent||''); }
 function looksLikeCaptionText(s){ const t = String(s ?? '').toLowerCase(); return /\bbildunterschrift\b|\bbildtext\b|\bfoto[-\s]?unterschrift\b|\bfotounterzeile\b|\bcaption\b/.test(t) || /(?:bild|foto).{0,20}(?:unter|text)/.test(t); }
 function isCaptionFieldElement(el){ const a=_norm(el.getAttribute?.('aria-label')||''); const p=_norm(el.getAttribute?.('placeholder')||''); const t=_norm(el.getAttribute?.('title')||''); const l=getAssociatedLabelText(el); return looksLikeCaptionText(a)||looksLikeCaptionText(p)||looksLikeCaptionText(t)||looksLikeCaptionText(l); }
 function findCaptionDirectFields(){ const set=new Set(); for(const s of (CAPTION_CFG.fieldSelectors||[])){ for(const el of document.querySelectorAll(s)){ if(isVisible(el)) set.add(el); } } return Array.from(set).map(el=>({ el, isPM: !!el.isContentEditable })); }
 function findImageModuleNavButtons(){ const clickables=Array.from(document.querySelectorAll('#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect,button,[role="button"],a,.nav-item,.tab,.toggleBox,.toggleBoxIcon,[data-uid],[data-label]')).filter(isVisible); const out=[]; for(const el of clickables){ const hay=`${_norm(el.textContent)} ${_norm(el.getAttribute?.('aria-label'))} ${_norm(el.getAttribute?.('data-label'))}`.trim(); if (/^bild(\s*\d+)?$/.test(hay) || /\bbild\s*\d\b/.test(hay) || (/\bbild\b/.test(hay) && !/(fließ)?text|body/.test(hay))) out.push(el); } return Array.from(new Set(out)); }
 async function collectCaptionFieldsInActiveView(){ const found=[]; const pms=Array.from(document.querySelectorAll('.ProseMirror[contenteditable="true"]')).filter(isVisible); for(const pm of pms){ if(isCaptionFieldElement(pm)) found.push({ el: pm, isPM: true }); } const tfs=Array.from(document.querySelectorAll('textarea,input')).filter(isVisible); for(const el of tfs){ if(isCaptionFieldElement(el)) found.push({ el, isPM: false }); } const uniq=[]; const seen=new Set(); for(const it of found){ const key=(it.isPM?'pm:':'tf:')+(it.el.id||it.el.name||it.el.getAttribute?.('aria-label')||it.el.getAttribute?.('placeholder')||it.el.outerHTML.slice(0,120)); if(!seen.has(key)){ seen.add(key); uniq.push(it); } } return uniq; }
 async function findCaptionEditorsDeep(opts={scanMode: CAPTION_CFG.scanMode||'auto'}){
  const editors=[]; const direct=findCaptionDirectFields();
  if(direct.length){ editors.push(...direct); if(opts.scanMode==='auto'||opts.scanMode==='directOnly') return editors; }
  if(opts.scanMode==='directOnly') return editors;
  const navs=findImageModuleNavButtons(); const limit=Math.max(1, Math.min(navs.length, CAPTION_CFG.maxCaptionsPerRun||12));
  for(const btn of navs.slice(0,limit)){
    try{ clickChain(btn); await waitForActivePM(); const fields=await collectCaptionFieldsInActiveView(); if(fields.length) editors.push(...fields); }catch{}
  }
  const uniq=[]; const seen=new Set();
  for(const it of editors){ const key=(it.isPM?'pm:':'tf:')+(it.el.id||it.el.name||it.el.getAttribute?.('aria-label')||it.el.getAttribute?.('placeholder')||it.el.outerHTML.slice(0,120)); if(!seen.has(key)){ seen.add(key); uniq.push(it); } }
  return uniq;
 }

 // NEU: BU-RegEx via Editor-API / Layout-Kacheln (data-uid)
 async function applyRegexToCaptionsViaLayoutBoxes(mode='both'){
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const sanitize=s=>(s??'').toLowerCase();
  function looksLikeImageBox(el){ const hay=[sanitize(el.getAttribute?.('aria-label')),sanitize(el.getAttribute?.('data-label')),sanitize(el.textContent),sanitize(el.title)].join(' '); if(/\bbild\b/.test(hay)) return true; const near=el.closest?.('li,section,article,div'); const lab=near?.querySelector?.('label,[data-label],[title]'); const labTxt=(sanitize(lab?.getAttribute?.('data-label'))+' '+sanitize(lab?.textContent)+' '+sanitize(lab?.title)); return /\bbild\b/.test(labTxt); }
  function findLayoutImageBoxes(){ const all=deepQSA('[data-uid]'); const vis=all.filter(isVisible); const img=vis.filter(looksLikeImageBox); const seen=new Set(); const out=[]; for(const el of img){ const uid=el.getAttribute('data-uid')||el.id||el.outerHTML.slice(0,80); if(!seen.has(uid)){ seen.add(uid); out.push(el);} } return out; }
  async function applyOnFields(fields){ let local=0; for(const it of fields){ const el=it.el; if(it.isPM){ if(mode==='both'||mode==='baseOnly') if(reactSafeReplaceInPM(el, baseReplacements)) local++; if(mode==='both'||mode==='hashtagOnly') if(reactSafeReplaceInPM(el, hashtagReplacements)) local++; } else { if(mode==='both'||mode==='baseOnly') if(replaceInputWithRules(el, baseReplacements)) local++; if(mode==='both'||mode==='hashtagOnly') if(replaceInputWithRules(el, hashtagReplacements)) local++; } } return local; }
  async function tryEditorApiRoundtrip(){ try{ const EC=window.EditorController? new window.EditorController():null; const EV=window.EditorView? new window.EditorView():null; if(!EC?.getModuleItems) return 0; const moduleItems=await new Promise((res,rej)=>EC.getModuleItems().done(res).fail(rej)); const candidates=[]; if(typeof moduleItems.getElementsByKey==='function'){ const tryLabels=['Bild 1','Bild 2','Bild 3','Bild','Foto','Image']; for(const lab of tryLabels){ const arr=moduleItems.getElementsByKey('LABEL', lab)||[]; arr.forEach(x=>candidates.push(x)); } }
    const seen=new Set(); const uniq=[]; for(const it of candidates){ const uid=it?.UID ?? it?.id ?? JSON.stringify(it).slice(0,80); if(!seen.has(uid)){ seen.add(uid); uniq.push(it);} }
    let changes=0; for(const item of uniq){ try{ await new Promise((res)=> item.showFormView().done(()=>res(true))); try{ const layoutView=item.getView?.('layout'); layoutView?.select?.(); layoutView?.addClass?.('foreground'); EV?.onChangeZoom?.(EV?.getSelectedZoom?.(), [document.querySelector('#layoutScrollArea')?.scrollLeft||0, document.querySelector('#layoutScrollArea')?.scrollTop||0]); }catch{} await waitForActivePM(); const fields=await collectCaptionFieldsInActiveView(); changes+=await applyOnFields(fields); await sleep(30);}catch{} }
    return changes; }catch{ return 0; } }
  let total=0; total+=await tryEditorApiRoundtrip();
  const boxes=findLayoutImageBoxes(); for(const box of boxes){ try{ clickChain(box); await waitForActivePM(); const fields=await collectCaptionFieldsInActiveView(); total+=await applyOnFields(fields); await sleep(30);}catch{} }
  return total;
 }

 // Navigation: Head/Sub/Body einlesen
 function findNavButtonByText(options){ const candidates=[ ...deepQSA('#jsFragments #texts li.jsModuleItem'), ...deepQSA('button,[role="button"],a,.nav-item,.tab,.toggleBox,.toggleBoxIcon,[data-uid]') ].filter(isVisible); const norm=t=>normalizeSpace(t).toLowerCase(); for(const el of candidates){ const txt=norm(el.textContent||''); const aria=norm(el.getAttribute?.('aria-label')||el.getAttribute?.('data-label')||''); for(const label of options){ const l=norm(label); if((txt && txt===l) || (aria && aria===l)) return el; } } for(const el of candidates){ const txt=norm(el.textContent||''); const aria=norm(el.getAttribute?.('aria-label')||el.getAttribute?.('data-label')||''); for(const label of options){ const l=norm(label); if((txt && txt.includes(l)) || (aria && aria.includes(l))) return el; } } return null; }
 function findAllNavButtons(){ const sp={ headline: deepQS(SUPERRED_CONFIG.navSelectors.headline)||qs(SUPERRED_CONFIG.navSelectors.headline), subline: deepQS(SUPERRED_CONFIG.navSelectors.subline)||qs(SUPERRED_CONFIG.navSelectors.subline), body: deepQS(SUPERRED_CONFIG.navSelectors.body)||qs(SUPERRED_CONFIG.navSelectors.body) }; const haveAll=sp.headline&&sp.subline&&sp.body; if(haveAll) return sp; const fb=SUPERRED_CONFIG.labelFallbacks; return { headline: sp.headline||findNavButtonByText(fb.headline), subline: sp.subline||findNavButtonByText(fb.subline), body: sp.body||findNavButtonByText(fb.body) };
 }
 async function captureAllThree(){ const btns=findAllNavButtons(); const out={ headline:'', subline:'', body:''}; const steps=[ {key:'headline',label:'Überschrift',btn:btns.headline}, {key:'subline',label:'Unterzeile',btn:btns.subline}, {key:'body',label:'Text',btn:btns.body} ]; for(const st of steps){ if(!st.btn) continue; try{ clickChain(st.btn); const pm=await waitForActivePM(); const txt=textFromProseMirror(pm); out[st.key]=txt; }catch{} } return out; }

 // RED/NOTES Helfer
 const AUSGABE_MAP = CFG.SUPERRED.editionMap||{};
 const CANONICAL_LOCALITY_TO_CODES=new Map(); const LOCALITY_NAMES_CANONICAL=[];
 (function buildLocalityIndex(){ const canon=(s)=> (s??'').toLowerCase().normalize('NFC').replace(/[.,:;!?)[\]]+$/g,'').replace(/[\s\-]+/g,' ').trim(); for (const [code,list] of Object.entries(AUSGABE_MAP)){ for(const raw of list){ const key=canon(raw); if(!CANONICAL_LOCALITY_TO_CODES.has(key)) CANONICAL_LOCALITY_TO_CODES.set(key,new Set()); CANONICAL_LOCALITY_TO_CODES.get(key).add(code);} } LOCALITY_NAMES_CANONICAL.push(...CANONICAL_LOCALITY_TO_CODES.keys()); LOCALITY_NAMES_CANONICAL.sort((a,b)=>b.length-a.length); })();
 const LOCALITY_KEYS_SET=new Set(LOCALITY_NAMES_CANONICAL); const canonLoc=s=>(s??'').toLowerCase().normalize('NFC').replace(/[.,:;!?)[\]]+$/g,'').replace(/[\s\-]+/g,' ').trim(); const isLocalityPhrase=s=>LOCALITY_KEYS_SET.has(canonLoc(s));
 function containsExclusiveDL(values){ const needles=['chance der woche','stadtspaziergang']; const canon=s=>(s??'').toLowerCase().normalize('NFC'); const hay=canon(values.subline)+'\n'+canon(values.body); return needles.some(n=>hay.includes(n)); }
 function matchLocalityAtStart(text, maxWords=(CFG.SUPERRED.prefixMaxWords??3)){ if(!text) return null; const cleaned = text.trim().replace(/^[\s"'„‚‘’»«(\[]+/, ''); const tokens=cleaned.split(/\s+/).map(t=>t.replace(/^["'„‚‘’»«(\[]+|[)"“”‚‘’»«:.;,!?]+$/g,'')); const n=Math.min(tokens.length, Math.max(1, maxWords)); for(let take=n; take>=1; take--){ const phrase=tokens.slice(0,take).join(' '); const key=canonLoc(phrase); const codesSet=CANONICAL_LOCALITY_TO_CODES.get(key); if(codesSet&&codesSet.size) return { phrase, codes:Array.from(codesSet) }; } return null; }
 function findLocalitiesInText(text){ const res=[]; if(!text) return res; const norm=(text??'').normalize('NFC').toLowerCase().replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g,' ').replace(/[–—]/g,'-').replace(/\s+/g,' '); for(const nameKey of LOCALITY_NAMES_CANONICAL){ const pattern=nameKey.replace(/ /g,'[\s\-]+'); const re=new RegExp(`(?:^|\\b)${pattern}(?=\\b(?:[.:,;\\!?)(\\[\\]]|\\s|$))`,'i'); const m=re.exec(norm); if(m) res.push({ nameCanonical:nameKey, index:m.index, codes:Array.from(CANONICAL_LOCALITY_TO_CODES.get(nameKey)||[]) }); } res.sort((a,b)=>a.index-b.index); return res; }
 const STICHWORT_SUFFIXES = CFG.SUPERRED.stichwortSuffixes||[];
 function findContainsStemCandidates(cleaned){ const cfg={ enableContainsStems:true, containsStems: CFG.SUPERRED.containsStems||[], ignoreExact: CFG.SUPERRED.ignoreExact||[] }; if(!cfg?.enableContainsStems) return []; const tokenRe=/\b([A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*)\b/gu; const ignoreSet=new Set((cfg.ignoreExact||[]).map(s=>s.toLowerCase().normalize('NFC'))); const stemRegexes=(cfg.containsStems||[]).map(x=>({label:x.label,re:new RegExp(x.pattern,'iu')})); const out=[]; let m; while((m=tokenRe.exec(cleaned))!==null){ const token=m[1]; const norm=token.toLowerCase().normalize('NFC'); if(ignoreSet.has(norm)) continue; for(const s of stemRegexes){ if(s.re.test(norm)){ out.push({ idx:m.index, text:token }); break; } } } return out; }
 function tidyStichwort(s){ return (s??'').replace(/[)\]]\].,:;!?]+$/,'').replace(/\s+/g,' ').trim(); }
 function extractStichwortFrom(text){ if(!text) return ''; const cleaned=(text??'').replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g,' ').replace(/[“”„‟"«»]/g,'"').replace(/[‚‘’‛']/g,"'").trim(); const esc=STICHWORT_SUFFIXES.map(s=> s.replace(/[\\\-\/\^$*+?.()\[\]{}]/g,'\\$&')); const suffixPattern=new RegExp(`\\b([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+)*-(?:${esc.join('|')}))\\b`,'giu'); const singleWordSuffixPattern=new RegExp(`\\b([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]*(?:${esc.join('|')}))\\b`,'giu'); const hyphenCompositePattern=/\\b([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+)+)\\b/gu; let m; const candidates=[]; while((m=suffixPattern.exec(cleaned))!==null) candidates.push({ idx:m.index, text:m[1] }); while((m=singleWordSuffixPattern.exec(cleaned))!==null) candidates.push({ idx:m.index, text:m[1] }); const containsCands=findContainsStemCandidates(cleaned); if(containsCands.length) candidates.push(...containsCands); if(candidates.length){ candidates.sort((a,b)=>a.idx-b.idx); const firstNonLocality=candidates.find(c=>!isLocalityPhrase(c.text)); if(firstNonLocality) return tidyStichwort(firstNonLocality.text); } const hyphens=[]; while((m=hyphenCompositePattern.exec(cleaned))!==null) hyphens.push({ idx:m.index, text:m[1] }); if(hyphens.length){ hyphens.sort((a,b)=>a.idx-b.idx); const firstNonLocality=hyphens.find(h=>!isLocalityPhrase(h.text)); if(firstNonLocality) return tidyStichwort(firstNonLocality.text); } return ''; }
 function extractStichwort(values){ let sw=extractStichwortFrom(values.subline); if(sw) return sw; const bodyStart=(values.body||'').slice(0,280); sw=extractStichwortFrom(bodyStart); return sw||''; }
 function isoWeekString(d){ const date=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dow=date.getUTCDay(); const dayNum=(dow===0?7:dow); date.setUTCDate(date.getUTCDate()+4-dayNum); const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1)); const weekNo=Math.ceil((((date-yearStart)/86400000)+1)/7); return String(weekNo).padStart(2,'0'); }
 function nextWeekday(date, weekday){ const dd=new Date(date); const day=dd.getDay(); let delta=(weekday-day+7)%7; if(delta===0) delta=7; dd.setDate(dd.getDate()+delta); return dd; }
 function redaktionsKWString(date, weekday){ const d=new Date(date); const day=d.getDay(); const rsDay=(typeof weekday==='number')?weekday:1; if(day===rsDay) return isoWeekString(d); const nm=nextWeekday(d, rsDay); return isoWeekString(nm); }
 function isoWeekToDate(year, week, weekday=(CFG.SUPERRED.appearanceWeekday ?? 6)){ const jan4=new Date(Date.UTC(year,0,4)); const jan4Dow=jan4.getUTCDay()||7; const mondayOfW1=new Date(jan4); mondayOfW1.setUTCDate(jan4.getUTCDate()-(jan4Dow-1)); const target=new Date(mondayOfW1); target.setUTCDate(mondayOfW1.getUTCDate()+((week-1)*7)+(((weekday||6)-1))); return new Date(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()); }
 function resolveIssueDateFromKW(kw, weekday=(CFG.SUPERRED.appearanceWeekday ?? 6), today=new Date()){ const y=today.getFullYear(); const dThis=isoWeekToDate(y, kw, weekday); const today0=new Date(today.getFullYear(), today.getMonth(), today.getDate()); if(dThis < today0) return isoWeekToDate(y+1, kw, weekday); return dThis; }
 function extractExistingPrefix(str){ const v=(str||'').toString().trim(); // FIX: keine Backslashes vor #/_ im /u-Pattern
  const m = v.match(/^(\d{1,2})#([A-ZÄÖÜ]{1,4}(?:#[A-ZÄÖÜ]{1,4})*)(?:_(\d{5,12}))?/u);
  if(!m) return null; return { kw:m[1], kuerzel:m[2], nummer:m[3]||'' }; }
 function safeHeadline(h){ return (h||'').replace(/\s+/g,' ').trim(); }
 function guessArticleNumber(list, min=5, max=12){ const re=new RegExp(`(?:^|[^\\d])(\\d{${min},${max}})(?!\\d)`, 'u'); for(const s of list){ const m=(s||'').match(re); if(m) return m[1]; } return ''; }
 function getExistingNumberFromField(inputEl){ const v=(inputEl?.value||'').toString(); let m=v.match(/_(\d{5,12})(?:_|$)/u); if(m) return m[1]; m=v.match(/(?:^|[^\d])(\d{5,12})(?!\d)/u); return m?m[1]:''; }
 function buildFileName({ kw, kuerzel, nummer, headline, stichwort }){ const parts=[]; if(kw) parts.push(kw); parts.push(`#${kuerzel}`); if(nummer) parts.push(CFG.SUPERRED.joiner+nummer); const H=headline||''; const S=stichwort||''; let tail=''; if(CFG.SUPERRED.filenameOrder==='H') tail=(H?CFG.SUPERRED.joiner+H:'') + (S?` (${S})`:'' ); else if(CFG.SUPERRED.filenameOrder==='S') tail=(S?CFG.SUPERRED.joiner+S:'') + (H?` (${H})`:'' ); else if(CFG.SUPERRED.filenameOrder==='S!') tail=(S?CFG.SUPERRED.joiner+S:''); else tail=(H?CFG.SUPERRED.joiner+H:'') + (S?` (${S})`:'' ); return parts.join('')+tail; }
 function isoOrRSKW(now){ return (CFG.SUPERRED.useKW) ? (CFG.SUPERRED.kwMode==='redaktionsschluss'? redaktionsKWString(now, CFG.SUPERRED.redaktionsschlussWeekday) : isoWeekString(now)) : ''; }
 function computeAusgabeKuerzel(values){ const maxCodes=Math.max(1,(CFG.SUPERRED.maxEditionCodes??3)); const joiner=(CFG.SUPERRED.multiEditionJoiner??'#'); const FALLBACK='DL'; const blacklist=(CFG.SUPERRED.localityBlacklist||[]).map(s=>canonLoc(s)); if(containsExclusiveDL(values)) return 'DL'; const codesOrdered=[]; const addCodes=codes=>{ for(const c of codes){ if(!codesOrdered.includes(c)) codesOrdered.push(c); if(codesOrdered.length>=maxCodes) return; } }; let primary=null; if(values.subline?.trim()){ const m=matchLocalityAtStart(values.subline); if(m) primary=m; } if(!primary && values.body?.trim()){ const m=matchLocalityAtStart(values.body); if(m) primary=m; } const fullHitsAll=findLocalitiesInText(values.body||''); const fullHits=fullHitsAll.filter(h=>!blacklist.includes(h.nameCanonical)); if(!primary && fullHits.length) addCodes(fullHits[0].codes); if(primary) addCodes(primary.codes); if(fullHits.length){ for(const hit of fullHits){ const codes=hit.codes.filter(c=> c!=='DL' || codesOrdered.length===0); addCodes(codes); if(codesOrdered.length>=maxCodes) break; } } if(codesOrdered.length===0) codesOrdered.push(FALLBACK); return codesOrdered.join(joiner); }
 function computeFinalFileName(values, targetInputEl){ const targetVal=(targetInputEl?.value ?? '').toString(); const existing=extractExistingPrefix(targetVal); const nummerExisting=existing?.nummer || getExistingNumberFromField(targetInputEl); const nummerGuessed=guessArticleNumber([values.headline, values.subline, values.body]); let nummer=nummerExisting || nummerGuessed; if(!nummer && CFG.SUPERRED.requireEightDigitId) nummer=(CFG.SUPERRED.missingIdPlaceholder||''); let baseHeadline=(values.headline||'').trim(); if(!baseHeadline) baseHeadline=(values.subline||'').trim(); if(!baseHeadline){ const body=(values.body||'').replace(/\s+/g,' ').trim(); baseHeadline=body.split(' ').slice(0,10).join(' ')||'ohne Titel'; } const headline=safeHeadline(baseHeadline); const stichwort=extractStichwort(values); const kw=existing?.kw || isoOrRSKW(new Date()); const kuerzel=existing?.kuerzel || computeAusgabeKuerzel(values); return { text: buildFileName({ kw, kuerzel, nummer, headline, stichwort }), kw, kuerzel }; }

 // NOTES Builder (inkl. Termin-Logik mit Listen/Monaten)
 const SN_STORE={ get(k,d=''){ try{ return GM_getValue(k,d);}catch{ return d;} }, set(k,v){ try{ GM_setValue(k,v);}catch{} } };
 const NOTES_CFG={ SKEY_PHRASES: SMX_STORE_KEYS.NOTES_PHRASES, PHRASES_DEFAULT: CFG.NOTES.phrasesDefault||'', SKEY_PHRASES_EXCLUDE: SMX_STORE_KEYS.NOTES_PHRASES_EXCL, PHRASES_EXCLUDE_DEFAULT: CFG.NOTES.phrasesExcludeDefault||'', SKEY_TAG_TABLE: SMX_STORE_KEYS.NOTES_TAG_TABLE, TAG_TABLE_DEFAULT: CFG.NOTES.tagTableDefault||'', tagMaxCount: CFG.NOTES.tagMaxCount||6, sep: CFG.NOTES.sep||' \n\n ', phraseWholeWord: CFG.NOTES.phraseWholeWord||false };
 function getPhraseList(){ const raw=SN_STORE.get(NOTES_CFG.SKEY_PHRASES, NOTES_CFG.PHRASES_DEFAULT); return raw.split(',').map(s=>s.trim()).filter(Boolean); }
 function getPhraseExcludeList(){ const raw=SN_STORE.get(NOTES_CFG.SKEY_PHRASES_EXCLUDE, NOTES_CFG.PHRASES_EXCLUDE_DEFAULT); return raw.split(',').map(s=>s.trim()).filter(Boolean); }
 function escapeRegex(s){ return (s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
 function scrubPhraseExclusions(textLower){ let out=textLower; for(const ex of getPhraseExcludeList()){ if(!ex) continue; const re=new RegExp(escapeRegex(ex.toLowerCase()),'giu'); out=out.replace(re,' ');} return out; }
 function findPhraseHits(text){ const lower=(text||'').toLowerCase(); const scan=scrubPhraseExclusions(lower); const hits=new Set(); for(const p of getPhraseList()){ const term=p.toLowerCase(); const re = NOTES_CFG.phraseWholeWord ? new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegex(term)})(?=([^\\p{L}\\p{N}_]))`,'giu') : new RegExp(escapeRegex(term),'giu'); if(re.test(scan)) hits.add(p); } return [...hits]; }
 function getTagTable(){ const raw=SN_STORE.get(NOTES_CFG.SKEY_TAG_TABLE, NOTES_CFG.TAG_TABLE_DEFAULT); const lines=raw.split('\n').map(s=>s.trim()).filter(Boolean); const table=[]; for(const line of lines){ const ix=line.indexOf(':'); if(ix<0) continue; const tag=line.slice(0,ix).trim().toUpperCase(); const items=line.slice(ix+1).split(',').map(s=>s.trim()).filter(Boolean); if(tag && items.length) table.push({ tag, items }); } return table; }
 function countTagHits(text){ const lower=(text||'').toLowerCase(); const table=getTagTable(); const results=[]; for(const row of table){ let hits=0; for(const term of row.items){ const t=(term||'').toLowerCase(); if(!t) continue; let idx=lower.indexOf(t); while(idx>=0){ hits++; idx=lower.indexOf(t, idx+t.length); } } if(hits>0) results.push({ tag: row.tag, hits }); } results.sort((a,b)=>{ const d=b.hits-a.hits; return d!==0? d : a.tag.localeCompare(b.tag,'de'); }); return results.map(x=>x.tag); }
 function buildNotesLine({ subline, body, captions = [], kwHint }) {
  // 1) Schlanke Muster (Vollformen, weil SuperMAX vorher normalisiert)
  const MONTHS = '(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)';
  const WEEKDAYS_OPT = '(?:(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag),?\\s*)?';
  const pad2 = n => String(n).padStart(2, '0');
  const fmtDateDE = d => `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}`;
  const sod = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const parseIntSafe = s => { const n = parseInt(s,10); return Number.isFinite(n) ? n : null; };

  function buildDate(dayStr, monStrOrIdx, yearStr, now) {
    const dd = parseIntSafe(dayStr);
    let mm = (typeof monStrOrIdx === 'number') ? (monStrOrIdx+1) : parseIntSafe(monStrOrIdx);
    let yyyy = yearStr ? parseIntSafe(yearStr) : null;
    if (!dd) return null;
    if (yyyy != null && yyyy < 100) yyyy = 2000 + yyyy;
    if (!mm || mm < 1 || mm > 12) mm = parseIntSafe(monStrOrIdx);
    if (!mm) return null;
    if (yyyy == null) yyyy = (now ?? new Date()).getFullYear();
    const d = new Date(yyyy, mm-1, dd); d.setHours(0,0,0,0);
    if (d.getDate() !== dd || d.getMonth() !== mm-1) return null;
    return d;
  }

  function normalizeSpacesFull(s) {
    return (s ?? '')
      .replace(/[\u00A0\u202F\u2009]/g,' ')
      .replace(/[–—]/g,'-')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  // 2) Text-Basis
  const allText = normalizeSpacesFull(`${subline ?? ''}\n${body ?? ''}\n${(captions ?? []).join('\n')}`);

  // 3) Datumskandidaten extrahieren (vereinfachte, robuste Patterns)
  const out = [];
  const now0 = sod(new Date());

  // 3.1 Listenform: "11., 13. und 15. November [2025]"
  const listMonPat = new RegExp(
    String.raw`(\d{1,2}\.)\s*(?:,\s*\d{1,2}\.)*(?:\s*und\s*\d{1,2}\.)\s*(${MONTHS})\s*(\d{2,4})?`,
    'gi'
  );
  let lm;
  while ((lm = listMonPat.exec(allText)) !== null) {
    const monKey = lm[2].toLowerCase();
    const yearStr = lm[3] || null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'
      .split(' ')
      .indexOf(monKey);
    if (monthIdx >= 0) {
      const slice = allText.slice(lm.index, listMonPat.lastIndex);
      const days = (slice.match(/\d{1,2}(?=\.)/g) || []).map(parseIntSafe).filter(Number.isFinite);
      const uniq = [...new Set(days)].filter(n => n>=1 && n<=31);
      for (const dd of uniq) {
        const d = buildDate(String(dd), monthIdx, yearStr, new Date());
        if (d) out.push(d);
      }
    }
  }

  // 3.2 "Monat ... am 11., 13. und 15. [2025]"
  const monthThenListRe = new RegExp(
    String.raw`(${MONTHS})\s*(?:am\s*)?((?:\d{1,2}\.\s*(?:,\s*|und\s+|bis\s+))*)(\d{1,2})\.\s*(\d{2,4})?`,
    'gi'
  );
  let ml;
  while ((ml = monthThenListRe.exec(allText)) !== null) {
    const monKey = ml[1].toLowerCase();
    const before = ml[2] || '';
    const lastDay = ml[3];
    const yearStr = ml[4] || null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'
      .split(' ')
      .indexOf(monKey);
    if (monthIdx >= 0) {
      const allDays = [ ...(before.match(/\d{1,2}(?=\.)/g) || []), lastDay ]
        .map(parseIntSafe).filter(Number.isFinite);
      const uniq = [...new Set(allDays)].filter(n => n>=1 && n<=31);
      for (const dd of uniq) {
        const d = buildDate(String(dd), monthIdx, yearStr, new Date());
        if (d) out.push(d);
      }
    }
  }

  // 3.3 "von 11. bis 15. November [2025]" → Startdatum
  const vonBisMonPat = new RegExp(
    String.raw`(?:\bvon\s*)?(\d{1,2})\.\s*(?:bis|[–-])\s*(\d{1,2})\.\s*(${MONTHS})\s*(\d{2,4})?`,
    'gi'
  );
  let vb;
  while ((vb = vonBisMonPat.exec(allText)) !== null) {
    const startDay = vb[1];
    const monKey = vb[3].toLowerCase();
    const yearStr = vb[4] || null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'
      .split(' ')
      .indexOf(monKey);
    if (monthIdx >= 0) {
      const dStart = buildDate(startDay, monthIdx, yearStr, new Date());
      if (dStart) out.push(dStart);
    }
  }

  // 3.4 Numerischer Bereich "11.–15.11.[2025]" → Startdatum
  const wsp = `[\\s\\u00A0\\u202F\\u2009]*`;
  const rangeRe = new RegExp(
    String.raw`(?:^\D)(\d{1,2})\.${wsp}[–-]${wsp}(\d{1,2})\.(\d{1,2})\.?(?:\s*(\d{2,4}))?`,
    'gi'
  );
  let rr;
  while ((rr = rangeRe.exec(allText)) !== null) {
    const d = buildDate(rr[1], rr[3], rr[4] ?? null, new Date());
    if (d) out.push(d);
  }

  // 3.5 "dd.mm.yyyy"
  const fullRe = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/gi;
  let fr;
  while ((fr = fullRe.exec(allText)) !== null) {
    const d = buildDate(fr[1], fr[2], fr[3], new Date());
    if (d) out.push(d);
  }

  // 3.6 "dd.mm." (Jahr = aktuell)
  const noYearRe = /(\d{1,2})\.(\d{1,2})\.(?!\d)/gi;
  let ny;
  while ((ny = noYearRe.exec(allText)) !== null) {
    const d = buildDate(ny[1], ny[2], null, new Date());
    if (d) out.push(d);
  }

  // 3.7 "Wochentag, dd. Monat [yyyy]"
  const monRe = new RegExp(
    String.raw`${WEEKDAYS_OPT}(\d{1,2})\.?\s*(${MONTHS})(?:\s*(\d{2,4}))?`,
    'gi'
  );
  let mm;
  while ((mm = monRe.exec(allText)) !== null) {
    const day = mm[1];
    const monKey = mm[2].toLowerCase();
    const yearStr = mm[3] || null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'
      .split(' ')
      .indexOf(monKey);
    if (monthIdx >= 0) {
      const d = buildDate(day, monthIdx, yearStr, new Date());
      if (d) out.push(d);
    }
  }

  // Fenster [-30, +365], deduplizieren, sortieren
  const min = addDays(now0, -30);
  const max = addDays(now0, 365);
  const win = [...new Map(out.map(d => [d.getTime(), d])).values()]
    .filter(d => d >= min && d <= max)
    .sort((a,b) => a - b);
  const earliest = win[0] ?? null;

  // 4) TERMIN/ACHTUNG-TERMIN je nach KW-Hinweis bzw. heute
  let terminPrefix = 'TERMIN:';
  try {
    if (typeof kwHint === 'number' && kwHint >= 1 && kwHint <= 53) {
      const issueDate = sod(resolveIssueDateFromKW(kwHint, CFG.SUPERRED.appearanceWeekday ?? 6, new Date()));
      terminPrefix = (earliest && earliest < issueDate) ? 'ACHTUNG-TERMIN:' : 'TERMIN:';
    } else {
      terminPrefix = (earliest && earliest < now0) ? 'ACHTUNG-TERMIN:' : 'TERMIN:';
    }
  } catch {}

  // 5) Phrasen / Tags (unverändert)
  const parts = [];
  if (earliest) parts.push(`${terminPrefix} ${fmtDateDE(earliest)}`);

  const phrases = findPhraseHits(allText);
  if (phrases.length) parts.push(`CHECKEN! ${phrases.join(', ')}`);

  const tags = countTagHits(allText);
  if (tags.length) {
    const room = Math.max(0, CFG.NOTES.tagMaxCount ?? 6);
    const picked = tags.slice(0, room);
    const tagJoiner = (CFG.NOTES?.tagJoiner ?? ' | ');
    parts.push(picked.join(tagJoiner));
  }

  return parts.join(NOTES_CFG.sep);
}

// (Optional aber sehr hilfreich fürs Testen)
window.__SMX__ = window.__SMX__ || {};
window.__SMX__.buildNotesLine = buildNotesLine;

 function findNotesField(root=document){ const selectors=[ '#notes','textarea[name="notes"]','input[name="notes"]','[aria-label*="Notiz" i]','[placeholder*="Notiz" i]' ]; for(const s of selectors){ const el=root.querySelector(s); if(el) return el; } const labels=Array.from(root.querySelectorAll('label')).filter(l=> /notiz|notizen|notes?/i.test(l.textContent||'')); for(const lab of labels){ const forId=lab.getAttribute('for'); if(forId){ const el=root.getElementById(forId); if(el) return el; } const el=lab.closest('section,div,li,form,fieldset')?.querySelector('textarea, input, [contenteditable="true"]'); if(el) return el; } try{ const xp=document.evaluate("//label[contains(translate(., 'NOTIZEN', 'notizen'),'notiz')]/following::*[self::textarea or self::input or @contenteditable='true'][1]", root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; if(xp) return xp; }catch{} return null; }
 function setNotesReactSafe(el, value){ if(!el) return false; if(el.isContentEditable || el.getAttribute('contenteditable')==='true'){ el.focus(); document.execCommand('selectAll',false,null); document.execCommand('insertText',false,String(value)); el.dispatchEvent(new InputEvent('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); el.dispatchEvent(new Event('blur',{bubbles:true})); return true; } const proto= el.tagName==='TEXTAREA'? HTMLTextAreaElement.prototype: HTMLInputElement.prototype; const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set; if(setter) setter.call(el, String(value)); else el.value=String(value); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); el.dispatchEvent(new Event('blur',{bubbles:true})); return true; }
 function flashNotes(el, ok=true){ if(!el) return; const o=el.style.outline; el.style.outline=`2px solid ${ok?'#8bc34a':'#ff5252'}`; setTimeout(()=>el.style.outline=o,900); }
 async function captureValuesAndCaptionsOnce(){ const values=await captureAllThree(); const editors=await findCaptionEditorsDeep({ scanMode: CFG.SUPERRED.CAPTION?.scanMode||'auto' }); const captions=[]; for(const ed of editors){ try{ const t = ed.isPM ? (ed.el.innerText||'') : (ed.el.value||ed.el.textContent||''); if(t && t.trim()) captions.push(t.trim()); }catch{} } return { values, captions } }
 async function performCombinedFill(valuesOpt=null, captionsOpt=null){
  try { window.__SMX__ = window.__SMX__ || {}; window.__SMX__.lastCancelled=false; }catch{}
  const target=((()=>{ for(const s of ['#moduleTitle','#positionInfo','input[name="fileName"]','input[aria-label*="Artikelbeschreibung" i]','input[aria-label*="Dateiname" i]','input[placeholder*="Dateiname" i]']){ const el=qs(s); if(el) return el; } return null; })());
  const notesEl=findNotesField();
  if(!target && !notesEl){ smxToast('SuperRED: Weder Artikelbeschreibung noch Notizen-Feld gefunden.'); return; }
  const { values, captions } = valuesOpt? { values: valuesOpt, captions: (captionsOpt||[]) } : await captureValuesAndCaptionsOnce();
  // RED
  let red=null; if(target){ const currentRED=(target.value||'').toString().trim(); const isTrivialRED=(currentRED==='')||/^\d{5,12}$/.test(currentRED); const { text: proposedRED, kw }=computeFinalFileName(values, target); red={ current: currentRED, proposed: proposedRED, isTrivial: isTrivialRED, kw }; }
  // NOTES
  let notes=null; if(notesEl){ const currentNOTES=(notesEl.value ?? notesEl.textContent ?? '').trim(); const isTrivialNOTES=(currentNOTES===''); let kwHint=null; try{ const fnCurrent=(target?.value||'').toString(); // FIX: keine Backslashes vor # im /u-Pattern
      const kwFromCurrent=(/^\s*(\d{1,2})\s*#/u.exec(fnCurrent)||[])[1]; if(kwFromCurrent) kwHint=parseInt(kwFromCurrent,10); }catch{}
    try{ if(kwHint==null && red?.kw){ const k=parseInt(String(red.kw),10); if(Number.isFinite(k)) kwHint=k; } }catch{}
    const notesText=buildNotesLine({ subline: values.subline, body: values.body, captions, kwHint }); notes={ current: currentNOTES, proposed: notesText, isTrivial: isTrivialNOTES }; }
  const wantConfirm=!!CFG.FEATURES.confirmOverwrite; const needPromptRed=wantConfirm && !!red && red.proposed!==red.current && !red.isTrivial; const needPromptNotes=wantConfirm && !!notes && notes.proposed!==notes.current && !notes.isTrivial; let overwriteRed=!needPromptRed; let overwriteNotes=!needPromptNotes;

  if(needPromptRed||needPromptNotes){ const html=`<div style="font-weight:700;font-size:14px;margin-bottom:6px">Überschreibschutz</div>
 <div>Es sind bereits Inhalte vorhanden. Was soll überschrieben werden?</div>
 ${red?`<div style="margin-top:10px;padding:10px;border:1px solid #12456a;border-radius:8px;background:#07233a"><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input id="smx_cw_red" type="checkbox" checked style="transform:translateY(2px)"><div><div style="font-weight:600">Artikelbeschreibung überschreiben?</div><div style="opacity:.9;margin-top:6px"><div style="font-size:12px"><b>Aktuell:</b> ${red.current}</div><div style="font-size:12px;margin-top:4px"><b>Neu:</b> ${red.proposed}</div></div></div></label></div>`:''}
 ${notes?`<div style="margin-top:10px;padding:10px;border:1px solid #12456a;border-radius:8px;background:#07233a"><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input id="smx_cw_notes" type="checkbox" checked style="transform:translateY(2px)"><div><div style="font-weight:600">Notizen überschreiben?</div><div style="opacity:.9;margin-top:6px"><div style="font-size:12px;white-space:pre-wrap"><b>Aktuell:</b> ${notes.current}</div><div style="font-size:12px;margin-top:4px;white-space:pre-wrap"><b>Neu:</b> ${notes.proposed}</div></div></div></label></div>`:''}
 <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button id="smx_cw_ok" style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Anwenden</button> <button id="smx_cw_cancel" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Abbrechen</button></div>`;
 const { wrap, box }=smxCreateOverlayBox(html); const $=sel=>box.querySelector(sel); let cancelled = false; await new Promise((resolve)=>{ const ok=$('#smx_cw_ok'); const cancel=$('#smx_cw_cancel'); const onCancel=()=>{ try{ wrap.remove(); }catch{} cancelled=true; resolve(null); }; cancel.addEventListener('click', onCancel); wrap.addEventListener('click', e=>{ if(e.target===wrap) onCancel(); }); document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ document.removeEventListener('keydown', esc); onCancel(); } if(e.key==='Enter'){ document.removeEventListener('keydown', esc); ok.click(); } }); ok.addEventListener('click', ()=>{ overwriteRed=!!$('#smx_cw_red')?.checked || !needPromptRed; overwriteNotes=!!$('#smx_cw_notes')?.checked || !needPromptNotes; try{ wrap.remove(); }catch{} resolve(true); }); }); if (cancelled){ try{ window.__SMX__ = window.__SMX__ || {}; window.__SMX__.lastCancelled = true; }catch{} return; } }
 let redChanged=false, notesChanged=false; if(red && red.proposed!==red.current){ if(overwriteRed || red.isTrivial){ const desc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'); const setter=desc&&desc.set; if(setter) setter.call(target, String(red.proposed)); else target.value=String(red.proposed); target.dispatchEvent(new Event('input',{bubbles:true})); target.dispatchEvent(new Event('change',{bubbles:true})); redChanged=true; } }
 if(notes && (overwriteNotes || notes.isTrivial)){ const ok=setNotesReactSafe(notesEl, notes.proposed); flashNotes(notesEl, ok); notesChanged=true; }
 try{ window.__SMX__ = window.__SMX__ || {}; window.__SMX__.lastChanged={ redChanged, notesChanged }; }catch{}
 }
 async function debugCaptionScanner(){ const editors=await findCaptionEditorsDeep({ scanMode: 'auto' }); const lines=[`Gefundene Caption-Felder: ${editors.length}`,'',...editors.map((x,i)=>{ const txt=x.isPM?(x.el.innerText||''):(x.el.value||x.el.textContent||''); return `${i+1}. [${x.isPM?'pm':'field'}] ${txt.trim().slice(0,140)}`; })]; smxToast('Caption-Scan fertig (Details in Overlay/Konsole).', 2200); try{ console.log('[SuperMAX Caption-Scanner]', { editors }); }catch{} const { wrap, box }=smxCreateOverlayBox(`<div style="font-weight:700;margin-bottom:8px">Caption-Scanner</div><pre style="white-space:pre-wrap;max-height:48vh;overflow:auto">${lines.join('\n')}</pre><div style="text-align:right;margin-top:8px"><button id="smx_cap_close" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">Schließen</button></div>`); box.querySelector('#smx_cap_close').addEventListener('click', ()=> wrap.remove()); }
 // Exporte
 window.__SMX__ = window.__SMX__ || {};
 window.__SMX__.findCaptionEditorsDeep = findCaptionEditorsDeep;
 window.__SMX__.captureAllThree = captureAllThree;
 window.__SMX__.captureValuesAndCaptionsOnce = captureValuesAndCaptionsOnce;
 window.__SMX__.performCombinedFill = performCombinedFill;
 window.__SMX__.debugCaptionScanner = debugCaptionScanner;
 window.__SMX__.applyRegexToCaptionsViaLayoutBoxes = applyRegexToCaptionsViaLayoutBoxes;
})();

/****************************
 * RegEx-Anwendung & Navigation
 *****************************/
async function supermaxApplyAllFieldsOnceOn(editors, mode='both'){ let changes=0; const apply=(el)=>{ if(mode==='both'||mode==='baseOnly'){ if(reactSafeReplaceInPM(el, baseReplacements)) changes++; } if(mode==='both'||mode==='hashtagOnly'){ if(reactSafeReplaceInPM(el, hashtagReplacements)) changes++; } }; for(const el of editors){ apply(el); } return changes; }
async function supermaxApplyAllFieldsOnce(mode='both'){
const visiblePMs=qsa('.ProseMirror, [contenteditable="true"]').filter(el=>isVisible(el));
  let changes=0;
  changes += await supermaxApplyAllFieldsOnceOn(visiblePMs, mode);
  for(const s of ['#moduleTitle','#positionInfo']){ const el=qs(s); if(el){ if(mode==='both'||mode==='baseOnly'){ if(replaceInputWithRules(el, baseReplacements)) changes++; } if(mode==='both'||mode==='hashtagOnly'){ if(replaceInputWithRules(el, hashtagReplacements)) changes++; } } }
  // Erzwinge Text-Behandlung (auch wenn Start in BU)
 try {
   await focusBodyPM();
   const bodyPM = (function(){
     const el = document.activeElement;
     if (el && (el.isContentEditable || el.getAttribute?.('contenteditable')==='true')) return el;
     const cand = qsa('.ProseMirror, [contenteditable="true"]').find(isVisible);
     return cand || null;
   })();
   if (bodyPM && !(Array.isArray(visiblePMs) && visiblePMs.includes(bodyPM))) {
     changes += await supermaxApplyAllFieldsOnceOn([bodyPM], mode);
   }
 } catch {}
 // via Editor-API / Layout-Kachel-Rundgang (BU)
  try { const added = await window.__SMX__?.applyRegexToCaptionsViaLayoutBoxes?.(mode); if(Number.isFinite(added)) changes += added; } catch{}
  await focusBodyPM();
 return changes;
}
// Headline & Subline kurz abarbeiten
async function applyOnHeadlineAndSubline(mode='both'){
  function norm(t){ return (t||'').trim().toLowerCase(); }
  const labelsH=['überschrift','headline','titel']; const labelsS=['unterzeile','subheadline','vorspann','teaser'];
  const candidates=[...document.querySelectorAll('#jsFragments #texts li.jsModuleItem'), ...document.querySelectorAll('button,[role="button"],a,.nav-item,.tab,.toggleBox,.toggleBoxIcon,[data-uid]')].filter(isVisible);
  function findButton(labels){ for(const el of candidates){ const txt=norm(el.textContent||''); const aria=norm(el.getAttribute?.('aria-label')||el.getAttribute?.('data-label')||''); for(const l of labels){ if((txt&&txt.includes(l))||(aria&&aria.includes(l))) return el; } } return null; }
  async function doOne(btn){ if(!btn) return false; clickChain(btn); let pm=null; try{ const start=performance.now(); while(performance.now()-start<1400){ const el=document.activeElement; if(el && (el.isContentEditable || el.getAttribute('contenteditable')==='true')) { pm=el; break; } await new Promise(r=>setTimeout(r,80)); } if(!pm) pm=document.querySelector('.ProseMirror[contenteditable="true"], [contenteditable="true"]'); }catch{ pm=document.querySelector('.ProseMirror[contenteditable="true"], [contenteditable="true"]'); }
    if(!pm) return false; let local=0; if(mode==='both'||mode==='baseOnly'){ if(reactSafeReplaceInPM(pm, baseReplacements)) local++; } if(mode==='both'||mode==='hashtagOnly'){ if(reactSafeReplaceInPM(pm, hashtagReplacements)) local++; } return local>0; }
  const h=await doOne(findButton(labelsH)); const s=await doOne(findButton(labelsS)); return (h||s);
}

/****************************
 * SuperPORT (Head/Sub/Body/BU Vorschau)
 *****************************/
async function runSuperPORT(){ try{ const fallback={ values:{headline:'',subline:'',body:''}, captions:[] }; const { values, captions } = await (window.__SMX__?.captureValuesAndCaptionsOnce?.() ?? fallback); const esc=(s)=> String(s??'').replace(/[&<>]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); const H=esc(values.headline||''); const S=esc(values.subline||''); const B=esc(values.body||''); const capHtml=(Array.isArray(captions)&&captions.length)? captions.map((c,i)=>`<div style="margin:8px 0 10px"><div style="opacity:.8;font-size:12px;margin-bottom:4px">BU ${i+1}</div><pre style="white-space:pre-wrap;background:#061826;border:1px solid #12456a;border-radius:6px;padding:8px;max-height:26vh;overflow:auto">${esc(c)}</pre></div>`).join('') : `<div style="opacity:.8">– keine –</div>`; const allPlain = `Überschrift:\n${values.headline||''}\n\nUnterzeile:\n${values.subline||''}\n\nFließtext:\n${values.body||''}\n\n` + (captions?.length? `Bildunterschriften:\n${captions.map((c,i)=>`${i+1}. ${c}`).join('\n')}\n`: ''); const html = `
      <div style="font-weight:700;font-size:14px;margin-bottom:10px">SuperPORT – Artikelinhalte</div>
      <div style="margin:10px 0 6px;opacity:.9">Überschrift</div>
      <pre style="white-space:pre-wrap;background:#061826;border:1px solid #12456a;border-radius:6px;padding:8px;max-height:14vh;overflow:auto">${H}</pre>
      <div style="margin:12px 0 6px;opacity:.9">Unterzeile</div>
      <pre style="white-space:pre-wrap;background:#061826;border:1px solid #12456a;border-radius:6px;padding:8px;max-height:16vh;overflow:auto">${S}</pre>
      <div style="margin:12px 0 6px;opacity:.9">Fließtext</div>
      <pre style="white-space:pre-wrap;background:#061826;border:1px solid #12456a;border-radius:6px;padding:8px;max-height:24vh;overflow:auto">${B}</pre>
      <div style="margin:12px 0 6px;opacity:.9">Bildunterschriften</div>
      <div>${capHtml}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button id="smx_port_copy"  style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Alles kopieren</button>
        <button id="smx_port_close" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Schließen</button>
      </div>`; const { wrap, box } = smxCreateOverlayBox(html); box.querySelector('#smx_port_close')?.addEventListener('click', () => wrap.remove()); box.querySelector('#smx_port_copy')?.addEventListener('click', async () => { try { await navigator.clipboard?.writeText(allPlain); smxToast('SuperPORT: Inhalte kopiert.'); } catch { const ta=document.createElement('textarea'); ta.value=allPlain; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); smxToast('SuperPORT: Inhalte kopiert.'); } catch { smxToast('SuperPORT: Kopieren fehlgeschlagen.'); } finally { ta.remove(); } } }); } catch (err) { console.warn('SuperPORT error', err); smxToast('SuperPORT: Fehler.'); } }

/****************************
 * ONECLICK & Shortcuts
 *****************************/
function getSelectionContext(){ const sel=window.getSelection(); const txt=(sel? sel.toString():'').trim(); if(!txt) return { has:false }; const isUrl=/^(https?:\/\/)?\S+\.[a-z]{2,}[^\s]*$/i.test(txt); const isParagraph= txt.length>120 || /\n/.test(txt); return { has:true, isUrl, isParagraph, text:txt }; }
function tryClickSaveButton(){ if(!CFG.FEATURES.saveAfterOneClick) return false; let btn=null; if(CFG.SITE.saveButtonSelector) btn=qs(CFG.SITE.saveButtonSelector); if(!btn){ btn=qsa('button').find(b=>/zwischenspeichern|speichern|sichern|save/i.test(b.getAttribute('title')||'')); } if(!btn){ btn=qsa('button,[role="button"]').find(b=>/zwischenspeichern|speichern|sichern|save/i.test((b.textContent||'')+(b.getAttribute('aria-label')||''))); } if(btn){ clickChain(btn); smxToast('Gespeichert (Zwischenspeichern).'); return true; } return false; }
async function focusBodyPM(){ function norm(t){ return (t||'').trim().toLowerCase(); } const labelsB=['text','fließtext','body','artikeltext']; const candidates=[...document.querySelectorAll('#jsFragments #texts li.jsModuleItem'), ...document.querySelectorAll('button,[role="button"],a,.nav-item,.tab,.toggleBox,.toggleBoxIcon,[data-uid]')].filter(isVisible); const btn=candidates.find(el=>{ const txt=norm(el.textContent||''); const aria=norm(el.getAttribute?.('aria-label')||el.getAttribute?.('data-label')||''); return labelsB.some(l=> (txt&&txt.includes(l))||(aria&&aria.includes(l))); }); if(btn){ clickChain(btn); const start=performance.now(); while(performance.now()-start<1600){ const el=document.activeElement; if(el && (el.isContentEditable || el.getAttribute('contenteditable')==='true')){ setCursorToEnd(el); return; } await new Promise(r=>setTimeout(r,80)); } } const pm=qsa('.ProseMirror, [contenteditable="true"]').find(isVisible); if(pm){ pm.focus(); setCursorToEnd(pm); } }
async function runOneClick(){ const active = document.activeElement;
 if (active && isVisible(active)) {
   const mode = CFG.FEATURES.runHashtagOnOneClick ? 'both' : 'baseOnly';
   if (active.isContentEditable) {
     reactSafeReplaceInPM(active, baseReplacements);
     if (mode !== 'baseOnly') reactSafeReplaceInPM(active, hashtagReplacements);
   } else if (/^(TEXTAREA|INPUT)$/i.test(active?.tagName)) {
     replaceInputWithRules(active, baseReplacements);
     if (mode !== 'baseOnly') replaceInputWithRules(active, hashtagReplacements);
   }
 }
 const ctx=getSelectionContext(); let changedOther=false; if(ctx.has && ctx.isUrl){ changedOther=await performShortenSelectedUrl(); } else if(ctx.has && ctx.isParagraph){ changedOther=!!performSuperEraserOnSelection(); }
  const mode = CFG.FEATURES.runHashtagOnOneClick ? 'both' : 'baseOnly';
  await applyOnHeadlineAndSubline(mode);
  const changedText = await supermaxApplyAllFieldsOnce(mode);
const beforeRED=(function(){ try { return ((document.querySelector('#moduleTitle') || document.querySelector('#positionInfo'))?.value || '').trim(); } catch { return ''; } })();
  try{ const { values, captions } = await (window.__SMX__?.captureValuesAndCaptionsOnce?.() || { values:{headline:'',subline:'',body:''}, captions:[] }); await window.__SMX__?.performCombinedFill?.(values, captions); }catch(err){ console.warn('SuperRED combine error', err); }
  await new Promise(r=>setTimeout(r,60));
  try{ if(window.__SMX__?.lastCancelled) return; }catch{}
  const afterRED=(function(){ try { return ((document.querySelector('#moduleTitle') || document.querySelector('#positionInfo'))?.value || '').trim(); } catch { return ''; } })();
  let redChanged=false, notesChanged=false; try{ redChanged = !!(window.__SMX__?.lastChanged?.redChanged) || (beforeRED!==afterRED); notesChanged = !!(window.__SMX__?.lastChanged?.notesChanged); }catch{}
  const anythingChanged = !!changedOther || (changedText>0) || redChanged || notesChanged; if(anythingChanged) tryClickSaveButton();
  await focusBodyPM();
}
async function runSuperRedNotes(){ try{ const { values, captions } = await (window.__SMX__?.captureValuesAndCaptionsOnce?.() || { values:{headline:'',subline:'',body:''}, captions:[] }); await window.__SMX__?.performCombinedFill?.(values, captions); await new Promise(r=>setTimeout(r,20)); await focusBodyPM(); }catch(err){ console.warn('SuperRED run error', err); smxToast('SuperRED/NOTES: Fehler.'); } }
window.addEventListener('keydown', (e)=>{ const k=e.key?.toLowerCase?.()||''; if(e.ctrlKey && !e.altKey && !e.shiftKey && k==='s'){ e.preventDefault(); runOneClick(); return; } if(e.ctrlKey && e.altKey && k==='r'){ e.preventDefault(); runSuperRedNotes(); return; } if(e.ctrlKey && e.altKey && k==='p'){ e.preventDefault(); runSuperPORT(); return; } }, true);
console.log('SuperMAX 4.3.1 bereit.'); console.info('[SuperMAX] formatting-preserve: ON');
