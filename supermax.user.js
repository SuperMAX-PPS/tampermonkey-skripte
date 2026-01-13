// ==UserScript==
// @name SuperMAX 5.1.4 Multi-Site Struktur
// @namespace https://www.berliner-woche.de/
// @version 5.1.4
// @author Frank Luhn, Berliner Woche ©2026
// @description SuperPORT (Textfelderkennung) | SuperBRIDGE (PPS->CUE) | SuperSHIRT | SuperLINK | SuperERASER | SuperRED | SuperNOTES | SuperMAX (RegEx)
// @updateURL https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @downloadURL https://raw.githubusercontent.com/SuperMAX-PPS/tampermonkey-skripte/main/supermax.user.js
// @connect bwurl.de
// @match https://pps.berliner-woche.de/*
// @match https://cue.funke.cue.cloud/*
// @match https://contao/*
// @match https://text-resizing-348470635809.europe-west3.run.app/*
// @run-at document-end
// @grant GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_setClipboard
// @grant GM_registerMenuCommand
// @grant unsafeWindow
// ==/UserScript==

(function () {
'use strict';

// === DEV-GATE (nur im DEV-Skript aktiv setzen) ===
const SMX_DEV_ONLY = false;
if (SMX_DEV_ONLY && !/\bsmxdev=1\b/i.test(location.search)) return;
let SMX_DEV_MODE = false;
let SMX_DRY_RUN = false;
try { SMX_DEV_MODE = GM_getValue('smx_dev_mode', SMX_DEV_MODE); } catch {}
try { SMX_DRY_RUN = GM_getValue('smx_dry_run', SMX_DRY_RUN ); } catch {}

//// KAPITEL 0 //// CORE /////////////////////////////////////////////////////////////////////////////////
//// KAPITEL 0.1 // Storage & Keys ///////////////////////////////////////////////////////////////////////
const Storage = {
get(k, d) { try { return GM_getValue(k, d); } catch { return d; } },
set(k, v) { try { GM_setValue(k, v); } catch {} }
};
const SMX_STORE_KEYS = {
SETTINGS:'smx_settings_v1',
YOURLS_TOKEN:'yourlsToken',
NOTES_PHRASES:'sn_phrases_v16',
NOTES_TAG_TABLE:'sn_tag_table_v16',
NOTES_PHRASES_EXCL:'sn_phrases_exclude_v1'
};

//// KAPITEL 0.2 //// Optionen (Persistenz) //////////////////////////////////////////////////////////////
const SOFT_HYPHEN_KEY = 'supermax_strip_soft_hyphen';
let STRIP_SOFT_HYPHEN = true;
try { STRIP_SOFT_HYPHEN = GM_getValue(SOFT_HYPHEN_KEY, true); } catch {}
function setStripSoftHyphen(val){
STRIP_SOFT_HYPHEN = !!val;
try { GM_setValue(SOFT_HYPHEN_KEY, STRIP_SOFT_HYPHEN); } catch {}
smxToast('Soft Hyphen: ' + (STRIP_SOFT_HYPHEN ? 'AN' : 'AUS'));
}

//// KAPITEL 1 //// KONFIGURATION ////////////////////////////////////////////////////////////////////////
//// KAPITEL 1.1 // CFG SuperPORT ////////////////////////////////////////////////////////////////////////
// Multi-Site CFG
window.SMX_CFG = window.SMX_CFG || { profiles: {} };

// CUE: Tabs/Rollen-Mapping und Heuristik-Hints
window.SMX_CFG.profiles.CUE = window.SMX_CFG.profiles.CUE || {};
window.SMX_CFG.profiles.CUE.SUPERPORT = {
tabs: {
rolesByLabel: {
'storyline': ['headline','headline_pro','subline','locality','body'],
'print metadaten': ['print_et','print_filename'],
'notizen': ['notes']
},
hints: {
contentTabRegex: 'storyline|story|inhalt',
printTabRegex: 'print|meta|druck',
notesTabRegex: 'notiz'
},
defaultRoles: ['headline','headline_pro','subline','locality','body']
}
};

// PPS: Feldnavigation-Selektoren/Timeouts
window.SMX_CFG.profiles.PPS = window.SMX_CFG.profiles.PPS || {};
window.SMX_CFG.profiles.PPS.SUPERPORT = {
navItemSelector: 'li.jsModuleItem.moduleFormListItem.moduleFormItemSelect, [data-label]',
editableSelector: '.ProseMirror[contenteditable="true"], .ql-editor[contenteditable="true"], [contenteditable="true"], textarea, input[type="text"], [role="textbox"]',
activateTimeoutMs: 2200,
activatePollMs: 60,
postClickDelayMs: 100
};

//// KAPITEL 1.2 // CFG SuperBRIDGE //////////////////////////////////////////////////////////////////////
// SuperRED-Baustein als Textblock (unverändert), dient derzeit als Single Source of Truth für Ortsteile
const SUPERRED_CONFIG_TEXT = String.raw`
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
 DL:['Berlin']
`;
// Parser für Ortsteile
function superbridgeExtractOrtsteileFromConfigText(txt){
  const set = new Set();
  const arrays = String(txt).match(/\[[^\]]+\]/g) || [];
  for (const arr of arrays){
    const items = arr.match(/'([^']+)'/g) || [];
    for (const q of items){
      const val = q.slice(1,-1).trim();
      if (val) set.add(val);
    }
  }
  return Array.from(set);
}
// Globales Set für Ortsteile (SuperBRIDGE/SuperRED)
window.SUPERBRIDGE_ORTSTEILE = new Set(superbridgeExtractOrtsteileFromConfigText(SUPERRED_CONFIG_TEXT));

//// KAPITEL 1.3 // CFG SuperSHIRT ///////////////////////////////////////////////////////////////////////
//// (Platzhalter - Konfigurationen)

//// KAPITEL 1.4 // CFG SuperRED & SuperNOTES ////////////////////////////////////////////////////////////
const CFG = {
SUPERRED:{
filenameOrder: 'S', // 'H' | 'S' | 'S!' (nur Stichwort)
joiner: '_',
useKW: true,
kwMode: 'redaktionsschluss', // 'redaktionsschluss' | 'iso'
kwLabel: '', // '' => "45" | 'KW' => "KW45"
redaktionsschlussWeekday: 1, // Mo=1
appearanceWeekday: 6, // Sa=6 (Ausgabetag)
maxEditionCodes: 3,
multiEditionJoiner: ' II ', // Ausgabe z. B. "HO|HM|PA"
filenameDelimiter: ' II ',            // Einheitlich: Pipes ohne Leerzeichen
filenameDelimiterFallback: ' II ',    // Fallback entspricht Standard
wrapStichwortInParens: true,        // "(Stichwort)" hinter Headline
headlineFirst: false,               // "Überschrift (Stichwort)" bleibt wie gewünscht

editionMap: {
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
DL:['Berlin']
},
localityAliases: [
   ['FEZ', 'Oberschöneweide'],
   ['Hauptbahnhof', 'Tiergarten'],
   ['Ostbahnhof', 'Friedrichshain'],
   ['Ostkreuz', 'Friedrichshain'],
   ['Südkreuz', 'Schöneberg'],
   ['Tierpark', 'Friedrichshain'],
   ['Zoologischer Garten', 'Charlottenburg']
],
localityBlacklist: ['mitte'],
prefixMaxWords: 3,

requireEightDigitId: false,
missingIdPlaceholder: '',

stichwortMatch: [
'zentrum','markt','straße','platz','park','bahn','feld','brücke','tunnel','gasse',
'schaden','schäden','wahl','schule','ferien','fest','kirch','kreuz','turm','bad',
'bibliothek','messe','bau','club','filiale','heim','stadion','halle','garten','hof',
'kinder','plan','wache','feuer','wettbewerb','lauf','denkmal','stadtspaziergang',
'könig','krankheit','schloss','führung','biotop','kiez','treff','streik','betreuung',
'bühne','szene','woche','monat','jahr','festival','burg','berg','stiftung','ehrung',
'ausschreibung','weg','wind','krise'
],
ignoreExact: ['bauer','gogol-grützner'],
},

NOTES: {
warnIfNonTrivialExisting: true,
tagMaxCount: 6,
sep: ' || ',
phraseWholeWord: false,
inlineSep: ' || ',
tagJoiner: ' | ',

phrasesDefault:
'29. Februar, alles für deutschland, durch den rost, eskimo, getürkt, hitler, gestern, heute, ==morgen==, letzte, mohrenstraße, nächste, neger, selbstmord, suizid, tatsächlich, unserer redaktion, vergasung, vermutlich, wahrscheinlich, zigeuner',

phrasesExcludeDefault:
'guten morgen, morgenpost, morgens',

tagTableDefault: `
BAUEN: abriss, archiologe, architekt, ausgrabung, bagger, bauabnahme, bauantrag, bauarbeit, baubeginn, bauen, baufällig, baugenehmigung, baugrube, bauherr, bauleitung, baumaßnahme, baupläne, baustelle, baustopp, bauverzögerung, bebauung, brückenbau, dachausbau, denkmalschutz, ersatzverkehr, fertigstellung, glasfassade, gleisbau, grundstück, hochbau, immobilie, innenausbau, lückenbau, mietwohnung, modularbau, planfeststellung, randbebauung, restaurierung, richtfest, rückbau, signalbau, spatenstich, sperrung, stahlbeton, straßenbau, streckenausbau, streckenbau, tiefbau, wohnungsbau, wolkenkratzer
BERLIN: airport, arena, bellevue, berlin, botschaft, brandenburger tor, charité, eats music hall, fanmeile, fernsehturm, flughafen, forst, friedrichstadtpalast, funkturm, hauptbahnhof, hauptstadt, helios, humboldtforum, kanzleramt, karneval, lange nacht, leuchtturm, marathon, mauerfall, mauerweg, museumsinsel, olympia, philarmonie, regierender, reichstag, ringbahn, rotes rathaus, schirmherr, senat, siegessäule, silvester, stadtautobahn, stadtring, tempelhofer feld, tempodrom, tiergarten, tierheim, tierpark, tourismus, touristen, vivantes, vöbb, waldbühne, wiedervereinigung, zoo
BILDUNG: abitur, abschluss, absolvent, akadem, ausbilder, azubi, bachelor, bildung, deutschkurs, diplom, elternabend, exmatrikulation, expolingua, fakultät, forscher, forscher, forschung, gymnasium, hochschule, hörsaal, jobmedi, jobwunder, klausur, lehramt, lehrstelle, lernen, master, numerus, oberstufe, praktika, praktikum, quereinsteiger, quereinstieg, rechenschwäche, schüler, semester, seminar, sprachkurs, studenten, studium, stuzubi, symposium, universität, unterricht, vhs, volontär, volontariat, wissenschaft, workshop, zeugniss
BLAULICHT: autorennen, bestechung, blitzer, bombe, brand, dealer, delikt, dieb, drogen, entschärf, erfroren, ertrunken, evakuier, explo, festgenommen, feuerwehreinsatz, freispruch, gestoßen, gestürzt, gewalt, hausbesetzer, illegal, justiz, messer, mord, opfer, polizei, raser, räuber, razzia, reanimation, schmuggel, schüsse, schwerverletzt, sondereinsatz, straftat, täter, tatort, todesfolge, töte, überfall, übergriff, unerlaubt, unfall, unglück, verdächt, vergift, verurteilt, waffe, zoll
KINDER: arche, baby, basteln, boys, einschulung, ferien, fez, freizeittreff, girls, grundschule, hausaufgaben, hüpfburg, jugend, jungen, karussell, kinder, klassenfahrt, leiheltern, lesepaten, mädchen, mitmach, musikschule, nachhilfe, nachwuchs, pfadfinder, plansche, plüschtier, ponyreiten, puppentheater, rummel, schulanfang, schulbeginn, schülerhilfe, schülerlotse, schulgarten, schwimmkurs, seepferd, seifenkisten, spaßbad, spielen, spielplatz, spielstraße, spielzeug, streichelzoo, taschengeld, teenager, ufafabrik, verkehrslotse, verkehrsschule, zuckerwatte
KULTUR: aufführung, ausstellung, ballett, bibliothek, buch, bühne, chor, eintritt, event, feiern, festival, feuerwerk, film, freizeit, galerie, kabarett, karten, kino, komödie, konzert, kreative, kultur, kunst, lesung, markt, museen, museum, musical, musik, nacht, opern, orgel, party, planetarium, premiere, programm, rennbahn, revue, show, spaziergang, sternwarte, tänze, theater, ticket, trödel, veranstalt, verlag, vernisage, vortrag, weihnacht
LEUTE: artist, ausgezeichnet, autor, benannt, beobachtet, biografie, deportiert, eltern, erfinder, erinnerung, erlebt, erzählt, geboren, geburt, gedenken, gegründet, gelebt, gelehrter, gesammelt, geschwister, gestorben, heimat, heirat, hinterblieben, histori, hochzeit, jährig, jubilar, maler, memoiren, migriert, musiker, mutter, persönliche, produzent, regisseur, rückkehr, ruhestätte, schriftsteller, stolperstein, tausendsasser, überleb, vater, verdienste, vergangenheit, verlassen, verlobt, versteckt, weltenbummler, zeitzeuge
LOKALES: anbindung, anlieger, anwohner, behörde, bezirk, bolzpl, brache, brennpunkt, bürger, dorfanger, dorfkern, einwohner, fahrradstraße, freibad, haltestelle, heimatmuseum, höfe, hotspot, hundeauslauf, kathedrale, kiez, kirche, kita, kleingärten, krankenhaus, kriminalität, lokal, marktplatz, moschee, nachbar, nähe, nahversorg, ordnungs, parkranger, problem, promenade, quartier, rathaus, rohrbruch, schule, schwimmbad, siedlung, stätte, stromausfall, umbenennung, versammlung, viertel, volkspark, wache, wochenmarkt
POLITIK: abgeordnete, afd, anfrage, ausschuss, beschluss, bündnis, bürgermeister, bürgersprechstunde, bürokrat, bvv, cdu, christdemo, debatte, demokrat, demonstr, diplomat, extrem, fdp, feindlich, gesetze, gesetzlich, haushaltsplan, haushaltssperre, kandid, kanzler, koalition, kommission, kundge, kürzung, liberale, minister, nominier, opposition, panther, partei, politi, präsident, proteste, provokation, radikal, regier, rüstung, sozialdemo, spd, stadtrat, stellvertret, vorsitz, wahlen, wähler, wehrpflicht
SERVICE: anmeld, aufruf, auktion, befragung, beteiligung, broschüre, bürgeramt, bürgerbüro, bürgertelefon, bwurl, download, flyer, fördergeld, fundbüro, gewinnspiel, gratis, hotline, informationen, infos, internet, jobcenter, kontakt, kostenfrei, kostenlos, kummer, mail, nummer, öffnungszeit, ombudsstelle, pdf, pflegehilfe, portal, ratgeber, schiedss, schlichter, schlichtung, selbsthilfe, service, silbernetz, sozialladen, sprechstunde, sprechzeit, teilnahme, teilnehm, tourist, verbraucher, verlosung, versteigerung, webseite, website
SOZIALES: ambulant, armut, barrierearm, barrierefrei, bedürftig, bürgergeld, caritas, diakonie, dlrg, drk, drogenberatung, ehrenamt, engagiert, feuerwehr, freiwillig, gemeinwohl, gesundheitsamt, grundsicherung, handicap, heime, helfe, hitzeplan, hospiz, inklusion, integration, kältehilfe, klinik, kranker, lageso, migra, obdach, opferhilfe, paliativ, patientenberatung, samariter, schuldnerberatung, seelsorge, seniorenhilfe, silbernet, solidarität, sozial, spende, stationär, stiftung, stützpunkt, suchthilfe, tafel, unterstütz, versicher, wohngeld
SPORT: alba, athlet, bäder, becken, billard, boxen, bundesliga, eisbären, eiskunstlauf, finale, fitness, füchse, fußball, handball, hertha, hockey, istaf, judo, karate, landesliga, läufer, leistungsschau, mannschaft, medaille, meisterschaft, parcour, pferde, rekord, ruder, schach, schwimm, segel, sommerspiele, sport, sporthalle, stadion, tennis, titelkampf, titelvertei, trainer, training, triat, turnhalle, turnier, volley, wasserball, wettrennen, winterspiele, workout, zehnkampf
UMWELT: abfall, abgase, abwasser, artenschutz, aufforst, bäume, begrünung, bienen, biotop, brunnen, dünger, düngung, energie, erneuerbare, fällarbeiten, fällungen, flora, gewässer, grünanlage, hitze, kläranlage, klärwerk, klima, lärmschutz, müll, nachhaltig, natur, ökolog, pestizid, pflanz, pfuhl, photovoltaik, regenwasser, repair, reservat, rieselfeld, schadstoff, schreberg, schwamm, solar, starkregen, strom, stürme, treibhaus, umwelt, vogelschutz, wasser, wetter, windkraft, windräder
VERKEHR: abschlepp, abzweig, ampel, autobahn, avus, bahn, bike, brücke, busse, bvg, dreieck, eisenbahn, elterntaxi, fähre, fahrrad, fahrzeug, flieg, flug, fuhrpark, garage, geschwindigkeit, jelbi, knöllchen, kontrolle, kreuzung, linie, lkw, öpnv, padelec, pkw, poller, roller, s-bahn, schiene, schulweg, scooter, shuttle, spurig, stellpl, stvo, tram, transport, tunnel, u-bahn, überweg, umleitung, verbindung, verkehr, zebrastreifen, züge
WIRTSCHAFT: angestellte, arbeit, autovermiet, bankrott, baumarkt, baumärkte, business, center, dienstleist, discounter, erfolgsgeschichte, fachkräfte, firma, frainchise, funding, gastro, geschäft, gewerb, gewerkschaft, händler, handwerk, hotel, imbiss, industrie, insolvenz, investi, käufer, konkurs, kunde, kundschaft, lieferdienst, marken, markthalle, neueröffn, passage, produkte, räumungsverkauf, schließung, schwarzarbeit, sortiment, späti, start-up, steuer, streik, umsatz, unternehme, verkaufsfläche, warenh, wiedereröffn, wirtschaft'
`
}
};

