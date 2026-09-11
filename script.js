let userType = 'adult';
let calcMode = 'wake';

// Populate Dropdowns
function initOptions() {
  ['wakeHour', 'bedHour'].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
      const val = i < 10 ? '0' + i : i;
      el.innerHTML += `<option value="${i}">${val}</option>`;
    }
  });

  ['wakeMinute', 'bedMinute'].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    for (let i = 0; i < 60; i += 5) {
      const val = i < 10 ? '0' + i : i;
      el.innerHTML += `<option value="${val}">${val}</option>`;
    }
  });

  // Auto set current device time on page load
  fetchCurrentTime('wake');
  fetchCurrentTime('bed');
}

function fetchCurrentTime(target) {
  const now = new Date();
  let hours = now.getHours();
  let minutes = Math.round(now.getMinutes() / 5) * 5;
  if (minutes === 60) {
    minutes = 0;
    hours = (hours + 1) % 24;
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // convert 0 to 12

  const minStr = minutes < 10 ? '0' + minutes : minutes.toString();

  if (target === 'wake') {
    document.getElementById('wakeHour').value = hours;
    document.getElementById('wakeMinute').value = minStr;
    document.getElementById('wakeAmpm').value = ampm;
  } else {
    document.getElementById('bedHour').value = hours;
    document.getElementById('bedMinute').value = minStr;
    document.getElementById('bedAmpm').value = ampm;
  }
}

function setUserType(type) {
  userType = type;
  document.getElementById('typeAdult').classList.toggle('active', type === 'adult');
  document.getElementById('typeKid').classList.toggle('active', type === 'kid');
  document.getElementById('customCycleMin').value = type === 'kid' ? 60 : 90;
}

function setCalcMode(mode) {
  calcMode = mode;
  document.getElementById('modeWake').classList.toggle('active', mode === 'wake');
  document.getElementById('modeBed').classList.toggle('active', mode === 'bed');
  document.getElementById('modeManual').classList.toggle('active', mode === 'manual');

  document.getElementById('wakeTimeSection').style.display = (mode === 'wake' || mode === 'manual') ? 'block' : 'none';
  document.getElementById('bedTimeSection').style.display = (mode === 'bed' || mode === 'manual') ? 'block' : 'none';
  
  document.getElementById('timeSectionLabel').innerText = mode === 'manual' ? 'Target Wake Up Time:' : 'Target Time:';
  document.getElementById('sleepResultBox').style.display = 'none';
}

function toggleManualSettings() {
  const block = document.getElementById('manualSettingsBlock');
  const txt = document.getElementById('manualToggleText');
  if (block.style.display === 'none') {
    block.style.display = 'block';
    txt.innerText = 'Hide Custom Cycle Settings';
  } else {
    block.style.display = 'none';
    txt.innerText = 'Show Custom Cycle Settings';
  }
}

function getTimeObject(hId, mId, ampmId) {
  let h = parseInt(document.getElementById(hId).value);
  const m = parseInt(document.getElementById(mId).value);
  const ampm = document.getElementById(ampmId).value;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function calculateSleep() {
  const cycleDuration = parseInt(document.getElementById('customCycleMin').value) || 90;
  const fallAsleepMin = parseInt(document.getElementById('customFallAsleep').value) || 0;
  const suggestionsList = document.getElementById('advTimeList');
  const manualBox = document.getElementById('manualSummaryBox');

  suggestionsList.innerHTML = '';
  manualBox.style.display = 'none';

  if (calcMode === 'manual') {
    let bedDate = getTimeObject('bedHour', 'bedMinute', 'bedAmpm');
    let wakeDate = getTimeObject('wakeHour', 'wakeMinute', 'wakeAmpm');

    if (wakeDate <= bedDate) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }

    let diffMinutes = Math.floor((wakeDate - bedDate) / (1000 * 60)) - fallAsleepMin;
    if (diffMinutes < 0) diffMinutes = 0;

    const totalHours = (diffMinutes / 60).toFixed(1);
    const cyclesCompleted = (diffMinutes / cycleDuration).toFixed(1);

    document.getElementById('resTitle').innerText = 'Your Sleep Analysis';
    document.getElementById('resSubInfo').innerText = `Analysis based on selected bedtime & wake up time.`;

    manualBox.innerHTML = `
      <strong>Total Sleep Time:</strong> ${totalHours} Hours<br>
      <strong>Cycles Completed:</strong> ${cyclesCompleted} Cycles (${cycleDuration} mins each)<br>
      <strong>Status:</strong> ${cyclesCompleted >= 5 ? '✅ Optimal Sleep Duration' : '⚠️ Less than recommended sleep'}
    `;
    manualBox.style.display = 'block';
  } else {
    let baseTime = calcMode === 'wake' ? getTimeObject('wakeHour', 'wakeMinute', 'wakeAmpm') : getTimeObject('bedHour', 'bedMinute', 'bedAmpm');
    const cycles = userType === 'kid' ? [9, 8, 7, 6] : [6, 5, 4, 3];

    cycles.forEach(c => {
      const targetTime = new Date(baseTime.getTime());
      const totalMinutes = (c * cycleDuration) + fallAsleepMin;

      if (calcMode === 'wake') {
        targetTime.setMinutes(targetTime.getMinutes() - totalMinutes);
      } else {
        targetTime.setMinutes(targetTime.getMinutes() + totalMinutes);
      }

      const formattedTime = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const card = document.createElement('div');
      const isOptimal = (userType === 'adult' && c >= 5) || (userType === 'kid' && c >= 8);
      card.className = `time-card ${isOptimal ? 'recommended' : ''}`;
      
      card.innerHTML = `
        <span class="time-val">${formattedTime}</span>
        <span class="cycle-count">${c} Cycles${isOptimal ? ' (Optimal)' : ''}</span>
      `;
      suggestionsList.appendChild(card);
    });

    document.getElementById('resTitle').innerText = calcMode === 'wake' ? 'Suggested Bedtimes' : 'Suggested Wake Up Times';
    document.getElementById('resSubInfo').innerText = `Accounts for ${fallAsleepMin} mins to fall asleep.`;
  }

  document.getElementById('sleepResultBox').style.display = 'block';
}

// Initialize on script load
initOptions();
