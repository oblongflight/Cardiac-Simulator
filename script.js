let patients = [];
let activePatients = [];
let activePatientsTrimmed = [];

let complaintsESI1 = [
  "chest pain",
  "back pain",
  "shortness of breath",
  "fall",
  "seizure",
  "numbness",
  "dizziness",
  "syncope",
  "suicide attempt",
  "alcohol withdrawal",
  "stroke",
  "opiate overdose",
  "altered mental status",
  "cardiac arrest",
  "car accident",
  "motorcycle accident",
  "gunshot wound",
];

let complaintsESI234 = [
  "chest pain",
  "back pain",
  "shortness of breath",
  "fall",
  "seizure",
  "numbness",
  "dizziness",
  "syncope",
  "alcohol withdrawal",
  "opiate overdose",
  "altered mental status",
  "car accident",
  "motorcycle accident",
  "vaginal discharge",
  "vaginal bleeding",
  "painful urination",
  "flank pain",
  "abdominal pain",
  "generalized weakness",
  "headache",
  "migraine",
  "ear pain",
  "sinus infection",
  "mental health problem",
  "alcohol intoxication",
  "dental problem",
  "eye pain",
  "eye redness",
  "vision loss",
  "runny nose",
  "hip injury",
  "rib pain",
  "vomiting",
  "abdominal pain",
  "diarrhea",
  "testicular pain",
  "skin infection",
  "assault",
  "car accident",
  "methamphetamine use",
  "headache",
  "leg swelling",
  "pregnancy concern",
  "laceration",
  "finger injury",
  "wrist injury",
  "shoulder dislocation",
  "broken nose",
  "cough",
  "fever",
  "sore throat",
  "ankle injury",
  "knee injury",
];

let complaintsESI5 = [
  "stubbed toe",
  "ingrown toenail",
  "bug bite",
  "STD concern",
  "ear pain",
  "nasal congestion",
  "finger pain",
  "pinkeye",
  "hemorrhoid",
];

let ESIcolors = [0, "red", "orange", "yellow", "green", "blue"];

let slider;

let c = 0;
let minutes = 0;
let timeHours = 0;

let arrivalsperHour = [];

let arrivals = [];

let arrivalsSorted = [];

let timeMinutes = 0;

let silverZone = []
let blueZone = []
let purpleZone = []
let orangeZone = []
let superTrack = []
let MRR = []

function setup() {
  createCanvas(1920, 1080);
  patientNumber = round(random(310, 350));
  generatePatients(patientNumber);
  print(patients);
  slider = createSlider(0, 1440, 0, 1);
  slider.position(60, 10);
  slider.size(400);
  let activePatients = []
}

function draw() {
  timeMinutes = slider.value();
  slider.changed(updateActivePatients);

  activePatients.forEach((p, i) => {
    fill(ESIcolors[p[0]]);
    strokeWeight(1);
    if (p[3] == "ambulanceWaiting") {
      circle(200, i * 10, 20);
    } else {
      circle(20, i * 10, 20);
    }
  });
}

function updateActivePatients() {
  activePatients = [];
  patients.forEach((p, i) => {
    if (p[6] < timeMinutes && p[7] > timeMinutes) {
      activePatients[i] = p;
    }
  });

  activePatients = activePatients.filter(Boolean)
  print(activePatients);
  print(timeMinutes);
  fill('black')
    clear();

    hours = floor(timeMinutes/60)
  minutes = timeMinutes % 60
  text(str(hours) + ':' + str(minutes), 410, 10)
}

function updateMap() {
  activePatients.forEach((p, i) => {
    fill(ESIcolors[p[0]]);
    strokeWeight(1);
  });
}