//// KAPITEL 1.5 // CFG SuperMAX mit RegEx und Hashtag-Regeln ////////////////////////////////////////////
const CFG_DEFAULTS = {
  FEATURES:{ runHashtagOnOneClick:true, saveAfterOneClick:false, confirmOverwrite:true },
  REGEX:{
    base:[
        // Basics
        { pattern: "(?<!Kar)(S|s)amstag", flags: "gu", replacement: "$(1)onnabend" },  // Samstag wird Sonnabend inklusive Feiertagsregelung
        { pattern: "Die drei \\?{3}", flags: "gu", replacement: "DREI_FRAGE" }, // Debugging
        { pattern: "Die drei !{3}", flags: "gu", replacement: "DREI_AUSRUFE" }, // Debugging
        { pattern: "\\b(\\d{1,4})\\s*[–-]\\s*(\\d{1,4})\\b", flags: "gu", replacement: "$(1)-$(2)" }, // Gedankenstrich zwischen zwei Zahlen wird Bindestrich
        { pattern: "(\\b[a-zA-ZäöüÄÖÜß]{2,})\\s*–\\s*([a-zA-ZäöüÄÖÜß]{2,}\\b)", flags: "gu", replacement: "$(1)\u202F–\u202F$(2)" }, // Gedankenstrich mit Leerzeichen wird Gedankenstrich vorweg mit geschütztem Leerzeichen
        { pattern: "(\\b[a-zA-ZäöüÄÖÜß]{2,})\\s-\\s([a-zA-ZäöüÄÖÜß]{2,}\\b)", flags: "gu", replacement: "$(1)\u202F–\u202F$(2)" },   // Bindestrich mit Leerzeichen wird Gedankenstrich vorweg mit geschütztem Leerzeichen
        { pattern: "(?<=\\b[a-zA-ZäöüÄÖÜß]{3,})\\s*/\\s*(?=[a-zA-ZäöüÄÖÜß]{3,}\\b)", flags: "gu", replacement: "\u202F/\u202F" },    // Slash zwischen zwei Wörtern vorweg mit geschütztem Leerzeichen
        { pattern: "(\\(?\\d+)(\\s*)(/)(\\s*)(\\(?\\d+)", flags: "gu", replacement: "$(1)$(3)$(5)" }, // Slash zwischen zwei Zahlen ohne Leerzeichen
        { pattern: "\\*\\*", flags: "g", replacement: "" }, // Pseudofettung in Text Resizing

        // An- und Abführungszeichen sowie Auslassungszeichen vereinheitlichen
        // Apostroph
        { pattern: "(?<=\\p{L})'(?!\\s)", flags: "gu", replacement: "’" },
        // Öffnende doppelte
        { pattern: "(^|[\\s([{<–—])\"(?=\\S)", flags: "gu", replacement: "$(1)„" },
        { pattern: "(^|[\\s([{<–—])\\u201E(?=\\S)", flags: "gu", replacement: "$(1)„" },
        // Schließende doppelte
        { pattern: "\"(?=$|[\\s)\\]}>,.;:!?])", flags: "gu", replacement: "”" },
        { pattern: "\\u201F(?=$|[\\s)\\]}>,.;:!?])", flags: "gu", replacement: "”" },
        { pattern: "\"", flags: "gu", replacement: "”" },
        // Öffnende einfache
        { pattern: "(^|[\\s([{<–—])'(?=\\S)", flags: "gu", replacement: "$(1)‚" },
        // Schließende einfache
        { pattern: "'(?=$|[\\s)\\]}>,.;:!?])", flags: "gu", replacement: "’" },
        { pattern: "'", flags: "gu", replacement: "’" },
        // Optional Guillemets
        { pattern: "»\\s*", flags: "g", replacement: "„" },
        { pattern: "\\s*«", flags: "g", replacement: "”" },
        // Auslassungszeichen
        // 1) Apostroph innerhalb des Wortes
        { pattern: "(?<=\\p{L})’(?!\\s)(?=\\p{L})", flags: "gu", replacement: "'" },
        // 2) Apostroph am Wortende (z. B. mach')
        { pattern: "(?<=\\p{L})’(?!\\p{L})", flags: "gu", replacement: "'" },


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
        { pattern: "(?:^|\\b)(\\d{1})[\\.\\s\\u0020](\\d{3})(?:\\b|$)", flags: "gu", replacement: "$(1)$(2)" }, // 4-stellig ohne Dezimal

        // Telefonnummern für CUE optimieren
        { pattern: "\\b(?:Telefon|t)\\s*:?\\s*(?=[(+]?\\s*\\d)", flags: "giu", replacement: "Tel. " },
        { pattern: "\\u00BF\\s*:?\\s*(?=[(+]?\\s*\\d)", flags: "gu", replacement: "Tel. " },
        { pattern: "(?<=\\d)\\u0020(?=[\\d/()+-])", flags: "gu", replacement: "\u202F" },

        // Kalendermonate mit Regeln zu 2026
        { pattern: "(\\d{1,2})\\.\\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(\\s*)(2026|26)", flags: "gu", replacement: "$(1). $(2)" },
        { pattern: "\\.\\s*0?1\\.(2026|26)\\b", flags: "gu", replacement: ". Januar" },
        { pattern: "\\.\\s*0?2\\.(2026|26)\\b", flags: "gu", replacement: ". Februar" },
        { pattern: "\\.\\s*0?3\\.(2026|26)\\b", flags: "gu", replacement: ". März" },
        { pattern: "\\.\\s*0?4\\.(2026|26)\\b", flags: "gu", replacement: ". April" },
        { pattern: "\\.\\s*0?5\\.(2026|26)\\b", flags: "gu", replacement: ". Mai" },
        { pattern: "\\.\\s*0?6\\.(2026|26)\\b", flags: "gu", replacement: ". Juni" },
        { pattern: "\\.\\s*0?7\\.(2026|26)\\b", flags: "gu", replacement: ". Juli" },
        { pattern: "\\.\\s*0?8\\.(2026|26)\\b", flags: "gu", replacement: ". August" },
        { pattern: "\\.\\s*0?9\\.(2026|26)\\b", flags: "gu", replacement: ". September" },
        { pattern: "\\.\\s*10\\.(2026|26)\\b", flags: "gu", replacement: ". Oktober" },
        { pattern: "\\.\\s*11\\.(2026|26)\\b", flags: "gu", replacement: ". November" },
        { pattern: "\\.\\s*12\\.(2026|26)\\b", flags: "gu", replacement: ". Dezember" },
        { pattern: "\\.\\s*0?1\\.(2027|27)\\b", flags: "gu", replacement: ". Januar" },
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
        { pattern: "#WIU", flags: "gu", replacement: "Weitere Informationen im Internet unter " },
        { pattern: "#WIV", flags: "gu", replacement: "Weitere Informationen beim Veranstalter unter " },

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
  }
  };


//// KAPITEL 2 //// UTILITIES ////////////////////////////////////////////////////////////////////////////
//// KAPITEL 2.1 // Mini-UI //////////////////////////////////////////////////////////////////////////////
function smxToast(msg, ok = true) {
  try { if (typeof toast === 'function') { toast(msg, ok); return; } } catch {}
  try {
    const el = document.createElement('div');
    el.textContent = String(msg ?? '');
    el.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483647;'
      + 'background:' + (ok ? '#0b1e2d' : '#5c0d0d') + ';color:#fff;'
      + 'padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);'
      + 'font:13px/1.35 system-ui,Segoe UI,Arial,sans-serif;';
    document.body.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch {} }, 2200);
  } catch { try { console.log('[SMX]', ok ? 'OK:' : 'ERR:', msg); } catch {} }
}
function smxCreateOverlayBox(html){
const wrap=document.createElement('div');
wrap.style.cssText='position:fixed; inset:0; z-index:2147483647; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.35)';
const box=document.createElement('div');
box.style.cssText='background:#0b1e2d; color:#fff; border:1px solid #0d3a5c; border-radius:12px; max-width:820px; width:min(96vw,820px); box-shadow:0 12px 36px rgba(0,0,0,.4); font:13px/1.4 system-ui, Segoe UI, Arial; padding:14px;';
box.innerHTML=html;
wrap.appendChild(box);
document.body.appendChild(wrap);
return {wrap, box};
}

//// KAPITEL 2.2 // CFG-Reader ///////////////////////////////////////////////////////////////////////////
function smxGetCfgProfile(adapterId) {
try {
const cfg = (typeof window.SMX_CFG === 'object' && window.SMX_CFG && window.SMX_CFG.profiles)
? window.SMX_CFG.profiles : {};
return cfg?.[adapterId] || {};
} catch { return {}; }
}

//// KAPITEL 2.3 // Hilfsfunktionen //////////////////////////////////////////////////////////////////////
function normalizeSpace(s){ return String(s ?? '').replace(/\s+/g,' ').trim(); }
function normalizePreserveNewlines(s){ return String(s ?? '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }
function deepQS(sel, root=document){ try{ return root.querySelector(sel); }catch{ return null; } }
function deepQSA(sel, root=document){ try{ return Array.from(root.querySelectorAll(sel)); }catch{ return []; } }
function isVisible(el){ try{ const r=el.getBoundingClientRect(); return !!(r.width||r.height) && getComputedStyle(el).visibility!=='hidden'; }catch{ return !!el; } }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
// Clipboard: zuverlässig leeren (Tampermonkey/GM bevorzugt)
async function smxClipboardClear() {
  // 1) Tampermonkey / Greasemonkey API (am zuverlässigsten, kein Permission-Drama)
  try {
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard('', { type: 'text', mimetype: 'text/plain' });
      return true;
    }
  } catch {}

  // 2) Standard Clipboard API (kann Permission/User-Gesture brauchen)
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText('');
      return true;
    }
  } catch {}

  // 3) Legacy-Fallback (selten nötig; kann in modernen Browsern eingeschränkt sein)
  try {
    const ta = document.createElement('textarea');
    ta.value = '';
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch {}

  return false;
}
async function waitFor(fn, {timeout=2000, poll=60, root=document.body}={}){ const t0=Date.now(); return new Promise(res=>{ const tick=()=>{ try{ if(fn()) return res(true); }catch{} if(Date.now()-t0>=timeout) return res(false); setTimeout(tick, poll); }; tick(); }); }
function readGeneric(el){ try{ if(!el) return ''; const t=el.value ?? el.innerText ?? el.textContent ?? ''; return String(t); }catch{ return ''; } }
function writeGeneric(el, value){ try{ const str=String(value ?? ''); if(!el) return false; if('value' in el){ el.value=str; el.dispatchEvent?.(new InputEvent('input',{bubbles:true})); el.dispatchEvent?.(new Event('change',{bubbles:true})); return true; } el.textContent=str; el.dispatchEvent?.(new InputEvent('input',{bubbles:true})); el.dispatchEvent?.(new Event('change',{bubbles:true})); return true; }catch{ return false; } }
function highlight(el,color='#1b8d3d'){ if(!el) return; const prev=el.style.outline; el.style.outline=`2px solid ${color}`; el.scrollIntoView?.({block:'center',behavior:'smooth'}); setTimeout(()=>{ el.style.outline=prev; },1200); }

//// KAPITEL 2.4 // Shared Site Helpers (ehem. in Modulen) ///////////////////////////////////////////////
// — Ortsmarken —
const ORTSTEILE =
(window.SUPERBRIDGE_ORTSTEILE instanceof Set && window.SUPERBRIDGE_ORTSTEILE.size)
? window.SUPERBRIDGE_ORTSTEILE
: new Set(['Berlin']);
function normalizeKey(s){
return String(s??'')
.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
.replace(/[""'`´]/g,'')
.replace(/^[\s–— -:.,;]+|[\s–— -:.,;]+$/g,'')
.toLowerCase();
}
function firstWordCandidate(txt){
const s = String(txt??'').trim();
const m = s.match(/^([\p{L}\p{M}-]+)[\s–—:.,;)]?/u);
return m ? m[1] : '';
}
function scanForAnyOrtsteil(txt){
const words = String(txt??'').split(/[\s\n\r\t,.;: ()–— -]+/u);
for(const w of words){
const key = normalizeKey(w);
if(ORTSTEILE.has(key) || ORTSTEILE.has(w) || ORTSTEILE.has(w.trim())) return w;
}
return '';
}
function pickLocality({subline, body}){
const c1 = firstWordCandidate(subline);
if(ORTSTEILE.has(normalizeKey(c1)) || ORTSTEILE.has(c1)) return c1;
const c2 = firstWordCandidate(body);
if(ORTSTEILE.has(normalizeKey(c2)) || ORTSTEILE.has(c2)) return c2;
const c3 = scanForAnyOrtsteil(body);
if(c3) return c3;
return 'Berlin';
}
function stripLeadingOrtmarke(text, locality) {
  if (!text || !locality) return text;
  try {
    const esc = locality.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('^\\s*' + esc + '\\s*[.:]?\\s*', 'i');
    const out = String(text).replace(pattern, '').trim();
    return out;
  } catch { return text; }
}

// --- Canonicals & Mapping für Ausgabe-Kürzel (aus CFG.SUPERRED.editionMap) ---
function smxCanonLoc(s){
  try{
    return String(s??'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')         // Diakritika entfernen
      .replace(/[–—\-]/g,'-').replace(/[.,:;!?()\[\]]+/g,'')   // Satzzeichen glätten
      .replace(/\s+/g,' ').trim().toLowerCase();
  }catch{ return String(s??'').trim().toLowerCase(); }
}

const SMX_LOCALITY_TO_CODES = (function buildLocalityIndex(){
  const map = new Map();
  try{
    const edMap = CFG?.SUPERRED?.editionMap ?? {};
    for(const [code, list] of Object.entries(edMap)){
      for(const raw of (list ?? [])){
        const key = smxCanonLoc(raw);
        if(!map.has(key)) map.set(key, new Set());
        map.get(key).add(code);
      }
    }
  }catch{}
  return map;
})();

function smxCodesForLocalityName(name){
  const key = smxCanonLoc(name);
  return new Set(SMX_LOCALITY_TO_CODES.get(key) ?? []);
}


// --- SuperRED/CUE: Locality-Workflow nach editionMap (gültig/ungültig + Feldreihenfolge) ---
function smxBuildValidLocalityIndex() {
  const map = new Map(); // canon -> prettyName (erste Schreibweise)
  try {
    const edMap = CFG?.SUPERRED?.editionMap ?? {};
    for (const list of Object.values(edMap)) {
      for (const raw of (list ?? [])) {
        const pretty = String(raw ?? '').trim();
        if (!pretty) continue;
        const canon = smxCanonLoc(pretty);
        if (!canon) continue;
        if (!map.has(canon)) map.set(canon, pretty);
      }
    }
  } catch {}
  return map;
}

const SMX_VALID_LOCALITY = smxBuildValidLocalityIndex();

function smxIsValidLocalityName(name) {
  const canon = smxCanonLoc(name);
  return !!canon && SMX_VALID_LOCALITY.has(canon);
}

// Boundary-Check in canonical text: Treffer darf nicht mitten im Wort liegen
function smxIsWordBoundaryAt(canonText, start, len) {
  const isWordChar = (ch) => /[a-z0-9äöüß]/i.test(ch);
  const before = start > 0 ? canonText[start - 1] : ' ';
  const after = (start + len) < canonText.length ? canonText[start + len] : ' ';
  return !isWordChar(before) && !isWordChar(after);
}

// Findet "erste Ortsmarke" im Text; Berlin kann ausgeschlossen werden
function smxFindFirstLocalityInText(text, { excludeBerlin = true } = {}) {
  const canonText = smxCanonLoc(text);
  if (!canonText) return '';

  let best = { pos: Infinity, name: '' };

  for (const [canonName, pretty] of SMX_VALID_LOCALITY.entries()) {
    if (!canonName) continue;
    if (excludeBerlin && canonName === 'berlin') continue;

    const pos = canonText.indexOf(canonName);
    if (pos < 0) continue;
    if (!smxIsWordBoundaryAt(canonText, pos, canonName.length)) continue;

    if (pos < best.pos) best = { pos, name: pretty };
  }

  return best.name || '';
}

function smxFindLocalityViaAliases(text) {
  const list = CFG?.SUPERRED?.localityAliases ?? [];
  if (!list.length) return '';

  const canonText = smxCanonLoc(text);
  if (!canonText) return '';

  let best = { pos: Infinity, locality: '' };

  for (const entry of list) {
    const needleRaw = Array.isArray(entry) ? entry[0] : entry?.match;
    const locRaw    = Array.isArray(entry) ? entry[1] : entry?.locality;
    if (!needleRaw || !locRaw) continue;

    // mapped locality muss gültig sein (editionMap)
    if (!smxIsValidLocalityName(locRaw)) continue;

    const canonNeedle = smxCanonLoc(needleRaw);
    if (!canonNeedle) continue;

    const pos = canonText.indexOf(canonNeedle);
    if (pos < 0) continue;

    // Wortgrenzen wie bei der Ortsmarken-Suche
    if (!smxIsWordBoundaryAt(canonText, pos, canonNeedle.length)) continue;

    if (pos < best.pos) best = { pos, locality: String(locRaw).trim() };
  }

   return best.locality || '';
  }


// CUE-Workflow für 'locality':
// Behalte vorhandene gültige Ortsmarke (≠ Berlin) → dann Aliases (bevorzugt) → dann editionMap → Fallback Berlin
function smxDeriveLocalityForSuperRED_CUE({ existing, body, subline, headline, headline_pro }) {
  const ex = String(existing ?? '').trim();

  // 1) bestehende Ortsmarke behalten, wenn gültig UND nicht Berlin
  if (ex && smxIsValidLocalityName(ex) && smxCanonLoc(ex) !== 'berlin') return ex;

  // 2) Aliases zuerst – Reihenfolge: body → subline → headline → headline_pro
  const aliasSources = [body, subline, headline, headline_pro];
  for (const txt of aliasSources) {
    const viaAlias = smxFindLocalityViaAliases(txt);
    if (viaAlias) return viaAlias;
  }

  // 3) editionMap (erste gültige Ortsmarke, Berlin ausgeschlossen)
  const mapSources = [body, subline, headline, headline_pro];
  for (const txt of mapSources) {
    const viaMap = smxFindFirstLocalityInText(txt, { excludeBerlin: true });
    if (viaMap) return viaMap;
  }

  // 4) Fallback
  return 'Berlin';
}

// CUE: Body kann aus mehreren Paragraph-Story-Elementen bestehen.
// Diese Funktion sammelt alle passenden Editoren und fügt den Text zusammen.
function cueReadAllBodyParagraphsText(scope = document) {
  try {
    const bodyIds = (CUE?._tabs?.TESTIDS?.body ?? []);
    if (!bodyIds.length) return '';

    const texts = [];

    const pickEditor = (host) =>
      deepQS('.ql-editor[contenteditable="true"]', host) ||
      deepQS('[contenteditable="true"]', host) ||
      deepQS('textarea, input[type="text"], input[type="search"], [role="textbox"]', host);

    for (const tid of bodyIds) {
      const hosts = deepQSA(`[data-testid="${tid}"]`, scope);
      for (const host of hosts) {
        const ed = pickEditor(host);
        if (!ed) continue;
        const t = normalizePreserveNewlines(readGeneric(ed));
        if (t) texts.push(t);
      }
    }

    // Dedupe (falls CUE dieselben Blöcke mehrfach rendert)
    const uniq = Array.from(new Set(texts));
    return normalizePreserveNewlines(uniq.join('\n\n'));
  } catch {
    return '';
  }
  }


function smxComputeEditionCodes(values){ // values: { locality?, subline, body }
  const cfg = CFG?.SUPERRED ?? {};
  const maxCodes = Math.max(1, Number(cfg.maxEditionCodes ?? 3));
  const blacklist = new Set((cfg.localityBlacklist ?? []).map(smxCanonLoc));
  const FALLBACK = 'DL';
  const codesOrdered = [];

  const pushCodes = (codes) => {
    for (const c of codes) {
      if (!codesOrdered.includes(c)) codesOrdered.push(c);
      if (codesOrdered.length >= maxCodes) return;
    }
  };


  // --- CUE-Auto-Lift: Falls locality nicht übergeben wurde, direkt aus CUE-Feld holen ---
  //    Ziel: Nur auf der CUE-Site locality als Primär-AKZ nutzen; PPS bleibt unberührt.
  try {
    const isCUE = typeof CUE === 'object' && CUE?.detect?.();
    if (isCUE && (!values || !values.locality)) {
      // 1) Rohwert aus dem CUE-Feld 'locality' lesen (falls vorhanden)
      const f = CUE.getFields?.() ?? {};
      const rawLoc = (f.locality ? CUE.read?.(f.locality) ?? readGeneric(f.locality) : '').trim();

      // 2) Wenn leer, aus Inhalten ableiten (CUE-Workflow: Alias first, dann editionMap)
      const derivedLoc = rawLoc || smxDeriveLocalityForSuperRED_CUE({
        existing: rawLoc,
        body: cueReadAllBodyParagraphsText(),
        subline: f.subline ? CUE.read?.(f.subline) ?? readGeneric(f.subline) : '',
        headline: f.headline ? CUE.read?.(f.headline) ?? readGeneric(f.headline) : '',
        headline_pro: f.headline_pro ? CUE.read?.(f.headline_pro) ?? readGeneric(f.headline_pro) : ''
      });

      if (derivedLoc) {
        values = { ...(values ?? {}), locality: derivedLoc.trim() };
      }
    }
  } catch { /* silent */ }

  // === 1) PRIMÄR (NEU): Feld 'locality' bevorzugen, falls vorhanden ===
  //    - wenn gültiger Ortsname: direkt mappen
  //    - sonst: Alias-Mapping für locality-String versuchen (z.B. "Südkreuz" -> "Schöneberg")
  (function preferLocalityFieldFirst() {
    const raw = String(values?.locality ?? '').trim();
    if (!raw) return;

    let chosen = '';
    if (smxIsValidLocalityName(raw)) {
      chosen = raw;
    } else {
      // locality-String könnte selbst ein Alias enthalten
      const viaAlias = smxFindLocalityViaAliases(raw);
      if (viaAlias && smxIsValidLocalityName(viaAlias)) {
        chosen = viaAlias;
      }
    }
    if (chosen) {
      const setCodes = smxCodesForLocalityName(chosen);
      const filtered = [...setCodes].filter(c => c !== 'DL' || codesOrdered.length === 0);
      pushCodes(filtered);
    }
  })();

  // === 2) SEKUNDÄR: Alias- & editionMap-Detektion im Text (wie bisher) ===
  const b = String(values?.body ?? '');
  const s = String(values?.subline ?? '');

  // 2a) Aliase im gesamten Text (body -> subline)
  const aliasPrimary =
    smxFindLocalityViaAliases(b) ||
    smxFindLocalityViaAliases(s);

  // 2b) editionMap (erste gültige Ortsmarke, Berlin ausgeschlossen)
  const mapPrimary =
    aliasPrimary ||
    smxFindFirstLocalityInText(b, { excludeBerlin: true }) ||
    smxFindFirstLocalityInText(s, { excludeBerlin: true }) ||
    '';

  const localityPrimary = mapPrimary || 'Berlin';
  const primaryCodes = smxCodesForLocalityName(localityPrimary);
  const filteredPrimary = [...primaryCodes].filter(c => c !== 'DL' || codesOrdered.length === 0);
  pushCodes(filteredPrimary);

  // 2c) Weitere Ortsnennungen im Body (Token-Scan), inkl. Alias-Prüfung pro Token
  const tokens = b.split(/[\s\n\r\t,.;:\(\)–—\-]+/);
  for (const w of tokens) {
    const name = w.trim();
    if (!name) continue;
    const canon = smxCanonLoc(name);
    if (blacklist.has(canon)) continue;

    // Alias -> Codes
    const viaAlias = smxFindLocalityViaAliases(name);
    if (viaAlias) {
      const aliasCodes = smxCodesForLocalityName(viaAlias);
      const filtered = [...aliasCodes].filter(c => c !== 'DL' || codesOrdered.length === 0);
      pushCodes(filtered);
      if (codesOrdered.length >= maxCodes) break;
      continue;
    }

    // editionMap exakte Namen -> Codes
    const codes = smxCodesForLocalityName(name);
    if (codes.size) {
      const filtered = [...codes].filter(c => c !== 'DL' || codesOrdered.length === 0);
      pushCodes(filtered);
      if (codesOrdered.length >= maxCodes) break;
    }
  }

  // === 3) DL-Fallback-Logik: nur wenn KEIN anderer Code existiert ===
  const hasNonDL = codesOrdered.some(c => c !== 'DL');
  if (hasNonDL) {
    for (let i = codesOrdered.length - 1; i >= 0; i--) {
      if (codesOrdered[i] === 'DL') codesOrdered.splice(i, 1);
    }
  } else if (codesOrdered.length === 0) {
    codesOrdered.push(FALLBACK);
  }

  // Für das Dateinamen-Präfix werden Codes mit ' II ' verkettet
  return codesOrdered.join(' II ');
}

// --- KW/Datumshilfen (für SuperRED & SuperNOTES) ---
function isoWeekString(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = date.getUTCDay();
  const dayNum = (dow===0?7:dow);
  date.setUTCDate(date.getUTCDate()+4-dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart)/86400000)+1)/7);
  return String(weekNo).padStart(2,'0');
}
function nextWeekday(date, weekday){ // Mo=1 ... So=7
  const dd = new Date(date); const day = dd.getDay();
  const w = (typeof weekday==='number'?weekday:1);
  let delta = (w - day + 7) % 7; if(delta===0) delta=7;
  dd.setDate(dd.getDate()+delta); return dd;
}
function redaktionsKWString(now, weekday){ // „redaktionsschluss“ Modus
  const d = new Date(now); const day = d.getDay();
  const rsDay = (typeof weekday==='number')?weekday:1;
  if(day===rsDay) return isoWeekString(d);
  const nm = nextWeekday(d, rsDay); return isoWeekString(nm);
}
function isoWeekToDate(year, week, weekday=(CFG?.SUPERRED?.appearanceWeekday ?? 6)){
  const jan4 = new Date(Date.UTC(year,0,4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const mondayOfW1 = new Date(jan4);
  mondayOfW1.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
  const target = new Date(mondayOfW1);
  target.setUTCDate(mondayOfW1.getUTCDate() + ((week-1)*7) + ((weekday-1)));
  return new Date(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
}
function resolveIssueDateFromKW(kw, weekday=(CFG?.SUPERRED?.appearanceWeekday ?? 6), today=new Date()){
  const y = today.getFullYear();
  const dThis = isoWeekToDate(y, kw, weekday);
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if(dThis < today0) return isoWeekToDate(y+1, kw, weekday);
  return dThis;
}

// --- Stichwort-Extraktion (vereinfacht für v5; nutzt CFG.SUPERRED.stichwortMatch) ---
function smxExtractStichwort(values){
  const cfg = CFG?.SUPERRED ?? {};
  const stems = (cfg.stichwortMatch ?? []).map(s => String(s).toLowerCase());
  const ignoreExact = new Set((cfg.ignoreExact ?? []).map(s => String(s).toLowerCase()));

  function pickFrom(text){
   const raw = String(text ?? '');
   const words = raw.match(/\b[\p{L}\p{M}\-]+\b/gu) ?? [];
   for (const w of words){
     const word = w.trim();
     const low  = word.toLowerCase();
     if(!word || ignoreExact.has(low)) continue;
     if(stems.some(st => low.includes(st))){
       // Originalschreibweise zurückgeben, nur sanft bereinigen
       return word.replace(/[\)\]\].,:;!?]+$/,'').replace(/\s+/g,' ').trim();
     }
   }
   return '';
 }

  // 1) Subline → 2) Body (nur Anfang)
  const try1 = pickFrom(values?.subline ?? '');
  if(try1) return try1;
  const bodyStartRaw = String(values?.body ?? '').slice(0, 280);
  return pickFrom(bodyStartRaw) || '';
}

