import { jsx as d, jsxs as x, Fragment as Nt } from "react/jsx-runtime";
import { useState as H, useEffect as W, useCallback as l2, useMemo as po, useRef as je, useId as Ta } from "react";
const Gt = {
  arches: {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    wisdom: {
      upper: [18, 28],
      lower: [48, 38]
    }
  },
  options: [
    { id: "upper-12-22-zircon", labelKey: "statusExtras.upper12_22Zircon", type: "span", teeth: [12, 11, 21, 22], material: "zircon" },
    { id: "upper-13-23-zircon", labelKey: "statusExtras.upper13_23Zircon", type: "span", teeth: [13, 12, 11, 21, 22, 23], material: "zircon" },
    { id: "upper-16-26-zircon", labelKey: "statusExtras.upper16_26Zircon", type: "span", teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], material: "zircon" },
    { id: "upper-full-zircon", labelKey: "statusExtras.upperFullZircon", type: "arch-bridge", arch: "upper", material: "zircon", missingMaterial: "zircon" },
    { id: "upper-12-22-metal", labelKey: "statusExtras.upper12_22Metal", type: "span", teeth: [12, 11, 21, 22], material: "metal" },
    { id: "upper-13-23-metal", labelKey: "statusExtras.upper13_23Metal", type: "span", teeth: [13, 12, 11, 21, 22, 23], material: "metal" },
    { id: "upper-16-26-metal", labelKey: "statusExtras.upper16_26Metal", type: "span", teeth: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26], material: "metal" },
    { id: "upper-full-metal", labelKey: "statusExtras.upperFullMetal", type: "arch-bridge", arch: "upper", material: "metal", missingMaterial: "metal" },
    { id: "upper-partial-removable", labelKey: "statusExtras.upperPartialRemovable", type: "partial-removable", arch: "upper" },
    { id: "upper-full-removable", labelKey: "statusExtras.upperFullRemovable", type: "full-removable", arch: "upper" },
    { id: "upper-bar-denture", labelKey: "statusExtras.upperBarDenture", type: "bar-denture", arch: "upper", implants: [14, 12, 22, 24], missing: [16, 15, 13, 11, 21, 23, 25, 26] },
    { id: "lower-42-32-zircon", labelKey: "statusExtras.lower42_32Zircon", type: "span", teeth: [42, 41, 31, 32], material: "zircon" },
    { id: "lower-43-33-zircon", labelKey: "statusExtras.lower43_33Zircon", type: "span", teeth: [43, 42, 41, 31, 32, 33], material: "zircon" },
    { id: "lower-46-36-zircon", labelKey: "statusExtras.lower46_36Zircon", type: "span", teeth: [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36], material: "zircon" },
    { id: "lower-full-zircon", labelKey: "statusExtras.lowerFullZircon", type: "arch-bridge", arch: "lower", material: "zircon", missingMaterial: "zircon" },
    { id: "lower-42-32-metal", labelKey: "statusExtras.lower42_32Metal", type: "span", teeth: [42, 41, 31, 32], material: "metal" },
    { id: "lower-43-33-metal", labelKey: "statusExtras.lower43_33Metal", type: "span", teeth: [43, 42, 41, 31, 32, 33], material: "metal" },
    { id: "lower-46-36-metal", labelKey: "statusExtras.lower46_36Metal", type: "span", teeth: [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36], material: "metal" },
    { id: "lower-full-metal", labelKey: "statusExtras.lowerFullMetal", type: "arch-bridge", arch: "lower", material: "metal", missingMaterial: "metal" },
    { id: "lower-partial-removable", labelKey: "statusExtras.lowerPartialRemovable", type: "partial-removable", arch: "lower" },
    { id: "lower-full-removable", labelKey: "statusExtras.lowerFullRemovable", type: "full-removable", arch: "lower" },
    { id: "lower-bar-denture", labelKey: "statusExtras.lowerBarDenture", type: "bar-denture", arch: "lower", implants: [44, 42, 32, 34], missing: [46, 45, 43, 41, 31, 33, 35, 36] }
  ]
}, t2 = {
  hu: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Válassz fogat az odontogramon, majd állítsd be a rétegeket.",
    "app.subtitleLang": "Magyar nyelven.",
    "app.subtitleNumbering.FDI": "FDI – ISO 3950 számozással.",
    "app.subtitleNumbering.UNIVERSAL": "Universal (ADA) számozással.",
    "app.subtitleNumbering.PALMER": "Palmer számozással.",
    "app.subtitleMode.light": "Világos módban.",
    "app.subtitleMode.dark": "Sötét módban.",
    "settings.toothInfo": "Fogadatok panel",
    "toothInfo.title": "Fogadatok",
    "toothInfo.overview": "Az odontogrammon {{present}}{{milk}} szerepel és {{missing}}.",
    "toothInfo.overviewImplant": "Az odontogrammon {{present}}{{milk}} szerepel, {{missing}} és {{implant}}.",
    "toothInfo.overviewMilkOnly": "Az odontogrammon {{milk}} szerepel.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} maradó fog",
    "toothInfo.presentOther": "{{n}} maradó fog",
    "toothInfo.missingOne": "{{n}} fog hiányzik",
    "toothInfo.missingOther": "{{n}} fog hiányzik",
    "toothInfo.implantOne": "{{n}} fog helyén van implantátum",
    "toothInfo.implantOther": "{{n}} fog helyén van implantátum",
    "toothInfo.milkOne": "{{n}} tejfog",
    "toothInfo.milkOther": "{{n}} tejfog",
    "toothInfo.permanentList": "maradó fogak ({{count}} db): {{list}}",
    "toothInfo.missingList": "hiánynak jelölt fogak ({{count}} db): {{list}}",
    "toothInfo.caries": "Szuvasodások",
    "toothInfo.cariesEmpty": "Nincs szuvas fog.",
    "toothInfo.secondary": "secunder",
    "toothInfo.diagnoses": "Diagnózisok",
    "toothInfo.diagnosesEmpty": "nincs rögzített diagnózis",
    "summary.severity.superficial": "felszínes",
    "summary.severity.moderate": "közepes",
    "summary.severity.deep": "mély",
    "summary.fracture": "Törés",
    "toothInfo.fillings": "Tömések",
    "toothInfo.fillingsEmpty": "Nincs tömött fog.",
    "toothInfo.endo": "Gyökérkezelések",
    "toothInfo.endoEmpty": "Nincs gyökérkezelt fog.",
    "toothInfo.resected": "rezekált fog",
    "toothInfo.prosthetics": "Fogpótlások",
    "toothInfo.prostheticsEmpty": "Nincs fogpótlás.",
    "toothInfo.implants": "Implantátumok",
    "toothInfo.periodontalTitle": "Fogágy állapota",
    "toothInfo.periodontalHealthy": "a fogágy egészséges",
    "toothInfo.periodontalInflamed": "a fogágyban a következő fogakon található gyulladás: {{list}}",
    "topbar.exportStatus": "Státusz export",
    "topbar.exportFhir": "FHIR export",
    "topbar.export": "Export",
    "export.menu.statusJson": "Státusz JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "PNG kép",
    "export.menu.jpg": "JPG kép",
    "export.menu.svg": "SVG kép",
    "export.progress.title": "Export folyamatban",
    "export.progress.preparing": "Előkészítés…",
    "export.progress.rendering": "Renderelés…",
    "export.progress.encoding": "Kódolás…",
    "export.progress.done": "Kész",
    "topbar.exportPng": "PNG export",
    "topbar.exportJpg": "JPG export",
    "topbar.importStatus": "Státusz import",
    "topbar.import": "Import",
    "import.menu.statusJson": "Státusz JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Fogászati státusz",
    "chart.hint": "Kattints egy fogra. Több fog kijelöléséhez a CMD/CTRL + kattintást válaszd.",
    "chart.actions.occlusal": "Occlusios nézet láthatósága",
    "chart.actions.wisdom": "Bölcsességfogak láthatósága",
    "chart.actions.bone": "Csont láthatósága",
    "chart.actions.pulp": "Pulpa láthatósága",
    "chart.actions.clearSelection": "Kijelölés törlése",
    "chart.aria.toothGrid": "Fog rács",
    "panel.controls": "Vezérlők",
    "panel.clearSelection": "Kijelölés törlése",
    "panel.toggleControls": "Vezérlők",
    "panel.activeTooth": "Aktív fog",
    "panel.selectActions.all": "Összes",
    "panel.selectActions.present": "Fogak",
    "panel.selectActions.permanent": "Maradók",
    "panel.selectActions.milk": "Tejfogak",
    "panel.selectActions.implants": "Implantok",
    "panel.selectActions.missing": "Hiányok",
    "panel.selectActions.upper": "Felső",
    "panel.selectActions.upperFront": "Felső 6 front",
    "panel.selectActions.upperMolar": "Felső molár",
    "panel.selectActions.lower": "Alsó",
    "panel.selectActions.lowerFront": "Alsó 6 front",
    "panel.selectActions.lowerMolar": "Alsó molár",
    "status.title": "Státuszok",
    "status.resetAll": "Szájüreg alaphelyzet",
    "status.primaryDentition": "Tejfogazat",
    "status.mixedDentition": "Vegyes fogazat",
    "status.edentulous": "Fogatlan szájüreg",
    "status.extraLabel": "Hozzáadás:",
    "status.extraApply": "OK",
    "tooth.title": "Fog jellemzői",
    "tooth.reset": "Alaphelyzet",
    "tooth.resetTitle": "Fog alaphelyzetbe állítása",
    "tooth.baseLabel": "Alap",
    "tooth.bridgeLabel": "Fogpótlás",
    "tooth.extractionWound": "friss extrakciós seb",
    "tooth.crownLabel": "Korona",
    "tooth.broken.mesial": "mesial",
    "tooth.broken.incisal": "inicisal",
    "tooth.broken.distal": "distal",
    "tooth.contact.mesialMissing": "mesial kontakt hiány",
    "tooth.contact.distalMissing": "distal kontakt hiány",
    "tooth.bruxism.edgeWear": "Éli kopás",
    "tooth.bruxism.neckWear": "Nyaki kopás",
    "wearType.none": "nincs",
    "wearType.attrition": "Attríció (koptató kopás)",
    "wearType.abrasion": "Abrázió (mechanikai)",
    "wearType.erosion": "Erózió (kémiai/sav)",
    "wearType.abfraction": "Abfrakció (feszülési lézió)",
    "discoloration.label": "Elszíneződés",
    "discoloration.none": "nincs",
    "discoloration.tetracycline": "Tetraciklin",
    "discoloration.fluorosis": "Fluorózis",
    "discoloration.nonvital": "Nem-vitális (elhalás)",
    "discoloration.extrinsic": "Külső festődés",
    "discoloration.other": "Egyéb / ismeretlen",
    "ortho.appliance.label": "Ortho készülék",
    "ortho.appliance.none": "nincs",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Gyűrű/band",
    "ortho.drift.label": "Elmozdulás",
    "ortho.drift.none": "nincs",
    "ortho.drift.mesial": "Meziális",
    "ortho.drift.distal": "Disztális",
    "ortho.vertical.label": "Függőleges",
    "ortho.vertical.none": "nincs",
    "ortho.vertical.extrusion": "Extrúzió",
    "ortho.vertical.intrusion": "Intrúzió",
    "ortho.rotation.label": "Rotáció",
    "toothInfo.discoloration": "Elszíneződés",
    "toothInfo.discolorationEmpty": "nincs rögzített elszíneződés",
    "toothInfo.wear": "Kopás",
    "toothInfo.wearEmpty": "nincs rögzített kopás",
    "toothInfo.orthodontics": "Ortodoncia",
    "toothInfo.orthodonticsEmpty": "nincs rögzített ortodonciai lelet",
    "tooth.bridgePillar": "Hídpillér",
    "tooth.extractionPlan": "Eltávolítandó",
    "tooth.crownReplace": "Cserélendő korona",
    "tooth.crownNeeded": "Koronázandó fog",
    "tooth.missingClosed": "Záródott foghiány",
    "caries.title": "Fogszuvasodás",
    "caries.hint": "Jelöld ki a szuvasodás felületeit",
    "caries.depthLabel": "Mélység",
    "caries.depth.surface": "Felületes (zománc)",
    "caries.depth.dentin": "Dentin",
    "caries.depth.deep": "Mély (pulpa közeli)",
    "filling.title": "Tömések és Konzerválás",
    "filling.typeLabel": "Típusa",
    "filling.fissureSealing": "Barázdazárt",
    "filling.subcariesSummarySingle": "{{teeth}} tömése mellett subcaries van beállítva.",
    "filling.subcariesSummaryMultiple": "{{teeth}} tömések mellett subcaries van beállítva.",
    "filling.fillingDefectSummarySingle": "{{teeth}} tömése mellett tömés-defekt van rögzítve.",
    "filling.fillingDefectSummaryMultiple": "{{teeth}} tömések mellett tömés-defektek vannak rögzítve.",
    "endo.title": "Foggyökér",
    "endo.hint": "Jelöld ki a foggyökér állapotát",
    "endo.pulpitis": "Pulpitis",
    "endo.resection": "Rezekált fog",
    "endo.parapulpalPin": "Parapulpális csap",
    "inflammation.title": "Fogágy és Gyulladások",
    "inflammation.mobilityLabel": "Mobilitás",
    "language.label": "Nyelv",
    "language.hu": "🇭🇺 Magyar",
    "language.en": "🇬🇧 English",
    "language.de": "🇩🇪 Deutsch",
    "language.es": "🇪🇸 Español",
    "language.it": "🇮🇹 Italiano",
    "language.sk": "🇸🇰 Slovenčina",
    "language.pl": "🇵🇱 Polski",
    "language.ru": "🇷🇺 Русский",
    "language.pt-br": "🇧🇷 Brazil portugál",
    "numbering.label": "Számozás",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - USA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Beállítások",
    "settings.notes": "Jegyzetek",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Zománc (szárítva)",
    "icdas.code.2": "Zománc (nedvesen)",
    "icdas.code.3": "Zománc-áttörés",
    "icdas.code.4": "Dentin árnyék",
    "icdas.code.5": "Kavitáció (dentin)",
    "icdas.code.6": "Kiterjedt kavitáció",
    "icdas.desc.1": "Első látható zománcelváltozás (csak hosszan tartó szárítás után látható)",
    "icdas.desc.2": "Kifejezett zománcelváltozás (nedvesen is látható)",
    "icdas.desc.3": "Lokalizált zománc-áttörés látható dentin nélkül",
    "icdas.desc.4": "Sötét árnyék a dentinből, zománc-áttöréssel vagy anélkül",
    "icdas.desc.5": "Kifejezett kavitáció látható dentinnel",
    "icdas.desc.6": "Kiterjedt kavitáció látható dentinnel (a felszín több mint felén)",
    "theme.light": "Világos mód",
    "theme.dark": "Sötét mód",
    "selection.none": "—",
    "selection.count": "{{count}} fog",
    "toothSelect.none": "foghiány",
    "toothSelect.permanent": "maradó fog",
    "toothSelect.milk": "tejfog",
    "toothSelect.implant": "implantátum",
    "toothSelect.crownPrep": "előkészített fog koronához",
    "toothSelect.underGum": "íny alatti fog",
    "endo.option.none": "egészséges foggyökér",
    "endo.option.medicalFilling": "gyógyszeres gyökértömés",
    "endo.option.filling": "végleges gyökértömés",
    "endo.option.incompleteFilling": "inkomplett gyökértömés",
    "endo.option.glassPin": "végleges gyökértömés, üvegszálas csappal",
    "endo.option.metalPin": "végleges gyökértömés, fémcsappal",
    "filling.option.none": "nincs tömés",
    "filling.option.amalgam": "amalgám tömés",
    "filling.option.composite": "kompozit tömés",
    "filling.option.gic": "üvegionomer tömés",
    "filling.option.temporary": "ideiglenes tömés",
    "crown.option.noneImplant": "nincs",
    "crown.option.healingAbutment": "gyógyulási csavar",
    "crown.option.zircon": "cirkon korona",
    "crown.option.metal": "fémkerámia korona",
    "crown.option.temporary": "ideiglenes korona",
    "crown.option.locator": "lokátor",
    "crown.option.locatorProsthesis": "lokátor + műfog",
    "crown.option.bar": "stéges implant",
    "crown.option.barProsthesis": "stég + műfog",
    "crown.option.full": "teljes korona",
    "crown.option.broken": "törött korona",
    "crown.option.radix": "radix",
    "crown.option.emax": "préskerámia betét",
    "crown.option.telescope": "teleszkóp korona",
    "bridge.option.none": "nincs",
    "bridge.option.removable": "kivehető fogpótlás",
    "bridge.option.zircon": "cirkon hídtag",
    "bridge.option.metal": "fémkerámia hídtag",
    "bridge.option.temporary": "ideiglenes hídtag",
    "bridge.option.bar": "stég áthidalás",
    "bridge.option.barProsthesis": "stég + műfog",
    "restoration.none": "Nincs",
    "restoration.prefix.fixed": "Fix",
    "restoration.prefix.removable": "Kivehető",
    "restoration.type.crown": "Korona",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Héj",
    "restoration.type.bridge": "Hídtag",
    "prosthesis.none": "Nincs",
    "prosthesis.type.healingAbutment": "Gyógyulási felépítmény",
    "prosthesis.type.locator": "Locator rögzítés",
    "prosthesis.type.locatorDenture": "Locator kivehető fogsor",
    "prosthesis.type.bar": "Bar rögzítés",
    "prosthesis.type.barDenture": "Bar kivehető fogsor",
    "prosthesis.type.removablePartial": "Részleges kivehető fogsor",
    "prosthesis.type.removableFull": "Teljes kivehető fogsor",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "arany",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "cirkónium",
    "restoration.material.metal": "fém",
    "restoration.material.metalCeramic": "fémkerámia",
    "restoration.material.telescope": "teleszkóp",
    "restoration.material.temporary": "ideiglenes",
    "substrate.natural": "Ép",
    "substrate.radix": "Radix",
    "substrate.broken": "Törött",
    "substrate.crownprep": "Csonk-előkészítés",
    "restoration.label": "Restauráció",
    "substrate.label": "Fog állapota",
    "mobility.none": "nincs",
    "mobility.m1": "1. fokú",
    "mobility.m2": "2. fokú",
    "mobility.m3": "3. fokú",
    "mods.parodontal": "parodontális gyulladás",
    "periImplant.label": "Peri-implant státusz",
    "periImplant.none": "Egészséges (nincs)",
    "periImplant.mucositis": "Peri-implant mucositis",
    "periImplant.periImplantitisMild": "Peri-implantitis – enyhe csontvesztés",
    "periImplant.periImplantitisModerate": "Peri-implantitis – közepes csontvesztés",
    "periImplant.periImplantitisSevere": "Peri-implantitis – súlyos csontvesztés",
    "mods.periimplantitis": "Periimplantitis",
    "mods.periodontalInflammation": "fogágygyulladás",
    "mods.periapicalInflammation": "periapikális gyulladás",
    "periapical.typeLabel": "Apikális lézió",
    "card.rootPeriodontium": "Gyökér és parodontium",
    "pulpEndo.label": "Pulpa / Endo státusz",
    "pulpEndo.groupVital": "Vitális pulpa",
    "pulpEndo.groupTreated": "Kezelt (gyökér)",
    "calculus.label": "Fogkő",
    "crownLeakage.label": "Koronaszél-szivárgás",
    "root.resorption": "Gyökérreszorpció",
    "periapical.type.none": "Nincs megadva",
    "periapical.type.granuloma": "Granuloma",
    "periapical.type.cyst": "Radikuláris ciszta",
    "periapical.type.abscess": "Tályog",
    "pulpDx.normal": "Egészséges pulpa",
    "pulpDx.reversiblePulpitis": "Reverzibilis pulpitis",
    "pulpDx.irreversiblePulpitis": "Irreverzibilis pulpitis",
    "pulpDx.necrosis": "Pulpanekrózis",
    "pulpLatin.none": "Nincs megadva",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Nincs apikális elváltozás",
    "apicalDx.symptomaticApicalPeriodontitis": "Szimptomatikus apikális periodontitis",
    "apicalDx.asymptomaticApicalPeriodontitis": "Aszimptomatikus apikális periodontitis",
    "apicalDx.acuteApicalAbscess": "Akut apikális tályog",
    "apicalDx.chronicApicalAbscess": "Krónikus apikális tályog",
    "apicalDx.condensingOsteitis": "Kondenzáló osteitis",
    "resorption.type.none": "Nincs gyökérreszorpció",
    "resorption.type.internal": "Belső gyökérreszorpció",
    "resorption.type.externalCervical": "Külső (cervikális) gyökérreszorpció",
    "pulp.level.simple": "Egyszerű",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latin",
    "pulp.dxLabel": "Pulpa diagnózis",
    "apical.dxLabel": "Apikális diagnózis",
    "pulp.level.label": "Pulpa részletesség",
    "rootCaries.none": "Nincs gyökér-caries",
    "rootCaries.active": "Aktív gyökér-caries",
    "rootCaries.arrested": "Megállt (inaktív) gyökér-caries",
    "rootCaries.activeCavitated": "Aktív, kavitált gyökér-caries",
    "rootCaries.present": "gyökér-caries",
    "radiographicDepth.none": "Nincs radiológiai mélységi adat",
    "radiographicDepth.E1": "Zománc, külső fele (E1)",
    "radiographicDepth.E2": "Zománc, belső fele (E2)",
    "radiographicDepth.D1": "Dentin, külső harmada (D1)",
    "radiographicDepth.D2": "Dentin, középső harmada (D2)",
    "radiographicDepth.D3": "Dentin, belső harmada (D3)",
    "radiographicDepth.superficial": "Felületes (E1–E2)",
    "radiographicDepth.middle": "Középső (D1)",
    "radiographicDepth.deep": "Mély (D2–D3)",
    "fillingDefect.label": "Tömés-defekt",
    "fillingDefect.none": "nincs",
    "fillingDefect.marginal": "széli defekt",
    "fillingDefect.fracture": "törés/lepattanás",
    "fillingDefect.wear": "kopott/hiányos tömés",
    "secondaryCaries.sound": "Ép",
    "secondaryCaries.initial": "Kezdeti",
    "secondaryCaries.moderate": "Mérsékelt",
    "secondaryCaries.cavitated": "Üreges",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Általános",
    "settings.tab.panels": "Panelek",
    "settings.panels.statuses": "Státuszok",
    "settings.panels.statuses.desc": "A Státuszok panel megjelenítése.",
    "settings.panels.orthodontics": "Ortodoncia",
    "settings.panels.orthodontics.desc": "Az Ortodoncia panel megjelenítése.",
    "settings.tab.toothDetails": "Fog részletek",
    "caries.rootLabel": "Gyökér-caries",
    "caries.secondaryLabel": "Szekunder caries (CARS)",
    "caries.radiographicLabel": "Radiológiai mélység",
    "caries.details": "Caries részletek",
    "caries.primaryTitle": "Caries",
    "caries.recurrentTitle": "Szekunder caries",
    "caries.recurrentHint": "Szekunder caries a tömés mellett: CARS-pontszám",
    "caries.cars.0": "Ép",
    "caries.cars.1": "Kezdeti (zománc)",
    "caries.cars.2": "Kifejezett zománc-elváltozás",
    "caries.cars.3": "Zománc-beszakadás (mérsékelt)",
    "caries.cars.4": "Dentin-árnyék",
    "caries.cars.5": "Üreg (látható dentin)",
    "caries.cars.6": "Kiterjedt üreg (üreges)",
    "caries.detailsHint": "Caries részletek: mélység, secondary, radiográfiai",
    "settings.tab.secondaryCaries": "Szekunder caries",
    "settings.tab.caries": "Caries",
    "settings.tab.pulpa": "Pulpa",
    "settings.tab.notes": "Jegyzetek",
    "settings.mode.simple": "Egyszerű",
    "settings.mode.advanced": "Részletes",
    "settings.close": "Bezárás",
    "settings.comingSoon": "Hamarosan",
    "settings.theme.label": "Megjelenés",
    "settings.exportImport.title": "Exportálás / Importálás",
    "settings.numbering.desc": "A fogtérképen használt fogszámozási rendszer.",
    "settings.language.desc": "A felület nyelve.",
    "settings.theme.desc": "Váltás világos és sötét megjelenés között.",
    "settings.exportImport.desc": "Odontogram adatok mentése vagy betöltése. Ez a szakasz fejlesztés alatt áll.",
    "settings.toothInfo.desc": "A fogadatok összegző panel megjelenítése a térkép alatt.",
    "settings.secondaryCaries.desc": "A szekunder caries (CARS) pontozó részletessége.",
    "settings.secondaryCaries.simple": "Egyszerű",
    "settings.secondaryCaries.standard": "Normál",
    "settings.secondaryCaries.full": "Teljes",
    "settings.icdas.desc": "Az ICDAS II skála (0–6) használata a 3 szintű caries skála helyett.",
    "settings.cariesDepth.label": "Caries mélység",
    "settings.cariesDepth.desc": "A caries mélységének vizuális jelölése az egyes felszíneken.",
    "settings.rootCaries.desc": "A fogankénti gyökér-caries választó részletessége.",
    "settings.rootCaries.simple": "Van / nincs",
    "settings.rootCaries.severity": "Súlyosság",
    "settings.radiographic.desc": "Radiológiai caries-mélység osztályozása az egyes felszíneken.",
    "settings.radiographic.off": "Ki",
    "settings.radiographic.threeLevel": "3 szintű",
    "settings.radiographic.detailed": "Részletes",
    "settings.pulpLevel.desc": "Mennyi részletet kínál a pulpa-diagnózis választó.",
    "settings.wearDetail.label": "Kopás részletesség",
    "settings.wearDetail.desc": "Egyszerű: igen/nem kapcsoló (koptató kopás); összetett: kopástípus élre és nyakra.",
    "settings.discolorationDetail.label": "Elszíneződés részletesség",
    "settings.discolorationDetail.desc": "Egyszerű: igen/nem kapcsoló; összetett: az elszíneződés okának megadása.",
    "settings.surfaceNotation.label": "Felszín-jelölés",
    "settings.surfaceNotation.desc": "Teljes: a felszín-betűk a fog helyzetéhez igazodnak (elülső fog: I=incizális, L=labiális; felső: P=palatinális; alsó: L=linguális). Egyszerű: mindig B/O/L, a fog helyzetétől függetlenül.",
    "settings.surfaceNotation.simple": "Egyszerű",
    "settings.surfaceNotation.full": "Teljes",
    "settings.toothDetail.simple": "Egyszerű",
    "settings.toothDetail.complex": "Összetett",
    "settings.notes.desc": "Fogankénti jegyzetek engedélyezése (dupla kattintás a szerkesztéshez).",
    "surface.mesial": "mesial",
    "surface.distal": "distal",
    "surface.buccal": "buccal",
    "surface.lingualPalatal": "lingual/palatinal",
    "surface.occlusal": "occlusal",
    "surface.incisal": "metszőéli",
    "surface.subcrown": "subcrown",
    "surface.labial": "labiális",
    "surface.palatal": "palatinális",
    "surface.lingual": "linguális",
    "actions.expand": "{{label}} kinyitása",
    "actions.collapse": "{{label}} összecsukása",
    "debug.numbering.title": "Számozás debug (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "felső 12-22 cirkon",
    "statusExtras.upper13_23Zircon": "felső 13-23 cirkon",
    "statusExtras.upper16_26Zircon": "felső 16-26 cirkon",
    "statusExtras.upperFullZircon": "felső cirkon körhíd",
    "statusExtras.upper12_22Metal": "felső 12-22 fémkerámia",
    "statusExtras.upper13_23Metal": "felső 13-23 fémkerámia",
    "statusExtras.upper16_26Metal": "felső 16-26 fémkerámia",
    "statusExtras.upperFullMetal": "felső fémkerámia körhíd",
    "statusExtras.upperPartialRemovable": "felső részleges kivehető",
    "statusExtras.upperFullRemovable": "felső teljes kivehető",
    "statusExtras.upperBarDenture": "felső stéges fogsor",
    "statusExtras.lower42_32Zircon": "alsó 42-32 cirkon",
    "statusExtras.lower43_33Zircon": "alsó 43-33 cirkon",
    "statusExtras.lower46_36Zircon": "alsó 46-36 cirkon",
    "statusExtras.lowerFullZircon": "alsó cirkon körhíd",
    "statusExtras.lower42_32Metal": "alsó 42-32 fémkerámia",
    "statusExtras.lower43_33Metal": "alsó 43-33 fémkerámia",
    "statusExtras.lower46_36Metal": "alsó 46-36 fémkerámia",
    "statusExtras.lowerFullMetal": "alsó fémkerámia körhíd",
    "statusExtras.lowerPartialRemovable": "alsó részleges kivehető",
    "statusExtras.lowerFullRemovable": "alsó teljes kivehető",
    "statusExtras.lowerBarDenture": "alsó stéges fogsor",
    "touch.zoom.title": "Fog #{{tooth}}",
    "touch.zoom.select": "Kijelölés",
    "touch.zoom.deselect": "Kijelölés törlése",
    "touch.zoom.info": "Részletek",
    "touch.zoom.close": "Bezárás",
    "touch.ctx.select": "Kijelölés",
    "touch.ctx.multiSelect": "Hozzáadás kijelöléshez",
    "touch.ctx.deselect": "Kijelölés törlése",
    "touch.ctx.reset": "Alaphelyzet",
    "touch.arch.upper": "Felső ív",
    "touch.arch.lower": "Alsó ív",
    "touch.arch.both": "Mindkettő",
    "chart.hint.touch": "Koppints egy fogra a kijelöléshez. Hosszú nyomással több lehetőség.",
    "warn.endoOnMissing": "Gyökérkezelés nem lehetséges hiányzó/implantált fogon",
    "warn.fillingOnMissing": "Tömés nem lehetséges hiányzó fogon",
    "warn.crownReplaceNoCrown": "Cserélendő korona jelölés korona nélkül",
    "warn.cariesOnMissing": "Szuvasodás nem lehetséges hiányzó fogon",
    "warn.pillarNoCrown": "Hídpillér jelölés koronaanyag nélkül",
    "warn.invalidRestorationCombo": "Érvénytelen helyreállítás típus/anyag kombináció (automatikusan javítva)",
    "readOnly.label": "Csak olvasható",
    "note.title": "Megjegyzés",
    "note.save": "Mentés",
    "note.delete": "Törlés",
    "note.placeholder": "Írj megjegyzést...",
    "intro.start": "Intro",
    "intro.next": "Tovább",
    "intro.back": "Vissza",
    "intro.skip": "Kihagyás",
    "intro.finish": "Kész",
    "intro.step1.title": "Fog kijelölése",
    "intro.step1.text": "Kattints egy fogra az odontogramon a szerkesztés megkezdéséhez.",
    "intro.step2.title": "Szuvasodás",
    "intro.step2.text": "Jelöld a szuvas felületeket a kereszt (B/M/O/D/L) elrendezésben.",
    "intro.step3.title": "Pulpitis",
    "intro.step3.text": "Kapcsold be a pulpagyulladást a kijelölt fognál.",
    "intro.step4.title": "Implantátum",
    "intro.step4.text": "Állítsd a fog típusát implantátumra a legördülőből.",
    "intro.step5.title": "Tömés",
    "intro.step5.text": "Válassz anyagot, majd jelöld a felületeket — felületenként eltérő anyag is lehet.",
    "intro.step6.title": "Korona",
    "intro.step6.text": "Válaszd ki a korona anyagát.",
    "intro.step7.title": "Jegyzet a foghoz",
    "intro.step7.text": "Dupla kattintással adhatsz megjegyzést egy foghoz.",
    "intro.step8.title": "Kiválasztási szűrők",
    "intro.step8.text": "Gyorsan jelölj ki fogcsoportokat: felső/alsó, front, molárisok.",
    "intro.step9.title": "Számozás és nyelv",
    "intro.step9.text": "Válts fogszámozási rendszert vagy nyelvet a fejlécben.",
    "intro.step10.title": "Export",
    "intro.step10.text": "Exportáld a státuszt JSON, FHIR, PNG vagy JPG formátumban.",
    "intro.step11.title": "Import",
    "intro.step11.text": "Tölts be korábbi státuszt JSON vagy FHIR formátumból.",
    "intro.step12.title": "Készen állsz!",
    "intro.step12.text": "Ennyi az alapok — fedezd fel a többi funkciót is."
  },
  en: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Select a tooth on the odontogram, then set the layers.",
    "app.subtitleLang": "In English.",
    "app.subtitleNumbering.FDI": "Using FDI – ISO 3950 numbering.",
    "app.subtitleNumbering.UNIVERSAL": "Using Universal (ADA) numbering.",
    "app.subtitleNumbering.PALMER": "Using Palmer numbering.",
    "app.subtitleMode.light": "In light mode.",
    "app.subtitleMode.dark": "In dark mode.",
    "settings.toothInfo": "Tooth information panel",
    "toothInfo.title": "Tooth information",
    "toothInfo.overview": "The odontogram shows {{present}}{{milk}} and {{missing}}.",
    "toothInfo.overviewImplant": "The odontogram shows {{present}}{{milk}}, {{missing}} and {{implant}}.",
    "toothInfo.overviewMilkOnly": "The odontogram shows {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} permanent tooth",
    "toothInfo.presentOther": "{{n}} permanent teeth",
    "toothInfo.missingOne": "{{n}} tooth is missing",
    "toothInfo.missingOther": "{{n}} teeth are missing",
    "toothInfo.implantOne": "{{n}} tooth has an implant",
    "toothInfo.implantOther": "{{n}} teeth have an implant",
    "toothInfo.milkOne": "{{n}} primary tooth",
    "toothInfo.milkOther": "{{n}} primary teeth",
    "toothInfo.permanentList": "permanent teeth ({{count}}): {{list}}",
    "toothInfo.missingList": "teeth marked missing ({{count}}): {{list}}",
    "toothInfo.caries": "Caries",
    "toothInfo.cariesEmpty": "No carious teeth.",
    "toothInfo.secondary": "secondary",
    "toothInfo.diagnoses": "Diagnoses",
    "toothInfo.diagnosesEmpty": "no recorded diagnosis",
    "summary.severity.superficial": "superficial",
    "summary.severity.moderate": "moderate",
    "summary.severity.deep": "deep",
    "summary.fracture": "Fracture",
    "toothInfo.fillings": "Fillings",
    "toothInfo.fillingsEmpty": "No filled teeth.",
    "toothInfo.endo": "Root canal treatments",
    "toothInfo.endoEmpty": "No root-treated teeth.",
    "toothInfo.resected": "resected tooth",
    "toothInfo.prosthetics": "Prosthetics",
    "toothInfo.prostheticsEmpty": "No prosthetics.",
    "toothInfo.implants": "Implants",
    "toothInfo.periodontalTitle": "Periodontal status",
    "toothInfo.periodontalHealthy": "the periodontium is healthy",
    "toothInfo.periodontalInflamed": "inflammation is present on the following teeth: {{list}}",
    "topbar.exportStatus": "Export status",
    "topbar.exportFhir": "FHIR export",
    "topbar.export": "Export",
    "export.menu.statusJson": "Status JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "PNG image",
    "export.menu.jpg": "JPG image",
    "export.menu.svg": "SVG image",
    "export.progress.title": "Export in progress",
    "export.progress.preparing": "Preparing…",
    "export.progress.rendering": "Rendering…",
    "export.progress.encoding": "Encoding…",
    "export.progress.done": "Done",
    "topbar.exportPng": "PNG export",
    "topbar.exportJpg": "JPG export",
    "topbar.importStatus": "Import status",
    "topbar.import": "Import",
    "import.menu.statusJson": "Status JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Dental chart",
    "chart.hint": "Click a tooth. For multi-select, use CMD/CTRL + click.",
    "chart.actions.occlusal": "Occlusal view visibility",
    "chart.actions.wisdom": "Wisdom teeth visibility",
    "chart.actions.bone": "Bone visibility",
    "chart.actions.pulp": "Pulp visibility",
    "chart.actions.clearSelection": "Clear selection",
    "chart.aria.toothGrid": "Tooth grid",
    "panel.controls": "Controls",
    "panel.clearSelection": "Clear selection",
    "panel.toggleControls": "Controls",
    "panel.activeTooth": "Active tooth",
    "panel.selectActions.all": "All",
    "panel.selectActions.present": "Teeth",
    "panel.selectActions.permanent": "Permanent",
    "panel.selectActions.milk": "Primary",
    "panel.selectActions.implants": "Implants",
    "panel.selectActions.missing": "Missing",
    "panel.selectActions.upper": "Upper",
    "panel.selectActions.upperFront": "Upper 6 front",
    "panel.selectActions.upperMolar": "Upper molars",
    "panel.selectActions.lower": "Lower",
    "panel.selectActions.lowerFront": "Lower 6 front",
    "panel.selectActions.lowerMolar": "Lower molars",
    "status.title": "Statuses",
    "status.resetAll": "Reset mouth",
    "status.primaryDentition": "Primary dentition",
    "status.mixedDentition": "Mixed dentition",
    "status.edentulous": "Edentulous",
    "status.extraLabel": "Add:",
    "status.extraApply": "OK",
    "tooth.title": "Tooth details",
    "tooth.reset": "Reset",
    "tooth.resetTitle": "Reset tooth to default",
    "tooth.baseLabel": "Base",
    "tooth.bridgeLabel": "Prosthesis",
    "tooth.extractionWound": "fresh extraction wound",
    "tooth.crownLabel": "Crown",
    "tooth.broken.mesial": "mesial",
    "tooth.broken.incisal": "incisal",
    "tooth.broken.distal": "distal",
    "tooth.contact.mesialMissing": "mesial contact missing",
    "tooth.contact.distalMissing": "distal contact missing",
    "tooth.bruxism.edgeWear": "Incisal wear",
    "tooth.bruxism.neckWear": "Cervical wear",
    "wearType.none": "none",
    "wearType.attrition": "Attrition (tooth-to-tooth)",
    "wearType.abrasion": "Abrasion (mechanical)",
    "wearType.erosion": "Erosion (acid)",
    "wearType.abfraction": "Abfraction",
    "discoloration.label": "Discoloration",
    "discoloration.none": "none",
    "discoloration.tetracycline": "Tetracycline staining",
    "discoloration.fluorosis": "Fluorosis",
    "discoloration.nonvital": "Non-vital darkening",
    "discoloration.extrinsic": "Extrinsic staining",
    "discoloration.other": "Other / unknown",
    "ortho.appliance.label": "Ortho appliance",
    "ortho.appliance.none": "none",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Band",
    "ortho.drift.label": "Displacement",
    "ortho.drift.none": "none",
    "ortho.drift.mesial": "Mesial",
    "ortho.drift.distal": "Distal",
    "ortho.vertical.label": "Vertical",
    "ortho.vertical.none": "none",
    "ortho.vertical.extrusion": "Extrusion",
    "ortho.vertical.intrusion": "Intrusion",
    "ortho.rotation.label": "Rotation",
    "toothInfo.discoloration": "Discoloration",
    "toothInfo.discolorationEmpty": "no recorded discoloration",
    "toothInfo.wear": "Wear",
    "toothInfo.wearEmpty": "no recorded wear",
    "toothInfo.orthodontics": "Orthodontics",
    "toothInfo.orthodonticsEmpty": "no recorded orthodontic finding",
    "tooth.bridgePillar": "Bridge abutment",
    "tooth.extractionPlan": "Planned extraction",
    "tooth.crownReplace": "Crown replacement",
    "tooth.crownNeeded": "Crown needed",
    "tooth.missingClosed": "Closed gap",
    "caries.title": "Caries",
    "caries.hint": "Select caries surfaces",
    "caries.depthLabel": "Depth",
    "caries.depth.surface": "Superficial (enamel)",
    "caries.depth.dentin": "Dentin",
    "caries.depth.deep": "Deep (near pulp)",
    "filling.title": "Fillings and restorative",
    "filling.typeLabel": "Type",
    "filling.fissureSealing": "Fissure sealing",
    "filling.subcariesSummarySingle": "{{teeth}} has subcaries set next to its filling.",
    "filling.subcariesSummaryMultiple": "{{teeth}} have subcaries set next to their fillings.",
    "filling.fillingDefectSummarySingle": "{{teeth}} has a filling defect recorded.",
    "filling.fillingDefectSummaryMultiple": "{{teeth}} have filling defects recorded.",
    "endo.title": "Root",
    "endo.hint": "Select root status",
    "endo.pulpitis": "Pulpitis",
    "endo.resection": "Resected tooth",
    "endo.parapulpalPin": "Parapulpal pin",
    "inflammation.title": "Periodontium and inflammations",
    "inflammation.mobilityLabel": "Mobility",
    "language.label": "Language",
    "language.hu": "🇭🇺 Hungarian",
    "language.en": "🇬🇧 English",
    "language.de": "🇩🇪 German",
    "language.es": "🇪🇸 Spanish",
    "language.it": "🇮🇹 Italian",
    "language.sk": "🇸🇰 Slovak",
    "language.pl": "🇵🇱 Polish",
    "language.ru": "🇷🇺 Russian",
    "language.pt-br": "🇧🇷 Brazilian Portuguese",
    "numbering.label": "Numbering",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - USA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Settings",
    "settings.notes": "Notes",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Enamel change (dry)",
    "icdas.code.2": "Enamel change (wet)",
    "icdas.code.3": "Enamel breakdown",
    "icdas.code.4": "Dentin shadow",
    "icdas.code.5": "Distinct cavity (dentin)",
    "icdas.code.6": "Extensive cavity",
    "icdas.desc.1": "First visual change in enamel (seen only after prolonged air drying)",
    "icdas.desc.2": "Distinct visual change in enamel (visible when wet)",
    "icdas.desc.3": "Localized enamel breakdown without visible dentin",
    "icdas.desc.4": "Underlying dark shadow from dentin, with or without enamel breakdown",
    "icdas.desc.5": "Distinct cavity with visible dentin",
    "icdas.desc.6": "Extensive distinct cavity with visible dentin (more than half the surface)",
    "theme.light": "Light mode",
    "theme.dark": "Dark mode",
    "selection.none": "—",
    "selection.count": "{{count}} teeth",
    "toothSelect.none": "Missing tooth",
    "toothSelect.permanent": "Permanent tooth",
    "toothSelect.milk": "Primary tooth",
    "toothSelect.implant": "Implant",
    "toothSelect.crownPrep": "Prepared for crown",
    "toothSelect.underGum": "Subgingival tooth",
    "endo.option.none": "Healthy root",
    "endo.option.medicalFilling": "Medicinal root filling",
    "endo.option.filling": "Root filling",
    "endo.option.incompleteFilling": "Incomplete root filling",
    "endo.option.glassPin": "Root filling with glass fiber post",
    "endo.option.metalPin": "Root filling with metal post",
    "filling.option.none": "No filling",
    "filling.option.amalgam": "Amalgam filling",
    "filling.option.composite": "Composite filling",
    "filling.option.gic": "Glass ionomer filling",
    "filling.option.temporary": "Temporary filling",
    "crown.option.noneImplant": "None",
    "crown.option.healingAbutment": "Healing abutment",
    "crown.option.zircon": "Zirconia crown",
    "crown.option.metal": "Metal-ceramic crown",
    "crown.option.temporary": "Temporary crown",
    "crown.option.locator": "Locator",
    "crown.option.locatorProsthesis": "Locator + denture tooth",
    "crown.option.bar": "Bar implant",
    "crown.option.barProsthesis": "Bar + denture tooth",
    "crown.option.full": "Full crown",
    "crown.option.broken": "Broken crown",
    "crown.option.radix": "Radix",
    "crown.option.emax": "Pressed ceramic inlay",
    "crown.option.telescope": "Telescopic crown",
    "bridge.option.none": "None",
    "bridge.option.removable": "Removable prosthesis",
    "bridge.option.zircon": "Zirconia bridge unit",
    "bridge.option.metal": "Metal-ceramic bridge unit",
    "bridge.option.temporary": "Temporary bridge unit",
    "bridge.option.bar": "Bar span",
    "bridge.option.barProsthesis": "Bar + denture tooth",
    "restoration.none": "None",
    "restoration.prefix.fixed": "Fixed",
    "restoration.prefix.removable": "Removable",
    "restoration.type.crown": "Crown",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Veneer",
    "restoration.type.bridge": "Bridge unit",
    "prosthesis.none": "None",
    "prosthesis.type.healingAbutment": "Healing abutment",
    "prosthesis.type.locator": "Locator attachment",
    "prosthesis.type.locatorDenture": "Locator overdenture",
    "prosthesis.type.bar": "Bar attachment",
    "prosthesis.type.barDenture": "Bar overdenture",
    "prosthesis.type.removablePartial": "Partial removable denture",
    "prosthesis.type.removableFull": "Full removable denture",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "gold",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "zirconia",
    "restoration.material.metal": "metal",
    "restoration.material.metalCeramic": "Metal-ceramic",
    "restoration.material.telescope": "telescopic",
    "restoration.material.temporary": "temporary",
    "substrate.natural": "Sound",
    "substrate.radix": "Radix",
    "substrate.broken": "Broken",
    "substrate.crownprep": "Prepared for crown",
    "restoration.label": "Restoration",
    "substrate.label": "Tooth condition",
    "mobility.none": "None",
    "mobility.m1": "Grade 1",
    "mobility.m2": "Grade 2",
    "mobility.m3": "Grade 3",
    "mods.parodontal": "Periodontal inflammation",
    "periImplant.label": "Peri-implant status",
    "periImplant.none": "Healthy (none)",
    "periImplant.mucositis": "Peri-implant mucositis",
    "periImplant.periImplantitisMild": "Peri-implantitis – mild bone loss",
    "periImplant.periImplantitisModerate": "Peri-implantitis – moderate bone loss",
    "periImplant.periImplantitisSevere": "Peri-implantitis – severe bone loss",
    "mods.periimplantitis": "Peri-implantitis",
    "mods.periodontalInflammation": "Periodontal inflammation",
    "mods.periapicalInflammation": "Periapical inflammation",
    "periapical.typeLabel": "Apical lesion",
    "card.rootPeriodontium": "Root and periodontium",
    "pulpEndo.label": "Pulp / Endo status",
    "pulpEndo.groupVital": "Vital pulp",
    "pulpEndo.groupTreated": "Treated (endo)",
    "calculus.label": "Calculus",
    "crownLeakage.label": "Crown marginal leakage",
    "root.resorption": "Root resorption",
    "periapical.type.none": "Not specified",
    "periapical.type.granuloma": "Granuloma",
    "periapical.type.cyst": "Radicular cyst",
    "periapical.type.abscess": "Abscess",
    "pulpDx.normal": "Normal",
    "pulpDx.reversiblePulpitis": "Reversible pulpitis",
    "pulpDx.irreversiblePulpitis": "Irreversible pulpitis",
    "pulpDx.necrosis": "Necrosis",
    "pulpLatin.none": "Not specified",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "No apical pathology",
    "apicalDx.symptomaticApicalPeriodontitis": "Symptomatic apical periodontitis",
    "apicalDx.asymptomaticApicalPeriodontitis": "Asymptomatic apical periodontitis",
    "apicalDx.acuteApicalAbscess": "Acute apical abscess",
    "apicalDx.chronicApicalAbscess": "Chronic apical abscess",
    "apicalDx.condensingOsteitis": "Condensing osteitis",
    "resorption.type.none": "No root resorption",
    "resorption.type.internal": "Internal root resorption",
    "resorption.type.externalCervical": "External (cervical) root resorption",
    "pulp.level.simple": "Simple",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latin",
    "pulp.dxLabel": "Pulp diagnosis",
    "apical.dxLabel": "Apical diagnosis",
    "pulp.level.label": "Pulp detail level",
    "rootCaries.none": "No root caries",
    "rootCaries.active": "Active root caries",
    "rootCaries.arrested": "Arrested root caries",
    "rootCaries.activeCavitated": "Active cavitated root caries",
    "rootCaries.present": "root caries",
    "radiographicDepth.none": "No radiographic depth recorded",
    "radiographicDepth.E1": "Enamel, outer half (E1)",
    "radiographicDepth.E2": "Enamel, inner half (E2)",
    "radiographicDepth.D1": "Dentin, outer third (D1)",
    "radiographicDepth.D2": "Dentin, middle third (D2)",
    "radiographicDepth.D3": "Dentin, inner third (D3)",
    "radiographicDepth.superficial": "Superficial (E1–E2)",
    "radiographicDepth.middle": "Middle (D1)",
    "radiographicDepth.deep": "Deep (D2–D3)",
    "fillingDefect.label": "Filling defect",
    "fillingDefect.none": "none",
    "fillingDefect.marginal": "marginal defect",
    "fillingDefect.fracture": "fracture / chip",
    "fillingDefect.wear": "worn / deficient",
    "secondaryCaries.sound": "Sound",
    "secondaryCaries.initial": "Initial",
    "secondaryCaries.moderate": "Moderate",
    "secondaryCaries.cavitated": "Cavitated",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "General",
    "settings.tab.panels": "Panels",
    "settings.panels.statuses": "Statuses",
    "settings.panels.statuses.desc": "Show the Statuses panel.",
    "settings.panels.orthodontics": "Orthodontics",
    "settings.panels.orthodontics.desc": "Show the Orthodontics panel.",
    "settings.tab.toothDetails": "Tooth details",
    "caries.rootLabel": "Root caries",
    "caries.secondaryLabel": "Secondary caries (CARS)",
    "caries.radiographicLabel": "Radiographic depth",
    "caries.details": "Caries details",
    "caries.primaryTitle": "Caries",
    "caries.recurrentTitle": "Recurrent caries",
    "caries.recurrentHint": "Recurrent caries next to the filling: CARS score",
    "caries.cars.0": "Sound",
    "caries.cars.1": "First visual change in enamel",
    "caries.cars.2": "Distinct visual change in enamel",
    "caries.cars.3": "Localized enamel breakdown (no dentin)",
    "caries.cars.4": "Underlying dentin shadow",
    "caries.cars.5": "Distinct cavity, visible dentin",
    "caries.cars.6": "Extensive cavity",
    "caries.detailsHint": "Caries details: depth, secondary, radiographic",
    "settings.tab.secondaryCaries": "Secondary caries",
    "settings.tab.caries": "Caries",
    "settings.tab.pulpa": "Pulp",
    "settings.tab.notes": "Notes",
    "settings.mode.simple": "Simple",
    "settings.mode.advanced": "Advanced",
    "settings.close": "Close",
    "settings.comingSoon": "Coming soon",
    "settings.theme.label": "Appearance",
    "settings.exportImport.title": "Export / Import",
    "settings.numbering.desc": "Tooth numbering system used across the chart.",
    "settings.language.desc": "Interface language.",
    "settings.theme.desc": "Switch between light and dark appearance.",
    "settings.exportImport.desc": "Save or load odontogram data. This section is under development.",
    "settings.toothInfo.desc": "Show the tooth-information summary panel below the chart.",
    "settings.secondaryCaries.desc": "Detail level for the secondary-caries (CARS) score picker.",
    "settings.secondaryCaries.simple": "Simple",
    "settings.secondaryCaries.standard": "Standard",
    "settings.secondaryCaries.full": "Full",
    "settings.icdas.desc": "Use the ICDAS II scale (0–6) instead of the 3-level caries scale.",
    "settings.cariesDepth.label": "Caries depth",
    "settings.cariesDepth.desc": "Encode caries depth visually on each surface.",
    "settings.rootCaries.desc": "Detail level for the per-tooth root-caries picker.",
    "settings.rootCaries.simple": "Present / absent",
    "settings.rootCaries.severity": "Severity",
    "settings.radiographic.desc": "Radiographic caries-depth grading on each surface.",
    "settings.radiographic.off": "Off",
    "settings.radiographic.threeLevel": "3-level",
    "settings.radiographic.detailed": "Detailed",
    "settings.pulpLevel.desc": "How much detail the pulp-diagnosis picker offers.",
    "settings.wearDetail.label": "Wear detail",
    "settings.wearDetail.desc": "Simple: yes/no toggle (attrition); complex: wear type per edge and cervix.",
    "settings.discolorationDetail.label": "Discoloration detail",
    "settings.discolorationDetail.desc": "Simple: yes/no toggle; complex: choose the discoloration cause.",
    "settings.surfaceNotation.label": "Surface notation",
    "settings.surfaceNotation.desc": "Full: surface letters adapt to tooth position (front tooth: I=incisal, L=labial; upper: P=palatal; lower: L=lingual). Simple: always B/O/L regardless of position.",
    "settings.surfaceNotation.simple": "Simple",
    "settings.surfaceNotation.full": "Full",
    "settings.toothDetail.simple": "Simple",
    "settings.toothDetail.complex": "Complex",
    "settings.notes.desc": "Enable per-tooth notes (double-click a tooth to edit).",
    "surface.mesial": "mesial",
    "surface.distal": "distal",
    "surface.buccal": "buccal",
    "surface.lingualPalatal": "lingual/palatal",
    "surface.occlusal": "occlusal",
    "surface.incisal": "incisal",
    "surface.subcrown": "subcrown",
    "surface.labial": "labial",
    "surface.palatal": "palatal",
    "surface.lingual": "lingual",
    "actions.expand": "Open {{label}}",
    "actions.collapse": "Collapse {{label}}",
    "debug.numbering.title": "Numbering debug (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Upper 12-22 zirconia",
    "statusExtras.upper13_23Zircon": "Upper 13-23 zirconia",
    "statusExtras.upper16_26Zircon": "Upper 16-26 zirconia",
    "statusExtras.upperFullZircon": "Upper full zirconia bridge",
    "statusExtras.upper12_22Metal": "Upper 12-22 metal-ceramic",
    "statusExtras.upper13_23Metal": "Upper 13-23 metal-ceramic",
    "statusExtras.upper16_26Metal": "Upper 16-26 metal-ceramic",
    "statusExtras.upperFullMetal": "Upper full metal-ceramic bridge",
    "statusExtras.upperPartialRemovable": "Upper partial removable",
    "statusExtras.upperFullRemovable": "Upper full removable",
    "statusExtras.upperBarDenture": "Upper bar denture",
    "statusExtras.lower42_32Zircon": "Lower 42-32 zirconia",
    "statusExtras.lower43_33Zircon": "Lower 43-33 zirconia",
    "statusExtras.lower46_36Zircon": "Lower 46-36 zirconia",
    "statusExtras.lowerFullZircon": "Lower full zirconia bridge",
    "statusExtras.lower42_32Metal": "Lower 42-32 metal-ceramic",
    "statusExtras.lower43_33Metal": "Lower 43-33 metal-ceramic",
    "statusExtras.lower46_36Metal": "Lower 46-36 metal-ceramic",
    "statusExtras.lowerFullMetal": "Lower full metal-ceramic bridge",
    "statusExtras.lowerPartialRemovable": "Lower partial removable",
    "statusExtras.lowerFullRemovable": "Lower full removable",
    "statusExtras.lowerBarDenture": "Lower bar denture",
    "touch.zoom.title": "Tooth #{{tooth}}",
    "touch.zoom.select": "Select",
    "touch.zoom.deselect": "Deselect",
    "touch.zoom.info": "Details",
    "touch.zoom.close": "Close",
    "touch.ctx.select": "Select",
    "touch.ctx.multiSelect": "Add to selection",
    "touch.ctx.deselect": "Deselect",
    "touch.ctx.reset": "Reset",
    "touch.arch.upper": "Upper arch",
    "touch.arch.lower": "Lower arch",
    "touch.arch.both": "Both",
    "chart.hint.touch": "Tap a tooth to select it. Long-press for more options.",
    "warn.endoOnMissing": "Root treatment not possible on missing/implant tooth",
    "warn.fillingOnMissing": "Filling not possible on missing tooth",
    "warn.crownReplaceNoCrown": "Crown replacement flag set without a crown",
    "warn.cariesOnMissing": "Caries not possible on missing tooth",
    "warn.pillarNoCrown": "Bridge pillar flag set without crown material",
    "warn.invalidRestorationCombo": "Invalid restoration type/material combination (auto-corrected)",
    "readOnly.label": "Read-only",
    "note.title": "Note",
    "note.save": "Save",
    "note.delete": "Delete",
    "note.placeholder": "Add a note...",
    "intro.start": "Intro",
    "intro.next": "Next",
    "intro.back": "Back",
    "intro.skip": "Skip",
    "intro.finish": "Done",
    "intro.step1.title": "Select a tooth",
    "intro.step1.text": "Click a tooth on the chart to start editing.",
    "intro.step2.title": "Caries",
    "intro.step2.text": "Mark carious surfaces in the cross (B/M/O/D/L) layout.",
    "intro.step3.title": "Pulpitis",
    "intro.step3.text": "Toggle pulp inflammation on the selected tooth.",
    "intro.step4.title": "Implant",
    "intro.step4.text": "Set the tooth type to implant from the dropdown.",
    "intro.step5.title": "Filling",
    "intro.step5.text": "Pick a material, then mark surfaces — each surface can have its own material.",
    "intro.step6.title": "Crown",
    "intro.step6.text": "Choose the crown material.",
    "intro.step7.title": "Tooth note",
    "intro.step7.text": "Double-click a tooth to add a note.",
    "intro.step8.title": "Selection filters",
    "intro.step8.text": "Quickly select tooth groups: upper/lower, front, molars.",
    "intro.step9.title": "Numbering & language",
    "intro.step9.text": "Switch the numbering system or language in the header.",
    "intro.step10.title": "Export",
    "intro.step10.text": "Export the chart as JSON, FHIR, PNG or JPG.",
    "intro.step11.title": "Import",
    "intro.step11.text": "Load a previous chart from JSON or FHIR.",
    "intro.step12.title": "You're ready!",
    "intro.step12.text": "That's the basics — explore the rest of the features."
  },
  de: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Wähle einen Zahn im Odontogramm und stelle dann die Ebenen ein.",
    "app.subtitleLang": "Auf Deutsch.",
    "app.subtitleNumbering.FDI": "Mit FDI – ISO 3950 Nummerierung.",
    "app.subtitleNumbering.UNIVERSAL": "Mit Universal (ADA) Nummerierung.",
    "app.subtitleNumbering.PALMER": "Mit Palmer Nummerierung.",
    "app.subtitleMode.light": "Im hellen Modus.",
    "app.subtitleMode.dark": "Im dunklen Modus.",
    "settings.toothInfo": "Zahninformationen-Panel",
    "toothInfo.title": "Zahninformationen",
    "toothInfo.overview": "Das Odontogramm zeigt {{present}}{{milk}} und {{missing}}.",
    "toothInfo.overviewImplant": "Das Odontogramm zeigt {{present}}{{milk}}, {{missing}} und {{implant}}.",
    "toothInfo.overviewMilkOnly": "Das Odontogramm zeigt {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} bleibender Zahn",
    "toothInfo.presentOther": "{{n}} bleibende Zähne",
    "toothInfo.missingOne": "{{n}} Zahn fehlt",
    "toothInfo.missingOther": "{{n}} Zähne fehlen",
    "toothInfo.implantOne": "{{n}} Zahn hat ein Implantat",
    "toothInfo.implantOther": "{{n}} Zähne haben ein Implantat",
    "toothInfo.milkOne": "{{n}} Milchzahn",
    "toothInfo.milkOther": "{{n}} Milchzähne",
    "toothInfo.permanentList": "bleibende Zähne ({{count}}): {{list}}",
    "toothInfo.missingList": "als fehlend markierte Zähne ({{count}}): {{list}}",
    "toothInfo.caries": "Karies",
    "toothInfo.cariesEmpty": "Keine kariösen Zähne.",
    "toothInfo.secondary": "sekundär",
    "toothInfo.diagnoses": "Diagnosen",
    "toothInfo.diagnosesEmpty": "keine Diagnose erfasst",
    "summary.severity.superficial": "oberflächlich",
    "summary.severity.moderate": "mittel",
    "summary.severity.deep": "tief",
    "summary.fracture": "Fraktur",
    "toothInfo.fillings": "Füllungen",
    "toothInfo.fillingsEmpty": "Keine gefüllten Zähne.",
    "toothInfo.endo": "Wurzelbehandlungen",
    "toothInfo.endoEmpty": "Keine wurzelbehandelten Zähne.",
    "toothInfo.resected": "resezierter Zahn",
    "toothInfo.prosthetics": "Zahnersatz",
    "toothInfo.prostheticsEmpty": "Kein Zahnersatz.",
    "toothInfo.implants": "Implantate",
    "toothInfo.periodontalTitle": "Parodontaler Status",
    "toothInfo.periodontalHealthy": "das Parodontium ist gesund",
    "toothInfo.periodontalInflamed": "an folgenden Zähnen liegt eine Entzündung vor: {{list}}",
    "topbar.exportStatus": "Status exportieren",
    "topbar.exportFhir": "FHIR-Export",
    "topbar.export": "Export",
    "export.menu.statusJson": "Status JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "PNG-Bild",
    "export.menu.jpg": "JPG-Bild",
    "export.menu.svg": "SVG-Bild",
    "export.progress.title": "Export läuft",
    "export.progress.preparing": "Vorbereitung…",
    "export.progress.rendering": "Rendern…",
    "export.progress.encoding": "Kodierung…",
    "export.progress.done": "Fertig",
    "topbar.exportPng": "PNG-Export",
    "topbar.exportJpg": "JPG-Export",
    "topbar.importStatus": "Status importieren",
    "topbar.import": "Import",
    "import.menu.statusJson": "Status JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Zahnstatus",
    "chart.hint": "Klicke einen Zahn an. Für Mehrfachauswahl CMD/CTRL + Klick verwenden.",
    "chart.actions.occlusal": "Okklusionsansicht anzeigen",
    "chart.actions.wisdom": "Sichtbarkeit der Weisheitszähne",
    "chart.actions.bone": "Knochen anzeigen",
    "chart.actions.pulp": "Pulpa anzeigen",
    "chart.actions.clearSelection": "Auswahl löschen",
    "chart.aria.toothGrid": "Zahngitter",
    "panel.controls": "Steuerung",
    "panel.clearSelection": "Auswahl löschen",
    "panel.toggleControls": "Steuerung",
    "panel.activeTooth": "Aktiver Zahn",
    "panel.selectActions.all": "Alle",
    "panel.selectActions.present": "Zähne",
    "panel.selectActions.permanent": "Bleibend",
    "panel.selectActions.milk": "Milchzähne",
    "panel.selectActions.implants": "Implantate",
    "panel.selectActions.missing": "Fehlend",
    "panel.selectActions.upper": "Oberkiefer",
    "panel.selectActions.upperFront": "Oberkiefer Front 6",
    "panel.selectActions.upperMolar": "Oberkiefer Molaren",
    "panel.selectActions.lower": "Unterkiefer",
    "panel.selectActions.lowerFront": "Unterkiefer Front 6",
    "panel.selectActions.lowerMolar": "Unterkiefer Molaren",
    "status.title": "Status",
    "status.resetAll": "Mund zurücksetzen",
    "status.primaryDentition": "Milchgebiss",
    "status.mixedDentition": "Wechselgebiss",
    "status.edentulous": "Zahnlos",
    "status.extraLabel": "Hinzufügen:",
    "status.extraApply": "OK",
    "tooth.title": "Zahndetails",
    "tooth.reset": "Zurücksetzen",
    "tooth.resetTitle": "Zahn auf Standard zurücksetzen",
    "tooth.baseLabel": "Basis",
    "tooth.bridgeLabel": "Prothese",
    "tooth.extractionWound": "frische Extraktionswunde",
    "tooth.crownLabel": "Krone",
    "tooth.broken.mesial": "mesial",
    "tooth.broken.incisal": "inzisal",
    "tooth.broken.distal": "distal",
    "tooth.contact.mesialMissing": "mesialer Kontakt fehlt",
    "tooth.contact.distalMissing": "distaler Kontakt fehlt",
    "tooth.bruxism.edgeWear": "Inzisalabrieb",
    "tooth.bruxism.neckWear": "Zervikaler Abrieb",
    "wearType.none": "keiner",
    "wearType.attrition": "Attrition",
    "wearType.abrasion": "Abrasion",
    "wearType.erosion": "Erosion",
    "wearType.abfraction": "Abfraktion",
    "discoloration.label": "Verfärbung",
    "discoloration.none": "keine",
    "discoloration.tetracycline": "Tetrazyklin-Verfärbung",
    "discoloration.fluorosis": "Fluorose",
    "discoloration.nonvital": "Nicht-vitale Verfärbung",
    "discoloration.extrinsic": "Extrinsische Verfärbung",
    "discoloration.other": "Andere / unbekannt",
    "ortho.appliance.label": "KFO-Apparatur",
    "ortho.appliance.none": "keine",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Band",
    "ortho.drift.label": "Verschiebung",
    "ortho.drift.none": "keine",
    "ortho.drift.mesial": "Mesial",
    "ortho.drift.distal": "Distal",
    "ortho.vertical.label": "Vertikal",
    "ortho.vertical.none": "keine",
    "ortho.vertical.extrusion": "Extrusion",
    "ortho.vertical.intrusion": "Intrusion",
    "ortho.rotation.label": "Rotation",
    "toothInfo.discoloration": "Verfärbung",
    "toothInfo.discolorationEmpty": "keine Verfärbung erfasst",
    "toothInfo.wear": "Abnutzung",
    "toothInfo.wearEmpty": "keine Abnutzung erfasst",
    "toothInfo.orthodontics": "Kieferorthopädie",
    "toothInfo.orthodonticsEmpty": "kein kieferorthopädischer Befund erfasst",
    "tooth.bridgePillar": "Brückenpfeiler",
    "tooth.extractionPlan": "Entfernen geplant",
    "tooth.crownReplace": "Kronenwechsel",
    "tooth.crownNeeded": "Krone erforderlich",
    "tooth.missingClosed": "Geschlossene Lücke",
    "caries.title": "Karies",
    "caries.hint": "Kariesflächen auswählen",
    "caries.depthLabel": "Tiefe",
    "caries.depth.surface": "Oberflächlich (Schmelz)",
    "caries.depth.dentin": "Dentin",
    "caries.depth.deep": "Tief (pulpanah)",
    "filling.title": "Füllungen und Konservierung",
    "filling.typeLabel": "Typ",
    "filling.fissureSealing": "Fissurenversiegelung",
    "filling.subcariesSummarySingle": "Bei {{teeth}} ist subcaries neben der Füllung eingestellt.",
    "filling.subcariesSummaryMultiple": "Bei {{teeth}} ist subcaries neben den Füllungen eingestellt.",
    "filling.fillingDefectSummarySingle": "Bei {{teeth}} ist ein Füllungsdefekt erfasst.",
    "filling.fillingDefectSummaryMultiple": "Bei {{teeth}} sind Füllungsdefekte erfasst.",
    "endo.title": "Wurzel",
    "endo.hint": "Wurzelstatus auswählen",
    "endo.pulpitis": "Pulpitis",
    "endo.resection": "Resezierter Zahn",
    "endo.parapulpalPin": "Parapulpaler Stift",
    "inflammation.title": "Parodontium und Entzündungen",
    "inflammation.mobilityLabel": "Mobilität",
    "language.label": "Sprache",
    "language.hu": "🇭🇺 Ungarisch",
    "language.en": "🇬🇧 Englisch",
    "language.de": "🇩🇪 Deutsch",
    "language.es": "🇪🇸 Spanisch",
    "language.it": "🇮🇹 Italienisch",
    "language.sk": "🇸🇰 Slowakisch",
    "language.pl": "🇵🇱 Polnisch",
    "language.ru": "🇷🇺 Russisch",
    "language.pt-br": "🇧🇷 Brasilianisches Portugiesisch",
    "numbering.label": "Nummerierung",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - USA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Einstellungen",
    "settings.notes": "Notizen",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Schmelz (getrocknet)",
    "icdas.code.2": "Schmelz (feucht)",
    "icdas.code.3": "Schmelzeinbruch",
    "icdas.code.4": "Dentinschatten",
    "icdas.code.5": "Kavität (Dentin)",
    "icdas.code.6": "Ausgedehnte Kavität",
    "icdas.desc.1": "Erste sichtbare Schmelzveränderung (nur nach längerem Trocknen sichtbar)",
    "icdas.desc.2": "Deutliche Schmelzveränderung (auch im feuchten Zustand sichtbar)",
    "icdas.desc.3": "Lokalisierter Schmelzeinbruch ohne sichtbares Dentin",
    "icdas.desc.4": "Dunkler Schatten aus dem Dentin, mit oder ohne Schmelzeinbruch",
    "icdas.desc.5": "Deutliche Kavität mit sichtbarem Dentin",
    "icdas.desc.6": "Ausgedehnte Kavität mit sichtbarem Dentin (mehr als die Hälfte der Fläche)",
    "theme.light": "Hellmodus",
    "theme.dark": "Dunkelmodus",
    "selection.none": "—",
    "selection.count": "{{count}} Zähne",
    "toothSelect.none": "Fehlender Zahn",
    "toothSelect.permanent": "Bleibender Zahn",
    "toothSelect.milk": "Milchzahn",
    "toothSelect.implant": "Implantat",
    "toothSelect.crownPrep": "Für Krone präpariert",
    "toothSelect.underGum": "Subgingivaler Zahn",
    "endo.option.none": "Gesunde Wurzel",
    "endo.option.medicalFilling": "Medikamentöse Wurzelfüllung",
    "endo.option.filling": "Wurzelfüllung",
    "endo.option.incompleteFilling": "Inkomplette Wurzelfüllung",
    "endo.option.glassPin": "Wurzelfüllung mit Glasfaserstift",
    "endo.option.metalPin": "Wurzelfüllung mit Metallstift",
    "filling.option.none": "Keine Füllung",
    "filling.option.amalgam": "Amalgamfüllung",
    "filling.option.composite": "Kompositfüllung",
    "filling.option.gic": "Glasionomerfüllung",
    "filling.option.temporary": "Provisorische Füllung",
    "crown.option.noneImplant": "Keine",
    "crown.option.healingAbutment": "Heilabutment",
    "crown.option.zircon": "Zirkonkrone",
    "crown.option.metal": "Metallkeramikkrone",
    "crown.option.temporary": "Provisorische Krone",
    "crown.option.locator": "Locator",
    "crown.option.locatorProsthesis": "Locator + Prothesenzahn",
    "crown.option.bar": "Stegimplantat",
    "crown.option.barProsthesis": "Steg + Prothesenzahn",
    "crown.option.full": "Vollkrone",
    "crown.option.broken": "Gebrochene Krone",
    "crown.option.radix": "Radix",
    "crown.option.emax": "Presskeramik-Inlay",
    "crown.option.telescope": "Teleskopkrone",
    "bridge.option.none": "Keine",
    "bridge.option.removable": "Herausnehmbare Prothese",
    "bridge.option.zircon": "Zirkonbrückenglied",
    "bridge.option.metal": "Metallkeramik-Brückenglied",
    "bridge.option.temporary": "Provisorisches Brückenglied",
    "bridge.option.bar": "Stegüberbrückung",
    "bridge.option.barProsthesis": "Steg + Prothesenzahn",
    "restoration.none": "Keine",
    "restoration.prefix.fixed": "Fest",
    "restoration.prefix.removable": "Herausnehmbar",
    "restoration.type.crown": "Krone",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Veneer",
    "restoration.type.bridge": "Brückenglied",
    "prosthesis.none": "Keine",
    "prosthesis.type.healingAbutment": "Einheilkappe",
    "prosthesis.type.locator": "Locator-Attachment",
    "prosthesis.type.locatorDenture": "Locator-Deckprothese",
    "prosthesis.type.bar": "Steg-Attachment",
    "prosthesis.type.barDenture": "Stegdeckprothese",
    "prosthesis.type.removablePartial": "Herausnehmbare Teilprothese",
    "prosthesis.type.removableFull": "Herausnehmbare Totalprothese",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "Gold",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "Zirkon",
    "restoration.material.metal": "Metall",
    "restoration.material.metalCeramic": "Metallkeramik",
    "restoration.material.telescope": "Teleskop",
    "restoration.material.temporary": "provisorisch",
    "substrate.natural": "Intakt",
    "substrate.radix": "Radix",
    "substrate.broken": "Abgebrochen",
    "substrate.crownprep": "Kronenpräparation",
    "restoration.label": "Restauration",
    "substrate.label": "Zahnzustand",
    "mobility.none": "Keine",
    "mobility.m1": "Grad 1",
    "mobility.m2": "Grad 2",
    "mobility.m3": "Grad 3",
    "mods.parodontal": "Parodontale Entzündung",
    "periImplant.label": "Peri-implantärer Status",
    "periImplant.none": "Gesund (keine)",
    "periImplant.mucositis": "Periimplantäre Mukositis",
    "periImplant.periImplantitisMild": "Periimplantitis – geringer Knochenverlust",
    "periImplant.periImplantitisModerate": "Periimplantitis – mäßiger Knochenverlust",
    "periImplant.periImplantitisSevere": "Periimplantitis – schwerer Knochenverlust",
    "mods.periimplantitis": "Periimplantitis",
    "mods.periodontalInflammation": "Parodontale Entzündung",
    "mods.periapicalInflammation": "Periapikale Entzündung",
    "periapical.typeLabel": "Apikale Läsion",
    "card.rootPeriodontium": "Wurzel und Parodontium",
    "pulpEndo.label": "Pulpa / Endo-Status",
    "pulpEndo.groupVital": "Vitale Pulpa",
    "pulpEndo.groupTreated": "Behandelt (Endo)",
    "calculus.label": "Zahnstein",
    "crownLeakage.label": "Kronenrand-Undichtigkeit",
    "root.resorption": "Wurzelresorption",
    "periapical.type.none": "Nicht angegeben",
    "periapical.type.granuloma": "Granulom",
    "periapical.type.cyst": "Radikuläre Zyste",
    "periapical.type.abscess": "Abszess",
    "pulpDx.normal": "Normal",
    "pulpDx.reversiblePulpitis": "Reversible Pulpitis",
    "pulpDx.irreversiblePulpitis": "Irreversible Pulpitis",
    "pulpDx.necrosis": "Nekrose",
    "pulpLatin.none": "Nicht angegeben",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Keine apikale Pathologie",
    "apicalDx.symptomaticApicalPeriodontitis": "Symptomatische apikale Parodontitis",
    "apicalDx.asymptomaticApicalPeriodontitis": "Asymptomatische apikale Parodontitis",
    "apicalDx.acuteApicalAbscess": "Akuter apikaler Abszess",
    "apicalDx.chronicApicalAbscess": "Chronischer apikaler Abszess",
    "apicalDx.condensingOsteitis": "Kondensierende Osteitis",
    "resorption.type.none": "Keine Wurzelresorption",
    "resorption.type.internal": "Interne Wurzelresorption",
    "resorption.type.externalCervical": "Externe (zervikale) Wurzelresorption",
    "pulp.level.simple": "Einfach",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latein",
    "pulp.dxLabel": "Pulpadiagnose",
    "apical.dxLabel": "Apikale Diagnose",
    "pulp.level.label": "Pulpa-Detailgrad",
    "rootCaries.none": "Keine Wurzelkaries",
    "rootCaries.active": "Aktive Wurzelkaries",
    "rootCaries.arrested": "Arretierte (inaktive) Wurzelkaries",
    "rootCaries.activeCavitated": "Aktive kavitierte Wurzelkaries",
    "rootCaries.present": "Wurzelkaries",
    "radiographicDepth.none": "Keine radiologische Tiefenangabe",
    "radiographicDepth.E1": "Schmelz, äußere Hälfte (E1)",
    "radiographicDepth.E2": "Schmelz, innere Hälfte (E2)",
    "radiographicDepth.D1": "Dentin, äußeres Drittel (D1)",
    "radiographicDepth.D2": "Dentin, mittleres Drittel (D2)",
    "radiographicDepth.D3": "Dentin, inneres Drittel (D3)",
    "radiographicDepth.superficial": "Oberflächlich (E1–E2)",
    "radiographicDepth.middle": "Mittel (D1)",
    "radiographicDepth.deep": "Tief (D2–D3)",
    "fillingDefect.label": "Füllungsdefekt",
    "fillingDefect.none": "keiner",
    "fillingDefect.marginal": "Randdefekt",
    "fillingDefect.fracture": "Fraktur / Abplatzung",
    "fillingDefect.wear": "abgenutzt / defizitär",
    "secondaryCaries.sound": "Gesund",
    "secondaryCaries.initial": "Initial",
    "secondaryCaries.moderate": "Mäßig",
    "secondaryCaries.cavitated": "Kavitiert",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Allgemein",
    "settings.tab.panels": "Bereiche",
    "settings.panels.statuses": "Status",
    "settings.panels.statuses.desc": "Den Status-Bereich anzeigen.",
    "settings.panels.orthodontics": "Kieferorthopädie",
    "settings.panels.orthodontics.desc": "Den Kieferorthopädie-Bereich anzeigen.",
    "settings.tab.toothDetails": "Zahndetails",
    "caries.rootLabel": "Wurzelkaries",
    "caries.secondaryLabel": "Sekundärkaries (CARS)",
    "caries.radiographicLabel": "Röntgenologische Tiefe",
    "caries.details": "Karies-Details",
    "caries.primaryTitle": "Karies",
    "caries.recurrentTitle": "Sekundärkaries",
    "caries.recurrentHint": "Sekundärkaries neben der Füllung: CARS-Wert",
    "caries.cars.0": "Gesund",
    "caries.cars.1": "Erste sichtbare Schmelzveränderung",
    "caries.cars.2": "Deutliche sichtbare Schmelzveränderung",
    "caries.cars.3": "Lokalisierter Schmelzeinbruch (ohne Dentin)",
    "caries.cars.4": "Darunterliegender Dentinschatten",
    "caries.cars.5": "Deutliche Kavität, sichtbares Dentin",
    "caries.cars.6": "Ausgedehnte Kavität",
    "caries.detailsHint": "Karies-Details: Tiefe, Sekundärkaries, radiologisch",
    "settings.tab.secondaryCaries": "Sekundärkaries",
    "settings.tab.caries": "Karies",
    "settings.tab.pulpa": "Pulpa",
    "settings.tab.notes": "Notizen",
    "settings.mode.simple": "Einfach",
    "settings.mode.advanced": "Erweitert",
    "settings.close": "Schließen",
    "settings.comingSoon": "Demnächst",
    "settings.theme.label": "Darstellung",
    "settings.exportImport.title": "Export / Import",
    "settings.numbering.desc": "Zahnnummerierungssystem für das Diagramm.",
    "settings.language.desc": "Sprache der Oberfläche.",
    "settings.theme.desc": "Zwischen hellem und dunklem Design wechseln.",
    "settings.exportImport.desc": "Odontogramm-Daten speichern oder laden. Dieser Bereich ist in Entwicklung.",
    "settings.toothInfo.desc": "Das Zahninformations-Panel unter dem Diagramm anzeigen.",
    "settings.secondaryCaries.desc": "Detailgrad der Sekundärkaries-Bewertung (CARS).",
    "settings.secondaryCaries.simple": "Einfach",
    "settings.secondaryCaries.standard": "Standard",
    "settings.secondaryCaries.full": "Vollständig",
    "settings.icdas.desc": "ICDAS-II-Skala (0–6) statt der 3-stufigen Kariesskala verwenden.",
    "settings.cariesDepth.label": "Kariestiefe",
    "settings.cariesDepth.desc": "Kariestiefe pro Fläche visuell darstellen.",
    "settings.rootCaries.desc": "Detailgrad der Wurzelkaries-Auswahl je Zahn.",
    "settings.rootCaries.simple": "Vorhanden / nicht",
    "settings.rootCaries.severity": "Schweregrad",
    "settings.radiographic.desc": "Röntgenologische Kariestiefe-Einstufung je Fläche.",
    "settings.radiographic.off": "Aus",
    "settings.radiographic.threeLevel": "3-stufig",
    "settings.radiographic.detailed": "Detailliert",
    "settings.pulpLevel.desc": "Wie viel Detail die Pulpadiagnose-Auswahl bietet.",
    "settings.wearDetail.label": "Abnutzungsdetail",
    "settings.wearDetail.desc": "Einfach: Ja/Nein-Schalter (Attrition); Komplex: Abnutzungsart je Kante und Zahnhals.",
    "settings.discolorationDetail.label": "Verfärbungsdetail",
    "settings.discolorationDetail.desc": "Einfach: Ja/Nein-Schalter; Komplex: Auswahl der Verfärbungsursache.",
    "settings.surfaceNotation.label": "Flächen-Notation",
    "settings.surfaceNotation.desc": "Vollständig: Flächenbuchstaben passen sich der Zahnposition an (Frontzahn: I=inzisal, L=labial; Oberkiefer: P=palatinal; Unterkiefer: L=lingual). Einfach: immer B/O/L, unabhängig von der Position.",
    "settings.surfaceNotation.simple": "Einfach",
    "settings.surfaceNotation.full": "Vollständig",
    "settings.toothDetail.simple": "Einfach",
    "settings.toothDetail.complex": "Komplex",
    "settings.notes.desc": "Notizen je Zahn aktivieren (Doppelklick zum Bearbeiten).",
    "surface.mesial": "mesial",
    "surface.distal": "distal",
    "surface.buccal": "bukkal",
    "surface.lingualPalatal": "lingual/palatal",
    "surface.occlusal": "okklusal",
    "surface.incisal": "inzisal",
    "surface.subcrown": "subkronal",
    "surface.labial": "labial",
    "surface.palatal": "palatinal",
    "surface.lingual": "lingual",
    "actions.expand": "{{label}} öffnen",
    "actions.collapse": "{{label}} einklappen",
    "debug.numbering.title": "Nummerierungs-Debug (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Oberer 12-22 Zirkon",
    "statusExtras.upper13_23Zircon": "Oberer 13-23 Zirkon",
    "statusExtras.upper16_26Zircon": "Oberer 16-26 Zirkon",
    "statusExtras.upperFullZircon": "Oberer Zirkon-Rundbrücke",
    "statusExtras.upper12_22Metal": "Oberer 12-22 Metallkeramik",
    "statusExtras.upper13_23Metal": "Oberer 13-23 Metallkeramik",
    "statusExtras.upper16_26Metal": "Oberer 16-26 Metallkeramik",
    "statusExtras.upperFullMetal": "Oberer Metallkeramik-Rundbrücke",
    "statusExtras.upperPartialRemovable": "Obere Teilprothese",
    "statusExtras.upperFullRemovable": "Obere Totalprothese",
    "statusExtras.upperBarDenture": "Obere Stegprothese",
    "statusExtras.lower42_32Zircon": "Unterer 42-32 Zirkon",
    "statusExtras.lower43_33Zircon": "Unterer 43-33 Zirkon",
    "statusExtras.lower46_36Zircon": "Unterer 46-36 Zirkon",
    "statusExtras.lowerFullZircon": "Untere Zirkon-Rundbrücke",
    "statusExtras.lower42_32Metal": "Unterer 42-32 Metallkeramik",
    "statusExtras.lower43_33Metal": "Unterer 43-33 Metallkeramik",
    "statusExtras.lower46_36Metal": "Unterer 46-36 Metallkeramik",
    "statusExtras.lowerFullMetal": "Untere Metallkeramik-Rundbrücke",
    "statusExtras.lowerPartialRemovable": "Untere Teilprothese",
    "statusExtras.lowerFullRemovable": "Untere Totalprothese",
    "statusExtras.lowerBarDenture": "Untere Stegprothese",
    "touch.zoom.title": "Zahn #{{tooth}}",
    "touch.zoom.select": "Auswählen",
    "touch.zoom.deselect": "Abwählen",
    "touch.zoom.info": "Details",
    "touch.zoom.close": "Schließen",
    "touch.ctx.select": "Auswählen",
    "touch.ctx.multiSelect": "Zur Auswahl hinzufügen",
    "touch.ctx.deselect": "Abwählen",
    "touch.ctx.reset": "Zurücksetzen",
    "touch.arch.upper": "Oberkiefer",
    "touch.arch.lower": "Unterkiefer",
    "touch.arch.both": "Beide",
    "chart.hint.touch": "Tippen Sie auf einen Zahn. Langes Drücken für weitere Optionen.",
    "warn.endoOnMissing": "Wurzelbehandlung bei fehlendem/Implantat-Zahn nicht möglich",
    "warn.fillingOnMissing": "Füllung bei fehlendem Zahn nicht möglich",
    "warn.crownReplaceNoCrown": "Kronenwechsel ohne Krone markiert",
    "warn.cariesOnMissing": "Karies bei fehlendem Zahn nicht möglich",
    "warn.pillarNoCrown": "Brückenpfeiler ohne Kronenmaterial markiert",
    "warn.invalidRestorationCombo": "Ungültige Kombination aus Restaurationstyp und -material (automatisch korrigiert)",
    "readOnly.label": "Schreibgeschützt",
    "note.title": "Notiz",
    "note.save": "Speichern",
    "note.delete": "Löschen",
    "note.placeholder": "Notiz hinzufügen...",
    "intro.start": "Einführung",
    "intro.next": "Weiter",
    "intro.back": "Zurück",
    "intro.skip": "Überspringen",
    "intro.finish": "Fertig",
    "intro.step1.title": "Zahn auswählen",
    "intro.step1.text": "Klicke auf einen Zahn im Diagramm, um mit der Bearbeitung zu beginnen.",
    "intro.step2.title": "Karies",
    "intro.step2.text": "Markiere kariöse Flächen im Kreuz-Layout (B/M/O/D/L).",
    "intro.step3.title": "Pulpitis",
    "intro.step3.text": "Schalte die Pulpaentzündung am ausgewählten Zahn ein.",
    "intro.step4.title": "Implantat",
    "intro.step4.text": "Stelle den Zahntyp im Dropdown-Menü auf Implantat.",
    "intro.step5.title": "Füllung",
    "intro.step5.text": "Wähle ein Material und markiere dann die Flächen — jede Fläche kann ein eigenes Material haben.",
    "intro.step6.title": "Krone",
    "intro.step6.text": "Wähle das Kronenmaterial aus.",
    "intro.step7.title": "Zahnnotiz",
    "intro.step7.text": "Doppelklicke auf einen Zahn, um eine Notiz hinzuzufügen.",
    "intro.step8.title": "Auswahlfilter",
    "intro.step8.text": "Wähle schnell Zahngruppen aus: Ober-/Unterkiefer, Front, Molaren.",
    "intro.step9.title": "Nummerierung & Sprache",
    "intro.step9.text": "Wechsle das Nummerierungssystem oder die Sprache in der Kopfzeile.",
    "intro.step10.title": "Export",
    "intro.step10.text": "Exportiere das Diagramm als JSON, FHIR, PNG oder JPG.",
    "intro.step11.title": "Import",
    "intro.step11.text": "Lade ein früheres Diagramm aus JSON oder FHIR.",
    "intro.step12.title": "Du bist startklar!",
    "intro.step12.text": "Das sind die Grundlagen — entdecke die übrigen Funktionen."
  },
  es: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Selecciona un diente en el odontograma y configura las capas.",
    "app.subtitleLang": "En español.",
    "app.subtitleNumbering.FDI": "Usando numeración FDI – ISO 3950.",
    "app.subtitleNumbering.UNIVERSAL": "Usando numeración Universal (ADA).",
    "app.subtitleNumbering.PALMER": "Usando numeración Palmer.",
    "app.subtitleMode.light": "En modo claro.",
    "app.subtitleMode.dark": "En modo oscuro.",
    "settings.toothInfo": "Panel de información dental",
    "toothInfo.title": "Información dental",
    "toothInfo.overview": "El odontograma muestra {{present}}{{milk}} y {{missing}}.",
    "toothInfo.overviewImplant": "El odontograma muestra {{present}}{{milk}}, {{missing}} y {{implant}}.",
    "toothInfo.overviewMilkOnly": "El odontograma muestra {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} diente permanente",
    "toothInfo.presentOther": "{{n}} dientes permanentes",
    "toothInfo.missingOne": "falta {{n}} diente",
    "toothInfo.missingOther": "faltan {{n}} dientes",
    "toothInfo.implantOne": "{{n}} diente tiene un implante",
    "toothInfo.implantOther": "{{n}} dientes tienen un implante",
    "toothInfo.milkOne": "{{n}} diente de leche",
    "toothInfo.milkOther": "{{n}} dientes de leche",
    "toothInfo.permanentList": "dientes permanentes ({{count}}): {{list}}",
    "toothInfo.missingList": "dientes marcados como ausentes ({{count}}): {{list}}",
    "toothInfo.caries": "Caries",
    "toothInfo.cariesEmpty": "No hay dientes con caries.",
    "toothInfo.secondary": "secundaria",
    "toothInfo.diagnoses": "Diagnósticos",
    "toothInfo.diagnosesEmpty": "sin diagnóstico registrado",
    "summary.severity.superficial": "superficial",
    "summary.severity.moderate": "moderado",
    "summary.severity.deep": "profundo",
    "summary.fracture": "Fractura",
    "toothInfo.fillings": "Obturaciones",
    "toothInfo.fillingsEmpty": "No hay dientes obturados.",
    "toothInfo.endo": "Tratamientos de conducto",
    "toothInfo.endoEmpty": "No hay dientes endodonciados.",
    "toothInfo.resected": "diente resecado",
    "toothInfo.prosthetics": "Prótesis",
    "toothInfo.prostheticsEmpty": "No hay prótesis.",
    "toothInfo.implants": "Implantes",
    "toothInfo.periodontalTitle": "Estado periodontal",
    "toothInfo.periodontalHealthy": "el periodonto está sano",
    "toothInfo.periodontalInflamed": "hay inflamación en los siguientes dientes: {{list}}",
    "topbar.exportStatus": "Exportar estado",
    "topbar.exportFhir": "Exportar FHIR",
    "topbar.export": "Exportar",
    "export.menu.statusJson": "Estado JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "Imagen PNG",
    "export.menu.jpg": "Imagen JPG",
    "export.menu.svg": "Imagen SVG",
    "export.progress.title": "Exportación en curso",
    "export.progress.preparing": "Preparando…",
    "export.progress.rendering": "Renderizando…",
    "export.progress.encoding": "Codificando…",
    "export.progress.done": "Listo",
    "topbar.exportPng": "Exportar PNG",
    "topbar.exportJpg": "Exportar JPG",
    "topbar.importStatus": "Importar estado",
    "topbar.import": "Importar",
    "import.menu.statusJson": "Estado JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Carta dental",
    "chart.hint": "Haz clic en un diente. Para selección múltiple, usa CMD/CTRL + clic.",
    "chart.actions.occlusal": "Visibilidad vista oclusal",
    "chart.actions.wisdom": "Visibilidad muelas del juicio",
    "chart.actions.bone": "Visibilidad del hueso",
    "chart.actions.pulp": "Visibilidad de la pulpa",
    "chart.actions.clearSelection": "Borrar selección",
    "chart.aria.toothGrid": "Cuadrícula dental",
    "panel.controls": "Controles",
    "panel.clearSelection": "Borrar selección",
    "panel.toggleControls": "Controles",
    "panel.activeTooth": "Diente activo",
    "panel.selectActions.all": "Todos",
    "panel.selectActions.present": "Dientes",
    "panel.selectActions.permanent": "Permanentes",
    "panel.selectActions.milk": "Primarios",
    "panel.selectActions.implants": "Implantes",
    "panel.selectActions.missing": "Ausentes",
    "panel.selectActions.upper": "Superior",
    "panel.selectActions.upperFront": "Superior 6 frontales",
    "panel.selectActions.upperMolar": "Molares superiores",
    "panel.selectActions.lower": "Inferior",
    "panel.selectActions.lowerFront": "Inferior 6 frontales",
    "panel.selectActions.lowerMolar": "Molares inferiores",
    "status.title": "Estados",
    "status.resetAll": "Restablecer boca",
    "status.primaryDentition": "Dentición primaria",
    "status.mixedDentition": "Dentición mixta",
    "status.edentulous": "Edéntulo",
    "status.extraLabel": "Añadir:",
    "status.extraApply": "OK",
    "tooth.title": "Detalles del diente",
    "tooth.reset": "Restablecer",
    "tooth.resetTitle": "Restablecer diente a predeterminado",
    "tooth.baseLabel": "Base",
    "tooth.bridgeLabel": "Prótesis",
    "tooth.extractionWound": "herida de extracción reciente",
    "tooth.crownLabel": "Corona",
    "tooth.broken.mesial": "mesial",
    "tooth.broken.incisal": "incisal",
    "tooth.broken.distal": "distal",
    "tooth.contact.mesialMissing": "contacto mesial ausente",
    "tooth.contact.distalMissing": "contacto distal ausente",
    "tooth.bruxism.edgeWear": "Desgaste incisal",
    "tooth.bruxism.neckWear": "Desgaste cervical",
    "wearType.none": "ninguno",
    "wearType.attrition": "Atrición",
    "wearType.abrasion": "Abrasión",
    "wearType.erosion": "Erosión",
    "wearType.abfraction": "Abfracción",
    "discoloration.label": "Decoloración",
    "discoloration.none": "ninguna",
    "discoloration.tetracycline": "Tinción por tetraciclina",
    "discoloration.fluorosis": "Fluorosis",
    "discoloration.nonvital": "Oscurecimiento no vital",
    "discoloration.extrinsic": "Tinción extrínseca",
    "discoloration.other": "Otra / desconocida",
    "ortho.appliance.label": "Aparato de ortodoncia",
    "ortho.appliance.none": "ninguno",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Banda",
    "ortho.drift.label": "Desplazamiento",
    "ortho.drift.none": "ninguno",
    "ortho.drift.mesial": "Mesial",
    "ortho.drift.distal": "Distal",
    "ortho.vertical.label": "Vertical",
    "ortho.vertical.none": "ninguno",
    "ortho.vertical.extrusion": "Extrusión",
    "ortho.vertical.intrusion": "Intrusión",
    "ortho.rotation.label": "Rotación",
    "toothInfo.discoloration": "Decoloración",
    "toothInfo.discolorationEmpty": "sin decoloración registrada",
    "toothInfo.wear": "Desgaste",
    "toothInfo.wearEmpty": "sin desgaste registrado",
    "toothInfo.orthodontics": "Ortodoncia",
    "toothInfo.orthodonticsEmpty": "sin hallazgo ortodóncico registrado",
    "tooth.bridgePillar": "Pilar de puente",
    "tooth.extractionPlan": "Extracción planificada",
    "tooth.crownReplace": "Reemplazo de corona",
    "tooth.crownNeeded": "Corona necesaria",
    "tooth.missingClosed": "Espacio cerrado",
    "caries.title": "Caries",
    "caries.hint": "Selecciona las superficies de caries",
    "caries.depthLabel": "Profundidad",
    "caries.depth.surface": "Superficial (esmalte)",
    "caries.depth.dentin": "Dentina",
    "caries.depth.deep": "Profunda (cercana a la pulpa)",
    "filling.title": "Obturaciones y restauración",
    "filling.typeLabel": "Tipo",
    "filling.fissureSealing": "Sellado de fisuras",
    "filling.subcariesSummarySingle": "En {{teeth}} hay subcaries junto a la obturación.",
    "filling.subcariesSummaryMultiple": "En {{teeth}} hay subcaries junto a las obturaciones.",
    "filling.fillingDefectSummarySingle": "En {{teeth}} hay un defecto de obturación registrado.",
    "filling.fillingDefectSummaryMultiple": "En {{teeth}} hay defectos de obturación registrados.",
    "endo.title": "Raíz",
    "endo.hint": "Selecciona el estado de la raíz",
    "endo.pulpitis": "Pulpitis",
    "endo.resection": "Diente resecado",
    "endo.parapulpalPin": "Pin parapulpar",
    "inflammation.title": "Periodonto e inflamaciones",
    "inflammation.mobilityLabel": "Movilidad",
    "language.label": "Idioma",
    "language.hu": "🇭🇺 Húngaro",
    "language.en": "🇬🇧 Inglés",
    "language.de": "🇩🇪 Alemán",
    "language.es": "🇪🇸 Español",
    "language.it": "🇮🇹 Italiano",
    "language.sk": "🇸🇰 Eslovaco",
    "language.pl": "🇵🇱 Polaco",
    "language.ru": "🇷🇺 Ruso",
    "language.pt-br": "🇧🇷 Portugués brasileño",
    "numbering.label": "Numeración",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - EE.UU.",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Ajustes",
    "settings.notes": "Notas",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Esmalte (secado)",
    "icdas.code.2": "Esmalte (húmedo)",
    "icdas.code.3": "Ruptura del esmalte",
    "icdas.code.4": "Sombra de dentina",
    "icdas.code.5": "Cavidad (dentina)",
    "icdas.code.6": "Cavidad extensa",
    "icdas.desc.1": "Primer cambio visible en el esmalte (visible solo tras un secado prolongado)",
    "icdas.desc.2": "Cambio evidente en el esmalte (visible en húmedo)",
    "icdas.desc.3": "Ruptura localizada del esmalte sin dentina visible",
    "icdas.desc.4": "Sombra oscura subyacente de la dentina, con o sin ruptura del esmalte",
    "icdas.desc.5": "Cavidad evidente con dentina visible",
    "icdas.desc.6": "Cavidad extensa con dentina visible (más de la mitad de la superficie)",
    "theme.light": "Modo claro",
    "theme.dark": "Modo oscuro",
    "selection.none": "—",
    "selection.count": "{{count}} dientes",
    "toothSelect.none": "Diente ausente",
    "toothSelect.permanent": "Diente permanente",
    "toothSelect.milk": "Diente primario",
    "toothSelect.implant": "Implante",
    "toothSelect.crownPrep": "Preparado para corona",
    "toothSelect.underGum": "Diente subgingival",
    "endo.option.none": "Raíz sana",
    "endo.option.medicalFilling": "Obturación radicular medicinal",
    "endo.option.filling": "Obturación radicular",
    "endo.option.incompleteFilling": "Obturación radicular incompleta",
    "endo.option.glassPin": "Obturación radicular con poste de fibra de vidrio",
    "endo.option.metalPin": "Obturación radicular con poste metálico",
    "filling.option.none": "Sin obturación",
    "filling.option.amalgam": "Obturación de amalgama",
    "filling.option.composite": "Obturación de composite",
    "filling.option.gic": "Obturación de ionómero de vidrio",
    "filling.option.temporary": "Obturación temporal",
    "crown.option.noneImplant": "Ninguno",
    "crown.option.healingAbutment": "Pilar de cicatrización",
    "crown.option.zircon": "Corona de circonio",
    "crown.option.metal": "Corona metalcerámica",
    "crown.option.temporary": "Corona provisional",
    "crown.option.locator": "Localizador",
    "crown.option.locatorProsthesis": "Localizador + diente protésico",
    "crown.option.bar": "Implante con barra",
    "crown.option.barProsthesis": "Barra + diente protésico",
    "crown.option.full": "Corona completa",
    "crown.option.broken": "Corona fracturada",
    "crown.option.radix": "Radix",
    "crown.option.emax": "Incrustación de cerámica prensada",
    "crown.option.telescope": "Corona telescópica",
    "bridge.option.none": "Ninguno",
    "bridge.option.removable": "Prótesis removible",
    "bridge.option.zircon": "Póntico de circonio",
    "bridge.option.metal": "Póntico metalcerámico",
    "bridge.option.temporary": "Póntico provisional",
    "bridge.option.bar": "Extensión de barra",
    "bridge.option.barProsthesis": "Barra + diente protésico",
    "restoration.none": "Ninguna",
    "restoration.prefix.fixed": "Fija",
    "restoration.prefix.removable": "Removible",
    "restoration.type.crown": "Corona",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Carilla",
    "restoration.type.bridge": "Póntico",
    "prosthesis.none": "Ninguna",
    "prosthesis.type.healingAbutment": "Pilar de cicatrización",
    "prosthesis.type.locator": "Attachment Locator",
    "prosthesis.type.locatorDenture": "Sobredentadura sobre Locator",
    "prosthesis.type.bar": "Attachment de barra",
    "prosthesis.type.barDenture": "Sobredentadura sobre barra",
    "prosthesis.type.removablePartial": "Prótesis parcial removible",
    "prosthesis.type.removableFull": "Prótesis total removible",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "oro",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "circonio",
    "restoration.material.metal": "metal",
    "restoration.material.metalCeramic": "metalocerámica",
    "restoration.material.telescope": "telescópica",
    "restoration.material.temporary": "provisional",
    "substrate.natural": "Sano",
    "substrate.radix": "Radix",
    "substrate.broken": "Fracturado",
    "substrate.crownprep": "Preparado para corona",
    "restoration.label": "Restauración",
    "substrate.label": "Estado del diente",
    "mobility.none": "Ninguno",
    "mobility.m1": "Grado 1",
    "mobility.m2": "Grado 2",
    "mobility.m3": "Grado 3",
    "mods.parodontal": "Inflamación periodontal",
    "periImplant.label": "Estado peri-implantario",
    "periImplant.none": "Sano (ninguno)",
    "periImplant.mucositis": "Mucositis peri-implantaria",
    "periImplant.periImplantitisMild": "Periimplantitis – pérdida ósea leve",
    "periImplant.periImplantitisModerate": "Periimplantitis – pérdida ósea moderada",
    "periImplant.periImplantitisSevere": "Periimplantitis – pérdida ósea grave",
    "mods.periimplantitis": "Periimplantitis",
    "mods.periodontalInflammation": "Inflamación periodontal",
    "mods.periapicalInflammation": "Inflamación periapical",
    "periapical.typeLabel": "Lesión apical",
    "card.rootPeriodontium": "Raíz y periodonto",
    "pulpEndo.label": "Estado pulpar / endo",
    "pulpEndo.groupVital": "Pulpa vital",
    "pulpEndo.groupTreated": "Tratado (endo)",
    "calculus.label": "Cálculo",
    "crownLeakage.label": "Filtración marginal de la corona",
    "root.resorption": "Reabsorción radicular",
    "periapical.type.none": "Sin especificar",
    "periapical.type.granuloma": "Granuloma",
    "periapical.type.cyst": "Quiste radicular",
    "periapical.type.abscess": "Absceso",
    "pulpDx.normal": "Normal",
    "pulpDx.reversiblePulpitis": "Pulpitis reversible",
    "pulpDx.irreversiblePulpitis": "Pulpitis irreversible",
    "pulpDx.necrosis": "Necrosis",
    "pulpLatin.none": "No especificado",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Sin patología apical",
    "apicalDx.symptomaticApicalPeriodontitis": "Periodontitis apical sintomática",
    "apicalDx.asymptomaticApicalPeriodontitis": "Periodontitis apical asintomática",
    "apicalDx.acuteApicalAbscess": "Absceso apical agudo",
    "apicalDx.chronicApicalAbscess": "Absceso apical crónico",
    "apicalDx.condensingOsteitis": "Osteítis condensante",
    "resorption.type.none": "Sin reabsorción radicular",
    "resorption.type.internal": "Reabsorción radicular interna",
    "resorption.type.externalCervical": "Reabsorción radicular externa (cervical)",
    "pulp.level.simple": "Simple",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latín",
    "pulp.dxLabel": "Diagnóstico pulpar",
    "apical.dxLabel": "Diagnóstico apical",
    "pulp.level.label": "Nivel de detalle pulpar",
    "rootCaries.none": "Sin caries radicular",
    "rootCaries.active": "Caries radicular activa",
    "rootCaries.arrested": "Caries radicular detenida (inactiva)",
    "rootCaries.activeCavitated": "Caries radicular activa cavitada",
    "rootCaries.present": "caries radicular",
    "radiographicDepth.none": "Sin profundidad radiográfica registrada",
    "radiographicDepth.E1": "Esmalte, mitad externa (E1)",
    "radiographicDepth.E2": "Esmalte, mitad interna (E2)",
    "radiographicDepth.D1": "Dentina, tercio externo (D1)",
    "radiographicDepth.D2": "Dentina, tercio medio (D2)",
    "radiographicDepth.D3": "Dentina, tercio interno (D3)",
    "radiographicDepth.superficial": "Superficial (E1–E2)",
    "radiographicDepth.middle": "Media (D1)",
    "radiographicDepth.deep": "Profunda (D2–D3)",
    "fillingDefect.label": "Defecto de obturación",
    "fillingDefect.none": "ninguno",
    "fillingDefect.marginal": "defecto marginal",
    "fillingDefect.fracture": "fractura / astilla",
    "fillingDefect.wear": "desgastado / deficiente",
    "secondaryCaries.sound": "Sana",
    "secondaryCaries.initial": "Inicial",
    "secondaryCaries.moderate": "Moderada",
    "secondaryCaries.cavitated": "Cavitada",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "General",
    "settings.tab.panels": "Paneles",
    "settings.panels.statuses": "Estados",
    "settings.panels.statuses.desc": "Mostrar el panel de Estados.",
    "settings.panels.orthodontics": "Ortodoncia",
    "settings.panels.orthodontics.desc": "Mostrar el panel de Ortodoncia.",
    "settings.tab.toothDetails": "Detalles del diente",
    "caries.rootLabel": "Caries radicular",
    "caries.secondaryLabel": "Caries secundaria (CARS)",
    "caries.radiographicLabel": "Profundidad radiográfica",
    "caries.details": "Detalles de caries",
    "caries.primaryTitle": "Caries",
    "caries.recurrentTitle": "Caries recurrente",
    "caries.recurrentHint": "Caries recurrente junto a la obturación: puntuación CARS",
    "caries.cars.0": "Sano",
    "caries.cars.1": "Primer cambio visual en el esmalte",
    "caries.cars.2": "Cambio visual evidente en el esmalte",
    "caries.cars.3": "Ruptura localizada del esmalte (sin dentina)",
    "caries.cars.4": "Sombra dentinaria subyacente",
    "caries.cars.5": "Cavidad evidente, dentina visible",
    "caries.cars.6": "Cavidad extensa",
    "caries.detailsHint": "Detalles de caries: profundidad, secundaria, radiográfica",
    "settings.tab.secondaryCaries": "Caries secundaria",
    "settings.tab.caries": "Caries",
    "settings.tab.pulpa": "Pulpa",
    "settings.tab.notes": "Notas",
    "settings.mode.simple": "Simple",
    "settings.mode.advanced": "Avanzado",
    "settings.close": "Cerrar",
    "settings.comingSoon": "Próximamente",
    "settings.theme.label": "Apariencia",
    "settings.exportImport.title": "Exportar / Importar",
    "settings.numbering.desc": "Sistema de numeración dental usado en el diagrama.",
    "settings.language.desc": "Idioma de la interfaz.",
    "settings.theme.desc": "Cambiar entre apariencia clara y oscura.",
    "settings.exportImport.desc": "Guardar o cargar datos del odontograma. Esta sección está en desarrollo.",
    "settings.toothInfo.desc": "Mostrar el panel de información dental debajo del diagrama.",
    "settings.secondaryCaries.desc": "Nivel de detalle del selector de caries secundaria (CARS).",
    "settings.secondaryCaries.simple": "Simple",
    "settings.secondaryCaries.standard": "Estándar",
    "settings.secondaryCaries.full": "Completo",
    "settings.icdas.desc": "Usar la escala ICDAS II (0–6) en lugar de la escala de 3 niveles.",
    "settings.cariesDepth.label": "Profundidad de caries",
    "settings.cariesDepth.desc": "Codificar visualmente la profundidad de la caries en cada superficie.",
    "settings.rootCaries.desc": "Nivel de detalle del selector de caries radicular por diente.",
    "settings.rootCaries.simple": "Presente / ausente",
    "settings.rootCaries.severity": "Gravedad",
    "settings.radiographic.desc": "Clasificación radiográfica de la profundidad de caries por superficie.",
    "settings.radiographic.off": "Desactivado",
    "settings.radiographic.threeLevel": "3 niveles",
    "settings.radiographic.detailed": "Detallado",
    "settings.pulpLevel.desc": "Cuánto detalle ofrece el selector de diagnóstico pulpar.",
    "settings.wearDetail.label": "Detalle de desgaste",
    "settings.wearDetail.desc": "Simple: interruptor sí/no (atrición); completo: tipo de desgaste por borde y cervical.",
    "settings.discolorationDetail.label": "Detalle de decoloración",
    "settings.discolorationDetail.desc": "Simple: interruptor sí/no; completo: elegir la causa de la decoloración.",
    "settings.surfaceNotation.label": "Notación de superficie",
    "settings.surfaceNotation.desc": "Completo: las letras de superficie se adaptan a la posición del diente (diente anterior: I=incisal, L=labial; superior: P=palatino; inferior: L=lingual). Simple: siempre B/O/L, independientemente de la posición.",
    "settings.surfaceNotation.simple": "Simple",
    "settings.surfaceNotation.full": "Completo",
    "settings.toothDetail.simple": "Simple",
    "settings.toothDetail.complex": "Completo",
    "settings.notes.desc": "Activar notas por diente (doble clic para editar).",
    "surface.mesial": "mesial",
    "surface.distal": "distal",
    "surface.buccal": "bucal",
    "surface.lingualPalatal": "lingual/palatino",
    "surface.occlusal": "oclusal",
    "surface.incisal": "incisal",
    "surface.subcrown": "subcoronal",
    "surface.labial": "labial",
    "surface.palatal": "palatino",
    "surface.lingual": "lingual",
    "actions.expand": "Abrir {{label}}",
    "actions.collapse": "Cerrar {{label}}",
    "debug.numbering.title": "Depuración de numeración (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Superior 12-22 circonio",
    "statusExtras.upper13_23Zircon": "Superior 13-23 circonio",
    "statusExtras.upper16_26Zircon": "Superior 16-26 circonio",
    "statusExtras.upperFullZircon": "Puente completo superior de circonio",
    "statusExtras.upper12_22Metal": "Superior 12-22 metalcerámica",
    "statusExtras.upper13_23Metal": "Superior 13-23 metalcerámica",
    "statusExtras.upper16_26Metal": "Superior 16-26 metalcerámica",
    "statusExtras.upperFullMetal": "Puente completo superior metalcerámico",
    "statusExtras.upperPartialRemovable": "Superior parcial removible",
    "statusExtras.upperFullRemovable": "Superior completa removible",
    "statusExtras.upperBarDenture": "Prótesis superior con barra",
    "statusExtras.lower42_32Zircon": "Inferior 42-32 circonio",
    "statusExtras.lower43_33Zircon": "Inferior 43-33 circonio",
    "statusExtras.lower46_36Zircon": "Inferior 46-36 circonio",
    "statusExtras.lowerFullZircon": "Puente completo inferior de circonio",
    "statusExtras.lower42_32Metal": "Inferior 42-32 metalcerámica",
    "statusExtras.lower43_33Metal": "Inferior 43-33 metalcerámica",
    "statusExtras.lower46_36Metal": "Inferior 46-36 metalcerámica",
    "statusExtras.lowerFullMetal": "Puente completo inferior metalcerámico",
    "statusExtras.lowerPartialRemovable": "Inferior parcial removible",
    "statusExtras.lowerFullRemovable": "Inferior completa removible",
    "statusExtras.lowerBarDenture": "Prótesis inferior con barra",
    "touch.zoom.title": "Diente #{{tooth}}",
    "touch.zoom.select": "Seleccionar",
    "touch.zoom.deselect": "Deseleccionar",
    "touch.zoom.info": "Detalles",
    "touch.zoom.close": "Cerrar",
    "touch.ctx.select": "Seleccionar",
    "touch.ctx.multiSelect": "Añadir a la selección",
    "touch.ctx.deselect": "Deseleccionar",
    "touch.ctx.reset": "Restablecer",
    "touch.arch.upper": "Arcada superior",
    "touch.arch.lower": "Arcada inferior",
    "touch.arch.both": "Ambas",
    "chart.hint.touch": "Toca un diente para seleccionarlo. Mantén pulsado para más opciones.",
    "warn.endoOnMissing": "Tratamiento radicular no posible en diente ausente/implante",
    "warn.fillingOnMissing": "Obturación no posible en diente ausente",
    "warn.crownReplaceNoCrown": "Reemplazo de corona marcado sin corona",
    "warn.cariesOnMissing": "Caries no posible en diente ausente",
    "warn.pillarNoCrown": "Pilar de puente marcado sin material de corona",
    "warn.invalidRestorationCombo": "Combinación de tipo/material de restauración no válida (corregida automáticamente)",
    "readOnly.label": "Solo lectura",
    "note.title": "Nota",
    "note.save": "Guardar",
    "note.delete": "Eliminar",
    "note.placeholder": "Añadir una nota...",
    "intro.start": "Introducción",
    "intro.next": "Siguiente",
    "intro.back": "Atrás",
    "intro.skip": "Omitir",
    "intro.finish": "Listo",
    "intro.step1.title": "Seleccionar un diente",
    "intro.step1.text": "Haz clic en un diente del odontograma para empezar a editar.",
    "intro.step2.title": "Caries",
    "intro.step2.text": "Marca las superficies cariadas en la disposición en cruz (B/M/O/D/L).",
    "intro.step3.title": "Pulpitis",
    "intro.step3.text": "Activa la inflamación pulpar en el diente seleccionado.",
    "intro.step4.title": "Implante",
    "intro.step4.text": "Cambia el tipo de diente a implante desde el menú desplegable.",
    "intro.step5.title": "Obturación",
    "intro.step5.text": "Elige un material y luego marca las superficies — cada superficie puede tener su propio material.",
    "intro.step6.title": "Corona",
    "intro.step6.text": "Elige el material de la corona.",
    "intro.step7.title": "Nota del diente",
    "intro.step7.text": "Haz doble clic en un diente para añadir una nota.",
    "intro.step8.title": "Filtros de selección",
    "intro.step8.text": "Selecciona rápidamente grupos de dientes: superior/inferior, anteriores, molares.",
    "intro.step9.title": "Numeración e idioma",
    "intro.step9.text": "Cambia el sistema de numeración o el idioma en el encabezado.",
    "intro.step10.title": "Exportar",
    "intro.step10.text": "Exporta el odontograma como JSON, FHIR, PNG o JPG.",
    "intro.step11.title": "Importar",
    "intro.step11.text": "Carga un odontograma anterior desde JSON o FHIR.",
    "intro.step12.title": "¡Todo listo!",
    "intro.step12.text": "Eso es lo básico — explora el resto de las funciones."
  },
  it: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Seleziona un dente sull'odontogramma, poi configura i livelli.",
    "app.subtitleLang": "In italiano.",
    "app.subtitleNumbering.FDI": "Con numerazione FDI – ISO 3950.",
    "app.subtitleNumbering.UNIVERSAL": "Con numerazione Universal (ADA).",
    "app.subtitleNumbering.PALMER": "Con numerazione Palmer.",
    "app.subtitleMode.light": "In modalità chiara.",
    "app.subtitleMode.dark": "In modalità scura.",
    "settings.toothInfo": "Pannello informazioni dentali",
    "toothInfo.title": "Informazioni dentali",
    "toothInfo.overview": "L'odontogramma mostra {{present}}{{milk}} e {{missing}}.",
    "toothInfo.overviewImplant": "L'odontogramma mostra {{present}}{{milk}}, {{missing}} e {{implant}}.",
    "toothInfo.overviewMilkOnly": "L'odontogramma mostra {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} dente permanente",
    "toothInfo.presentOther": "{{n}} denti permanenti",
    "toothInfo.missingOne": "manca {{n}} dente",
    "toothInfo.missingOther": "mancano {{n}} denti",
    "toothInfo.implantOne": "{{n}} dente ha un impianto",
    "toothInfo.implantOther": "{{n}} denti hanno un impianto",
    "toothInfo.milkOne": "{{n}} dente deciduo",
    "toothInfo.milkOther": "{{n}} denti decidui",
    "toothInfo.permanentList": "denti permanenti ({{count}}): {{list}}",
    "toothInfo.missingList": "denti contrassegnati come mancanti ({{count}}): {{list}}",
    "toothInfo.caries": "Carie",
    "toothInfo.cariesEmpty": "Nessun dente cariato.",
    "toothInfo.secondary": "secondaria",
    "toothInfo.diagnoses": "Diagnosi",
    "toothInfo.diagnosesEmpty": "nessuna diagnosi registrata",
    "summary.severity.superficial": "superficiale",
    "summary.severity.moderate": "moderato",
    "summary.severity.deep": "profondo",
    "summary.fracture": "Frattura",
    "toothInfo.fillings": "Otturazioni",
    "toothInfo.fillingsEmpty": "Nessun dente otturato.",
    "toothInfo.endo": "Trattamenti canalari",
    "toothInfo.endoEmpty": "Nessun dente devitalizzato.",
    "toothInfo.resected": "dente resecato",
    "toothInfo.prosthetics": "Protesi",
    "toothInfo.prostheticsEmpty": "Nessuna protesi.",
    "toothInfo.implants": "Impianti",
    "toothInfo.periodontalTitle": "Stato parodontale",
    "toothInfo.periodontalHealthy": "il parodonto è sano",
    "toothInfo.periodontalInflamed": "è presente infiammazione sui seguenti denti: {{list}}",
    "topbar.exportStatus": "Esporta stato",
    "topbar.exportFhir": "Esporta FHIR",
    "topbar.export": "Esporta",
    "export.menu.statusJson": "Stato JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "Immagine PNG",
    "export.menu.jpg": "Immagine JPG",
    "export.menu.svg": "Immagine SVG",
    "export.progress.title": "Esportazione in corso",
    "export.progress.preparing": "Preparazione…",
    "export.progress.rendering": "Rendering…",
    "export.progress.encoding": "Codifica…",
    "export.progress.done": "Fatto",
    "topbar.exportPng": "Esporta PNG",
    "topbar.exportJpg": "Esporta JPG",
    "topbar.importStatus": "Importa stato",
    "topbar.import": "Importa",
    "import.menu.statusJson": "Stato JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Cartella dentale",
    "chart.hint": "Clicca un dente. Per selezione multipla, usa CMD/CTRL + clic.",
    "chart.actions.occlusal": "Visibilità vista occlusale",
    "chart.actions.wisdom": "Visibilità denti del giudizio",
    "chart.actions.bone": "Visibilità osso",
    "chart.actions.pulp": "Visibilità polpa",
    "chart.actions.clearSelection": "Cancella selezione",
    "chart.aria.toothGrid": "Griglia dentale",
    "panel.controls": "Controlli",
    "panel.clearSelection": "Cancella selezione",
    "panel.toggleControls": "Controlli",
    "panel.activeTooth": "Dente attivo",
    "panel.selectActions.all": "Tutti",
    "panel.selectActions.present": "Denti",
    "panel.selectActions.permanent": "Permanenti",
    "panel.selectActions.milk": "Primari",
    "panel.selectActions.implants": "Impianti",
    "panel.selectActions.missing": "Mancanti",
    "panel.selectActions.upper": "Superiore",
    "panel.selectActions.upperFront": "Superiore 6 frontali",
    "panel.selectActions.upperMolar": "Molari superiori",
    "panel.selectActions.lower": "Inferiore",
    "panel.selectActions.lowerFront": "Inferiore 6 frontali",
    "panel.selectActions.lowerMolar": "Molari inferiori",
    "status.title": "Stati",
    "status.resetAll": "Ripristina bocca",
    "status.primaryDentition": "Dentizione primaria",
    "status.mixedDentition": "Dentizione mista",
    "status.edentulous": "Edentulo",
    "status.extraLabel": "Aggiungi:",
    "status.extraApply": "OK",
    "tooth.title": "Dettagli dente",
    "tooth.reset": "Ripristina",
    "tooth.resetTitle": "Ripristina dente ai valori predefiniti",
    "tooth.baseLabel": "Base",
    "tooth.bridgeLabel": "Protesi",
    "tooth.extractionWound": "ferita da estrazione recente",
    "tooth.crownLabel": "Corona",
    "tooth.broken.mesial": "mesiale",
    "tooth.broken.incisal": "incisale",
    "tooth.broken.distal": "distale",
    "tooth.contact.mesialMissing": "contatto mesiale mancante",
    "tooth.contact.distalMissing": "contatto distale mancante",
    "tooth.bruxism.edgeWear": "Usura incisale",
    "tooth.bruxism.neckWear": "Usura cervicale",
    "wearType.none": "nessuno",
    "wearType.attrition": "Attrito",
    "wearType.abrasion": "Abrasione",
    "wearType.erosion": "Erosione",
    "wearType.abfraction": "Abfrazione",
    "discoloration.label": "Discromia",
    "discoloration.none": "nessuna",
    "discoloration.tetracycline": "Discromia da tetraciclina",
    "discoloration.fluorosis": "Fluorosi",
    "discoloration.nonvital": "Scurimento non vitale",
    "discoloration.extrinsic": "Discromia estrinseca",
    "discoloration.other": "Altra / sconosciuta",
    "ortho.appliance.label": "Apparecchio ortodontico",
    "ortho.appliance.none": "nessuno",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Banda",
    "ortho.drift.label": "Spostamento",
    "ortho.drift.none": "nessuno",
    "ortho.drift.mesial": "Mesiale",
    "ortho.drift.distal": "Distale",
    "ortho.vertical.label": "Verticale",
    "ortho.vertical.none": "nessuno",
    "ortho.vertical.extrusion": "Estrusione",
    "ortho.vertical.intrusion": "Intrusione",
    "ortho.rotation.label": "Rotazione",
    "toothInfo.discoloration": "Discromia",
    "toothInfo.discolorationEmpty": "nessuna discromia registrata",
    "toothInfo.wear": "Usura",
    "toothInfo.wearEmpty": "nessuna usura registrata",
    "toothInfo.orthodontics": "Ortodonzia",
    "toothInfo.orthodonticsEmpty": "nessun reperto ortodontico registrato",
    "tooth.bridgePillar": "Pilastro di ponte",
    "tooth.extractionPlan": "Estrazione pianificata",
    "tooth.crownReplace": "Sostituzione corona",
    "tooth.crownNeeded": "Corona necessaria",
    "tooth.missingClosed": "Spazio chiuso",
    "caries.title": "Carie",
    "caries.hint": "Seleziona le superfici cariose",
    "caries.depthLabel": "Profondità",
    "caries.depth.surface": "Superficiale (smalto)",
    "caries.depth.dentin": "Dentina",
    "caries.depth.deep": "Profonda (vicino alla polpa)",
    "filling.title": "Otturazioni e restauri",
    "filling.typeLabel": "Tipo",
    "filling.fissureSealing": "Sigillatura dei solchi",
    "filling.subcariesSummarySingle": "In {{teeth}} è presente subcaries accanto all'otturazione.",
    "filling.subcariesSummaryMultiple": "In {{teeth}} è presente subcaries accanto alle otturazioni.",
    "filling.fillingDefectSummarySingle": "In {{teeth}} è registrato un difetto dell'otturazione.",
    "filling.fillingDefectSummaryMultiple": "In {{teeth}} sono registrati difetti dell'otturazione.",
    "endo.title": "Radice",
    "endo.hint": "Seleziona lo stato della radice",
    "endo.pulpitis": "Pulpite",
    "endo.resection": "Dente resecato",
    "endo.parapulpalPin": "Perno parapulpale",
    "inflammation.title": "Parodonto e infiammazioni",
    "inflammation.mobilityLabel": "Mobilità",
    "language.label": "Lingua",
    "language.hu": "🇭🇺 Ungherese",
    "language.en": "🇬🇧 Inglese",
    "language.de": "🇩🇪 Tedesco",
    "language.es": "🇪🇸 Spagnolo",
    "language.it": "🇮🇹 Italiano",
    "language.sk": "🇸🇰 Slovacco",
    "language.pl": "🇵🇱 Polacco",
    "language.ru": "🇷🇺 Russo",
    "language.pt-br": "🇧🇷 Portoghese brasiliano",
    "numbering.label": "Numerazione",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - USA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Impostazioni",
    "settings.notes": "Note",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Smalto (asciutto)",
    "icdas.code.2": "Smalto (umido)",
    "icdas.code.3": "Rottura dello smalto",
    "icdas.code.4": "Ombra dentinale",
    "icdas.code.5": "Cavità (dentina)",
    "icdas.code.6": "Cavità estesa",
    "icdas.desc.1": "Prima alterazione visibile dello smalto (visibile solo dopo asciugatura prolungata)",
    "icdas.desc.2": "Alterazione evidente dello smalto (visibile da umido)",
    "icdas.desc.3": "Rottura localizzata dello smalto senza dentina visibile",
    "icdas.desc.4": "Ombra scura sottostante dalla dentina, con o senza rottura dello smalto",
    "icdas.desc.5": "Cavità evidente con dentina visibile",
    "icdas.desc.6": "Cavità estesa con dentina visibile (oltre metà della superficie)",
    "theme.light": "Modalità chiara",
    "theme.dark": "Modalità scura",
    "selection.none": "—",
    "selection.count": "{{count}} denti",
    "toothSelect.none": "Dente mancante",
    "toothSelect.permanent": "Dente permanente",
    "toothSelect.milk": "Dente primario",
    "toothSelect.implant": "Impianto",
    "toothSelect.crownPrep": "Preparato per corona",
    "toothSelect.underGum": "Dente sottogengivale",
    "endo.option.none": "Radice sana",
    "endo.option.medicalFilling": "Otturazione radicolare medicinale",
    "endo.option.filling": "Otturazione radicolare",
    "endo.option.incompleteFilling": "Otturazione radicolare incompleta",
    "endo.option.glassPin": "Otturazione radicolare con perno in fibra di vetro",
    "endo.option.metalPin": "Otturazione radicolare con perno metallico",
    "filling.option.none": "Nessuna otturazione",
    "filling.option.amalgam": "Otturazione in amalgama",
    "filling.option.composite": "Otturazione in composito",
    "filling.option.gic": "Otturazione in vetroionomero",
    "filling.option.temporary": "Otturazione provvisoria",
    "crown.option.noneImplant": "Nessuno",
    "crown.option.healingAbutment": "Abutment di guarigione",
    "crown.option.zircon": "Corona in zirconio",
    "crown.option.metal": "Corona in metalloceramica",
    "crown.option.temporary": "Corona provvisoria",
    "crown.option.locator": "Locator",
    "crown.option.locatorProsthesis": "Locator + dente protesico",
    "crown.option.bar": "Impianto con barra",
    "crown.option.barProsthesis": "Barra + dente protesico",
    "crown.option.full": "Corona completa",
    "crown.option.broken": "Corona fratturata",
    "crown.option.radix": "Radix",
    "crown.option.emax": "Intarsio in ceramica pressata",
    "crown.option.telescope": "Corona telescopica",
    "bridge.option.none": "Nessuno",
    "bridge.option.removable": "Protesi rimovibile",
    "bridge.option.zircon": "Elemento di ponte in zirconio",
    "bridge.option.metal": "Elemento di ponte in metalloceramica",
    "bridge.option.temporary": "Elemento di ponte provvisorio",
    "bridge.option.bar": "Travata a barra",
    "bridge.option.barProsthesis": "Barra + dente protesico",
    "restoration.none": "Nessuna",
    "restoration.prefix.fixed": "Fissa",
    "restoration.prefix.removable": "Rimovibile",
    "restoration.type.crown": "Corona",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Faccetta",
    "restoration.type.bridge": "Elemento ponte",
    "prosthesis.none": "Nessuna",
    "prosthesis.type.healingAbutment": "Vite di guarigione",
    "prosthesis.type.locator": "Attacco Locator",
    "prosthesis.type.locatorDenture": "Overdenture su Locator",
    "prosthesis.type.bar": "Attacco a barra",
    "prosthesis.type.barDenture": "Overdenture su barra",
    "prosthesis.type.removablePartial": "Protesi parziale removibile",
    "prosthesis.type.removableFull": "Protesi totale removibile",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "oro",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "zirconio",
    "restoration.material.metal": "metallo",
    "restoration.material.metalCeramic": "metallo-ceramica",
    "restoration.material.telescope": "telescopica",
    "restoration.material.temporary": "provvisoria",
    "substrate.natural": "Sano",
    "substrate.radix": "Radix",
    "substrate.broken": "Fratturato",
    "substrate.crownprep": "Preparato per corona",
    "restoration.label": "Restauro",
    "substrate.label": "Condizione del dente",
    "mobility.none": "Nessuno",
    "mobility.m1": "Grado 1",
    "mobility.m2": "Grado 2",
    "mobility.m3": "Grado 3",
    "mods.parodontal": "Infiammazione parodontale",
    "periImplant.label": "Stato peri-implantare",
    "periImplant.none": "Sano (nessuno)",
    "periImplant.mucositis": "Mucosite peri-implantare",
    "periImplant.periImplantitisMild": "Perimplantite – lieve perdita ossea",
    "periImplant.periImplantitisModerate": "Perimplantite – moderata perdita ossea",
    "periImplant.periImplantitisSevere": "Perimplantite – grave perdita ossea",
    "mods.periimplantitis": "Perimplantite",
    "mods.periodontalInflammation": "Infiammazione parodontale",
    "mods.periapicalInflammation": "Infiammazione periapicale",
    "periapical.typeLabel": "Lesione apicale",
    "card.rootPeriodontium": "Radice e parodonto",
    "pulpEndo.label": "Stato pulpa / endo",
    "pulpEndo.groupVital": "Polpa vitale",
    "pulpEndo.groupTreated": "Trattato (endo)",
    "calculus.label": "Tartaro",
    "crownLeakage.label": "Infiltrazione marginale della corona",
    "root.resorption": "Riassorbimento radicolare",
    "periapical.type.none": "Non specificato",
    "periapical.type.granuloma": "Granuloma",
    "periapical.type.cyst": "Cisti radicolare",
    "periapical.type.abscess": "Ascesso",
    "pulpDx.normal": "Normale",
    "pulpDx.reversiblePulpitis": "Pulpite reversibile",
    "pulpDx.irreversiblePulpitis": "Pulpite irreversibile",
    "pulpDx.necrosis": "Necrosi",
    "pulpLatin.none": "Non specificato",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Nessuna patologia apicale",
    "apicalDx.symptomaticApicalPeriodontitis": "Parodontite apicale sintomatica",
    "apicalDx.asymptomaticApicalPeriodontitis": "Parodontite apicale asintomatica",
    "apicalDx.acuteApicalAbscess": "Ascesso apicale acuto",
    "apicalDx.chronicApicalAbscess": "Ascesso apicale cronico",
    "apicalDx.condensingOsteitis": "Osteite condensante",
    "resorption.type.none": "Nessun riassorbimento radicolare",
    "resorption.type.internal": "Riassorbimento radicolare interno",
    "resorption.type.externalCervical": "Riassorbimento radicolare esterno (cervicale)",
    "pulp.level.simple": "Semplice",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latino",
    "pulp.dxLabel": "Diagnosi pulpare",
    "apical.dxLabel": "Diagnosi apicale",
    "pulp.level.label": "Livello di dettaglio pulpare",
    "rootCaries.none": "Nessuna carie radicolare",
    "rootCaries.active": "Carie radicolare attiva",
    "rootCaries.arrested": "Carie radicolare arrestata (inattiva)",
    "rootCaries.activeCavitated": "Carie radicolare attiva cavitata",
    "rootCaries.present": "carie radicolare",
    "radiographicDepth.none": "Nessuna profondità radiografica registrata",
    "radiographicDepth.E1": "Smalto, metà esterna (E1)",
    "radiographicDepth.E2": "Smalto, metà interna (E2)",
    "radiographicDepth.D1": "Dentina, terzo esterno (D1)",
    "radiographicDepth.D2": "Dentina, terzo medio (D2)",
    "radiographicDepth.D3": "Dentina, terzo interno (D3)",
    "radiographicDepth.superficial": "Superficiale (E1–E2)",
    "radiographicDepth.middle": "Media (D1)",
    "radiographicDepth.deep": "Profonda (D2–D3)",
    "fillingDefect.label": "Difetto dell'otturazione",
    "fillingDefect.none": "nessuno",
    "fillingDefect.marginal": "difetto marginale",
    "fillingDefect.fracture": "frattura / scheggiatura",
    "fillingDefect.wear": "usurato / carente",
    "secondaryCaries.sound": "Sana",
    "secondaryCaries.initial": "Iniziale",
    "secondaryCaries.moderate": "Moderata",
    "secondaryCaries.cavitated": "Cavitata",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Generale",
    "settings.tab.panels": "Pannelli",
    "settings.panels.statuses": "Stati",
    "settings.panels.statuses.desc": "Mostra il pannello Stati.",
    "settings.panels.orthodontics": "Ortodonzia",
    "settings.panels.orthodontics.desc": "Mostra il pannello Ortodonzia.",
    "settings.tab.toothDetails": "Dettagli dente",
    "caries.rootLabel": "Carie radicolare",
    "caries.secondaryLabel": "Carie secondaria (CARS)",
    "caries.radiographicLabel": "Profondità radiografica",
    "caries.details": "Dettagli carie",
    "caries.primaryTitle": "Carie",
    "caries.recurrentTitle": "Carie secondaria",
    "caries.recurrentHint": "Carie secondaria accanto all'otturazione: punteggio CARS",
    "caries.cars.0": "Sano",
    "caries.cars.1": "Prima alterazione visibile dello smalto",
    "caries.cars.2": "Alterazione visibile evidente dello smalto",
    "caries.cars.3": "Rottura localizzata dello smalto (senza dentina)",
    "caries.cars.4": "Ombra dentinale sottostante",
    "caries.cars.5": "Cavità evidente, dentina visibile",
    "caries.cars.6": "Cavità estesa",
    "caries.detailsHint": "Dettagli carie: profondità, secondaria, radiografica",
    "settings.tab.secondaryCaries": "Carie secondaria",
    "settings.tab.caries": "Carie",
    "settings.tab.pulpa": "Polpa",
    "settings.tab.notes": "Note",
    "settings.mode.simple": "Semplice",
    "settings.mode.advanced": "Avanzato",
    "settings.close": "Chiudi",
    "settings.comingSoon": "Prossimamente",
    "settings.theme.label": "Aspetto",
    "settings.exportImport.title": "Esporta / Importa",
    "settings.numbering.desc": "Sistema di numerazione dentale usato nel diagramma.",
    "settings.language.desc": "Lingua dell'interfaccia.",
    "settings.theme.desc": "Alterna tra aspetto chiaro e scuro.",
    "settings.exportImport.desc": "Salva o carica i dati dell'odontogramma. Questa sezione è in sviluppo.",
    "settings.toothInfo.desc": "Mostra il pannello informazioni dente sotto il diagramma.",
    "settings.secondaryCaries.desc": "Livello di dettaglio del selettore della carie secondaria (CARS).",
    "settings.secondaryCaries.simple": "Semplice",
    "settings.secondaryCaries.standard": "Standard",
    "settings.secondaryCaries.full": "Completo",
    "settings.icdas.desc": "Usa la scala ICDAS II (0–6) invece della scala a 3 livelli.",
    "settings.cariesDepth.label": "Profondità carie",
    "settings.cariesDepth.desc": "Codifica visivamente la profondità della carie su ogni superficie.",
    "settings.rootCaries.desc": "Livello di dettaglio del selettore della carie radicolare per dente.",
    "settings.rootCaries.simple": "Presente / assente",
    "settings.rootCaries.severity": "Gravità",
    "settings.radiographic.desc": "Classificazione radiografica della profondità della carie per superficie.",
    "settings.radiographic.off": "Off",
    "settings.radiographic.threeLevel": "3 livelli",
    "settings.radiographic.detailed": "Dettagliato",
    "settings.pulpLevel.desc": "Quanto dettaglio offre il selettore della diagnosi pulpare.",
    "settings.wearDetail.label": "Dettaglio usura",
    "settings.wearDetail.desc": "Semplice: interruttore sì/no (attrito); completo: tipo di usura per bordo incisale e cervicale.",
    "settings.discolorationDetail.label": "Dettaglio discromia",
    "settings.discolorationDetail.desc": "Semplice: interruttore sì/no; completo: scelta della causa della discromia.",
    "settings.surfaceNotation.label": "Notazione della superficie",
    "settings.surfaceNotation.desc": "Completo: le lettere delle superfici si adattano alla posizione del dente (dente anteriore: I=incisale, L=labiale; superiore: P=palatale; inferiore: L=linguale). Semplice: sempre B/O/L, indipendentemente dalla posizione.",
    "settings.surfaceNotation.simple": "Semplice",
    "settings.surfaceNotation.full": "Completo",
    "settings.toothDetail.simple": "Semplice",
    "settings.toothDetail.complex": "Completo",
    "settings.notes.desc": "Abilita note per dente (doppio clic per modificare).",
    "surface.mesial": "mesiale",
    "surface.distal": "distale",
    "surface.buccal": "buccale",
    "surface.lingualPalatal": "linguale/palatale",
    "surface.occlusal": "occlusale",
    "surface.incisal": "incisale",
    "surface.subcrown": "sottocoronale",
    "surface.labial": "labiale",
    "surface.palatal": "palatale",
    "surface.lingual": "linguale",
    "actions.expand": "Apri {{label}}",
    "actions.collapse": "Chiudi {{label}}",
    "debug.numbering.title": "Debug numerazione (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Superiore 12-22 zirconio",
    "statusExtras.upper13_23Zircon": "Superiore 13-23 zirconio",
    "statusExtras.upper16_26Zircon": "Superiore 16-26 zirconio",
    "statusExtras.upperFullZircon": "Ponte completo superiore in zirconio",
    "statusExtras.upper12_22Metal": "Superiore 12-22 metalloceramica",
    "statusExtras.upper13_23Metal": "Superiore 13-23 metalloceramica",
    "statusExtras.upper16_26Metal": "Superiore 16-26 metalloceramica",
    "statusExtras.upperFullMetal": "Ponte completo superiore in metalloceramica",
    "statusExtras.upperPartialRemovable": "Superiore parziale rimovibile",
    "statusExtras.upperFullRemovable": "Superiore totale rimovibile",
    "statusExtras.upperBarDenture": "Protesi superiore con barra",
    "statusExtras.lower42_32Zircon": "Inferiore 42-32 zirconio",
    "statusExtras.lower43_33Zircon": "Inferiore 43-33 zirconio",
    "statusExtras.lower46_36Zircon": "Inferiore 46-36 zirconio",
    "statusExtras.lowerFullZircon": "Ponte completo inferiore in zirconio",
    "statusExtras.lower42_32Metal": "Inferiore 42-32 metalloceramica",
    "statusExtras.lower43_33Metal": "Inferiore 43-33 metalloceramica",
    "statusExtras.lower46_36Metal": "Inferiore 46-36 metalloceramica",
    "statusExtras.lowerFullMetal": "Ponte completo inferiore in metalloceramica",
    "statusExtras.lowerPartialRemovable": "Inferiore parziale rimovibile",
    "statusExtras.lowerFullRemovable": "Inferiore totale rimovibile",
    "statusExtras.lowerBarDenture": "Protesi inferiore con barra",
    "touch.zoom.title": "Dente #{{tooth}}",
    "touch.zoom.select": "Seleziona",
    "touch.zoom.deselect": "Deseleziona",
    "touch.zoom.info": "Dettagli",
    "touch.zoom.close": "Chiudi",
    "touch.ctx.select": "Seleziona",
    "touch.ctx.multiSelect": "Aggiungi alla selezione",
    "touch.ctx.deselect": "Deseleziona",
    "touch.ctx.reset": "Ripristina",
    "touch.arch.upper": "Arcata superiore",
    "touch.arch.lower": "Arcata inferiore",
    "touch.arch.both": "Entrambe",
    "chart.hint.touch": "Tocca un dente per selezionarlo. Premi a lungo per altre opzioni.",
    "warn.endoOnMissing": "Trattamento radicolare non possibile su dente mancante/impianto",
    "warn.fillingOnMissing": "Otturazione non possibile su dente mancante",
    "warn.crownReplaceNoCrown": "Sostituzione corona segnata senza corona",
    "warn.cariesOnMissing": "Carie non possibile su dente mancante",
    "warn.pillarNoCrown": "Pilastro del ponte segnato senza materiale corona",
    "warn.invalidRestorationCombo": "Combinazione tipo/materiale di restauro non valida (corretta automaticamente)",
    "readOnly.label": "Sola lettura",
    "note.title": "Nota",
    "note.save": "Salva",
    "note.delete": "Elimina",
    "note.placeholder": "Aggiungi una nota...",
    "intro.start": "Introduzione",
    "intro.next": "Avanti",
    "intro.back": "Indietro",
    "intro.skip": "Salta",
    "intro.finish": "Fatto",
    "intro.step1.title": "Seleziona un dente",
    "intro.step1.text": "Clicca su un dente nell'odontogramma per iniziare la modifica.",
    "intro.step2.title": "Carie",
    "intro.step2.text": "Segna le superfici cariate nella disposizione a croce (B/M/O/D/L).",
    "intro.step3.title": "Pulpite",
    "intro.step3.text": "Attiva l'infiammazione pulpare sul dente selezionato.",
    "intro.step4.title": "Impianto",
    "intro.step4.text": "Imposta il tipo di dente su impianto dal menu a tendina.",
    "intro.step5.title": "Otturazione",
    "intro.step5.text": "Scegli un materiale, poi segna le superfici — ogni superficie può avere il proprio materiale.",
    "intro.step6.title": "Corona",
    "intro.step6.text": "Scegli il materiale della corona.",
    "intro.step7.title": "Nota sul dente",
    "intro.step7.text": "Fai doppio clic su un dente per aggiungere una nota.",
    "intro.step8.title": "Filtri di selezione",
    "intro.step8.text": "Seleziona rapidamente gruppi di denti: superiori/inferiori, frontali, molari.",
    "intro.step9.title": "Numerazione e lingua",
    "intro.step9.text": "Cambia il sistema di numerazione o la lingua nell'intestazione.",
    "intro.step10.title": "Esporta",
    "intro.step10.text": "Esporta l'odontogramma come JSON, FHIR, PNG o JPG.",
    "intro.step11.title": "Importa",
    "intro.step11.text": "Carica un odontogramma precedente da JSON o FHIR.",
    "intro.step12.title": "Tutto pronto!",
    "intro.step12.text": "Queste sono le basi — esplora le altre funzionalità."
  },
  sk: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Vyber zub na odontograme a nastav vrstvy.",
    "app.subtitleLang": "V slovenčine.",
    "app.subtitleNumbering.FDI": "S číslovaním FDI – ISO 3950.",
    "app.subtitleNumbering.UNIVERSAL": "S číslovaním Universal (ADA).",
    "app.subtitleNumbering.PALMER": "S číslovaním Palmer.",
    "app.subtitleMode.light": "V svetlom režime.",
    "app.subtitleMode.dark": "V tmavom režime.",
    "settings.toothInfo": "Panel informácií o zuboch",
    "toothInfo.title": "Informácie o zuboch",
    "toothInfo.overview": "Odontogram zobrazuje {{present}}{{milk}} a {{missing}}.",
    "toothInfo.overviewImplant": "Odontogram zobrazuje {{present}}{{milk}}, {{missing}} a {{implant}}.",
    "toothInfo.overviewMilkOnly": "Odontogram zobrazuje {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} trvalý zub",
    "toothInfo.presentOther": "{{n}} trvalých zubov",
    "toothInfo.missingOne": "chýba {{n}} zub",
    "toothInfo.missingOther": "chýba {{n}} zubov",
    "toothInfo.implantOne": "{{n}} zub má implantát",
    "toothInfo.implantOther": "{{n}} zubov má implantát",
    "toothInfo.milkOne": "{{n}} mliečny zub",
    "toothInfo.milkOther": "{{n}} mliečnych zubov",
    "toothInfo.permanentList": "trvalé zuby ({{count}}): {{list}}",
    "toothInfo.missingList": "zuby označené ako chýbajúce ({{count}}): {{list}}",
    "toothInfo.caries": "Kaz",
    "toothInfo.cariesEmpty": "Žiadne zuby s kazom.",
    "toothInfo.secondary": "sekundárny",
    "toothInfo.diagnoses": "Diagnózy",
    "toothInfo.diagnosesEmpty": "žiadna zaznamenaná diagnóza",
    "summary.severity.superficial": "povrchový",
    "summary.severity.moderate": "stredný",
    "summary.severity.deep": "hlboký",
    "summary.fracture": "Fraktúra",
    "toothInfo.fillings": "Výplne",
    "toothInfo.fillingsEmpty": "Žiadne plombované zuby.",
    "toothInfo.endo": "Endodontické ošetrenia",
    "toothInfo.endoEmpty": "Žiadne endodonticky ošetrené zuby.",
    "toothInfo.resected": "resekovaný zub",
    "toothInfo.prosthetics": "Protetika",
    "toothInfo.prostheticsEmpty": "Žiadna protetika.",
    "toothInfo.implants": "Implantáty",
    "toothInfo.periodontalTitle": "Stav parodontu",
    "toothInfo.periodontalHealthy": "parodont je zdravý",
    "toothInfo.periodontalInflamed": "zápal je prítomný na nasledujúcich zuboch: {{list}}",
    "topbar.exportStatus": "Exportovať stav",
    "topbar.exportFhir": "Export FHIR",
    "topbar.export": "Export",
    "export.menu.statusJson": "Stav JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "Obrázok PNG",
    "export.menu.jpg": "Obrázok JPG",
    "export.menu.svg": "Obrázok SVG",
    "export.progress.title": "Prebieha export",
    "export.progress.preparing": "Príprava…",
    "export.progress.rendering": "Vykresľovanie…",
    "export.progress.encoding": "Kódovanie…",
    "export.progress.done": "Hotovo",
    "topbar.exportPng": "Export PNG",
    "topbar.exportJpg": "Export JPG",
    "topbar.importStatus": "Importovať stav",
    "topbar.import": "Import",
    "import.menu.statusJson": "Stav JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Zubný status",
    "chart.hint": "Klikni na zub. Pre viacnásobný výber použi CMD/CTRL + klik.",
    "chart.actions.occlusal": "Viditeľnosť oklúzneho pohľadu",
    "chart.actions.wisdom": "Viditeľnosť zubov múdrosti",
    "chart.actions.bone": "Viditeľnosť kosti",
    "chart.actions.pulp": "Viditeľnosť drene",
    "chart.actions.clearSelection": "Zrušiť výber",
    "chart.aria.toothGrid": "Zubná mriežka",
    "panel.controls": "Ovládanie",
    "panel.clearSelection": "Zrušiť výber",
    "panel.toggleControls": "Ovládanie",
    "panel.activeTooth": "Aktívny zub",
    "panel.selectActions.all": "Všetky",
    "panel.selectActions.present": "Zuby",
    "panel.selectActions.permanent": "Trvalé",
    "panel.selectActions.milk": "Mliečne",
    "panel.selectActions.implants": "Implantáty",
    "panel.selectActions.missing": "Chýbajúce",
    "panel.selectActions.upper": "Horné",
    "panel.selectActions.upperFront": "Horné 6 predné",
    "panel.selectActions.upperMolar": "Horné moláre",
    "panel.selectActions.lower": "Dolné",
    "panel.selectActions.lowerFront": "Dolné 6 predné",
    "panel.selectActions.lowerMolar": "Dolné moláre",
    "status.title": "Stavy",
    "status.resetAll": "Obnoviť ústa",
    "status.primaryDentition": "Mliečny chrup",
    "status.mixedDentition": "Zmiešaný chrup",
    "status.edentulous": "Bezzubý",
    "status.extraLabel": "Pridať:",
    "status.extraApply": "OK",
    "tooth.title": "Detaily zuba",
    "tooth.reset": "Obnoviť",
    "tooth.resetTitle": "Obnoviť zub na predvolené",
    "tooth.baseLabel": "Základ",
    "tooth.bridgeLabel": "Protéza",
    "tooth.extractionWound": "čerstvá extrakčná rana",
    "tooth.crownLabel": "Korunka",
    "tooth.broken.mesial": "meziálne",
    "tooth.broken.incisal": "incizálne",
    "tooth.broken.distal": "distálne",
    "tooth.contact.mesialMissing": "chýbajúci meziálny kontakt",
    "tooth.contact.distalMissing": "chýbajúci distálny kontakt",
    "tooth.bruxism.edgeWear": "Incizálne opotrebenie",
    "tooth.bruxism.neckWear": "Cervikálne opotrebenie",
    "wearType.none": "žiadne",
    "wearType.attrition": "Atrícia",
    "wearType.abrasion": "Abrázia",
    "wearType.erosion": "Erózia",
    "wearType.abfraction": "Abfrakcia",
    "discoloration.label": "Zmena farby",
    "discoloration.none": "žiadna",
    "discoloration.tetracycline": "Tetracyklínové sfarbenie",
    "discoloration.fluorosis": "Fluoróza",
    "discoloration.nonvital": "Nevitálne stmavnutie",
    "discoloration.extrinsic": "Extrinsické sfarbenie",
    "discoloration.other": "Iné / neznáme",
    "ortho.appliance.label": "Ortodontický aparát",
    "ortho.appliance.none": "žiadny",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Krúžok/band",
    "ortho.drift.label": "Posun",
    "ortho.drift.none": "žiadny",
    "ortho.drift.mesial": "Meziálny",
    "ortho.drift.distal": "Distálny",
    "ortho.vertical.label": "Vertikálne",
    "ortho.vertical.none": "žiadne",
    "ortho.vertical.extrusion": "Extrúzia",
    "ortho.vertical.intrusion": "Intrúzia",
    "ortho.rotation.label": "Rotácia",
    "toothInfo.discoloration": "Zmena farby",
    "toothInfo.discolorationEmpty": "žiadna zaznamenaná zmena farby",
    "toothInfo.wear": "Opotrebenie",
    "toothInfo.wearEmpty": "žiadne opotrebenie",
    "toothInfo.orthodontics": "Ortodoncia",
    "toothInfo.orthodonticsEmpty": "žiadny zaznamenaný ortodontický nález",
    "tooth.bridgePillar": "Pilier mostíka",
    "tooth.extractionPlan": "Plánovaná extrakcia",
    "tooth.crownReplace": "Výmena korunky",
    "tooth.crownNeeded": "Korunka potrebná",
    "tooth.missingClosed": "Uzavretá medzera",
    "caries.title": "Kaz",
    "caries.hint": "Vyber povrchy kazu",
    "caries.depthLabel": "Hĺbka",
    "caries.depth.surface": "Povrchový (sklovina)",
    "caries.depth.dentin": "Dentín",
    "caries.depth.deep": "Hlboký (blízko pulpy)",
    "filling.title": "Výplne a reštaurácie",
    "filling.typeLabel": "Typ",
    "filling.fissureSealing": "Zapečatenie fisúr",
    "filling.subcariesSummarySingle": "Pri {{teeth}} je nastavená subcaries vedľa výplne.",
    "filling.subcariesSummaryMultiple": "Pri {{teeth}} je nastavená subcaries vedľa výplní.",
    "filling.fillingDefectSummarySingle": "Pri {{teeth}} je zaznamenaný defekt výplne.",
    "filling.fillingDefectSummaryMultiple": "Pri {{teeth}} sú zaznamenané defekty výplní.",
    "endo.title": "Koreň",
    "endo.hint": "Vyber stav koreňa",
    "endo.pulpitis": "Pulpitída",
    "endo.resection": "Resekovaný zub",
    "endo.parapulpalPin": "Parapulpálny kolík",
    "inflammation.title": "Parodont a zápaly",
    "inflammation.mobilityLabel": "Mobilita",
    "language.label": "Jazyk",
    "language.hu": "🇭🇺 Maďarčina",
    "language.en": "🇬🇧 Angličtina",
    "language.de": "🇩🇪 Nemčina",
    "language.es": "🇪🇸 Španielčina",
    "language.it": "🇮🇹 Taliančina",
    "language.sk": "🇸🇰 Slovenčina",
    "language.pl": "🇵🇱 Poľština",
    "language.ru": "🇷🇺 Ruština",
    "language.pt-br": "🇧🇷 Brazílska portugalčina",
    "numbering.label": "Číslovanie",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - USA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Nastavenia",
    "settings.notes": "Poznámky",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Sklovina (vysušená)",
    "icdas.code.2": "Sklovina (vlhká)",
    "icdas.code.3": "Narušenie skloviny",
    "icdas.code.4": "Dentínový tieň",
    "icdas.code.5": "Kavita (dentín)",
    "icdas.code.6": "Rozsiahla kavita",
    "icdas.desc.1": "Prvá viditeľná zmena skloviny (viditeľná až po dlhšom vysušení)",
    "icdas.desc.2": "Zreteľná zmena skloviny (viditeľná aj za vlhka)",
    "icdas.desc.3": "Lokalizované narušenie skloviny bez viditeľného dentínu",
    "icdas.desc.4": "Tmavý tieň z dentínu, s narušením skloviny alebo bez neho",
    "icdas.desc.5": "Zreteľná kavita s viditeľným dentínom",
    "icdas.desc.6": "Rozsiahla kavita s viditeľným dentínom (viac než polovica povrchu)",
    "theme.light": "Svetlý režim",
    "theme.dark": "Tmavý režim",
    "selection.none": "—",
    "selection.count": "{{count}} zubov",
    "toothSelect.none": "Chýbajúci zub",
    "toothSelect.permanent": "Trvalý zub",
    "toothSelect.milk": "Mliečny zub",
    "toothSelect.implant": "Implantát",
    "toothSelect.crownPrep": "Preparovaný na korunku",
    "toothSelect.underGum": "Subgingiválny zub",
    "endo.option.none": "Zdravý koreň",
    "endo.option.medicalFilling": "Liečivá koreňová výplň",
    "endo.option.filling": "Koreňová výplň",
    "endo.option.incompleteFilling": "Nekompletná koreňová výplň",
    "endo.option.glassPin": "Koreňová výplň so skleneným kolíkom",
    "endo.option.metalPin": "Koreňová výplň s kovovým kolíkom",
    "filling.option.none": "Žiadna výplň",
    "filling.option.amalgam": "Amalgámová výplň",
    "filling.option.composite": "Kompozitná výplň",
    "filling.option.gic": "Skloionomérna výplň",
    "filling.option.temporary": "Dočasná výplň",
    "crown.option.noneImplant": "Žiadna",
    "crown.option.healingAbutment": "Hojivý abutment",
    "crown.option.zircon": "Zirkónová korunka",
    "crown.option.metal": "Kovovo-keramická korunka",
    "crown.option.temporary": "Dočasná korunka",
    "crown.option.locator": "Lokátor",
    "crown.option.locatorProsthesis": "Lokátor + protézny zub",
    "crown.option.bar": "Stegový implantát",
    "crown.option.barProsthesis": "Steg + protézny zub",
    "crown.option.full": "Plná korunka",
    "crown.option.broken": "Zlomená korunka",
    "crown.option.radix": "Radix",
    "crown.option.emax": "Lisovaná keramická vložka",
    "crown.option.telescope": "Teleskopická korunka",
    "bridge.option.none": "Žiadny",
    "bridge.option.removable": "Snímateľná protéza",
    "bridge.option.zircon": "Zirkónový mostík",
    "bridge.option.metal": "Kovovo-keramický mostík",
    "bridge.option.temporary": "Dočasný mostík",
    "bridge.option.bar": "Stegové premostenie",
    "bridge.option.barProsthesis": "Steg + protézny zub",
    "restoration.none": "Žiadna",
    "restoration.prefix.fixed": "Fixná",
    "restoration.prefix.removable": "Vyberateľná",
    "restoration.type.crown": "Korunka",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Fazeta",
    "restoration.type.bridge": "Mostíkový člen",
    "prosthesis.none": "Žiadna",
    "prosthesis.type.healingAbutment": "Hojivý abutment",
    "prosthesis.type.locator": "Locator uchytenie",
    "prosthesis.type.locatorDenture": "Snímateľná náhrada na Locatore",
    "prosthesis.type.bar": "Stegová tyč",
    "prosthesis.type.barDenture": "Snímateľná náhrada na stegovej tyči",
    "prosthesis.type.removablePartial": "Čiastočná snímateľná náhrada",
    "prosthesis.type.removableFull": "Celková snímateľná náhrada",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "zlato",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "zirkónium",
    "restoration.material.metal": "kov",
    "restoration.material.metalCeramic": "kovokeramika",
    "restoration.material.telescope": "teleskopická",
    "restoration.material.temporary": "dočasná",
    "substrate.natural": "Intaktný",
    "substrate.radix": "Radix",
    "substrate.broken": "Zlomený",
    "substrate.crownprep": "Pripravený na korunku",
    "restoration.label": "Reštaurácia",
    "substrate.label": "Stav zuba",
    "mobility.none": "Žiadna",
    "mobility.m1": "Stupeň 1",
    "mobility.m2": "Stupeň 2",
    "mobility.m3": "Stupeň 3",
    "mods.parodontal": "Parodontálny zápal",
    "periImplant.label": "Peri-implantátový stav",
    "periImplant.none": "Zdravý (žiadny)",
    "periImplant.mucositis": "Peri-implantátová mukozitída",
    "periImplant.periImplantitisMild": "Periimplantitída – mierny úbytok kosti",
    "periImplant.periImplantitisModerate": "Periimplantitída – stredný úbytok kosti",
    "periImplant.periImplantitisSevere": "Periimplantitída – ťažký úbytok kosti",
    "mods.periimplantitis": "Periimplantitída",
    "mods.periodontalInflammation": "Parodontálny zápal",
    "mods.periapicalInflammation": "Periapikálny zápal",
    "periapical.typeLabel": "Apikálna lézia",
    "card.rootPeriodontium": "Koreň a parodont",
    "pulpEndo.label": "Stav pulpy / endo",
    "pulpEndo.groupVital": "Vitálna pulpa",
    "pulpEndo.groupTreated": "Ošetrený (endo)",
    "calculus.label": "Zubný kameň",
    "crownLeakage.label": "Netesnosť okraja korunky",
    "root.resorption": "Resorpcia koreňa",
    "periapical.type.none": "Neurčené",
    "periapical.type.granuloma": "Granulóm",
    "periapical.type.cyst": "Radikulárna cysta",
    "periapical.type.abscess": "Absces",
    "pulpDx.normal": "Normálny",
    "pulpDx.reversiblePulpitis": "Reverzibilná pulpitída",
    "pulpDx.irreversiblePulpitis": "Ireverzibilná pulpitída",
    "pulpDx.necrosis": "Nekróza",
    "pulpLatin.none": "Neuvedené",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Bez apikálnej patológie",
    "apicalDx.symptomaticApicalPeriodontitis": "Symptomatická apikálna periodontitída",
    "apicalDx.asymptomaticApicalPeriodontitis": "Asymptomatická apikálna periodontitída",
    "apicalDx.acuteApicalAbscess": "Akútny apikálny absces",
    "apicalDx.chronicApicalAbscess": "Chronický apikálny absces",
    "apicalDx.condensingOsteitis": "Kondenzujúca osteitída",
    "resorption.type.none": "Bez resorpcie koreňa",
    "resorption.type.internal": "Vnútorná resorpcia koreňa",
    "resorption.type.externalCervical": "Vonkajšia (cervikálna) resorpcia koreňa",
    "pulp.level.simple": "Jednoduchý",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latinčina",
    "pulp.dxLabel": "Diagnóza pulpy",
    "apical.dxLabel": "Apikálna diagnóza",
    "pulp.level.label": "Úroveň detailu pulpy",
    "rootCaries.none": "Žiadny koreňový kaz",
    "rootCaries.active": "Aktívny koreňový kaz",
    "rootCaries.arrested": "Zastavený (neaktívny) koreňový kaz",
    "rootCaries.activeCavitated": "Aktívny kavitovaný koreňový kaz",
    "rootCaries.present": "koreňový kaz",
    "radiographicDepth.none": "Bez zaznamenanej rádiografickej hĺbky",
    "radiographicDepth.E1": "Sklovina, vonkajšia polovica (E1)",
    "radiographicDepth.E2": "Sklovina, vnútorná polovica (E2)",
    "radiographicDepth.D1": "Dentín, vonkajšia tretina (D1)",
    "radiographicDepth.D2": "Dentín, stredná tretina (D2)",
    "radiographicDepth.D3": "Dentín, vnútorná tretina (D3)",
    "radiographicDepth.superficial": "Povrchová (E1–E2)",
    "radiographicDepth.middle": "Stredná (D1)",
    "radiographicDepth.deep": "Hlboká (D2–D3)",
    "fillingDefect.label": "Defekt výplne",
    "fillingDefect.none": "žiadny",
    "fillingDefect.marginal": "marginálny defekt",
    "fillingDefect.fracture": "fraktúra / odštiepenie",
    "fillingDefect.wear": "opotrebovaný / nedostatočný",
    "secondaryCaries.sound": "Zdravý",
    "secondaryCaries.initial": "Začiatočný",
    "secondaryCaries.moderate": "Stredný",
    "secondaryCaries.cavitated": "Kavitovaný",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Všeobecné",
    "settings.tab.panels": "Panely",
    "settings.panels.statuses": "Stavy",
    "settings.panels.statuses.desc": "Zobraziť panel Stavy.",
    "settings.panels.orthodontics": "Ortodoncia",
    "settings.panels.orthodontics.desc": "Zobraziť panel Ortodoncia.",
    "settings.tab.toothDetails": "Detaily zuba",
    "caries.rootLabel": "Koreňový kaz",
    "caries.secondaryLabel": "Sekundárny kaz (CARS)",
    "caries.radiographicLabel": "Rádiologická hĺbka",
    "caries.details": "Podrobnosti o kaze",
    "caries.primaryTitle": "Kaz",
    "caries.recurrentTitle": "Sekundárny kaz",
    "caries.recurrentHint": "Sekundárny kaz vedľa výplne: skóre CARS",
    "caries.cars.0": "Zdravý",
    "caries.cars.1": "Prvá viditeľná zmena skloviny",
    "caries.cars.2": "Zreteľná viditeľná zmena skloviny",
    "caries.cars.3": "Lokalizovaný rozpad skloviny (bez dentínu)",
    "caries.cars.4": "Tieň podložného dentínu",
    "caries.cars.5": "Zreteľná kavita, viditeľný dentín",
    "caries.cars.6": "Rozsiahla kavita",
    "caries.detailsHint": "Podrobnosti o kaze: hĺbka, sekundárny, rádiologický",
    "settings.tab.secondaryCaries": "Sekundárny kaz",
    "settings.tab.caries": "Kaz",
    "settings.tab.pulpa": "Dreň",
    "settings.tab.notes": "Poznámky",
    "settings.mode.simple": "Jednoduchý",
    "settings.mode.advanced": "Pokročilý",
    "settings.close": "Zavrieť",
    "settings.comingSoon": "Čoskoro",
    "settings.theme.label": "Vzhľad",
    "settings.exportImport.title": "Export / Import",
    "settings.numbering.desc": "Systém číslovania zubov použitý v diagrame.",
    "settings.language.desc": "Jazyk rozhrania.",
    "settings.theme.desc": "Prepínanie medzi svetlým a tmavým vzhľadom.",
    "settings.exportImport.desc": "Uložiť alebo načítať údaje odontogramu. Táto časť sa vyvíja.",
    "settings.toothInfo.desc": "Zobraziť panel s informáciami o zube pod diagramom.",
    "settings.secondaryCaries.desc": "Úroveň podrobnosti výberu sekundárneho kazu (CARS).",
    "settings.secondaryCaries.simple": "Jednoduché",
    "settings.secondaryCaries.standard": "Štandardné",
    "settings.secondaryCaries.full": "Úplné",
    "settings.icdas.desc": "Použiť škálu ICDAS II (0–6) namiesto 3-úrovňovej škály kazu.",
    "settings.cariesDepth.label": "Hĺbka kazu",
    "settings.cariesDepth.desc": "Vizuálne zakódovať hĺbku kazu na každej ploche.",
    "settings.rootCaries.desc": "Úroveň podrobnosti výberu kazu koreňa pre zub.",
    "settings.rootCaries.simple": "Prítomný / neprítomný",
    "settings.rootCaries.severity": "Závažnosť",
    "settings.radiographic.desc": "Rádiologické hodnotenie hĺbky kazu na každej ploche.",
    "settings.radiographic.off": "Vypnuté",
    "settings.radiographic.threeLevel": "3 úrovne",
    "settings.radiographic.detailed": "Podrobné",
    "settings.pulpLevel.desc": "Koľko podrobností ponúka výber diagnózy pulpy.",
    "settings.wearDetail.label": "Detail opotrebenia",
    "settings.wearDetail.desc": "Jednoduché: prepínač áno/nie (atrícia); podrobné: typ opotrebenia pre hranu a krčok.",
    "settings.discolorationDetail.label": "Detail zmeny farby",
    "settings.discolorationDetail.desc": "Jednoduché: prepínač áno/nie; podrobné: výber príčiny zmeny farby.",
    "settings.surfaceNotation.label": "Označenie plôch",
    "settings.surfaceNotation.desc": "Podrobné: písmená plôch sa prispôsobujú polohe zuba (predný zub: I=incizálne, L=labiálne; horná čeľusť: P=palatinálne; dolná čeľusť: L=linguálne). Jednoduché: vždy B/O/L, bez ohľadu na polohu.",
    "settings.surfaceNotation.simple": "Jednoduché",
    "settings.surfaceNotation.full": "Podrobné",
    "settings.toothDetail.simple": "Jednoduché",
    "settings.toothDetail.complex": "Podrobné",
    "settings.notes.desc": "Povoliť poznámky pre zub (dvojklik na úpravu).",
    "surface.mesial": "meziálne",
    "surface.distal": "distálne",
    "surface.buccal": "bukálne",
    "surface.lingualPalatal": "linguálne/palatinálne",
    "surface.occlusal": "oklúzne",
    "surface.incisal": "incizálne",
    "surface.subcrown": "subkoronálne",
    "surface.labial": "labiálne",
    "surface.palatal": "palatinálne",
    "surface.lingual": "linguálne",
    "actions.expand": "Otvoriť {{label}}",
    "actions.collapse": "Zatvoriť {{label}}",
    "debug.numbering.title": "Debug číslovania (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Horný 12-22 zirkón",
    "statusExtras.upper13_23Zircon": "Horný 13-23 zirkón",
    "statusExtras.upper16_26Zircon": "Horný 16-26 zirkón",
    "statusExtras.upperFullZircon": "Horný zirkónový kruhový mostík",
    "statusExtras.upper12_22Metal": "Horný 12-22 kovovo-keramický",
    "statusExtras.upper13_23Metal": "Horný 13-23 kovovo-keramický",
    "statusExtras.upper16_26Metal": "Horný 16-26 kovovo-keramický",
    "statusExtras.upperFullMetal": "Horný kovovo-keramický kruhový mostík",
    "statusExtras.upperPartialRemovable": "Horná čiastočná snímateľná",
    "statusExtras.upperFullRemovable": "Horná celková snímateľná",
    "statusExtras.upperBarDenture": "Horná stegová protéza",
    "statusExtras.lower42_32Zircon": "Dolný 42-32 zirkón",
    "statusExtras.lower43_33Zircon": "Dolný 43-33 zirkón",
    "statusExtras.lower46_36Zircon": "Dolný 46-36 zirkón",
    "statusExtras.lowerFullZircon": "Dolný zirkónový kruhový mostík",
    "statusExtras.lower42_32Metal": "Dolný 42-32 kovovo-keramický",
    "statusExtras.lower43_33Metal": "Dolný 43-33 kovovo-keramický",
    "statusExtras.lower46_36Metal": "Dolný 46-36 kovovo-keramický",
    "statusExtras.lowerFullMetal": "Dolný kovovo-keramický kruhový mostík",
    "statusExtras.lowerPartialRemovable": "Dolná čiastočná snímateľná",
    "statusExtras.lowerFullRemovable": "Dolná celková snímateľná",
    "statusExtras.lowerBarDenture": "Dolná stegová protéza",
    "touch.zoom.title": "Zub #{{tooth}}",
    "touch.zoom.select": "Vybrať",
    "touch.zoom.deselect": "Zrušiť výber",
    "touch.zoom.info": "Podrobnosti",
    "touch.zoom.close": "Zavrieť",
    "touch.ctx.select": "Vybrať",
    "touch.ctx.multiSelect": "Pridať k výberu",
    "touch.ctx.deselect": "Zrušiť výber",
    "touch.ctx.reset": "Obnoviť",
    "touch.arch.upper": "Horný oblúk",
    "touch.arch.lower": "Dolný oblúk",
    "touch.arch.both": "Oba",
    "chart.hint.touch": "Ťuknite na zub pre výber. Dlhým stlačením zobrazíte ďalšie možnosti.",
    "warn.endoOnMissing": "Ošetrenie koreňa nie je možné pri chýbajúcom/implantovanom zube",
    "warn.fillingOnMissing": "Plomba nie je možná pri chýbajúcom zube",
    "warn.crownReplaceNoCrown": "Výmena korunky označená bez korunky",
    "warn.cariesOnMissing": "Kaz nie je možný pri chýbajúcom zube",
    "warn.pillarNoCrown": "Mostový pilier označený bez materiálu korunky",
    "warn.invalidRestorationCombo": "Neplatná kombinácia typu a materiálu výplne/náhrady (automaticky opravené)",
    "readOnly.label": "Iba na čítanie",
    "note.title": "Poznámka",
    "note.save": "Uložiť",
    "note.delete": "Vymazať",
    "note.placeholder": "Pridať poznámku...",
    "intro.start": "Úvod",
    "intro.next": "Ďalej",
    "intro.back": "Späť",
    "intro.skip": "Preskočiť",
    "intro.finish": "Hotovo",
    "intro.step1.title": "Výber zuba",
    "intro.step1.text": "Kliknite na zub v odontograme a začnite s úpravou.",
    "intro.step2.title": "Zubný kaz",
    "intro.step2.text": "Označte kazivé plôšky v krížovom rozložení (B/M/O/D/L).",
    "intro.step3.title": "Pulpitída",
    "intro.step3.text": "Zapnite zápal zubnej drene na vybranom zube.",
    "intro.step4.title": "Implantát",
    "intro.step4.text": "Nastavte typ zuba na implantát z rozbaľovacieho zoznamu.",
    "intro.step5.title": "Výplň",
    "intro.step5.text": "Vyberte materiál a potom označte plôšky — každá plôška môže mať vlastný materiál.",
    "intro.step6.title": "Korunka",
    "intro.step6.text": "Vyberte materiál korunky.",
    "intro.step7.title": "Poznámka k zubu",
    "intro.step7.text": "Dvojkliknutím na zub pridáte poznámku.",
    "intro.step8.title": "Filtre výberu",
    "intro.step8.text": "Rýchlo vyberte skupiny zubov: horné/dolné, predné, moláre.",
    "intro.step9.title": "Číslovanie a jazyk",
    "intro.step9.text": "Prepnite systém číslovania alebo jazyk v hlavičke.",
    "intro.step10.title": "Export",
    "intro.step10.text": "Exportujte odontogram ako JSON, FHIR, PNG alebo JPG.",
    "intro.step11.title": "Import",
    "intro.step11.text": "Načítajte predchádzajúci odontogram z JSON alebo FHIR.",
    "intro.step12.title": "Všetko je pripravené!",
    "intro.step12.text": "To sú základy — preskúmajte ostatné funkcie."
  },
  pl: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Wybierz ząb na odontogramie, a następnie ustaw warstwy.",
    "app.subtitleLang": "Po polsku.",
    "app.subtitleNumbering.FDI": "Używając numeracji FDI – ISO 3950.",
    "app.subtitleNumbering.UNIVERSAL": "Używając numeracji Universal (ADA).",
    "app.subtitleNumbering.PALMER": "Używając numeracji Palmer.",
    "app.subtitleMode.light": "W trybie jasnym.",
    "app.subtitleMode.dark": "W trybie ciemnym.",
    "settings.toothInfo": "Panel informacji o zębach",
    "toothInfo.title": "Informacje o zębach",
    "toothInfo.overview": "Odontogram pokazuje {{present}}{{milk}} i {{missing}}.",
    "toothInfo.overviewImplant": "Odontogram pokazuje {{present}}{{milk}}, {{missing}}, a {{implant}}.",
    "toothInfo.overviewMilkOnly": "Odontogram pokazuje {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} ząb stały",
    "toothInfo.presentOther": "{{n}} zębów stałych",
    "toothInfo.missingOne": "brakuje {{n}} zęba",
    "toothInfo.missingOther": "brakuje {{n}} zębów",
    "toothInfo.implantOne": "{{n}} ząb ma implant",
    "toothInfo.implantOther": "{{n}} zębów ma implant",
    "toothInfo.milkOne": "{{n}} ząb mleczny",
    "toothInfo.milkOther": "{{n}} zębów mlecznych",
    "toothInfo.permanentList": "zęby stałe ({{count}}): {{list}}",
    "toothInfo.missingList": "zęby oznaczone jako brakujące ({{count}}): {{list}}",
    "toothInfo.caries": "Próchnica",
    "toothInfo.cariesEmpty": "Brak zębów z próchnicą.",
    "toothInfo.secondary": "wtórna",
    "toothInfo.diagnoses": "Diagnozy",
    "toothInfo.diagnosesEmpty": "brak zapisanej diagnozy",
    "summary.severity.superficial": "powierzchowny",
    "summary.severity.moderate": "umiarkowany",
    "summary.severity.deep": "głęboki",
    "summary.fracture": "Złamanie",
    "toothInfo.fillings": "Wypełnienia",
    "toothInfo.fillingsEmpty": "Brak wypełnionych zębów.",
    "toothInfo.endo": "Leczenie kanałowe",
    "toothInfo.endoEmpty": "Brak zębów leczonych kanałowo.",
    "toothInfo.resected": "ząb po resekcji",
    "toothInfo.prosthetics": "Protetyka",
    "toothInfo.prostheticsEmpty": "Brak protetyki.",
    "toothInfo.implants": "Implanty",
    "toothInfo.periodontalTitle": "Stan przyzębia",
    "toothInfo.periodontalHealthy": "przyzębie jest zdrowe",
    "toothInfo.periodontalInflamed": "stan zapalny występuje na następujących zębach: {{list}}",
    "topbar.exportStatus": "Eksportuj status",
    "topbar.exportFhir": "Eksport FHIR",
    "topbar.export": "Eksport",
    "export.menu.statusJson": "Status JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "Obraz PNG",
    "export.menu.jpg": "Obraz JPG",
    "export.menu.svg": "Obraz SVG",
    "export.progress.title": "Trwa eksport",
    "export.progress.preparing": "Przygotowanie…",
    "export.progress.rendering": "Renderowanie…",
    "export.progress.encoding": "Kodowanie…",
    "export.progress.done": "Gotowe",
    "topbar.exportPng": "Eksport PNG",
    "topbar.exportJpg": "Eksport JPG",
    "topbar.importStatus": "Importuj status",
    "topbar.import": "Import",
    "import.menu.statusJson": "Status JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Karta stomatologiczna",
    "chart.hint": "Kliknij ząb. Aby wybrać wiele, użyj CMD/CTRL + klik.",
    "chart.actions.occlusal": "Widoczność widoku okluzyjnego",
    "chart.actions.wisdom": "Widoczność zębów mądrości",
    "chart.actions.bone": "Widoczność kości",
    "chart.actions.pulp": "Widoczność miazgi",
    "chart.actions.clearSelection": "Wyczyść zaznaczenie",
    "chart.aria.toothGrid": "Siatka zębów",
    "panel.controls": "Kontrolki",
    "panel.clearSelection": "Wyczyść zaznaczenie",
    "panel.toggleControls": "Kontrolki",
    "panel.activeTooth": "Aktywny ząb",
    "panel.selectActions.all": "Wszystkie",
    "panel.selectActions.present": "Zęby",
    "panel.selectActions.permanent": "Stałe",
    "panel.selectActions.milk": "Mleczne",
    "panel.selectActions.implants": "Implanty",
    "panel.selectActions.missing": "Brakujące",
    "panel.selectActions.upper": "Górne",
    "panel.selectActions.upperFront": "Górne 6 przednich",
    "panel.selectActions.upperMolar": "Trzonowce górne",
    "panel.selectActions.lower": "Dolne",
    "panel.selectActions.lowerFront": "Dolne 6 przednich",
    "panel.selectActions.lowerMolar": "Trzonowce dolne",
    "status.title": "Statusy",
    "status.resetAll": "Resetuj jamę ustną",
    "status.primaryDentition": "Uzębienie mleczne",
    "status.mixedDentition": "Uzębienie mieszane",
    "status.edentulous": "Bezzębny",
    "status.extraLabel": "Dodaj:",
    "status.extraApply": "OK",
    "tooth.title": "Szczegóły zęba",
    "tooth.reset": "Resetuj",
    "tooth.resetTitle": "Resetuj ząb do domyślnych",
    "tooth.baseLabel": "Baza",
    "tooth.bridgeLabel": "Proteza",
    "tooth.extractionWound": "świeża rana poekstrakcyjna",
    "tooth.crownLabel": "Korona",
    "tooth.broken.mesial": "mezjalne",
    "tooth.broken.incisal": "incyzalne",
    "tooth.broken.distal": "dystalne",
    "tooth.contact.mesialMissing": "brak kontaktu mezjalnego",
    "tooth.contact.distalMissing": "brak kontaktu dystalnego",
    "tooth.bruxism.edgeWear": "Starcie brzegowe",
    "tooth.bruxism.neckWear": "Starcie szyjkowe",
    "wearType.none": "brak",
    "wearType.attrition": "Atrycja",
    "wearType.abrasion": "Abrazja",
    "wearType.erosion": "Erozja",
    "wearType.abfraction": "Abfrakcja",
    "discoloration.label": "Przebarwienie",
    "discoloration.none": "brak",
    "discoloration.tetracycline": "Przebarwienie tetracyklinowe",
    "discoloration.fluorosis": "Fluoroza",
    "discoloration.nonvital": "Ściemnienie zęba martwego",
    "discoloration.extrinsic": "Przebarwienie zewnątrzpochodne",
    "discoloration.other": "Inne / nieznane",
    "ortho.appliance.label": "Aparat ortodontyczny",
    "ortho.appliance.none": "brak",
    "ortho.appliance.bracket": "Zamek (bracket)",
    "ortho.appliance.band": "Pierścień/band",
    "ortho.drift.label": "Przemieszczenie",
    "ortho.drift.none": "brak",
    "ortho.drift.mesial": "Mezjalne",
    "ortho.drift.distal": "Dystalne",
    "ortho.vertical.label": "Pionowe",
    "ortho.vertical.none": "brak",
    "ortho.vertical.extrusion": "Ekstruzja",
    "ortho.vertical.intrusion": "Intruzja",
    "ortho.rotation.label": "Rotacja",
    "toothInfo.discoloration": "Przebarwienie",
    "toothInfo.discolorationEmpty": "brak zapisanego przebarwienia",
    "toothInfo.wear": "Starcie",
    "toothInfo.wearEmpty": "brak zapisanego starcia",
    "toothInfo.orthodontics": "Ortodoncja",
    "toothInfo.orthodonticsEmpty": "brak zapisanego wyniku ortodontycznego",
    "tooth.bridgePillar": "Filar mostu",
    "tooth.extractionPlan": "Planowana ekstrakcja",
    "tooth.crownReplace": "Wymiana korony",
    "tooth.crownNeeded": "Korona wymagana",
    "tooth.missingClosed": "Zamknięta luka",
    "caries.title": "Próchnica",
    "caries.hint": "Zaznacz powierzchnie próchnicy",
    "caries.depthLabel": "Głębokość",
    "caries.depth.surface": "Powierzchowna (szkliwo)",
    "caries.depth.dentin": "Zębina",
    "caries.depth.deep": "Głęboka (blisko miazgi)",
    "filling.title": "Wypełnienia i odbudowy",
    "filling.typeLabel": "Typ",
    "filling.fissureSealing": "Lakowanie bruzd",
    "filling.subcariesSummarySingle": "Przy {{teeth}} ustawiono subcaries obok wypełnienia.",
    "filling.subcariesSummaryMultiple": "Przy {{teeth}} ustawiono subcaries obok wypełnień.",
    "filling.fillingDefectSummarySingle": "Przy {{teeth}} zapisano ubytek wypełnienia.",
    "filling.fillingDefectSummaryMultiple": "Przy {{teeth}} zapisano ubytki wypełnień.",
    "endo.title": "Korzeń",
    "endo.hint": "Wybierz stan korzenia",
    "endo.pulpitis": "Zapalenie miazgi",
    "endo.resection": "Ząb po resekcji",
    "endo.parapulpalPin": "Wkład parapulpalny",
    "inflammation.title": "Przyzębie i stany zapalne",
    "inflammation.mobilityLabel": "Ruchomość",
    "language.label": "Język",
    "language.hu": "🇭🇺 Węgierski",
    "language.en": "🇬🇧 Angielski",
    "language.de": "🇩🇪 Niemiecki",
    "language.es": "🇪🇸 Hiszpański",
    "language.it": "🇮🇹 Włoski",
    "language.sk": "🇸🇰 Słowacki",
    "language.pl": "🇵🇱 Polski",
    "language.ru": "🇷🇺 Rosyjski",
    "language.pt-br": "🇧🇷 Portugalski brazylijski",
    "numbering.label": "Numeracja",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - USA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Ustawienia",
    "settings.notes": "Notatki",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Szkliwo (osuszone)",
    "icdas.code.2": "Szkliwo (wilgotne)",
    "icdas.code.3": "Przerwanie szkliwa",
    "icdas.code.4": "Cień zębiny",
    "icdas.code.5": "Ubytek (zębina)",
    "icdas.code.6": "Rozległy ubytek",
    "icdas.desc.1": "Pierwsza widoczna zmiana w szkliwie (widoczna dopiero po dłuższym osuszeniu)",
    "icdas.desc.2": "Wyraźna zmiana w szkliwie (widoczna na wilgotno)",
    "icdas.desc.3": "Miejscowe przerwanie szkliwa bez widocznej zębiny",
    "icdas.desc.4": "Ciemny cień pochodzący z zębiny, z przerwaniem szkliwa lub bez",
    "icdas.desc.5": "Wyraźny ubytek z widoczną zębiną",
    "icdas.desc.6": "Rozległy ubytek z widoczną zębiną (ponad połowa powierzchni)",
    "theme.light": "Tryb jasny",
    "theme.dark": "Tryb ciemny",
    "selection.none": "—",
    "selection.count": "{{count}} zębów",
    "toothSelect.none": "Brak zęba",
    "toothSelect.permanent": "Ząb stały",
    "toothSelect.milk": "Ząb mleczny",
    "toothSelect.implant": "Implant",
    "toothSelect.crownPrep": "Przygotowany pod koronę",
    "toothSelect.underGum": "Ząb poddziąsłowy",
    "endo.option.none": "Zdrowy korzeń",
    "endo.option.medicalFilling": "Lecznicze wypełnienie kanałowe",
    "endo.option.filling": "Wypełnienie kanałowe",
    "endo.option.incompleteFilling": "Niekompletne wypełnienie kanałowe",
    "endo.option.glassPin": "Wypełnienie kanałowe z wkładem szklanym",
    "endo.option.metalPin": "Wypełnienie kanałowe z wkładem metalowym",
    "filling.option.none": "Brak wypełnienia",
    "filling.option.amalgam": "Wypełnienie amalgamatowe",
    "filling.option.composite": "Wypełnienie kompozytowe",
    "filling.option.gic": "Wypełnienie glasjonomerowe",
    "filling.option.temporary": "Wypełnienie tymczasowe",
    "crown.option.noneImplant": "Brak",
    "crown.option.healingAbutment": "Śruba gojąca",
    "crown.option.zircon": "Korona cyrkonowa",
    "crown.option.metal": "Korona metalowo-ceramiczna",
    "crown.option.temporary": "Korona tymczasowa",
    "crown.option.locator": "Lokator",
    "crown.option.locatorProsthesis": "Lokator + ząb protezowy",
    "crown.option.bar": "Implant z belką",
    "crown.option.barProsthesis": "Belka + ząb protezowy",
    "crown.option.full": "Korona pełna",
    "crown.option.broken": "Korona złamana",
    "crown.option.radix": "Radix",
    "crown.option.emax": "Wkład ceramiczny prasowany",
    "crown.option.telescope": "Korona teleskopowa",
    "bridge.option.none": "Brak",
    "bridge.option.removable": "Proteza ruchoma",
    "bridge.option.zircon": "Przęsło cyrkonowe",
    "bridge.option.metal": "Przęsło metalowo-ceramiczne",
    "bridge.option.temporary": "Przęsło tymczasowe",
    "bridge.option.bar": "Przęsło belkowe",
    "bridge.option.barProsthesis": "Belka + ząb protezowy",
    "restoration.none": "Brak",
    "restoration.prefix.fixed": "Stała",
    "restoration.prefix.removable": "Ruchoma",
    "restoration.type.crown": "Korona",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Licówka",
    "restoration.type.bridge": "Przęsło mostu",
    "prosthesis.none": "Brak",
    "prosthesis.type.healingAbutment": "Śruba gojąca",
    "prosthesis.type.locator": "Zaczep Locator",
    "prosthesis.type.locatorDenture": "Proteza nakładowa na zaczepach Locator",
    "prosthesis.type.bar": "Belka zaczepowa",
    "prosthesis.type.barDenture": "Proteza nakładowa na belce",
    "prosthesis.type.removablePartial": "Częściowa proteza ruchoma",
    "prosthesis.type.removableFull": "Całkowita proteza ruchoma",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "złoto",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "cyrkon",
    "restoration.material.metal": "metal",
    "restoration.material.metalCeramic": "metaloceramika",
    "restoration.material.telescope": "teleskopowa",
    "restoration.material.temporary": "tymczasowa",
    "substrate.natural": "Zdrowy",
    "substrate.radix": "Radix",
    "substrate.broken": "Złamany",
    "substrate.crownprep": "Opracowany pod koronę",
    "restoration.label": "Odbudowa",
    "substrate.label": "Stan zęba",
    "mobility.none": "Brak",
    "mobility.m1": "Stopień 1",
    "mobility.m2": "Stopień 2",
    "mobility.m3": "Stopień 3",
    "mods.parodontal": "Zapalenie przyzębia",
    "periImplant.label": "Stan okołowszczepowy",
    "periImplant.none": "Zdrowy (brak)",
    "periImplant.mucositis": "Zapalenie błony śluzowej",
    "periImplant.periImplantitisMild": "Periimplantitis – łagodny zanik kości",
    "periImplant.periImplantitisModerate": "Periimplantitis – umiarkowany zanik kości",
    "periImplant.periImplantitisSevere": "Periimplantitis – ciężki zanik kości",
    "mods.periimplantitis": "Periimplantitis",
    "mods.periodontalInflammation": "Zapalenie przyzębia",
    "mods.periapicalInflammation": "Zapalenie okołowierzchołkowe",
    "periapical.typeLabel": "Zmiana okołowierzchołkowa",
    "card.rootPeriodontium": "Korzeń i przyzębie",
    "pulpEndo.label": "Stan miazgi / endo",
    "pulpEndo.groupVital": "Miazga żywa",
    "pulpEndo.groupTreated": "Leczony (endo)",
    "calculus.label": "Kamień nazębny",
    "crownLeakage.label": "Nieszczelność brzeżna korony",
    "root.resorption": "Resorpcja korzenia",
    "periapical.type.none": "Nie określono",
    "periapical.type.granuloma": "Ziarniniak",
    "periapical.type.cyst": "Torbiel korzeniowa",
    "periapical.type.abscess": "Ropień",
    "pulpDx.normal": "Prawidłowy",
    "pulpDx.reversiblePulpitis": "Odwracalne zapalenie miazgi",
    "pulpDx.irreversiblePulpitis": "Nieodwracalne zapalenie miazgi",
    "pulpDx.necrosis": "Martwica miazgi",
    "pulpLatin.none": "Nie określono",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Brak zmian okołowierzchołkowych",
    "apicalDx.symptomaticApicalPeriodontitis": "Objawowe zapalenie ozębnej okołowierzchołkowej",
    "apicalDx.asymptomaticApicalPeriodontitis": "Bezobjawowe zapalenie ozębnej okołowierzchołkowej",
    "apicalDx.acuteApicalAbscess": "Ostry ropień okołowierzchołkowy",
    "apicalDx.chronicApicalAbscess": "Przewlekły ropień okołowierzchołkowy",
    "apicalDx.condensingOsteitis": "Osteitis kondensująca",
    "resorption.type.none": "Brak resorpcji korzenia",
    "resorption.type.internal": "Resorpcja wewnętrzna korzenia",
    "resorption.type.externalCervical": "Resorpcja zewnętrzna (szyjkowa) korzenia",
    "pulp.level.simple": "Prosty",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Łacina",
    "pulp.dxLabel": "Diagnoza miazgi",
    "apical.dxLabel": "Diagnoza okołowierzchołkowa",
    "pulp.level.label": "Poziom szczegółowości miazgi",
    "rootCaries.none": "Brak próchnicy korzenia",
    "rootCaries.active": "Aktywna próchnica korzenia",
    "rootCaries.arrested": "Zatrzymana (nieaktywna) próchnica korzenia",
    "rootCaries.activeCavitated": "Aktywna próchnica korzenia z ubytkiem",
    "rootCaries.present": "próchnica korzenia",
    "radiographicDepth.none": "Brak zarejestrowanej głębokości radiologicznej",
    "radiographicDepth.E1": "Szkliwo, zewnętrzna połowa (E1)",
    "radiographicDepth.E2": "Szkliwo, wewnętrzna połowa (E2)",
    "radiographicDepth.D1": "Zębina, zewnętrzna jedna trzecia (D1)",
    "radiographicDepth.D2": "Zębina, środkowa jedna trzecia (D2)",
    "radiographicDepth.D3": "Zębina, wewnętrzna jedna trzecia (D3)",
    "radiographicDepth.superficial": "Powierzchowna (E1–E2)",
    "radiographicDepth.middle": "Środkowa (D1)",
    "radiographicDepth.deep": "Głęboka (D2–D3)",
    "fillingDefect.label": "Ubytek wypełnienia",
    "fillingDefect.none": "brak",
    "fillingDefect.marginal": "ubytek brzeżny",
    "fillingDefect.fracture": "złamanie / odprysk",
    "fillingDefect.wear": "starty / ubytkowy",
    "secondaryCaries.sound": "Zdrowy",
    "secondaryCaries.initial": "Początkowy",
    "secondaryCaries.moderate": "Umiarkowany",
    "secondaryCaries.cavitated": "Z ubytkiem",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Ogólne",
    "settings.tab.panels": "Panele",
    "settings.panels.statuses": "Statusy",
    "settings.panels.statuses.desc": "Pokaż panel Statusy.",
    "settings.panels.orthodontics": "Ortodoncja",
    "settings.panels.orthodontics.desc": "Pokaż panel Ortodoncja.",
    "settings.tab.toothDetails": "Szczegóły zęba",
    "caries.rootLabel": "Próchnica korzenia",
    "caries.secondaryLabel": "Próchnica wtórna (CARS)",
    "caries.radiographicLabel": "Głębokość radiologiczna",
    "caries.details": "Szczegóły próchnicy",
    "caries.primaryTitle": "Próchnica",
    "caries.recurrentTitle": "Próchnica wtórna",
    "caries.recurrentHint": "Próchnica wtórna przy wypełnieniu: wynik CARS",
    "caries.cars.0": "Zdrowy",
    "caries.cars.1": "Pierwsza widoczna zmiana w szkliwie",
    "caries.cars.2": "Wyraźna widoczna zmiana w szkliwie",
    "caries.cars.3": "Miejscowe przerwanie szkliwa (bez zębiny)",
    "caries.cars.4": "Cień leżącej poniżej zębiny",
    "caries.cars.5": "Wyraźny ubytek, widoczna zębina",
    "caries.cars.6": "Rozległy ubytek",
    "caries.detailsHint": "Szczegóły próchnicy: głębokość, wtórna, radiologiczna",
    "settings.tab.secondaryCaries": "Próchnica wtórna",
    "settings.tab.caries": "Próchnica",
    "settings.tab.pulpa": "Miazga",
    "settings.tab.notes": "Notatki",
    "settings.mode.simple": "Prosty",
    "settings.mode.advanced": "Zaawansowany",
    "settings.close": "Zamknij",
    "settings.comingSoon": "Wkrótce",
    "settings.theme.label": "Wygląd",
    "settings.exportImport.title": "Eksport / Import",
    "settings.numbering.desc": "System numeracji zębów używany w diagramie.",
    "settings.language.desc": "Język interfejsu.",
    "settings.theme.desc": "Przełączanie między jasnym a ciemnym wyglądem.",
    "settings.exportImport.desc": "Zapisz lub wczytaj dane odontogramu. Ta sekcja jest w opracowaniu.",
    "settings.toothInfo.desc": "Pokaż panel informacji o zębie pod diagramem.",
    "settings.secondaryCaries.desc": "Poziom szczegółowości selektora próchnicy wtórnej (CARS).",
    "settings.secondaryCaries.simple": "Prosty",
    "settings.secondaryCaries.standard": "Standardowy",
    "settings.secondaryCaries.full": "Pełny",
    "settings.icdas.desc": "Użyj skali ICDAS II (0–6) zamiast 3-poziomowej skali próchnicy.",
    "settings.cariesDepth.label": "Głębokość próchnicy",
    "settings.cariesDepth.desc": "Wizualne kodowanie głębokości próchnicy na każdej powierzchni.",
    "settings.rootCaries.desc": "Poziom szczegółowości selektora próchnicy korzenia dla zęba.",
    "settings.rootCaries.simple": "Obecna / brak",
    "settings.rootCaries.severity": "Nasilenie",
    "settings.radiographic.desc": "Radiologiczna ocena głębokości próchnicy na każdej powierzchni.",
    "settings.radiographic.off": "Wył.",
    "settings.radiographic.threeLevel": "3 poziomy",
    "settings.radiographic.detailed": "Szczegółowy",
    "settings.pulpLevel.desc": "Ile szczegółów oferuje selektor diagnozy miazgi.",
    "settings.wearDetail.label": "Szczegółowość starcia",
    "settings.wearDetail.desc": "Proste: przełącznik tak/nie (atrycja); złożone: typ starcia dla brzegu i szyjki.",
    "settings.discolorationDetail.label": "Szczegółowość przebarwienia",
    "settings.discolorationDetail.desc": "Proste: przełącznik tak/nie; złożone: wybór przyczyny przebarwienia.",
    "settings.surfaceNotation.label": "Oznaczenie powierzchni",
    "settings.surfaceNotation.desc": "Pełne: litery powierzchni dostosowują się do pozycji zęba (ząb przedni: I=sieczne, L=wargowe; górna szczęka: P=podniebienne; dolna szczęka: L=językowe). Proste: zawsze B/O/L, niezależnie od pozycji.",
    "settings.surfaceNotation.simple": "Proste",
    "settings.surfaceNotation.full": "Pełne",
    "settings.toothDetail.simple": "Proste",
    "settings.toothDetail.complex": "Złożone",
    "settings.notes.desc": "Włącz notatki dla zęba (dwukliknij, aby edytować).",
    "surface.mesial": "mezjalne",
    "surface.distal": "dystalne",
    "surface.buccal": "policzkowe",
    "surface.lingualPalatal": "językowe/podniebienne",
    "surface.occlusal": "okluzyjne",
    "surface.incisal": "sieczne",
    "surface.subcrown": "podkoronowe",
    "surface.labial": "wargowe",
    "surface.palatal": "podniebienne",
    "surface.lingual": "językowe",
    "actions.expand": "Otwórz {{label}}",
    "actions.collapse": "Zwiń {{label}}",
    "debug.numbering.title": "Debug numeracji (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Górny 12-22 cyrkon",
    "statusExtras.upper13_23Zircon": "Górny 13-23 cyrkon",
    "statusExtras.upper16_26Zircon": "Górny 16-26 cyrkon",
    "statusExtras.upperFullZircon": "Górny cyrkonowy most okrężny",
    "statusExtras.upper12_22Metal": "Górny 12-22 metalowo-ceramiczny",
    "statusExtras.upper13_23Metal": "Górny 13-23 metalowo-ceramiczny",
    "statusExtras.upper16_26Metal": "Górny 16-26 metalowo-ceramiczny",
    "statusExtras.upperFullMetal": "Górny metalowo-ceramiczny most okrężny",
    "statusExtras.upperPartialRemovable": "Górna częściowa ruchoma",
    "statusExtras.upperFullRemovable": "Górna całkowita ruchoma",
    "statusExtras.upperBarDenture": "Górna proteza na belce",
    "statusExtras.lower42_32Zircon": "Dolny 42-32 cyrkon",
    "statusExtras.lower43_33Zircon": "Dolny 43-33 cyrkon",
    "statusExtras.lower46_36Zircon": "Dolny 46-36 cyrkon",
    "statusExtras.lowerFullZircon": "Dolny cyrkonowy most okrężny",
    "statusExtras.lower42_32Metal": "Dolny 42-32 metalowo-ceramiczny",
    "statusExtras.lower43_33Metal": "Dolny 43-33 metalowo-ceramiczny",
    "statusExtras.lower46_36Metal": "Dolny 46-36 metalowo-ceramiczny",
    "statusExtras.lowerFullMetal": "Dolny metalowo-ceramiczny most okrężny",
    "statusExtras.lowerPartialRemovable": "Dolna częściowa ruchoma",
    "statusExtras.lowerFullRemovable": "Dolna całkowita ruchoma",
    "statusExtras.lowerBarDenture": "Dolna proteza na belce",
    "touch.zoom.title": "Ząb #{{tooth}}",
    "touch.zoom.select": "Wybierz",
    "touch.zoom.deselect": "Odznacz",
    "touch.zoom.info": "Szczegóły",
    "touch.zoom.close": "Zamknij",
    "touch.ctx.select": "Wybierz",
    "touch.ctx.multiSelect": "Dodaj do zaznaczenia",
    "touch.ctx.deselect": "Odznacz",
    "touch.ctx.reset": "Resetuj",
    "touch.arch.upper": "Łuk górny",
    "touch.arch.lower": "Łuk dolny",
    "touch.arch.both": "Oba",
    "chart.hint.touch": "Dotknij ząb, aby go zaznaczyć. Przytrzymaj, aby uzyskać więcej opcji.",
    "warn.endoOnMissing": "Leczenie kanałowe niemożliwe przy brakującym/implantowanym zębie",
    "warn.fillingOnMissing": "Wypełnienie niemożliwe przy brakującym zębie",
    "warn.crownReplaceNoCrown": "Wymiana korony oznaczona bez korony",
    "warn.cariesOnMissing": "Próchnica niemożliwa przy brakującym zębie",
    "warn.pillarNoCrown": "Filar mostu oznaczony bez materiału korony",
    "warn.invalidRestorationCombo": "Nieprawidłowa kombinacja typu i materiału odbudowy (automatycznie poprawiona)",
    "readOnly.label": "Tylko do odczytu",
    "note.title": "Notatka",
    "note.save": "Zapisz",
    "note.delete": "Usuń",
    "note.placeholder": "Dodaj notatkę...",
    "intro.start": "Wprowadzenie",
    "intro.next": "Dalej",
    "intro.back": "Wstecz",
    "intro.skip": "Pomiń",
    "intro.finish": "Gotowe",
    "intro.step1.title": "Wybierz ząb",
    "intro.step1.text": "Kliknij ząb na diagramie, aby rozpocząć edycję.",
    "intro.step2.title": "Próchnica",
    "intro.step2.text": "Zaznacz powierzchnie z próchnicą w układzie krzyżowym (B/M/O/D/L).",
    "intro.step3.title": "Zapalenie miazgi",
    "intro.step3.text": "Włącz zapalenie miazgi na wybranym zębie.",
    "intro.step4.title": "Implant",
    "intro.step4.text": "Ustaw typ zęba na implant z listy rozwijanej.",
    "intro.step5.title": "Wypełnienie",
    "intro.step5.text": "Wybierz materiał, a następnie zaznacz powierzchnie — każda powierzchnia może mieć własny materiał.",
    "intro.step6.title": "Korona",
    "intro.step6.text": "Wybierz materiał korony.",
    "intro.step7.title": "Notatka do zęba",
    "intro.step7.text": "Kliknij dwukrotnie ząb, aby dodać notatkę.",
    "intro.step8.title": "Filtry zaznaczania",
    "intro.step8.text": "Szybko zaznacz grupy zębów: górne/dolne, przednie, trzonowce.",
    "intro.step9.title": "Numeracja i język",
    "intro.step9.text": "Zmień system numeracji lub język w nagłówku.",
    "intro.step10.title": "Eksport",
    "intro.step10.text": "Wyeksportuj diagram jako JSON, FHIR, PNG lub JPG.",
    "intro.step11.title": "Import",
    "intro.step11.text": "Wczytaj wcześniejszy diagram z JSON lub FHIR.",
    "intro.step12.title": "Wszystko gotowe!",
    "intro.step12.text": "To są podstawy — odkryj pozostałe funkcje."
  },
  ru: {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Выберите зуб на одонтограмме, затем настройте слои.",
    "app.subtitleLang": "На русском.",
    "app.subtitleNumbering.FDI": "Используется нумерация FDI – ISO 3950.",
    "app.subtitleNumbering.UNIVERSAL": "Используется нумерация Universal (ADA).",
    "app.subtitleNumbering.PALMER": "Используется нумерация Palmer.",
    "app.subtitleMode.light": "В светлом режиме.",
    "app.subtitleMode.dark": "В тёмном режиме.",
    "settings.toothInfo": "Панель информации о зубах",
    "toothInfo.title": "Информация о зубах",
    "toothInfo.overview": "На одонтограмме {{present}}{{milk}} и {{missing}}.",
    "toothInfo.overviewImplant": "На одонтограмме {{present}}{{milk}}, {{missing}} и {{implant}}.",
    "toothInfo.overviewMilkOnly": "На одонтограмме {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} постоянный зуб",
    "toothInfo.presentOther": "{{n}} постоянных зубов",
    "toothInfo.missingOne": "отсутствует {{n}} зуб",
    "toothInfo.missingOther": "отсутствует {{n}} зубов",
    "toothInfo.implantOne": "на месте {{n}} зуба установлен имплантат",
    "toothInfo.implantOther": "на месте {{n}} зубов установлены имплантаты",
    "toothInfo.milkOne": "{{n}} молочный зуб",
    "toothInfo.milkOther": "{{n}} молочных зубов",
    "toothInfo.permanentList": "постоянные зубы ({{count}}): {{list}}",
    "toothInfo.missingList": "зубы, отмеченные как отсутствующие ({{count}}): {{list}}",
    "toothInfo.caries": "Кариес",
    "toothInfo.cariesEmpty": "Нет зубов с кариесом.",
    "toothInfo.secondary": "вторичный",
    "toothInfo.diagnoses": "Диагнозы",
    "toothInfo.diagnosesEmpty": "нет записанного диагноза",
    "summary.severity.superficial": "поверхностный",
    "summary.severity.moderate": "умеренный",
    "summary.severity.deep": "глубокий",
    "summary.fracture": "Перелом",
    "toothInfo.fillings": "Пломбы",
    "toothInfo.fillingsEmpty": "Нет пломбированных зубов.",
    "toothInfo.endo": "Эндодонтическое лечение",
    "toothInfo.endoEmpty": "Нет зубов с лечёнными каналами.",
    "toothInfo.resected": "резецированный зуб",
    "toothInfo.prosthetics": "Протезирование",
    "toothInfo.prostheticsEmpty": "Нет протезов.",
    "toothInfo.implants": "Импланты",
    "toothInfo.periodontalTitle": "Состояние пародонта",
    "toothInfo.periodontalHealthy": "пародонт здоров",
    "toothInfo.periodontalInflamed": "воспаление присутствует на следующих зубах: {{list}}",
    "topbar.exportStatus": "Экспорт статуса",
    "topbar.exportFhir": "Экспорт FHIR",
    "topbar.export": "Экспорт",
    "export.menu.statusJson": "Статус JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "Изображение PNG",
    "export.menu.jpg": "Изображение JPG",
    "export.menu.svg": "Изображение SVG",
    "export.progress.title": "Идёт экспорт",
    "export.progress.preparing": "Подготовка…",
    "export.progress.rendering": "Отрисовка…",
    "export.progress.encoding": "Кодирование…",
    "export.progress.done": "Готово",
    "topbar.exportPng": "Экспорт PNG",
    "topbar.exportJpg": "Экспорт JPG",
    "topbar.importStatus": "Импорт статуса",
    "topbar.import": "Импорт",
    "import.menu.statusJson": "Статус JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Зубная карта",
    "chart.hint": "Нажмите на зуб. Для множественного выбора используйте CMD/CTRL + клик.",
    "chart.actions.occlusal": "Видимость окклюзионного вида",
    "chart.actions.wisdom": "Видимость зубов мудрости",
    "chart.actions.bone": "Видимость кости",
    "chart.actions.pulp": "Видимость пульпы",
    "chart.actions.clearSelection": "Сбросить выделение",
    "chart.aria.toothGrid": "Сетка зубов",
    "panel.controls": "Управление",
    "panel.clearSelection": "Сбросить выделение",
    "panel.toggleControls": "Управление",
    "panel.activeTooth": "Активный зуб",
    "panel.selectActions.all": "Все",
    "panel.selectActions.present": "Зубы",
    "panel.selectActions.permanent": "Постоянные",
    "panel.selectActions.milk": "Молочные",
    "panel.selectActions.implants": "Импланты",
    "panel.selectActions.missing": "Отсутствующие",
    "panel.selectActions.upper": "Верхние",
    "panel.selectActions.upperFront": "Верхние 6 фронтальных",
    "panel.selectActions.upperMolar": "Верхние моляры",
    "panel.selectActions.lower": "Нижние",
    "panel.selectActions.lowerFront": "Нижние 6 фронтальных",
    "panel.selectActions.lowerMolar": "Нижние моляры",
    "status.title": "Статусы",
    "status.resetAll": "Сброс полости рта",
    "status.primaryDentition": "Молочный прикус",
    "status.mixedDentition": "Сменный прикус",
    "status.edentulous": "Беззубый",
    "status.extraLabel": "Добавить:",
    "status.extraApply": "OK",
    "tooth.title": "Детали зуба",
    "tooth.reset": "Сброс",
    "tooth.resetTitle": "Сбросить зуб к значениям по умолчанию",
    "tooth.baseLabel": "Основа",
    "tooth.bridgeLabel": "Протез",
    "tooth.extractionWound": "свежая лунка удалённого зуба",
    "tooth.crownLabel": "Коронка",
    "tooth.broken.mesial": "мезиальное",
    "tooth.broken.incisal": "инцизальное",
    "tooth.broken.distal": "дистальное",
    "tooth.contact.mesialMissing": "отсутствие мезиального контакта",
    "tooth.contact.distalMissing": "отсутствие дистального контакта",
    "tooth.bruxism.edgeWear": "Стирание режущего края",
    "tooth.bruxism.neckWear": "Стирание в области шейки",
    "wearType.none": "нет",
    "wearType.attrition": "Стирание (аттриция)",
    "wearType.abrasion": "Абразия",
    "wearType.erosion": "Эрозия",
    "wearType.abfraction": "Абфракция",
    "discoloration.label": "Дисколорит",
    "discoloration.none": "нет",
    "discoloration.tetracycline": "Тетрациклиновое окрашивание",
    "discoloration.fluorosis": "Флюороз",
    "discoloration.nonvital": "Потемнение девитального зуба",
    "discoloration.extrinsic": "Внешнее окрашивание",
    "discoloration.other": "Другое / неизвестно",
    "ortho.appliance.label": "Ортодонтический аппарат",
    "ortho.appliance.none": "нет",
    "ortho.appliance.bracket": "Брекет",
    "ortho.appliance.band": "Кольцо/бэнд",
    "ortho.drift.label": "Смещение",
    "ortho.drift.none": "нет",
    "ortho.drift.mesial": "Мезиальное",
    "ortho.drift.distal": "Дистальное",
    "ortho.vertical.label": "Вертикальное",
    "ortho.vertical.none": "нет",
    "ortho.vertical.extrusion": "Экструзия",
    "ortho.vertical.intrusion": "Интрузия",
    "ortho.rotation.label": "Ротация",
    "toothInfo.discoloration": "Дисколорит",
    "toothInfo.discolorationEmpty": "нет записанного дисколорита",
    "toothInfo.wear": "Износ",
    "toothInfo.wearEmpty": "нет записанного износа",
    "toothInfo.orthodontics": "Ортодонтия",
    "toothInfo.orthodonticsEmpty": "нет записанного ортодонтического находки",
    "tooth.bridgePillar": "Опора мостовидного протеза",
    "tooth.extractionPlan": "Планируемое удаление",
    "tooth.crownReplace": "Замена коронки",
    "tooth.crownNeeded": "Требуется коронка",
    "tooth.missingClosed": "Закрытый дефект",
    "caries.title": "Кариес",
    "caries.hint": "Выберите поверхности кариеса",
    "caries.depthLabel": "Глубина",
    "caries.depth.surface": "Поверхностный (эмаль)",
    "caries.depth.dentin": "Дентин",
    "caries.depth.deep": "Глубокий (близко к пульпе)",
    "filling.title": "Пломбы и реставрации",
    "filling.typeLabel": "Тип",
    "filling.fissureSealing": "Герметизация фиссур",
    "filling.subcariesSummarySingle": "У {{teeth}} рядом с пломбой установлен subcaries.",
    "filling.subcariesSummaryMultiple": "У {{teeth}} рядом с пломбами установлен subcaries.",
    "filling.fillingDefectSummarySingle": "У {{teeth}} записан дефект пломбы.",
    "filling.fillingDefectSummaryMultiple": "У {{teeth}} записаны дефекты пломб.",
    "endo.title": "Корень",
    "endo.hint": "Выберите состояние корня",
    "endo.pulpitis": "Пульпит",
    "endo.resection": "Резецированный зуб",
    "endo.parapulpalPin": "Парапульпарный штифт",
    "inflammation.title": "Пародонт и воспаления",
    "inflammation.mobilityLabel": "Подвижность",
    "language.label": "Язык",
    "language.hu": "🇭🇺 Венгерский",
    "language.en": "🇬🇧 Английский",
    "language.de": "🇩🇪 Немецкий",
    "language.es": "🇪🇸 Испанский",
    "language.it": "🇮🇹 Итальянский",
    "language.sk": "🇸🇰 Словацкий",
    "language.pl": "🇵🇱 Польский",
    "language.ru": "🇷🇺 Русский",
    "language.pt-br": "🇧🇷 Бразильский португальский",
    "numbering.label": "Нумерация",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - США",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Настройки",
    "settings.notes": "Заметки",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Эмаль (после сушки)",
    "icdas.code.2": "Эмаль (во влажном виде)",
    "icdas.code.3": "Разрушение эмали",
    "icdas.code.4": "Тень из дентина",
    "icdas.code.5": "Полость (дентин)",
    "icdas.code.6": "Обширная полость",
    "icdas.desc.1": "Первое видимое изменение эмали (заметно только после длительного высушивания)",
    "icdas.desc.2": "Отчётливое видимое изменение эмали (видно во влажном состоянии)",
    "icdas.desc.3": "Локальное разрушение эмали без видимого дентина",
    "icdas.desc.4": "Тёмная тень от подлежащего дентина, с разрушением эмали или без него",
    "icdas.desc.5": "Отчётливая полость с видимым дентином",
    "icdas.desc.6": "Обширная полость с видимым дентином (более половины поверхности)",
    "theme.light": "Светлая тема",
    "theme.dark": "Тёмная тема",
    "selection.none": "—",
    "selection.count": "{{count}} зубов",
    "toothSelect.none": "Отсутствующий зуб",
    "toothSelect.permanent": "Постоянный зуб",
    "toothSelect.milk": "Молочный зуб",
    "toothSelect.implant": "Имплант",
    "toothSelect.crownPrep": "Подготовлен под коронку",
    "toothSelect.underGum": "Поддесневой зуб",
    "endo.option.none": "Здоровый корень",
    "endo.option.medicalFilling": "Лечебное пломбирование канала",
    "endo.option.filling": "Пломбирование канала",
    "endo.option.incompleteFilling": "Неполное пломбирование канала",
    "endo.option.glassPin": "Пломбирование канала со стекловолоконным штифтом",
    "endo.option.metalPin": "Пломбирование канала с металлическим штифтом",
    "filling.option.none": "Без пломбы",
    "filling.option.amalgam": "Амальгамная пломба",
    "filling.option.composite": "Композитная пломба",
    "filling.option.gic": "Стеклоиономерная пломба",
    "filling.option.temporary": "Временная пломба",
    "crown.option.noneImplant": "Нет",
    "crown.option.healingAbutment": "Формирователь десны",
    "crown.option.zircon": "Циркониевая коронка",
    "crown.option.metal": "Металлокерамическая коронка",
    "crown.option.temporary": "Временная коронка",
    "crown.option.locator": "Локатор",
    "crown.option.locatorProsthesis": "Локатор + протезный зуб",
    "crown.option.bar": "Балочный имплант",
    "crown.option.barProsthesis": "Балка + протезный зуб",
    "crown.option.full": "Полная коронка",
    "crown.option.broken": "Сломанная коронка",
    "crown.option.radix": "Корневая вкладка",
    "crown.option.emax": "Прессованная керамическая вкладка",
    "crown.option.telescope": "Телескопическая коронка",
    "bridge.option.none": "Нет",
    "bridge.option.removable": "Съёмный протез",
    "bridge.option.zircon": "Циркониевый мостовидный элемент",
    "bridge.option.metal": "Металлокерамический мостовидный элемент",
    "bridge.option.temporary": "Временный мостовидный элемент",
    "bridge.option.bar": "Балочное перекрытие",
    "bridge.option.barProsthesis": "Балка + протезный зуб",
    "restoration.none": "Нет",
    "restoration.prefix.fixed": "Несъёмный",
    "restoration.prefix.removable": "Съёмный",
    "restoration.type.crown": "Коронка",
    "restoration.type.inlay": "Инлей",
    "restoration.type.onlay": "Онлей",
    "restoration.type.veneer": "Винир",
    "restoration.type.bridge": "Элемент моста",
    "prosthesis.none": "Нет",
    "prosthesis.type.healingAbutment": "Формирователь десны",
    "prosthesis.type.locator": "Аттачмен Locator",
    "prosthesis.type.locatorDenture": "Съёмный протез на локаторах",
    "prosthesis.type.bar": "Балочная фиксация",
    "prosthesis.type.barDenture": "Съёмный протез на балке",
    "prosthesis.type.removablePartial": "Частичный съёмный протез",
    "prosthesis.type.removableFull": "Полный съёмный протез",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "золото",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "цирконий",
    "restoration.material.metal": "металл",
    "restoration.material.metalCeramic": "металлокерамика",
    "restoration.material.telescope": "телескопическая",
    "restoration.material.temporary": "временная",
    "substrate.natural": "Здоровый",
    "substrate.radix": "Radix",
    "substrate.broken": "Сломанный",
    "substrate.crownprep": "Препарирован под коронку",
    "restoration.label": "Реставрация",
    "substrate.label": "Состояние зуба",
    "mobility.none": "Нет",
    "mobility.m1": "Степень 1",
    "mobility.m2": "Степень 2",
    "mobility.m3": "Степень 3",
    "mods.parodontal": "Пародонтальное воспаление",
    "periImplant.label": "Периимплантный статус",
    "periImplant.none": "Здоровый (нет)",
    "periImplant.mucositis": "Периимплантный мукозит",
    "periImplant.periImplantitisMild": "Периимплантит – лёгкая потеря кости",
    "periImplant.periImplantitisModerate": "Периимплантит – умеренная потеря кости",
    "periImplant.periImplantitisSevere": "Периимплантит – тяжёлая потеря кости",
    "mods.periimplantitis": "Периимплантит",
    "mods.periodontalInflammation": "Пародонтальное воспаление",
    "mods.periapicalInflammation": "Периапикальное воспаление",
    "periapical.typeLabel": "Апикальное поражение",
    "card.rootPeriodontium": "Корень и пародонт",
    "pulpEndo.label": "Пульпа / эндо статус",
    "pulpEndo.groupVital": "Витальная пульпа",
    "pulpEndo.groupTreated": "Пролеченный (эндо)",
    "calculus.label": "Зубной камень",
    "crownLeakage.label": "Краевая негерметичность коронки",
    "root.resorption": "Резорбция корня",
    "periapical.type.none": "Не указано",
    "periapical.type.granuloma": "Гранулёма",
    "periapical.type.cyst": "Радикулярная киста",
    "periapical.type.abscess": "Абсцесс",
    "pulpDx.normal": "Норма",
    "pulpDx.reversiblePulpitis": "Обратимый пульпит",
    "pulpDx.irreversiblePulpitis": "Необратимый пульпит",
    "pulpDx.necrosis": "Некроз пульпы",
    "pulpLatin.none": "Не указано",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Без апикальной патологии",
    "apicalDx.symptomaticApicalPeriodontitis": "Симптоматический апикальный периодонтит",
    "apicalDx.asymptomaticApicalPeriodontitis": "Бессимптомный апикальный периодонтит",
    "apicalDx.acuteApicalAbscess": "Острый апикальный абсцесс",
    "apicalDx.chronicApicalAbscess": "Хронический апикальный абсцесс",
    "apicalDx.condensingOsteitis": "Конденсирующий остеит",
    "resorption.type.none": "Без резорбции корня",
    "resorption.type.internal": "Внутренняя резорбция корня",
    "resorption.type.externalCervical": "Наружная (цервикальная) резорбция корня",
    "pulp.level.simple": "Простой",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Латынь",
    "pulp.dxLabel": "Диагноз пульпы",
    "apical.dxLabel": "Апикальный диагноз",
    "pulp.level.label": "Уровень детализации пульпы",
    "rootCaries.none": "Нет кариеса корня",
    "rootCaries.active": "Активный кариес корня",
    "rootCaries.arrested": "Приостановленный (неактивный) кариес корня",
    "rootCaries.activeCavitated": "Активный кариес корня с полостью",
    "rootCaries.present": "кариес корня",
    "radiographicDepth.none": "Рентгенологическая глубина не указана",
    "radiographicDepth.E1": "Эмаль, наружная половина (E1)",
    "radiographicDepth.E2": "Эмаль, внутренняя половина (E2)",
    "radiographicDepth.D1": "Дентин, наружная треть (D1)",
    "radiographicDepth.D2": "Дентин, средняя треть (D2)",
    "radiographicDepth.D3": "Дентин, внутренняя треть (D3)",
    "radiographicDepth.superficial": "Поверхностная (E1–E2)",
    "radiographicDepth.middle": "Средняя (D1)",
    "radiographicDepth.deep": "Глубокая (D2–D3)",
    "fillingDefect.label": "Дефект пломбы",
    "fillingDefect.none": "нет",
    "fillingDefect.marginal": "краевой дефект",
    "fillingDefect.fracture": "скол / трещина",
    "fillingDefect.wear": "износ / дефицит",
    "secondaryCaries.sound": "Здоровый",
    "secondaryCaries.initial": "Начальный",
    "secondaryCaries.moderate": "Умеренный",
    "secondaryCaries.cavitated": "Кавитированный",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Общие",
    "settings.tab.panels": "Панели",
    "settings.panels.statuses": "Статусы",
    "settings.panels.statuses.desc": "Показать панель «Статусы».",
    "settings.panels.orthodontics": "Ортодонтия",
    "settings.panels.orthodontics.desc": "Показать панель «Ортодонтия».",
    "settings.tab.toothDetails": "Детали зуба",
    "caries.rootLabel": "Кариес корня",
    "caries.secondaryLabel": "Вторичный кариес (CARS)",
    "caries.radiographicLabel": "Рентгенологическая глубина",
    "caries.details": "Детали кариеса",
    "caries.primaryTitle": "Кариес",
    "caries.recurrentTitle": "Вторичный кариес",
    "caries.recurrentHint": "Вторичный кариес рядом с пломбой: балл CARS",
    "caries.cars.0": "Здоровый",
    "caries.cars.1": "Первое видимое изменение эмали",
    "caries.cars.2": "Явное видимое изменение эмали",
    "caries.cars.3": "Локальное разрушение эмали (без дентина)",
    "caries.cars.4": "Тень подлежащего дентина",
    "caries.cars.5": "Явная полость, видимый дентин",
    "caries.cars.6": "Обширная полость",
    "caries.detailsHint": "Детали кариеса: глубина, вторичный, рентгенологический",
    "settings.tab.secondaryCaries": "Вторичный кариес",
    "settings.tab.caries": "Кариес",
    "settings.tab.pulpa": "Пульпа",
    "settings.tab.notes": "Заметки",
    "settings.mode.simple": "Простой",
    "settings.mode.advanced": "Расширенный",
    "settings.close": "Закрыть",
    "settings.comingSoon": "Скоро",
    "settings.theme.label": "Оформление",
    "settings.exportImport.title": "Экспорт / Импорт",
    "settings.numbering.desc": "Система нумерации зубов, используемая в диаграмме.",
    "settings.language.desc": "Язык интерфейса.",
    "settings.theme.desc": "Переключение между светлым и тёмным оформлением.",
    "settings.exportImport.desc": "Сохранить или загрузить данные одонтограммы. Раздел в разработке.",
    "settings.toothInfo.desc": "Показать панель информации о зубе под диаграммой.",
    "settings.secondaryCaries.desc": "Уровень детализации выбора вторичного кариеса (CARS).",
    "settings.secondaryCaries.simple": "Простой",
    "settings.secondaryCaries.standard": "Стандартный",
    "settings.secondaryCaries.full": "Полный",
    "settings.icdas.desc": "Использовать шкалу ICDAS II (0–6) вместо 3-уровневой шкалы кариеса.",
    "settings.cariesDepth.label": "Глубина кариеса",
    "settings.cariesDepth.desc": "Визуально кодировать глубину кариеса на каждой поверхности.",
    "settings.rootCaries.desc": "Уровень детализации выбора кариеса корня для зуба.",
    "settings.rootCaries.simple": "Есть / нет",
    "settings.rootCaries.severity": "Тяжесть",
    "settings.radiographic.desc": "Рентгенологическая оценка глубины кариеса на каждой поверхности.",
    "settings.radiographic.off": "Выкл.",
    "settings.radiographic.threeLevel": "3 уровня",
    "settings.radiographic.detailed": "Подробно",
    "settings.pulpLevel.desc": "Насколько подробен выбор диагноза пульпы.",
    "settings.wearDetail.label": "Детализация износа",
    "settings.wearDetail.desc": "Простой: переключатель да/нет (стирание); подробный: тип износа по режущему краю и шейке.",
    "settings.discolorationDetail.label": "Детализация дисколорита",
    "settings.discolorationDetail.desc": "Простой: переключатель да/нет; подробный: выбор причины дисколорита.",
    "settings.surfaceNotation.label": "Обозначение поверхности",
    "settings.surfaceNotation.desc": "Полный: буквы поверхностей соответствуют положению зуба (передний зуб: I=режущая, L=губная; верхняя челюсть: P=нёбная; нижняя челюсть: L=язычная). Простой: всегда B/O/L, независимо от положения.",
    "settings.surfaceNotation.simple": "Простой",
    "settings.surfaceNotation.full": "Полный",
    "settings.toothDetail.simple": "Простой",
    "settings.toothDetail.complex": "Подробный",
    "settings.notes.desc": "Включить заметки для зуба (двойной клик для редактирования).",
    "surface.mesial": "мезиальная",
    "surface.distal": "дистальная",
    "surface.buccal": "щёчная",
    "surface.lingualPalatal": "язычная/нёбная",
    "surface.occlusal": "окклюзионная",
    "surface.incisal": "режущая",
    "surface.subcrown": "подкоронковая",
    "surface.labial": "губная",
    "surface.palatal": "нёбная",
    "surface.lingual": "язычная",
    "actions.expand": "Открыть {{label}}",
    "actions.collapse": "Свернуть {{label}}",
    "debug.numbering.title": "Отладка нумерации (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Верхний 12-22 цирконий",
    "statusExtras.upper13_23Zircon": "Верхний 13-23 цирконий",
    "statusExtras.upper16_26Zircon": "Верхний 16-26 цирконий",
    "statusExtras.upperFullZircon": "Верхний циркониевый круговой мост",
    "statusExtras.upper12_22Metal": "Верхний 12-22 металлокерамика",
    "statusExtras.upper13_23Metal": "Верхний 13-23 металлокерамика",
    "statusExtras.upper16_26Metal": "Верхний 16-26 металлокерамика",
    "statusExtras.upperFullMetal": "Верхний металлокерамический круговой мост",
    "statusExtras.upperPartialRemovable": "Верхний частичный съёмный",
    "statusExtras.upperFullRemovable": "Верхний полный съёмный",
    "statusExtras.upperBarDenture": "Верхний балочный протез",
    "statusExtras.lower42_32Zircon": "Нижний 42-32 цирконий",
    "statusExtras.lower43_33Zircon": "Нижний 43-33 цирконий",
    "statusExtras.lower46_36Zircon": "Нижний 46-36 цирконий",
    "statusExtras.lowerFullZircon": "Нижний циркониевый круговой мост",
    "statusExtras.lower42_32Metal": "Нижний 42-32 металлокерамика",
    "statusExtras.lower43_33Metal": "Нижний 43-33 металлокерамика",
    "statusExtras.lower46_36Metal": "Нижний 46-36 металлокерамика",
    "statusExtras.lowerFullMetal": "Нижний металлокерамический круговой мост",
    "statusExtras.lowerPartialRemovable": "Нижний частичный съёмный",
    "statusExtras.lowerFullRemovable": "Нижний полный съёмный",
    "statusExtras.lowerBarDenture": "Нижний балочный протез",
    "touch.zoom.title": "Зуб #{{tooth}}",
    "touch.zoom.select": "Выбрать",
    "touch.zoom.deselect": "Отменить выбор",
    "touch.zoom.info": "Подробности",
    "touch.zoom.close": "Закрыть",
    "touch.ctx.select": "Выбрать",
    "touch.ctx.multiSelect": "Добавить к выбору",
    "touch.ctx.deselect": "Отменить выбор",
    "touch.ctx.reset": "Сбросить",
    "touch.arch.upper": "Верхняя дуга",
    "touch.arch.lower": "Нижняя дуга",
    "touch.arch.both": "Обе",
    "chart.hint.touch": "Коснитесь зуба для выбора. Долгое нажатие для дополнительных опций.",
    "warn.endoOnMissing": "Лечение корня невозможно на отсутствующем/имплантированном зубе",
    "warn.fillingOnMissing": "Пломба невозможна на отсутствующем зубе",
    "warn.crownReplaceNoCrown": "Замена коронки отмечена без коронки",
    "warn.cariesOnMissing": "Кариес невозможен на отсутствующем зубе",
    "warn.pillarNoCrown": "Опора моста отмечена без материала коронки",
    "warn.invalidRestorationCombo": "Недопустимое сочетание типа и материала реставрации (исправлено автоматически)",
    "readOnly.label": "Только чтение",
    "note.title": "Заметка",
    "note.save": "Сохранить",
    "note.delete": "Удалить",
    "note.placeholder": "Добавить заметку...",
    "intro.start": "Обзор",
    "intro.next": "Далее",
    "intro.back": "Назад",
    "intro.skip": "Пропустить",
    "intro.finish": "Готово",
    "intro.step1.title": "Выбор зуба",
    "intro.step1.text": "Нажмите на зуб в одонтограмме, чтобы начать редактирование.",
    "intro.step2.title": "Кариес",
    "intro.step2.text": "Отметьте кариозные поверхности в крестовой раскладке (B/M/O/D/L).",
    "intro.step3.title": "Пульпит",
    "intro.step3.text": "Включите воспаление пульпы на выбранном зубе.",
    "intro.step4.title": "Имплантат",
    "intro.step4.text": "Установите тип зуба «имплантат» из выпадающего списка.",
    "intro.step5.title": "Пломба",
    "intro.step5.text": "Выберите материал, затем отметьте поверхности — у каждой поверхности может быть свой материал.",
    "intro.step6.title": "Коронка",
    "intro.step6.text": "Выберите материал коронки.",
    "intro.step7.title": "Заметка к зубу",
    "intro.step7.text": "Дважды щёлкните по зубу, чтобы добавить заметку.",
    "intro.step8.title": "Фильтры выбора",
    "intro.step8.text": "Быстро выделяйте группы зубов: верхние/нижние, передние, моляры.",
    "intro.step9.title": "Нумерация и язык",
    "intro.step9.text": "Переключите систему нумерации или язык в шапке.",
    "intro.step10.title": "Экспорт",
    "intro.step10.text": "Экспортируйте одонтограмму в формате JSON, FHIR, PNG или JPG.",
    "intro.step11.title": "Импорт",
    "intro.step11.text": "Загрузите предыдущую одонтограмму из JSON или FHIR.",
    "intro.step12.title": "Всё готово!",
    "intro.step12.text": "Это основы — изучите остальные возможности."
  },
  "pt-br": {
    "app.title": "React Odontogram Modul",
    "app.subtitle": "Selecione um dente no odontograma e defina as camadas.",
    "app.subtitleLang": "Em português.",
    "app.subtitleNumbering.FDI": "Usando a numeração FDI (ISO 3950).",
    "app.subtitleNumbering.UNIVERSAL": "Usando a numeração Universal (ADA).",
    "app.subtitleNumbering.PALMER": "Usando a numeração Palmer.",
    "app.subtitleMode.light": "No modo claro.",
    "app.subtitleMode.dark": "No modo escuro.",
    "settings.toothInfo": "Painel de informações do dente",
    "toothInfo.title": "Informações do dente",
    "toothInfo.overview": "O odontograma mostra {{present}}{{milk}} e {{missing}}.",
    "toothInfo.overviewImplant": "O odontograma mostra {{present}}{{milk}}, {{missing}} e {{implant}}.",
    "toothInfo.overviewMilkOnly": "O odontograma mostra {{milk}}.",
    "toothInfo.milkFragment": " ({{milk}})",
    "toothInfo.presentOne": "{{n}} dente permanente",
    "toothInfo.presentOther": "{{n}} dentes permanentes",
    "toothInfo.missingOne": "{{n}} dente ausente",
    "toothInfo.missingOther": "{{n}} dentes ausentes",
    "toothInfo.implantOne": "{{n}} dente com implante",
    "toothInfo.implantOther": "{{n}} dentes com implante",
    "toothInfo.milkOne": "{{n}} dente decíduo",
    "toothInfo.milkOther": "{{n}} dentes decíduos",
    "toothInfo.permanentList": "dentes permanentes ({{count}}): {{list}}",
    "toothInfo.missingList": "dentes marcados como ausentes ({{count}}): {{list}}",
    "toothInfo.caries": "Cárie",
    "toothInfo.cariesEmpty": "Nenhum dente com cárie.",
    "toothInfo.secondary": "secundária",
    "toothInfo.diagnoses": "Diagnósticos",
    "toothInfo.diagnosesEmpty": "nenhum diagnóstico registrado",
    "summary.severity.superficial": "superficial",
    "summary.severity.moderate": "moderado",
    "summary.severity.deep": "profundo",
    "summary.fracture": "Fratura",
    "toothInfo.fillings": "Restaurações",
    "toothInfo.fillingsEmpty": "Nenhum dente restaurado.",
    "toothInfo.endo": "Tratamentos de canal",
    "toothInfo.endoEmpty": "Nenhum dente com tratamento de canal.",
    "toothInfo.resected": "dente com apicectomia",
    "toothInfo.prosthetics": "Próteses",
    "toothInfo.prostheticsEmpty": "Nenhuma prótese.",
    "toothInfo.implants": "Implantes",
    "toothInfo.periodontalTitle": "Estado periodontal",
    "toothInfo.periodontalHealthy": "o periodonto está saudável",
    "toothInfo.periodontalInflamed": "há inflamação nos seguintes dentes: {{list}}",
    "topbar.exportStatus": "Exportar estado",
    "topbar.exportFhir": "Exportar FHIR",
    "topbar.export": "Exportar",
    "export.menu.statusJson": "Estado JSON",
    "export.menu.fhir": "FHIR JSON",
    "export.menu.png": "Imagem PNG",
    "export.menu.jpg": "Imagem JPG",
    "export.menu.svg": "Imagem SVG",
    "export.progress.title": "Exportação em andamento",
    "export.progress.preparing": "Preparando…",
    "export.progress.rendering": "Renderizando…",
    "export.progress.encoding": "Codificando…",
    "export.progress.done": "Concluído",
    "topbar.exportPng": "Exportar PNG",
    "topbar.exportJpg": "Exportar JPG",
    "topbar.importStatus": "Importar estado",
    "topbar.import": "Importar",
    "import.menu.statusJson": "Estado JSON",
    "import.menu.fhir": "FHIR JSON",
    "chart.title": "Ficha dentária",
    "chart.hint": "Clique em um dente. Para seleção múltipla, use CMD/CTRL + clique.",
    "chart.actions.occlusal": "Visibilidade da vista oclusal",
    "chart.actions.wisdom": "Visibilidade dos sisos",
    "chart.actions.bone": "Visibilidade do osso",
    "chart.actions.pulp": "Visibilidade da polpa",
    "chart.actions.clearSelection": "Limpar seleção",
    "chart.aria.toothGrid": "Grade de dentes",
    "panel.controls": "Controles",
    "panel.clearSelection": "Limpar seleção",
    "panel.toggleControls": "Controles",
    "panel.activeTooth": "Dente ativo",
    "panel.selectActions.all": "Todos",
    "panel.selectActions.present": "Dentes",
    "panel.selectActions.permanent": "Permanentes",
    "panel.selectActions.milk": "Decíduos",
    "panel.selectActions.implants": "Implantes",
    "panel.selectActions.missing": "Ausentes",
    "panel.selectActions.upper": "Superiores",
    "panel.selectActions.upperFront": "6 anteriores superiores",
    "panel.selectActions.upperMolar": "Molares superiores",
    "panel.selectActions.lower": "Inferiores",
    "panel.selectActions.lowerFront": "6 anteriores inferiores",
    "panel.selectActions.lowerMolar": "Molares inferiores",
    "status.title": "Estados",
    "status.resetAll": "Redefinir boca",
    "status.primaryDentition": "Dentição decídua",
    "status.mixedDentition": "Dentição mista",
    "status.edentulous": "Edêntulo",
    "status.extraLabel": "Adicionar:",
    "status.extraApply": "OK",
    "tooth.title": "Detalhes do dente",
    "tooth.reset": "Redefinir",
    "tooth.resetTitle": "Redefinir dente para o padrão",
    "tooth.baseLabel": "Base",
    "tooth.bridgeLabel": "Prótese",
    "tooth.extractionWound": "ferida de extração recente",
    "tooth.crownLabel": "Coroa",
    "tooth.broken.mesial": "mesial",
    "tooth.broken.incisal": "incisal",
    "tooth.broken.distal": "distal",
    "tooth.contact.mesialMissing": "contato mesial ausente",
    "tooth.contact.distalMissing": "contato distal ausente",
    "tooth.bruxism.edgeWear": "Desgaste incisal",
    "tooth.bruxism.neckWear": "Desgaste cervical",
    "wearType.none": "nenhum",
    "wearType.attrition": "Atrição",
    "wearType.abrasion": "Abrasão",
    "wearType.erosion": "Erosão",
    "wearType.abfraction": "Abfração",
    "discoloration.label": "Descoloração",
    "discoloration.none": "nenhuma",
    "discoloration.tetracycline": "Mancha por tetraciclina",
    "discoloration.fluorosis": "Fluorose",
    "discoloration.nonvital": "Escurecimento não vital",
    "discoloration.extrinsic": "Mancha extrínseca",
    "discoloration.other": "Outra / desconhecida",
    "ortho.appliance.label": "Aparelho ortodôntico",
    "ortho.appliance.none": "nenhum",
    "ortho.appliance.bracket": "Bracket",
    "ortho.appliance.band": "Banda",
    "ortho.drift.label": "Deslocamento",
    "ortho.drift.none": "nenhum",
    "ortho.drift.mesial": "Mesial",
    "ortho.drift.distal": "Distal",
    "ortho.vertical.label": "Vertical",
    "ortho.vertical.none": "nenhum",
    "ortho.vertical.extrusion": "Extrusão",
    "ortho.vertical.intrusion": "Intrusão",
    "ortho.rotation.label": "Rotação",
    "toothInfo.discoloration": "Descoloração",
    "toothInfo.discolorationEmpty": "nenhuma descoloração registrada",
    "toothInfo.wear": "Desgaste",
    "toothInfo.wearEmpty": "nenhum desgaste registrado",
    "toothInfo.orthodontics": "Ortodontia",
    "toothInfo.orthodonticsEmpty": "nenhum achado ortodôntico registrado",
    "tooth.bridgePillar": "Pilar de ponte",
    "tooth.extractionPlan": "Extração planejada",
    "tooth.crownReplace": "Substituição de coroa",
    "tooth.crownNeeded": "Coroa necessária",
    "tooth.missingClosed": "Espaço fechado",
    "caries.title": "Cárie",
    "caries.hint": "Selecione as faces com cárie",
    "caries.depthLabel": "Profundidade",
    "caries.depth.surface": "Superficial (esmalte)",
    "caries.depth.dentin": "Dentina",
    "caries.depth.deep": "Profunda (próxima à polpa)",
    "filling.title": "Restaurações e dentística",
    "filling.typeLabel": "Tipo",
    "filling.fissureSealing": "Selante de fissura",
    "filling.subcariesSummarySingle": "Em {{teeth}} há subcaries ao lado da restauração.",
    "filling.subcariesSummaryMultiple": "Em {{teeth}} há subcaries ao lado das restaurações.",
    "filling.fillingDefectSummarySingle": "Em {{teeth}} há um defeito de restauração registrado.",
    "filling.fillingDefectSummaryMultiple": "Em {{teeth}} há defeitos de restauração registrados.",
    "endo.title": "Raiz",
    "endo.hint": "Selecione o estado da raiz",
    "endo.pulpitis": "Pulpite",
    "endo.resection": "Apicectomia",
    "endo.parapulpalPin": "Pino parapulpar",
    "inflammation.title": "Periodonto e inflamações",
    "inflammation.mobilityLabel": "Mobilidade",
    "language.label": "Idioma",
    "language.hu": "🇭🇺 Húngaro",
    "language.en": "🇬🇧 Inglês",
    "language.de": "🇩🇪 Alemão",
    "language.es": "🇪🇸 Espanhol",
    "language.it": "🇮🇹 Italiano",
    "language.sk": "🇸🇰 Eslovaco",
    "language.pl": "🇵🇱 Polonês",
    "language.ru": "🇷🇺 Russo",
    "language.pt-br": "🇧🇷 Português (Brasil)",
    "numbering.label": "Numeração",
    "numbering.fdi": "FDI - ISO 3950",
    "numbering.universal": "Universal - EUA",
    "numbering.palmer": "Zsigmondy-Palmer",
    "settings.title": "Configurações",
    "settings.notes": "Anotações",
    "icdas.enable": "ICDAS",
    "icdas.code.1": "Alteração no esmalte (seco)",
    "icdas.code.2": "Alteração no esmalte (úmido)",
    "icdas.code.3": "Ruptura do esmalte",
    "icdas.code.4": "Sombra de dentina",
    "icdas.code.5": "Cavidade distinta (dentina)",
    "icdas.code.6": "Cavidade extensa",
    "icdas.desc.1": "Primeira alteração visual no esmalte (visível apenas após secagem prolongada com ar)",
    "icdas.desc.2": "Alteração visual distinta no esmalte (visível quando úmido)",
    "icdas.desc.3": "Ruptura localizada do esmalte sem dentina visível",
    "icdas.desc.4": "Sombra escura subjacente da dentina, com ou sem ruptura do esmalte",
    "icdas.desc.5": "Cavidade distinta com dentina visível",
    "icdas.desc.6": "Cavidade distinta extensa com dentina visível (mais da metade da face)",
    "theme.light": "Modo claro",
    "theme.dark": "Modo escuro",
    "selection.none": "—",
    "selection.count": "{{count}} dentes",
    "toothSelect.none": "Dente ausente",
    "toothSelect.permanent": "Dente permanente",
    "toothSelect.milk": "Dente decíduo",
    "toothSelect.implant": "Implante",
    "toothSelect.crownPrep": "Preparado para coroa",
    "toothSelect.underGum": "Dente subgengival",
    "endo.option.none": "Raiz saudável",
    "endo.option.medicalFilling": "Obturação medicamentosa",
    "endo.option.filling": "Obturação de canal",
    "endo.option.incompleteFilling": "Obturação de canal incompleta",
    "endo.option.glassPin": "Obturação com pino de fibra de vidro",
    "endo.option.metalPin": "Obturação com pino metálico",
    "filling.option.none": "Sem restauração",
    "filling.option.amalgam": "Restauração de amálgama",
    "filling.option.composite": "Restauração de resina composta",
    "filling.option.gic": "Restauração de ionômero de vidro",
    "filling.option.temporary": "Restauração temporária",
    "crown.option.noneImplant": "Nenhuma",
    "crown.option.healingAbutment": "Cicatrizador",
    "crown.option.zircon": "Coroa de zircônia",
    "crown.option.metal": "Coroa metalocerâmica",
    "crown.option.temporary": "Coroa provisória",
    "crown.option.locator": "Locator",
    "crown.option.locatorProsthesis": "Locator + dente de prótese",
    "crown.option.bar": "Barra sobre implante",
    "crown.option.barProsthesis": "Barra + dente de prótese",
    "crown.option.full": "Coroa total",
    "crown.option.broken": "Coroa fraturada",
    "crown.option.radix": "Resto radicular",
    "crown.option.emax": "Inlay de cerâmica prensada",
    "crown.option.telescope": "Coroa telescópica",
    "bridge.option.none": "Nenhuma",
    "bridge.option.removable": "Prótese removível",
    "bridge.option.zircon": "Elemento de ponte em zircônia",
    "bridge.option.metal": "Elemento de ponte metalocerâmico",
    "bridge.option.temporary": "Elemento de ponte provisório",
    "bridge.option.bar": "Vão de barra",
    "bridge.option.barProsthesis": "Barra + dente de prótese",
    "restoration.none": "Nenhuma",
    "restoration.prefix.fixed": "Fixa",
    "restoration.prefix.removable": "Removível",
    "restoration.type.crown": "Coroa",
    "restoration.type.inlay": "Inlay",
    "restoration.type.onlay": "Onlay",
    "restoration.type.veneer": "Faceta",
    "restoration.type.bridge": "Elemento de ponte",
    "prosthesis.none": "Nenhuma",
    "prosthesis.type.healingAbutment": "Cicatrizador",
    "prosthesis.type.locator": "Attachment Locator",
    "prosthesis.type.locatorDenture": "Overdenture sobre Locator",
    "prosthesis.type.bar": "Attachment de barra",
    "prosthesis.type.barDenture": "Overdenture sobre barra",
    "prosthesis.type.removablePartial": "Prótese parcial removível",
    "prosthesis.type.removableFull": "Prótese total removível",
    "restoration.material.emax": "e.max",
    "restoration.material.gold": "ouro",
    "restoration.material.gradia": "gradia",
    "restoration.material.zircon": "zircônia",
    "restoration.material.metal": "metal",
    "restoration.material.metalCeramic": "metalocerâmica",
    "restoration.material.telescope": "telescópica",
    "restoration.material.temporary": "provisória",
    "substrate.natural": "Hígido",
    "substrate.radix": "Radix",
    "substrate.broken": "Fraturado",
    "substrate.crownprep": "Preparado para coroa",
    "restoration.label": "Restauração",
    "substrate.label": "Condição do dente",
    "mobility.none": "Nenhuma",
    "mobility.m1": "Grau 1",
    "mobility.m2": "Grau 2",
    "mobility.m3": "Grau 3",
    "mods.parodontal": "Inflamação periodontal",
    "periImplant.label": "Status peri-implantar",
    "periImplant.none": "Saudável (nenhum)",
    "periImplant.mucositis": "Mucosite peri-implantar",
    "periImplant.periImplantitisMild": "Peri-implantite – perda óssea leve",
    "periImplant.periImplantitisModerate": "Peri-implantite – perda óssea moderada",
    "periImplant.periImplantitisSevere": "Peri-implantite – perda óssea grave",
    "mods.periimplantitis": "Peri-implantite",
    "mods.periodontalInflammation": "Inflamação periodontal",
    "mods.periapicalInflammation": "Inflamação periapical",
    "periapical.typeLabel": "Lesão apical",
    "card.rootPeriodontium": "Raiz e periodonto",
    "pulpEndo.label": "Status pulpar / endo",
    "pulpEndo.groupVital": "Polpa vital",
    "pulpEndo.groupTreated": "Tratado (endo)",
    "calculus.label": "Cálculo",
    "crownLeakage.label": "Infiltração marginal da coroa",
    "root.resorption": "Reabsorção radicular",
    "periapical.type.none": "Não especificado",
    "periapical.type.granuloma": "Granuloma",
    "periapical.type.cyst": "Cisto radicular",
    "periapical.type.abscess": "Abscesso",
    "pulpDx.normal": "Normal",
    "pulpDx.reversiblePulpitis": "Pulpite reversível",
    "pulpDx.irreversiblePulpitis": "Pulpite irreversível",
    "pulpDx.necrosis": "Necrose",
    "pulpLatin.none": "Não especificado",
    "pulpLatin.pulpaSana": "Pulpa sana",
    "pulpLatin.hyperaemiaPulpae": "Hyperaemia pulpae",
    "pulpLatin.pulpitisAcutaSerosa": "Pulpitis acuta serosa",
    "pulpLatin.pulpitisAcutaPurulenta": "Pulpitis acuta purulenta",
    "pulpLatin.pulpitisChronicaClausa": "Pulpitis chronica clausa",
    "pulpLatin.pulpitisChronicaUlcerosa": "Pulpitis chronica ulcerosa (aperta)",
    "pulpLatin.pulpitisChronicaHyperplastica": "Pulpitis chronica hyperplastica (pulpa-polyp)",
    "pulpLatin.necrosisPulpae": "Necrosis pulpae",
    "pulpLatin.gangraenaPulpae": "Gangraena pulpae",
    "apicalDx.normal": "Sem patologia apical",
    "apicalDx.symptomaticApicalPeriodontitis": "Periodontite apical sintomática",
    "apicalDx.asymptomaticApicalPeriodontitis": "Periodontite apical assintomática",
    "apicalDx.acuteApicalAbscess": "Abscesso apical agudo",
    "apicalDx.chronicApicalAbscess": "Abscesso apical crônico",
    "apicalDx.condensingOsteitis": "Osteíte condensante",
    "resorption.type.none": "Sem reabsorção radicular",
    "resorption.type.internal": "Reabsorção radicular interna",
    "resorption.type.externalCervical": "Reabsorção radicular externa (cervical)",
    "pulp.level.simple": "Simples",
    "pulp.level.aae": "AAE",
    "pulp.level.latin": "Latim",
    "pulp.dxLabel": "Diagnóstico pulpar",
    "apical.dxLabel": "Diagnóstico apical",
    "pulp.level.label": "Nível de detalhe pulpar",
    "rootCaries.none": "Sem cárie radicular",
    "rootCaries.active": "Cárie radicular ativa",
    "rootCaries.arrested": "Cárie radicular paralisada (inativa)",
    "rootCaries.activeCavitated": "Cárie radicular ativa cavitada",
    "rootCaries.present": "cárie radicular",
    "radiographicDepth.none": "Sem profundidade radiográfica registrada",
    "radiographicDepth.E1": "Esmalte, metade externa (E1)",
    "radiographicDepth.E2": "Esmalte, metade interna (E2)",
    "radiographicDepth.D1": "Dentina, terço externo (D1)",
    "radiographicDepth.D2": "Dentina, terço médio (D2)",
    "radiographicDepth.D3": "Dentina, terço interno (D3)",
    "radiographicDepth.superficial": "Superficial (E1–E2)",
    "radiographicDepth.middle": "Média (D1)",
    "radiographicDepth.deep": "Profunda (D2–D3)",
    "fillingDefect.label": "Defeito da restauração",
    "fillingDefect.none": "nenhum",
    "fillingDefect.marginal": "defeito marginal",
    "fillingDefect.fracture": "fratura / lasca",
    "fillingDefect.wear": "desgastado / deficiente",
    "secondaryCaries.sound": "Hígida",
    "secondaryCaries.initial": "Inicial",
    "secondaryCaries.moderate": "Moderada",
    "secondaryCaries.cavitated": "Cavitada",
    "secondaryCaries.score.0": "0",
    "secondaryCaries.score.1": "1",
    "secondaryCaries.score.2": "2",
    "secondaryCaries.score.3": "3",
    "secondaryCaries.score.4": "4",
    "secondaryCaries.score.5": "5",
    "secondaryCaries.score.6": "6",
    "settings.tab.general": "Geral",
    "settings.tab.panels": "Painéis",
    "settings.panels.statuses": "Estados",
    "settings.panels.statuses.desc": "Mostrar o painel Estados.",
    "settings.panels.orthodontics": "Ortodontia",
    "settings.panels.orthodontics.desc": "Mostrar o painel Ortodontia.",
    "settings.tab.toothDetails": "Detalhes do dente",
    "caries.rootLabel": "Cárie radicular",
    "caries.secondaryLabel": "Cárie secundária (CARS)",
    "caries.radiographicLabel": "Profundidade radiográfica",
    "caries.details": "Detalhes da cárie",
    "caries.primaryTitle": "Cárie",
    "caries.recurrentTitle": "Cárie recorrente",
    "caries.recurrentHint": "Cárie recorrente ao lado da restauração: pontuação CARS",
    "caries.cars.0": "Hígido",
    "caries.cars.1": "Primeira alteração visível no esmalte",
    "caries.cars.2": "Alteração visível evidente no esmalte",
    "caries.cars.3": "Ruptura localizada do esmalte (sem dentina)",
    "caries.cars.4": "Sombra de dentina subjacente",
    "caries.cars.5": "Cavidade evidente, dentina visível",
    "caries.cars.6": "Cavidade extensa",
    "caries.detailsHint": "Detalhes da cárie: profundidade, secundária, radiográfica",
    "settings.tab.secondaryCaries": "Cárie secundária",
    "settings.tab.caries": "Cárie",
    "settings.tab.pulpa": "Polpa",
    "settings.tab.notes": "Notas",
    "settings.mode.simple": "Simples",
    "settings.mode.advanced": "Avançado",
    "settings.close": "Fechar",
    "settings.comingSoon": "Em breve",
    "settings.theme.label": "Aparência",
    "settings.exportImport.title": "Exportar / Importar",
    "settings.numbering.desc": "Sistema de numeração dentária usado no diagrama.",
    "settings.language.desc": "Idioma da interface.",
    "settings.theme.desc": "Alternar entre aparência clara e escura.",
    "settings.exportImport.desc": "Salvar ou carregar dados do odontograma. Esta seção está em desenvolvimento.",
    "settings.toothInfo.desc": "Mostrar o painel de informações do dente abaixo do diagrama.",
    "settings.secondaryCaries.desc": "Nível de detalhe do seletor de cárie secundária (CARS).",
    "settings.secondaryCaries.simple": "Simples",
    "settings.secondaryCaries.standard": "Padrão",
    "settings.secondaryCaries.full": "Completo",
    "settings.icdas.desc": "Usar a escala ICDAS II (0–6) em vez da escala de 3 níveis.",
    "settings.cariesDepth.label": "Profundidade da cárie",
    "settings.cariesDepth.desc": "Codificar visualmente a profundidade da cárie em cada face.",
    "settings.rootCaries.desc": "Nível de detalhe do seletor de cárie radicular por dente.",
    "settings.rootCaries.simple": "Presente / ausente",
    "settings.rootCaries.severity": "Gravidade",
    "settings.radiographic.desc": "Classificação radiográfica da profundidade da cárie por face.",
    "settings.radiographic.off": "Desligado",
    "settings.radiographic.threeLevel": "3 níveis",
    "settings.radiographic.detailed": "Detalhado",
    "settings.pulpLevel.desc": "Quanto detalhe o seletor de diagnóstico pulpar oferece.",
    "settings.wearDetail.label": "Detalhe de desgaste",
    "settings.wearDetail.desc": "Simples: alternância sim/não (atrição); completo: tipo de desgaste por borda e cervical.",
    "settings.discolorationDetail.label": "Detalhe de descoloração",
    "settings.discolorationDetail.desc": "Simples: alternância sim/não; completo: escolha da causa da descoloração.",
    "settings.surfaceNotation.label": "Notação de superfície",
    "settings.surfaceNotation.desc": "Completo: as letras de superfície se adaptam à posição do dente (dente anterior: I=incisal, L=labial; superior: P=palatina; inferior: L=lingual). Simples: sempre B/O/L, independentemente da posição.",
    "settings.surfaceNotation.simple": "Simples",
    "settings.surfaceNotation.full": "Completo",
    "settings.toothDetail.simple": "Simples",
    "settings.toothDetail.complex": "Completo",
    "settings.notes.desc": "Ativar notas por dente (clique duplo para editar).",
    "surface.mesial": "mesial",
    "surface.distal": "distal",
    "surface.buccal": "vestibular",
    "surface.lingualPalatal": "lingual/palatina",
    "surface.occlusal": "oclusal",
    "surface.incisal": "incisal",
    "surface.subcrown": "subcoroa",
    "surface.labial": "labial",
    "surface.palatal": "palatina",
    "surface.lingual": "lingual",
    "actions.expand": "Abrir {{label}}",
    "actions.collapse": "Recolher {{label}}",
    "debug.numbering.title": "Depuração de numeração (FDI / Universal / Palmer)",
    "statusExtras.upper12_22Zircon": "Superior 12-22 em zircônia",
    "statusExtras.upper13_23Zircon": "Superior 13-23 em zircônia",
    "statusExtras.upper16_26Zircon": "Superior 16-26 em zircônia",
    "statusExtras.upperFullZircon": "Ponte total superior em zircônia",
    "statusExtras.upper12_22Metal": "Superior 12-22 metalocerâmica",
    "statusExtras.upper13_23Metal": "Superior 13-23 metalocerâmica",
    "statusExtras.upper16_26Metal": "Superior 16-26 metalocerâmica",
    "statusExtras.upperFullMetal": "Ponte total superior metalocerâmica",
    "statusExtras.upperPartialRemovable": "Removível parcial superior",
    "statusExtras.upperFullRemovable": "Removível total superior",
    "statusExtras.upperBarDenture": "Prótese sobre barra superior",
    "statusExtras.lower42_32Zircon": "Inferior 42-32 em zircônia",
    "statusExtras.lower43_33Zircon": "Inferior 43-33 em zircônia",
    "statusExtras.lower46_36Zircon": "Inferior 46-36 em zircônia",
    "statusExtras.lowerFullZircon": "Ponte total inferior em zircônia",
    "statusExtras.lower42_32Metal": "Inferior 42-32 metalocerâmica",
    "statusExtras.lower43_33Metal": "Inferior 43-33 metalocerâmica",
    "statusExtras.lower46_36Metal": "Inferior 46-36 metalocerâmica",
    "statusExtras.lowerFullMetal": "Ponte total inferior metalocerâmica",
    "statusExtras.lowerPartialRemovable": "Removível parcial inferior",
    "statusExtras.lowerFullRemovable": "Removível total inferior",
    "statusExtras.lowerBarDenture": "Prótese sobre barra inferior",
    "touch.zoom.title": "Dente nº {{tooth}}",
    "touch.zoom.select": "Selecionar",
    "touch.zoom.deselect": "Desmarcar",
    "touch.zoom.info": "Detalhes",
    "touch.zoom.close": "Fechar",
    "touch.ctx.select": "Selecionar",
    "touch.ctx.multiSelect": "Adicionar à seleção",
    "touch.ctx.deselect": "Desmarcar",
    "touch.ctx.reset": "Redefinir",
    "touch.arch.upper": "Arcada superior",
    "touch.arch.lower": "Arcada inferior",
    "touch.arch.both": "Ambas",
    "chart.hint.touch": "Toque em um dente para selecioná-lo. Pressione e segure para mais opções.",
    "warn.endoOnMissing": "Tratamento de canal não é possível em dente ausente/implante",
    "warn.fillingOnMissing": "Restauração não é possível em dente ausente",
    "warn.crownReplaceNoCrown": "Marcação de substituição de coroa definida sem uma coroa",
    "warn.cariesOnMissing": "Cárie não é possível em dente ausente",
    "warn.pillarNoCrown": "Marcação de pilar de ponte definida sem material de coroa",
    "warn.invalidRestorationCombo": "Combinação inválida de tipo/material de restauração (corrigida automaticamente)",
    "readOnly.label": "Somente leitura",
    "note.title": "Anotação",
    "note.save": "Salvar",
    "note.delete": "Excluir",
    "note.placeholder": "Adicionar uma anotação...",
    "intro.start": "Introdução",
    "intro.next": "Próximo",
    "intro.back": "Voltar",
    "intro.skip": "Pular",
    "intro.finish": "Concluir",
    "intro.step1.title": "Selecione um dente",
    "intro.step1.text": "Clique em um dente no odontograma para começar a editar.",
    "intro.step2.title": "Cárie",
    "intro.step2.text": "Marque as faces com cárie no diagrama em cruz (B/M/O/D/L).",
    "intro.step3.title": "Pulpite",
    "intro.step3.text": "Ative ou desative a inflamação pulpar no dente selecionado.",
    "intro.step4.title": "Implante",
    "intro.step4.text": "Defina o tipo do dente como implante na lista suspensa.",
    "intro.step5.title": "Restauração",
    "intro.step5.text": "Escolha um material e marque as faces. Cada face pode ter seu próprio material.",
    "intro.step6.title": "Coroa",
    "intro.step6.text": "Escolha o material da coroa.",
    "intro.step7.title": "Anotação do dente",
    "intro.step7.text": "Clique duas vezes em um dente para adicionar uma anotação.",
    "intro.step8.title": "Filtros de seleção",
    "intro.step8.text": "Selecione rapidamente grupos de dentes: superiores/inferiores, anteriores, molares.",
    "intro.step9.title": "Numeração e idioma",
    "intro.step9.text": "Altere o sistema de numeração ou o idioma no cabeçalho.",
    "intro.step10.title": "Exportar",
    "intro.step10.text": "Exporte o odontograma como JSON, FHIR, PNG ou JPG.",
    "intro.step11.title": "Importar",
    "intro.step11.text": "Carregue um odontograma anterior a partir de JSON ou FHIR.",
    "intro.step12.title": "Tudo pronto!",
    "intro.step12.text": "Esses são os conceitos básicos. Explore os demais recursos."
  }
}, $2 = "en";
let Kt = "en";
const s2 = /* @__PURE__ */ new Set();
function p(e, t, a) {
  const i = typeof t == "object" ? t : a, s = t2[typeof t == "string" ? t : Kt] ?? t2[$2], c = t2[$2], v = s[e] ?? c[e] ?? e;
  return i ? v.replace(/\{\{(\w+)\}\}/g, (f, u) => String(i[u] ?? "")) : v;
}
function Oa() {
  return Kt;
}
function fo(e) {
  if (e !== Kt) {
    Kt = e;
    for (const t of s2)
      t(e);
  }
}
function ho(e) {
  return s2.add(e), () => s2.delete(e);
}
function uo(e = {}) {
  const { language: t, onLanguageChange: a } = e, [i, o] = H(t ?? Oa()), s = t ?? i;
  W(() => {
    fo(s);
  }, [s]);
  const c = l2((f) => {
    if (t) {
      a?.(f);
      return;
    }
    o(f), a?.(f);
  }, [t, a]), v = po(() => (f, u) => p(f, s, u), [s]);
  return { lang: s, setLang: c, t: v };
}
function mo(e) {
  const t = typeof e == "number" ? e : Number(e);
  return Number.isFinite(t) ? Math.trunc(t) : null;
}
function go(e) {
  return e >= 11 && e <= 18 || e >= 21 && e <= 28 || e >= 31 && e <= 38 || e >= 41 && e <= 48;
}
function a2(e) {
  return e >= 51 && e <= 55 || e >= 61 && e <= 65 || e >= 71 && e <= 75 || e >= 81 && e <= 85;
}
function We(e, t) {
  const a = mo(e);
  if (a === null) return String(e);
  if (t === "FDI")
    return String(a);
  const i = Math.floor(a / 10), o = a % 10;
  if (!go(a) && !a2(a))
    return String(a);
  if (t === "UNIVERSAL") {
    if (a2(a)) {
      if (i === 5)
        return String.fromCharCode(65 + (5 - o));
      if (i === 6)
        return String.fromCharCode(70 + (o - 1));
      if (i === 7)
        return String.fromCharCode(75 + (5 - o));
      if (i === 8)
        return String.fromCharCode(80 + (o - 1));
    }
    if (i === 1)
      return String(9 - o);
    if (i === 2)
      return String(8 + o);
    if (i === 3)
      return String(25 - o);
    if (i === 4)
      return String(24 + o);
  }
  if (t === "PALMER") {
    let s = "";
    if (i === 1 && (s = "UR"), i === 2 && (s = "UL"), i === 3 && (s = "LL"), i === 4 && (s = "LR"), i === 5 && (s = "UR"), i === 6 && (s = "UL"), i === 7 && (s = "LL"), i === 8 && (s = "LR"), !s) return String(a);
    if (a2(a)) {
      const c = String.fromCharCode(65 + (o - 1));
      return `${s}-${c}`;
    }
    return `${s}-${o}`;
  }
  return String(a);
}
function yo(e) {
  const t = Math.floor(e / 10);
  return t === 1 ? 1 : t === 2 ? 2 : t === 3 ? 3 : 4;
}
const J2 = {
  base: 0,
  restoration: 3,
  overlay: 6
}, Mt = "https://github.com/ZoliQua/React-Odontogram-Modul/fhir/CodeSystem/odontogram", vo = "urn:iso:std:iso:3950", bo = "http://snomed.info/sct", m2 = {
  toothSelection: {
    none: { code: "none", display: "No tooth status" },
    "tooth-base": { code: "tooth-base", display: "Present tooth" },
    milktooth: { code: "milktooth", display: "Primary (deciduous) tooth" },
    implant: { code: "implant", display: "Dental implant" },
    "tooth-under-gum": { code: "tooth-under-gum", display: "Tooth under gum" },
    "no-tooth-after-extraction": { code: "no-tooth-after-extraction", display: "Missing after extraction" }
  },
  endo: {
    none: { code: "none", display: "No endodontic treatment" },
    "endo-medical-filling": { code: "endo-medical-filling", display: "Endodontic medical filling" },
    "endo-filling": { code: "endo-filling", display: "Root canal filling" },
    "endo-filling-incomplete": { code: "endo-filling-incomplete", display: "Incomplete root canal filling" },
    "endo-glass-pin": { code: "endo-glass-pin", display: "Glass fiber post" },
    "endo-metal-pin": { code: "endo-metal-pin", display: "Metal post" }
  },
  fillingMaterial: {
    none: { code: "none", display: "No filling" },
    amalgam: { code: "amalgam", display: "Amalgam filling" },
    composite: { code: "composite", display: "Composite filling" },
    gic: { code: "gic", display: "Glass ionomer cement filling" },
    temporary: { code: "temporary", display: "Temporary filling" }
  },
  prosthesis: {
    none: { code: "none", display: "No prosthesis" },
    "healing-abutment": { code: "healing-abutment", display: "Healing abutment" },
    locator: { code: "locator", display: "Locator attachment" },
    "locator-denture": { code: "locator-denture", display: "Locator overdenture" },
    bar: { code: "bar", display: "Bar attachment" },
    "bar-denture": { code: "bar-denture", display: "Bar overdenture" },
    "removable-partial": { code: "removable-partial", display: "Partial removable denture" },
    "removable-full": { code: "removable-full", display: "Full removable denture" }
  },
  mobility: {
    none: { code: "none", display: "No mobility" },
    m1: { code: "m1", display: "Mobility grade 1" },
    m2: { code: "m2", display: "Mobility grade 2" },
    m3: { code: "m3", display: "Mobility grade 3" }
  },
  mods: {
    inflammation: { code: "inflammation", display: "Inflammation" },
    parodontal: { code: "parodontal", display: "Periodontal involvement" },
    mobility: { code: "mobility", display: "Mobility" }
  },
  periapicalType: {
    none: { code: "none", display: "No periapical lesion" },
    granuloma: { code: "granuloma", display: "Periapical granuloma" },
    cyst: { code: "cyst", display: "Radicular cyst" },
    abscess: { code: "abscess", display: "Periapical abscess" }
  },
  caries: {
    "caries-subcrown": { code: "caries-subcrown", display: "Subcrown caries" },
    "caries-buccal": { code: "caries-buccal", display: "Buccal caries" },
    "caries-lingual": { code: "caries-lingual", display: "Lingual caries" },
    "caries-mesial": { code: "caries-mesial", display: "Mesial caries" },
    "caries-distal": { code: "caries-distal", display: "Distal caries" },
    "caries-occlusal": { code: "caries-occlusal", display: "Occlusal caries" }
  },
  fillingSurfaces: {
    buccal: { code: "buccal", display: "Buccal surface" },
    lingual: { code: "lingual", display: "Lingual surface" },
    mesial: { code: "mesial", display: "Mesial surface" },
    distal: { code: "distal", display: "Distal surface" },
    occlusal: { code: "occlusal", display: "Occlusal surface" }
  },
  toothSubstrate: {
    natural: { code: "natural", display: "Natural substrate" },
    radix: { code: "radix", display: "Root remnant (radix)" },
    broken: { code: "broken", display: "Broken tooth" },
    crownprep: { code: "crownprep", display: "Prepared for crown" }
  },
  restorationType: {
    none: { code: "none", display: "No restoration" },
    crown: { code: "crown", display: "Crown" },
    inlay: { code: "inlay", display: "Inlay" },
    onlay: { code: "onlay", display: "Onlay" },
    veneer: { code: "veneer", display: "Veneer" },
    bridge: { code: "bridge", display: "Bridge unit" }
  },
  restorationMaterial: {
    none: { code: "none", display: "No material" },
    emax: { code: "emax", display: "Lithium disilicate (e.max)" },
    gold: { code: "gold", display: "Gold" },
    gradia: { code: "gradia", display: "Indirect composite (Gradia)" },
    zircon: { code: "zircon", display: "Zirconia" },
    metal: { code: "metal", display: "Full-cast metal" },
    "metal-ceramic": { code: "metal-ceramic", display: "Metal-ceramic (PFM)" },
    telescope: { code: "telescope", display: "Telescopic crown" },
    temporary: { code: "temporary", display: "Temporary" }
  },
  // SP4 Task 1: pulp/apical/resorption diagnosis axes (additive; not yet
  // rendered). See docs/superpowers/specs/2026-07-13-odontogram-sp4-endo-pulp-diagnosis-design.md.
  pulpDx: {
    normal: { code: "normal", display: "Normal pulp" },
    "reversible-pulpitis": { code: "reversible-pulpitis", display: "Reversible pulpitis" },
    "irreversible-pulpitis": { code: "irreversible-pulpitis", display: "Irreversible pulpitis" },
    necrosis: { code: "necrosis", display: "Pulp necrosis" }
  },
  // Practical clinical Latin pulp subtypes (spec §3.2); `display` is the Latin
  // label itself (language-neutral, identical across UI languages).
  pulpLatin: {
    none: { code: "none", display: "No Latin pulp subtype" },
    "pulpa-sana": { code: "pulpa-sana", display: "Pulpa sana" },
    "hyperaemia-pulpae": { code: "hyperaemia-pulpae", display: "Hyperaemia pulpae" },
    "pulpitis-acuta-serosa": { code: "pulpitis-acuta-serosa", display: "Pulpitis acuta serosa" },
    "pulpitis-acuta-purulenta": { code: "pulpitis-acuta-purulenta", display: "Pulpitis acuta purulenta" },
    "pulpitis-chronica-clausa": { code: "pulpitis-chronica-clausa", display: "Pulpitis chronica clausa" },
    "pulpitis-chronica-ulcerosa": { code: "pulpitis-chronica-ulcerosa", display: "Pulpitis chronica ulcerosa (aperta)" },
    "pulpitis-chronica-hyperplastica": { code: "pulpitis-chronica-hyperplastica", display: "Pulpitis chronica hyperplastica (pulpa-polyp)" },
    "necrosis-pulpae": { code: "necrosis-pulpae", display: "Necrosis pulpae" },
    "gangraena-pulpae": { code: "gangraena-pulpae", display: "Gangraena pulpae" }
  },
  apicalDx: {
    normal: { code: "normal", display: "No apical pathology" },
    "symptomatic-apical-periodontitis": { code: "symptomatic-apical-periodontitis", display: "Symptomatic apical periodontitis" },
    "asymptomatic-apical-periodontitis": { code: "asymptomatic-apical-periodontitis", display: "Asymptomatic apical periodontitis" },
    "acute-apical-abscess": { code: "acute-apical-abscess", display: "Acute apical abscess" },
    "chronic-apical-abscess": { code: "chronic-apical-abscess", display: "Chronic apical abscess" },
    "condensing-osteitis": { code: "condensing-osteitis", display: "Condensing osteitis" }
  },
  resorptionType: {
    none: { code: "none", display: "No root resorption" },
    internal: { code: "internal", display: "Internal root resorption" },
    "external-cervical": { code: "external-cervical", display: "External cervical root resorption" }
  },
  wearEdge: {
    none: { code: "none", display: "No incisal/occlusal wear" },
    attrition: { code: "attrition", display: "Attrition (tooth-to-tooth wear)" },
    erosion: { code: "erosion", display: "Erosion (chemical/acid wear)" }
  },
  wearCervical: {
    none: { code: "none", display: "No cervical wear" },
    abrasion: { code: "abrasion", display: "Abrasion (mechanical cervical wear)" },
    abfraction: { code: "abfraction", display: "Abfraction (cervical stress lesion)" },
    erosion: { code: "erosion", display: "Erosion (chemical/acid wear)" }
  },
  discoloration: {
    none: { code: "none", display: "No discoloration" },
    tetracycline: { code: "tetracycline", display: "Tetracycline staining" },
    fluorosis: { code: "fluorosis", display: "Dental fluorosis" },
    nonvital: { code: "nonvital", display: "Non-vital (pulp-death) darkening" },
    extrinsic: { code: "extrinsic", display: "Extrinsic staining" },
    other: { code: "other", display: "Other / unknown discoloration" }
  },
  // SP14 Task 1: orthodontic axes foundation (registry/FHIR/i18n only; render
  // lands in SP14 Task 2). `orthoRotation` is a boolean axis (no value map).
  orthoAppliance: {
    none: { code: "none", display: "No orthodontic appliance" },
    bracket: { code: "bracket", display: "Fixed bracket" },
    band: { code: "band", display: "Orthodontic band" }
  },
  orthoDrift: {
    none: { code: "none", display: "No drift" },
    mesial: { code: "mesial", display: "Mesial drift" },
    distal: { code: "distal", display: "Distal drift" }
  },
  orthoVertical: {
    none: { code: "none", display: "No vertical malposition" },
    extrusion: { code: "extrusion", display: "Extrusion" },
    intrusion: { code: "intrusion", display: "Intrusion" }
  },
  // SP5 Task 1: caries fields foundation (additive; not yet rendered). `rootCaries`
  // is a normal enum axis (registered in axes.ts/fieldMappings.ts). `secondaryCaries`
  // (CARS 0-6) and `radiographicDepth` are per-surface scalar maps handled the same
  // way `cariesDepths` is (special-cased outside AXES) — `secondaryCaries` has no
  // value-map group (a raw integer score, like ICDAS), `radiographicDepth` does.
  rootCaries: {
    none: { code: "none", display: "No root caries" },
    active: { code: "active", display: "Active root caries" },
    arrested: { code: "arrested", display: "Arrested root caries" },
    "active-cavitated": { code: "active-cavitated", display: "Active cavitated root caries" }
  },
  periImplant: {
    none: { code: "none", display: "Peri-implant health" },
    mucositis: { code: "mucositis", display: "Peri-implant mucositis" },
    "peri-implantitis-mild": { code: "peri-implantitis-mild", display: "Peri-implantitis, mild bone loss" },
    "peri-implantitis-moderate": { code: "peri-implantitis-moderate", display: "Peri-implantitis, moderate bone loss" },
    "peri-implantitis-severe": { code: "peri-implantitis-severe", display: "Peri-implantitis, severe bone loss" }
  },
  radiographicDepth: {
    none: { code: "none", display: "No radiographic caries depth recorded" },
    E1: { code: "E1", display: "Enamel, outer half (E1)" },
    E2: { code: "E2", display: "Enamel, inner half (E2)" },
    D1: { code: "D1", display: "Dentin, outer third (D1)" },
    D2: { code: "D2", display: "Dentin, middle third (D2)" },
    D3: { code: "D3", display: "Dentin, inner third (D3)" }
  },
  fillingDefect: {
    none: { code: "none", display: "No filling defect" },
    marginal: { code: "marginal", display: "Marginal defect (overhang / deficient margin)" },
    fracture: { code: "fracture", display: "Fractured / chipped filling" },
    wear: { code: "wear", display: "Worn / deficient filling material" }
  }
}, ko = {}, xo = "odontogram-subject", Y2 = "urn:uuid:odontogram-subject";
function Na(e, t, a) {
  const i = [{ system: e, code: t.code, display: t.display }], o = t.snomed ?? (a ? ko[a] : void 0);
  return o && i.push({ system: bo, code: o, display: t.display }), { coding: i, text: t.display };
}
function Ce(e, t) {
  const a = m2[e]?.[t] ?? { code: t, display: t };
  return Na(Mt, a, `${e}:${t}`);
}
function Ut(e, t) {
  return Na(Mt, { code: e, display: t }, `finding:${e}`);
}
function wo(e) {
  return { coding: [{ system: vo, code: e }], text: `Tooth ${e}` };
}
const Ra = [
  {
    coding: [
      { system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "exam", display: "Exam" }
    ]
  }
], Ee = (e, t, a) => ({
  resourceType: "Observation",
  status: "final",
  category: Ra,
  code: a,
  subject: { reference: e },
  bodySite: wo(t)
});
function ue(e) {
  const t = e?.coding;
  return Array.isArray(t) ? t.find((i) => i?.system === Mt && typeof i.code == "string")?.code : void 0;
}
function Mo(e, t) {
  return e[t] || (e[t] = {}), e[t];
}
const _ = (e) => Object.values(m2[e]).map((t) => ({ id: t.code, coding: { local: t.code, display: t.display } })), ut = (e, t) => e.map((a) => a.id in t ? { ...a, svgLayer: t[a.id] } : a), q2 = (e) => Object.fromEntries(e.map((t) => [t, t])), qe = [
  {
    id: "toothSelection",
    field: "toothSelection",
    kind: "enum",
    valueGroup: "toothSelection",
    skipValue: "tooth-base",
    finding: { local: "tooth-status", display: "Tooth status" },
    values: ut(_("toothSelection"), {
      implant: "implant",
      milktooth: "milktooth",
      "tooth-under-gum": "tooth-under-gum",
      "no-tooth-after-extraction": "no-tooth-after-extraction"
    }),
    uiOptions: [
      { value: "none", labelKey: "toothSelect.none" },
      { value: "tooth-base", labelKey: "toothSelect.permanent" },
      { value: "milktooth", labelKey: "toothSelect.milk" },
      { value: "implant", labelKey: "toothSelect.implant" },
      { value: "tooth-under-gum", labelKey: "toothSelect.underGum" }
    ]
  },
  {
    id: "endo",
    field: "endo",
    kind: "enum",
    valueGroup: "endo",
    skipValue: "none",
    finding: { local: "endodontic-status", display: "Endodontic status" },
    values: ut(_("endo"), {
      "endo-medical-filling": "endo-medical-filling",
      "endo-filling": "endo-filling",
      "endo-filling-incomplete": "endo-filling-incomplete",
      "endo-glass-pin": ["endo-filling", "endo-glass-pin"],
      "endo-metal-pin": ["endo-filling", "endo-metal-pin"]
    }),
    uiOptions: [
      { value: "none", labelKey: "endo.option.none" },
      { value: "endo-medical-filling", labelKey: "endo.option.medicalFilling" },
      { value: "endo-filling", labelKey: "endo.option.filling", when: (e) => !e.isMilktooth },
      { value: "endo-filling-incomplete", labelKey: "endo.option.incompleteFilling", when: (e) => !e.isMilktooth },
      { value: "endo-glass-pin", labelKey: "endo.option.glassPin", when: (e) => !e.isMilktooth },
      { value: "endo-metal-pin", labelKey: "endo.option.metalPin", when: (e) => !e.isMilktooth }
    ]
  },
  {
    id: "toothSubstrate",
    field: "toothSubstrate",
    kind: "enum",
    valueGroup: "toothSubstrate",
    skipValue: "natural",
    finding: { local: "tooth-substrate", display: "Tooth substrate" },
    values: _("toothSubstrate")
  },
  {
    id: "restorationType",
    field: "restorationType",
    kind: "enum",
    valueGroup: "restorationType",
    skipValue: "none",
    finding: { local: "restoration-type", display: "Restoration type" },
    values: _("restorationType")
  },
  {
    id: "restorationMaterial",
    field: "restorationMaterial",
    kind: "enum",
    valueGroup: "restorationMaterial",
    skipValue: "none",
    finding: { local: "restoration-material", display: "Restoration material" },
    values: _("restorationMaterial")
  },
  {
    id: "prosthesis",
    field: "prosthesis",
    kind: "enum",
    valueGroup: "prosthesis",
    skipValue: "none",
    finding: { local: "prosthesis-type", display: "Prosthesis / attachment" },
    values: _("prosthesis")
  },
  {
    id: "mobility",
    field: "mobility",
    kind: "enum",
    valueGroup: "mobility",
    skipValue: "none",
    finding: { local: "tooth-mobility", display: "Tooth mobility" },
    values: _("mobility"),
    uiOptions: [
      { value: "none", labelKey: "mobility.none" },
      { value: "m1", labelKey: "mobility.m1" },
      { value: "m2", labelKey: "mobility.m2" },
      { value: "m3", labelKey: "mobility.m3" }
    ]
  },
  {
    id: "caries",
    field: "caries",
    kind: "set",
    valueGroup: "caries",
    finding: { local: "caries", display: "Dental caries" },
    values: ut(_("caries"), q2([
      "caries-subcrown",
      "caries-buccal",
      "caries-lingual",
      "caries-mesial",
      "caries-distal",
      "caries-occlusal"
    ]))
  },
  {
    id: "mods",
    field: "mods",
    kind: "set",
    valueGroup: "mods",
    finding: { local: "tooth-modifier", display: "Tooth modifier" },
    values: ut(_("mods"), q2(["inflammation", "parodontal", "mobility"])),
    uiOptions: [
      { value: "parodontal", labelKey: "mods.parodontal" },
      { value: "inflammation", labelKey: "mods.periapicalInflammation" }
    ]
  },
  {
    id: "calculus",
    field: "calculus",
    kind: "boolean",
    finding: { local: "calculus", display: "Dental calculus" },
    svgLayer: "calculus",
    appliesWhen: (e, t) => !e.isImplant && !e.underGum && !e.extraction && t.toothSelection !== "none"
  },
  {
    id: "periapicalType",
    field: "periapicalType",
    kind: "enum",
    valueGroup: "periapicalType",
    skipValue: "none",
    finding: { local: "periapical-lesion-type", display: "Periapical lesion type" },
    values: ut(_("periapicalType"), {
      granuloma: "granuloma",
      cyst: "cysta",
      abscess: "abscess"
    }),
    uiOptions: [
      { value: "none", labelKey: "periapical.type.none" },
      { value: "granuloma", labelKey: "periapical.type.granuloma" },
      { value: "cyst", labelKey: "periapical.type.cyst" }
    ]
  },
  {
    id: "fillingMaterial",
    field: "fillingMaterial",
    kind: "restoration",
    valueGroup: "fillingMaterial",
    skipValue: "none",
    surfacesField: "fillingSurfaces",
    finding: { local: "restoration", display: "Dental restoration" },
    values: _("fillingMaterial")
  },
  {
    id: "endoResection",
    field: "endoResection",
    kind: "boolean",
    finding: { local: "apicoectomy", display: "Apicoectomy / root resection" },
    svgLayer: "endo-resection",
    appliesWhen: (e) => e.toothPresent && !e.underGum && !e.extraction
  },
  {
    id: "fissureSealing",
    field: "fissureSealing",
    kind: "boolean",
    finding: { local: "fissure-sealing", display: "Fissure sealing" },
    svgLayer: "fissure-sealing",
    appliesWhen: (e) => e.fissureAllowed
  },
  {
    id: "contactMesial",
    field: "contactMesial",
    kind: "boolean",
    finding: { local: "contact-mesial", display: "Mesial contact issue" },
    svgLayer: "mesial-no-contact-point",
    appliesWhen: (e) => e.contactAllowed
  },
  {
    id: "contactDistal",
    field: "contactDistal",
    kind: "boolean",
    finding: { local: "contact-distal", display: "Distal contact issue" },
    svgLayer: "distal-no-contact-point",
    appliesWhen: (e) => e.contactAllowed
  },
  {
    id: "brokenMesial",
    field: "brokenMesial",
    kind: "boolean",
    finding: { local: "broken-mesial", display: "Mesial fracture" }
  },
  {
    id: "brokenIncisal",
    field: "brokenIncisal",
    kind: "boolean",
    finding: { local: "broken-incisal", display: "Incisal fracture" }
  },
  {
    id: "brokenDistal",
    field: "brokenDistal",
    kind: "boolean",
    finding: { local: "broken-distal", display: "Distal fracture" }
  },
  {
    id: "parapulpalPin",
    field: "parapulpalPin",
    kind: "boolean",
    finding: { local: "parapulpal-pin", display: "Parapulpal pin" },
    svgLayer: "parapulpal-pin",
    appliesWhen: (e) => e.toothPresent && !e.underGum && !e.extraction
  },
  {
    id: "bridgePillar",
    field: "bridgePillar",
    kind: "boolean",
    finding: { local: "bridge-pillar", display: "Bridge abutment (pillar)" }
  },
  {
    id: "extractionWound",
    field: "extractionWound",
    kind: "boolean",
    finding: { local: "extraction-wound", display: "Extraction wound" }
  },
  {
    id: "extractionPlan",
    field: "extractionPlan",
    kind: "boolean",
    finding: { local: "extraction-planned", display: "Planned extraction" },
    svgLayer: "extraction-plan",
    appliesWhen: (e) => e.extractionPlanAllowed
  },
  {
    id: "crownReplace",
    field: "crownReplace",
    kind: "boolean",
    finding: { local: "crown-replace-planned", display: "Planned crown replacement" },
    svgLayer: "crown-replace",
    appliesWhen: (e, t) => t.toothSelection === "tooth-base" && t.restorationType !== "none"
  },
  {
    id: "crownNeeded",
    field: "crownNeeded",
    kind: "boolean",
    finding: { local: "crown-needed", display: "Crown needed" },
    svgLayer: "crown-needed",
    appliesWhen: (e, t) => t.toothSelection === "tooth-base" && t.restorationType === "none" && ["natural", "broken", "crownprep"].includes(t.toothSubstrate)
  },
  {
    id: "missingClosed",
    field: "missingClosed",
    kind: "boolean",
    finding: { local: "missing-gap-closed", display: "Closed gap (missing tooth)" },
    svgLayer: "missing-closed",
    appliesWhen: (e) => e.isNone
  },
  // SP3b Task 6: crown-marginal-leakage toggle (spec §3.4). The SVG artwork has
  // shipped a dormant `crown-leakage` layer since v2.5.0 (never toggled — see
  // src/__tests__/svg-assets.test.ts), but no clinical axis or UI control ever
  // activated it until now.
  {
    id: "crownLeakage",
    field: "crownLeakage",
    kind: "boolean",
    finding: { local: "crown-leakage", display: "Crown marginal leakage" },
    svgLayer: "crown-leakage",
    appliesWhen: (e, t) => t.restorationType === "crown" || t.restorationType === "bridge"
  },
  // SP4 Task 1: pulp/apical/resorption diagnosis axes (additive scaffolding —
  // registry/FHIR/i18n only; render + migration + retirement of the legacy
  // booleans land in later SP4 tasks). `resorptionType` below was wired up
  // (render + migration; replaced the retired `rootResorption` boolean) in
  // SP4 Task 2. `pulpDx` below was wired up (render + migration; replaced
  // the retired `pulpInflam` boolean) in SP4 Task 3 — its render is bespoke
  // (milktooth/permanent split in odontogram.ts), so unlike `resorptionType`
  // it deliberately carries no `svgLayer` metadata here (mirrors the retired
  // `pulpInflam` axis, which never had one either).
  // See docs/superpowers/specs/2026-07-13-odontogram-sp4-endo-pulp-diagnosis-design.md.
  {
    id: "pulpDx",
    field: "pulpDx",
    kind: "enum",
    valueGroup: "pulpDx",
    skipValue: "normal",
    finding: { local: "pulp-diagnosis", display: "Pulp diagnosis (AAE)" },
    values: _("pulpDx")
  },
  {
    id: "pulpLatin",
    field: "pulpLatin",
    kind: "enum",
    valueGroup: "pulpLatin",
    skipValue: "none",
    flag: "latinPulpDetail",
    finding: { local: "pulp-diagnosis-latin", display: "Pulp diagnosis (Latin, practical)" },
    values: _("pulpLatin")
  },
  {
    id: "apicalDx",
    field: "apicalDx",
    kind: "enum",
    valueGroup: "apicalDx",
    skipValue: "normal",
    finding: { local: "apical-diagnosis", display: "Apical diagnosis (AAE)" },
    values: _("apicalDx")
  },
  {
    id: "resorptionType",
    field: "resorptionType",
    kind: "enum",
    valueGroup: "resorptionType",
    skipValue: "none",
    finding: { local: "root-resorption-type", display: "Root resorption type" },
    values: _("resorptionType"),
    // Both `internal` and `external-cervical` render the single `endo-resorption`
    // layer (visually identical; only the data distinguishes them). This axis-
    // level svgLayer/appliesWhen is metadata only (kept for the clear-set +
    // svg-layers.test.ts coverage) — `applyFlagLayers` only auto-activates
    // boolean-kind axes, so the actual activation is explicit in
    // applyStateToSvgSingle (odontogram.ts), byte-identical to the retired
    // `rootResorption:true` boolean render (SP4 Task 2).
    svgLayer: "endo-resorption",
    appliesWhen: (e) => e.toothPresent
  },
  // SP11 Task 1: bruxismWear/bruxismNeckWear (booleans) retired in favor of the
  // wearEdge/wearCervical type enums (mirrors resorptionType above).
  {
    id: "wearEdge",
    field: "wearEdge",
    kind: "enum",
    valueGroup: "wearEdge",
    skipValue: "none",
    finding: { local: "tooth-wear-edge", display: "Incisal/occlusal wear" },
    values: _("wearEdge"),
    // All types render the single `tooth-bruxism-wear` layer; the axis svgLayer is
    // metadata only (svg-layers.test coverage) — activation is explicit in
    // applyStateToSvgSingle (applyFlagLayers only auto-activates boolean axes).
    svgLayer: "tooth-bruxism-wear",
    appliesWhen: (e) => e.bruxismAllowed
  },
  {
    id: "wearCervical",
    field: "wearCervical",
    kind: "enum",
    valueGroup: "wearCervical",
    skipValue: "none",
    finding: { local: "tooth-wear-cervical", display: "Cervical wear" },
    values: _("wearCervical"),
    svgLayer: "tooth-bruxism-neck-wear",
    appliesWhen: (e) => e.bruxismAllowed
  },
  // SP12 Task 1: discoloration foundation (registry/FHIR/i18n only; render lands
  // in a later SP12 task).
  {
    id: "discoloration",
    field: "discoloration",
    kind: "enum",
    valueGroup: "discoloration",
    skipValue: "none",
    finding: { local: "tooth-discoloration", display: "Tooth discoloration" },
    // No svgLayer: activation is explicit in applyStateToSvgSingle — it tints the
    // crown path's .style.fill (no layer toggle), so there is no layer to declare.
    values: _("discoloration")
  },
  // SP14 Task 1: orthodontic axes foundation (registry/FHIR/i18n only; render
  // lands in SP14 Task 2). The 3 enum axes mirror wearEdge: svgLayer is metadata
  // only (activation stays explicit in applyStateToSvgSingle/applyFlagLayers only
  // auto-activates boolean-kind axes). `orthoRotation` (boolean) deliberately
  // omits svgLayer, mirroring pulpDx, so applyFlagLayers never auto-activates it
  // — it will be rendered explicitly in Task 2.
  {
    id: "orthoAppliance",
    field: "orthoAppliance",
    kind: "enum",
    valueGroup: "orthoAppliance",
    skipValue: "none",
    finding: { local: "tooth-ortho-appliance", display: "Orthodontic appliance" },
    values: _("orthoAppliance"),
    svgLayer: "ortho-bracket",
    appliesWhen: (e) => e.toothPresent
  },
  {
    id: "orthoDrift",
    field: "orthoDrift",
    kind: "enum",
    valueGroup: "orthoDrift",
    skipValue: "none",
    finding: { local: "tooth-ortho-drift", display: "Orthodontic drift" },
    values: _("orthoDrift"),
    svgLayer: "arrow-mesial",
    appliesWhen: (e) => e.toothPresent
  },
  {
    id: "orthoVertical",
    field: "orthoVertical",
    kind: "enum",
    valueGroup: "orthoVertical",
    skipValue: "none",
    finding: { local: "tooth-ortho-vertical", display: "Vertical malposition" },
    values: _("orthoVertical"),
    svgLayer: "arrow-up",
    appliesWhen: (e) => e.toothPresent
  },
  {
    id: "orthoRotation",
    field: "orthoRotation",
    kind: "boolean",
    finding: { local: "tooth-ortho-rotation", display: "Tooth rotation" }
  },
  // SP5 Task 1: caries fields foundation (additive scaffolding — registry/FHIR/i18n
  // only; render + migration land in later SP5 tasks). `rootCaries` is a normal enum
  // axis. `secondaryCaries` (per-surface CARS 0-6) and `radiographicDepth`
  // (per-surface none/E1/E2/D1/D2/D3) are scalar-map fields handled the same way
  // `cariesDepths` is — special-cased outside AXES/FIELD_MAPPINGS entirely (see
  // registry/fhir.ts + registry/fromFhir.ts) — so they deliberately have no row here.
  {
    id: "rootCaries",
    field: "rootCaries",
    kind: "enum",
    valueGroup: "rootCaries",
    skipValue: "none",
    finding: { local: "root-caries", display: "Root caries" },
    values: _("rootCaries"),
    svgLayer: "caries-root",
    appliesWhen: (e) => e.toothPresent
  },
  // SP8 Task 1: peri-implantitis foundation (registry/FHIR/i18n only; SVG layer +
  // render + migration land in later SP8 tasks).
  {
    id: "periImplant",
    field: "periImplant",
    kind: "enum",
    valueGroup: "periImplant",
    skipValue: "none",
    finding: { local: "peri-implant-status", display: "Peri-implant status" },
    // No svgLayer: activation is explicit in applyStateToSvgSingle (mucositis reuses
    // the `parodontal` glyph; peri-implantitis adds `peri-implant-bone-loss` at
    // severity-scaled opacity). The bone-loss layer exists only on the 4 implant
    // SVGs, so it must NOT be declared as an axis svgLayer (which svg-layers.test.ts
    // would expect on every tooth). Mirrors the apicalDx axis.
    values: _("periImplant")
  }
];
function So(e, t, a, i) {
  const o = a[i.field], s = () => Ut(i.finding.local, i.finding.display);
  switch (i.kind) {
    case "enum": {
      const c = typeof o == "string" ? o : "";
      if (!c || c === i.skipValue) return [];
      const v = Ee(e, t, s());
      return v.valueCodeableConcept = Ce(i.valueGroup, c), [v];
    }
    case "boolean": {
      if (o !== !0) return [];
      const c = Ee(e, t, s());
      return c.valueBoolean = !0, [c];
    }
    case "set": {
      const c = Array.isArray(o) ? o.filter((u) => typeof u == "string") : [];
      if (c.length === 0) return [];
      const v = Ee(e, t, s()), f = i.field === "caries" ? a.cariesSeverity : void 0;
      return v.component = c.map((u) => {
        const m = { code: Ce(i.valueGroup, u), valueBoolean: !0 };
        if (f) {
          const b = String(u).replace("caries-", ""), k = f[b];
          typeof k == "number" && (m.valueInteger = k, delete m.valueBoolean);
        }
        return m;
      }), [v];
    }
    case "restoration": {
      const c = a.fillingSurfaceMaterials, v = [];
      if (c && typeof c == "object")
        for (const [u, m] of Object.entries(c))
          typeof m == "string" && m && v.push([u, m]);
      if (v.length === 0) {
        const u = typeof o == "string" ? o : "", m = Array.isArray(a[i.surfacesField]) ? a[i.surfacesField].filter((b) => typeof b == "string") : [];
        if (u && u !== i.skipValue) for (const b of m) v.push([b, u]);
      }
      if (v.length === 0) return [];
      const f = Ee(e, t, s());
      return f.component = v.map(([u, m]) => ({
        code: Ce("fillingSurfaces", u),
        valueCodeableConcept: Ce("fillingMaterial", m)
      })), [f];
    }
    default:
      return [];
  }
}
function zo(e, t = {}) {
  const a = e && typeof e == "object" && e.teeth && typeof e.teeth == "object" ? e.teeth : {}, i = t.subject ?? Y2, o = [];
  if (!t.subject) {
    const c = { resourceType: "Patient", id: xo };
    o.push({ fullUrl: Y2, resource: c });
  }
  if ((e && typeof e == "object" && e.globals && typeof e.globals == "object" ? e.globals : {}).edentulous === !0) {
    const c = {
      resourceType: "Observation",
      status: "final",
      category: Ra,
      code: { coding: [{ system: Mt, code: "edentulous", display: "Edentulous (whole mouth)" }], text: "Edentulous (whole mouth)" },
      subject: { reference: i },
      valueBoolean: !0
    };
    o.push({ resource: c });
  }
  for (const [c, v] of Object.entries(a)) {
    const f = v && typeof v == "object" ? v : {};
    for (const k of qe) for (const g of So(i, c, f, k)) o.push({ resource: g });
    const u = f.radiographicDepth;
    if (u && typeof u == "object") {
      const k = Object.entries(u).filter((g) => typeof g[1] == "string");
      if (k.length) {
        const g = Ee(i, c, Ut("radiographic-caries-depth", "Radiographic caries depth"));
        g.component = k.map(([D, r]) => ({
          code: Ce("fillingSurfaces", D),
          valueCodeableConcept: Ce("radiographicDepth", r)
        })), o.push({ resource: g });
      }
    }
    const m = f.fillingDefect;
    if (m && typeof m == "object") {
      const k = Object.entries(m).filter((g) => typeof g[1] == "string");
      if (k.length) {
        const g = Ee(i, c, Ut("filling-defect", "Filling defect"));
        g.component = k.map(([D, r]) => ({
          code: Ce("fillingSurfaces", D),
          valueCodeableConcept: Ce("fillingDefect", r)
        })), o.push({ resource: g });
      }
    }
    if (typeof f.note == "string" && f.note.trim().length > 0) {
      const k = Ee(i, c, Ut("tooth-note", "Tooth note"));
      k.note = [{ text: f.note }], o.push({ resource: k });
    }
    const b = f.customStates;
    if (b && typeof b == "object")
      for (const [k, g] of Object.entries(b)) {
        if (typeof g != "string" && typeof g != "number" && typeof g != "boolean") continue;
        const D = Ee(i, c, {
          coding: [{ system: Mt, code: `custom-state:${k}`, display: `Custom state: ${k}` }],
          text: `Custom state: ${k}`
        });
        typeof g == "string" ? D.valueString = g : typeof g == "number" ? D.valueQuantity = { value: g } : D.valueBoolean = g, o.push({ resource: D });
      }
  }
  return { resourceType: "Bundle", type: "collection", entry: o };
}
function Zo(e, t = {}) {
  return zo(e, t);
}
const Ga = {};
for (const e of qe) Ga[e.finding.local] = e;
function Io(e) {
  const t = {}, a = {}, i = e?.entry;
  if (Array.isArray(i))
    for (const o of i) {
      const s = o?.resource;
      if (!s || s.resourceType !== "Observation") continue;
      const c = ue(s.code);
      if (!c) continue;
      const v = s.bodySite?.coding?.find((m) => typeof m.code == "string")?.code;
      if (c === "edentulous") {
        a.edentulous = s.valueBoolean === !0;
        continue;
      }
      if (!v) continue;
      const f = Mo(t, v);
      if (c === "tooth-note") {
        const m = s.note?.[0]?.text;
        typeof m == "string" && (f.note = m);
        continue;
      }
      if (c.startsWith("custom-state:")) {
        const m = c.slice(13), b = typeof s.valueString == "string" ? s.valueString : typeof s.valueBoolean == "boolean" ? s.valueBoolean : typeof s.valueQuantity?.value == "number" ? s.valueQuantity.value : void 0;
        b !== void 0 && ((f.customStates ??= {})[m] = b);
        continue;
      }
      if (c === "secondary-caries") {
        const m = {};
        for (const b of s.component ?? []) {
          const k = ue(b.code), g = b.valueInteger;
          k && typeof g == "number" && (m[k] = g);
        }
        Object.keys(m).length && (f.secondaryCaries = m);
        continue;
      }
      if (c === "radiographic-caries-depth") {
        const m = {};
        for (const b of s.component ?? []) {
          const k = ue(b.code), g = ue(b.valueCodeableConcept);
          k && g && (m[k] = g);
        }
        Object.keys(m).length && (f.radiographicDepth = m);
        continue;
      }
      if (c === "filling-defect") {
        const m = {};
        for (const b of s.component ?? []) {
          const k = ue(b.code), g = ue(b.valueCodeableConcept);
          k && g && (m[k] = g);
        }
        Object.keys(m).length && (f.fillingDefect = m);
        continue;
      }
      const u = Ga[c];
      if (u) {
        if (u.kind === "enum") {
          const m = ue(s.valueCodeableConcept);
          m && (f[u.field] = m);
        } else if (u.kind === "boolean")
          s.valueBoolean === !0 && (f[u.field] = !0);
        else if (u.kind === "set") {
          const m = (s.component ?? []).map((b) => ue(b.code)).filter((b) => !!b);
          if (m.length && (f[u.field] = m), u.field === "caries") {
            const b = {};
            for (const k of s.component ?? []) {
              const g = ue(k.code);
              if (!g) continue;
              const D = k.valueInteger;
              typeof D == "number" && (b[String(g).replace("caries-", "")] = D);
            }
            Object.keys(b).length && (f.cariesSeverity = b);
          }
        } else if (u.kind === "restoration") {
          const m = {};
          for (const b of s.component ?? []) {
            const k = ue(b.code), g = ue(b.valueCodeableConcept);
            k && g && (m[k] = g);
          }
          Object.keys(m).length && (f.fillingSurfaceMaterials = m);
        }
      }
    }
  for (const o of Object.values(t))
    if (!(!o.secondaryCaries || !o.cariesSeverity)) {
      for (const s of Object.keys(o.secondaryCaries)) delete o.cariesSeverity[s];
      Object.keys(o.cariesSeverity).length === 0 && delete o.cariesSeverity;
    }
  return { version: "2.10", globals: a, teeth: t };
}
function Do(e) {
  return Io(e);
}
const nt = {
  crown: { materials: ["emax", "gold", "gradia", "zircon", "metal", "metal-ceramic", "telescope", "temporary"] },
  bridge: { materials: ["emax", "gold", "gradia", "zircon", "metal", "metal-ceramic", "telescope", "temporary"] },
  inlay: { materials: ["emax", "gold", "gradia", "zircon", "temporary"] },
  onlay: { materials: ["emax", "gold", "gradia", "zircon", "temporary"], occlusalOnly: !0 },
  veneer: { materials: ["emax", "gold", "gradia", "zircon", "temporary"] }
}, X2 = {
  type: (e) => `restoration.type.${e}`,
  material: (e) => `restoration.material.${e === "metal-ceramic" ? "metalCeramic" : e}`
};
function g2(e, t, a) {
  if (e === "none") return t === "none";
  const i = nt[e];
  return !i || i.occlusalOnly && a !== "occlusal" ? !1 : i.materials.includes(t);
}
function Q2(e) {
  return e === "telescope" ? ["telescope-crown", "telescope-crown-inside", "telescope-crown-outside"] : [`${e}-crown`];
}
function Ua(e, t, a) {
  return e === "none" || t === "none" ? [] : g2(e, t, a) ? e === "bridge" ? [...Q2(t), `${t}-bridge-connector`] : e === "crown" ? Q2(t) : [`${t}-${e}`] : [];
}
function Co() {
  const e = /* @__PURE__ */ new Set();
  for (const t of Object.keys(nt))
    for (const a of nt[t].materials)
      for (const i of ["front", "occlusal"])
        Ua(t, a, i).forEach((o) => e.add(o));
  return [...e];
}
const Eo = ["crown", "bridge"], Lo = ["healing-abutment", "locator", "locator-denture", "bar", "bar-denture"], Po = ["removable-partial", "removable-full"], Ao = ["bridge"];
function To(e, t = {}) {
  const a = [
    { restorationType: "none", restorationMaterial: "none", labelKey: "restoration.none" }
  ], i = !t.isImplant && t.toothSelection === "none", o = t.isImplant ? Eo : i ? Ao : Object.keys(nt);
  for (const c of o) {
    const v = nt[c];
    if (!(v.occlusalOnly && e !== "occlusal"))
      for (const f of v.materials)
        a.push({
          restorationType: c,
          restorationMaterial: f,
          labelKey: "",
          prefixKey: "restoration.prefix.fixed",
          typeLabelKey: X2.type(c),
          materialLabelKey: X2.material(f)
        });
  }
  const s = t.isImplant ? Lo : i ? Po : [];
  for (const c of s)
    a.push({
      restorationType: "none",
      restorationMaterial: "none",
      labelKey: "",
      prefixKey: "restoration.prefix.removable",
      prosthesis: c
    });
  return a;
}
const Oo = [
  "tooth-base",
  "tooth-healthy-pulp",
  "tooth-inflam-pulp",
  "tooth-bruxism-wear",
  "tooth-bruxism-neck-wear",
  "tooth-base-beauty",
  "endo-resection",
  "milktooth-base",
  "milktooth-beauty",
  "milktooth-healthy-pulp",
  "milktooth-inflam-pulp",
  "fissure-sealing",
  "mesial-no-contact-point",
  "distal-no-contact-point",
  "no-tooth-after-extraction",
  // GROUPS.variants
  "tooth-broken-incisal",
  "tooth-broken-distal-incisal",
  "tooth-broken-distal",
  "tooth-broken-mesial-distal-incisal",
  "tooth-broken-mesial-distal",
  "tooth-broken-mesial-incisal",
  "tooth-broken-mesial",
  "tooth-crownprep",
  "tooth-under-gum",
  "tooth-radix",
  // GROUPS.mods + periapical glyphs
  "inflammation",
  "parodontal",
  "mobility",
  "cysta",
  "granuloma",
  "abscess",
  // GROUPS.endo + endo-resorption
  "endo-medical-filling",
  "endo-filling",
  "endo-filling-incomplete",
  "endo-glass-pin",
  "endo-metal-pin",
  "endo-resection",
  "parapulpal-pin",
  "endo-resorption",
  // caries ids
  "caries-subcrown",
  "caries-buccal",
  "caries-lingual",
  "caries-distal",
  "caries-mesial",
  "caries-occlusal",
  // SP5 Task 2: root-caries toggle — activates the dormant `caries-root` artwork
  // layer (present since v2.5.0 in the 4 main-view templates only, absent from
  // the 2 occlusal templates — same main-view-only shape as "caries-subcrown"
  // above, which every AXES/svg-layers test already tolerates being absent from
  // an individual template as long as it exists in at least one installed SVG).
  "caries-root",
  // SP8 Task 3: peri-implant-bone-loss toggle — the `periImplant` axis has no
  // svgLayer (see registry/axes.ts; the bone-loss layer only exists on the 4
  // implant SVGs, so axisClearLayers() must not expect it on every tooth) and
  // its render block (odontogram.ts applyStateToSvgSingle) only turns this ON
  // conditionally, never explicitly OFF — so it must be listed here for the
  // general per-render clear sweep to reset it symmetrically (same pattern as
  // caries-root above for the analogous rootCaries axis).
  "peri-implant-bone-loss",
  // subcaries per surface
  "subcaries-buccal",
  "subcaries-lingual",
  "subcaries-mesial",
  "subcaries-distal",
  "subcaries-occlusal",
  "calculus",
  // fillings: {mat}-{surface}
  "filling-amalgam-buccal",
  "filling-amalgam-lingual",
  "filling-amalgam-mesial",
  "filling-amalgam-distal",
  "filling-amalgam-occlusal",
  "filling-composite-buccal",
  "filling-composite-lingual",
  "filling-composite-mesial",
  "filling-composite-distal",
  "filling-composite-occlusal",
  "filling-gic-buccal",
  "filling-gic-lingual",
  "filling-gic-mesial",
  "filling-gic-distal",
  "filling-gic-occlusal",
  "filling-temporary-buccal",
  "filling-temporary-lingual",
  "filling-temporary-mesial",
  "filling-temporary-distal",
  "filling-temporary-occlusal",
  // SP10: per-surface filling-defect markers (reuse the pre-existing dormant
  // defect-{surface} artwork inside <g id="fillings">). Cleared each render so a
  // reused per-tooth SVG node never keeps a stale marker (SP7/SP8 lesson).
  "defect-buccal",
  "defect-lingual",
  "defect-mesial",
  "defect-distal",
  "defect-occlusal",
  // restoration clear list (odontogram.ts:780)
  "implant-base",
  "implant-connector",
  "implant-healing-abutment",
  "implant-locator-screw",
  "implant-bar",
  "prosthesis",
  "prosthesis-implant",
  "prosthesis-implant-crown",
  "prosthesis-implant-gum",
  "telescope",
  "zircon",
  "metal",
  "emax-crown",
  "zircon-crown",
  "metal-crown",
  "temporary-crown",
  "telescope-crown-inside",
  "telescope-crown-outside",
  "extraction-plan",
  "zircon-bridge-connector",
  "metal-bridge-connector",
  "temporary-bridge-connector",
  "telescope-bridge-connector",
  "temporary-restorations",
  // SP3 restoration composition — per-material wrapper <g> groups...
  "emax",
  "gold",
  "gradia",
  "metal-ceramic",
  // ...and every composed child layer (crown / bridge-connector / inlay / onlay / veneer),
  // superset of allRestorationLayers() so allClearLayers() stays equal to this list.
  "gold-crown",
  "gradia-crown",
  "metal-ceramic-crown",
  "telescope-crown",
  "emax-bridge-connector",
  "gold-bridge-connector",
  "gradia-bridge-connector",
  "metal-ceramic-bridge-connector",
  "emax-inlay",
  "gold-inlay",
  "gradia-inlay",
  "zircon-inlay",
  "temporary-inlay",
  "emax-onlay",
  "gold-onlay",
  "gradia-onlay",
  "zircon-onlay",
  "temporary-onlay",
  "emax-veneer",
  "gold-veneer",
  "gradia-veneer",
  "zircon-veneer",
  "temporary-veneer",
  // specials
  "crown-replace",
  "crown-needed",
  "missing-closed",
  // SP3b Task 6: crown-marginal-leakage toggle — activates the dormant
  // `crown-leakage` artwork layer (present since v2.5.0 but never toggled).
  "crown-leakage",
  // toothSelection activation layers (see comment above): cleared here, re-set at :763-764
  "implant",
  "milktooth",
  // SP14 Task 2: orthodontic glyphs (appliance/drift/vertical/rotation) — dormant
  // since v2.5.0, activated by the new ortho render block in applyStateToSvgSingle
  // (odontogram.ts). 4 of these 7 ids (ortho-bracket/ortho-ring/arrow-up/arrow-down)
  // are absent from the 2 occlusal templates (14_occl.svg/16_occl.svg) — clearing an
  // id absent from a given template is a harmless no-op (svgGetById returns null,
  // setActive(null, ...) is a guarded early-return).
  "ortho-bracket",
  "ortho-ring",
  "arrow-mesial",
  "arrow-distal",
  "arrow-up",
  "arrow-down",
  "arrow-rotation"
];
function No() {
  const e = [];
  for (const t of qe) for (const a of t.values ?? []) {
    const i = a.svgLayer == null ? [] : Array.isArray(a.svgLayer) ? a.svgLayer : [a.svgLayer];
    for (const o of i) e.includes(o) || e.push(o);
  }
  return e;
}
function Ro() {
  const e = new Set(Oo);
  for (const t of No()) e.add(t);
  for (const t of Co()) e.add(t);
  return [...e];
}
function Go(e, t, a) {
  const i = e.toothSelection;
  return {
    isImplant: i === "implant",
    isMilktooth: i === "milktooth",
    underGum: a.isUnderGum(i),
    extraction: a.isExtraction(i) || i === "none" && e.extractionWound,
    isNone: i === "none",
    toothPresent: a.isToothPresent(i),
    fissureAllowed: i === "tooth-base" && a.fissureAllowedTeeth.has(t),
    contactAllowed: i === "tooth-base" || i === "milktooth" || a.brokenVariants.has(i),
    bruxismAllowed: i === "tooth-base" && e.restorationType === "none" && e.toothSubstrate === "natural",
    extractionPlanAllowed: ["tooth-base", "milktooth", "implant", "tooth-under-gum"].includes(i)
  };
}
function Uo(e, t, a, i) {
  for (const o of qe)
    if (o.kind === "boolean" && o.svgLayer)
      t[o.field] === !0 && (!o.appliesWhen || o.appliesWhen(a, t)) && i.setActive(i.svgGetById(e, o.svgLayer), !0);
    else if (o.kind === "set" && o.id === "mods") {
      const s = t.mods ?? [];
      for (const c of s) {
        const v = o.values?.find((u) => u.id === c), f = v?.svgLayer == null ? [c] : Array.isArray(v.svgLayer) ? v.svgLayer : [v.svgLayer];
        for (const u of f) i.setActive(i.svgGetById(e, u), !0);
      }
    }
}
function V(e) {
  const t = qe.find((a) => a.id === e);
  return new Set((t?.values ?? []).map((a) => a.id));
}
function jo() {
  return new Set(Object.keys(m2.fillingSurfaces));
}
function ja(e, t = {}) {
  const a = qe.find((i) => i.id === e);
  return !a || !a.flag ? !0 : !!t[a.flag];
}
function Et(e, t = {}, a = {}) {
  return ja(e, a) ? (qe.find((o) => o.id === e)?.uiOptions ?? []).filter((o) => o.when ? o.when(t) : !0).map((o) => ({ value: o.value, labelKey: o.labelKey })) : [];
}
const Fa = "http://www.w3.org/2000/svg", Fo = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], Ko = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], Bo = [Fo, Ko], _o = 0.72, Vo = 0.19, Ho = 0.09, Wo = 0.12, $o = {
  emax: "#e9e1d2",
  gold: "#ece614",
  gradia: "#55ff98",
  zircon: "#feffbf",
  metal: "#0051bf",
  "metal-ceramic": "#c9ccd1",
  telescope: "#0051bf",
  temporary: "#ffffff"
};
function y2(e) {
  return $o[e] ?? "#8a8f98";
}
function Jo(e) {
  return e ? e.restorationType === "bridge" || e.bridgePillar === !0 : !1;
}
function Ka(e) {
  const t = [];
  for (const a of Bo) {
    let i = [];
    for (const o of a)
      Jo(e(o)) ? i.push(o) : (i.length >= 2 && t.push(i), i = []);
    i.length >= 2 && t.push(i);
  }
  return t;
}
function Yo(e, t) {
  for (const a of e) {
    const i = t(a);
    if (i && i.restorationType === "bridge" && i.restorationMaterial && i.restorationMaterial !== "none")
      return i.restorationMaterial;
  }
  for (const a of e) {
    const i = t(a);
    if (i && i.restorationMaterial && i.restorationMaterial !== "none") return i.restorationMaterial;
  }
  return "metal";
}
function Ba(e, t, a, i) {
  const o = [];
  for (const s of e) {
    const c = i(Yo(s, t)), f = s[0] >= 31 ? Vo : _o;
    for (let u = 0; u < s.length - 1; u++) {
      const m = a(s[u]), b = a(s[u + 1]);
      if (!m || !b || m.width <= 0 || m.height <= 0 || b.width <= 0 || b.height <= 0) continue;
      const k = m.x <= b.x ? m : b, g = m.x <= b.x ? b : m, D = Math.min(k.width, g.width) * Wo, r = k.x + k.width - D, y = g.x + D - r;
      if (y <= 0) continue;
      const I = k.height * Ho, O = k.y + k.height * f;
      o.push({ x: r, y: O - I / 2, width: y, height: I, fill: c });
    }
  }
  return o;
}
const ea = "bridge-overlay", qo = "bridge-overlay-bar";
function Xo(e, t) {
  return e.querySelector(
    `.tooth-tile.side-view[data-tooth="${t}"]`
  );
}
function _a(e, t, a) {
  const i = Xo(e, a);
  if (!i) return null;
  const o = i.getBoundingClientRect();
  return o.width === 0 || o.height === 0 ? null : { x: o.left - t.left, y: o.top - t.top, width: o.width, height: o.height };
}
function Qo(e) {
  const { grid: t } = e;
  if (!t) return;
  const a = e.materialColor ?? y2;
  let i = t.querySelector(
    `:scope > svg.${ea}`
  );
  const o = Ka(e.getState);
  if (o.length === 0) {
    if (i)
      for (; i.firstChild; ) i.removeChild(i.firstChild);
    return;
  }
  const s = t.getBoundingClientRect(), c = (m) => _a(t, s, m), v = Ba(o, e.getState, c, a);
  for (i || (i = document.createElementNS(Fa, "svg"), i.setAttribute("class", ea), i.setAttribute("aria-hidden", "true"), t.appendChild(i)); i.firstChild; ) i.removeChild(i.firstChild);
  const f = Math.max(1, Math.round(s.width)), u = Math.max(1, Math.round(s.height));
  i.setAttribute("width", String(f)), i.setAttribute("height", String(u)), i.setAttribute("viewBox", `0 0 ${f} ${u}`);
  for (const m of v)
    i.appendChild(Va(m));
}
function Va(e) {
  const t = document.createElementNS(Fa, "rect");
  t.setAttribute("class", qo), t.setAttribute("x", String(e.x)), t.setAttribute("y", String(e.y)), t.setAttribute("width", String(e.width)), t.setAttribute("height", String(e.height));
  const a = Math.min(e.height / 2, e.width / 2);
  return t.setAttribute("rx", String(a)), t.setAttribute("ry", String(a)), t.setAttribute("fill", e.fill), t.setAttribute("stroke", "#1b3f1c"), t.setAttribute("stroke-width", "0.5"), t;
}
const e0 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20Part%20of%20React%20Odontogram%20Modul%20-%20https://github.com/ZoliQua/React-Odontogram-Modul%20-%20SVG%20Version:%202.5.0%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20id='incisor_x5F_tooth'%20version='1.1'%20viewBox='0%200%2039.7%2070.8'%3e%3cstyle%3e%20[data-active='0']%20{%20display:%20none;%20}%20%3c/style%3e%3cdefs%3e%3clinearGradient%20id='linear-gradient-11-0'%20x1='18.9'%20y1='5075.6'%20x2='22.2'%20y2='5075.6'%20gradientTransform='translate(0%20-5054.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-1'%20x1='-20940.4'%20y1='-5727.6'%20x2='-20937.1'%20y2='-5727.6'%20gradientTransform='translate(-20728.2156%20-6363.5836)%20rotate(-178.2)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-2'%20x1='-162.4'%20y1='5399.8'%20x2='-159.1'%20y2='5399.8'%20gradientTransform='translate(11.1779%20-5385.7996)%20rotate(-1.8)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-3'%20x1='-20612.6'%20y1='-6345.1'%20x2='-20609.3'%20y2='-6345.1'%20gradientTransform='translate(-20760.2214%20-5752.7168)%20rotate(178.4)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-4'%20x1='-2021.8'%20y1='7829.2'%20x2='-2018.5'%20y2='7829.2'%20gradientTransform='translate(-294.3261%20-8067.5315)%20rotate(-16.7)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-5'%20x1='-21076.3'%20y1='216.4'%20x2='-21073'%20y2='216.4'%20gradientTransform='translate(-19839.0975%20-11953.7511)%20rotate(-148.4)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-6'%20x1='-21074.7'%20y1='218.9'%20x2='-21071.3'%20y2='218.9'%20gradientTransform='translate(-19839.0975%20-11953.7511)%20rotate(-148.4)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-7'%20x1='-7796.3'%20y1='10959.3'%20x2='-7792.9'%20y2='10959.3'%20gradientTransform='translate(-2361.8395%20-13702.9537)%20rotate(-47.9)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-8'%20x1='18.3'%20y1='5076.6'%20x2='22.7'%20y2='5076.6'%20gradientTransform='translate(0%20-5054.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-9'%20x1='-20940.6'%20y1='-5728.4'%20x2='-20936.2'%20y2='-5728.4'%20gradientTransform='translate(-20728.2156%20-6363.5836)%20rotate(-178.2)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-10'%20x1='-163.1'%20y1='5400.5'%20x2='-158.7'%20y2='5400.5'%20gradientTransform='translate(11.1779%20-5385.7996)%20rotate(-1.8)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-11'%20x1='-20612.6'%20y1='-6345.7'%20x2='-20608.2'%20y2='-6345.7'%20gradientTransform='translate(-20760.2214%20-5752.7168)%20rotate(178.4)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-12'%20x1='-2663.7'%20y1='8405.7'%20x2='-2659.3'%20y2='8405.7'%20gradientTransform='translate(-860.3179%20-8761.9733)%20rotate(-23.3)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%239b0402'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%236b0000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-13'%20x1='-21076.9'%20y1='212.8'%20x2='-21072.7'%20y2='212.8'%20gradientTransform='translate(-19839.0975%20-11953.7511)%20rotate(-148.4)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-14'%20x1='-21075.1'%20y1='216.7'%20x2='-21070.8'%20y2='216.7'%20gradientTransform='translate(-19839.0975%20-11953.7511)%20rotate(-148.4)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-15'%20x1='-7795.4'%20y1='10959.4'%20x2='-7791.4'%20y2='10959.4'%20gradientTransform='translate(-2361.8395%20-13702.9537)%20rotate(-47.9)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='red'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b40000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-16'%20x1='20.3'%20y1='3066.7'%20x2='20.3'%20y2='3076.4'%20gradientTransform='translate(0%20-3026.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23cf0'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b4c500'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-11-17'%20x1='20'%20y1='3062.9'%20x2='20'%20y2='3070.4'%20gradientTransform='translate(0%20-3026.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23c8c9c9'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23828282'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-11-0'%20cx='21.1'%20cy='3077.7'%20fx='21.1'%20fy='3077.7'%20r='11.5'%20gradientTransform='translate(-.4%20-3026.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23ececec'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23cfcfcf'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23bababa'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23aeaeae'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23aaa'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-11-1'%20cx='-793.3'%20cy='3078.8'%20fx='-793.3'%20fy='3078.8'%20r='10.2'%20gradientTransform='translate(1130.7437%20-3026.6587)%20scale(1.4%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fefefe'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f8d6d4'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f2b5b2'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23ee9b98'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23eb8985'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23e97e79'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e97b76'%20data-active='1'%20/%3e%3c/radialGradient%3e%3clinearGradient%20id='linear-gradient-11-18'%20x1='19.5'%20y1='3084'%20x2='19.5'%20y2='3074.3'%20gradientTransform='translate(0%20-3026.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23cd986a'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-11-2'%20cx='19.5'%20cy='18.5'%20fx='19.5'%20fy='18.5'%20r='13.1'%20gradientTransform='translate(0%2070.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23ecf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d7e96c'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23b8d876'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2392c283'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2362a893'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%232b89a6'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-11-3'%20cx='19.7'%20cy='18.3'%20fx='19.7'%20fy='18.3'%20r='13.2'%20gradientTransform='translate(0%2070.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d9ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bcda75'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2397c581'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%236aac90'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23368fa2'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-11-4'%20cx='19.5'%20cy='18.5'%20fx='19.5'%20fy='18.5'%20r='13.1'%20gradientTransform='translate(0%2070.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-11-5'%20cx='19.7'%20cy='18.3'%20fx='19.7'%20fy='18.3'%20r='13.2'%20gradientTransform='translate(0%2070.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-11-6'%20cx='20.2'%20cy='1056.2'%20fx='20.2'%20fy='1056.2'%20r='8.2'%20gradientTransform='translate(0%20-998.7)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-11-7'%20cx='19.8'%20cy='1057.3'%20fx='19.8'%20fy='1057.3'%20r='11.5'%20gradientTransform='translate(0%2070.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3c/defs%3e%3cg%20id='base'%20data-active='1'%3e%3cpath%20id='bone-base'%20d='M39.6,17.5l-2.8,1.3c-2.6,1.5,0,9.3-2,11.7,0,4.8-4.6,3.8-5.9,3.7-3.9-.2-13.2,0-17.6,0s-5-3.1-5.1-3c-2.1,0-2.2-12.3-2.2-12.3l-1.5-2.2c-.2-.4-2.3-1-2.3-1.5V0h39.6v17.5h-.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cpath%20id='gum-base'%20d='M39.1,19.1c-1.1,1-2.7,1.7-3.2,3.1-1.1,3.6-.2,7.7-1.6,11.2-2.1,5.2-6,.4-9.9.5-3.9,0-8.2-.2-11.9.5-2.3.6-4.6,2.6-7,1.2-5.7-3.8-1.8-12.8-4-17.9-.2-.9-2.1-2.3-1.1-2.9,1.1-.5,4.1,1,4.5,2.2,2.1,3.8-1.9,14.1,3.5,15.5,2.6.3,8.3-.6,13.2-.9,3.7-.6,9.4.9,11.4-2.3,2.1-3.3-.1-8.2,2.5-11.3,2.6-3.1,5.5-1.2,3.8.9h0v.2h-.1Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3c/g%3e%3cg%20id='mods'%20data-active='1'%3e%3cpath%20id='parodontal'%20d='M10.6,29.4c-.4,3-.5,6.1,3,7,4.3.9,8.9,2.1,12.9-.3,1.9-1.2,3.5-2.5,3.6-4.6,0-2.8-.6-6-.9-8.6-.5-4.4-1.3-9.9-5.6-12.3-3.5-1.3-8.7-1-10.3,2.6-2.2,4.9-1.9,10.5-2.7,16,0,0,0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ffa46a;'%20/%3e%3cg%20id='inflammation'%20data-active='1'%3e%3cg%20id='cysta'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='cysta-outside'%20d='M9.3,4.3c-2.7,2.4-1.6,8.8,1.6,10.6,3.2,1.8,4.9,1.8,7.1,2,4.2.4,11.6-.5,13.1-6.4,1.6-7.2-6.6-9-12.2-8.7-3,0-7.2.5-9.5,2.6h0Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='cysta-inside'%20d='M10.8,4.8c-2.3,2.2-1.3,7.9,1.3,9.4s4.3,1.5,6,1.8c3.6.3,9.9-.4,11.2-5.6,1.5-6.7-5.4-8.2-10.3-8-2.5,0-6.1.4-8.1,2.3h-.1,0Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='granuloma'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='granuloma-outside'%20d='M11.8,3.7c-2.1,2-1.3,7.4,1.3,8.9s3.8,1.5,5.5,1.7c3.3.3,9-.4,10.2-5.3,1.1-6.2-5.2-7.7-9.6-7.5-2.3,0-5.6.4-7.4,2.2Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='granuloma-inside'%20d='M12.9,4.4c-1.8,1.7-1,6,1,7.2s3.3,1.2,4.6,1.3c2.8.3,7.5-.3,8.5-4.3,1.1-5.1-4.2-6.3-7.8-6.1-1.9,0-4.7.3-6.2,1.8h0Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='abscess'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='abscess-inside'%20d='M11.3,5.2c-.9.7-2.5-1.6-5.8,1.2s4.4,2,4.8,4.5c.4,2.5-2.3,2.8-1.7,3.2s6.6-1.8,7.1-1.7c1.1.4,2,.4,2.9.5,1.3.1,3,0,4.5-.4s2.6.3,3.3-.4,7.5-.6,7.3-1.4-4.3-2.9-4.2-3.4c.2-.9,3.6-3.3,3.4-3.9s-6.4,1.7-7,1.2-.3-1.7-.7-1.9c-.7-.3-1.8,0-2.6-.2s-2.3-.4-3.3-.4-2.5.2-3.9.6c-1.4.4-1.8.9-2.4,1.5l-1.4-1-.3,1.9h0Z'%20data-active='1'%20style='fill:%20%23feffd5;%20stroke:%20%23ffa46a;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='mobility'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-mobility-2'%20d='M25,14.6l3.3-1.7c-1,1.8-1.9,3.6-2.9,5.4l3.6-1.8c-1.3,2.1-2.5,4.3-3.7,6.5,1.4-.4,2.8-.9,4.3-1.3-1.1,1.6-2.3,3.2-3.4,4.8.9-.3,1.8-.5,2.7-.7-.7,1.3-1.4,2.5-2.2,3.7,1.1-.6,2.3-1,3.5-1.3-.9,1.2-1.7,2.5-2.5,3.8.8-.3,1.6-.5,2.4-.6-.9,1-1.7,2-2.6,3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3cpath%20id='tooth-mobility-1'%20d='M12.6,14.6c1.2-.3,2.4,0,3.4.8-1.5,1.2-3,2.3-4.5,3.3,1.5-.1,2.9,0,4.4.5-1.4,1.1-2.8,2.3-4.2,3.6,1.1,0,2.2.3,3.2.7-1,.9-2,1.7-2.9,2.6.8,0,1.7.3,2.5.7-1,1.2-1.9,2.5-2.7,3.9,1-.2,2-.4,3-.6-1.5,1.1-2.8,2.5-3.9,4.3.8.2,1.7.2,2.5,0'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth-variants'%20data-active='1'%3e%3cpath%20id='no-tooth-after-extraction'%20d='M18.9,34c1.8-.6,7.6,1.2,7.9-.7-1-8.6-.6-33.1-8.9-29.7s-2.3,18.8-3.8,28.1c-.1,1.7,2,2.9,4.8,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='tooth-under-gum'%20d='M16.6,3c-.8,2.2-.5,4.5-.4,6.8.1,2.1.1,4.1.2,6.2,0,1.5-.2,2.9-.7,4.2-.5,1.7-.9,3.9-.7,5.7.2,2.7,1.6,4.9,4.3,4.5s7.5-.5,7.1-2.9-.8-5.3-2-7.5-.2-.3-.3-.5c-.6-1-1.3-2.5-1.3-3.6-.2-2.9-1.6-6.1-2.6-8.9-.4-1.6-1.1-3-2.6-3.9'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-incisal'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,5,1.3,9.4,5.4,10.7,4.1,1.3,0-6,.9-6.4,3.4-1.4,5.6,1.5,6.5,1.5s4.1-1.4,5.3-1.7c4.2-1,.8,6.9,2.5,6.5s3.9-1.7,3.9-3.8c0-5.4-.3-11.8-2.3-17s-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal-incisal'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-.7,1.5,2.3,4.5,1.8,6.3s-1.3,1.7-1.2,2.6c0,1.4,1.3,2.9,1.2,4.3,0,1-4.1,1.3-4,2.3.3,2.7.9,4.9,2.3,6.3s2.9-1.7,5-1.7,1.8-3.5,3.1-3.5,3.8,2.9,5,2.8,3,3.9,4.5,3.5c3.6-1,3-1.6,3-3.6s-3.1-2.7-3.2-4.6,1.4-2.2,1.4-3.2-1.5-2.1-1.7-3.1c-.3-1.9,2.4-4.5,1.8-6.2-2-5.2-.3-.8-.5-1.2-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-.7,1.5,2.3,4.5,1.8,6.3s-1.3,1.7-1.2,2.6c0,1.4,1.3,2.9,1.2,4.3,0,1-4.1,1.3-4,2.3.5,4.7,2,8,7.1,8s9.3.4,12.9-.6,3-1.6,3-3.6-3.1-2.7-3.2-4.6,1.4-2.2,1.4-3.2-1.5-2.1-1.7-3.1c-.3-1.9,2.4-4.5,1.8-6.2-2-5.2-.3-.8-.5-1.2-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-incisal'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1h6.7c2.5,0-1-6.4.5-6.7,2.4-.6,3.8-.5,3.8-2.6s5.5.7,5.4-1c-.2-4.2-.8-7.3-2.2-11s-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1s9.3.4,12.9-.6,3-1.6,3-3.6-3.1-2.7-3.2-4.6,1.4-2.2,1.4-3.2-1.5-2.1-1.7-3.1c-.3-1.9,2.4-4.5,1.8-6.2-2-5.2-.3-.8-.5-1.2-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal-incisal'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.3,2.8-2.5,6.4-3,9.8s.7,1.3.7,2.1c0,1.3,4,.2,4.2,1.3s3.3,0,3.8.9c1.2,2.5-2.8,9.3.6,9.3,6.1,0,15.1,1.1,15.1-4.3s-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-.8,1.7.6,3.9,0,5.9s-.9,4.3-1.1,5.3-1,1.4-1.1,2.6c0,1.8,2.8,0,3.2,1.5.9,3.6-.6,8.1,3.7,8.1,6.1,0,16.5,1.1,16.5-4.3s-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-crownprep'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-.4,1-1.6,4.3-2,5.4s4.8,0,5.1.6c.4,1-.2,3.2-.2,4.5.6.9,1.4,1.3,6,1.3s6.8.6,7.3-1.4-.2-2.7,0-3.8,4.2.4,4-.5c-.3-1.3-.7-2.7-1.2-3.9-2-5.2-.3-.8-.5-1.2-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-radix'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-.4,1-1.6,4.3-2,5.4s5.9-.3,11.8-.4,10.3.7,10.2.3c-.3-1.3-.5-1.9-1-3.1-2-5.2-.3-.8-.5-1.2-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='tooth'%20data-active='1'%3e%3cpath%20id='tooth-base'%20d='M18.5,3.1c-2.4,4.5-3.3,9.5-3.6,14.5-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1s16.5,1.1,16.5-4.3-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.2-7.1-4.2-9.4'%20data-active='1'%20style='fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-base-beauty'%20d='M15.7,59.5c2-.7,3.5-1,5.1-.6,2.5.3,4.1,1.5,5.5,3-1.5-.5-3.1-.6-4.9-.4-2.1.3-3.6.6-5.2,0-.6-.3-.9-1.2-.5-1.9h0Z'%20data-active='1'%20style='fill:%20%23fefefe;'%20/%3e%3cg%20id='tooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base'%20d='M20.8,3.4c.5,0,.7,3,.3,5-.3,2.3-.1,8.6.1,11.1.4,5.8.1,5.2.3,11.3s1.7,8.7,1.2,10.6c-.6,2.9-4.9,3.3-5.1.4s1.1-7.8,1.5-12.5-.2-9.7,0-10.9c.4-3.3.1-7.5-.1-10.4s-.9-3.5,0-4.3c0,0-.6-1,1.9-.4h0Z'%20data-active='1'%20style='fill:%20%23ff422a;'%20/%3e%3cpath%20id='pulp-inflam-path-8'%20d='M22.2,21h0v-.2c-.2-.2-.5-.3-.7-.3-.6,0-1.3,0-1.9.1s-1,.4-.3.7,2.1.3,2.9-.3Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-0);'%20/%3e%3cpath%20id='pulp-inflam-path-7'%20d='M17.8,18.8h0v.2c.2.2.4.3.7.3.6.1,1.3,0,1.9,0s1-.3.3-.7-2.1-.4-2.9.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-1);'%20/%3e%3cpath%20id='pulp-inflam-path-6'%20d='M22.2,16.3h0v-.2c-.2-.2-.5-.3-.7-.3-.6,0-1.3,0-1.9.2s-1,.4-.2.7,2.1.2,2.9-.4c0,0-.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-2);'%20/%3e%3cpath%20id='pulp-inflam-path-5'%20d='M17.6,14.5h0v.2c.2.2.5.3.7.3.6,0,1.3,0,1.9-.2s1-.4.2-.7-2.1-.2-2.9.3h.1,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-3);'%20/%3e%3cpath%20id='pulp-inflam-path-4'%20d='M22.1,11.6h0s0-.1-.1-.2c-.2-.1-.5-.1-.8-.1-.6,0-1.2.4-1.8.7s-.8.6,0,.7,2.1-.3,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-4);'%20/%3e%3cpath%20id='pulp-inflam-path-3'%20d='M18,8.4h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9.6.2,1.1.2.6-.5s-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-5);'%20/%3e%3cpath%20id='pulp-inflam-path-2'%20d='M17.8,5.4h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-6);'%20/%3e%3cpath%20id='pulp-inflam-path-1'%20d='M22.1,5.5h-.2c-.3,0-.5.2-.8.3-.5.4-.9,1-1.3,1.6s-.4,1,.3.7,1.7-1.4,1.9-2.5h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-7);'%20/%3e%3c/g%3e%3cpath%20id='tooth-healthy-pulp'%20d='M20.8,3.4c.5,0,.7,3,.3,5-.3,2.3-.1,8.6.1,11.1.4,5.8.1,5.2.3,11.3s1.7,8.7,1.2,10.6c-.6,2.9-4.9,3.3-5.1.4s1.1-7.8,1.5-12.5-.2-9.7,0-10.9c.4-3.3.1-7.5-.1-10.4s-.9-3.5,0-4.3c0,0-.6-1,1.9-.4h0Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3cpath%20id='tooth-bruxism-wear'%20d='M13.7,60.3c.8,1.7,1.4,1,2.7.3.4-.2.8-.6,1.2-.2.9,1.7,1.2,1.3,2.7.5.8-.3,2.2-1.3,2.7,0,.4,1,.8.6,1.4,0,.5-.4,1.5-1.5,2-.8.3.3.6,1.5,1.2,1.3.5-.2,1.1-1.8,1.7-1.6.3.2.6.8,1,1.2.3.4.7.8.6,1.1-.5.8-1.9.9-2.8,1.2-4.5,1-9.3,1.1-13.9.6-1.6,0-5.9-.3-3-2.8.8-.7,1.9-1.1,2.3-.8,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='tooth-bruxism-neck-wear'%20d='M23.3,47.3c-.4-1.7-.7-1-1.4-.3-.2.2-.4.6-.6.2-.4-1.7-.6-1.3-1.4-.5-.4.3-1.2,1.3-1.4,0-.2-1-.4-.6-.7,0-.3.4-.8,1.5-1.1.8-.1-.3-.3-1.5-.6-1.3s-.6,1.8-.9,1.6c-.1-.2-.3-.8-.5-1.2-.1-.4-.3-.8-.3-1.1.3-.8,1-.9,1.5-1.2,2.4-.9,4.8-1,7.2-.4.8,0,3,.4,1.5,2.8-.4.7-1,1.1-1.2.8h-.1s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='milktooth'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='milktooth-base'%20d='M17.7,2.8c-2.4,4.5-2.5,9.8-2.8,14.8-.3,4.6-.9,9-1.3,13.6-.3,3.2-1.3,6.2-2.8,9-1.6,3.5-3.1,8.2-3.3,12.3-.3,6,2,11.1,8.1,11.1s16.5,1.1,16.5-4.3-.3-11.8-2.3-17-.3-.8-.5-1.2c-1.1-2.4-2.1-5.9-1.9-8.3.5-6.5-1.8-13.8-3-20.3-.4-3.6-1.6-7-4.6-9.3'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='milktooth-beauty'%20d='M15.7,59.5c2-.7,3.5-1,5.1-.6,2.5.3,4.1,1.5,5.5,3-1.5-.5-3.1-.6-4.9-.4-2.1.3-3.6.6-5.2,0-.6-.3-.9-1.2-.5-1.9h0Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cg%20id='milktooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base1'%20d='M20.8,3.4c.7,0,.9,3.2.4,5.3-.4,2.4-.1,9.1.1,11.7.5,6.1.1,5.5.4,11.9.3,6.4,2.3,9.2,1.6,11.2-.8,3.1-6.5,3.5-6.8.4s1.5-8.2,2-13.2-.3-10.2,0-11.5c.5-3.5.1-7.9-.1-11s-1.2-3.7,0-4.5c0,0-.8-1.1,2.5-.4h-.1,0Z'%20data-active='1'%20style='fill:%20%23b70000;'%20/%3e%3cpath%20id='pulp-inflam-path-81'%20d='M22.7,22h0v-.2c-.3-.2-.7-.3-.9-.3-.8,0-1.7,0-2.5.1s-1.3.4-.4.7,2.8.3,3.9-.3c0,0-.1,0-.1,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-8);'%20/%3e%3cpath%20id='pulp-inflam-path-71'%20d='M16.8,19.6h0v.2c.3.2.5.3.9.3.8.1,1.7,0,2.5,0s1.3-.3.4-.7-2.8-.4-3.9.2h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-9);'%20/%3e%3cpath%20id='pulp-inflam-path-61'%20d='M22.7,17h0v-.2c-.3-.2-.7-.3-.9-.3-.8,0-1.7,0-2.5.2s-1.3.4-.3.7,2.8.2,3.9-.4h-.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-10);'%20/%3e%3cpath%20id='pulp-inflam-path-51'%20d='M16.5,15.1h0v.2c.3.2.7.3.9.3.8,0,1.7,0,2.5-.2s1.3-.4.3-.7-2.8-.2-3.9.3h.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-11);'%20/%3e%3cpath%20id='pulp-inflam-path-41'%20d='M23.7,9.6h0l-.2-.2h-1.1c-.8,0-1.5.6-2.3,1.1s-1,.8,0,.8,2.7-.7,3.4-1.7c0,0,.2,0,.2,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-12);'%20/%3e%3cpath%20id='pulp-inflam-path-31'%20d='M15.9,11.7h0v.2c0,.3.4.5.7.7.7.4,1.6.7,2.4.9s1.5.2.8-.5-2.3-1.5-3.7-1.5h-.1v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-13);'%20/%3e%3cpath%20id='pulp-inflam-path-21'%20d='M16.3,7.3h0v.2c0,.3.4.5.7.7.7.4,1.6.7,2.4.9s1.5.2.8-.5-2.3-1.5-3.7-1.5h-.1v.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-14);'%20/%3e%3cpath%20id='pulp-inflam-path-11'%20d='M23.4,4.7h-.3c-.4,0-.7.2-1.1.3-.7.4-1.2,1.1-1.7,1.7s-.5,1.1.4.7,2.3-1.5,2.5-2.6h.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-15);'%20/%3e%3c/g%3e%3cpath%20id='milktooth-healthy-pulp'%20d='M20.9,3.4c.7,0,1,3.2.4,5.3-.4,2.4-.1,9.1.1,11.7.6,6.1.1,5.5.4,11.9.3,6.4,2.3,9.2,1.7,11.2-.8,3.1-6.8,3.5-7,.4s1.5-8.2,2.1-13.2-.3-10.2,0-11.5c.6-3.5.1-7.9-.1-11s-1.2-3.7,0-4.5c0,0-.8-1.1,2.6-.4h-.2Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3c/g%3e%3cg%20id='endos'%20data-active='1'%3e%3cpath%20id='endo-medical-filling'%20d='M20.2,7.5c.8,2.4.9,7.6,1.2,10.8.3,4.3,2.6,17.5,2.9,21.8.1,4.8-8.3,5.8-7.8-1.4.6-6.3,1.7-19.1,2.1-25,0-1,.6-9.3,1.6-6.4h0v.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f9ae94;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='endo-filling-incomplete'%20d='M23.4,43.2c1.7-1.8.6-4.4.4-6.6-1.1-6.4-1.3-13.7-2.9-20-1.3-2.6-2,3.8-2,4.6-.4,4.8-1.1,10-1.8,14.8-.2,2.4-1,5.4,1.1,7.2,1.3,1.1,3.7,1.1,5,0,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-filling'%20d='M20.2,7.5c.8,2.4.9,7.6,1.2,10.8.3,4.3,1.4,16,1.8,20.4-.4,4.1-2.3,7.1-5.1,4.7s-1.8-2.9-1.5-4.5c.5-3.3,0,.4.4-5.7.6-6.3,1.4-13.4,1.7-19.3,0-1,.6-9.3,1.6-6.4h0v.2-.2s-.1,0-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-glass-pin'%20d='M20.2,13.8c.7,1.8.9,5.4,1.1,7.6.3,3,1.4,11.4,1.7,14.4,0,3.4,5.6,10.5,1.7,13.6-3.6,2.9-12.9,2-12-4,.9-4.8,3.9-8.6,4.3-13.6.6-4.4,1.2-9.4,1.6-13.7,0-.7.5-6.6,1.6-4.6h0v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23c8c9c9;'%20/%3e%3cpath%20id='endo-metal-pin'%20d='M20.2,13.8c.7,1.8.9,5.4,1.1,7.6.3,3,1.4,11.4,1.7,14.4,0,3.4,5.6,10.5,1.7,13.6-3.6,2.9-12.9,2-12-4,.9-4.8,3.9-8.6,4.3-13.6.6-4.4,1.2-9.4,1.6-13.7,0-.7.5-6.6,1.6-4.6h0v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%233951a3;'%20/%3e%3cpath%20id='endo-resorption'%20d='M11.6,9.7s3.6-7.2,4.1-7.2l6.6.2c1.7,0,4.1,8.1,4,8.2l-.6,1.9c-.2.7-.6,1.3-1.1,1.9l-2.1,2.3c-1.3,1.4-3.4,1.5-4.8.2l-3-2.7c-.2-.2-.4-.5-.6-.7l-2.7-4.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fdecc5;'%20/%3e%3cpath%20id='endo-resection'%20d='M13.7,9.2s3.6-7,4.1-7l6.6.2c1.7,0,4.1,7.8,4,7.9l-.2,6.3-14.7-.2v-7.4h.2s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fdecc5;'%20/%3e%3c/g%3e%3cg%20id='surfaces'%20data-active='1'%3e%3cg%20id='subcaries'%20data-active='1'%3e%3cpath%20id='subcaries-buccal'%20d='M16.2,50.9c.8,1.1,2.1,1.5,3.3,1.6,1.9.2,3.3-1.1,4.2-3,.4-.7.6-1.2.6-2-.6-4-8.6-3-9.6-1.3-.6,1.2.9,3.6,1.5,4.6h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-mesial'%20d='M26.2,35.6c-4.5-.5-4.6,13.5-2.7,15.6,1.8,3.8,6.8,3.8,7.9-.6.9-3.4-1.9-13.5-5.1-15,0,0-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-distal'%20d='M10.4,54.9c2.6,0,4.6-5.4,5.4-8.1,1.4-3.8,1.7-8.6-2.3-8.6-5.1.3-7.7,15.1-3.2,16.7,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-occlusal'%20d='M10.2,59.8c.6,3.9,7.2,4.4,10.9,4.2,3.3,0,7.9,0,9.6-3.1,2.4-5.8-6.3-9.1-11.7-8.8-3.9.2-8.3,4-8.8,7.5h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='caries'%20data-active='1'%3e%3cpath%20id='caries-root'%20d='M13.7,29.8c-1.1,2.9,10.3,1.2,12.2.7,2.9-.5,1.6-1.9,1.5-3.9-.1-3-4.8,1.9-6.5,1.9-3.3,0-4.2-2.4-6.7-2.9s0,2.8-.5,4.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-subcrown'%20d='M9,43.8c-1.1,2.9,3.9-1.3,5.8-1.8,2.9-.5,6.5-3.2,6.3-5.2-.8-4-8.8-3.4-9.7-.7,0,0-2.4,7.7-2.4,7.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-buccal'%20d='M15.6,51.9c1.1,1.1,2.9,1.6,4.6,1.7,2.7.2,4.6-1.1,6-3.1.5-.7.9-1.3.9-2.1-.8-4.2-12.1-3.1-13.6-1.4-.9,1.3,1.3,3.8,2.1,4.8h.1-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='caries-mesial'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='mesial-shape'%20d='M27.1,38.2c-3.8-.4-3.9,11.5-2.3,13.3,1.5,3.2,5.8,3.2,6.7-.5.8-2.9-1.6-11.5-4.3-12.8h-.1Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='mesial-patch2'%20d='M27.6,44.7c3.2,0-.8-4.3-1.7-1.7-.3.9.7,1.7,1.4,1.7h.3Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='mesial-patch1'%20d='M26.8,51.5c1.3,1.4,4.6-.5,2.2-1.5-1.6-.6-2.5.5-2.2,1.4h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-distal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='distal-shape'%20d='M9.3,55.9c2.3,0,4-4.7,4.7-7,1.2-3.3,1.5-7.5-2-7.5-4.4.3-6.7,13.1-2.8,14.5h.1Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='distal-patch2'%20d='M12.1,47.3c1-.4,1-2.6-.2-2.6s-1.2,2.8,0,2.6h.2Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='distal-patch1'%20d='M9,52.4c.2.3.6.6.9.8.3,0,.8.3.7,0-.2-.5-.8-1.8-1.2-2.1-.7-.4-.6.9-.5,1.2h.1Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-occlusal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='occlusal-shape'%20d='M11.5,60.4c.5,3.4,6.3,3.9,9.6,3.7,2.9,0,6.9,0,8.4-2.7,2.1-5.1-5.5-8-10.3-7.7-3.4.2-7.3,3.5-7.7,6.6h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='occlusal-patch2'%20d='M21.8,60.4c-1.3,3.1,5.3,1.7,6,.2.8-.8.5-2.1-.6-2.4-1.9-.6-4.1.9-5.4,2.1h0Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='occlusal-patch1'%20d='M14.2,60.4c-.3,1.6,1.4,2.8,2.5,1.3.7-.9.9-3.2-.5-3.3-1,0-1.9.7-2,1.8v.2Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fillings'%20data-active='1'%3e%3cg%20id='amalgam'%20data-active='1'%3e%3cpath%20id='filling-amalgam-occlusal'%20d='M11.7,59.9c.5,3.4,6.3,3.9,9.6,3.7,2.9,0,6.9,0,8.4-2.7,2.1-5.1-5.5-8-10.3-7.7-3.4.2-7.3,3.5-7.7,6.6h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-buccal'%20d='M19.2,51.8c2,0,2.7-3,3.1-4.6.5-2.5-3.6-2-4.8-1-2,1.4-.8,5.3,1.6,5.6h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-mesial'%20d='M26.7,36.9c-3.8-.4-3.9,11.5-2.3,13.3,1.5,3.2,5.8,3.2,6.7-.5.8-2.9-1.6-11.5-4.3-12.8h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-distal'%20d='M10.6,53.9c2.3,0,4-4.7,4.7-7,1.2-3.3,1.5-7.5-2-7.5-4.4.3-6.7,13.1-2.8,14.5h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='composite'%20data-active='1'%3e%3cpath%20id='filling-composite-occlusal'%20d='M11.5,60c.5,3.4,6.3,3.9,9.6,3.7,2.9,0,6.9,0,8.4-2.7,2.1-5.1-5.5-8-10.3-7.7-3.4.2-7.3,3.5-7.7,6.6h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-buccal'%20d='M19,51.8c2,0,2.7-3,3.1-4.6.5-2.5-3.6-2-4.8-1-2,1.4-.8,5.3,1.6,5.6h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-mesial'%20d='M26.5,36.9c-3.8-.4-3.9,11.5-2.3,13.3,1.5,3.2,5.8,3.2,6.7-.5.8-2.9-1.6-11.5-4.3-12.8h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-distal'%20d='M10.4,54c2.3,0,4-4.7,4.7-7,1.2-3.3,1.5-7.5-2-7.5-4.4.3-6.7,13.1-2.8,14.5h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gic'%20data-active='1'%3e%3cpath%20id='filling-gic-occlusal'%20d='M11.7,59.9c.5,3.4,6.3,3.9,9.6,3.7,2.9,0,6.9,0,8.4-2.7,2.1-5.1-5.5-8-10.3-7.7-3.4.2-7.3,3.5-7.7,6.6h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-buccal'%20d='M19.2,51.8c2,0,2.7-3,3.1-4.6.5-2.5-3.6-2-4.8-1-2,1.4-.8,5.3,1.6,5.6h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-mesial'%20d='M26.7,36.9c-3.8-.4-3.9,11.5-2.3,13.3,1.5,3.2,5.8,3.2,6.7-.5.8-2.9-1.6-11.5-4.3-12.8h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-distal'%20d='M10.6,53.9c2.3,0,4-4.7,4.7-7,1.2-3.3,1.5-7.5-2-7.5-4.4.3-6.7,13.1-2.8,14.5h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary'%20data-active='1'%3e%3cpath%20id='filling-temporary-occlusal'%20d='M11.7,59.9c.5,3.4,6.3,3.9,9.6,3.7,2.9,0,6.9,0,8.4-2.7,2.1-5.1-5.5-8-10.3-7.7-3.4.2-7.3,3.5-7.7,6.6h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-buccal'%20d='M19.2,51.8c2,0,2.7-3,3.1-4.6.5-2.5-3.6-2-4.8-1-2,1.4-.8,5.3,1.6,5.6h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-mesial'%20d='M26.7,36.9c-3.8-.4-3.9,11.5-2.3,13.3,1.5,3.2,5.8,3.2,6.7-.5.8-2.9-1.6-11.5-4.3-12.8h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-distal'%20d='M10.6,53.9c2.3,0,4-4.7,4.7-7,1.2-3.3,1.5-7.5-2-7.5-4.4.3-6.7,13.1-2.8,14.5h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='defect'%20data-active='1'%3e%3cpolygon%20id='defect-occlusal'%20points='19.6%2064.1%2017.3%2063.7%2019.5%2063%2024%2062.8%2026.2%2063.3%2024%2064%2019.6%2064.1'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-buccal'%20points='19%2046%2018.1%2045.5%2018.9%2044.9%2020.6%2044.8%2021.6%2045.3%2020.7%2045.9%2019%2046'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-distal'%20points='9.4%2045.3%208.3%2046.4%208.3%2044.9%209.5%2042.3%2010.5%2041.2%2010.5%2042.7%209.4%2045.3'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-mesial'%20points='31.4%2045.3%2031.1%2046.9%2030.3%2045.6%2029.6%2042.8%2029.9%2041.3%2030.7%2042.5%2031.4%2045.3'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='contact-point'%20data-active='1'%3e%3cg%20id='mesial-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M29.8,46.8c1.1,2.4,2.5,5.1,4,7.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M30.2,55c.7-1.6.8-2.6,1.3-3.8.6-1.4,1.1-3,1.5-4.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='distal-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M6,47.9c.9,2.6,2.2,5.4,3.4,8.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M5.9,56.1c.9-1.5,1-2.5,1.6-3.6.8-1.3,1.4-2.8,1.9-4.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='restorations'%20data-active='1'%3e%3cpath%20id='crown-leakage'%20d='M12.1,40.1c5-4.4,12.9-3.5,16.9,2,2.2,3-21,1.5-16.9-2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%239e00e9;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='implant'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-locator-screw'%20d='M16.6,48.6c.9,1.5,3.8.9,5.4,1,3.2-.5,1.7-4.6,2-7,0-.7.2-1.6-.3-2.1-.2-.3-.7-.4-1-.4-1.5,0-3.4-.2-4.9.2-1.3.3-1.4,1.3-1.4,2.5,0,2-.2,3.9.1,5.7v.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-16);%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='implant-connector'%20d='M13.7,41.9h0c.1,1.4,1.1,2.1,1.9,1.7,1.4-.7,1.6-2,3.4-2.1h3.3c.8,0,1.8,1.9,2.9,2.2s1.4-.6,1.3-1.6c0-1.9,0-5.6-.5-5.7s-3.1,0-3.7,0h-4.5c-1,0-2.7-.4-3.5.7-.8,1.1-1,2.9-.8,4l.2.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-11-17);'%20/%3e%3cpath%20id='implant-bar'%20d='M6.9,54.7c5.8.3,21,0,27.4,0s2.8-2.2,3-4.1.2-3.2-1-3.4-4.8,0-6.3,0c-3.6,0-6.7,0-10.1.2-3.8,0-12.1.2-12.7,0-1.1,0-2.1.7-2.2,1.7-.2,1.9-.2,5.5,1.8,5.3h0v.3h.1Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-11-0);'%20/%3e%3cg%20id='implant-healing-abutment'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-healing-abutment-connector'%20d='M16.7,41.1c1.7.3,3.7-.2,5.4-.2,3.3,0,4.2-1.2,3.4-5.6-.8-3.9-1.7-9-2.7-13.4-.3-1.1-.6-2.2-1.1-3.1-2.3-4.5-4.3,1.7-4.7,5-.5,3.4-.6,5.9-1.3,9-.6,2.7-2.4,7.7.7,8.3h.3Z'%20data-active='1'%20style='fill:%20%23a0a0a0;%20stroke:%20%238c8c8c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M27.3,37.6h-9.2c-1.4,0-5,.2-5,.2,0,0-.4.9-.7,1.7s-.3,1.2-.3,1.8v2.7c0,.3.2.5.2.7h1.1c2.4-.3,4.9-.4,7.3-.4v-.2c.3,0-.7-.2-.9-.2.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.6.6-.5.4-.6l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.6,0,1.2,0,1.9.2h.5c.2,0,.4,0,.5.2-.2-.2,0-2.5,0-2.5h.2Z'%20data-active='1'%20style='fill:%20%23475563;'%20/%3e%3cpath%20d='M20.9,44.1v-.2h.2c.1,0,0,0,0-.2.5,0,2,.3,2.6.2.1.3.5.2.7.2.6,0,2.3.2,2.5-.9s.2-1.8,0-2.7-.3-.4-.1-.6h.4s.2,0,.2.4v3.6c0,.2-.1.4-.2.6-.9,0-1.8-.2-2.8-.3h-3.6,0Z'%20data-active='1'%20style='fill:%20%238c8c8c;'%20/%3e%3cpath%20d='M20.6,39.9c-.1-.2-.3-.2-.5-.2l-.9.2c-.1-.2-.4-.2-.6,0-.1-.2-.9,0-1,0l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.1.3,0,.2.3.6.2.3.3.2.4.5.1.7,0,1.5,0,2.1s-.3.8-.7.9c-.7,0-2,.2-2.7,0s-1.4-.2-1.4-.6v-.9c-.1-.4,0-1.5,0-2s.5-.7.3-.5h0Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M23.7,43.9h.7c.4-.2.7-.6.7-1v-1.9c0-.6-.9-1.1-1.5-1.1-.3-.4.9,0,.8-.2.6,0,1.2,0,1.9.2s.3,0,.5,0c-.2.2,0,.4.1.6.1.9.1,1.8,0,2.7s-1.9,1-2.5.9-.6,0-.7-.2h0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3cpath%20d='M17.6,39.8c.1,0,.9-.2,1,0,.2-.2.5-.2.6,0,0,0-.2.2-.2.3,0,1-.2,1.9,0,2.9s.6.6,1,.7c.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.8.6-.5.4-.6h0Z'%20data-active='1'%20style='fill:%20%236f7c86;'%20/%3e%3cpath%20d='M20.9,43.9c.3,0-1.1-.3-.9-.2-.4,0-.9,0-1-.7-.2-.9,0-1.9,0-2.9s.2-.2.2-.3l.9-.2c.2,0,.4,0,.5.2-.2.2-.3.4-.3.7v2.5c0,.9.5.6.7.7v.2h-.2s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3c/g%3e%3cg%20id='implant-base'%20data-active='1'%3e%3cpath%20d='M16.9,37.6c-.1-1.3-.2-2.7.2-4h5.6c.4,1,.2,2.9.2,4h-6Z'%20data-active='1'%20style='fill:%20%23bbc3c6;'%20/%3e%3cpath%20d='M18.1,11.2c-.2,0,0-2.2,0-2.4.2-1.3.9-2.4,1.9-3,1-.6.2,0,.2-.3,1.7,0,3.3,1.1,3.8,3.1s0,1.2.1,1.8h-1.3c0-.8,0-2.1-.8-2.3s-.7,0-.7.3c0,.8,0,1.5.2,2.1l-3.5.6h0Z'%20data-active='1'%20style='fill:%20%23bac3c7;'%20/%3e%3cpath%20d='M17.1,33.6c-.4,1.3-.3,2.7-.2,4l-3.8.2c0-.7-.3-4.2.7-4,1.1-.2,2.2-.2,3.3-.2Z'%20data-active='1'%20style='fill:%20%23a0a4a5;'%20/%3e%3cpath%20d='M17.7,33.1v-2.5c1.5-.3,3-.7,4.6-.7l.2,3.3h-4.8Z'%20data-active='1'%20style='fill:%20%23bac3c6;'%20/%3e%3cpath%20d='M20.3,5.4s-.1.2-.2.3c-1,.6-1.6,1.7-1.9,3-.3,1.3-.2,2.4,0,2.4l-2.4.6c.1-1.1,0-2.2.3-3.3s1.1-2.2,2.1-2.7,1.5-.4,2.2-.4h-.1Z'%20data-active='1'%20style='fill:%20%239ca3a6;'%20/%3e%3cpath%20d='M22.9,37.6c0-1.1.2-3-.2-4h2.7c.2,1,.3,3,0,4h-2.5Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M17.6,30.5v2.5c.1,0-3.4.2-3.4.2,0-.7,0-1.4.1-2,1.1-.4,2.2-.5,3.2-.8h.1,0Z'%20data-active='1'%20style='fill:%20%239ea3a4;'%20/%3e%3cpath%20d='M25.4,37.7c.2-1,.2-3,0-4h1.4c.8.2.7,3.3.5,4h-1.9Z'%20data-active='1'%20style='fill:%20%23bcc4c7;'%20/%3e%3cpath%20d='M22.5,33.1l-.2-3.3c.6-.2,1.3-.2,1.9-.2l.2,3.6h-1.9Z'%20data-active='1'%20style='fill:%20%23e3eaeb;'%20/%3e%3cpath%20d='M24.4,33.2l-.2-3.6c.5-.1,1.1-.1,1.7-.1l.3,3.8h-1.8Z'%20data-active='1'%20style='fill:%20%23b8c2c4;'%20/%3e%3cpath%20d='M17.7,28.7v-1.1c1.5-.3,3-.6,4.5-.7v1.1l-4.5.7Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M17.8,25.8c-.1-.4,0-.8,0-1.2,1.5-.3,2.9-.5,4.3-.7v1.2l-4.4.7s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23b9c0c4;'%20/%3e%3cpath%20d='M17.9,22.9c-.3-.4,0-.5-.2-1.1,1.4-.4,2.8-.6,4.3-.8v1.2c-1.3.2-2.7.4-4.1.7Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M17.8,19.9v-1.1c1.3-.3,2.7-.6,4.1-.7v1.1l-4.1.7Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M17.9,17v-1.1c1.3-.3,2.6-.5,3.9-.7v1.2l-4,.6h.1Z'%20data-active='1'%20style='fill:%20%23b9c1c5;'%20/%3e%3cpath%20d='M17.9,13c1.2-.3,2.4-.6,3.7-.7v1.2c-1.2.1-2.4.4-3.7.6v-1.1Z'%20data-active='1'%20style='fill:%20%23bac3c5;'%20/%3e%3cpath%20d='M17.7,30c0-.2,0-.5-.1-.7-.2.2-.5.3-.6,0,1.7-.4,3.5-.7,5.3-.9.1.2,0,.5,0,.8l-4.6.7h0Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M17.8,27.1c-.2-.2,0-.5,0-.8,1.5-.3,3-.6,4.5-.7v.8l-4.4.7s-.1,0,0,0h-.1Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M17.7,27.6v1.1l-3.2.8v-1.1c1-.4,2.1-.5,3.1-.7h.1Z'%20data-active='1'%20style='fill:%20%239a9fa1;'%20/%3e%3cpath%20d='M17.9,24.1c-.1-.3-.2-.4-.2-.7,1.5-.3,2.9-.6,4.3-.7v.8l-4.2.7h.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M17.8,24.6c0,.4-.1.8,0,1.2l-3.1.7v-1.2c1-.4,2-.5,3-.7,0,0,.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%23999fa1;'%20/%3e%3cpath%20d='M17.8,21.2v-.8c1.4-.3,2.8-.5,4.2-.7v.8s-4.2.7-4.2.7Z'%20data-active='1'%20style='fill:%20%23bac1c4;'%20/%3e%3cpath%20d='M17.8,18.3v-.7c1.3-.3,2.7-.5,4-.7v.8l-4.1.6s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M17.9,15.4v-.8c1.2-.4,2.5-.5,3.8-.7,0,.2.1.5,0,.8l-3.9.7h.1Z'%20data-active='1'%20style='fill:%20%23bbc2c4;'%20/%3e%3cpath%20d='M17.7,21.8c.1.6,0,.7.2,1.1l-2.9.7v-1.1c.9-.5,1.8-.4,2.7-.6h0Z'%20data-active='1'%20style='fill:%20%239ba0a2;'%20/%3e%3cpath%20d='M16.9,29.4c.1.2.4.2.6,0,.1.2.1.5.1.7-1.2.3-2.4.5-3.6.9s-.4-.2-.5-.4c0-.6,2.7-1,3.2-1.1h.2,0Z'%20data-active='1'%20style='fill:%20%23a8aeb1;'%20/%3e%3cpath%20d='M17.7,26.3v.8l-3.5.9c-.2,0-.4-.3-.4-.4,0-.6,3.3-1.1,3.8-1.2h.1Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M17.8,18.8v1.1l-2.7.7v-1.2c.9-.4,1.8-.5,2.6-.6,0,0,.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%239ba0a3;'%20/%3e%3cpath%20d='M21.6,10.6c-.1-.7-.2-1.4-.2-2.1s.5-.4.7-.3c.8.2.7,1.5.8,2.3l-1.3.2h0Z'%20data-active='1'%20style='fill:%20%23e4e9ea;'%20/%3e%3cpath%20d='M18,12.5v-.8c1.2-.3,2.4-.5,3.7-.6v.8l-3.7.6Z'%20data-active='1'%20style='fill:%20%23bcc2c4;'%20/%3e%3cpath%20d='M17.7,23.4c0,.3,0,.5.2.7-1.2.2-2.2.5-3.4.8s-.4-.2-.4-.3c-.1-.7,3.1-1.1,3.6-1.2Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M17.9,15.9v1.1l-2.5.7c0-.3,0-.9.1-1.1.8-.4,1.6-.4,2.4-.6h0Z'%20data-active='1'%20style='fill:%20%239da2a4;'%20/%3e%3cpath%20d='M17.8,20.5v.8l-3.2.8c-.2,0-.3-.3-.3-.4s0-.3.2-.4c1.1-.4,2.2-.6,3.2-.8h.1Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M17.9,13v1.1l-2.4.6v-1.1c.8-.3,1.6-.4,2.3-.6h.1Z'%20data-active='1'%20style='fill:%20%239ca1a3;'%20/%3e%3cpath%20d='M17.8,17.6v.7l-2.9.8c-.2,0-.4-.2-.4-.3-.2-.7,3-1.1,3.3-1.1h0Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M17.8,14.6v.8l-2.8.7c-.2,0-.3-.2-.4-.3s0-.4.3-.4c1-.3,1.9-.6,2.9-.7h0Z'%20data-active='1'%20style='fill:%20%23a2a7a9;'%20/%3e%3cpath%20d='M18,11.7v.8c-.9.2-1.7.4-2.6.7s-.4-.1-.4-.3,0-.3.2-.4c.9-.4,1.8-.5,2.8-.8Z'%20data-active='1'%20style='fill:%20%23a7abae;'%20/%3e%3cpath%20d='M22.3,28v-1.1c.5-.2,1.1-.2,1.7-.2.1.4,0,.8,0,1.2l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e2e9eb;'%20/%3e%3cpath%20d='M22.2,25.1v-1.2l1.8-.2v1.1c-.5.2-1.1.2-1.7.3h0Z'%20data-active='1'%20style='fill:%20%23e1e8e9;'%20/%3e%3cpath%20d='M22,21c.6,0,1.2-.2,1.8-.2v1.2l-1.7.2v-1.2h0Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M21.9,19.3v-1.1c.5,0,1.1-.2,1.6-.2.2.4,0,.8.2,1.1-.6,0-1.2,0-1.8.2Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M24.1,27.8v-1.2c.5,0,1.1-.1,1.7-.1,0,.4.1.8.1,1.2-.6.2-1.2,0-1.7.1h-.1Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M21.8,16.4c-.1-.4,0-.8,0-1.2l1.6-.2v1.1c-.4.1-1,.2-1.5.2h-.1Z'%20data-active='1'%20style='fill:%20%23e4eaeb;'%20/%3e%3cpath%20d='M24.2,29.1v-.8c.5,0,2.5-.5,2.4.3s-1.8.5-2.4.5Z'%20data-active='1'%20style='fill:%20%23b4bdc0;'%20/%3e%3cpath%20d='M24.1,26.2v-.8c.4,0,2.4-.5,2.3.2s-.2.4-.4.4h-1.9s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23b8c0c4;'%20/%3e%3cpath%20d='M21.6,12.3c.5,0,1-.2,1.5-.2.1.4,0,.8.2,1.1-.5.1-1,.2-1.6.2v-1.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e8e9;'%20/%3e%3cpath%20d='M24,24.8v-1.1c.4,0,.9-.1,1.4-.1,0,.4.1.8,0,1.1-.5.2-1.1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M23.8,23.3v-.8c.4,0,2.2-.5,2.2.2s-1.7.5-2.2.6Z'%20data-active='1'%20style='fill:%20%23b5bdc1;'%20/%3e%3cpath%20d='M23.8,22v-1.2c.5,0,.9-.2,1.4-.1v1.1c-.5.1-1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c1c5;'%20/%3e%3cpath%20d='M23.7,20.3c-.1-.2,0-.5,0-.8.5,0,2.1-.4,2.2.2.1.6-1.5.6-2.1.6h-.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M23.5,17.4c-.1-.2,0-.5-.1-.8.5,0,2.1-.5,2.1.2s-1.5.5-2,.6Z'%20data-active='1'%20style='fill:%20%23b6bec2;'%20/%3e%3cpath%20d='M23.6,19.1c-.1-.4,0-.8-.2-1.1.5,0,.9-.2,1.4-.1,0,.4.1.8,0,1.1h-1.3.1Z'%20data-active='1'%20style='fill:%20%23b9c2c6;'%20/%3e%3cpath%20d='M22.3,29.3v-.8c.7,0,1.3-.2,2-.2v.8l-1.9.2h-.1Z'%20data-active='1'%20style='fill:%20%23e5e9eb;'%20/%3e%3cpath%20d='M23.3,14.5v-.8c.3,0,2.2-.5,2,.3s-1.4.4-1.9.5h-.1Z'%20data-active='1'%20style='fill:%20%23bbc2c5;'%20/%3e%3cpath%20d='M23.4,16.1v-1.1c.3,0,.7-.1,1.2,0,0,.3.1.7,0,1.1-.4.3-.9,0-1.3.1h0Z'%20data-active='1'%20style='fill:%20%23b6bfc2;'%20/%3e%3cpath%20d='M22.2,26.3v-.8c.6,0,1.2-.2,1.8-.2v.8l-1.9.2h.1Z'%20data-active='1'%20style='fill:%20%23e6ebec;'%20/%3e%3cpath%20d='M23.3,13.3c-.2-.3,0-.8-.2-1.1.4,0,.8-.2,1.3,0,0,.3.1.7,0,1.1-.4.2-.8,0-1.2.1h.1Z'%20data-active='1'%20style='fill:%20%23bdc3c6;'%20/%3e%3cpath%20d='M22.1,23.4v-.8c.6,0,1.2-.3,1.8-.2v.8l-1.8.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M23.1,11.7v-.8c.4,0,2.1-.5,1.9.3s-1.4.4-1.9.4h0Z'%20data-active='1'%20style='fill:%20%23bfc4c7;'%20/%3e%3cpath%20d='M22,20.5v-.8l1.7-.2v.8l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e5eaeb;'%20/%3e%3cpath%20d='M21.8,17.6v-.8l1.7-.2c0,.3,0,.5.1.8l-1.7.2h-.1Z'%20data-active='1'%20style='fill:%20%23e6ebeb;'%20/%3e%3cpath%20d='M21.7,14.7v-.8c.5,0,1-.2,1.6-.2v.8l-1.6.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M21.6,11.1c.5,0,1-.2,1.5-.2v.8l-1.5.2v-.8Z'%20data-active='1'%20style='fill:%20%23e1e5e6;'%20/%3e%3c/g%3e%3cpath%20id='peri-implant-bone-loss'%20d='M11,28c2,7,6,10,9,10s7-3,9-10c-2,4-5,6-9,6s-7-2-9-6Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23d9534f;'%20/%3e%3c/g%3e%3cg%20id='prosthesis-implant'%20data-active='1'%3e%3cg%20id='prosthesis-implant-gum'%20data-active='1'%20style='display:%20none;%20opacity:%20.5;'%3e%3cpath%20d='M36.6,58v-11.7c0-.8-.9-1.5-2-1.5H4.9c-9.3,0-2,.6-2,1.4,0,2.7-.3,8.7-.4,11.7s.9,1.5,2.1,1.5h30.1c6.1,0,2-.7,2-1.5h0Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-11-1);'%20/%3e%3cpath%20d='M36.5,58c0-3.9-.4-7.9-.5-11.7-.2-1.2-2.8-.7-4.6-.9h-5.9c-4.1,0-13.7-.5-17.7-.4h-2.9c-.7,0-1.4,1-.9,1.5,0,3.8,0,7.8-.4,11.6,0,0,0,.2.4.4.3,0,.5.2,1.1.2h2.9l5.9.3c3.9,0,13.9.4,17.7.5h2.9c.9,0,2.1-.4,2.1-1.4h0ZM36.7,58c0,1.1-1.3,1.6-2.3,1.6h-2.9c-3.7,0-13.8.4-17.7.5-1.9,0-7,.2-8.8.2-1.3.2-3.8-.5-3.6-2.9v-.7c0-3.4,0-6.9.3-10.3.1-2,1.8-1.8,3.2-1.6,9.1,0,20.3-.6,29.5-.6s2.7.5,2.9,2c0,4-.3,7.9-.5,11.8h-.1Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3c/g%3e%3cpath%20id='prosthesis-implant-crown'%20d='M27,66.1c-.8,1.9-6,1.3-7.8,1.3s-3.7.2-4.7-.8c-2.5-2.1-.8-10.1,1.4-12,2.7-2.4,7.7-2,9.8.9,1.2,1.6,1.3,4.2,1.4,6.3,0,1.4.2,2.7,0,3.9v.3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='prosthesis'%20data-active='1'%3e%3cpath%20id='prosthesis-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-11-18);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='prosthesis-crown'%20d='M31.9,63.4c-1.3,3.5-10.6,2.4-13.8,2.5-3,0-6.5.4-8.4-1.4-4.4-3.9-1.4-18.9,2.5-22.4,4.8-4.4,13.6-3.7,17.4,1.7,2.1,3,2.4,7.8,2.5,11.7,0,2.6.4,5.1,0,7.3l-.2.5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='telescope'%20data-active='1'%3e%3cpath%20id='telescope-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cg%20id='telescope-crown'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='telescope-crown-outside'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='telescope-crown-inside'%20d='M30.1,61.5c-1.2,2.8-9.1,2-11.9,2.1-2.6,0-5.6.3-7.2-1.1-3.7-3.2-1.2-15.5,2.2-18.4,4.1-3.6,11.7-3,15,1.4,1.8,2.5,2,6.4,2.2,9.6,0,2.1.4,4.2,0,6v.4h-.3Z'%20data-active='1'%20style='fill:%20%23aaa;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='zircon'%20data-active='1'%3e%3cpath%20id='zircon-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='zircon-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-inlay'%20d='M27.8,64.3c-.9,2.2-6.9,1.3-9,1.4-1.9,0-4.2,0-5.4-1-2.8-2.5-.6-11.7,1.9-13.8,3.2-2.6,8.9-2.1,11.3,1.4,1.3,1.9,1.4,4.9,1.5,7.3,0,1.6.1,3.1-.1,4.5v.3h-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-veneer'%20d='M30.6,62.3c-1.3,3.1-9.7,1.9-12.6,1.9s-5.9.2-7.7-1.4c-3.9-3.5-.9-16.5,2.8-19.4,4.5-3.7,12.6-2.9,16,2,1.8,2.6,2,6.8,2.1,10.3,0,2.3.2,4.4-.1,6.4l-.2.4h0l-.3-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal'%20data-active='1'%3e%3cpath%20id='metal-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal-ceramic'%20data-active='1'%3e%3cpath%20id='metal-ceramic-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-11-2);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-ceramic-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-11-3);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gold'%20data-active='1'%3e%3cpath%20id='gold-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gold-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-inlay'%20d='M27.8,64.3c-.9,2.2-6.9,1.3-9,1.4-1.9,0-4.2,0-5.4-1-2.8-2.5-.6-11.7,1.9-13.8,3.2-2.6,8.9-2.1,11.3,1.4,1.3,1.9,1.4,4.9,1.5,7.3,0,1.6.1,3.1-.1,4.5v.3h-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-veneer'%20d='M30.6,62.3c-1.3,3.1-9.7,1.9-12.6,1.9s-5.9.2-7.7-1.4c-3.9-3.5-.9-16.5,2.8-19.4,4.5-3.7,12.6-2.9,16,2,1.8,2.6,2,6.8,2.1,10.3,0,2.3.2,4.4-.1,6.4l-.2.4h0l-.3-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='emax'%20data-active='1'%3e%3cpath%20id='emax-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-11-4);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='emax-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-11-5);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-inlay'%20d='M28,64.1c-.8,2.2-6.9,1.5-8.9,1.6-1.9,0-4.2.2-5.5-.8-2.8-2.4-.9-11.7,1.6-13.8,3.1-2.7,8.9-2.3,11.3,1.1,1.3,1.8,1.6,4.8,1.6,7.2s.2,3.1,0,4.5v.3h-.2.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-11-6);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-veneer'%20d='M30.8,62c-1.2,3.1-9.7,2.1-12.6,2.2-2.7,0-5.9.3-7.7-1.2-4-3.4-1.3-16.5,2.3-19.5,4.4-3.8,12.5-3.2,16,1.6,1.9,2.6,2.2,6.8,2.3,10.2,0,2.3.3,4.4,0,6.4l-.2.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-11-7);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gradia'%20data-active='1'%3e%3cpath%20id='gradia-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gradia-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-inlay'%20d='M28,64.1c-.8,2.2-6.9,1.5-8.9,1.6-1.9,0-4.2.2-5.5-.8-2.8-2.4-.9-11.7,1.6-13.8,3.1-2.7,8.9-2.3,11.3,1.1,1.3,1.8,1.6,4.8,1.6,7.2s.2,3.1,0,4.5v.3h-.2.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-veneer'%20d='M30.8,62c-1.2,3.1-9.7,2.1-12.6,2.2-2.7,0-5.9.3-7.7-1.2-4-3.4-1.3-16.5,2.3-19.5,4.4-3.8,12.5-3.2,16,1.6,1.9,2.6,2.2,6.8,2.3,10.2,0,2.3.3,4.4,0,6.4l-.2.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary-restorations'%20data-active='1'%3e%3cpath%20id='temporary-bridge-connector'%20d='M14.4,57.2c6-.2,12.5.5,18.3-.5,3-.6,5.6-3.3,4.2-6-2.4-3.8-8-3-13-3.2h-10.6c-3.2,0-6.7,0-9.4,1.5-2.5,1.5-3.1,4.9-.9,6.6,3.1,2.1,7.1,1.5,11.2,1.6,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='temporary-crown'%20d='M32.3,63.4c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-inlay'%20d='M28,64.1c-.8,2.2-6.9,1.5-8.9,1.6-1.9,0-4.2.2-5.5-.8-2.8-2.4-.9-11.7,1.6-13.8,3.1-2.7,8.9-2.3,11.3,1.1,1.3,1.8,1.6,4.8,1.6,7.2s.2,3.1,0,4.5v.3h-.2.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-veneer'%20d='M30.8,62c-1.2,3.1-9.7,2.1-12.6,2.2-2.7,0-5.9.3-7.7-1.2-4-3.4-1.3-16.5,2.3-19.5,4.4-3.8,12.5-3.2,16,1.6,1.9,2.6,2.2,6.8,2.3,10.2,0,2.3.3,4.4,0,6.4l-.2.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='ortho'%20data-active='1'%3e%3cg%20id='missing-closed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M5.5,7c18.4,16.6,16.4,37.8,0,54.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M33.7,60.5c-18.5-16.4-16.7-37.6-.5-54.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cg%20id='ortho-ring'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='19.5'%20cy='51.4'%20rx='2.8'%20ry='12.1'%20transform='translate(-32.1%2070.4)%20rotate(-89.4)'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='9.9'%20y1='54.2'%20x2='29.4'%20y2='54.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='9.9'%20y1='48.6'%20x2='29.4'%20y2='48.6'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='8.7'%20y1='52.1'%20x2='30.5'%20y2='52.1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='8.7'%20y1='50.3'%20x2='30.5'%20y2='50.3'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M30.3,48.6c.7,0,1.4.2,1.4.7v4.2c0,.3-.5.6-.9.7h-.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M8.8,54.2h-.5c-.4,0-.9-.3-.9-.7v-4.2c0-.4.6-.7,1.2-.7h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='ortho-bracket'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='17.8'%20cy='51.1'%20rx='1.3'%20ry='4.4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cellipse%20cx='22.5'%20cy='51'%20rx='1.3'%20ry='4.4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='19'%20y1='54.2'%20x2='21.3'%20y2='54.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='19'%20y1='48.6'%20x2='21.3'%20y2='48.6'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M21.4,50.2v-2.3c0-.5.5-.9,1-.9s1.1.4,1.2,1v6.5c0,.6-.5,1.1-1,1.1s-1.1-.4-1.1-1v-2.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M18.9,50.2v-2.3c0-.5-.5-.9-1-.9s-1.1.4-1.2,1v6.5c0,.6.5,1.1,1,1.1s1.1-.4,1.1-1v-2.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='16.9'%20y1='52.1'%20x2='23.4'%20y2='52.1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='16.9'%20y1='50.3'%20x2='23.4'%20y2='50.3'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M23.7,48.6c.5,0,1,.2,1,.7v4.2c0,.3-.3.6-.6.7h-.4'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M16.6,54.2h-.4c-.3,0-.6-.3-.6-.7v-4.2c0-.4.4-.7.8-.7h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrows'%20data-active='1'%3e%3cg%20id='arrow-distal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='5.3'%20y1='61.4'%20x2='1.5'%20y2='64.8'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='8.1'%20y1='64.9'%20x2='1.4'%20y2='64.9'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='5.3'%20y1='68.3'%20x2='1.5'%20y2='64.9'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-mesial'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='34.2'%20y1='68.8'%20x2='38.5'%20y2='65.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='31.1'%20y1='65'%20x2='38.7'%20y2='65'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.2'%20y1='61.4'%20x2='38.5'%20y2='65'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-down'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='38.9'%20y1='40.2'%20x2='35.1'%20y2='34.2'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.8'%20y1='44.5'%20x2='35.1'%20y2='33.9'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='31'%20y1='40.1'%20x2='34.9'%20y2='34.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-up'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='31'%20y1='38.2'%20x2='34.8'%20y2='44.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.8'%20y1='33.9'%20x2='34.8'%20y2='44.5'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='38.7'%20y1='38.3'%20x2='34.9'%20y2='44.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-rotation'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20d='M19.8,70.5c-.2,0-.8-.3-1.1-1s-.2-.9-.1-1.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M17.9,65.9c1-1.4,6.1-1.3,5.4,1.7-.1,3.5-8,.9-3.4,0'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='specials'%20data-active='1'%3e%3cg%20id='fracture-vertical'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-vertical-3'%20x1='28.9'%20y1='7.1'%20x2='9.6'%20y2='59.9'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-vertical-2'%20x1='25.7'%20y1='15.6'%20x2='8.7'%20y2='62.5'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-vertical-1'%20points='26.9%2016.9%2022.5%2017.5%2024.5%2023.5%2020.9%2023.5%2022.4%2026.5%2019.4%2026.6%2022%2030.9%2016.9%2030.4%2019.8%2036.2%2014.5%2036.5%2016.8%2043.6%2013.5%2043.1%2014.5%2049.2%2012%2048.9%2012.7%2053.2%2010.3%2053.5%2012.3%2057.5%208.4%2057.1%2010.1%2061.4'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='fracture-horizontal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-horizontal-3'%20x1='11.5'%20y1='11.7'%20x2='29.6'%20y2='31'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-horizontal-2'%20x1='14.8'%20y1='15.3'%20x2='27.7'%20y2='29'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-horizontal-1'%20points='13.2%2016.9%2015.4%2016.2%2015.6%2018.7%2018.6%2017.4%2018.9%2021.8%2021.1%2020.1%2021.2%2024%2024%2022.4%2023.8%2026.4%2027%2025.1%2026.2%2028.1%2029.1%2027.6'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='parapulpal-pin'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='parapulpal-pin-shape'%20data-active='1'%3e%3cpath%20d='M25.9,43.5c.1.5,0,.6,0,.8v.8c.1.4,0,.6,0,.8.1.3,0,.6,0,.8v2.4c.1.4.4.8,1,1.1s.2.2.1.3,0,.2,0,.3,0,.2-.3.3c-1.2.2-2.5.2-3.7,0s-.3,0-.3-.2v-.6c0-.2.9-.3,1-1s0-.7,0-1.1l.2-5,.2-4.4c0-1.2.2-2.3.4-3.5s0-.2.2-.3c.1.2.1.3.2.5.3,1.2.4,2.4.5,3.6l.3,3.5v.2c.1.2,0,.5,0,.8h.2,0Z'%20data-active='1'%20style='fill:%20%230a0a0a;'%20/%3e%3cpath%20d='M24.4,47.1c-.1,0-.2-.2-.2-.3v-3.7l.2-3.9.2-2.2h.1v9.3c0,.3,0,.6-.3.8Z'%20data-active='1'%20style='fill:%20%23f0edee;'%20/%3e%3cpath%20d='M25.3,46.5h0v-1.7h0v-1h0v-6.5c0,.2.1.5.1.7v.5l.3,3.4v3.2l.2,1.8v.3h-.1c-.2-.2-.3-.4-.5-.6h0Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cpath%20d='M25.3,46.5v-.2c-.1,0-.3-10.5-.3-10.5v-.3l.2.7s.1.2,0,.2h0c-.1,0,0,.7,0,.8v6.2h0v2.8h0v.3s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%239c9c9c;'%20/%3e%3cpath%20d='M24.4,48.2c.2.3.5.6.7.9s0,.3,0,.5c-.2.4-.8.4-1.4.5.9-.7.2-1.1.9-1.9h-.2Z'%20data-active='1'%20style='fill:%20%23c7c7c7;'%20/%3e%3cpath%20d='M25.8,48.2c.5.4.3.7.4,1v.2c0,.2.3.5.6.7h-.9c-.7-.2-.8-.8-.7-1s.4-.6.6-.8h0Z'%20data-active='1'%20style='fill:%20%23b5b4b6;'%20/%3e%3cpath%20d='M25.2,50.2c.4,0,1.7,0,2,.2v.5h-1.5c-.5,0-.4,0-.4-.2v-.4h-.1Z'%20data-active='1'%20style='fill:%20%23bababa;'%20/%3e%3cpath%20d='M23.7,50.8v-.5h1.3c0,.2,0,.4-.2.5s-.8,0-1.2,0h.1Z'%20data-active='1'%20style='fill:%20%23cdcdcd;'%20/%3e%3cpath%20d='M23.8,51.1h2.8-2.7c-.9,0,0,0-.1,0s0,0,0,0Z'%20data-active='1'%20style='fill:%20%239da1a2;'%20/%3e%3cpath%20d='M23.7,50.3v.5h-.6v-.5c.2,0,.5,0,.7-.2h-.1v.2Z'%20data-active='1'%20style='fill:%20%238b8d8c;'%20/%3e%3cpath%20d='M24.7,47.5c.1,0,.2,0,.3.2l-.3.2s-.2,0-.2-.2c0,0,.1,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23acaaac;'%20/%3e%3cpath%20d='M25.5,47.5h.2l-.2.2c-.1,0-.2,0-.3-.2h.3Z'%20data-active='1'%20style='fill:%20%23b2b0b3;'%20/%3e%3cpath%20d='M24.4,47.7h.2s-.1,0-.2.2h-.2c-.1,0,0,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23e4e1e2;'%20/%3e%3cpath%20d='M25.5,47.9c-.2.2-.1.2-.3.3v-.4l.3.2h0Z'%20data-active='1'%20style='fill:%20%238b8989;'%20/%3e%3cpath%20d='M24.4,47.3h.2v.2h-.3s0-.2.2-.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e3e3;'%20/%3e%3cpath%20d='M25.6,47.9h.4c.1,0,0,0-.1.2,0,0-.2,0-.2-.2,0,0-.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23cacaca;'%20/%3e%3cpath%20d='M24.8,47.9c.1,0,.2,0,.3-.2v.4c-.1,0-.2,0-.3-.2Z'%20data-active='1'%20style='fill:%20%237a797b;'%20/%3e%3cpath%20d='M25.6,47.4h.3s0,.2-.1,0-.1,0-.2,0Z'%20data-active='1'%20style='fill:%20%23d2d1d3;'%20/%3e%3cpath%20d='M24.8,47.4c.1,0,.2,0,.3-.2v.3h-.3Z'%20data-active='1'%20style='fill:%20%237f7e80;'%20/%3e%3cpath%20d='M25.2,47.5s0-.6,0-.2c0,0,.2,0,.1,0h-.2.1v.2Z'%20data-active='1'%20style='fill:%20%237c7b7f;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='calculus'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='calculus-shape-8'%20d='M23.4,39.6c.4,0,.8-.2.9-.4.3-.2.4-.6-.1-.7-.7-.2-1.4.8-.8,1.1h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-7'%20d='M16.2,39.4c-.1.4.2.8.4.9.2.3.6.4.7,0,.2-.7-.8-1.4-1.1-.8h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-6'%20d='M14.2,40.7c.5.2,1.1-.3,1.4-.6.4-.3.7-.9-.1-1.1-1-.3-2.1,1.2-1.3,1.7h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-5'%20d='M16,41c-.5.2-.6,1-.7,1.3,0,.5,0,1.1.8.8.9-.4.8-2.3-.2-2.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-4'%20d='M13.9,43.3c.5-.2.7-.9.7-1.3.1-.5,0-1.1-.8-.8-1,.4-.9,2.2,0,2.1h.1Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-3'%20d='M25,38.7c-.1.5.4,1.1.6,1.3.4.4.9.6,1.1-.2.2-1-1.3-2-1.8-1.2h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-2'%20d='M23.6,42.1c.5,0,.9-.7,1.1-1,.3-.5.4-1-.5-1s-1.6,1.8-.7,2h.1Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-1'%20d='M26.2,43.2c.5,0,.7-.9.8-1.2.2-.5,0-1.1-.7-.9-1,.3-1,2.2-.1,2.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='plan'%20data-active='1'%3e%3cg%20id='extraction-plan'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M5.8,61.9c1.4-4,28.3-51.6,29.1-53.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3cpath%20d='M6.2,8.7c2.7,3.5,19.9,39.4,23.4,48.1.6,1.5,1.2,3,2,4.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3cg%20id='crown-needed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-needed-shape'%20d='M32,63.2c-1.3,3.6-10.7,2.5-13.9,2.6-3,0-6.5.4-8.4-1.4-4.4-4-1.4-19.5,2.5-23.1,4.8-4.5,13.7-3.8,17.6,1.9,2.1,3.1,2.4,8,2.5,12.1,0,2.7.4,5.3,0,7.5l-.2.5h-.1,0Z'%20data-active='1'%20style='fill:%20%23c83014;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='crown-needed-path'%20d='M17.1,38.6c-2.2,3-4.6,6-6.7,8.9-.9,1.3-1.6,2.5-1.9,3.8,0,.2,0,.4.2.5,1.2,0,2.1-1.4,3-2.3,2.4-2.7,4.5-6.4,7.4-8.5,1.9-1.4,4.6-2.5,4.2-.7-2,6.8-10.7,12-13.2,18.5-.6,1.4-1.2,3.5,0,4,2.4-.3,3.6-3.5,5-5.6,3-4.3,8.2-11.3,11.9-14.5,3.2-2.2,2.6,3.2.2,6.7-2.3,4-12.7,10.7-10.6,15.9,3.5.8,9.8-11,12.7-13.2,3.8-3.5,2.2,2.9,0,6.1-1.2,2.1-3.4,4.1-4.4,6.3-.8,1.5.2,1.7,1.3,1,2.3-1.2,4.5-3.6,6.3-5.6'%20data-active='1'%20style='fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='crown-replace'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-replace-shape'%20d='M32.8,62.5c-1.4,3.5-11.1,2.4-14.5,2.5-3.1,0-6.8.4-8.8-1.4-4.6-3.9-1.5-18.9,2.6-22.4,5-4.4,14.3-3.7,18.3,1.8,2.2,3,2.5,7.8,2.6,11.7,0,2.6.4,5.1,0,7.3,0,0-.2.5-.2.5Z'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23c83014;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", t0 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20Part%20of%20React%20Odontogram%20Modul%20-%20https://github.com/ZoliQua/React-Odontogram-Modul%20-%20SVG%20Version:%202.5.0%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20id='canine_x5F_tooth'%20version='1.1'%20viewBox='0%200%2040.3%2071'%3e%3cstyle%3e%20[data-active='0']%20{%20display:%20none;%20}%20%3c/style%3e%3cdefs%3e%3clinearGradient%20id='linear-gradient-13-0'%20x1='-1449.3'%20y1='-7062.7'%20x2='-1446'%20y2='-7062.7'%20gradientTransform='translate(-409.3105%20-7174.3636)%20rotate(-15)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-1'%20x1='-19771.3'%20y1='2798.8'%20x2='-19768'%20y2='2798.8'%20gradientTransform='translate(-18421.1455%20-7639.5501)%20rotate(-165.5)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-2'%20x1='-646'%20y1='-6089.8'%20x2='-642.7'%20y2='-6089.8'%20gradientTransform='translate(-114.0315%20-6104.8782)%20rotate(-7.3)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-3'%20x1='-19322.2'%20y1='4169.1'%20x2='-19318.9'%20y2='4169.1'%20gradientTransform='translate(-18727.7073%20-6249.2921)%20rotate(-173.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-4'%20x1='-1835.7'%20y1='-7518'%20x2='-1832.4'%20y2='-7518'%20gradientTransform='translate(-382.9208%20-7716.8774)%20rotate(-16.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-5'%20x1='-19163.5'%20y1='-602.2'%20x2='-19160.2'%20y2='-602.2'%20gradientTransform='translate(-18250.6134%20-10523.7069)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-6'%20x1='-19161.5'%20y1='-605.4'%20x2='-19158.1'%20y2='-605.4'%20gradientTransform='translate(-18250.6134%20-10523.7069)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-7'%20x1='-7085.1'%20y1='-10365'%20x2='-7081.6'%20y2='-10365'%20gradientTransform='translate(-2445.9563%20-12726.4727)%20rotate(-47.9)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-8'%20x1='19.6'%20y1='3027.3'%20x2='19.6'%20y2='3074.1'%20gradientTransform='translate(0%20-3024.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23ff422a'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%239f0016'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-9'%20x1='-2412.6'%20y1='-7929.3'%20x2='-2409.3'%20y2='-7929.3'%20gradientTransform='translate(-1130.5926%20-8184.7654)%20rotate(-24.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-10'%20x1='-19981.7'%20y1='1071.8'%20x2='-19978.3'%20y2='1071.8'%20gradientTransform='translate(-17156.1351%20-10246.7487)%20rotate(-152.2)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-11'%20x1='-646'%20y1='-6089.8'%20x2='-642.7'%20y2='-6089.8'%20gradientTransform='translate(-114.0315%20-6104.8782)%20rotate(-7.3)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-12'%20x1='-19322.2'%20y1='4169.1'%20x2='-19318.9'%20y2='4169.1'%20gradientTransform='translate(-18727.7073%20-6249.2921)%20rotate(-173.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-13'%20x1='-1836'%20y1='-7518.9'%20x2='-1832.7'%20y2='-7518.9'%20gradientTransform='translate(-382.9208%20-7716.8774)%20rotate(-16.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-14'%20x1='-19163.6'%20y1='-601.5'%20x2='-19160.3'%20y2='-601.5'%20gradientTransform='translate(-18250.6134%20-10523.7069)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-15'%20x1='-19161.5'%20y1='-605.4'%20x2='-19158.1'%20y2='-605.4'%20gradientTransform='translate(-18250.6134%20-10523.7069)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-16'%20x1='-7086.4'%20y1='-10367.2'%20x2='-7082.9'%20y2='-10367.2'%20gradientTransform='translate(-2445.9563%20-12726.4727)%20rotate(-47.9)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-17'%20x1='19.4'%20y1='3062.5'%20x2='19.4'%20y2='3072.2'%20gradientTransform='translate(0%20-3024.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23cf0'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b4c500'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-13-18'%20x1='19.2'%20y1='3058.7'%20x2='19.2'%20y2='3066.2'%20gradientTransform='translate(0%20-3024.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23c8c9c9'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23828282'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-13-0'%20cx='20.9'%20cy='-3014.2'%20fx='20.9'%20fy='-3014.2'%20r='11.5'%20gradientTransform='translate(-.3%20-2965.2292)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23ececec'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23cfcfcf'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23bababa'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23aeaeae'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23aaa'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-13-1'%20cx='-524.6'%20cy='-3014.9'%20fx='-524.6'%20fy='-3014.9'%20r='10.2'%20gradientTransform='translate(754.2872%20-2965.2292)%20scale(1.4%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fefefe'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f8d6d4'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f2b5b2'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23ee9b98'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23eb8985'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23e97e79'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e97b76'%20data-active='1'%20/%3e%3c/radialGradient%3e%3clinearGradient%20id='linear-gradient-13-19'%20x1='19.1'%20y1='3080'%20x2='19.1'%20y2='3070.3'%20gradientTransform='translate(0%20-3024.6587)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23cd986a'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-13-2'%20cx='19.1'%20cy='20.3'%20fx='19.1'%20fy='20.3'%20r='13.2'%20gradientTransform='translate(0%2070.8)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-13-3'%20cx='19.6'%20cy='22.5'%20fx='19.6'%20fy='22.5'%20r='14.6'%20gradientTransform='translate(0%2070.8)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-13-4'%20cx='19.1'%20cy='20.3'%20fx='19.1'%20fy='20.3'%20r='13.2'%20gradientTransform='translate(0%2070.8)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-13-5'%20cx='19.6'%20cy='22.5'%20fx='19.6'%20fy='22.5'%20r='14.6'%20gradientTransform='translate(0%2070.8)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-13-6'%20cx='19.6'%20cy='-992.1'%20fx='19.6'%20fy='-992.1'%20r='9'%20gradientTransform='translate(0%20-937.2)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-13-7'%20cx='19.8'%20cy='-985.9'%20fx='19.8'%20fy='-985.9'%20r='12.4'%20gradientTransform='translate(0%2070.8)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3c/defs%3e%3cg%20id='base'%20data-active='1'%3e%3cpath%20id='bone-base'%20d='M39.2,17.2l-2.7,1.3c-2.5,1.5,0,9.1-2,11.5,0,4.7-4.5,3.7-5.8,3.6-3.8-.2-12.9,0-17.4,0s-4.9-3.1-5.1-3c-2.1,0-2.2-12.1-2.2-12.1l-1.4-2.1c-.2-.4-2.3-1-2.3-1.5V0h39v17.2h-.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cpath%20id='gum-base'%20d='M39.7,18.3c-1.1,1.1-2.7,1.8-3.3,3.2-1.1,3.7-.2,8.1-1.6,11.7-2.1,5.4-6.2.4-10.1.5-4,0-8.4-.2-12.1.5-2.3.6-4.7,2.8-7.1,1.3C-.4,31.6,3.6,22.1,1.4,16.8c-.2-1-2.1-2.4-1.1-3,1.1-.5,4.2,1.1,4.6,2.3,2.1,3.9-2,14.8,3.5,16.2,2.6.3,8.5-.6,13.4-1,3.7-.6,9.6,1,11.5-2.4,2.1-3.4-.1-8.6,2.5-11.8s5.6-1.3,3.8,1h0v.2h0Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3c/g%3e%3cg%20id='mods'%20data-active='1'%3e%3cpath%20id='parodontal'%20d='M10,29.7c-.5,1.7-1.9,4.6-1.1,5.8.5.7,1.3.9,2.1,1.1,1.8.4,3.8.7,5.5,1,4.2,1,9.6.8,12.3-3.1.9-2.1-.4-4.4-.7-6.6-1.5-6.7.9-18.5-9.3-17.4-8.2,1.1-6.4,13.3-8.7,18.9v.2h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ffa46a;'%20/%3e%3cg%20id='inflammation'%20data-active='1'%3e%3cg%20id='cysta'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='cysta-outside'%20d='M9.5,4.9c-2.7,2.4-1.6,8.8,1.6,10.6,3.2,1.8,4.9,1.8,7.1,2,4.2.4,11.6-.5,13.1-6.4,1.6-7.2-6.6-9-12.3-8.7-3,0-7.2.5-9.5,2.6h0Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='cysta-inside'%20d='M11,5.4c-2.3,2.2-1.3,7.9,1.3,9.4s4.3,1.5,6,1.8c3.6.3,9.9-.4,11.2-5.6,1.4-6.7-5.5-8.2-10.3-8-2.5,0-6.1.4-8.1,2.3h-.1Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='granuloma'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='granuloma-outside'%20d='M11.9,4.3c-2.1,2-1.3,7.4,1.3,8.9s3.8,1.5,5.5,1.7c3.3.3,9-.4,10.2-5.3,1.2-6.2-5.1-7.7-9.6-7.5-2.3,0-5.6.4-7.4,2.2Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='granuloma-inside'%20d='M13.1,5c-1.8,1.7-1,6,1,7.2s3.3,1.2,4.6,1.3c2.8.3,7.5-.3,8.5-4.3,1.1-5.1-4.2-6.3-7.8-6.1-1.9,0-4.7.3-6.2,1.8h-.1Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='abscess'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='abscess-inside'%20d='M11.4,5.8c-.9.7-2.5-1.6-5.8,1.2s4.4,2,4.8,4.5c.4,2.5-2.3,2.8-1.7,3.2s6.6-1.8,7.1-1.7c1.1.4,2,.4,2.9.5,1.3.1,3,0,4.5-.4s2.6.3,3.3-.4,7.5-.6,7.3-1.4-4.3-2.9-4.2-3.4c.2-.9,3.6-3.3,3.4-3.9s-6.4,1.7-7,1.2-.3-1.7-.7-1.9c-.7-.3-1.8,0-2.6-.2s-2.3-.4-3.3-.4-2.5.2-3.9.6c-1.4.4-1.8.9-2.4,1.5l-1.4-1-.3,1.9h0Z'%20data-active='1'%20style='fill:%20%23feffd5;%20stroke:%20%23ffa46a;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='mobility'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-mobility-2'%20d='M23.5,15l2.9-1.7c-.9,1.8-1.7,3.6-2.6,5.4,1.1-.6,2.1-1.2,3.2-1.7-1.2,2.1-2.3,4.3-3.3,6.5,1.3-.4,2.5-.9,3.8-1.3-1,1.6-2,3.2-3,4.8.8-.3,1.6-.5,2.4-.7-.6,1.3-1.3,2.5-2,3.7,1-.6,2-1,3.1-1.3-.8,1.2-1.6,2.5-2.2,3.8.7-.3,1.4-.5,2.2-.6-.8,1-1.5,2-2.3,2.9'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3cpath%20id='tooth-mobility-1'%20d='M12.5,14.1c1-.3,2.1,0,3,1-1.4,1.1-2.8,2.2-4.2,3.1,1.3,0,2.6.2,3.8.7-1.3,1-2.7,2.2-3.9,3.4,1,.1,1.9.4,2.8.8-.9.8-1.9,1.6-2.8,2.4.7,0,1.5.3,2.1.9-.9,1.1-1.8,2.4-2.7,3.7.9-.1,1.8-.3,2.7-.4-1.4,1-2.6,2.4-3.7,4,.7.2,1.5.3,2.2.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth-variants'%20data-active='1'%3e%3cpath%20id='no-tooth-after-extraction'%20d='M19.7,33.6c1.8-.6,8.2,1.3,7.6-.4-3-8.1-.6-32.3-9-28.8-4.3,1.8-4,18.8-4.3,28.5-.3,9.7,2.9,1.4,5.7.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='tooth-under-gum'%20d='M15.6,2.9c-.2.6-.4,1.3-.5,2,0,2.5.5,5.2.7,7.6.5,3.1-.1,5.9.3,8.9.2,1.9,1.4,3.4,2.5,4.9,1.3,2.1,3.6,5.4,6.1,3.7,2-1.6,2.3-6.4,2-8.8-.2-1.7-.8-3.6-2-4.9s-2-1.8-2.5-3.2c-1-2-2.3-5.9-3.3-7.8-.5-1.1-1.4-1.8-2.4-2.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-incisal'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5.6,2.1,1.4,4.8,2.7,7s2.6-1.3,3.4-.5,0-3.6,1.1-3.5,2.4-3.1,3.3-3.4c.7-.3.7,6.6,1.3,6s2.1,2.4,2.8,1.4c2.6-3.9,4.3-9.4,4.8-12.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal-incisal'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.6,5.7-2.8,10.3-4,15.5s2.8,2.1,2.7,3.1c-.3,1.7,2.1,2.6,2.5,4.2s-.3,3.2,0,4.3-4,2.9-3.5,4c.6,2.2,5.1-.7,6.4,1.2s-1.3,3.7,0,4.3,2.3,4.7,4.1,4.1c1-.4-.4-2.5.5-3.5s4.2-1.1,5-2.5c1.5-2.7-1.5-.5-1.3-1.6.3-2.6-3.1-2.2-3.4-2.8s.7-3.6.9-4.3c.3-1.1,4.9-1.2,5-2.1.2-1.7,2.8-3.4,2.7-5.2s-.5-4.1-1.5-6c-1.4-2.8-3-4.9-3.3-8.1-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.6,5.7-2.8,10.3-4,15.5s2.8,2.1,2.7,3.1c-.3,1.7,2.1,2.6,2.5,4.2s-.3,3.2,0,4.3-4,2.9-3.5,4c1.4,5.1,4.2,11.9,10.3,9.7,2.1-.9,4-3.3,5.5-6s-1.5-.5-1.3-1.6c.3-2.6-3.1-2.2-3.4-2.8s.7-3.6.9-4.3c.3-1.1,4.9-1.2,5-2.1.2-1.7,2.8-3.4,2.7-5.2s-.5-4.1-1.5-6c-1.4-2.8-3-4.9-3.3-8.1-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-incisal'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5,1.4,5.1,4.2,13.2,10.3,11,.9-.4-3.4-1.5-2.6-2.3s1.8-.3,2.6-1.9.4-2.1.8-3c.7-1.6,2.9-2.7,3.3-4.2s-2.3-1.6-2.2-2.7c.1-.9,2.9-4.6,3-5.5s4.6-1.7,4.5-2.5c-.1-2.1-.5-4.2-1.5-6.1-1.4-2.8-3-4.9-3.3-8.1-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5,1.4,5.1,4.2,13.2,10.3,11,2.1-.9,4-3.3,5.5-6s-1.5-.5-1.3-1.6c.3-2.6-3.1-2.2-3.4-2.8s.7-3.6.9-4.3c.3-1.1,4.9-1.2,5-2.1.2-1.7,2.8-3.4,2.7-5.2s-.5-4.1-1.5-6c-1.4-2.8-3-4.9-3.3-8.1-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal-incisal'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.6,5.9-2.9,10.5-4.1,16s-.3,1.6-.5,2.4c0,.8-.2,1.6-.2,2.4s0,1.7.3,2.5c.2.8,5.7-.4,6,.6s.1,4.2.6,5.4c.2.7,2.6,2.2,2.8,3.1.6,1.7-.3,3,.6,4.6s1.6,0,2.7.6-2,4-.3,3.4c4.9-2.1,8.4-11.8,9.1-16.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal'%20d='M18.4,3.9c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.6,6-3,10.8-4.2,16.3s1.7.9,1.6,1.6c0,1.9,5.4,1.1,1.1,5.5-.6.7,1.9,1.2,2.4,2,.7,1,4.6,3,1.5,4.6.1.5-.7,2-.6,2.5.3.8-3,.6-2.7,1.4,1.7,4.3,4.4,8.5,9,6.9,4.9-2.1,8.4-11.8,9.1-16.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-crownprep'%20d='M18.4,3.9c-3.8,5.6-3.6,13.4-4.9,19.7-.5,4.9-1.9,8.5-3,12.5-.3,1.3-1.1,2.9-1,4.3.5.6,4.1-.9,5.3.5.9,1,0,2.4.3,3.5.8,2.9,4.4,1.8,6.8,1.7.5,0,1.6,0,2-.3,2-1.2-.3-4.8.5-5.5.4-.3,4.1-.5,5.4-1.2s-3.3-7.3-3.7-10.6c-.6-3.6-1-9.2-1.6-13.8-.4-4.1-1.3-7.8-4.3-10.5'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-radix'%20d='M18.4,3.9c-3.8,5.6-3.6,13.4-4.9,19.7-.5,4.9-4.1,13.2-4,14.6.5.6,8.4,7.8,10.3,8.3,2.3-.4,8.2-8.1,9.5-8.8s-2.7-5.9-3.1-9.2c-.6-3.6-1-9.2-1.6-13.8-.4-4.1-1.3-7.8-4.3-10.5'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='tooth'%20data-active='1'%3e%3cpath%20id='tooth-base'%20d='M18.3,4.4c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5,1.4,5.1,4.2,13.2,10.3,11,4.9-2.1,8.4-11.8,9.1-16.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-base-beauty'%20d='M27.3,54.3c-.3,2.2-2.2,4.4-3.7,6.1-1,1.1-2,1.7-1.7.9v-.3c1.4-2.2,2.8-5.5,4.3-7.4.5-.4.9.2,1,.6h.1Z'%20data-active='1'%20style='fill:%20%23fefefe;'%20/%3e%3cg%20id='tooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base'%20d='M20.4,6.4c0,2.6-.5,5.3-.3,8,.1,3.9.1,9.1.4,13.2,0,2.6,1.1,4.8,1.6,7.6.4,2.7-.3,6.4-1.4,9.2-1.8,3.7-3.4-5.6-3.4-6.6-.2-3.2,1.3-6.7,1.6-9.6.2-4.2-.2-8.8.2-13.1.1-2.4.2-4.9-.4-7.7-.3-1.5-1.2-4,.2-4.9,1.8-.7,1.5,2.3,1.6,3.6v.2h-.1Z'%20data-active='1'%20style='fill:%20%23ff422a;'%20/%3e%3cpath%20id='pulp-inflam-path-8'%20d='M22,21.8h0v-.2c-.3-.1-.6-.2-.8-.1-.6.2-1.3.3-1.8.6s-.9.7-.1.8,2.1-.2,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-0);'%20/%3e%3cpath%20id='pulp-inflam-path-7'%20d='M16.6,19.6h0v.2c.1.2.3.4.6.5.6.2,1.3.3,1.9.4s1,0,.5-.6-2-.9-2.9-.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-1);'%20/%3e%3cpath%20id='pulp-inflam-path-6'%20d='M22.3,17.2h0v-.2c-.2-.2-.5-.3-.7-.2-.6,0-1.3.1-1.9.4s-1,.5-.1.7,2.1,0,2.8-.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-2);'%20/%3e%3cpath%20id='pulp-inflam-path-5'%20d='M16.6,14.5h0v.2c.1.2.4.4.6.4.6,0,1.3.2,1.9,0s1-.3.3-.7-2.1-.5-2.9,0h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-3);'%20/%3e%3cpath%20id='pulp-inflam-path-4'%20d='M22.3,10.6h0s0-.1-.1-.2c-.2-.1-.5-.1-.8-.1-.6,0-1.2.4-1.8.7s-.8.6,0,.7,2.1-.3,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-4);'%20/%3e%3cpath%20id='pulp-inflam-path-3'%20d='M16.6,7.3h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-5);'%20/%3e%3cpath%20id='pulp-inflam-path-2'%20d='M16.3,3.4h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-6);'%20/%3e%3cpath%20id='pulp-inflam-path-1'%20d='M21.5,3.1h-.2c-.3,0-.5.2-.8.3-.5.4-.9,1-1.3,1.6s-.4,1,.3.7,1.7-1.4,1.9-2.6c0,0,.1,0,.1,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-7);'%20/%3e%3c/g%3e%3cpath%20id='tooth-healthy-pulp'%20d='M20.4,6.4c0,2.6-.5,5.3-.3,8,.1,3.9.1,9.1.4,13.2,0,2.6,1.1,4.8,1.6,7.6.4,2.7-.3,6.4-1.4,9.2-1.8,3.7-3.4-5.6-3.4-6.6-.2-3.2,1.3-6.7,1.6-9.6.2-4.2-.2-8.8.2-13.1.1-2.4.2-4.9-.4-7.7-.3-1.5-1.2-4,.2-4.9,1.8-.7,1.5,2.3,1.6,3.6v.2h-.1Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3cpath%20id='tooth-bruxism-wear'%20d='M16.4,57.2c.3.8.5,2.7,1.2,1,.2-.3.4-.8.7-.8.7.3.4,1.5.9,1.9.6.2,1.5-3,2.2-1.9.2.3.3.9.4,1.2.4,1.1,1-1.9,1.3-2.1.3-.5.5,0,.7.7.6,3.3.7,0,1.3-1h.3c2.3,2.4.7,6.5-2,7.9-2.3,1.4-5.5,2-7,.7-.9-.9-1.5-1.5-2.3-2.7-.8-1.5-3.2-5.7.1-5.8,1,0,1.7.2,2.1.8h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='tooth-bruxism-neck-wear'%20d='M23.4,49.6c-.3-.5-.5-1.5-1.2-.6-.2.2-.4.4-.7.4-.7-.2-.4-.9-.9-1.1-.6,0-1.5,1.7-2.2,1s-.3-.5-.4-.7c-.4-.6-1,1-1.3,1.1-.3.3-.5,0-.7-.4-.6-1.9-.7,0-1.3.5h-.3c-2.3-1.4-.6-3.7,2.1-4.4,2.3-.7,5.5-1,7-.2.9.5,1.5.9,2.3,1.6.8.9,3.1,3.3-.2,3.3s-1.7,0-2.1-.5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='milktooth'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='milktooth-base'%20d='M18.3,4.4c-.7,1.2-1.6,2.5-2.1,3.9-1.6,5-1.9,11-2.9,16-.7,6.7-3.6,11.9-4.6,18.3-.7,4.1.9,7.7,2.3,11.5,1.4,5.1,4.2,13.2,10.3,11,4.9-2.1,8.4-11.8,9.1-16.8.5-3.6.5-7.8-1.2-11.2s-3-4.9-3.3-8.1c-.8-4.7-1.3-13.3-2.3-17.9-.4-2.6-1.9-4.6-3.6-6.4'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='milktooth-beauty'%20d='M27.3,54.3c-.3,2.2-2.2,4.4-3.7,6.1-1,1.1-2,1.7-1.7.9v-.3c1.4-2.2,2.8-5.5,4.3-7.4.5-.4.9.2,1,.6h.1Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cg%20id='milktooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base1'%20d='M20.5,6.8c0,2.9-.6,5.8-.4,8.8.1,4.3.1,10,.5,14.5,0,2.9,1.4,5.3,2,8.3.5,3-.4,7-1.8,10.1-2.3,4.1-4.3-6.1-4.3-7.2-.3-3.5,1.7-7.3,2-10.5.3-4.6-.3-9.6.3-14.3.1-2.6.3-5.4-.5-8.4-.4-1.6-1.5-4.4.3-5.4,2.3-.8,1.9,2.5,2,3.9v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-8);'%20/%3e%3cpath%20id='pulp-inflam-path-81'%20d='M22.2,22h0v-.2h-.8c-.6.3-1.2.5-1.7.9s-.8.8,0,.8,2-.6,2.5-1.5Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-9);'%20/%3e%3cpath%20id='pulp-inflam-path-71'%20d='M16.8,19.2h0v.2c0,.2.2.5.4.6.5.3,1.2.6,1.8.8s1,.2.6-.5-1.7-1.3-2.7-1.1c0,0-.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-10);'%20/%3e%3cpath%20id='pulp-inflam-path-61'%20d='M22.3,17.2h0v-.2c-.2-.2-.5-.3-.7-.2-.6,0-1.3.1-1.9.4s-1,.5-.1.7,2.1,0,2.8-.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-11);'%20/%3e%3cpath%20id='pulp-inflam-path-51'%20d='M16.6,14.5h0v.2c.1.2.4.4.6.4.6,0,1.3.2,1.9,0s1-.3.3-.7-2.1-.5-2.9,0h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-12);'%20/%3e%3cpath%20id='pulp-inflam-path-41'%20d='M22.3,11.6h0s0-.1-.1-.2c-.2-.1-.5-.1-.8-.1-.6,0-1.2.4-1.8.7s-.8.6,0,.7,2.1-.3,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-13);'%20/%3e%3cpath%20id='pulp-inflam-path-31'%20d='M16.3,8h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-14);'%20/%3e%3cpath%20id='pulp-inflam-path-21'%20d='M16.3,3.4h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-15);'%20/%3e%3cpath%20id='pulp-inflam-path-11'%20d='M22.2,5.6h-.2c-.3,0-.5.2-.8.3-.5.4-.9,1-1.3,1.6s-.4,1,.3.7,1.7-1.4,1.9-2.6h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-16);'%20/%3e%3c/g%3e%3cpath%20id='milktooth-healthy-pulp'%20d='M20.2,15.6c.1,4.3.1,10,.5,14.5,0,2.9,1.4,5.3,2.1,8.3.5,3-.4,7-1.8,10.1-2.4,4.1-4.5-6.1-4.5-7.2-.3-3.5,1.7-7.3,2.1-10.5.3-4.6-.3-9.6.3-14.3.1-2.6.3-5.4-.5-8.4-.4-1.6-1.6-4.4.3-5.4,2.4-.8,2,2.5,2.1,3.9v.2s-.8,5.8-.5,8.8c0,0-.1,0-.1,0Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3c/g%3e%3cg%20id='endos'%20data-active='1'%3e%3cpath%20id='endo-medical-filling'%20d='M19.4,3.9c.9,2.9,1.2,9.1,1.6,12.8.5,5.1,2,19,2.5,24.2.3,5.7-6.4,6.6-6.2-1.9.4-7.5.6-20.5.7-27.6,0-1.2.3-11.1,1.4-7.7h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f9ae94;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='endo-filling-incomplete'%20d='M19.4,17.8c.9,1.9,1.2,5.9,1.6,8.4.5,3.3,2,12.4,2.5,15.8.3,3.8-7,5.1-6.8-.4.4-4.9,1.2-14.2,1.3-18.8,0-.8.3-7.3,1.4-5.1h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-filling'%20d='M19.4,3.9c.9,2.8,1.2,8.9,1.6,12.6.5,5,2,18.7,2.5,23.8.3,5.7-7,7.7-6.8-.6.4-7.4,1.2-21.4,1.3-28.4,0-1.2.3-11,1.4-7.6h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-glass-pin'%20d='M19.6,10.6c.8,1.9,1.1,5.8,1.4,8.2.4,3.2,1.8,12.2,2.2,15.5.2,3.7,6,11.1,2.2,14.6-3.5,3.3-12.8,2.7-12.1-3.9.7-5.2,3.6-9.4,3.8-14.8.4-4.8.9-10.2,1.1-14.8,0-.8.3-7.1,1.4-5h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23c8c9c9;'%20/%3e%3cpath%20id='endo-metal-pin'%20d='M19.6,10.6c.8,1.9,1.1,5.8,1.4,8.2.4,3.2,1.8,12.2,2.2,15.5.2,3.7,6,11.1,2.2,14.6-3.5,3.3-12.8,2.7-12.1-3.9.7-5.2,3.6-9.4,3.8-14.8.4-4.8.9-10.2,1.1-14.8,0-.8.3-7.1,1.4-5h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%233951a3;'%20/%3e%3cpath%20id='endo-resorption'%20d='M13.2,9.3s2.9-7.2,3.3-7.2l5.3.2c1.4,0,3.3,8.1,3.2,8.2l-.5,1.9c-.2.7-.5,1.3-.9,1.9l-1.7,2.3c-1,1.4-2.8,1.5-3.9.2l-2.4-2.7c-.2-.2-.4-.5-.5-.7l-2.2-4.2h.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fdecc5;'%20/%3e%3cpath%20id='endo-resection'%20d='M12.9,10.4s3-8,3.5-8h6c1.5,0,4,8.7,4,9l.2,7.2-13.5.2-.2-8.3h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fdecc5;'%20/%3e%3c/g%3e%3cg%20id='surfaces'%20data-active='1'%3e%3cg%20id='subcaries'%20data-active='1'%3e%3cpath%20id='subcaries-buccal'%20d='M16.7,50.5c.6.8,1.4,1.2,2.1,1.2,1.2,0,2.1-1,2.7-2.6s.4-1.1.4-1.8c-.5-3.4-5.6-2.2-6.2-.8-.4,1.1.6,3,1.1,3.8h0v.2h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-mesial'%20d='M27.5,33.3c-4-.9-5.7,12.2-4.3,14.4,1.1,3.8,5.7,4.3,7.2.3,1.3-3.1,0-12.9-2.7-14.7,0,0-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-distal'%20d='M11.7,51.4c2.3-.5,3.1-6,3.4-8.7.6-4,.2-8.6-3.2-8-4.3,1.1-4.4,15.9-.3,16.8h.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-occlusal'%20d='M13,60.4c1.1,3.6,4.9,5.8,7.1,5.6,2.1,0,6-2.9,6.9-5.8,1.3-5.6-5.5-7.6-8.8-7.1-2.4.3-5.4,2.8-5.5,6.2v.8l.3.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='caries'%20data-active='1'%3e%3cpath%20id='caries-root'%20d='M12.2,28.2c-1.1,2.9,10.3,1.2,12.2.7,2.9-.5,1.1-2.1,1-4.1-.1-3-4.3,2.2-5.9,2.2-3.3,0-3.7-2.6-6.2-3.1s-.6,3-1,4.4h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-subcrown'%20d='M10,35.7c-1,2.9,12.1-5.5,11.8-7.5-1-4-8.9-3.1-9.7-.3l-2.1,7.8h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-buccal'%20d='M16.7,50.5c.6.8,1.4,1.2,2.1,1.2,1.2,0,2.1-1,2.7-2.6s.4-1.1.4-1.8c-.5-3.4-5.6-2.2-6.2-.8-.4,1.1.6,3,1.1,3.8h0v.2h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='caries-mesial'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='mesial-shape'%20d='M27.8,35c-3.5-.8-5,10.7-3.8,12.6,1,3.3,5,3.8,6.3.3,1.1-2.7,0-11.3-2.4-12.9h-.1Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='mesial-patch2'%20d='M27.9,42.4c3.2,0-1-4.3-1.8-1.6-.3.9.8,1.7,1.5,1.6h.3Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='mesial-patch1'%20d='M26.1,47.9c1.4,1.3,4.6-.7,2.1-1.6-1.6-.5-2.5.6-2.1,1.5h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-distal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='distal-shape'%20d='M11.7,51.4c2.3-.4,3.1-5.3,3.4-7.7.6-3.5.2-7.6-3.2-7.1-4.3,1-4.4,14-.3,14.8,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='distal-patch2'%20d='M13,42.5c.9-.6.5-2.7-.6-2.5s-.7,3,.4,2.6h.2Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='distal-patch1'%20d='M10.8,48c.2.3.7.5,1,.6.3,0,.8.2.7,0-.3-.5-1.1-1.6-1.5-1.9-.8-.3-.4,1-.3,1.3,0,0,.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-occlusal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='occlusal-shape'%20d='M13.8,60.7c1,3.1,4.3,5.1,6.2,4.9,1.8,0,5.2-2.5,6-5.1,1.1-4.9-4.8-6.6-7.7-6.2-2.1.3-4.7,2.4-4.8,5.4v.7l.3.4h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='occlusal-patch2'%20d='M20.1,60.6c-.7,3,3.3,1.5,3.6,0,.5-.8.2-2-.5-2.3-1.2-.5-2.4,1-3.2,2.1h0v.2h.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='occlusal-patch1'%20d='M15.5,60.7c-.1,1.5,1,2.6,1.6,1.2.4-.9.4-3.1-.4-3.1s-1.1.7-1.1,1.8v.2h-.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fillings'%20data-active='1'%3e%3cg%20id='amalgam'%20data-active='1'%3e%3cpath%20id='filling-amalgam-occlusal'%20d='M13.6,60.8c.1.5.9,1.3,1.1,1.8,1.5,2.5,4.7,3.8,7.3,2.3,2.2-1.2,4.8-3.9,4.3-6.6-1.6-6.1-14.6-5.5-13,1.4,0,0,.3,1.1.3,1.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-buccal'%20d='M18.8,51.1c1.8,0,2.3-2.5,2.6-3.9.4-2.1-3.3-1.5-4.3-.7-1.7,1.2-.5,4.4,1.6,4.5h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-mesial'%20d='M27.3,34.3c-3.6-.7-4.7,11-3.3,12.9,1.2,3.3,5.3,3.6,6.5,0,1-2.8-.6-11.5-3-13h-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-distal'%20d='M11.3,50c2.3-.4,3.1-5.4,3.3-7.8.6-3.5,0-7.6-3.4-7-4.3,1.1-4.2,14.1,0,14.8,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='composite'%20data-active='1'%3e%3cpath%20id='filling-composite-occlusal'%20d='M13.5,60.8c.1.5.9,1.3,1.1,1.8,1.5,2.5,4.7,3.8,7.3,2.3,2.2-1.2,4.8-3.9,4.3-6.6-1.6-6.1-14.6-5.5-13,1.4,0,0,.3,1.1.3,1.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-buccal'%20d='M18.8,51.1c1.8,0,2.3-2.5,2.6-3.9.4-2.1-3.3-1.5-4.3-.7-1.7,1.2-.5,4.4,1.6,4.5h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-mesial'%20d='M27.7,34.5c-3.6-.8-5.1,10.9-3.7,12.8,1.1,3.3,5.2,3.8,6.5.3,1.1-2.8-.2-11.5-2.6-13.1,0,0-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-distal'%20d='M11.3,50c2.3-.4,3.1-5.4,3.3-7.8.6-3.5,0-7.6-3.4-7-4.3,1.1-4.2,14.1,0,14.8,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gic'%20data-active='1'%3e%3cpath%20id='filling-gic-occlusal'%20d='M13.6,60.8c.1.5.9,1.3,1.1,1.8,1.5,2.5,4.7,3.8,7.3,2.3,2.2-1.2,4.8-3.9,4.3-6.6-1.6-6.1-14.6-5.5-13,1.4,0,0,.3,1.1.3,1.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-buccal'%20d='M18.8,51.1c1.8,0,2.3-2.5,2.6-3.9.4-2.1-3.3-1.5-4.3-.7-1.7,1.2-.5,4.4,1.6,4.5h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-mesial'%20d='M27.3,34.3c-3.6-.7-4.7,11-3.3,12.9,1.2,3.3,5.3,3.6,6.5,0,1-2.8-.6-11.5-3-13h-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-distal'%20d='M11.3,50c2.3-.4,3.1-5.4,3.3-7.8.6-3.5,0-7.6-3.4-7-4.3,1.1-4.2,14.1,0,14.8,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary'%20data-active='1'%3e%3cpath%20id='filling-temporary-occlusal'%20d='M13.6,60.8c.1.5.9,1.3,1.1,1.8,1.5,2.5,4.7,3.8,7.3,2.3,2.2-1.2,4.8-3.9,4.3-6.6-1.6-6.1-14.6-5.5-13,1.4,0,0,.3,1.1.3,1.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-buccal'%20d='M18.8,51.1c1.8,0,2.3-2.5,2.6-3.9.4-2.1-3.3-1.5-4.3-.7-1.7,1.2-.5,4.4,1.6,4.5h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-mesial'%20d='M27.3,34.3c-3.6-.7-4.7,11-3.3,12.9,1.2,3.3,5.3,3.6,6.5,0,1-2.8-.6-11.5-3-13h-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-distal'%20d='M11.3,50c2.3-.4,3.1-5.4,3.3-7.8.6-3.5,0-7.6-3.4-7-4.3,1.1-4.2,14.1,0,14.8,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='defect'%20data-active='1'%3e%3cpolygon%20id='defect-occlusal'%20points='18.3%2065.8%2017%2065.3%2018.3%2064.7%2020.9%2064.6%2022.3%2065.1%2021%2065.7%2018.3%2065.8'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-buccal'%20points='18.3%2046.7%2017.3%2046.2%2018.2%2045.5%2019.9%2045.4%2020.8%2045.9%2020%2046.5%2018.3%2046.7'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-distal'%20points='8.6%2044.6%208%2046%207.5%2044.6%207.5%2041.7%208%2040.3%208.6%2041.7%208.6%2044.6'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-mesial'%20points='31.3%2042.4%2031.1%2043.9%2030.2%2042.6%2029.6%2039.8%2029.8%2038.3%2030.7%2039.6%2031.3%2042.4'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='contact-point'%20data-active='1'%3e%3cg%20id='mesial-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M29,39.5c1.1,2.4,2.5,5.1,4,7.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M29.5,47.7c.7-1.6.8-2.6,1.3-3.8.6-1.4,1.1-3,1.5-4.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='distal-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M6.3,40.8c1.3,2.4,2.9,5.1,4.5,7.6'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M7.2,49c.6-1.6.6-2.6,1.1-3.8.6-1.4,1-3,1.3-4.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='restorations'%20data-active='1'%3e%3cpath%20id='crown-leakage'%20d='M11.5,32c1.8-5.7,12.3-3.6,16.3,1.9,2.2,3-20.4,1.6-16.3-1.9'%20data-active='1'%20style='display:%20none;%20fill:%20%239e00e9;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='implant'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-locator-screw'%20d='M15.8,46.4c.9,1.5,3.8.9,5.4,1,3.2-.5,1.7-4.6,2-7,0-.7.2-1.6-.3-2.1-.2-.3-.7-.4-1-.4-1.5,0-3.4-.2-4.9.2-1.3.3-1.4,1.3-1.4,2.5,0,2-.2,3.9.1,5.7v.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-17);%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='implant-connector'%20d='M12.9,39.7h0c.1,1.4,1.1,2.1,1.9,1.7,1.4-.7,1.6-2,3.4-2.1h3.3c.8,0,1.8,1.9,2.9,2.2s1.4-.6,1.3-1.6c0-1.9,0-5.6-.5-5.7s-3.1,0-3.7,0h-4.5c-1,0-2.7-.4-3.5.7-.8,1.1-1,2.9-.8,4l.2.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-13-18);'%20/%3e%3cpath%20id='implant-bar'%20d='M6.8,52.5c5.8.3,21,0,27.4,0s2.8-2.2,3-4.1.2-3.2-1-3.4-4.8,0-6.3,0c-3.6,0-6.7,0-10.1.2-3.8,0-12.1.2-12.7,0-1.1,0-2.1.7-2.2,1.7-.2,1.9-.2,5.5,1.8,5.3h0v.3h0Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-13-0);'%20/%3e%3cg%20id='implant-healing-abutment'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-healing-abutment-connector'%20d='M15.9,38.9c1.7.3,3.7-.2,5.4-.2,3.3,0,4.2-1.2,3.4-5.6-.8-3.9-1.7-9-2.7-13.4-.3-1.1-.6-2.2-1.1-3.1-2.3-4.5-4.3,1.7-4.7,5-.5,3.4-.6,5.9-1.3,9-.6,2.7-2.4,7.7.7,8.3h.3Z'%20data-active='1'%20style='fill:%20%23a0a0a0;%20stroke:%20%238c8c8c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M26.5,35.4h-9.2c-1.4,0-5,.2-5,.2,0,0-.4.9-.7,1.7s-.3,1.2-.3,1.8v2.7c0,.3.2.5.2.7h1.1c2.4-.3,4.9-.4,7.3-.4v-.2c.3,0-.7-.2-.9-.2.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.6.6-.5.4-.6l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.6,0,1.2,0,1.9.2h.5c.2,0,.4,0,.5.2-.2-.2,0-2.5,0-2.5h.2Z'%20data-active='1'%20style='fill:%20%23475563;'%20/%3e%3cpath%20d='M20.1,41.9v-.2h.2v-.2c.5,0,2,.3,2.6.2.1.3.5.2.7.2.6,0,2.3.2,2.5-.9s.2-1.8,0-2.7-.3-.4-.1-.6h.4s.2,0,.2.4v3.6c0,.2-.1.4-.2.6-.9,0-1.8-.2-2.8-.3h-3.6,0Z'%20data-active='1'%20style='fill:%20%238c8c8c;'%20/%3e%3cpath%20d='M19.8,37.7c-.1-.2-.3-.2-.5-.2l-.9.2c-.1-.2-.4-.2-.6,0-.1-.2-.9,0-1,0l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.1.3,0,.2.3.6.2.3.3.2.4.5.1.7,0,1.5,0,2.1s-.3.8-.7.9c-.7,0-2,.2-2.7,0s-1.4-.2-1.4-.6v-.9c-.1-.4,0-1.5,0-2s.5-.7.3-.5h0Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M22.9,41.7h.7c.4-.2.7-.6.7-1v-1.9c0-.6-.9-1.1-1.5-1.1-.3-.4.9,0,.8-.2.6,0,1.2,0,1.9.2s.3,0,.5,0c-.2.2,0,.4.1.6.1.9.1,1.8,0,2.7s-1.9,1-2.5.9-.6,0-.7-.2h0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3cpath%20d='M16.8,37.6c.1,0,.9-.2,1,0,.2-.2.5-.2.6,0,0,0-.2.2-.2.3,0,1-.2,1.9,0,2.9s.6.6,1,.7c.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.8.6-.5.4-.6h0Z'%20data-active='1'%20style='fill:%20%236f7c86;'%20/%3e%3cpath%20d='M20.1,41.7c.3,0-1.1-.3-.9-.2-.4,0-.9,0-1-.7-.2-.9,0-1.9,0-2.9s.2-.2.2-.3l.9-.2c.2,0,.4,0,.5.2-.2.2-.3.4-.3.7v2.5c0,.9.5.6.7.7v.2h-.2s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3c/g%3e%3cg%20id='implant-base'%20data-active='1'%3e%3cpath%20d='M16.1,35.4c-.1-1.3-.2-2.7.2-4h5.6c.4,1,.2,2.9.2,4h-6Z'%20data-active='1'%20style='fill:%20%23bbc3c6;'%20/%3e%3cpath%20d='M17.3,9c-.2,0,0-2.2,0-2.4.2-1.3.9-2.4,1.9-3,1-.6.2,0,.2-.3,1.7,0,3.3,1.1,3.8,3.1s0,1.2.1,1.8h-1.3c0-.8,0-2.1-.8-2.3s-.7,0-.7.3c0,.8,0,1.5.2,2.1l-3.5.6h0Z'%20data-active='1'%20style='fill:%20%23bac3c7;'%20/%3e%3cpath%20d='M16.3,31.4c-.4,1.3-.3,2.7-.2,4l-3.8.2c0-.7-.3-4.2.7-4,1.1-.2,2.2-.2,3.3-.2Z'%20data-active='1'%20style='fill:%20%23a0a4a5;'%20/%3e%3cpath%20d='M16.9,30.9v-2.5c1.5-.3,3-.7,4.6-.7l.2,3.3h-4.8Z'%20data-active='1'%20style='fill:%20%23bac3c6;'%20/%3e%3cpath%20d='M19.5,3.2s-.1.2-.2.3c-1,.6-1.6,1.7-1.9,3-.3,1.3-.2,2.4,0,2.4l-2.4.6c.1-1.1,0-2.2.3-3.3s1.1-2.2,2.1-2.7,1.5-.4,2.2-.4h-.1Z'%20data-active='1'%20style='fill:%20%239ca3a6;'%20/%3e%3cpath%20d='M22.1,35.4c0-1.1.2-3-.2-4h2.7c.2,1,.3,3,0,4h-2.5Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M16.8,28.3v2.5c.1,0-3.4.2-3.4.2,0-.7,0-1.4.1-2,1.1-.4,2.2-.5,3.2-.8h.1,0Z'%20data-active='1'%20style='fill:%20%239ea3a4;'%20/%3e%3cpath%20d='M24.6,35.5c.2-1,.2-3,0-4h1.4c.8.2.7,3.3.5,4h-1.9Z'%20data-active='1'%20style='fill:%20%23bcc4c7;'%20/%3e%3cpath%20d='M21.7,30.9l-.2-3.3c.6-.2,1.3-.2,1.9-.2l.2,3.6h-1.9Z'%20data-active='1'%20style='fill:%20%23e3eaeb;'%20/%3e%3cpath%20d='M23.6,31l-.2-3.6c.5-.1,1.1-.1,1.7-.1l.3,3.8h-1.8Z'%20data-active='1'%20style='fill:%20%23b8c2c4;'%20/%3e%3cpath%20d='M16.9,26.5v-1.1c1.5-.3,3-.6,4.5-.7v1.1l-4.5.7Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M17,23.6c-.1-.4,0-.8,0-1.2,1.5-.3,2.9-.5,4.3-.7v1.2l-4.4.7h.1Z'%20data-active='1'%20style='fill:%20%23b9c0c4;'%20/%3e%3cpath%20d='M17.1,20.7c-.3-.4,0-.5-.2-1.1,1.4-.4,2.8-.6,4.3-.8v1.2c-1.3.2-2.7.4-4.1.7Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M17,17.7v-1.1c1.3-.3,2.7-.6,4.1-.7v1.1l-4.1.7Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M17.1,14.8v-1.1c1.3-.3,2.6-.5,3.9-.7v1.2l-4,.6s.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%23b9c1c5;'%20/%3e%3cpath%20d='M17.1,10.8c1.2-.3,2.4-.6,3.7-.7v1.2c-1.2.1-2.4.4-3.7.6v-1.1Z'%20data-active='1'%20style='fill:%20%23bac3c5;'%20/%3e%3cpath%20d='M16.9,27.8c0-.2,0-.5-.1-.7-.2.2-.5.3-.6,0,1.7-.4,3.5-.7,5.3-.9.1.2,0,.5,0,.8l-4.6.7h0Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M17,24.9c-.2-.2,0-.5,0-.8,1.5-.3,3-.6,4.5-.7v.8l-4.4.7s-.1,0,0,0c0,0-.1,0,0,0h-.1Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M16.9,25.4v1.1l-3.2.8v-1.1c1-.4,2.1-.5,3.1-.7h.1Z'%20data-active='1'%20style='fill:%20%239a9fa1;'%20/%3e%3cpath%20d='M17.1,21.9c-.1-.3-.2-.4-.2-.7,1.5-.3,2.9-.6,4.3-.7v.8l-4.2.7h.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M17,22.4c0,.4-.1.8,0,1.2l-3.1.7v-1.2c1-.4,2-.5,3-.7,0,0,.1,0,0,0,0,0,.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%23999fa1;'%20/%3e%3cpath%20d='M17,19v-.8c1.4-.3,2.8-.5,4.2-.7v.8s-4.2.7-4.2.7Z'%20data-active='1'%20style='fill:%20%23bac1c4;'%20/%3e%3cpath%20d='M17,16.1v-.7c1.3-.3,2.7-.5,4-.7v.8l-4.1.6s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M17.1,13.2v-.8c1.2-.4,2.5-.5,3.8-.7,0,.2.1.5,0,.8l-3.9.7s.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%23bbc2c4;'%20/%3e%3cpath%20d='M16.9,19.6c.1.6,0,.7.2,1.1l-2.9.7v-1.1c.9-.5,1.8-.4,2.7-.6h0Z'%20data-active='1'%20style='fill:%20%239ba0a2;'%20/%3e%3cpath%20d='M16.1,27.2c.1.2.4.2.6,0,.1.2.1.5.1.7-1.2.3-2.4.5-3.6.9s-.4-.2-.5-.4c0-.6,2.7-1,3.2-1.1h.2Z'%20data-active='1'%20style='fill:%20%23a8aeb1;'%20/%3e%3cpath%20d='M16.9,24.1v.8l-3.5.9c-.2,0-.4-.3-.4-.4,0-.6,3.3-1.1,3.8-1.2h.1Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M17,16.6v1.1l-2.7.7v-1.2c.9-.4,1.8-.5,2.6-.6,0,0,.1,0,0,0,0,0,.1,0,0,0,0,0,.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%239ba0a3;'%20/%3e%3cpath%20d='M20.8,8.4c-.1-.7-.2-1.4-.2-2.1s.5-.4.7-.3c.8.2.7,1.5.8,2.3l-1.3.2h0Z'%20data-active='1'%20style='fill:%20%23e4e9ea;'%20/%3e%3cpath%20d='M17.2,10.3v-.8c1.2-.3,2.4-.5,3.7-.6v.8l-3.7.6Z'%20data-active='1'%20style='fill:%20%23bcc2c4;'%20/%3e%3cpath%20d='M16.9,21.2c0,.3,0,.5.2.7-1.2.2-2.2.5-3.4.8s-.4-.2-.4-.3c-.1-.7,3.1-1.1,3.6-1.2Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M17.1,13.7v1.1l-2.5.7c0-.3,0-.9.1-1.1.8-.4,1.6-.4,2.4-.6h0Z'%20data-active='1'%20style='fill:%20%239da2a4;'%20/%3e%3cpath%20d='M17,18.3v.8l-3.2.8c-.2,0-.3-.3-.3-.4s0-.3.2-.4c1.1-.4,2.2-.6,3.2-.8h.1Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M17.1,10.8v1.1l-2.4.6v-1.1c.8-.3,1.6-.4,2.3-.6,0,0,.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%239ca1a3;'%20/%3e%3cpath%20d='M17,15.4v.7l-2.9.8c-.2,0-.4-.2-.4-.3-.2-.7,3-1.1,3.3-1.1h0Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M17,12.4v.8l-2.8.7c-.2,0-.3-.2-.4-.3s0-.4.3-.4c1-.3,1.9-.6,2.9-.7h0Z'%20data-active='1'%20style='fill:%20%23a2a7a9;'%20/%3e%3cpath%20d='M17.2,9.5v.8c-.9.2-1.7.4-2.6.7s-.4-.1-.4-.3,0-.3.2-.4c.9-.4,1.8-.5,2.8-.8Z'%20data-active='1'%20style='fill:%20%23a7abae;'%20/%3e%3cpath%20d='M21.5,25.8v-1.1c.5-.2,1.1-.2,1.7-.2.1.4,0,.8,0,1.2l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e2e9eb;'%20/%3e%3cpath%20d='M21.4,22.9v-1.2l1.8-.2v1.1c-.5.2-1.1.2-1.7.3h0Z'%20data-active='1'%20style='fill:%20%23e1e8e9;'%20/%3e%3cpath%20d='M21.2,18.8c.6,0,1.2-.2,1.8-.2v1.2l-1.7.2v-1.2h0Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M21.1,17.1v-1.1c.5,0,1.1-.2,1.6-.2.2.4,0,.8.2,1.1-.6,0-1.2,0-1.8.2Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M23.3,25.6v-1.2c.5,0,1.1-.1,1.7-.1,0,.4.1.8.1,1.2-.6.2-1.2,0-1.7.1h-.1Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M21,14.2c-.1-.4,0-.8,0-1.2l1.6-.2v1.1c-.4.1-1,.2-1.5.2h-.1Z'%20data-active='1'%20style='fill:%20%23e4eaeb;'%20/%3e%3cpath%20d='M23.4,26.9v-.8c.5,0,2.5-.5,2.4.3s-1.8.5-2.4.5Z'%20data-active='1'%20style='fill:%20%23b4bdc0;'%20/%3e%3cpath%20d='M23.3,24v-.8c.4,0,2.4-.5,2.3.2s-.2.4-.4.4h-1.9s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23b8c0c4;'%20/%3e%3cpath%20d='M20.8,10.1c.5,0,1-.2,1.5-.2.1.4,0,.8.2,1.1-.5.1-1,.2-1.6.2v-1.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e8e9;'%20/%3e%3cpath%20d='M23.2,22.6v-1.1c.4,0,.9-.1,1.4-.1,0,.4.1.8,0,1.1-.5.2-1.1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M23,21.1v-.8c.4,0,2.2-.5,2.2.2s-1.7.5-2.2.6Z'%20data-active='1'%20style='fill:%20%23b5bdc1;'%20/%3e%3cpath%20d='M23,19.8v-1.2c.5,0,.9-.2,1.4-.1v1.1c-.5.1-1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c1c5;'%20/%3e%3cpath%20d='M22.9,18.1c-.1-.2,0-.5,0-.8.5,0,2.1-.4,2.2.2s-1.5.6-2.1.6h-.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M22.7,15.2c-.1-.2,0-.5-.1-.8.5,0,2.1-.5,2.1.2s-1.5.5-2,.6Z'%20data-active='1'%20style='fill:%20%23b6bec2;'%20/%3e%3cpath%20d='M22.8,16.9c-.1-.4,0-.8-.2-1.1.5,0,.9-.2,1.4-.1,0,.4.1.8,0,1.1h-1.3.1Z'%20data-active='1'%20style='fill:%20%23b9c2c6;'%20/%3e%3cpath%20d='M21.5,27.1v-.8c.7,0,1.3-.2,2-.2v.8l-1.9.2h-.1Z'%20data-active='1'%20style='fill:%20%23e5e9eb;'%20/%3e%3cpath%20d='M22.5,12.3v-.8c.3,0,2.2-.5,2,.3s-1.4.4-1.9.5h-.1Z'%20data-active='1'%20style='fill:%20%23bbc2c5;'%20/%3e%3cpath%20d='M22.6,13.9v-1.1c.3,0,.7-.1,1.2,0,0,.3.1.7,0,1.1-.4.3-.9,0-1.3.1h0Z'%20data-active='1'%20style='fill:%20%23b6bfc2;'%20/%3e%3cpath%20d='M21.4,24.1v-.8c.6,0,1.2-.2,1.8-.2v.8l-1.9.2h.1Z'%20data-active='1'%20style='fill:%20%23e6ebec;'%20/%3e%3cpath%20d='M22.5,11.1c-.2-.3,0-.8-.2-1.1.4,0,.8-.2,1.3,0,0,.3.1.7,0,1.1-.4.2-.8,0-1.2.1h.1Z'%20data-active='1'%20style='fill:%20%23bdc3c6;'%20/%3e%3cpath%20d='M21.3,21.2v-.8c.6,0,1.2-.3,1.8-.2v.8l-1.8.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M22.3,9.5v-.8c.4,0,2.1-.5,1.9.3s-1.4.4-1.9.4h0Z'%20data-active='1'%20style='fill:%20%23bfc4c7;'%20/%3e%3cpath%20d='M21.2,18.3v-.8l1.7-.2v.8l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e5eaeb;'%20/%3e%3cpath%20d='M21,15.4v-.8l1.7-.2c0,.3,0,.5.1.8l-1.7.2h-.1Z'%20data-active='1'%20style='fill:%20%23e6ebeb;'%20/%3e%3cpath%20d='M20.9,12.5v-.8c.5,0,1-.2,1.6-.2v.8l-1.6.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M20.8,8.9c.5,0,1-.2,1.5-.2v.8l-1.5.2v-.8Z'%20data-active='1'%20style='fill:%20%23e1e5e6;'%20/%3e%3c/g%3e%3cpath%20id='peri-implant-bone-loss'%20d='M11.3,27.7c2,7,6,10,9,10s7-3,9-10c-2,4-5,6-9,6s-7-2-9-6Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23d9534f;'%20/%3e%3c/g%3e%3cg%20id='prosthesis-implant'%20data-active='1'%3e%3cg%20id='prosthesis-implant-gum'%20data-active='1'%20style='display:%20none;%20opacity:%20.5;'%3e%3cpath%20d='M36.5,55.4v-11.7c0-.8-.9-1.5-2-1.5H4.7c-9.3,0-2,.6-2,1.4,0,2.7-.3,8.7-.4,11.7s.9,1.5,2.1,1.5h30.1c6.1,0,2-.7,2-1.5h0Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-13-1);'%20/%3e%3cpath%20d='M36.4,55.4c0-3.9-.4-7.9-.5-11.7,0-.7-1.1-.9-1.7-.8-8,0-18.5-.5-26.6-.6h-3c-.5,0-1,.4-1,.9v.6h0v.2c0,3.8-.2,7.7-.4,11.5,0,0,0,.2.4.4.5.3,3.4.2,4,.2l5.9.2c3.9,0,13.9.4,17.7.5h3c.9,0,2.1-.4,2.1-1.4,0,0,0,0,.1,0ZM36.6,55.4c0,1.1-1.3,1.6-2.3,1.6h-3c-3.7,0-13.8.4-17.7.5-1.9,0-7,.2-8.9.2-1.3.2-3.8-.5-3.6-2.9v-.7c0-3.4,0-6.9.3-10.4,0-2,1.8-1.8,3.2-1.6,9.2,0,20.3-.6,29.5-.6s2.7.5,2.9,1.9c0,4-.3,7.9-.5,11.9h0Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3c/g%3e%3cpath%20id='prosthesis-implant-crown'%20d='M23.9,59.4c-2,7.2-7.2,7.7-9-.2-.6-2.5-.9-5.8.5-7.7,1.5-2.1,4.6-2.5,6.6-1.2,2.7,1.8,2.7,6.1,1.9,9h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='prosthesis'%20data-active='1'%3e%3cpath%20id='prosthesis-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-13-19);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='prosthesis-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='telescope'%20data-active='1'%3e%3cpath%20id='telescope-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cg%20id='telescope-crown'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='telescope-crown-outside'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='telescope-crown-inside'%20d='M27.9,51.7c-3.6,13.2-13.1,14.1-16.5-.4-1.1-4.6-1.7-10.5,1-14.1,2.7-3.8,8.5-4.5,12.2-2.1,4.9,3.2,4.9,11.2,3.4,16.5v.2h-.1,0Z'%20data-active='1'%20style='fill:%20%23aaa;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='zircon'%20data-active='1'%3e%3cpath%20id='zircon-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='zircon-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-inlay'%20d='M25.9,57.8c-2.7,9.9-9.9,10.6-12.4-.3-.9-3.5-1.3-7.9.7-10.7,2.1-2.9,6.4-3.4,9.2-1.6,3.7,2.5,3.7,8.4,2.6,12.4h0c0,0-.1.2-.1.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-veneer'%20d='M28.4,52.7c-3.8,13.7-13.7,14.7-17.2-.4-1.2-4.8-1.8-11,1-14.8,2.9-4,8.8-4.7,12.7-2.2,5.1,3.4,5.1,11.6,3.6,17.2v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal'%20data-active='1'%3e%3cpath%20id='metal-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal-ceramic'%20data-active='1'%3e%3cpath%20id='metal-ceramic-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-13-2);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-ceramic-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-13-3);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gold'%20data-active='1'%3e%3cpath%20id='gold-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gold-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-inlay'%20d='M25.9,57.8c-2.7,9.9-9.9,10.6-12.4-.3-.9-3.5-1.3-7.9.7-10.7,2.1-2.9,6.4-3.4,9.2-1.6,3.7,2.5,3.7,8.4,2.6,12.4h0c0,0-.1.2-.1.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-veneer'%20d='M28.4,52.7c-3.8,13.7-13.7,14.7-17.2-.4-1.2-4.8-1.8-11,1-14.8,2.9-4,8.8-4.7,12.7-2.2,5.1,3.4,5.1,11.6,3.6,17.2v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='emax'%20data-active='1'%3e%3cpath%20id='emax-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-13-4);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='emax-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-13-5);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-inlay'%20d='M25.9,57.8c-2.7,9.9-9.9,10.6-12.4-.3-.9-3.5-1.3-7.9.7-10.7,2.1-2.9,6.4-3.4,9.2-1.6,3.7,2.5,3.7,8.4,2.6,12.4h0c0,0-.1.2-.1.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-13-6);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-veneer'%20d='M28.4,52.7c-3.8,13.7-13.7,14.7-17.2-.4-1.2-4.8-1.8-11,1-14.8,2.9-4,8.8-4.7,12.7-2.2,5.1,3.4,5.1,11.6,3.6,17.2v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-13-7);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gradia'%20data-active='1'%3e%3cpath%20id='gradia-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gradia-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-inlay'%20d='M25.9,57.8c-2.7,9.9-9.9,10.6-12.4-.3-.9-3.5-1.3-7.9.7-10.7,2.1-2.9,6.4-3.4,9.2-1.6,3.7,2.5,3.7,8.4,2.6,12.4h0c0,0-.1.2-.1.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-veneer'%20d='M28.4,52.7c-3.8,13.7-13.7,14.7-17.2-.4-1.2-4.8-1.8-11,1-14.8,2.9-4,8.8-4.7,12.7-2.2,5.1,3.4,5.1,11.6,3.6,17.2v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary-restorations'%20data-active='1'%3e%3cpath%20id='temporary-bridge-connector'%20d='M34.6,53.9c2.9-1.2,3.4-4.8,1-6.6-2.2-1.8-6.5-1.6-10.3-1.7-6.5,0-13.2-.4-19.6.4-3.9.6-6,4.9-3.5,7.6,1.6,1.6,5.6,1.7,8.5,1.7s7.5,0,11.4-.2c4.2,0,9.5,0,12.3-1.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='temporary-crown'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-inlay'%20d='M25.9,57.8c-2.7,9.9-9.9,10.6-12.4-.3-.9-3.5-1.3-7.9.7-10.7,2.1-2.9,6.4-3.4,9.2-1.6,3.7,2.5,3.7,8.4,2.6,12.4h0c0,0-.1.2-.1.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-veneer'%20d='M28.4,52.7c-3.8,13.7-13.7,14.7-17.2-.4-1.2-4.8-1.8-11,1-14.8,2.9-4,8.8-4.7,12.7-2.2,5.1,3.4,5.1,11.6,3.6,17.2v.2s-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='ortho'%20data-active='1'%3e%3cg%20id='missing-closed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M3.9,8.1c18.4,16.6,16.4,37.8,0,54.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M32.1,61.5c-18.5-16.4-16.7-37.6-.5-54.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cg%20id='ortho-ring'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='19.4'%20cy='44.8'%20rx='2.8'%20ry='11.1'%20transform='translate(-25.6%2063.6)%20rotate(-89.3)'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='10.6'%20y1='47.5'%20x2='28.5'%20y2='47.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='10.6'%20y1='41.9'%20x2='28.5'%20y2='41.9'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='9.5'%20y1='45.5'%20x2='29.5'%20y2='45.5'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='9.5'%20y1='43.6'%20x2='29.5'%20y2='43.6'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M29.4,42c.7,0,1.3.2,1.3.7v4.2c0,.3-.4.6-.8.7h-.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M9.6,47.5h-.5c-.4,0-.8-.3-.8-.7v-4.2c0-.4.6-.7,1.1-.7h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='ortho-bracket'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='17.6'%20cy='50.1'%20rx='1.2'%20ry='4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cellipse%20cx='21.9'%20cy='50'%20rx='1.2'%20ry='4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='18.7'%20y1='52.9'%20x2='20.8'%20y2='52.9'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='18.7'%20y1='47.7'%20x2='20.8'%20y2='47.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M21,49.2v-2.2c0-.5.4-.8.9-.8s1,.3,1.1.9v6.1c0,.6-.4,1-1,1s-1-.4-1-1v-2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M18.6,49.2v-2.2c0-.5-.4-.8-.9-.9s-1,.3-1.1.9v6c0,.6.4,1,1,1s1-.4,1-1v-2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='16.7'%20y1='51'%20x2='22.8'%20y2='51'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='16.7'%20y1='49.3'%20x2='22.8'%20y2='49.3'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M23.1,47.7c.5,0,.9.2.9.6v3.9c0,.3-.3.6-.6.6h-.4'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M16.5,52.9h-.4c-.3,0-.6-.3-.6-.6v-3.9c0-.4.4-.7.8-.6h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrows'%20data-active='1'%3e%3cg%20id='arrow-distal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='4.4'%20y1='61.1'%20x2='.9'%20y2='64.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='6.9'%20y1='64.8'%20x2='.8'%20y2='64.8'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='4.4'%20y1='68.4'%20x2='.9'%20y2='64.8'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-mesial'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='33.6'%20y1='68.9'%20x2='37.9'%20y2='65.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='30.5'%20y1='65.1'%20x2='38.1'%20y2='65.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='33.6'%20y1='61.5'%20x2='37.9'%20y2='65.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-down'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='38.3'%20y1='40.4'%20x2='34.5'%20y2='34.4'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.2'%20y1='44.6'%20x2='34.5'%20y2='34.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='30.4'%20y1='40.2'%20x2='34.4'%20y2='34.2'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-up'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='30.4'%20y1='38.3'%20x2='34.2'%20y2='44.5'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.2'%20y1='34.1'%20x2='34.2'%20y2='44.6'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='38.2'%20y1='38.5'%20x2='34.4'%20y2='44.5'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-rotation'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20d='M19.2,70.6c-.2,0-.8-.3-1.1-1s-.2-.9-.1-1.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M17.4,66.1c1-1.4,6.1-1.3,5.4,1.7-.1,3.5-8,.9-3.4,0'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='specials'%20data-active='1'%3e%3cg%20id='fracture-vertical'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-vertical-3'%20x1='26.8'%20y1='3.7'%20x2='11.5'%20y2='52.3'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-vertical-2'%20x1='24.3'%20y1='11.6'%20x2='10.7'%20y2='54.7'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-vertical-1'%20points='25.2%2012.8%2021.7%2013.3%2023.3%2018.8%2020.4%2018.8%2021.6%2021.6%2019.2%2021.7%2021.3%2025.6%2017.2%2025.2%2019.6%2030.5%2015.3%2030.8%2017.2%2037.3%2014.6%2036.8%2015.4%2042.4%2013.4%2042.2%2013.9%2046.2%2012%2046.4%2013.6%2050.1%2010.5%2049.7%2011.8%2053.7'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='fracture-horizontal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-horizontal-3'%20x1='12'%20y1='12.5'%20x2='27.4'%20y2='28.9'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-horizontal-2'%20x1='14.9'%20y1='15.6'%20x2='25.8'%20y2='27.2'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-horizontal-1'%20points='13.5%2017%2015.3%2016.3%2015.5%2018.5%2018.1%2017.4%2018.3%2021.1%2020.1%2019.7%2020.3%2023%2022.7%2021.6%2022.5%2025%2025.2%2023.9%2024.5%2026.4%2027%2026.1'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='parapulpal-pin'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='parapulpal-pin-shape'%20data-active='1'%3e%3cpath%20d='M25.8,42.4c.1.5,0,.6,0,.8v.8c.1.4,0,.6,0,.8.1.3,0,.6,0,.8v2.4c.1.4.4.8,1,1.1s.2.2.1.3,0,.2,0,.3,0,.2-.3.3c-1.2.2-2.5.2-3.7,0s-.3,0-.3-.2v-.6c0-.2.9-.3,1-1s0-.7,0-1.1l.2-5,.2-4.4c0-1.2.2-2.3.4-3.5s0-.2.2-.3c.1.2.1.3.2.5.3,1.2.4,2.4.5,3.6l.3,3.5v.2c.1.2,0,.5,0,.8h.2,0Z'%20data-active='1'%20style='fill:%20%230a0a0a;'%20/%3e%3cpath%20d='M24.3,46c-.1,0-.2-.2-.2-.3v-3.7l.2-3.9.2-2.2h.1v9.3c0,.3,0,.6-.3.8Z'%20data-active='1'%20style='fill:%20%23f0edee;'%20/%3e%3cpath%20d='M25.2,45.4h0v-1.7h0v-1h0v-6.5c0,.2.1.5.1.7v.5l.3,3.4v3.2l.2,1.8v.3h-.1c-.2-.2-.3-.4-.5-.6h0Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cpath%20d='M25.2,45.4v-.2c-.1,0-.3-10.5-.3-10.5v-.3l.2.7s.1.2,0,.2h0c-.1,0,0,.7,0,.8v6.2h0v2.8h0v.3s.1,0,0,0Z'%20data-active='1'%20style='fill:%20%239c9c9c;'%20/%3e%3cpath%20d='M24.3,47.1c.2.3.5.6.7.9s0,.3,0,.5c-.2.4-.8.4-1.4.5.9-.7.2-1.1.9-1.9h-.2Z'%20data-active='1'%20style='fill:%20%23c7c7c7;'%20/%3e%3cpath%20d='M25.7,47.1c.5.4.3.7.4,1v.2c0,.2.3.5.6.7h-.9c-.7-.2-.8-.8-.7-1s.4-.6.6-.8h0Z'%20data-active='1'%20style='fill:%20%23b5b4b6;'%20/%3e%3cpath%20d='M25.2,49.1c.4,0,1.7,0,2,.2v.5h-1.5c-.5,0-.4,0-.4-.2v-.4h-.1Z'%20data-active='1'%20style='fill:%20%23bababa;'%20/%3e%3cpath%20d='M23.6,49.7v-.5h1.3c0,.2,0,.4-.2.5s-.8,0-1.2,0h.1Z'%20data-active='1'%20style='fill:%20%23cdcdcd;'%20/%3e%3cpath%20d='M23.7,50h2.8-2.7c-.9,0,0,0-.1,0s0,0,0,0Z'%20data-active='1'%20style='fill:%20%239da1a2;'%20/%3e%3cpath%20d='M23.7,49.2v.5h-.6v-.5c.2,0,.5,0,.7-.2h-.1v.2Z'%20data-active='1'%20style='fill:%20%238b8d8c;'%20/%3e%3cpath%20d='M24.6,46.4c.1,0,.2,0,.3.2l-.3.2s-.2,0-.2-.2c0,0,.1,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23acaaac;'%20/%3e%3cpath%20d='M25.4,46.4h.2l-.2.2c-.1,0-.2,0-.3-.2h.3Z'%20data-active='1'%20style='fill:%20%23b2b0b3;'%20/%3e%3cpath%20d='M24.3,46.6h.2s-.1,0-.2.2h-.2c-.1,0,0,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23e4e1e2;'%20/%3e%3cpath%20d='M25.4,46.8c-.2.2-.1.2-.3.3v-.4l.3.2h0Z'%20data-active='1'%20style='fill:%20%238b8989;'%20/%3e%3cpath%20d='M24.3,46.2h.2v.2h-.3s0-.2.2-.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e3e3;'%20/%3e%3cpath%20d='M25.6,46.7h.4c.1,0,0,0-.1.2,0,0-.2,0-.2-.2,0,0-.1,0,0,0Z'%20data-active='1'%20style='fill:%20%23cacaca;'%20/%3e%3cpath%20d='M24.7,46.8c.1,0,.2,0,.3-.2v.4c-.1,0-.2,0-.3-.2Z'%20data-active='1'%20style='fill:%20%237a797b;'%20/%3e%3cpath%20d='M25.5,46.3h.3s0,.2-.1,0-.1,0-.2,0Z'%20data-active='1'%20style='fill:%20%23d2d1d3;'%20/%3e%3cpath%20d='M24.7,46.3c.1,0,.2,0,.3-.2v.3h-.3Z'%20data-active='1'%20style='fill:%20%237f7e80;'%20/%3e%3cpath%20d='M25.1,46.4s0-.6,0-.2c0,0,.2,0,.1,0h-.2.1v.2Z'%20data-active='1'%20style='fill:%20%237c7b7f;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='calculus'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='calculus-shape-8'%20d='M23.5,36.6c.4,0,.8-.2.9-.4.3-.2.4-.6-.1-.7-.7-.2-1.4.8-.8,1.1h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-7'%20d='M15.3,36c-.1.4.2.8.4.9.2.3.6.4.7,0,.2-.7-.8-1.4-1.1-.8h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-6'%20d='M12.3,37c.5.2,1.1-.3,1.4-.6.4-.3.7-.9-.1-1.1-1-.3-2.1,1.2-1.3,1.7h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-5'%20d='M15.3,38.4c-.5.2-.6,1-.7,1.3,0,.5,0,1.1.8.8.9-.4.8-2.3-.2-2.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-4'%20d='M12.4,40.2c.5-.2.7-.9.7-1.3.1-.5,0-1.1-.8-.8-1,.4-.9,2.2,0,2.1h.1Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-3'%20d='M25.4,35.1c-.1.5.4,1.1.6,1.3.4.4.9.6,1.1-.2.2-1-1.3-2-1.8-1.2h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-2'%20d='M23.6,39.9c.5,0,.9-.7,1.1-1,.3-.5.4-1-.5-1s-1.6,1.8-.7,2h.1Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-1'%20d='M27,40.2c.5,0,.7-.9.8-1.2.2-.5,0-1.1-.7-.9-1,.3-1,2.2-.1,2.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='plan'%20data-active='1'%3e%3cg%20id='extraction-plan'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M5.8,59.4c1.4-4,28.3-51.6,29.1-53.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3cpath%20d='M6.2,6.2c2.7,3.5,19.9,39.4,23.4,48.1.6,1.5,1.2,3,2,4.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3cg%20id='crown-needed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-needed-shape'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='fill:%20%23c83014;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='crown-needed-path'%20d='M17.2,31.5c-1.6,3.3-3.3,6.5-4.8,9.7-.6,1.4-1.2,2.7-1.4,4.1,0,.3,0,.5.1.5.8,0,1.5-1.5,2.1-2.4,1.7-2.9,3.2-7.1,5.3-9.3,1.4-1.5,3.3-2.7,3-.8-1.5,7.4-7.7,13.1-9.5,20.2-.4,1.6-.9,3.9,0,4.4,1.7-.4,2.6-3.9,3.6-6.1,2.1-4.7,5.9-12.4,8.5-15.9,2.3-2.4,1.8,3.5.1,7.3-1.7,4.4-9.1,11.7-7.6,17.4,2.5.9,7-12.1,9.1-14.5,2.8-3.9,1.6,3.1,0,6.7-.9,2.3-2.4,4.5-3.2,6.9-.5,1.7.2,1.8.9,1.1,1.6-1.4,3.2-3.9,4.6-6.1'%20data-active='1'%20style='fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='crown-replace'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-replace-shape'%20d='M29.7,53.1c-4.4,16.1-16.1,17.2-20.2-.5-1.4-5.6-2.1-12.9,1.2-17.3,3.4-4.7,10.3-5.5,14.9-2.6,6,4,6,13.6,4.2,20.1v.2h0Z'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23c83014;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", a0 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20Part%20of%20React%20Odontogram%20Modul%20-%20https://github.com/ZoliQua/React-Odontogram-Modul%20-%20SVG%20Version:%202.5.0%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20id='premolar_x5F_tooth'%20version='1.1'%20viewBox='0%200%2039.8%2071.2'%3e%3cstyle%3e%20[data-active='0']%20{%20display:%20none;%20}%20%3c/style%3e%3cdefs%3e%3clinearGradient%20id='linear-gradient-14-0'%20x1='-2098.8'%20y1='-10005.9'%20x2='-2095.5'%20y2='-10005.9'%20gradientTransform='translate(-537.8551%20-10182.7775)%20rotate(-15)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-1'%20x1='-27724.8'%20y1='3821.9'%20x2='-27721.5'%20y2='3821.9'%20gradientTransform='translate(-25870.4377%20-10617.4467)%20rotate(-165.5)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-2'%20x1='-928'%20y1='-8584'%20x2='-924.7'%20y2='-8584'%20gradientTransform='translate(-144.8074%20-8614.9736)%20rotate(-7.3)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-3'%20x1='-27086.7'%20y1='5773.7'%20x2='-27083.4'%20y2='5773.7'%20gradientTransform='translate(-26274.9104%20-8694.4515)%20rotate(-173.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-4'%20x1='-2586.9'%20y1='-10554.6'%20x2='-2583.6'%20y2='-10554.6'%20gradientTransform='translate(-542.2936%20-10833.3481)%20rotate(-16.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-5'%20x1='-26854.8'%20y1='-856.4'%20x2='-26851.5'%20y2='-856.4'%20gradientTransform='translate(-25581.4928%20-14735.3847)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-6'%20x1='-26857.4'%20y1='-850.2'%20x2='-26854'%20y2='-850.2'%20gradientTransform='translate(-25581.4928%20-14735.3847)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-7'%20x1='-9941.2'%20y1='-14534.4'%20x2='-9937.7'%20y2='-14534.4'%20gradientTransform='translate(-3439.1657%20-17844.7224)%20rotate(-47.9)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-8'%20x1='20.3'%20y1='-4027.9'%20x2='20.3'%20y2='-3989.4'%20gradientTransform='translate(0%20-3980.1409)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23b70000'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23eba13d'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-9'%20x1='-2097.2'%20y1='-10006.2'%20x2='-2093.9'%20y2='-10006.2'%20gradientTransform='translate(-537.8551%20-10182.7775)%20rotate(-15)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-10'%20x1='-27723.6'%20y1='3821.9'%20x2='-27720.3'%20y2='3821.9'%20gradientTransform='translate(-25870.4377%20-10617.4467)%20rotate(-165.5)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-11'%20x1='-926.2'%20y1='-8583.1'%20x2='-922.9'%20y2='-8583.1'%20gradientTransform='translate(-144.8074%20-8614.9736)%20rotate(-7.3)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-12'%20x1='-11693.7'%20y1='6913.8'%20x2='-11690.4'%20y2='6913.8'%20gradientTransform='translate(249.5197%2013596.5612)%20rotate(58.4)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23ff422a'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23bf0030'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-13'%20x1='-2587.1'%20y1='-10555.3'%20x2='-2583.8'%20y2='-10555.3'%20gradientTransform='translate(-542.2936%20-10833.3481)%20rotate(-16.7)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-14'%20x1='-26855.5'%20y1='-857.7'%20x2='-26852.2'%20y2='-857.7'%20gradientTransform='translate(-25581.4928%20-14735.3847)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-15'%20x1='-26858.7'%20y1='-850'%20x2='-26855.3'%20y2='-850'%20gradientTransform='translate(-25581.4928%20-14735.3847)%20rotate(-148.4)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-16'%20x1='-9940.7'%20y1='-14534'%20x2='-9937.2'%20y2='-14534'%20gradientTransform='translate(-3439.1657%20-17844.7224)%20rotate(-47.9)%20scale(1.1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-17'%20x1='20.3'%20y1='-4018.9'%20x2='20.3'%20y2='-4028.6'%20gradientTransform='translate(0%20-3980.1409)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23cf0'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b4c500'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-18'%20x1='20'%20y1='-4015.1'%20x2='20'%20y2='-4022.6'%20gradientTransform='translate(0%20-3980.1409)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23c8c9c9'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23828282'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-14-0'%20cx='20'%20cy='-3016'%20fx='20'%20fy='-3016'%20r='11.5'%20gradientTransform='translate(-.4%20-2966.1409)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23ececec'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23cfcfcf'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23bababa'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23aeaeae'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23aaa'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-1'%20cx='-300.4'%20cy='-3017.8'%20fx='-300.4'%20fy='-3017.8'%20r='10.2'%20gradientTransform='translate(380.4131%20-2966.1409)%20scale(1.2%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fefefe'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f8d6d4'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f2b5b2'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23ee9b98'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23eb8985'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23e97e79'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e97b76'%20data-active='1'%20/%3e%3c/radialGradient%3e%3clinearGradient%20id='linear-gradient-14-19'%20x1='20.1'%20y1='3083.3'%20x2='20.1'%20y2='3073.7'%20gradientTransform='translate(0%20-3026.6338)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23cd986a'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-14-2'%20cx='20.1'%20cy='18.2'%20fx='20.1'%20fy='18.2'%20r='11.9'%20gradientTransform='translate(0%2069.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-3'%20cx='19.8'%20cy='20.1'%20fx='19.8'%20fy='20.1'%20r='14.6'%20gradientTransform='translate(0%2069.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-4'%20cx='20.1'%20cy='18.2'%20fx='20.1'%20fy='18.2'%20r='11.9'%20gradientTransform='translate(0%2069.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-5'%20cx='20'%20cy='20.1'%20fx='20'%20fy='20.1'%20r='14.5'%20gradientTransform='translate(-.5%2069.9)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-6'%20cx='20.1'%20cy='-993.7'%20fx='20.1'%20fy='-993.7'%20r='8'%20gradientTransform='translate(0%20-938.1)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-7'%20cx='19.7'%20cy='-987.5'%20fx='19.7'%20fy='-987.5'%20r='12.7'%20gradientTransform='translate(0%20-938.1)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3c/defs%3e%3cg%20id='base'%20data-active='1'%3e%3cpath%20id='bone-base'%20d='M39.6,18.2l-2.8,1.3c-2.6,1.6,0,9.7-2,12.1,0,4.9-4.5,3.9-5.9,3.8-3.9-.2-13.1,0-17.7,0s-5-3.3-5.2-3.1c-2.1,0-2.2-12.8-2.2-12.8l-1.5-2.2c-.2-.4-2.3-1-2.3-1.6V0h39.7v18.2h-.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cpath%20id='gum-base'%20d='M39.2,20c-1.1,1-2.7,1.7-3.2,3-1.1,3.5-.2,7.6-1.7,11-2,5.1-6.1.4-10,.5-3.9,0-8.2-.2-11.9.5-2.3.6-4.6,2.6-7,1.2-5.7-3.7-1.8-12.6-3.9-17.6-.2-.9-2-2.3-1.1-2.8,1.1-.5,4.2,1,4.5,2.2,2,3.7-1.9,13.9,3.5,15.2,2.6.3,8.3-.6,13.2-.9,3.7-.6,9.4.9,11.4-2.3,2-3.2-.1-8.1,2.5-11.1s5.5-1.2,3.8.9h0v.2h-.1Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3c/g%3e%3cg%20id='mods'%20data-active='1'%3e%3cpath%20id='parodontal'%20d='M10.5,37c1.1.5,2.5.2,3.8.3,3.6.5,6.5.8,9.8,0,1.3-.3,3-.2,4.2-.3.8,0,1.3-.4,1.4-1.2.1-2.6.5-5.2.6-7.9,0-1.8.9-5-.5-6.4-1.4-1.1-4-1.7-6-1.3-2,.6-1,4.2-2.1,5.5s-1.8.5-2.2,0-.7-2.3-1-3c-1.4-3.5-6.5-1.2-8.9-.1-.8.4-.5,2-.6,2.9-.2,1.5,0,3.4,0,5,.3,2.3-.8,4.7,1.1,6.3h0l.2.2h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ffa46a;'%20/%3e%3cg%20id='inflammation'%20data-active='1'%3e%3cg%20id='cysta'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='cysta-outside'%20d='M9.6,5.4c-2.6,2.5-1.6,9.3,1.6,11.2,3.2,1.9,4.8,1.9,7,2.1,4.1.4,11.4-.5,12.9-6.7,1.5-7.8-6.5-9.7-12.1-9.4-2.9,0-7.1.6-9.4,2.8Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='cysta-inside'%20d='M10.5,5.9c-2.4,2.3-1.4,8.3,1.4,9.9s4.5,1.6,6.4,1.8c3.8.3,10.4-.5,11.8-5.9,1.4-7-5.8-8.6-10.9-8.4-2.7,0-6.5.5-8.6,2.4h0v.2h0Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='granuloma'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='granuloma-outside'%20d='M10,5.9c-2.9,1.8-1.7,6.7,1.7,8s5.3,1.4,7.5,1.5c4.5.3,12.3-.4,13.9-4.8,1.7-5.6-7-6.9-13-6.7-3.2,0-7.7.4-10.2,2h0Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='granuloma-inside'%20d='M10.9,6.6c-2.6,1.5-1.5,5.4,1.5,6.5s4.8,1.1,6.8,1.2c4.1.2,11-.3,12.5-3.8,1.6-4.6-6.1-5.6-11.5-5.5-2.8,0-6.9.3-9.1,1.6,0,0-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='abscess'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='abscess-inside'%20d='M11.5,6.9c-.9.7-2.5-1.6-5.8,1.2-3.3,2.8,4.4,2,4.8,4.5.4,2.5-2.3,2.8-1.7,3.2s6.6-1.8,7.1-1.7c1.1.4,2,.4,2.9.5,1.3.1,3,0,4.5-.4s2.6.3,3.3-.4,7.5-.6,7.3-1.4-4.3-2.9-4.2-3.4c.2-.9,3.6-3.3,3.4-3.9s-6.4,1.7-7,1.2-.3-1.7-.7-1.9c-.7-.3-1.8,0-2.6-.2s-2.3-.4-3.3-.4-2.5.2-3.9.6-1.8.9-2.4,1.5l-1.4-1-.3,1.9h0Z'%20data-active='1'%20style='fill:%20%23feffd5;%20stroke:%20%23ffa46a;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='mobility'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-mobility-2'%20d='M28.8,12.8l2.6-1.4c-.9,1.7-1.8,3.4-2.8,5.1,1-.5,1.9-1,2.9-1.4-1.2,2-2.4,4-3.5,6.1,1.1-.3,2.2-.6,3.3-.9-1,1.5-2,3-3.1,4.5.7-.2,1.4-.4,2.1-.5-.7,1.2-1.4,2.3-2.1,3.5.9-.5,1.8-.8,2.7-1-.8,1.1-1.6,2.3-2.3,3.6.6-.3,1.2-.4,1.9-.4-.7.9-1.5,1.8-2.2,2.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3cpath%20id='tooth-mobility-1'%20d='M9.9,13c1.1-.4,2.4-.2,3.4.7-1.4,1.3-2.8,2.5-4.3,3.5,1.4-.2,2.9-.1,4.4.3-1.4,1.2-2.7,2.5-4,3.8,1.1,0,2.2.2,3.2.5-.9.9-1.9,1.8-2.8,2.7.8,0,1.7.2,2.5.6-.9,1.2-1.8,2.6-2.5,4,1-.2,2-.5,3-.7-1.4,1.1-2.6,2.7-3.7,4.4.8.1,1.7,0,2.5-.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth-variants'%20data-active='1'%3e%3cpath%20id='no-tooth-after-extraction'%20d='M18.9,35.5c-3,0-8.2,2.4-7.2-1.6,2.2-9.1-1.5-21.4.5-24.5,1.8-2.2,3.5,0,4,2.3,1.2,4.3.9,9.8,1.8,14.4.4,1.9,2.5,2.3,3.9,1.5,1-.5,1.2-2,1.3-3.7.4-4.1.5-8.6,1.4-12.2.4-1.6.8-2.8,2.4-2.9,4.3,0-.5,15.5,1.1,23.4.6,2.1-1.6,3.6-3.2,3.5,0,0-1.2.3-6,0,0,0,0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='tooth-under-gum'%20d='M16,11.9c.3.9.8,1.9,1.7,2.3.8.3,1.4-.4,1.5-1.1.5-2.4-.7-5.1-.2-7.5.3-.9,1.2-.9,1.7-.2.7.8.9,1.9,1.2,2.9.5,1.8.2,3.5.1,5.3-.2,2,0,4,1,5.8,1.5,3.6,5.5,9.3,1,11.7-.7.2-1.5,0-2.3,0-1.6-.2-2.5.9-3.9,1.4-4.3,1.4-4.5-6.2-4-8.7.3-1.2.6-2.4.4-3.6-.3-2.5-1.4-5-1.7-7.4-.3-1.6-.3-3.2-.2-4.9,0-.8.6-3,1.7-1.8,1,1.7,1.2,4.1,1.8,5.8,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-incisal'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4,1.7,7.5,6.8,19.4-.3,23.6s-.4-.9-1-.7c-.8,0-1.1-2.3-2-2.5s-2.2-2.9-2.9-3.1c-.8-.3-2.3,1.2-3.8,1.2s-2.8-1.3-3.5-1c-1.1.4.3,7.3-1,7.5-8.9,1.4-6.7-14.5-4.9-19.4.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal-incisal'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4.7,3,1.6,6.7,2.3,10.3s-2.9,1.9-2.9,3.4-3.2,1.2-3.7,2.6-.6,2.1,0,3.1c1.2,2.3,4,4.4,2.2,5.1-1.4.2-4.7-4.3-6.3-4.7-1.5-.5-1.7,0-3,.4s-1.9-2.1-3.4-1.8c-2.3.4-3.4,6.3-4.1,4.8s-.6-2.3-.7-3.7,1.9-1.8,1.8-2.6c0-2.2,2.7-1.7,3-3.8s-2.3-3.8-1.9-4.8-2.1-4.5-1.7-5.6.8-2.7.9-4.1c.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2h.1v-.3s.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4.7,3,1.6,6.7,2.3,10.3s-2.9,1.9-2.9,3.4-3.2,1.2-3.7,2.6-.6,2.1,0,3.1c1.2,2.3,4,4.4,2.2,5.1-1.4.2-2.9-.5-4.5-.9-3-1-5.1,1-8,1.5-3.9.6-4.7-2.1-5-5.7s1.9-1.8,1.8-2.6c0-2.2,2.7-1.7,3-3.8s-2.3-3.8-1.9-4.8-2.1-4.5-1.7-5.6.8-2.7.9-4.1c.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2h.1v-.2s.1,0,0,0h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-incisal'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4.6,2.8,1.8,6.3,2.5,9.7s-2.4,1.8-2.2,2.9c.3,2.1-1.1,2.3-1.5,4s-2.6-2.3-3.6-1.3-.1,3.2-1.4,3.6c-1.4.2-1.9-1.3-3.5-1.7-1.1-.4,1.1,5.9.2,6.1-1.6.4-3.1,1.3-5,1.6-8.9,1.4-6.7-14.5-4.9-19.4.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4.7,3,1.6,6.7,2.3,10.3s-2.9,1.9-2.9,3.4-3.2,1.2-3.7,2.6-.6,2.1,0,3.1c1.2,2.3,4,4.4,2.2,5.1-1.4.2-2.9-.5-4.5-.9-3-1-5.1,1-8,1.5-8.9,1.4-6.7-14.5-4.9-19.4.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal-incisal'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4,1.8,8,7.5,21.1-2,24.4-1.4.2-2.9-.5-4.5-.9-1.1-.4-.9-3.5-1.9-3.2s-2-3.5-2.6-3.6c-1,0-.2-9.1-2.5-2.9-2.5.4-1.9,5.1-2.9,3.4s-1.6.9-1.7-.9,0-2,0-3.2-2.6-1.6-2.4-2.9.7-3.4,1.1-4.5c.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal'%20d='M17.1,22.6c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4,1.8,8,7.5,21.1-2,24.4-1.4.2-2.9-.5-4.5-.9-3-1-5.1,1-8,1.5-1.1.2-2.1,0-2.9-.3-2-.8,4.3-5.3,3.9-8s-3.9-.2-3.9-1.4,1.8-3.1,1.9-4c.2-1.6-4.9-2-4.6-3.3s.5-1.8.7-2.5c.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-crownprep'%20d='M17.1,22.7c.3,3.5,3.7,7.8,6,3,1.6-4.3.6-9.3,1.8-13.7.3-1.1,1.1-2.6,2.4-2.4,3.9,1.5,3.1,12.1,2.1,15.5-.7,3.2-.9,6.2-.9,9.4s1.5,4.3,1.8,6.5-1.8-.3-1.8.5-.5,3.9-.8,4.8c-.7,1.6-2.7,1.1-3.6.9-2-.4-3.4-.3-5,0-2.1.5-1.7.9-4.9.7-2.2-1.3-2.2-3.9-1.7-6.1s-2.2,0-2.2-.6c.5-7.9-.9-16.2.4-24.2.5-2.6.5-6.1,2.8-7.8.9-.5,1.6.2,2,1,1.5,3.8.9,8.6,1.6,12.2v.2h0v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-radix'%20d='M17.1,22.7c.3,3.5,3.7,7.8,6,3,1.6-4.3.6-9.3,1.8-13.7.3-1.1,1.1-2.6,2.4-2.4,3.9,1.5,3.1,12.1,2.1,15.5-.7,3.2-.9,6.2-.9,9.4s1.5,4.3,1.8,6.5-4.6,3.8-9.5,3.7-9.9-2.7-9.9-3c.5-7.9-1.5-16.7-.2-24.7.5-2.6.5-6.1,2.8-7.8.9-.5,1.6.2,2,1,1.5,3.8.9,8.6,1.6,12.2v.2h0v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='tooth'%20data-active='1'%3e%3cpath%20id='tooth-base'%20d='M17.1,22.4c.3,1.9.9,4.3,2.6,5.3,1.5.9,2.9-.4,3.4-1.8,1.7-4.8.3-10.7,2.2-15.5.8-1.7,2.6-1.5,3.4.2,1,1.9,1.1,4.3,1.4,6.5.3,3.8-.7,7.3-1.6,11-1,4-1.2,8.3,0,12.4,1.8,8,7.5,21.1-2,24.4-1.4.2-2.9-.5-4.5-.9-3-1-5.1,1-8,1.5-8.9,1.4-6.7-14.5-4.9-19.4.9-2.3,1.9-4.7,2.1-7.3.3-5.2-1.1-10.8-.8-15.9,0-3.3.5-6.8,1.2-10.1.2-1.7,2.2-5.9,3.9-3.2,1.4,3.9.9,8.8,1.6,12.6,0,0,0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='tooth-base-beauty'%20data-active='1'%3e%3cpath%20id='tooth-base-beauty-1'%20d='M30,52.7s0-.2.1-.2v.2c0,1.4,0,2.8-.2,4.2s-1.2,3.2-2.3,4.1-.5.3-.8.2c.1-.4.3-.5.5-.8,1.3-2.2,2.2-4.7,2.6-7.6h0Z'%20data-active='1'%20style='fill:%20%23fefdfd;'%20/%3e%3cpath%20id='tooth-base-beauty-2'%20d='M16.2,59.9c1.7-.8,4.5-1.2,6.1.6-1.5-.4-2.9-.4-4.4,0l-2.2.8c-.8.3-1.6.4-2.3,0l2.9-1.4s-.1,0,0,0c0,0-.1,0-.1,0Z'%20data-active='1'%20style='fill:%20%23fefefe;'%20/%3e%3c/g%3e%3cg%20id='tooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base-2'%20d='M14.6,11.4c.9.6,0,3.7.3,6.1,0,3.3.6,7,2.2,9.8.8,1.2,1.5,2,2.8,2.1,1,.2,2.1,0,2.8-.5,2.2-1.6,3.7-8.5,4-12.2.2-1.1.3-6.9,1.4-3,.9,3.6-.7,6.1-1.2,10-.9,3.1-2.2,6.6-1.7,10.9.3,2.6,1.4,5.8,1.9,8.3s-.8,2.4-3,1.3c-1.6-.6-2.8-2.2-4.7-1.8-2.9.6-5,3.5-5.9,3-.4-.2-.6-1.7-.4-2.1.5-2.5,1.4-5,1.6-7.5.2-2.6-.2-5.4-.5-8.1-.3-2.6-2-15.7.4-16.6h0v.3h0Z'%20data-active='1'%20style='fill:%20%23ff422a;'%20/%3e%3cpath%20id='tooth-inflam-pulp-base-1'%20d='M16.8,33c.3-.7,0-1.5,0-2.3.4,1.7.7,4.4.5,6.3,0,.5-.3,1.5-.4,1.8,0,.2,0,0,.2-.5.2-.4.4-.8.7-1,.2,0,.4-.2.5-.2,0-.2,0-.3-.2-.6-.6-1.1-.7-2.5-.7-3.9s0-1.5,1-.4c1.9,1.7,2.9,0,4.4-.8.4,0,0,2.3,0,3.3s-.5,1.8-1,2.5h0c.6-.2,1,.2,1.3.8.2.5.3.8.3.7-.6-2.9-.6-6.2.6-9,0,.8-.3,2.6-.2,3.7-.2,2.3,1.9,6.4,0,7.5-1,.3-2.5-.9-4-.8-1.2,0-2.5,1.1-3.6.4-1.7-1.5-.2-5.5.4-7.3h.2s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='pulp-inflam-path-8'%20d='M27.9,24.5h0v-.2c-.3-.1-.6-.2-.8-.1-.6.2-1.3.3-1.8.6s-.9.7-.1.8,2.1-.2,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-0);'%20/%3e%3cpath%20id='pulp-inflam-path-7'%20d='M11.4,23.7h0v.2c0,.2.3.4.6.5.6.2,1.3.3,1.9.4s1,0,.5-.6-2-.9-2.9-.4h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-1);'%20/%3e%3cpath%20id='pulp-inflam-path-6'%20d='M29.1,16.9h0v-.2c-.2-.2-.5-.3-.7-.2-.6,0-1.3.1-1.9.4s-1,.5-.1.7,2.1,0,2.8-.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-2);'%20/%3e%3cpath%20id='pulp-inflam-path-5'%20d='M11.2,16.4h0v.2c0,.2.4.4.6.4.6,0,1.3.2,1.9,0s1-.3.3-.7-2.1-.5-2.9,0h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-3);'%20/%3e%3cpath%20id='pulp-inflam-path-4'%20d='M16,18.6h0s0-.1-.1-.2c-.2-.1-.5-.1-.8-.1-.6,0-1.2.4-1.8.7s-.8.6,0,.7,2.1-.3,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-4);'%20/%3e%3cpath%20id='pulp-inflam-path-3'%20d='M24.8,12.3h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-5);'%20/%3e%3cpath%20id='pulp-inflam-path-2'%20d='M23.9,19.1h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-6);'%20/%3e%3cpath%20id='pulp-inflam-path-1'%20d='M15.3,11.5h-.2c-.3,0-.5.2-.8.3-.5.4-.9,1-1.3,1.6s-.4,1,.3.7,1.7-1.4,1.9-2.6h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-7);'%20/%3e%3c/g%3e%3cg%20id='tooth-healthy-pulp'%20data-active='1'%3e%3cpath%20id='tooth-healthy-pulp-2'%20d='M14.7,10.8c.7,1.6,0,4,.2,5.8.2,4,.7,9.8,3.7,12.7,1.3,1,3,.7,4.2-.4,3-3.2,3.9-12.1,4.5-16.6.3-1.1.8.4.9.8.9,3.7-.9,7.7-1.6,11.2-.9,3-1.9,6.8-1.2,10.6.7,4.3,4,10.9-3.7,7.2-1.3-.6-2.9,0-4.2.5-1.1.4-2.2,1.6-3.1,1-.5-.4-1.3-1.3-1.3-2s.2-1.3.3-1.9c.9-3.8,1.1-7.8.8-11.7,0-1.3-2.3-16.9.3-17.3h.2Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3cpath%20id='tooth-healthy-pulp-1'%20d='M16.8,32.1c.3-.7,0-1.7,0-2.5.4,1.9.7,4.9.5,7,0,.5-.3,1.6-.4,2,0,.2,0,0,.2-.5s.4-.9.7-1.1c.2,0,.4-.2.5-.3,0-.2,0-.4-.2-.6-.6-1.3-.7-2.8-.7-4.4s0-1.7,1-.5c1.9,1.9,2.9,0,4.4-.9.4,0,0,2.5,0,3.6s-.5,2-1,2.8h0c.6-.2,1,.2,1.3.9.2.5.3.9.3.7-.6-3.3-.6-6.9.6-10.1,0,.9-.3,2.9-.2,4.1-.2,2.5,1.9,7.2,0,8.4-1,.4-2.5-1-4-.9-1.2,0-2.5,1.2-3.6.5-1.7-1.7-.2-6.2.4-8.1h.2Z'%20data-active='1'%20style='fill:%20%23f6a09b;'%20/%3e%3c/g%3e%3cpath%20id='tooth-bruxism-wear'%20d='M13.8,57.4c.5.5,1,1,1.7.8.5,0,1.2-.5,1.8-.4.5,0,.9.4,1.3.6.9.4,1.7-.3,2.5-.7,1.3-.8,2.2.8,3.4,0,.9-.7,1.5-1.4,2.3-.5.4.3.8.9,1.3.5.4-.3.8-.9,1.4-.9,1.1.2,1.6,1.6,1.8,2.5.2,1.2-.6,2.4-1.7,3.5-3.2,4.1-5.5.7-9.5.9-1.5,0-3,.9-4.4,1.5s-3,0-4.6-.3c-1.6-.4-2.8-1.8-3.3-3.3-.2-1.1-.5-3-.2-4,1-1.7,4.8-1.7,5.9-.5h.1s.2.3.2.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='tooth-bruxism-neck-wear'%20d='M23.6,48.4c-.4-.3-.7-.6-1.3-.5-.4,0-.9.3-1.4.2-.4,0-.7-.2-1-.3-.7-.2-1.3,0-1.9.3-1,.4-1.6-.5-2.6,0-.7.4-1.1.7-1.7.2-.3-.2-.6-.5-1-.3-.3.2-.6.5-1.1.5-.8,0-1.2-.9-1.3-1.4,0-.7.5-1.3,1.3-1.9,2.4-2.2,4.1-.3,7.1-.4,1.1,0,2.3-.5,3.3-.8s2.3,0,3.4.2c1.2.2,2.1,1,2.4,1.9.1.6.3,1.7.1,2.2-.8.9-3.6.9-4.4.2h0v-.2c-.1,0,0,0,0,0h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='milktooth'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='milktooth-base'%20d='M17,21.9c.4,3.5,3.9,7.9,6.5,3.3,2.1-4.7.3-10.6,2.6-15.3.4-.8,1.3-1.4,2.2-1.1,2.5,1,2.6,4.6,3,7,.8,5.4-1.8,10.5-2.4,15.8-.4,3.1.2,6.3.9,9.3.7,5.1,4.1,11.4,4.4,16.8.5,6.1-5.3,8.4-10.2,6-1-.6-1.7-1.8-2.9-2-1.9-.2-4.5,2.5-7,3.2-1,.3-2.2.3-3.2,0-6.5-1.9-4.6-13.7-3-18.6,1-2.6,2.3-5.2,2.5-8,.4-5.6-1.2-11.3-.8-16.8,0-2.5.4-5.1.9-7.6.4-1.8.8-3.9,2.2-5.1,1.2-1.1,2.4,0,2.8,1.3,1.2,3.8.8,8,1.5,11.7v.2h0Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='milktooth-beauty'%20data-active='1'%3e%3cpath%20id='milktooth-beauty-1'%20d='M31.5,52.9v-.2.2c.2,1.4.5,2.8.5,4.2s-.7,3.3-1.6,4.4-.4.4-.8.3c0-.4.2-.5.4-.9.9-2.4,1.5-5,1.4-7.9h.1Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cpath%20id='milktooth-beauty-2'%20d='M15.5,60.1c1.5-1.1,4.2-2.1,6.1-.6-1.5,0-2.9.2-4.3.9l-2,1.2c-.7.5-1.5.7-2.3.5l2.6-1.9h-.1Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3c/g%3e%3cg%20id='milktooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base'%20d='M13.7,9.4c.5,1.2.3,3.2.3,4.6,0,4.6.3,8.6,2.2,12.5,1.1,2.6,4.5,4.2,6.8,2.3,2.9-2.9,3.7-8.9,4.4-13.3.6-8.5,2.6-2.4,2.2,1.8-.3,6-3.3,11.2-3,17.4-.5,3.3,5,13-1.2,12.3-2.2-.5-4.4-2.3-6.8-1.6-1.7.4-3.5,1.7-4.6,2.2-.6.3-1.4.2-1.9-.2-2.7-2.2,0-5.8.5-8.5,1.1-3.9,0-8.1-.4-12.1-.3-3.5-.6-8.6-.2-13,.1-1.1.6-4.9,1.6-4.5h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-8);'%20/%3e%3cpath%20id='pulp-inflam-path-81'%20d='M29.5,24.4h0v-.2c-.3-.1-.6-.2-.8-.1-.6.2-1.3.3-1.8.6s-.9.7-.1.8,2.1-.2,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-9);'%20/%3e%3cpath%20id='pulp-inflam-path-71'%20d='M10.2,23.4h0v.2c0,.2.3.4.6.5.6.2,1.3.3,1.9.4s1,0,.5-.6-2-.9-2.9-.4h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-10);'%20/%3e%3cpath%20id='pulp-inflam-path-61'%20d='M30.9,15.8h0v-.2c-.2-.2-.5-.3-.7-.2-.6,0-1.3.1-1.9.4s-1,.5-.1.7,2.1,0,2.8-.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-11);'%20/%3e%3cpath%20id='pulp-inflam-path-51'%20d='M12.5,16.9h.2c.2-.2.4-.4.2-.6-.4-.5-.9-1.4-1.5-1.8s-.9-.6-.7.2c.2.8.9,2,1.8,2.3h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-12);'%20/%3e%3cpath%20id='pulp-inflam-path-41'%20d='M16,19.3h0s0-.1-.1-.2c-.2-.1-.5-.1-.8-.1-.6,0-1.2.4-1.8.7s-.8.6,0,.7,2.1-.3,2.7-1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-13);'%20/%3e%3cpath%20id='pulp-inflam-path-31'%20d='M26.1,11.6h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-14);'%20/%3e%3cpath%20id='pulp-inflam-path-21'%20d='M25,20h0v.2c0,.3.3.5.5.7.5.4,1.2.7,1.8.9s1.1.2.6-.5-1.7-1.4-2.8-1.4h-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-15);'%20/%3e%3cpath%20id='pulp-inflam-path-11'%20d='M15.4,10.8h-.2c-.3,0-.5.2-.8.3-.5.4-.9,1-1.3,1.6s-.4,1,.3.7,1.7-1.4,1.9-2.6c0,0,.1,0,.1,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-16);'%20/%3e%3c/g%3e%3cpath%20id='milktooth-healthy-pulp'%20d='M13.7,9.4c.5,1.2.3,3.2.3,4.6,0,4.6.3,8.6,2.2,12.5,1.1,2.6,4.5,4.2,6.8,2.3,2.9-2.9,3.7-8.9,4.4-13.3.6-8.5,2.6-2.4,2.2,1.8-.3,6-3.3,11.2-3,17.4-.5,3.3,5,13-1.2,12.3-2.2-.5-4.4-2.3-6.8-1.6-1.7.4-3.5,1.7-4.6,2.2-.6.3-1.4.2-1.9-.2-2.7-2.2,0-5.8.5-8.5,1.1-3.9,0-8.1-.4-12.1-.3-3.5-.6-8.6-.2-13,.1-1.1.6-4.9,1.6-4.5h0Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3c/g%3e%3cg%20id='endos'%20data-active='1'%3e%3cpath%20id='endo-medical-filling'%20d='M14.9,40.4c3.6,1.3,9.1.9,11.7-2.2.7-1.4.4-3.4.1-5-.7-3.5.8-10.7,1-14.3,0-2.9.4-6.7,0-9.2-.6-1.4-.9,6-1.1,6.4-.5,3.8-1.4,7-1.8,10.9-.2,1.4-.5,3-2.1,3.5-1.7.4-4.3,1.9-5.6.1-.9-2.1-1-4.9-1.5-7.3-.4-2.6-.6-4.7-.8-7.4,0-.7-.4-8.8-1.4-5.2-.9,6.4,0,13.2-.5,19.9,0,2-.3,3.5-.6,5.4-.4,1.8.6,3.7,2.3,4.3h.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f9ae94;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='endo-filling-incomplete'%20d='M15.3,39.3c3.5.9,8.8.5,10.9-1.7,1.1-1.4.5-3.1.4-4.6-.2-5,1.7-10.7,1.1-15.8-.3-1.8-.8,1.3-.9,1.8-.4,3.1-1.2,5.8-1.8,8.8-.2,1.1-1,2.2-2.8,2.4-3.8.6-6-1.6-6.5-3.9-.6-.4-1-12.5-2.3-8.8-.8,4.3,0,8.7-.4,13.1.4,2.8-2.6,7,2.1,8.6h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-filling'%20d='M15.3,43.9c3.5,1.3,8.8.8,10.9-2.6,1.1-2.1.5-4.6.4-6.9-.2-7.4,1.7-15.9,1.1-23.5-.3-2.7-.8,1.9-.9,2.7-.4,4.6-1.2,8.6-1.8,13.1-.2,1.7-1,3.3-2.8,3.6-3.8.9-6-2.4-6.5-5.8-.6-.6-1-18.7-2.3-13.1-.8,6.4,0,12.9-.4,19.5.4,4.1-2.6,10.4,2.1,12.8h.1v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-glass-pin'%20d='M27.7,21.8c-1.5,5.6-.4,13.5-2,18.8-.3.7-.9,1.1-1.7,1.2-1.8,0-3.7-.5-5.3-.3-3.1,1-6.1-1.8-6-5.2.7-3.7.5-14.3,1.3-19.2.5-1.5,1.1,2.6,1.2,2.9.7,3.5.2,8.3,2.9,10.6,1.7.6,4,.2,5.5-.8,2.1-1.8,2-5.7,2.8-8.3.3-1.4.9-4.7,1.4-4.9.3.4.2,1.5.2,2.2s0,2-.2,2.7v.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23c8c9c9;'%20/%3e%3cpath%20id='endo-metal-pin'%20d='M27.8,21.8c-.5,3.6-1.6,8-1.2,11.8-.2,3.1.7,9.2-2.8,9.4-.9,0-1.9-.4-2.8-.5-2.7-.3-6.9,2.3-7.9-1.7-.4-4.2.4-8.6.4-12.8.3-3.8-.7-7.9.5-11.4.2-.4.5-.2.7.6.6,2.8.4,5.6,1.2,8.4,0,.3.3.9.4,1.1.5,1.2,1.9,1.8,3.2,2.1,1.5.3,4,.5,4.8-1.1.9-2.9,1.8-5.5,2.4-8.3.3-1,.1-2.4.8-3.1.3,0,.4,1.2.4,2.2s0,2.1-.1,3.1h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%233951a3;'%20/%3e%3cg%20id='endo-resorption'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20id='endo-resorption-distal'%20d='M8.5,10.5s2.3-6.2,2.6-6.2l4.2.2c1.1,0,2.6,6.9,2.6,7l-.4,1.6c-.1.6-.4,1.2-.7,1.6l-1.3,2c-.8,1.2-2.2,1.3-3.1.2l-1.9-2.3c-.2-.2-.3-.4-.4-.6l-1.7-3.6h.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cpath%20id='endo-resorption-mesial'%20d='M22.1,10.3s2.3-6.2,2.6-6.2l4.2.2c1.1,0,2.6,6.9,2.6,7l-.4,1.6c-.1.6-.4,1.2-.7,1.6l-1.3,2c-.8,1.2-2.2,1.3-3.1.2l-1.9-2.3c-.2-.2-.3-.4-.4-.6l-1.7-3.6h.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3c/g%3e%3cpath%20id='endo-resection'%20d='M8.1,11.1s5.4-7.1,6.2-7c2.3,0,7.8-.2,10.5-.2s6.9,7.6,6.9,7.8l.2,6.3-23.6.4-.2-7.3h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fdecc5;'%20/%3e%3c/g%3e%3cg%20id='surfaces'%20data-active='1'%3e%3cg%20id='subcaries'%20data-active='1'%3e%3cpath%20id='subcaries-buccal'%20d='M17.3,53.5c.5.8,1.4,1.2,2.1,1.2,1.2,0,2.1-.9,2.6-2.5s.4-1,.4-1.7c-.5-3.3-5.6-2.1-6.2-.8-.4,1,.6,2.9,1.1,3.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-mesial'%20d='M26.4,46.4c-.2.4-.6,1-1,1.1-3.2.8-.6,8.1,1,9.5,1.8,2.9,5.3,2.5,6-1.2.4-2-.3-8-2.3-10.8s-.4-1.1-.8-1.2-.5,0-.7.2c-.6,0-1.1.5-1.4,1l-.8,1.5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-distal'%20d='M10.4,58.2c1.4-.2,2.5-.7,3.1-2.9s.4-4.3.6-5.2c.7-3.8.6-8.3-2.7-7.9-3,.6-4.8,9.5-3.7,14s1.7,1.7,2.7,2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-occlusal'%20d='M12.2,64.7c1.6,1.7,3.8.9,5.9.2,1.5-.5,2.8-.5,4.4,0,4.2.9,6.6-.5,5.1-4.6-1.6-3.7-5.6-3.7-8.9-3.5-4.8,0-10.1,4.1-7,8.7,3.1,4.6.3-1,.4-.8,0,0,.1,0,.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='caries'%20data-active='1'%3e%3cpath%20id='caries-root'%20d='M11.1,31.2c.7,2.8,10.5,1,12.8.5,3.5-.5,4.3-1.4,4.6-3.6s-5.5,2.3-7.5,2.3c-3.2,0-6.1-1.8-8.7-2.8s-1.8.4-1.7,1.3.2,1.6.4,2.3h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-subcrown'%20d='M16.3,39.7c1.9-1.3,5.1-3.3,4.6-6.7-1.1-3.9-5.8-3.5-7.6-1.2-.8,1.1-1.7,2.3-2.1,3.9-.2,1.5-.2,3.9-.4,5.6s.5,1,1,.7c1.4-.8,3.7-2.1,4.4-2.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-buccal'%20d='M16.2,53.4c.6.6,1.5.9,2.3.9,1.3,0,2.3-.7,2.9-1.9s.4-.8.4-1.3c-.5-2.5-6.1-1.6-6.8-.6-.4.8.7,2.2,1.2,2.8h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='caries-mesial'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='mesial-shape'%20d='M27.3,46.2c-3.6-.2-3.5,7.8-2.1,9,1.4,2.1,5.4,2,6.3-.5.7-1.9-1.5-7.7-4.1-8.4h-.1Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='mesial-patch2'%20d='M27.8,50c3.2,0-1-3.3-1.8-1.2-.3.7.8,1.3,1.5,1.2h.3Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='mesial-patch1'%20d='M26.6,53.4c1.4,1,4.6-.5,2.1-1.2-1.6-.4-2.5.5-2.1,1.2h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-distal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='distal-shape'%20d='M10.1,57.5c1.9-.3,2.7-4.6,3.1-6.7.6-3.1.5-6.8-2.3-6.5-3.5.7-4.2,12.3-.9,13.2h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='distal-patch2'%20d='M11.6,47.9c.7-.5.5-2.4-.4-2.3s-.7,2.7.2,2.3h.2Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='distal-patch1'%20d='M9.6,54.4c0,.3.5.5.8.6.2,0,.6.2.6,0-.2-.5-.8-1.5-1.1-1.8-.6-.3-.4.9-.3,1.2h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-occlusal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='occlusal-shape'%20d='M12.9,63.6c1.4,1.7,3.5,1,5.5.4,1.4-.4,2.6-.4,4.1,0,3.9,1,6.1-.3,4.9-4.4-1.4-3.7-5.1-3.8-8.2-3.7-4.6-.2-9.7,2.7-6.4,7.6h.1Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='occlusal-patch2'%20d='M21.7,60.8c-.7,3,3.3,1.5,3.6,0,.5-.8.2-2-.5-2.3-1.2-.5-2.4,1-3.2,2.1h0v.2h.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='occlusal-patch1'%20d='M14,60.9c-.1,1.5,1,2.6,1.6,1.2.4-.9.4-3.1-.4-3.1s-1.1.7-1.1,1.8v.2h-.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fillings'%20data-active='1'%3e%3cg%20id='amalgam'%20data-active='1'%3e%3cpath%20id='filling-amalgam-occlusal'%20d='M11.6,62c-1,2.3.3,4,2.7,3.6,2.2-.2,4.2-1.4,6.3-1.6,2.3-.5,7.7,2.5,7-1.9-.5-3.7-3.4-5.4-7.4-5.3-3.7,0-7.1,1.7-8.5,5v.2h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-buccal'%20d='M19.4,54c1.6-.3,2.7-2.7,2.3-4.2-.5-1.5-3.2-1.3-4.3-.2-1.6,1.5-.1,4.4,1.9,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-mesial'%20d='M25.5,48.7c-3.1,1.6,0,5,.8,7.3.4.8.7,1.9,1.6,2.2,2.2.9,4.2-.5,4.3-2.8-.2-2.1-.9-4.3-1.2-6.5-.3-.8-1-6.2-2.3-4.3-.8,1.4-1.6,3.2-3,4h-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-distal'%20d='M11.6,57.2c2.9-1.3,1.1-5.3,1.8-7.7.4-2.9.8-6.4-1.1-6.9-1.3-.4-2.2,1-2.5,2.1-1.1,3.1-5.2,14.5,1.6,12.6h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='composite'%20data-active='1'%3e%3cpath%20id='filling-composite-occlusal'%20d='M11.6,62c-1,2.3.3,4,2.7,3.6,2.2-.2,4.2-1.4,6.3-1.6,2.3-.5,7.7,2.5,7-1.9-.5-3.7-3.4-5.4-7.4-5.3-3.7,0-7.1,1.7-8.5,5v.2h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-buccal'%20d='M19.4,54c1.6-.3,2.7-2.7,2.3-4.2-.5-1.5-3.2-1.3-4.3-.2-1.6,1.5-.1,4.4,1.9,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-mesial'%20d='M25.5,48.7c-3.1,1.6,0,5,.8,7.3.4.8.7,1.9,1.6,2.2,2.2.9,4.2-.5,4.3-2.8-.2-2.1-.9-4.3-1.2-6.5-.3-.8-1-6.2-2.3-4.3-.8,1.4-1.6,3.2-3,4h-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-distal'%20d='M11.6,57.2c2.9-1.3,1.1-5.3,1.8-7.7.4-2.9.8-6.4-1.1-6.9-1.3-.4-2.2,1-2.5,2.1-1.1,3.1-5.2,14.5,1.6,12.6h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gic'%20data-active='1'%3e%3cpath%20id='filling-gic-occlusal'%20d='M11.6,62c-1,2.3.3,4,2.7,3.6,2.2-.2,4.2-1.4,6.3-1.6,2.3-.5,7.7,2.5,7-1.9-.5-3.7-3.4-5.4-7.4-5.3-3.7,0-7.1,1.7-8.5,5v.2h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-buccal'%20d='M19.4,54c1.6-.3,2.7-2.7,2.3-4.2-.5-1.5-3.2-1.3-4.3-.2-1.6,1.5-.1,4.4,1.9,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-mesial'%20d='M25.5,48.7c-3.1,1.6,0,5,.8,7.3.4.8.7,1.9,1.6,2.2,2.2.9,4.2-.5,4.3-2.8-.2-2.1-.9-4.3-1.2-6.5-.3-.8-1-6.2-2.3-4.3-.8,1.4-1.6,3.2-3,4h-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-distal'%20d='M11.6,57.2c2.9-1.3,1.1-5.3,1.8-7.7.4-2.9.8-6.4-1.1-6.9-1.3-.4-2.2,1-2.5,2.1-1.1,3.1-5.2,14.5,1.6,12.6h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary'%20data-active='1'%3e%3cpath%20id='filling-temporary-occlusal'%20d='M11.6,62c-1,2.3.3,4,2.7,3.6,2.2-.2,4.2-1.4,6.3-1.6,2.3-.5,7.7,2.5,7-1.9-.5-3.7-3.4-5.4-7.4-5.3-3.7,0-7.1,1.7-8.5,5v.2h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-buccal'%20d='M19.4,54c1.6-.3,2.7-2.7,2.3-4.2-.5-1.5-3.2-1.3-4.3-.2-1.6,1.5-.1,4.4,1.9,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-mesial'%20d='M25.5,48.7c-3.1,1.6,0,5,.8,7.3.4.8.7,1.9,1.6,2.2,2.2.9,4.2-.5,4.3-2.8-.2-2.1-.9-4.3-1.2-6.5-.3-.8-1-6.2-2.3-4.3-.8,1.4-1.6,3.2-3,4h-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-distal'%20d='M11.6,57.2c2.9-1.3,1.1-5.3,1.8-7.7.4-2.9.8-6.4-1.1-6.9-1.3-.4-2.2,1-2.5,2.1-1.1,3.1-5.2,14.5,1.6,12.6h.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='defect'%20data-active='1'%3e%3cpolygon%20id='defect-occlusal'%20points='18.8%2064.7%2017.1%2064.2%2018.7%2063.6%2021.9%2063.4%2023.5%2063.9%2022%2064.6%2018.8%2064.7'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-buccal'%20points='18.6%2049.5%2017.7%2049%2018.5%2048.4%2020.3%2048.3%2021.2%2048.8%2020.3%2049.4%2018.6%2049.5'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-distal'%20points='8.5%2050.4%207.6%2051.7%207.4%2050.1%208.2%2047.4%209.1%2046.1%209.3%2047.7%208.5%2050.4'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-mesial'%20points='32%2051.1%2031.7%2052.7%2030.9%2051.4%2030.2%2048.6%2030.5%2047.1%2031.3%2048.3%2032%2051.1'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='contact-point'%20data-active='1'%3e%3cg%20id='mesial-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M30.3,50.8c1,2.4,2.3,5.1,3.6,7.6'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M30.7,58.9c.7-1.6.7-2.5,1.2-3.8.6-1.4,1.1-2.9,1.3-4.4'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='distal-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M5.6,50.8c1,2.6,2.3,5.4,3.6,8.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M5.7,59c.8-1.5.9-2.5,1.6-3.7.7-1.4,1.3-2.8,1.7-4.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fissure-sealing'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='fissure-sealing-occlusal'%20d='M12.9,65.6c1.4.2,3.5-.6,5.5-.6s4.8,0,6.3.2c3.9,0,5.6-.7,4.4-1.2-1.4-.5-6.7,0-9.8,0-4.6,0-11.9.7-8.6,1.4l1.2.3h1.1-.1Z'%20data-active='1'%20style='fill:%20%233fb6ff;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='restorations'%20data-active='1'%3e%3cpath%20id='crown-leakage'%20d='M11.3,34.5c5-4.4,12.9-3.5,16.9,2,2.2,3-21,1.5-16.9-2'%20data-active='1'%20style='display:%20none;%20fill:%20%239e00e9;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='implant'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-locator-screw'%20d='M16.6,47.4c.9,1.5,3.8.9,5.4,1,3.2-.5,1.7-4.6,2-7,0-.7.2-1.6-.3-2.1-.2-.3-.7-.4-1-.4-1.5,0-3.4-.2-4.9.2-1.3.3-1.4,1.3-1.4,2.5,0,2-.2,3.9.1,5.7v.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-17);%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='implant-connector'%20d='M13.7,40.7h0c.1,1.4,1.1,2.1,1.9,1.7,1.4-.7,1.6-2,3.4-2.1h3.3c.8,0,1.8,1.9,2.9,2.2s1.4-.6,1.3-1.6c0-1.9,0-5.6-.5-5.7s-3.1,0-3.7,0h-4.5c-1,0-2.7-.4-3.5.7-.8,1.1-1,2.9-.8,4l.2.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-18);'%20/%3e%3cpath%20id='implant-bar'%20d='M5.8,53.5c5.8.3,21,0,27.4,0s2.8-2.2,3-4.1.2-3.2-1-3.4-4.8,0-6.3,0c-3.6,0-6.7,0-10.1.2-3.8,0-12.1.2-12.7,0-1.1.2-2.2.9-2.2,1.9-.2,1.9-.2,5.5,1.8,5.3h.1Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-14-0);'%20/%3e%3cg%20id='implant-healing-abutment'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-healing-abutment-connector'%20d='M16.7,39.9c1.7.3,3.7-.2,5.4-.2,3.3,0,4.2-1.2,3.4-5.6-.8-3.9-1.7-9-2.7-13.4-.3-1.1-.6-2.2-1.1-3.1-2.3-4.5-4.3,1.7-4.7,5-.5,3.4-.6,5.9-1.3,9-.6,2.7-2.4,7.7.7,8.3h.3Z'%20data-active='1'%20style='fill:%20%23a0a0a0;%20stroke:%20%238c8c8c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M27.3,36.4h-9.2c-1.4,0-5,.2-5,.2,0,0-.4.9-.7,1.7s-.3,1.2-.3,1.8v2.7c.1.3.2.5.2.7h1.1c2.4-.3,4.9-.4,7.3-.4v-.2c.3,0-.7-.2-.9-.2.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.6.6-.5.4-.6l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.6,0,1.2,0,1.9.2h.5c.2,0,.4,0,.5.2-.2-.2,0-2.5,0-2.5,0,0,.2,0,.2,0Z'%20data-active='1'%20style='fill:%20%23475563;'%20/%3e%3cpath%20d='M20.9,42.9v-.2h.2c.1,0,0,0,0-.2.5,0,2,.3,2.6.2.1.3.5.2.7.2.6,0,2.3.2,2.5-.9s.2-1.8,0-2.7-.3-.4-.1-.6h.4s.2,0,.2.4v3.6c0,.2-.1.4-.2.6-.9,0-1.8-.2-2.8-.3h-3.6,0Z'%20data-active='1'%20style='fill:%20%238c8c8c;'%20/%3e%3cpath%20d='M20.6,38.7c-.1-.2-.3-.2-.5-.2l-.9.2c-.1-.2-.4-.2-.6,0-.1-.2-.9,0-1,0l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.1.3,0,.2.3.6.2.3.3.2.4.5.1.7,0,1.5,0,2.1s-.3.8-.7.9c-.7,0-2,.2-2.7,0s-1.4-.2-1.4-.6v-.9c-.1-.4,0-1.5,0-2s.5-.7.3-.5h0Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M23.7,42.7h.7c.4-.2.7-.6.7-1v-1.9c0-.6-.9-1.1-1.5-1.1-.3-.4.9,0,.8-.2.6,0,1.2,0,1.9.2s.3,0,.5,0c-.2.2,0,.4.1.6.1.9.1,1.8,0,2.7s-1.9,1-2.5.9-.6,0-.7-.2h0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3cpath%20d='M17.6,38.6c.1,0,.9-.2,1,0,.2-.2.5-.2.6,0,0,0-.2.2-.2.3,0,1-.2,1.9,0,2.9s.6.6,1,.7c.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.8.6-.5.4-.6h0Z'%20data-active='1'%20style='fill:%20%236f7c86;'%20/%3e%3cpath%20d='M20.9,42.7c.3,0-1.1-.3-.9-.2-.4,0-.9,0-1-.7-.2-.9,0-1.9,0-2.9s.2-.2.2-.3l.9-.2c.2,0,.4,0,.5.2-.2.2-.3.4-.3.7v2.5c0,.9.5.6.7.7v.2h-.2,0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3c/g%3e%3cg%20id='implant-base'%20data-active='1'%3e%3cpath%20d='M16.9,36.4c-.1-1.3-.2-2.7.2-4h5.6c.4,1,.2,2.9.2,4h-6Z'%20data-active='1'%20style='fill:%20%23bbc3c6;'%20/%3e%3cpath%20d='M18.1,10c-.2,0,0-2.2,0-2.4.2-1.3.9-2.4,1.9-3,1-.6.2,0,.2-.3,1.7,0,3.3,1.1,3.8,3.1.5,2,0,1.2.1,1.8h-1.3c0-.8,0-2.1-.8-2.3s-.7,0-.7.3c0,.8,0,1.5.2,2.1l-3.5.6h0Z'%20data-active='1'%20style='fill:%20%23bac3c7;'%20/%3e%3cpath%20d='M17.1,32.4c-.4,1.3-.3,2.7-.2,4l-3.8.2c0-.7-.3-4.2.7-4,1.1-.2,2.2-.2,3.3-.2Z'%20data-active='1'%20style='fill:%20%23a0a4a5;'%20/%3e%3cpath%20d='M17.7,31.9v-2.5c1.5-.3,3-.7,4.6-.7l.2,3.3h-4.8Z'%20data-active='1'%20style='fill:%20%23bac3c6;'%20/%3e%3cpath%20d='M20.3,4.2s-.1.2-.2.3c-1,.6-1.6,1.7-1.9,3-.3,1.3-.2,2.4,0,2.4l-2.4.6c.1-1.1,0-2.2.3-3.3s1.1-2.2,2.1-2.7c1-.5,1.5-.4,2.2-.4h-.1Z'%20data-active='1'%20style='fill:%20%239ca3a6;'%20/%3e%3cpath%20d='M22.9,36.4c0-1.1.2-3-.2-4h2.7c.2,1,.3,3,0,4h-2.5Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M17.6,29.3v2.5c.1,0-3.4.2-3.4.2,0-.7,0-1.4.1-2,1.1-.4,2.2-.5,3.2-.8h.1,0Z'%20data-active='1'%20style='fill:%20%239ea3a4;'%20/%3e%3cpath%20d='M25.4,36.5c.2-1,.2-3,0-4h1.4c.8.2.7,3.3.5,4h-1.9Z'%20data-active='1'%20style='fill:%20%23bcc4c7;'%20/%3e%3cpath%20d='M22.5,31.9l-.2-3.3c.6-.2,1.3-.2,1.9-.2l.2,3.6h-1.9Z'%20data-active='1'%20style='fill:%20%23e3eaeb;'%20/%3e%3cpath%20d='M24.4,32l-.2-3.6c.5-.1,1.1-.1,1.7-.1l.3,3.8h-1.8Z'%20data-active='1'%20style='fill:%20%23b8c2c4;'%20/%3e%3cpath%20d='M17.7,27.5v-1.1c1.5-.3,3-.6,4.5-.7v1.1l-4.5.7Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M17.8,24.6c-.1-.4,0-.8,0-1.2,1.5-.3,2.9-.5,4.3-.7v1.2l-4.4.7h0Z'%20data-active='1'%20style='fill:%20%23b9c0c4;'%20/%3e%3cpath%20d='M17.9,21.7c-.3-.4,0-.5-.2-1.1,1.4-.4,2.8-.6,4.3-.8v1.2c-1.3.2-2.7.4-4.1.7Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M17.8,18.7v-1.1c1.3-.3,2.7-.6,4.1-.7v1.1s-4.1.7-4.1.7Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M17.9,15.8v-1.1c1.3-.3,2.6-.5,3.9-.7v1.2l-4,.6s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23b9c1c5;'%20/%3e%3cpath%20d='M17.9,11.8c1.2-.3,2.4-.6,3.7-.7v1.2c-1.2.1-2.4.4-3.7.6v-1.1Z'%20data-active='1'%20style='fill:%20%23bac3c5;'%20/%3e%3cpath%20d='M17.7,28.8c0-.2,0-.5-.1-.7-.2.2-.5.3-.6,0,1.7-.4,3.5-.7,5.3-.9.1.2,0,.5,0,.8l-4.6.7h0Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M17.8,25.9c-.2-.2,0-.5,0-.8,1.5-.3,3-.6,4.5-.7v.8l-4.4.7s-.1,0,0,0h-.1Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M17.7,26.4v1.1l-3.2.8v-1.1c1-.4,2.1-.5,3.1-.7h.1Z'%20data-active='1'%20style='fill:%20%239a9fa1;'%20/%3e%3cpath%20d='M17.9,22.9c-.1-.3-.2-.4-.2-.7,1.5-.3,2.9-.6,4.3-.7v.8l-4.2.7h0Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M17.8,23.4c0,.4-.1.8,0,1.2l-3.1.7v-1.2c1-.4,2-.5,3-.7,0,0,.1,0,0,0,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23999fa1;'%20/%3e%3cpath%20d='M17.8,20v-.8c1.4-.3,2.8-.5,4.2-.7v.8l-4.2.7Z'%20data-active='1'%20style='fill:%20%23bac1c4;'%20/%3e%3cpath%20d='M17.8,17.1v-.7c1.3-.3,2.7-.5,4-.7v.8l-4.1.6s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M17.9,14.2v-.8c1.2-.4,2.5-.5,3.8-.7,0,.2.1.5,0,.8l-3.9.7s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23bbc2c4;'%20/%3e%3cpath%20d='M17.7,20.6c.1.6,0,.7.2,1.1l-2.9.7v-1.1c.9-.5,1.8-.4,2.7-.6h0Z'%20data-active='1'%20style='fill:%20%239ba0a2;'%20/%3e%3cpath%20d='M16.9,28.2c.1.2.4.2.6,0,.1.2.1.5.1.7-1.2.3-2.4.5-3.6.9s-.4-.2-.5-.4c0-.6,2.7-1,3.2-1.1h.2,0Z'%20data-active='1'%20style='fill:%20%23a8aeb1;'%20/%3e%3cpath%20d='M17.7,25.1v.8l-3.5.9c-.2,0-.4-.3-.4-.4,0-.6,3.3-1.1,3.8-1.2h0Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M17.8,17.6v1.1l-2.7.7v-1.2c.9-.4,1.8-.5,2.6-.6,0,0,.1,0,0,0,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%239ba0a3;'%20/%3e%3cpath%20d='M21.6,9.4c-.1-.7-.2-1.4-.2-2.1s.5-.4.7-.3c.8.2.7,1.5.8,2.3l-1.3.2h0Z'%20data-active='1'%20style='fill:%20%23e4e9ea;'%20/%3e%3cpath%20d='M18,11.3v-.8c1.2-.3,2.4-.5,3.7-.6v.8s-3.7.6-3.7.6Z'%20data-active='1'%20style='fill:%20%23bcc2c4;'%20/%3e%3cpath%20d='M17.7,22.2c0,.3,0,.5.2.7-1.2.2-2.2.5-3.4.8s-.4-.2-.4-.3c-.1-.7,3.1-1.1,3.6-1.2Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M17.9,14.7v1.1l-2.5.7c0-.3,0-.9.1-1.1.8-.4,1.6-.4,2.4-.6h0Z'%20data-active='1'%20style='fill:%20%239da2a4;'%20/%3e%3cpath%20d='M17.8,19.3v.8l-3.2.8c-.2,0-.3-.3-.3-.4s0-.3.2-.4c1.1-.4,2.2-.6,3.2-.8h.1Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M17.9,11.8v1.1l-2.4.6v-1.1c.8-.3,1.6-.4,2.3-.6h.1Z'%20data-active='1'%20style='fill:%20%239ca1a3;'%20/%3e%3cpath%20d='M17.8,16.4v.7l-2.9.8c-.2,0-.4-.2-.4-.3-.2-.7,3-1.1,3.3-1.1h0Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M17.8,13.4v.8l-2.8.7c-.2,0-.3-.2-.4-.3s0-.4.3-.4c1-.3,1.9-.6,2.9-.7h0Z'%20data-active='1'%20style='fill:%20%23a2a7a9;'%20/%3e%3cpath%20d='M18,10.5v.8c-.9.2-1.7.4-2.6.7s-.4-.1-.4-.3,0-.3.2-.4c.9-.4,1.8-.5,2.8-.8Z'%20data-active='1'%20style='fill:%20%23a7abae;'%20/%3e%3cpath%20d='M22.3,26.8v-1.1c.5-.2,1.1-.2,1.7-.2.1.4,0,.8,0,1.2l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e2e9eb;'%20/%3e%3cpath%20d='M22.2,23.9v-1.2l1.8-.2v1.1c-.5.2-1.1.2-1.7.3h0Z'%20data-active='1'%20style='fill:%20%23e1e8e9;'%20/%3e%3cpath%20d='M22,19.8c.6,0,1.2-.2,1.8-.2v1.2l-1.7.2v-1.2h0Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M21.9,18.1v-1.1c.5,0,1.1-.2,1.6-.2.2.4,0,.8.2,1.1-.6,0-1.2,0-1.8.2Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M24.1,26.6v-1.2c.5,0,1.1-.1,1.7-.1,0,.4.1.8.1,1.2-.6.2-1.2,0-1.7.1h-.1Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M21.8,15.2c-.1-.4,0-.8,0-1.2l1.6-.2v1.1c-.4.1-1,.2-1.5.2h-.1Z'%20data-active='1'%20style='fill:%20%23e4eaeb;'%20/%3e%3cpath%20d='M24.2,27.9v-.8c.5,0,2.5-.5,2.4.3s-1.8.5-2.4.5Z'%20data-active='1'%20style='fill:%20%23b4bdc0;'%20/%3e%3cpath%20d='M24.1,25v-.8c.4,0,2.4-.5,2.3.2s-.2.4-.4.4h-1.9s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23b8c0c4;'%20/%3e%3cpath%20d='M21.6,11.1c.5,0,1-.2,1.5-.2.1.4,0,.8.2,1.1-.5.1-1,.2-1.6.2v-1.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e8e9;'%20/%3e%3cpath%20d='M24,23.6v-1.1c.4,0,.9-.1,1.4-.1,0,.4.1.8,0,1.1-.5.2-1.1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M23.8,22.1v-.8c.4,0,2.2-.5,2.2.2s-1.7.5-2.2.6Z'%20data-active='1'%20style='fill:%20%23b5bdc1;'%20/%3e%3cpath%20d='M23.8,20.8v-1.2c.5,0,.9-.2,1.4-.1v1.1c-.5.1-1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c1c5;'%20/%3e%3cpath%20d='M23.7,19.1c-.1-.2,0-.5,0-.8.5,0,2.1-.4,2.2.2s-1.5.6-2.1.6h-.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M23.5,16.2c-.1-.2,0-.5-.1-.8.5,0,2.1-.5,2.1.2s-1.5.5-2,.6Z'%20data-active='1'%20style='fill:%20%23b6bec2;'%20/%3e%3cpath%20d='M23.6,17.9c-.1-.4,0-.8-.2-1.1.5,0,.9-.2,1.4-.1,0,.4.1.8,0,1.1h-1.3.1Z'%20data-active='1'%20style='fill:%20%23b9c2c6;'%20/%3e%3cpath%20d='M22.3,28.1v-.8c.7,0,1.3-.2,2-.2v.8l-1.9.2h-.1Z'%20data-active='1'%20style='fill:%20%23e5e9eb;'%20/%3e%3cpath%20d='M23.3,13.3v-.8c.3,0,2.2-.5,2,.3s-1.4.4-1.9.5h-.1Z'%20data-active='1'%20style='fill:%20%23bbc2c5;'%20/%3e%3cpath%20d='M23.4,14.9v-1.1c.3,0,.7-.1,1.2,0,0,.3.1.7,0,1.1-.4.3-.9,0-1.3.1h0Z'%20data-active='1'%20style='fill:%20%23b6bfc2;'%20/%3e%3cpath%20d='M22.2,25.1v-.8c.6,0,1.2-.2,1.8-.2v.8l-1.9.2h.1Z'%20data-active='1'%20style='fill:%20%23e6ebec;'%20/%3e%3cpath%20d='M23.3,12.1c-.2-.3,0-.8-.2-1.1.4,0,.8-.2,1.3,0,0,.3.1.7,0,1.1-.4.2-.8,0-1.2.1h.1Z'%20data-active='1'%20style='fill:%20%23bdc3c6;'%20/%3e%3cpath%20d='M22.1,22.2v-.8c.6,0,1.2-.3,1.8-.2v.8l-1.8.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M23.1,10.5v-.8c.4,0,2.1-.5,1.9.3s-1.4.4-1.9.4h0Z'%20data-active='1'%20style='fill:%20%23bfc4c7;'%20/%3e%3cpath%20d='M22,19.3v-.8l1.7-.2v.8l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e5eaeb;'%20/%3e%3cpath%20d='M21.8,16.4v-.8l1.7-.2c0,.3,0,.5.1.8l-1.7.2h-.1Z'%20data-active='1'%20style='fill:%20%23e6ebeb;'%20/%3e%3cpath%20d='M21.7,13.5v-.8c.5,0,1-.2,1.6-.2v.8l-1.6.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M21.6,9.9c.5,0,1-.2,1.5-.2v.8l-1.5.2v-.8Z'%20data-active='1'%20style='fill:%20%23e1e5e6;'%20/%3e%3c/g%3e%3cpath%20id='peri-implant-bone-loss'%20d='M9.5,27c2,7,6,10,9,10s7-3,9-10c-2,4-5,6-9,6s-7-2-9-6Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23d9534f;'%20/%3e%3c/g%3e%3cg%20id='prosthesis-implant'%20data-active='1'%3e%3cg%20id='prosthesis-implant-gum'%20data-active='1'%20style='display:%20none;%20opacity:%20.5;'%3e%3cpath%20d='M35.6,57.6v-11.7c0-.8-.8-1.5-1.8-1.5H7.3c-8.3,0-1.8.6-1.8,1.4,0,2.7-.3,8.7-.3,11.7s.8,1.5,1.8,1.5h26.8c5.4,0,1.8-.7,1.8-1.5h0Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-14-1);'%20/%3e%3cpath%20d='M35.5,57.6c-.2-3.9-.4-7.7-.5-11.6,0-1-1.1-1.1-1.9-1-4.4,0-13.2-.3-17.7-.5H7.2c-.7,0-1.1,1-.7,1.5.2,3.9-.2,7.8-.4,11.6,0,.4.6.6,1,.5,1.4,0,6,.2,7.5.2,3.6,0,12.8.4,16.3.5h2.7c.8,0,1.8-.5,1.8-1.4h0v.3h.1ZM35.7,57.6c0,1-1.1,1.6-2,1.6h-2.7l-5.4.2c-4.7,0-13.7.4-18.4.6-1.7,0-3.3-1.2-3-3.1,0-3.7,0-7.4.2-11.1.2-1.7,1.8-1.6,2.9-1.4h2.7c6.9,0,16.3-.6,23.1-.6s1.1,0,1.5,0c.8.2,1.6,1.2,1.5,2.1,0,3.9-.3,7.7-.5,11.6h0Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3c/g%3e%3cpath%20id='prosthesis-implant-crown'%20d='M23.5,53.7c-2.1-2.6-5.5-2.1-6.8.9-.3,1.4-.8,2.8-1.3,4.1-.5,2.2-1.3,6.8,1.1,8,1.6.6,3.2-1,4.8-.5.7,0,1.3.4,1.9.3,4.2-1.1,2.1-6.8,1.2-10.3-.2-.8-.6-1.7-.9-2.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='prosthesis'%20data-active='1'%3e%3cpath%20id='prosthesis-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-14-19);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='prosthesis-crown'%20d='M27.1,37c-4.6-5.7-12.3-4.6-15.2,1.9-.7,3.1-1.7,6.2-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.5,1.4,7.2-2.2,10.8-1.1,1.5.3,2.8.9,4.2.7,9.4-2.4,4.7-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='telescope'%20data-active='1'%3e%3cpath%20id='telescope-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cg%20id='telescope-crown'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='telescope-crown-outside'%20d='M27.1,37c-4.6-5.7-12.3-4.6-15.2,1.9-.7,3.1-1.7,6.2-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.5,1.4,7.2-2.2,10.8-1.1,1.5.3,2.8.9,4.2.7,9.4-2.4,4.7-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1Z'%20data-active='1'%20style='fill:%20%230051bf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='telescope-crown-inside'%20d='M25.5,39.8c-3.6-4.4-9.6-3.6-11.9,1.5-.5,2.5-1.4,4.9-2.2,7.2-1,3.9-2.2,11.9,2,13.9,2.7,1.1,5.6-1.7,8.5-.9,1.2.2,2.2.7,3.3.6,7.3-1.8,3.7-11.8,2.1-18-.4-1.4-1-2.9-1.6-4.1h0s-.2-.2-.2-.2Z'%20data-active='1'%20style='fill:%20%23aaa;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='zircon'%20data-active='1'%3e%3cpath%20id='zircon-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='zircon-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-1.3,3-2.2,5.9-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-2.2-5.4-2.2-5.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-inlay'%20d='M23.9,48.6c-2.5-3.1-6.8-2.5-8.4,1.1-.7,1.6-1.2,3.3-1.6,5.1-.7,2.8-1.6,8.5,1.4,9.8,1.9.8,4-1.2,6-.6.8.2,1.6.5,2.3.4,5.2-1.3,2.6-8.3,1.5-12.7-.3-1-1.2-2.9-1.2-2.9v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-veneer'%20d='M25.8,38.1c-4-5-10.8-4-13.4,1.7-1.1,2.6-1.9,5.2-2.5,8.1-1.1,4.4-2.5,13.5,2.2,15.6,3.1,1.2,6.3-1.9,9.5-1,1.3.3,2.5.8,3.7.6,8.3-2.1,4.1-13.3,2.4-20.3-.4-1.6-1.9-4.7-1.9-4.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal'%20data-active='1'%3e%3cpath%20id='metal-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-1.4,2.8-2.2,6.1-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal-ceramic'%20data-active='1'%3e%3cpath%20id='metal-ceramic-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-2);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-ceramic-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-1.4,2.8-2.2,6.1-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-3);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gold'%20data-active='1'%3e%3cpath%20id='gold-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gold-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-.7,3.1-1.7,6.2-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-inlay'%20d='M23.9,48.6c-2.5-3.1-6.8-2.5-8.4,1.1-.7,1.6-1.2,3.3-1.6,5.1-.7,2.8-1.6,8.5,1.4,9.8,1.9.8,4-1.2,6-.6.8.2,1.6.5,2.3.4,5.2-1.3,2.6-8.3,1.5-12.7-.3-1-1.2-2.9-1.2-2.9v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-veneer'%20d='M25.8,38.1c-4-5-10.8-4-13.4,1.7-1.1,2.6-1.9,5.2-2.5,8.1-1.1,4.4-2.5,13.5,2.2,15.6,3.1,1.2,6.3-1.9,9.5-1,1.3.3,2.5.8,3.7.6,8.3-2.1,4.1-13.3,2.4-20.3-.4-1.6-1.9-4.7-1.9-4.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='emax'%20data-active='1'%3e%3cpath%20id='emax-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-4);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='emax-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-.7,3.1-1.7,6.2-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-5);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-inlay'%20d='M23.9,48.6c-2.5-3.1-6.8-2.5-8.4,1.1-.7,1.6-1.2,3.3-1.6,5.1-.7,2.8-1.6,8.5,1.4,9.8,1.9.8,4-1.2,6-.6.8.2,1.6.5,2.3.4,5.2-1.3,2.6-8.3,1.5-12.7-.3-1-1.2-2.9-1.2-2.9v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-6);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-veneer'%20d='M25.8,38.1c-4-5-10.8-4-13.4,1.7-1.1,2.6-1.9,5.2-2.5,8.1-1.1,4.4-2.5,13.5,2.2,15.6,3.1,1.2,6.3-1.9,9.5-1,1.3.3,2.5.8,3.7.6,8.3-2.1,4.1-13.3,2.4-20.3-.4-1.6-1.9-4.7-1.9-4.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-7);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gradia'%20data-active='1'%3e%3cpath%20id='gradia-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gradia-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-.7,3.1-1.7,6.2-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-inlay'%20d='M23.9,48.6c-2.5-3.1-6.8-2.5-8.4,1.1-.7,1.6-1.2,3.3-1.6,5.1-.7,2.8-1.6,8.5,1.4,9.8,1.9.8,4-1.2,6-.6.8.2,1.6.5,2.3.4,5.2-1.3,2.6-8.3,1.5-12.7-.3-1-1.2-2.9-1.2-2.9v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-veneer'%20d='M25.8,38.1c-4-5-10.8-4-13.4,1.7-1.1,2.6-1.9,5.2-2.5,8.1-1.1,4.4-2.5,13.5,2.2,15.6,3.1,1.2,6.3-1.9,9.5-1,1.3.3,2.5.8,3.7.6,8.3-2.1,4.1-13.3,2.4-20.3-.4-1.6-1.9-4.7-1.9-4.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary-restorations'%20data-active='1'%3e%3cpath%20id='temporary-bridge-connector'%20d='M33.9,55.2c3.5-1.7,2.7-6.9-1-7.8-1.2-.4-2.5-.5-3.8-.5H10c-1.9,0-4.2.7-5.2,2.2-1.2,1.7-1.3,4.3,0,5.9,1.7,1.6,5,1.5,7.6,1.5s6.7,0,10.2-.2c3.7-.2,8.5.2,11-1.1,0,0,.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='temporary-crown'%20d='M27,37c-4.7-5.7-12.5-4.6-15.5,1.9-.7,3.1-1.7,6.2-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.6,1.4,7.3-2.2,11-1.1,1.5.3,2.8.9,4.3.7,9.6-2.4,4.8-15.1,2.7-23.1-.5-1.8-1.3-3.7-2.1-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-inlay'%20d='M23.9,48.6c-2.5-3.1-6.8-2.5-8.4,1.1-.7,1.6-1.2,3.3-1.6,5.1-.7,2.8-1.6,8.5,1.4,9.8,1.9.8,4-1.2,6-.6.8.2,1.6.5,2.3.4,5.2-1.3,2.6-8.3,1.5-12.7-.3-1-1.2-2.9-1.2-2.9v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-veneer'%20d='M25.8,38.1c-4-5-10.8-4-13.4,1.7-1.1,2.6-1.9,5.2-2.5,8.1-1.1,4.4-2.5,13.5,2.2,15.6,3.1,1.2,6.3-1.9,9.5-1,1.3.3,2.5.8,3.7.6,8.3-2.1,4.1-13.3,2.4-20.3-.4-1.6-1.9-4.7-1.9-4.7Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='ortho'%20data-active='1'%3e%3cg%20id='missing-closed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M4.7,8.2c17.4,16.6,15.5,37.8,0,54.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M31.4,61.6c-17.6-16.4-15.8-37.6-.5-54.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cg%20id='ortho-ring'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='19.5'%20cy='52.5'%20rx='3.6'%20ry='11.8'%20transform='translate(-33.3%2071.1)%20rotate(-89.1)'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='10.1'%20y1='56.2'%20x2='29.2'%20y2='56.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='10.1'%20y1='48.9'%20x2='29.2'%20y2='48.9'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='9'%20y1='53.5'%20x2='30.2'%20y2='53.5'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='9'%20y1='51.1'%20x2='30.2'%20y2='51.1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M30.1,48.9c.7-.2,1.4.3,1.4.9v5.5c0,.4-.5.8-.9.9h-.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M9.1,56.2h-.5c-.4,0-.9-.4-.9-.9v-5.5c0-.6.6-1,1.2-.9h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='ortho-bracket'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='17.1'%20cy='51.2'%20rx='1.6'%20ry='5.4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cellipse%20cx='22.9'%20cy='51.1'%20rx='1.6'%20ry='5.4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='18.6'%20y1='54.9'%20x2='21.4'%20y2='54.9'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='18.6'%20y1='48'%20x2='21.4'%20y2='48'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M21.5,50v-2.9c.1-.6.6-1.1,1.2-1.1s1.3.4,1.4,1.2v8c0,.7-.6,1.3-1.3,1.3s-1.3-.5-1.3-1.3v-2.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M18.4,50v-2.9c0-.6-.6-1.1-1.2-1.1s-1.3.4-1.4,1.2v8c0,.7.6,1.3,1.3,1.3s1.3-.5,1.3-1.3v-2.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='16'%20y1='52.4'%20x2='24'%20y2='52.4'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='16'%20y1='50.2'%20x2='24'%20y2='50.2'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M24.3,48.1c.6-.2,1.3.3,1.3.8v5.2c0,.4-.4.8-.8.8h-.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M15.6,54.9h-.5c-.4,0-.8-.4-.8-.8v-5.2c0-.6.6-.9,1-.8h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrows'%20data-active='1'%3e%3cg%20id='arrow-distal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='5'%20y1='60.3'%20x2='1.5'%20y2='63.9'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='7.5'%20y1='64.1'%20x2='1.4'%20y2='64.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='5'%20y1='67.7'%20x2='1.5'%20y2='64.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-mesial'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='34.3'%20y1='68.1'%20x2='38.5'%20y2='64.5'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='31.1'%20y1='64.3'%20x2='38.7'%20y2='64.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.3'%20y1='60.7'%20x2='38.5'%20y2='64.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-down'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='39'%20y1='39.6'%20x2='35.2'%20y2='33.6'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.8'%20y1='43.8'%20x2='35.2'%20y2='33.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='31'%20y1='39.4'%20x2='35'%20y2='33.4'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-up'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='31'%20y1='37.5'%20x2='34.8'%20y2='43.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.8'%20y1='33.3'%20x2='34.8'%20y2='43.8'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='38.8'%20y1='37.7'%20x2='35'%20y2='43.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-rotation'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20d='M19.9,70.8c-.2,0-.8-.3-1.1-1s-.2-.9-.1-1.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M18,66.3c1-1.4,6.1-1.3,5.4,1.7-.1,3.5-8,.9-3.4,0'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='specials'%20data-active='1'%3e%3cg%20id='fracture-vertical'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-vertical-3'%20x1='32.7'%20y1='5.5'%20x2='11.2'%20y2='62.2'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-vertical-2'%20x1='29.2'%20y1='14.7'%20x2='10.2'%20y2='65'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-vertical-1'%20points='30.5%2016.1%2025.6%2016.7%2027.8%2023.1%2023.8%2023.1%2025.5%2026.4%2022.2%2026.4%2025.1%2031%2019.3%2030.5%2022.6%2036.7%2016.7%2037.1%2019.3%2044.7%2015.6%2044.1%2016.7%2050.7%2013.9%2050.4%2014.7%2055%2012%2055.3%2014.3%2059.6%209.9%2059.2%2011.8%2063.8'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='fracture-horizontal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-horizontal-3'%20x1='6.1'%20y1='9.2'%20x2='29.7'%20y2='29.6'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-horizontal-2'%20x1='10.5'%20y1='13'%20x2='27.3'%20y2='27.4'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-horizontal-1'%20points='8.4%2014.8%2011.2%2014%2011.4%2016.6%2015.5%2015.2%2015.8%2019.9%2018.6%2018.2%2018.9%2022.2%2022.5%2020.5%2022.2%2024.7%2026.4%2023.3%2025.3%2026.5%2029.1%2026'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='parapulpal-pin'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='parapulpal-pin-shape'%20data-active='1'%3e%3cpath%20d='M25.9,47.7c.1.5,0,.6,0,.8v.8c.1.4,0,.6,0,.8.1.3,0,.6,0,.8v2.4c.1.4.4.8,1,1.1s.2.2.1.3,0,.2,0,.3,0,.2-.3.3c-1.2.2-2.5.2-3.7,0s-.3,0-.3-.2v-.6c0-.2.9-.3,1-1s0-.7,0-1.1l.2-5,.2-4.4c0-1.2.2-2.3.4-3.5s0-.2.2-.3c.1.2.1.3.2.5.3,1.2.4,2.4.5,3.6l.3,3.5v.2c.1.2,0,.5,0,.8h.2,0Z'%20data-active='1'%20style='fill:%20%230a0a0a;'%20/%3e%3cpath%20d='M24.3,51.3c-.1,0-.2-.2-.2-.3v-3.7l.2-3.9.2-2.2h.1v9.3c0,.3,0,.6-.3.8Z'%20data-active='1'%20style='fill:%20%23f0edee;'%20/%3e%3cpath%20d='M25.2,50.7h0v-1.7h0v-1h0v-6.5c0,.2.1.5.1.7v.5l.3,3.4v3.2l.2,1.8v.3h-.1c-.2-.2-.3-.4-.5-.6h0Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cpath%20d='M25.2,50.7v-.2c-.1,0-.3-10.5-.3-10.5v-.3l.2.7s.1.2,0,.2h0c-.1,0,0,.7,0,.8v6.2h0v2.8h0v.3s.1,0,0,0Z'%20data-active='1'%20style='fill:%20%239c9c9c;'%20/%3e%3cpath%20d='M24.4,52.4c.2.3.5.6.7.9s0,.3,0,.5c-.2.4-.8.4-1.4.5.9-.7.2-1.1.9-1.9h-.2Z'%20data-active='1'%20style='fill:%20%23c7c7c7;'%20/%3e%3cpath%20d='M25.8,52.4c.5.4.3.7.4,1v.2c0,.2.3.5.6.7h-.9c-.7-.2-.8-.8-.7-1s.4-.6.6-.8h0Z'%20data-active='1'%20style='fill:%20%23b5b4b6;'%20/%3e%3cpath%20d='M25.2,54.4c.4,0,1.7,0,2,.2v.5h-1.5c-.5,0-.4,0-.4-.2v-.4h-.1Z'%20data-active='1'%20style='fill:%20%23bababa;'%20/%3e%3cpath%20d='M23.6,55v-.5h1.3c0,.2,0,.4-.2.5s-.8,0-1.2,0h.1Z'%20data-active='1'%20style='fill:%20%23cdcdcd;'%20/%3e%3cpath%20d='M23.8,55.3h2.8-2.7c-.9,0,0,0-.1,0s0,0,0,0Z'%20data-active='1'%20style='fill:%20%239da1a2;'%20/%3e%3cpath%20d='M23.7,54.5v.5h-.6v-.5c.2,0,.5,0,.7-.2h-.1v.2Z'%20data-active='1'%20style='fill:%20%238b8d8c;'%20/%3e%3cpath%20d='M24.6,51.7c.1,0,.2,0,.3.2l-.3.2s-.2,0-.2-.2c0,0,.1,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23acaaac;'%20/%3e%3cpath%20d='M25.5,51.7h.2l-.2.2c-.1,0-.2,0-.3-.2h.3Z'%20data-active='1'%20style='fill:%20%23b2b0b3;'%20/%3e%3cpath%20d='M24.4,51.9h.2s-.1,0-.2.2h-.2c-.1,0,0,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23e4e1e2;'%20/%3e%3cpath%20d='M25.4,52.1c-.2.2-.1.2-.3.3v-.4l.3.2h0Z'%20data-active='1'%20style='fill:%20%238b8989;'%20/%3e%3cpath%20d='M24.4,51.5h.2v.2h-.3s0-.2.2-.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e3e3;'%20/%3e%3cpath%20d='M25.6,52.1h.4c.1,0,0,0-.1.2,0,0-.2,0-.2-.2,0,0-.1,0,0,0Z'%20data-active='1'%20style='fill:%20%23cacaca;'%20/%3e%3cpath%20d='M24.7,52.1c.1,0,.2,0,.3-.2v.4c-.1,0-.2,0-.3-.2Z'%20data-active='1'%20style='fill:%20%237a797b;'%20/%3e%3cpath%20d='M25.5,51.6h.3s0,.2-.1,0-.1,0-.2,0Z'%20data-active='1'%20style='fill:%20%23d2d1d3;'%20/%3e%3cpath%20d='M24.7,51.6c.1,0,.2,0,.3-.2v.3h-.3Z'%20data-active='1'%20style='fill:%20%237f7e80;'%20/%3e%3cpath%20d='M25.1,51.7s0-.6,0-.2c0,0,.2,0,.1,0h-.2.1v.2Z'%20data-active='1'%20style='fill:%20%237c7b7f;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='calculus'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='calculus-shape-8'%20d='M20.4,43.2c.4,0,.8-.2.9-.4.3-.2.4-.6-.1-.7-.7-.2-1.4.8-.8,1.1h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-7'%20d='M16.7,42.6c-.4,0-.7.3-.9.5-.2.3-.3.7.2.7.8,0,1.3-1.1.7-1.3h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-6'%20d='M11.5,42.9c.5-.3.4-1.1.4-1.4,0-.5-.3-1.1-1-.6-.8.6-.3,2.4.6,2h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-5'%20d='M15.5,44.3c-.4-.4-1.1,0-1.5,0-.5.2-1,.5-.3,1.1.8.7,2.4-.3,1.8-1.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-4'%20d='M12.6,45c0-.5-.6-1-.9-1.1-.5-.3-1-.4-1.1.4,0,1,1.8,1.6,2,.7h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-3'%20d='M26.8,40.8c-.5.2-.7.9-.7,1.3-.1.5,0,1.1.8.8,1-.4.9-2.2,0-2.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-2'%20d='M24,43.9c0-.5-.8-.8-1.2-.9-.5-.2-1.1-.2-.9.7.2,1,2.1,1.2,2.1.3h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-1'%20d='M26.7,43.7c-.5-.3-1.1,0-1.5.3-.5.3-.8.7-.1,1.1.9.5,2.3-.8,1.6-1.4h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='plan'%20data-active='1'%3e%3cg%20id='extraction-plan'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M6.4,59.5c1.4-4,26.9-51.6,27.6-53.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3cpath%20d='M6.8,6.3c2.6,3.5,18.9,39.4,22.2,48.1.6,1.5,1.1,3,1.9,4.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3cg%20id='crown-needed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-needed-shape'%20d='M26.3,36.6c-4.6-5.7-12.3-4.6-15.2,1.9-1.3,3-2.2,5.9-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.5,1.4,7.2-2.2,10.8-1.1,1.5.3,2.8.9,4.2.7,9.4-2.4,4.7-15.1,2.7-23.1-.5-1.8-2.2-5.4-2.2-5.4Z'%20data-active='1'%20style='fill:%20%23c83014;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='crown-needed-path'%20d='M17.1,34.4c-2,3.6-4,7.2-6,10.7-.7,1.5-2.9,3.3-2,5,1.1,1.2,2-1.3,2.6-2.1,3-4.5,5-10.5,9.9-13.3.4-.2.7-.2.8,0,.2.2.1.7,0,1.2-2,7.1-9.7,14-11.8,20.8-4.5,12.9,1.5,5.4,4.4-1.2,2.5-4.8,6.3-12.5,9.9-16.5,2.3-1.7,1.6,2.6,1.2,4-1.3,6.8-9.8,12.4-9.9,19.5.9,5.7,8-10,9.6-12.2.6-1,2.5-3.3,2.6-1.1,0,3.8-2.4,8-4.1,11-.5,1.1-1.2,2.2-1.3,3.4.7,2.6,5.4-4.6,6.2-5.6'%20data-active='1'%20style='fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='crown-replace'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-replace-shape'%20d='M26.3,36.6c-4.6-5.7-12.3-4.6-15.2,1.9-1.3,3-2.2,5.9-2.8,9.2-1.2,5-2.8,15.3,2.5,17.8,3.5,1.4,7.2-2.2,10.8-1.1,1.5.3,2.8.9,4.2.7,9.4-2.4,4.7-15.1,2.7-23.1-.5-1.8-2.2-5.4-2.2-5.4Z'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23c83014;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", i0 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20Part%20of%20React%20Odontogram%20Modul%20-%20https://github.com/ZoliQua/React-Odontogram-Modul%20-%20SVG%20Version:%202.5.0%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20id='molar_x5F_tooth'%20version='1.1'%20viewBox='0%200%2042.9%2070.9'%3e%3cstyle%3e%20[data-active='0']%20{%20display:%20none;%20}%20%3c/style%3e%3cdefs%3e%3clinearGradient%20id='linear-gradient-16-0'%20x1='-2241.4'%20y1='10264.5'%20x2='-2237.3'%20y2='10264.5'%20gradientTransform='translate(-430.9432%20-10469.9416)%20rotate(-14.8)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-1'%20x1='-29600.9'%20y1='-4502.5'%20x2='-29596.9'%20y2='-4502.5'%20gradientTransform='translate(-27477.0896%20-11842.72)%20rotate(-165.3)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-2'%20x1='-982.8'%20y1='8735.6'%20x2='-978.7'%20y2='8735.6'%20gradientTransform='translate(-78.4749%20-8772.3032)%20rotate(-7.1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-3'%20x1='-28918.6'%20y1='-6594.2'%20x2='-28914.5'%20y2='-6594.2'%20gradientTransform='translate(-27973.0513%20-9808.9247)%20rotate(-173.5)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-4'%20x1='-2753.7'%20y1='10834.4'%20x2='-2749.6'%20y2='10834.4'%20gradientTransform='translate(-427.7167%20-11149.4326)%20rotate(-16.5)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-5'%20x1='-28669.9'%20y1='480.1'%20x2='-28666'%20y2='480.1'%20gradientTransform='translate(-27024.4866%20-16196.441)%20rotate(-148.2)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-6'%20x1='-28672.3'%20y1='473.8'%20x2='-28668.3'%20y2='473.8'%20gradientTransform='translate(-27024.4866%20-16196.441)%20rotate(-148.2)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-7'%20x1='-10609.7'%20y1='15085.3'%20x2='-10605.8'%20y2='15085.3'%20gradientTransform='translate(-3293.6827%20-18765.7118)%20rotate(-47.7)%20scale(1.1%201)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23ff422a'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23000'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-8'%20x1='21.6'%20y1='-4018.9'%20x2='21.6'%20y2='-4028.6'%20gradientTransform='translate(0%20-3980.1562)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.2'%20stop-color='%23cf0'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b4c500'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-9'%20x1='21.2'%20y1='-4015.1'%20x2='21.2'%20y2='-4022.6'%20gradientTransform='translate(0%20-3980.1562)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23c8c9c9'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23828282'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-16-0'%20cx='-421.2'%20cy='-3016'%20fx='-421.2'%20fy='-3016'%20r='11.5'%20gradientTransform='translate(569.1591%20-2966.1562)%20scale(1.3%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23ececec'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23cfcfcf'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23bababa'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23aeaeae'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23aaa'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-1'%20cx='-695'%20cy='-3018.1'%20fx='-695'%20fy='-3018.1'%20r='10.2'%20gradientTransform='translate(1134.4182%20-2966.1562)%20scale(1.6%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fefefe'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f8d6d4'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f2b5b2'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23ee9b98'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23eb8985'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%23e97e79'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e97b76'%20data-active='1'%20/%3e%3c/radialGradient%3e%3clinearGradient%20id='linear-gradient-16-10'%20x1='21.4'%20y1='3083.5'%20x2='21.4'%20y2='3073.9'%20gradientTransform='translate(0%20-3026.6104)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23cd986a'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23f9ae94'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-16-2'%20cx='21.4'%20cy='18.5'%20fx='21.4'%20fy='18.5'%20r='14.8'%20gradientTransform='translate(0%2070.4)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-3'%20cx='21.2'%20cy='21'%20fx='21.2'%20fy='21'%20r='15.8'%20gradientTransform='translate(0%2070.4)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-4'%20cx='21.4'%20cy='18.5'%20fx='21.4'%20fy='18.5'%20r='14.8'%20gradientTransform='translate(0%2070.4)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-5'%20cx='21.2'%20cy='21'%20fx='21.2'%20fy='21'%20r='15.8'%20gradientTransform='translate(0%2070.4)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-6'%20cx='21.4'%20cy='-993.5'%20fx='21.4'%20fy='-993.5'%20r='9.1'%20gradientTransform='translate(0%20-938.1)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-7'%20cx='21'%20cy='-987.3'%20fx='21'%20fy='-987.3'%20r='14.1'%20gradientTransform='translate(0%20-938.1)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3c/defs%3e%3cg%20id='base'%20data-active='1'%3e%3cpath%20id='bone-base'%20d='M42.4,18.2l-3.1,1.3c-2.7,1.6,0,9.7-2.1,12.1,0,4.9-4.9,3.9-6.3,3.8-4.2-.2-14,0-19,0s-5.4-3.3-5.5-3.1c-2.2,0-2.3-12.8-2.3-12.8l-1.6-2.2c-.2-.4-2.5-1-2.5-1.6V0h42.5v18.2h-.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cpath%20id='gum-base'%20d='M42,20.8c-1.1,1-2.9,1.7-3.5,3-1.1,3.5-.2,7.6-1.7,11-2.1,5.1-6.5.4-10.7.5-4.2,0-8.7-.2-12.7.5-2.4.6-5,2.6-7.5,1.2-6.1-3.7-1.8-12.6-4.2-17.6-.2-.9-2.1-2.3-1.1-2.8,1.1-.5,4.5,1,4.8,2.2,2.1,3.7-2,13.9,3.7,15.2,2.7.3,8.8-.6,14-.9,4-.6,10.1.9,12.2-2.3,2.1-3.2,0-8.1,2.6-11.1s5.8-1.2,4.1.9h0v.2h0Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3c/g%3e%3cg%20id='mods'%20data-active='1'%3e%3cpath%20id='parodontal'%20d='M9.9,37c1.4.5,3.1.2,4.7.3,4.5.5,8.1.8,12.2,0,1.6-.3,3.7-.2,5.2-.3,1,0,1.6-.4,1.7-1.2,0-2.6.6-5.2.7-7.9,0-1.8,1.1-5-.6-6.4-1.7-1.1-5-1.7-7.5-1.3-2.5.6-1.2,4.2-2.6,5.5s-2.2.5-2.7,0-.9-2.3-1.2-3c-1.7-3.5-8.1-1.2-11.1-.1-1,.4-.6,2-.7,2.9-.2,1.5,0,3.4,0,5,.4,2.3-1,4.7,1.4,6.3h.1l.2.2s.2,0,.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ffa46a;'%20/%3e%3cg%20id='inflammation'%20data-active='1'%3e%3cg%20id='cysta'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='cysta-outside'%20d='M8.4,5.4c-3.3,3.2-2,11.9,2,14.2,4,2.4,6.2,2.4,8.8,2.7,5.2.5,14.5-.7,16.3-8.5C37.6,3.9,27.5,1.5,20.4,1.9c-3.8,0-9,.7-12,3.5Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='cysta-inside'%20d='M9.6,6c-3.1,2.9-1.8,10.6,1.8,12.6s5.7,2.1,8.1,2.4c4.8.4,13.2-.6,15-7.5,1.8-8.9-7.4-11-13.9-10.7-3.4,0-8.2.6-10.9,3.1h-.1Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='granuloma'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='granuloma-outside'%20d='M8.9,6.1c-3.6,2.3-2.2,8.5,2.2,10.2,4.4,1.7,6.7,1.7,9.6,1.9,5.7.4,15.7-.5,17.7-6.1,2.1-7.1-8.9-8.8-16.6-8.5-4.1,0-9.7.5-12.9,2.5Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='granuloma-inside'%20d='M10.1,6.9c-3.3,1.9-1.9,6.9,1.9,8.2,3.8,1.3,6.1,1.3,8.6,1.5,5.1.3,14-.4,15.9-4.9,2-5.8-7.8-7.2-14.7-7-3.6,0-8.7.4-11.5,2h-.2s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23feffd5;'%20/%3e%3c/g%3e%3cg%20id='abscess'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='abscess-inside'%20d='M10.8,7.4c-1.1.9-3.2-2-7.4,1.6s5.5,2.5,6.1,5.7c.6,3.2-3,3.5-2.1,4s8.3-2.3,9-2.1c1.4.5,2.5.5,3.6.7,1.6.1,3.8,0,5.7-.5s3.2.4,4.2-.5,9.6-.8,9.3-1.7-5.5-3.7-5.4-4.3c.3-1.2,4.6-4.1,4.4-5s-8.1,2.2-8.9,1.6-.4-2.2-.9-2.4c-.9-.4-2.3,0-3.3-.2s-2.9-.5-4.2-.5-3.2.3-4.9.8-2.3,1.1-3,1.8l-1.8-1.3-.4,2.4h0Z'%20data-active='1'%20style='fill:%20%23feffd5;%20stroke:%20%23ffa46a;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='mobility'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-mobility-2'%20d='M32.3,12.1l3.9-1.1c-1.4,1.6-2.7,3.2-4.1,4.8,1.4-.4,2.8-.7,4.2-1.1-1.8,1.9-3.5,3.8-5.2,5.8,1.6-.2,3.2-.3,4.9-.5-1.5,1.4-3,2.8-4.6,4.2,1-.1,2-.2,3.1-.2-1,1.1-2,2.2-3.1,3.3,1.3-.4,2.7-.6,4-.6-1.2,1-2.3,2.1-3.4,3.3.9-.2,1.8-.2,2.8-.1-1.1.8-2.2,1.6-3.3,2.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3cpath%20id='tooth-mobility-1'%20d='M8.4,12.4c1-.4,2.1-.2,3,.6-1.2,1.3-2.4,2.5-3.7,3.6,1.3-.2,2.6-.2,3.8.2-1.2,1.2-2.3,2.5-3.4,3.9.9,0,1.9.1,2.9.4-.8.9-1.6,1.9-2.4,2.8.7,0,1.5.1,2.2.5-.8,1.2-1.4,2.6-2.1,4,.9-.3,1.7-.5,2.6-.8-1.2,1.2-2.2,2.7-3.1,4.5.7.1,1.5,0,2.2-.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth-variants'%20data-active='1'%3e%3cpath%20id='no-tooth-after-extraction'%20d='M20.2,36.5c-4.4,0-11.9,2.5-10.6-1.7,3.2-9.7-2.2-22.9.8-26.1,2.6-2.3,5.2,0,5.8,2.4,1.7,4.5,1.4,10.5,2.6,15.4.6,2,3.6,2.4,5.7,1.6,1.4-.5,1.8-2.2,2-3.9.5-4.4.7-9.2,2-13,.7-1.7,1.2-3,3.5-3.1,6.3,0-.7,16.6,1.6,24.9.8,2.2-2.3,3.9-4.6,3.8,0,0-1.7.3-8.8,0,0,0,0-.3,0-.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='tooth-under-gum'%20d='M15.6,12.6c.5.7,1.3,1.6,2.4,1.7,1,0,1.5-.9,1.5-1.6,0-2.5-1.9-4.7-1.8-7.2.1-.9,1.1-1.3,1.8-.7.9.6,1.4,1.6,2,2.5.9,1.6,1,3.3,1.2,5.1.2,1.9.9,3.8,2.4,5.3,2.5,3,8,7.3,3.6,10.9-.7.4-1.6.5-2.6.7-1.8.3-2.5,1.6-4,2.5-4.5,2.7-6.3-4.6-6.3-7.2s.1-2.5-.3-3.6c-.8-2.3-2.7-4.4-3.5-6.6-.6-1.4-1-3-1.3-4.6-.2-.8,0-3,1.5-2.3,1.5,1.3,2.1,3.6,3.3,5h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-incisal'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4,2.1,7.5,8.5,19.4-.4,23.6s-.5-.9-1.2-.7c-1,0-1.4-2.3-2.5-2.5s-2.7-2.9-3.6-3.1c-1-.3-2.9,1.2-4.7,1.2s-3.5-1.3-4.4-1c-1.4.4.4,7.3-1.2,7.5-11.1,1.4-8.4-14.5-6.1-19.4,1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.2,4.5,3.3,5.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal-incisal'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4.9,3,2,6.7,2.9,10.3s-3.6,1.9-3.6,3.4-4,1.2-4.6,2.6-.7,2.1,0,3.1c1.5,2.3,5,4.4,2.7,5.1-.8,0-2.6-1.9-3.5-2.1s-3.5-.5-4.5-.7c-2.1-.6-1.1-6.2-2.9-5.6s-1.9,5.2-3.4,5.4c-1.4.2-3.8,3.8-4.8,3.5-2.6-.8-3.8-3.1-4.3-5.8s6.4.6,6.4-.5-2.9-3.2-2.8-4.1c.1-1.3,3.6-3.4,3.9-4.6s-1.5-3.9-1-4.8c1.1-2.3-2.3-4-2.1-6.6.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.4,4.4,3.5,5.4v-.2s-.1,0-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-distal'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4.9,3,2,6.7,2.9,10.3s-3.6,1.9-3.6,3.4-4,1.2-4.6,2.6-.7,2.1,0,3.1c1.5,2.3,5,4.4,2.7,5.1-1.7.2-3.6-.5-5.6-.9-3.7-1-6.4,1-10,1.5-5,.6-7.2-2.2-7.9-6s6.4.6,6.4-.5-2.9-3.2-2.8-4.1c.1-1.3,3.6-3.4,3.9-4.6s-1.5-3.9-1-4.8c1.1-2.3-2.3-4-2.1-6.6.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.4,4.4,3.5,5.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial-incisal'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4.7,2.8,2.2,6.3,3.1,9.7s-3,1.8-2.7,2.9c.4,2.1-1.4,2.3-1.9,4s-3.2-2.3-4.5-1.3-.1,3.2-1.7,3.6c-1.7.2-2.4-1.3-4.4-1.7-1.4-.4,1.4,5.9.2,6.1-2,.4-3.9,1.3-6.2,1.6-11.1,1.4-8.4-14.5-6.1-19.4,1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.3,4.6,3.4,5.6Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4.9,3,2,6.7,2.9,10.3s-3.6,1.9-3.6,3.4-4,1.2-4.6,2.6-.7,2.1,0,3.1c1.5,2.3,5,4.4,2.7,5.1-1.7.2-3.6-.5-5.6-.9-3.7-1-6.4,1-10,1.5-11.1,1.4-8.4-14.5-6.1-19.4,1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.4,4.4,3.5,5.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal-incisal'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4,2.2,8,9.4,21.1-2.5,24.4-1.7.2-3.6-.5-5.6-.9-1.4-.4-1.1-3.5-2.4-3.2s-2.5-3.5-3.2-3.6c-1.2,0-.2-9.1-3.1-2.9-3.1.4-2.4,5.1-3.6,3.4s-2,.9-2.1-.9-.1-2,0-3.2-3.2-1.6-3-2.9.9-3.4,1.4-4.5c1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.2,4.4,3.3,5.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal'%20d='M21.3,27.9c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4,2.2,8,9.4,21.1-2.5,24.4-1.7.2-3.6-.5-5.6-.9-3.7-1-6.4,1-10,1.5-1.4.2-2.6,0-3.6-.3-2.5-.8,5.4-5.3,4.9-8s-4.9-.2-4.9-1.4,2.2-3.1,2.4-4c.2-1.6-6.1-2-5.7-3.3s.6-1.8.9-2.5c1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.2,4.6,3.3,5.6Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-crownprep'%20d='M25.6,25.7c2-4.3.7-9.3,2.2-13.7.4-1.1,1.4-2.6,3-2.4,4.9,1.5,3.9,12.1,2.6,15.5-.9,3.2-1.7,5.8-1.7,9s1.3,3.1,1.6,4.6-2.7-.4-2.7,1.2,1.8,4.9,1.1,6.6-2.9,2.6-5.2,2.2c-2.5-.4-3-2.5-5-2.3-2.6.5-5.8,4.2-8.9,2.4-1.2-.6-1.5-1.9-1.5-3.4s.4-3.2.7-4.1-2.5.5-2.5-.4,1-2.5,1-3.3c0-7.1-1.9-13.3-.5-20.5.6-2.6.6-6.1,3.5-7.8,1.1-.5,2,.2,2.5,1,1.9,3.8,1.1,8.6,2,12.2,0,0,4.8,8.1,7.7,3.3h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-radix'%20d='M25.6,25.7c2-4.3.7-9.3,2.2-13.7.4-1.1,1.4-2.6,3-2.4,4.9,1.5,3.9,12.1,2.6,15.5-.9,3.2-1.7,5.8-1.7,9s1.3,3.1,1.6,4.6-9.8,7.5-11.8,7.7c-2.6.5-12.2-4.6-12.2-5.5s1-2.5,1-3.3c0-7.1-1.9-13.3-.5-20.5.6-2.6.6-6.1,3.5-7.8,1.1-.5,2,.2,2.5,1,1.9,3.8,1.1,8.6,2,12.2,0,0,4.8,8.1,7.7,3.3h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='tooth'%20data-active='1'%3e%3cpath%20id='tooth-base'%20d='M21.3,27.7c1.9.9,3.6-.4,4.2-1.8,2.1-4.8.4-10.7,2.7-15.5,1-1.7,3.2-1.5,4.2.2,1.2,1.9,1.4,4.3,1.7,6.5.4,3.8-.9,7.3-2,11-1.2,4-1.5,8.3,0,12.4,2.2,8,9.3,21.1-2.6,24.4-1.7.2-3.6-.5-5.6-.9-3.7-1-6.4,1-10,1.5-11.1,1.4-8.4-14.5-6-19.4,1.1-2.3,2.4-4.7,2.6-7.3.4-5.2-1.4-10.8-1-15.9,0-3.3.6-6.8,1.5-10.1.2-1.7,2.7-5.9,4.9-3.2,1.7,3.9,1.1,8.8,2,12.6,0,0,1.3,4.5,3.4,5.5Z'%20data-active='1'%20style='fill:%20%23ebebeb;%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='tooth-base-beauty'%20data-active='1'%3e%3cpath%20id='tooth-base-beauty-1'%20d='M34.2,52.7v-.2.2c0,1.4,0,2.8-.2,4.2s-1.5,3.2-2.9,4.1-.6.3-1,.2c.1-.4.4-.5.6-.8,1.6-2.2,2.7-4.7,3.2-7.6h.3Z'%20data-active='1'%20style='fill:%20%23fefdfd;'%20/%3e%3cpath%20id='tooth-base-beauty-2'%20d='M16.9,59.9c2.1-.8,5.6-1.2,7.6.6-1.9-.4-3.6-.4-5.5,0l-2.7.8c-1,.3-2,.4-2.9,0l3.6-1.4h0Z'%20data-active='1'%20style='fill:%20%23fefefe;'%20/%3e%3c/g%3e%3cg%20id='tooth-inflam-pulp'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-inflam-pulp-base-2'%20d='M14.6,10c1.1.7,0,4.1.4,6.7,0,3.6.7,7.7,2.7,10.8,1,1.3,1.9,2.2,3.5,2.3,1.2.2,2.6,0,3.5-.6,2.7-1.8,4.6-9.3,5-13.4.2-1.2.4-7.6,1.7-3.3,1.1,4-.9,6.7-1.5,11-1.1,3.4-2.7,7.2-2.1,12,.4,2.9,1.7,6.4,2.4,9.1.6,2.7-1,2.6-3.7,1.4-2-.7-3.5-2.4-5.9-2-3.6.7-6.2,3.9-7.4,3.3-.5-.2-.7-1.9-.5-2.3.6-2.7,1.7-5.5,2-8.2.2-2.9-.2-5.9-.6-8.9-.4-2.9-2.5-17.3.6-18.2h0v.3s-.1,0-.1,0Z'%20data-active='1'%20style='fill:%20%23ff422a;'%20/%3e%3cpath%20id='tooth-inflam-pulp-base-1'%20d='M17.1,33.3c.4-.8,0-1.9,0-2.8.5,2.1.9,5.4.6,7.7,0,.6-.4,1.8-.5,2.2,0,.2,0,0,.2-.6.2-.5.5-1,.9-1.2.2,0,.5-.2.6-.3,0-.2,0-.4-.2-.7-.7-1.4-.9-3.1-.9-4.8s0-1.9,1.2-.5c2.4,2.1,3.6,0,5.5-1,.5,0,0,2.8,0,4s-.6,2.2-1.2,3.1h0c.7-.2,1.2.2,1.6,1,.2.6.4,1,.4.8-.7-3.6-.7-7.6.7-11.1,0,1-.4,3.2-.2,4.5-.2,2.8,2.4,7.9,0,9.2-1.2.4-3.1-1.1-5-1-1.5,0-3.1,1.3-4.5.5-2.1-1.9-.2-6.8.5-8.9h.3Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3cpath%20id='pulp-inflam-path-8'%20d='M32.1,24.5h0v-.2c-.4-.1-.7-.2-1-.1-.7.2-1.6.3-2.2.6s-1.1.7-.1.8,2.6-.2,3.4-1.1h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-0);'%20/%3e%3cpath%20id='pulp-inflam-path-7'%20d='M11.5,23.7h0v.2c0,.2.4.4.7.5.7.2,1.6.3,2.4.4s1.2,0,.6-.6-2.5-.9-3.6-.4h0c0-.1-.1-.1-.1-.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-1);'%20/%3e%3cpath%20id='pulp-inflam-path-6'%20d='M33.7,16.9h0v-.2c-.2-.2-.6-.3-.9-.2-.7,0-1.6,0-2.4.4s-1.2.5-.1.7,2.6,0,3.5-.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-2);'%20/%3e%3cpath%20id='pulp-inflam-path-5'%20d='M11.3,16.4h0v.2c0,.2.5.4.7.4.7,0,1.6.2,2.4,0s1.2-.3.4-.7-2.6-.5-3.6,0h0c0,.1.1.1.1.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-3);'%20/%3e%3cpath%20id='pulp-inflam-path-4'%20d='M17.3,18.6h0v-.2c-.2-.1-.6-.1-1-.1-.7,0-1.5.4-2.2.7s-1,.6,0,.7,2.6-.3,3.4-1.1c0,0-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-4);'%20/%3e%3cpath%20id='pulp-inflam-path-3'%20d='M28.3,12.3h0v.2c0,.3.4.5.6.7.6.4,1.5.7,2.2.9s1.4.2.7-.5-2.1-1.4-3.5-1.4h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-5);'%20/%3e%3cpath%20id='pulp-inflam-path-2'%20d='M27.2,19.1h0v.2c0,.3.4.5.6.7.6.4,1.5.7,2.2.9s1.4.2.7-.5-2.1-1.4-3.5-1.4h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-6);'%20/%3e%3cpath%20id='pulp-inflam-path-1'%20d='M16.5,11.5h-.2c-.4,0-.6.2-1,.3-.6.4-1.1,1-1.6,1.6s-.5,1,.4.7,2.1-1.4,2.4-2.6h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-7);'%20/%3e%3c/g%3e%3cg%20id='tooth-healthy-pulp'%20data-active='1'%3e%3cpath%20id='tooth-healthy-pulp-2'%20d='M14.7,9.9c.8,1.6,0,3.8.2,5.8.1,3.9.8,8.8,3.4,11.8,2.9,3.3,4.3,2.7,7.4.1,2.7-1.9,3.6-9,4-12.7.1-1.1.2-2.7.6-3.6.1-.3.3-.5.4-.4.9.8,1,2.4,1,3.5-.4,4.4-2.8,9.1-3.3,13.8-.3,4,.8,8.7,1.6,12.6.6,2.1,0,3.2-2.2,2.4-5-1.7-5.9-3.9-11.6-.5-1,.5-2.1,1.6-3.1,1.1-.9-.9-.3-2.7,0-3.9,3.6-8.9-.7-16.1-.2-26,.2-1.6.1-3.6,1.5-4.3h.1l.2.2h0Z'%20data-active='1'%20style='fill:%20%23fcc5bc;'%20/%3e%3cpath%20id='tooth-healthy-pulp-1'%20d='M17.5,32.7c.4-.7,0-1.6,0-2.3.5,1.7.9,4.5.6,6.4,0,.5-.4,1.5-.5,1.8,0,.2,0,0,.2-.5.2-.4.5-.8.9-1,.2,0,.5-.2.6-.2,0-.2,0-.3-.2-.6-.7-1.2-.9-2.6-.9-4s0-1.6,1.2-.4c2.4,1.7,3.6,0,5.5-.8.5,0,0,2.3,0,3.3s-.6,1.8-1.2,2.6h0c.7-.2,1.2.2,1.6.8.2.5.4.8.4.7-.7-3-.7-6.3.7-9.2,0,.8-.4,2.7-.2,3.7-.2,2.3,2.4,6.6,0,7.7-1.2.3-3.1-.9-5-.8-1.5,0-3.1,1.1-4.5.4-2.1-1.6-.2-5.7.5-7.4h.3v-.2Z'%20data-active='1'%20style='fill:%20%23f6a09b;'%20/%3e%3c/g%3e%3cpath%20id='tooth-bruxism-wear'%20d='M14.5,58.8c.7.5,1,1.8,2.6.7.3-.2.8-.5,1.4-.5,1.4.2.8,1,2,1.3,1.2.2,3.1-1.9,4.6-1.2.4.2.6.6.8.8.8.7,2-1.2,2.6-1.4.6-.3,1.1,0,1.4.5,1.3,2.2,1.5,0,2.8-.7h.6c4.9,1.6,2.6,5.6-3.1,6.4-4.8.9-5.1,0-8.3-.9-.9-.3-4.3,1.1-6.7,1.6s-5.5.3-6.4,0c-1.6-1-5.8-7,1.1-7s3.6,0,4.4.6h.2s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='tooth-bruxism-neck-wear'%20d='M25.2,48.1c-.5-.2-.7-.9-1.8-.3-.2,0-.5.3-1,.3-1,0-.5-.5-1.4-.6-.8,0-2.1,1-3.1.6-.3,0-.4-.3-.5-.4-.5-.3-1.4.6-1.8.7-.4.2-.8,0-1-.2-.9-1.1-1,0-1.9.4h-.4c-3.4-.8-1.8-2.8,2.1-3.2,3.3-.5,3.5,0,5.7.4.6,0,2.9-.6,4.6-.8s3.8-.2,4.4,0c1.1.5,4,3.5-.7,3.5s-2.5,0-3-.3h-.1s-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='endos'%20data-active='1'%3e%3cpath%20id='endo-medical-filling'%20d='M15.4,40.3c4.5,1.3,11.3.9,14.6-2.2.9-1.4.5-3.4.1-5-.9-3.5,1-10.7,1.2-14.3,0-2.9.5-6.7,0-9.2-.7-1.4-1.1,6-1.4,6.4-.6,3.8-1.7,7-2.2,10.9-.2,1.4-.6,3-2.6,3.5-2.1.4-5.4,1.9-7,.1-1.1-2.1-1.2-4.9-1.9-7.3-.5-2.6-.7-4.7-1-7.4,0-.7-.5-8.8-1.7-5.2-1.1,6.4,0,13.2-.6,19.9,0,2-.4,3.5-.7,5.4-.5,1.8.7,3.7,2.9,4.3h.4-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23f9ae94;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='endo-filling-incomplete'%20d='M15.4,40.5c4.5,1,11.3.7,14.6-1.7.9-1.1.5-2.6.1-3.9-.9-2.7,1-8.3,1.2-11.1,0-2.2.5-5.2,0-7.1-.7-1.1-1.1,4.7-1.4,5-.6,2.9-1.7,5.4-2.2,8.5-.2,1.1-.6,2.3-2.6,2.7-2.1.3-5.4,1.5-7,0-1.1-1.6-1.2-3.8-1.9-5.7-.5-2-.7-3.6-1-5.7,0-.5-.5-6.8-1.7-4-1.1,5,0,10.2-.6,15.4,0,1.6-.4,2.7-.7,4.2-.5,1.4.7,2.9,2.9,3.3h.4-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-filling'%20d='M15.4,40.3c4.5,1.3,11.3.9,14.6-2.2.9-1.4.5-3.4.1-5-.9-3.5,1-10.7,1.2-14.3,0-2.9.5-6.7,0-9.2-.7-1.4-1.1,6-1.4,6.4-.6,3.8-1.7,7-2.2,10.9-.2,1.4-.6,3-2.6,3.5-2.1.4-5.4,1.9-7,.1-1.1-2.1-1.2-4.9-1.9-7.3-.5-2.6-.7-4.7-1-7.4,0-.7-.5-8.8-1.7-5.2-1.1,6.4,0,13.2-.6,19.9,0,2-.4,3.5-.7,5.4-.5,1.8.7,3.7,2.9,4.3h.4-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23388aca;'%20/%3e%3cpath%20id='endo-glass-pin'%20d='M31.3,21.6c0,2.2-1.4,5.5-1.5,8.4-.1,2.2,1.4,4.5-.1,6.5-1.4,1.9-4.1,3-6.9,2.5-1.1-.2-2.4-.5-3.5-.2-3.6,1.1-7.2.7-6.9-3.1.2-2.3,1-4.2,1-6.5.5-4.2-.6-8.3.5-12.4,1.1-2.1,1.6,2.5,1.6,3.1.1,1.9.4,3,.7,4.9.2,1.2.7,2.3,1,3.5.4,1,.5,2.1,1.7,2.5s2.7,0,4.1-.2c2.4-.3,4.1-.7,4.5-2.8.7-3.2,2-5.6,2.5-8.6.2-.9.2-2.4.9-3.1.2,0,.2.3.4.5.2,1.3,0,3.6,0,4.9v.2h-.1.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23c8c9c9;'%20/%3e%3cpath%20id='endo-metal-pin'%20d='M31.3,21.6c0,2.2-1.4,5.5-1.5,8.4-.1,2.2,1.4,4.5-.1,6.5-1.4,1.9-4.1,3-6.9,2.5-1.1-.2-2.4-.5-3.5-.2-3.6,1.1-7.2.7-6.9-3.1.2-2.3,1-4.2,1-6.5.5-4.2-.6-8.3.5-12.4,1.1-2.1,1.6,2.5,1.6,3.1.1,1.9.4,3,.7,4.9.2,1.2.7,2.3,1,3.5.4,1,.5,2.1,1.7,2.5s2.7,0,4.1-.2c2.4-.3,4.1-.7,4.5-2.8.7-3.2,2-5.6,2.5-8.6.2-.9.2-2.4.9-3.1.2,0,.2.3.4.5.2,1.3,0,3.6,0,4.9v.2h-.1.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%233951a3;'%20/%3e%3cg%20id='endo-resorption'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20id='endo-resorption-distal'%20d='M8.8,10.9s2.3-6.2,2.6-6.2l4.2.2c1.1,0,2.6,6.9,2.6,7l-.4,1.6c-.1.6-.4,1.2-.7,1.6l-1.3,2c-.8,1.2-2.2,1.3-3.1.2l-1.9-2.3c-.2-.2-.3-.4-.4-.6l-1.7-3.6h0Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cpath%20id='endo-resorption-mesial'%20d='M24.6,10.9s2.3-6.2,2.6-6.2l4.2.2c1.1,0,2.6,6.9,2.6,7l-.4,1.6c0,.6-.4,1.2-.7,1.6l-1.3,2c-.8,1.2-2.2,1.3-3.1.2l-1.9-2.3c-.2-.2-.3-.4-.4-.6l-1.7-3.6h.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3c/g%3e%3cpath%20id='endo-resection'%20d='M6.9,14s6.7-8.6,7.7-8.6c2.9,0,9.8-.2,13.2-.3s8.5,9.1,8.5,9.4l.2,7.6-29.5.6-.2-8.8h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fdecc5;'%20/%3e%3c/g%3e%3cg%20id='surfaces'%20data-active='1'%3e%3cg%20id='subcaries'%20data-active='1'%3e%3cpath%20id='subcaries-buccal'%20d='M17.9,53.4c.7.8,1.8,1.2,2.7,1.2,1.5,0,2.7-1,3.4-2.6s.5-1.1.5-1.8c-.6-3.4-7.1-2.2-8-.8-.5,1.1.8,3,1.4,3.8h0s0,.2,0,.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-mesial'%20d='M29.2,46.6c-.2.4-.7,1-1.2,1.1-3.9.9-.7,8.4,1.2,9.8,2.2,2.9,6.5,2.4,7.4-1.4.5-2.1-.4-8.2-2.8-11.1s-.4-1.1-.9-1.2-.6,0-.9.2c-.7,0-1.4.5-1.8,1.1,0,0-1,1.5-1,1.5Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-distal'%20d='M9.4,58.4c1.6-.2,2.9-.7,3.6-3s.5-4.4.7-5.4c.8-3.9.7-8.5-3.2-8.1-3.6.6-5.7,9.8-4.4,14.4s2,1.8,3.2,2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='subcaries-occlusal'%20d='M11.8,64.7c1.9,1.7,4.7.9,7.4.2,1.9-.5,3.5-.5,5.5-.2,5.3.9,8.2-.6,6.4-4.8-2-3.8-7-3.8-11.1-3.5-6,0-12.6,4.4-8.8,9.1s.3-1,.5-.8h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='caries'%20data-active='1'%3e%3cpath%20id='caries-root'%20d='M10.1,31.7c.8,2.7,16.2.8,18.1.3,2.9-.5,3.7-1,3.7-3-.1-3-8.3,1.8-10.1,2-2.9.3-8.2-3-11.1-3.9s-1.1.2-1,.8c0,1.1.3,2.8.5,3.8h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-subcrown'%20d='M17.9,37.5c3.4-1.5,8.6-3.1,7-5.6-2.5-2.7-11.2-2.2-13.2.4-1.6.8-.9,1.8-1,3.2,0,.8-.3,3.6-.4,4.7s1.5,2.3,2.6,1.5c1.7-1.2,4.2-3.8,5-4.1h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-buccal'%20d='M17,53.4c.7.6,1.9.9,2.9.9,1.6,0,2.9-.7,3.6-1.9s.5-.8.5-1.3c-.6-2.5-7.6-1.6-8.5-.6-.5.8.9,2.2,1.5,2.8h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='caries-mesial'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='mesial-shape'%20d='M30.3,42.3c-4.5-.2-4.4,10.1-2.6,11.6,1.7,2.7,6.7,2.6,7.9-.7.9-2.5-1.9-9.9-5.1-10.9,0,0-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='mesial-patch2'%20d='M31,47.4c4,0-1.2-4.3-2.2-1.6-.4.9,1,1.7,1.9,1.6h.4,0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='mesial-patch1'%20d='M29.6,52.6c1.7,1.3,5.7-.7,2.6-1.6-2-.5-3.1.6-2.6,1.5h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-distal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='distal-shape'%20d='M9.4,57.5c2.4-.3,3.4-4.6,3.9-6.7.7-3.1.6-6.8-2.9-6.5-4.4.7-5.2,12.3-1.1,13.2,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='distal-patch2'%20d='M11.2,47.9c.9-.5.6-2.4-.5-2.3s-.9,2.7.2,2.3h.3Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='distal-patch1'%20d='M8.8,54.4c0,.3.6.5,1,.6.2,0,.7.2.7,0-.2-.5-1-1.5-1.4-1.8-.7-.3-.5.9-.4,1.2h.1Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-occlusal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='occlusal-shape'%20d='M12.9,63.6c1.7,1.7,4.4,1,6.9.4,1.7-.4,3.2-.4,5.1,0,4.9,1,7.6-.3,6.1-4.4-1.7-3.7-6.4-3.8-10.2-3.7-5.7-.2-12.1,2.7-8,7.6h.1,0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='occlusal-patch2'%20d='M23.8,60.8c-.9,3,4.1,1.5,4.5,0,.6-.8.2-2-.6-2.3-1.5-.5-3,1-4,2.1h0v.2h.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='occlusal-patch1'%20d='M14.2,60.9c-.1,1.5,1.2,2.6,2,1.2.5-.9.5-3.1-.5-3.1s-1.4.7-1.4,1.8v.2h-.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fillings'%20data-active='1'%3e%3cg%20id='amalgam'%20data-active='1'%3e%3cpath%20id='filling-amalgam-occlusal'%20d='M11,61.9c-1.2,2.3.4,4,3.4,3.6,2.7-.2,5.2-1.4,7.9-1.6,2.9-.5,9.6,2.5,8.7-1.9-.6-3.7-4.2-5.4-9.2-5.3-4.6,0-8.9,1.7-10.6,5v.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-buccal'%20d='M20.7,53.9c2-.3,3.4-2.7,2.9-4.2-.6-1.5-4-1.3-5.4-.2-2,1.5-.1,4.4,2.4,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-mesial'%20d='M28.3,48.6c-3.9,1.6,0,5,1,7.3.5.8.9,1.9,2,2.2,2.7.9,5.2-.5,5.4-2.8-.2-2.1-1.1-4.3-1.5-6.5-.4-.8-1.2-6.2-2.9-4.3-1,1.4-2,3.2-3.7,4h-.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-distal'%20d='M11,57.1c3.6-1.3,1.4-5.3,2.2-7.7.5-2.9,1-6.4-1.4-6.9-1.6-.4-2.7,1-3.1,2.1-1.4,3.1-6.5,14.5,2,12.6h.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23aaa;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='composite'%20data-active='1'%3e%3cpath%20id='filling-composite-occlusal'%20d='M11,61.9c-1.2,2.3.4,4,3.4,3.6,2.7-.2,5.2-1.4,7.9-1.6,2.9-.5,9.6,2.5,8.7-1.9-.6-3.7-4.2-5.4-9.2-5.3-4.6,0-8.9,1.7-10.6,5v.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-buccal'%20d='M20.7,53.9c2-.3,3.4-2.7,2.9-4.2-.6-1.5-4-1.3-5.4-.2-2,1.5-.1,4.4,2.4,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-mesial'%20d='M28.3,48.6c-3.9,1.6,0,5,1,7.3.5.8.9,1.9,2,2.2,2.7.9,5.2-.5,5.4-2.8-.2-2.1-1.1-4.3-1.5-6.5-.4-.8-1.2-6.2-2.9-4.3-1,1.4-2,3.2-3.7,4h-.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-distal'%20d='M11,57.1c3.6-1.3,1.4-5.3,2.2-7.7.5-2.9,1-6.4-1.4-6.9-1.6-.4-2.7,1-3.1,2.1-1.4,3.1-6.5,14.5,2,12.6h.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffbf;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gic'%20data-active='1'%3e%3cpath%20id='filling-gic-occlusal'%20d='M11,61.9c-1.2,2.3.4,4,3.4,3.6,2.7-.2,5.2-1.4,7.9-1.6,2.9-.5,9.6,2.5,8.7-1.9-.6-3.7-4.2-5.4-9.2-5.3-4.6,0-8.9,1.7-10.6,5v.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-buccal'%20d='M20.7,53.9c2-.3,3.4-2.7,2.9-4.2-.6-1.5-4-1.3-5.4-.2-2,1.5-.1,4.4,2.4,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-mesial'%20d='M28.3,48.6c-3.9,1.6,0,5,1,7.3.5.8.9,1.9,2,2.2,2.7.9,5.2-.5,5.4-2.8-.2-2.1-1.1-4.3-1.5-6.5-.4-.8-1.2-6.2-2.9-4.3-1,1.4-2,3.2-3.7,4h-.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-distal'%20d='M11,57.1c3.6-1.3,1.4-5.3,2.2-7.7.5-2.9,1-6.4-1.4-6.9-1.6-.4-2.7,1-3.1,2.1-1.4,3.1-6.5,14.5,2,12.6h.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary'%20data-active='1'%3e%3cpath%20id='filling-temporary-occlusal'%20d='M11,61.9c-1.2,2.3.4,4,3.4,3.6,2.7-.2,5.2-1.4,7.9-1.6,2.9-.5,9.6,2.5,8.7-1.9-.6-3.7-4.2-5.4-9.2-5.3-4.6,0-8.9,1.7-10.6,5v.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-buccal'%20d='M20.7,53.9c2-.3,3.4-2.7,2.9-4.2-.6-1.5-4-1.3-5.4-.2-2,1.5-.1,4.4,2.4,4.4h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-mesial'%20d='M28.3,48.6c-3.9,1.6,0,5,1,7.3.5.8.9,1.9,2,2.2,2.7.9,5.2-.5,5.4-2.8-.2-2.1-1.1-4.3-1.5-6.5-.4-.8-1.2-6.2-2.9-4.3-1,1.4-2,3.2-3.7,4h-.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-distal'%20d='M11,57.1c3.6-1.3,1.4-5.3,2.2-7.7.5-2.9,1-6.4-1.4-6.9-1.6-.4-2.7,1-3.1,2.1-1.4,3.1-6.5,14.5,2,12.6h.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='defect'%20data-active='1'%3e%3cpolygon%20id='defect-occlusal'%20points='20.4%2064.5%2018.4%2064%2020.3%2063.4%2024.3%2063.2%2026.3%2063.7%2024.4%2064.4%2020.4%2064.5'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-buccal'%20points='19.7%2049.3%2018.8%2048.8%2019.6%2048.2%2021.3%2048%2022.2%2048.5%2021.4%2049.2%2019.7%2049.3'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-distal'%20points='7.3%2049.7%206.3%2050.9%206.2%2049.3%207.2%2046.6%208.2%2045.5%208.2%2047%207.3%2049.7'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-mesial'%20points='36%2050.8%2035.8%2052.4%2034.9%2051.1%2034.2%2048.3%2034.4%2046.8%2035.3%2048.1%2036%2050.8'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='contact-point'%20data-active='1'%3e%3cg%20id='mesial-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M34.6,50c1.1,2.9,2.5,6.1,4,9.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M35.1,59.9c.7-1.9.8-3.1,1.3-4.6.6-1.7,1.1-3.5,1.5-5.4'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='distal-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M4.1,50.6c.9,3.1,2.2,6.4,3.4,9.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M3.9,60.4c.9-1.8,1-2.9,1.7-4.3.8-1.6,1.4-3.3,1.9-5.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fissure-sealing'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='fissure-sealing-occlusal'%20d='M12.5,65.6c1.7.2,6.6-2,9-2.1,1.7,0,5.7,1,7.5,1.1,4.7,0,6.3-2.5,4.8-3-1.7-.5-10.2,1-13.9,1-5.5,0-15.7.2-11.7.8l2,1.7,2.3.4h0Z'%20data-active='1'%20style='fill:%20%233fb6ff;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='restorations'%20data-active='1'%3e%3cpath%20id='crown-leakage'%20d='M10.7,34.8c5.6-4.9,15.1-4.8,20.3.3,2.9,2.8-24.8,3.6-20.3-.3'%20data-active='1'%20style='display:%20none;%20fill:%20%239e00e9;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='implant'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-locator-screw'%20d='M18,47.4c.9,1.5,3.8.9,5.4,1,3.2-.5,1.7-4.6,2-7,0-.7.2-1.6-.3-2.1-.2-.3-.7-.4-1-.4-1.5,0-3.4-.2-4.9.2-1.3.3-1.4,1.3-1.4,2.5,0,2-.2,3.9.1,5.7v.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-8);%20stroke:%20%23c8c9c9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='implant-connector'%20d='M15,40.7h0c.1,1.4,1.1,2.1,1.9,1.7,1.4-.7,1.6-2,3.4-2.1h3.3c.8,0,1.8,1.9,2.9,2.2s1.4-.6,1.3-1.6c0-1.9,0-5.6-.5-5.7s-3.1,0-3.7,0h-4.5c-1,0-2.7-.4-3.5.7-.8,1.1-1,2.9-.8,4l.2.7h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-9);'%20/%3e%3cpath%20id='implant-bar'%20d='M3.6,53.5c7.3.3,26.5,0,34.5,0s3.6-2.2,3.8-4.1.3-3.2-1.3-3.4-6,0-7.9,0c-4.6,0-8.4,0-12.7.2-4.8,0-15.2.2-16,0-1.4.2-2.6.9-2.8,1.9-.2,1.9-.2,5.5,2.3,5.3h0Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-16-0);'%20/%3e%3cg%20id='implant-healing-abutment'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='implant-healing-abutment-connector'%20d='M18,39.9c1.7.3,3.7-.2,5.4-.2,3.3,0,4.2-1.2,3.4-5.6-.8-3.9-1.7-9-2.7-13.4-.3-1.1-.6-2.2-1.1-3.1-2.3-4.5-4.3,1.7-4.7,5-.5,3.4-.6,5.9-1.3,9-.6,2.7-2.4,7.7.7,8.3h.3Z'%20data-active='1'%20style='fill:%20%23a0a0a0;%20stroke:%20%238c8c8c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M28.6,36.4h-9.2c-1.4,0-5,.2-5,.2,0,0-.4.9-.7,1.7s-.3,1.2-.3,1.8v2.7c.1.3.2.5.2.7h1.1c2.4-.3,4.9-.4,7.3-.4v-.2c.3,0-.7-.2-.9-.2.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.6.6-.5.4-.6l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.6,0,1.2,0,1.9.2h.5c.2,0,.4,0,.5.2-.2-.2,0-2.5,0-2.5h.2Z'%20data-active='1'%20style='fill:%20%23475563;'%20/%3e%3cpath%20d='M22.2,42.9v-.2h.2c.1,0,0,0,0-.2.5,0,2,.3,2.6.2.1.3.5.2.7.2.6,0,2.3.2,2.5-.9s.2-1.8,0-2.7-.3-.4-.1-.6h.4s.2,0,.2.4v3.6c0,.2-.1.4-.2.6-.9,0-1.8-.2-2.8-.3h-3.6,0Z'%20data-active='1'%20style='fill:%20%238c8c8c;'%20/%3e%3cpath%20d='M21.9,38.7c-.1-.2-.3-.2-.5-.2l-.9.2c-.1-.2-.4-.2-.6,0-.1-.2-.9,0-1,0l-4.1.3c-.4,0-.7.2-1.1,0l2.5-.5c3.2-.6,6.4-.3,9.5,0,.1.3,0,.2.3.6.2.3.3.2.4.5.1.7,0,1.5,0,2.1s-.3.8-.7.9c-.7,0-2,.2-2.7,0s-1.4-.2-1.4-.6v-.9c-.1-.4,0-1.5,0-2s.5-.7.3-.5h0Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M25,42.7h.7c.4-.2.7-.6.7-1v-1.9c0-.6-.9-1.1-1.5-1.1-.3-.4.9,0,.8-.2.6,0,1.2,0,1.9.2s.3,0,.5,0c-.2.2,0,.4.1.6.1.9.1,1.8,0,2.7s-1.9,1-2.5.9-.6,0-.7-.2h0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3cpath%20d='M18.9,38.6c.1,0,.9-.2,1,0,.2-.2.5-.2.6,0,0,0-.2.2-.2.3,0,1-.2,1.9,0,2.9s.6.6,1,.7c.4.5-1.8,0-2.1,0-.5,0-.7-.5-.7-1v-2.4c0-.8.6-.5.4-.6h0Z'%20data-active='1'%20style='fill:%20%236f7c86;'%20/%3e%3cpath%20d='M22.2,42.7c.3,0-1.1-.3-.9-.2-.4,0-.9,0-1-.7-.2-.9,0-1.9,0-2.9s.2-.2.2-.3l.9-.2c.2,0,.4,0,.5.2-.2.2-.3.4-.3.7v2.5c0,.9.5.6.7.7v.2h-.2,0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;'%20/%3e%3c/g%3e%3cg%20id='implant-base'%20data-active='1'%3e%3cpath%20d='M18.2,36.4c-.1-1.3-.2-2.7.2-4h5.6c.4,1,.2,2.9.2,4h-6Z'%20data-active='1'%20style='fill:%20%23bbc3c6;'%20/%3e%3cpath%20d='M19.4,10c-.2,0,0-2.2,0-2.4.2-1.3.9-2.4,1.9-3,1-.6.2,0,.2-.3,1.7,0,3.3,1.1,3.8,3.1.5,2,0,1.2.1,1.8h-1.3c0-.8,0-2.1-.8-2.3s-.7,0-.7.3c0,.8,0,1.5.2,2.1l-3.5.6h0Z'%20data-active='1'%20style='fill:%20%23bac3c7;'%20/%3e%3cpath%20d='M18.4,32.4c-.4,1.3-.3,2.7-.2,4l-3.8.2c0-.7-.3-4.2.7-4,1.1-.2,2.2-.2,3.3-.2Z'%20data-active='1'%20style='fill:%20%23a0a4a5;'%20/%3e%3cpath%20d='M19,31.9v-2.5c1.5-.3,3-.7,4.6-.7l.2,3.3h-4.8Z'%20data-active='1'%20style='fill:%20%23bac3c6;'%20/%3e%3cpath%20d='M21.6,4.2s-.1.2-.2.3c-1,.6-1.6,1.7-1.9,3s-.2,2.4,0,2.4l-2.4.6c.1-1.1,0-2.2.3-3.3s1.1-2.2,2.1-2.7,1.5-.4,2.2-.4h-.1Z'%20data-active='1'%20style='fill:%20%239ca3a6;'%20/%3e%3cpath%20d='M24.2,36.4c0-1.1.2-3-.2-4h2.7c.2,1,.3,3,0,4h-2.5Z'%20data-active='1'%20style='fill:%20%23e8eef0;'%20/%3e%3cpath%20d='M18.9,29.3v2.5c.1,0-3.4.2-3.4.2,0-.7,0-1.4.1-2,1.1-.4,2.2-.5,3.2-.8h.1,0Z'%20data-active='1'%20style='fill:%20%239ea3a4;'%20/%3e%3cpath%20d='M26.7,36.5c.2-1,.2-3,0-4h1.4c.8.2.7,3.3.5,4h-1.9Z'%20data-active='1'%20style='fill:%20%23bcc4c7;'%20/%3e%3cpath%20d='M23.8,31.9l-.2-3.3c.6-.2,1.3-.2,1.9-.2l.2,3.6h-1.9Z'%20data-active='1'%20style='fill:%20%23e3eaeb;'%20/%3e%3cpath%20d='M25.7,32l-.2-3.6c.5-.1,1.1-.1,1.7-.1l.3,3.8h-1.8Z'%20data-active='1'%20style='fill:%20%23b8c2c4;'%20/%3e%3cpath%20d='M19,27.5v-1.1c1.5-.3,3-.6,4.5-.7v1.1l-4.5.7Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M19.1,24.6c-.1-.4,0-.8,0-1.2,1.5-.3,2.9-.5,4.3-.7v1.2l-4.4.7h.1Z'%20data-active='1'%20style='fill:%20%23b9c0c4;'%20/%3e%3cpath%20d='M19.2,21.7c-.3-.4,0-.5-.2-1.1,1.4-.4,2.8-.6,4.3-.8v1.2c-1.3.2-2.7.4-4.1.7Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M19.1,18.7v-1.1c1.3-.3,2.7-.6,4.1-.7v1.1l-4.1.7Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M19.2,15.8v-1.1c1.3-.3,2.6-.5,3.9-.7v1.2l-4,.6h.1Z'%20data-active='1'%20style='fill:%20%23b9c1c5;'%20/%3e%3cpath%20d='M19.2,11.8c1.2-.3,2.4-.6,3.7-.7v1.2c-1.2.1-2.4.4-3.7.6v-1.1Z'%20data-active='1'%20style='fill:%20%23bac3c5;'%20/%3e%3cpath%20d='M19,28.8c0-.2,0-.5-.1-.7-.2.2-.5.3-.6,0,1.7-.4,3.5-.7,5.3-.9.1.2,0,.5,0,.8l-4.6.7h0Z'%20data-active='1'%20style='fill:%20%23b7c0c3;'%20/%3e%3cpath%20d='M19.1,25.9c-.2-.2,0-.5,0-.8,1.5-.3,3-.6,4.5-.7v.8l-4.4.7s-.1,0,0,0h-.1Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M19,26.4v1.1l-3.2.8v-1.1c1-.4,2.1-.5,3.1-.7h.1Z'%20data-active='1'%20style='fill:%20%239a9fa1;'%20/%3e%3cpath%20d='M19.2,22.9c-.1-.3-.2-.4-.2-.7,1.5-.3,2.9-.6,4.3-.7v.8l-4.2.7h.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M19.1,23.4c0,.4-.1.8,0,1.2l-3.1.7v-1.2c1-.4,2-.5,3-.7,0,0,.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%23999fa1;'%20/%3e%3cpath%20d='M19.1,20v-.8c1.4-.3,2.8-.5,4.2-.7v.8l-4.2.7Z'%20data-active='1'%20style='fill:%20%23bac1c4;'%20/%3e%3cpath%20d='M19.1,17.1v-.7c1.3-.3,2.7-.5,4-.7v.8l-4.1.6s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23b9c0c3;'%20/%3e%3cpath%20d='M19.2,14.2v-.8c1.2-.4,2.5-.5,3.8-.7,0,.2.1.5,0,.8l-3.9.7h.1Z'%20data-active='1'%20style='fill:%20%23bbc2c4;'%20/%3e%3cpath%20d='M19,20.6c.1.6,0,.7.2,1.1l-2.9.7v-1.1c.9-.5,1.8-.4,2.7-.6h0Z'%20data-active='1'%20style='fill:%20%239ba0a2;'%20/%3e%3cpath%20d='M18.2,28.2c.1.2.4.2.6,0,.1.2.1.5.1.7-1.2.3-2.4.5-3.6.9s-.4-.2-.5-.4c0-.6,2.7-1,3.2-1.1h.2,0Z'%20data-active='1'%20style='fill:%20%23a8aeb1;'%20/%3e%3cpath%20d='M19,25.1v.8l-3.5.9c-.2,0-.4-.3-.4-.4,0-.6,3.3-1.1,3.8-1.2h.1Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M19.1,17.6v1.1l-2.7.7v-1.2c.9-.4,1.8-.5,2.6-.6,0,0,.1,0,0,0h.1Z'%20data-active='1'%20style='fill:%20%239ba0a3;'%20/%3e%3cpath%20d='M22.9,9.4c-.1-.7-.2-1.4-.2-2.1s.5-.4.7-.3c.8.2.7,1.5.8,2.3l-1.3.2h0Z'%20data-active='1'%20style='fill:%20%23e4e9ea;'%20/%3e%3cpath%20d='M19.3,11.3v-.8c1.2-.3,2.4-.5,3.7-.6v.8l-3.7.6Z'%20data-active='1'%20style='fill:%20%23bcc2c4;'%20/%3e%3cpath%20d='M19,22.2c0,.3,0,.5.2.7-1.2.2-2.2.5-3.4.8s-.4-.2-.4-.3c-.1-.7,3.1-1.1,3.6-1.2Z'%20data-active='1'%20style='fill:%20%23a6abad;'%20/%3e%3cpath%20d='M19.2,14.7v1.1l-2.5.7c0-.3,0-.9.1-1.1.8-.4,1.6-.4,2.4-.6h0Z'%20data-active='1'%20style='fill:%20%239da2a4;'%20/%3e%3cpath%20d='M19.1,19.3v.8l-3.2.8c-.2,0-.3-.3-.3-.4s0-.3.2-.4c1.1-.4,2.2-.6,3.2-.8,0,0,.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M19.2,11.8v1.1l-2.4.6v-1.1c.8-.3,1.6-.4,2.3-.6h.1Z'%20data-active='1'%20style='fill:%20%239ca1a3;'%20/%3e%3cpath%20d='M19.1,16.4v.7l-2.9.8c-.2,0-.4-.2-.4-.3-.2-.7,3-1.1,3.3-1.1h0Z'%20data-active='1'%20style='fill:%20%23a5aaac;'%20/%3e%3cpath%20d='M19.1,13.4v.8l-2.8.7c-.2,0-.3-.2-.4-.3s0-.4.3-.4c1-.3,1.9-.6,2.9-.7h0Z'%20data-active='1'%20style='fill:%20%23a2a7a9;'%20/%3e%3cpath%20d='M19.3,10.5v.8c-.9.2-1.7.4-2.6.7s-.4-.1-.4-.3,0-.3.2-.4c.9-.4,1.8-.5,2.8-.8Z'%20data-active='1'%20style='fill:%20%23a7abae;'%20/%3e%3cpath%20d='M23.6,26.8v-1.1c.5-.2,1.1-.2,1.7-.2.1.4,0,.8,0,1.2l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e2e9eb;'%20/%3e%3cpath%20d='M23.5,23.9v-1.2l1.8-.2v1.1c-.5.2-1.1.2-1.7.3h0Z'%20data-active='1'%20style='fill:%20%23e1e8e9;'%20/%3e%3cpath%20d='M23.3,19.8c.6,0,1.2-.2,1.8-.2v1.2l-1.7.2v-1.2h0Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M23.2,18.1v-1.1c.5,0,1.1-.2,1.6-.2.2.4,0,.8.2,1.1-.6,0-1.2,0-1.8.2Z'%20data-active='1'%20style='fill:%20%23e3e9ea;'%20/%3e%3cpath%20d='M25.4,26.6v-1.2c.5,0,1.1-.1,1.7-.1,0,.4.1.8.1,1.2-.6.2-1.2,0-1.7.1h-.1Z'%20data-active='1'%20style='fill:%20%23b7bfc3;'%20/%3e%3cpath%20d='M23.1,15.2c-.1-.4,0-.8,0-1.2l1.6-.2v1.1c-.4.1-1,.2-1.5.2h-.1Z'%20data-active='1'%20style='fill:%20%23e4eaeb;'%20/%3e%3cpath%20d='M25.5,27.9v-.8c.5,0,2.5-.5,2.4.3s-1.8.5-2.4.5Z'%20data-active='1'%20style='fill:%20%23b4bdc0;'%20/%3e%3cpath%20d='M25.4,25v-.8c.4,0,2.4-.5,2.3.2s-.2.4-.4.4h-1.9s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23b8c0c4;'%20/%3e%3cpath%20d='M22.9,11.1c.5,0,1-.2,1.5-.2.1.4,0,.8.2,1.1-.5.1-1,.2-1.6.2v-1.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e8e9;'%20/%3e%3cpath%20d='M25.3,23.6v-1.1c.4,0,.9-.1,1.4-.1,0,.4.1.8,0,1.1-.5.2-1.1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c0c3;'%20/%3e%3cpath%20d='M25.1,22.1v-.8c.4,0,2.2-.5,2.2.2s-1.7.5-2.2.6Z'%20data-active='1'%20style='fill:%20%23b5bdc1;'%20/%3e%3cpath%20d='M25.1,20.8v-1.2c.5,0,.9-.2,1.4-.1v1.1c-.5.1-1,0-1.5.1h.1Z'%20data-active='1'%20style='fill:%20%23b8c1c5;'%20/%3e%3cpath%20d='M25,19.1c-.1-.2,0-.5,0-.8.5,0,2.1-.4,2.2.2s-1.5.6-2.1.6h-.1Z'%20data-active='1'%20style='fill:%20%23bac0c3;'%20/%3e%3cpath%20d='M24.8,16.2c-.1-.2,0-.5-.1-.8.5,0,2.1-.5,2.1.2s-1.5.5-2,.6Z'%20data-active='1'%20style='fill:%20%23b6bec2;'%20/%3e%3cpath%20d='M24.9,17.9c-.1-.4,0-.8-.2-1.1.5,0,.9-.2,1.4-.1,0,.4.1.8,0,1.1h-1.3.1Z'%20data-active='1'%20style='fill:%20%23b9c2c6;'%20/%3e%3cpath%20d='M23.6,28.1v-.8c.7,0,1.3-.2,2-.2v.8l-1.9.2h-.1Z'%20data-active='1'%20style='fill:%20%23e5e9eb;'%20/%3e%3cpath%20d='M24.6,13.3v-.8c.3,0,2.2-.5,2,.3s-1.4.4-1.9.5h-.1Z'%20data-active='1'%20style='fill:%20%23bbc2c5;'%20/%3e%3cpath%20d='M24.7,14.9v-1.1c.3,0,.7-.1,1.2,0,0,.3.1.7,0,1.1-.4.3-.9,0-1.3.1h0Z'%20data-active='1'%20style='fill:%20%23b6bfc2;'%20/%3e%3cpath%20d='M23.5,25.1v-.8c.6,0,1.2-.2,1.8-.2v.8l-1.9.2h.1Z'%20data-active='1'%20style='fill:%20%23e6ebec;'%20/%3e%3cpath%20d='M24.6,12.1c-.2-.3,0-.8-.2-1.1.4,0,.8-.2,1.3,0,0,.3.1.7,0,1.1-.4.2-.8,0-1.2.1h.1Z'%20data-active='1'%20style='fill:%20%23bdc3c6;'%20/%3e%3cpath%20d='M23.4,22.2v-.8c.6,0,1.2-.3,1.8-.2v.8l-1.8.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M24.4,10.5v-.8c.4,0,2.1-.5,1.9.3s-1.4.4-1.9.4h0Z'%20data-active='1'%20style='fill:%20%23bfc4c7;'%20/%3e%3cpath%20d='M23.3,19.3v-.8l1.7-.2v.8l-1.8.2h0Z'%20data-active='1'%20style='fill:%20%23e5eaeb;'%20/%3e%3cpath%20d='M23.1,16.4v-.8l1.7-.2c0,.3,0,.5.1.8l-1.7.2h-.1Z'%20data-active='1'%20style='fill:%20%23e6ebeb;'%20/%3e%3cpath%20d='M23,13.5v-.8c.5,0,1-.2,1.6-.2v.8l-1.6.2Z'%20data-active='1'%20style='fill:%20%23e6eaeb;'%20/%3e%3cpath%20d='M22.9,9.9c.5,0,1-.2,1.5-.2v.8l-1.5.2v-.8Z'%20data-active='1'%20style='fill:%20%23e1e5e6;'%20/%3e%3c/g%3e%3cpath%20id='peri-implant-bone-loss'%20d='M12.4,27.5c2,7,6,10,9,10s7-3,9-10c-2,4-5,6-9,6s-7-2-9-6Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23d9534f;'%20/%3e%3c/g%3e%3cg%20id='prosthesis-implant'%20data-active='1'%3e%3cg%20id='prosthesis-implant-gum'%20data-active='1'%20style='display:%20none;%20opacity:%20.5;'%3e%3cpath%20d='M41.2,57.8v-11.7c0-.8-1-1.5-2.3-1.5H5.2c-1.2,0-2.2.6-2.3,1.4-.1,2.7-.4,8.7-.4,11.7s1,1.5,2.3,1.5h34.1c6.9,0,2.3-.7,2.3-1.5h0Z'%20data-active='1'%20style='fill:%20url(%23radial-gradient-16-1);'%20/%3e%3cpath%20d='M41.1,57.8c0-3.2-.4-8.6-.5-11.7-.3-1.2-2.2-.9-3.2-.9h-9.7c-4.5,0-15-.5-19.3-.4h-3.2c-.7,0-1.5.8-1.3,1.5h0c0,3.7,0,7.7-.4,11.5,0,0,0,.2,0,0l.2.2c.5.4,2,.3,2.6.3,2,0,7.6.2,9.7.3,4.3,0,15.2.4,19.3.5h3.2c.9,0,2.3-.3,2.4-1.4h.2ZM41.3,57.8c0,1.2-1.6,1.6-2.6,1.6h-3.2c-4.1,0-15.1.4-19.3.5-3,0-8.4.2-11.3.3-1.5,0-3.5-.9-3.4-2.7,0-3.8,0-7.7.4-11.5,0-.8.8-1.6,1.6-1.6s1.3.2,1.9.2h9.7c6.1,0,16.5-.5,22.6-.5s4.5,0,4.3,2.5c0,2.9-.3,8.3-.4,11.3h-.3Z'%20data-active='1'%20style='fill:%20%23ffa46a;'%20/%3e%3c/g%3e%3cpath%20id='prosthesis-implant-crown'%20d='M26.6,53.4c-3.3-2.6-8.8-2.1-10.9.9-.7,1.4-1.5,2.9-2,4.3-.9,2.3-2,7.1,1.8,8.3,2.5.7,5.2-1,7.8-.5,1.1,0,2,.4,3,.3,6.7-1.1,3.4-7,2-10.7-.3-.8-.9-1.7-1.5-2.5h-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='prosthesis'%20data-active='1'%3e%3cpath%20id='prosthesis-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-16-10);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='prosthesis-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.6,6.2-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='telescope'%20data-active='1'%3e%3cpath%20id='telescope-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cg%20id='telescope-crown'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='telescope-crown-outside'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.3,2.6-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='fill:%20%230051bf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='telescope-crown-inside'%20d='M28.1,39.5c-4.5-4.4-12-3.6-14.8,1.5-1.1,2.5-2.1,4.8-2.7,7.2-1.2,3.9-2.7,11.9,2.5,13.9,3.4,1.1,7-1.7,10.6-.9,1.5.2,2.7.7,4.1.6,9.1-1.8,4.6-11.8,2.6-18-.5-1.4-1.2-2.9-2-4.1h0l-.2-.2s-.1,0-.1,0Z'%20data-active='1'%20style='fill:%20%23aaa;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='zircon'%20data-active='1'%3e%3cpath%20id='zircon-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='zircon-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6.1-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-inlay'%20d='M26.5,48c-3.3-3.3-8.8-2.6-10.9,1.1-.7,1.7-1.4,3.5-2,5.3-.8,2.9-2,8.8,1.8,10.2,2.5.8,5.1-1.3,7.8-.6,1.1.2,2,.5,3,.4,6.8-1.4,3.4-8.7,1.9-13.3-.3-1-.9-2.1-1.5-3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-veneer'%20d='M28.9,37.7c-5.1-5.1-13.7-4.1-17,1.7-1.1,2.7-2.2,5.4-3.1,8.2-1.3,4.5-3.1,13.7,2.8,15.9,3.9,1.3,8-2,12.1-1,1.7.3,3.1.8,4.6.6,10.5-2.1,5.3-13.5,3-20.6-.5-1.6-1.4-3.3-2.3-4.7h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal'%20data-active='1'%3e%3cpath%20id='metal-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal-ceramic'%20data-active='1'%3e%3cpath%20id='metal-ceramic-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-2);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='metal-ceramic-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-3);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gold'%20data-active='1'%3e%3cpath%20id='gold-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gold-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-inlay'%20d='M26.5,48c-3.3-3.3-8.8-2.6-10.9,1.1-.7,1.7-1.4,3.5-2,5.3-.8,2.9-2,8.8,1.8,10.2,2.5.8,5.1-1.3,7.8-.6,1.1.2,2,.5,3,.4,6.8-1.4,3.4-8.7,1.9-13.3-.3-1-.9-2.1-1.5-3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-veneer'%20d='M28.9,37.7c-5.1-5.1-13.7-4.1-17,1.7-1.1,2.7-2.2,5.4-3.1,8.2-1.3,4.5-3.1,13.7,2.8,15.9,3.9,1.3,8-2,12.1-1,1.7.3,3.1.8,4.6.6,10.5-2.1,5.3-13.5,3-20.6-.5-1.6-1.4-3.3-2.3-4.7h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='emax'%20data-active='1'%3e%3cpath%20id='emax-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-4);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='emax-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-5);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-inlay'%20d='M26.5,48c-3.3-3.3-8.8-2.6-10.9,1.1-.7,1.7-1.4,3.5-2,5.3-.8,2.9-2,8.8,1.8,10.2,2.5.8,5.1-1.3,7.8-.6,1.1.2,2,.5,3,.4,6.8-1.4,3.4-8.7,1.9-13.3-.3-1-.9-2.1-1.5-3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-6);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-veneer'%20d='M28.9,37.7c-5.1-5.1-13.7-4.1-17,1.7-1.1,2.7-2.2,5.4-3.1,8.2-1.3,4.5-3.1,13.7,2.8,15.9,3.9,1.3,8-2,12.1-1,1.7.3,3.1.8,4.6.6,10.5-2.1,5.3-13.5,3-20.6-.5-1.6-1.4-3.3-2.3-4.7h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-7);%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gradia'%20data-active='1'%3e%3cpath%20id='gradia-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='gradia-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-inlay'%20d='M26.5,48c-3.3-3.3-8.8-2.6-10.9,1.1-.7,1.7-1.4,3.5-2,5.3-.8,2.9-2,8.8,1.8,10.2,2.5.8,5.1-1.3,7.8-.6,1.1.2,2,.5,3,.4,6.8-1.4,3.4-8.7,1.9-13.3-.3-1-.9-2.1-1.5-3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-veneer'%20d='M28.9,37.7c-5.1-5.1-13.7-4.1-17,1.7-1.1,2.7-2.2,5.4-3.1,8.2-1.3,4.5-3.1,13.7,2.8,15.9,3.9,1.3,8-2,12.1-1,1.7.3,3.1.8,4.6.6,10.5-2.1,5.3-13.5,3-20.6-.5-1.6-1.4-3.3-2.3-4.7h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary-restorations'%20data-active='1'%3e%3cpath%20id='temporary-bridge-connector'%20d='M39.2,55.5c2.2-.9,3.3-3.7,2.1-5.7-1.3-2.3-4.5-2.6-7-2.7H8.9c-8.4,0-3.2.2-4.5.7-3.1,1-4.4,5.3-2.1,7.6,2,1.7,5.8,1.3,9.1,1.4,7.5,0,12.3-.2,21.8-.3,2,0,4.2-.2,5.9-.9h.2-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='temporary-crown'%20d='M30.1,36.7c-5.7-5.7-15.3-4.6-19,1.9-1.2,3-2.5,6-3.5,9.2-1.5,5-3.5,15.3,3.1,17.8,4.4,1.4,9-2.2,13.5-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.9-15.1,3.4-23.1-.6-1.8-1.6-3.7-2.6-5.3h-.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-inlay'%20d='M26.5,48c-3.3-3.3-8.8-2.6-10.9,1.1-.7,1.7-1.4,3.5-2,5.3-.8,2.9-2,8.8,1.8,10.2,2.5.8,5.1-1.3,7.8-.6,1.1.2,2,.5,3,.4,6.8-1.4,3.4-8.7,1.9-13.3-.3-1-.9-2.1-1.5-3h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-veneer'%20d='M28.9,37.7c-5.1-5.1-13.7-4.1-17,1.7-1.1,2.7-2.2,5.4-3.1,8.2-1.3,4.5-3.1,13.7,2.8,15.9,3.9,1.3,8-2,12.1-1,1.7.3,3.1.8,4.6.6,10.5-2.1,5.3-13.5,3-20.6-.5-1.6-1.4-3.3-2.3-4.7h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%230a1018;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='ortho'%20data-active='1'%3e%3cg%20id='missing-closed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M3.1,7.3c21.7,16.7,19.3,38.1,0,55.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M36.3,61.2c-21.8-16.5-19.7-38-.6-55.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cg%20id='ortho-ring'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='20.5'%20cy='51.7'%20rx='4.2'%20ry='14.8'%20transform='translate(-31.5%2071.5)%20rotate(-89.2)'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='8.9'%20y1='55.9'%20x2='32.7'%20y2='55.9'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='8.9'%20y1='47.5'%20x2='32.7'%20y2='47.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='7.4'%20y1='52.8'%20x2='34'%20y2='52.8'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='7.4'%20y1='50.1'%20x2='34'%20y2='50.1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M33.9,47.6c.9-.2,1.8.4,1.8,1v6.4c0,.5-.6.9-1.1,1h-.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M7.5,55.9h-.7c-.5,0-1.1-.5-1.1-1v-6.3c0-.7.8-1.1,1.5-1h.3'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='ortho-bracket'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='18.6'%20cy='51.4'%20rx='1.6'%20ry='5.4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cellipse%20cx='24.3'%20cy='51.3'%20rx='1.6'%20ry='5.4'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cline%20x1='20.1'%20y1='55.2'%20x2='22.8'%20y2='55.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='20.1'%20y1='48.3'%20x2='22.8'%20y2='48.3'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M23,50.3v-2.9c.1-.6.6-1.1,1.2-1.1s1.3.4,1.4,1.2v8c0,.7-.6,1.3-1.3,1.3s-1.3-.5-1.3-1.3v-2.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M19.9,50.3v-2.9c0-.6-.6-1.1-1.2-1.1s-1.3.4-1.4,1.2v8c0,.7.6,1.3,1.3,1.3s1.3-.5,1.3-1.3v-2.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='17.4'%20y1='52.7'%20x2='25.5'%20y2='52.7'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='17.4'%20y1='50.4'%20x2='25.5'%20y2='50.4'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M25.8,48.3c.6-.2,1.3.3,1.3.8v5.2c0,.4-.4.8-.8.8h-.5'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M17.1,55.2h-.5c-.4,0-.8-.4-.8-.8v-5.2c0-.6.6-.9,1-.8h.2'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrows'%20data-active='1'%3e%3cg%20id='arrow-distal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='4.6'%20y1='62.2'%20x2='1.1'%20y2='65.8'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='7.1'%20y1='66'%20x2='1'%20y2='66'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='4.6'%20y1='69.6'%20x2='1.1'%20y2='66'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-mesial'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='36.8'%20y1='69.7'%20x2='41.1'%20y2='66.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='33.6'%20y1='65.9'%20x2='41.2'%20y2='65.9'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='36.8'%20y1='62.3'%20x2='41.1'%20y2='65.9'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-down'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='42.1'%20y1='41.3'%20x2='38.3'%20y2='35.3'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='38'%20y1='45.6'%20x2='38.3'%20y2='35'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='34.2'%20y1='41.2'%20x2='38.1'%20y2='35.2'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-up'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='34.2'%20y1='41.4'%20x2='38'%20y2='47.5'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='38'%20y1='37.1'%20x2='38'%20y2='47.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='42'%20y1='41.5'%20x2='38.2'%20y2='47.5'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-rotation'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20d='M20.9,70.5c-.2,0-.8-.3-1.1-1s-.2-.9-.1-1.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M19,66c1-1.4,6.1-1.3,5.4,1.7-.1,3.5-8,.9-3.4,0'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='specials'%20data-active='1'%3e%3cg%20id='fracture-vertical'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-vertical-3'%20x1='38.3'%20y1='6.1'%20x2='10.6'%20y2='62.1'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-vertical-2'%20x1='33.8'%20y1='15.2'%20x2='9.3'%20y2='64.9'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-vertical-1'%20points='35%2016.7%2029.7%2017%2031.6%2023.6%2027.3%2023.4%2028.9%2026.8%2025.2%2026.7%2028.1%2031.5%2021.8%2030.6%2024.9%2037.1%2018.4%2037.1%2020.7%2045%2016.7%2044.1%2017.5%2050.8%2014.4%2050.4%2014.9%2055.1%2011.9%2055.2%2014.1%2059.7%209.4%2059%2011.1%2063.8'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='fracture-horizontal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20id='fracture-horizontal-3'%20x1='4.8'%20y1='12.1'%20x2='32.2'%20y2='32.3'%20style='fill:%20none;%20stroke:%20%23fdecc5;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20data-active='1'%20/%3e%3cline%20id='fracture-horizontal-2'%20x1='9.9'%20y1='15.9'%20x2='29.4'%20y2='30.2'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.6;%20stroke:%20%239e00e9;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20data-active='1'%20/%3e%3cpolyline%20id='fracture-horizontal-1'%20points='7.7%2017.9%2010.8%2016.8%2011.2%2019.7%2015.5%2017.9%2016.3%2022.9%2019.2%2020.8%2019.8%2025.2%2023.6%2023.1%2023.7%2027.6%2028.1%2025.8%2027.1%2029.3%2031.4%2028.5'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.4;%20stroke:%20%23ed1c24;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='parapulpal-pin'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='parapulpal-pin-shape'%20data-active='1'%3e%3cpath%20d='M30.7,49.2c.1.5,0,.6,0,.8v.8c.1.4,0,.6,0,.8.1.3,0,.6,0,.8v2.4c.1.4.4.8,1,1.1s.2.2.1.3,0,.2,0,.3,0,.2-.3.3c-1.2.2-2.5.2-3.7,0s-.3,0-.3-.2v-.6c0-.2.9-.3,1-1s0-.7,0-1.1l.2-5,.2-4.4c0-1.2.2-2.3.4-3.5s0-.2.2-.3c.1.2.1.3.2.5.3,1.2.4,2.4.5,3.6l.3,3.5v.2c.1.2,0,.5,0,.8h.2,0Z'%20data-active='1'%20style='fill:%20%230a0a0a;'%20/%3e%3cpath%20d='M29.1,52.8c-.1,0-.2-.2-.2-.3v-3.7l.2-3.9.2-2.2h.1v9.3c0,.3,0,.6-.3.8Z'%20data-active='1'%20style='fill:%20%23f0edee;'%20/%3e%3cpath%20d='M30,52.2h0v-1.7h0v-1h0v-6.5c0,.2.1.5.1.7v.5l.3,3.4v3.2l.2,1.8v.3h-.1c-.2-.2-.3-.4-.5-.6h0Z'%20data-active='1'%20style='fill:%20%23eaeaea;'%20/%3e%3cpath%20d='M30,52.2v-.2c-.1,0-.3-10.5-.3-10.5v-.3l.2.7s.1.2,0,.2h0c-.1,0,0,.7,0,.8v6.2h0v2.8h0v.3s.1,0,0,0Z'%20data-active='1'%20style='fill:%20%239c9c9c;'%20/%3e%3cpath%20d='M29.2,53.9c.2.3.5.6.7.9s0,.3,0,.5c-.2.4-.8.4-1.4.5.9-.7.2-1.1.9-1.9h-.2Z'%20data-active='1'%20style='fill:%20%23c7c7c7;'%20/%3e%3cpath%20d='M30.6,53.9c.5.4.3.7.4,1v.2c0,.2.3.5.6.7h-.9c-.7-.2-.8-.8-.7-1s.4-.6.6-.8h0Z'%20data-active='1'%20style='fill:%20%23b5b4b6;'%20/%3e%3cpath%20d='M30,55.9c.4,0,1.7,0,2,.2v.5h-1.5c-.5,0-.4,0-.4-.2v-.4h-.1Z'%20data-active='1'%20style='fill:%20%23bababa;'%20/%3e%3cpath%20d='M28.4,56.5v-.5h1.3c0,.2,0,.4-.2.5s-.8,0-1.2,0h.1Z'%20data-active='1'%20style='fill:%20%23cdcdcd;'%20/%3e%3cpath%20d='M28.6,56.8h2.8-2.7c-.9,0,0,0-.1,0s0,0,0,0Z'%20data-active='1'%20style='fill:%20%239da1a2;'%20/%3e%3cpath%20d='M28.5,56v.5h-.6v-.5c.2,0,.5,0,.7-.2h-.1v.2Z'%20data-active='1'%20style='fill:%20%238b8d8c;'%20/%3e%3cpath%20d='M29.4,53.2c.1,0,.2,0,.3.2l-.3.2s-.2,0-.2-.2c0,0,.1,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23acaaac;'%20/%3e%3cpath%20d='M30.3,53.2h.2l-.2.2c-.1,0-.2,0-.3-.2h.3Z'%20data-active='1'%20style='fill:%20%23b2b0b3;'%20/%3e%3cpath%20d='M29.1,53.4h.2s-.1,0-.2.2h-.2c-.1,0,0,0,.2-.2Z'%20data-active='1'%20style='fill:%20%23e4e1e2;'%20/%3e%3cpath%20d='M30.2,53.5c-.2.2-.1.2-.3.3v-.4l.3.2h0Z'%20data-active='1'%20style='fill:%20%238b8989;'%20/%3e%3cpath%20d='M29.2,53h.2v.2h-.3s0-.2.2-.2h-.1Z'%20data-active='1'%20style='fill:%20%23e3e3e3;'%20/%3e%3cpath%20d='M30.4,53.5h.4c.1,0,0,0-.1.2,0,0-.2,0-.2-.2,0,0-.1,0,0,0Z'%20data-active='1'%20style='fill:%20%23cacaca;'%20/%3e%3cpath%20d='M29.5,53.6c.1,0,.2,0,.3-.2v.4c-.1,0-.2,0-.3-.2Z'%20data-active='1'%20style='fill:%20%237a797b;'%20/%3e%3cpath%20d='M30.3,53.1h.3s0,.2-.1,0-.1,0-.2,0Z'%20data-active='1'%20style='fill:%20%23d2d1d3;'%20/%3e%3cpath%20d='M29.5,53.1c.1,0,.2,0,.3-.2v.3h-.3Z'%20data-active='1'%20style='fill:%20%237f7e80;'%20/%3e%3cpath%20d='M29.9,53.2s0-.6,0-.2c0,0,.2,0,.1,0h-.2.1v.2Z'%20data-active='1'%20style='fill:%20%237c7b7f;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='calculus'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='calculus-shape-8'%20d='M22.9,43c.4,0,.8-.2.9-.4.3-.2.4-.6-.1-.7-.7-.2-1.4.8-.8,1.1h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-7'%20d='M19.4,42.1c-.4,0-.7.3-.9.5-.2.3-.3.7.2.7.8,0,1.3-1.1.7-1.3h0Z'%20data-active='1'%20style='fill:%20%23c4ff98;'%20/%3e%3cpath%20id='calculus-shape-6'%20d='M11.6,43.1c.5-.3.4-1.1.4-1.4,0-.5-.3-1.1-1-.6-.8.6-.3,2.4.6,2h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-5'%20d='M16.7,43.9c-.4-.4-1.1,0-1.5,0-.5.2-1,.5-.3,1.1.8.7,2.4-.3,1.8-1.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-4'%20d='M12.3,45.9c0-.5-.6-1-.9-1.1-.5-.3-1-.4-1.1.4,0,1,1.8,1.6,2,.7h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-3'%20d='M31.4,41.3c-.5.2-.7.9-.7,1.3-.1.5,0,1.1.8.8,1-.4.9-2.2,0-2.1h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-2'%20d='M27.2,43.9c0-.5-.8-.8-1.2-.9-.5-.2-1.1-.2-.9.7.2,1,2.1,1.2,2.1.3h0Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3cpath%20id='calculus-shape-1'%20d='M29.8,44.5c-.3-.5-1.1-.5-1.4-.4-.5,0-1.1.2-.6.9.6.9,2.4.4,2.1-.5h-.1Z'%20data-active='1'%20style='fill:%20%239e1f63;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='plan'%20data-active='1'%3e%3cg%20id='extraction-plan'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M5.3,59C6.9,55,38.6,6.9,39.5,4.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3cpath%20d='M5.7,5.3c3.2,3.5,23.4,39.8,27.6,48.5.7,1.5,1.4,3,2.4,4.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3cg%20id='crown-needed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-needed-shape'%20d='M29.9,35.9c-5.7-5.8-15.3-4.6-18.9,1.9-1.6,3-2.7,6-3.5,9.3-1.5,5-3.5,15.4,3.1,18,4.3,1.4,8.9-2.2,13.4-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.8-15.2,3.4-23.3-.6-1.8-2.7-5.5-2.7-5.5Z'%20data-active='1'%20style='fill:%20%23c83014;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='crown-needed-path'%20d='M18.4,33.7c-2.5,3.6-5,7.3-7.5,10.8-.9,1.5-3.6,3.3-2.5,5.1,1.4,1.2,2.5-1.3,3.2-2.2,3.7-4.6,6.2-10.6,12.2-13.5.5-.2.9-.2,1,0,.2.2.1.7,0,1.2-2.5,7.2-12,14.1-14.6,21-5.6,13,1.8,5.4,5.5-1.2,3.1-4.8,7.8-12.7,12.3-16.7,2.9-1.8,2,2.7,1.5,4.1-1.6,6.8-12.1,12.6-12.3,19.7,1.1,5.8,9.9-10.1,11.9-12.3.8-1,3.1-3.4,3.2-1.1-.1,3.9-2.9,8.1-5.1,11.1-.7,1.1-1.5,2.2-1.6,3.4.8,2.6,6.8-4.7,7.7-5.7'%20data-active='1'%20style='fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='crown-replace'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-replace-shape'%20d='M29.9,35.9c-5.7-5.8-15.3-4.6-18.9,1.9-1.6,3-2.7,6-3.5,9.3-1.5,5-3.5,15.4,3.1,18,4.3,1.4,8.9-2.2,13.4-1.1,1.9.3,3.5.9,5.2.7,11.7-2.4,5.8-15.2,3.4-23.3-.6-1.8-2.7-5.5-2.7-5.5Z'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23c83014;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", o0 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20Part%20of%20React%20Odontogram%20Modul%20-%20https://github.com/ZoliQua/React-Odontogram-Modul%20-%20SVG%20Version:%202.5.0%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20id='premolar_x5F_tooth'%20version='1.1'%20viewBox='0%200%2048.8%2041.5'%3e%3cstyle%3e%20[data-active='0']%20{%20display:%20none;%20}%20%3c/style%3e%3cdefs%3e%3clinearGradient%20id='linear-gradient-14-occl-0'%20x1='15'%20y1='2119.6'%20x2='37.5'%20y2='2119.6'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23cfcece'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-1'%20x1='13.4'%20y1='2119.6'%20x2='37.5'%20y2='2119.6'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23cfcece'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-2'%20x1='14.9'%20y1='2119.7'%20x2='38.1'%20y2='2119.7'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23cfcece'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-3'%20x1='11.7'%20y1='2119.7'%20x2='38.1'%20y2='2119.7'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23cfcece'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-4'%20x1='11.1'%20y1='2119.7'%20x2='38.1'%20y2='2119.7'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23dcdcdc'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-5'%20x1='39.6'%20y1='2127.4'%20x2='29.5'%20y2='2109.6'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-6'%20x1='8.8'%20y1='2113.2'%20x2='22.7'%20y2='2126.9'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-7'%20x1='-875.9'%20y1='3230.3'%20x2='-875.9'%20y2='3246'%20gradientTransform='translate(-216.6865%20-3335.1796)%20rotate(-19.3)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0f0f0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-8'%20x1='28'%20y1='2137'%20x2='17.8'%20y2='2119.1'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-9'%20x1='24.5'%20y1='-4082.2'%20x2='24.5'%20y2='-4103.4'%20gradientTransform='translate(0%20-4072.468)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23c8c9c9'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23828282'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-14-occl-10'%20x1='16.3'%20y1='2118.9'%20x2='32.7'%20y2='2118.9'%20gradientTransform='translate(0%20-2098.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.3'%20stop-color='%23cf0'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b4c500'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-0'%20cx='24.4'%20cy='23.7'%20fx='24.4'%20fy='23.7'%20r='17.4'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-1'%20cx='24.5'%20cy='21.8'%20fx='24.5'%20fy='21.8'%20r='16'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-2'%20cx='24.5'%20cy='23.6'%20fx='24.5'%20fy='23.6'%20r='17.7'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-3'%20cx='24.9'%20cy='-1029.2'%20fx='24.9'%20fy='-1029.2'%20r='15.9'%20gradientTransform='translate(0%20-1008.4804)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-4'%20cx='25.1'%20cy='22.4'%20fx='25.1'%20fy='22.4'%20r='15.1'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-5'%20cx='25'%20cy='23.1'%20fx='25'%20fy='23.1'%20r='14.7'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-14-occl-6'%20cx='25.3'%20cy='33.9'%20fx='25.3'%20fy='33.9'%20r='9.8'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3c/defs%3e%3cg%20id='base'%20data-active='1'%3e%3cpath%20id='bone-base'%20d='M48.3,39.5s-3.2.7-6.3.5-5.1,0-5.9,0c-2.3-.2-5.9-.3-9.4-.2-3.9,0-8.2.9-11.1.9s-3.3,0-4.9-.2c-4-.3-5.8-.7-5.8-.7-1.8-.3-4.5.7-4.5-.6V2.7l5.5-.5,15.8-1.1h19.1l7.7.4v40h0v-2h-.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cg%20id='gum-base'%20data-active='1'%3e%3cpath%20id='gum-line-2'%20d='M11.3,2.4c7.9-.2,31-1.1,33.5-.6,2.5.5,2.1.4,3.2,0s1.2-1.2,0-1.5-3.6-.3-6.4-.2c-5.3.2-11.1.6-13.4.8-6.1.5-6.7.5-13.2.5s-7.7-.5-12.6-.1c-5,.4-.9,1.4.2,1.4,4.9,0,5.3,0,8.7-.3Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3cpath%20id='gum-line-1'%20d='M37.5,39.2c-7.9,0-30.7.6-33.2,0s-2-.4-3.1,0-1.2,1.2,0,1.5c1.3.3,3.6.4,6.4.3,5.3,0,11-.4,13.4-.6,6-.4,6.7-.4,13.1-.3,4.6,0,7.7.6,12.5.3s.9-1.4-.3-1.5c-4.9-.2-5.3,0-8.6,0h0s0,.3,0,.3Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth-variants'%20data-active='1'%3e%3cpath%20id='tooth-broken-mesial-distal'%20d='M23.3,2.9c1.5,0,3.2.3,4.7.5,1.1,0,2.2.2,3.2.7,1,.5,1.2.6,1.8,1,1,.6,2,1.4,2.8,2.6.8,1.1,1.4,2.4,1.7,3.9,0,.6-3.1-.4-3,.3,0,.8,1.4,3.4,1.4,4.2s-1.6,1.8-1.6,2.6c0,1.2,1.6,1.9,1.5,3.1,0,.6-2.1,2.8-2.1,3.4,0,1,2.3,1.8,2.1,2.7,0,.9-2.3,1.3-2.5,2.2s3.4,1.4,3,2.4c-1,2.4-2.9,3.8-4.7,4.4-.7.2-1.5.4-2.2.6-1.1.3-2.1.8-3.2,1.2-.9.3-1.8.2-2.7,0-.8,0-1.6-.3-2.3-.3-1.3-.2-2.8-.3-3.9-1.4-.9-.9-1.6-2.2-2.2-3.6-.1-.4,2.7-2.2,2.8-4.5s-2.3-1.7-2.2-2.8,0-2.4.5-3.9c.5-1.5,1-1.9,1-2.7.1-2.4-2-1.5-1.8-3.5s.8-2.1,1.1-3.8.3-5,.4-5.2c1-1.6,2.3-3,3.7-3.6.9-.3,1.9-.5,2.8-.5,0,0-.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-14-occl-0);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial'%20d='M23.3,2.9c1.5,0,3.2.3,4.7.5,1.1,0,2.2.2,3.2.7,1,.5,1.2.6,1.8,1,1,.6,2,1.4,2.8,2.6.8,1.1,1.4,2.4,1.7,3.9,0,.6-3.1-.4-3,.3,0,.8,1.4,3.4,1.4,4.2s-1.6,1.8-1.6,2.6c0,1.2,1.6,1.9,1.5,3.1,0,.6-2.1,2.8-2.1,3.4,0,1,2.3,1.8,2.1,2.7,0,.9-2.3,1.3-2.5,2.2s3.4,1.4,3,2.4c-1,2.4-2.9,3.8-4.7,4.4-.7.2-1.5.4-2.2.6-1.1.3-2.1.8-3.2,1.2-.9.3-1.8.2-2.7,0-.8,0-1.6-.3-2.3-.3-1.3-.2-2.8-.3-3.9-1.4-.9-.9-1.6-2.2-2.2-3.6-.7-1.5-1.2-3.2-1.4-5-.2-1.3-.1-2.7-.1-4s.4-3.5.5-5.3c.3-2.1.4-4.3.7-6.4.4-2.1,1.1-4,2-5.6,1-1.6,2.3-3,3.7-3.6.9-.3,1.9-.5,2.8-.5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-14-occl-1);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal'%20d='M23.3,2.9c1.5,0,3.2.3,4.7.5,1.1,0,2.2.2,3.2.7,1,.5,1.2.6,1.8,1,1,.6,2,1.4,2.8,2.6.8,1.1,1.4,2.4,1.7,3.9,0,.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8v3.6c0,1.6,0,3.1-.4,4.6-.4,2-.7,4.2-1.4,6-1,2.4-2.9,3.8-4.7,4.4-.7.2-1.5.4-2.2.6-1.1.3-2.1.8-3.2,1.2-.9.3-1.8.2-2.7,0-.8,0-1.6-.3-2.3-.3-1.3-.2-2.8-.3-3.9-1.4-.9-.9-1.6-2.2-2.2-3.6-.7-1.5,3-2.7,2.8-4.5-.2-1.3-2.3-1.4-2.2-2.8,0-.9.5-3,.5-3.9s.9-1.8,1-2.7c.1-1.4-1.8-2.3-1.8-3.5s.9-3,1.1-3.8c.4-2.1-.6-3.6.4-5.2,1-1.6,2.3-3,3.7-3.6.9-.3,1.9-.5,2.8-.5h-.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-14-occl-2);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='tooth-crownprep'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-crownprep-outer'%20d='M22.3,2.9c1.6,0,3.4.3,5.1.5,1.1,0,2.3.2,3.4.7.7.3,1.3.6,2,1,1.1.6,2.1,1.4,2.9,2.6.8,1.1,1.5,2.4,1.8,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.1,3.8-5.1,4.4-.8.2-1.6.4-2.3.6-1.1.3-2.3.8-3.4,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.4-.2-2.9-.3-4.2-1.4-1-.9-1.7-2.2-2.3-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.1-4,2.1-5.6,1.1-1.6,2.5-3,4-3.6,1-.3,2-.5,3-.5h0v-.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-3);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-crownprep-inner'%20d='M23.2,7.2c1.1,0,2.5.2,3.7.4.8,0,1.7.2,2.5.5.5.2,1,.5,1.4.7.8.4,1.6,1,2.2,1.9.6.8,1.1,1.7,1.4,2.8.2.5.2,1,.2,1.5.2,1.2.3,2.3.2,3.5v2.6c0,1.1,0,2.3-.3,3.4-.3,1.5-.6,3.1-1.1,4.4-.8,1.8-2.3,2.8-3.7,3.3-.5.2-1.1.3-1.7.4-.8.2-1.7.6-2.5.9-.7.2-1.4,0-2.1,0s-1.2-.2-1.8-.3c-1.1,0-2.2-.2-3-1.1-.8-.7-1.3-1.6-1.7-2.7-.5-1.1-.9-2.3-1.1-3.6-.2-1-.2-2,0-3,0-1.3.2-2.6.4-3.9.2-1.6.3-3.2.6-4.7.3-1.5.8-3,1.6-4.1.8-1.2,1.8-2.2,2.9-2.7.7-.3,1.5-.4,2.2-.3h-.3Z'%20data-active='1'%20style='fill:%20%23eaeaea;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth'%20data-active='1'%3e%3cg%20id='tooth-base'%20data-active='1'%3e%3cpath%20id='background-cusp'%20d='M21.9,2.9c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-4);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='cusps'%20data-active='1'%3e%3cpath%20d='M33.5,27.9c.7.6,1.4,2.7,2.3,2.7,1.1-1.1,1.1-3.5,1.4-5,.4-4.8,0-9.8-.5-14.5-.3-1.9-1.8-5.3-3.4-2.1-.6,1.2-1.2,2.5-2,3.6-1.4,2.1-3.9,4-4.2,6.8,0,1.4,1.5,2.9,2.6,4,1.6,1.3,2.3,2.9,3.7,4.4h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-5);'%20/%3e%3cpath%20d='M18.9,26c1.7-2.7,4-5.5,4-8.9-.1-1.4-1.4-3.1-2.3-4.5-1.7-2-2.2-4.2-3.6-6.2-.6-.5-.9,0-1.4.6-1.1,1.9-2.4,4-2.7,6.3-.2,3.2-.6,6.5-1.2,9.6,0,2.5-.3,5.1.4,7.5.4,1.4,1.5,3.8,1.9,5,.2.5.3.8.4.7,1-1.4,3-7.7,4.4-10.2h.1Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-6);'%20/%3e%3cpath%20d='M29.1,15.1c.8-.9,2.1-1.7,2.7-2.8.8-1.1,1.3-2.7,2.1-3.8.3-.4.6-.8.4-1.3-2.6-4-11.2-4.5-15-2-.5.5-1.4.2-1.7.8-.7,3.5,2,6.2,3.3,9.2.8,1.7,1.4,4.5,3.8,4.5,2.1-.3,3.2-2.7,4.2-4.4h0s.2-.2.2-.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-7);'%20/%3e%3cpath%20d='M27.1,19.5c1.6,1.8,3.5,5,5.2,7.1.9,1.1,2.3,2.3,3.3,3.5.4.5.5,1,.4,1.6-1.1,3.8-5,4.4-8.3,5.9-3.8,1.5-6.2,1.5-11.1,0-1.1-.5-2.6-1.1-2.1-2.6.4-1.2,1.5-3.4,2-4.8,1.4-3.6,3.3-7.1,4.8-10.9,1.3-3.1,3.7-1.5,5.7,0h.1s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-8);'%20/%3e%3c/g%3e%3cg%20id='fissure'%20data-active='1'%3e%3cpath%20d='M26.5,19.6c.3-.1.9,1,1.2,1.3.8,1.1,3,3.6,3.4,5.1.4,1.3,3.9,4.3,3.5,4.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M16.6,31c-1,2.3,1.9-5.9,2.8-7.2.8-1,.4-1.2,1.3-2.2.5-.7,2.2-2.7,2.3-3.7s-.3-1.3-1-2.6c-.5-.5-1.1-2-1.6-2.9s-.3-.8-.3-1.3c-.2-2-3.3-5-2.1-3.8'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M33.7,8.6c.8-1.1-2.8,4.2-5,6.6-.5.7-1.7,3.8-2.3,4.4s-.8.9-1.2.9-.7,0-1-.2c-.6-.2-1.2-.7-1.5-1.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='milktooth'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='milktooth-base'%20data-active='1'%3e%3cpath%20id='background-cusp1'%20d='M21.3,2.9c1.9,0,4.1.3,6,.5,1.4,0,2.8.2,4.1.7.8.3,1.5.6,2.3,1,1.3.6,2.5,1.4,3.5,2.6,1,1.1,1.8,2.4,2.2,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-.9,4.2-1.8,6-1.3,2.4-3.7,3.8-6,4.4-.9.2-1.9.4-2.8.6-1.4.3-2.7.8-4.1,1.2-1.2.3-2.3.2-3.4,0-1,0-2-.3-3-.3-1.7-.2-3.5-.3-5-1.4-1.2-.9-2.1-2.2-2.8-3.6-.9-1.5-1.5-3.2-1.8-5-.3-1.3-.2-2.7-.2-4s.5-3.5.6-5.3c.4-2.1.5-4.3.9-6.4.5-2.1,1.4-4,2.5-5.6,1.3-1.6,3-3,4.8-3.6,1.2-.3,2.4-.5,3.6-.5h0v-.2s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='fissure1'%20data-active='1'%3e%3cpath%20d='M21.9,37.3c.3.7-1-2.1-1.5-3.1s-1.5-1.9-2-3c-.6-1.6-1.6-3-1.6-4.8,0-2.7-2.4-4.7-3.8-6.8-.9-1.3-2.1-7.1-1.7-6'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M25.6,18.7c.4-.1,1.1,1,1.4,1.3.9,1.1,3.5,3.6,4,5.1.5,1.3,4.5,4.3,4.2,4.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M15.6,23.6c.9-1.2,1.6-1.3,2.7-2.4,1-.9,2-1.6,3-2.5.5-.6,1.1-1.5,1.3-2.4s-.6-1-.5-2.2c0-.5,0-2.1.2-2.5.7-1.7,0-1.5.2-2.2,0-.3-.4-5.7-.4-5.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M36.3,21.2c1.1.3-3.4-.9-4.8-1.1-.5,0-1.9-.1-2.3-.4-.4-.2-1.5-.2-1.8-.5s-1.5-.6-1.9-.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M35,12c.9-1-2.4,2.2-5,4.3-.6.6-3.1,1.5-3.8,2s-.5.4-1,.4-.8,0-1.2-.2c-.7-.2-1.4-.6-1.8-1.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='surfaces'%20data-active='1'%3e%3cg%20id='subcaries'%20data-active='1'%3e%3cpath%20id='subcaries-lingual'%20d='M20.1,38c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.4s.6-.6.6-1c-.7-1.9-9.5-1.3-10.7-.6-.6.6,1.1,1.7,1.9,2.2h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-buccal'%20d='M20.7,5.8c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.5s.6-.6.6-1c-.8-1.9-9.5-1.2-10.7-.5-.6.6,1.1,1.7,1.9,2.2h.1Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-mesial'%20d='M36.2,28.6c2.7.2,2.7-14.6,1.6-16.2-.4-1.1-1.5-.3-2.2-.6-1.2-.5-1.5,3.4-2.2,5-.3,1.6-3.6,1.3-2.8,4.1s2.6,1,3,1.9.9,4.1,1.7,5.2l.9.7h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-distal'%20d='M15.1,25.9c1.9-.3-.3-3.3,0-5.4.6-3.1,2.1-7.5-.6-7.2-.6.1-1.8-.3-2.2.5-1.8,3-2.4,10.6-.2,12.1,2.2,1.5.5.6.6,1h0c0,.6.5,1,.9.8s.5-.2.6-.4l.9-1.4h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-occlusal'%20d='M23.8,25.6c3.1-1,8.9-8.9,5.1-11.9s-6.7-.2-10,3c-3.3,3.2,3.6,9.2,4.9,8.9Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cg%20id='caries'%20data-active='1'%3e%3cpath%20id='caries-lingual'%20d='M20.1,38c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.4s.6-.6.6-1c-.7-1.9-9.5-1.3-10.7-.6-.6.6,1.1,1.7,1.9,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-buccal'%20d='M20.7,5.8c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.5s.6-.6.6-1c-.8-1.9-9.5-1.2-10.7-.5-.6.6,1.1,1.7,1.9,2.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='caries-mesial'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='mesial-shape'%20d='M36.2,28.6c2.7.2,2.7-14.6,1.6-16.2-.4-1.1-1.5-.3-2.2-.6-1.2-.5-1.5,3.4-2.2,5-.3,1.6-3.6,1.3-2.8,4.1s2.6,1,3,1.9.9,4.1,1.7,5.2l.9.7h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='mesial-patch2'%20d='M35.6,21.5c-3.2,0,.9,4.3,1.7,1.6.3-.9-.8-1.7-1.5-1.6h-.3,0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='mesial-patch1'%20d='M37.3,14.6c-1.3-1.3-4.5.7-2.1,1.6,1.6.5,2.4-.6,2.1-1.5h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-distal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='distal-shape'%20d='M15.1,25.9c1.9-.3-.3-3.3,0-5.4.6-3.1,2.1-7.5-.6-7.2-.6.1-1.8-.3-2.2.5-1.8,3-2.4,10.6-.2,12.1,2.2,1.5.5.6.6,1h0c0,.6.5,1,.9.8s.5-.2.6-.4l.9-1.4h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='distal-patch2'%20d='M14.5,18.3c.9-.7.6-3.2-.6-3.1s-.9,3.6.2,3.1h.4Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='distal-patch1'%20d='M12.8,24.8c0,.3.5.5.8.6.2,0,.6.2.6,0-.2-.5-.8-1.5-1.1-1.8-.6-.3-.4.9-.3,1.2h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-occlusal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='occlusal-shape'%20d='M19.3,26.7c.8-1.2,2.2-1.3,2.7-1.4,1.3-.4,1.2-3.5,2.7-3.1,2.4.6,1.1,2.4,4.5,2.6,2,.1,1.1-2.5,1.1-5.8s1-5.3.9-5.9c-.7-2-5,5.5-6.6,4.3s-3.3-7.8-4.7-7.8,2.4,6.4,1,7.7-.9,2-1.8,3.2-.2,6.8.2,6.2Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='occlusal-patch2'%20d='M26,19c-.7,3,3.2,1.5,3.6,0,.5-.8.2-2-.5-2.3-1.2-.5-2.4,1-3.2,2.1h0v.2s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='occlusal-patch1'%20d='M20.1,20.9c0,1.5.9,2.6,1.6,1.2.4-.9.4-3.1-.4-3.1s-1.1.7-1.1,1.8v.2h-.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fillings'%20data-active='1'%3e%3cg%20id='amalgam'%20data-active='1'%3e%3cpath%20id='filling-amalgam-occlusal'%20d='M23.8,25.6c3.1-1,8.9-8.9,5.1-11.9s-6.7-.2-10,3c-3.3,3.2,3.6,9.2,4.9,8.9Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-lingual'%20d='M20.1,38c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.4s.6-.6.6-1c-.7-1.9-9.5-1.3-10.7-.6-.6.6,1.1,1.7,1.9,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-buccal'%20d='M20.7,5.8c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.5s.6-.6.6-1c-.8-1.9-9.5-1.2-10.7-.5-.6.6,1.1,1.7,1.9,2.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-mesial'%20d='M36.2,28.6c2.7.2,2.7-14.6,1.6-16.2-.4-1.1-1.5-.3-2.2-.6-1.2-.5-1.5,3.4-2.2,5-.3,1.6-3.6,1.3-2.8,4.1s2.6,1,3,1.9.9,4.1,1.7,5.2l.9.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-distal'%20d='M15.1,25.9c1.9-.3-.3-3.3,0-5.4.6-3.1,2.1-7.5-.6-7.2-.6.1-1.8-.3-2.2.5-1.8,3-2.4,10.6-.2,12.1,2.2,1.5.5.6.6,1h0c0,.6.5,1,.9.8s.5-.2.6-.4l.9-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='composite'%20data-active='1'%3e%3cpath%20id='filling-composite-occlusal'%20d='M23.8,25.6c3.1-1,8.9-8.9,5.1-11.9s-6.7-.2-10,3c-3.3,3.2,3.6,9.2,4.9,8.9Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-lingual'%20d='M20.1,38c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.4s.6-.6.6-1c-.7-1.9-9.5-1.3-10.7-.6-.6.6,1.1,1.7,1.9,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-buccal'%20d='M20.7,5.8c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.5s.6-.6.6-1c-.8-1.9-9.5-1.2-10.7-.5-.6.6,1.1,1.7,1.9,2.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-mesial'%20d='M36.2,28.6c2.7.2,2.7-14.6,1.6-16.2-.4-1.1-1.5-.3-2.2-.6-1.2-.5-1.5,3.4-2.2,5-.3,1.6-3.6,1.3-2.8,4.1s2.6,1,3,1.9.9,4.1,1.7,5.2l.9.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-distal'%20d='M15.1,25.9c1.9-.3-.3-3.3,0-5.4.6-3.1,2.1-7.5-.6-7.2-.6.1-1.8-.3-2.2.5-1.8,3-2.4,10.6-.2,12.1,2.2,1.5.5.6.6,1h0c0,.6.5,1,.9.8s.5-.2.6-.4l.9-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gic'%20data-active='1'%3e%3cpath%20id='filling-gic-occlusal'%20d='M23.8,25.6c3.1-1,8.9-8.9,5.1-11.9s-6.7-.2-10,3c-3.3,3.2,3.6,9.2,4.9,8.9Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-lingual'%20d='M20.1,38c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.4s.6-.6.6-1c-.7-1.9-9.5-1.3-10.7-.6-.6.6,1.1,1.7,1.9,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-buccal'%20d='M20.7,5.8c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.5s.6-.6.6-1c-.8-1.9-9.5-1.2-10.7-.5-.6.6,1.1,1.7,1.9,2.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-mesial'%20d='M36.2,28.6c2.7.2,2.7-14.6,1.6-16.2-.4-1.1-1.5-.3-2.2-.6-1.2-.5-1.5,3.4-2.2,5-.3,1.6-3.6,1.3-2.8,4.1s2.6,1,3,1.9.9,4.1,1.7,5.2l.9.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-distal'%20d='M15.1,25.9c1.9-.3-.3-3.3,0-5.4.6-3.1,2.1-7.5-.6-7.2-.6.1-1.8-.3-2.2.5-1.8,3-2.4,10.6-.2,12.1,2.2,1.5.5.6.6,1h0c0,.6.5,1,.9.8s.5-.2.6-.4l.9-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary'%20data-active='1'%3e%3cpath%20id='filling-temporary-occlusal'%20d='M23.8,25.6c3.1-1,8.9-8.9,5.1-11.9s-6.7-.2-10,3c-3.3,3.2,3.6,9.2,4.9,8.9Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-lingual'%20d='M20.1,38c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.4s.6-.6.6-1c-.7-1.9-9.5-1.3-10.7-.6-.6.6,1.1,1.7,1.9,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-buccal'%20d='M20.7,5.8c.9.5,2.4.7,3.6.7,2,0,3.6-.5,4.5-1.5s.6-.6.6-1c-.8-1.9-9.5-1.2-10.7-.5-.6.6,1.1,1.7,1.9,2.2h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-mesial'%20d='M36.2,28.6c2.7.2,2.7-14.6,1.6-16.2-.4-1.1-1.5-.3-2.2-.6-1.2-.5-1.5,3.4-2.2,5-.3,1.6-3.6,1.3-2.8,4.1s2.6,1,3,1.9.9,4.1,1.7,5.2l.9.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-distal'%20d='M15.1,25.9c1.9-.3-.3-3.3,0-5.4.6-3.1,2.1-7.5-.6-7.2-.6.1-1.8-.3-2.2.5-1.8,3-2.4,10.6-.2,12.1,2.2,1.5.5.6.6,1h0c0,.6.5,1,.9.8s.5-.2.6-.4l.9-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='defect'%20data-active='1'%3e%3cpolygon%20id='defect-occlusal'%20points='22.8%2013.1%2024.3%2012.5%2023.4%2013.8%2021%2015.6%2019.5%2016.2%2020.4%2014.9%2022.8%2013.1'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-lingual'%20points='24.3%2038.2%2025.2%2038.8%2024.3%2039.3%2022.5%2039.2%2021.7%2038.5%2022.6%2038%2024.3%2038.2'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-buccal'%20points='23.7%203.4%2022.8%202.9%2023.7%202.3%2025.4%202.3%2026.3%202.9%2025.4%203.4%2023.7%203.4'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-distal'%20points='11.6%2020%2010.9%2021.3%2010.5%2019.8%2010.9%2017%2011.7%2015.6%2012%2017.1%2011.6%2020'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-mesial'%20points='38.9%2021.1%2038.3%2022.5%2037.8%2021.1%2037.8%2018.2%2038.3%2016.8%2038.9%2018.2%2038.9%2021.1'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='contact-point'%20data-active='1'%3e%3cg%20id='mesial-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M37.1,15.5c.7,3,1.7,6.3,2.7,9.4'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M36.9,25.4c.6-1.8.8-3,1.3-4.5.6-1.7,1-3.4,1.5-5.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='distal-no-contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M9.4,16.4c.7,3.1,1.7,6.4,2.7,9.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M9.2,26.2c.7-1.8.8-2.9,1.3-4.3.6-1.6,1.1-3.3,1.5-5.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fissure-sealing'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='fissure-sealing-occlusal'%20data-active='1'%3e%3cpath%20d='M25.2,20.6c.3-.2,1.9-.4,2.2-.1,1.1.9,2.5,2.9,3.3,4.4.7,1.2,3.9,5.2,3.6,4.9'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M16.4,31.7c-1.2,2,2.8-5.5,3.4-6.9.6-1.2,1.2-2.1,1.8-3.3.3-.7.5-1.8.4-2.8s-.8-.9-1-2.2c-.1-.5-.6-2.2-.5-2.6.1-1.9-.4-1.5-.5-2.3,0-.3-1.9-5.8-1.8-5.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M33.7,8.6c.9-1.2-3.9,5.8-5.4,8.5-.4.8-2.2,2.2-2.6,2.9s-.3.5-.7.6-.7.2-1,0c-.7,0-2.3-3.5-2.9-4.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='restorations'%20data-active='1'%3e%3cg%20id='implant'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='implant-base'%20data-active='1'%3e%3cpath%20d='M25.8,34.9h-2.8l-.7-2.2c-.8-.2-1.5-.3-2.3-.7l-1.8,1.6-2.4-1.4.6-2.3c-.6-.5-1.2-1.1-1.7-1.7l-2.3.6-1.4-2.4,1.6-1.8c-.3-.8-.5-1.5-.7-2.3l-2.2-.7v-2.8l2.2-.7c.2-.8.4-1.5.7-2.3l-1.6-1.8,1.4-2.4,2.3.6c.5-.6,1-1.1,1.7-1.7l-.6-2.4,2.4-1.4,1.7,1.6c.8-.3,1.5-.5,2.3-.6l.7-2.2h2.8l.6,2.2c.8.2,1.5.3,2.3.6l1.8-1.6,2.4,1.4-.6,2.3c.6.5,1.1,1,1.7,1.7l2.3-.6,1.4,2.4-1.6,1.7c.3.8.5,1.5.7,2.3l2.2.7v2.8l-2.2.7c-.2.8-.4,1.6-.7,2.3l1.6,1.8-1.4,2.4-2.3-.6c-.5.6-1,1.1-1.7,1.6l.6,2.4-2.4,1.4-1.8-1.6c-.8.3-1.5.5-2.3.6l-.6,2.2v.3s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23145d2a;'%20/%3e%3cpath%20d='M26.3,32.2h-.2l-.6,2.1h-2.1l-.6-2s0-.2-.2-.2c-.9,0-1.8-.4-2.6-.7l-1.7,1.6-1.8-1,.5-2.3c-.8-.6-1.4-1.3-2-2l-2.3.6-1-1.8,1.6-1.7c-.4-.9-.6-1.8-.8-2.8l-2.1-.7v-2.1l2-.6c.2,0,.2-.1.2-.3.1-.9.4-1.7.7-2.6l-1.6-1.7,1-1.8,2.3.6c.6-.7,1.3-1.4,2-2l-.6-2.3,1.8-1,1.6,1.5s.2.1.3,0c.9-.3,1.7-.5,2.7-.7l.7-2.2h2.1l.6,2c0,.1,0,.2.2.2.9.1,1.8.4,2.6.7l1.7-1.6,1.8,1.1-.6,2.3c.8.6,1.4,1.3,2,2l2.3-.6,1,1.8-1.6,1.7c.4.9.6,1.8.8,2.8l2.1.7v2.1l-2,.6s0,.1-.2.2c0,.9-.4,1.7-.7,2.5s0,.2,0,.2l1.5,1.6-1,1.8-2.3-.6c-.6.7-1.3,1.4-2,2l.6,2.3-1.8,1-1.7-1.6c-.9.3-1.7.6-2.6.7h0s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23c8c8c8;'%20/%3e%3ccircle%20cx='24.5'%20cy='20.2'%20r='9.4'%20data-active='1'%20style='fill:%20%23eaeaea;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3ccircle%20cx='24.5'%20cy='20.2'%20r='5.8'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cpath%20id='implant-bar'%20d='M1.8,15.5c-3.4,7.4-1,15.6,2.9,15.1,8.2.8,27.3,0,36.3,0s6.5-2.3,7.5-8.5c.6-3.7,0-7.1-1.4-9.3-2.6-3.4-6.5-2.8-9.6-3.1-5.2,0-9.5,0-14.3.6-5.3.6-10.4,0-15.5.8-2.1,0-4.5,1.1-6,4h0v.6-.2s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-9);'%20/%3e%3ccircle%20id='implant-healing-abutment'%20cx='24.4'%20cy='20.3'%20r='11.4'%20data-active='1'%20style='fill:%20%23475563;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3ccircle%20id='implant-locator-screw'%20cx='24.5'%20cy='20.2'%20r='8.2'%20data-active='1'%20style='fill:%20url(%23linear-gradient-14-occl-10);%20isolation:%20isolate;%20opacity:%20.8;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='prosthesis-implant'%20data-active='1'%3e%3cpath%20id='prosthesis-implant-gum'%20d='M48.6,23.2c-2.6,8.1-13,3.2-19,3.7-7.9-.9-20.9,4.1-26.5-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.9-4.3,18.5-3.9,25.7-3.7,8.2.6,23.5-.7,20.5,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='prosthesis-implant-crown'%20d='M22.4,4.6c1.4,0,2.9.3,4.3.4.9,0,2,.2,2.9.6.6.3,1.1.5,1.6.9.9.5,1.8,1.2,2.5,2.2.7.9,1.3,2.1,1.5,3.3,0,.5.2,1.1.3,1.7.2,1.5.3,2.7.3,4.1v3.1c0,1.4,0,2.7-.3,3.9-.3,1.7-.6,3.6-1.3,5.1-.9,2.1-2.7,3.3-4.3,3.8-.6.2-1.4.3-2,.5-.9.3-1.9.7-2.9,1-.9.3-1.6.2-2.4,0-.7,0-1.4-.3-2.1-.3-1.2-.2-2.5-.3-3.5-1.2-.9-.8-1.5-1.9-2-3.1-.6-1.3-1.1-2.7-1.3-4.3-.2-1.1,0-2.3,0-3.4s.3-3,.4-4.5c.3-1.8.3-3.7.6-5.5s.9-3.4,1.8-4.8c.9-1.4,2.1-2.6,3.4-3.1.9-.3,1.7-.4,2.6-.4h0v-.2h-.2v.2s.1,0,.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='prosthesis'%20data-active='1'%3e%3cpath%20id='prosthesis-connector'%20d='M48.6,23.2c-2.6,8.1-13,3.2-19,3.7-7.9-.9-20.9,4.1-26.5-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.9-4.3,18.5-3.9,25.7-3.7,8.2.6,23.5-.7,20.5,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='prosthesis-crown'%20d='M22,2.9c1.6,0,3.4.3,5,.5,1.1,0,2.3.2,3.4.7.7.3,1.3.6,1.9,1,1,.6,2.1,1.4,2.9,2.6.8,1.1,1.5,2.4,1.8,3.9,0,.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8v3.6c0,1.6,0,3.1-.4,4.6-.4,2-.7,4.2-1.5,6-1,2.4-3.1,3.8-5,4.4-.7.2-1.6.4-2.3.6-1.1.3-2.2.8-3.4,1.2-1,.3-1.9.2-2.8,0-.8,0-1.6-.3-2.5-.3-1.4-.2-2.9-.3-4.1-1.4-1-.9-1.7-2.2-2.3-3.6-.7-1.5-1.3-3.2-1.5-5-.2-1.3-.1-2.7-.1-4s.4-3.5.5-5.3c.3-2.1.4-4.3.7-6.4.4-2.1,1.1-4,2.1-5.6s2.5-3,4-3.6c1-.3,2-.5,3-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='telescope'%20data-active='1'%3e%3cpath%20id='telescope-bridge-connector'%20d='M48.6,23.2c-2.7,8.1-13.2,3.2-19.3,3.7-8.1-.9-21.3,4.1-27-2.6-2-2.8-3.3-7.5-.7-10.3,5-4.3,18.8-3.9,26.1-3.7,8.4.6,24-.7,20.9,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cg%20id='telescope-crown'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='telescope-crown-outside'%20d='M21.7,2.9c1.6,0,3.4.3,5.1.5,1.1,0,2.4.2,3.4.7.7.3,1.3.6,2,1,1.1.6,2.1,1.4,3,2.6.8,1.1,1.5,2.4,1.8,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.1,3.8-5.1,4.4-.8.2-1.6.4-2.4.6-1.1.3-2.3.8-3.4,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.4-.2-3-.3-4.2-1.4-1-.9-1.7-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.1-4,2.1-5.6,1.1-1.6,2.5-3,4-3.6,1-.3,2.1-.5,3-.5h0v-.2s.2,0,.2,0Z'%20data-active='1'%20style='fill:%20%230051bf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='telescope-crown-inside'%20d='M22.6,7.3c1.2,0,2.6.3,3.8.4.9,0,1.8.2,2.6.5.5.2,1,.5,1.4.7.8.4,1.6,1.1,2.3,1.9.6.8,1.1,1.8,1.4,2.9.2.5.2,1,.3,1.5.2,1.3.3,2.4.3,3.7v2.7c0,1.2,0,2.4-.3,3.5-.3,1.5-.6,3.2-1.1,4.5-.8,1.8-2.3,2.9-3.8,3.4-.6.2-1.2.3-1.7.4-.9.2-1.7.6-2.6.9-.8.2-1.4,0-2.2,0s-1.3-.2-1.9-.3c-1.1,0-2.2-.2-3.1-1.1-.8-.7-1.3-1.7-1.8-2.7-.5-1.1-1-2.4-1.1-3.8-.2-1-.2-2,0-3.1,0-1.4.2-2.7.5-4,.2-1.6.3-3.3.6-4.8.3-1.6.8-3.1,1.7-4.3.8-1.2,1.9-2.3,3-2.7.8-.3,1.5-.4,2.3-.4h0l-.2.2s-.4,0-.4,0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='zircon'%20data-active='1'%3e%3cpath%20id='zircon-bridge-connector'%20d='M48.6,23.2c-2.7,8.1-13.3,3.2-19.4,3.7-8.1-.9-21.4,4.1-27.1-2.6-2-2.8-3.3-7.5-.7-10.3,5-4.3,18.9-3.9,26.2-3.7,8.4.6,24.1-.7,21,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='zircon-crown'%20d='M21.9,2.9c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-onlay'%20d='M26.5,13.5c1.2-.3,6.2-8.7,7.5-7.9s2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7.2,5,0,6.2,0,1.6-.5,4.2-.7,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-6,4.8-7.5,2.7-1.8-1.8-3.6-5.4-5.4-3.6-1.8,1.8-8.2,4.3-8.9,2.9-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,1.5-3,2.3-4,.9-1.2,2.4-2.7,2.2-6.4-.5-.5-1.4-8.9-1.7-9.5-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3,1.8,2.7,3.3,2.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-inlay'%20d='M25.2,16.1c.7.3.9-.1,1.5-.9s6-10.5,7.2-9.7,2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7-4.3,2.8-6.1,3.7-1.9,1.2-4.3,1.3-4.5,2.5,0,1.6,10.1,4.2,9.9,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-5.6-3.7-7.1-5.9-1.8-1.8-4.6-2.1-6.4-.3s-7.6,9.6-8.3,8.2c-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,2.6-3.2,3.5-4.2.9-1.2,7.1-3.6,4.6-6-.5-.5-5-9.1-5.3-9.7-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3.9,4.5,2,5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-veneer'%20d='M26.7,3.4c1.2,0,2.5.2,3.6.7.7.3,1.4.6,2.1,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7-25.5,1.3-25.1-.8.4-2.1.2-4,1.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.2-.5h0s3.7,0,5.4.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal'%20data-active='1'%3e%3cpath%20id='metal-bridge-connector'%20d='M46.9,23.2c-2.5,8.1-12.4,3.2-18.1,3.7-7.6-.9-20,4.1-25.3-2.6-1.8-2.8-3.1-7.5-.7-10.3,4.7-4.3,17.6-3.9,24.5-3.7,7.9.6,22.5-.7,19.6,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='metal-crown'%20d='M21.6,2.9c1.6,0,3.5.3,5.3.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.6,6-1.1,2.4-3.2,3.8-5.3,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.4.8-3.5,1.2-1,.3-2,.2-3,0-.9,0-1.7-.3-2.6-.3-1.5-.2-3.1-.3-4.3-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.6-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.1-.5h0v-.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal-ceramic'%20data-active='1'%3e%3cpath%20id='metal-ceramic-bridge-connector'%20d='M46.9,23.2c-2.5,8.1-12.4,3.2-18.1,3.7-7.6-.9-20,4.1-25.3-2.6-1.8-2.8-3.1-7.5-.7-10.3,4.7-4.3,17.6-3.9,24.5-3.7,7.9.6,22.5-.7,19.6,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-0);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='metal-ceramic-crown'%20d='M21.6,2.9c1.6,0,3.5.3,5.3.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.6,6-1.1,2.4-3.2,3.8-5.3,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.4.8-3.5,1.2-1,.3-2,.2-3,0-.9,0-1.7-.3-2.6-.3-1.5-.2-3.1-.3-4.3-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.6-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.1-.5h0v-.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-1);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gold'%20data-active='1'%3e%3cpath%20id='gold-bridge-connector'%20d='M47.5,23.1c-2.6,8.1-12.7,3.2-18.5,3.7-7.7-.9-20.4,4.1-25.9-2.6-1.9-2.8-3.2-7.5-.7-10.2,4.8-4.3,18-3.9,25.1-3.7,8,.6,23-.7,20,12.6v.4h0v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='gold-crown'%20d='M21.9,2.9c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-onlay'%20d='M26.5,13.5c1.2-.3,6.2-8.7,7.5-7.9s2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7.2,5,0,6.2,0,1.6-.5,4.2-.7,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-6,4.8-7.5,2.7-1.8-1.8-3.6-5.4-5.4-3.6-1.8,1.8-8.2,4.3-8.9,2.9-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,1.5-3,2.3-4,.9-1.2,2.4-2.7,2.2-6.4-.5-.5-1.4-8.9-1.7-9.5-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3,1.8,2.7,3.3,2.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-inlay'%20d='M25.2,16.1c.7.3.9-.1,1.5-.9s6-10.5,7.2-9.7,2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7-4.3,2.8-6.1,3.7-1.9,1.2-4.3,1.3-4.5,2.5,0,1.6,10.1,4.2,9.9,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-5.6-3.7-7.1-5.9-1.8-1.8-4.6-2.1-6.4-.3s-7.6,9.6-8.3,8.2c-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,2.6-3.2,3.5-4.2.9-1.2,7.1-3.6,4.6-6-.5-.5-5-9.1-5.3-9.7-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3.9,4.5,2,5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-veneer'%20d='M26.7,3.4c1.2,0,2.5.2,3.6.7.7.3,1.4.6,2.1,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7-25.5,1.3-25.1-.8.4-2.1.2-4,1.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.2-.5h0s3.7,0,5.4.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='emax'%20data-active='1'%3e%3cpath%20id='emax-bridge-connector'%20d='M47.5,23.1c-2.6,8.1-12.7,3.2-18.5,3.7-7.7-.9-20.4,4.1-25.9-2.6-1.9-2.8-3.2-7.5-.7-10.2,4.8-4.3,18-3.9,25.1-3.7,8,.6,23-.7,20,12.6v.4h0v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-2);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='emax-crown'%20d='M21.9,2.9c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-3);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-onlay'%20d='M26.5,13.5c1.2-.3,6.2-8.7,7.5-7.9s2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7.2,5,0,6.2,0,1.6-.5,4.2-.7,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-6,4.8-7.5,2.7-1.8-1.8-3.6-5.4-5.4-3.6-1.8,1.8-8.2,4.3-8.9,2.9-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,1.5-3,2.3-4,.9-1.2,2.4-2.7,2.2-6.4-.5-.5-1.4-8.9-1.7-9.5-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3,1.8,2.7,3.3,2.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-4);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-inlay'%20d='M25.2,16.1c.7.3.9-.1,1.5-.9s6-10.5,7.2-9.7,2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7-4.3,2.8-6.1,3.7-1.9,1.2-4.3,1.3-4.5,2.5,0,1.6,10.1,4.2,9.9,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-5.6-3.7-7.1-5.9-1.8-1.8-4.6-2.1-6.4-.3s-7.6,9.6-8.3,8.2c-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,2.6-3.2,3.5-4.2.9-1.2,7.1-3.6,4.6-6-.5-.5-5-9.1-5.3-9.7-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3.9,4.5,2,5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-5);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-veneer'%20d='M26.7,3.4c1.2,0,2.5.2,3.6.7.7.3,1.4.6,2.1,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7-25.5,1.3-25.1-.8.4-2.1.2-4,1.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.2-.5h0s3.7,0,5.4.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-14-occl-6);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gradia'%20data-active='1'%3e%3cpath%20id='gradia-bridge-connector'%20d='M47.5,23.1c-2.6,8.1-12.7,3.2-18.5,3.7-7.7-.9-20.4,4.1-25.9-2.6-1.9-2.8-3.2-7.5-.7-10.2,4.8-4.3,18-3.9,25.1-3.7,8,.6,23-.7,20,12.6v.4h0v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='gradia-crown'%20d='M21.9,2.9c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-onlay'%20d='M26.5,13.5c1.2-.3,6.2-8.7,7.5-7.9s2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7.2,5,0,6.2,0,1.6-.5,4.2-.7,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-6,4.8-7.5,2.7-1.8-1.8-3.6-5.4-5.4-3.6-1.8,1.8-8.2,4.3-8.9,2.9-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,1.5-3,2.3-4,.9-1.2,2.4-2.7,2.2-6.4-.5-.5-1.4-8.9-1.7-9.5-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3,1.8,2.7,3.3,2.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-inlay'%20d='M25.2,16.1c.7.3.9-.1,1.5-.9s6-10.5,7.2-9.7,2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7-4.3,2.8-6.1,3.7-1.9,1.2-4.3,1.3-4.5,2.5,0,1.6,10.1,4.2,9.9,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-5.6-3.7-7.1-5.9-1.8-1.8-4.6-2.1-6.4-.3s-7.6,9.6-8.3,8.2c-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,2.6-3.2,3.5-4.2.9-1.2,7.1-3.6,4.6-6-.5-.5-5-9.1-5.3-9.7-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3.9,4.5,2,5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-veneer'%20d='M26.7,3.4c1.2,0,2.5.2,3.6.7.7.3,1.4.6,2.1,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7-25.5,1.3-25.1-.8.4-2.1.2-4,1.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.2-.5h0s3.7,0,5.4.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary-restorations'%20data-active='1'%3e%3cpath%20id='temporary-bridge-connector'%20d='M47.5,23.1c-2.6,8.1-12.7,3.2-18.5,3.7-7.7-.9-20.4,4.1-25.9-2.6-1.9-2.8-3.2-7.5-.7-10.2,4.8-4.3,18-3.9,25.1-3.7,8,.6,23-.7,20,12.6v.4h0v-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fffffb;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='temporary-crown'%20d='M21.4,2.9c1.7,0,3.6.3,5.3.5,1.2,0,2.5.2,3.6.7.7.3,1.4.6,2.1,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.6,6-1.1,2.4-3.3,3.8-5.3,4.4-.8.2-1.7.4-2.5.6-1.2.3-2.4.8-3.6,1.2-1,.3-2.1.2-3,0-.9,0-1.7-.3-2.6-.3-1.5-.2-3.1-.3-4.4-1.4-1-.9-1.8-2.2-2.5-3.6-.8-1.5-1.4-3.2-1.6-5-.2-1.3-.2-2.7-.2-4s.4-3.5.6-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.2-.5h0v-.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-onlay'%20d='M26.5,13.5c1.2-.3,6.2-8.7,7.5-7.9s2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7.2,5,0,6.2,0,1.6-.5,4.2-.7,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-6,4.8-7.5,2.7-1.8-1.8-3.6-5.4-5.4-3.6-1.8,1.8-8.2,4.3-8.9,2.9-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,1.5-3,2.3-4,.9-1.2,2.4-2.7,2.2-6.4-.5-.5-1.4-8.9-1.7-9.5-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3,1.8,2.7,3.3,2.4Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-inlay'%20d='M25.2,16.1c.7.3.9-.1,1.5-.9s6-10.5,7.2-9.7,2.7,4.3,3.4,6,.7,2.4.9,3.1c.2,1.7-4.3,2.8-6.1,3.7-1.9,1.2-4.3,1.3-4.5,2.5,0,1.6,10.1,4.2,9.9,5.7-.4,2-1,5-1.8,6.8-1.1,2.4-5.6-3.7-7.1-5.9-1.8-1.8-4.6-2.1-6.4-.3s-7.6,9.6-8.3,8.2c-.8-1.5-2.2-5.1-2.4-6.9-.2-1.3,2.6-3.2,3.5-4.2.9-1.2,7.1-3.6,4.6-6-.5-.5-5-9.1-5.3-9.7-.9-1.7,2.2-3.7,3.7-4.8s4.2,5.7,5.1,7.3.9,4.5,2,5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-veneer'%20d='M26.7,3.4c1.2,0,2.5.2,3.6.7.7.3,1.4.6,2.1,1,1.1.6,2.2,1.4,3.1,2.6.9,1.1,1.6,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7-25.5,1.3-25.1-.8.4-2.1.2-4,1.2-5.6,1.1-1.6,2.6-3,4.2-3.6,1-.3,2.1-.5,3.2-.5h0s3.7,0,5.4.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='ortho'%20data-active='1'%3e%3cg%20id='missing-closed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M7.8,4.3c21.7,10.1,19.3,22.9,0,33.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M41,36.8c-21.8-9.9-19.7-22.8-.6-33.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cpath%20id='ortho-ring'%20d='M21.9,2.9c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20none;%20stroke:%20%23737373;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cg%20id='ortho-bracket'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='25.7'%20cy='3.6'%20rx='5.4'%20ry='1.6'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cpath%20d='M24.7,4.9h-2.9c-.6-.1-1.1-.6-1.1-1.2s.4-1.3,1.2-1.4h8c.7,0,1.3.6,1.3,1.3s-.5,1.3-1.3,1.3h-2.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrows'%20data-active='1'%3e%3cg%20id='arrow-distal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='7.1'%20y1='17'%20x2='3.6'%20y2='20.6'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='9.6'%20y1='20.7'%20x2='3.5'%20y2='20.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='7.1'%20y1='24.4'%20x2='3.6'%20y2='20.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-mesial'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='43.7'%20y1='24.4'%20x2='48'%20y2='20.8'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='40.5'%20y1='20.7'%20x2='48.1'%20y2='20.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='43.7'%20y1='17'%20x2='48'%20y2='20.7'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-rotation'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20d='M42.4,36c-.2,0-.8-.3-1.1-1s-.2-.9-.1-1.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M40.5,31.4c1-1.4,6.1-1.3,5.4,1.7-.1,3.5-8,.9-3.4,0'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='plan'%20data-active='1'%3e%3cg%20id='extraction-plan'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M9.1,38.2c1.6-2.5,33.3-32,34.3-33.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3cpath%20d='M9.6,5.2c3.2,2.2,23.4,24.4,27.6,29.8.7.9,1.4,1.9,2.4,2.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3cg%20id='crown-needed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-needed-shape'%20d='M22.2,3.5c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20%23c83014;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='crown-needed-path'%20d='M23.3,4.3c-2.3,3.7-4.7,7.4-7,11-.9,1.5-3.4,3.3-2.3,5.2,1.3,1.2,2.3-1.3,3-2.2,3.5-4.6,5.9-10.8,11.6-13.7.5-.2.8-.2,1,0s.1.7,0,1.2c-2.4,7.3-11.3,14.4-13.8,21.4-5.3,13.3,1.7,5.5,5.2-1.3,2.9-4.9,7.4-12.9,11.7-17,2.7-1.8,1.9,2.7,1.4,4.2-1.5,7-11.5,12.8-11.6,20.1,1.1,5.9,9.4-10.3,11.3-12.6.7-1,3-3.4,3-1.1,0,4-2.8,8.3-4.8,11.3-.6,1.1-1.4,2.2-1.5,3.5.8,2.6,6.4-4.8,7.3-5.8'%20data-active='1'%20style='fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='crown-replace'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-replace-shape'%20d='M22.2,3.5c1.6,0,3.5.3,5.2.5,1.2,0,2.4.2,3.5.7.7.3,1.3.6,2,1,1.1.6,2.2,1.4,3,2.6.8,1.1,1.5,2.4,1.9,3.9.2.6.2,1.3.4,2,.2,1.7.4,3.2.4,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.4,4.6-.4,2-.8,4.2-1.5,6-1.1,2.4-3.2,3.8-5.2,4.4-.8.2-1.6.4-2.4.6-1.2.3-2.3.8-3.5,1.2-1,.3-2,.2-2.9,0-.8,0-1.7-.3-2.5-.3-1.5-.2-3-.3-4.2-1.4-1-.9-1.8-2.2-2.4-3.6-.8-1.5-1.3-3.2-1.5-5-.2-1.3-.2-2.7-.2-4s.4-3.5.5-5.3c.3-2.1.4-4.3.8-6.4.4-2.1,1.2-4,2.2-5.6,1.1-1.6,2.5-3,4.1-3.6,1-.3,2.1-.5,3.1-.5h0v-.2s-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23c83014;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", l0 = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20Part%20of%20React%20Odontogram%20Modul%20-%20https://github.com/ZoliQua/React-Odontogram-Modul%20-%20SVG%20Version:%202.5.0%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20id='molar_x5F_tooth'%20version='1.1'%20viewBox='0%200%2048.2%2041.5'%3e%3cstyle%3e%20[data-active='0']%20{%20display:%20none;%20}%20%3c/style%3e%3cdefs%3e%3clinearGradient%20id='linear-gradient-16-occl-0'%20x1='8'%20y1='-2065.3'%20x2='39.9'%20y2='-2065.3'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-1'%20x1='5.8'%20y1='-2065.3'%20x2='39.9'%20y2='-2065.3'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-2'%20x1='7.9'%20y1='-2065.4'%20x2='40.8'%20y2='-2065.4'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-3'%20x1='5.8'%20y1='-2065.4'%20x2='40.8'%20y2='-2065.4'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-4'%20x1='5.8'%20y1='-2065.4'%20x2='40.8'%20y2='-2065.4'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-5'%20x1='37.3'%20y1='-2069.4'%20x2='30.4'%20y2='-2057.3'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-6'%20x1='10.7'%20y1='-2051.9'%20x2='21.2'%20y2='-2062.3'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-7'%20x1='28.6'%20y1='-2047.7'%20x2='28.6'%20y2='-2063.4'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0f0f0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-8'%20x1='30.7'%20y1='-2081.8'%20x2='19.7'%20y2='-2062.6'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-9'%20x1='32.2'%20y1='-2075.9'%20x2='32.2'%20y2='-2062.7'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-10'%20x1='6.7'%20y1='-2074.8'%20x2='15.5'%20y2='-2069.7'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23f0eff0'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23e2d4c8'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-11'%20x1='23.5'%20y1='3100.8'%20x2='23.5'%20y2='3122'%20gradientTransform='translate(0%20-3090.7732)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23c8c9c9'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23828282'%20data-active='1'%20/%3e%3c/linearGradient%3e%3clinearGradient%20id='linear-gradient-16-occl-12'%20x1='15.3'%20y1='-2064.8'%20x2='31.7'%20y2='-2064.8'%20gradientTransform='translate(0%20-2044.4678)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='.3'%20stop-color='%23cf0'%20stop-opacity='.5'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23b4c500'%20data-active='1'%20/%3e%3c/linearGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-0'%20cx='24.3'%20cy='23.7'%20fx='24.3'%20fy='23.7'%20r='17.8'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-1'%20cx='23.5'%20cy='21.8'%20fx='23.5'%20fy='21.8'%20r='17.8'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23feff5f'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23f9fc60'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23edf564'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23d8ea6b'%20data-active='1'%20/%3e%3cstop%20offset='.5'%20stop-color='%23bbd975'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%2395c482'%20data-active='1'%20/%3e%3cstop%20offset='.8'%20stop-color='%2368ab91'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23328da3'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%230071b5'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-2'%20cx='24.3'%20cy='23.7'%20fx='24.3'%20fy='23.7'%20r='17.8'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-3'%20cx='23.4'%20cy='47.6'%20fx='23.4'%20fy='47.6'%20r='17.8'%20gradientTransform='translate(0%20-26.8)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-4'%20cx='23.7'%20cy='21.8'%20fx='23.7'%20fy='21.8'%20r='17.5'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-5'%20cx='23.7'%20cy='21.9'%20fx='23.7'%20fy='21.9'%20r='17.5'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3cradialGradient%20id='radial-gradient-16-occl-6'%20cx='24.1'%20cy='33.9'%20fx='24.1'%20fy='33.9'%20r='12.3'%20gradientTransform='translate(0%2042.6)%20scale(1%20-1)'%20gradientUnits='userSpaceOnUse'%20data-active='1'%3e%3cstop%20offset='0'%20stop-color='%23fff'%20data-active='1'%20/%3e%3cstop%20offset='0'%20stop-color='%23fdf3ea'%20data-active='1'%20/%3e%3cstop%20offset='.2'%20stop-color='%23f9d8b9'%20data-active='1'%20/%3e%3cstop%20offset='.3'%20stop-color='%23f5c18f'%20data-active='1'%20/%3e%3cstop%20offset='.4'%20stop-color='%23f2ae6c'%20data-active='1'%20/%3e%3cstop%20offset='.6'%20stop-color='%23f09f52'%20data-active='1'%20/%3e%3cstop%20offset='.7'%20stop-color='%23ef953f'%20data-active='1'%20/%3e%3cstop%20offset='.9'%20stop-color='%23ee8f33'%20data-active='1'%20/%3e%3cstop%20offset='1'%20stop-color='%23ee8d30'%20data-active='1'%20/%3e%3c/radialGradient%3e%3c/defs%3e%3cg%20id='base'%20data-active='1'%3e%3cpath%20id='bone-base'%20d='M48.1,39.5s-3.2.7-6.3.5-5.2,0-6,0c-2.3-.2-6-.3-9.4-.2-3.9,0-8.3.9-11.1.9s-3.3,0-4.9-.2c-4-.3-5.9-.7-5.9-.7-1.8-.3-4.5.7-4.5-.6V2.7l5.5-.5,15.8-1.1h19.2l7.7.4v40h0v-2h-.1Z'%20data-active='1'%20style='fill:%20%23fdecc5;'%20/%3e%3cg%20id='gum-base'%20data-active='1'%3e%3cpath%20id='gum-line-2'%20d='M11.1,2.4c7.8-.2,30.3-1.1,32.8-.6,2.4.5,2,.4,3.1,0s1.2-1.2,0-1.5-3.5-.3-6.3-.2c-5.2.2-10.9.6-13.1.8-6,.5-6.6.5-12.9.5s-7.6-.5-12.4-.1c-4.9.4-.9,1.4.2,1.4,4.8,0,5.2,0,8.5-.3Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3cpath%20id='gum-line-1'%20d='M37.2,39.2c-7.7,0-30,.6-32.5,0s-2-.4-3.1,0-1.2,1.2,0,1.5c1.3.3,3.5.4,6.2.3,5.2,0,10.8-.4,13.1-.6,5.9-.4,6.5-.4,12.8-.3,4.5,0,7.5.6,12.2.3s.8-1.4-.3-1.5c-4.7-.2-5.2,0-8.4,0h0v.3Z'%20data-active='1'%20style='fill:%20%23f79f9a;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth-variants'%20data-active='1'%3e%3cpath%20id='tooth-broken-mesial-distal'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6-4.4-.4-4.3.3,0,.8,2,3.4,2,4.2s-2.3,1.8-2.3,2.6c0,1.2,2.2,1.9,2.1,3.1,0,.6-3,2.8-3,3.4,0,1,3.2,1.8,3,2.7-.2.9-3.3,1.3-3.6,2.2s4.8,1.4,4.3,2.4c-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-.2-.4,3.8-2.2,3.9-4.5s-3.2-1.7-3.1-2.8,0-2.4.7-3.9,1.4-1.9,1.4-2.7c.2-2.4-2.9-1.5-2.6-3.5s1.1-2.1,1.5-3.8.4-5,.6-5.2c1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-16-occl-0);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-mesial'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6-4.4-.4-4.3.3,0,.8,2,3.4,2,4.2s-2.3,1.8-2.3,2.6c0,1.2,2.2,1.9,2.1,3.1,0,.6-3,2.8-3,3.4,0,1,3.2,1.8,3,2.7-.2.9-3.3,1.3-3.6,2.2s4.8,1.4,4.3,2.4c-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h.1,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-16-occl-1);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-broken-distal'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5,4.2-2.7,3.9-4.5-.3-1.3-3.2-1.4-3.1-2.8,0-.9.7-3,.7-3.9s1.3-1.8,1.4-2.7c.2-1.4-2.6-2.3-2.6-3.5s1.3-3,1.5-3.8c.5-2.1-.8-3.6.6-5.2,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h-.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-16-occl-2);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='tooth-crownprep'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='tooth-crownprep-outer'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-3);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='tooth-crownprep-inner'%20d='M21,7.2c1.5,0,3.3.2,4.9.4,1.1,0,2.3.2,3.3.5.6.2,1.3.5,1.9.7,1.1.4,2.1,1,2.9,1.9.8.8,1.4,1.7,1.8,2.8.2.5.3,1,.3,1.5.2,1.2.4,2.3.3,3.5v2.6c0,1.1,0,2.3-.4,3.4-.4,1.5-.8,3.1-1.5,4.4-1,1.8-3,2.8-4.9,3.3-.7.2-1.5.3-2.3.4-1.1.2-2.2.6-3.3.9-.9.2-1.9,0-2.8,0s-1.6-.2-2.4-.3c-1.4,0-2.9-.2-4-1.1-1-.7-1.7-1.6-2.3-2.7-.7-1.1-1.2-2.3-1.5-3.6-.2-1-.2-2-.1-3,0-1.3.3-2.6.5-3.9.3-1.6.4-3.2.8-4.7.4-1.5,1.1-3,2.1-4.1,1.1-1.2,2.4-2.2,3.9-2.7.9-.3,2-.4,2.9-.3h0Z'%20data-active='1'%20style='fill:%20%23eaeaea;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='tooth'%20data-active='1'%3e%3cg%20id='tooth-base'%20data-active='1'%3e%3cpath%20id='background-cusp'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-4);%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='cusps'%20data-active='1'%3e%3cpath%20d='M25,20.8c.5.2,1.3.4,2,.6.8.3,1.6.5,2.5.7,1.4.4,3.1.7,4.6.9,1.3.2,2.3.4,3.5.6,1.1.2,2.3.3,2.7-1.2.2-.8,0-1.7,0-2.6s0-2.3-.2-3.5c-.2-1.9-.5-3.9-1-5.7-.2-.7-.5-1.5-1-2-.7-.6-1.1.3-1.5,1-.2.4-.4.8-.6,1.1-.7,1.1-1.6,2-2.6,2.8-1.4,1.1-3.1,2.2-4.8,3.3-1,.6-2,1.3-3,2-.5.3-.9.6-1.1.9-.4.4-.2.7.4.9h0v.2s.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-5);'%20/%3e%3cpath%20d='M13.6,24.2c.1.1.6.4,1,0,1.5-1.5,3.2-3.2,4.5-4.4.5-.4,1-1,1.5-1.5s.4-.4.5-.6c.2-.3.2-.6.2-1v-1.8c0-2.3.3-4.5.5-6.8,0-.5,0-.9-.2-1.5-.2-.7-.4-1.7-.6-2.4-.2-.7-.3-1-1-1h-3.4c-.6.2-1.1.3-1.7.5-.4.2-.7.3-1.1.7-.7.5-1.6,1.3-2.3,1.8-.5.4-.8.8-1.2,1.4-.3.4-.6.9-.9,1.3-.4.5-.5,1-.7,1.5-.3.9-.5,1.4-.7,2.3-.2.7.3,1,.2,1.8,0,.7,4.4,8.6,5.2,9.4l.2.2h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-6);'%20/%3e%3cpath%20d='M29.6,16.3c1.3-.8,1.9-1.3,3.2-2.2.9-.6,1.6-1.2,2.3-2.1.7-.8,1.1-1.6,1.4-2.5.3-1.2.5-2-.5-2.6-.6-.4-1.1-.7-1.8-1.1-1.1-.6-2.2-1-3.4-1.3-1.8-.5-3.6-1-5.5-1.1h-1.9c-.7,0-1.7.8-2.1.4-1.3-1.4-.6,2.4-.5,3.4,0,.7.1,1.5.1,2.2,0,1.8-.3,3.5-.4,5.3,0,.7,0,1.5.2,2.2.5,1.5,1.9,2.5,3.4,2.2,1.3-.2,2.4-.6,3.5-1.3.6-.4,1.3-1.1,1.9-1.5h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-7);'%20/%3e%3cpath%20d='M26.4,19.5c.2.1.3.3.5.5,1.4,1.6,4.6,5.3,6,6.7s0,0,0,0c1.4,1.1,4.1,3.3,5.2,4.2,0,.1,0,.8-.3,1.1s-.5.5-.9.8c-.7.6-1.4,1.2-2,1.8s-.8.8-1.3.8c-1.1.2-2.2.4-3.2.6-.9.2-1.6.2-2.3.5-.8.3-1.6.6-2.4.9-.6.2-.7-.2-1.3,0-.8,0-1.6.7-2.4.7h-1.7c-.3,0-.5-.4-.7-.7-.3-.5-.7-1.2-1-1.8s-.7-1.2-1-1.7c-.3-.6-.5-.9-.7-1.5-.4-1-.7-2.1-1.1-3.1-.5-1.1-1.2-2.4-1.8-3.7-.2-.4-.3-.7-.4-.9v-.4c0-.1,0,0,.1-.1,1.9-1.8,4.7-4.4,6.8-6.2.5-.5.9-.7,1.6-.4,1.2.6,3.1,1.4,4.4,2.1h-.1s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-8);'%20/%3e%3cpath%20d='M24.4,18.6c-.2-.2.1-.1.3,0,2.3.5,12.3,2.6,14.8,3.2.2,0,.4,0,.5.2v.7c0,1.6-.2,3.3-.7,4.9-.3,1-.5,2-.8,3-.4,1.4-.6,1.2-1.4.5-1.3-1.1-3.3-2.7-4.6-3.9-.6-.5-.8-.9-1.4-1.5-1.2-1.5-2.6-3-3.8-4.5-.5-.6-.7-.9-1.2-1.2-.5-.4-1.2-.8-1.7-1.3h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-9);'%20/%3e%3cpath%20d='M6.8,19.8c-.6,1.9-.2,3.2-.3,5.2,0,1.5,0,2.9.4,4.4.2,1,.5,2.1,1.1,3,.2.3,1.1,1.4,1.3,1.7.8,1,1.2,1.8,2.3,2.6.9.6,1.8.7,2.9,1.1.9.3,1.8.3,2.7.5.7,0,1.5.2,2.2.3.5,0,1.4.3,1.6-.3s-1-2.4-1.4-3c-.7-1.1-1.4-2.1-2-3.2-.9-1.4-1.5-2.9-2.2-4.4s-1.6-3.1-2.4-4.6c-.4-.9-1-1.8-1.5-2.5-.4-.6-.8-1.1-1.1-1.9-.6-1.5-.9-3.7-1.6-5-.4-.7-.9-.6-1,.2-.2,1.5-.5,3.4-.9,4.8l-.2,1.1h0Z'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-10);'%20/%3e%3c/g%3e%3cg%20id='fissure'%20data-active='1'%3e%3cpath%20d='M20.5,37.3c.3.7-1.1-2.1-1.7-3.1s-1.7-1.9-2.2-3c-.7-1.6-1.8-3-1.8-4.8,0-2.7-2.7-4.7-4.2-6.8-1-1.3-2.3-7.1-1.9-6'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M24.5,18.7c.4-.1,1.2,1,1.5,1.3,1,1.1,3.9,3.6,4.4,5.1.5,1.3,5,4.3,4.6,4.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M13.5,23.6c1-1.2,1.8-1.3,3-2.4,1.1-.9,2.2-1.6,3.3-2.5.6-.6,1.2-1.5,1.4-2.4s-.7-1-.5-2.2c0-.5,0-2.1.2-2.5.8-1.7,0-1.5.2-2.2,0-.3-.4-5.7-.4-5.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M36.4,21.2c1.2.3-3.8-.9-5.3-1.1-.5,0-2.1-.1-2.5-.4-.4-.2-1.7-.2-2-.5s-1.7-.6-2.1-.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20d='M35,12c1-1-2.7,2.2-5.5,4.3-.7.6-3.4,1.5-4.2,2s-.6.4-1.1.4-.9,0-1.3-.2c-.8-.2-1.5-.6-2-1.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%239f9f9f;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='surfaces'%20data-active='1'%3e%3cg%20id='caries'%20data-active='1'%3e%3cpath%20id='caries-lingual'%20d='M17.8,38c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.4s.8-.6.8-1c-.9-1.9-12-1.3-13.5-.6-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='caries-buccal'%20d='M18.6,5.8c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.5s.8-.6.8-1c-1-1.9-12-1.2-13.5-.5-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cg%20id='caries-mesial'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='mesial-shape'%20d='M38.1,28.6c3.4.2,3.4-14.6,2-16.2-.5-1.1-1.9-.3-2.8-.6-1.5-.5-1.9,3.4-2.8,5-.4,1.6-4.6,1.3-3.6,4.1s3.3,1,3.8,1.9,1.2,4.1,2.2,5.2l1.1.7h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='mesial-patch2'%20d='M37.4,21.5c-4,0,1.2,4.3,2.2,1.6.4-.9-1-1.7-1.9-1.6h-.4.1Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='mesial-patch1'%20d='M39.6,14.6c-1.7-1.3-5.7.7-2.6,1.6,2,.5,3.1-.6,2.6-1.5h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-distal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='distal-shape'%20d='M11.4,25.9c2.4-.3-.4-3.3.1-5.4.7-3.1,2.7-7.5-.8-7.2-.8.1-2.3-.3-2.8.5-2.3,3-3,10.6-.3,12.1s.6.6.7,1h0c0,.6.6,1,1.2.8s.6-.2.8-.4l1.2-1.4h0Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='distal-patch2'%20d='M10.7,18.3c1.2-.7.8-3.2-.7-3.1s-1.2,3.6.3,3.1h.4Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3cpath%20id='distal-patch1'%20d='M8.6,24.8c0,.3.6.5,1,.6.2,0,.7.2.7,0-.2-.5-1-1.5-1.4-1.8-.7-.3-.5.9-.4,1.2,0,0,.1,0,0,0h0Z'%20data-active='1'%20style='fill:%20%23fff;'%20/%3e%3c/g%3e%3cg%20id='caries-occlusal'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='occlusal-shape'%20d='M13.8,27.2c.6.9,3.7,6.3,4.6,6.4.9,0-1.6-4.6-1.5-5.7s.2-3.1.7-3.7c1-1.2,3.2-3.2,3.9-3.3,1.7-.4,6.6,3.4,8.5,3.8,3.1.6-2.3-4.4,2.1-4.2,4.4.2-.3-3.5-.8-5-.9-2-4.9,1.8-7,.6s-1.2-6.5-2.9-6.5-.8,6.4-2.6,7.7-4.6,3.4-6.1,2.4-1.2-1.6-2.3-2.7-1.3,0-1,.7l1.5,3.8,1.2,3,1.6,2.6h.1Z'%20data-active='1'%20style='fill:%20%230a1018;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='occlusal-patch2'%20d='M25.3,19c-.9,3,4.1,1.5,4.5,0,.6-.8.2-2-.6-2.3-1.5-.5-3,1-4,2.1h0v.2s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3cpath%20id='occlusal-patch1'%20d='M14,22.7c-.1,1.5,1.2,2.6,2,1.2.5-.9.5-3.1-.5-3.1s-1.4.7-1.4,1.8v.2h-.1Z'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%20.2px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='subcaries'%20data-active='1'%3e%3cpath%20id='subcaries-lingual'%20d='M17.8,38c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.4s.8-.6.8-1c-.9-1.9-12-1.3-13.5-.6-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-buccal'%20d='M18.6,5.8c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.5s.8-.6.8-1c-1-1.9-12-1.2-13.5-.5-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-mesial'%20d='M38.1,28.6c3.4.2,3.4-14.6,2-16.2-.5-1.1-1.9-.3-2.8-.6-1.5-.5-1.9,3.4-2.8,5-.4,1.6-4.6,1.3-3.6,4.1s3.3,1,3.8,1.9,1.2,4.1,2.2,5.2l1.1.7h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-distal'%20d='M11.4,25.9c2.4-.3-.4-3.3.1-5.4.7-3.1,2.7-7.5-.8-7.2-.8.1-2.3-.3-2.8.5-2.3,3-3,10.6-.3,12.1s.6.6.7,1h0c0,.6.6,1,1.2.8s.6-.2.8-.4l1.2-1.4h0Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20id='subcaries-occlusal'%20d='M13.8,27.2c.6.9,3.7,6.3,4.6,6.4.9,0-1.6-4.6-1.5-5.7s.2-3.1.7-3.7c1-1.2,3.2-3.2,3.9-3.3,1.7-.4,6.6,3.4,8.5,3.8,3.1.6-2.3-4.4,2.1-4.2,4.4.2-.3-3.5-.8-5-.9-2-4.9,1.8-7,.6s-1.2-6.5-2.9-6.5-.8,6.4-2.6,7.7-4.6,3.4-6.1,2.4-1.2-1.6-2.3-2.7-1.3,0-1,.7l1.5,3.8,1.2,3,1.6,2.6h.1Z'%20data-active='1'%20style='display:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cg%20id='fillings'%20data-active='1'%3e%3cg%20id='amalgam'%20data-active='1'%3e%3cpath%20id='filling-amalgam-occlusal'%20d='M13.8,27.2c.6.9,3.7,6.3,4.6,6.4.9,0-1.6-4.6-1.5-5.7s.2-3.1.7-3.7c1-1.2,3.2-3.2,3.9-3.3,1.7-.4,6.6,3.4,8.5,3.8,3.1.6-2.3-4.4,2.1-4.2,4.4.2-.3-3.5-.8-5-.9-2-4.9,1.8-7,.6s-1.2-6.5-2.9-6.5-.8,6.4-2.6,7.7-4.6,3.4-6.1,2.4-1.2-1.6-2.3-2.7-1.3,0-1,.7l1.5,3.8,1.2,3,1.6,2.6h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-lingual'%20d='M17.8,38c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.4s.8-.6.8-1c-.9-1.9-12-1.3-13.5-.6-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-buccal'%20d='M18.6,5.8c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.5s.8-.6.8-1c-1-1.9-12-1.2-13.5-.5-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-mesial'%20d='M38.1,28.6c3.4.2,3.4-14.6,2-16.2-.5-1.1-1.9-.3-2.8-.6-1.5-.5-1.9,3.4-2.8,5-.4,1.6-4.6,1.3-3.6,4.1s3.3,1,3.8,1.9,1.2,4.1,2.2,5.2l1.1.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-amalgam-distal'%20d='M11.4,25.9c2.4-.3-.4-3.3.1-5.4.7-3.1,2.7-7.5-.8-7.2-.8.1-2.3-.3-2.8.5-2.3,3-3,10.6-.3,12.1s.6.6.7,1h0c0,.6.6,1,1.2.8s.6-.2.8-.4l1.2-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23a0a0a0;%20stroke:%20%23c8c8c8;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='composite'%20data-active='1'%3e%3cpath%20id='filling-composite-occlusal'%20d='M13.8,27.2c.6.9,3.7,6.3,4.6,6.4.9,0-1.6-4.6-1.5-5.7s.2-3.1.7-3.7c1-1.2,3.2-3.2,3.9-3.3,1.7-.4,6.6,3.4,8.5,3.8,3.1.6-2.3-4.4,2.1-4.2,4.4.2-.3-3.5-.8-5-.9-2-4.9,1.8-7,.6s-1.2-6.5-2.9-6.5-.8,6.4-2.6,7.7-4.6,3.4-6.1,2.4-1.2-1.6-2.3-2.7-1.3,0-1,.7l1.5,3.8,1.2,3,1.6,2.6h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-lingual'%20d='M17.8,38c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.4s.8-.6.8-1c-.9-1.9-12-1.3-13.5-.6-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-buccal'%20d='M18.6,5.8c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.5s.8-.6.8-1c-1-1.9-12-1.2-13.5-.5-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-mesial'%20d='M38.1,28.6c3.4.2,3.4-14.6,2-16.2-.5-1.1-1.9-.3-2.8-.6-1.5-.5-1.9,3.4-2.8,5-.4,1.6-4.6,1.3-3.6,4.1s3.3,1,3.8,1.9,1.2,4.1,2.2,5.2l1.1.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-composite-distal'%20d='M11.4,25.9c2.4-.3-.4-3.3.1-5.4.7-3.1,2.7-7.5-.8-7.2-.8.1-2.3-.3-2.8.5-2.3,3-3,10.6-.3,12.1s.6.6.7,1h0c0,.6.6,1,1.2.8s.6-.2.8-.4l1.2-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23feffd5;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gic'%20data-active='1'%3e%3cpath%20id='filling-gic-occlusal'%20d='M13.8,27.2c.6.9,3.7,6.3,4.6,6.4.9,0-1.6-4.6-1.5-5.7s.2-3.1.7-3.7c1-1.2,3.2-3.2,3.9-3.3,1.7-.4,6.6,3.4,8.5,3.8,3.1.6-2.3-4.4,2.1-4.2,4.4.2-.3-3.5-.8-5-.9-2-4.9,1.8-7,.6s-1.2-6.5-2.9-6.5-.8,6.4-2.6,7.7-4.6,3.4-6.1,2.4-1.2-1.6-2.3-2.7-1.3,0-1,.7l1.5,3.8,1.2,3,1.6,2.6h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-lingual'%20d='M17.8,38c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.4s.8-.6.8-1c-.9-1.9-12-1.3-13.5-.6-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-buccal'%20d='M18.6,5.8c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.5s.8-.6.8-1c-1-1.9-12-1.2-13.5-.5-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-mesial'%20d='M38.1,28.6c3.4.2,3.4-14.6,2-16.2-.5-1.1-1.9-.3-2.8-.6-1.5-.5-1.9,3.4-2.8,5-.4,1.6-4.6,1.3-3.6,4.1s3.3,1,3.8,1.9,1.2,4.1,2.2,5.2l1.1.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-gic-distal'%20d='M11.4,25.9c2.4-.3-.4-3.3.1-5.4.7-3.1,2.7-7.5-.8-7.2-.8.1-2.3-.3-2.8.5-2.3,3-3,10.6-.3,12.1s.6.6.7,1h0c0,.6.6,1,1.2.8s.6-.2.8-.4l1.2-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23f9ae94;%20stroke:%20%23f99;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary'%20data-active='1'%3e%3cpath%20id='filling-temporary-occlusal'%20d='M13.8,27.2c.6.9,3.7,6.3,4.6,6.4.9,0-1.6-4.6-1.5-5.7s.2-3.1.7-3.7c1-1.2,3.2-3.2,3.9-3.3,1.7-.4,6.6,3.4,8.5,3.8,3.1.6-2.3-4.4,2.1-4.2,4.4.2-.3-3.5-.8-5-.9-2-4.9,1.8-7,.6s-1.2-6.5-2.9-6.5-.8,6.4-2.6,7.7-4.6,3.4-6.1,2.4-1.2-1.6-2.3-2.7-1.3,0-1,.7l1.5,3.8,1.2,3,1.6,2.6h.1Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-lingual'%20d='M17.8,38c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.4s.8-.6.8-1c-.9-1.9-12-1.3-13.5-.6-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-buccal'%20d='M18.6,5.8c1.1.5,3,.7,4.6.7,2.5,0,4.6-.5,5.7-1.5s.8-.6.8-1c-1-1.9-12-1.2-13.5-.5-.8.6,1.4,1.7,2.4,2.2h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-mesial'%20d='M38.1,28.6c3.4.2,3.4-14.6,2-16.2-.5-1.1-1.9-.3-2.8-.6-1.5-.5-1.9,3.4-2.8,5-.4,1.6-4.6,1.3-3.6,4.1s3.3,1,3.8,1.9,1.2,4.1,2.2,5.2l1.1.7h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='filling-temporary-distal'%20d='M11.4,25.9c2.4-.3-.4-3.3.1-5.4.7-3.1,2.7-7.5-.8-7.2-.8.1-2.3-.3-2.8.5-2.3,3-3,10.6-.3,12.1s.6.6.7,1h0c0,.6.6,1,1.2.8s.6-.2.8-.4l1.2-1.4h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23eee;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='defect'%20data-active='1'%3e%3cpolygon%20id='defect-occlusal'%20points='18.5%2016.5%2020%2016%2019.1%2017.3%2016.7%2019.1%2015.3%2019.6%2016.2%2018.4%2018.5%2016.5'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-lingual'%20points='23.3%2038.3%2024.1%2038.9%2023.2%2039.4%2021.5%2039.3%2020.7%2038.7%2021.6%2038.1%2023.3%2038.3'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-buccal'%20points='21.7%203.4%2020.9%202.9%2021.7%202.3%2023.5%202.3%2024.3%202.9%2023.5%203.4%2021.7%203.4'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-distal'%20points='6.8%2020.6%206.1%2021.9%205.7%2020.5%206.1%2017.6%206.9%2016.3%207.2%2017.8%206.8%2020.6'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3cpolygon%20id='defect-mesial'%20points='41.5%2021.6%2040.9%2023%2040.4%2021.6%2040.4%2018.7%2040.9%2017.3%2041.5%2018.7%2041.5%2021.6'%20style='display:%20none;%20fill:%20%23f5ff15;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='contact-point'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='mesial-no-contact-point'%20data-active='1'%3e%3cpath%20d='M39.3,15.5c.9,3,2.1,6.3,3.4,9.4'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M39.1,25.4c.8-1.8,1-3,1.6-4.5.7-1.7,1.3-3.4,1.9-5.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='distal-no-contact-point'%20data-active='1'%3e%3cpath%20d='M4.2,16.4c.9,3.1,2.2,6.4,3.4,9.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20d='M4,26.2c.9-1.8,1-2.9,1.7-4.3s1.4-3.3,1.9-5.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23aaa;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='fissure-sealing'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='fissure-sealing-occlusal'%20data-active='1'%3e%3cpath%20d='M20.5,37.3c.3.7-1.1-2.1-1.7-3.1s-1.7-1.9-2.2-3c-.7-1.6-1.8-3-1.8-4.8,0-2.7-2.7-4.7-4.2-6.8-1-1.3-2.3-7.1-1.9-6'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M24.5,18.7c.4-.1,1.2,1,1.5,1.3,1,1.1,3.9,3.6,4.4,5.1.5,1.3,5,4.3,4.6,4.1'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M13.5,23.6c1-1.2,1.8-1.3,3-2.4,1.1-.9,2.2-1.6,3.3-2.5.6-.6,1.2-1.5,1.4-2.4s-.7-1-.5-2.2c0-.5,0-2.1.2-2.5.8-1.7,0-1.5.2-2.2,0-.3-.4-5.7-.4-5.2'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M36.4,21.2c1.2.3-3.8-.9-5.3-1.1-.5,0-2.1-.1-2.5-.4-.4-.2-1.7-.2-2-.5s-1.7-.6-2.1-.5'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M35,12c1-1-2.7,2.2-5.5,4.3-.7.6-3.4,1.5-4.2,2s-.6.4-1.1.4-.9,0-1.3-.2c-.8-.2-1.5-.6-2-1.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%233fb6ff;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='restorations'%20data-active='1'%3e%3cg%20id='implant'%20data-active='1'%20style='display:%20none;'%3e%3cg%20id='implant-base'%20data-active='1'%3e%3cpath%20d='M24.8,35.1h-2.8l-.7-2.2c-.8-.2-1.5-.3-2.3-.7l-1.8,1.6-2.4-1.4.6-2.3c-.6-.5-1.2-1.1-1.7-1.7l-2.3.6-1.4-2.4,1.6-1.8c-.3-.8-.5-1.5-.7-2.3l-2.2-.7v-2.8l2.2-.7c.2-.8.4-1.5.7-2.3l-1.6-1.8,1.4-2.4,2.3.6c.5-.6,1-1.1,1.7-1.7l-.6-2.4,2.4-1.4,1.7,1.6c.8-.3,1.5-.5,2.3-.6l.7-2.2h2.8l.6,2.2c.8.2,1.5.3,2.3.6l1.8-1.6,2.4,1.4-.6,2.3c.6.5,1.1,1,1.7,1.7l2.3-.6,1.4,2.4-1.6,1.7c.3.8.5,1.5.7,2.3l2.2.7v2.8l-2.2.7c-.2.8-.4,1.6-.7,2.3l1.6,1.8-1.4,2.4-2.3-.6c-.5.6-1,1.1-1.7,1.6l.6,2.4-2.4,1.4-1.8-1.6c-.8.3-1.5.5-2.3.6l-.6,2.2v.3s.1,0,.1,0Z'%20data-active='1'%20style='fill:%20%23145d2a;'%20/%3e%3cpath%20d='M25.3,32.4h-.2l-.6,2.1h-2.1l-.6-2s0-.2-.2-.2c-.9,0-1.8-.4-2.6-.7l-1.7,1.6-1.8-1,.5-2.3c-.8-.6-1.4-1.3-2-2l-2.3.6-1-1.8,1.6-1.7c-.4-.9-.6-1.8-.8-2.8l-2.1-.7v-2.1l2-.6c.2,0,.2-.1.2-.3.1-.9.4-1.7.7-2.6l-1.6-1.7,1-1.8,2.3.6c.6-.7,1.3-1.4,2-2l-.6-2.3,1.8-1,1.6,1.5s.2.1.3,0c.9-.3,1.7-.5,2.7-.7l.7-2.2h2.1l.6,2c0,.1,0,.2.2.2.9.1,1.8.4,2.6.7l1.7-1.6,1.8,1.1-.6,2.3c.8.6,1.4,1.3,2,2l2.3-.6,1,1.8-1.6,1.7c.4.9.6,1.8.8,2.8l2.1.7v2.1l-2,.6s0,.1-.2.2c0,.9-.4,1.7-.7,2.5s0,.2,0,.2l1.5,1.6-1,1.8-2.3-.6c-.6.7-1.3,1.4-2,2l.6,2.3-1.8,1-1.7-1.6c-.9.3-1.7.6-2.6.7h0s0,.2,0,.2Z'%20data-active='1'%20style='fill:%20%23c8c8c8;'%20/%3e%3ccircle%20cx='23.5'%20cy='20.4'%20r='9.4'%20data-active='1'%20style='fill:%20%23eaeaea;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3ccircle%20cx='23.5'%20cy='20.4'%20r='5.8'%20data-active='1'%20style='fill:%20%23fff;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cpath%20id='implant-bar'%20d='M.8,15.7c-3.4,7.4-1,15.6,2.9,15.1,8.2.8,27.3,0,36.3,0s6.5-2.3,7.5-8.5c.6-3.7,0-7.1-1.4-9.3-2.6-3.4-6.5-2.8-9.6-3.1-5.2,0-9.5,0-14.3.6-5.3.6-10.4,0-15.5.8-2.1,0-4.5,1.1-6,4h0v.6-.2s.1,0,0,0h0Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23linear-gradient-16-occl-11);'%20/%3e%3ccircle%20id='implant-healing-abutment'%20cx='23.4'%20cy='20.5'%20r='11.4'%20data-active='1'%20style='display:%20none;%20fill:%20%23475563;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3ccircle%20id='implant-locator-screw'%20cx='23.5'%20cy='20.4'%20r='8.2'%20data-active='1'%20style='fill:%20url(%23linear-gradient-16-occl-12);%20isolation:%20isolate;%20opacity:%20.8;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3c/g%3e%3cg%20id='prosthesis-implant'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='prosthesis-implant-gum'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='prosthesis-implant-crown'%20d='M20.3,5.7c1.8,0,3.8.3,5.7.4,1.3,0,2.6.2,3.8.6.8.3,1.4.5,2.2.8,1.2.5,2.4,1.2,3.3,2.2.9.9,1.7,2,2,3.3.2.5.3,1.1.4,1.7.3,1.4.4,2.7.4,4.1s0,2-.2,3.1c0,1.4-.2,2.6-.4,3.9-.4,1.7-.8,3.6-1.7,5.1-1.2,2-3.5,3.2-5.7,3.7-.8.2-1.8.3-2.6.5-1.3.3-2.5.7-3.8,1-1.1.3-2.2.2-3.2,0-.9,0-1.9-.3-2.8-.3-1.6-.2-3.3-.3-4.7-1.2-1.1-.8-1.9-1.9-2.6-3.1-.8-1.3-1.4-2.7-1.7-4.2-.3-1.1-.2-2.3-.2-3.4s.4-3,.6-4.5c.3-1.8.4-3.6.8-5.4.4-1.8,1.3-3.4,2.4-4.7,1.2-1.4,2.8-2.5,4.5-3.1,1.1-.3,2.3-.4,3.4-.4h0v-.2h.1,0Z'%20data-active='1'%20style='fill:%20%23f9ae94;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='prosthesis'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='prosthesis-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20%23f9ae94;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='prosthesis-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20%23f9ae94;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='telescope'%20data-active='1'%3e%3cpath%20id='telescope-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cg%20id='telescope-crown'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='telescope-crown-outside'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='fill:%20%230051bf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='telescope-crown-inside'%20d='M20.5,7.3c1.6,0,3.4.3,5.1.4,1.2,0,2.4.2,3.4.5.7.2,1.3.5,1.9.7,1.1.4,2.1,1.1,3,1.9.8.8,1.5,1.8,1.8,2.9.2.5.3,1,.4,1.5.2,1.3.4,2.4.4,3.7v2.7c0,1.2,0,2.4-.4,3.5-.4,1.5-.8,3.2-1.5,4.5-1.1,1.8-3.1,2.9-5.1,3.4-.8.2-1.6.3-2.3.4-1.2.2-2.3.6-3.4.9-1,.2-1.9,0-2.9,0s-1.7-.2-2.5-.3c-1.4,0-2.9-.2-4.1-1.1-1-.7-1.7-1.7-2.4-2.7-.7-1.1-1.3-2.4-1.5-3.8-.2-1-.2-2,0-3.1,0-1.4.3-2.7.6-4,.3-1.6.4-3.3.8-4.8.4-1.6,1.1-3.1,2.2-4.3,1.1-1.2,2.5-2.3,4-2.7,1-.3,2-.4,3-.4h0l-.3.2s-.2,0-.2,0Z'%20data-active='1'%20style='fill:%20%23a0a0a0;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='zircon'%20data-active='1'%3e%3cpath%20id='zircon-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='zircon-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-onlay'%20d='M19.8,2.9c2.1,0,3.3,1.5,4.7,2,.9.3,3.2,2,4.1,2.4,1.4.6,7.8-.8,8.9.4,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-1.6,2.3-1.6,3.9s2.1,3.3,1.9,4.5c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-4.8,2.3-7.4,2.9-.7,0-5.6-6.7-5.3-1.9s-.4,2.4-2.1,3.8-1.9.2-2.3,0c-1.1,0-4,0-5.6-1-1.3-.9-1.1-5-1.4-6.8-.3-1.3-2.3-4-3-5.1s-3.6-5-3.4-6.8c.4-2.1.5-4.3,1-6.4.5-2.1,6.3-2.8,8.3-3.4,1.3-.3,2.5-6.3,3.8-6.3h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-inlay'%20d='M19.8,2.9c2.1,0,3.5,8.4,4.9,8.9.9.3,2.1.5,3,.9,1.4.6,8.7-6.2,9.8-5,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-5.8,0-5.8,1.7s6.3,5.5,6.1,6.7c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-11.2-13.8-13.8-13.2-.7.1,0,7.2.3,11.9s-.7,4.2-2.3,5.6-.9.6-1.3.5c-1.1,0-4,0-5.6-1-1.3-.9,0-4.9-.2-6.7-.3-1.3-1.5-5.6-2.2-6.7s-5.6-3.4-5.4-5.2c.4-2.1.5-4.3,1-6.4.5-2.1,8.6,4.6,10.6,4,1.3-.3.2-13.7,1.5-13.7h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='zircon-veneer'%20d='M26.5,3.4c1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-33.2,1.3-32.7-.8.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s4.5,0,6.7.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23feffbf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal'%20data-active='1'%3e%3cpath%20id='metal-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='metal-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%230051bf;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='metal-ceramic'%20data-active='1'%3e%3cpath%20id='metal-ceramic-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-0);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='metal-ceramic-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-1);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gold'%20data-active='1'%3e%3cpath%20id='gold-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='gold-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-onlay'%20d='M19.8,2.9c2.1,0,3.3,1.5,4.7,2,.9.3,3.2,2,4.1,2.4,1.4.6,7.8-.8,8.9.4,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-1.6,2.3-1.6,3.9s2.1,3.3,1.9,4.5c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-4.8,2.3-7.4,2.9-.7,0-5.6-6.7-5.3-1.9s-.4,2.4-2.1,3.8-1.9.2-2.3,0c-1.1,0-4,0-5.6-1-1.3-.9-1.1-5-1.4-6.8-.3-1.3-2.3-4-3-5.1s-3.6-5-3.4-6.8c.4-2.1.5-4.3,1-6.4.5-2.1,6.3-2.8,8.3-3.4,1.3-.3,2.5-6.3,3.8-6.3h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-inlay'%20d='M19.8,2.9c2.1,0,3.5,8.4,4.9,8.9.9.3,2.1.5,3,.9,1.4.6,8.7-6.2,9.8-5,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-5.8,0-5.8,1.7s6.3,5.5,6.1,6.7c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-11.2-13.8-13.8-13.2-.7.1,0,7.2.3,11.9s-.7,4.2-2.3,5.6-.9.6-1.3.5c-1.1,0-4,0-5.6-1-1.3-.9,0-4.9-.2-6.7-.3-1.3-1.5-5.6-2.2-6.7s-5.6-3.4-5.4-5.2c.4-2.1.5-4.3,1-6.4.5-2.1,8.6,4.6,10.6,4,1.3-.3.2-13.7,1.5-13.7h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gold-veneer'%20d='M26.5,3.4c1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-33.2,1.3-32.7-.8.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s4.5,0,6.7.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23ece614;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='emax'%20data-active='1'%3e%3cpath%20id='emax-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-2);%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='emax-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-3);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-onlay'%20d='M19.8,2.9c2.1,0,3.3,1.5,4.7,2,.9.3,3.2,2,4.1,2.4,1.4.6,7.8-.8,8.9.4,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-1.6,2.3-1.6,3.9s2.1,3.3,1.9,4.5c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-4.8,2.3-7.4,2.9-.7,0-5.6-6.7-5.3-1.9s-.4,2.4-2.1,3.8-1.9.2-2.3,0c-1.1,0-4,0-5.6-1-1.3-.9-1.1-5-1.4-6.8-.3-1.3-2.3-4-3-5.1s-3.6-5-3.4-6.8c.4-2.1.5-4.3,1-6.4.5-2.1,6.3-2.8,8.3-3.4,1.3-.3,2.5-6.3,3.8-6.3h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-4);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-inlay'%20d='M19.8,2.9c2.1,0,3.5,8.4,4.9,8.9.9.3,2.1.5,3,.9,1.4.6,8.7-6.2,9.8-5,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-5.8,0-5.8,1.7s6.3,5.5,6.1,6.7c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-11.2-13.8-13.8-13.2-.7.1,0,7.2.3,11.9s-.7,4.2-2.3,5.6-.9.6-1.3.5c-1.1,0-4,0-5.6-1-1.3-.9,0-4.9-.2-6.7-.3-1.3-1.5-5.6-2.2-6.7s-5.6-3.4-5.4-5.2c.4-2.1.5-4.3,1-6.4.5-2.1,8.6,4.6,10.6,4,1.3-.3.2-13.7,1.5-13.7h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-5);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='emax-veneer'%20d='M26.5,3.4c1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-33.2,1.3-32.7-.8.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s4.5,0,6.7.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20url(%23radial-gradient-16-occl-6);%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='gradia'%20data-active='1'%3e%3cpath%20id='gradia-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='gradia-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-onlay'%20d='M19.8,2.9c2.1,0,3.3,1.5,4.7,2,.9.3,3.2,2,4.1,2.4,1.4.6,7.8-.8,8.9.4,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-1.6,2.3-1.6,3.9s2.1,3.3,1.9,4.5c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-4.8,2.3-7.4,2.9-.7,0-5.6-6.7-5.3-1.9s-.4,2.4-2.1,3.8-1.9.2-2.3,0c-1.1,0-4,0-5.6-1-1.3-.9-1.1-5-1.4-6.8-.3-1.3-2.3-4-3-5.1s-3.6-5-3.4-6.8c.4-2.1.5-4.3,1-6.4.5-2.1,6.3-2.8,8.3-3.4,1.3-.3,2.5-6.3,3.8-6.3h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-inlay'%20d='M19.8,2.9c2.1,0,3.5,8.4,4.9,8.9.9.3,2.1.5,3,.9,1.4.6,8.7-6.2,9.8-5,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-5.8,0-5.8,1.7s6.3,5.5,6.1,6.7c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-11.2-13.8-13.8-13.2-.7.1,0,7.2.3,11.9s-.7,4.2-2.3,5.6-.9.6-1.3.5c-1.1,0-4,0-5.6-1-1.3-.9,0-4.9-.2-6.7-.3-1.3-1.5-5.6-2.2-6.7s-5.6-3.4-5.4-5.2c.4-2.1.5-4.3,1-6.4.5-2.1,8.6,4.6,10.6,4,1.3-.3.2-13.7,1.5-13.7h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='gradia-veneer'%20d='M26.5,3.4c1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-33.2,1.3-32.7-.8.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s4.5,0,6.7.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%2355ff98;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='temporary-restorations'%20data-active='1'%3e%3cpath%20id='temporary-bridge-connector'%20d='M47.5,23.2c-2.6,8.1-12.8,3.2-18.7,3.7-7.8-.9-20.6,4.1-26.1-2.6-1.9-2.8-3.2-7.5-.7-10.3,4.8-4.3,18.2-3.9,25.3-3.7,8.1.6,23.2-.7,20.2,12.7v.4h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fffffb;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;%20stroke-width:%20.5px;'%20/%3e%3cpath%20id='temporary-crown'%20d='M19.8,2.9c2.1,0,4.5.3,6.7.5,1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.2,3.6c0,1.6-.2,3.1-.5,4.6-.5,2-1,4.2-2,6-1.4,2.4-4.1,3.8-6.7,4.4-1,.2-2.1.4-3.1.6-1.5.3-3,.8-4.5,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-1.9-.2-3.9-.3-5.5-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-2-5-.3-1.3-.2-2.7-.2-4s.5-3.5.7-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-onlay'%20d='M19.8,2.9c2.1,0,3.3,1.5,4.7,2,.9.3,3.2,2,4.1,2.4,1.4.6,7.8-.8,8.9.4,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-1.6,2.3-1.6,3.9s2.1,3.3,1.9,4.5c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-4.8,2.3-7.4,2.9-.7,0-5.6-6.7-5.3-1.9s-.4,2.4-2.1,3.8-1.9.2-2.3,0c-1.1,0-4,0-5.6-1-1.3-.9-1.1-5-1.4-6.8-.3-1.3-2.3-4-3-5.1s-3.6-5-3.4-6.8c.4-2.1.5-4.3,1-6.4.5-2.1,6.3-2.8,8.3-3.4,1.3-.3,2.5-6.3,3.8-6.3h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-inlay'%20d='M19.8,2.9c2.1,0,3.5,8.4,4.9,8.9.9.3,2.1.5,3,.9,1.4.6,8.7-6.2,9.8-5,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-5.8,0-5.8,1.7s6.3,5.5,6.1,6.7c0,1.6.2,3.1-2.6,2-6.4-1.5,0,8.2-.9,10-1.4,2.4-11.2-13.8-13.8-13.2-.7.1,0,7.2.3,11.9s-.7,4.2-2.3,5.6-.9.6-1.3.5c-1.1,0-4,0-5.6-1-1.3-.9,0-4.9-.2-6.7-.3-1.3-1.5-5.6-2.2-6.7s-5.6-3.4-5.4-5.2c.4-2.1.5-4.3,1-6.4.5-2.1,8.6,4.6,10.6,4,1.3-.3.2-13.7,1.5-13.7h0s0-.2,0-.2Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='temporary-veneer'%20d='M26.5,3.4c1.5,0,3.1.2,4.5.7.9.3,1.7.6,2.6,1,1.4.6,2.8,1.4,3.9,2.6,1.1,1.1,2,2.4,2.4,3.9.2.6.3,1.3.5,2,.3,1.7-33.2,1.3-32.7-.8.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.3-3,5.3-3.6,1.3-.3,2.7-.5,4-.5h0s4.5,0,6.7.3Z'%20data-active='1'%20style='display:%20none;%20fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3c/g%3e%3cg%20id='ortho'%20data-active='1'%3e%3cg%20id='missing-closed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M6.6,4c21.7,10.1,19.3,22.9,0,33.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cpath%20d='M39.8,36.5c-21.8-9.9-19.7-22.8-.6-33.3'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3c/g%3e%3cpath%20id='ortho-ring'%20d='M20.1,2.6c2,0,4.4.3,6.6.5,1.5,0,3.1.2,4.4.7.9.3,1.7.6,2.5,1,1.4.6,2.8,1.4,3.8,2.6,1,1.1,1.9,2.4,2.4,3.9.3.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.8s0,2.4-.3,3.6c0,1.6-.3,3.1-.5,4.6-.5,2-1,4.2-1.9,6-1.4,2.4-4.1,3.8-6.6,4.4-1,.2-2,.4-3.1.6-1.5.3-2.9.8-4.4,1.2-1.3.3-2.5.2-3.7,0-1,0-2.2-.3-3.2-.3-1.9-.2-3.8-.3-5.3-1.4-1.3-.9-2.3-2.2-3.1-3.6-1-1.5-1.7-3.2-1.9-5-.3-1.3-.3-2.7-.3-4s.5-3.5.6-5.3c.4-2.1.5-4.3,1-6.4.5-2.1,1.5-4,2.8-5.6,1.4-1.6,3.2-3,5.2-3.6,1.3-.3,2.7-.5,3.9-.5h0v-.2s-.3,0-.3,0Z'%20data-active='1'%20style='display:%20none;%20fill:%20none;%20stroke:%20%23737373;%20stroke-miterlimit:%2010;%20stroke-width:%202px;'%20/%3e%3cg%20id='ortho-bracket'%20style='display:%20none;'%20data-active='1'%3e%3cellipse%20cx='24.4'%20cy='3.4'%20rx='5.4'%20ry='1.6'%20style='fill:%20%23bfbfbf;'%20data-active='1'%20/%3e%3cpath%20d='M23.4,4.7h-2.9c-.6-.1-1.1-.6-1.1-1.2s.4-1.3,1.2-1.4h8c.7,0,1.3.6,1.3,1.3s-.5,1.3-1.3,1.3h-2.7'%20style='fill:%20none;%20stroke:%20%23737373;%20stroke-linecap:%20round;%20stroke-linejoin:%20round;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrows'%20data-active='1'%3e%3cg%20id='arrow-distal'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='4.7'%20y1='16.8'%20x2='1.2'%20y2='20.4'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='7.2'%20y1='20.6'%20x2='1.1'%20y2='20.6'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='4.7'%20y1='24.2'%20x2='1.2'%20y2='20.6'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-mesial'%20style='display:%20none;'%20data-active='1'%3e%3cline%20x1='43.3'%20y1='24.2'%20x2='47.6'%20y2='20.6'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='40.2'%20y1='20.4'%20x2='47.8'%20y2='20.4'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cline%20x1='43.3'%20y1='16.8'%20x2='47.6'%20y2='20.4'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3cg%20id='arrow-rotation'%20style='display:%20none;'%20data-active='1'%3e%3cpath%20d='M42.8,37.5c-.2,0-.8-.4-1-1.1s-.1-.9,0-1.1'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3cpath%20d='M41.3,32.8c1.2-1.3,6.2-.7,5.3,2.2-.5,3.5-8,.1-3.4-.4'%20style='fill:%20none;%20stroke:%20%232e3192;%20stroke-miterlimit:%2010;%20stroke-width:%20.8px;'%20data-active='1'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3cg%20id='plan'%20data-active='1'%3e%3cg%20id='extraction-plan'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20d='M6.5,36.8C8.2,34.3,41.4,4,42.4,2.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3cpath%20d='M7,3c3.3,2.2,24.6,25,28.9,30.6.7,1,1.5,1.9,2.5,2.7'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23b70000;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3cg%20id='crown-needed'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-needed-shape'%20d='M19.8,2.3c2.1,0,4.6.3,6.8.5,1.6,0,3.2.2,4.6.7.9.3,1.7.6,2.6,1,1.4.6,2.9,1.4,3.9,2.6,1.1,1.1,2,2.4,2.5,3.9.3.6.3,1.3.5,2,.3,1.7.5,3.2.5,4.9s0,2.4-.3,3.6c0,1.6-.3,3.1-.5,4.7-.5,2-1.1,4.2-2,6.1-1.4,2.4-4.2,3.8-6.8,4.5-1.1.2-2.1.4-3.2.6-1.6.3-3,.8-4.6,1.2-1.3.3-2.6.2-3.8,0-1.1,0-2.2-.3-3.3-.3-2-.2-3.9-.3-5.5-1.4-1.3-.9-2.4-2.2-3.2-3.6-1.1-1.5-1.7-3.2-2-5.1-.3-1.3-.3-2.7-.3-4s.5-3.5.7-5.4c.4-2.1.5-4.3,1.1-6.5.5-2.1,1.6-4,2.9-5.7,1.4-1.6,3.3-3,5.4-3.6,1.3-.3,2.8-.5,4.1-.5h0v-.2h-.3s.2,0,.2,0Z'%20data-active='1'%20style='fill:%20%23c83014;%20stroke:%20%23000;%20stroke-miterlimit:%2010;'%20/%3e%3cpath%20id='crown-needed-path'%20d='M21.2,3.1c-3.1,3.7-6.2,7.5-9.2,11.1-1.1,1.5-4.4,3.4-3,5.2,1.7,1.3,3.1-1.3,4-2.2,4.6-4.7,7.7-11,15.2-13.9.6-.2,1.1-.2,1.3,0,.2.2.2.7,0,1.2-3.1,7.4-14.9,14.6-18.1,21.6-6.9,13.4,2.3,5.6,6.8-1.3,3.8-5,9.7-13.1,15.3-17.2,3.6-1.8,2.5,2.8,1.9,4.2-2,7.1-15.1,13-15.2,20.3,1.4,6,12.3-10.4,14.8-12.7,1-1,3.9-3.5,4-1.1,0,4-3.7,8.4-6.3,11.4-.8,1.1-1.8,2.2-2,3.5,1,2.7,8.4-4.8,9.5-5.9'%20data-active='1'%20style='fill:%20%23feffbf;%20stroke:%20%231b3f1c;%20stroke-miterlimit:%2010;'%20/%3e%3c/g%3e%3cg%20id='crown-replace'%20data-active='1'%20style='display:%20none;'%3e%3cpath%20id='crown-replace-shape'%20d='M19.9,3.4c2,0,4.4.3,6.6.5,1.5,0,3,.2,4.4.7.9.3,1.6.6,2.5,1,1.4.6,2.8,1.3,3.8,2.5,1,1.1,1.9,2.3,2.4,3.8.3.6.3,1.3.5,1.9.3,1.6.5,3.1.5,4.6s0,2.3-.3,3.5c0,1.5-.3,3-.5,4.4-.5,1.9-1,4-1.9,5.8-1.4,2.3-4,3.7-6.6,4.2-1,.2-2,.4-3,.6-1.5.3-2.9.8-4.4,1.2-1.3.3-2.5.2-3.7,0-1,0-2.2-.3-3.2-.3-1.9-.2-3.8-.3-5.3-1.3-1.3-.9-2.3-2.1-3-3.5-1-1.4-1.6-3.1-1.9-4.8-.3-1.3-.3-2.6-.3-3.9s.5-3.4.6-5.1c.4-2,.5-4.1,1-6.2.5-2,1.5-3.9,2.8-5.4,1.4-1.5,3.2-2.9,5.2-3.5,1.3-.3,2.7-.5,3.9-.5h0v-.2h-.3s.2,0,.2,0Z'%20data-active='1'%20style='fill:%20none;%20stroke:%20%23c83014;%20stroke-miterlimit:%2010;%20stroke-width:%203px;'%20/%3e%3c/g%3e%3c/g%3e%3c/svg%3e", s0 = {
  11: e0,
  13: t0,
  14: a0,
  16: i0
}, n0 = {
  14: o0,
  16: l0
}, ta = /* @__PURE__ */ new Map([
  // 11 template
  [11, { tpl: 11, rot: 0, mirror: !1 }],
  [12, { tpl: 11, rot: 0, mirror: !1 }],
  [21, { tpl: 11, rot: 0, mirror: !0 }],
  [22, { tpl: 11, rot: 0, mirror: !0 }],
  [31, { tpl: 11, rot: 180, mirror: !1 }],
  [32, { tpl: 11, rot: 180, mirror: !1 }],
  [41, { tpl: 11, rot: 180, mirror: !0 }],
  [42, { tpl: 11, rot: 180, mirror: !0 }],
  // 13 template
  [13, { tpl: 13, rot: 0, mirror: !1 }],
  [23, { tpl: 13, rot: 0, mirror: !0 }],
  [33, { tpl: 13, rot: 180, mirror: !1 }],
  [43, { tpl: 13, rot: 180, mirror: !0 }],
  // 14 template
  [14, { tpl: 14, rot: 0, mirror: !1 }],
  [15, { tpl: 14, rot: 0, mirror: !1 }],
  [24, { tpl: 14, rot: 0, mirror: !0 }],
  [25, { tpl: 14, rot: 0, mirror: !0 }],
  [34, { tpl: 14, rot: 180, mirror: !1 }],
  [35, { tpl: 14, rot: 180, mirror: !1 }],
  [44, { tpl: 14, rot: 180, mirror: !0 }],
  [45, { tpl: 14, rot: 180, mirror: !0 }],
  // 16 template
  [16, { tpl: 16, rot: 0, mirror: !1 }],
  [17, { tpl: 16, rot: 0, mirror: !1 }],
  [18, { tpl: 16, rot: 0, mirror: !1 }],
  [26, { tpl: 16, rot: 0, mirror: !0 }],
  [27, { tpl: 16, rot: 0, mirror: !0 }],
  [28, { tpl: 16, rot: 0, mirror: !0 }],
  [36, { tpl: 16, rot: 180, mirror: !1 }],
  [37, { tpl: 16, rot: 180, mirror: !1 }],
  [38, { tpl: 16, rot: 180, mirror: !1 }],
  [46, { tpl: 16, rot: 180, mirror: !0 }],
  [47, { tpl: 16, rot: 180, mirror: !0 }],
  [48, { tpl: 16, rot: 180, mirror: !0 }]
]), B = [
  18,
  17,
  16,
  15,
  14,
  13,
  12,
  11,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  48,
  47,
  46,
  45,
  44,
  43,
  42,
  41,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38
], r0 = {
  fillingSurfaces: ["buccal", "lingual", "mesial", "distal", "occlusal"]
}, n2 = /* @__PURE__ */ new Set([16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48]), Ha = /* @__PURE__ */ new Set([16, 17, 26, 27, 36, 37, 46, 47]), Wa = /* @__PURE__ */ new Set([
  "tooth-broken-incisal",
  "tooth-broken-distal-incisal",
  "tooth-broken-distal",
  "tooth-broken-mesial-incisal",
  "tooth-broken-mesial"
]), c0 = /* @__PURE__ */ new Set([11, 12, 13, 14, 15, 21, 22, 23, 24, 25, 31, 32, 33, 34, 35, 41, 42, 43, 44, 45]), d0 = /* @__PURE__ */ new Set([11, 12, 16, 21, 22, 26, 31, 32, 36, 41, 42, 46]), p0 = /* @__PURE__ */ new Set([13, 14, 15, 23, 24, 25, 33, 34, 35, 43, 44, 45]), f0 = /* @__PURE__ */ new Set([17, 18, 27, 28, 37, 38, 47, 48]), h0 = /* @__PURE__ */ new Set([11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43]);
function $a(e) {
  return h0.has(e);
}
function Ja(e) {
  const t = Math.floor(e / 10);
  return t === 1 || t === 2 || t === 5 || t === 6;
}
const Ya = Et("mods");
function v2() {
  return Et("periapicalType").map((e) => ({ value: e.value, label: p(e.labelKey) }));
}
const u0 = [
  { value: "caries-mesial", labelKey: "surface.mesial" },
  { value: "caries-distal", labelKey: "surface.distal" },
  { value: "caries-buccal", labelKey: "surface.buccal" },
  { value: "caries-lingual", labelKey: "surface.lingualPalatal" },
  { value: "caries-occlusal", labelKey: "surface.occlusal" },
  { value: "caries-subcrown", labelKey: "surface.subcrown" }
], m0 = {
  buccal: "surface.buccal",
  lingual: "surface.lingualPalatal",
  mesial: "surface.mesial",
  distal: "surface.distal",
  occlusal: "surface.occlusal"
}, g0 = {
  emax: "emax",
  gold: "gold",
  gradia: "gradia",
  zircon: "zircon",
  metal: "metal",
  "metal-ceramic": "metal-ceramic",
  telescope: "telescope",
  temporary: "temporary-restorations"
}, b2 = {
  "healing-abutment": "prosthesis.type.healingAbutment",
  locator: "prosthesis.type.locator",
  "locator-denture": "prosthesis.type.locatorDenture",
  bar: "prosthesis.type.bar",
  "bar-denture": "prosthesis.type.barDenture",
  "removable-partial": "prosthesis.type.removablePartial",
  "removable-full": "prosthesis.type.removableFull"
};
function ee() {
  return {
    toothSelection: "tooth-base",
    // none | tooth-base | milktooth | implant | variants
    endoResection: !1,
    mods: /* @__PURE__ */ new Set(),
    periapicalType: "none",
    // none | granuloma | cyst | abscess (qualifies mods "inflammation")
    endo: "none",
    // none | endo-medical-filling | endo-filling | endo-glass-pin | endo-metal-pin
    caries: /* @__PURE__ */ new Set(),
    cariesActiveDepth: 2,
    // canonical ICDAS code (2 = superficial representative)
    // SP6 Task 1: the single unified per-surface caries severity (0..6). Read as
    // ICDAS on a primary-caries surface (no filling → drives `caries-{surface}`
    // opacity/`caries-deep`) and as CARS on a recurrent surface (filling present
    // → drives `subcaries-{surface}` opacity). Replaces the two SP5 fields
    // `cariesDepths` (ICDAS) + `secondaryCaries` (CARS), which are now read only
    // from the raw payload during migration (see hydrateState).
    cariesSeverity: /* @__PURE__ */ new Map(),
    // surface -> unified severity 0..6
    fillingMaterial: "none",
    // active material chosen in the dropdown (applied on surface tap)
    fillingSurfaces: /* @__PURE__ */ new Set(),
    // buccal/mesial/distal/occlusal (= keys of fillingSurfaceMaterials)
    fillingSurfaceMaterials: /* @__PURE__ */ new Map(),
    // surface -> amalgam|composite|gic|temporary
    fissureSealing: !1,
    calculus: !1,
    contactMesial: !1,
    contactDistal: !1,
    wearEdge: "none",
    // none | attrition | erosion  (incisal/occlusal)
    wearCervical: "none",
    // none | abrasion | abfraction | erosion  (cervical)
    discoloration: "none",
    // none | tetracycline | fluorosis | nonvital | extrinsic | other
    // SP14 Task 1: orthodontic axes foundation (additive; render lands in Task 2).
    orthoAppliance: "none",
    // none | bracket | band
    orthoDrift: "none",
    // none | mesial | distal
    orthoVertical: "none",
    // none | extrusion | intrusion
    orthoRotation: !1,
    brokenMesial: !1,
    brokenIncisal: !1,
    brokenDistal: !1,
    extractionWound: !1,
    extractionPlan: !1,
    parapulpalPin: !1,
    crownReplace: !1,
    crownNeeded: !1,
    missingClosed: !1,
    bridgePillar: !1,
    prosthesis: "none",
    // none | healing-abutment | locator | locator-denture | bar | bar-denture | removable-partial | removable-full
    mobility: "none",
    // none | m1 | m2 | m3
    toothSubstrate: "natural",
    // natural | radix | broken | crownprep
    restorationType: "none",
    // none | crown | inlay | onlay | veneer | bridge
    restorationMaterial: "none",
    // none | emax | gold | gradia | zircon | metal | metal-ceramic | telescope | temporary
    crownLeakage: !1,
    // marginal leakage on a crown/bridge restoration (SP3b Task 6)
    // SP4 Task 1: pulp/apical/resorption diagnosis axes. pulpLatin/apicalDx
    // are additive scaffolding — not yet rendered/wired to UI or migration;
    // see later SP4 tasks. resorptionType was wired up (render + migration;
    // replaced the retired `rootResorption` boolean) in SP4 Task 2. pulpDx
    // was wired up (render + migration; replaced the retired `pulpInflam`
    // boolean) in SP4 Task 3.
    pulpDx: "normal",
    // normal | reversible-pulpitis | irreversible-pulpitis | necrosis (replaces the legacy `pulpInflam` boolean)
    pulpLatin: "none",
    // none | pulpa-sana | hyperaemia-pulpae | pulpitis-acuta-serosa | pulpitis-acuta-purulenta | pulpitis-chronica-clausa | pulpitis-chronica-ulcerosa | pulpitis-chronica-hyperplastica | necrosis-pulpae | gangraena-pulpae
    apicalDx: "normal",
    // normal | symptomatic-apical-periodontitis | asymptomatic-apical-periodontitis | acute-apical-abscess | chronic-apical-abscess | condensing-osteitis
    resorptionType: "none",
    // none | internal | external-cervical (replaces the legacy `rootResorption` boolean)
    // SP5 Task 1: caries fields foundation. `rootCaries` is a normal enum axis.
    // `radiographicDepth` is a per-surface scalar map (independent of the visual
    // severity — the radiographic-vs-visual split). The SP5 `secondaryCaries`
    // CARS map was retired in SP6 Task 1 (folded into the unified
    // `cariesSeverity` above; still read from the raw payload on migration).
    rootCaries: "none",
    // none | active | arrested | active-cavitated
    radiographicDepth: /* @__PURE__ */ new Map(),
    // surface -> none | E1 | E2 | D1 | D2 | D3
    fillingDefect: /* @__PURE__ */ new Map(),
    // surface -> none | marginal | fracture | wear (on a filled surface)
    // SP8 Task 1 foundation, wired up (render + migration) in Task 3: implant-only
    // peri-implant disease axis. none | mucositis | peri-implantitis-mild |
    // peri-implantitis-moderate | peri-implantitis-severe.
    periImplant: "none",
    customStates: {},
    note: ""
  };
}
const n = (e, t = document) => t.querySelector(e), ae = (e, t = document) => Array.from(t.querySelectorAll(e));
function C(e, t = {}, a = []) {
  const i = document.createElement(e);
  for (const [o, s] of Object.entries(t))
    o === "class" ? i.className = s : o === "text" ? i.textContent = s : o.startsWith("on") && typeof s == "function" ? i.addEventListener(o.slice(2), s) : i.setAttribute(o, s);
  for (const o of a) i.appendChild(o);
  return i;
}
function Z(e, t) {
  e && e.setAttribute("data-active", t ? "1" : "0");
}
function y0(e) {
  const t = ae("[id]", e);
  for (const a of t) {
    const i = a.getAttribute("style");
    if (i && /display\s*:\s*none/i.test(i)) {
      a.setAttribute("data-active", "0");
      const o = i.replace(/display\s*:\s*none\s*;?/ig, "").replace(/;;+/g, ";").trim();
      o ? a.setAttribute("style", o) : a.removeAttribute("style");
    }
  }
}
function v0(e) {
  const t = ["mods", "tooth-variants", "endos", "surfaces", "restorations", "specials"];
  for (const a of t) {
    const i = e.getElementById ? e.getElementById(a) : n("#" + a, e);
    if (i)
      for (const o of ae("[id]", i))
        o.hasAttribute("data-active") || o.setAttribute("data-active", "0");
  }
  for (const a of ["tooth-base", "tooth-healthy-pulp", "tooth-inflam-pulp", "milktooth-base", "milktooth-beauty", "milktooth-healthy-pulp", "milktooth-inflam-pulp", "tooth-bruxism-wear", "tooth-bruxism-neck-wear"]) {
    const i = n("#" + a, e);
    i && !i.hasAttribute("data-active") && i.setAttribute("data-active", "0");
  }
}
function b0(e) {
  const a = (e.getAttribute("viewBox") || "0 0 32 64").trim().split(/\s+/).map(Number), i = a[0] + a[2] / 2, o = a[1] + a[3] / 2, s = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (; e.firstChild; )
    s.appendChild(e.firstChild);
  s.setAttribute("transform", `rotate(180 ${i} ${o})`), e.appendChild(s);
}
function k0(e) {
  const a = (e.getAttribute("viewBox") || "0 0 32 64").trim().split(/\s+/).map(Number), i = a[0] + a[2] / 2, o = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (; e.firstChild; )
    o.appendChild(e.firstChild);
  o.setAttribute("transform", `scale(-1 1) translate(${-2 * i} 0)`), e.appendChild(o);
}
function S(e, t) {
  return e.getElementById ? e.getElementById(t) : n("#" + t, e);
}
const E = /* @__PURE__ */ new Map(), He = /* @__PURE__ */ new Map(), pe = /* @__PURE__ */ new Map(), i2 = /* @__PURE__ */ new WeakMap(), Ht = /* @__PURE__ */ new Map(), Wt = /* @__PURE__ */ new Map();
let w = null, T = /* @__PURE__ */ new Set(), Le = !1, St = !0, zt = !0, ot = !0, $e = !0, Fe = !1, ze = "FDI", te = !1, Xe = !1, rt = !1;
function aa(e) {
  rt = !!e, w && $(E.get(w));
}
let Lt = "aae";
function ia(e) {
  Lt = e === "simple" || e === "latin" ? e : "aae", w && $(E.get(w)), me();
  for (const t of B)
    Ye(t);
}
function x0() {
  return Lt;
}
let qa = "complex";
function oa(e) {
  qa = e === "simple" ? "simple" : "complex", w && $(E.get(w));
}
function w0() {
  return qa;
}
let Xa = "complex";
function la(e) {
  Xa = e === "simple" ? "simple" : "complex", w && $(E.get(w));
}
function M0() {
  return Xa;
}
let k2 = "full";
function sa(e) {
  k2 = e === "simple" ? "simple" : "full", w && $(E.get(w)), me();
  for (const t of B)
    Ye(t);
}
let Qa = "standard";
function na(e) {
  Qa = e === "simple" || e === "full" ? e : "standard", w && $(E.get(w));
}
let x2 = "simple";
function ra(e) {
  x2 = e === "severity" ? e : "simple", w && $(E.get(w));
}
let w2 = "off";
function ca(e) {
  w2 = e === "threeLevel" || e === "detailed" ? e : "off", w && $(E.get(w));
}
let $t = !0;
function da(e) {
  $t = e !== !1, w && $(E.get(w));
}
let vt = null;
const r2 = /* @__PURE__ */ new Set();
function S0(e) {
  return r2.add(e), () => {
    r2.delete(e);
  };
}
function me() {
  for (const e of r2)
    try {
      e();
    } catch (t) {
      console.error("odontogram state-change listener failed", t);
    }
  try {
    Jt();
  } catch (e) {
    console.error("odontogram bridge overlay render failed", e);
  }
}
function c2(e) {
  return E.get(e);
}
function Jt() {
  const e = n("#toothGrid");
  Qo({ grid: e, getState: c2, materialColor: y2 });
}
let bt = null, Ke = null;
function z0() {
  if (typeof ResizeObserver > "u") return;
  const e = n("#toothGrid");
  e && (ei(), bt = new ResizeObserver(() => {
    Ke && clearTimeout(Ke), Ke = setTimeout(() => {
      Ke = null;
      try {
        Jt();
      } catch (t) {
        console.error("odontogram bridge overlay resize render failed", t);
      }
    }, 100);
  }), bt.observe(e));
}
function ei() {
  bt && (bt.disconnect(), bt = null), Ke && (clearTimeout(Ke), Ke = null);
}
let Zt = [];
const d2 = /* @__PURE__ */ new Map(), pa = () => window.matchMedia("(pointer: coarse)").matches;
let fa = 0, ha = 0, ua = 0, Rt = !1, be = null;
const ma = 500, ga = 10;
let ti = 0, at = 1, It = !1, jt = "both", de = null;
function ya(e, t, a) {
  e.innerHTML = "";
  for (const i of t) {
    const o = `chk-${i.value}`, s = `lbl-${i.value}`, c = i.labelKey ? p(i.labelKey) : i.label, v = C("label", {}, [
      C("input", { type: "checkbox", id: o, value: i.value }),
      C("span", { id: s, text: c })
    ]), f = v.querySelector("input");
    f.addEventListener("change", (u) => a(i.value, u.target.checked)), e.id === "cariesChecks" && i.value === "caries-subcrown" && ce(f, !0), e.appendChild(v);
  }
}
function va(e, t, a) {
  e.innerHTML = "";
  const i = C("div", { class: "surface-cross" });
  for (const o of t) {
    const s = `chk-${o.value}`, c = `lbl-${o.value}`, v = o.labelKey ? p(o.labelKey) : o.label, f = C("label", { class: `surface-cell pos-${o.pos}` }, [
      C("input", { type: "checkbox", id: s, value: o.value }),
      C("span", { class: "surf-letter", text: o.letter }),
      C("span", { id: c, class: "surf-name", text: v })
    ]);
    f.querySelector("input").addEventListener("change", (m) => a(o.value, m.target.checked)), i.appendChild(f);
  }
  e.appendChild(i);
}
function X(e, t, a) {
  e.innerHTML = "";
  for (const i of t) {
    const o = C("option", { value: i.value, text: i.label });
    i.title && (o.title = i.title), e.appendChild(o);
  }
  e.addEventListener("change", (i) => a(i.target.value));
}
async function Z0(e) {
  if (!e) return;
  const t = e.dataset.iconSrc;
  if (t)
    try {
      const a = await fetch(t);
      if (!a.ok) return;
      const i = await a.text(), c = new DOMParser().parseFromString(i, "image/svg+xml").documentElement;
      c.removeAttribute("width"), c.removeAttribute("height"), c.classList.add("icon-svg"), e.innerHTML = "", e.appendChild(c);
    } catch {
    }
}
function ai(e) {
  if (!e || !e.dataset.xline) return;
  const t = e.getAttribute("aria-pressed") === "true", a = e.querySelector("#x-line");
  a && (a.style.display = t ? "none" : "");
}
function I0(e) {
  ul(e);
}
function D0(e) {
  if (!e) return null;
  const t = e.closest ? e.closest("label") : null;
  return t || (e.id ? document.querySelector(`label[for="${e.id}"]`) : null);
}
function C0(e) {
  const t = D0(e);
  t && (t.style.display = e.disabled ? "none" : "");
}
function ce(e, t) {
  e && (e.disabled = !!t, C0(e));
}
function ct(e, t) {
  e && (e.setAttribute("aria-pressed", t ? "true" : "false"), ai(e));
}
function E0(e, t) {
  return p(t ? "actions.expand" : "actions.collapse", { label: p(e) });
}
function Pe(e, t, a) {
  if (!e) return;
  const i = E0(t, a);
  e.setAttribute("title", i), e.setAttribute("aria-label", i);
}
const L0 = {
  btnToggleStatusCard: "status.title",
  btnToggleCariesCard: "caries.title",
  btnToggleFillingCard: "filling.title",
  btnToggleRootPeriodontiumCard: "card.rootPeriodontium"
};
function ii(e) {
  const a = e.target?.closest?.(".icon-btn");
  if (!a) return;
  const i = a.querySelector(".toggle-icon");
  if (a.id === "btnToggleControlsCard") {
    const v = document.querySelector("#controlsActions");
    if (!v) return;
    const f = v.classList.toggle("hidden");
    Pe(a, "panel.controls", f), i && (i.textContent = f ? "+" : "−");
    return;
  }
  const o = L0[a.id];
  if (!o) return;
  const s = a.closest(".card");
  if (!s) return;
  const c = s.classList.toggle("collapsed");
  Pe(a, o, c), i && (i.textContent = c ? "+" : "−");
}
function oi(e) {
  const t = e.target?.closest?.("button");
  if (t)
    switch (t.id) {
      case "btnWisdomVisible":
        Li(!St);
        break;
      case "btnOcclView":
        A2(!ot);
        break;
      case "btnBoneVisible":
        Pi(!zt);
        break;
      case "btnPulpVisible":
        T2(!$e);
        break;
      case "btnEdentulous":
        Me(!Le);
        break;
    }
}
function le(e) {
  return e !== "none" && e !== "implant";
}
function P0(e, t) {
  if (!e) return;
  const a = e.querySelector('input[value="inflammation"]');
  if (!a) return;
  const i = a.closest("label") || a.parentElement, o = t === "implant" || le(t) && !Je(t);
  i && i.classList.toggle("hidden", o);
}
function A0(e, t, a) {
  const i = a === "implant";
  if (e && e.classList.toggle("hidden", !i), !!t)
    for (const o of ["parodontal", "inflammation"]) {
      const s = t.querySelector(`input[value="${o}"]`), c = s ? s.closest("label") || s.parentElement : null;
      c && c.classList.toggle("hidden", i);
    }
}
function Dt(e) {
  return e === "tooth-under-gum";
}
function Je(e) {
  return e === "no-tooth-after-extraction";
}
function M2(e) {
  const t = E.get(e);
  if (!t || t.toothSelection !== "milktooth") return e;
  const a = Math.floor(e / 10), i = e % 10;
  return (a === 1 ? 5 : a === 2 ? 6 : a === 3 ? 7 : 8) * 10 + i;
}
function ge(e) {
  if (!pe.get(e)) return;
  const a = We(M2(e), ze), i = Ht.get(e);
  i && (i.textContent = a);
  const o = Wt.get(e);
  o && (o.textContent = a), Ct(e);
}
function T0() {
  for (const e of B)
    ge(e);
}
function K(e, t, a) {
  if (e) {
    e.innerHTML = "";
    for (const i of t) {
      const o = C("option", { value: i.value, text: i.label });
      i.title && (o.title = i.title), e.appendChild(o);
    }
    t.some((i) => i.value === a) ? e.value = a : e.value = t[0]?.value ?? "";
  }
}
function O0(e) {
  return Et("endo", { isMilktooth: !!e }).map((t) => ({ value: t.value, label: p(t.labelKey) }));
}
function S2(e) {
  return e ? [
    { value: "none", label: p("filling.option.none") },
    { value: "composite", label: p("filling.option.composite") },
    { value: "gic", label: p("filling.option.gic") },
    { value: "temporary", label: p("filling.option.temporary") }
  ] : [
    { value: "none", label: p("filling.option.none") },
    { value: "amalgam", label: p("filling.option.amalgam") },
    { value: "composite", label: p("filling.option.composite") },
    { value: "gic", label: p("filling.option.gic") },
    { value: "temporary", label: p("filling.option.temporary") }
  ];
}
const N0 = /* @__PURE__ */ new Set([14, 15, 24, 25, 34, 35, 44, 45, 16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48]);
function li(e) {
  return typeof e == "number" && N0.has(e) ? "occlusal" : "front";
}
function z2() {
  return [
    { value: "natural", label: p("substrate.natural") },
    { value: "radix", label: p("substrate.radix") },
    { value: "broken", label: p("substrate.broken") },
    { value: "crownprep", label: p("substrate.crownprep") }
  ];
}
function Z2(e, t = {}) {
  return To(e, { isImplant: !!t.isImplant, toothSelection: t.toothSelection }).map((a) => a.prosthesis ? {
    value: `prosthesis|${a.prosthesis}`,
    label: `${p(a.prefixKey ?? "restoration.prefix.removable")}: ${p(b2[a.prosthesis] ?? a.prosthesis)}`
  } : {
    value: `${a.restorationType}|${a.restorationMaterial}`,
    label: a.restorationType === "none" ? p(a.labelKey) : `${p(a.prefixKey ?? "restoration.prefix.fixed")}: ${p(a.typeLabelKey ?? "")} – ${p(a.materialLabelKey ?? "")}`
  });
}
function I2(e) {
  const t = e?.toothSelection === "milktooth", a = Dt(e?.toothSelection), i = Je(e?.toothSelection) || e?.toothSelection === "none" && e?.extractionWound;
  return t || a || i || e?.toothSubstrate === "radix";
}
function R0(e, t) {
  if (t.startsWith("prosthesis|"))
    e.prosthesis = t.slice(11), e.restorationType = "none", e.restorationMaterial = "none", e.bridgePillar = !1, e.crownReplace = !1;
  else {
    const [a, i] = t.split("|");
    e.restorationType = a || "none", e.restorationMaterial = i || "none", e.prosthesis = "none", e.restorationType === "none" ? (e.bridgePillar = !1, e.crownReplace = !1) : e.crownNeeded = !1;
  }
  e.restorationType !== "crown" && e.restorationType !== "bridge" && (e.crownLeakage = !1);
}
function si(e, t) {
  const a = `restoration.material.${t === "metal-ceramic" ? "metalCeramic" : t}`;
  return `${p(`restoration.type.${e}`)} – ${p(a)}`;
}
function G0(e) {
  if (x0() === "latin") {
    if (e.pulpLatin && e.pulpLatin !== "none")
      return p("pulpLatin." + se(e.pulpLatin));
    if (e.pulpDx && e.pulpDx !== "normal") {
      const t = mi[e.pulpDx];
      if (t) return p("pulpLatin." + se(t));
    }
  }
  return e.pulpDx && e.pulpDx !== "normal" ? p("pulpDx." + se(e.pulpDx)) : null;
}
function U0(e) {
  if (!e.apicalDx || e.apicalDx === "normal") return null;
  let t = p("apicalDx." + se(e.apicalDx));
  return e.periapicalType && e.periapicalType !== "none" && (t += " (" + p("periapical.type." + se(e.periapicalType)) + ")"), t;
}
function j0(e) {
  return !e.resorptionType || e.resorptionType === "none" ? null : p("resorption.type." + se(e.resorptionType));
}
function ni(e) {
  return e.toothSelection !== "implant" || !e.periImplant || e.periImplant === "none" ? null : p("periImplant." + se(e.periImplant));
}
function ri(e) {
  return [
    G0(e),
    U0(e),
    j0(e)
  ].filter((t) => !!t);
}
function ci(e) {
  if (!e.caries || e.caries.size === 0 || !e.cariesSeverity) return null;
  let t = 0;
  for (const i of e.caries) {
    const o = String(i).replace(/^caries-/, ""), s = e.cariesSeverity.get(o);
    typeof s == "number" && s > t && (t = s);
  }
  if (t <= 0) return null;
  const a = t <= 2 ? "superficial" : t <= 4 ? "moderate" : "deep";
  return p("summary.severity." + a);
}
function F0(e) {
  return e.brokenMesial || e.brokenIncisal || e.brokenDistal ? p("summary.fracture") : null;
}
function K0(e) {
  const t = !!e.brokenMesial, a = !!e.brokenIncisal, i = !!e.brokenDistal;
  return t && i && a ? "tooth-broken-mesial-distal-incisal" : t && i ? "tooth-broken-mesial-distal" : i && a ? "tooth-broken-distal-incisal" : t && a ? "tooth-broken-mesial-incisal" : i ? "tooth-broken-distal" : t ? "tooth-broken-mesial" : a ? "tooth-broken-incisal" : null;
}
function di() {
  return Et("toothSelection").map((e) => ({ value: e.value, label: p(e.labelKey) }));
}
function pi() {
  return !Gt || !Array.isArray(Gt.options) ? [] : Gt.options.map((e) => ({
    ...e,
    label: p(e.labelKey)
  }));
}
function ba() {
  return Gt?.arches || null;
}
function D2() {
  return Et("mobility").map((e) => ({ value: e.value, label: p(e.labelKey) }));
}
function B0(e) {
  const t = e?.toothSelection === "implant", a = Dt(e?.toothSelection), i = Je(e?.toothSelection) || e?.toothSelection === "none" && e?.extractionWound;
  return t || a || i;
}
function _0(e) {
  const t = e?.toothSelection === "implant", a = Je(e?.toothSelection) || e?.toothSelection === "none" && e?.extractionWound;
  return e?.toothSelection === "none" || a || t;
}
const ka = /* @__PURE__ */ new Set([1, 2, 3, 4, 5, 6]);
function fi(e) {
  return e <= 2 ? 1 : e <= 4 ? 2 : 3;
}
function V0(e) {
  return e === "deep" ? 6 : e === "dentin" ? 4 : 2;
}
function hi(e) {
  const t = fi(e);
  return t === 3 ? "deep" : t === 2 ? "dentin" : "surface";
}
function Yt() {
  return rt ? [1, 2, 3, 4, 5, 6].map((e) => ({ value: e, label: `${e} — ${p(`icdas.code.${e}`)}`, title: p(`icdas.desc.${e}`) })) : [
    { value: 2, label: p("caries.depth.surface") },
    { value: 4, label: p("caries.depth.dentin") },
    { value: 6, label: p("caries.depth.deep") }
  ];
}
const H0 = {
  0: "caries.cars.0",
  1: "caries.cars.1",
  2: "caries.cars.2",
  3: "caries.cars.3",
  4: "caries.cars.4",
  5: "caries.cars.5",
  6: "caries.cars.6"
};
function W0(e = Qa) {
  return (e === "simple" ? [0, 3] : e === "full" ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 3, 6]).map((a) => ({ value: a, label: p(H0[a]) }));
}
function ui(e = x2) {
  return e === "severity" ? Array.from(_i).map((t) => ({ value: t, label: p("rootCaries." + se(t)) })) : [
    { value: "none", label: p("rootCaries.none") },
    { value: "active-cavitated", label: p("rootCaries.present") }
  ];
}
function $0(e, t) {
  return e === "simple" ? t && t !== "none" ? "active-cavitated" : "none" : t || "none";
}
function J0(e = w2) {
  return e === "off" ? [] : e === "threeLevel" ? [
    { value: "none", label: p("radiographicDepth.none") },
    { value: "E1", label: p("radiographicDepth.superficial") },
    { value: "D1", label: p("radiographicDepth.middle") },
    { value: "D3", label: p("radiographicDepth.deep") }
  ] : ["none", "E1", "E2", "D1", "D2", "D3"].map((t) => ({ value: t, label: p("radiographicDepth." + t) }));
}
function Y0(e, t, a) {
  if (!e.fillingSurfaceMaterials.has(t)) return;
  const i = `caries-${t}`;
  a > 0 ? (e.caries.add(i), e.cariesSeverity.set(t, a)) : (e.caries.delete(i), e.cariesSeverity.delete(t));
}
function q0(e, t, a) {
  a && a !== "none" ? e.set(t, a) : e.delete(t);
}
function X0(e, t, a) {
  a && a !== "none" ? e.set(t, a) : e.delete(t);
}
function se(e) {
  return String(e).replace(/-([a-z])/g, (t, a) => a.toUpperCase());
}
const Q0 = {
  none: "normal",
  "pulpa-sana": "normal",
  "hyperaemia-pulpae": "reversible-pulpitis",
  "pulpitis-acuta-serosa": "irreversible-pulpitis",
  "pulpitis-acuta-purulenta": "irreversible-pulpitis",
  "pulpitis-chronica-clausa": "irreversible-pulpitis",
  "pulpitis-chronica-ulcerosa": "irreversible-pulpitis",
  "pulpitis-chronica-hyperplastica": "irreversible-pulpitis",
  "necrosis-pulpae": "necrosis",
  "gangraena-pulpae": "necrosis"
}, mi = {
  normal: "pulpa-sana",
  "reversible-pulpitis": "hyperaemia-pulpae",
  "irreversible-pulpitis": "pulpitis-acuta-serosa",
  necrosis: "necrosis-pulpae"
};
function el(e) {
  return e === "latin" && ja("pulpLatin", { latinPulpDetail: !0 }) ? Array.from(Oi).filter((t) => t !== "none").map((t) => ({ value: t, labelKey: "pulpLatin." + se(t) })) : e === "simple" ? [
    { value: "normal", labelKey: "pulpDx.normal" },
    { value: "irreversible-pulpitis", labelKey: "pulpDx.irreversiblePulpitis" }
  ] : Array.from(Ti).map((t) => ({ value: t, labelKey: "pulpDx." + se(t) }));
}
function tl(e) {
  return e.apicalDx === "symptomatic-apical-periodontitis" || e.apicalDx === "asymptomatic-apical-periodontitis";
}
function al(e, t) {
  return e === "latin" ? { pulpLatin: t, pulpDx: Q0[t] ?? "normal" } : { pulpDx: t, pulpLatin: "none" };
}
function il(e, t) {
  const a = t.pulpDx ?? "normal", i = t.pulpLatin ?? "none";
  return e === "simple" ? a === "normal" ? "normal" : "irreversible-pulpitis" : e === "latin" ? i !== "none" ? i : mi[a] ?? "pulpa-sana" : a;
}
function ol() {
  return el(Lt).map((e) => ({ value: e.value, label: p(e.labelKey) }));
}
function ll(e) {
  return e !== "none" && Ai.has(e);
}
function sl(e) {
  return e.endo && e.endo !== "none" ? e.endo : il(Lt, e);
}
function gi(e, t, a) {
  if (!e) return;
  e.innerHTML = "";
  const i = (o, s) => {
    const c = document.createElement("optgroup");
    c.label = p(o);
    for (const v of s) {
      const f = document.createElement("option");
      f.value = v.value, f.textContent = v.label, c.appendChild(f);
    }
    e.appendChild(c);
  };
  i("pulpEndo.groupVital", ol()), i("pulpEndo.groupTreated", O0(t).filter((o) => o.value !== "none")), e.value = a;
}
function nl(e, t) {
  if (ll(t))
    e.endo = t, e.pulpDx = "normal", e.pulpLatin = "none";
  else {
    e.endo = "none";
    const a = al(Lt, t);
    e.pulpDx = a.pulpDx, e.pulpLatin = a.pulpLatin;
  }
}
function C2() {
  return Array.from(Ni).map((e) => ({ value: e, label: p("apicalDx." + se(e)) }));
}
function E2() {
  return Array.from(Ri).map((e) => ({ value: e, label: p("resorption.type." + se(e)) }));
}
function yi() {
  return Array.from(Gi).map((e) => ({ value: e, label: p("wearType." + e) }));
}
function vi() {
  return Array.from(Ui).map((e) => ({ value: e, label: p("wearType." + e) }));
}
function bi() {
  return Array.from(ji).map((e) => ({ value: e, label: p("discoloration." + e) }));
}
function ki() {
  return Array.from(Fi).map((e) => ({ value: e, label: p("ortho.appliance." + e) }));
}
function xi() {
  return Array.from(Ki).map((e) => ({ value: e, label: p("ortho.drift." + e) }));
}
function wi() {
  return Array.from(Bi).map((e) => ({ value: e, label: p("ortho.vertical." + e) }));
}
function L2(e) {
  return e?.toothSelection === "tooth-base" && e?.restorationType === "none" && e?.toothSubstrate === "natural";
}
const rl = {
  tetracycline: "#9c8f7a",
  fluorosis: "#d9c9a3",
  nonvital: "#a89a8a",
  extrinsic: "#c2a86a",
  other: "#b5a894"
};
function qt(e) {
  return (e?.toothSelection === "tooth-base" || e?.toothSelection === "milktooth") && e?.restorationType === "none" && e?.toothSubstrate === "natural";
}
function Xt(e) {
  return e?.toothSelection === "tooth-base" || e?.toothSelection === "milktooth";
}
function Mi() {
  return Array.from(Vi).map((e) => ({ value: e, label: p("periImplant." + se(e)) }));
}
function cl(e, t) {
  e.periImplant = t;
}
function xa(e, t) {
  for (let a = 1; a <= 8; a++)
    Z(S(e, "pulp-inflam-path-" + a), t), Z(S(e, "pulp-inflam-path-" + a + "1"), t);
}
function dl(e, t, a = E.get(e)) {
  if (!a || !t) return;
  const i = ["mods", "tooth-variants", "endos", "surfaces", "restorations", "tooth"];
  for (const N of i) {
    const P = S(t, N);
    P && P.hasAttribute("data-active") && P.setAttribute("data-active", "1");
  }
  for (const N of Ro()) Z(S(t, N), !1);
  const o = a.restorationType !== "none", s = a.toothSubstrate === "broken" ? K0(a) : null, c = a.toothSelection === "implant", v = a.toothSelection === "milktooth", f = Dt(a.toothSelection), u = Je(a.toothSelection) || a.toothSelection === "none" && a.extractionWound, m = a.toothSelection === "none" && (a.prosthesis === "removable-partial" || a.prosthesis === "removable-full"), b = a.toothSelection === "none", k = o || m, g = t.querySelector('[id$="-onlay"]') ? "occlusal" : "front", D = {
    setActive: Z,
    svgGetById: S,
    isToothPresent: le,
    isUnderGum: Dt,
    isExtraction: Je,
    fissureAllowedTeeth: Ha,
    brokenVariants: Wa
  };
  if (Uo(t, a, Go(a, e, D), D), a.resorptionType !== "none" && le(a.toothSelection) && Z(S(t, "endo-resorption"), !0), a.toothSelection === "tooth-base" && a.restorationType === "none" && a.toothSubstrate === "natural" && (a.wearEdge !== "none" && Z(S(t, "tooth-bruxism-wear"), !0), a.wearCervical !== "none" && Z(S(t, "tooth-bruxism-neck-wear"), !0)), a.rootCaries !== "none" && le(a.toothSelection) && g === "front") {
    const N = S(t, "caries-root");
    Z(N, !0), N && (N.style.opacity = a.rootCaries === "active" ? "0.5" : a.rootCaries === "arrested" ? "0.7" : "1");
  }
  if (c && a.periImplant !== "none") {
    Z(S(t, "parodontal"), !0);
    const N = S(t, "peri-implant-bone-loss"), P = a.periImplant === "peri-implantitis-mild" ? "0.4" : a.periImplant === "peri-implantitis-moderate" ? "0.7" : a.periImplant === "peri-implantitis-severe" ? "1" : "";
    Z(N, P !== ""), N && P !== "" && (N.style.opacity = P);
  }
  const l = a.pulpDx !== "normal", y = a.pulpDx === "reversible-pulpitis" || a.pulpLatin === "hyperaemia-pulpae", I = a.endo !== "none";
  Z(S(t, "base"), zt), Z(S(t, "implant"), c), Z(S(t, "milktooth"), v), c ? Z(S(t, "implant-base"), !0) : v ? (Z(S(t, "milktooth-base"), !0), Z(S(t, "milktooth-beauty"), !0), l ? I || (Z(S(t, "milktooth-inflam-pulp"), !0), xa(t, !y)) : $e && Z(S(t, "milktooth-healthy-pulp"), !0)) : le(a.toothSelection) && (a.toothSelection === "tooth-base" ? (Z(S(t, "tooth-base"), !0), Z(S(t, "tooth-base-beauty"), a.toothSubstrate === "natural" && a.restorationType === "none")) : Z(S(t, a.toothSelection), !0), !f && !u && (l ? I || (Z(S(t, "tooth-inflam-pulp"), !0), xa(t, !y)) : $e && Z(S(t, "tooth-healthy-pulp"), !0))), s && a.toothSelection === "tooth-base" && (Z(S(t, "tooth-base"), !1), Z(S(t, s), !0)), a.toothSubstrate === "radix" && a.toothSelection === "tooth-base" && (Z(S(t, "tooth-base"), !1), Z(S(t, "tooth-radix"), !0)), a.toothSubstrate === "crownprep" && a.toothSelection === "tooth-base" && (Z(S(t, "tooth-base"), !1), Z(S(t, "tooth-crownprep"), !0)), a.toothSelection === "none" && a.extractionWound && Z(S(t, "no-tooth-after-extraction"), !0);
  {
    const N = qt(a) && a.discoloration !== "none", P = N && rl[a.discoloration] || "", h = a.toothSelection === "milktooth" ? "milktooth-base" : "tooth-base";
    for (const F of ["tooth-base", "milktooth-base"]) {
      const L = S(t, F);
      if (!L) continue;
      L.getAttribute("data-base-fill") === null && L.setAttribute("data-base-fill", L.style.fill || "");
      const M = L.getAttribute("data-base-fill") || "";
      L.style.fill = N && F === h ? P : M;
    }
  }
  {
    const N = Xt(a), P = (h, F) => {
      const L = S(t, h);
      L && Z(L, F);
    };
    P("ortho-bracket", N && a.orthoAppliance === "bracket"), P("ortho-ring", N && a.orthoAppliance === "band"), P("arrow-mesial", N && a.orthoDrift === "mesial"), P("arrow-distal", N && a.orthoDrift === "distal"), P("arrow-up", N && a.orthoVertical === "extrusion"), P("arrow-down", N && a.orthoVertical === "intrusion"), P("arrow-rotation", N && a.orthoRotation === !0);
  }
  const O = le(a.toothSelection) ? a.apicalDx !== "normal" : a.toothSelection === "implant" ? !1 : a.mods.has("inflammation");
  if (O) {
    Z(S(t, "inflammation"), !0);
    const N = a.periapicalType === "cyst" ? "cysta" : a.periapicalType === "abscess" || a.apicalDx === "acute-apical-abscess" || a.apicalDx === "chronic-apical-abscess" ? "abscess" : "granuloma";
    Z(S(t, N), !0);
  } else c && Z(S(t, "inflammation"), !1);
  if (a.mobility !== "none" && a.toothSelection !== "none" && !u && !c && Z(S(t, "mobility"), !0), le(a.toothSelection) && !f && !u && (a.endo === "endo-medical-filling" ? Z(S(t, "endo-medical-filling"), !0) : a.endo === "endo-filling" ? Z(S(t, "endo-filling"), !0) : a.endo === "endo-glass-pin" ? (Z(S(t, "endo-filling"), !0), Z(S(t, "endo-glass-pin"), !0)) : a.endo === "endo-filling-incomplete" ? Z(S(t, "endo-filling-incomplete"), !0) : a.endo === "endo-metal-pin" && (Z(S(t, "endo-filling"), !0), Z(S(t, "endo-metal-pin"), !0))), m && (Z(S(t, "prosthesis"), !0), Z(S(t, "prosthesis-crown"), !0), Z(S(t, "prosthesis-connector"), !0)), c && (a.prosthesis === "healing-abutment" ? Z(S(t, "implant-healing-abutment"), !0) : a.restorationType === "crown" || a.restorationType === "bridge" ? Z(S(t, "implant-connector"), !0) : a.prosthesis === "locator" ? (Z(S(t, "restorations"), !0), Z(S(t, "implant"), !0), Z(S(t, "implant-connector"), !0), Z(S(t, "implant-locator-screw"), !0)) : a.prosthesis === "locator-denture" ? (Z(S(t, "restorations"), !0), Z(S(t, "implant"), !0), Z(S(t, "implant-connector"), !0), Z(S(t, "implant-locator-screw"), !0), Z(S(t, "prosthesis-implant"), !0), Z(S(t, "prosthesis-implant-crown"), !0), Z(S(t, "prosthesis-implant-gum"), !0)) : a.prosthesis === "bar" ? (Z(S(t, "restorations"), !0), Z(S(t, "implant"), !0), Z(S(t, "implant-connector"), !0), Z(S(t, "implant-locator-screw"), !0), Z(S(t, "implant-bar"), !0)) : a.prosthesis === "bar-denture" && (Z(S(t, "restorations"), !0), Z(S(t, "implant"), !0), Z(S(t, "implant-connector"), !0), Z(S(t, "implant-locator-screw"), !0), Z(S(t, "implant-bar"), !0), Z(S(t, "prosthesis-implant"), !0), Z(S(t, "prosthesis-implant-crown"), !0), Z(S(t, "prosthesis-implant-gum"), !0))), b && (Z(S(t, "restorations"), !0), a.prosthesis === "bar" ? (Z(S(t, "implant"), !0), Z(S(t, "implant-bar"), !0)) : a.prosthesis === "bar-denture" && (Z(S(t, "implant"), !0), Z(S(t, "implant-bar"), !0), Z(S(t, "prosthesis-implant"), !0), Z(S(t, "prosthesis-implant-crown"), !0), Z(S(t, "prosthesis-implant-gum"), !0))), a.restorationType !== "none" && a.restorationMaterial !== "none") {
    const N = g0[a.restorationMaterial], P = Ua(a.restorationType, a.restorationMaterial, g);
    if (N && P.length) {
      Z(S(t, "restorations"), !0), Z(S(t, N), !0);
      for (const h of P) Z(S(t, h), !0);
    }
  }
  if (!c && !f && !u && a.toothSelection !== "none") {
    for (const N of a.caries) {
      if (N === "caries-subcrown") {
        o && Z(S(t, "caries-subcrown"), !0);
        continue;
      }
      if (k || o) continue;
      const P = N.replace("caries-", ""), h = a.fillingSurfaceMaterials.has(P), F = a.cariesSeverity.get(P) ?? 2;
      if (h) {
        const L = S(t, `subcaries-${P}`);
        if (Z(L, !0), L && F > 0) {
          const M = 0.3 + (F - 1) / 5 * 0.7;
          L.style.opacity = String(Math.round(M * 100) / 100);
        }
      } else {
        const L = S(t, N);
        if (Z(L, !0), L && $t) {
          const M = fi(F);
          L.style.opacity = M === 3 ? "1" : M === 2 ? "0.7" : "0.45", L.classList.toggle("caries-deep", M === 3);
        }
      }
    }
    if (a.fillingSurfaceMaterials.size > 0 && !o)
      for (const [N, P] of a.fillingSurfaceMaterials)
        Z(S(t, `filling-${P}-${N}`), !0);
    if (a.fillingDefect && a.fillingDefect.size > 0 && !o)
      for (const [N, P] of a.fillingDefect)
        P && P !== "none" && a.fillingSurfaceMaterials.has(N) && Z(S(t, `defect-${N}`), !0);
  }
  const j = S(t, "inflammation");
  if (j) {
    !i2.has(j) && j.parentElement && i2.set(j, { parent: j.parentElement, next: j.nextSibling });
    const N = a.endoResection && le(a.toothSelection) && !f && !u, P = a.resorptionType !== "none" && le(a.toothSelection);
    if ((N || P) && O) {
      const F = S(t, "tooth"), L = F && F.parentElement || t;
      L.lastElementChild !== j && L.appendChild(j);
    } else {
      const F = i2.get(j);
      if (F && F.parent) {
        const L = F.next && F.next.parentElement === F.parent ? F.next : null;
        (j.parentElement !== F.parent || j.nextSibling !== L) && F.parent.insertBefore(j, L);
      }
    }
  }
  I0(a);
}
function ne(e) {
  const t = He.get(e);
  if (t) {
    for (const a of t)
      dl(e, a);
    Si(e), Ye(e);
  }
}
function Si(e) {
  if (Zt.length === 0) return;
  const t = He.get(e);
  if (!t) return;
  const a = E.get(e), i = yo(e);
  for (const o of t) {
    let s = d2.get(e);
    s || (s = /* @__PURE__ */ new Map(), d2.set(e, s));
    for (const c of Zt) {
      const v = s.get(c.id);
      v && v.parentElement && v.remove();
      const f = a?.customStates?.[c.id];
      let u;
      try {
        u = c.renderSvg(e, i, f);
      } catch {
        continue;
      }
      if (!u) continue;
      const m = document.createElementNS("http://www.w3.org/2000/svg", "g");
      m.setAttribute("data-plugin", c.id), m.setAttribute("data-layer", c.layer), m.innerHTML = u, pl(o, m, c.layer), s.set(c.id, m);
    }
  }
}
function pl(e, t, a) {
  const i = J2[a] ?? 6, o = e.querySelectorAll("g[data-plugin]");
  let s = !1;
  for (const c of o) {
    const v = c.getAttribute("data-layer") || "overlay";
    if ((J2[v] ?? 6) > i) {
      c.parentElement?.insertBefore(t, c), s = !0;
      break;
    }
  }
  s || (a === "base" && e.firstChild ? e.insertBefore(t, e.firstChild) : e.appendChild(t));
}
function fl(e) {
  const t = E.get(e);
  if (!t) return [];
  const a = [];
  if (t.toothSelection === "none" ? a.push(p("toothSelect.none")) : t.toothSelection === "milktooth" ? a.push(p("toothSelect.milk")) : t.toothSelection === "implant" ? a.push(p("toothSelect.implant")) : t.toothSelection === "tooth-under-gum" && a.push(p("toothSelect.underGum")), t.toothSubstrate !== "natural" && a.push(p(`substrate.${t.toothSubstrate}`)), t.restorationType !== "none" && a.push(si(t.restorationType, t.restorationMaterial)), t.prosthesis !== "none") {
    const o = b2[t.prosthesis];
    o && a.push(p(o));
  }
  if (t.endo !== "none") {
    const o = {
      "endo-medical-filling": "endo.option.medicalFilling",
      "endo-filling": "endo.option.filling",
      "endo-filling-incomplete": "endo.option.incompleteFilling",
      "endo-glass-pin": "endo.option.glassPin",
      "endo-metal-pin": "endo.option.metalPin"
    }[t.endo];
    o && a.push(p(o));
  }
  if (t.fillingMaterial !== "none") {
    const o = {
      amalgam: "filling.option.amalgam",
      composite: "filling.option.composite",
      gic: "filling.option.gic",
      temporary: "filling.option.temporary"
    }[t.fillingMaterial];
    o && a.push(p(o));
  }
  if (t.fillingDefect && t.fillingDefect.size > 0 && t.restorationType === "none")
    for (const [o, s] of t.fillingDefect)
      s && s !== "none" && t.fillingSurfaceMaterials.has(o) && a.push(`${p("fillingDefect.label")} (${Ve(o, e)}: ${p("fillingDefect." + s)})`);
  if (t.caries.size > 0) {
    const o = ci(t);
    a.push(o ? `${p("caries.title")} (${o})` : p("caries.title"));
  }
  t.rootCaries && t.rootCaries !== "none" && a.push(`${p("caries.rootLabel")} (${p("rootCaries." + se(t.rootCaries))})`);
  for (const o of ri(t)) a.push(o);
  if (t.mods.size > 0)
    for (const o of t.mods)
      o === "parodontal" ? a.push(p("mods.parodontal")) : o === "inflammation" && a.push(p("mods.periapicalInflammation"));
  t.mobility !== "none" && t.toothSelection !== "implant" && a.push(p("inflammation.mobilityLabel") + " " + p(`mobility.${t.mobility}`)), t.calculus && a.push(p("calculus.label"));
  {
    const o = ni(t);
    o && a.push(o);
  }
  t.crownLeakage && !I2(t) && (t.restorationType === "crown" || t.restorationType === "bridge") && a.push(p("crownLeakage.label")), t.endoResection && a.push(p("endo.resection")), t.fissureSealing && a.push(p("filling.fissureSealing")), t.parapulpalPin && a.push(p("endo.parapulpalPin"));
  {
    const o = F0(t);
    o && a.push(o);
  }
  t.contactMesial && a.push(p("tooth.contact.mesialMissing")), t.contactDistal && a.push(p("tooth.contact.distalMissing")), L2(t) && (t.wearEdge !== "none" && a.push(`${p("tooth.bruxism.edgeWear")}: ${p("wearType." + t.wearEdge)}`), t.wearCervical !== "none" && a.push(`${p("tooth.bruxism.neckWear")}: ${p("wearType." + t.wearCervical)}`)), qt(t) && t.discoloration !== "none" && a.push(`${p("discoloration.label")}: ${p("discoloration." + t.discoloration)}`), Xt(t) && (t.orthoAppliance !== "none" && a.push(`${p("ortho.appliance.label")}: ${p("ortho.appliance." + t.orthoAppliance)}`), t.orthoDrift !== "none" && a.push(`${p("ortho.drift.label")}: ${p("ortho.drift." + t.orthoDrift)}`), t.orthoVertical !== "none" && a.push(`${p("ortho.vertical.label")}: ${p("ortho.vertical." + t.orthoVertical)}`), t.orthoRotation === !0 && a.push(p("ortho.rotation.label"))), t.extractionPlan && a.push(p("tooth.extractionPlan")), t.crownReplace && a.push(p("tooth.crownReplace")), t.crownNeeded && a.push(p("tooth.crownNeeded")), t.bridgePillar && a.push(p("tooth.bridgePillar")), t.extractionWound && a.push(p("tooth.extractionWound")), t.missingClosed && a.push(p("tooth.missingClosed"));
  const i = Oa();
  for (const o of Zt) {
    const s = t.customStates?.[o.id];
    if (s != null) {
      const c = o.label[i] || o.label.en || o.id;
      a.push(c);
    }
  }
  return a;
}
function Ye(e) {
  const t = pe.get(e);
  if (!t) return;
  const a = fl(e), i = E.get(e), o = Xe && i?.note ? i.note : "";
  let s = a.length > 0 ? a.join(" · ") : "";
  o && (s = s ? s + `
📝 ` + o : "📝 " + o);
  for (const c of t)
    s ? c.setAttribute("title", s) : c.removeAttribute("title");
}
function Ct(e) {
  const t = E.get(e), a = Xe && !!t?.note;
  for (const i of [Ht, Wt]) {
    const o = i.get(e);
    if (!o) continue;
    let s = o.querySelector(".tooth-note-icon");
    a ? s || (s = C("span", { class: "tooth-note-icon", "aria-hidden": "true" }), s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>', o.appendChild(s)) : s && s.remove();
  }
}
function hl(e) {
  const t = [];
  le(e.toothSelection);
  const a = e.toothSelection === "none", i = e.toothSelection === "implant";
  return e.endo !== "none" && (a || i) && t.push(p("warn.endoOnMissing")), e.fillingMaterial !== "none" && a && t.push(p("warn.fillingOnMissing")), e.crownReplace && !(e.toothSelection === "tooth-base" && e.restorationType !== "none") && t.push(p("warn.crownReplaceNoCrown")), e.caries.size > 0 && a && t.push(p("warn.cariesOnMissing")), e.bridgePillar && !(e.toothSelection === "tooth-base" && e.restorationType !== "none") && t.push(p("warn.pillarNoCrown")), g2(e.restorationType, e.restorationMaterial, "occlusal") || t.push(p("warn.invalidRestorationCombo")), t;
}
function ul(e) {
  const t = n("#warnings");
  if (!t) return;
  const a = hl(e);
  t.innerHTML = "";
  for (const i of a) {
    const o = C("div", { class: "warning-item", text: "⚠ " + i });
    t.appendChild(o);
  }
}
function ml(e, t) {
  const a = e.querySelector("input[type=checkbox]"), i = e.querySelector(".surf-depth");
  if (a && i) {
    const o = String(a.value).replace("caries-", ""), s = t.cariesSeverity.get(o) || 2;
    i.setAttribute("data-depth", hi(s)), i.setAttribute("data-icdas", String(s)), i.classList.toggle("icdas", rt), i.textContent = "", rt ? i.textContent = String(s) : i.innerHTML = "<i></i><i></i><i></i>";
    const c = t.radiographicDepth?.get(o);
    w2 !== "off" && c && c !== "none" ? i.setAttribute("data-radio", c) : i.removeAttribute("data-radio");
  }
}
function gl(e, t) {
  const a = e.querySelector("input[type=checkbox]"), i = e.querySelector(".surf-depth");
  if (!a || !i) return;
  const o = String(a.value), s = !!t.fillingSurfaceMaterials?.has(o) && !!t.caries?.has(`caries-${o}`);
  if (i.classList.toggle("has-subcaries", s), s) {
    const c = t.cariesSeverity.get(o) || 2;
    i.setAttribute("data-depth", hi(c)), i.setAttribute("data-icdas", String(c)), i.classList.toggle("icdas", rt), i.textContent = "", rt ? i.textContent = String(c) : i.innerHTML = "<i></i><i></i><i></i>";
  } else
    i.removeAttribute("data-depth"), i.removeAttribute("data-icdas"), i.classList.remove("icdas"), i.innerHTML = "<i></i><i></i><i></i>";
}
function yl(e, t) {
  const a = e.querySelector("input[type=checkbox]"), i = e.querySelector(".surf-defect");
  if (!a || !i) return;
  const o = String(a.value), s = t.fillingDefect?.get(o), c = !!t.fillingSurfaceMaterials?.has(o) && !!s && s !== "none";
  i.classList.toggle("has-defect", c), c ? i.setAttribute("data-defect", String(s)) : i.removeAttribute("data-defect");
}
function vl(e, t) {
  if (!t || !t.caries || !t.fillingSurfaceMaterials) return "";
  const a = [];
  for (const i of it)
    i !== "subcrown" && t.caries.has(`caries-${i}`) && t.fillingSurfaceMaterials.has(i) && a.push(Ve(i, e));
  return a.join("");
}
function bl(e, t) {
  const a = new Set(e), i = [];
  for (const s of B) {
    if (!a.has(s)) continue;
    const c = vl(s, t(s));
    c && i.push(`${s} (${c})`);
  }
  if (i.length === 0) return "";
  const o = i.length > 1 ? "filling.subcariesSummaryMultiple" : "filling.subcariesSummarySingle";
  return p(o, { teeth: i.join(", ") });
}
function kl() {
  const e = n("#fillingSubcariesSummary");
  if (!e) return;
  const t = bl(Array.from(T), (a) => E.get(a));
  e.textContent = t, e.classList.toggle("hidden", !t);
}
function xl(e, t) {
  if (!t || !t.fillingDefect || !t.fillingSurfaceMaterials || t.restorationType && t.restorationType !== "none") return "";
  const a = [];
  for (const i of it)
    i !== "subcrown" && t.fillingDefect.has(i) && t.fillingSurfaceMaterials.has(i) && a.push(Ve(i, e));
  return a.join("");
}
function wl(e, t) {
  const a = new Set(e), i = [];
  for (const s of B) {
    if (!a.has(s)) continue;
    const c = xl(s, t(s));
    c && i.push(`${s} (${c})`);
  }
  if (i.length === 0) return "";
  const o = i.length > 1 ? "filling.fillingDefectSummaryMultiple" : "filling.fillingDefectSummarySingle";
  return p(o, { teeth: i.join(", ") });
}
function Ml() {
  const e = n("#fillingDefectSummary");
  if (!e) return;
  const t = wl(Array.from(T), (a) => E.get(a));
  e.textContent = t, e.classList.toggle("hidden", !t);
}
function Sl(e) {
  const t = w0() === "simple";
  n("#wearEdgeSelectLabel").classList.toggle("hidden", t), n("#wearEdgeToggleLabel").classList.toggle("hidden", !t), n("#wearCervicalSelectLabel").classList.toggle("hidden", t), n("#wearCervicalToggleLabel").classList.toggle("hidden", !t), n("#wearEdgeToggle").checked = e.wearEdge !== "none", n("#wearCervicalToggle").checked = e.wearCervical !== "none";
  const a = M0() === "simple";
  n("#discolorationSelectLabel").classList.toggle("hidden", a), n("#discolorationToggleLabel").classList.toggle("hidden", !a), n("#discolorationToggle").checked = e.discoloration !== "none";
}
function $(e) {
  K(n("#apicalDxSelect"), C2(), e.apicalDx), n("#apicalDxSelect").value !== e.apicalDx && (e.apicalDx = n("#apicalDxSelect").value), n("#endoResection").checked = !!e.endoResection, n("#fissureSealing").checked = !!e.fissureSealing, n("#contactMesial").checked = !!e.contactMesial, n("#contactDistal").checked = !!e.contactDistal, K(n("#wearEdgeSelect"), yi(), e.wearEdge), n("#wearEdgeSelect").value !== e.wearEdge && (e.wearEdge = n("#wearEdgeSelect").value), K(n("#wearCervicalSelect"), vi(), e.wearCervical), n("#wearCervicalSelect").value !== e.wearCervical && (e.wearCervical = n("#wearCervicalSelect").value), K(n("#discolorationSelect"), bi(), e.discoloration), n("#discolorationSelect").value !== e.discoloration && (e.discoloration = n("#discolorationSelect").value), K(n("#orthoApplianceSelect"), ki(), e.orthoAppliance), n("#orthoApplianceSelect").value !== e.orthoAppliance && (e.orthoAppliance = n("#orthoApplianceSelect").value), K(n("#orthoDriftSelect"), xi(), e.orthoDrift), n("#orthoDriftSelect").value !== e.orthoDrift && (e.orthoDrift = n("#orthoDriftSelect").value), K(n("#orthoVerticalSelect"), wi(), e.orthoVertical), n("#orthoVerticalSelect").value !== e.orthoVertical && (e.orthoVertical = n("#orthoVerticalSelect").value), n("#orthoRotationToggle").checked = e.orthoRotation === !0, Sl(e), n("#brokenMesial").checked = !!e.brokenMesial, n("#brokenIncisal").checked = !!e.brokenIncisal, n("#brokenDistal").checked = !!e.brokenDistal, n("#extractionWound").checked = !!e.extractionWound, n("#extractionPlan").checked = !!e.extractionPlan, n("#parapulpalPin").checked = !!e.parapulpalPin, n("#crownReplace").checked = !!e.crownReplace, n("#crownNeeded").checked = !!e.crownNeeded, n("#missingClosed").checked = !!e.missingClosed, n("#bridgePillar").checked = !!e.bridgePillar, n("#crownLeakage").checked = !!e.crownLeakage;
  const t = e.toothSelection === "milktooth", a = e.toothSelection === "implant", i = Dt(e.toothSelection), o = Je(e.toothSelection) || e.toothSelection === "none" && e.extractionWound;
  n("#toothSelect").value = e.toothSelection, K(n("#substrateSelect"), z2(), e.toothSubstrate), n("#substrateSelect").value !== e.toothSubstrate && (e.toothSubstrate = n("#substrateSelect").value);
  const s = li(w), c = e.prosthesis && e.prosthesis !== "none" ? `prosthesis|${e.prosthesis}` : `${e.restorationType}|${e.restorationMaterial}`;
  K(n("#restorationSelect"), Z2(s, { isImplant: a, toothSelection: e.toothSelection }), c);
  {
    const A = String(n("#restorationSelect").value);
    if (A.startsWith("prosthesis|")) {
      const R = A.slice(11);
      e.prosthesis !== R && (e.prosthesis = R), e.restorationType = "none", e.restorationMaterial = "none";
    } else {
      const [R, Oe] = A.split("|");
      (R !== e.restorationType || Oe !== e.restorationMaterial) && (e.restorationType = R || "none", e.restorationMaterial = Oe || "none"), e.prosthesis !== "none" && (e.prosthesis = "none");
    }
  }
  (t || i || o || e.toothSubstrate === "radix") && (e.restorationType = "none", e.restorationMaterial = "none", n("#restorationSelect").value = "none|none"), e.toothSelection !== "tooth-base" && (e.toothSubstrate = "natural", n("#substrateSelect").value = "natural"), gi(n("#pulpEndoSelect"), t, sl(e)), K(n("#fillingSelect"), S2(t), e.fillingMaterial), n("#fillingSelect").value !== e.fillingMaterial && (e.fillingMaterial = n("#fillingSelect").value), K(n("#mobilitySelect"), D2(), e.mobility), n("#mobilitySelect").value !== e.mobility && (e.mobility = n("#mobilitySelect").value), ae("#modsChecks input[type=checkbox]").forEach((A) => A.checked = e.mods.has(A.value)), n("#periapicalTypeRow").classList.toggle("hidden", !tl(e)), K(n("#periapicalTypeSelect"), v2(), e.periapicalType), n("#periapicalTypeSelect").value !== e.periapicalType && (e.periapicalType = n("#periapicalTypeSelect").value), n("#calculusToggle").checked = !!e.calculus;
  const v = e.toothSelection === "tooth-base" || e.toothSelection === "milktooth";
  n("#calculusRow").classList.toggle("hidden", !v), K(n("#periImplantSelect"), Mi(), e.periImplant), n("#periImplantSelect").value !== e.periImplant && (e.periImplant = n("#periImplantSelect").value), A0(n("#periImplantRow"), n("#modsChecks"), e.toothSelection), P0(n("#modsChecks"), e.toothSelection), K(n("#resorptionSelect"), E2(), e.resorptionType), n("#resorptionSelect").value !== e.resorptionType && (e.resorptionType = n("#resorptionSelect").value), ae("#cariesChecks input[type=checkbox], #cariesSubcrownRow input[type=checkbox]").forEach((A) => A.checked = e.caries.has(A.value)), ae("#cariesChecks .surface-cell").forEach((A) => ml(A, e)), n("#cariesDepthRow").classList.toggle("hidden", !$t), K(n("#cariesDepthSelect"), Yt(), e.cariesActiveDepth), n("#cariesDepthSelect").value !== String(e.cariesActiveDepth) && (e.cariesActiveDepth = Number(n("#cariesDepthSelect").value)), K(n("#rootCariesSelect"), ui(), $0(x2, e.rootCaries)), n("#rootCariesRow").classList.toggle("hidden", !le(e.toothSelection)), ae("#fillingSurfaceChecks input[type=checkbox]").forEach((A) => {
    A.checked = e.fillingSurfaceMaterials.has(A.value);
    const R = A.closest(".surface-cell");
    if (R) {
      const Oe = e.fillingSurfaceMaterials.get(A.value);
      R.setAttribute("data-material", Oe || "");
    }
  }), ae("#fillingSurfaceChecks .surface-cell").forEach((A) => gl(A, e)), ae("#fillingSurfaceChecks .surface-cell").forEach((A) => yl(A, e));
  const f = e.restorationType !== "none", u = e.toothSelection === "none" && (e.prosthesis === "removable-partial" || e.prosthesis === "removable-full"), m = f || u;
  ae("#cariesChecks input[type=checkbox], #cariesSubcrownRow input[type=checkbox]").forEach((A) => {
    A.value === "caries-subcrown" ? ce(A, !f) : ce(A, m || f);
  });
  const b = e.fillingMaterial !== "none" && !f;
  n("#fillingSurfaceChecks").classList.toggle("hidden", !b);
  const k = !le(e.toothSelection) || i || o;
  ce(n("#pulpEndoSelect"), k), ce(n("#apicalDxSelect"), k), ce(n("#resorptionSelect"), k), ce(n("#endoResection"), k), ce(n("#parapulpalPin"), k), ce(n("#mobilitySelect"), _0(e));
  const g = T.size > 0 ? Array.from(T) : [], D = g.length > 0 && g.some((A) => {
    const R = E.get(A)?.toothSelection;
    return R === "implant" || R === "none" || R === "tooth-under-gum" || R === "no-tooth-after-extraction";
  }), r = e.toothSelection === "implant" || e.toothSelection === "none" || i || o || D, l = g.length > 0 && g.some((A) => E.get(A)?.toothSelection === "none"), y = e.toothSelection === "none" || l, I = e.toothSubstrate === "radix";
  n("#cariesSection").classList.toggle("hidden", r || I);
  const O = e.toothSelection === "tooth-base" && f;
  n("#fillingSection").classList.toggle("hidden", r || O);
  const j = I2(e);
  n("#restorationRow").classList.toggle("hidden", j);
  const N = e.toothSelection !== "tooth-base";
  n("#substrateRow").classList.toggle("hidden", N), n("#brokenCrownRow").classList.toggle("hidden", e.toothSubstrate !== "broken" || N), n("#extractionRow").classList.toggle("hidden", e.toothSelection !== "none"), n("#rpRootBlock").classList.toggle("hidden", r), n("#rpPerioBlock").classList.toggle("hidden", y), n("#rootPeriodontiumSection").classList.toggle("hidden", r && y);
  const P = g.length > 0 ? g : w ? [w] : [], h = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return !(!(R && (R.toothSelection === "tooth-base" || R.toothSelection === "milktooth" || Wa.has(R.toothSelection))) || R.toothSelection === "tooth-base" && R.restorationType !== "none");
  }), F = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && L2(R);
  }), L = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && qt(R);
  }), M = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && Xt(R);
  }), he = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && R.toothSelection === "tooth-base" && Ha.has(A);
  });
  n("#contactPointRow").classList.toggle("hidden", !h), n("#bruxismRow").classList.toggle("hidden", !F), n("#discolorationRow").classList.toggle("hidden", !L), n("#orthoCard").classList.toggle("hidden", !M), n("#fissureSealingRow").classList.toggle("hidden", !he);
  const Te = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && ["tooth-base", "milktooth", "implant", "tooth-under-gum"].includes(R.toothSelection);
  });
  n("#extractionPlanRow").classList.toggle("hidden", !Te);
  const Qe = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && R.toothSelection === "tooth-base" && R.restorationType !== "none";
  });
  n("#crownReplaceRow").classList.toggle("hidden", !Qe);
  const dt = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && R.toothSelection === "tooth-base" && R.restorationType === "none" && ["natural", "broken", "crownprep"].includes(R.toothSubstrate);
  });
  n("#crownNeededRow").classList.toggle("hidden", !dt);
  const pt = P.length > 0 && P.every((A) => {
    const R = E.get(A);
    return R && R.toothSelection === "none";
  });
  n("#missingClosedRow").classList.toggle("hidden", !pt);
  const Ze = n("#restorationRow").classList.contains("hidden"), U = !Ze && e.restorationType !== "none";
  n("#bridgePillarRow").classList.toggle("hidden", !U);
  const Y = !Ze && (e.restorationType === "crown" || e.restorationType === "bridge");
  n("#crownLeakageRow").classList.toggle("hidden", !Y);
  const Q = n("#extractionPlanRow"), q = n("#brokenCrownRow"), ke = n("#bruxismRow"), xe = n("#crownActionsRow");
  Q && q && ke && xe && (e.toothSubstrate === "broken" && e.toothSelection === "tooth-base" ? (Q.parentElement !== q && q.appendChild(Q), xe.classList.add("hidden")) : ke.classList.contains("hidden") ? (Q.parentElement !== xe && xe.appendChild(Q), xe.classList.toggle("hidden", !Te)) : (Q.parentElement !== ke && ke.appendChild(Q), xe.classList.add("hidden")), Q.classList.toggle("hidden", !Te));
  const Pt = n("#lbl-parodontal");
  Pt && (Pt.textContent = p("mods.parodontal"));
  const ft = n("#toothSelect").querySelector('option[value="milktooth"]');
  if (ft) {
    const A = g.length > 0 ? g.some((R) => n2.has(Number(R))) : w ? n2.has(w) : !1;
    ft.disabled = A;
  }
  const At = n("#lbl-inflammation");
  At && (At.textContent = p(o ? "mods.periodontalInflammation" : "mods.periapicalInflammation")), n("#mobilityRow").classList.toggle("hidden", B0(e));
  const ht = n("#chk-parodontal");
  if (ht && ce(ht, o), o) {
    const A = n("#chk-inflammation");
    A && ce(A, !1);
  }
  zi(), kl(), Ml();
}
function G(e) {
  if (T.size !== 0) {
    for (const t of T) {
      const a = E.get(t);
      a && (e(a, t), ne(t), ge(t));
    }
    w && T.has(w) && $(E.get(w)), Le && !Fe && Me(!1), Qt(), me();
  }
}
function P2() {
  const e = n("#activeToothLabel");
  if (e)
    if (T.size === 0)
      e.textContent = p("selection.none");
    else if (T.size === 1) {
      const t = w ?? Array.from(T)[0];
      e.textContent = We(M2(t), ze);
    } else
      e.textContent = p("selection.count", { count: T.size });
}
function Qt() {
  let e = !1, t = !1, a = !1, i = !1, o = !1;
  for (const s of B) {
    const c = E.get(s)?.toothSelection;
    c === "none" ? t = !0 : e = !0, c === "tooth-base" && (a = !0), c === "milktooth" && (i = !0), c === "implant" && (o = !0);
  }
  n("#btnSelectAllPresent")?.classList.toggle("is-hidden", !e), n("#btnSelectAllMissing")?.classList.toggle("is-hidden", !t), n("#btnSelectPermanent")?.classList.toggle("is-hidden", !a), n("#btnSelectMilk")?.classList.toggle("is-hidden", !i), n("#btnSelectImplants")?.classList.toggle("is-hidden", !o);
}
function Bt(e) {
  ae(".panel-body input, .panel-body select").forEach((t) => {
    t.id !== "statusExtraSelect" && ce(t, !e);
  });
}
function zi() {
  for (const e of Ya) {
    const t = n(`#lbl-${e.value}`);
    t && (t.textContent = p(e.labelKey));
  }
  for (const e of u0) {
    const t = n(`#lbl-${e.value}`);
    if (!t) continue;
    const a = e.value.replace("caries-", ""), i = a === "occlusal" || a === "buccal" || a === "lingual" ? _t(a, w) : e.labelKey;
    t.textContent = p(i);
    const o = t.parentElement?.querySelector(".surf-letter");
    o && (o.textContent = p2(a, w));
  }
  for (const e of r0.fillingSurfaces) {
    const t = n(`#lbl-${e}`);
    if (!t) continue;
    const a = e === "occlusal" || e === "buccal" || e === "lingual" ? _t(e, w) : m0[e] || "surface.mesial";
    t.textContent = p(a);
    const i = t.parentElement?.querySelector(".surf-letter");
    i && (i.textContent = p2(e, w));
  }
}
function zl() {
  const e = n("#toothSelect");
  if (!e) return;
  const t = e.value;
  K(e, di(), t);
}
function Zl() {
  const e = n("#statusExtraSelect");
  if (!e) return;
  const t = pi();
  if (!t.length) return;
  const a = t.map((o) => ({ value: o.id, label: o.label })), i = e.value || a[0]?.value;
  K(e, a, i);
}
function Il() {
  const e = n("#statusCard"), t = n("#btnToggleStatusCard");
  e && t && Pe(t, "status.title", e.classList.contains("collapsed"));
  const a = n("#controlsActions"), i = n("#btnToggleControlsCard");
  a && i && Pe(i, "panel.controls", a.classList.contains("hidden"));
  const o = [
    { card: "#cariesSection", btn: "#btnToggleCariesCard", labelKey: "caries.title" },
    { card: "#fillingSection", btn: "#btnToggleFillingCard", labelKey: "filling.title" },
    { card: "#rootPeriodontiumSection", btn: "#btnToggleRootPeriodontiumCard", labelKey: "card.rootPeriodontium" }
  ];
  for (const s of o) {
    const c = n(s.card), v = n(s.btn);
    !c || !v || Pe(v, s.labelKey, c.classList.contains("collapsed"));
  }
}
function Dl() {
  zl(), Zl();
  const e = w ? E.get(w) : null, t = e?.toothSelection === "milktooth", a = n("#substrateSelect");
  a && K(a, z2(), a.value);
  const i = n("#restorationSelect");
  i && K(i, Z2(li(w), { isImplant: e?.toothSelection === "implant", toothSelection: e?.toothSelection }), i.value);
  const o = n("#fillingSelect");
  o && K(o, S2(t), o.value);
  const s = n("#mobilitySelect");
  s && K(s, D2(), s.value);
  const c = n("#periapicalTypeSelect");
  c && K(c, v2(), c.value);
  const v = n("#pulpEndoSelect");
  v && gi(v, t, v.value);
  const f = n("#apicalDxSelect");
  f && K(f, C2(), f.value);
  const u = n("#resorptionSelect");
  u && K(u, E2(), u.value);
  const m = n("#cariesDepthSelect");
  m && K(m, Yt(), Number(m.value));
}
function wa() {
  Dl(), zi(), Il(), P2(), Al(), w && $(E.get(w));
}
function fe() {
  ae(".tooth-tile").forEach((e) => {
    const t = Number(e.dataset.tooth), a = T.has(t);
    e.classList.toggle("active", a), e.hasAttribute("role") && e.setAttribute("aria-selected", String(a));
  }), Qt(), P2(), w && T.has(w) ? (Bt(!0), $(E.get(w))) : ($(ee()), Bt(!1));
}
function Cl(e) {
  ve(), De();
  const t = He.get(e), a = t?.find((y, I) => pe.get(e)?.[I]?.classList.contains("side-view")) || t?.[0];
  if (!a) return;
  const i = C("div", { class: "odon-zoom-overlay" }), o = C("div", { class: "odon-zoom-popover" }), s = We(e, ze), c = C("div", { class: "odon-zoom-header" }), v = C("span", { class: "odon-zoom-title", text: p("touch.zoom.title", { tooth: s }) }), f = C("button", { class: "odon-zoom-close", text: "✕" });
  f.addEventListener("click", ve), c.appendChild(v), c.appendChild(f);
  const u = C("div", { class: "odon-zoom-svg" }), m = a.cloneNode(!0);
  u.appendChild(m);
  const b = C("div", { class: "odon-zoom-actions" }), k = T.has(e), g = C("button", {
    class: k ? "odon-zoom-btn active" : "odon-zoom-btn",
    text: p(k ? "touch.zoom.deselect" : "touch.zoom.select")
  });
  g.addEventListener("click", () => {
    T.has(e) ? (T.delete(e), w === e && (w = T.values().next().value ?? null)) : (T.add(e), w = e), fe(), ve();
  });
  const D = C("button", { class: "odon-zoom-btn", text: p("touch.zoom.info") });
  D.addEventListener("click", () => {
    T = /* @__PURE__ */ new Set([e]), w = e, fe(), ve();
    const y = n("#controlsActions");
    y && y.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  const r = C("button", { class: "odon-zoom-btn danger", text: p("touch.ctx.reset") });
  r.addEventListener("click", () => {
    E.set(e, ee()), ne(e), ge(e), w === e && $(E.get(e)), ve();
  });
  const l = C("button", { class: "odon-zoom-btn", text: p("touch.zoom.close") });
  if (l.addEventListener("click", ve), b.appendChild(g), b.appendChild(D), Xe && !te) {
    const y = C("button", { class: "odon-zoom-btn", text: p("note.title") });
    y.addEventListener("click", () => {
      ve(), Zi(e);
    }), b.appendChild(y);
  }
  b.appendChild(r), b.appendChild(l), o.appendChild(c), o.appendChild(u), o.appendChild(b), i.addEventListener("click", (y) => {
    y.target === i && ve();
  }), i.appendChild(o), document.body.appendChild(i);
}
function ve() {
  const e = document.querySelector(".odon-zoom-overlay");
  e && e.remove();
}
function El(e, t) {
  De(), ve();
  const a = C("div", { class: "odon-ctx-menu" });
  if (T.has(e)) {
    const f = C("button", { class: "odon-ctx-item", text: p("touch.ctx.deselect") });
    f.addEventListener("click", () => {
      T.delete(e), w === e && (w = T.values().next().value ?? null), fe(), De();
    }), a.appendChild(f);
  } else {
    const f = C("button", { class: "odon-ctx-item", text: p("touch.ctx.select") });
    if (f.addEventListener("click", () => {
      T = /* @__PURE__ */ new Set([e]), w = e, fe(), De();
    }), a.appendChild(f), T.size > 0) {
      const u = C("button", { class: "odon-ctx-item", text: p("touch.ctx.multiSelect") });
      u.addEventListener("click", () => {
        T.add(e), w = e, fe(), De();
      }), a.appendChild(u);
    }
  }
  a.appendChild(C("div", { class: "odon-ctx-divider" }));
  const o = C("button", { class: "odon-ctx-item danger", text: p("touch.ctx.reset") });
  o.addEventListener("click", () => {
    E.set(e, ee()), ne(e), ge(e), w === e && $(E.get(e)), De();
  }), a.appendChild(o);
  const s = Math.min(t.clientX, window.innerWidth - 200), c = Math.min(t.clientY - 10, window.innerHeight - 200);
  a.style.left = s + "px", a.style.top = c + "px", document.body.appendChild(a);
  const v = (f) => {
    a.contains(f.target) || (De(), document.removeEventListener("touchstart", v, !0), document.removeEventListener("click", v, !0));
  };
  setTimeout(() => {
    document.addEventListener("touchstart", v, !0), document.addEventListener("click", v, !0);
  }, 50);
}
function De() {
  const e = document.querySelector(".odon-ctx-menu");
  e && e.remove();
}
function Zi(e) {
  if (tt(), !Xe || te) return;
  const t = E.get(e);
  if (!t) return;
  const a = pe.get(e), i = a?.find((D) => D.classList.contains("side-view")) || a?.[0], o = We(e, ze), s = C("div", { class: "odon-note-popover" }), c = C("div", { class: "odon-note-header" }), v = C("span", { class: "odon-note-title", text: p("note.title") + " — " + o }), f = C("button", { class: "odon-zoom-close", text: "✕" });
  f.addEventListener("click", tt), c.appendChild(v), c.appendChild(f);
  const u = document.createElement("textarea");
  u.className = "odon-note-textarea", u.value = t.note || "", u.placeholder = p("note.placeholder"), u.rows = 3;
  const m = C("div", { class: "odon-note-actions" }), b = C("button", { class: "odon-zoom-btn", text: p("note.save") });
  b.addEventListener("click", () => {
    t.note = u.value.trim(), Ye(e), Ct(e), tt();
  });
  const k = C("button", { class: "odon-zoom-btn danger", text: p("note.delete") });
  k.addEventListener("click", () => {
    t.note = "", Ye(e), Ct(e), tt();
  }), m.appendChild(b), m.appendChild(k), s.appendChild(c), s.appendChild(u), s.appendChild(m);
  const g = C("div", { class: "odon-note-backdrop" });
  if (g.addEventListener("click", tt), g.appendChild(s), document.body.appendChild(g), s.addEventListener("click", (D) => D.stopPropagation()), i) {
    const D = i.getBoundingClientRect(), r = 320;
    let l = D.left + D.width / 2 - r / 2, y = D.bottom + 8;
    l < 8 && (l = 8), l + r > window.innerWidth - 8 && (l = window.innerWidth - r - 8), y + 200 > window.innerHeight && (y = D.top - 208), s.style.position = "fixed", s.style.left = l + "px", s.style.top = y + "px";
  }
  u.focus();
}
function tt() {
  const e = document.querySelector(".odon-note-backdrop");
  e && e.remove();
}
function lt() {
  const e = document.querySelector(".odon-depth-popup");
  e && e.remove();
}
function p2(e, t) {
  if (e === "subcrown") return "SC";
  if (k2 === "simple")
    return { buccal: "B", mesial: "M", occlusal: "O", distal: "D", lingual: "L" }[e] || e;
  const a = t != null && $a(t), i = t != null && Ja(t);
  return e === "occlusal" ? a ? "I" : "O" : e === "buccal" ? a ? "L" : "B" : e === "lingual" ? i ? "P" : "L" : e === "mesial" ? "M" : e === "distal" ? "D" : e;
}
function _t(e, t) {
  if (k2 === "full") {
    const i = t != null && $a(t), o = t != null && Ja(t);
    if (e === "occlusal") return i ? "surface.incisal" : "surface.occlusal";
    if (e === "buccal") return i ? "surface.labial" : "surface.buccal";
    if (e === "lingual") return o ? "surface.palatal" : "surface.lingual";
  }
  return {
    buccal: "surface.buccal",
    lingual: "surface.lingualPalatal",
    mesial: "surface.mesial",
    distal: "surface.distal",
    occlusal: "surface.occlusal"
  }[e] || e;
}
function Ma(e, t, a) {
  lt();
  const i = t.getBoundingClientRect(), o = C("div", { class: "odon-depth-popup" }), s = w != null ? E.get(w) : null, c = !!s?.fillingSurfaceMaterials?.has(e), v = c ? "caries.recurrentTitle" : "caries.primaryTitle";
  o.appendChild(C("div", { class: "odon-depth-title", text: `${p(v)} – ${p(_t(e, a))}` }));
  const f = (r, l, y, I) => {
    if (!(!l || l.length === 0)) {
      o.appendChild(C("div", { class: "odon-depth-group-label", text: p(r) }));
      for (const O of l) {
        const j = C("button", { class: "odon-depth-option", text: O.label });
        j.title = O.title || "", y != null && String(O.value) === String(y) && j.classList.add("is-active"), j.addEventListener("click", (N) => {
          N.stopPropagation(), I(O.value), lt();
        }), o.appendChild(j);
      }
    }
  };
  c ? f("caries.secondaryLabel", W0(), s?.cariesSeverity?.get(e) ?? 0, (r) => {
    G((l) => {
      Y0(l, e, Number(r));
    });
  }) : $t && f("caries.depthLabel", Yt(), s?.cariesSeverity?.get(e), (r) => {
    G((l) => {
      l.caries.has(`caries-${e}`) && l.cariesSeverity.set(e, Number(r));
    });
  }), f("caries.radiographicLabel", J0(), s?.radiographicDepth?.get(e) ?? "none", (r) => {
    G((l) => {
      q0(l.radiographicDepth, e, String(r));
    });
  }), document.body.appendChild(o);
  const u = o.offsetWidth || 140, m = Math.min(i.left, window.innerWidth - u - 8), b = Math.min(i.bottom + 4, window.innerHeight - o.offsetHeight - 8);
  o.style.left = `${Math.max(8, m)}px`, o.style.top = `${Math.max(8, b)}px`;
  const k = (r) => {
    o.contains(r.target) || D();
  }, g = (r) => {
    r.key === "Escape" && D();
  };
  function D() {
    lt(), document.removeEventListener("mousedown", k, !0), document.removeEventListener("keydown", g, !0);
  }
  setTimeout(() => {
    document.addEventListener("mousedown", k, !0), document.addEventListener("keydown", g, !0);
  }, 0);
}
function Ll(e, t, a) {
  lt();
  const i = w != null ? E.get(w) : null;
  if (!i?.fillingSurfaceMaterials?.has(e)) return;
  const o = t.getBoundingClientRect(), s = C("div", { class: "odon-depth-popup" });
  s.appendChild(C("div", { class: "odon-depth-title", text: `${p("fillingDefect.label")} – ${p(_t(e, a))}` }));
  const c = i?.fillingDefect?.get(e) ?? "none", v = C("div", { class: "odon-depth-group" });
  for (const D of ["none", "marginal", "fracture", "wear"]) {
    const r = C("button", { class: "odon-depth-option" + (D === c ? " is-active" : ""), text: p("fillingDefect." + D) });
    r.addEventListener("click", (l) => {
      l.stopPropagation(), G((y) => {
        X0(y.fillingDefect, e, D);
      }), lt();
    }), v.appendChild(r);
  }
  s.appendChild(v), document.body.appendChild(s);
  const f = s.offsetWidth || 140, u = Math.min(o.left, window.innerWidth - f - 8), m = Math.min(o.bottom + 4, window.innerHeight - s.offsetHeight - 8);
  s.style.left = `${Math.max(8, u)}px`, s.style.top = `${Math.max(8, m)}px`;
  const b = (D) => {
    s.contains(D.target) || g();
  }, k = (D) => {
    D.key === "Escape" && g();
  };
  function g() {
    lt(), document.removeEventListener("mousedown", b, !0), document.removeEventListener("keydown", k, !0);
  }
  setTimeout(() => {
    document.addEventListener("mousedown", b, !0), document.addEventListener("keydown", k, !0);
  }, 0);
}
function Ii(e, t) {
  const a = e.clientX - t.clientX, i = e.clientY - t.clientY;
  return Math.sqrt(a * a + i * i);
}
function Di(e) {
  if (e.touches.length === 2) {
    It = !0, ti = Ii(e.touches[0], e.touches[1]);
    const t = n("#toothGrid");
    t && t.classList.add("odon-pinch-active"), e.preventDefault();
  }
}
function Ci(e) {
  if (It && e.touches.length === 2) {
    const t = Ii(e.touches[0], e.touches[1]), a = Math.max(0.5, Math.min(3, t / ti * at)), i = n("#toothGrid");
    i && (i.style.transform = `scale(${a})`), e.preventDefault();
  }
}
function Ei(e) {
  if (It && e.touches.length < 2) {
    It = !1;
    const t = n("#toothGrid");
    if (t) {
      const a = t.style.transform.match(/scale\(([\d.]+)\)/);
      at = a ? parseFloat(a[1]) : 1, at > 0.9 && at < 1.1 && (at = 1, t.style.transform = "", t.classList.remove("odon-pinch-active"));
    }
  }
}
function Pl() {
  const e = n("#toothGrid");
  if (!e) return;
  de && de.remove(), de = C("div", { class: "odon-arch-toggle" });
  const t = C("button", { class: "odon-arch-btn", text: p("touch.arch.upper") }), a = C("button", { class: "odon-arch-btn", text: p("touch.arch.lower") }), i = C("button", { class: "odon-arch-btn active", text: p("touch.arch.both") });
  function o(s) {
    jt = s, t.classList.toggle("active", s === "upper"), a.classList.toggle("active", s === "lower"), i.classList.toggle("active", s === "both"), e.classList.toggle("odon-arch-upper", s === "upper"), e.classList.toggle("odon-arch-lower", s === "lower");
  }
  t.addEventListener("click", () => o(jt === "upper" ? "both" : "upper")), a.addEventListener("click", () => o(jt === "lower" ? "both" : "lower")), i.addEventListener("click", () => o("both")), de.appendChild(t), de.appendChild(i), de.appendChild(a), e.parentElement?.insertBefore(de, e);
}
function Al() {
  if (!de) return;
  const e = de.querySelectorAll(".odon-arch-btn");
  e[0] && (e[0].textContent = p("touch.arch.upper")), e[1] && (e[1].textContent = p("touch.arch.both")), e[2] && (e[2].textContent = p("touch.arch.lower"));
}
function Tl(e, t) {
  e.addEventListener("touchstart", (a) => {
    if (te || a.touches.length !== 1) return;
    fa = Date.now(), ha = a.touches[0].clientX, ua = a.touches[0].clientY, Rt = !1;
    const i = a.touches[0];
    be = setTimeout(() => {
      Rt || El(t, i);
    }, ma);
  }, { passive: !0 }), e.addEventListener("touchmove", (a) => {
    if (a.touches.length !== 1) return;
    const i = a.touches[0].clientX - ha, o = a.touches[0].clientY - ua;
    (Math.abs(i) > ga || Math.abs(o) > ga) && (Rt = !0, be && (clearTimeout(be), be = null));
  }, { passive: !0 }), e.addEventListener("touchend", (a) => {
    if (te) return;
    be && (clearTimeout(be), be = null);
    const i = Date.now() - fa;
    !Rt && i < ma && (a.preventDefault(), Cl(t));
  });
}
function f2(e, t) {
  if (te) return;
  t.metaKey || t.ctrlKey ? T.has(e) ? T.delete(e) : (T.add(e), w = e) : (T = /* @__PURE__ */ new Set([e]), w = e), w && !T.has(w) && (w = T.values().next().value ?? null), fe();
}
const mt = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
];
function et(e) {
  const t = pe.get(e);
  return !t || t.length === 0 ? !1 : t.some((a) => !a.classList.contains("wisdom-hidden") && !a.classList.contains("placeholder"));
}
function Ol(e, t) {
  const a = mt.findIndex((c) => c.includes(e));
  if (a < 0) return;
  const i = mt[a], o = i.indexOf(e);
  let s = null;
  if (t === "ArrowRight") {
    for (let c = o + 1; c < i.length; c++)
      if (et(i[c])) {
        s = i[c];
        break;
      }
  } else if (t === "ArrowLeft") {
    for (let c = o - 1; c >= 0; c--)
      if (et(i[c])) {
        s = i[c];
        break;
      }
  } else if (t === "ArrowDown") {
    if (a < mt.length - 1) {
      const c = mt[a + 1], v = Math.min(o, c.length - 1);
      for (let f = v; f < c.length; f++)
        if (et(c[f])) {
          s = c[f];
          break;
        }
      if (!s) {
        for (let f = v - 1; f >= 0; f--)
          if (et(c[f])) {
            s = c[f];
            break;
          }
      }
    }
  } else if (t === "ArrowUp" && a > 0) {
    const c = mt[a - 1], v = Math.min(o, c.length - 1);
    for (let f = v; f < c.length; f++)
      if (et(c[f])) {
        s = c[f];
        break;
      }
    if (!s) {
      for (let f = v - 1; f >= 0; f--)
        if (et(c[f])) {
          s = c[f];
          break;
        }
    }
  }
  if (s !== null) {
    const v = pe.get(s)?.find((f) => f.classList.contains("side-view"));
    v && v.focus();
  }
}
function Nl(e, t) {
  if (!te)
    switch (t.key) {
      case "Enter":
      case " ":
        t.preventDefault(), f2(e, t);
        break;
      case "ArrowRight":
      case "ArrowLeft":
      case "ArrowUp":
      case "ArrowDown":
        t.preventDefault(), Ol(e, t.key);
        break;
      case "Escape":
        t.preventDefault(), ds();
        break;
    }
}
function ie() {
  const e = /* @__PURE__ */ new Set([18, 28, 38, 48]);
  for (const t of B) {
    const a = pe.get(t);
    if (!a) continue;
    const i = !St && e.has(t);
    for (const o of a)
      o.classList.toggle("wisdom-hidden", i), o.hasAttribute("role") && (o.setAttribute("tabindex", i || te ? "-1" : "0"), i ? o.setAttribute("aria-hidden", "true") : o.removeAttribute("aria-hidden"));
  }
  T = new Set([...T].filter((t) => {
    const a = pe.get(t);
    return !a || a.length === 0 ? !0 : !a.every((i) => i.classList.contains("wisdom-hidden"));
  })), w && !T.has(w) && (w = T.values().next().value ?? null), fe();
}
function Me(e) {
  if (Le = e, ct(n("#btnEdentulous"), Le), Le) {
    Fe = !0;
    for (const t of B) {
      const a = ee();
      a.toothSelection = "none", E.set(t, a), ne(t), ge(t);
    }
    Fe = !1, w && $(E.get(w));
  }
  me();
}
function Li(e) {
  St = !!e, ct(n("#btnWisdomVisible"), St), ie(), Jt();
}
function Pi(e) {
  zt = e, ct(n("#btnBoneVisible"), zt);
  for (const t of B)
    ne(t);
}
function A2(e) {
  ot = !!e, ct(n("#btnOcclView"), ot), ae(".tooth-tile.occl-view").forEach((t) => {
    t.classList.toggle("occl-hidden", !ot);
  }), Jt();
}
function T2(e) {
  $e = !!e, ct(n("#btnPulpVisible"), $e);
  for (const t of B)
    ne(t);
}
function Rl(e) {
  return {
    toothSelection: e.toothSelection,
    pulpDx: e.pulpDx,
    // SP4 Task 5: pulpLatin (practical-Latin subtype) and apicalDx (apical AAE
    // diagnosis) are now authorable in the diagnosis UI, so they join the
    // serialized payload — this is also what feeds the FHIR export (both are
    // already mapped in FIELD_MAPPINGS). Both round-trip via fromRaw below.
    pulpLatin: e.pulpLatin,
    apicalDx: e.apicalDx,
    endoResection: !!e.endoResection,
    resorptionType: e.resorptionType,
    // SP18: peri-implant status (mucositis / peri-implantitis staging) was
    // authored, rendered, and read back by hydrateState, but omitted here —
    // an SP8 omission that silently dropped it on export/import. Fixed by
    // adding it alongside the other enum-axis fields.
    periImplant: e.periImplant,
    mods: Array.from(e.mods || []),
    periapicalType: e.periapicalType,
    endo: e.endo,
    caries: Array.from(e.caries || []),
    cariesActiveDepth: e.cariesActiveDepth,
    // SP6 Task 1: the unified per-surface severity replaces the SP5
    // `cariesDepths` + `secondaryCaries` pair. Serialized like `cariesDepths`
    // was (Record<surface,number>). Payload version bumped to 2.4.
    cariesSeverity: Object.fromEntries(e.cariesSeverity || /* @__PURE__ */ new Map()),
    fillingMaterial: e.fillingMaterial,
    fillingSurfaces: Array.from(e.fillingSurfaces || []),
    fillingSurfaceMaterials: Object.fromEntries(e.fillingSurfaceMaterials || /* @__PURE__ */ new Map()),
    fissureSealing: !!e.fissureSealing,
    calculus: !!e.calculus,
    contactMesial: !!e.contactMesial,
    contactDistal: !!e.contactDistal,
    wearEdge: e.wearEdge,
    wearCervical: e.wearCervical,
    discoloration: e.discoloration,
    orthoAppliance: e.orthoAppliance,
    orthoDrift: e.orthoDrift,
    orthoVertical: e.orthoVertical,
    orthoRotation: !!e.orthoRotation,
    brokenMesial: !!e.brokenMesial,
    brokenIncisal: !!e.brokenIncisal,
    brokenDistal: !!e.brokenDistal,
    extractionWound: !!e.extractionWound,
    extractionPlan: !!e.extractionPlan,
    parapulpalPin: !!e.parapulpalPin,
    crownReplace: !!e.crownReplace,
    crownNeeded: !!e.crownNeeded,
    missingClosed: !!e.missingClosed,
    bridgePillar: !!e.bridgePillar,
    prosthesis: e.prosthesis,
    mobility: e.mobility,
    toothSubstrate: e.toothSubstrate,
    restorationType: e.restorationType,
    restorationMaterial: e.restorationMaterial,
    crownLeakage: !!e.crownLeakage,
    rootCaries: e.rootCaries,
    radiographicDepth: Object.fromEntries(e.radiographicDepth || /* @__PURE__ */ new Map()),
    fillingDefect: Object.fromEntries(e.fillingDefect || /* @__PURE__ */ new Map()),
    ...Object.keys(e.customStates || {}).length > 0 ? { customStates: e.customStates } : {},
    ...e.note ? { note: e.note } : {}
  };
}
const Gl = V("toothSelection"), Ai = V("endo"), Sa = V("fillingMaterial"), Ul = V("prosthesis"), jl = V("mobility"), Fl = V("toothSubstrate"), Kl = V("restorationType"), Bl = V("restorationMaterial"), _l = V("mods"), Vl = V("periapicalType"), Hl = V("caries"), Ti = V("pulpDx"), Oi = V("pulpLatin"), Ni = V("apicalDx"), Ri = V("resorptionType"), Gi = V("wearEdge"), Ui = V("wearCervical"), ji = V("discoloration"), Fi = V("orthoAppliance"), Ki = V("orthoDrift"), Bi = V("orthoVertical"), Re = jo(), _i = V("rootCaries"), Vi = V("periImplant"), Wl = /* @__PURE__ */ new Set([0, 1, 2, 3, 4, 5, 6]), $l = /* @__PURE__ */ new Set([0, 1, 2, 3, 4, 5, 6]), Jl = /* @__PURE__ */ new Set(["none", "E1", "E2", "D1", "D2", "D3"]), Yl = /* @__PURE__ */ new Set(["marginal", "fracture", "wear"]);
function o2(e, t) {
  return Array.isArray(e) ? new Set(e.filter((a) => typeof a == "string" && t.has(a))) : /* @__PURE__ */ new Set();
}
function J(e, t, a) {
  return typeof e == "string" && t.has(e) ? e : a;
}
function ql(e) {
  if (typeof e != "string" || e.trim() === "") return !0;
  const a = ((o) => o.split(".").map((s) => {
    const c = parseInt(s, 10);
    return Number.isFinite(c) ? c : 0;
  }))(e), i = [2, 3, 0];
  for (let o = 0; o < Math.max(a.length, i.length); o++) {
    const s = a[o] ?? 0, c = i[o] ?? 0;
    if (s !== c) return s < c;
  }
  return !1;
}
function Xl(e, t = !0) {
  const a = ee();
  if (!e || typeof e != "object") return a;
  const i = e.bridgeUnit === "zircon" || e.bridgeUnit === "metal" || e.bridgeUnit === "temporary";
  if (e.restorationType === void 0 && (e.crownMaterial !== void 0 || i)) {
    const l = typeof e.crownMaterial == "string" ? e.crownMaterial : "natural";
    l === "natural" || l === "radix" || l === "broken" || l === "crownprep" ? (e.toothSubstrate = l, e.restorationType = "none", e.restorationMaterial = "none", e.crownMaterial = "natural") : l === "metal" ? (e.toothSubstrate = "crownprep", e.restorationType = "crown", e.restorationMaterial = "metal-ceramic", e.crownMaterial = "natural") : ["emax", "zircon", "temporary", "telescope", "gold", "gradia"].includes(l) ? (e.toothSubstrate = "crownprep", e.restorationType = "crown", e.restorationMaterial = l, e.crownMaterial = "natural") : (e.restorationType = "none", e.restorationMaterial = "none"), (e.bridgeUnit === "zircon" || e.bridgeUnit === "metal" || e.bridgeUnit === "temporary") && (e.restorationType = "bridge", e.restorationMaterial = e.bridgeUnit === "metal" ? "metal-ceramic" : e.bridgeUnit, e.bridgeUnit = "none");
  }
  const o = ["emax", "zircon", "gold", "gradia", "metal", "telescope", "temporary"];
  if (e.toothSelection === "implant" && (e.restorationType === void 0 || e.restorationType === "none") && typeof e.crownMaterial == "string" && o.includes(e.crownMaterial) && (e.restorationType = "crown", e.restorationMaterial = e.crownMaterial === "metal" ? "metal-ceramic" : e.crownMaterial, e.crownMaterial = "natural"), e.prosthesis === void 0) {
    const l = {
      "healing-abutment": "healing-abutment",
      locator: "locator",
      "locator-prosthesis": "locator-denture",
      bar: "bar",
      "bar-prosthesis": "bar-denture"
    }, y = {
      removable: "removable-partial",
      bar: "bar",
      "bar-prosthesis": "bar-denture"
    };
    e.toothSelection === "implant" && typeof e.crownMaterial == "string" && l[e.crownMaterial] ? e.prosthesis = l[e.crownMaterial] : e.toothSelection === "none" && typeof e.bridgeUnit == "string" && y[e.bridgeUnit] && (e.prosthesis = y[e.bridgeUnit]);
  }
  a.toothSelection = J(e.toothSelection, Gl, a.toothSelection);
  const s = e.pulpInflam ? "irreversible-pulpitis" : "normal";
  a.pulpDx = J(e.pulpDx, Ti, s), a.pulpLatin = J(e.pulpLatin, Oi, "none"), a.endoResection = !!e.endoResection;
  const c = e.rootResorption ? "external-cervical" : "none";
  a.resorptionType = J(e.resorptionType, Ri, c), a.mods = o2(e.mods, _l), a.periapicalType = J(e.periapicalType, Vl, "none");
  let v = "normal";
  a.mods.has("inflammation") && le(a.toothSelection) && (v = a.periapicalType === "abscess" ? "acute-apical-abscess" : "asymptomatic-apical-periodontitis", a.mods.delete("inflammation")), a.apicalDx = J(e.apicalDx, Ni, v), le(a.toothSelection) && a.apicalDx !== "symptomatic-apical-periodontitis" && a.apicalDx !== "asymptomatic-apical-periodontitis" && (a.periapicalType = "none"), a.endo = J(e.endo, Ai, a.endo), a.endo && a.endo !== "none" && (a.pulpDx !== "normal" || a.pulpLatin !== "none") && (a.pulpDx = "normal", a.pulpLatin = "none"), a.caries = o2(e.caries, Hl);
  const f = (l) => {
    if (typeof l == "number" && ka.has(l)) return l;
    if (typeof l == "string") {
      if (l === "surface" || l === "dentin" || l === "deep") return V0(l);
      const y = Number(l);
      if (ka.has(y)) return y;
    }
    return null;
  };
  a.cariesActiveDepth = f(e.cariesActiveDepth) ?? 2;
  const u = /* @__PURE__ */ new Map();
  if (e.cariesSeverity && typeof e.cariesSeverity == "object")
    for (const [l, y] of Object.entries(e.cariesSeverity)) {
      const I = typeof y == "number" ? y : typeof y == "string" ? Number(y) : NaN;
      Re.has(l) && $l.has(I) && u.set(l, I);
    }
  const m = /* @__PURE__ */ new Map();
  if (e.cariesDepths && typeof e.cariesDepths == "object")
    for (const [l, y] of Object.entries(e.cariesDepths)) {
      const I = f(y);
      Re.has(l) && I !== null && m.set(l, I);
    }
  const b = /* @__PURE__ */ new Map();
  if (e.secondaryCaries && typeof e.secondaryCaries == "object")
    for (const [l, y] of Object.entries(e.secondaryCaries)) {
      const I = typeof y == "number" ? y : typeof y == "string" ? Number(y) : NaN;
      Re.has(l) && Wl.has(I) && b.set(l, I);
    }
  if (a.rootCaries = J(e.rootCaries, _i, "none"), a.periImplant = J(e.periImplant, Vi, "none"), a.toothSelection === "implant" && a.periImplant === "none" && (a.mods.has("inflammation") && (a.periImplant = "mucositis", a.mods.delete("inflammation")), a.mods.has("parodontal") && (a.periImplant = "mucositis", a.mods.delete("parodontal"))), a.radiographicDepth = /* @__PURE__ */ new Map(), e.radiographicDepth && typeof e.radiographicDepth == "object")
    for (const [l, y] of Object.entries(e.radiographicDepth))
      Re.has(l) && typeof y == "string" && Jl.has(y) && a.radiographicDepth.set(l, y);
  if (a.fillingDefect = /* @__PURE__ */ new Map(), e.fillingDefect && typeof e.fillingDefect == "object")
    for (const [l, y] of Object.entries(e.fillingDefect))
      Re.has(l) && typeof y == "string" && Yl.has(y) && a.fillingDefect.set(l, y);
  a.fillingMaterial = J(e.fillingMaterial, Sa, a.fillingMaterial), a.fillingSurfaces = o2(e.fillingSurfaces, Re), a.fillingSurfaceMaterials = /* @__PURE__ */ new Map();
  const k = e.fillingSurfaceMaterials;
  if (k && typeof k == "object")
    for (const [l, y] of Object.entries(k))
      Re.has(l) && typeof y == "string" && Sa.has(y) && y !== "none" && a.fillingSurfaceMaterials.set(l, y);
  else if (a.fillingMaterial !== "none" && a.fillingSurfaces.size > 0)
    for (const l of a.fillingSurfaces)
      a.fillingSurfaceMaterials.set(l, a.fillingMaterial);
  a.fillingSurfaces = new Set(a.fillingSurfaceMaterials.keys()), a.cariesSeverity = /* @__PURE__ */ new Map();
  const g = /* @__PURE__ */ new Set([
    ...u.keys(),
    ...m.keys(),
    ...b.keys()
  ]);
  for (const l of a.fillingSurfaceMaterials.keys())
    t && a.caries.has("caries-" + l) && g.add(l);
  for (const l of g) {
    if (u.has(l)) {
      a.cariesSeverity.set(l, u.get(l));
      continue;
    }
    a.fillingSurfaceMaterials.has(l) ? b.has(l) ? a.cariesSeverity.set(l, b.get(l)) : m.has(l) ? a.cariesSeverity.set(l, m.get(l)) : t && a.caries.has("caries-" + l) && a.cariesSeverity.set(l, 3) : m.has(l) && a.cariesSeverity.set(l, m.get(l));
  }
  for (const l of a.fillingSurfaceMaterials.keys())
    a.caries.has("caries-" + l) && a.cariesSeverity.get(l) === 0 && (a.caries.delete("caries-" + l), a.cariesSeverity.delete(l));
  a.fissureSealing = !!e.fissureSealing, a.calculus = !!e.calculus, a.contactMesial = !!e.contactMesial, a.contactDistal = !!e.contactDistal;
  const D = e.bruxismWear ? "attrition" : "none";
  a.wearEdge = J(e.wearEdge, Gi, D);
  const r = e.bruxismNeckWear ? "abrasion" : "none";
  if (a.wearCervical = J(e.wearCervical, Ui, r), a.discoloration = J(e.discoloration, ji, "none"), a.orthoAppliance = J(e.orthoAppliance, Fi, "none"), a.orthoDrift = J(e.orthoDrift, Ki, "none"), a.orthoVertical = J(e.orthoVertical, Bi, "none"), a.orthoRotation = e.orthoRotation === !0, a.brokenMesial = !!e.brokenMesial, a.brokenIncisal = !!e.brokenIncisal, a.brokenDistal = !!e.brokenDistal, a.extractionWound = !!e.extractionWound, a.extractionPlan = !!e.extractionPlan, a.parapulpalPin = !!e.parapulpalPin, a.crownReplace = !!e.crownReplace, a.crownNeeded = !!e.crownNeeded, a.missingClosed = !!e.missingClosed, a.bridgePillar = !!e.bridgePillar, a.prosthesis = J(e.prosthesis, Ul, "none"), a.mobility = J(e.mobility, jl, a.mobility), a.toothSubstrate = J(e.toothSubstrate, Fl, a.toothSubstrate), a.restorationType = J(e.restorationType, Kl, a.restorationType), a.restorationMaterial = J(e.restorationMaterial, Bl, a.restorationMaterial), a.toothSubstrate === "radix" && a.restorationType !== "none" && (a.restorationType = "none", a.restorationMaterial = "none"), !g2(a.restorationType, a.restorationMaterial, "occlusal")) {
    const l = nt[a.restorationType];
    l && l.materials.length > 0 ? a.restorationMaterial = l.materials[0] : (a.restorationType = "none", a.restorationMaterial = "none");
  }
  if ((a.restorationType === "crown" || a.restorationType === "bridge") && a.prosthesis !== "none" && (a.prosthesis = "none"), a.crownLeakage = !!e.crownLeakage, typeof e.note == "string" && (a.note = e.note), e.customStates && typeof e.customStates == "object") {
    const l = new Set(Zt.map((y) => y.id));
    for (const [y, I] of Object.entries(e.customStates))
      l.has(y) && (a.customStates[y] = I);
  }
  return a;
}
function Hi() {
  const e = {};
  for (const t of B) {
    const a = E.get(t) ?? ee();
    e[t] = Rl(a);
  }
  return {
    version: "2.10",
    globals: {
      wisdomVisible: St,
      showBase: zt,
      occlusalVisible: ot,
      showHealthyPulp: $e,
      edentulous: Le
    },
    teeth: e
  };
}
function Wi(e, t) {
  const a = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), i = URL.createObjectURL(a), o = document.createElement("a"), s = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "-");
  o.href = i, o.download = `${t}-${s}.json`, document.body.appendChild(o), o.click(), o.remove(), URL.revokeObjectURL(i);
}
function za(e, t) {
  const a = document.createElement("a");
  a.href = e, a.download = t, document.body.appendChild(a), a.click(), a.remove();
}
let Ae = null, st = !1;
function $i() {
  if (Ae) return;
  const e = C("div", { class: "odon-export-card" }, [
    C("div", { class: "odon-export-title", text: p("export.progress.title") }),
    C("div", { class: "odon-export-pct", id: "odonExportPct", text: "0%" }),
    C("div", { class: "odon-export-phase", id: "odonExportPhase", text: p("export.progress.preparing") })
  ]);
  Ae = C("div", { class: "odon-export-overlay", role: "status", "aria-live": "polite" }, [e]), document.body.appendChild(Ae);
}
function Be(e, t) {
  const a = Math.max(0, Math.min(100, Math.round(e))), i = Ae?.querySelector("#odonExportPct"), o = Ae?.querySelector("#odonExportPhase");
  i && (i.textContent = `${a}%`), o && (o.textContent = p(t));
}
function Ji() {
  Ae && (Ae.remove(), Ae = null);
}
const gt = "http://www.w3.org/2000/svg";
function Yi(e, t) {
  const a = Array.from(e.children), i = Array.from(t.children);
  for (let o = 0; o < a.length; o++) {
    const s = a[o], c = i[o];
    if (!c) continue;
    const v = window.getComputedStyle(s), f = v.opacity !== "" && Number(v.opacity) === 0;
    v.display === "none" || v.visibility === "hidden" || f ? c.remove() : Yi(s, c);
  }
}
function Ql(e, t) {
  const a = (s) => s.replace(/url\(#([^)]+)\)/g, (c, v) => `url(#${t}${v})`), i = ["fill", "stroke", "clip-path", "mask", "filter"];
  e.querySelectorAll("[id]").forEach((s) => {
    const c = s.getAttribute("id");
    c && s.setAttribute("id", t + c);
  });
  const o = [e, ...Array.from(e.querySelectorAll("*"))];
  for (const s of o) {
    for (const f of i) {
      const u = s.getAttribute(f);
      u && u.includes("url(#") && s.setAttribute(f, a(u));
    }
    const c = s.getAttribute("style");
    c && c.includes("url(#") && s.setAttribute("style", a(c));
    const v = s.getAttribute("href") ?? s.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    v && v.startsWith("#") && (s.setAttribute("href", "#" + t + v.slice(1)), s.removeAttributeNS("http://www.w3.org/1999/xlink", "href"));
  }
}
function qi() {
  const e = document.querySelector("#toothGrid, .tooth-grid");
  if (!e) return null;
  const t = e.getBoundingClientRect(), a = Math.max(1, Math.round(t.width)), i = Math.max(1, Math.round(t.height)), o = document.createElementNS(gt, "svg");
  o.setAttribute("xmlns", gt), o.setAttribute("width", String(a)), o.setAttribute("height", String(i)), o.setAttribute("viewBox", `0 0 ${a} ${i}`);
  const s = document.createElementNS(gt, "rect");
  s.setAttribute("x", "0"), s.setAttribute("y", "0"), s.setAttribute("width", String(a)), s.setAttribute("height", String(i)), s.setAttribute("fill", "#ffffff"), o.appendChild(s);
  let c = 0;
  e.querySelectorAll(".tooth-svg > svg").forEach((u) => {
    const m = u.getBoundingClientRect();
    if (m.width === 0 || m.height === 0) return;
    const b = u.cloneNode(!0);
    Yi(u, b), Ql(b, `t${c++}-`);
    const k = document.createElementNS(gt, "svg");
    k.setAttribute("x", String(m.left - t.left)), k.setAttribute("y", String(m.top - t.top)), k.setAttribute("width", String(m.width)), k.setAttribute("height", String(m.height));
    const g = u.getAttribute("viewBox");
    for (g && k.setAttribute("viewBox", g), k.setAttribute("preserveAspectRatio", "xMidYMid meet"); b.firstChild; ) k.appendChild(b.firstChild);
    o.appendChild(k);
  });
  const v = Ka(c2);
  if (v.length) {
    const m = Ba(v, c2, (b) => _a(e, t, b), y2);
    for (const b of m) o.appendChild(Va(b));
  }
  return e.querySelectorAll(".tooth-label-cell").forEach((u) => {
    const m = (u.textContent || "").trim();
    if (!m) return;
    const b = u.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    const k = window.getComputedStyle(u), g = document.createElementNS(gt, "text");
    g.setAttribute("x", String(b.left - t.left + b.width / 2)), g.setAttribute("y", String(b.top - t.top + b.height / 2)), g.setAttribute("text-anchor", "middle"), g.setAttribute("dominant-baseline", "central"), g.setAttribute("font-family", k.fontFamily), g.setAttribute("font-size", k.fontSize), g.setAttribute("font-weight", k.fontWeight), g.setAttribute("fill", k.color), g.textContent = m, o.appendChild(g);
  }), { xml: `<?xml version="1.0" encoding="UTF-8"?>
${new XMLSerializer().serializeToString(o)}`, width: a, height: i };
}
async function es() {
  if (!st) {
    st = !0, $i(), Be(30, "export.progress.preparing");
    try {
      const e = qi();
      if (!e) throw new Error("Odontogram grid not found");
      Be(90, "export.progress.encoding");
      const t = new Blob([e.xml], { type: "image/svg+xml;charset=utf-8" }), a = URL.createObjectURL(t), i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "-"), o = document.createElement("a");
      o.href = a, o.download = `odontogram-${i}.svg`, document.body.appendChild(o), o.click(), o.remove(), URL.revokeObjectURL(a), Be(100, "export.progress.done"), await new Promise((s) => window.setTimeout(s, 300));
    } finally {
      Ji(), st = !1;
    }
  }
}
async function Za(e = "png") {
  if (!st) {
    st = !0, $i(), Be(10, "export.progress.preparing");
    try {
      const t = qi();
      if (!t) throw new Error("Odontogram grid not found");
      Be(40, "export.progress.rendering");
      const a = 2, i = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(t.xml), o = new Image();
      await new Promise((f, u) => {
        o.onload = () => f(), o.onerror = () => u(new Error("SVG rasterization failed")), o.src = i;
      });
      const s = document.createElement("canvas");
      s.width = t.width * a, s.height = t.height * a;
      const c = s.getContext("2d");
      if (!c) throw new Error("Canvas 2D context unavailable");
      c.fillStyle = "#ffffff", c.fillRect(0, 0, s.width, s.height), c.drawImage(o, 0, 0, s.width, s.height), Be(90, "export.progress.encoding");
      const v = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "-");
      e === "jpg" ? za(s.toDataURL("image/jpeg", 0.92), `odontogram-${v}.jpg`) : za(s.toDataURL("image/png"), `odontogram-${v}.png`), Be(100, "export.progress.done"), await new Promise((f) => window.setTimeout(f, 300));
    } finally {
      Ji(), st = !1;
    }
  }
}
function ts() {
  Wi(Hi(), "odontogram-status");
}
function as(e) {
  const t = Zo(Hi(), e);
  Wi(t, "odontogram-fhir");
}
function Xi(e) {
  if (!e || typeof e != "object") return;
  const t = ql(e.version), a = e.teeth || {};
  for (const i of B) {
    const o = a[i];
    E.set(i, Xl(o, t)), ne(i), ge(i), Ct(i);
  }
  e.globals && (typeof e.globals.wisdomVisible == "boolean" && Li(e.globals.wisdomVisible), typeof e.globals.showBase == "boolean" && Pi(e.globals.showBase), typeof e.globals.occlusalVisible == "boolean" && A2(e.globals.occlusalVisible), typeof e.globals.showHealthyPulp == "boolean" && T2(e.globals.showHealthyPulp), typeof e.globals.edentulous == "boolean" && (Le = e.globals.edentulous, ct(n("#btnEdentulous"), Le))), Qt(), fe(), me();
}
function is(e) {
  let t = e;
  if (typeof e == "string")
    try {
      t = JSON.parse(e);
    } catch (i) {
      console.error("Invalid FHIR JSON", i);
      return;
    }
  const a = Do(t);
  Xi(a);
}
function os(e) {
  if (!e) return;
  const t = ba(), a = (f) => t?.[f] || [], i = (f) => t?.wisdom?.[f] || [], o = (f, u) => {
    for (const m of f) {
      const b = E.get(m) ?? ee(), k = u(b, m) || b;
      E.set(m, k), ne(m), ge(m);
    }
    w && $(E.get(w)), Qt();
  }, s = (f) => f === "metal" ? "metal-ceramic" : f, c = (f, u) => {
    f.toothSubstrate = "crownprep", f.restorationType = "crown", f.restorationMaterial = s(u), f.bridgePillar = !0, f.brokenMesial = !1, f.brokenIncisal = !1, f.brokenDistal = !1;
  }, v = (f, u) => {
    f.restorationType = "bridge", f.restorationMaterial = s(u);
  };
  if (e.type === "span") {
    o(e.teeth || [], (f) => {
      f.toothSelection === "tooth-base" ? c(f, e.material) : f.toothSelection === "none" && v(f, e.material);
    }), me();
    return;
  }
  if (e.type === "arch-bridge") {
    const f = a(e.arch), u = new Set(i(e.arch)), m = f.filter((b) => E.get(b)?.toothSelection === "tooth-base");
    if (m.length >= 2) {
      const b = m[0], k = m[m.length - 1], g = f.indexOf(b), D = f.indexOf(k), r = g < D ? f.slice(g + 1, D) : [];
      o(f, (l, y) => {
        u.has(y) || (l.toothSelection === "tooth-base" ? c(l, e.material) : l.toothSelection === "none" && r.includes(y) && v(l, e.missingMaterial || e.material));
      });
    } else
      o(f, (b, k) => {
        u.has(k) || b.toothSelection === "tooth-base" && c(b, e.material);
      });
    me();
    return;
  }
  if (e.type === "partial-removable") {
    const f = a(e.arch), u = new Set(i(e.arch));
    o(f, (m, b) => {
      u.has(b) || m.toothSelection === "none" && (m.prosthesis = "removable-partial");
    }), me();
    return;
  }
  if (e.type === "full-removable") {
    const f = a(e.arch), u = new Set(i(e.arch));
    o(f, (m, b) => {
      const k = ee();
      return k.toothSelection = "none", k.prosthesis = u.has(b) ? "none" : "removable-full", k;
    }), me();
    return;
  }
  if (e.type === "bar-denture") {
    const f = e.implants || [], u = e.missing || [], b = (e.arch ? ba()?.[e.arch] || [] : []).filter((k) => [7, 8].includes(k % 10));
    o(f, (k, g) => {
      const D = ee();
      return D.toothSelection = "implant", D.prosthesis = "bar-denture", D;
    }), o(u, (k, g) => {
      const D = ee();
      return D.toothSelection = "none", D.prosthesis = "bar-denture", D;
    }), o(b, (k, g) => {
      const D = ee();
      return D.toothSelection = "none", D;
    }), me();
  }
}
let Se = !1, h2 = !1, _e = 0;
async function Ia(e) {
  const t = await fetch(e);
  if (!t.ok) throw new Error(`SVG fetch failed: ${e}`);
  const a = await t.text(), s = new DOMParser().parseFromString(a, "image/svg+xml").documentElement;
  return y0(s), v0(s), s;
}
async function ls(e) {
  if (!Se || e !== _e) return;
  const t = n("#toothGrid");
  if (!t) return;
  t.innerHTML = "";
  const a = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), o = [11, 13, 14, 16], s = [14, 16];
  if (await Promise.all([
    ...o.map(async (l) => {
      a.set(l, await Ia(s0[l]));
    }),
    ...s.map(async (l) => {
      i.set(l, await Ia(n0[l]));
    })
  ]), !Se || e !== _e) return;
  function c({ toothNo: l, tplNo: y, rot: I, mirror: O, view: j, clickable: N }) {
    if (!Se || e !== _e) return;
    const P = j === "occl" ? i.get(y) : a.get(y);
    if (!P) return;
    const h = P.cloneNode(!0);
    I === 180 && b0(h), O && k0(h);
    const F = [
      "tooth-tile",
      `tpl-${y}`,
      l >= 31 ? "lower-row" : "upper-row",
      j === "occl" ? "occl-view" : "side-view"
    ], L = C("div", { class: F.join(" "), "data-tooth": String(l) }, [
      C("div", { class: "tooth-svg" })
    ]);
    n(".tooth-svg", L).appendChild(h), L.addEventListener("click", (M) => f2(l, M)), L.addEventListener("dblclick", () => {
      !Xe || te || Zi(l);
    }), L.addEventListener("keydown", (M) => Nl(l, M)), j === "side" && (L.setAttribute("role", "option"), L.setAttribute("aria-selected", "false"), L.setAttribute("tabindex", te ? "-1" : "0"), L.setAttribute("aria-label", We(l, ze))), pa() && Tl(L, l), t.appendChild(L), He.has(l) || He.set(l, []), He.get(l).push(h), pe.has(l) || pe.set(l, []), pe.get(l).push(L), E.has(l) || E.set(l, ee()), ne(l);
  }
  function v(l) {
    for (const y of l) {
      const I = ta.get(y), O = I ? I.tpl : 16;
      c({ toothNo: y, tplNo: O, rot: I?.rot ?? 0, mirror: I?.mirror ?? !1, view: "side", clickable: !0 });
    }
  }
  function f(l) {
    return [14, 15, 24, 25, 34, 35, 44, 45].includes(l) ? 14 : [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48].includes(l) ? 16 : null;
  }
  function u() {
    const l = C("div", { class: "tooth-tile occl-view placeholder" }, [
      C("div", { class: "tooth-svg" })
    ]);
    t.appendChild(l);
  }
  function m(l, y) {
    for (const I of l) {
      const O = ta.get(I), j = f(I);
      if (y.has(I) || !j || !O) {
        u();
        continue;
      }
      c({ toothNo: I, tplNo: j, rot: O.rot, mirror: O.mirror, view: "occl", clickable: !0 });
    }
  }
  function b(l, y) {
    const I = C("div", { class: "tooth-label-row", "aria-hidden": "true" });
    for (const O of l) {
      const j = C("div", { class: "tooth-label-cell", text: We(O, ze), tabindex: "-1" });
      j.addEventListener("click", (N) => f2(O, N)), I.appendChild(j), y.set(O, j);
    }
    t.appendChild(I);
  }
  const k = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], g = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], D = /* @__PURE__ */ new Set([13, 12, 11, 21, 22, 23]), r = /* @__PURE__ */ new Set([43, 42, 41, 31, 32, 33]);
  !Se || e !== _e || (b(k, Ht), v(k), m(k, D), m(g, r), v(g), b(g, Wt), t.setAttribute("role", "listbox"), t.setAttribute("aria-multiselectable", "true"), T = /* @__PURE__ */ new Set(), w = null, fe(), ie(), A2(ot), T2($e), pa() && (t.addEventListener("touchstart", Di, { passive: !1 }), t.addEventListener("touchmove", Ci, { passive: !1 }), t.addEventListener("touchend", Ei), Pl()));
}
let u2 = "status";
function Da(e) {
  u2 = e === "fhir" ? "fhir" : "status";
}
function ss() {
  if (document.addEventListener("click", ii), document.addEventListener("click", oi), h2) return;
  h2 = !0, ["btnOcclView", "btnWisdomVisible", "btnBoneVisible", "btnPulpVisible"].forEach((r) => {
    const l = n(`#${r}`);
    l && Z0(l).then(() => ai(l));
  }), X(n("#toothSelect"), di(), (r) => {
    G((l, y) => {
      if (r === "milktooth" && n2.has(y))
        return;
      const I = ee();
      I.toothSelection = r, ["tooth-base", "milktooth", "implant", "tooth-under-gum"].includes(r) || (I.extractionPlan = !1), r !== "none" && (I.extractionWound = !1), (r === "implant" || r === "none") && (I.caries.clear(), I.endo = "none", I.pulpDx = "normal", I.fillingMaterial = "none", I.fillingSurfaces.clear()), E.set(y, I);
    }), r !== "none" && Me(!1);
  }), X(n("#substrateSelect"), z2(), (r) => {
    G((l) => {
      l.toothSubstrate = r, r !== "broken" && (l.brokenMesial = !1, l.brokenIncisal = !1, l.brokenDistal = !1), (!["natural", "broken", "crownprep"].includes(r) || l.restorationType !== "none") && (l.crownNeeded = !1);
    }), Me(!1);
  });
  const t = w ? E.get(w) : null;
  X(n("#restorationSelect"), Z2("occlusal", { isImplant: t?.toothSelection === "implant", toothSelection: t?.toothSelection }), (r) => {
    const l = String(r);
    G((y) => {
      R0(y, l);
    }), Me(!1);
  });
  {
    const r = n("#pulpEndoSelect");
    r.addEventListener("change", () => {
      const l = r.value;
      G((y) => {
        nl(y, l);
      });
    });
  }
  X(n("#apicalDxSelect"), C2(), (r) => {
    G((l) => {
      l.apicalDx = r, r !== "symptomatic-apical-periodontitis" && r !== "asymptomatic-apical-periodontitis" && (l.periapicalType = "none");
    });
  }), n("#endoResection").addEventListener("change", (r) => {
    G((l) => {
      l.endoResection = r.target.checked;
    });
  }), n("#parapulpalPin").addEventListener("change", (r) => {
    G((l) => {
      l.parapulpalPin = r.target.checked;
    });
  }), X(n("#resorptionSelect"), E2(), (r) => {
    G((l) => {
      l.resorptionType = r;
    });
  }), X(n("#periImplantSelect"), Mi(), (r) => {
    G((l) => {
      cl(l, r);
    });
  }), n("#extractionWound").addEventListener("change", (r) => {
    G((l) => {
      l.extractionWound = r.target.checked;
    });
  }), n("#extractionPlan").addEventListener("change", (r) => {
    G((l) => {
      l.extractionPlan = r.target.checked;
    });
  }), n("#crownReplace").addEventListener("change", (r) => {
    G((l) => {
      l.crownReplace = r.target.checked;
    });
  }), n("#crownNeeded").addEventListener("change", (r) => {
    G((l) => {
      l.crownNeeded = r.target.checked;
    });
  }), n("#crownLeakage").addEventListener("change", (r) => {
    G((l) => {
      l.crownLeakage = r.target.checked;
    });
  }), n("#missingClosed").addEventListener("change", (r) => {
    G((l) => {
      l.missingClosed = r.target.checked;
    });
  }), X(n("#mobilitySelect"), D2(), (r) => {
    G((l) => {
      l.mobility = r;
    });
  }), ya(n("#modsChecks"), Ya, (r, l) => {
    G((y) => {
      l ? y.mods.add(r) : y.mods.delete(r);
    });
  }), X(n("#periapicalTypeSelect"), v2(), (r) => {
    G((l) => {
      l.periapicalType = r;
    });
  });
  const a = (r, l) => {
    G((y) => {
      l ? (y.caries.add(r), r !== "caries-subcrown" && y.cariesSeverity.set(r.replace("caries-", ""), y.cariesActiveDepth)) : (y.caries.delete(r), y.cariesSeverity.delete(r.replace("caries-", "")));
    });
  };
  va(n("#cariesChecks"), [
    { value: "caries-buccal", labelKey: "surface.buccal", letter: "B", pos: "buccal" },
    { value: "caries-mesial", labelKey: "surface.mesial", letter: "M", pos: "mesial" },
    { value: "caries-occlusal", labelKey: "surface.occlusal", letter: "O", pos: "occlusal" },
    { value: "caries-distal", labelKey: "surface.distal", letter: "D", pos: "distal" },
    { value: "caries-lingual", labelKey: "surface.lingualPalatal", letter: "L", pos: "lingual" }
  ], a), ae("#cariesChecks .surface-cell").forEach((r) => {
    const l = r.querySelector("input");
    if (!l) return;
    const y = String(l.value).replace("caries-", ""), I = C("span", { class: "surf-depth", title: p("caries.detailsHint") }, [C("i"), C("i"), C("i")]);
    I.addEventListener("click", (O) => {
      O.preventDefault(), O.stopPropagation(), !(!l.checked || te) && Ma(y, I, w);
    }), r.appendChild(I);
  }), ya(n("#cariesSubcrownRow"), [
    { value: "caries-subcrown", labelKey: "surface.subcrown" }
  ], a), X(n("#cariesDepthSelect"), Yt(), (r) => {
    G((l) => {
      l.cariesActiveDepth = Number(r);
    });
  }), X(n("#rootCariesSelect"), ui(), (r) => {
    G((l) => {
      l.rootCaries = r;
    });
  }), X(n("#fillingSelect"), S2(!1), (r) => {
    G((l) => {
      l.fillingMaterial = r, r === "none" && (l.fillingSurfaces.clear(), l.fillingSurfaceMaterials.clear());
    });
  }), va(n("#fillingSurfaceChecks"), [
    { value: "buccal", labelKey: "surface.buccal", letter: "B", pos: "buccal" },
    { value: "mesial", labelKey: "surface.mesial", letter: "M", pos: "mesial" },
    { value: "occlusal", labelKey: "surface.occlusal", letter: "O", pos: "occlusal" },
    { value: "distal", labelKey: "surface.distal", letter: "D", pos: "distal" },
    { value: "lingual", labelKey: "surface.lingualPalatal", letter: "L", pos: "lingual" }
  ], (r, l) => {
    G((y) => {
      l && y.fillingMaterial !== "none" ? (y.fillingSurfaces.add(r), y.fillingSurfaceMaterials.set(r, y.fillingMaterial)) : (y.fillingSurfaces.delete(r), y.fillingSurfaceMaterials.delete(r));
    });
  }), ae("#fillingSurfaceChecks .surface-cell").forEach((r) => {
    const l = r.querySelector("input");
    if (!l) return;
    const y = String(l.value), I = C("span", { class: "surf-depth", title: p("caries.recurrentHint") }, [C("i"), C("i"), C("i")]);
    I.addEventListener("click", (O) => {
      O.preventDefault(), O.stopPropagation(), !(!l.checked || te) && Ma(y, I, w);
    }), r.appendChild(I);
  }), ae("#fillingSurfaceChecks .surface-cell").forEach((r) => {
    const l = r.querySelector("input");
    if (!l) return;
    const y = String(l.value), I = C("span", { class: "surf-defect", title: p("fillingDefect.label") }, [C("i")]);
    I.addEventListener("click", (O) => {
      O.preventDefault(), O.stopPropagation(), !(!l.checked || te) && Ll(y, I, w);
    }), r.insertBefore(I, r.firstChild);
  }), n("#fissureSealing").addEventListener("change", (r) => {
    G((l) => {
      l.fissureSealing = r.target.checked;
    });
  }), n("#calculusToggle").addEventListener("change", (r) => {
    G((l) => {
      l.calculus = r.target.checked;
    });
  }), n("#contactMesial").addEventListener("change", (r) => {
    G((l) => {
      l.contactMesial = r.target.checked;
    });
  }), n("#contactDistal").addEventListener("change", (r) => {
    G((l) => {
      l.contactDistal = r.target.checked;
    });
  }), X(n("#wearEdgeSelect"), yi(), (r) => {
    G((l) => {
      l.wearEdge = r;
    });
  }), X(n("#wearCervicalSelect"), vi(), (r) => {
    G((l) => {
      l.wearCervical = r;
    });
  }), n("#wearEdgeToggle").addEventListener("change", (r) => {
    const l = r.target.checked;
    G((y) => {
      y.wearEdge = l ? "attrition" : "none";
    });
  }), n("#wearCervicalToggle").addEventListener("change", (r) => {
    const l = r.target.checked;
    G((y) => {
      y.wearCervical = l ? "abrasion" : "none";
    });
  }), X(n("#discolorationSelect"), bi(), (r) => {
    G((l) => {
      l.discoloration = r;
    });
  }), n("#discolorationToggle").addEventListener("change", (r) => {
    const l = r.target.checked;
    G((y) => {
      y.discoloration = l ? "other" : "none";
    });
  }), X(n("#orthoApplianceSelect"), ki(), (r) => {
    G((l) => {
      l.orthoAppliance = r;
    });
  }), X(n("#orthoDriftSelect"), xi(), (r) => {
    G((l) => {
      l.orthoDrift = r;
    });
  }), X(n("#orthoVerticalSelect"), wi(), (r) => {
    G((l) => {
      l.orthoVertical = r;
    });
  }), n("#orthoRotationToggle").addEventListener("change", (r) => {
    const l = r.target.checked;
    G((y) => {
      y.orthoRotation = l;
    });
  }), n("#bridgePillar").addEventListener("change", (r) => {
    G((l) => {
      l.bridgePillar = r.target.checked;
    });
  }), n("#brokenMesial").addEventListener("change", (r) => {
    G((l) => {
      l.brokenMesial = r.target.checked;
    });
  }), n("#brokenIncisal").addEventListener("change", (r) => {
    G((l) => {
      l.brokenIncisal = r.target.checked;
    });
  }), n("#brokenDistal").addEventListener("change", (r) => {
    G((l) => {
      l.brokenDistal = r.target.checked;
    });
  }), n("#btnResetTooth").addEventListener("click", () => {
    if (T.size !== 0) {
      Me(!1);
      for (const r of T)
        E.set(r, ee()), ne(r), ge(r);
      w && (Bt(!0), $(E.get(w)));
    }
  }), n("#btnResetAll").addEventListener("click", () => {
    Me(!1);
    for (const r of B)
      E.set(r, ee()), ne(r), ge(r);
    w && (Bt(!0), $(E.get(w)));
  }), n("#btnPrimaryDentition").addEventListener("click", () => {
    Me(!1), Fe = !0;
    for (const r of B) {
      const l = ee();
      c0.has(r) ? l.toothSelection = "milktooth" : l.toothSelection = "none", E.set(r, l), ne(r), ge(r);
    }
    Fe = !1, w && $(E.get(w));
  }), n("#btnMixedDentition").addEventListener("click", () => {
    Me(!1), Fe = !0;
    for (const r of B) {
      const l = ee();
      d0.has(r) ? l.toothSelection = "tooth-base" : p0.has(r) ? l.toothSelection = "milktooth" : f0.has(r) && (l.toothSelection = "none"), E.set(r, l), ne(r), ge(r);
    }
    Fe = !1, w && $(E.get(w));
  });
  const i = pi();
  if (i.length) {
    const r = i.map((l) => ({ value: l.id, label: l.label }));
    X(n("#statusExtraSelect"), r, () => {
    }), K(n("#statusExtraSelect"), r, r[0]?.value), n("#statusExtraApply").addEventListener("click", () => {
      const l = n("#statusExtraSelect").value, y = i.find((I) => I.id === l);
      os(y);
    });
  }
  n("#btnSelectAll").addEventListener("click", () => {
    T = new Set(B), w = B[0], ie();
  }), n("#btnSelectAllPresent").addEventListener("click", () => {
    const r = B.filter((l) => E.get(l)?.toothSelection !== "none");
    T = new Set(r), w = r[0] ?? null, ie();
  }), n("#btnSelectPermanent").addEventListener("click", () => {
    const r = B.filter((l) => E.get(l)?.toothSelection === "tooth-base");
    T = new Set(r), w = r[0] ?? null, ie();
  }), n("#btnSelectMilk").addEventListener("click", () => {
    const r = B.filter((l) => E.get(l)?.toothSelection === "milktooth");
    T = new Set(r), w = r[0] ?? null, ie();
  }), n("#btnSelectImplants").addEventListener("click", () => {
    const r = B.filter((l) => E.get(l)?.toothSelection === "implant");
    T = new Set(r), w = r[0] ?? null, ie();
  }), n("#btnSelectAllMissing").addEventListener("click", () => {
    const r = B.filter((l) => E.get(l)?.toothSelection === "none");
    T = new Set(r), w = r[0] ?? null, ie();
  }), n("#btnSelectUpper").addEventListener("click", () => {
    T = new Set(B.filter((r) => r >= 11 && r <= 28)), w = 11, ie();
  }), n("#btnSelectUpperFront").addEventListener("click", () => {
    const r = [13, 12, 11, 21, 22, 23];
    T = new Set(r), w = r[0], ie();
  }), n("#btnSelectUpperMolar").addEventListener("click", () => {
    const r = [18, 17, 16, 26, 27, 28];
    T = new Set(r), w = r[0], ie();
  }), n("#btnSelectLower").addEventListener("click", () => {
    T = new Set(B.filter((r) => r >= 31 && r <= 48)), w = 31, ie();
  }), n("#btnSelectLowerFront").addEventListener("click", () => {
    const r = [43, 42, 41, 31, 32, 33];
    T = new Set(r), w = r[0], ie();
  }), n("#btnSelectLowerMolar").addEventListener("click", () => {
    const r = [38, 37, 36, 46, 47, 48];
    T = new Set(r), w = r[0], ie();
  }), n("#btnSelectNone").addEventListener("click", () => {
    T = /* @__PURE__ */ new Set(), w = null, fe();
  }), n("#btnSelectNoneChart").addEventListener("click", () => {
    T = /* @__PURE__ */ new Set(), w = null, fe();
  });
  const o = n("#statusCard"), s = n("#btnToggleStatusCard");
  o && s && Pe(s, "status.title", o.classList.contains("collapsed"));
  const c = n("#btnToggleControlsCard"), v = n("#controlsActions");
  c && v && Pe(c, "panel.controls", v.classList.contains("hidden")), [
    { card: "#cariesSection", btn: "#btnToggleCariesCard", labelKey: "caries.title" },
    { card: "#fillingSection", btn: "#btnToggleFillingCard", labelKey: "filling.title" },
    { card: "#rootPeriodontiumSection", btn: "#btnToggleRootPeriodontiumCard", labelKey: "card.rootPeriodontium" }
  ].forEach(({ card: r, btn: l, labelKey: y }) => {
    const I = n(r), O = n(l);
    !I || !O || Pe(O, y, I.classList.contains("collapsed"));
  });
  const f = n("#btnStatusExport"), u = n("#btnStatusFhirExport"), m = n("#btnStatusImport"), b = n("#statusImportInput");
  f && (f.onclick = () => ts()), u && (u.onclick = () => as());
  const k = n("#btnStatusPngExport"), g = n("#btnStatusJpgExport"), D = n("#btnStatusSvgExport");
  k && (k.onclick = () => {
    Za("png").catch((r) => console.error("PNG export failed", r));
  }), g && (g.onclick = () => {
    Za("jpg").catch((r) => console.error("JPG export failed", r));
  }), D && (D.onclick = () => {
    es().catch((r) => console.error("SVG export failed", r));
  }), m && b && (m.onclick = () => {
    b.value = "", b.click();
  }, b.onchange = async () => {
    const r = b.files?.[0];
    if (!r) return;
    const l = u2;
    try {
      const y = await r.text(), I = JSON.parse(y);
      l === "fhir" ? is(I) : Xi(I);
    } catch (y) {
      console.error("Odontogram import failed", y);
    } finally {
      b.value = "", u2 = "status";
    }
  });
}
function ns(e) {
  e !== ze && (ze = e, T0(), P2());
}
async function rs() {
  if (Se) return;
  Se = !0;
  const e = ++_e;
  if (ss(), await ls(e), !(!Se || e !== _e)) {
    if (vt || (vt = ho(() => wa())), wa(), w != null) {
      const t = E.get(w);
      t && $(t);
    }
    z0(), me();
  }
}
function cs() {
  if (!Se) return;
  Se = !1, _e++, h2 = !1, ei(), document.removeEventListener("click", ii), document.removeEventListener("click", oi), vt && (vt(), vt = null);
  const e = n("#toothGrid");
  e && (e.removeEventListener("touchstart", Di), e.removeEventListener("touchmove", Ci), e.removeEventListener("touchend", Ei), e.style.transform = "", e.classList.remove("odon-pinch-active", "odon-arch-upper", "odon-arch-lower"), e.innerHTML = ""), de && (de.remove(), de = null), ve(), De(), tt(), be && (clearTimeout(be), be = null), at = 1, It = !1, jt = "both", te = !1, Xe = !1, d2.clear();
  const t = n("#modsChecks");
  t && (t.innerHTML = "");
  const a = n("#cariesChecks");
  a && (a.innerHTML = "");
  const i = n("#cariesSubcrownRow");
  i && (i.innerHTML = "");
  const o = n("#fillingSurfaceChecks");
  o && (o.innerHTML = "");
  const s = n("#statusExtraSelect");
  s && (s.innerHTML = ""), E.clear(), He.clear(), pe.clear(), Ht.clear(), Wt.clear(), T = /* @__PURE__ */ new Set(), w = null;
}
function ds() {
  T = /* @__PURE__ */ new Set(), w = null, fe();
}
function ps(e) {
  Zt = [...e];
  for (const t of B)
    Si(t), Ye(t);
}
const it = ["buccal", "mesial", "occlusal", "distal", "lingual", "subcrown"];
function Ve(e, t) {
  return p2(e, t);
}
const Ca = {
  "endo-medical-filling": "endo.option.medicalFilling",
  "endo-filling": "endo.option.filling",
  "endo-filling-incomplete": "endo.option.incompleteFilling",
  "endo-glass-pin": "endo.option.glassPin",
  "endo-metal-pin": "endo.option.metalPin"
}, fs = {
  active: "rootCaries.active",
  arrested: "rootCaries.arrested",
  "active-cavitated": "rootCaries.activeCavitated"
};
function hs() {
  const e = (L) => We(M2(L), ze), t = [], a = [], i = [];
  let o = 0;
  const s = [], c = [], v = [], f = [], u = [], m = [], b = [], k = [], g = [];
  for (const L of B) {
    const M = E.get(L);
    if (!M) continue;
    const he = M.toothSelection;
    if (he === "none" ? a.push(L) : he === "implant" ? i.push(L) : he === "milktooth" ? o++ : t.push(L), M.caries && M.caries.size > 0) {
      const U = [], Y = [];
      for (const q of it) {
        if (!M.caries.has("caries-" + q)) continue;
        const ke = Ve(q, L);
        M.fillingSurfaceMaterials && M.fillingSurfaceMaterials.has(q) ? Y.push(ke) : U.push(ke);
      }
      const Q = [];
      if (U.length && Q.push(U.join(", ")), Y.length && Q.push(Y.join(", ") + " - " + p("toothInfo.secondary")), Q.length) {
        const q = ci(M);
        s.push(`${e(L)} (${Q.join("; ")})${q ? " – " + q : ""}`);
      }
    }
    if (M.rootCaries && M.rootCaries !== "none") {
      const U = fs[M.rootCaries];
      U && s.push(`${e(L)} (${p(U)})`);
    }
    if (M.radiographicDepth && M.radiographicDepth.size > 0) {
      const U = it.filter((Y) => M.radiographicDepth.has(Y)).map((Y) => `${Ve(Y, L)}: ${p("radiographicDepth." + M.radiographicDepth.get(Y))}`);
      U.length && s.push(`${e(L)} (${U.join(", ")})`);
    }
    if (M.fillingSurfaceMaterials && M.fillingSurfaceMaterials.size > 0) {
      const U = it.filter((Y) => M.fillingSurfaceMaterials.has(Y)).map((Y) => Ve(Y, L));
      if (U.length) {
        const Y = M.restorationType === "none" ? it.filter((q) => M.fillingDefect?.has(q) && M.fillingSurfaceMaterials.has(q)).map((q) => `${Ve(q, L)}: ${p("fillingDefect." + M.fillingDefect.get(q))}`) : [], Q = Y.length ? ` – ${p("fillingDefect.label")}: ${Y.join(", ")}` : "";
        c.push(`${e(L)} (${U.join(", ")})${Q}`);
      }
    }
    if (M.endo && M.endo !== "none" || M.endoResection) {
      let U = Ca[M.endo] ? p(Ca[M.endo]) : "";
      M.endo === "endo-resection" ? U = p("toothInfo.resected") : M.endoResection && (U = U ? `${U}, ${p("toothInfo.resected")}` : p("toothInfo.resected")), v.push(`${e(L)} (${U})`);
    }
    if (M.restorationType && M.restorationType !== "none" && f.push(`${e(L)}: ${si(M.restorationType, M.restorationMaterial)}`), M.prosthesis && M.prosthesis !== "none" && f.push(`${e(L)}: ${p(b2[M.prosthesis] || M.prosthesis)}`), M.crownLeakage && !I2(M) && (M.restorationType === "crown" || M.restorationType === "bridge") && f.push(`${e(L)} (${p("crownLeakage.label")})`), M.mods && (M.mods.has("inflammation") || M.mods.has("parodontal"))) {
      let U;
      M.periapicalType && M.periapicalType !== "none" ? U = p("periapical.type." + M.periapicalType) : M.mods.has("parodontal") ? U = p("mods.parodontal") : U = p("mods.periapicalInflammation"), u.push(`${e(L)} (${U})`);
    }
    const Ze = ri(M);
    if (Ze.length && m.push(`${e(L)} (${Ze.join("; ")})`), L2(M)) {
      const U = [];
      M.wearEdge !== "none" && U.push(`${p("tooth.bruxism.edgeWear")}: ${p("wearType." + M.wearEdge)}`), M.wearCervical !== "none" && U.push(`${p("tooth.bruxism.neckWear")}: ${p("wearType." + M.wearCervical)}`), U.length && b.push(`${e(L)} (${U.join(", ")})`);
    }
    if (qt(M) && M.discoloration !== "none" && k.push(`${e(L)} (${p("discoloration." + M.discoloration)})`), Xt(M)) {
      const U = [];
      M.orthoAppliance !== "none" && U.push(p("ortho.appliance." + M.orthoAppliance)), M.orthoDrift !== "none" && U.push(p("ortho.drift." + M.orthoDrift)), M.orthoVertical !== "none" && U.push(p("ortho.vertical." + M.orthoVertical)), M.orthoRotation === !0 && U.push(p("ortho.rotation.label")), U.length && g.push(`${e(L)} (${U.join(", ")})`);
    }
    M.calculus && u.push(`${e(L)} (${p("calculus.label")})`), M.mobility && M.mobility !== "none" && M.toothSelection !== "implant" && u.push(`${e(L)} (${p("inflammation.mobilityLabel")} ${p("mobility." + M.mobility)})`);
    {
      const U = ni(M);
      U && u.push(`${e(L)} (${U})`);
    }
  }
  const D = (L, M) => p(`${L}${M === 1 ? "One" : "Other"}`, { n: M }), r = D("toothInfo.milk", o), l = o > 0 ? p("toothInfo.milkFragment", { milk: r }) : "", y = D("toothInfo.present", t.length), I = D("toothInfo.missing", a.length);
  let O;
  t.length === 0 && i.length === 0 && o > 0 ? O = p("toothInfo.overviewMilkOnly", { milk: r }) : i.length > 0 ? O = p("toothInfo.overviewImplant", { present: y, milk: l, missing: I, implant: D("toothInfo.implant", i.length) }) : O = p("toothInfo.overview", { present: y, milk: l, missing: I });
  const j = t.length ? p("toothInfo.permanentList", { count: t.length, list: t.map(e).join(", ") }) : null, N = a.length ? p("toothInfo.missingList", { count: a.length, list: a.map(e).join(", ") }) : null, P = [
    { key: "caries", heading: p("toothInfo.caries"), items: s, emptyText: p("toothInfo.cariesEmpty") },
    { key: "fillings", heading: p("toothInfo.fillings"), items: c, emptyText: p("toothInfo.fillingsEmpty") },
    { key: "endo", heading: p("toothInfo.endo"), items: v, emptyText: p("toothInfo.endoEmpty") },
    { key: "diagnoses", heading: p("toothInfo.diagnoses"), items: m, emptyText: p("toothInfo.diagnosesEmpty") },
    { key: "wear", heading: p("toothInfo.wear"), items: b, emptyText: p("toothInfo.wearEmpty") },
    { key: "discoloration", heading: p("toothInfo.discoloration"), items: k, emptyText: p("toothInfo.discolorationEmpty") },
    { key: "orthodontics", heading: p("toothInfo.orthodontics"), items: g, emptyText: p("toothInfo.orthodonticsEmpty") },
    { key: "prosthetics", heading: p("toothInfo.prosthetics"), items: f, emptyText: p("toothInfo.prostheticsEmpty") }
  ], h = u.length ? p("toothInfo.periodontalInflamed", { list: u.join(", ") }) : p("toothInfo.periodontalHealthy"), F = i.length ? { heading: p("toothInfo.implants"), text: i.map(e).join(", ") } : null;
  return {
    overview: O,
    permanentList: j,
    missingList: N,
    sections: P,
    implants: F,
    periodontalTitle: p("toothInfo.periodontalTitle"),
    periodontalText: h
  };
}
function us(e) {
  te = e;
  const t = n("#toothGrid");
  t && t.classList.toggle("read-only", te);
  const a = n(".panel");
  a && a.classList.toggle("read-only", te), ae(".tooth-tile[role='option']").forEach((i) => {
    i.setAttribute("tabindex", te ? "-1" : "0");
  });
}
function Ea(e) {
  Xe = e;
  for (const t of B)
    Ye(t), Ct(t);
}
const yt = [
  { selector: "#toothGrid, .tooth-grid", titleKey: "intro.step1.title", textKey: "intro.step1.text" },
  { selector: "#cariesSection", titleKey: "intro.step2.title", textKey: "intro.step2.text" },
  { selector: "#pulpEndoSelect", titleKey: "intro.step3.title", textKey: "intro.step3.text" },
  { selector: "#toothSelect", titleKey: "intro.step4.title", textKey: "intro.step4.text" },
  { selector: "#fillingSection", titleKey: "intro.step5.title", textKey: "intro.step5.text" },
  { selector: "#crownSelect", titleKey: "intro.step6.title", textKey: "intro.step6.text" },
  { selector: "#toothGrid, .tooth-grid", titleKey: "intro.step7.title", textKey: "intro.step7.text" },
  { selector: "#btnSelectUpper", titleKey: "intro.step8.title", textKey: "intro.step8.text" },
  { selector: ".topbar-actions", titleKey: "intro.step9.title", textKey: "intro.step9.text" },
  { selector: "#btnExportMenu", titleKey: "intro.step10.title", textKey: "intro.step10.text" },
  { selector: "#btnImportMenu", titleKey: "intro.step11.title", textKey: "intro.step11.text" },
  { selector: ".topbar-actions", titleKey: "intro.step12.title", textKey: "intro.step12.text" }
];
function Vt(e) {
  return Math.max(0, Math.min(yt.length - 1, e));
}
let kt = [], oe = 0, xt = null;
function Ft() {
  for (const e of kt) e.remove();
  kt = [], xt && (document.removeEventListener("keydown", xt), xt = null);
}
function ye(e, t, a) {
  const i = document.createElement(e);
  return i.className = t, a !== void 0 && (i.textContent = a), i;
}
function wt() {
  Ft();
  const e = yt[oe], t = document.querySelector(e.selector), a = ye("div", "odon-tour-backdrop");
  document.body.appendChild(a), kt.push(a);
  const i = ye("div", "odon-tour-card"), o = ye("div", "odon-tour-title", p(e.titleKey)), s = ye("div", "odon-tour-text", p(e.textKey)), c = ye("div", "odon-tour-counter", `${oe + 1} / ${yt.length}`), v = ye("div", "odon-tour-actions"), f = ye("button", "odon-tour-btn odon-tour-skip", p("intro.skip")), u = ye("button", "odon-tour-btn", p("intro.back")), m = ye("button", "odon-tour-btn odon-tour-next", oe === yt.length - 1 ? p("intro.finish") : p("intro.next"));
  if (f.onclick = Ft, u.onclick = () => {
    oe = Vt(oe - 1), wt();
  }, m.onclick = () => {
    oe === yt.length - 1 ? Ft() : (oe = Vt(oe + 1), wt());
  }, u.disabled = oe === 0, v.append(f, u, m), i.append(c, o, s, v), document.body.appendChild(i), kt.push(i), t) {
    t.scrollIntoView({ block: "center", inline: "center" });
    const b = t.getBoundingClientRect(), k = ye("div", "odon-tour-highlight");
    k.style.left = `${b.left - 6}px`, k.style.top = `${b.top - 6}px`, k.style.width = `${b.width + 12}px`, k.style.height = `${b.height + 12}px`, document.body.appendChild(k), kt.push(k);
    const g = Math.min(b.bottom + 12, window.innerHeight - 220), D = Math.min(Math.max(8, b.left), window.innerWidth - 320);
    i.style.top = `${Math.max(8, g)}px`, i.style.left = `${D}px`;
  } else
    i.classList.add("odon-tour-card-center");
}
function ms() {
  oe = 0, xt = (e) => {
    e.key === "Escape" ? Ft() : e.key === "ArrowRight" ? (oe = Vt(oe + 1), wt()) : e.key === "ArrowLeft" && (oe = Vt(oe - 1), wt());
  }, document.addEventListener("keydown", xt), wt();
}
const gs = [
  { value: "FDI", labelKey: "numbering.fdi" },
  { value: "UNIVERSAL", labelKey: "numbering.universal" },
  { value: "PALMER", labelKey: "numbering.palmer" }
], ys = [
  { value: "hu", labelKey: "language.hu" },
  { value: "en", labelKey: "language.en" },
  { value: "de", labelKey: "language.de" },
  { value: "es", labelKey: "language.es" },
  { value: "it", labelKey: "language.it" },
  { value: "sk", labelKey: "language.sk" },
  { value: "pl", labelKey: "language.pl" },
  { value: "ru", labelKey: "language.ru" },
  { value: "pt-br", labelKey: "language.pt-br" }
], vs = [
  { value: "simple", labelKey: "settings.secondaryCaries.simple" },
  { value: "standard", labelKey: "settings.secondaryCaries.standard" },
  { value: "full", labelKey: "settings.secondaryCaries.full" }
], bs = [
  { value: "simple", labelKey: "settings.rootCaries.simple" },
  { value: "severity", labelKey: "settings.rootCaries.severity" }
], ks = [
  { value: "off", labelKey: "settings.radiographic.off" },
  { value: "threeLevel", labelKey: "settings.radiographic.threeLevel" },
  { value: "detailed", labelKey: "settings.radiographic.detailed" }
], xs = [
  { value: "simple", labelKey: "pulp.level.simple" },
  { value: "aae", labelKey: "pulp.level.aae" },
  { value: "latin", labelKey: "pulp.level.latin" }
], La = [
  { value: "complex", labelKey: "settings.toothDetail.complex" },
  { value: "simple", labelKey: "settings.toothDetail.simple" }
], ws = [
  { value: "full", labelKey: "settings.surfaceNotation.full" },
  { value: "simple", labelKey: "settings.surfaceNotation.simple" }
];
function Qi({
  t: e,
  label: t,
  descKey: a,
  children: i
}) {
  const o = Ta();
  return /* @__PURE__ */ x("div", { className: "odon-settings-row", children: [
    /* @__PURE__ */ x("div", { className: "odon-settings-row-text", children: [
      /* @__PURE__ */ d("div", { className: "odon-settings-row-label", children: t }),
      /* @__PURE__ */ d("div", { className: "odon-settings-row-desc", id: o, children: e(a) })
    ] }),
    /* @__PURE__ */ d("div", { className: "odon-settings-row-control", "data-desc": o, children: i })
  ] });
}
function we({
  t: e,
  label: t,
  descKey: a,
  value: i,
  options: o,
  onChange: s
}) {
  return /* @__PURE__ */ d(Qi, { t: e, label: t, descKey: a, children: /* @__PURE__ */ d(
    "select",
    {
      className: "odon-settings-select",
      "aria-label": t,
      value: i,
      onChange: (c) => s(c.target.value),
      children: o.map((c) => /* @__PURE__ */ d("option", { value: c.value, children: e(c.labelKey) }, c.value))
    }
  ) });
}
function Ge({
  t: e,
  label: t,
  descKey: a,
  checked: i,
  onChange: o
}) {
  return /* @__PURE__ */ d(Qi, { t: e, label: t, descKey: a, children: /* @__PURE__ */ x("label", { className: "odon-settings-switch", children: [
    /* @__PURE__ */ d(
      "input",
      {
        type: "checkbox",
        "aria-label": t,
        checked: i,
        onChange: (s) => o(s.target.checked)
      }
    ),
    /* @__PURE__ */ d("span", { className: "odon-settings-switch-track", "aria-hidden": "true" })
  ] }) });
}
const Ue = [
  {
    id: "general",
    titleKey: "settings.tab.general",
    render: ({ t: e, s: t }) => /* @__PURE__ */ x(Nt, { children: [
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("numbering.label"),
          descKey: "settings.numbering.desc",
          value: t.numbering,
          options: gs,
          onChange: t.onNumbering
        }
      ),
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("language.label"),
          descKey: "settings.language.desc",
          value: t.language,
          options: ys,
          onChange: t.onLanguage
        }
      ),
      /* @__PURE__ */ d(
        Ge,
        {
          t: e,
          label: e("settings.theme.label"),
          descKey: "settings.theme.desc",
          checked: t.isDark,
          onChange: () => t.onToggleDark()
        }
      ),
      /* @__PURE__ */ d(
        Ge,
        {
          t: e,
          label: e("settings.toothInfo"),
          descKey: "settings.toothInfo.desc",
          checked: t.toothInfo,
          onChange: t.onToothInfo
        }
      ),
      /* @__PURE__ */ d("div", { className: "odon-settings-row odon-settings-row-disabled", "aria-disabled": "true", children: /* @__PURE__ */ x("div", { className: "odon-settings-row-text", children: [
        /* @__PURE__ */ x("div", { className: "odon-settings-row-label", children: [
          e("settings.exportImport.title"),
          " ",
          /* @__PURE__ */ d("span", { className: "odon-settings-badge", children: e("settings.comingSoon") })
        ] }),
        /* @__PURE__ */ d("div", { className: "odon-settings-row-desc", children: e("settings.exportImport.desc") })
      ] }) })
    ] })
  },
  {
    id: "panels",
    titleKey: "settings.tab.panels",
    render: ({ t: e, s: t }) => /* @__PURE__ */ x(Nt, { children: [
      /* @__PURE__ */ d(
        Ge,
        {
          t: e,
          label: e("settings.panels.statuses"),
          descKey: "settings.panels.statuses.desc",
          checked: t.showStatusCard,
          onChange: t.onShowStatusCard
        }
      ),
      /* @__PURE__ */ d(
        Ge,
        {
          t: e,
          label: e("settings.panels.orthodontics"),
          descKey: "settings.panels.orthodontics.desc",
          checked: t.showOrthoCard,
          onChange: t.onShowOrthoCard
        }
      )
    ] })
  },
  {
    id: "toothDetails",
    titleKey: "settings.tab.toothDetails",
    render: ({ t: e, s: t }) => /* @__PURE__ */ x(Nt, { children: [
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("settings.wearDetail.label"),
          descKey: "settings.wearDetail.desc",
          value: t.wearDetailLevel,
          options: La,
          onChange: t.onWearDetailLevel
        }
      ),
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("settings.discolorationDetail.label"),
          descKey: "settings.discolorationDetail.desc",
          value: t.discolorationDetailLevel,
          options: La,
          onChange: t.onDiscolorationDetailLevel
        }
      ),
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("settings.surfaceNotation.label"),
          descKey: "settings.surfaceNotation.desc",
          value: t.surfaceNotation,
          options: ws,
          onChange: t.onSurfaceNotation
        }
      )
    ] })
  },
  {
    id: "caries",
    titleKey: "settings.tab.caries",
    render: ({ t: e, s: t }) => /* @__PURE__ */ x(Nt, { children: [
      /* @__PURE__ */ d(
        Ge,
        {
          t: e,
          label: e("icdas.enable"),
          descKey: "settings.icdas.desc",
          checked: t.icdas,
          onChange: t.onIcdas
        }
      ),
      /* @__PURE__ */ d(
        Ge,
        {
          t: e,
          label: e("settings.cariesDepth.label"),
          descKey: "settings.cariesDepth.desc",
          checked: t.cariesDepth,
          onChange: t.onCariesDepth
        }
      ),
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("caries.rootLabel"),
          descKey: "settings.rootCaries.desc",
          value: t.rootCariesMode,
          options: bs,
          onChange: t.onRootCariesMode
        }
      ),
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("caries.secondaryLabel"),
          descKey: "settings.secondaryCaries.desc",
          value: t.secondaryCariesMode,
          options: vs,
          onChange: t.onSecondaryCariesMode
        }
      ),
      /* @__PURE__ */ d(
        we,
        {
          t: e,
          label: e("caries.radiographicLabel"),
          descKey: "settings.radiographic.desc",
          value: t.radiographicDepthMode,
          options: ks,
          onChange: t.onRadiographicDepthMode
        }
      )
    ] })
  },
  {
    id: "pulpa",
    titleKey: "settings.tab.pulpa",
    render: ({ t: e, s: t }) => /* @__PURE__ */ d(
      we,
      {
        t: e,
        label: e("pulp.level.label"),
        descKey: "settings.pulpLevel.desc",
        value: t.pulpLevel,
        options: xs,
        onChange: t.onPulpLevel
      }
    )
  },
  {
    id: "notes",
    titleKey: "settings.tab.notes",
    render: ({ t: e, s: t }) => /* @__PURE__ */ d(
      Ge,
      {
        t: e,
        label: e("settings.notes"),
        descKey: "settings.notes.desc",
        checked: t.notes,
        onChange: t.onNotes
      }
    )
  }
], Pa = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function Ms({
  open: e,
  onClose: t,
  t: a,
  settings: i
}) {
  const [o, s] = H(Ue[0].id), c = je(null), v = je(null), f = je(null), u = Ta();
  W(() => {
    if (!e) return;
    f.current = document.activeElement ?? null;
    const g = c.current;
    return (g?.querySelector(Pa) ?? g)?.focus(), () => {
      f.current?.focus?.();
    };
  }, [e]);
  const m = l2(
    (g) => {
      if (g.key === "Escape") {
        g.stopPropagation(), t();
        return;
      }
      if (g.key !== "Tab") return;
      const D = c.current;
      if (!D) return;
      const r = Array.from(D.querySelectorAll(Pa)).filter(
        (O) => O.offsetParent !== null || O === document.activeElement
      );
      if (r.length === 0) return;
      const l = r[0], y = r[r.length - 1], I = document.activeElement;
      g.shiftKey && I === l ? (g.preventDefault(), y.focus()) : !g.shiftKey && I === y && (g.preventDefault(), l.focus());
    },
    [t]
  ), b = l2(
    (g) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(g.key)) return;
      g.preventDefault();
      const r = Ue.length;
      if (r === 0) return;
      const l = Ue.findIndex((j) => j.id === o), y = l < 0 ? 0 : l;
      let I = y;
      g.key === "Home" ? I = 0 : g.key === "End" ? I = r - 1 : g.key === "ArrowRight" || g.key === "ArrowDown" ? I = (y + 1) % r : (g.key === "ArrowLeft" || g.key === "ArrowUp") && (I = (y - 1 + r) % r);
      const O = Ue[I];
      O && (O.id !== o && s(O.id), v.current?.querySelector(`#odon-settings-tab-${O.id}`)?.focus());
    },
    [o]
  );
  if (!e) return null;
  const k = Ue.find((g) => g.id === o) ?? Ue[0];
  return /* @__PURE__ */ d(
    "div",
    {
      className: "odon-settings-backdrop",
      onMouseDown: (g) => {
        g.target === g.currentTarget && t();
      },
      children: /* @__PURE__ */ x(
        "div",
        {
          ref: c,
          className: "odon-settings-modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": u,
          tabIndex: -1,
          onKeyDown: m,
          children: [
            /* @__PURE__ */ x("div", { className: "odon-settings-header", children: [
              /* @__PURE__ */ d("h2", { className: "odon-settings-title", id: u, children: a("settings.title") }),
              /* @__PURE__ */ d(
                "button",
                {
                  type: "button",
                  className: "odon-settings-close",
                  onClick: t,
                  "aria-label": a("settings.close"),
                  title: a("settings.close"),
                  children: /* @__PURE__ */ d(
                    "svg",
                    {
                      width: "18",
                      height: "18",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ d("path", { d: "M18 6 6 18M6 6l12 12" })
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ x("div", { className: "odon-settings-body", children: [
              /* @__PURE__ */ d(
                "div",
                {
                  ref: v,
                  className: "odon-settings-tabs",
                  role: "tablist",
                  "aria-label": a("settings.title"),
                  onKeyDown: b,
                  children: Ue.map((g) => /* @__PURE__ */ d(
                    "button",
                    {
                      type: "button",
                      role: "tab",
                      id: `odon-settings-tab-${g.id}`,
                      "aria-selected": g.id === o,
                      "aria-controls": `odon-settings-panel-${g.id}`,
                      tabIndex: g.id === o ? 0 : -1,
                      className: "odon-settings-tab" + (g.id === o ? " is-active" : ""),
                      onClick: () => s(g.id),
                      children: a(g.titleKey)
                    },
                    g.id
                  ))
                }
              ),
              /* @__PURE__ */ d(
                "div",
                {
                  className: "odon-settings-panel",
                  role: "tabpanel",
                  id: `odon-settings-panel-${k.id}`,
                  "aria-labelledby": `odon-settings-tab-${k.id}`,
                  children: k.render({ t: a, s: i })
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
const Aa = {
  background: "--odon-bg",
  panel: "--odon-panel",
  card: "--odon-card",
  text: "--odon-text",
  muted: "--odon-muted",
  line: "--odon-line",
  accent: "--odon-accent",
  accent2: "--odon-accent2"
};
function Ss(e, t) {
  if (e) {
    for (const a of Object.values(Aa))
      e.style.removeProperty(a);
    if (t?.colors)
      for (const [a, i] of Object.entries(Aa)) {
        const o = t.colors[a];
        o && e.style.setProperty(i, o);
      }
  }
}
const zs = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij4KICA8IS0tIENyZWF0ZWQgYnkgWm9sdGFuIER1bCBpbiAyMDI2IC0gZnJlZSB0byB1c2Ugd2l0aCBNSVQgbGljZW5zZS4gU1ZHIFZlcnNpb246IDIuMS4xIC0tPgogIDxwYXRoIGlkPSJ0b290aC1iYXNlIiBkPSJNMTI1LjgsMTQ5Yy03LjMtMi0xMS44LDE0LjYtMTQuMiwyMC40LTEuNiw0LjQtMy4xLDguMy00LjMsMTIuNy00LjQsMTYuMS0xLjYsMzQuMy02LjgsNTAuMy0zLjUsMTIuNy0xNS4zLDE0LjQtMjEuMiwyLjItMi45LTYuMS0zLjktMTIuOS00LjgtMTkuNi0xLTcuNy0uOC0xNS42LjctMjMuMSwxLjgtMTEuNCw3LjUtMjIsNy41LTMzLjgsMC0xNy4yLTMtMzIuNy02LjctNDkuMi04LjQtMjkuMy0yNy40LTc5LjYsMTMuMi05My45LDEyLjMtNC45LDI1LDMuMywzNy41LDMsMS43LDAsMy40LS4yLDUuMS0uNCwxMi45LTIuMSwyNy43LTkuNiw0MS01LjMsMjIuNSw3LjQsMjAuNiwzOS4xLDE2LjYsNTguNS0xLDQuOC0yLjMsOS40LTMuNiwxMy4yLTIuMiw2LjItNS4zLDEyLjItNi43LDE5LjEtMS45LDguNC0yLjksMTYuOC0zLjcsMjUtMS41LDE1LjUuMywzMC40LjUsNDUuMSwwLDguNy0uNCwxNy44LTEuMiwyNi4zLS44LDguMy0yLjUsMTYuNy00LjUsMjQuOS0xLjcsNy44LTUuNiwxOC45LTE0LjEsMjAuNS0xNC44LjctMTEuOS0zOC44LTE0LjMtNDguOS0xLjgtMTAuMS02LjgtNDIuMy0xNS45LTQ3LjRoMHYuNFoiIHN0eWxlPSJmaWxsOiAjZmZmOyBzdHJva2U6ICMwMDA7IHN0cm9rZS1taXRlcmxpbWl0OiAxMDsgc3Ryb2tlLXdpZHRoOiA4cHg7Ii8+CiAgPGcgc3R5bGU9Imlzb2xhdGlvbjogaXNvbGF0ZTsiPgogICAgPHRleHQgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTAuNSAxMzIuNykiIHN0eWxlPSJmaWxsOiAjMTExODI3OyBmb250LWZhbWlseTogUm9ib3RvU2xhYi1Cb2xkLCAmYXBvcztSb2JvdG8gU2xhYiZhcG9zOzsgZm9udC1zaXplOiAxMzcuOXB4OyBmb250LXdlaWdodDogNzAwOyBpc29sYXRpb246IGlzb2xhdGU7Ij48dHNwYW4geD0iMCIgeT0iMCI+ODwvdHNwYW4+PC90ZXh0PgogIDwvZz4KICA8ZyBpZD0ieC1saW5lIiBzdHlsZT0iZGlzcGxheTogbm9uZTsiPgogICAgPGxpbmUgaWQ9ImxpbmUtMiIgeDE9IjIxLjIiIHkxPSIxOC4zIiB4Mj0iMjI5LjgiIHkyPSIyMjYuOSIgc3R5bGU9ImZpbGw6IG5vbmU7IHN0cm9rZTogI2VmNDQ0NDsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBzdHJva2Utd2lkdGg6IDE0cHg7Ii8+CiAgICA8bGluZSBpZD0ibGluZS0xIiB4MT0iMjEuMiIgeTE9IjE4LjMiIHgyPSIyMjkuOCIgeTI9IjIyNi45IiBzdHlsZT0iZmlsbDogbm9uZTsgaXNvbGF0aW9uOiBpc29sYXRlOyBvcGFjaXR5OiAuMjsgc3Ryb2tlOiAjMTExODI3OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZS13aWR0aDogM3B4OyIvPgogIDwvZz4KPC9zdmc+", Zs = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Layer_1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20version='1.1'%20viewBox='0%200%20256%20256'%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20SVG%20Version:%202.1.1%20--%3e%3cdefs%3e%3cpattern%20id='gumPattern'%20x='0'%20y='0'%20width='12'%20height='12'%20patternTransform='translate(6%2016638)'%20patternUnits='userSpaceOnUse'%20viewBox='0%200%2012%2012'%3e%3cg%3e%3crect%20width='12'%20height='12'%20style='fill:%20none;'/%3e%3cg%3e%3crect%20width='12'%20height='12'%20style='fill:%20none;'/%3e%3crect%20width='12'%20height='12'%20style='fill:%20%23f6b7c1;'/%3e%3ccircle%20cx='3'%20cy='3'%20r='1.2'%20style='fill:%20%23f1a8b5;'/%3e%3ccircle%20cx='9'%20cy='7'%20r='1.2'%20style='fill:%20%23f1a8b5;'/%3e%3c/g%3e%3c/g%3e%3c/pattern%3e%3c/defs%3e%3cpath%20id='gum-line'%20d='M28.8,98.9c3.7-3.1,9-2.7,13.7-1.6,21.6,5.2,39.5,22.7,59.9,39.8,8.7,7.5,19.7,15,31.4,10.8,4.6-1.5,9.3-4.5,13.4-7.5,22.7-17.2,47.3-36.9,71.6-42.5,5.9-1.3,13.3-2.9,18.1,1.2,2.1,1.9,3.5,4.9,4.4,8.9,1.3,6.6,1.2,14.2,1.1,21.1,0,15-.6,28.4-1.6,43.2-4.3,79.9-15.9,82.9-91.7,81.4-18.2-.6-34.8-.7-52.5-.4-18.6-.3-40.1.7-55.7-10.3-26.7-19.4-26.6-81.3-21.4-112.9,1.7-9.7,2-24.6,9.2-31.3h.1Z'%20style='fill:%20url(%23gumPattern);%20stroke:%20%23e596a3;%20stroke-linejoin:%20round;%20stroke-width:%204px;'/%3e%3cpath%20id='tooth-base'%20d='M122.9,152.7c-7.3-2-11.8,14.6-14.2,20.4-1.6,4.4-3.1,8.3-4.3,12.7-4.4,16.1-1.6,34.3-6.8,50.3-3.5,12.7-15.3,14.4-21.2,2.2-2.9-6.1-3.9-12.9-4.8-19.6-1-7.7-.8-15.6.7-23.1,1.8-11.4,7.5-22,7.5-33.8,0-17.2-3-32.7-6.7-49.2-8.4-29.3-27.4-79.6,13.2-93.9,12.3-4.9,25,3.3,37.5,3,1.7,0,3.4-.2,5.1-.4,12.9-2.1,27.7-9.6,41-5.3,22.5,7.4,20.6,39.1,16.6,58.5-1,4.8-2.3,9.4-3.6,13.2-2.2,6.2-5.3,12.2-6.7,19.1-1.9,8.4-2.9,16.8-3.7,25-1.5,15.5.3,30.4.5,45.1,0,8.7-.4,17.8-1.2,26.3-.8,8.3-2.5,16.7-4.5,24.9-1.7,7.8-5.6,18.9-14.1,20.5-14.8.7-11.9-38.8-14.3-48.9-1.8-10.1-6.8-42.3-15.9-47.4h0v.4Z'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%208px;'/%3e%3cg%20id='x-line'%20style='display:%20none;'%3e%3cline%20id='line-2'%20x1='18.3'%20y1='22.1'%20x2='226.9'%20y2='230.7'%20style='fill:%20none;%20stroke:%20%23ef4444;%20stroke-linecap:%20round;%20stroke-width:%2014px;'/%3e%3cline%20id='line-1'%20x1='18.3'%20y1='22.1'%20x2='226.9'%20y2='230.7'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.2;%20stroke:%20%23111827;%20stroke-linecap:%20round;%20stroke-width:%203px;'/%3e%3c/g%3e%3c/svg%3e", Is = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Layer_1'%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%20viewBox='0%200%20256%20256'%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20SVG%20Version:%202.1.1%20--%3e%3cpath%20d='M127,8.5c-12.6-.4-31.7-4.7-41.2-2.2-24.6,6.5-31.8,17.8-32.9,48.9-.9,27.2,7,58,16,74.1,6.8,11.6-8.5,58.2-6.9,80.9,1.5,22.6,20.5,50.7,31.8,40,2.4-2.2,11.4-10.8,16.6-24.3,2.6-6.8-.1-14.6,1.8-22.1,5.2-20.8,4.9-34.6,8.9-34.5,8.1.3,5.2,12.6,8.2,28.8s4.3,43.8,8,49c11,15.5,44.6-10.8,46.8-27.7,3.2-22.6-7.1-73.5.4-84.6,1.8-20.8,7.7-22.8,8.6-50s7.9-40.1,4.6-48.9c-7.9-21.3-2.6-23.8-25.1-34.4s-38.6,7.2-45.7,7Z'%20style='fill:%20none;%20stroke:%20%233b82f6;%20stroke-dasharray:%2010%2010;%20stroke-linejoin:%20round;%20stroke-width:%206px;'/%3e%3cpath%20id='tooth-base'%20d='M123.6,148.7c-7.3-2-11.8,14.6-14.2,20.4-1.6,4.4-3.1,8.3-4.3,12.7-4.4,16.1-1.6,34.3-6.8,50.3-3.5,12.7-15.3,14.4-21.2,2.2-2.9-6.1-3.9-12.9-4.8-19.6-1-7.7-.8-15.6.7-23.1,1.8-11.4,7.5-22,7.5-33.8-.1-17.2-3-32.7-6.7-49.2-8.4-29.3-27.4-79.6,13.2-93.9,12.3-4.9,25,3.3,37.5,3,1.7,0,3.4-.2,5.1-.4,12.9-2.1,27.7-9.6,41-5.3,22.5,7.4,20.6,39.1,16.6,58.5-1,4.8-2.3,9.4-3.6,13.2-2.2,6.2-5.3,12.2-6.7,19.1-1.9,8.4-2.9,16.8-3.7,25-1.5,15.5.3,30.4.5,45.1,0,8.7-.4,17.8-1.2,26.3-.8,8.3-2.5,16.7-4.5,24.9-1.7,7.8-5.6,18.9-14.1,20.5-14.8.7-11.9-38.8-14.3-48.9-1.8-10.1-6.8-42.3-15.9-47.4h-.1Z'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%208px;'/%3e%3cg%20id='x-line'%3e%3cline%20id='line-2'%20x1='16.7'%20y1='15.6'%20x2='225.3'%20y2='224.2'%20style='fill:%20none;%20stroke:%20%23ef4444;%20stroke-linecap:%20round;%20stroke-width:%2014px;'/%3e%3cline%20id='line-1'%20x1='16.7'%20y1='15.6'%20x2='225.3'%20y2='224.2'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.2;%20stroke:%20%23111827;%20stroke-linecap:%20round;%20stroke-width:%203px;'/%3e%3c/g%3e%3c/svg%3e", Ds = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Layer_1'%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%20viewBox='0%200%20256%20256'%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20SVG%20Version:%202.1.1%20--%3e%3cpath%20id='tooth-occlusal'%20d='M107.9,27.1c11.6,0,24.9,1.7,37,2.8,8.3,0,17.1,1.1,24.9,3.9,5,1.7,9.4,3.3,14.4,5.5,7.7,3.3,15.5,7.7,21.6,14.4,6.1,6.1,11.1,13.3,13.3,21.6,1.1,3.3,1.7,7.2,2.8,11.1,1.7,9.4,2.8,17.7,2.8,26.5s0,13.3-1.1,19.9c0,8.8-1.1,17.1-2.8,25.4-2.8,11.1-5.5,23.2-11.1,33.2-7.7,13.3-22.7,21-37,24.3-5.5,1.1-11.6,2.2-17.1,3.3-8.3,1.7-16.6,4.4-24.9,6.6-7.2,1.7-14.4,1.1-21,0-6.1,0-12.2-1.7-18.2-1.7-10.5-1.1-21.6-1.7-30.4-7.7-7.2-5-12.7-12.2-17.1-19.9-5.5-8.3-9.4-17.7-11.1-27.6-1.7-7.2-1.1-14.9-1.1-22.1s2.8-19.4,3.9-29.3c2.2-11.6,2.8-23.8,5.5-35.4,2.8-11.6,8.3-22.1,15.5-31,7.7-8.8,18.2-16.6,29.3-19.9,7.2-1.7,14.9-2.8,22.1-2.8h0v-1.1h-.2Z'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%208px;'/%3e%3cg%20id='x-line'%20style='display:%20none;'%3e%3cline%20id='line-2'%20x1='16.7'%20y1='15.6'%20x2='225.3'%20y2='224.2'%20style='fill:%20none;%20stroke:%20%23ef4444;%20stroke-linecap:%20round;%20stroke-width:%2014px;'/%3e%3cline%20id='line-1'%20x1='16.7'%20y1='15.6'%20x2='225.3'%20y2='224.2'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.2;%20stroke:%20%23111827;%20stroke-linecap:%20round;%20stroke-width:%203px;'/%3e%3c/g%3e%3c/svg%3e", Cs = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Layer_1'%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%20viewBox='0%200%20256%20256'%3e%3c!--%20Created%20by%20Zoltan%20Dul%20in%202026%20-%20free%20to%20use%20with%20MIT%20license.%20SVG%20Version:%202.1.1%20--%3e%3cpath%20id='tooth-base'%20d='M122.9,152.7c-7.3-2-11.8,14.6-14.2,20.4-1.6,4.4-3.1,8.3-4.3,12.7-4.4,16.1-1.6,34.3-6.8,50.3-3.5,12.7-15.3,14.4-21.2,2.2-2.9-6.1-3.9-12.9-4.8-19.6-1-7.7-.8-15.6.7-23.1,1.8-11.4,7.5-22,7.5-33.8,0-17.2-3-32.7-6.7-49.2-8.4-29.3-27.4-79.6,13.2-93.9,12.3-4.9,25,3.3,37.5,3,1.7,0,3.4-.2,5.1-.4,12.9-2.1,27.7-9.6,41-5.3,22.5,7.4,20.6,39.1,16.6,58.5-1,4.8-2.3,9.4-3.6,13.2-2.2,6.2-5.3,12.2-6.7,19.1-1.9,8.4-2.9,16.8-3.7,25-1.5,15.5.3,30.4.5,45.1,0,8.7-.4,17.8-1.2,26.3-.8,8.3-2.5,16.7-4.5,24.9-1.7,7.8-5.6,18.9-14.1,20.5-14.8.7-11.9-38.8-14.3-48.9-1.8-10.1-6.8-42.3-15.9-47.4h0v.4Z'%20style='fill:%20%23fff;%20stroke:%20%23000;%20stroke-miterlimit:%2010;%20stroke-width:%208px;'/%3e%3cpath%20id='tooth-healthy-pulp-2'%20d='M155.3,232.3c-4.8-3.6.2-21-1.5-34.3.2-18.4-2.8-39.4-11.5-55.3-4.4-6.7-8.3-11.3-15.4-11.9-5.3-1.1-11.5,0-15.5,2.9-12,9.1-20.8,47.4-22.7,68.3-.9,6.1-2.1,38.8-7.7,16.8-4.7-20.5,4.3-34.2,7.1-56.2,5-17.3,12.3-36.7,9.8-61.3-1.6-14.8-7.3-32.8-10.3-46.6-2.5-13.8,4.5-13.3,16.5-7,8.8,3.7,15.4,12.4,26.1,10.4,16-3.4,27.7-19.7,33-16.6,2.2,1,3,9.7,2.1,11.8-2.8,13.8-7.8,28.1-9.2,41.8-1,14.8.6,30.2,2.3,45.5,1.6,14.8,10.3,88.5-3.4,93h0v-1.5s.5,0,.5,0Z'%20style='fill:%20%23fcc5bc;'/%3e%3cg%20id='x-line'%20style='display:%20none;'%3e%3cline%20id='line-2'%20x1='18.3'%20y1='22.1'%20x2='226.9'%20y2='230.7'%20style='fill:%20none;%20stroke:%20%23ef4444;%20stroke-linecap:%20round;%20stroke-width:%2014px;'/%3e%3cline%20id='line-1'%20x1='18.3'%20y1='22.1'%20x2='226.9'%20y2='230.7'%20style='fill:%20none;%20isolation:%20isolate;%20opacity:%20.2;%20stroke:%20%23111827;%20stroke-linecap:%20round;%20stroke-width:%203px;'/%3e%3c/g%3e%3c/svg%3e", Es = [
  { value: "hu", labelKey: "language.hu" },
  { value: "en", labelKey: "language.en" },
  { value: "de", labelKey: "language.de" },
  { value: "es", labelKey: "language.es" },
  { value: "it", labelKey: "language.it" },
  { value: "sk", labelKey: "language.sk" },
  { value: "pl", labelKey: "language.pl" },
  { value: "ru", labelKey: "language.ru" },
  { value: "pt-br", labelKey: "language.pt-br" }
];
function As({
  language: e,
  onLanguageChange: t,
  numberingSystem: a,
  onNumberingChange: i,
  darkMode: o,
  onDarkModeChange: s,
  themeConfig: c,
  plugins: v,
  readOnly: f,
  enableNotes: u,
  enableIcdas: m,
  pulpDetailLevel: b,
  secondaryCariesMode: k,
  rootCariesMode: g,
  radiographicDepthMode: D,
  cariesDepthEnabled: r,
  wearDetailLevel: l,
  discolorationDetailLevel: y,
  surfaceNotation: I,
  showStatusCard: O,
  showOrthoCard: j
}) {
  const { lang: N, setLang: P, t: h } = uo({ language: e, onLanguageChange: t }), [F, L] = H(a ?? "FDI"), M = je(null), he = a ?? F, [Te, Qe] = H(!1), dt = je(null), [pt, Ze] = H(!1), [U, Y] = H(u ?? !1), [Q, q] = H(m ?? !1), [ke, xe] = H(b ?? "aae"), [Pt, ft] = H(k ?? "standard"), [At, ht] = H(g ?? "simple"), [A, R] = H(D ?? "off"), [Oe, O2] = H(r ?? !0), [eo, N2] = H(l ?? "complex"), [to, R2] = H(y ?? "complex"), [ao, G2] = H(I ?? "full"), [Tt, io] = H(!0), [U2, j2] = H(O ?? !0), [F2, K2] = H(j ?? !0), [re, oo] = H(null), [B2, Ne] = H(!1), _2 = je(null), [V2, Ot] = H(!1), H2 = je(null), [lo, so] = H(() => o !== void 0 ? o : typeof document < "u" ? document.documentElement.classList.contains("dark") : !1), Ie = o !== void 0 ? o : lo;
  W(() => {
    o === void 0 && document.documentElement.classList.toggle("dark", Ie);
  }, [Ie, o]);
  const W2 = () => {
    const z = !Ie;
    o !== void 0 || so(z), s?.(z);
  }, no = (z) => {
    if (a) {
      i?.(z);
      return;
    }
    L(z), i?.(z);
  };
  W(() => (rs(), () => {
    cs();
  }), []), W(() => {
    ns(he);
  }, [he]), W(() => {
    Ss(M.current, c);
  }, [c]), W(() => {
    ps(v ?? []);
  }, [v]), W(() => {
    us(f ?? !1);
  }, [f]), W(() => {
    Ea(u ?? !1), Y(u ?? !1);
  }, [u]), W(() => {
    aa(m ?? !1), q(m ?? !1);
  }, [m]), W(() => {
    ia(b ?? "aae"), xe(b ?? "aae");
  }, [b]), W(() => {
    const z = k ?? "standard";
    na(z), ft(z);
  }, [k]), W(() => {
    const z = g ?? "simple";
    ra(z), ht(z);
  }, [g]), W(() => {
    const z = D ?? "off";
    ca(z), R(z);
  }, [D]), W(() => {
    const z = r ?? !0;
    da(z), O2(z);
  }, [r]), W(() => {
    const z = l ?? "complex";
    oa(z), N2(z);
  }, [l]), W(() => {
    const z = y ?? "complex";
    la(z), R2(z);
  }, [y]), W(() => {
    const z = I ?? "full";
    sa(z), G2(z);
  }, [I]), W(() => {
    j2(O ?? !0);
  }, [O]), W(() => {
    K2(j ?? !0);
  }, [j]), W(() => {
    if (!Tt) return;
    const z = () => oo(hs());
    return z(), S0(z);
  }, [Tt, N, he]), W(() => {
    const z = (co) => {
      const e2 = co.target;
      dt.current?.contains(e2) || Qe(!1), _2.current?.contains(e2) || Ne(!1), H2.current?.contains(e2) || Ot(!1);
    };
    return document.addEventListener("click", z), () => document.removeEventListener("click", z);
  }, []);
  const ro = {
    numbering: he,
    onNumbering: no,
    language: N,
    onLanguage: P,
    isDark: Ie,
    onToggleDark: W2,
    toothInfo: Tt,
    onToothInfo: (z) => io(z),
    secondaryCariesMode: Pt,
    onSecondaryCariesMode: (z) => {
      ft(z), na(z);
    },
    icdas: Q,
    onIcdas: (z) => {
      q(z), aa(z);
    },
    cariesDepth: Oe,
    onCariesDepth: (z) => {
      O2(z), da(z);
    },
    rootCariesMode: At,
    onRootCariesMode: (z) => {
      ht(z), ra(z);
    },
    radiographicDepthMode: A,
    onRadiographicDepthMode: (z) => {
      R(z), ca(z);
    },
    pulpLevel: ke,
    onPulpLevel: (z) => {
      xe(z), ia(z);
    },
    wearDetailLevel: eo,
    onWearDetailLevel: (z) => {
      N2(z), oa(z);
    },
    discolorationDetailLevel: to,
    onDiscolorationDetailLevel: (z) => {
      R2(z), la(z);
    },
    surfaceNotation: ao,
    onSurfaceNotation: (z) => {
      G2(z), sa(z);
    },
    notes: U,
    onNotes: (z) => {
      Y(z), Ea(z);
    },
    showStatusCard: U2,
    onShowStatusCard: (z) => j2(z),
    showOrthoCard: F2,
    onShowOrthoCard: (z) => K2(z)
  };
  return /* @__PURE__ */ x("div", { ref: M, className: "odontogram-root", children: [
    /* @__PURE__ */ x("header", { className: "topbar", children: [
      /* @__PURE__ */ x("div", { className: "brand", children: [
        /* @__PURE__ */ d("div", { className: "dot" }),
        /* @__PURE__ */ x("div", { children: [
          /* @__PURE__ */ d("div", { className: "title", children: h("app.title") }),
          /* @__PURE__ */ d("div", { className: "subtitle", children: `${h("app.subtitleLang")} ${h("app.subtitleNumbering." + he)} ${h(Ie ? "app.subtitleMode.dark" : "app.subtitleMode.light")}` })
        ] })
      ] }),
      /* @__PURE__ */ x("div", { className: "topbar-actions", children: [
        /* @__PURE__ */ d("button", { className: "btn-theme", onClick: () => ms(), title: h("intro.start"), "aria-label": h("intro.start"), children: /* @__PURE__ */ x("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ d("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ d("path", { d: "M12 16v-4M12 8h.01" })
        ] }) }),
        /* @__PURE__ */ x("div", { className: "topbar-group dropdown", ref: dt, children: [
          /* @__PURE__ */ d("button", { className: "btn-theme", onClick: () => Qe((z) => !z), "aria-haspopup": "menu", "aria-expanded": Te, title: h("language.label"), "aria-label": h("language.label"), children: /* @__PURE__ */ x("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ d("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ d("path", { d: "M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" })
          ] }) }),
          Te && /* @__PURE__ */ d("div", { className: "dropdown-menu", role: "menu", "aria-label": h("language.label"), children: Es.map((z) => /* @__PURE__ */ d(
            "button",
            {
              className: "dropdown-item",
              role: "menuitemradio",
              "aria-checked": N === z.value,
              onClick: () => {
                P(z.value), Qe(!1);
              },
              children: h(z.labelKey)
            },
            z.value
          )) })
        ] }),
        /* @__PURE__ */ d(
          "button",
          {
            className: "btn-theme",
            onClick: W2,
            title: h(Ie ? "theme.light" : "theme.dark"),
            "aria-label": h(Ie ? "theme.light" : "theme.dark"),
            children: Ie ? /* @__PURE__ */ x("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ d("circle", { cx: "12", cy: "12", r: "4" }),
              /* @__PURE__ */ d("path", { d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" })
            ] }) : /* @__PURE__ */ d("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ d("path", { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" }) })
          }
        ),
        /* @__PURE__ */ d("div", { className: "topbar-group", children: /* @__PURE__ */ d("button", { className: "btn-theme", onClick: () => Ze(!0), "aria-haspopup": "dialog", "aria-expanded": pt, title: h("settings.title"), "aria-label": h("settings.title"), children: /* @__PURE__ */ x("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ d("circle", { cx: "12", cy: "12", r: "3" }),
          /* @__PURE__ */ d("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
        ] }) }) }),
        /* @__PURE__ */ d("button", { id: "btnStatusExport", hidden: !0, "aria-hidden": "true", tabIndex: -1, children: h("topbar.exportStatus") }),
        /* @__PURE__ */ d("button", { id: "btnStatusFhirExport", hidden: !0, "aria-hidden": "true", tabIndex: -1, children: h("topbar.exportFhir") }),
        /* @__PURE__ */ d("button", { id: "btnStatusPngExport", hidden: !0, "aria-hidden": "true", tabIndex: -1, children: h("topbar.exportPng") }),
        /* @__PURE__ */ d("button", { id: "btnStatusJpgExport", hidden: !0, "aria-hidden": "true", tabIndex: -1, children: h("topbar.exportJpg") }),
        /* @__PURE__ */ d("button", { id: "btnStatusSvgExport", hidden: !0, "aria-hidden": "true", tabIndex: -1, children: h("export.menu.svg") }),
        /* @__PURE__ */ x("div", { className: "topbar-group dropdown", ref: _2, children: [
          /* @__PURE__ */ d("button", { id: "btnExportMenu", className: "btn-theme", onClick: () => Ne((z) => !z), "aria-haspopup": "menu", "aria-expanded": B2, title: h("topbar.export"), "aria-label": h("topbar.export"), children: /* @__PURE__ */ d("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ d("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" }) }) }),
          B2 && /* @__PURE__ */ x("div", { className: "dropdown-menu", role: "menu", "aria-label": h("topbar.export"), children: [
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              document.getElementById("btnStatusExport")?.click(), Ne(!1);
            }, children: h("export.menu.statusJson") }),
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              document.getElementById("btnStatusFhirExport")?.click(), Ne(!1);
            }, children: h("export.menu.fhir") }),
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              document.getElementById("btnStatusPngExport")?.click(), Ne(!1);
            }, children: h("export.menu.png") }),
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              document.getElementById("btnStatusJpgExport")?.click(), Ne(!1);
            }, children: h("export.menu.jpg") }),
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              document.getElementById("btnStatusSvgExport")?.click(), Ne(!1);
            }, children: h("export.menu.svg") })
          ] })
        ] }),
        /* @__PURE__ */ d("button", { id: "btnStatusImport", hidden: !0, "aria-hidden": "true", tabIndex: -1, children: h("topbar.importStatus") }),
        /* @__PURE__ */ x("div", { className: "topbar-group dropdown", ref: H2, children: [
          /* @__PURE__ */ d("button", { id: "btnImportMenu", className: "btn-theme", onClick: () => Ot((z) => !z), "aria-haspopup": "menu", "aria-expanded": V2, title: h("topbar.import"), "aria-label": h("topbar.import"), children: /* @__PURE__ */ d("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ d("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 8l5-5 5 5M12 3v12" }) }) }),
          V2 && /* @__PURE__ */ x("div", { className: "dropdown-menu", role: "menu", "aria-label": h("topbar.import"), children: [
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              Da("status"), document.getElementById("btnStatusImport")?.click(), Ot(!1);
            }, children: h("import.menu.statusJson") }),
            /* @__PURE__ */ d("button", { className: "dropdown-item", role: "menuitem", onClick: () => {
              Da("fhir"), document.getElementById("btnStatusImport")?.click(), Ot(!1);
            }, children: h("import.menu.fhir") })
          ] })
        ] }),
        /* @__PURE__ */ d("input", { id: "statusImportInput", type: "file", accept: "application/json", hidden: !0 })
      ] })
    ] }),
    /* @__PURE__ */ x("main", { className: "layout", children: [
      /* @__PURE__ */ x("div", { className: "chart-column", children: [
        /* @__PURE__ */ x("section", { className: "chart", children: [
          /* @__PURE__ */ x("div", { className: "chart-header", children: [
            /* @__PURE__ */ x("div", { children: [
              /* @__PURE__ */ d("div", { className: "chart-title", children: h("chart.title") }),
              /* @__PURE__ */ d("div", { className: "chart-hint", children: h("chart.hint") })
            ] }),
            /* @__PURE__ */ x("div", { className: "chart-actions", children: [
              /* @__PURE__ */ d("button", { id: "btnOcclView", className: "btn btn-toggle btn-icon", "aria-pressed": "true", title: h("chart.actions.occlusal"), "aria-label": h("chart.actions.occlusal"), "data-icon-src": Ds, "data-xline": "1" }),
              /* @__PURE__ */ d("button", { id: "btnWisdomVisible", className: "btn btn-toggle btn-icon", "aria-pressed": "true", title: h("chart.actions.wisdom"), "aria-label": h("chart.actions.wisdom"), "data-icon-src": zs, "data-xline": "1" }),
              /* @__PURE__ */ d("button", { id: "btnBoneVisible", className: "btn btn-toggle btn-icon", "aria-pressed": "true", title: h("chart.actions.bone"), "aria-label": h("chart.actions.bone"), "data-icon-src": Zs, "data-xline": "1" }),
              /* @__PURE__ */ d("button", { id: "btnPulpVisible", className: "btn btn-toggle btn-icon", "aria-pressed": "true", title: h("chart.actions.pulp"), "aria-label": h("chart.actions.pulp"), "data-icon-src": Cs, "data-xline": "1" }),
              /* @__PURE__ */ d("button", { id: "btnSelectNoneChart", className: "btn btn-ghost btn-icon", title: h("chart.actions.clearSelection"), "aria-label": h("chart.actions.clearSelection"), children: /* @__PURE__ */ d("img", { className: "icon-img", src: Is, alt: "", "aria-hidden": "true" }) })
            ] })
          ] }),
          /* @__PURE__ */ d("div", { id: "toothGrid", className: "tooth-grid", "aria-label": h("chart.aria.toothGrid") })
        ] }),
        Tt && re && /* @__PURE__ */ x("section", { className: "tooth-info card", "aria-label": h("toothInfo.title"), children: [
          /* @__PURE__ */ d("div", { className: "card-title", children: h("toothInfo.title") }),
          /* @__PURE__ */ d("p", { className: "tooth-info-overview", children: re.overview }),
          re.permanentList && /* @__PURE__ */ d("p", { className: "tooth-info-list", children: re.permanentList }),
          re.missingList && /* @__PURE__ */ d("p", { className: "tooth-info-list", children: re.missingList }),
          re.sections.map((z) => /* @__PURE__ */ x("p", { className: "tooth-info-line", children: [
            /* @__PURE__ */ x("span", { className: "tooth-info-heading", children: [
              z.heading,
              ":"
            ] }),
            " ",
            z.items.length ? z.items.join(", ") : /* @__PURE__ */ d("span", { className: "tooth-info-empty", children: z.emptyText })
          ] }, z.key)),
          re.implants && /* @__PURE__ */ x("p", { className: "tooth-info-line", children: [
            /* @__PURE__ */ x("span", { className: "tooth-info-heading", children: [
              re.implants.heading,
              ":"
            ] }),
            " ",
            re.implants.text
          ] }),
          /* @__PURE__ */ x("p", { className: "tooth-info-line", children: [
            /* @__PURE__ */ x("span", { className: "tooth-info-heading", children: [
              re.periodontalTitle,
              ":"
            ] }),
            " ",
            re.periodontalText
          ] })
        ] })
      ] }),
      /* @__PURE__ */ x("aside", { className: "panel", children: [
        /* @__PURE__ */ x("div", { className: "panel-header", children: [
          /* @__PURE__ */ x("div", { children: [
            /* @__PURE__ */ x("div", { className: "panel-title-row", children: [
              /* @__PURE__ */ d("span", { className: "panel-title", children: h("panel.controls") }),
              /* @__PURE__ */ x("div", { className: "panel-title-actions", children: [
                /* @__PURE__ */ d("button", { id: "btnSelectNone", className: "btn btn-ghost btn-icon btn-danger", title: h("panel.clearSelection"), "aria-label": h("panel.clearSelection"), children: h("panel.clearSelection") }),
                /* @__PURE__ */ d("button", { id: "btnToggleControlsCard", className: "icon-btn", title: h("actions.collapse", { label: h("panel.controls") }), "aria-label": h("actions.collapse", { label: h("panel.controls") }), children: /* @__PURE__ */ d("span", { className: "toggle-icon", "aria-hidden": "true", children: "−" }) })
              ] })
            ] }),
            /* @__PURE__ */ x("div", { className: "panel-subtitle", children: [
              h("panel.activeTooth"),
              ": ",
              /* @__PURE__ */ d("span", { id: "activeToothLabel", className: "pill", children: h("selection.none") })
            ] }),
            /* @__PURE__ */ x("div", { id: "controlsActions", className: "panel-subtitle select-actions", children: [
              /* @__PURE__ */ x("div", { className: "select-actions-row", children: [
                /* @__PURE__ */ d("button", { id: "btnSelectAll", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.all"), children: h("panel.selectActions.all") }),
                /* @__PURE__ */ d("button", { id: "btnSelectAllPresent", className: "btn btn-ghost btn-icon fade-toggle", title: h("panel.selectActions.present"), children: h("panel.selectActions.present") }),
                /* @__PURE__ */ d("button", { id: "btnSelectPermanent", className: "btn btn-ghost btn-icon fade-toggle", title: h("panel.selectActions.permanent"), children: h("panel.selectActions.permanent") }),
                /* @__PURE__ */ d("button", { id: "btnSelectMilk", className: "btn btn-ghost btn-icon fade-toggle", title: h("panel.selectActions.milk"), children: h("panel.selectActions.milk") }),
                /* @__PURE__ */ d("button", { id: "btnSelectImplants", className: "btn btn-ghost btn-icon fade-toggle", title: h("panel.selectActions.implants"), children: h("panel.selectActions.implants") }),
                /* @__PURE__ */ d("button", { id: "btnSelectAllMissing", className: "btn btn-ghost btn-icon fade-toggle", title: h("panel.selectActions.missing"), children: h("panel.selectActions.missing") })
              ] }),
              /* @__PURE__ */ x("div", { className: "select-actions-row", children: [
                /* @__PURE__ */ d("button", { id: "btnSelectUpper", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.upper"), children: h("panel.selectActions.upper") }),
                /* @__PURE__ */ d("button", { id: "btnSelectUpperFront", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.upperFront"), children: h("panel.selectActions.upperFront") }),
                /* @__PURE__ */ d("button", { id: "btnSelectUpperMolar", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.upperMolar"), children: h("panel.selectActions.upperMolar") }),
                /* @__PURE__ */ d("button", { id: "btnSelectLower", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.lower"), children: h("panel.selectActions.lower") }),
                /* @__PURE__ */ d("button", { id: "btnSelectLowerFront", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.lowerFront"), children: h("panel.selectActions.lowerFront") }),
                /* @__PURE__ */ d("button", { id: "btnSelectLowerMolar", className: "btn btn-ghost btn-icon", title: h("panel.selectActions.lowerMolar"), children: h("panel.selectActions.lowerMolar") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ d("div", { id: "warnings", className: "warnings" })
        ] }),
        /* @__PURE__ */ x("div", { className: "panel-body", children: [
          /* @__PURE__ */ d("div", { className: U2 ? "" : "hidden", children: /* @__PURE__ */ x("section", { className: "card", id: "statusCard", children: [
            /* @__PURE__ */ x("div", { className: "card-title card-title-row", children: [
              /* @__PURE__ */ d("span", { children: h("status.title") }),
              /* @__PURE__ */ d("button", { id: "btnToggleStatusCard", className: "icon-btn", title: h("actions.collapse", { label: h("status.title") }), "aria-label": h("actions.collapse", { label: h("status.title") }), children: /* @__PURE__ */ d("span", { className: "toggle-icon", "aria-hidden": "true", children: "−" }) })
            ] }),
            /* @__PURE__ */ x("div", { className: "row status-actions", id: "statusCardBody", children: [
              /* @__PURE__ */ d("button", { id: "btnResetAll", className: "btn btn-ghost btn-sm", children: h("status.resetAll") }),
              /* @__PURE__ */ d("button", { id: "btnPrimaryDentition", className: "btn btn-ghost btn-sm", children: h("status.primaryDentition") }),
              /* @__PURE__ */ d("button", { id: "btnMixedDentition", className: "btn btn-ghost btn-sm", children: h("status.mixedDentition") }),
              /* @__PURE__ */ d("button", { id: "btnEdentulous", className: "btn btn-toggle btn-sm", "aria-pressed": "false", children: h("status.edentulous") })
            ] }),
            /* @__PURE__ */ x("div", { className: "row status-extra-row", children: [
              /* @__PURE__ */ d("span", { children: h("status.extraLabel") }),
              /* @__PURE__ */ d("select", { id: "statusExtraSelect" }),
              /* @__PURE__ */ d("button", { id: "statusExtraApply", className: "btn btn-ghost btn-sm", children: h("status.extraApply") })
            ] })
          ] }) }),
          /* @__PURE__ */ x("section", { className: "card", children: [
            /* @__PURE__ */ x("div", { className: "card-title card-title-row", children: [
              /* @__PURE__ */ d("span", { children: h("tooth.title") }),
              /* @__PURE__ */ d("button", { id: "btnResetTooth", className: "btn btn-ghost btn-sm", title: h("tooth.resetTitle"), "aria-label": h("tooth.resetTitle"), children: h("tooth.reset") })
            ] }),
            /* @__PURE__ */ x("div", { className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("tooth.baseLabel") }),
              /* @__PURE__ */ d("select", { id: "toothSelect" })
            ] }),
            /* @__PURE__ */ x("div", { id: "substrateRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("substrate.label") }),
              /* @__PURE__ */ d("select", { id: "substrateSelect" })
            ] }),
            /* @__PURE__ */ x("label", { id: "extractionRow", className: "row", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "extractionWound" }),
              /* @__PURE__ */ d("span", { children: h("tooth.extractionWound") })
            ] }),
            /* @__PURE__ */ x("label", { id: "missingClosedRow", className: "row", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "missingClosed" }),
              /* @__PURE__ */ d("span", { children: h("tooth.missingClosed") })
            ] }),
            /* @__PURE__ */ x("div", { id: "restorationRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("restoration.label") }),
              /* @__PURE__ */ d("select", { id: "restorationSelect" })
            ] }),
            /* @__PURE__ */ x("label", { id: "crownLeakageRow", className: "row hidden", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "crownLeakage" }),
              /* @__PURE__ */ d("span", { children: h("crownLeakage.label") })
            ] }),
            /* @__PURE__ */ x("div", { id: "brokenCrownRow", className: "row inline-checks contact-row", children: [
              /* @__PURE__ */ x("label", { children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "brokenMesial" }),
                /* @__PURE__ */ d("span", { children: h("tooth.broken.mesial") })
              ] }),
              /* @__PURE__ */ x("label", { children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "brokenIncisal" }),
                /* @__PURE__ */ d("span", { children: h("tooth.broken.incisal") })
              ] }),
              /* @__PURE__ */ x("label", { children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "brokenDistal" }),
                /* @__PURE__ */ d("span", { children: h("tooth.broken.distal") })
              ] })
            ] }),
            /* @__PURE__ */ x("div", { id: "contactPointRow", className: "row inline-checks contact-row", children: [
              /* @__PURE__ */ x("label", { children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "contactMesial" }),
                /* @__PURE__ */ d("span", { children: h("tooth.contact.mesialMissing") })
              ] }),
              /* @__PURE__ */ x("label", { children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "contactDistal" }),
                /* @__PURE__ */ d("span", { children: h("tooth.contact.distalMissing") })
              ] })
            ] }),
            /* @__PURE__ */ x("div", { id: "bruxismRow", className: "inline-checks bruxism-row wear-stack", children: [
              /* @__PURE__ */ x("div", { id: "wearEdgeRow", className: "row", children: [
                /* @__PURE__ */ x("label", { id: "wearEdgeSelectLabel", children: [
                  /* @__PURE__ */ d("span", { children: h("tooth.bruxism.edgeWear") }),
                  /* @__PURE__ */ d("select", { id: "wearEdgeSelect" })
                ] }),
                /* @__PURE__ */ x("label", { id: "wearEdgeToggleLabel", className: "inline-check hidden", children: [
                  /* @__PURE__ */ d("input", { type: "checkbox", id: "wearEdgeToggle" }),
                  /* @__PURE__ */ d("span", { children: h("tooth.bruxism.edgeWear") })
                ] })
              ] }),
              /* @__PURE__ */ x("div", { id: "wearCervicalRow", className: "row", children: [
                /* @__PURE__ */ x("label", { id: "wearCervicalSelectLabel", children: [
                  /* @__PURE__ */ d("span", { children: h("tooth.bruxism.neckWear") }),
                  /* @__PURE__ */ d("select", { id: "wearCervicalSelect" })
                ] }),
                /* @__PURE__ */ x("label", { id: "wearCervicalToggleLabel", className: "inline-check hidden", children: [
                  /* @__PURE__ */ d("input", { type: "checkbox", id: "wearCervicalToggle" }),
                  /* @__PURE__ */ d("span", { children: h("tooth.bruxism.neckWear") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ x("div", { id: "discolorationRow", className: "row inline-checks", children: [
              /* @__PURE__ */ x("label", { id: "discolorationSelectLabel", children: [
                /* @__PURE__ */ d("span", { children: h("discoloration.label") }),
                /* @__PURE__ */ d("select", { id: "discolorationSelect" })
              ] }),
              /* @__PURE__ */ x("label", { id: "discolorationToggleLabel", className: "inline-check hidden", children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "discolorationToggle" }),
                /* @__PURE__ */ d("span", { children: h("discoloration.label") })
              ] })
            ] }),
            /* @__PURE__ */ x("div", { id: "crownActionsRow", className: "row inline-checks bridge-actions-row", children: [
              /* @__PURE__ */ x("label", { id: "bridgePillarRow", className: "inline-check", children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "bridgePillar" }),
                /* @__PURE__ */ d("span", { children: h("tooth.bridgePillar") })
              ] }),
              /* @__PURE__ */ x("label", { id: "extractionPlanRow", className: "inline-check", children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "extractionPlan" }),
                /* @__PURE__ */ d("span", { children: h("tooth.extractionPlan") })
              ] })
            ] }),
            /* @__PURE__ */ x("label", { id: "crownReplaceRow", className: "row", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "crownReplace" }),
              /* @__PURE__ */ d("span", { children: h("tooth.crownReplace") })
            ] }),
            /* @__PURE__ */ x("label", { id: "crownNeededRow", className: "row", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "crownNeeded" }),
              /* @__PURE__ */ d("span", { children: h("tooth.crownNeeded") })
            ] })
          ] }),
          /* @__PURE__ */ d("div", { className: F2 ? "" : "hidden", children: /* @__PURE__ */ x("section", { id: "orthoCard", className: "card", children: [
            /* @__PURE__ */ d("div", { className: "card-title card-title-row", children: /* @__PURE__ */ d("span", { children: h("toothInfo.orthodontics") }) }),
            /* @__PURE__ */ x("div", { id: "orthoApplianceRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("ortho.appliance.label") }),
              /* @__PURE__ */ d("select", { id: "orthoApplianceSelect" })
            ] }),
            /* @__PURE__ */ x("div", { id: "orthoDriftRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("ortho.drift.label") }),
              /* @__PURE__ */ d("select", { id: "orthoDriftSelect" })
            ] }),
            /* @__PURE__ */ x("div", { id: "orthoVerticalRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("ortho.vertical.label") }),
              /* @__PURE__ */ d("select", { id: "orthoVerticalSelect" })
            ] }),
            /* @__PURE__ */ x("label", { id: "orthoRotationRow", className: "row inline-check", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "orthoRotationToggle" }),
              /* @__PURE__ */ d("span", { children: h("ortho.rotation.label") })
            ] })
          ] }) }),
          /* @__PURE__ */ x("section", { id: "cariesSection", className: "card", children: [
            /* @__PURE__ */ x("div", { className: "card-title card-title-row", children: [
              /* @__PURE__ */ d("span", { children: h("caries.title") }),
              /* @__PURE__ */ d("button", { id: "btnToggleCariesCard", className: "icon-btn", title: h("actions.collapse", { label: h("caries.title") }), "aria-label": h("actions.collapse", { label: h("caries.title") }), children: /* @__PURE__ */ d("span", { className: "toggle-icon", "aria-hidden": "true", children: "−" }) })
            ] }),
            /* @__PURE__ */ d("div", { className: "hint", children: h("caries.hint") }),
            /* @__PURE__ */ x("div", { id: "cariesDepthRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("caries.depthLabel") }),
              /* @__PURE__ */ d("select", { id: "cariesDepthSelect" })
            ] }),
            /* @__PURE__ */ d("div", { id: "cariesChecks" }),
            /* @__PURE__ */ d("div", { id: "cariesSubcrownRow", className: "check-grid subcrown-row" }),
            /* @__PURE__ */ x("div", { id: "rootCariesRow", className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("caries.rootLabel") }),
              /* @__PURE__ */ d("select", { id: "rootCariesSelect" })
            ] })
          ] }),
          /* @__PURE__ */ x("section", { id: "fillingSection", className: "card", children: [
            /* @__PURE__ */ x("div", { className: "card-title card-title-row", children: [
              /* @__PURE__ */ d("span", { children: h("filling.title") }),
              /* @__PURE__ */ d("button", { id: "btnToggleFillingCard", className: "icon-btn", title: h("actions.collapse", { label: h("filling.title") }), "aria-label": h("actions.collapse", { label: h("filling.title") }), children: /* @__PURE__ */ d("span", { className: "toggle-icon", "aria-hidden": "true", children: "−" }) })
            ] }),
            /* @__PURE__ */ x("div", { className: "row", children: [
              /* @__PURE__ */ d("span", { children: h("filling.typeLabel") }),
              /* @__PURE__ */ d("select", { id: "fillingSelect" })
            ] }),
            /* @__PURE__ */ d("div", { id: "fillingSurfaceChecks", className: "hidden" }),
            /* @__PURE__ */ x("label", { id: "fissureSealingRow", className: "row fissure-row", children: [
              /* @__PURE__ */ d("input", { type: "checkbox", id: "fissureSealing" }),
              /* @__PURE__ */ d("span", { children: h("filling.fissureSealing") })
            ] }),
            /* @__PURE__ */ d("div", { id: "fillingSubcariesSummary", className: "hint hidden" }),
            /* @__PURE__ */ d("div", { id: "fillingDefectSummary", className: "hint hidden" })
          ] }),
          /* @__PURE__ */ x("section", { id: "rootPeriodontiumSection", className: "card", children: [
            /* @__PURE__ */ x("div", { className: "card-title card-title-row", children: [
              /* @__PURE__ */ d("span", { children: h("card.rootPeriodontium") }),
              /* @__PURE__ */ d("button", { id: "btnToggleRootPeriodontiumCard", className: "icon-btn", title: h("actions.collapse", { label: h("card.rootPeriodontium") }), "aria-label": h("actions.collapse", { label: h("card.rootPeriodontium") }), children: /* @__PURE__ */ d("span", { className: "toggle-icon", "aria-hidden": "true", children: "−" }) })
            ] }),
            /* @__PURE__ */ x("div", { id: "rpRootBlock", children: [
              /* @__PURE__ */ d("div", { className: "hint", children: h("endo.hint") }),
              /* @__PURE__ */ x("div", { id: "pulpEndoRow", className: "row", children: [
                /* @__PURE__ */ d("span", { children: h("pulpEndo.label") }),
                /* @__PURE__ */ d("select", { id: "pulpEndoSelect" })
              ] }),
              /* @__PURE__ */ x("div", { id: "apicalDxRow", className: "row", children: [
                /* @__PURE__ */ d("span", { children: h("apical.dxLabel") }),
                /* @__PURE__ */ d("select", { id: "apicalDxSelect" })
              ] }),
              /* @__PURE__ */ x("div", { id: "periapicalTypeRow", className: "row hidden", children: [
                /* @__PURE__ */ d("span", { children: h("periapical.typeLabel") }),
                /* @__PURE__ */ d("select", { id: "periapicalTypeSelect" })
              ] }),
              /* @__PURE__ */ x("div", { id: "resorptionRow", className: "row", children: [
                /* @__PURE__ */ d("span", { children: h("root.resorption") }),
                /* @__PURE__ */ d("select", { id: "resorptionSelect" })
              ] }),
              /* @__PURE__ */ x("div", { className: "row inline-checks", children: [
                /* @__PURE__ */ x("label", { children: [
                  /* @__PURE__ */ d("input", { type: "checkbox", id: "endoResection" }),
                  /* @__PURE__ */ d("span", { children: h("endo.resection") })
                ] }),
                /* @__PURE__ */ x("label", { children: [
                  /* @__PURE__ */ d("input", { type: "checkbox", id: "parapulpalPin" }),
                  /* @__PURE__ */ d("span", { children: h("endo.parapulpalPin") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ x("div", { id: "rpPerioBlock", children: [
              /* @__PURE__ */ x("div", { id: "mobilityRow", className: "row", children: [
                /* @__PURE__ */ d("span", { children: h("inflammation.mobilityLabel") }),
                /* @__PURE__ */ d("select", { id: "mobilitySelect" })
              ] }),
              /* @__PURE__ */ d("div", { id: "modsChecks", className: "check-grid" }),
              /* @__PURE__ */ d("div", { id: "calculusRow", className: "row inline-checks hidden", children: /* @__PURE__ */ x("label", { children: [
                /* @__PURE__ */ d("input", { type: "checkbox", id: "calculusToggle" }),
                /* @__PURE__ */ d("span", { children: h("calculus.label") })
              ] }) }),
              /* @__PURE__ */ x("div", { id: "periImplantRow", className: "row hidden", children: [
                /* @__PURE__ */ d("span", { children: h("periImplant.label") }),
                /* @__PURE__ */ d("select", { id: "periImplantSelect" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ d(
      Ms,
      {
        open: pt,
        onClose: () => Ze(!1),
        t: h,
        settings: ro
      }
    )
  ] });
}
export {
  As as default
};
