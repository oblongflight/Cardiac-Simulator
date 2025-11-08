let atheroPercent = 0;
let thrombusPercent = 0;
let METs = 1.0;

// Heart parameters
let heartRate = 70; // bpm (editable)

// Visual tuning
let amplitude = 60; // pixels per unit ECG amplitude
let timeWindow = 10.0; // seconds shown across the canvas

// Adjustable waveform parameters (controlled by sliders)
let tWaveScale = 1.0; // multiplier for T wave amplitude (can be negative)
let qWaveScale = 1.0; // multiplier for Q wave magnitude
let stOffset = 0.0; // ST elevation/depression (in signal units)
let tDuration = 0.12; // T wave duration (seconds, approximate width)
let qtIntervalMs = 360; // QT interval in milliseconds (Q onset to T end)

// P-wave adjustable parameters
let pDuration = 0.05; // seconds (default ~50 ms)
let pAmp = 0.25; // amplitude multiplier (visible by default)
// S-wave raise intensity (0=no effect, 1=full exponential raise)
// S-wave threshold and flatten amount
let sRaiseThreshold = 0.05; // mV where effect begins
let sFlattenAmount = 1.0; // 0=no flattening, 1=full exponential flattening
let sMaxOffset = 0.6; // maximum ST offset used for exponential mapping
let sMaxRaise = 0.0; // maximum positive raise applied to S (signal units)
const sStOverlap = 0.085; // seconds: fixed overlap between S end and ST start for smoothing
// ischemia control (0..100)
let ischemiaPercent = 0;

// DOM controls references
let controlsDiv;
let hrSlider, hrValueSpan, tSlider, tValueSpan, qSlider, qValueSpan, stSlider, stValueSpan;
let tDurationSlider, tDurationSpan, qtSlider, qtValueSpan;
let pDurationSlider, pDurationSpan, pAmpSlider, pAmpSpan;
let sRaiseSlider, sRaiseSpan;
let sThresholdSlider, sThresholdSpan, sFlattenSlider, sFlattenSpan;
let sMaxOffsetSlider, sMaxOffsetSpan;
let sMaxRaiseSlider, sMaxRaiseSpan;
let atheroSlider, atheroSpan, thrombusSlider, thrombusSpan;
let metsSlider, metsSpan;
// Vessel visual elements
let vesselDiv, vesselCanvas, vesselCtx;
let vesselSize = 0;