// --- Nummern-Erkennung und RED-Dateiname bauen ---
function guessArticleNumber(list, min=5, max=12){
  const re = new RegExp(`(?:^|\\D)(\\d{${min},${max}})(?!\\d)`, 'u');
  for(const s of list){ const m = String(s??'').match(re); if(m) return m[1]; }
  return '';
}
function getExistingNumberFromField(inputEl){
  const v = String(inputEl?.value ?? '');
  let m = v.match(/_(\d{5,12})(?:_|$)/u);
  if(m) return m[1];
  m = v.match(/(?:^|\D)(\d{5,12})(?!\d)/u);
  return m ? m[1] : '';
}
function smxSafeHeadline(h){
  return String(h??'').replace(/\s+/g,' ').trim();
}
function smxKw(now=new Date()){
  const cfg = CFG?.SUPERRED ?? {};
  if(!cfg.useKW) return '';
  return (cfg.kwMode === 'redaktionsschluss')
    ? redaktionsKWString(now, cfg.redaktionsschlussWeekday ?? 1)
    : isoWeekString(now);
}

function smxBuildFileName({ kw, kuerzel, nummer, headline, stichwort }){
  const cfg = CFG?.SUPERRED ?? {};
  const delim = String(cfg.filenameDelimiter ?? ' II ');  // überall gleich

  // Segmente
  const segKW      = String(kw ?? '').trim();          // "KW"
  const segAKZ     = String(kuerzel ?? '').trim();     // "AKZ"
  const segArtikel = String(nummer ?? '').trim();      // "Artikel-ID"

  const H = String(headline ?? '').trim();
  const S = String(stichwort ?? '').trim();
  const segTitle = cfg.wrapStichwortInParens && S
    ? `${H || 'ohne Titel'} (${S})`
    : (cfg.headlineFirst ? H : (H ? `${H}${S ? ` (${S})` : ''}` : (S ? `(${S})` : 'ohne Titel')));

  const parts = [];
  if(segKW)      parts.push(segKW);
  if(segAKZ)     parts.push(segAKZ);
  if(segArtikel) parts.push(segArtikel);
  parts.push(segTitle);

  return parts.join(delim); // "KW II AKZ II Artikel-ID II Überschrift (Stichwort)"
}

// >>> KAPITEL 2.4 – Helper: Artikel-ID aus CUE lesen (global verfügbar)
function cueReadArticleIdSafe(){
  try{
    // 1) Primäre Scopes: rechte Metadaten-Spalte / Panels
    const scopes = [
      // Häufige Container im Screenshot:
      '.cue-side-metadata-panel',
      '[class*="metadata-panel"]',
      // Fallbacks: ganze Seite durchsuchen, falls spezifische Container fehlen
      'main', 'body', 'document'
    ];

    // Hilfsfunktion: sichere Normalisierung
    const norm = s => String(s ?? '').toLowerCase().trim();

    // Versuche gezielt: Zeilen mit .row + .left "ID:" + .right selectable
    for (const sel of scopes){
      const root = sel === 'document' ? document : (deepQS(sel) || document);
      if (!root) continue;

      // Kandidaten: DIV.row mit "left"/"right" Spalten
      const rows = deepQSA('.row', root);
      for (const r of rows){
        try{
          const left  = deepQS('.left', r);
          const right = deepQS('.right, .right.selectable', r);
          const isIdLeft = /(^|\b)id(:)?\b/i.test(norm(left?.textContent));
          if (isIdLeft){
            const val = (right?.innerText ?? right?.textContent ?? '').trim();
            const m = val.match(/(\d{5,12})/);
            if (m) return m[1];
          }
          // Fallback: Titelattribut der row
          const title = r.getAttribute?.('title') ?? '';
          const mt = title.match(/\bID:\s*(\d{5,12})\b/i);
          if (mt) return mt[1];
        }catch{}
      }

      // Zweiter Versuch: beliebige Elemente mit sichtbarem "ID:" links und Zahl rechts
      const pairs = deepQSA('[class*="left"], [class*="label"]', root);
      for (const lbl of pairs){
        try{
          if (!/(^|\b)id(:)?\b/i.test(norm(lbl.textContent))) continue;
          const parent = lbl.closest('.row, .property, div') ?? lbl.parentElement;
          const right = parent ? deepQS('.right.selectable, .right, [class*="value"]', parent) : null;
          const val = (right?.innerText ?? right?.textContent ?? '').trim();
          const m = val.match(/(\d{5,12})/);
          if (m) return m[1];
        }catch{}
      }
    }

    // 2) Ultimate fallback: suche nach Textknoten "ID:" irgendwo und nimm die nächste Zahl
    const anyIdText = deepQSA('*').find(el => /\bID:\b/i.test(norm(el.textContent)));
    if (anyIdText){
      const text = anyIdText.textContent ?? '';
      const m = text.match(/\bID:\s*(\d{5,12})\b/i);
      if (m) return m[1];
      // evtl. geschwister "right selectable"
      const sibRight = anyIdText.parentElement ? deepQS('.right.selectable, .right', anyIdText.parentElement) : null;
      const val = (sibRight?.innerText ?? sibRight?.textContent ?? '').trim();
      const mr = val.match(/(\d{5,12})/);
      if (mr) return mr[1];
    }

    // Wenn nichts gefunden:
    return '';
  }catch{
    return '';
  }
}


// Wandelt Plain-Text in <p>...</p>-Absätze um.
// Absatzgrenzen = zwei oder mehr Newlines; einzelne \n werden als <br> behandelt.

