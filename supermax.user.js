// ==UserScript==
// @name         SuperMAX 3.4.1
// @author       Frank Luhn, Berliner Woche ©2025 (optimiert für PPS unter PEIQ)
// @namespace    https://pps.berliner-woche.de
// @version      3.4.1
// @description  Grundregeln per STRG+S. #-Textphrasen per STRG+ALT+S. SuperERASER entfernt Umbrüche, Makros und Hyperlinks per STRG+E. SuperLINK kürzt URLs per STRG+L. SuperRED erzeugt Artikelbeschreibung per STRG+R. Token-Verwaltung. Updates via GitHub.
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
    const token = prompt("Bitte gib Deinen YOURLS-Token ein:");
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
    const confirmDelete = confirm("Möchtest Du den gespeicherten Token wirklich löschen?");
    if (confirmDelete) {
        GM_setValue("yourlsToken", "");
        alert("Token wurde gelöscht.");
    }
});

console.log("SuperMAX läuft!");

(function () {
    'use strict';
    console.log("SuperMAX v3.4.1 gestartet");

// === RegEx-Listen ===
// === STRG+S: Grundregeln ===
const baseReplacements = [
    // Opening
    [/(?<!Kar)(S|s)amstag/g, "$1onnabend"], // Samstag wird Sonnabend inklusive Feiertagsregelung
    [/Die drei \?{3}/g, "DREI_FRAGE"], // Debugging
    [/Die drei !{3}/g, "DREI_AUSRUFE"], // Debugging
    [/\b(\d{1,4})\s*[–-]\s*(\d{1,4})\b/g, "$1-$2"], // Gedankenstrich zwischen zwei Zahlen wird Bindestrich
    [/(\b[a-zA-ZäöüÄÖÜß]{2,})\s*–\s*([a-zA-ZäöüÄÖÜß]{2,}\b)/g, "$1\u202F–\u202F$2"], // Gedankenstrich mit optionalen Leerzeichen wird Gedankenstrich mit geschütztem Leerzeichen
    [/(\b[a-zA-ZäöüÄÖÜß]{2,})\s-\s([a-zA-ZäöüÄÖÜß]{2,}\b)/g, "$1\u202F–\u202F$2"], // Bindestrich mit Leerzeichen wird Gedankenstrich mit geschütztem Leerzeichen
    [/(?<=\b[a-zA-ZäöüÄÖÜß]{3,})\s*\/\s*(?=[a-zA-ZäöüÄÖÜß]{3,}\b)/g, "\u202F/\u202F"], // Slash zwischen zwei Wörtern mit geschützten Leerzeichen
    [/(\(?\d+)(\s*)(\/)(\s*)(\(?\d+)/g, "$1$3$5"], // Slash zwischen zwei Zahlen ohne Leerzeichen

    // Autorenkürzel Debugging
    [/(^|\s)cs(?=\s|$)/g, "\u202Fcs"], // Christian Sell
    [/(^|\s)FL(?=\s|$)/g, "\u202FFL"], // Frank Luhn
    [/(^|\s)go(?=\s|$)/g, "\u202Fgo"], // Simone Gogol-Grützner
    [/(^|\s)mv(?=\s|$)/g, "\u202Fmv"], // Michael Vogt
    [/(^|\s)my(?=\s|$)/g, "\u202Fmy"], // Manuela Frey
    [/(^|\s)st(?=\s|$)/g, "\u202Fst"], // Hendrik Stein
    [/(^|\s)pam(?=\s|$)/g, "\u202Fpam"], // Pamela Rabe
    [/(^|\s)PR(?=\s|$)/g, "\u202FPR"], // Pamela Rabe
    [/(^|\s)pb(?=\s|$)/g, "\u202Fpb"], // Parvin Buchta
    [/(^|\s)pet(?=\s|$)/g, "\u202Fpet"], // Peter Erdmann
    [/(^|\s)sabka(?=\s|$)/g, "\u202Fsabka"], // Sabine Kalkus
    [/(^|\s)sus(?=\s|$)/g, "\u202Fsus"], // Susanne Schilp
    [/(^|\s)tf(?=\s|$)/g, "\u202Ftf"], // Thomas Frey
    [/(^|\s)RR(?=\s|$)/g, "\u202FRR"], // Ratgeber-Redaktion
    [/(^|\s)akz(?=\s|$)/g, "\u202Fakz"], // Ratgeber-Redaktion
    [/(^|\s)BZfE(?=\s|$)/g, "\u202FBZfE"], // Ratgeber-Redaktion
    [/(^|\s)DEKRA info(?=\s|$)/g, "\u202FDEKRA info"], // Ratgeber-Redaktion
    [/(^|\s)dgk(?=\s|$)/g, "\u202Fdgk"], // Ratgeber-Redaktion
    [/(^|\s)djd(?=\s|$)/g, "\u202Fdjd"], // Ratgeber-Redaktion
    [/(^|\s)PM(?=\s|$)/g, "\u202FPM"], // Ratgeber-Redaktion
    [/(^|\s)IVH(?=\s|$)/g, "\u202FIVH"], // Ratgeber-Redaktion
    [/(^|\s)ProMotor(?=\s|$)/g, "\u202FProMotor"], // Ratgeber-Redaktion
    [/(^|\s)txn(?=\s|$)/g, "\u202Ftxn"], // Ratgeber-Redaktion

    // Ortsmarken Debugging
    [/(^)Adlershof\.(?=\u0020|$)/g, "Adlershof.\u202F"],
    [/(^)Altglienicke\.(?=\u0020|$)/g, "Altglienicke.\u202F"],
    [/(^)Alt-Hohenschönhausen\.(?=\u0020|$)/g, "Alt-Hohenschönhausen.\u202F"],
    [/(^)Alt-Treptow\.(?=\u0020|$)/g, "Alt-Treptow.\u202F"],
    [/(^)Baumschulenweg\.(?=\u0020|$)/g, "Baumschulenweg.\u202F"],
    [/(^)Berlin\.(?=\u0020|$)/g, "Berlin.\u202F"],
    [/(^)Biesdorf\.(?=\u0020|$)/g, "Biesdorf.\u202F"],
    [/(^)Blankenburg\.(?=\u0020|$)/g, "Blankenburg.\u202F"],
    [/(^)Blankenfelde\.(?=\u0020|$)/g, "Blankenfelde.\u202F"],
    [/(^)Bohnsdorf\.(?=\u0020|$)/g, "Bohnsdorf.\u202F"],
    [/(^)Borsigwalde\.(?=\u0020|$)/g, "Borsigwalde.\u202F"],
    [/(^)Britz\.(?=\u0020|$)/g, "Britz.\u202F"],
    [/(^)Buch\.(?=\u0020|$)/g, "Buch.\u202F"],
    [/(^)Buckow\.(?=\u0020|$)/g, "Buckow.\u202F"],
    [/(^)Charlottenburg\.(?=\u0020|$)/g, "Charlottenburg.\u202F"],
    [/(^)Charlottenburg-Nord\.(?=\u0020|$)/g, "Charlottenburg-Nord.\u202F"],
    [/(^)Charlottenburg-Wilmersdorf\.(?=\u0020|$)/g, "Charlottenburg-Wilmersdorf.\u202F"],
    [/(^)Dahlem\.(?=\u0020|$)/g, "Dahlem.\u202F"],
    [/(^)Falkenberg\.(?=\u0020|$)/g, "Falkenberg.\u202F"],
    [/(^)Falkenhagener Feld\.(?=\u0020|$)/g, "Falkenhagener Feld.\u202F"],
    [/(^)Fennpfuhl\.(?=\u0020|$)/g, "Fennpfuhl.\u202F"],
    [/(^)Französisch Buchholz\.(?=\u0020|$)/g, "Französisch Buchholz.\u202F"],
    [/(^)Friedenau\.(?=\u0020|$)/g, "Friedenau.\u202F"],
    [/(^)Friedrichsfelde\.(?=\u0020|$)/g, "Friedrichsfelde.\u202F"],
    [/(^)Friedrichshagen\.(?=\u0020|$)/g, "Friedrichshagen.\u202F"],
    [/(^)Friedrichshain\.(?=\u0020|$)/g, "Friedrichshain.\u202F"],
    [/(^)Friedrichshain-Kreuzberg\.(?=\u0020|$)/g, "Friedrichshain-Kreuzberg.\u202F"],
    [/(^)Frohnau\.(?=\u0020|$)/g, "Frohnau.\u202F"],
    [/(^)Gatow\.(?=\u0020|$)/g, "Gatow.\u202F"],
    [/(^)Gesundbrunnen\.(?=\u0020|$)/g, "Gesundbrunnen.\u202F"],
    [/(^)Gropiusstadt\.(?=\u0020|$)/g, "Gropiusstadt.\u202F"],
    [/(^)Grünau\.(?=\u0020|$)/g, "Grünau.\u202F"],
    [/(^)Grunewald\.(?=\u0020|$)/g, "Grunewald.\u202F"],
    [/(^)Hakenfelde\.(?=\u0020|$)/g, "Hakenfelde.\u202F"],
    [/(^)Halensee\.(?=\u0020|$)/g, "Halensee.\u202F"],
    [/(^)Hansaviertel\.(?=\u0020|$)/g, "Hansaviertel.\u202F"],
    [/(^)Haselhorst\.(?=\u0020|$)/g, "Haselhorst.\u202F"],
    [/(^)Heiligensee\.(?=\u0020|$)/g, "Heiligensee.\u202F"],
    [/(^)Heinersdorf\.(?=\u0020|$)/g, "Heinersdorf.\u202F"],
    [/(^)Hellersdorf\.(?=\u0020|$)/g, "Hellersdorf.\u202F"],
    [/(^)Hermsdorf\.(?=\u0020|$)/g, "Hermsdorf.\u202F"],
    [/(^)Johannisthal\.(?=\u0020|$)/g, "Johannisthal.\u202F"],
    [/(^)Karlshorst\.(?=\u0020|$)/g, "Karlshorst.\u202F"],
    [/(^)Karow\.(?=\u0020|$)/g, "Karow.\u202F"],
    [/(^)Kaulsdorf\.(?=\u0020|$)/g, "Kaulsdorf.\u202F"],
    [/(^)Kladow\.(?=\u0020|$)/g, "Kladow.\u202F"],
    [/(^)Konradshöhe\.(?=\u0020|$)/g, "Konradshöhe.\u202F"],
    [/(^)Köpenick\.(?=\u0020|$)/g, "Köpenick.\u202F"],
    [/(^)Kreuzberg\.(?=\u0020|$)/g, "Kreuzberg.\u202F"],
    [/(^)Lankwitz\.(?=\u0020|$)/g, "Lankwitz.\u202F"],
    [/(^)Lichtenberg\.(?=\u0020|$)/g, "Lichtenberg.\u202F"],
    [/(^)Lichtenrade\.(?=\u0020|$)/g, "Lichtenrade.\u202F"],
    [/(^)Lichterfelde\.(?=\u0020|$)/g, "Lichterfelde.\u202F"],
    [/(^)Lübars\.(?=\u0020|$)/g, "Lübars.\u202F"],
    [/(^)Mahlsdorf\.(?=\u0020|$)/g, "Mahlsdorf.\u202F"],
    [/(^)Malchow\.(?=\u0020|$)/g, "Malchow.\u202F"],
    [/(^)Mariendorf\.(?=\u0020|$)/g, "Mariendorf.\u202F"],
    [/(^)Marienfelde\.(?=\u0020|$)/g, "Marienfelde.\u202F"],
    [/(^)Märkisches Viertel\.(?=\u0020|$)/g, "Märkisches Viertel.\u202F"],
    [/(^)Marzahn\.(?=\u0020|$)/g, "Marzahn.\u202F"],
    [/(^)Marzahn-Hellersdorf\.(?=\u0020|$)/g, "Marzahn-Hellersdorf.\u202F"],
    [/(^)Mitte\.(?=\u0020|$)/g, "Mitte.\u202F"],
    [/(^)Moabit\.(?=\u0020|$)/g, "Moabit.\u202F"],
    [/(^)Müggelheim\.(?=\u0020|$)/g, "Müggelheim.\u202F"],
    [/(^)Neu-Hohenschönhausen\.(?=\u0020|$)/g, "Neu-Hohenschönhausen.\u202F"],
    [/(^)Neukölln\.(?=\u0020|$)/g, "Neukölln.\u202F"],
    [/(^)Niederschöneweide\.(?=\u0020|$)/g, "Niederschöneweide.\u202F"],
    [/(^)Niederschönhausen\.(?=\u0020|$)/g, "Niederschönhausen.\u202F"],
    [/(^)Nikolassee\.(?=\u0020|$)/g, "Nikolassee.\u202F"],
    [/(^)Oberschöneweide\.(?=\u0020|$)/g, "Oberschöneweide.\u202F"],
    [/(^)Pankow\.(?=\u0020|$)/g, "Pankow.\u202F"],
    [/(^)Plänterwald\.(?=\u0020|$)/g, "Plänterwald.\u202F"],
    [/(^)Prenzlauer Berg\.(?=\u0020|$)/g, "Prenzlauer Berg.\u202F"],
    [/(^)Rahnsdorf\.(?=\u0020|$)/g, "Rahnsdorf.\u202F"],
    [/(^)Reinickendorf\.(?=\u0020|$)/g, "Reinickendorf.\u202F"],
    [/(^)Rosenthal\.(?=\u0020|$)/g, "Rosenthal.\u202F"],
    [/(^)Rudow\.(?=\u0020|$)/g, "Rudow.\u202F"],
    [/(^)Rummelsburg\.(?=\u0020|$)/g, "Rummelsburg.\u202F"],
    [/(^)Schlachtensee\.(?=\u0020|$)/g, "Schlachtensee.\u202F"],
    [/(^)Schmargendorf\.(?=\u0020|$)/g, "Schmargendorf.\u202F"],
    [/(^)Schmöckwitz\.(?=\u0020|$)/g, "Schmöckwitz.\u202F"],
    [/(^)Schöneberg\.(?=\u0020|$)/g, "Schöneberg.\u202F"],
    [/(^)Siemensstadt\.(?=\u0020|$)/g, "Siemensstadt.\u202F"],
    [/(^)Spandau\.(?=\u0020|$)/g, "Spandau.\u202F"],
    [/(^)Stadtrandsiedlung Malchow\.(?=\u0020|$)/g, "Stadtrandsiedlung Malchow.\u202F"],
    [/(^)Steglitz\.(?=\u0020|$)/g, "Steglitz.\u202F"],
    [/(^)Steglitz-Zehlendorf\.(?=\u0020|$)/g, "Steglitz-Zehlendorf.\u202F"],
    [/(^)Tegel\.(?=\u0020|$)/g, "Tegel.\u202F"],
    [/(^)Tempelhof\.(?=\u0020|$)/g, "Tempelhof.\u202F"],
    [/(^)Tempelhof-Schöneberg\.(?=\u0020|$)/g, "Tempelhof-Schöneberg.\u202F"],
    [/(^)Tiergarten\.(?=\u0020|$)/g, "Tiergarten.\u202F"],
    [/(^)Treptow-Köpenick\.(?=\u0020|$)/g, "Treptow-Köpenick.\u202F"],
    [/(^)Waidmannslust\.(?=\u0020|$)/g, "Waidmannslust.\u202F"],
    [/(^)Wartenberg\.(?=\u0020|$)/g, "Wartenberg.\u202F"],
    [/(^)Wedding\.(?=\u0020|$)/g, "Wedding.\u202F"],
    [/(^)Weißensee\.(?=\u0020|$)/g, "Weißensee.\u202F"],
    [/(^)Westend\.(?=\u0020|$)/g, "Westend.\u202F"],
    [/(^)Wilhelmsruh\.(?=\u0020|$)/g, "Wilhelmsruh.\u202F"],
    [/(^)Wilhelmstadt\.(?=\u0020|$)/g, "Wilhelmstadt.\u202F"],
    [/(^)Wilmersdorf\.(?=\u0020|$)/g, "Wilmersdorf.\u202F"],
    [/(^)Wittenau\.(?=\u0020|$)/g, "Wittenau.\u202F"],
    [/(^)Zehlendorf\.(?=\u0020|$)/g, "Zehlendorf.\u202F"],

    // Richtig Gendern (setzt automatisch weibliche Form voran)
    [/\bAnwohner und Anwohnerinnen/g, "Anwohnerinnen und Anwohner"],
    [/\bArbeitnehmer und Arbeitnehmerinnen/g, "Arbeitnehmerinnen und Arbeitnehmer"],
    [/arbeitnehmer[\\*\\:\\|]innenfreundliche/gi, "arbeitnehmerfreundliche"],
    [/\bÄrzte und Ärztinnen/g, "Ärztinnen und Ärzte"],
    [/\bAussteller und Ausstellerinnen/g, "Ausstellerinnen und Aussteller"],
    [/\bAutofahrer und Autofahrerinnen/g, "Autofahrerinnen und Autofahrer"],
    [/\bAutoren und Autorinnen/g, "Autorinnen und Autoren"],
    [/\bBesucher und Besucherinnen/g, "Besucherinnen und Besucher"],
    [/\bBewerber und Bewerberinnen/g, "Bewerberinnen und Bewerber"],
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
    [/\bTeilnehmer und Teilnehmerinnen/g, "Teilnehmerinnen und Teilnehmer"],
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
    [/#Teilnehmer(?:innen und Teilnehmer und Teilnehmerinnen| und Teilnehmerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Teilnehmende/gi, "Teilnehmer"],
    [/#Unternehmer(?:innen und Unternehmer|en und Unternehmerinnen| und Unternehmerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Unternehmer"],
    [/#Urlauber(?:innen und Urlauber|en und Urlauberinnen| und Urlauberinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Urlauber"],
    [/#Verbraucher(?:innen und Verbraucher|en und Verbraucherinnen| und Verbraucherinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Verbraucher"],
    [/#Wähler(?:innen und Wähler|en und Wählerinnen| und Wählerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Wählende/gi, "Wähler"],
    [/#Zuhörer(?:innen und Zuhörer|en und Zuhörerinnen| und Zuhörerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Zuhörende/gi, "Zuhörer"],

    // Formatierung von Zahlen, Datums- und Zeitangaben
    // Korrekte Maßstabsangaben
    [/Maßstab(?:\s+von)?\s+(\d+)[\s.:]+(\d+)/g, "Maßstab $1:$2"],

    // Tausendertrennzeichen optimieren
    [/\b(\d{2,3})((?:\s+|\.){1})(\d{3})\b/g, "$1\u202F$3"],
    [/\b(\d{1,3})((?:\s+|\.){1})(\d{3})((?:\s+|\.){1})(\d{3})\b/g, "$1\u202F$3\u202F$5"],
    [/\b(\d{1})(?:(?![\u202F])(?:\s+|\u0020|\.))(\d{3})\b/g, "$1$2"],

    // Telefonnummern
    [/\b(t|Telefon|Tel\.|Telefon\:|Tel\.\:)\s*(\(?\d+)/g, "¿$2"], // Telefonzeichen in PPS unter PEIQ
    [/(\d)(\s+)(\d)/g, "$1\u202F$3"], // Geschützte Leerzeichen in Telefonnummern

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
    [/\b0([1-9])\. (?=Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/g, "$1. "],
    [/\b(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*[-–]\s*(\d{1,2})/g, "$1 bis $2"],

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
    [/Montag(\(?\d+)/g, "Montag $1"], // Leerzeichen nach Wochentag
    [/Dienstag(\(?\d+)/g, "Dienstag $1"], // Leerzeichen nach Wochentag
    [/Mittwoch(\(?\d+)/g, "Mittwoch $1"], // Leerzeichen nach Wochentag
    [/Donnerstag(\(?\d+)/g, "Donnerstag $1"], // Leerzeichen nach Wochentag
    [/Freitag(\(?\d+)/g, "Freitag $1"], // Leerzeichen nach Wochentag
    [/Sonnabend(\(?\d+)/g, "Sonnabend $1"], // Leerzeichen nach Wochentag
    [/Sonntag(\(?\d+)/g, "Sonntag $1"], // Leerzeichen nach Wochentag

    // Uhrzeiten und Öffnungszeiten einheitlich formatieren
    [/(?<!Maßstab(?:\s+von)?\s+)(\d{1,2}):(\d{2})/g, "$1.$2"], // Funktioniert nur in PPS von PEIQ!
    [/\b0(\d)\.(\d{2})\b/g, "$1.$2"],
    [/\b(\d{1,2})\.00\b/g, "$1"],
    [/\b(Mo|Di|Mi|Do|Fr|Sa|So)\s+(\d{1,2}(?:[.:]\d{2})?)\s*(bis|und|–|-)\s*(\d{1,2}(?:[.:]\d{2})?)\b/g, "$1 $2-$4"],
    [/\bvon\s+(\d{1,2}(?:[.:]\d{2})?)\s*[-–]\s*(\d{1,2}(?:[.:]\d{2})?)\b/g, "von $1 bis $2"],
    [/\bzwischen\s+(\d{1,2}(?:[.:]\d{2})?)\s*(?:[-–]|bis)\s*(\d{1,2}(?:[.:]\d{2})?)\b/g, "zwischen $1 und $2"],

    // Technische Größen
    // Prozentangaben in Worte fassen
    [/(\d+)\s*%/g, "$1 Prozent"],

    // Kohlendioxid mit tief gestellter Ziffer
    [/\bCO2\b/g, "CO₂"],
    [/#CO₂/g, "Kohlendioxid (CO₂)"], // Ausgeschriebene Fassung per Hashtag

    // Temperaturen
    [/(\d+)\s*°C/g, "$1 Grad Celsius"],

    // Winkel
    [/360°\-/g, "360-Grad-"],

    // Geschwindigkeiten
    [/\b(\d+(?:,\d+)?)\s*(kmh|km\/h|Stundenkilometer)\b/g, "$1 Kilometer pro Stunde"],
    [/\((\d+(?:,\d+)?)\s*Kilometer pro Stunde\)/g, "($1 km/h)"],
    [/\bTempo\s(\d{1,3})(\s*km\/h)/g, "Tempo $1"],
    [/\b(\d+(?:,\d+)?)\s*(m\/s)\b/g, "$1 Meter je Sekunde"],
    [/\((\d+(?:,\d+)?)\s*Meter je Sekunde\)/g, "($1 m/s)"],

    // Flächenmaße
    [/\b(\d+(?:,\d+)?)\s*(qkm|km2|km²)\b/g, "$1 Quadratkilometer"],
    [/\((\d+(?:,\d+)?)\s*Quadratkilometer\)/g, "($1 km²)"],
    [/\b(\d+(?:,\d+)?)\s*(qm|m2|m²)\b/g, "$1 Quadratmeter"],
    [/\((\d+(?:,\d+)?)\s*Quadratmeter\)/g, "($1 m²)"],
    [/\b(\d+(?:,\d+)?)\s*(qcm|cm2|cm²)\b/g, "$1 Quadratzentimeter"],
    [/\((\d+(?:,\d+)?)\s*Quadratzentimeter\)/g, "($1 cm²)"],
    [/\b(\d+(?:,\d+)?)\s*(qmm|mm2|mm²)\b/g, "$1 Quadratmillimeter"],
    [/\((\d+(?:,\d+)?)\s*Quadratmillimeter\)/g, "($1 mm²)"],
    [/\b(\d+(?:,\d+)?)\s*ha\b/g, "$1 Hektar"],
    [/\((\d+(?:,\d+)?)\s*Hektar\)/g, "($1 ha)"],

    // Volumenmaße
    [/\b(\d+(?:,\d+)?)\s*(km3|km³)\b/g, "$1 Kubikkilometer"],
    [/\((\d+(?:,\d+)?)\s*Kubikkilometer\)/g, "($1 km³)"],
    [/\b(\d+(?:,\d+)?)\s*(m3|m³)\b/g, "$1 Kubikmeter"],
    [/\((\d+(?:,\d+)?)\s*Kubikmeter\)/g, "($1 m³)"],
    [/\b(\d+(?:,\d+)?)\s*(ccm|cm³)\b/g, "$1 Kubikzentimeter"],
    [/\((\d+(?:,\d+)?)\s*Kubikzentimeter\)/g, "($1 cm³)"],
    [/\b(\d+(?:,\d+)?)\s*(mm3|mm³)\b/g, "$1 Kubikmillimeter"],
    [/\((\d+(?:,\d+)?)\s*Kubikmillimeter\)/g, "($1 mm³)"],

     // Flüssigkeitsmaße
    [/\b(\d+(?:,\d+)?)\s*(l|Ltr\.)\b/g, "$1 Liter"],
    [/\((\d+(?:,\d+)?)\s*Liter\)/g, "($1 l)"],
    [/\b(\d+(?:,\d+)?)\s*(cl)\b/g, "$1 Zentiliter"],
    [/\((\d+(?:,\d+)?)\s*Zentiliter\)/g, "($1 cl)"],
    [/\b(\d+(?:,\d+)?)\s*(ml)\b/g, "$1 Milliliter"],
    [/\((\d+(?:,\d+)?)\s*Milliliter\)/g, "($1 ml)"],

    // Längenmaße (mit Lookaheads zur Absicherung)
    [/\b(\d+(?:,\d+)?)\s*(km)(?![\/²³a-zA-ZäöüÄÖÜß])\b/g, "$1 Kilometer"],
    [/\((\d+(?:,\d+)?)\s*Kilometer\)/g, "($1 km)"],
    [/\b(\d+(?:,\d+)?)\s*(m)(?![²³\/a-zA-ZäöüÄÖÜß])\b/g, "$1 Meter"],
    [/\((\d+(?:,\d+)?)\s*Meter\)/g, "($1 m)"],
    [/\b(\d+(?:,\d+)?)\s*(cm)(?![²³a-zA-ZäöüÄÖÜß])\b/g, "$1 Zentimeter"],
    [/\((\d+(?:,\d+)?)\s*Zentimeter\)/g, "($1 cm)"],
    [/\b(\d+(?:,\d+)?)\s*(mm)(?![²³a-zA-ZäöüÄÖÜß])\b/g, "$1 Millimeter"],
    [/\((\d+(?:,\d+)?)\s*Millimeter\)/g, "($1 mm)"],
    [/\b(\d+(?:,\d+)?)\s*(µm)\b/g, "$1 Mikrometer"],
    [/\((\d+(?:,\d+)?)\s*Mikrometer\)/g, "($1 µm)"],
    [/\b(\d+(?:,\d+)?)\s*(nm)\b/g, "$1 Nanometer"],
    [/\((\d+(?:,\d+)?)\s*Nanometer\)/g, "($1 nm)"],

    // Gewichte
    [/\b(\d+(?:,\d+)?)\s*(t|To\.)(?![a-zA-ZäöüÄÖÜß])\b/g, "$1 Tonnen"],
    [/\((\d+(?:,\d+)?)\s*Tonn(e|en?)\)/g, "($1 t)"],
    [/\b(\d+(?:,\d+)?)\s*(kg)(?![a-zA-ZäöüÄÖÜß])\b/g, "$1 Kilogramm"],
    [/\((\d+(?:,\d+)?)\s*Kilogramm\)/g, "($1 kg)"],
    [/\b(\d+(?:,\d+)?)\s*(g)(?![a-zA-ZäöüÄÖÜß])\b/g, "$1 Gramm"],
    [/\((\d+(?:,\d+)?)\s*Gramm\)/g, "($1 g)"],
    [/\b(\d+(?:,\d+)?)\s*(mg)(?![a-zA-ZäöüÄÖÜß])\b/g, "$1 Milligramm"],
    [/\((\d+(?:,\d+)?)\s*Milligramm\)/g, "($1 mg)"],
    [/\b(\d+(?:,\d+)?)\s*(µg)(?![a-zA-ZäöüÄÖÜß])\b/g, "$1 Mikrogramm"],
    [/\((\d+(?:,\d+)?)\s*Mikrogramm\)/g, "($1 µg)"],
    [/\b(\d+(?:,\d+)?)\s*(ng)(?![a-zA-ZäöüÄÖÜß])\b/g, "$1 Nanogramm"],
    [/\((\d+(?:,\d+)?)\s*Nanogramm\)/g, "($1 ng)"],

    // Speicherkapazitäten
    [/(\d+(?:,\d+)?)\s*(kB|KB|kByte)/g, "$1 Kilobyte"],
    [/(\d+(?:,\d+)?)\s*(MB|MByte)/g, "$1 Megabyte"],
    [/(\d+(?:,\d+)?)\s*(GB|GByte)/g, "$1 Gigabyte"],
    [/(\d+(?:,\d+)?)\s*(TB|TByte)/g, "$1 Terabyte"],

    // Datenübertragungsraten
    [/(\d+(?:,\d+)?)\s*(Kbit\/s)/g, "$1 Kilobit je Sekunde"],
    [/(\d+(?:,\d+)?)\s*(Mbit\/s)/g, "$1 Megabit je Sekunde"],
    [/(\d+(?:,\d+)?)\s*(Gbit\/s)/g, "$1 Gigabit je Sekunde"],
    [/(\d+(?:,\d+)?)\s*(Tbit\/s)/g, "$1 Terabit je Sekunde"],
    [/(\d+(?:,\d+)?)\s*(kb|Kbit)/g, "$1 Kilobit"],
    [/(\d+(?:,\d+)?)\s*(Mb|Mbit)/g, "$1 Megabit"],
    [/(\d+(?:,\d+)?)\s*(Gb|Gbit)/g, "$1 Gigabit"],
    [/(\d+(?:,\d+)?)\s*(Tb|Tbit)/g, "$1 Terabit"],

    // Währungen
    [/(\d+)\s*(€|EUR)/g, "$1 Euro"],
    [/(\d+)\s*(ct|Ct)/g, "$1 Cent"],

    // Abkürzungen
    [/\bu\.\s*a\.(?![a-zA-ZäöüÄÖÜß])/g, "unter anderem"],
    [/\bu\.\s*ä\.(?![a-zA-ZäöüÄÖÜß])/g, "und ähnliche"],
    [/\bu\.(?!\s*(a\.|ä\.|s\.|k\.|v\.|w\.|z\.|n\.|m\.|l\.|r\.|t\.|d\.|b\.|c\.|x\.|y\.|j\.|h\.|g\.|f\.|e\.|q\.|p\.))\b/g, "und"],
    [/\bo\.(?![a-zA-ZäöüÄÖÜß])\b/g, "oder"],
    [/\b(abzgl\.|abzügl\.)/g, "abzüglich"],
    [/\b[Bb][Aa][Ff][Öö][Gg]\b/g, "BAföG"],
    [/\bbzw\./g, "beziehungsweise"],
    [/\b(Bf\.|Bhf\.)/g, "Bahnhof"],
    [/\b(ca\.|zirka)/g, "circa"],
    [/\b(eigtl\.|eigentl\.)/g, "eigentlich"],
    [/\bEv\./g, "Evangelische"],
    [/\bevtl\./g, "eventuell"],
    [/\bggf\./g, "gegebenenfalls"],
    [/\b(inkl\.|incl\.|inclusive)/g, "inklusive"],
    [/\bKath\./g, "Katholische"],
    [/\bLKW(s?)\b/g, "Lkw$1"],
    [/\bPKW(s?)\b/g, "Pkw$1"],
    [/\b(rd\.|rnd\.)/g, "rund"],
    [/\bSCHUFA\b/g, "Schufa"],
    [/(S|s?)tr\./g, "$1traße"],
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
    [/\s*[,•/|]?\s*FFS\s*$/gi, "\u202F/\u202FFUNKE\u202FFoto\u202FServices"],
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
    [/\bABC-Schütze(n?)\b/g, "Abc-Schütze$1"], // Nicht-Militärische-Schreibweise
    [/\bAlkopops/g, "Alcopops"],
    [/\bAlptr(aum|äume)\\b/g, "Albtr$1"],
    [/\bAntiaging/g, "Anti-Aging"],
    [/\bBroccoli/g, "Brokkoli"],
    [/\bBezirksbürgermeister/g, "Bürgermeister"],
    [/\bBezirkstadtr/g, "Stadtr"],
    [/\bBVV-Vorsteh/g, "BV-Vorsteh"],
    [/(B|b?)üfett/g, "$1uffet"],
    [/\bCoffein/g, "Koffein"],
    [/\bEintritt beträgt/g, "Eintritt kostet"],
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
    [/\bmacht Sinn\b/g, "ergibt Sinn"],
    [/\bMund-zu-Mund-Propaganda\b/g, "Mundpropaganda"],
    [/\bOstersonnabend/g, "Karsamstag"],
    [/\bParagraph/g, "Paragraf"],
    [/\bPlayoff/g, "Play-off"],
    [/\bPoetryslam/g, "Poetry-Slam"],
    [/\b(Prime-Time|Prime Time)/g, "Primetime"],
    [/\bRiesterrente/g, "Riester-Rente"],
    [/\bRock'n'Roll/g, "Rock\u202F'n'\u202FRoll"],
    [/\bRock-and-Roll/g, "Rock and Roll"],
    [/\b(Rukola|Rukolla|Rukkolla|Rukkola)/g, "Rucola"],
    [/\bscheinbar/g, "anscheinend"],
    [/\so genannt(e|en|er|es?)/g, "sogenannt$1"],
    [/\b(so dass|so daß|sodaß)/g, "sodass"],
    [/\bsorg(en|t|te|ten?)\\b\\s+für\\s+Streit/g, "führ$1 zu Streit"],
    [/\bspiegelverkehrt/g, "seitenverkehrt"],
    [/\b(Standby|Stand-By)/g, "Stand-by"],
    [/(S|s?)trasse/g, "$1traße"],
    [/\bvon Bernd Meyer\b/g, "von Bernd S. Meyer"],
    [/\b(Voranmeldung|vorherige Anmeldung|vorheriger Anmeldung)/g, "Anmeldung"],
    [/\bvorprogrammiert/g, "programmiert"],
    [/\bWissens nach\b/g, "Wissens"],

    // Online und Multimedia
    [/\b(PDF-Datei|PDF-Dokument|PDF–Datei|PDF–Dokument)/g, "PDF"],
    [/\b(PIN-Code|PIN-Nummer)/g, "PIN"],
    [/\b(Email|EMail|eMail|e-Mail|E–Mail)/g, "E-Mail"],
    [/\b(Spammail|Spam–Mail)/g, "Spam-Mail"],
    [/\b(auf|unter):/g, "$1"], // Doppelpunkt entfernen
    [/\b(https:\s*\/\/\s*|http:\s*\/\/\s*)/g, ""],
    [/(\s*?\/\s*?)([0-9a-zA-ZäöüÄÖÜß\-_.~+=&%$§|?#:]{1,})(\s*?\/\s*?)([0-9a-zA-ZäöüÄÖÜß\-_.~+=&%$§|?#:]{1,})/g, "/$2/$4"], // zwei Slashs in URL ohne Leerzeichen
    [/(\s*?\/\s*?)([0-9a-zA-ZäöüÄÖÜß\-_.~+=&%$§|?#:]{1,})(\s*?\/\s*?)/g, "/$2/"], // zwei Slashs in URL ohne Leerzeichen
    [/(\.)([a-zA-ZäöüÄÖÜß]{2,6})(\s*?\/\s*?)([0-9a-zA-ZäöüÄÖÜß\-_.~+=&%$§|?#:]{1,})/g, ".$2/$4"], // ein Slash nach Domainendung ohne Leerzeichen
    [/(\.com|\.de|\.info|\.berlin)(\/\s|\/\.)/g, "$1."],

    // Finishing
    [/\u0020{2,}/g, " "], // Mehrere Leerzeichen reduzieren
    [/\.{3}/g, "…"], // Drei Punkte durch Auslassungszeichen ersetzen
    [/(\b[…]{1})\s*([a-zA-ZäöüÄÖÜß]{2,}\b)/g, "…\u202F$2"], // Auslassungszeichen mit geschütztem Leerzeichen zum Satzbeginn
    [/(\b[a-zA-ZäöüÄÖÜß]{2,})\s*…/g, "$1\u202F…"], // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende
    [/\u202F…\s*\./g, "\u202F…"], // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende ohne Punkt
    [/\u202F…\s*!/g, "\u202F…!"], // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende mit Ausrufezeichen
    [/\u202F…\s*\?/g, "\u202F…?"], // Auslassungzeichen mit geschütztem Leerzeichen zum Satzende mit Fragezeichen
    [/\s*?xo\s*?/g, "#+\u2022\u202F"], // Listenformatierung (Übergangsweise > siehe Strukturierte Daten mit STRG+ALT+S)
    [/(\u0020?)\u202F(\u0020?)/g, "\u202F"], // Geschützte Leerzeichen filtern
    [/(?<=\w|\d)\u0020+(?=[;,:.?!])/g, ""], // Leerzeichen vor Satzzeichen entfernen
    [/(?<=[.?!])\u0020+(?=(?![\p{L}\p{N}#„“"]).*$)/gu, ""], // Leerzeichen nach Satzzeichen entfernen
    [/([…!?.,:;])\1+/g, "$1"], // Doppelte Satzzeichen entfernen
    // [/(?<=\w)[\u0020\u00A0\u2005\u2009\u200B]+(?=[;,:.?!])/g, ""], //PRÜFEN
    [/DREI_FRAGE/g, "Die drei ???"], // Debugging
    [/DREI_AUSRUFE/g, "Die drei !!!"], // Debugging
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
    [/#BAB/g, "Berliner Beauftragte zur Aufarbeitung der SED-Diktatur (BAB)"],
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
    [/#CO2/g, "Kohlendioxid (CO2)"],
    [/#CO₂/g, "Kohlendioxid (CO₂)"],
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
    [/#DSD/g, "Deutsche Stiftung Denkmalschutz (DSD)"],
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
    [/#IFAF/g, "IFAF Berlin – Institut für angewandte Forschung Berlin"],
    [/#IGeL/g, "Individuelle Gesundheitsleistungen (IGeL)"],
    [/#IHK/g, "Industrie- und Handelskammer zu Berlin (IHK Berlin)"],
    [/#IKEA/g, "Ikea"],
    [/#ILA/g, "Internationale Luft- und Raumfahrtausstellung Berlin (ILA)"],
    [/#IPF/g, "Infozentrum für Prävention und Früherkennung (IPF)"],
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
    [/#MEK/g, "Museum Europäischer Kulturen (MEK)"],
    [/#MRT/g, "Magnetresonanztomografie (MRT)"],
    [/#NABU/g, "NABU (Naturschutzbund Deutschland)"],
    [/#NBB/g, "Netzgesellschaft Berlin-Brandenburg (NBB)"],
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

    // Spitzenkandidaten
    [/##(?:Steffen Krach|Krach)\b/g, "Steffen Krach (SPD), im Gespräch als Spitzenkandidat für die Berliner Abgeordnetenhauswahl 2026#+"],
    [/#(?:Steffen Krach|Krach)\b/g, "Steffen Krach (SPD)"],
    [/##(?:Werner Graf|Graf)\b/g, "Werner Graf (Bündnis 90/Die Grüne), im Gespräch als Spitzenkandidat für die Berliner Abgeordnetenhauswahl 2026#+"],
    [/#(?:Werner Graf|Graf)\b/g, "Werner Graf (Bündnis 90/Die Grüne)"],

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
    [/\bBewerber und Bewerberinnen/g, "Bewerberinnen und Bewerber"],
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
    [/#Arbeitnehmer(?:innen und Arbeitnehmer| und Arbeitnehmerinnen|[\\*\\:\\|]innen|Innen)|#Arbeitnehmende/gi, "Arbeitnehmer"],
    [/#Ärzt(?:e und Ärztinnen|innen und Ärzte|[\\*\\:\\|]innen|Innen)/gi, "Ärzte"],
    [/#Aussteller(?:innen und Aussteller|en und Ausstellerinnen| und Ausstellerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Ausstellende/gi, "Aussteller"],
    [/#Autofahrer(?:innen und Autofahrer| und Autofahrerinnen|[\\*\\:\\|]innen|Innen)|#Autofahrende/gi, "Autofahrer"],
    [/#Autor(?:innen und Autor|en und Autorinnen| und Autorinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Autoren"],
    [/#Berliner(?:innen und Berliner|en und Berlinerinnen| und Berlinerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Berliner"],
    [/#Besucher(?:innen und Besucher|en und Besucherinnen| und Besucherinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Besuchende/gi, "Besucher"],
    [/#Bewerber(?:innen und Bewerber|en und Bewerberinnen| und Bewerberinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Bewerbende/gi, "Bewerber"],
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
    [/#Teilnehmer(?:innen und Teilnehmer und Teilnehmerinnen| und Teilnehmerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Teilnehmende/gi, "Teilnehmer"],
    [/#Unternehmer(?:innen und Unternehmer|en und Unternehmerinnen| und Unternehmerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Unternehmer"],
    [/#Urlauber(?:innen und Urlauber|en und Urlauberinnen| und Urlauberinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Urlauber"],
    [/#Verbraucher(?:innen und Verbraucher|en und Verbraucherinnen| und Verbraucherinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)/gi, "Verbraucher"],
    [/#Wähler(?:innen und Wähler|en und Wählerinnen| und Wählerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Wählende/gi, "Wähler"],
    [/#Zuhörer(?:innen und Zuhörer|en und Zuhörerinnen| und Zuhörerinnen|[\\*\\:\\|]innen|Innen|nde[nr]?)|#Zuhörende/gi, "Zuhörer"],

    // Strukturierte Daten formatieren
    [/\s*?xo\s*?/g, "#+\u2022\u00A0"], // Listenformatierung mit Bullet
    [/\s*?xz\s*?/g, "#+\u2002"], // Zeilenumbruch mit Einzug
    [/\s*?xt0\s*?/g, "#+"], // Zeilenumbruch mit Tabulator 0
    [/\s*?xt1\s*?/g, "\u0009"], // Tabulator 1
    [/\s*?xt2\s*?/g, "\u0009\u0009"], // Tabulator 2
    [/\s*?xt3\s*?/g, "\u0009\u0009\u0009"], // Tabulator 3
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
    console.log("STRG+S: Grundregeln");
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
    console.log("STRG+ALT+S: Hashtag-Regeln");
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

// SuperLINK für PPS in PEIQ (YOURLS-Tool-Integration für ShortLinks per STRG+ALT+L)

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') ||
      (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l')) {
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
            console.log("Protokoll ergänzt:", longUrl);
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
                        console.log("ShortURL eingefügt:", shortUrl);
                    } catch (err) {
                        console.warn("Fallback wird verwendet:", err);
                        document.execCommand('insertText', false, shortUrl);
                    }
                } else {
                    console.error("Ungültige YOURLS-Antwort:", shortUrl);
                    alert("Fehler: YOURLS-Antwort ist ungültig.");
                }
            },
            onerror: function(err) {
                console.error("Fehler bei YOURLS-Anfrage:", err);
                alert("Verbindungsfehler zu YOURLS.");
            }
        });
    }
});

// SuperRED für PPS in PEIQ per Shortcut STRG+ALT+R
// Befüllt Feld "Artikelbeschreibung (Dateiname)" mit KW, Ausgabenkürzel, Überschrift (Stichwort)
// Befüllt Feld "Notizen" mit Termin-Check, Phrasen-Check und TAGs aus Textanalyse

(function () {
  'use strict';
  console.log('[SuperRED] v1.6.5 geladen @', location.href);

  // ===== Konfiguration =====
  const SUPERRED_CONFIG = {
    navSelectors: {
      headline: '#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect[data-label="headline"]',
      subline:  '#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect[data-label="subheadline"]',
      body:     '#jsFragments #texts li.jsModuleItem.moduleFormListItem.moduleFormItemSelect[data-label="text"]'
    },
    labelFallbacks: {
      headline: ['überschrift', 'headline', 'titel'],
      subline:  ['unterzeile', 'subheadline', 'vorspann', 'teaser'],
      body:     ['text', 'fließtext', 'body', 'artikeltext']
    },
    articleDescriptionSelectors: [
      '#moduleTitle',
      '#positionInfo',
      'input[name="fileName"]',
      'input[placeholder*="Dateiname" i]',
      'input[aria-label*="Artikelbeschreibung" i]',
      'input[aria-label*="Dateiname" i]'
    ],
    timeouts: { pmMount: 6000, between: 120 },
    filename: {
      useKW: true,
      kwMode: 'redaktionsschluss', // 'redaktionsschluss' | 'iso'
      redaktionsschlussWeekday: 1,
      multiEditionJoiner: '#',
      maxEditionCodes: 3,
      fallbackAusgabeKuerzel: 'DL',
      prefixMaxWords: 3,
      joiner: '_',
      requireEightDigitId: false,
      missingIdPlaceholder: ''
    },
    locality: { textScanBlacklist: ['mitte'] },
    stichwort: {
      enableContainsStems: true,
      containsStems: [
        { label: 'bad',        pattern: 'b(?:a|ä)d(?:er)?' },
        { label: 'bahnhof',    pattern: 'bahnhof' },
        { label: 'bau',        pattern: 'bau' },
        { label: 'brücke',     pattern: 'brücke' },
        { label: 'bühne',      pattern: 'bühne' },
        { label: 'club',       pattern: 'club' },
        { label: 'denkmal',    pattern: 'denkmal' },
        { label: 'fest',       pattern: 'fest' },
        { label: 'garten',     pattern: 'garten' },
        { label: 'heim',       pattern: 'heim' },
        { label: 'hof',        pattern: 'hof' },
        { label: 'kiez',       pattern: 'kiez' },
        { label: 'kinder',     pattern: 'kinder' },
        { label: 'kirch',      pattern: 'kirch' },
        { label: 'könig',      pattern: 'könig' },
        { label: 'kreuz',      pattern: 'kreuz' },
        { label: 'lange\u0020nacht',       pattern: 'lange\u0020nacht' },
        { label: 'lauf',       pattern: 'lauf' },
        { label: 'markt',      pattern: 'markt' },
        { label: 'messe',      pattern: 'messe' },
        { label: 'park',       pattern: 'park' },
        { label: 'plan',       pattern: 'plan' },
        { label: 'platz',      pattern: 'platz' },
        { label: 'schaden',    pattern: 'schaden' },
        { label: 'schul',      pattern: 'schul' },
        { label: 'schloss',    pattern: 'schlo(?:ß|ss)' },
        { label: 'stadion',    pattern: 'stadion' },
        { label: 'straße',     pattern: 'stra(?:ß|ss)e(?:n)?' },
        { label: 'treff',      pattern: 'treff' },
        { label: 'turm',       pattern: 'turm' },
        { label: 'wahl',       pattern: 'wahl' },
        { label: 'weg',        pattern: 'weg' },
        { label: 'wettbewerb', pattern: 'wettbewerb' },
        { label: 'zentrum',    pattern: 'zentrum' }
      ],
      ignoreExact: ['bauer', 'gogol-grützner']
    }
  };

  // ===== Utilities =====
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const qs  = (sel, root = document) => root.querySelector(sel);
  const normalizeSpace = (s) => (s ?? '').replace(/[\u00A0\u2005]/g, ' ').replace(/\s+/g, ' ').trim();

  const isVisible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return (r.width && r.height) && st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0';
  };

  const textFromProseMirror = (el) => {
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('a').forEach(a => a.replaceWith(document.createTextNode(a.textContent ?? '')));
    return normalizeSpace(clone.innerText ?? clone.textContent ?? '');
  };

  const deepQSA = (selector, root = document) => {
    const out = new Set();
    const walk = (node) => {
      if (!node) return;
      if (node.querySelectorAll) node.querySelectorAll(selector).forEach(el => out.add(el));
      const all = node.querySelectorAll ? node.querySelectorAll('*') : [];
      all.forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); });
    };
    walk(root);
    return Array.from(out);
  };
  const deepQS = (selector, root = document) => {
    const list = deepQSA(selector, root);
    return list.length ? list[0] : null;
  };

  function waitFor(checkFn, timeoutMs = 3000, intervalMs = 80) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      (function loop() {
        try { const val = checkFn(); if (val) return resolve(val); } catch {}
        if (performance.now() - start >= timeoutMs) return reject(new Error('waitFor: timeout'));
        setTimeout(loop, intervalMs);
      })();
    });
  }
  function clickChain(el) {
    const fire = (type) => el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    try { fire('pointerdown'); fire('mousedown'); fire('mouseup'); fire('click'); } catch { el.click?.(); }
  }

  function findNavButtonsSpecific() {
    return {
      headline: deepQS(SUPERRED_CONFIG.navSelectors.headline) ?? qs(SUPERRED_CONFIG.navSelectors.headline),
      subline:  deepQS(SUPERRED_CONFIG.navSelectors.subline)  ?? qs(SUPERRED_CONFIG.navSelectors.subline),
      body:     deepQS(SUPERRED_CONFIG.navSelectors.body)     ?? qs(SUPERRED_CONFIG.navSelectors.body)
    };
  }
  function findNavButtonByText(options) {
    const candidates = [
      ...deepQSA('#jsFragments #texts li.jsModuleItem'),
      ...deepQSA('button, [role="button"], a, .nav-item, .tab, .toggleBox, .toggleBoxIcon, [data-uid]')
    ].filter(isVisible);
    const norm = (t) => normalizeSpace(t).toLowerCase();
    for (const el of candidates) {
      const txt = norm(el.textContent ?? '');
      const aria = norm(el.getAttribute?.('aria-label') ?? el.getAttribute?.('data-label') ?? '');
      for (const label of options) {
        const l = norm(label);
        if ((txt && txt === l) || (aria && aria === l)) return el;
      }
    }
    for (const el of candidates) {
      const txt = norm(el.textContent ?? '');
      const aria = norm(el.getAttribute?.('aria-label') ?? el.getAttribute?.('data-label') ?? '');
      for (const label of options) {
        const l = norm(label);
        if ((txt && txt.includes(l)) || (aria && aria.includes(l))) return el;
      }
    }
    return null;
  }
  function findAllNavButtons() {
    const specific = findNavButtonsSpecific();
    const haveAll = specific.headline && specific.subline && specific.body;
    if (haveAll) return specific;
    const fb = SUPERRED_CONFIG.labelFallbacks;
    return {
      headline: specific.headline ?? findNavButtonByText(fb.headline),
      subline:  specific.subline  ?? findNavButtonByText(fb.subline),
      body:     specific.body     ?? findNavButtonByText(fb.body)
    };
  }

  function getActivePM() {
    const pms = deepQSA('.ProseMirror[contenteditable="true"]').filter(isVisible);
    return pms[0] ?? null;
  }
  async function waitForActivePM(afterLabel) {
    await new Promise(r => setTimeout(r, SUPERRED_CONFIG.timeouts.between));
    const pm = await waitFor(() => {
      const el = getActivePM();
      return el && isVisible(el) ? el : null;
    }, SUPERRED_CONFIG.timeouts.pmMount, 100);
    await new Promise(r => setTimeout(r, 50));
    console.log('[SuperRED] PM aktiv nach Klick auf', afterLabel, pm);
    return pm;
  }

  async function captureAllThree() {
    const btns = findAllNavButtons();
    console.log('[SuperRED] Buttons gefunden:', btns);
    const result = { headline: '', subline: '', body: '' };
    const steps = [
      { key: 'headline', label: 'Überschrift', btn: btns.headline },
      { key: 'subline',  label: 'Unterzeile',  btn: btns.subline  },
      { key: 'body',     label: 'Text',        btn: btns.body     }
    ];
    for (const step of steps) {
      if (!step.btn) { console.warn('[SuperRED] Kein Button für', step.label, 'gefunden – überspringe.'); continue; }
      try {
        clickChain(step.btn);
        const pm = await waitForActivePM(step.label);
        const txt = textFromProseMirror(pm);
        result[step.key] = txt;
      } catch (err) {
        console.warn('[SuperRED] Schritt fehlgeschlagen:', step.label, err);
      }
    }
    return result;
  }

  // ===== Artikelbeschreibung (Dateiname) =====
  function setInputValueReactSafe(input, value) {
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    const setter = desc && desc.set;
    if (setter) setter.call(input, String(value));
    else input.value = String(value);
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur',   { bubbles: true }));
  }
  function findArticleDescriptionInput() {
    for (const s of SUPERRED_CONFIG.articleDescriptionSelectors) { const el = qs(s); if (el) return el; }
    for (const s of SUPERRED_CONFIG.articleDescriptionSelectors) { const el = deepQS(s); if (el) return el; }
    return null;
  }

  function isoWeekString(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dow = date.getUTCDay();
    const dayNum = (dow === 0 ? 7 : dow);
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return String(weekNo).padStart(2, '0');
  }
  function nextWeekday(date, weekday) {
    const d = new Date(date);
    const day = d.getDay();
    let delta = (weekday - day + 7) % 7;
    if (delta === 0) delta = 7;
    d.setDate(d.getDate() + delta);
    return d;
  }
  function redaktionsKWString(date, weekday) {
    const d = new Date(date);
    const day = d.getDay();
    const rsDay = (typeof weekday === 'number') ? weekday : 1;
    if (day === rsDay) return isoWeekString(d);
    const nm = nextWeekday(d, rsDay);
    return isoWeekString(nm);
  }
  function safeHeadline(h) { return normalizeSpace(h ?? '').replace(/\s+/g, ' ').trim(); }
  function guessEightDigitNumber(list) {
    for (const s of list) { const m = (s ?? '').match(/(^|[^0-9])(\d{8})(?!\d)/); if (m) return m[2]; }
    return '';
  }
  function getExistingNumberFromField(inputEl) {
    const v = (inputEl?.value ?? '').toString();
    const m = v.match(/(^|[^0-9])(\d{8})(?!\d)/);
    return m ? m[2] : '';
  }
  function buildFileName({ kw, kuerzel, nummer, headline, stichwort }) {
    const parts = [];
    if (kw) parts.push(kw);
    parts.push(`#${kuerzel}`);
    if (nummer) parts.push(SUPERRED_CONFIG.filename.joiner + nummer);
    parts.push(SUPERRED_CONFIG.filename.joiner + headline);
    const base = parts.join('');
    return stichwort ? `${base} (${stichwort})` : base;
  }

  const AUSGABE_MAP = {
    CH: ['Charlottenburg-Nord', 'Charlottenburg-Wilmersdorf', 'Charlottenburg', 'Westend'],
    HL: ['Alt-Hohenschönhausen', 'Falkenberg', 'Fennpfuhl', 'Friedrichsfelde', 'Karlshorst', 'Lichtenberg', 'Malchow', 'Neu-Hohenschönhausen', 'Rummelsburg', 'Wartenberg'],
    HM: ['Biesdorf', 'Hellersdorf', 'Kaulsdorf', 'Mahlsdorf', 'Marzahn-Hellersdorf', 'Marzahn'],
    KT: ['Adlershof', 'Altglienicke', 'Alt-Treptow', 'Baumschulenweg', 'Bohnsdorf', 'Friedrichshagen', 'Grünau', 'Johannisthal', 'Köpenick', 'Müggelheim', 'Niederschöneweide', 'Oberschöneweide', 'Plänterwald', 'Rahnsdorf', 'Schmöckwitz', 'Treptow-Köpenick'],
    MI: ['Friedrichshain-Kreuzberg', 'Friedrichshain', 'Gesundbrunnen', 'Hansaviertel', 'Kreuzberg', 'Mitte', 'Moabit', 'Tiergarten', 'Wedding'],
    NK: ['Britz', 'Buckow', 'Gropiusstadt', 'Neukölln', 'Rudow'],
    PW: ['Blankenburg', 'Blankenfelde', 'Buch', 'Französisch Buchholz', 'Heinersdorf', 'Karow', 'Niederschönehausen', 'Pankow', 'Prenzlauer Berg', 'Rosenthal', 'Stadtrandsiedlung Malchow', 'Weißensee', 'Wilhelmsruh'],
    RE: ['Borsigwalde', 'Frohnau', 'Heiligensee', 'Hermsdorf', 'Konradshöhe', 'Lübars', 'Märkisches Viertel', 'Reinickendorf', 'Tegel', 'Waidmannslust', 'Wittenau'],
    ST: ['Lankwitz', 'Lichterfelde', 'Steglitz-Zehlendorf', 'Steglitz'],
    SV: ['Falkenhagener Feld', 'Gatow', 'Hakenfelde', 'Haselhorst', 'Kladow', 'Siemensstadt', 'Spandau', 'Wilhelmstadt'],
    TH: ['Friedenau', 'Lichtenrade', 'Mariendorf', 'Marienfelde', 'Schöneberg', 'Tempelhof-Schöneberg', 'Tempelhof'],
    WI: ['Charlottenburg-Wilmersdorf', 'Grunewald', 'Halensee', 'Schmargendorf', 'Wilmersdorf'],
    ZD: ['Dahlem', 'Nikolassee', 'Schlachtensee', 'Steglitz-Zehlendorf', 'Zehlendorf'],
    DL: ['Berlin', 'Chance der Woche', 'Stadtspaziergang']
  };

  const CANONICAL_LOCALITY_TO_CODES = new Map();
  const LOCALITY_NAMES_CANONICAL = [];
  (function buildLocalityIndex() {
    const canon = (s) => s.toLowerCase().normalize('NFC').replace(/[.,:;!?\)\]]+$/g, '').replace(/[\s\-]+/g, ' ').trim();
    for (const [code, list] of Object.entries(AUSGABE_MAP)) {
      for (const raw of list) {
        const key = canon(raw);
        if (!CANONICAL_LOCALITY_TO_CODES.has(key)) CANONICAL_LOCALITY_TO_CODES.set(key, new Set());
        CANONICAL_LOCALITY_TO_CODES.get(key).add(code);
      }
    }
    LOCALITY_NAMES_CANONICAL.push(...CANONICAL_LOCALITY_TO_CODES.keys());
    LOCALITY_NAMES_CANONICAL.sort((a, b) => b.length - a.length);
  })();
  const LOCALITY_KEYS_SET = new Set(LOCALITY_NAMES_CANONICAL);

  function canonLoc(s) { return (s ?? '').toLowerCase().normalize('NFC').replace(/[.,:;!?\)\]]+$/g, '').replace(/[\s\-]+/g, ' ').trim(); }
  function isLocalityPhrase(s) { return LOCALITY_KEYS_SET.has(canonLoc(s)); }

  function matchLocalityAtStart(text, maxWords = (SUPERRED_CONFIG.filename.prefixMaxWords ?? 3)) {
    if (!text) return null;
    const cleaned = text.trim().replace(/^[\s"'„‚‘’"»«]+/, '');
    const tokens = cleaned.split(/\s+/).map(t => t.replace(/^["'„‚‘’"»«(]+|[)"'“”‚‘’»«:.;,!?]+$/g, ''));
    const n = Math.min(tokens.length, Math.max(1, maxWords));
    for (let take = n; take >= 1; take--) {
      const phrase = tokens.slice(0, take).join(' ');
      const key = canonLoc(phrase);
      const codesSet = CANONICAL_LOCALITY_TO_CODES.get(key);
      if (codesSet && codesSet.size) return { phrase, codes: Array.from(codesSet) };
    }
    return null;
  }

  function findLocalitiesInText(text) {
    const res = [];
    if (!text) return res;
    const norm = (text ?? '').normalize('NFC').toLowerCase().replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, ' ').replace(/[–—]/g, '-').replace(/\s+/g, ' ');
    for (const nameKey of LOCALITY_NAMES_CANONICAL) {
      const pattern = nameKey.replace(/ /g, '[\\s\\-]+');
      const re = new RegExp(`(?:^|\\b)${pattern}(?=\\b(?:[.:,;!?\\)\\]]|$))`, 'i');
      const m = re.exec(norm);
      if (m) res.push({ nameCanonical: nameKey, index: m.index, codes: Array.from(CANONICAL_LOCALITY_TO_CODES.get(nameKey) ?? []) });
    }
    res.sort((a, b) => a.index - b.index);
    return res;
  }

  function containsExclusiveDL(values) {
    const needles = ['chance der woche', 'stadtspaziergang'];
    const canon = (s) => (s ?? '').toLowerCase().normalize('NFC');
    const hay = canon(values.subline) + '\n' + canon(values.body);
    return needles.some(n => hay.includes(n));
  }

  function computeAusgabeKuerzel(values) {
    const cfg = SUPERRED_CONFIG.filename;
    const maxCodes = Math.max(1, (cfg.maxEditionCodes ?? 3));
    const joiner   = (cfg.multiEditionJoiner ?? '#');
    const FALLBACK = (cfg.fallbackAusgabeKuerzel ?? 'DL');
    const blacklist = (SUPERRED_CONFIG.locality?.textScanBlacklist ?? []).map(s => canonLoc(s));
    if (containsExclusiveDL(values)) return 'DL';

    const codesOrdered = [];
    const addCodes = (codes) => {
      for (const c of codes) { if (!codesOrdered.includes(c)) codesOrdered.push(c); if (codesOrdered.length >= maxCodes) return; }
    };
    let primary = null;
    if (values.subline?.trim()) { const m = matchLocalityAtStart(values.subline); if (m) primary = m; }
    if (!primary && values.body?.trim()) { const m = matchLocalityAtStart(values.body); if (m) primary = m; }
    const fullHitsAll = findLocalitiesInText(values.body ?? '');
    const fullHits = fullHitsAll.filter(h => !blacklist.includes(h.nameCanonical));
    if (!primary && fullHits.length) { addCodes(fullHits[0].codes); }
    if (primary) addCodes(primary.codes);
    if (fullHits.length) {
      for (const hit of fullHits) {
        const codes = hit.codes.filter(c => c !== 'DL' || codesOrdered.length === 0);
        addCodes(codes);
        if (codesOrdered.length >= maxCodes) break;
      }
    }
    if (codesOrdered.length === 0) codesOrdered.push(FALLBACK);
    return codesOrdered.join(joiner);
  }

  const STICHWORT_SUFFIXES = [
    'zentrum','markt','straße','platz','park','bahnhof','feld','brücke','tunnel','gasse','schaden','schäden',
    'wahl','schule','ferien','fest','kirch','kreuz','turm','bad','bibliothek','messe','bau','club','filiale',
    'heim','stadion','halle','garten','hof','kinder','plan','wache','feuer','wettbewerb','lauf','denkmal',
    'stadtspaziergang','könig','krankheit','schloss','führung','biotop','kiez','treff','streik','betreuung',
    'bühne','szene','woche','monat','jahr','festival','burg','berg','stiftung','ehrung','ausschreibung','weg'
  ];
  function findContainsStemCandidates(cleaned) {
    const cfg = SUPERRED_CONFIG.stichwort; if (!cfg?.enableContainsStems) return [];
    const tokenRe = /\b([A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*)\b/gu;
    const ignoreSet = new Set((cfg.ignoreExact ?? []).map(s => s.toLowerCase().normalize('NFC')));
    const stemRegexes = (cfg.containsStems ?? []).map(x => ({ label: x.label, re: new RegExp(x.pattern, 'iu') }));
    const out = []; let m;
    while ((m = tokenRe.exec(cleaned)) !== null) {
      const token = m[1]; const norm = token.toLowerCase().normalize('NFC');
      if (ignoreSet.has(norm)) continue;
      for (const s of stemRegexes) { if (s.re.test(norm)) { out.push({ idx: m.index, text: token }); break; } }
    }
    return out;
  }
  function tidyStichwort(s) { return (s ?? '').replace(/[)\].,:;!?]+$/, '').replace(/\s+/g, ' ').trim(); }
  function extractStichwortFrom(text) {
    if (!text) return '';
    const cleaned = (text ?? '').replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, ' ').replace(/[“”„‟"«»]/g, '"').replace(/[‚‘’‛']/g, "'").trim();
    const esc = STICHWORT_SUFFIXES.map(s => s.replace(/[\\\-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const suffixPattern = new RegExp(`\\b([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+)*-(?:${esc.join('|')}))\\b`, 'giu');
    const singleWordSuffixPattern = new RegExp(`\\b([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]*(?:${esc.join('|')}))\\b`, 'giu');
    const hyphenCompositePattern = /\b([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß]+)+)\b/gu;
    let m; const candidates = [];
    while ((m = suffixPattern.exec(cleaned)) !== null) candidates.push({ idx: m.index, text: m[1] });
    while ((m = singleWordSuffixPattern.exec(cleaned)) !== null) candidates.push({ idx: m.index, text: m[1] });
    const containsCands = findContainsStemCandidates(cleaned); if (containsCands.length) candidates.push(...containsCands);
    if (candidates.length) {
      candidates.sort((a, b) => a.idx - b.idx);
      const firstNonLocality = candidates.find(c => !isLocalityPhrase(c.text));
      if (firstNonLocality) return tidyStichwort(firstNonLocality.text);
    }
    const hyphens = []; while ((m = hyphenCompositePattern.exec(cleaned)) !== null) hyphens.push({ idx: m.index, text: m[1] });
    if (hyphens.length) {
      hyphens.sort((a, b) => a.idx - b.idx);
      const firstNonLocality = hyphens.find(h => !isLocalityPhrase(h.text));
      if (firstNonLocality) return tidyStichwort(firstNonLocality.text);
    }
    return '';
  }
  function extractStichwort(values) {
    if (containsExclusiveDL(values)) return '';
    let sw = extractStichwortFrom(values.subline); if (sw) return sw;
    const bodyStart = (values.body ?? '').slice(0, 280);
    sw = extractStichwortFrom(bodyStart);
    return sw ?? '';
  }

  // ===== NOTES (integriert) =====
  const NOTES_CFG = {
    selectors: [ '#notes', 'textarea[name="notes"]', 'input[name="notes"]', '[aria-label*="Notiz" i]', '[placeholder*="Notiz" i]' ],
    labelRegex: /notiz|notizen|notes?/i,
    warnIfNonTrivialExisting: true,
    SKEY_PHRASES: 'sn_phrases_v16',
    PHRASES_DEFAULT: 'alles für deutschland, durch den rost, eskimo, getürkt, hitler, gestern, heute, morgen, letzte, mohrenstraße, nächste, neger, selbstmord, suizid, unserer redaktion, vergasung, zigeuner',
    SKEY_TAG_TABLE: 'sn_tag_table_v16',
    TAG_TABLE_DEFAULT: [
        'BAUEN: abriss, archiologe, architekt, ausgrabung, bagger, bauabnahme, bauantrag, bauarbeit, baubeginn, bauen, baufällig, baugenehmigung, baugrube, bauherr, bauleitung, baumaßnahme, baupläne, baustelle, baustopp, bauverzögerung, bebauung, brückenbau, dachausbau, denkmalschutz, ersatzverkehr, fertigstellung, glasfassade, gleisbau, grundstück, hochbau, immobilie, innenausbau, lückenbau, mietwohnung, modularbau, planfeststellung, randbebauung, restaurierung, richtfest, rückbau, signalbau, spatenstich, sperrung, stahlbeton, straßenbau, streckenausbau, streckenbau, tiefbau, wohnungsbau, wolkenkratzer',
        'BERLIN: airport, arena, bellevue, berlin, botschaft, brandenburger tor, charité, eats music hall, fanmeile, fernsehturm, flughafen, forst, friedrichstadtpalast, funkturm, hauptbahnhof, hauptstadt, helios, humboldtforum, kanzleramt, karneval, lange nacht, leuchtturm, marathon, mauerfall, mauerweg, museumsinsel, olympia, philarmonie, regierender, reichstag, ringbahn, rotes rathaus, schirmherr, senat, siegessäule, silvester, stadtautobahn, stadtring, tempelhofer feld, tempodrom, tiergarten, tierheim, tierpark, tourismus, touristen, vivantes, vöbb, waldbühne, wiedervereinigung, zoo',
        'BILDUNG: abitur, abschluss, absolvent, akadem, ausbilder, azubi, bachelor, bildung, deutschkurs, diplom, elternabend, exmatrikulation, expolingua, fakultät, forscher, forscher, forschung, gymnasium, hochschule, hörsaal, jobmedi, jobwunder, klausur, lehramt, lehrstelle, lernen, master, numerus, oberstufe, praktika, praktikum, quereinsteiger, quereinstieg, rechenschwäche, schüler, semester, seminar, sprachkurs, studenten, studium, stuzubi, symposium, universität, unterricht, vhs, volontär, volontariat, wissenschaft, workshop, zeugniss',
        'BLAULICHT: autorennen, bestechung, blitzer, bombe, brand, dealer, delikt, dieb, drogen, entschärf, erfroren, ertrunken, evakuier, explo, festgenommen, feuerwehreinsatz, freispruch, gestoßen, gestürzt, gewalt, hausbesetzer, illegal, justiz, messer, mord, opfer, polizei, raser, räuber, razzia, reanimation, schmuggel, schüsse, schwerverletzt, sondereinsatz, straftat, täter, tatort, todesfolge, töte, überfall, übergriff, unerlaubt, unfall, unglück, verdächt, vergift, verurteilt, waffe, zoll',
        'KINDER: arche, baby, basteln, boys, einschulung, ferien, fez, freizeittreff, girls, grundschule, hausaufgaben, hüpfburg, jugend, jungen, karussell, kinder, klassenfahrt, leiheltern, lesepaten, mädchen, mitmach, musikschule, nachhilfe, nachwuchs, pfadfinder, plansche, plüschtier, ponyreiten, puppentheater, rummel, schulanfang, schulbeginn, schülerhilfe, schülerlotse, schulgarten, schwimmkurs, seepferd, seifenkisten, spaßbad, spielen, spielplatz, spielstraße, spielzeug, streichelzoo, taschengeld, teenager, ufafabrik, verkehrslotse, verkehrsschule, zuckerwatte',
        'KULTUR: aufführung, ausstellung, ballett, bibliothek, buch, bühne, chor, eintritt, event, feiern, festival, feuerwerk, film, freizeit, galerie, kabarett, karten, kino, komödie, konzert, kreative, kultur, kunst, lesung, markt, museen, museum, musical, musik, nacht, opern, orgel, party, planetarium, premiere, programm, rennbahn, revue, show, spaziergang, sternwarte, tänze, theater, ticket, trödel, veranstalt, verlag, vernisage, vortrag, weihnacht',
        'LEUTE: artist, ausgezeichnet, autor, benannt, beobachtet, biografie, deportiert, eltern, erfinder, erinnerung, erlebt, erzählt, geboren, geburt, gedenken, gegründet, gelebt, gelehrter, gesammelt, geschwister, gestorben, heimat, heirat, hinterblieben, histori, hochzeit, jährig, jubilar, maler, memoiren, migriert, musiker, mutter, persönliche, produzent, regisseur, rückkehr, ruhestätte, schriftsteller, stolperstein, tausendsasser, überleb, vater, verdienste, vergangenheit, verlassen, verlobt, versteckt, weltenbummler, zeitzeuge',
        'LOKALES: anbindung, anlieger, anwohner, behörde, bezirk, bolzpl, brache, brennpunkt, bürger, dorfanger, dorfkern, einwohner, fahrradstraße, freibad, haltestelle, heimatmuseum, höfe, hotspot, hundeauslauf, kathedrale, kiez, kirche, kita, kleingärten, krankenhaus, kriminalität, lokal, marktplatz, moschee, nachbar, nähe, nahversorg, ordnungs, parkranger, problem, promenade, quartier, rathaus, rohrbruch, schule, schwimmbad, siedlung, stätte, stromausfall, umbenennung, versammlung, viertel, volkspark, wache, wochenmarkt',
        'POLITIK: abgeordnete, afd, anfrage, ausschuss, beschluss, bündnis, bürgermeister, bürgersprechstunde, bürokrat, bvv, cdu, christdemo, debatte, demokrat, demonstr, diplomat, extrem, fdp, feindlich, gesetze, gesetzlich, haushaltsplan, haushaltssperre, kandid, kanzler, koalition, kommission, kundge, kürzung, liberale, minister, nominier, opposition, panther, partei, politi, präsident, proteste, provokation, radikal, regier, rüstung, sozialdemo, spd, stadtrat, stellvertret, vorsitz, wahlen, wähler, wehrpflicht',
        'SERVICE: anmeld, aufruf, auktion, befragung, beteiligung, broschüre, bürgeramt, bürgerbüro, bürgertelefon, bwurl, download, flyer, fördergeld, fundbüro, gewinnspiel, gratis, hotline, informationen, infos, internet, jobcenter, kontakt, kostenfrei, kostenlos, kummer, mail, nummer, öffnungszeit, ombudsstelle, pdf, pflegehilfe, portal, ratgeber, schiedss, schlichter, schlichtung, selbsthilfe, service, silbernetz, sozialladen, sprechstunde, sprechzeit, teilnahme, teilnehm, tourist, verbraucher, verlosung, versteigerung, webseite, website',
        'SOZIALES: ambulant, armut, barrierearm, barrierefrei, bedürftig, bürgergeld, caritas, diakonie, dlrg, drk, drogenberatung, ehrenamt, engagiert, feuerwehr, freiwillig, gemeinwohl, gesundheitsamt, grundsicherung, handicap, heime, helfe, hitzeplan, hospiz, inklusion, integration, kältehilfe, klinik, kranker, lageso, migra, obdach, opferhilfe, paliativ, patientenberatung, samariter, schuldnerberatung, seelsorge, seniorenhilfe, silbernet, solidarität, sozial, spende, stationär, stiftung, stützpunkt, suchthilfe, tafel, unterstütz, versicher, wohngeld',
        'SPORT: alba, athlet, bäder, becken, billard, boxen, bundesliga, eisbären, eiskunstlauf, finale, fitness, füchse, fußball, handball, hertha, hockey, istaf, judo, karate, landesliga, läufer, leistungsschau, mannschaft, medaille, meisterschaft, parcour, pferde, rekord, ruder, schach, schwimm, segel, sommerspiele, sport, sporthalle, stadion, tennis, titelkampf, titelvertei, trainer, training, triat, turnhalle, turnier, volley, wasserball, wettrennen, winterspiele, workout, zehnkampf',
        'UMWELT: abfall, abgase, abwasser, artenschutz, aufforst, bäume, begrünung, bienen, biotop, brunnen, dünger, düngung, energie, erneuerbare, fällarbeiten, fällungen, flora, gewässer, grünanlage, hitze, kläranlage, klärwerk, klima, lärmschutz, müll, nachhaltig, natur, ökolog, pestizid, pflanz, pfuhl, photovoltaik, regenwasser, repair, reservat, rieselfeld, schadstoff, schreberg, schwamm, solar, starkregen, strom, stürme, treibhaus, umwelt, vogelschutz, wasser, wetter, windkraft, windräder',
        'VERKEHR: abschlepp, abzweig, ampel, autobahn, avus, bahn, bike, brücke, busse, bvg, dreieck, eisenbahn, elterntaxi, fähre, fahrrad, fahrzeug, flieg, flug, fuhrpark, garage, geschwindigkeit, jelbi, knöllchen, kontrolle, kreuzung, linie, lkw, öpnv, padelec, pkw, poller, roller, s-bahn, schiene, schulweg, scooter, shuttle, spurig, stellpl, stvo, tram, transport, tunnel, u-bahn, überweg, umleitung, verbindung, verkehr, zebrastreifen, züge',
        'WIRTSCHAFT: angestellte, arbeit, autovermiet, bankrott, baumarkt, baumärkte, business, center, dienstleist, discounter, erfolgsgeschichte, fachkräfte, firma, frainchise, funding, gastro, geschäft, gewerb, gewerkschaft, händler, handwerk, hotel, imbiss, industrie, insolvenz, investi, käufer, konkurs, kunde, kundschaft, lieferdienst, marken, markthalle, neueröffn, passage, produkte, räumungsverkauf, schließung, schwarzarbeit, sortiment, späti, start-up, steuer, streik, umsatz, unternehme, verkaufsfläche, warenh, wiedereröffn, wirtschaft'
    ].join('\n'),
      sep: '\n',
    showPhraseHits: true,
    tagMaxCount: 6,
    inlineSep: ' || ',
    SKEY_PHRASES_EXCLUDE: 'sn_phrases_exclude_v1',
    PHRASES_EXCLUDE_DEFAULT: 'guten morgen, morgenpost, morgens',
    phraseWholeWord: true
  };
  const SN_STORE = { get(k, d='') { try { return GM_getValue(k, d); } catch { return d; } }, set(k, v) { try { GM_setValue(k, v); } catch {} } };
  function _qs(s, r=document){ return r.querySelector(s); }
  function _qsa(s, r=document){ return Array.from(r.querySelectorAll(s)); }
  function normalizeSpaces(s){ return (s ?? '').replace(/[\u00A0\u202F\u2009]/g,' ').replace(/[–—]/g,'-').replace(/\s{2,}/g,' ').trim(); }
  function findNotesField(root=document){
    for (const s of NOTES_CFG.selectors){ const el=_qs(s, root); if (el) return el; }
    const labels = _qsa('label', root).filter(l => NOTES_CFG.labelRegex.test(l.textContent || ''));
    for (const lab of labels){
      const forId = lab.getAttribute('for'); if (forId){ const el = root.getElementById(forId); if (el) return el; }
      const el = lab.closest('section,div,li,form,fieldset')?.querySelector('textarea, input, [contenteditable="true"]'); if (el) return el;
    }
    try {
      const xp = document.evaluate("//label[contains(translate(., 'NOTIZEN', 'notizen'),'notiz')]/following::*[self::textarea or self::input or @contenteditable='true'][1]", root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (xp) return xp;
    } catch {}
    return null;
  }
  function setNotesReactSafe(el, value){
    if (!el) return false;
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true'){
      el.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, String(value));
      el.dispatchEvent(new InputEvent('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); el.dispatchEvent(new Event('blur', {bubbles:true}));
      return true;
    }
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto ?? {}, 'value')?.set; if (setter) setter.call(el, String(value)); else el.value = String(value);
    el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); el.dispatchEvent(new Event('blur', {bubbles:true}));
    return true;
  }
  function flashNotes(el, ok=true){ if(!el) return; const o=el.style.outline; el.style.outline=`2px solid ${ok?'#8bc34a':'#ff5252'}`; setTimeout(()=>el.style.outline=o,900); }

  // ---- Termin / Phrasen / Tags ----
  const MONTHS_ALT = ['Januar','Jan\\.?','Februar','Feb\\.?','März','Mrz\\.?','Maerz','April','Apr\\.?','Mai','Juni','Jun\\.?','Juli','Jul\\.?','August','Aug\\.?','September','Sept\\.?','Sep\\.?','Oktober','Okt\\.?','November','Nov\\.?','Dezember','Dez\\.?'].join('|');
  const WEEKDAYS_OPT = '(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag,?\\s*)?';
  const DE_MONTHS = { januar:0, jan:0, februar:1, feb:1, märz:2, mrz:2, maerz:2, april:3, apr:3, mai:4, juni:5, jun:5, juli:6, jul:6, august:7, aug:7, september:8, sept:8, sep:8, oktober:9, okt:9, november:10, nov:10, dezember:11, dez:11 };
  const pad2 = (n) => String(n).padStart(2,'0');
  const fmtDateDE = (d) => `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}`;
  const sod = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const parseIntSafe = (s) => { const n=parseInt(s,10); return Number.isFinite(n)?n:null; };
  function buildDate(dayStr, monStr, yearStr, now){
  const dd = parseIntSafe(dayStr);
  let mm = parseIntSafe(monStr);
  let yyyy = yearStr ? parseIntSafe(yearStr) : null;

  if (!dd) return null;
  if (yyyy != null && yyyy < 100) yyyy = 2000 + yyyy;
  if (!mm || mm < 1 || mm > 12) mm = parseIntSafe(monStr);
  if (!mm) return null;

  // NEU: Ohne Jahr => IMMER aktuelles Jahr, KEIN Auto-Rollover mehr
  if (yyyy == null) yyyy = now.getFullYear();

  const d = new Date(yyyy, mm - 1, dd);
  d.setHours(0,0,0,0);

  // Validierung (31.02. etc. aussortieren)
  if (d.getDate() !== dd || d.getMonth() !== mm - 1) return null;

  return d;
}

  function normalizeSpacesFull(s){ return (s ?? '').replace(/[\u00A0\u202F\u2009]/g,' ').replace(/[–—]/g,'-').replace(/\s{2,}/g,' ').trim(); }
  function extractAbsoluteDates(rawText, now){
    const text = normalizeSpacesFull(rawText); const out = []; const t0=sod(now);
    const listMonPat = new RegExp(String.raw`(\d{1,2}\.)\s*(?:,\s*\d{1,2}\.)*(?:\s*und\s*\d{1,2}\.)\s*(${MONTHS_ALT})\s*(\d{4})?`, 'gi');
      const vonBisMonPat = new RegExp(
          String.raw`(?:\bvon\s*)?(\d{1,2})\.\s*(?:bis|[–-])\s*(\d{1,2})\.\s*(${MONTHS_ALT})\s*(\d{4})?`,
          'gi'
      );

      let vb;
      while ((vb = vonBisMonPat.exec(text)) !== null) {
          const startDay = vb[1];
          const monKey = vb[3].toLowerCase().replace(/\.$/, '');
          const year    = vb[4] ? parseIntSafe(vb[4]) : null;

          if (Object.prototype.hasOwnProperty.call(DE_MONTHS, monKey)) {
              const monIdx  = DE_MONTHS[monKey];
              const dStart  = buildDate(startDay, monIdx + 1, year, now);
              if (dStart) out.push(dStart);
          }
      }
    let lm; while ((lm=listMonPat.exec(text))!==null){ const firstDay=lm[1].replace('.',''); const monKey=lm[2].toLowerCase().replace(/\.$/,''); const year=lm[3]?parseIntSafe(lm[3]):null; const monIdx=DE_MONTHS[monKey]; if(monIdx!=null){ const d=buildDate(firstDay, monIdx+1, year, now); if(d) out.push(d);} }
    const wsp='[\\s\\u00A0\\u202F\\u2009]*'; const rangeRe=new RegExp(String.raw`(?:^|[^0-9])(\d{1,2})\.${wsp}[–-]${wsp}(\d{1,2})\.(\d{1,2})\.?(?:\s*(\d{2,4}))?`,'gi'); let rr; while((rr=rangeRe.exec(text))) { const d=buildDate(rr[1], rr[3], rr[4] ?? null, now); if(d) out.push(d); }
    const fullRe=/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/gi; let fr; while((fr=fullRe.exec(text))) { const d=buildDate(fr[1], fr[2], fr[3], now); if(d) out.push(d); }
    const noYearRe=/(\d{1,2})\.(\d{1,2})\.(?!\d)/gi; let ny; while((ny=noYearRe.exec(text))) { const d=buildDate(ny[1], ny[2], null, now); if(d) out.push(d); }
    const monRe=new RegExp(`${WEEKDAYS_OPT}(\\d{1,2})\\.?\\s*(${MONTHS_ALT})(?:\\s*(\\d{4}))?`,'gi'); let mm; while((mm=monRe.exec(text))){ const day=mm[1]; const monKey=mm[2].toLowerCase().replace(/\.$/,''); const year=mm[3]?parseIntSafe(mm[3]):null; if(Object.prototype.hasOwnProperty.call(DE_MONTHS, monKey)){ const d=buildDate(day, DE_MONTHS[monKey]+1, year, now); if(d) out.push(d);} }
    const min = addDays(t0, -30);   // PAST_WINDOW_DAYS: -30
    const max = addDays(t0, 365);   // großzügig; computeTerminLine begrenzt später auf +120
    const win = out.map(sod).filter(d => d >= min && d <= max);
    return [...new Map(win.map(d => [d.getTime(), d])).values()].sort((a, b) => a - b);
  }
  function computeTerminLine(text) {
  // Lokale Schwellwerte (keine globalen consts -> keine Kollisionen)
  const FUTURE_WINDOW_DAYS = 120; // nur Termine bis +120 Tage berücksichtigen
  const PAST_WINDOW_DAYS   = 30;  // vergangene Termine bis -30 Tage berücksichtigen
  const SOON_DAYS          = 6;   // 0..6 Tage in der Zukunft => "ACHTUNG-TERMIN"

  const dates = extractAbsoluteDates(text, new Date());
  if (!dates.length) return null;

  const today = sod(new Date());
  const toDeltaDays = (d) => Math.round((sod(d) - today) / (24 * 3600 * 1000));

  // Annotieren mit Delta-Tagen
  const list = dates.map(d => ({ d, delta: toDeltaDays(d) }));

  // Zukunft im Fenster
  const future = list
    .filter(x => x.delta >= 0 && x.delta <= FUTURE_WINDOW_DAYS)
    .sort((a, b) => a.delta - b.delta); // frühester Termin zuerst

  // Jüngste Vergangenheit im Fenster
  const pastRecent = list
    .filter(x => x.delta < 0 && x.delta >= -PAST_WINDOW_DAYS)
    .sort((a, b) => b.delta - a.delta); // -1 vor -5

  // Auswahl: bevorzugt nächster Zukunftstermin, sonst jüngster vergangener
  let pick = null;
  if (future.length)         pick = future[0];
  else if (pastRecent.length) pick = pastRecent[0];
  else return null; // nichts relevantes -> keine TERMIN-Zeile

  const isPast = pick.delta < 0;
  const isSoon = pick.delta >= 0 && pick.delta <= SOON_DAYS;

  // Labeling: Vergangenheit (bis -30) oder sehr bald (0..6) => ACHTUNG-TERMIN
  const prefix = (isPast || isSoon) ? 'ACHTUNG-TERMIN: ' : 'TERMIN: ';
  return `${prefix}${fmtDateDE(pick.d)}`;
}

  function getPhraseList(){ const raw=SN_STORE.get(NOTES_CFG.SKEY_PHRASES, NOTES_CFG.PHRASES_DEFAULT); return raw.split(',').map(s=>s.trim()).filter(Boolean); }
    // --- Helper für Phrasen-Check: Regex-Escape & Wortgrenzen
    function escapeRegex(s) { return (s ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    // Unicode-Wortgrenzen: matcht nur, wenn links/rechts kein Buchstabe/Ziffer/Unterstrich
    function wordBoundaryRegex(term) {
        const esc = escapeRegex(term);
        return new RegExp(`(^|[^\\p{L}\\p{N}_])(${esc})(?=($|[^\\p{L}\\p{N}_]))`, 'giu');
    }

    // Blacklist aus dem Store lesen
    function getPhraseExcludeList() {
        const raw = SN_STORE.get(NOTES_CFG.SKEY_PHRASES_EXCLUDE, NOTES_CFG.PHRASES_EXCLUDE_DEFAULT);
        return raw.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Blacklist im Text "rausmaskieren", bevor wir nach Treffern suchen
    function scrubPhraseExclusions(textLower) {
        let out = textLower;
        for (const ex of getPhraseExcludeList()) {
            if (!ex) continue;
            const re = new RegExp(escapeRegex(ex.toLowerCase()), 'giu');
            out = out.replace(re, ' ');
        }
        return out;
    }

    // --- ERSETZT die alte findPhraseHits-Version:
    function findPhraseHits(text) {
        const lower = (text ?? '').toLowerCase();
        const scan = scrubPhraseExclusions(lower); // Blacklist zuerst rausnehmen
        const hits = new Set();
        for (const p of getPhraseList()) {
            const term = p.toLowerCase();
            const re = NOTES_CFG.phraseWholeWord
            ? wordBoundaryRegex(term)                 // nur "echte" Worttreffer (z. B. "morgen")
            : new RegExp(escapeRegex(term), 'giu');   // optional: Substring-Matching

            if (re.test(scan)) hits.add(p);
        }
        return [...hits];
    }

  function getTagTable(){ const raw=SN_STORE.get(NOTES_CFG.SKEY_TAG_TABLE, NOTES_CFG.TAG_TABLE_DEFAULT); const lines=raw.split('\n').map(s=>s.trim()).filter(Boolean); const table=[]; for(const line of lines){ const ix=line.indexOf(':'); if(ix<0) continue; const tag=line.slice(0,ix).trim().toUpperCase(); const items=line.slice(ix+1).split(',').map(s=>s.trim()).filter(Boolean); if(tag && items.length) table.push({tag, items}); } return table; }
  function countTagHits(text){ const lower=(text ?? '').toLowerCase(); const table=getTagTable(); const results=[]; for(const row of table){ let hits=0; for(const term of row.items){ const t=term.toLowerCase(); if(!t) continue; let idx=lower.indexOf(t); while(idx>=0){ hits++; idx=lower.indexOf(t, idx+t.length); } } if(hits>0) results.push({tag:row.tag, hits}); } results.sort((a,b)=>{ const d=b.hits-a.hits; return d!==0?d:a.tag.localeCompare(b.tag,'de'); }); return results.map(x=>x.tag); }

  // ===== Kombiniertes Overlay =====
  let combinedOverlayEl = null;
  function escapeHTML(s){ return (s ?? '').replace(/[<>&'\"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c])); }
  function showCombinedConfirmOverlay(sections, onAction){
    // sections: [{key:'red'|'notes', title, current, proposed, meta: {kw?, kuerzel?}}]
    try{
      if (combinedOverlayEl) combinedOverlayEl.remove();
      combinedOverlayEl = document.createElement('div');
      combinedOverlayEl.style.cssText = `position:fixed;top:12px;right:12px;z-index:2147483647;background:#0b1e2d;color:#fff;font:13px/1.35 system-ui,Segoe UI,Arial,sans-serif;border:1px solid #0d3a5c;border-radius:8px;padding:12px 14px;max-width:680px;box-shadow:0 8px 24px rgba(0,0,0,.25);`;
      const btn = (bg)=>`display:inline-block;margin:6px 6px 0 0;padding:6px 10px;border-radius:6px;background:${bg};color:#fff;border:0;cursor:pointer`;
      const sectionHTML = sections.map(sec => {
        const metaLine = sec.key==='red' ? `<div style="opacity:.8;margin:6px 0 2px 0"><b>Kürzel</b>: <code style="background:#07233a;padding:2px 4px;border-radius:4px">#${escapeHTML(sec.meta.kuerzel||'')}</code><span style="margin-left:10px"><b>KW</b>: ${escapeHTML(sec.meta.kw||'(inaktiv)')}</span></div>` : '';
        return `
          <div style="margin:8px 0 10px 0">
            <div style="font-weight:600;margin-bottom:4px;">${escapeHTML(sec.title)}</div>
            <div style="margin-bottom:6px"><b>Aktuell</b>:<br><code style="display:inline-block;background:#07233a;padding:4px 6px;border-radius:4px;max-width:100%;white-space:pre-wrap;word-break:break-word">${escapeHTML(sec.current || '(leer)')}</code></div>
            <div><b>Neu</b>:<br><code style="display:inline-block;background:#07233a;padding:4px 6px;border-radius:4px;max-width:100%;white-space:pre-wrap;word-break:break-word">${escapeHTML(sec.proposed)}</code></div>
            ${metaLine}
          </div>`;
      }).join('');
      const actionsHTML = (()=>{
        if (sections.length===1){
          const single = sections[0];
          return `<button id="co_act_${single.key}" style="${btn('#1b8d3d')}">Überschreiben</button>`;
        }
        return `
          <button id="co_act_red" style="${btn('#1b8d3d')}">Dateiname überschreiben</button>
          <button id="co_act_notes" style="${btn('#1b8d3d')}">Notizen überschreiben</button>
          <button id="co_act_both" style="${btn('#1565c0')}">Beide überschreiben</button>`;
      })();
      combinedOverlayEl.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;">SuperRED – Überschreiben bestätigen</div>
        <div style="opacity:.8;margin-bottom:8px">${new Date().toLocaleTimeString()}</div>
        ${sectionHTML}
        <div style="margin-top:8px">
          ${actionsHTML}
          <button id="co_cancel" style="${btn('#3a3a3a')}">Abbrechen</button>
        </div>
      `;
      document.body.appendChild(combinedOverlayEl);
      const call = (what)=>{ try{ combinedOverlayEl.remove(); }catch{} onAction?.(what); };
      combinedOverlayEl.querySelector('#co_act_red')?.addEventListener('click', ()=>call('red'));
      combinedOverlayEl.querySelector('#co_act_notes')?.addEventListener('click', ()=>call('notes'));
      combinedOverlayEl.querySelector('#co_act_both')?.addEventListener('click', ()=>call('both'));
      combinedOverlayEl.querySelector(`#co_act_${sections[0]?.key}`)?.addEventListener('click', ()=>call(sections[0]?.key));
      combinedOverlayEl.querySelector('#co_cancel')?.addEventListener('click', ()=>{ try{ combinedOverlayEl.remove(); }catch{} });
    }catch(err){ console.error('[SuperRED] Combined-Overlay-Fehler:', err); alert('SuperRED: Overlay-Fehler (siehe Konsole).'); }
  }

  // ===== Builder für Dateiname + Notizen =====
  function computeFinalFileName(values, targetInputEl) {
    const cfg = SUPERRED_CONFIG.filename;
    const nummerExisting = getExistingNumberFromField(targetInputEl);
    const nummerGuessed  = guessEightDigitNumber([values.headline, values.subline, values.body]);
    let nummer = nummerExisting; if (!nummer) nummer = nummerGuessed; if (!nummer && cfg.requireEightDigitId) nummer = (cfg.missingIdPlaceholder ?? '');
    let baseHeadline = (values.headline ?? '').trim(); if (!baseHeadline) baseHeadline = (values.subline ?? '').trim();
    if (!baseHeadline) { const body = (values.body ?? '').replace(/\s+/g,' ').trim(); baseHeadline = body.split(' ').slice(0, 10).join(' '); if (!baseHeadline) baseHeadline = 'ohne Titel'; }
    const headline = safeHeadline(baseHeadline);
    const stichwort = extractStichwort(values);
    const kw = (cfg.useKW) ? (cfg.kwMode === 'redaktionsschluss' ? redaktionsKWString(new Date(), cfg.redaktionsschlussWeekday) : isoWeekString(new Date())) : '';
    const kuerzel = computeAusgabeKuerzel(values);
    return { text: buildFileName({ kw, kuerzel, nummer, headline, stichwort }), kw, kuerzel };
  }
  function buildNotesLines({ subline, body }) {
  const sections = []; // [{ k: 'termin'|'checken'|'tags', text: '...' }]
  const allText = `${subline ?? ''}\n${body ?? ''}`;

  // 1) Termin (optional)
  const dtLine = computeTerminLine(allText);
  if (dtLine) sections.push({ k: 'termin', text: dtLine });

  // 2) CHECKEN (optional, inkl. Phrasen)
  const phrases = findPhraseHits(allText);
  if (phrases.length) {
    sections.push({
      k: 'checken',
      text: `CHECKEN!${NOTES_CFG.showPhraseHits ? ' ' + phrases.join(', ') : ''}`,
    });
  }

  // 3) TAGs (optional)
  const tags = countTagHits(allText);
  if (tags.length) {
    const room = Math.max(0, NOTES_CFG.tagMaxCount);
    const picked = tags.slice(0, room);
    // Beibehaltung Deiner bisherigen Darstellung: jede weitere Zeile mit führendem Leerzeichen
    sections.push({ k: 'tags', text: picked.join(' | ') });
  }

  // --- NEU: Inline-Separator " || " nur anhängen, wenn danach noch Inhalt folgt
  const sepInline = (NOTES_CFG.inlineSep ?? '').toString();
  for (let i = 0; i < sections.length - 1; i++) {
    if ((sections[i].k === 'termin' || sections[i].k === 'checken') && sepInline) {
      sections[i].text += sepInline;
    }
  }

  // Rückgabe bleibt ein Array von Zeilen; Join passiert später mit NOTES_CFG.sep
  return sections.map(s => s.text);
}


  // ===== Orchestrator: kombiniertes Verhalten auf STRG+ALT+R =====
  async function performCombinedFill(){
    const target = findArticleDescriptionInput();
    const notesEl = findNotesField();
    if (!target && !notesEl){ alert('SuperRED: Weder Artikelbeschreibung noch Notizen-Feld gefunden.'); return; }

    const values = await captureAllThree();

    // --- Dateiname (RED)
    let red = null;
    if (target){
      const currentRED = (target.value ?? '').toString().trim();
      const onlyEightDigits = /^\d{8}$/.test(currentRED) || currentRED === '';
      const { text: proposedRED, kw, kuerzel } = computeFinalFileName(values, target);
      red = { current: currentRED, proposed: proposedRED, onlyEightDigits, kw, kuerzel };
    }

    // --- Notizen (NOTES)
    let notes = null;
    if (notesEl){
      const currentNOTES = (notesEl.value ?? notesEl.textContent ?? '').trim();
      const isTrivial = currentNOTES === '' || /^\d{8}$/.test(currentNOTES);
      const notesText = buildNotesLines({ subline: values.subline, body: values.body }).join(NOTES_CFG.sep);
      notes = { current: currentNOTES, proposed: notesText, isTrivial };
    }

    // --- Sofort schreiben (ohne Overlay) & sammeln, was bestätigt werden muss
    const toConfirm = [];

    if (red){
      if (red.proposed === red.current){ /* nix tun, Overlay unterdrücken */ }
      else if (red.onlyEightDigits){ setInputValueReactSafe(target, red.proposed); try{ target.selectionStart=target.selectionEnd=target.value.length; }catch{} }
      else { toConfirm.push({ key:'red', title:'Artikelbeschreibung (Dateiname)', current:red.current, proposed:red.proposed, meta:{ kw:red.kw, kuerzel:red.kuerzel } }); }
    }

    if (notes){
      if (notes.proposed === notes.current){ /* nix tun, Overlay unterdrücken */ }
      else if (notes.isTrivial || !NOTES_CFG.warnIfNonTrivialExisting){ const ok=setNotesReactSafe(notesEl, notes.proposed); flashNotes(notesEl, ok); }
      else { toConfirm.push({ key:'notes', title:'Notizen', current:notes.current, proposed:notes.proposed, meta:{} }); }
    }

    if (toConfirm.length === 0) return; // nichts mehr zu bestätigen

    // --- Kombiniertes Overlay zeigen
    showCombinedConfirmOverlay(toConfirm, (what)=>{
      if ((what==='red' || what==='both') && red && target && red.proposed !== red.current){ setInputValueReactSafe(target, red.proposed); try{ target.selectionStart=target.selectionEnd=target.value.length; }catch{} }
      if ((what==='notes' || what==='both') && notes && notesEl && notes.proposed !== notes.current){ const ok=setNotesReactSafe(notesEl, notes.proposed); flashNotes(notesEl, ok); }
    });
  }

  // ===== Hotkey =====
  window.addEventListener('keydown', async (e) => {
    const k = e.key?.toLowerCase?.() ?? '';
    const comboR = (e.ctrlKey && e.altKey && k === 'r');
    if (!comboR) return;
    e.preventDefault();
    try { await performCombinedFill(); } catch(err){ console.warn('[SuperRED] Fehler in performCombinedFill:', err); }
  }, true);

})();

    // ---- Menü: Anzeigen / Zurücksetzen / Diagnose ----------------------------

    GM_registerMenuCommand("SuperMAX-Shortcuts anzeigen", () => {
    alert(
        "SuperMAX Tastaturkürzel:\n" +
        "STRG+S → Grundregeln anwenden\n" +
        "STRG+ALT+S → #-Textphrasen ersetzen\n\n" +
        "SuperERASER Tastaturkürzel:\n" +
        "STRG+E → Umbrüche, Makros und Links entfernen\n\n" +
        "SuperLINK Tastaturkürzel:\n" +
        "STRG+ALT+L → URL kürzen mit YOURLS\n" +
        "Menü → YOURLS-Token setzen/anzeigen/löschen\n\n" +
        "SuperRED Tastaturkürzel:\n" +
        "STRG+ALT+R → Artikelbeschreibung erzeugen\n" +
        "STRG+ALT+R → Notizen mit Textanalyse erzeugen\n\n" +
        "Auch hilfreich im PPS Texteditor:\n" +
        "STRG+A > Alles markieren\n" +
        "STRG+C > Auswahl kopieren\n" +
        "STRG+X > Auswahl ausschneiden\n" +
        "STRG+V > Auswahl einfügen\n" +
        "STRG+Z > Aktion rückgängig machen\n" +
        "STRG+Y > Aktion wieder herstellen\n" +
        "STRG+SHIFT+S > Speichern und schließen\n"
    );
});

})();