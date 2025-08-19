// ==UserScript==
// @name         SuperMAX 3.0.5
// @author       Frank Luhn, Berliner Woche ©2025 (optimiert für PPS unter PEIQ)
// @namespace    https://pps.berliner-woche.de
// @version      3.0.5
// @description  Ersetzt Textphrasen per STRG + S. SuperERASER entfernt Umbrüche, Makros und Hyperlinks per STRG + E. SuperLINK kürzt URLs per STRG + L. Updates via GitHub.
// @updateURL    https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @downloadURL  https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @match        https://pps.berliner-woche.de/*
// @connect      bwurl.de
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

// Menüeintrag zum Setzen des Tokens
GM_registerMenuCommand("YOURLS-Token setzen", () => {
    const token = prompt("Bitte gib deinen YOURLS-Token ein:");
    if (token) {
        GM_setValue("yourlsToken", token);
        alert("Token gespeichert!");
    } else {
        alert("Kein Token eingegeben.");
    }
});

// Menüeintrag zum Anzeigen des Tokens
GM_registerMenuCommand("YOURLS-Token anzeigen", () => {
    const token = GM_getValue("yourlsToken", "(nicht gesetzt)");
    alert("Gespeicherter Token:\n" + token);
});

// Menüeintrag zum Löschen des Tokens
GM_registerMenuCommand("YOURLS-Token löschen", () => {
    const confirmDelete = confirm("Möchtest du den gespeicherten Token wirklich löschen?");
    if (confirmDelete) {
        GM_setValue("yourlsToken", "");
        alert("Token wurde gelöscht.");
    }
});

console.log("SuperMAX läuft!");

