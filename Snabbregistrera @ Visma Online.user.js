// ==UserScript==
// @name         Snabbregistrera @ Visma Online
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Quick registration in Visma Online
// @author       tommy.pettersson@northmill.se
// @match        https://timeclock.vismaonline.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/raw/2625891/waitForKeyElements.js
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// ==/UserScript==

const months = [ "januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december" ];

const nonWorkingDays = [ "01-01", "01-06", "05-01", "06-06", "12-24", "12-25", "12-26", "12-31"];

waitForKeyElements (
    "#btn-register-time",
    addButton
);

const insertBefore = (el, referenceNode) => {
    referenceNode.parentNode.insertBefore(el, referenceNode);
};

function addButton() {
    if($('#snabbregga').length) {
        return;
    }

    let newEl = document.createElement('span');
    newEl.innerHTML = '<button id="snabbregga" class="btn btn-primary" title="Registrera att du arbetat heldag för alla vardagar som inte redan registrerats fram t.o.m. dagens datum">Snabbregga</button>';

    const ref = document.querySelector('#btn-register-time');

    insertBefore(newEl, ref);
    $("#snabbregga").on("click", markWorkDays);
};

const rafAsync = () => {
    return new Promise(resolve => {
        requestAnimationFrame(resolve); //faster than set time out
    });
};

const checkElement = (selector) => {
    if (document.querySelector(selector) === null) {
        return rafAsync().then(() => checkElement(selector));
    } else {
        return Promise.resolve(true);
    }
};

const clickCalendarItem = (day) => {
    const targLink = document.getElementById("calendar-day-" + day);

    const clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent('mousedown', true, true);
    targLink.dispatchEvent(clickEvent);

    const clickEvent2 = document.createEvent('MouseEvents');
    clickEvent2.initEvent('dblclick', true, true);
    targLink.dispatchEvent(clickEvent2);

    const clickEvent3 = document.createEvent('MouseEvents');
    clickEvent3.initEvent('mouseup', true, true);
    targLink.dispatchEvent(clickEvent3);
};

const getStartDate = () => {
    const datestring = document.querySelector("#periodDropdown").innerText.split(" ");
    const month = ((months.findIndex(e => e === datestring[1].toLowerCase()) + 1).toString()).padStart(2, '0');

    return new Date(`${datestring[2]}-${month}-${datestring[0].padStart(2, "0")}`);
};

const getEndDate = () => {
    const today = new Date();

    const datestring = document.querySelector("#periodDropdown").innerText.split(" ");
    const month = ((months.findIndex(e => e === datestring[5].toLowerCase()) + 1).toString()).padStart(2, '0');

    const endDateString = `${datestring[6]}-${month}-${datestring[4].padStart(2, "0")}`;
    const endDateInPeriod = new Date(endDateString);

    return today < endDateInPeriod ? today : endDateInPeriod;
}

const markWorkDays = async () => {
    const getDaysArray = function(s,e) {for(var a=[], d=s;d<=e;d.setDate(d.getDate()+1)){ a.push(new Date(d));}return a;}

    const startDate = getStartDate();
    const todayDate = new Date();

    if(startDate > todayDate) {
        return;
    }

    //Create the list and remove saturdays and sundays
    const daysList = getDaysArray(startDate, getEndDate())
        .filter(d => (d.getDay() != 6 && d.getDay() != 0));

    let daysToHandle = daysList.map(v => v.toLocaleString('sv-SE').slice(5,10));

    //Remove non working days
    daysToHandle = daysToHandle.filter(d => !nonWorkingDays.includes(d));

    //Remove days that already has time reported
    daysToHandle = daysToHandle.filter(d => document.querySelector("[id$='" + d + "']").children[1].children.length === 1);

    // Mark all other days as full work day
    for (let day of daysToHandle) {
        clickCalendarItem(day);

        await checkElement('#fullWorkShift');

        document.querySelector("#fullWorkShift").click();
        document.querySelector("#saveAndCloseSecondary").click();
    }

    document.activeElement.blur();
};