function smxPlainTextToHtmlParagraphs(str){
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
  const normalized = String(str ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ');
  const paras = normalized.split(/\n{2,}/);
  return paras.map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

// — Quill-Writer —
function writeWithQuillAware(el, value, opts = {}) {
  if (typeof SMX_DRY_RUN !== 'undefined' && SMX_DRY_RUN) {
    try { highlight(el, '#ffa726'); } catch {}
    try { console.log('[SMX][Dry-Run] write', { value }); } catch {}
    return true;
  }


const str = String(value ?? '');
  try {
    const container = el.closest?.('.ql-container') ?? el.closest?.('[class*="ql-container"]');
    const quill = container && container.__quill;

    if (quill && typeof quill.getModule === 'function') {
      try { quill.focus?.(); } catch {}
      try { quill.setSelection(0, Math.max(0, (quill.getLength?.() ?? 0))); } catch {}

      try {
        const role = String(opts?.role ?? '').toLowerCase();
        const canPasteHtml = !!(quill.clipboard?.dangerouslyPasteHTML);

        // === STRG+V-ähnlicher Pfad NUR für CUE-Body ===
        if (role === 'body') {
          // 1) Editor sicher vollständig leeren
          try { quill.deleteText(0, Math.max(0, (quill.getLength?.() ?? 0)), 'user'); } catch {}

          // 2) Möglichst echte "Paste"-Semantik: Plain-Text einfügen
          //    -> Quill/CUE erzeugen Absätze aus \n\n wie bei STRG+V.
          //    Zuerst versuchen wir den Browserpfad:
          let okExec = false;
          try {
            el.focus?.();
            document.execCommand('insertText', false, str); // echte InsertText-Route
            okExec = true;
          } catch { okExec = false; }

          // 3) Fallback: Quill-Clipboard mit HTML-Absätzen
          if (!okExec && canPasteHtml) {
            const html = smxPlainTextToHtmlParagraphs(str);
            quill.clipboard.dangerouslyPasteHTML(0, html, 'user');
          } else if (!okExec && typeof quill.setText === 'function') {
            quill.setText(str, 'user');
          }
        } else {
          // === Bisheriges Verhalten für alle anderen Rollen (mit KORREKTEM ESCAPING) ===
          if (canPasteHtml) {
            try { quill.deleteText(0, Math.max(0, (quill.getLength?.() ?? 0)), 'user'); } catch {}
            const html = String(str)
              .split('\n')
              .map(s => `<p>${s.replace(/[&<>"']/g, c =>
                (c === '<' ? '&lt;' : c === '>' ? '&gt;' :
                 c === '&' ? '&amp;' : c === '"' ? '&quot;' : '&#39;'))}</p>`)
              .join('');
            quill.clipboard.dangerouslyPasteHTML(0, html, 'user');
          } else if (typeof quill.setText === 'function') {
            quill.setText(str, 'user');
          }
        }
      } catch {}

      // Events wie Paste
      const root = quill.root ?? el;
      const fire = (node, ev) => { try { node.dispatchEvent(ev); } catch {} };
      const mkBefore = (type) => new InputEvent('beforeinput', {
        bubbles:true, cancelable:true, inputType: type || 'insertFromPaste', data: str
      });
      fire(root, mkBefore('insertFromPaste'));
      fire(root, new InputEvent('input', { bubbles:true }));
      fire(root, new Event('change', { bubbles:true }));

      try { root.blur?.(); } catch {}
      try { document.body.click?.(); } catch {}
      try { root.dispatchEvent?.(new FocusEvent('focusout', { bubbles:true })); } catch {}

      // Erfolg prüfen (robust, unabhängig von Absatz-/Zeilenformaten)
      const now = readGeneric(root);
      if (normalizeSpace(now) === normalizeSpace(str)) return true;

      try {
        const qtxt = (quill.getText?.() ?? '').replace(/\s+$/,'');
        // Für Body reicht inhaltliches Vorhandensein; für andere Rollen exakter Vergleich
        const role = String(opts?.role ?? '').toLowerCase();
        if (role === 'body' ? (qtxt.length > 0) : (normalizeSpace(qtxt) === normalizeSpace(str))) {
          return true;
        }
      } catch {}
    }
  } catch {}

  // Fallback: generisches Schreiben (nicht-Quill)
  return writeGeneric(el, value);
}

// — PPS-Collector (Headline/Subline/Body/Locality, Caption/Credit) —
async function ppsCollectBridgeDataAll(){
const data = { headline:'', subline:'', locality:'', body:'', pairs:[] };
const captions = [];
const credits = [];
const bodyChunks = [];
const seenPM = new WeakSet();
const readParas = (pmEl) => {
const blocks = [];
try{
const nodes = pmEl.querySelectorAll('p, li, div');
for(const n of nodes){
const t = (n.innerText ?? n.textContent ?? '').replace(/\s+/g,' ').trim();
if(t) blocks.push(t);
}
}catch{}
if(!blocks.length){
const t = readGeneric(pmEl);
if(t) return t.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean).join('\n');
}
return blocks.join('\n');
};
const collectVisibleEditors = () => {
const pms = deepQSA('.ProseMirror[contenteditable="true"]').filter(isVisible);
for(const pm of pms){
if (seenPM.has(pm)) continue;
seenPM.add(pm);
const role = PPS.inferActiveRole?.(pm) ?? 'body';
const raw = readGeneric(pm);
if(!raw) continue;
if (role === 'headline' && !data.headline) data.headline = raw;
else if (role === 'subline' && !data.subline ) data.subline = raw;
else if (role === 'caption') captions.push(raw);
else if (role === 'credit' ) credits .push(raw);
else if (role === 'body' ) bodyChunks.push(readParas(pm));
}
};
const navItems = ppsGetNavItems();
if (navItems.length){
for (const it of navItems){
await ppsActivateNavItem(it);
collectVisibleEditors();
}
} else {
collectVisibleEditors();
}
const uniqBodyChunks = Array.from(new Set(bodyChunks.filter(Boolean)));
data.body = normalizePreserveNewlines(uniqBodyChunks.join('\n\n'));
const n = Math.max(captions.length, credits.length);
for (let i=0;i<n;i++){
const cap = captions[i] ?? '';
const cre = credits[i] ?? '';
if (cap || cre) data.pairs.push({ caption: cap, credit: cre });
}
const seenPairs = new Set();
data.pairs = data.pairs.filter(p => {
const key = normalizeSpace(p.caption || '') + ' II ' + normalizeSpace(p.credit || '');
if (seenPairs.has(key)) return false;
seenPairs.add(key);
return true;
});
data.locality = pickLocality({ subline: data.subline, body: data.body });
return data;
}

//// KAPITEL 3 //// ADAPTER //////////////////////////////////////////////////////////////////////////////
//// KAPITEL 3.1 // Rollen & Begriffe ////////////////////////////////////////////////////////////////////
const LABELS = {
headline_pro:['headline_pro'],
headline:['überschrift','headline','titel'],
subline:['unterzeile','subheadline','autorenzeile'],
body:['text','fließtext','body','artikeltext','absatz'],
body_input:['text','textarea','body','artikeltext','absatz'],             // nur ARTICLE RESIZER
body_output:['text','textarea','body','ergebnis','artikeltext','absatz'], // nur ARTICLE RESIZER
print_filename:['print_filename','manueller print-dateiname','manueller print-dateiname'],
articleDescription:['artikelbeschreibung','dateiname','filename','file name'],
notes:['notiz','notizen','notes'],
print_et:['print_et','date'],
id:['id'],
locality:['ortsmarke'],
caption:['bildunterschrift','caption','beschriftung','bildtext','untertitel','image subtitle','subtitle'],
credit:['bildautor','fotograf','credit','foto:','author']
};
const ROLE_TO_DE = {
headline_pro:'Überschrift 2',
headline:'Überschrift 1',
subline:'Unterzeile',
body:'Fließtext',
print_filename:'Dateiname',
articleDescription:'Artikelbeschreibung',
notes:'Notizen',
print_et:'Erscheinungstag',
locality:'Ortsmarke',
caption:'Bildunterschrift',
credit:'Bildautor'
};
const includesAny = (hay, terms) => { const h=(hay??'').toLowerCase(); return terms.some(t => t && h.includes(t)); };
const textAround = (el) => {
let s='';
const aria=(el.getAttribute?.('aria-label')??'');
const ph=(el.getAttribute?.('placeholder')??'');
s+=`${aria} ${ph}`;
const prev=el.previousElementSibling; if(prev?.tagName==='LABEL') s+=' '+(prev.textContent??'');
let p=el.previousElementSibling, hops=0;
while(p && hops<3){ if(isVisible(p)) s+=' '+(p.textContent??''); p=p.previousElementSibling; hops++; }
const group=el.closest('[role="group"], [role="region"], section, fieldset, .card, .panel, .cue-field, div');
if(group){ const lab=group.querySelector('label, legend, [role="heading"], h1, h2, h3, h4, h5, h6'); if(lab) s+=' '+(lab.textContent??''); }
return (s ?? '').toLowerCase();
};

//// KAPITEL 3.2 // PPS-ADAPTER //////////////////////////////////////////////////////////////////////////
const PPS = (() => {
const ARTICLE_DESC_SELECTORS = ['#moduleTitle','#positionInfo','input[name="fileName"]','input[placeholder*="Dateiname" i]','input[aria-label*="Artikelbeschreibung" i]','input[aria-label*="Dateiname" i]'];
function findNotes(){
const direct=['#notes','textarea[name="notes"]','input[name="notes"]','[aria-label*="Notiz" i]','[placeholder*="Notiz" i]'];
for(const s of direct){ const el=document.querySelector(s)||deepQS(s); if(el) return el; }
const labs=Array.from(document.querySelectorAll('label')).filter(l=>/notiz|notizen|notes?/i.test(l.textContent??''));
for(const lab of labs){
const forId=lab.getAttribute('for');
if(forId){ const el=document.getElementById(forId); if(el) return el; }
const el=lab.closest('section,div,li,form,fieldset')?.querySelector('textarea, input, [contenteditable="true"]');
if(el) return el;
}
try{
const xp=document.evaluate("//label[contains(translate(., 'NOTIZEN', 'notizen'),'notiz')]/following::*[self::textarea or self::input or @contenteditable='true'][1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
if(xp) return xp;
}catch{}
return null;
}
function inferPMRoleInPPS(pmEl){
if(!pmEl) return null;
const host=pmEl.closest('li.jsModuleItem.moduleFormListItem.moduleFormItemSelect,[data-label]');
const dataLabel=host?.getAttribute?.('data-label')?.toLowerCase()||'';
if(dataLabel==='headline') return 'headline';
if(dataLabel==='subheadline') return 'subline';
if(dataLabel==='text') return 'body';
if(/subtitle|caption/.test(dataLabel)||/image\d+_subtitle/.test(dataLabel)) return 'caption';
if(/author|credit/.test(dataLabel)||/image\d+_author/.test(dataLabel)) return 'credit';
return null;
}
function getFields(){
const out={};
for (const sel of ARTICLE_DESC_SELECTORS) {
const el=document.querySelector(sel)||deepQS(sel);
if(el){ out.articleDescription=el; break; }
}
const nf=findNotes(); if(nf) out.notes=nf;
return out;
}
function inferActiveRole(activeEl){
if(!activeEl) return null;
const pm=(activeEl.matches?.('.ProseMirror[contenteditable="true"]')?activeEl:activeEl.closest?.('.ProseMirror[contenteditable="true"]'));
if(pm && isVisible(pm)){ return inferPMRoleInPPS(pm)??'body'; }
const near=textAround(activeEl);
if(includesAny(near, LABELS.caption)) return 'caption';
if(includesAny(near, LABELS.credit)) return 'credit';
const fields=getFields();
if(fields.articleDescription&&(activeEl===fields.articleDescription||fields.articleDescription.contains?.(activeEl))) return 'articleDescription';
if(fields.notes&&(activeEl===fields.notes||fields.notes.contains?.(activeEl))) return 'notes';
return null;
}
function detect(){ return location.href.includes('/pps/') || !!document.querySelector('#jsFragments') || !!document.querySelector('.ProseMirror'); }
return { id:'pps', detect, getFields, inferActiveRole, read:readGeneric, write:writeGeneric };
})();

// Feldnavigation CFG-Override (SuperPORT)
function ppsGetNavItems(){
const cfg = smxGetCfgProfile('PPS')?.SUPERPORT || {};
const sel = cfg.navItemSelector || 'li.jsModuleItem.moduleFormListItem.moduleFormItemSelect, [data-label]';
return deepQSA(sel).filter(isVisible);
}
async function ppsActivateNavItem(el){
if (!el) return false;
el.click();
const cfg = smxGetCfgProfile('PPS')?.SUPERPORT || {};
const editableSel =
cfg.editableSelector
|| '.ProseMirror[contenteditable="true"], .ql-editor[contenteditable="true"], [contenteditable="true"], textarea, input[type="text"], [role="textbox"]';
const timeout = Number(cfg.activateTimeoutMs ?? 2000) || 2000;
const poll = Number(cfg.activatePollMs ?? 60) || 60;
const postClickDelay = Number(cfg.postClickDelayMs ?? 80) || 80;
await sleep(postClickDelay);
const ok = await waitFor(() => !!deepQSA(editableSel).some(isVisible), { timeout, poll, root: document.body });
return !!ok;
}

//// KAPITEL 3.3 // CUE-ADAPTER //////////////////////////////////////////////////////////////////////////
const CUE = (() => {
const DEFAULT_TESTIDS = {
headline_pro: ['se_headline_pro_field','story-element-se_headline_pro'],
headline: ['se_headline_field','story-element-se_headline'],
subline: ['se_lead_text_field','story-element-se_lead_text'],
locality: ['se_location_field','story-element-se_location'],
body: ['se_paragraph_field','story-element-se_paragraph'],
print_et: ['print_et','date'],
print_filename: ['print_Filename','print_filename'],
notes: ['notes','se_notes_field','story-element-se_notes'],
id: ['id']
};
const TESTIDS = smxGetCfgProfile('CUE')?.SITE?.TESTIDS || DEFAULT_TESTIDS;

function cueGetTabPanel(tabEl) {
if (!tabEl) return document;
const ctrl = tabEl.getAttribute('aria-controls');
if (ctrl) {
const p = deepQS(`#${CSS.escape(ctrl)}`);
if (p && isVisible(p)) return p;
}
const tid = tabEl.id;
if (tid) {
const p = deepQS(`[role="tabpanel"][aria-labelledby="${CSS.escape(tid)}"]`);
if (p && isVisible(p)) return p;
}
const container = tabEl.closest('[role="tablist"], .MuiTabs-root, .tabs, .panel, section, main, body') ?? document;
const panels = deepQSA('[role="tabpanel"]', container).filter(isVisible);
return panels[0] ?? document;
}
function findEditableInside(root){
if(!root) return null;
return deepQS('.ql-editor[contenteditable="true"]',root)
?? deepQS('[contenteditable="true"]',root)
?? deepQS('textarea, input[type="text"], input[type="search"], [role="textbox"], input[type="date"]',root)
?? (root.matches?.('.ql-editor[contenteditable="true"],[contenteditable="true"],textarea,input,[role="textbox"]')?root:null);
}
function byTestIds(ids, scope=document){
for(const id of ids){
const direct=deepQS(`[data-testid="${id}"]`, scope);
if(direct){
const ed=findEditableInside(direct);
if(ed) return ed;
}
}
return null;
}
function getFields(scope=document){
const map={};
map.headline = byTestIds(TESTIDS.headline,scope);
map.headline_pro = byTestIds(TESTIDS.headline_pro,scope);
map.subline = byTestIds(TESTIDS.subline,scope);
map.locality = byTestIds(TESTIDS.locality,scope);
map.body = byTestIds(TESTIDS.body,scope);
map.print_et = byTestIds(TESTIDS.print_et,scope);
map.print_filename= byTestIds(TESTIDS.print_filename,scope);
map.id = byTestIds(TESTIDS.id,scope);
map.notes = byTestIds(TESTIDS.notes,scope);
return map;
}
function roleFromDataTestId(el){
const host=el?.closest?.('[data-testid]');
const tid=host?.getAttribute?.('data-testid')??'';
if(!tid) return null;
const t=tid.toLowerCase();
if (t.includes('se_headline_pro')) return 'headline_pro';
if (t.includes('se_headline')) return 'headline';
if (t.includes('se_lead_text')) return 'subline';
if (t.includes('se_location')) return 'locality';
if (t.includes('se_paragraph')) return 'body';
if (t.includes('print_et')) return 'print_et';
if (t.includes('print_filename')) return 'print_filename';
if (t.includes('notes')) return 'notes';
if (t.includes('id')) return 'id';
return null;
}
function inferActiveRole(activeEl){
if(!activeEl) return null;
const ce=activeEl.closest?.('.ql-editor[contenteditable="true"], [contenteditable="true"], input, textarea, [role="textbox"]') ?? activeEl;
const rid=roleFromDataTestId(ce);
if(rid) return rid;
const fields=getFields();
for (const role of ['headline','headline_pro','subline','locality','body','articleDescription','notes','print_et','print_filename','id']){
const el=fields[role]; if(el && (ce===el || el.contains?.(ce))) return role;
}
const around=textAround(ce);
if (includesAny(around, LABELS.headline)) return 'headline';
if (includesAny(around, LABELS.headline_pro)) return 'headline_pro';
if (includesAny(around, LABELS.subline)) return 'subline';
if (includesAny(around, LABELS.locality)) return 'locality';
if (includesAny(around, LABELS.body)) return 'body';
if (includesAny(around, LABELS.print_et)) return 'print_et';
if (includesAny(around, LABELS.print_filename)) return 'print_filename';
if (includesAny(around, LABELS.notes)) return 'notes';
if (includesAny(around, LABELS.id)) return 'id';
if (ce.matches?.('.ql-editor[contenteditable="true"]')) return 'body';
return null;
}
function normalizeLabel(txt){ return normalizeSpace((txt??'').toLowerCase()); }
const EXACT_TABS = [
{ label: 'storyline', roles: ['headline','headline_pro','subline','locality','body'] },
{ label: 'print metadaten', roles: ['print_et','print_filename'] },
{ label: 'notizen', roles: ['notes'] }
];
function cueRolesForTab(tabEl){
const raw = (tabEl?.innerText ?? tabEl?.textContent ?? '');
const t = normalizeLabel(raw);
const cfgTabs = smxGetCfgProfile('CUE')?.SUPERPORT?.tabs || null;
const map = cfgTabs?.rolesByLabel || null;
if (map && map[t] && Array.isArray(map[t])) return map[t].slice();
for (const e of EXACT_TABS) { if (t === e.label) return e.roles.slice(); }
const hints = cfgTabs?.hints || {};
const reContent = new RegExp(hints.contentTabRegex || 'storyline|story|inhalt', 'i');
const rePrint = new RegExp(hints.printTabRegex || 'print|meta|druck', 'i');
const reNotes = new RegExp(hints.notesTabRegex || 'notiz', 'i');
if (reContent.test(t)) return ['headline','headline_pro','subline','locality','body'];
if (rePrint.test(t)) return ['print_et','print_filename'];
if (reNotes.test(t)) return ['notes'];
const defRoles = Array.isArray(cfgTabs?.defaultRoles) ? cfgTabs.defaultRoles.slice()
: ['headline','headline_pro','subline','locality','body'];
return defRoles;
}
async function cueActivateTab(tabEl){
if(!tabEl) return false;
tabEl.click();
await sleep(60);
await waitFor(()=>!!deepQSA('.ql-editor[contenteditable="true"], [contenteditable="true"], textarea, input[role="textbox"], input[type="text"], input[type="search"]').some(isVisible),{timeout:2000});
return true;
}
async function cueWaitForTestIds(ids,{timeout=2500, scope=document}={}) {
const selectorList = ids.map(id=>`[data-testid="${id}"]`).join(',');
if (deepQSA(selectorList, scope).length) return true;
return await waitFor(()=>deepQSA(selectorList, scope).length>0,{timeout});
}
async function cueWaitForEditableInside(ids,{timeout=1200, scope=document}={}) {
const sel = ids.map(id=>`[data-testid="${id}"]`).join(',');
const ok = await waitFor(()=>{
const hosts=deepQSA(sel, scope);
return hosts.some(h=> !!(deepQS('.ql-editor[contenteditable="true"]',h)
|| deepQS('[contenteditable="true"]',h)
|| deepQS('textarea, input[type="text"], input[type="search"], input[type="date"], [role="textbox"]',h)) && isVisible(h));
},{timeout});
return !!ok;
}
function clickSaveIfPresent(host) {
const scopes = [];
if (host) {
scopes.push(host);
const testIdScope = host.closest?.('[data-testid]'); if (testIdScope) scopes.push(testIdScope);
const panel = host.closest?.('header, nav, section, [role="toolbar"], [role="region"], .panel, .card, .MuiPaper-root, form'); if (panel) scopes.push(panel);
}
scopes.push(document.body);
const buttonSelectors = 'button, [role="button"], .MuiButton-root, .btn, [class*="button"]';
const labelMatches = (t) => /\b(speichern|save|zwischenspeichern|save draft)\b/i.test(t);
for (const scope of scopes) {
const candidates = deepQSA(buttonSelectors, scope).filter(isVisible);
for (const btn of candidates) {
const t = (btn.innerText ?? btn.textContent ?? '').trim().toLowerCase();
if (labelMatches(t)) { btn.click(); return true; }
const aria = (btn.getAttribute?.('aria-label') ?? btn.getAttribute?.('title') ?? '').toLowerCase();
if (labelMatches(aria)) { btn.click(); return true; }
const tid = btn.getAttribute?.('data-testid') ?? '';
if (/save|speichern/i.test(tid)) { btn.click(); return true; }
}
}
return false;
}
function triggerSaveShortcut() {
const targets = [document.activeElement, document.body, document, window].filter(Boolean);
const fire = (node, ev) => { try { node.dispatchEvent(ev); } catch {} };
const mk = (type, extra = {}) => new KeyboardEvent(type, { key:'s', code:'KeyS', ctrlKey:true, metaKey:false, bubbles:true, cancelable:true, ...extra });
const mkMac = (type) => new KeyboardEvent(type, { key:'s', code:'KeyS', ctrlKey:false, metaKey:true, bubbles:true, cancelable:true });
for (const t of targets) { fire(t, mk('keydown')); fire(t, mk('keyup')); fire(t, mkMac('keydown')); fire(t, mkMac('keyup')); }
return true;
}
const targetCache = new WeakMap();
async function cueWriteIntoTestIdsVerified(ids, value, role, { attempts=3, delay=150, scope=document } = {}){


// --- ANWENDERLOGIK für BODY: STRG+V wenn aktiv, sonst "im Stück" in den ersten Body-Host ---
if (role === 'body') {
  const raw = String(value ?? '').replace(/\r\n/g, '\n');

  // 1) Ist aktuell ein Body-Editor aktiv? (Cursor steht im CUE-Body)
  const active = getActiveEditable?.() ?? document.activeElement;
  const isActiveBody = !!active && (CUE.inferActiveRole?.(active) === 'body');

  if (isActiveBody) {
    // → Wie STRG+V: Quill-aware Einfügen mit Absatz-Erhalt (Newlines → echte Absätze)
    const ok = writeWithQuillAware(active, raw, { role: 'body' });
    await sleep(delay);
    if (ok) {
      highlight(active, '#1b8d3d');
      return 1; // Body erledigt; Rest der Felder füllt der Aufrufer "wie gehabt"
    }
    // Wenn STRG+V-Pfad wider Erwarten nicht klappt, unten normal weiter
  }

  // 2) Kein aktiver Body: "im Stück" in den ersten sichtbaren Body-Host schreiben
  const bodyIds = Array.isArray(ids) && ids.length ? ids : (CUE._tabs?.TESTIDS?.body ?? ['se_paragraph_field','story-element-se_paragraph']);
  const sel = bodyIds.map(id => `[data-testid="${id}"]`).join(',');
  const hosts = deepQSA(sel, scope).filter(isVisible);

  // Ersten Editor im ersten Host nehmen
  const pickTarget = (host) =>
    deepQS('.ql-editor[contenteditable="true"]', host)
    ?? deepQS('[contenteditable="true"]', host)
    ?? deepQS('textarea, input[type="text"], input[type="search"], [role="textbox"]', host);

  const firstHost = hosts[0];
  const target = firstHost ? pickTarget(firstHost) : null;

  if (target) {
    const ok = writeWithQuillAware(target, raw, { role: 'body' });
    await sleep(delay);
    if (ok) {
      highlight(target, '#1b8d3d');
      return 1;
    }
  }
  // Fallback: nichts gefunden/geschrieben
  return 0;
}
let wrote=0;
for(const id of ids){
const hosts=deepQSA(`[data-testid="${id}"]`, scope);
for (const host of (role === 'body' ? hosts.slice(0, 1) : hosts)) {
let target = targetCache.get(host) ?? null;
if (!target) {
if (role === 'print_filename') target = cueFindPrintFilenameField(host);
if (role === 'notes' && !target) target = cueFindNotesField(host);
if (!target) target = deepQS('.ql-editor[contenteditable="true"]',host)
?? deepQS('[contenteditable="true"]',host)
?? deepQS('textarea, input[type="text"], input[type="search"], input[type="date"], [role="textbox"]',host);
if (!target && (role==='print_filename' || role==='notes')) target = cueFindEditorByRoleHeuristic(role, host);
if (target) targetCache.set(host, target);
}
if(!target) continue;
const tries = role==='notes' ? Math.max(4, attempts) : attempts;
const dly = role==='notes' ? Math.max(180, delay) : delay;
let ok=false, t=0;
while(!ok && t<tries){
t++;
try { target.focus?.(); } catch {}
writeWithQuillAware(target, value, { role });
try { target.dispatchEvent?.(new InputEvent('input',{bubbles:true})); } catch {}
try { target.dispatchEvent?.(new Event('change',{bubbles:true})); } catch {}
try { target.blur?.(); } catch {}
await sleep(dly);
const now = readGeneric(target);
ok = normalizeSpace(now) === normalizeSpace(value);
if(!ok && t<tries){ await sleep(dly); }
}
if (ok) {
highlight(target, '#1b8d3d');
try { target.focus?.(); } catch {}
try { document.body.click?.(); } catch {}
try { clickDoneIfPresent(host); } catch {}
wrote++;
}
}
}
return wrote;
}
 function cueFindEditorByRoleHeuristic(role, host) {
 const roleTerms = role === 'print_filename' ? LABELS.print_filename : role === 'notes' ? LABELS.notes : [];
 if (!roleTerms?.length) return null;
 const scope = host?.closest?.('section, [role="region"], [role="group"], .panel, .card, form') ?? document;
 const candidates = deepQSA('textarea, input, [contenteditable="true"], [role="textbox"]', scope).filter(isVisible);
 for (const el of candidates) { const around = textAround(el); if (includesAny(around, roleTerms)) return el; }
 return null;
 }
 function cueFindPrintFilenameField(host) {
 const scope = host?.closest?.('section, [role="region"], [role="group"], .panel, .card, .MuiPaper-root, .MuiCard-root, form') ?? document;
 const candidates = deepQSA('input, textarea, [role="textbox"], [contenteditable="true"]', scope).filter(isVisible);
 for (const el of candidates) {
 const around = textAround(el);
 if (/\bmanueller\s+print[-\s]?dateiname\b/i.test(around)) return el;
 const name = ((el.getAttribute?.('aria-label') ?? el.getAttribute?.('placeholder') ?? '') + ' ' + (el.id ? (document.querySelector(`label[for="${el.id}"]`)?.textContent ?? '') : '')).toLowerCase();
 if (/\bmanueller\s+print[-\s]?dateiname\b/i.test(name)) return el;
 }
 const withPrintContext = candidates.filter(el => { const p = el.closest('section, [role="region"], [role="group"], .panel, .card, form'); const txt = (p?.innerText ?? p?.textContent ?? '').toLowerCase(); return txt.includes('print'); });
 for (const el of withPrintContext) { const around = textAround(el); if (/\bdateiname\b/i.test(around)) return el; }
 return null;
 }
 function cueFindNotesField(host) {
 const scope = host?.closest?.('section, [role="region"], [role="group"], .panel, .card, .MuiPaper-root, .MuiCard-root, form') ?? document;
 const candidates = deepQSA('.ql-editor[contenteditable="true"], [contenteditable="true"], textarea, input[type="text"], [role="textbox"]', scope).filter(isVisible);
 for (const el of candidates) {
 const around = textAround(el);
 if (/\bnotiz(en)?\b/i.test(around)) return el;
 const name = ((el.getAttribute?.('aria-label') ?? el.getAttribute?.('placeholder') ?? '') + ' ' + (el.id ? (document.querySelector(`label[for="${el.id}"]`)?.textContent ?? '') : '')).toLowerCase();
 if (/\bnotiz(en)?\b/i.test(name)) return el;
 }
 const panel = scope; const panelText = (panel?.innerText ?? panel?.textContent ?? '').toLowerCase();
 if (panelText.includes('interne verwendung')) { const any = candidates[0]; if (any) return any; }
 return null;
 }

function cueGetAllTabs(){ const generic=deepQSA('[role="tab"]'); const mui=deepQSA('.MuiTab-root, [class*="Tab"][role="tab"]'); const all=new Set([...generic,...mui].filter(isVisible)); return Array.from(all); }
function detect(){ return location.hostname==='cue.funke.cue.cloud'; }
return { id:'cue', detect, getFields, inferActiveRole, read:readGeneric, write:writeGeneric,
_tabs:{ cueGetAllTabs, cueActivateTab, cueWaitForTestIds, cueWaitForEditableInside, cueWriteIntoTestIdsVerified, cueRolesForTab, cueGetTabPanel, TESTIDS, clickSaveIfPresent, triggerSaveShortcut }
};
})();

(function ensureCueTabHelpers(){
const tabs = CUE._tabs || (CUE._tabs = {});

// --- NEU: Add-Button finden (heuristisch) ---
if (!tabs.cueFindAddParagraphButton) {
  tabs.cueFindAddParagraphButton = function(scope=document){
    const candidates = deepQSA(
      'button, [role="button"], .MuiButton-root, [class*="button"], [data-testid]',
      scope
    ).filter(isVisible);

    const matches = (t) => /\b(absatz|paragraph|story[-\s]?element|text)\b.*\b(hinzufügen|add|neu|create)\b/i.test(t);

    for (const btn of candidates){
      const txt  = (btn.innerText ?? btn.textContent ?? '').trim().toLowerCase();
      const aria = (btn.getAttribute?.('aria-label') ?? btn.getAttribute?.('title') ?? '').toLowerCase();
      const tid  = (btn.getAttribute?.('data-testid') ?? '').toLowerCase();
      if (matches(txt) || matches(aria) || /add.*(story|paragraph|se_?paragraph)/i.test(tid)){
        return btn;
      }
    }
    return null;
  };
}

// --- DEBUG-EXPORTS ins Seitenfenster (Tampermonkey Sandbox -> Page Window) ---
try {
  // globales SMX-Namensraum anlegen/weiterverwenden
  unsafeWindow.SMX = unsafeWindow.SMX || {};

  // Adapter & Helfer verfügbar machen
  unsafeWindow.SMX.CUE = CUE;
  unsafeWindow.SMX.getActiveEditable = getActiveEditable;

  // optionale Kurzhelfer für die Konsole
  unsafeWindow.SMX.DEBUG = {
    role() {
      try { return CUE.inferActiveRole(getActiveEditable()); } catch(e) { return 'ERR: '+e; }
    },
    addBtn(scope=document) { try { return CUE._tabs.cueFindAddParagraphButton(scope); } catch(e){ return null; } },
    bodyHosts(n=1, scope=document) { try { return CUE._tabs.cueEnsureBodyParagraphElements(n, scope); } catch(e){ return Promise.resolve([]); } }
  };
} catch {}


// --- NEU: Dafür sorgen, dass es genug Body-Story-Elemente gibt ---
if (!tabs.cueEnsureBodyParagraphElements) {
  tabs.cueEnsureBodyParagraphElements = async function(minCount, scope=document){
    const bodyIds = CUE._tabs?.TESTIDS?.body ?? ['se_paragraph_field','story-element-se_paragraph'];
    const sel = bodyIds.map(id => `[data-testid="${id}"]`).join(',');
    let hosts = deepQSA(sel, scope).filter(isVisible);

    // Falls zu wenig vorhanden, Add-Button klicken bis genug Editoren sichtbar sind
    while (hosts.length < minCount){
      const addBtn = tabs.cueFindAddParagraphButton(scope);
      if (!addBtn) break;
      addBtn.click();
      // auf neuen Editor warten
      await tabs.cueWaitForEditableInside(bodyIds, {timeout: 2500, scope});
      await sleep(120);
      hosts = deepQSA(sel, scope).filter(isVisible);
    }
    return hosts;
  };
}
if (!tabs.cueRolesForTab) {
tabs.cueRolesForTab = function(tabEl){
try {
const cfg = (window.SMX_CFG?.profiles?.CUE?.SUPERPORT?.tabs) || {};
const by = cfg.rolesByLabel || {};
const txt = ((tabEl?.innerText || tabEl?.textContent || '') + ' ' + (tabEl?.getAttribute?.('aria-label') || '')).toLowerCase();
for (const [label, roles] of Object.entries(by)) {
if (txt.includes(label.toLowerCase())) return roles || [];
}
const h = cfg.hints || {};
if (new RegExp(h.contentTabRegex || 'story|inhalt', 'i').test(txt)) return cfg.defaultRoles || ['headline','headline_pro','subline','locality','body'];
if (new RegExp(h.notesTabRegex || 'notiz', 'i').test(txt)) return ['notes'];
if (new RegExp(h.printTabRegex || 'print|meta', 'i').test(txt)) return ['print_et','print_filename','id'];
} catch {}
return ['headline','headline_pro','subline','locality','body'];
};
}
if (!tabs.cueWaitForTestIds) {
tabs.cueWaitForTestIds = async function(testIds, {timeout=3000, poll=80, scope=document} = {}){
const start = performance.now();
while (performance.now() - start < timeout) {
const any = (testIds||[]).some(id => !!deepQSA(`[data-testid="${id}"]`, scope).length);
if (any) return true;
await sleep(poll);
}
return false;
};
}
if (!tabs.cueWaitForEditableInside) {
tabs.cueWaitForEditableInside = async function(testIds, {timeout=1500, poll=80, scope=document} = {}){
const start = performance.now();
while (performance.now() - start < timeout) {
let ok = false;
for (const id of (testIds||[])) {
const hosts = deepQSA(`[data-testid="${id}"]`, scope);
for (const host of hosts) {
const ed = deepQS('.ql-editor[contenteditable="true"]',host)
|| deepQS('[contenteditable="true"]',host)
|| deepQS('textarea, input[type="text"], input[type="search"], [role="textbox"]',host);
if (ed && isVisible(ed)) { ok = true; break; }
}
if (ok) break;
}
if (ok) return true;
await sleep(poll);
}
return false;
};
}
})();

//// KAPITEL 3.4 // CONTAO-ADAPTER ///////////////////////////////////////////////////////////////////////
// Placeholder für zukünftige Integration

//// KAPITEL 3.5 // Adapter-Auswahl //////////////////////////////////////////////////////////////////////
const ADAPTERS=[PPS,CUE];
function currentAdapter(){
for(const a of ADAPTERS){ try{ if(a.detect()) return a; }catch{} }
return PPS;
}
function getActiveEditable(){ try{ const sel=window.getSelection?.(); const n=sel?.anchorNode; const el=(n&&n.nodeType===1)?n:(n?.parentElement); return el?.closest?.('.ql-editor[contenteditable="true"], [contenteditable="true"], textarea, input[type="text"], [role="textbox"]') || document.activeElement; }catch{ return document.activeElement; } }

//// KAPITEL 4 //// ENGINES & HELPERS ////////////////////////////////////////////////////////////////////
//// KAPITEL 4.1 // Hotkeys //////////////////////////////////////////////////////////////////////////////
const DEFAULT_HOTKEYS = {
PPS: {
'Ctrl+S':'SuperMAX.oneClick',
'Ctrl+Alt+S':'SuperSHIRT.run',
'Ctrl+Alt+B':'SuperBRIDGE.run',
'Ctrl+Alt+Shift+P':'SuperPORT.fillAll',
'Ctrl+Alt+P':'SuperPORT.probe',
'Ctrl+Alt+L':'SuperLINK.run',
'Ctrl+Shift+L':'SuperLINK.run',
'Ctrl+Shift+Alt+L':'SuperLINK.run',
'Ctrl+E':'SuperERASER.run',
'Ctrl+Alt+R':'SuperRED.run'
},
CUE: {
'Ctrl+S':'SuperMAX.oneClick',
'Ctrl+Alt+S':'SuperSHIRT.run',
'Ctrl+Alt+B':'SuperBRIDGE.run',
'Ctrl+Alt+Shift+P':'SuperPORT.fillAll',
'Ctrl+Alt+P':'SuperPORT.probe',
'Ctrl+Alt+L':'SuperLINK.run',
'Ctrl+Shift+L':'SuperLINK.run',
'Ctrl+Shift+Alt+L':'SuperLINK.run',
'Ctrl+E':'SuperERASER.run',
'Ctrl+Alt+R':'SuperRED.run'
}
};
function smxKeyCombo(e) {
const parts = [];
if (e.ctrlKey) parts.push('Ctrl');
if (e.altKey) parts.push('Alt');
if (e.shiftKey) parts.push('Shift');
parts.push(String(e.key || '').toUpperCase());
return parts.join('+');
}
function smxRouteHotkey(e) {
const a = currentAdapter(); const siteId = (a?.id || 'PPS').toUpperCase();
const map = smxGetCfgProfile(siteId)?.HOTKEYS || DEFAULT_HOTKEYS[siteId] || DEFAULT_HOTKEYS.PPS;
const combo = smxKeyCombo(e);
const action = map?.[combo];
if (!action) return false;
e.preventDefault();
const [mod, fn] = action.split('.');
const m = MODULES[mod];
if (m && typeof m[fn] === 'function') { m[fn](); return true; }
smxToast(`Aktion nicht gefunden: ${action}`, false);
return false;
try { console.log('[SMX][Hotkey]', { siteId, combo, action }); } catch {}
if (!action) return false;
}
window.addEventListener('keydown', (e) => {
if (smxRouteHotkey(e)) return;

const k = e.key?.toLowerCase?.() ?? '';
if (e.ctrlKey && e.altKey && !e.shiftKey && k === 'b') { e.preventDefault(); superBridgeAction(); return; }
if (e.ctrlKey && e.altKey && e.shiftKey && k === 'p') { e.preventDefault(); fillAllEverywhere(); return; }
if (e.ctrlKey && e.altKey && !e.shiftKey && k === '0') { e.preventDefault(); setRoleProfile(null); return; }
if (e.ctrlKey && e.altKey && !e.shiftKey && k === 'p') {
e.preventDefault();
try {
const adapter=currentAdapter();
const active=getActiveEditable();
const role=adapter.inferActiveRole?.(active);
if(!role){ smxToast('Feld nicht erkannt – bitte DOM/Labels prüfen.', false); return; }
const label=ROLE_TO_DE[role]??role;
let target=active;
if((role==='articleDescription'||role==='notes')){ const fixed=adapter.getFields?.()[role]; if(fixed) target=fixed; }
highlight(target);
const ok=adapter.write?.(target, SNIPPETS?.[role] ?? label);
smxToast(ok?`→ ${label} geschrieben`:'Schreiben fehlgeschlagen', !!ok);
}catch(err){ console.warn('[SuperMAX v5][Prüfer] Fehler:', err); smxToast('Fehler (Konsole prüfen).', false); }
}
}, true);

//// KAPITEL 4.2 // Module-Profile/Persistenz ////////////////////////////////////////////////////////////
const ROLE_PROFILES = {
SuperLINK:{ read:['body'], write:['body'] },
SuperERASER:{ read:['body'], write:['body'] },
SuperMAX_Regex:{ read:['headline','headline_pro','subline','locality','body','caption','credit'],
write:['headline','headline_pro','subline','locality','body','caption','credit'] },
SuperRED:{ read:['headline','headline_pro','subline','locality','body','caption','credit','print_et','id'],
write:['locality','print_filename','articleDescription','notes','print_et'] },
SuperBRIDGE:{ read:['headline','subline','body','caption','credit','locality'],
write:['headline','subline','locality','body'] },
SuperSHIRT:{ read:['headline','subline','body'], write:['headline','subline','body'] },
articleRESIZER:{ read:['headline','subline','body','body_output'], write:['body','body_input'] }
};
let ACTIVE_PROFILE = null;
try { ACTIVE_PROFILE = GM_getValue('supermax_active_profile', null); } catch {}
function setRoleProfile(name){
ACTIVE_PROFILE = name ?? null;
try { GM_setValue('supermax_active_profile', ACTIVE_PROFILE); } catch {}
smxToast(ACTIVE_PROFILE?`Profil: ${ACTIVE_PROFILE}`:'Profil: alle Rollen');
}
function getRoleProfile(){ return ACTIVE_PROFILE; }
function filterByProfile(targets, mode){
if(!ACTIVE_PROFILE) return targets;
const prof = ROLE_PROFILES[ACTIVE_PROFILE]; if(!prof) return targets;
const allowed = new Set((prof[mode]??[]).map(r=>String(r).toLowerCase()));
return targets.filter(t=>allowed.has(String(t.role).toLowerCase()));
}
try {
GM_registerMenuCommand('SuperPORT+ – Rundgang starten', () => {
try { fillAllEverywhere(); } catch (e) { console.warn('SuperPORT+ Fehler:', e); smxToast('SuperPORT+: Fehler (Konsole).', false); }
});
GM_registerMenuCommand('SuperBRIDGE – jetzt ausführen', () => {
try { superBridgeAction(); } catch (e) { console.warn('SuperBRIDGE Fehler:', e); smxToast('SuperBRIDGE: Fehler (Konsole).', false); }
});
GM_registerMenuCommand('SuperRED – jetzt ausführen', () => {
try { superREDRun(); } catch (e) { console.warn('SuperRED Fehler:', e); smxToast('SuperRED: Fehler (Konsole).', false); }
});
GM_registerMenuCommand('SuperNOTES – jetzt ausführen', () => {
  try { superNOTESRun(); } catch (e) { console.warn('SuperNOTES Fehler:', e); smxToast('SuperNOTES: Fehler (Konsole).', false); }
});
} catch {}

//// KAPITEL 4.3 // RegEx-Engine /////////////////////////////////////////////////////////////////////////
// Regeln kompilieren (aus CFG_DEFAULTS.REGEX.{base,hashtag})
function smxCompileRules(ruleList){
  const out = [];
  try{
    for(const r of (ruleList ?? [])){
      const pat = String(r?.pattern ?? '');
      const flags = String(r?.flags ?? 'g');
      const repl = (r?.replacement ?? '');
      if(!pat) continue;
      try{
        const re = new RegExp(pat, flags);
        out.push({ re, replacement: repl });
      }catch{ /* invalid pattern – skip */ }
    }
  }catch{}
  return out;
}

// Regeln anwenden (sequentiell)
function smxApplyRulesToText(txt, rules){
  let out = String(txt ?? '');
  for(const {re, replacement} of (rules ?? [])){
    try { out = out.replace(re, replacement); } catch {}
  }
  return out;
}

// — v4-kompatible Helfer mit $(1)-Support (ANFANG) —
// Wandelt [{re, replacement}] in [[RegExp, replacementString]] um
function smxRulesToPairs(rules){
try { return (rules || []).map(r => [r.re, String(r.replacement ?? '')]); }
catch { return []; }
}

// Ersetzt in Strings mit $(1)-Gruppen (wie v4)
function smxApplyReplacements(text, rulesPairs) {
let out = String(text ?? '');
for (const [pattern, replacement] of (rulesPairs || [])) {
try {
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
} catch {}
}
return out;
}

// Textknoten-weise Ersetzung (bewahrt Struktur/MARKUP wie v4)
function smxReplaceTextNodesWithRules(el, rulesPairs){
if (!el) return false;
let changed = false;
try {
const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
let n;
while ((n = w.nextNode())) {
const orig = n.nodeValue;
const rep = smxApplyReplacements(orig, rulesPairs);
if (rep !== orig) {
n.nodeValue = rep; // nur Textinhalt ändern → Struktur bleibt
changed = true;
}
}
} catch {}
return changed;
}

// Vorschau/Aktualisierung anstoßen (wie v4)
function smxForcePreviewRefresh(pm){
try{
if(!pm) return;
pm.blur();
pm.dispatchEvent(new Event('blur',{bubbles:true}));
setTimeout(()=>{
pm.focus();
pm.dispatchEvent(new InputEvent('input',{bubbles:true}));
pm.dispatchEvent(new Event('change',{bubbles:true}));
}, 15);
}catch{}
}

// Contenteditable-sichere Anwendung (Quill/ProseMirror)
function smxReactSafeReplaceInCE(el, rulesPairs){
if (!el) return false;
let target = el;
if (!target.isContentEditable) {
const inner = el.querySelector?.('[contenteditable="true"]');
if (inner) target = inner;
}
if (!target || !target.isContentEditable) return false;

const changed = smxReplaceTextNodesWithRules(target, rulesPairs);

if (changed) {
try { target.dispatchEvent(new InputEvent('input', {bubbles:true})); } catch {}
try { target.dispatchEvent(new Event('change', {bubbles:true})); } catch {}
smxForcePreviewRefresh(target);
}
return changed;
}
// — v4-kompatible Helfer mit $(1)-Support (ENDE) —

// Auf alle erkannten Editoren/Felder anwenden (profilgesteuert)
async function smxApplyRegexToTargets(mode='both'){
try{
setRoleProfile('SuperMAX_Regex'); // nutzt ROLE_PROFILES.SuperMAX_Regex
}catch{}

const cfgR = (CFG_DEFAULTS?.REGEX ?? {});
const rulesBase = smxCompileRules(cfgR.base);
const rulesHash = smxCompileRules(cfgR.hashtag);

// Für CE-Pfad benötigen wir [RegExp, replacementString]-Paare (v4-Format)
const basePairs = smxRulesToPairs(rulesBase);
const hashPairs = smxRulesToPairs(rulesHash);

// Ziele sammeln und nach Profil filtern
let targets = collectAllTargets().filter(t => isVisible(t.el));
targets = filterByProfile(targets, 'write');

let changed = 0;

for (const t of targets) {
const el = t.el;
const isCE = !!(el?.isContentEditable || el?.querySelector?.('[contenteditable="true"]'));

if (isCE) {
// Contenteditable: node-weise ersetzen (Format erhalten)
let did = false;
if (mode === 'both' || mode === 'baseOnly') {
did = smxReactSafeReplaceInCE(el, basePairs) || did;
}
if (mode === 'both' || mode === 'hashtagOnly') {
did = smxReactSafeReplaceInCE(el, hashPairs) || did;
}
if (did) { highlight(el, '#1b8d3d'); changed++; }
} else {
// Inputs/Textareas: String-Replacement mit $(1)-Support
const before = readGeneric(el);
let mid = before;
if (mode === 'both' || mode === 'baseOnly') {
mid = smxApplyReplacements(mid, basePairs);
}
const after = (mode === 'both' || mode === 'hashtagOnly') ? smxApplyReplacements(mid, hashPairs) : mid;

if (after !== before) {
if (writeGeneric(el, after)) {
highlight(el, '#1b8d3d'); changed++;
}
}
}
}
return changed;
}

//// KAPITEL 5 //// MODULE ///////////////////////////////////////////////////////////////////////////////
//// KAPITEL 5.1 // SuperPORT ////////////////////////////////////////////////////////////////////////////
const SNIPPETS = {
headline_pro:'Überschrift 2 – Platzhalter',
headline:'Überschrift 1 – Platzhalter',
subline:'Unterzeile – Platzhalter',
locality:'Ortsmarke – Platzhalter',
body:'Fließtext – Platzhalter',
caption:'Bildunterschrift – Platzhalter',
credit:'Bildautor – Platzhalter',
articleDescription:'Artikelbeschreibung – Platzhalter',
notes:'Notizen – Platzhalter',
print_et:'31.12.2025',
print_filename:'Dateiname – Platzhalter',
id:'ID – Platzhalter'
};

function collectAllTargets(){
const adapter=currentAdapter();

try { setRoleProfile(null); } catch {}
smxToast(`Profil: ${getRoleProfile() ?? 'alle Rollen'}`);

if(adapter.id==='cue'){
const out=[];
const TESTIDS=CUE._tabs.TESTIDS;
const findAllByTestIds=(ids)=>{
const list=[];
for(const id of ids){
const nodes=deepQSA(`[data-testid="${id}"]`);
for(const host of nodes){
const ed=(()=>{ const q=deepQS('.ql-editor[contenteditable="true"]',host); if(q&&isVisible(q)) return q;
const ce=deepQS('[contenteditable="true"]',host); if(ce&&isVisible(ce)) return ce;
const io=deepQS('textarea, input[type="text"], input[type="search"], [role="textbox"]',host); if(io&&isVisible(io)) return io;
return null; })();
if(ed) list.push(ed);
}
}
return list;
};
for(const [role,ids] of Object.entries(TESTIDS)){
const editors=findAllByTestIds(ids);
for(const el of editors) out.push({role,el});
}
deepQSA('.ql-editor[contenteditable="true"]').forEach(el=>{ out.push({role:'body', el}); });
const uniq=(arr,keyFn)=>{ const m=new Map(); for(const x of arr){ const k=keyFn(x); if(!m.has(k)) m.set(k,x);} return Array.from(m.values()); };
return uniq(out.filter(x=>isVisible(x.el)), x=>x.el);
}
const ppsCollectAllEditors=(PPSAdapter)=>{
const out=[];
const fixed=PPSAdapter.getFields?.()??{};
for(const [role,el] of Object.entries(fixed)){ if(el) out.push({role,el}); }
const pms=deepQSA('.ProseMirror[contenteditable="true"]').filter(isVisible);
for(const pm of pms){
const role=( (()=>{ const host=pm.closest('li.jsModuleItem.moduleFormListItem.moduleFormItemSelect,[data-label]');
const dataLabel=host?.getAttribute?.('data-label')?.toLowerCase()??'';
if(dataLabel==='headline') return 'headline';
if(dataLabel==='subheadline') return 'subline';
if(dataLabel==='text') return 'body';
if(/subtitle|caption/.test(dataLabel) || /image\d+_subtitle/.test(dataLabel)) return 'caption';
if(/author|credit/.test(dataLabel) || /image\d+_author/.test(dataLabel)) return 'credit';
return null;
})() || PPSAdapter.inferActiveRole?.(pm) || 'body');
out.push({role, el: pm});
}
const uniq=(arr,keyFn)=>{ const m=new Map(); for(const x of arr){ const k=keyFn(x); if(!m.has(k)) m.set(k,x);} return Array.from(m.values()); };
return uniq(out,x=>x.el);
};
return ppsCollectAllEditors(PPS);
}
let DEBUG=true;
function dbg(...args){ if(DEBUG) console.log('[SuperMAX]', ...args); }
async function fillAllEverywhere(){
const adapter=currentAdapter();
try{
smxToast(`Profil: ${getRoleProfile()??'alle Rollen'}`);
if(adapter.id==='cue'){
const tabs=CUE._tabs.cueGetAllTabs();
const filled=new WeakSet(); let okCount=0,total=0;
if(!tabs.length){
let targets=collectAllTargets(); targets=filterByProfile(targets,'write');
for(const t of targets){ total++; if(!filled.has(t.el)&&writeOneTarget(t)){ filled.add(t.el); okCount++; } }
smxToast(`${okCount}/${total} Felder gefüllt`); return;
}
for(const tab of tabs){
await CUE._tabs.cueActivateTab(tab);
const expectedRoles=CUE._tabs.cueRolesForTab(tab);
const panelScope = CUE._tabs.cueGetTabPanel(tab) ?? document;
const needTestIds = expectedRoles.map(r=>CUE._tabs.TESTIDS[r]).filter(Boolean).flat();
if(needTestIds.length){
try{
await CUE._tabs.cueWaitForTestIds(needTestIds,{timeout:3000, scope:panelScope});
await CUE._tabs.cueWaitForEditableInside(needTestIds,{timeout:1200, scope:panelScope});
if (expectedRoles.includes('notes')) { await sleep(120); }
}catch{}
}
for(const role of expectedRoles){
const ids=CUE._tabs.TESTIDS[role]; if(!ids) continue;
const value=SNIPPETS?.[role] ?? ROLE_TO_DE?.[role] ?? `[${role}]`;
try{
const tries = (role === 'notes') ? 4 : 3;
const dly = (role === 'notes') ? 180 : 150;
const wrote = await CUE._tabs.cueWriteIntoTestIdsVerified(ids, value, role, {attempts:tries, delay:dly, scope:panelScope});
total+=wrote; okCount+=wrote;
}catch(e){ console.warn('[SuperMAX][CUE][write]', role, e); }
}
await sleep(50);
}
smxToast(`${okCount}/${total} Felder gefüllt`); return;
}
if(adapter.id==='pps'){
const items=ppsGetNavItems();
const filled=new WeakSet(); let okCount=0,total=0;
if(!items.length){
let targets=collectAllTargets().filter(t=>isVisible(t.el)); targets=filterByProfile(targets,'write');
for(const t of targets){ total++; if(!filled.has(t.el)&&writeOneTarget(t)){ filled.add(t.el); okCount++; } }
smxToast(`${okCount}/${total} Felder gefüllt`); return;

}
for(const it of items){
await ppsActivateNavItem(it);
let targets=collectAllTargets().filter(t=>isVisible(t.el)); targets=filterByProfile(targets,'write');
for(const t of targets){ total++; if(!filled.has(t.el)&&writeOneTarget(t)){ filled.add(t.el); okCount++; } }
}
smxToast(`${okCount}/${total} Felder (PPS-Feldnavigation) gefüllt`); return;
}
let targets=collectAllTargets().filter(t=>isVisible(t.el)); targets=filterByProfile(targets,'write');
let ok=0; for(const t of targets) if(writeOneTarget(t)) ok++;
smxToast(`${ok}/${targets.length} Felder im aktiven Bereich gefüllt`);
}catch(err){ console.warn('[SuperMAX][FillAllEverywhere] Fehler:', err); smxToast('Fehler (Konsole prüfen).', false); }
}
function writeOneTarget({ role, el }){ const txt = (SNIPPETS?.[role] ?? ROLE_TO_DE?.[role] ?? `[${role}]`); highlight(el, '#1b8d3d'); return writeWithQuillAware(el, txt); }

// Module-Registry
const MODULES = {
SuperPORT: {
fillAll: () => fillAllEverywhere(),
probe: () => {
try {
const adapter = currentAdapter();
const active = getActiveEditable();
const role = adapter.inferActiveRole?.(active);
if (!role) { smxToast('Feld nicht erkannt – bitte DOM/Labels prüfen.', false); return; }
const label = ROLE_TO_DE[role] ?? role;
let target = active;
if ((role === 'articleDescription' || role === 'notes')) {
const fixed = adapter.getFields?.()[role];
if (fixed) target = fixed;
}
highlight(target);
const ok = adapter.write?.(target, SNIPPETS?.[role] ?? label);
smxToast(ok?`→ ${label} geschrieben`:'Schreiben fehlgeschlagen', !!ok);
} catch (err) {
console.warn('[SuperMAX][Probe] Fehler:', err);
smxToast('Fehler (Konsole prüfen).', false);
}
}
},
SuperBRIDGE: { run: () => superBridgeAction() },
SuperLINK: { run: () => superLinkShortenSelectedUrl() },
SuperERASER: { run: () => superEraserOnSelection() },
SuperRED: { run: () => superREDRun() },
SuperNOTES: { run: () => superNOTESRun() },
SuperMAX:    { oneClick: () => superMAX_OneClick() },
SuperSHIRT:  { run: () => smxToast('SuperSHIRT: kommt als Nächstes (STRG+ALT+S).') }
};

//// KAPITEL 5.2 // SuperBRIDGE //////////////////////////////////////////////////////////////////////////
function cueApplyBridgeData(data){
  const fields = CUE.getFields?.() ?? {};
  const locality = pickLocality({ subline: data.subline, body: data.body });
  let sublineOut = stripLeadingOrtmarke(String(data.subline ?? ''), locality);
  let bodyOut    = stripLeadingOrtmarke(String(data.body ?? ''), locality);

  if (data.pairs?.length) {
    const tail = data.pairs
      .map(p => [p.caption, p.credit].filter(Boolean).join(' — '))
      .filter(Boolean)
      .join('\n');
    if (tail) bodyOut = bodyOut ? (bodyOut + '\n\n' + tail) : tail;
  }

  const plan = [
    {role:'headline', el:fields.headline, val:data.headline ?? ''},
    {role:'subline',  el:fields.subline,  val:sublineOut},
    {role:'locality', el:fields.locality, val:locality},
    {role:'body',     el:fields.body,     val:bodyOut}
  ].filter(p => p.el && typeof p.val === 'string');

  const filtered = filterByProfile(plan.map(p => ({role:p.role, el:p.el, val:p.val})), 'write');
  let ok = 0;
  for (const p of filtered) {
    if (writeWithQuillAware(p.el, p.val)) {
      highlight(p.el, '#b06ac2');
      ok++;
    }
  }
  return ok;
}
async function superBridgeAction(){
const PAYLOAD_KEY = 'superbridge_payload_v1' + (SMX_DEV_MODE ? '_dev' : '');
const adapter = currentAdapter();
if(adapter.id==='pps'){
setRoleProfile('SuperBRIDGE');
const data = await ppsCollectBridgeDataAll();
const payload = { from:'pps', at:Date.now(), data };
try { GM_setValue(PAYLOAD_KEY, payload); } catch {}
const locality = pickLocality({ subline: data.subline, body: data.body });
const sublineOut = stripLeadingOrtmarke(String(data.subline ?? ''), locality);
let bodyOut = stripLeadingOrtmarke(String(data.body ?? ''), locality);
if (data.pairs?.length) {
const tail = data.pairs.map(p => [p.caption, p.credit].filter(Boolean).join(' — ')).filter(Boolean).join('\n');
if (tail) bodyOut = bodyOut ? (bodyOut + '\n\n' + tail) : tail;
}
const parts = [];
if (data.headline) parts.push(data.headline);
parts.push('');
if (sublineOut) { parts.push(sublineOut); parts.push(''); }
if (locality) { parts.push(locality); parts.push(''); }
if (bodyOut) parts.push(bodyOut);
const out = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
try { GM_setClipboard(normalizePreserveNewlines(out), {type:'text', mimetype:'text/plain'}); } catch {}
setTimeout(()=>{ try { GM_setClipboard('', {type:'text', mimetype:'text/plain'}); } catch {} }, 20000);
smxToast('SuperBRIDGE: Inhalte aus PPS gespeichert. Wechsel zu CUE und drücke STRG+ALT+B zum Einfügen.');
return;
}
// >>> In superBridgeAction den kompletten if(adapter.id==='cue'){...} Block durch Folgendes ersetzen
if (adapter.id === 'cue') {
let payload = null; try { payload = GM_getValue(PAYLOAD_KEY, null); } catch {}
if (!payload || payload.from !== 'pps') { smxToast('SuperBRIDGE: Keine PPS-Daten gefunden.', false); return; }
if (!payload) { console.warn('SuperBRIDGE: Payload leer'); }

const flowCfg = smxGetCfgProfile('PPS')?.SUPERBRIDGE?.flows?.[0] || null;
const tabHint = (flowCfg?.tabLabelHint || 'story').toLowerCase();

const tabs = CUE._tabs.cueGetAllTabs();
const storyTab = tabs.find(t => ((t.innerText ?? t.textContent ?? '').toLowerCase().includes(tabHint))) ?? tabs[0];
if (storyTab) await CUE._tabs.cueActivateTab(storyTab);

setRoleProfile('SuperBRIDGE');
const ok = cueApplyBridgeData(payload.data ?? {});
smxToast(`SuperBRIDGE: ${ok} Feld(er) in CUE befüllt.`);
return;
} smxToast('SuperBRIDGE aktuell nur PPS → CUE implementiert.', false);
}

//// KAPITEL 5.3 // SuperSHIRT ///////////////////////////////////////////////////////////////////////////
//// (Platzhalter - Modul)

//// KAPITEL 5.4 // SuperCLIPP ///////////////////////////////////////////////////////////////////////////
//// (Platzhalter)


//// KAPITEL 5.5 // SuperLINK ////////////////////////////////////////////////////////////////////////////
async function superLinkShortenSelectedUrl() {
  try {
    const selInfo = await smxCaptureSelectionText();
    const raw = (selInfo.text || '').trim();

    // URL-Kandidat robust erkennen: http(s)://... ODER www....
    function extractUrlCandidate(s) {
      const m = String(s).match(/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/i);
      return m ? m[0] : '';
    }

    const urlCandidate = extractUrlCandidate(raw);
    if (!urlCandidate) { smxToast('SuperLINK: Bitte genau die URL markieren.', false); return false; }

    // Schema ergänzen, falls nur www...
    let url = urlCandidate;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    // Satzzeichen/überzählige Klammern am Ende abwerfen
    url = url.replace(/[\)\],.;:]+$/, '').trim();
    try {
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      for (let k = closes - opens; k > 0; k--) url = url.replace(/\)+$/, '');
    } catch {}

    // Plausibilitätscheck
    try { new URL(url); } catch { smxToast('SuperLINK: Ungültige URL.', false); return false; }

    // Token holen
    const YOURLS_TOKEN_KEY = 'yourlsToken';
    let token = ''; try { token = GM_getValue(YOURLS_TOKEN_KEY, ''); } catch {}
    if (!token) { smxToast('SuperLINK: Kein YOURLS‑Token gesetzt (Menü > SuperLINK – Token-Setting).', false); return false; }

    // Dry-Run?
    if (typeof SMX_DRY_RUN !== 'undefined' && SMX_DRY_RUN) {
      smxToast('SuperLINK (Dry-Run): würde URL kürzen – keine Änderungen geschrieben.');
      return true;
    }

    const api = 'https://bwurl.de/yourls-api.php?action=shorturl&format=simple'
      + '&signature=' + encodeURIComponent(token)
      + '&url=' + encodeURIComponent(url);

    // ENTSCHEIDEND: Promise, das ERST NACH onload/onerror resolved → OneClick wartet zuverlässig
    return await new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: api,
        onload: (resp) => {
          const shortUrl = (resp.responseText || '').trim();
          if (!/^https?:\/\/\S+$/i.test(shortUrl)) {
            smxToast('SuperLINK: Unerwartete YOURLS-Antwort.', false);
            return resolve(false);
          }

          // Auswahl exakt ersetzen (Quill bevorzugt)
          const resolved = smxResolveQuillRange(selInfo);
          if (resolved.quill) {
            try {
              const q = resolved.quill;
              let i = resolved.index, len = resolved.length;

              if (!(i >= 0)) {
                const rng = q.getSelection?.(true) || q.getSelection?.();
                if (rng) { i = rng.index; len = rng.length; }
              }
              if (!(i >= 0)) {
                smxToast('SuperLINK: Auswahl nicht erkannt (CUE). Bitte erneut markieren.', false);
                return resolve(false);
              }
              if (len > 0) q.deleteText(i, len, 'user');
              q.insertText(i, shortUrl, 'user');

              // (Optional) Cursor auf die ShortURL setzen – ergonomischer für den nächsten Schritt
              try { q.setSelection(i, shortUrl.length, 'silent'); } catch {}

              // leichte Editor-Events feuern
              try {
                const target = q.root || document.activeElement;
                target?.dispatchEvent?.(new InputEvent('input', { bubbles: true }));
                target?.dispatchEvent?.(new Event('change', { bubbles: true }));
              } catch {}

              smxToast('SuperLINK: ShortURL eingefügt.');
              return resolve(true);
            } catch {
              // Fällt auf Browser-Fallbacks zurück
            }
          }

          // Browser-Fallbacks
          try {
            if (document.execCommand) {
              document.execCommand('insertText', false, shortUrl);
              smxToast('SuperLINK: ShortURL eingefügt.');
              return resolve(true);
            }
          } catch {}

          const ok = smxReplaceSelectionWith(shortUrl, selInfo);
          if (!ok) {
            smxToast('SuperLINK: Ersetzen fehlgeschlagen.', false);
            return resolve(false);
          }
          smxToast('SuperLINK: ShortURL eingefügt.');
          resolve(true);
        },
        onerror: () => { smxToast('SuperLINK: Verbindungs-/API-Fehler.', false); resolve(false); }
      });
    });
  } catch (err) {
    try { console.warn('[SuperLINK] Fehler:', err); } catch {}
    smxToast('SuperLINK: Fehler (Konsole prüfen).', false);
    return false;
  }
}