(function () {
  'use strict';
  console.log("🚀 SuperMAX v3.1 gestartet");

  // === RegEx-Listen ===
  // === STRG+S: Grundregeln ===
  const baseReplacements = [
    // Opening
        [/(?<!Kar)(S|s)amstag/g, "$1onnabend"],
        [/\s+\b\t\s*(\(?\d+)/g, "¿$1"], // Telefonzeichen in PPS unter PEIQ
        [/\b(Telefon|Tel\.)\s*(\(?\d+)/g, "¿$2"],
        [/\b(\d{1,4})\s*[–-]\s*(\d{1,4})\b/g, "$1-$2"],

   // Autorenkürzel Debugging
        [/\bcs\b/g, "\u202Fcs"], // Christian Sell
        [/\bFL\b/g, "\u202FL"], // Frank Luhn
        [/\bgo\b/g, "\u202Fgo"], // Simone Gogol-Grützner
        [/\bmv\b/g, "\u202Fmv"], // Michael Vogt
        [/\bmy\b/g, "\u202Fmy"], // Manuela Frey
        [/\bst\b/g, "\u202Fst"], // Hendrik Stein
        [/\bpam\b/g, "\u202Fpam"], // Pamela Rabe
        [/\bPR\b/g, "\u202FPR"], // Pamela Rabe
        [/\bpb\b/g, "\u202Fpb"], // Parvin Buchta
        [/\bpet\b/g, "\u202Fpet"], // Peter Erdmann
        [/\bsabka\b/g, "\u202Fsabka"], // Sabine Kalkus
        [/\bsus\b/g, "\u202Fsus"], // Susanne Schilp
        [/\btf\b/g, "\u202Ftf"], // Thomas Frey
        [/\bRR\b/g, "\u202FRR"], // Ratgeber-Redaktion
        [/\bakz/g, "\u202Fakz"], // Ratgeber-Redaktion
        [/\bBZfE/g, "\u202FBZfE"], // Ratgeber-Redaktion
        [/\bDEKRA Info\b/g, "\u202FDEKRA Info"], // Ratgeber-Redaktion
        [/\bdjd\b/g, "\u202Fdjd"], // Ratgeber-Redaktion
        [/\bIPM\b/g, "\u202FIPM"], // Ratgeber-Redaktion
        [/\bIVH\b/g, "\u202FIVH"], // Ratgeber-Redaktion
        [/\bProMotor/g, "\u202FProMotor"], // Ratgeber-Redaktion
        [/\btxn\b/g, "\u202Ftxn"], // Ratgeber-Redaktion

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
        [/Foto:\s*\/\s*/gi, "Foto: "], // Fotonachweis von eingehenden Slash bereinigen

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
        [/\bBVV-Vorsteh/g, "BV-Vorsteh"],
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
        [/\bKarsonnabend/g, "Karsamstag"],
        [/\bKickoff/g, "Kick-off"],
        [/\bKräcker/g, "Cracker"],
        [/\b(Long Drink|Long-Drink)/g, "Longdrink"],
        [/\bLoveparade/g, "Love-Parade"],
        [/\bmacht keinen Sinn\b/g, "ergibt keinen Sinn"],
        [/\bMund-zu-Mund-Propaganda\b/g, "Mundpropaganda"],
        [/\bOstersonnabend/g, "Karsamstag"],
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
        [/\b(https:\/\/|http:\/\/)/g, ""],
        [/(\.com|\.de|\.info)\/(?=\s|\.|$)(?![¬#%+\/])/gi, "$1"],

    // Formatierung von Zahlen, Datums- und Zeitangaben
        // Korrekte Maßstabsangaben
        [/\bMaßstab(?:\s+von)?\s+(\d+)[\s.:]+(\d{2,3})\b/g, "Maßstab $1:$2"],

        // Tausendertrennzeichen optimieren
        [/\b(\d{2,3})((?:\s+|\.){1})(\d{3})\b/g, "$1\u202F$3"],
        [/\b(\d{1,3})((?:\s+|\.){1})(\d{3})((?:\s+|\.){1})(\d{3})\b/g, "$1\u202F$3\u202F$5"],
        [/\b(\d{1})(?:(?![\u202F])(?:\s+|\.))(\d{3})\b/g, "$1$2"],

        // Kalendermonate mit Regeln zu 2025
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
        [/\.\s*0?1\.(2026|26)\b/g, ". Januar"],
        [/\.\s*0?1\.(\d{2,4})\b/g, ". Januar $1"],
        [/\.\s*0?2\.(\d{2,4})\b/g, ". Februar $1"],
        [/\.\s*0?3\.(\d{2,4})\b/g, ". März $1"],
        [/\.\s*0?4\.(\d{2,4})\b/g, ". April $1"],
        [/\.\s*0?5\.(\d{2,4})\b/g, ". Mai $1"],
        [/\.\s*0?6\.(\d{2,4})\b/g, ". Juni $1"],
        [/\.\s*0?7\.(\d{2,4})\b/g, ". Juli $1"],
        [/\.\s*0?8\.(\d{2,4})\b/g, ". August $1"],
        [/\.\s*0?9\.(\d{2,4})\b/g, ". September"],
        [/\.\s*10\.(\d{2,4})\b/g, ". Oktober"],
        [/\.\s*11\.(\d{2,4})\b/g, ". November"],
        [/\.\s*12\.(\d{2,4})\b/g, ". Dezember"],
        [/\.\s*0?1\.(\d{2,4})\b/g, ". Januar"],
        [/\b0([1-9])\. (?=Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/g, "$1. "],

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

  // === STRG+ALT+S: #-Regeln ===
  const hashtagReplacements = [
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
        [/#BUND/g, "Bund für Umwelt und Naturschutz Deutschland (BUND)"],
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
        [/#DNR/g, "Deutsche Naturschutzring (DNR)"],
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
        [/#FEZ/g, "Freizeit- und Erholungszentrum (FEZ-Berlin)"],
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
        [/#KI/g, "Künstliche Intelligenz (KI)"],
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

        // Senatsmitglieder – www.berlin.de/rbmskzl/politik/senat/senatsmitglieder/
        [/##(?:Cansel Kiziltepe|Kiziltepe)\b/g, "Cansel Kiziltepe (SPD), Senatorin für Arbeit, Soziales, Gleichstellung, Integration, Vielfalt und Antidiskriminierung#+"],
        [/#(?:Cansel Kiziltepe|Kiziltepe)\b/g, "Cansel Kiziltepe (SPD)"],
        [/##(?:Christian Gaebler|Gaebler)\b/g, "Christian Gaebler (SPD), Senator für Stadtentwicklung, Bauen und Wohnen#+"],
        [/#(?:Christian Gaebler|Gaebler)\b/g, "Christian Gaebler (SPD)"],
        [/##(?:Felor Badenberg|Badenberg)\b/g, "Felor Badenberg (CDU), Senatorin für Justiz und Verbraucherschutz#+"],
        [/#(?:Felor Badenberg|Badenberg)\b/g, "Felor Badenberg (CDU)"],
        [/##(?:Ina Czyborra|Czyborra)\b/g, "Ina Czyborra (SPD), Senatorin für Wissenschaft, Gesundheit und Pflege#+"],
        [/#(?:Ina Czyborra|Czyborra)\b/g, "Ina Czyborra (SPD)"],
        [/##(?:Franziska Giffey|Giffey)\b/g, "Franziska Giffey (SPD), Bürgermeisterin und Senatorin für Wirtschaft, Energie und Betriebe#+"],
        [/#(?:Franziska Giffey|Giffey)\b/g, "Franziska Giffey (SPD)"],
        [/##(?:Iris Spranger|Spranger)\b/g, "Iris Spranger (SPD), Senatorin für Inneres und Sport#+"],
        [/#(?:Iris Spranger|Spranger)\b/g, "Iris Spranger (SPD)"],
        [/##(?:Katharina Günther-Wünsch|Günther-Wünsch)\b/g, "Katharina Günther-Wünsch (CDU), Senatorin für Bildung, Jugend und Familie#+"],
        [/#(?:Katharina Günther-Wünsch|Günther-Wünsch)\b/g, "Katharina Günther-Wünsch (CDU)"],
        [/##(?:Kai Wegner|Wegner)\b/g, "Regierender Bürgermeister Kai Wegner (CDU)#+"],
        [/#(?:Kai Wegner|Wegner)\b/g, "Kai Wegner (CDU)"],
        [/##(?:Sarah Wedl-Wilson|Wedl-Wilson)\b/g, "Sarah Wedl-Wilson (parteilos), Senatorin für Kultur und Gesellschaftlichen Zusammenhalt#+"],
        [/#(?:Sarah Wedl-Wilson|Wedl-Wilson)\b/g, "Sarah Wedl-Wilson (parteilos)"],
        [/##(?:Stefan Evers|Evers)\b/g, "Stefan Evers (CDU), Bürgermeister und Senator für Finanzen#+"],
        [/#(?:Stefan Evers|Evers)\b/g, "Stefan Evers (CDU)"],
        [/##(?:Ute Bonde|Bonde)\b/g, "Ute Bonde (CDU), Senatorin für Mobilität, Verkehr, Klimaschutz und Umwelt#+"],
        [/#(?:Ute Bonde|Bonde)\b/g, "Ute Bonde (CDU)"],

        // Charlottenburg-Wilmersdorf – www.berlin.de/ba-charlottenburg-wilmersdorf/politik/bezirksamt/
        [/##(?:Astrid Duda|Duda)\b/g, "Astrid Duda (CDU), Stadträtin für Bürgerdienste und Soziales#+"],
        [/#(?:Astrid Duda|Duda)\b/g, "Astrid Duda (CDU)"],
        [/##(?:Judith Stückler|Stückler)\b/g, "BV-Vorsteherin Judith Stückler (CDU)#+"],
        [/#(?:Judith Stückler|Stückler)\b/g, "Judith Stückler (CDU)"],
        [/##(?:Christoph Brzezinski|Brzezinski)\b/g, "Christoph Brzezinski (CDU), Stadtrat für Stadtentwicklung, Liegenschaften und IT#+"],
        [/#(?:Christoph Brzezinski|Brzezinski)\b/g, "Christoph Brzezinski (CDU)"],
        [/##(?:Heike Schmitt-Schmelz|Schmitt-Schmelz)\b/g, "Heike Schmitt-Schmelz (SPD), Stadträtin für Schule, Sport, Weiterbildung und Kultur#+"],
        [/#(?:Heike Schmitt-Schmelz|Schmitt-Schmelz)\b/g, "Heike Schmitt-Schmelz (SPD)"],
        [/##(?:Kirstin Bauch|Bauch)\b/g, "Kirstin Bauch (Bündnis 90/Die Grüne), Bürgermeisterin und Stadträtin für Finanzen, Personal und Wirtschaftsförderung#+"],
        [/#(?:Kirstin Bauch|Bauch)\b/g, "Kirstin Bauch (Bündnis 90/Die Grüne)"],
        [/##(?:Oliver Schruoffeneger|Schruoffeneger)\b/g, "Oliver Schruoffeneger (Bündnis 90/Die Grüne), Stadtrat für Ordnung, Umwelt, Straßen und Grünflächen#+"],
        [/#(?:Oliver Schruoffeneger|Schruoffeneger)\b/g, "Oliver Schruoffeneger (Bündnis 90/Die Grüne)"],
        [/##(?:Simon Hertel|Hertel)\b/g, "Simon Hertel (CDU), Stadtrat für Jugend und Gesundheit#+"],
        [/#(?:Simon Hertel|Hertel)\b/g, "Simon Hertel (CDU)"],
        [/##(?:Dagmar Kempf|Kempf)\b/g, "Stellvertretende BV-Vorsteherin Dagmar Kempf (Bündnis 90/Die Grünen)#+"],
        [/#(?:Dagmar Kempf|Kempf)\b/g, "Dagmar Kempf (Bündnis 90/Die Grünen)"],

        // Friedrichshain-Kreuzberg – www.berlin.de/ba-friedrichshain-kreuzberg/politik-und-verwaltung/bezirksamt/
        [/##(?:Andy Hehmke|Hehmke)\b/g, "Andy Hehmke (SPD), Stadtrat für Schule, Sport und Facility Management#+"],
        [/#(?:Andy Hehmke|Hehmke)\b/g, "Andy Hehmke (SPD)"],
        [/##(?:Annika Gerold|Gerold)\b/g, "Annika Gerold (Bündnis 90/Die Grünen), Stadträtin für Verkehr, Grünflächen, Ordnung und Umwelt#+"],
        [/#(?:Annika Gerold|Gerold)\b/g, "Annika Gerold (Bündnis 90/Die Grünen)"],
        [/##(?:Werner Heck|Heck)\b/g, "BV-Vorsteher Werner Heck (Bündnis 90/Die Grünen)#+"],
        [/#(?:Werner Heck|Heck)\b/g, "Werner Heck (Bündnis 90/Die Grünen)"],
        [/##(?:Clara Herrmann|Herrmann)\b/g, "Clara Herrmann (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Finanzen, Personal, Wirtschaft, Kultur, Diversity und Klima#+"],
        [/#(?:Clara Herrmann|Herrmann)\b/g, "Clara Herrmann (Bündnis 90/Die Grünen)"],
        [/##(?:Florian Schmidt|Schmidt)\b/g, "Florian Schmidt (Bündnis 90/Die Grünen), Stadtrat für Bauen, Planen, Kooperative Stadtentwicklung#+"],
        [/#(?:Florian Schmidt|Schmidt)\b/g, "Florian Schmidt (Bündnis 90/Die Grünen)"],
        [/##(?:Max Kindler|Kindler)\b/g, "Max Kindler (CDU), Stadtrat für Jugend, Familie und Gesundheit#+"],
        [/#(?:Max Kindler|Kindler)\b/g, "Max Kindler (CDU)"],
        [/##(?:Regine Sommer-Wetter|Sommer-Wetter)\b/g, "Regine Sommer-Wetter (Die Linke), Stellvertretende Bürgermeisterin und Stadträtin für Arbeit, Bürgerdienste und Soziales#+"],
        [/#(?:Regine Sommer-Wetter|Sommer-Wetter)\b/g, "Regine Sommer-Wetter (Die Linke)"],
        [/##(?:Ulrike Juda|Juda)\b/g, "Stellvertretende BV-Vorsteherin Ulrike Juda (Die Linke)#+"],
        [/#(?:Ulrike Juda|Juda)\b/g, "Ulrike Juda (Die Linke)"],

        // Lichtenberg – www.berlin.de/ba-lichtenberg/politik-und-verwaltung/bezirksamt/
        [/##(?:Gregor Hoffmann|Hoffmann)\b/g, "BV-Vorsteher Gregor Hoffmann (CDU)#+"],
        [/#(?:Gregor Hoffmann|Hoffmann)\b/g, "Gregor Hoffmann (CDU)"],
        [/##(?:Camilla Schuler|Schuler)\b/g, "Camilla Schuler (Die Linke), Stellvertretende Bürgermeisterin und Stadträtin für Stadtentwicklung, Bauen, Facility Management und Jugend und Familie#+"],
        [/#(?:Camilla Schuler|Schuler)\b/g, "Camilla Schuler (Die Linke)"],
        [/##(?:Catrin Gocksch|Gocksch)\b/g, "Catrin Gocksch (CDU), Stadträtin für Soziales, Arbeit, Gesundheit und Bürgerdienste#+"],
        [/#(?:Catrin Gocksch|Gocksch)\b/g, "Catrin Gocksch (CDU)"],
        [/##(?:Filiz Keküllüoğlu|Keküllüoğlu)\b/g, "Filiz Keküllüoğlu (Bündnis 90/Die Grünen), Stadträtin für Verkehr, Grünflächen, Ordnung, Umwelt und Naturschutz#+"],
        [/#(?:Filiz Keküllüoğlu|Keküllüoğlu)\b/g, "Filiz Keküllüoğlu (Bündnis 90/Die Grünen)"],
        [/##(?:Martin Schaefer|Schaefer)\b/g, "Martin Schaefer (CDU), Bürgermeister und Stadtrat für Personal, Finanzen, Wirtschaft, Kultur und Sozialraumplanung#+"],
        [/#(?:Martin Schaefer|Schaefer)\b/g, "Martin Schaefer (CDU)"],
        [/##(?:Sandy Mattes|Mattes)\b/g, "Sandy Mattes (SPD), Stadträtin für Geschäftsbereichs Schule und Sport#+"],
        [/#(?:Sandy Mattes|Mattes)\b/g, "Sandy Mattes (SPD)"],
        [/##(?:Kerstin Zimmer|Zimmer)\b/g, "Stellvertretende BV-Vorsteherin Kerstin Zimmer (Die Linke)#+"],
        [/#(?:Kerstin Zimmer|Zimmer)\b/g, "Kerstin Zimmer (Die Linke)"],

        // Marzahn-Hellersdorf – www.berlin.de/ba-marzahn-hellersdorf/politik-und-verwaltung/bezirksamt/
        [/##(?:Stefan Suck|Suck)\b/g, "BV-Vorsteher Stefan Suck (CDU)#+"],
        [/#(?:Stefan Suck|Suck)\b/g, "Stefan Suck (CDU)"],
        [/##(?:Gordon Lemm|Lemm)\b/g, "Gordon Lemm (SPD), Stadtrat für Jugend, Familie und Gesundheit#+"],
        [/#(?:Gordon Lemm|Lemm)\b/g, "Gordon Lemm (SPD)"],
        [/##(?:Heike Wessoly|Wessoly)\b/g, "Heike Wessoly (CDU), Stadträtin für Stadtentwicklung#+"],
        [/#(?:Heike Wessoly|Wessoly)\b/g, "Heike Wessoly (CDU)"],
        [/##(?:Juliane Witt|Witt)\b/g, "Juliane Witt (Die Linke), Stadträtin für Soziales und Bürgerdienste#+"],
        [/#(?:Juliane Witt|Witt)\b/g, "Juliane Witt (Die Linke)"],
        [/##(?:Nadja Zivkovic|Zivkovic)\b/g, "Nadja Zivkovic (CDU), Bürgermeisterin und Stadträtin für Wirtschaftsförderung, Straßen, Grünflächen, Umwelt- und Naturschutz, Personal und Finanzen#+"],
        [/#(?:Nadja Zivkovic|Zivkovic)\b/g, "Nadja Zivkovic (CDU)"],
        [/##(?:Stefan Bley|Bley)\b/g, "Stefan Bley (CDU), Stadtrat für Schule, Sport, Weiterbildung, Kultur und Facility Management#+"],
        [/#(?:Stefan Bley|Bley)\b/g, "Stefan Bley (CDU)"],
        [/##(?:Luise Lehmann|Lehmann)\b/g, "Stellvertretende BV-Vorsteherin Luise Lehmann (SPD)#+"],
        [/#(?:Luise Lehmann|Lehmann)\b/g, "Luise Lehmann (SPD)"],

        // Mitte – www.berlin.de/ba-mitte/politik-und-verwaltung/bezirksamt/
        [/##(?:Benjamin Fritz|Fritz)\b/g, "Benjamin Fritz (CDU), Stadtrat für Schule und Sport#+"],
        [/#(?:Benjamin Fritz|Fritz)\b/g, "Benjamin Fritz (CDU)"],
        [/##(?:Jelisaweta Kamm|Kamm)\b/g, "BV-Vorsteherin Jelisaweta Kamm (Bündnis 90/Die Grünen)#+"],
        [/#(?:Jelisaweta Kamm|Kamm)\b/g, "Jelisaweta Kamm (Bündnis 90/Die Grünen)"],
        [/##(?:Carsten Spallek|Spallek)\b/g, "Carsten Spallek (CDU), Stellvertretender Bürgermeister und Stadtrat für Soziales und Bürgerdienste#+"],
        [/#(?:Carsten Spallek|Spallek)\b/g, "Carsten Spallek (CDU)"],
        [/##(?:Christoph Keller|Keller)\b/g, "Christoph Keller (Die Linke), Stadtrat für Jugend, Familie und Gesundheit#+"],
        [/#(?:Christoph Keller|Keller)\b/g, "Christoph Keller (Die Linke)"],
        [/##(?:Christopher Schriner|Schriner)\b/g, "Christopher Schriner (Bündnis 90/Die Grünen), Stadtrat für Ordnung, Umwelt, Natur, Straßen und Grünflächen#+"],
        [/#(?:Christopher Schriner|Schriner)\b/g, "Christopher Schriner (Bündnis 90/Die Grünen)"],
        [/##(?:Ephraim Gothe|Gothe)\b/g, "Ephraim Gothe (SPD), Stadtrat für Stadtentwicklung und Facility Management#+"],
        [/#(?:Ephraim Gothe|Gothe)\b/g, "Ephraim Gothe (SPD)"],
        [/##(?:Stefanie Remlinger|Remlinger)\b/g, "Stefanie Remlinger (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Personal und Finanzen sowie Weiterbildung und Kultur#+"],
        [/#(?:Stefanie Remlinger|Remlinger)\b/g, "Stefanie Remlinger (Bündnis 90/Die Grünen)"],
        [/##(?:Martin Leuschner|Leuschner)\b/g, "Stellvertretender BV-Vorsteher Martin Leuschner (CDU)#+"],
        [/#(?:Martin Leuschner|Leuschner)\b/g, "Martin Leuschner (CDU)"],

        // Neukölln – www.berlin.de/ba-neukoelln/politik-und-verwaltung/bezirksamt/
        [/##(?:Karsten Schulze|Schulze)\b/g, "BV-Vorsteher Karsten Schulze (CDU)#+"],
        [/#(?:Karsten Schulze|Schulze)\b/g, "Karsten Schulze (CDU)"],
        [/##(?:Gerrit Kringel|Kringel)\b/g, "Gerrit Kringel (CDU), Stellvertretender Bürgermeister und Stadtrat für Ordnung#+"],
        [/#(?:Gerrit Kringel|Kringel)\b/g, "Gerrit Kringel (CDU)"],
        [/##(?:Hannes Rehfeldt|Rehfeldt)\b/g, "Hannes Rehfeldt (CDU), Stadtrat für Soziales und Gesundheit#+"],
        [/#(?:Hannes Rehfeldt|Rehfeldt)\b/g, "Hannes Rehfeldt (CDU)"],
        [/##(?:Janine Wolter|Wolter)\b/g, "Janine Wolter (SPD), Stadträtin für Bildung, Kultur und Sport#+"],
        [/#(?:Janine Wolter|Wolter)\b/g, "Janine Wolter (SPD)"],
        [/##(?:Jochen Biedermann|Biedermann)\b/g, "Jochen Biedermann (Bündnis 90/Die Grünen), Stadtrat für Stadtentwicklung, Umwelt und Verkehr#+"],
        [/#(?:Jochen Biedermann|Biedermann)\b/g, "Jochen Biedermann (Bündnis 90/Die Grünen)"],
        [/##(?:Martin Hikel|Hikel)\b/g, "Martin Hikel (SPD), Bürgermeister und Stadtrat für Bürgerdienste, Facility Management, Gleichstellung und Wirtschaftsförderung#+"],
        [/#(?:Martin Hikel|Hikel)\b/g, "Martin Hikel (SPD)"],
        [/##(?:Sarah Nagel|Nagel)\b/g, "Sarah Nagel (Die Linke), Stadträtin für Jugend#+"],
        [/#(?:Sarah Nagel|Nagel)\b/g, "Sarah Nagel (Die Linke)"],
        [/##(?:Lars Oeverdieck|Oeverdieck)\b/g, "Stellvertretender BV-Vorsteher Lars Oeverdieck (SPD)#+"],
        [/#(?:Lars Oeverdieck|Oeverdieck)\b/g, "Lars Oeverdieck (SPD)"],

        // Pankow – www.berlin.de/ba-pankow/politik-und-verwaltung/bezirksamt/
        [/##(?:Oliver Jütting|Jütting)\b/g, "BV-Vorsteher Oliver Jütting (Bündnis 90/Die Grünen)#+"],
        [/#(?:Oliver Jütting|Jütting)\b/g, "Oliver Jütting (Bündnis 90/Die Grünen)"],
        [/##(?:Cornelius Bechtler|Bechtler)\b/g, "Cornelius Bechtler (Bündnis 90/Die Grünen), Stadtrat für Stadtentwicklung und Bürgerdienste#+"],
        [/#(?:Cornelius Bechtler|Bechtler)\b/g, "Cornelius Bechtler (Bündnis 90/Die Grünen)"],
        [/##(?:Dominique Krössin|Krössin)\b/g, "Dominique Krössin (Die Linke), Stadträtin für Geschäftsbereichs Soziales und Gesundheit#+"],
        [/#(?:Dominique Krössin|Krössin)\b/g, "Dominique Krössin (Die Linke)"],
        [/##(?:Cordelia Koch|Koch)\b/g, "Cordelia Koch (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Finanzen, Personal, Weiterbildung und Kultur, Wirtschaftsförderung#+"],
        [/#(?:Cordelia Koch|Koch)\b/g, "Cordelia Koch (Bündnis 90/Die Grünen)"],
        [/##(?:Jörn Pasternack|Pasternack)\b/g, "Jörn Pasternack (CDU), Stadtrat für Schule, Sport und Facility Management#+"],
        [/#(?:Jörn Pasternack|Pasternack)\b/g, "Jörn Pasternack (CDU)"],
        [/##(?:Manuela Anders-Granitzki|Anders-Granitzki)\b/g, "Manuela Anders-Granitzki (CDU), Stellvertretende Bürgermeisterin und Stadträtin für Ordnungsamt, Straßen- und Grünflächenamt und dem Umwelt- und Naturschutzamt#+"],
        [/#(?:Manuela Anders-Granitzki|Anders-Granitzki)\b/g, "Manuela Anders-Granitzki (CDU)"],
        [/##(?:Rona Tietje|Tietje)\b/g, "Rona Tietje (SPD), Stadträtin für Jugend und Familie#+"],
        [/#(?:Rona Tietje|Tietje)\b/g, "Rona Tietje (SPD)"],
        [/##(?:David Paul|Paul)\b/g, "Stellvertretender BV-Vorsteher David Paul (CDU)#+"],
        [/#(?:David Paul|Paul)\b/g, "David Paul (CDU)"],

        // Reinickendorf – www.berlin.de/ba-reinickendorf/politik-und-verwaltung/bezirksamt/
        [/##(?:Alexander Ewers|Ewers)\b/g, "Alexander Ewers (SPD), Stadtrat für Jugend und Familie#+"],
        [/#(?:Alexander Ewers|Ewers)\b/g, "Alexander Ewers (SPD)"],
        [/##(?:BV-Vorsteherin Kerstin Köppen|Köppen)\b/g, "BV-Vorsteherin Kerstin Köppen (CDU)#+"],
        [/#(?:Kerstin Köppen|Köppen)\b/g, "Kerstin Köppen (CDU)"],
        [/##(?:Emine Demirbüken-Wegner|Demirbüken-Wegner)\b/g, "Emine Demirbüken-Wegner (CDU), Bürgermeisterin und Stadträtin für Finanzen, Personal und Bürgerdienste#+"],
        [/#(?:Emine Demirbüken-Wegner|Demirbüken-Wegner)\b/g, "Emine Demirbüken-Wegner (CDU)"],
        [/##(?:Harald Muschner|Muschner)\b/g, "Harald Muschner (CDU), Stadtrat für Bildung, Sport, Kultur und Facility Management#+"],
        [/#(?:Harald Muschner|Muschner)\b/g, "Harald Muschner (CDU)"],
        [/##(?:Julia Schrod-Thiel|Schrod-Thiel)\b/g, "Julia Schrod-Thiel (CDU), Stadträtin für Ordnung, Umwelt und Verkehr#+"],
        [/#(?:Julia Schrod-Thiel|Schrod-Thiel)\b/g, "Julia Schrod-Thiel (CDU)"],
        [/##(?:Korinna Stephan|Stephan)\b/g, "Korinna Stephan (Bündnis 90/Die Grünen), Stadträtin für Stadtentwicklung#+"],
        [/#(?:Korinna Stephan|Stephan)\b/g, "Korinna Stephan (Bündnis 90/Die Grünen)"],
        [/##(?:Sevda Boyraci|Boyraci)\b/g, "Stellvertretende BV-Vorsteherin Sevda Boyraci (SPD)#+"],
        [/#(?:Sevda Boyraci|Boyraci)\b/g, "Sevda Boyraci (SPD)"],
        [/##(?:Uwe Brockhausen|Brockhausen)\b/g, "Uwe Brockhausen (SPD), Stellvertretender Bürgermeister und Stadtrat für Soziales und Gesundheit#+"],
        [/#(?:Uwe Brockhausen|Brockhausen)\b/g, "Uwe Brockhausen (SPD)"],

        // Steglitz-Zehlendorf – www.berlin.de/ba-steglitz-zehlendorf/politik-und-verwaltung/bezirksamt/
        [/##(?:René Rögner-Francke|Rögner-Francke)\b/g, "BV-Vorsteher René Rögner-Francke (CDU)#+"],
        [/#(?:René Rögner-Francke|Rögner-Francke)\b/g, "René Rögner-Francke (CDU)"],
        [/##(?:Carolina Böhm|Böhm)\b/g, "Carolina Böhm (SPD), Stadträtin für Jugend und Gesundheit#+"],
        [/#(?:Carolina Böhm|Böhm)\b/g, "Carolina Böhm (SPD)"],
        [/##(?:Maren Schellenberg|Schellenberg)\b/g, "Maren Schellenberg (Bündnis 90/Die Grünen), Bürgermeisterin und Stadträtin für Finanzen, Personal und Facility Management#+"],
        [/#(?:Maren Schellenberg|Schellenberg)\b/g, "Maren Schellenberg (Bündnis 90/Die Grünen)"],
        [/##(?:Patrick Steinhoff|Steinhoff)\b/g, "Patrick Steinhoff (CDU), Stadtrat für Stadtentwicklung, Schule und Sport#+"],
        [/#(?:Patrick Steinhoff|Steinhoff)\b/g, "Patrick Steinhoff (CDU)"],
        [/##(?:Sören Grawert|Grawert)\b/g, "Stellvertretender BV-Vorsteher Sören Grawert (FDP)#+"],
        [/#(?:Sören Grawert|Grawert)\b/g, "Sören Grawert (FDP)"],
        [/##(?:Tim Richter|Richter)\b/g, "Tim Richter (CDU), Stellvertretender Bürgermeister und Stadtrat für Bürgerdienste, Soziales, Bildung und Kultur#+"],
        [/#(?:Tim Richter|Richter)\b/g, "Tim Richter (CDU)"],
        [/##(?:Urban Aykal|Aykal)\b/g, "Urban Aykal (Bündnis 90/Die Grünen), Stadtrat für Ordnung, Umwelt- und Naturschutz, Straßen und Grünflächen#+"],
        [/#(?:Urban Aykal|Aykal)\b/g, "Urban Aykal (Bündnis 90/Die Grünen)"],

        // Spandau – www.berlin.de/ba-spandau/politik-und-verwaltung/bezirksamt/das-kollegium/
        [/##(?:Christian Heck|Heck)\b/g, "BV-Vorsteher Christian Heck (CDU)#+"],
        [/#(?:Christian Heck|Heck)\b/g, "Christian Heck (CDU)"],
        [/##(?:Carola Brückner|Brückner)\b/g, "Carola Brückner (SPD), Stellvertretende Bürgermeisterin und Stadträtin für Bildung, Kultur, Sport und Facility Management#+"],
        [/#(?:Carola Brückner|Brückner)\b/g, "Carola Brückner (SPD)"],
        [/##(?:Frank Bewig|Bewig)\b/g, "Frank Bewig (CDU), Bürgermeister und Stadtrat für Personal, Finanzen und Wirtschaftsförderung#+"],
        [/#(?:Frank Bewig|Bewig)\b/g, "Frank Bewig (CDU)"],
        [/##(?:Gregor Kempert|Kempert)\b/g, "Gregor Kempert (SPD), Stadtrat für Abteilung Soziales und Bürgerdienste#+"],
        [/#(?:Gregor Kempert|Kempert)\b/g, "Gregor Kempert (SPD)"],
        [/##(?:Uwe Ziesak|Ziesak)\b/g, "Stellvertretender BV-Vorsteher Uwe Ziesak (SPD)#+"],
        [/#(?:Uwe Ziesak|Ziesak)\b/g, "Uwe Ziesak (SPD)"],
        [/##(?:Tanja Franzke|Franzke)\b/g, "Tanja Franzke (CDU), Stadträtin für Jugend und Gesundheit#+"],
        [/#(?:Tanja Franzke|Franzke)\b/g, "Tanja Franzke (CDU)"],
        [/##(?:Thorsten Schatz|Schatz)\b/g, "Thorsten Schatz (CDU), Stadtrat für Bauen, Planen, Umwelt- und Naturschutz#+"],
        [/#(?:Thorsten Schatz|Schatz)\b/g, "Thorsten Schatz (CDU)"],

        // Tempelhof-Schöneberg – www.berlin.de/ba-tempelhof-schoeneberg/politik-und-verwaltung/
        [/##(?:Stefan Böltes|Böltes)\b/g, "BV-Vorsteher Stefan Böltes (SPD)#+"],
        [/#(?:Stefan Böltes|Böltes)\b/g, "Stefan Böltes (SPD)"],
        [/##(?:Saskia Ellenbeck|Ellenbeck)\b/g, "Saskia Ellenbeck (Bündnis 90/Die Grünen), Stadträtin für Ordnung, Straßen, Grünflächen, Umwelt und Naturschutz#+"],
        [/#(?:Saskia Ellenbeck|Ellenbeck)\b/g, "Saskia Ellenbeck (Bündnis 90/Die Grünen)"],
        [/##(?:Eva Majewski|Majewski)\b/g, "Eva Majewski (CDU), Stadträtin für Stadtentwicklung und Facility Management#+"],
        [/#(?:Eva Majewski|Majewski)\b/g, "Eva Majewski (CDU)"],
        [/##(?:Jörn Oltmann|Oltmann)\b/g, "Jörn Oltmann (Bündnis 90/Die Grünen), Bürgermeister für Finanzen, Personal, Wirtschaftsförderung und Koordination#+"],
        [/#(?:Jörn Oltmann|Oltmann)\b/g, "Jörn Oltmann (Bündnis 90/Die Grünen)"],
        [/##(?:Matthias Steuckardt|Steuckardt)\b/g, "Matthias Steuckardt (CDU), Stellvertretender Bürgermeister und Stadtrat für Bürgerdienste, Soziales und Senioren#+"],
        [/#(?:Matthias Steuckardt|Steuckardt)\b/g, "Matthias Steuckardt (CDU)"],
        [/##(?:Oliver Schworck|Schworck)\b/g, "Oliver Schworck (SPD), Stadtrat für Jugend und Gesundheit#+"],
        [/#(?:Oliver Schworck|Schworck)\b/g, "Oliver Schworck (SPD)"],
        [/##(?:Martina Zander-Rade|Zander-Rade)\b/g, "Stellvertretende BV-Vorsteherin Martina Zander-Rade (Bündnis 90/Die Grünen)#+"],
        [/#(?:Martina Zander-Rade|Zander-Rade)\b/g, "Martina Zander-Rade (Bündnis 90/Die Grünen)"],
        [/##(?:Tobias Dollase|Dollase)\b/g, "Tobias Dollase (parteilos für die CDU), Stadtrat für Schule, Sport, Weiterbildung und Kultur#+"],
        [/#(?:Tobias Dollase|Dollase)\b/g, "Tobias Dollase (parteilos für die CDU)"],

        // Treptow-Köpenick – www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksamt/artikel.5752.php
        [/##(?:André Grammelsdorff|Grammelsdorff)\b/g, "André Grammelsdorff (CDU), Stellvertretender Bürgermeister und Stadtrat für Jugend#+"],
        [/#(?:André Grammelsdorff|Grammelsdorff)\b/g, "André Grammelsdorff (CDU)"],
        [/##(?:Bernd Geschanowski|Geschanowski)\b/g, "Bernd Geschanowski (AfD), Stadtrat für Öffentliche Ordnung#+"],
        [/#(?:Bernd Geschanowski|Geschanowski)\b/g, "Bernd Geschanowski (AfD)"],
        [/##(?:Peter Groos|Groos)\b/g, "BV-Vorsteher Peter Groos (SPD)#+"],
        [/#(?:Peter Groos|Groos)\b/g, "Peter Groos (SPD)"],
        [/##(?:Carolin Weingart|Weingart)\b/g, "Carolin Weingart (Die Linke), Stadträtin für Soziales, Gesundheit, Arbeit und Teilhabe#+"],
        [/#(?:Carolin Weingart|Weingart)\b/g, "Carolin Weingart (Die Linke)"],
        [/##(?:Claudia Leistner|Leistner)\b/g, "Claudia Leistner (Bündnis 90/Die Grünen), Stadträtin für Stadtentwicklung, Straßen, Grünflächen und Umwelt#+"],
        [/#(?:Claudia Leistner|Leistner)\b/g, "Claudia Leistner (Bündnis 90/Die Grünen)"],
        [/##(?:Marco Brauchmann|Brauchmann)\b/g, "Marco Brauchmann (CDU), Stadtrat für Weiterbildung, Schule, Kultur und Sport#+"],
        [/#(?:Marco Brauchmann|Brauchmann)\b/g, "Marco Brauchmann (CDU)"],
        [/##(?:Oliver Igel|Igel)\b/g, "Oliver Igel (SPD), Bürgermeister und Stadtrat für Bürgerdienste, Personal, Finanzen, Immobilien und Wirtschaft#+"],
        [/#(?:Oliver Igel|Igel)\b/g, "Oliver Igel (SPD)"],
        [/##(?:André Schubert|Schubert)\b/g, "Stellvertretende BV-Vorsteher André Schubert (Die Linke)#+"],
        [/#(?:André Schubert|Schubert)\b/g, "André Schubert (Die Linke)"],

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
  ];

  // === Ersetzungsfunktionen ===
  function applyReplacements(text, rules) {
    let result = text;
    rules.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, (...args) =>
        replacement.replace(/\$(\d+)/g, (_, n) => args[parseInt(n)])
      );
    });
    return result;
  }

  function replaceTextNodesWithRules(el, rules) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const original = node.nodeValue;
      const replaced = applyReplacements(original, rules);
      if (replaced !== original) node.nodeValue = replaced;
    }
  }

  function replaceInputWithRules(input, rules) {
    if (!input || typeof input.value !== 'string') return;
    const original = input.value;
    const updated = applyReplacements(original, rules);
    if (updated !== original) input.value = updated;
  }

  function setCursorToEnd(el) {
    if (!el || !el.isContentEditable) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // === STRG+S: Grundregeln ===
  function manualReplaceBase() {
    console.log("🧠 STRG+S: Grundregeln");
    const active = document.activeElement;
    document.querySelectorAll('.ProseMirror[contenteditable="true"]').forEach(el =>
      replaceTextNodesWithRules(el, baseReplacements)
    );
    replaceInputWithRules(document.querySelector('#moduleTitle'), baseReplacements);
    replaceInputWithRules(document.querySelector('#positionInfo'), baseReplacements);
    if (active?.isContentEditable) setCursorToEnd(active);
  }

  // === STRG+ALT+S: #-Regeln ===
  function manualReplaceHashtags() {
    console.log("🔍 STRG+ALT+S: Hashtag-Regeln");
    const active = document.activeElement;
    document.querySelectorAll('.ProseMirror[contenteditable="true"]').forEach(el =>
      replaceTextNodesWithRules(el, hashtagReplacements)
    );
    replaceInputWithRules(document.querySelector('#moduleTitle'), hashtagReplacements);
    replaceInputWithRules(document.querySelector('#positionInfo'), hashtagReplacements);
    if (active?.isContentEditable) setCursorToEnd(active);
  }

  // === Tastenkombinationen ===
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      manualReplaceBase();
    }
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      manualReplaceHashtags();
    }
  });

    // SuperERASER für PPS in PEIQ (Unerwünschte Absätze und Makros entfernen mit STRG + E)

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();

            const selection = window.getSelection();
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

            if (range && selection.toString().length > 0) {
                const selectedText = selection.toString();

                // Bereinigung: Zeilenumbrüche, doppelte Leerzeichen, unsichtbare Zeichen, Word-Makros
                const cleanedText = selectedText
                .replace(/(\r\n|\n|\r)/gm, ' ') // Zeilenumbrüche → Leerzeichen
                .replace(/\u200B|\uFEFF/g, '') // Zero Width Space & BOM
                .replace(/<o:p>.*?<\/o:p>/gi, '') // Word-Makro-Tags
                .replace(/<span[^>]*mso-[^>]*>.*?<\/span>/gi, '') // Word-Formatierungen
                .replace(/&nbsp;|&shy;/gi, ' ') // Sonderzeichen → Leerzeichen
                .replace(/\s{2,}/g, ' ') // doppelte Leerzeichen
                .trim();

                // Ersetze den markierten Text durch die bereinigte Version
                range.deleteContents();
                range.insertNode(document.createTextNode(cleanedText));

                // Auswahl aufheben
                selection.removeAllRanges();
            }
        }
    });

// SuperLINK für PPS in PEIQ (YOURLS-Tool-Integration für ShortLinks per STRG + L)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();

        const active = document.activeElement;
        if (!active || !active.isContentEditable || !active.classList.contains('ProseMirror')) {
            alert("Bitte zuerst eine URL im Fließtext markieren.");
            return;
        }

        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const selectedText = selection.toString().trim();

        if (!range || selectedText.length === 0) {
            alert("Bitte eine gültige URL markieren.");
            return;
        }

        let longUrl = selectedText;
        if (!longUrl.match(/^https?:\/\//)) {
            longUrl = 'https://' + longUrl;
            console.log("🔧 Protokoll ergänzt:", longUrl);
        }

        if (!longUrl.match(/^https?:\/\/\S+$/)) {
            alert("Bitte eine gültige URL markieren.");
            return;
        }

        const apiEndpoint = 'https://bwurl.de/yourls-api.php';
        const signature = GM_getValue("yourlsToken", "");

        if (!signature || signature.trim() === "") {
            alert("Fehler: Kein YOURLS-Token gefunden.\nBitte über das Tampermonkey-Menü → 'YOURLS-Token setzen' eingeben.");
            return;
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: `${apiEndpoint}?signature=${signature}&action=shorturl&format=simple&url=${encodeURIComponent(longUrl)}`,
            onload: function(response) {
                const shortUrl = response.responseText.trim();
                console.log("YOURLS-Rohantwort:", shortUrl);

                if (shortUrl.match(/^https?:\/\/\S+$/)) {
                    try {
                        range.deleteContents();
                        range.insertNode(document.createTextNode(shortUrl));
                        window.getSelection().removeAllRanges();
                        console.log("✅ ShortURL eingefügt:", shortUrl);
                    } catch (err) {
                        console.warn("⚠️ Fallback wird verwendet:", err);
                        document.execCommand('insertText', false, shortUrl);
                    }
                } else {
                    console.error("❌ Ungültige YOURLS-Antwort:", shortUrl);
                    alert("Fehler: YOURLS-Antwort ist ungültig.");
                }
            },
            onerror: function(err) {
                console.error("❌ Fehler bei YOURLS-Anfrage:", err);
                alert("Verbindungsfehler zu YOURLS.");
            }
        });
    }
});


GM_registerMenuCommand("📋 SuperMAX-Shortcuts anzeigen", () => {
    alert(
        "🔧 SuperMAX Tastaturkürzel:\n\n" +
        "📝 STRG + S → Textphrasen ersetzen\n" +
        "🧹 STRG + E → Umbrüche, Makros und Links entfernen\n" +
        "🔗 STRG + SHIFT + L → URL kürzen mit YOURLS\n" +
        "🔑 Menü → YOURLS-Token setzen/anzeigen/löschen\n"
    );
});


})();