function setup() {
  // responsive canvas
  createCanvas(windowWidth, windowHeight);
  strokeJoin(ROUND);
  strokeCap(ROUND);

  // Create controls panel (plain DOM so it works with older p5 versions)
  controlsDiv = document.createElement('div');
  controlsDiv.style.position = 'fixed';
  controlsDiv.style.left = '10px';
  controlsDiv.style.top = '10px';
  controlsDiv.style.padding = '10px 12px';
  controlsDiv.style.background = 'rgba(255,255,255,0.9)';
  controlsDiv.style.border = '1px solid rgba(0,0,0,0.12)';
  controlsDiv.style.borderRadius = '6px';
  controlsDiv.style.zIndex = 10000;
  controlsDiv.style.fontFamily = 'Helvetica, Arial, sans-serif';
  controlsDiv.style.fontSize = '13px';
  controlsDiv.style.color = '#111';
  controlsDiv.style.minWidth = '240px';

  // helper to add a labeled slider row
  function addSliderRow(labelText, min, max, step, initial, oninput) {
    const row = document.createElement('div');
    row.style.marginBottom = '8px';

    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.marginBottom = '4px';
    row.appendChild(label);

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    input.style.flex = '1';
    input.style.marginRight = '8px';

    const val = document.createElement('span');
    val.textContent = String(initial);
    val.style.minWidth = '46px';

    input.oninput = (e) => {
      val.textContent = e.target.value;
      oninput(Number(e.target.value));
    };

    wrap.appendChild(input);
    wrap.appendChild(val);
    row.appendChild(wrap);
    controlsDiv.appendChild(row);

    return {input, val, row};
  }

  // Heart rate slider
  ({input: hrSlider, val: hrValueSpan} = addSliderRow('Heart rate (bpm)', 30, 180, 1, heartRate, (v) => heartRate = v));

  // T-wave amplitude: allow negative as well to invert T
  ({input: tSlider, val: tValueSpan} = addSliderRow('T-wave scale', -2.0, 2.0, 0.01, tWaveScale, (v) => tWaveScale = v));

  // Q-wave magnitude scale (positive multiplier; Q is negative in model)
  ({input: qSlider, val: qValueSpan} = addSliderRow('Q-wave scale', 0.0, 10.0, 0.01, qWaveScale, (v) => qWaveScale = v));

  // ST elevation/depression (signal units)
  ({input: stSlider, val: stValueSpan} = addSliderRow('ST offset (mV units)', -0.6, 0.6, 0.01, stOffset, (v) => stOffset = v));

  // T wave duration (seconds)
  ({input: tDurationSlider, val: tDurationSpan} = addSliderRow('T duration (s)', 0.04, 0.4, 0.01, tDuration, (v) => tDuration = v));

  // QT interval (ms)
  ({input: qtSlider, val: qtValueSpan} = addSliderRow('QT interval (ms)', 200, 600, 1, qtIntervalMs, (v) => qtIntervalMs = v));

  // P wave duration (seconds)
  ({input: pDurationSlider, val: pDurationSpan} = addSliderRow('P duration (s)', 0.01, 0.12, 0.005, pDuration, (v) => pDuration = v));

  // P wave amplitude (multiplier)
  ({input: pAmpSlider, val: pAmpSpan} = addSliderRow('P amplitude', 0.05, 2.0, 0.01, pAmp, (v) => pAmp = v));

  // S-raise threshold (mV) and flatten amount (0..1)
  ({input: sThresholdSlider, val: sThresholdSpan} = addSliderRow('S-raise threshold (mV)', 0.00, 0.30, 0.01, sRaiseThreshold, (v) => sRaiseThreshold = v));
  ({input: sFlattenSlider, val: sFlattenSpan} = addSliderRow('S flatten amount', 0.0, 1.0, 0.01, sFlattenAmount, (v) => sFlattenAmount = v));
  ({input: sMaxOffsetSlider, val: sMaxOffsetSpan} = addSliderRow('S max offset (mV)', 0.20, 1.00, 0.01, sMaxOffset, (v) => sMaxOffset = v));
  ({input: sMaxRaiseSlider, val: sMaxRaiseSpan} = addSliderRow('S max raise (mV)', 0.0, 1.0, 0.01, sMaxRaise, (v) => sMaxRaise = v));
  // METs (physical activity intensity)
  ({input: metsSlider, val: metsSpan} = addSliderRow('METs (0-10)', 0, 10, 0.1, METs, (v) => METs = v));

  // Ischemia percent (0..100) — displayed (computed from athero% and METs)
  ({input: ischemiaSlider, val: ischemiaSpan} = addSliderRow('Ischemia (%)', 0, 100, 1, ischemiaPercent, (v) => ischemiaPercent = v));
  // make ischemia slider read-only (value reflects computed ischemia)
  ischemiaSlider.disabled = true;

  // Vessel health sliders
  ({input: atheroSlider, val: atheroSpan} = addSliderRow('Athero %', 0, 100, 1, atheroPercent, (v) => atheroPercent = v));
  ({input: thrombusSlider, val: thrombusSpan} = addSliderRow('Thrombus %', 0, 100, 1, thrombusPercent, (v) => thrombusPercent = v));

  // Hide all sliders except the core controls we want visible
  const allowed = new Set(['METs (0-10)', 'Ischemia (%)', 'Athero %', 'Thrombus %']);
  for (let i = 0; i < controlsDiv.children.length; i++) {
    const row = controlsDiv.children[i];
    // first child is the label div
    const lbl = row.firstElementChild;
    if (!lbl) continue;
    const text = lbl.textContent.trim();
    if (!allowed.has(text)) row.style.display = 'none';
  }

  document.body.appendChild(controlsDiv);

  // Create vessel display to the right of the sliders and above the tracing
  vesselDiv = document.createElement('div');
  vesselDiv.style.position = 'fixed';
  vesselDiv.style.top = controlsDiv.style.top; // align with controls
  // place to the right of controlsDiv by using its minWidth
  const ctrlW = parseInt(controlsDiv.style.minWidth || '240', 10);
  vesselDiv.style.left = (10 + ctrlW + 12) + 'px';
  vesselSize = ctrlW; // diameter approx same as slider width
  vesselDiv.style.width = vesselSize + 'px';
  vesselDiv.style.height = vesselSize + 'px';
  vesselDiv.style.padding = '8px';
  vesselDiv.style.background = 'rgba(255,255,255,0.95)';
  vesselDiv.style.border = '1px solid rgba(0,0,0,0.12)';
  vesselDiv.style.borderRadius = '6px';
  vesselDiv.style.boxSizing = 'border-box';
  vesselDiv.style.zIndex = 10000;

  // Create an internal canvas for the vessel drawing
  vesselCanvas = document.createElement('canvas');
  vesselCanvas.width = vesselSize * window.devicePixelRatio;
  vesselCanvas.height = vesselSize * window.devicePixelRatio;
  vesselCanvas.style.width = vesselSize + 'px';
  vesselCanvas.style.height = vesselSize + 'px';
  vesselCanvas.style.display = 'block';
  vesselCanvas.style.margin = '0 auto';
  vesselCanvas.style.background = 'transparent';
  vesselDiv.appendChild(vesselCanvas);
  vesselCtx = vesselCanvas.getContext('2d');

  document.body.appendChild(vesselDiv);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // reposition and resize vessel display to follow controls width
  if (controlsDiv && vesselDiv && vesselCanvas) {
    const ctrlRect = controlsDiv.getBoundingClientRect();
    const left = Math.round(ctrlRect.left + ctrlRect.width + 12);
    vesselDiv.style.left = left + 'px';
    // keep diameter similar to controls width
    vesselSize = Math.round(ctrlRect.width);
    vesselDiv.style.width = vesselSize + 'px';
    vesselDiv.style.height = vesselSize + 'px';
    const dpr = window.devicePixelRatio || 1;
    vesselCanvas.width = vesselSize * dpr;
    vesselCanvas.height = vesselSize * dpr;
    vesselCanvas.style.width = vesselSize + 'px';
    vesselCanvas.style.height = vesselSize + 'px';
    if (vesselCtx) vesselCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function draw() {
  background(245);
  drawGrid();
  // update vessel visualization
  drawVessel();
  drawECG(heartRate);
}

// Draw a faint ECG grid like paper
function drawGrid() {
  push();
  background(250);
  stroke(230);
  strokeWeight(1);
  let step = 20;
  for (let x = 0; x < width; x += step) line(x, 0, x, height);
  for (let y = 0; y < height; y += step) line(0, y, width, y);
  pop();
}

// Main ECG renderer
function drawECG(hr) {
  let now = millis() / 1000.0;
  let beatPeriod = 60.0 / hr;
  let pixelsPerSecond = width / timeWindow;

  // Baseline center
  let centerY = height * 0.5;

  // Determine visible beat times
  let tStart = now - timeWindow - 1.0; // small buffer
  let tEnd = now + 1.0;

  // Precompute beat times in range
  let firstBeat = Math.floor(tStart / beatPeriod) * beatPeriod;
  let beatTimes = [];
  for (let t = firstBeat; t < tEnd; t += beatPeriod) beatTimes.push(t);

  // Draw ECG waveform by sampling horizontally
  noFill();
  stroke(0, 60, 0);
  strokeWeight(2);
  beginShape();
  // compute ischemia from athero% and METs, then derive effective T/ST
  // If athero < 20%, METs do not cause ischemia. Above 20%, METs > 2 increase ischemia up to METs=10.
  function computeIschemia(athero, mets, thrombus) {
    const a = constrain(athero, 0, 100);
    const t = constrain(thrombus, 0, 100);
    if (a < 20 && t < 20) return 0;
    // athero vulnerability factor (0..1) over 20..100
    const aFactor = a <= 20 ? 0 : (a - 20) / 80.0;
    // thrombus factor (0..1)
    const tFactor = t / 100.0;
    // bias thrombus to have stronger effect
    const thrombusBias = 1.5;
    // combined structural vulnerability (weighted)
    const combinedVuln = constrain((aFactor + thrombusBias * tFactor) / (1.0 + thrombusBias), 0, 1);

    // compute total anatomical narrowing fraction (used to force ischemia at extreme stenosis)
    const aFrac = a / 100.0;
    const tFrac = t / 100.0;
    const combinedFrac = Math.min(1.0, aFrac + thrombusBias * tFrac * (1.0 - aFrac));

    // METs effect (no effect until METs > 2)
    const metFactor = constrain((mets - 2) / (10 - 2), 0, 1);
    // amplify the effect of METs when structural vulnerability is high
    const vulnAmplification = 3.0; // tuning parameter (larger -> more sensitivity)
    const metAmplifier = 1.0 + vulnAmplification * combinedVuln;
    const baseIschemia = constrain(combinedVuln * metFactor * metAmplifier * 100.0, 0, 100);

  // Thrombus-driven ischemia: thrombus produces ischemia immediately and increases with %
  // Make thrombus effect larger when athero is present (synergy).
  // thrombusBias already used for narrowing; reuse here and amplify by athero fraction.
  const aFracLocal = a / 100.0;
  const thrombusAtheroSynergy = 2.0; // additional multiplier per full athero fraction
  const thrombusMultiplier = 1.0 + thrombusAtheroSynergy * aFracLocal;
  const thrombusIschemia = constrain(tFactor * thrombusBias * thrombusMultiplier * 100.0, 0, 100);

    // The effective ischemia is at least the thrombus-driven value or the METs-driven base
    let effectiveIschemia = Math.max(baseIschemia, thrombusIschemia);

    // Per new rule: only allow ischemia to exceed 95% when anatomical narrowing > 99%.
    // Otherwise cap ischemia at 95%.
    const capLevel = 85.0;
    if (combinedFrac > 0.99) {
      // ramp from capLevel -> 100 as combinedFrac goes 0.99 -> 1.0
      const f = constrain((combinedFrac - 0.99) / 0.01, 0, 1);
      // start ramp from at most capLevel
      const start = Math.min(effectiveIschemia, capLevel);
      return lerp(start, 100.0, f);
    }

    // Not yet beyond the 99% anatomical threshold: cap ischemia at 95%.
    return Math.min(effectiveIschemia, capLevel);
  }

  let baselineT = tWaveScale;
  let baselineST = stOffset;
  // compute derived ischemia and update displayed readout
  const derivedIschemia = computeIschemia(atheroPercent, METs, thrombusPercent);
  ischemiaPercent = derivedIschemia;
  if (typeof ischemiaSpan !== 'undefined') ischemiaSpan.textContent = String(Math.round(ischemiaPercent));
  if (typeof ischemiaSlider !== 'undefined') ischemiaSlider.value = String(Math.round(ischemiaPercent));

  let pct = constrain(ischemiaPercent, 0, 100);
  let effT = baselineT;
  let effST = baselineST;
  if (pct > 0) {
    if (pct <= 50) {
      let f = pct / 50.0;
      effT = lerp(baselineT, -1, f);
      effST = baselineST;
    } else if (pct <= 90) {
      effT = -1;
      let f = (pct - 50) / 40.0;
      effST = lerp(baselineST, -0.4, f);
    } else if (pct <= 95) {
      effT = -1;
      let f = (pct - 90) / 5.0;
      effST = lerp(-0.4, 0.1, f);
    } else {
      let f = (pct - 95) / 5.0;
      effT = lerp(-1, -0.25, f);
      effST = lerp(0.1, 0.7, f);
    }
  }

  for (let x = 0; x <= width; x += 2) {
    // map x to time: right edge is 'now'
    let t = now - (width - x) / pixelsPerSecond;
    let v = 0;
    for (let bt of beatTimes) {
      v += singleBeatSignal(t - bt, effT, effST);
    }
    let y = centerY - v * amplitude;
    vertex(x, y);
  }
  endShape();

  // Draw labels for P, QRS, T for beats that are (mostly) visible
  textFont('Helvetica');
  textSize(16);
  fill(120);
  noStroke();
  for (let bt of beatTimes) {
    // P wave center (approx -0.20s)
    let tP = bt - 0.18;

    // QRS center (0s)
    let tQRS = bt;

    // T wave center (+0.35s)
    let tT = bt + 0.35;
  }

  // Small HUD for heart rate
  push();
  fill(0);
  noStroke();
  rect(10, 10, 140, 34, 6);
  fill(255);
  textSize(16);
  text('HR: ' + Math.round(hr) + ' bpm', 18, 32);
  pop();
}

// Convert a timestamp to an x coordinate on screen given current time
function timeToX(t, now, pixelsPerSecond) {
  return width - (now - t) * pixelsPerSecond;
}

// Single beat signal function (seconds relative to beat center)
// Composed of P wave (small, negative/positive), QRS (sharp), and T wave (broader)
function singleBeatSignal(t, effTWaveScale, effSTOffset) {
  // We'll build each wave with explicit windows so we can enforce
  // small baseline intervals between waves.
  // Default window boundaries (relative to QRS at t=0)
  const pStartDefault = -0.28;
  // move P a little closer to QRS by default so it's more visible at higher HR
  const pEndDefault = -0.10;
  const qStart = -0.06;
  const qEnd = 0.0; // Q occurs just before R
  const rStart = -0.02;
  const rEnd = 0.02;
  const sStart = 0.02;
  const sEnd = 0.08;
  const tStartDefault = 0.12;
  const tEnd = 0.55;

  // Minimum gaps (seconds)
  const minPQGap = 0.04; // gap between end of P and start of Q
  const minTPGap = 0.06; // gap between end of T and start of next P

  // Determine beatPeriod from current heartRate (global)
  const beatPeriod = 60.0 / heartRate;

  // Adjust P window end so P and Q are separated by at least minPQGap
  let pStart = pStartDefault;
  let pEnd = Math.min(pEndDefault, qStart - minPQGap);
  if (pEnd <= pStart + 0.01) {
    // ensure a tiny width
    pEnd = pStart + 0.01;
  }

  // Ensure there's a gap between current beat's T end and the NEXT beat's P start.
  // Next beat's P start would be at (beatPeriod + pStart). We want:
  // (beatPeriod + pStart) - tEnd >= minTPGap  =>  pStart >= tEnd - beatPeriod + minTPGap
  const neededPStart = tEnd - beatPeriod + minTPGap;
  if (pStart < neededPStart) {
    // shift P start later to create the required gap
    pStart = neededPStart;
    // keep pEnd not after qStart - minPQGap
    pEnd = Math.min(pEnd, qStart - minPQGap);
    if (pEnd <= pStart + 0.01) pEnd = pStart + 0.01;
  }

  // Helper: smooth rectangular window (raised-cosine taper)
  function smoothWindow(x, a, b) {
    if (x <= a || x >= b) return 0.0;
    const w = (x - a) / (b - a);
    // taper 10% of edges
    const edge = 0.1;
    if (w < edge) {
      const t = w / edge;
      return 0.5 * (1 - Math.cos(Math.PI * t));
    } else if (w > 1 - edge) {
      const t = (1 - w) / edge;
      return 0.5 * (1 - Math.cos(Math.PI * t));
    }
    return 1.0;
  }

  // P component: use user-controlled P duration while still respecting minimal gaps.
  let desiredPdur = pDuration; // seconds (user-controlled)

  // Compute constraints for P center so P window stays between neededPStart and qStart - minPQGap
  let minCenter = neededPStart + desiredPdur / 2.0;
  let maxCenter = qStart - minPQGap - desiredPdur / 2.0;

  // If constraints conflict (very high HR), shrink desiredPdur to fit available space
  if (minCenter > maxCenter) {
    const available = (qStart - minPQGap) - neededPStart;
    if (available <= 0.0) {
      // no room, fallback to a very narrow P centered between bounds
      desiredPdur = 0.01;
      minCenter = neededPStart + desiredPdur / 2.0;
      maxCenter = qStart - minPQGap - desiredPdur / 2.0;
    } else {
      // shrink to 90% of available
      desiredPdur = Math.max(0.01, available * 0.9);
      minCenter = neededPStart + desiredPdur / 2.0;
      maxCenter = qStart - minPQGap - desiredPdur / 2.0;
    }
  }

  // pick a center near the previous center but constrained
  const prevCenter = (pStart + pEnd) / 2.0;
  let pCenter = constrain(prevCenter, minCenter, maxCenter);

  // set p window to desired duration around center
  pStart = pCenter - desiredPdur / 2.0;
  pEnd = pCenter + desiredPdur / 2.0;

  // Enforce that P always ends before Q start minus minPQGap.
  const latestPEnd = qStart - minPQGap;
  if (pEnd > latestPEnd) {
    // shift left so pEnd == latestPEnd
    const shift = pEnd - latestPEnd;
    pCenter -= shift;
    pStart -= shift;
    pEnd = latestPEnd;
  }

  // Try to keep P start after neededPStart (to maintain T->P gap), but
  // never allow P to end after latestPEnd. If both can't be satisfied
  // (common at high HR), prioritize keeping P before Q by clamping to latestPEnd
  if (pStart < neededPStart) {
    // available space between neededPStart and latestPEnd
    const available = latestPEnd - neededPStart;
    if (available >= desiredPdur) {
      // there is room: place P starting at neededPStart
      pStart = neededPStart;
      pEnd = pStart + desiredPdur;
      pCenter = (pStart + pEnd) / 2.0;
    } else {
      // not enough room to satisfy both; prioritize P before Q
      // set pEnd to latestPEnd and shrink duration to available (min 0.01s)
      const newDur = Math.max(0.01, available);
      pEnd = latestPEnd;
      pStart = pEnd - newDur;
      pCenter = (pStart + pEnd) / 2.0;
      desiredPdur = newDur;
    }
  }

  // ensure visible sigma (duration/4)
  const pSigma = Math.max(0.008, desiredPdur / 4.0);
  let p = gauss(t, pCenter, pSigma) * pAmp * smoothWindow(t, pStart, pEnd);

  // Q component: small negative before R, scaled by qWaveScale
  const qCenter = -0.03;
  const qSigma = 0.02;
  let q = -gauss(t, qCenter, qSigma) * 0.08 * qWaveScale * smoothWindow(t, qStart, qEnd);

  // R component
  const rCenter = 0.0;
  const rSigma = 0.01;
  // Reduce R amplitude as Q magnitude increases above 2.0.
  // At qWaveScale==2 -> rScale==1.0. At qWaveScale==3 -> rScale==0.0.
  const rScale = constrain(3.0 - qWaveScale, 0.0, 1.0);
  let r = gauss(t, rCenter, rSigma) * 1.0 * rScale * smoothWindow(t, rStart, rEnd);

  // S component
  const sCenter = 0.045;
  const sSigma = 0.02;
  // Raise (reduce the negative depth of) the S wave when ST elevation is present
  // so S becomes less negative as effSTOffset increases beyond a small threshold.
  const sBase = -gauss(t, sCenter, sSigma) * 0.2;
  let sScale = 1.0;
  // Use sRaiseThreshold and sFlattenAmount sliders to control when and how
  // S is raised. For effSTOffset > threshold we compute an exponential falloff
  // and blend it according to sFlattenAmount (0=no effect, 1=full).
  if (effSTOffset > sRaiseThreshold) {
    const maxOffset = sMaxOffset;
    const eps = 0.01;
    const denom = Math.max(1e-6, maxOffset - sRaiseThreshold);
    const k = Math.log(1 / eps) / denom; // decay constant
    let expScale = Math.exp(-k * (effSTOffset - sRaiseThreshold));
    expScale = constrain(expScale, 0, 1);
    sScale = (1 - sFlattenAmount) * 1 + sFlattenAmount * expScale;
    sScale = constrain(sScale, 0, 1);
  }
  // Blend S between its scaled negative base and a positive raise value.
  // When sScale==1 => s == sBase (original negative S).
  // When sScale==0 => s == sMaxRaise (fully raised, possibly positive).
  let sWindow = smoothWindow(t, sStart, sEnd);
  let s = (sBase * sScale + (1 - sScale) * sMaxRaise) * sWindow;
  // Reduce S amplitude in the same way as R when Q-wave scale increases above 2.
  // Use rScale computed for R (1 at qWaveScale<=2, 0 at qWaveScale>=3).
  if (typeof rScale !== 'undefined') {
    s *= rScale;
  }

  // T component with windowing
  // Compute T end from QT interval (qtIntervalMs) measured from Q onset (qStart)
  const qtSec = qtIntervalMs / 1000.0;
  // Ensure T end is at least slightly after intended start
  let tEndComputed = qStart + qtSec;
  // Clamp tEnd to sensible range
  const tEndMin = tStartDefault + 0.02;
  const tEndMax = 1.2; // avoid runaway
  let tEndFinal = constrain(tEndComputed, tEndMin, tEndMax);

  // Use tStartDefault as an anchor for T start, but ensure it is before tEndFinal
  let tStart = tStartDefault;
  if (tStart >= tEndFinal - 0.02) {
    tStart = tEndFinal - 0.02;
  }

  // T center placed in the middle of the T window
  const tCenter = (tStart + tEndFinal) / 2.0;
  // Derive sigma from desired T duration (tDuration global) so sigma ~ duration/4
  const tSigma = Math.max(0.005, tDuration / 4.0);
  let tw = gauss(t, tCenter, tSigma) * 0.36 * effTWaveScale * smoothWindow(t, tStart, tEndFinal);

  // ST segment: create a smooth plateau (flat ST) between the end of S and
  // the start of T using the raised-cosine smoothWindow. This gives a
  // gentle transition from the S wave into the ST segment instead of a
  // gaussian tail that can look abrupt.
  // Define a window from slightly before sEnd to slightly before tStart
  let stStart = sEnd - sStOverlap; // fixed overlap with S for smoothing
  // Make ST end always centered on the T wave (tCenter).
  let stEndWindow = tCenter;
  // Ensure there's at least a minimal window; if not, push stStart earlier.
  if (stEndWindow <= stStart + 0.005) {
    stStart = stEndWindow - 0.005;
  }
  let st = effSTOffset * smoothWindow(t, stStart, stEndWindow);

  return p + q + r + s + tw + st;
}

// Simple Gaussian helper
function gauss(x, mu, sigma) {
  let a = (x - mu) / sigma;
  return Math.exp(-0.5 * a * a);
}

// Draw the transverse vessel inside the small DOM canvas
function drawVessel() {
  if (!vesselCtx || !vesselCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  // ensure transform accounts for pixel ratio
  vesselCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = vesselCanvas.width / dpr;
  const h = vesselCanvas.height / dpr;
  vesselCtx.clearRect(0, 0, w, h);

  // center and radii
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) * 0.45; // wall outer radius
  const wallThickness = Math.max(4, outerR * 0.14);
  const innerR = outerR - wallThickness; // lumen radius

  // draw vessel wall (outer)
  vesselCtx.beginPath();
  vesselCtx.arc(cx, cy, outerR, 0, Math.PI * 2);
  vesselCtx.fillStyle = '#f0f0f0';
  vesselCtx.fill();
  vesselCtx.lineWidth = 2;
  vesselCtx.strokeStyle = '#999';
  vesselCtx.stroke();
  // draw lumen and concentric plaque narrowing based on atheroPercent
  const aPercent = constrain(atheroPercent, 0, 100);
  const aFrac = aPercent / 100.0;
  // compute new inner lumen radius (concentric narrowing)
  const minLumen = 1; // minimal visible lumen radius in pixels
  let newInnerR = innerR;
  // compute inner radius after athero alone
  const tPercent_raw = constrain(thrombusPercent, 0, 100);
  const tFrac = tPercent_raw / 100.0;
  const thrombusBias = 1.5; // thrombus contributes more per percent
  const innerR_afterAthero = Math.max(minLumen, innerR * (1.0 - aFrac));

  // combined narrowing: thrombus eats into the remaining lumen after athero
  const extraFrac = thrombusBias * tFrac * (1.0 - aFrac);
  const combinedFrac = Math.min(1.0, aFrac + extraFrac);
  newInnerR = Math.max(minLumen, innerR * (1.0 - combinedFrac));

  // draw athero annulus (between innerR and innerR_afterAthero) if present
  if (aFrac > 0.001 && innerR_afterAthero < innerR - 0.5) {
    vesselCtx.beginPath();
    vesselCtx.arc(cx, cy, innerR, 0, Math.PI * 2, false);
    vesselCtx.arc(cx, cy, innerR_afterAthero, 0, Math.PI * 2, true);
    vesselCtx.closePath();
    // plaque color: match vessel wall (gray)
    vesselCtx.fillStyle = '#f0f0f0';
    vesselCtx.fill();
    vesselCtx.strokeStyle = '#999';
    vesselCtx.lineWidth = Math.max(1, Math.round(innerR * 0.03));
    vesselCtx.stroke();
  }

  // draw thrombus annulus (between innerR_afterAthero and newInnerR) if thrombus narrows further
  if (tFrac > 0.001 && newInnerR < innerR_afterAthero - 0.5) {
    vesselCtx.beginPath();
    vesselCtx.arc(cx, cy, innerR_afterAthero, 0, Math.PI * 2, false);
    vesselCtx.arc(cx, cy, newInnerR, 0, Math.PI * 2, true);
    vesselCtx.closePath();
    // thrombus color: brown
    vesselCtx.fillStyle = '#8B4513';
    vesselCtx.fill();
    vesselCtx.strokeStyle = '#5a2b0a';
    vesselCtx.lineWidth = Math.max(1, Math.round(innerR * 0.02));
    vesselCtx.stroke();
  }

  // draw lumen at the (possibly) narrowed radius
  vesselCtx.beginPath();
  vesselCtx.arc(cx, cy, newInnerR, 0, Math.PI * 2);
  vesselCtx.fillStyle = '#ffdddd';
  vesselCtx.fill();
  vesselCtx.lineWidth = 1.5;
  vesselCtx.strokeStyle = '#cc6666';
  vesselCtx.stroke();

  // (thrombus now represented as annulus; no central dot)

  // small label
  vesselCtx.fillStyle = '#222';
  vesselCtx.font = Math.max(10, Math.round(w * 0.07)) + 'px sans-serif';
  vesselCtx.textAlign = 'center';
  vesselCtx.fillText('Vessel (transverse)', cx, h - 8);
}