//// KAPITEL 5.6 // SuperERASER //////////////////////////////////////////////////////////////////////////
async function superEraserOnSelection(){
try {
const selInfo = await smxCaptureSelectionText();
const raw = (selInfo.text || '').trim();
if (!raw) { smxToast('SuperERASER: Bitte Text markieren (ggf. vorher STRG+C).', false); return false; }
const cleaned = smxCleanTextForEraser(raw);
if (typeof SMX_DRY_RUN !== 'undefined' && SMX_DRY_RUN) {
smxToast('SuperERASER (Dry-Run): würde Auswahl bereinigen/Format entfernen – keine Änderungen geschrieben.');
return true;
}
if (cleaned === raw) {
const resolved = smxResolveQuillRange(selInfo);
if (resolved.quill) {
const q = resolved.quill;
let i = resolved.index, len = resolved.length;
if (!(i >= 0 && len > 0)) {
const rng = q.getSelection?.(true) || q.getSelection?.();
if (rng && rng.length > 0) { i = rng.index; len = rng.length; }
}
if (i >= 0 && len > 0) {
try {
q.removeFormat(i, len, 'user');
try {
q.formatLine(i, Math.max(len, 1), {
header:false, list:false, blockquote:false, 'code-block':false,
align:false, indent:false, direction:false
});
} catch {}
try {
const root = q.root || document.activeElement;
root?.dispatchEvent?.(new InputEvent('input', { bubbles:true }));
root?.dispatchEvent?.(new Event('change', { bubbles:true }));
} catch {}
smxToast('SuperERASER: Formatierung entfernt.');
return true;
} catch {}
}
smxToast('SuperERASER: Auswahl nicht erkannt (CUE). Bitte erneut markieren.', false);
return false;
}
const okFmt = smxReplaceSelectionWith(raw, selInfo);
if (okFmt) { smxToast('SuperERASER: Formatierung entfernt.'); return true; }
smxToast('SuperERASER: Nichts zu bereinigen.');
return true;
}
const ok = smxReplaceSelectionWith(cleaned, selInfo);
if (!ok) { smxToast('SuperERASER: Ersetzen fehlgeschlagen.', false); return false; }
try {
const { root } = smxGetActiveQuill();
const target = root || document.activeElement;
target?.dispatchEvent?.(new InputEvent('input', { bubbles:true }));
target?.dispatchEvent?.(new Event('change', { bubbles:true }));
} catch {}
smxToast('SuperERASER: Auswahl bereinigt.');
return true;
} catch (err) {
console.warn('[SuperERASER] Fehler:', err);
smxToast('SuperERASER: Fehler (Konsole prüfen).', false);
return false;
}
}