function generatePatients(patientNumber) {
  let ESI1 = 6;
  let ESI2 = 146;
  let ESI3 = 702;
  let ESI4 = 136;
  let ESI5 = 14;

  let LOS1 = 160;
  let LOS2 = 190;
  let LOS3 = 216;
  let LOS4 = 132;
  let LOS5 = 73;

  let arrivalCurve = [
    3,
    2.5,
    2,
    2,
    1.5,
    1.5,
    1.8,
    2.4,
    3.5,
    4.5,
    5.4,
    5.6,
    5.5,
    5.4,
    5.4,
    5.5,
    5.7,
    5.9,
    5.8,
    5.7,
    5.5,
    5.2,
    4.8,
    3.9,
  ];

  arrivalCurve.forEach((p, i) => {
    append(arrivalsperHour, round((patientNumber * arrivalCurve[i]) / 100));
  });

  arrivalsperHour.forEach((p, i) => {
    for (var d = 0; d < arrivalsperHour[i]; d++) {
      append(arrivals, round(random(0, 60) + i * 60));
    }
  });

  arrivalsSorted = sort(arrivals);

  let ESIcurve = [
    ESI1,
    ESI1 + ESI2,
    ESI1 + ESI2 + ESI3,
    ESI1 + ESI2 + ESI3 + ESI4,
  ];

  for (var i = 0; i < patientNumber; i++) {
    randomESI = random(0, 1000);
    if (randomESI < ESIcurve[0]) {
      ESI = 1;
      complaint = complaintsESI1[round(random(0, complaintsESI1.length - 1))];
      dispo = "admit";
      LOS = round(random(-120, 120) + LOS1);
      room = random(1, 4);
      if (round(random(0, 1)) == 0) {
        arrival = "ambulance";
      } else {
        arrival = "intake";
      }
    } else if (randomESI < ESIcurve[1]) {
      ESI = 2;
      complaint =
        complaintsESI234[round(random(0, complaintsESI234.length - 1))];
      if (round(random(0, 1)) == 1) {
        dispo = "admit";
      } else {
        dispo = "discharge";
      }
      LOS = round(random(-60, 60) + LOS2);
      if (random(0, 1) > 0.7) {
        arrival = "ambulance";
      } else {
        arrival = "intake";
      }
    } else if (randomESI < ESIcurve[2]) {
      ESI = 3;
      complaint =
        complaintsESI234[round(random(0, complaintsESI234.length - 1))];
      LOS = round(random(-100, 100) + LOS3);
      if (random(0, 1) > 0.7) {
        arrival = "ambulance";
      } else {
        arrival = "intake";
      }
      if (random(0, 1) < 0.2 && arrival == "intake") {
        dispo = "intakeDischarge";
      } else if (random(0, 0.8) > 0.3) {
        dispo = "discharge";
      } else {
        dispo = "admit";
      }
    } else if (randomESI < ESIcurve[3]) {
      ESI = 4;
      complaint =
        complaintsESI234[round(random(0, complaintsESI234.length - 1))];
      if (random(0, 1) > 0.5) {
        dispo = "intakeDischarge";
      } else if (random(0, 1) > 0.2) {
        dispo = "discharge";
      } else {
        dispo = "admit";
      }
      LOS = round(random(-100, 100) + LOS4);
      if (random(0, 1) > 0.95) {
        arrival = "ambulance";
      } else {
        arrival = "intake";
      }
    } else {
      ESI = 5;
      complaint = complaintsESI5[round(random(0, complaintsESI5.length - 1))];
      if (random(0, 1) > 0.1) {
        dispo = "intakeDischarge";
      } else {
        dispo = "discharge";
      }
      LOS = round(random(-50, 50) + LOS5);
      arrival = "intake";
    }
    if (arrival == "ambulance") {
      room = "ambulanceWaiting";
    } else {
      room = "intakeWaiting";
    }

    arrivalTime = arrivalsSorted[i];
    departureTime = arrivalTime + LOS;

    append(patients, [
      ESI,
      complaint,
      LOS,
      room,
      dispo,
      arrival,
      arrivalTime,
      departureTime,
    ]);
  }
}
