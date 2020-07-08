// ==UserScript==
// @name         Snabbregistrera @ Visma Online
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Quick registration in Visma Online
// @author       tommy.pettersson@northmill.se
// @homepage     https://github.com/tompet0191/QuickRegistration
// @updateURL    https://bit.ly/2wT0uT5
// @downloadURL  https://bit.ly/2wT0uT5
// @match        https://timeclock.vismaonline.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/raw/2625891/waitForKeyElements.js
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require      https://cdn.rawgit.com/meetselva/attrchange/master/js/attrchange.js
// @require      https://cdn.rawgit.com/meetselva/attrchange/master/js/attrchange_ext.js
// ==/UserScript==

const months = [ "januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober",
    "november", "december" ];

let freeDays = [ "12-24", "12-31" ]; //Adds friday between 19-25th of june that year to this list.

waitForKeyElements (
    "#btn-register-time",
    addButton
);

//finds the friday between 19-25th of June
const findMidsummerEve = () => {
    const currentYear = new Date().getFullYear();
    const possibleDays = [
        `${currentYear}-06-19`,
        `${currentYear}-06-20`,
        `${currentYear}-06-21`,
        `${currentYear}-06-22`,
        `${currentYear}-06-23`,
        `${currentYear}-06-24`,
        `${currentYear}-06-25`
    ];

    for(let day of possibleDays) {
	    if(new Date(day).getDay() === 5){
		    return day.slice(5,10);
	    }
    }
}

const addMidsummerEveToFreeDays = () => {
    const midsummer = findMidsummerEve();

    if(!freeDays.includes(midsummer)){
        freeDays.push(midsummer);
    }
}

const insertBefore = (el, referenceNode) => {
    referenceNode.parentNode.insertBefore(el, referenceNode);
};

function addButton() {
    if($('#snabbregga').length) {
        return;
    }

    addAttributeListener($('#btn-register-time'));

    let newEl = document.createElement('span');
    newEl.innerHTML = '<button id="snabbregga" class="btn btn-primary" title="Registrera att du arbetat heldag för alla' +
        ' vardagar som inte redan registrerats fram t.o.m. dagens datum">Snabbregga</button>';

    const ref = document.querySelector('#btn-register-time');

    if($('#btn-register-time').attr('disabled') === 'disabled')
        newEl.firstElementChild.setAttribute('disabled', 'disabled');

    insertBefore(newEl, ref);
    $("#snabbregga").on("click", main);
};

const addAttributeListener = ($element) => {
    $element.attrchange({
        trackValues: true,
        callback: (event) => {
            if(event.attributeName === 'disabled') {
                if(event.newValue === undefined)
                    $('#snabbregga').removeAttr('disabled');
                else
                    $('#snabbregga').attr('disabled', event.newValue);
            }
        }
    });
}

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

const createListOfWeekDays = (startDate, getDaysArray) => {
    const daysList = getDaysArray(startDate, getEndDate())
        .filter(d => (d.getDay() != 6 && d.getDay() != 0)); //remove saturdays and sundays

    return daysList.map(v => v.toLocaleString('sv-SE').slice(5,10));
}

const removeExemptedDays = (daysToHandle) => daysToHandle
    .filter(d => !freeDays.includes(d)) //Removes Christmas Eve, New Year's Eve, Midsummer Eve
    .filter(d => document.querySelector("[id$='" + d + "']").querySelector(".red-day") === null) //Remove red days
    .filter(d => document.querySelector("[id$='" + d + "']").children[1].children.length === 1); //Remove days that already has time reported

const handleMarking = async (daysToHandle) => {
    for (let day of daysToHandle) {
        clickCalendarItem(day);

        await checkElement('#fullWorkShift');

        document.querySelector("#fullWorkShift").click();
        document.querySelector("#saveAndCloseSecondary").click();
    }
}

const main = async () => {
    const getDaysArray = function(s,e) {for(var a=[], d=s;d<=e;d.setDate(d.getDate()+1)){ a.push(new Date(d));}return a;}

    const startDate = getStartDate();
    const todayDate = new Date();

    if(startDate > todayDate) {
        return;
    }

    const days = createListOfWeekDays(startDate, getDaysArray);
    addMidsummerEveToFreeDays();
    const daysToHandle = removeExemptedDays(days);

    handleMarking(daysToHandle);

    document.activeElement.blur();
};