//// KAPITEL 5.7 // SuperRED /////////////////////////////////////////////////////////////////////////////
// v5-Implementierung: nutzt Multi-Site-Adapter, CFG.SUPERRED & gemeinsame Helfer

async function superREDRun(){
  try{
    const adapter = currentAdapter();                          // PPS oder CUE
    setRoleProfile('SuperRED');                                // nur relevante Rollen (siehe ROLE_PROFILES)

    // --- 1) Werte sammeln (headline, subline, body, locality, captions/credits, evtl. bestehende Nummer etc.) ---
    let values = { headline:'', subline:'', body:'', locality:'Berlin' };
    let captions = [];

    if(adapter.id === 'pps'){
      // robuster Sammler über Feldnavigation
      const data = await ppsCollectBridgeDataAll();
      values.headline = data.headline ?? '';
      values.subline  = data.subline  ?? '';
      values.body     = data.body     ?? '';
      values.locality = pickLocality({ subline: values.subline, body: values.body });
      captions = (data.pairs ?? []).map(p => [p.caption, p.credit].filter(Boolean).join(' — ')).filter(Boolean);
    }else{
      // CUE – direkte Feldablesung via TESTIDs
      const fields = CUE.getFields?.() ?? {};
      values.headline = readGeneric(fields.headline);
      values.headline_pro = readGeneric(fields.headline_pro);
      values.subline  = readGeneric(fields.subline);

      // Body in CUE kann aus mehreren Absätzen bestehen -> alles zusammensammeln
      values.body = cueReadAllBodyParagraphsText(document);
      // Fallback: wenn aus irgendeinem Grund nichts gesammelt wurde

      const existingLoc = readGeneric(fields.locality);
      values.locality = smxDeriveLocalityForSuperRED_CUE({
        existing: existingLoc,
        body: values.body,
        subline: values.subline,
        headline: values.headline,
        headline_pro: values.headline_pro
      });

      // optional Caption/Credit einlesen (falls vorhanden)
      const capIds = CUE._tabs.TESTIDS?.caption ?? [];
      const creIds = CUE._tabs.TESTIDS?.credit  ?? [];
      const caps   = capIds.flatMap(id => deepQSA(`[data-testid="${id}"]`).map(h => readGeneric(deepQS('.ql-editor[contenteditable="true"],[contenteditable="true"],textarea,input', h)))).filter(Boolean);
      const creds  = creIds.flatMap(id => deepQSA(`[data-testid="${id}"]`).map(h => readGeneric(deepQS('.ql-editor[contenteditable="true"],[contenteditable="true"],textarea,input', h)))).filter(Boolean);
      // simple Paarbildung
      const n = Math.max(caps.length, creds.length);
      for(let i=0;i<n;i++){
        const cap = caps[i] ?? '';
        const cre = creds[i] ?? '';
        if(cap || cre) captions.push([cap, cre].filter(Boolean).join(' — '));
      }
    }

    // --- 2) Stichwort & Ausgabe-Kürzel berechnen ---
    const stichwort = smxExtractStichwort(values);
    const kuerzel   = smxComputeEditionCodes(values);

// >>> KAPITEL 5.7 – innerhalb superREDRun(): Nummer/KW/Titel neu + CUE-Schreibplan

// --- 3) Nummer/KW/Headline & finalen Dateinamen bauen ---
const cfg = CFG?.SUPERRED ?? {};
const fields = adapter.getFields?.() ?? {};

// (NEU) Artikel-ID priorisiert aus CUE lesen
let nummerExisting = getExistingNumberFromField(fields.articleDescription || fields.print_filename);
let nummerGuessed  = guessArticleNumber([values.headline, values.subline, values.body]);
let nummerCUE      = '';

if(adapter.id === 'cue'){
  nummerCUE = cueReadArticleIdSafe();     // <— CUE-spezifisch
}

// finale Nummer-Quelle: CUE > vorhanden > geraten > ggf. Platzhalter
const nummer = nummerCUE || nummerExisting || nummerGuessed ||
               (cfg.requireEightDigitId ? (cfg.missingIdPlaceholder ?? '') : '');

// Headline/Stichwort wie gehabt
let baseHeadline = (values.headline || '').trim();
if(!baseHeadline) baseHeadline = (values.subline || '').trim();
if(!baseHeadline){
  const b = String(values.body || '').replace(/\s+/g,' ').trim();
  baseHeadline = b.split(' ').slice(0, 10).join(' ') || 'ohne Titel';
}
const headline = smxSafeHeadline(baseHeadline);
const sw = smxExtractStichwort(values);
const akz   = smxComputeEditionCodes(values);
const kw    = smxKw(new Date());

// Dateiname nach neuer Syntax: "KW||AKZ||Artikel-ID||Überschrift (Stichwort)"
const fileName  = smxBuildFileName({ kw, kuerzel: akz, nummer, headline, stichwort: sw });

// --- 4) Schreibplan je Site ---
const plan = [];

if(adapter.id === 'pps'){
  // PPS: Artikelbeschreibung + (optional) Notizen (nur NOTES-Text)
  if(fields.articleDescription) plan.push({ role:'articleDescription', el: fields.articleDescription, val: fileName });
  if(fields.notes){
    const notesText = buildNotesLine({ subline: values.subline, body: values.body, captions, kwHint: parseInt(kw,10) || null });
    plan.push({ role:'notes', el: fields.notes, val: notesText });
  }
}else{
  // CUE: Tab-gezieltes Schreiben
  // 0) Storyline aktivieren und locality schreiben (Workflow)
  try {
    const tabs = CUE._tabs.cueGetAllTabs();
    const storyTab = tabs.find(t => /storyline|story|inhalt/i.test((t.innerText ?? t.textContent ?? ''))) ?? tabs[0];
    if (storyTab) {
    await CUE._tabs.cueActivateTab(storyTab);
    const scope = CUE._tabs.cueGetTabPanel(storyTab) ?? document;
    await CUE._tabs.cueWaitForTestIds(CUE._tabs.TESTIDS.locality ?? [], { timeout: 2500, scope });
    await sleep(80);
    }
  } catch {}
  if (fields.locality) {
    plan.push({ role:'locality', el: fields.locality, val: values.locality });
  }

  // 1) "print metadaten" Tab aktivieren und print_filename befüllen
  try{
    const tabs = CUE._tabs.cueGetAllTabs();
    const printTab = tabs.find(t => /print|meta|druck/i.test((t.innerText ?? t.textContent ?? '').toLowerCase())) ?? null;
    if(printTab){
      await CUE._tabs.cueActivateTab(printTab);
      const scope = CUE._tabs.cueGetTabPanel(printTab) ?? document;
      await CUE._tabs.cueWaitForTestIds(CUE._tabs.TESTIDS.print_filename ?? [], { timeout: 2500, scope });
    }
  }catch{}
  if(fields.print_filename){
    plan.push({ role:'print_filename', el: fields.print_filename, val: fileName }); // enthält Artikel-ID
  }

  // 2) "Notizen" Tab aktivieren und notes mit 2 Zeilen befüllen:
  //    erste Zeile = Artikelbeschreibung (fileName), zweite Zeile = SuperNOTES-Text
  try{
    const tabs = CUE._tabs.cueGetAllTabs();
    const notesTab = tabs.find(t => /notiz/i.test((t.innerText ?? t.textContent ?? '').toLowerCase())) ?? null;
    if(notesTab){
      await CUE._tabs.cueActivateTab(notesTab);
      const scope = CUE._tabs.cueGetTabPanel(notesTab) ?? document;
      await CUE._tabs.cueWaitForTestIds(CUE._tabs.TESTIDS.notes ?? [], { timeout: 2500, scope });
      await sleep(140); // Quill vollständig bereit
    }
  }catch{}
  if(fields.notes){
    const notesText = buildNotesLine({ subline: values.subline, body: values.body, captions, kwHint: parseInt(kw,10) || null });
    const combined  = `${fileName}\n${notesText}`;     // <— Zeilenumbruch als Trennzeichen
    plan.push({ role:'notes', el: fields.notes, val: combined });
  }

  // Optional: locality & print_et weiterhin setzen (falls gewünscht)
  if(fields.print_et){
    const d = resolveIssueDateFromKW(parseInt(kw,10)||null, cfg.appearanceWeekday ?? 6, new Date());
    const pad2 = n => String(n).padStart(2,'0');
    const valDate = `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}`;
    plan.push({ role:'print_et', el: fields.print_et, val: valDate });
  }
}

// Profil-Filter
const filtered = filterByProfile(plan.map(p => ({role:p.role, el:p.el, val:p.val})), 'write');

    // --- 5) Optionaler Überschreibschutz (nur bei nicht-trivialen Inhalten) ---
    const needConfirm = [];  // {label, current, proposed, el}
    for(const p of filtered){
      const current = readGeneric(p.el).trim();
      const proposed= String(p.val ?? '').trim();
      const trivial = (current === '' || /^\d{5,12}$/.test(current)); // leere Beschreibung oder nur Nummer
      const skipConfirm = (adapter.id === 'cue' && p.role === 'print_filename'); // CUE: Bestandsschutz aus
      if(!skipConfirm && !trivial && proposed && proposed !== current){
        needConfirm.push({ label: ROLE_TO_DE[p.role] ?? p.role, current, proposed, el: p.el });
      }
    }
    let allowOverwrite = true;
    if(needConfirm.length){
      const html = `
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">Überschreibschutz</div>
        <div>In diesen Feldern stehen bereits Inhalte. Überschreiben?</div>
        ${needConfirm.map((it,i)=>`
          <div style="margin-top:10px;padding:10px;border:1px solid #12456a;border-radius:8px;background:#07233a">
            <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer">
              <input id="smx_red_over_${i}" type="checkbox" checked style="transform:translateY(2px)">
              <div>
                <div style="font-weight:600">${it.label}</div>
                <div style="opacity:.9;margin-top:6px">
                  <div style="font-size:12px"><b>Aktuell:</b> ${it.current}</div>
                  <div style="font-size:12px;margin-top:4px"><b>Neu:</b> ${it.proposed}</div>
                </div>
              </div>
            </label>
          </div>
        `).join('')}
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button id="smx_red_ok" style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Anwenden</button>
          <button id="smx_red_cancel" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Abbrechen</button>
        </div>`;
      const { wrap, box } = smxCreateOverlayBox(html);
      await new Promise(resolve=>{
        box.querySelector('#smx_red_cancel').addEventListener('click', ()=>{ allowOverwrite=false; wrap.remove(); resolve(null); });
        box.querySelector('#smx_red_ok').addEventListener('click', ()=>{
          const checks = needConfirm.map((_,i)=> !!box.querySelector(`#smx_red_over_${i}`)?.checked );
          // Filter entsprechend Checks aktualisieren
          for(let i=needConfirm.length-1;i>=0;i--){
            if(!checks[i]){
              // diesen Eintrag nicht überschreiben
              const idx = filtered.findIndex(f=>f.el===needConfirm[i].el);
              if(idx>=0) filtered.splice(idx,1);
            }
          }
          wrap.remove(); resolve(true);
        });
        wrap.addEventListener('click', e=>{ if(e.target===wrap){ allowOverwrite=false; wrap.remove(); resolve(null); }});
      });
      if(!allowOverwrite){ smxToast('SuperRED: Abgebrochen.'); return; }
    }

    // --- 6) Schreiben ---
    let ok = 0;
for(const p of filtered){
if (adapter.id === 'cue' && p.role === 'locality') {
  try {
    const ids = CUE._tabs.TESTIDS.locality ?? [];
    const tries = 5, dly = 200;
    const wrote = await CUE._tabs.cueWriteIntoTestIdsVerified(ids, p.val, 'locality', { attempts: tries, delay: dly, scope: document });
    if (wrote > 0) { highlight(p.el, '#8bc34a'); ok++; continue; }
  } catch {}
}
  if(writeWithQuillAware(p.el, p.val)){
    highlight(p.el, '#8bc34a'); ok++;
      }
    }
    smxToast(`SuperRED: ${ok}/${filtered.length} Feld(er) geschrieben.`);
  }catch(err){
    console.warn('[SuperRED] Fehler:', err);
    smxToast('SuperRED: Fehler (Konsole prüfen).', false);
  }
}

//// KAPITEL 5.8 // SuperNOTES ///////////////////////////////////////////////////////////////////////////
// v5-Implementierung: nutzt CFG.NOTES, gemeinsame KW-Helfer & Multi-Site-Adapter

function buildNotesLine({ subline, body, captions = [], kwHint }){
  // Vereinfachte, robuste Muster; basieren auf v4-Logik, angepasst auf v5-Helpers
  const MONTHS = '(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)';
  const WEEKDAYS_OPT = '(?:(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag),?\\s*)?';
  const pad2 = n => String(n).padStart(2,'0');
  const fmtDateDE = d => `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}`;
  const sod = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
  const addDays = (d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const parseIntSafe = s => { const n=parseInt(s,10); return Number.isFinite(n) ? n : null; };
  function buildDate(dayStr, monStrOrIdx, yearStr, now){
    const dd = parseIntSafe(dayStr);
    let mm = (typeof monStrOrIdx === 'number') ? (monStrOrIdx+1) : parseIntSafe(monStrOrIdx);
    let yyyy = yearStr ? parseIntSafe(yearStr) : null;
    if(!dd) return null;
    if(yyyy != null && yyyy < 100) yyyy = 2000 + yyyy;
    if(!mm || mm < 1 || mm > 12) mm = parseIntSafe(monStrOrIdx);
    if(!mm) return null;
    if(yyyy == null) yyyy = (now ?? new Date()).getFullYear();
    const d = new Date(yyyy, mm-1, dd); d.setHours(0,0,0,0);
    if(d.getDate() !== dd || d.getMonth() !== mm-1) return null;
    return d;
  }
  function normalizeSpacesFull(s){
    return String(s ?? '')
      .replace(/[\u00A0\u202F\u2009]/g,' ')
      .replace(/[–—]/g,'-')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  const allText = normalizeSpacesFull(`${subline ?? ''}\n${body ?? ''}\n${(captions ?? []).join('\n')}`);
  const out = [];
  const now0 = sod(new Date());

  // 1) "11., 13. und 15. November [2025]"
  const listMonPat = new RegExp(String.raw`(\d{1,2}\.)\s*(?:,\s*\d{1,2}\.)*(?:\s*und\s*\d{1,2}\.)\s*(${MONTHS})\s*(\d{2,4})?`, 'gi');
  let lm; while((lm = listMonPat.exec(allText)) !== null){
    const monKey = lm[2].toLowerCase();
    const yearStr= lm[3] ?? null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'.split(' ').indexOf(monKey);
    if(monthIdx >= 0){
      const slice = allText.slice(lm.index, listMonPat.lastIndex);
      const days = (slice.match(/\d{1,2}(?=\.)/g) ?? []).map(parseIntSafe).filter(Number.isFinite);
      const uniq = [...new Set(days)].filter(n=>n>=1 && n<=31);
      for(const dd of uniq){
        const d = buildDate(String(dd), monthIdx, yearStr, new Date());
        if(d) out.push(d);
      }
    }
  }

  // 2) "Monat ... am 11., 13. und 15. [2025]"
  const monthThenListRe = new RegExp(String.raw`(${MONTHS})\s*(?:am\s*)?((?:\d{1,2}\.\s*(?:,\s*|und\s+|bis\s+))*)(\d{1,2})\.\s*(\d{2,4})?`, 'gi');
  let ml; while((ml = monthThenListRe.exec(allText)) !== null){
    const monKey = ml[1].toLowerCase();
    const before = ml[2] ?? '';
    const lastDay= ml[3];
    const yearStr= ml[4] ?? null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'.split(' ').indexOf(monKey);
    if(monthIdx >= 0){
      const allDays = [ ...(before.match(/\d{1,2}(?=\.)/g) ?? []), lastDay ].map(parseIntSafe).filter(Number.isFinite);
      const uniq = [...new Set(allDays)].filter(n=>n>=1 && n<=31);
      for(const dd of uniq){
        const d = buildDate(String(dd), monthIdx, yearStr, new Date());
        if(d) out.push(d);
      }
    }
  }

  // 3) "von 11. bis 15. November [2025]" → Startdatum
  const vonBisMonPat = new RegExp(String.raw`(?:\bvon\s*)?(\d{1,2})\.\s*(?:bis|[–-])\s*(\d{1,2})\.\s*(${MONTHS})\s*(\d{2,4})?`, 'gi');
  let vb; while((vb = vonBisMonPat.exec(allText)) !== null){
    const startDay = vb[1];
    const monKey   = vb[3].toLowerCase();
    const yearStr  = vb[4] ?? null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'.split(' ').indexOf(monKey);
    if(monthIdx >= 0){
      const dStart = buildDate(startDay, monthIdx, yearStr, new Date());
      if(dStart) out.push(dStart);
    }
  }

  // 4) Bereich "11.–15.11.[2025]" → Startdatum
  const wsp = `[\\s\\u00A0\\u202F\\u2009]*`;
  const rangeRe = new RegExp(String.raw`(?:^\D)(\d{1,2})\.${wsp}[–-]${wsp}(\d{1,2})\.(\d{1,2})\.?(?:\s*(\d{2,4}))?`, 'gi');
  let rr; while((rr = rangeRe.exec(allText)) !== null){
    const d = buildDate(rr[1], rr[3], rr[4] ?? null, new Date());
    if(d) out.push(d);
  }

  // 5) "dd.mm.yyyy"
  const fullRe = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/gi;
  let fr; while((fr = fullRe.exec(allText)) !== null){
    const d = buildDate(fr[1], fr[2], fr[3], new Date());
    if(d) out.push(d);
  }

  // 6) "dd.mm." (Jahr = aktuell)
  const noYearRe = /(\d{1,2})\.(\d{1,2})\.(?!\d)/gi;
  let ny; while((ny = noYearRe.exec(allText)) !== null){
    const d = buildDate(ny[1], ny[2], null, new Date());
    if(d) out.push(d);
  }

  // 7) "Wochentag, dd. Monat [yyyy]"
  const monRe = new RegExp(String.raw`${WEEKDAYS_OPT}(\d{1,2})\.?\s*(${MONTHS})(?:\s*(\d{2,4}))?`, 'gi');
  let mm; while((mm = monRe.exec(allText)) !== null){
    const day    = mm[1];
    const monKey = mm[2].toLowerCase();
    const yearStr= mm[3] ?? null;
    const monthIdx = 'januar februar märz april mai juni juli august september oktober november dezember'.split(' ').indexOf(monKey);
    if(monthIdx >= 0){
      const d = buildDate(day, monthIdx, yearStr, new Date());
      if(d) out.push(d);
    }
  }

  // Fenster [-30, +365], deduplizieren, sortieren, frühesten Termin nehmen
  const min = addDays(now0, -30), max = addDays(now0, 365);
  const win = [...new Map(out.map(d => [d.getTime(), d])).values()]
                .filter(d => d >= min && d <= max)
                .sort((a,b)=> a - b);
  const earliest = win[0] ?? null;

  // Terminpräfix: abhängig von KW (Heftausgabe) oder "heute"
  let terminPrefix = 'TERMIN:';
  try{
    if(typeof kwHint === 'number' && kwHint >= 1 && kwHint <= 53){
      const issueDate = resolveIssueDateFromKW(kwHint, CFG?.SUPERRED?.appearanceWeekday ?? 6, new Date());
      terminPrefix = (earliest && earliest < issueDate) ? 'ACHTUNG-TERMIN:' : 'TERMIN:';
    }else{
      terminPrefix = (earliest && earliest < now0) ? 'ACHTUNG-TERMIN:' : 'TERMIN:';
    }
  }catch{}

  // Phrasen / Tags
  const cfgN = CFG?.NOTES ?? {};
  const sep  = String(cfgN.sep ?? ' \n\n ');
  const phraseWholeWord = !!cfgN.phraseWholeWord;

  // Hilfsfunktionen aus v4 vereinfacht:
  function escapeRegex(s){ return String(s??'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  const phraseList   = String(cfgN.phrasesDefault ?? '').split(',').map(s=>s.trim()).filter(Boolean);
  const phraseExList = String(cfgN.phrasesExcludeDefault ?? '').split(',').map(s=>s.trim()).filter(Boolean);

  function scrubExclusions(textLower){
    let out = textLower;
    for(const ex of phraseExList){
      if(!ex) continue;
      const re = new RegExp(escapeRegex(ex.toLowerCase()), 'giu');
      out = out.replace(re,' ');
    }
    return out;
  }
  function findPhraseHits(text){
    const lower = String(text??'').toLowerCase();
    const scan  = scrubExclusions(lower);
    const hits  = new Set();
    for(const p of phraseList){
      const term = p.toLowerCase();
      const re = phraseWholeWord
        ? new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegex(term)})(?=([^\\p{L}\\p{N}_]))`, 'giu')
        : new RegExp(escapeRegex(term), 'giu');
      if(re.test(scan)) hits.add(p);
    }
    return [...hits];
  }

  // Tags zählen
  function getTagTable(){
    const raw = String(cfgN.tagTableDefault ?? '');
    const lines = raw.split('\n').map(s=>s.trim()).filter(Boolean);
    const table = [];
    for(const line of lines){
      const ix = line.indexOf(':'); if(ix < 0) continue;
      const tag = line.slice(0,ix).trim().toUpperCase();
      const items = line.slice(ix+1).split(',').map(s=>s.trim()).filter(Boolean);
      if(tag && items.length) table.push({ tag, items });
    }
    return table;
  }
  function countTagHits(text){
    const lower = String(text??'').toLowerCase();
    const table = getTagTable();
    const results = [];
    for(const row of table){
      let hits = 0;
      for(const term of row.items){
        const t = String(term??'').toLowerCase(); if(!t) continue;
        let idx = lower.indexOf(t);
        while(idx >= 0){ hits++; idx = lower.indexOf(t, idx + t.length); }
      }
      if(hits > 0) results.push({ tag: row.tag, hits });
    }
    results.sort((a,b)=> (b.hits - a.hits) || a.tag.localeCompare(b.tag,'de'));
    return results.map(x=>x.tag);
  }

  // Ausgabe
  const parts = [];
  if(earliest) parts.push(`${terminPrefix} ${fmtDateDE(earliest)}`);

  const phrases = findPhraseHits(allText);
  if(phrases.length) parts.push(`CHECKEN! ${phrases.join(', ')}`);

  const tags = countTagHits(allText);
  if(tags.length){
    const room = Math.max(0, CFG?.NOTES?.tagMaxCount ?? 6);
    const picked = tags.slice(0, room);
    const tagJoiner = String(CFG?.NOTES?.tagJoiner ?? ' \n ');
    parts.push(picked.join(tagJoiner));
  }
  return parts.join(sep);
}

async function superNOTESRun(){
  try{
    const adapter = currentAdapter();
    setRoleProfile('SuperRED'); // NOTES liegt im gleichen Profil wie SuperRED (write: notes)

    const fields = adapter.getFields?.() ?? {};
    const notesEl = fields.notes;
    if(!notesEl){ smxToast('SuperNOTES: Notizen-Feld nicht gefunden.', false); return; }

    // Werte sammeln (wie bei SuperRED)
    let values = { headline:'', subline:'', body:'' };
    let captions = [];
    if(adapter.id === 'pps'){
      const data = await ppsCollectBridgeDataAll();
      values.headline = data.headline ?? '';
      values.subline  = data.subline  ?? '';
      values.body     = data.body     ?? '';
      captions = (data.pairs ?? []).map(p => [p.caption, p.credit].filter(Boolean).join(' — ')).filter(Boolean);
    }else{
      const f = fields;
      values.headline = readGeneric(f.headline);
      values.subline  = readGeneric(f.subline);
      values.body     = readGeneric(f.body);
      const capIds = CUE._tabs.TESTIDS?.caption ?? [];
      const creIds = CUE._tabs.TESTIDS?.credit  ?? [];
      const caps   = capIds.flatMap(id => deepQSA(`[data-testid="${id}"]`).map(h => readGeneric(deepQS('.ql-editor[contenteditable="true"],[contenteditable="true"],textarea,input', h)))).filter(Boolean);
      const creds  = creIds.flatMap(id => deepQSA(`[data-testid="${id}"]`).map(h => readGeneric(deepQS('.ql-editor[contenteditable="true"],[contenteditable="true"],textarea,input', h)))).filter(Boolean);
      const n = Math.max(caps.length, creds.length);
      for(let i=0;i<n;i++){
        const cap = caps[i] ?? ''; const cre = creds[i] ?? '';
        if(cap || cre) captions.push([cap, cre].filter(Boolean).join(' — '));
      }
    }

    // KW-Hinweis aus vorhandenem Dateinamen (falls er bereits im Feld steht)
    let kwHint = null;
    try{
        const fieldsAll = adapter.getFields?.() ?? {};
        const fn = String(
            fieldsAll.print_filename?.value ??
            fieldsAll.articleDescription?.value ??
            ''
        ).trim();

    // Format: "KW||AKZ||Artikel-ID||Titel..."
    const m = fn.match(/^(\d{1,2})\s*\|\|/u);
    if(m){
       const k = parseInt(m[1],10);
       if(Number.isFinite(k)) kwHint = k;
    }
    }catch{}

    const notesText = buildNotesLine({ subline: values.subline, body: values.body, captions, kwHint });

    // Warnung bei nicht trivialen bestehenden Notizen (CFG.NOTES.warnIfNonTrivialExisting)
    const warnExisting = !!(CFG?.NOTES?.warnIfNonTrivialExisting);
    const current = readGeneric(notesEl).trim();
    const trivial = (current === '');
    if(warnExisting && !trivial && notesText.trim() !== current.trim()){
      const html = `
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">Notizen überschreiben?</div>
        <div style="padding:10px;border:1px solid #12456a;border-radius:8px;background:#07233a">
          <div style="opacity:.9;margin-top:6px">
            <div style="font-size:12px;white-space:pre-wrap"><b>Aktuell:</b> ${current}</div>
            <div style="font-size:12px;margin-top:8px;white-space:pre-wrap"><b>Neu:</b> ${notesText}</div>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button id="smx_notes_ok" style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Anwenden</button>
          <button id="smx_notes_cancel" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Abbrechen</button>
        </div>`;
      const { wrap, box } = smxCreateOverlayBox(html);
      const proceed = await new Promise(resolve=>{
        box.querySelector('#smx_notes_ok').addEventListener('click', ()=>{ wrap.remove(); resolve(true); });
        box.querySelector('#smx_notes_cancel').addEventListener('click', ()=>{ wrap.remove(); resolve(false); });
        wrap.addEventListener('click', e=>{ if(e.target===wrap){ wrap.remove(); resolve(false); }});
      });
      if(!proceed){ smxToast('SuperNOTES: Abgebrochen.'); return; }
    }

    const ok = writeWithQuillAware(notesEl, notesText);
    smxToast(ok ? 'SuperNOTES: Notizen geschrieben.' : 'SuperNOTES: Schreiben fehlgeschlagen.', !!ok);
    if(ok) highlight(notesEl, '#8bc34a');
  }catch(err){
    console.warn('[SuperNOTES] Fehler:', err);
    smxToast('SuperNOTES: Fehler (Konsole prüfen).', false);
  }
}

//// KAPITEL 5.9 // SuperMAX ///////////////////////////////////////////////////////////////
// Start über Hotkey 'Ctrl+S' (führt RegEx- und Hashtag-Regeln aus)

function smxLooksLikeUrl(s){ return /(https?:\/\/\S+|www\.\S+)/i.test(String(s || '')); }


async function superMAX_OneClick() {
  try {
    const adapter = currentAdapter();

    // SuperMAX (RegEx + optional Hashtags)
    try { await smxClipboardClear(); } catch {}
    const runHashtag = !!(CFG_DEFAULTS?.FEATURES?.runHashtagOnOneClick);
    const mode = runHashtag ? 'both' : 'baseOnly';
    const changed = await smxApplyRegexToTargets(mode);

    // Optional: Auto-Save in CUE
    const doSave = !!(CFG_DEFAULTS?.FEATURES?.saveAfterOneClick) && adapter.id === 'cue';
    if (doSave) {
      try {
        const clicked = CUE._tabs.clickSaveIfPresent(document.body);
        if (!clicked) CUE._tabs.triggerSaveShortcut();
      } catch {}
    }

    smxToast(`OneClick: ${changed} Feld(er) angepasst.`);
  } catch (err) {
    console.warn('[SuperMAX OneClick] Fehler:', err);
    smxToast('OneClick: Fehler (Konsole prüfen).', false);
  }
}

//// KAPITEL 6 //// MENÜS ////////////////////////////////////////////////////////////////////////////////
//// KAPITEL 6.1 // Menü - Entwicklermodus (deaktiviert) /////////////////////////////////////////////////
// try {
// GM_registerMenuCommand('DEV: an/aus', () => {
// SMX_DEV_MODE = !SMX_DEV_MODE;
/// try { GM_setValue('smx_dev_mode', SMX_DEV_MODE); } catch {}
// smxToast('DEV-Modus: ' + (SMX_DEV_MODE ? 'AN' : 'AUS'));
// });
// GM_registerMenuCommand('Dry-Run (schreibt nicht): an/aus', () => {
// SMX_DRY_RUN = !SMX_DRY_RUN;
// try { GM_setValue('smx_dry_run', SMX_DRY_RUN); } catch {}
// smxToast('Dry-Run: ' + (SMX_DRY_RUN ? 'AN' : 'AUS'));
// });
// } catch {}

//// KAPITEL 6.2 // Menü - Tastaturkürzel ////////////////////////////////////////////////////////////////
GM_registerMenuCommand('SuperMAX – Tastaturkürzel', ()=>{
  try{ const box=document.createElement('div'); box.style.cssText='position:fixed;right:18px;top:18px;z-index:2147483647;background:#0b1e2d;color:#fff;border:1px solid #0d3a5c;border-radius:10px;padding:14px;max-width:560px;font:13px/1.35 system-ui,Segoe UI,Arial'; box.innerHTML=`
    <div style="font-weight:700;margin-bottom:8px">SuperMAX – Tastaturkürzel</div>
    <ul style="margin-top:10px;padding-left:18px">
      <li><b>SuperMAX Tastaturkürzel:</b></li>
      <li>STRG+S > RegEx- und Hashtag-Regeln</li>
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
      <li><b>SuperBRIDGE Tastaturkürzel:</b></li>
      <li>STRG+ALT+B > Artikel an Zwischenablage</li>
      <li>STRG+V > Artikel aus Zwischenablage</li>
      <li>STRG+ALT+B > Artikel an Redaktionssystem</li>
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

//// KAPITEL 6.3 // Menü - Clippings /////////////////////////////////////////////////////////////////////
// (Platzhalter)

//// KAPITEL 6.4 // Menü - Rollen ////////////////////////////////////////////////////////////////////////
// (Platzhalter)

//// KAPITEL 6.5 // Menü - Token-Setting /////////////////////////////////////////////////////////////////
try {
GM_registerMenuCommand('SuperLINK – Token-Setting', () => {
const YOURLS_TOKEN_KEY = 'yourlsToken';
let current = '';
try { current = GM_getValue(YOURLS_TOKEN_KEY, '') || ''; } catch {}

const html = `
<div style="font-weight:700;margin-bottom:8px">SuperLINK – Token-Setting</div>
<div style="opacity:.9;margin-bottom:10px">
Hinterlege hier den YOURLS-Token für <code>bwurl.de</code>. Der Token wird lokal gespeichert.
</div>
<label style="display:block;margin:8px 0 6px;opacity:.9">Token</label>
<div style="display:flex;gap:8px;align-items:center">
<input id="smx_sl_token" type="password"
value="${current ? String(current).replace(/"/g,'&quot;') : ''}"
style="flex:1 1 auto;background:#061826;color:#fff;border:1px solid #12456a;border-radius:6px;padding:8px 10px;outline:none">
<button id="smx_sl_show" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer">anzeigen</button>
</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center">
<button id="smx_sl_save" style="background:#1b8d3d;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Speichern</button>
<button id="smx_sl_test" style="background:#3a6fb0;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Token testen</button>
<button id="smx_sl_copy" style="background:#3a6fb0;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Kopieren</button>
<button id="smx_sl_paste" style="background:#3a6fb0;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Einfügen</button>
<button id="smx_sl_clear" style="background:#b03a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Löschen</button>
<div id="smx_sl_status" style="margin-left:auto;min-height:20px;opacity:.95"></div>
</div>
<div style="margin-top:14px;text-align:right">
<button id="smx_sl_close" style="background:#3a3a3a;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Schließen</button>
</div>
`;

const { wrap, box } = smxCreateOverlayBox(html);
const $ = (sel) => box.querySelector(sel);
const input = $('#smx_sl_token');
const statusEl = $('#smx_sl_status');

function setStatus(msg, type = 'info') {
const color = type === 'ok' ? '#8bc34a' : (type === 'err' ? '#ff5252' : '#cfd8dc');
statusEl.innerHTML = `<span style="color:${color}">${msg || ''}</span>`;
}
function persist(val) {
try { GM_setValue(YOURLS_TOKEN_KEY, String(val || '')); smxToast('SuperLINK: Token gespeichert.'); }
catch { smxToast('SuperLINK: Speichern fehlgeschlagen.', false); }
}
async function copyToken(){
try { await navigator.clipboard?.writeText(input.value || ''); smxToast('Token kopiert.'); }
catch {
const ta=document.createElement('textarea'); ta.value=input.value||''; ta.style.position='fixed'; ta.style.left='-9999px';
document.body.appendChild(ta); ta.select();
try { document.execCommand('copy'); smxToast('Token kopiert.'); } catch { smxToast('Kopieren fehlgeschlagen.', false); }
finally { ta.remove(); }
}
}
async function pasteToken(){
try {
const txt = await navigator.clipboard?.readText?.();
if (txt != null) { input.value = (txt || '').trim(); smxToast('Token eingefügt.'); }
else smxToast('Zwischenablage leer oder blockiert.', false);
} catch { smxToast('Einfügen nicht möglich.', false); }
}
function testToken(){
const tok = (input.value || '').trim();
if (!tok) { setStatus('Kein Token eingegeben.', 'err'); return; }
$('#smx_sl_test').disabled = true; setStatus('Teste Token …', 'info');
const testUrl = 'https://example.com/?smx_test=' + Date.now();
const api = 'https://bwurl.de/yourls-api.php?action=shorturl&format=simple'
+ '&signature=' + encodeURIComponent(tok)
+ '&url=' + encodeURIComponent(testUrl);
try {
GM_xmlhttpRequest({
method: 'GET',
url: api,
onload: (resp) => {
$('#smx_sl_test').disabled = false;
const out = (resp.responseText || '').trim();
if (/^https?:\/\/\S+$/i.test(out)) setStatus('Token ok ✓', 'ok');
else setStatus('Token ungültig (Antwort unerwartet).', 'err');
},
onerror: () => { $('#smx_sl_test').disabled = false; setStatus('Netzwerk-/API-Fehler.', 'err'); }
});
} catch {
$('#smx_sl_test').disabled = false; setStatus('Request nicht möglich.', 'err');
}
}

// Events
$('#smx_sl_show')?.addEventListener('click', () => {
const t = input.getAttribute('type') === 'password' ? 'text' : 'password';
input.setAttribute('type', t);
$('#smx_sl_show').textContent = (t === 'password') ? 'anzeigen' : 'verbergen';
});
$('#smx_sl_save') ?.addEventListener('click', () => { persist(input.value.trim()); setStatus('Gespeichert.', 'ok'); });
$('#smx_sl_test') ?.addEventListener('click', testToken);
$('#smx_sl_copy') ?.addEventListener('click', copyToken);
$('#smx_sl_paste')?.addEventListener('click', pasteToken);
$('#smx_sl_clear')?.addEventListener('click', () => { input.value = ''; persist(''); setStatus('Token gelöscht.', 'ok'); });
$('#smx_sl_close')?.addEventListener('click', () => wrap.remove());
wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });

// Shortcuts im Overlay: Enter = Speichern, ESC = schließen
document.addEventListener('keydown', function onKey(e){
if (!document.body.contains(wrap)) { document.removeEventListener('keydown', onKey); return; }
if (e.key === 'Escape') { e.preventDefault(); wrap.remove(); document.removeEventListener('keydown', onKey); }
if (e.key === 'Enter') { e.preventDefault(); $('#smx_sl_save').click(); }
});

setTimeout(() => input?.focus?.(), 30);
});
} catch {}

//// KAPITEL 7 //// COPY&PASTE-Helper ////////////////////////////////////////////////////////////////////
// Fokus-Tracker für Editoren
let SMX_LAST_ACTIVE_EDITABLE = null;
document.addEventListener('focusin', (e) => {
try {
const ed = e.target?.closest?.('.ql-editor[contenteditable="true"], [contenteditable="true"], textarea, input[type="text"], [role="textbox"]');
if (ed) SMX_LAST_ACTIVE_EDITABLE = ed;
} catch {}
});

function findQuillContainerFromNode(node) {
try {
const el = (node && node.nodeType === 1) ? node : (node && node.parentElement);
const c = el?.closest?.('.ql-container, [class*="ql-container"]') || null;
return c || null;
} catch { return null; }
}

function smxGetActiveQuill() {
try {
const sel = window.getSelection?.();
let container = null;
if (sel && sel.anchorNode) container = findQuillContainerFromNode(sel.anchorNode);
if (!container && SMX_LAST_ACTIVE_EDITABLE) container = SMX_LAST_ACTIVE_EDITABLE.closest?.('.ql-container, [class*="ql-container"]') || null;
if (!container) {
const active = document.activeElement;
container = active?.closest?.('.ql-container, [class*="ql-container"]') || null;
}
if (!container) container = document.querySelector('.ql-container, [class*="ql-container"]');
const quill = container && container.__quill;
const root = quill?.root || container?.querySelector?.('.ql-editor[contenteditable="true"]');
return { quill, root, container };
} catch {
return { quill:null, root:null, container:null };
}
}

function smxNormFlat(s){
try {
let out = String(s ?? '');
out = out.replace(/[\u00A0\u2007\u202F\u2009\u200A\u2006\u2005\u2004\u2003\u2002\u205F]/g, ' ');
out = out.replace(/\u00AD/g, '');
out = out.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
out = out.replace(/\s+/g, ' ').trim();
return out;
} catch { return String(s ?? '').trim(); }
}

function smxFindInQuillText(quill, needle){
if (!quill || !needle) return -1;
try {
const full = quill.getText(0, quill.getLength?.() || 0) || '';
const hay = smxNormFlat(full);
const ndl = smxNormFlat(needle);
return hay.indexOf(ndl);
} catch { return -1; }
}

function smxResolveQuillRange(selInfo){
try {
const { quill } = selInfo || {};
if (!quill) return { quill:null, index:-1, length:0, text: selInfo?.text || '' };
let { index, length, text } = selInfo || {};
if (typeof index === 'number' && index >= 0 && length > 0) {
const t = text || (quill.getText(index, length) || '');
return { quill, index, length, text: t };
}
const rng = quill.getSelection?.(true) || quill.getSelection?.();
if (rng && rng.length > 0) {
const t = quill.getText(rng.index, rng.length) || '';
return { quill, index: rng.index, length: rng.length, text: t };
}
const needle = (text || '').trim();
if (needle) {
const pos = smxFindInQuillText(quill, needle);
if (pos >= 0) return { quill, index: pos, length: needle.length, text: needle };
}
return { quill, index:-1, length:0, text: text || '' };
} catch {
return { quill: selInfo?.quill || null, index:-1, length:0, text: selInfo?.text || '' };
}
}

function smxExpandRangeToFullLines(quill, index, length){
try {
if (!quill || typeof index !== 'number' || index < 0 || typeof length !== 'number' || length <= 0) {
return { index, length };
}
const full = quill.getText(0, quill.getLength?.() || 0) || '';
const start = Math.max(0, full.lastIndexOf('\n', index) + 1);
const after = index + length;
const nextNl = full.indexOf('\n', after);
const end = nextNl >= 0 ? nextNl : full.length;
const newIndex = start;
const newLength = Math.max(0, end - start);
return { index: newIndex, length: newLength };
} catch {
return { index, length };
}
}

// Liefert NUR wirklich markierten Text (Quill/DOM) – KEIN Clipboard-Fallback!
function smxGetRealSelectionText() {
  // 1) Quill-Auswahl (CUE)
  try {
    const { quill } = smxGetActiveQuill();
    if (quill && typeof quill.getSelection === 'function' && typeof quill.getText === 'function') {
      const rng = quill.getSelection(true) || quill.getSelection();
      if (rng && rng.length > 0) {
        return String(quill.getText(rng.index, rng.length) || '').trim();
      }
    }
  } catch {}

  // 2) Browser/DOM-Auswahl (PPS/Contenteditable)
  try {
    const txt = String(window.getSelection?.()?.toString() || '').trim();
    if (txt) return txt;
  } catch {}

  return '';
}

async function smxCaptureSelectionText() {
const { quill } = smxGetActiveQuill();
try {
if (quill && typeof quill.getSelection === 'function') {
const rng = quill.getSelection(true) || quill.getSelection();
if (rng && rng.length > 0) {
const txt = (quill.getText(rng.index, rng.length) || '').trim();
if (txt) {
try { GM_setClipboard(txt, {type:'text', mimetype:'text/plain'}); } catch {}
return { text: txt, index: rng.index, length: rng.length, quill };
}
}
}
} catch {}
try {
const sel = window.getSelection?.();
const txt = (sel?.toString() || '').trim();
if (txt) {
try { GM_setClipboard(txt, {type:'text', mimetype:'text/plain'}); } catch {}
return { text: txt, index: -1, length: txt.length, quill: quill || null };
}
} catch {}
try {
const candidates = [
'.selection-fragment[contenteditable="true"]',
'.selection-drag-handle[contenteditable="true"]',
'[class*="selection-"][contenteditable="true"][readonly="true"]',
'[data-fragment-name*="focus-line-selection"][contenteditable="true"]'
];
for (const sel of candidates) {
const el = document.querySelector(sel);
if (el && el.isContentEditable) {
const txt = (el.innerText || el.textContent || '').trim();
if (txt) {
try { GM_setClipboard(txt, {type:'text', mimetype:'text/plain'}); } catch {}
return { text: txt, index: -1, length: txt.length, quill: quill || null };
}
}
}
} catch {}
try { document.execCommand('copy'); } catch {}
try {
const clip = await (navigator.clipboard?.readText?.() || Promise.resolve(''));
const txt = String(clip || '').trim();
if (txt) {
try { GM_setClipboard(txt, {type:'text', mimetype:'text/plain'}); } catch {}
if (quill) {
const pos = smxFindInQuillText(quill, txt);
if (pos >= 0) return { text: txt, index: pos, length: txt.length, quill };
}
return { text: txt, index: -1, length: txt.length, quill: quill || null };
}
} catch {}
return { text: '', index: -1, length: 0, quill: quill || null };
}

// Ersetzen "wie STRG+V": Quill strikt bevorzugen; Quill vorhanden → kein DOM-Fallback
function smxReplaceSelectionWith(str, selInfo) {
const resolved = smxResolveQuillRange(selInfo);
let { quill, index, length, text } = resolved;
const val = String(str ?? '');
function smxReplaceSelectionExact(str, selInfo){
const resolved = smxResolveQuillRange(selInfo);
let { quill, index, length } = resolved;
const val = String(str ?? '');

// Quill: exakt die aktuelle Selektion ersetzen (keine Zeilen-Erweiterung)
if (quill && typeof quill.deleteText === 'function') {
try {
if (!(typeof index === 'number' && index >= 0 && length > 0)) {
const rng = quill.getSelection?.(true) || quill.getSelection?.();
if (rng && rng.length > 0) { index = rng.index; length = rng.length; }
}
if (!(typeof index === 'number' && index >= 0)) return false;
if (length > 0) quill.deleteText(index, length, 'user');
quill.insertText(index, val, 'user');
try {
const root = quill.root || document.activeElement;
root?.dispatchEvent?.(new InputEvent('input',{bubbles:true}));
root?.dispatchEvent?.(new Event('change',{bubbles:true}));
} catch {}
return true;
} catch { return false; }
}
// Browser-Selektionspfad
try { document.execCommand('insertText', false, val); return true; } catch {}
return false;
}

// 1) Quill-Pfad (CUE/Quill-Editoren)
if (quill && typeof quill.deleteText === 'function') {
try {
// Range sicherstellen
if (!(typeof index === 'number' && index >= 0 && length > 0)) {
const rng = quill.getSelection?.(true) || quill.getSelection?.();
if (rng && rng.length > 0) {
index = rng.index; length = rng.length; text = quill.getText(index, length) || (text || '');
} else {
const needle = (text || '').trim();
if (needle) {
const pos = smxFindInQuillText(quill, needle);
if (pos >= 0) { index = pos; length = needle.length; }
}
}
}
if (!(typeof index === 'number' && index >= 0)) {
smxToast('SuperERASER: Auswahl nicht erkannt (CUE). Bitte erneut markieren.', false);
return false;
}

// Range über volle Zeilen erweitern (damit Blockformate sicher weg sind)
if (length > 0) {
const exp = smxExpandRangeToFullLines(quill, index, length);
index = exp.index; length = exp.length;
}

// Auswahl löschen und bereinigten Text einsetzen
if (length > 0) quill.deleteText(index, length, 'user');
quill.insertText(index, val, 'user');

// Inline- und Blockformate der eingefügten Spanne entfernen
try { quill.removeFormat(index, Math.max(val.length, 1), 'user'); } catch {}
try {
quill.formatLine(index, Math.max(val.length, 1), {
header:false, list:false, blockquote:false, 'code-block':false,
align:false, indent:false, direction:false
});
} catch {}

// leichte Editor-Events
try {
const root = quill.root || document.activeElement;
root?.dispatchEvent?.(new InputEvent('input', { bubbles:true }));
root?.dispatchEvent?.(new Event('change', { bubbles:true }));
} catch {}
return true;
} catch {
smxToast('SuperERASER: Ersetzen im Quill fehlgeschlagen.', false);
return false;
}
}

// 2) Browser-Range
try {
// Verwende insertText, um Block-Splits zu vermeiden
document.execCommand('insertText', false, str);
return true;
} catch {}

// 3) execCommand-Fallback
try { document.execCommand('insertText', false, val); return true; } catch {}

return false;
}

function smxCleanTextForEraser(text){
let out = String(text ?? '');

// 1) Zeilenumbrüche zu Leerzeichen
out = out.replace(/(\r\n|\r|\n)+/g, ' ');

// 2) Zero-width und BOM entfernen
out = out.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '');

// 3) NBSP → Space
out = out.replace(/\u00A0/g, ' ');

// 4) Soft-Hyphen optional entfernen
const stripSH = (typeof STRIP_SOFT_HYPHEN !== 'undefined') ? !!STRIP_SOFT_HYPHEN : true;
if (stripSH) out = out.replace(/\u00AD/g, '');

// 5) MS-Office-Artefakte (falls als Text vorhanden)
out = out.replace(/<o:p>.*?<\/o:p>/gi,'');
out = out.replace(/<span[^>]*mso-[^>]*>.*?<\/span>/gi,'');
// 5a) Bullet-Zeichen entfernen/ersetzen
out = out.replace(/\u2022/g, ' '); // •
// 5b) Listenziffern „1)“, „1.“ optional glätten (nur am Zeilenanfang)
out = out.replace(/(^|\n)\s*\d{1,3}[.)]\s*/g, '$1');

// 6) Mehrfache Spaces reduzieren
out = out.replace(/\s{2,}/g, ' ');

// 7) Rand trimmen
out = out.trim();

return out;
}
})();