// TODO: design
// TODO: upozornění na captchu?
// TODO: disclaimer ať si nejdřív nastavíš skript manuálně
// TODO: disclaimer na cleanup session a local storage, když ti něco přestane fungovat (vyhodíš si content z obrazovky)

(function() {
    'use strict';

    // adjust this number to your needs based on the length of your refresh cycle
    let adjustableScavengingTimeInHours = localStorage.getItem("adjustableScavengingTimeInHours") || 1.5; // Default value
    // adjust this number to your needs based on the length of your refresh cycle
    let adjustableRefreshTimeInHours = localStorage.getItem("adjustableRefreshTimeInHours") || 0.5; // Default value

    let chosenScavengingGroupName = sessionStorage.getItem("chosenScavengingGroupName") || localStorage.getItem("chosenScavengingGroupName") || "všechno";

    const hasScriptBeenStartedByConfig = sessionStorage.getItem("scriptStarted") === "true";

    let scavengingCounter = sessionStorage.getItem("scavengingCounter") ? parseInt(sessionStorage.getItem("scavengingCounter"), 10) : 0;

    const storedScavengingElementPosition = {
        top: localStorage.getItem("scavengingElementPositionTop") || "50px",
        right: localStorage.getItem("scavengingElementPositionRight") || "0px"
    };

    // Your refresh input in hours converted to miliseconds
    // Function to get refresh time with random element of 2 minutes to make sure anticheat won't detect it and to make sure all scavenging units are done by the time the page refreshes
    function getRefreshTime(timeToRandomize) {
        return (timeToRandomize * 3600 + 60 + Math.random() * 59 + 1);
    }

    const delay = (minSeconds, maxSeconds) => {
        let delayTime;
        if (maxSeconds !== undefined) {
            const randomDelaySeconds = Math.random() * (maxSeconds - minSeconds) + minSeconds;
            delayTime = randomDelaySeconds * 1000;
        } else {
            delayTime = minSeconds * 1000;
        }
        return new Promise(resolve => setTimeout(resolve, delayTime));
    };

    // Function to mark the script as started
    const markScriptAsStarted = () => {
        sessionStorage.setItem("scriptStarted", true);
    };

    const createScavengingStatusDisplay = () => {
        const displayHTML = `
            <div id="scavenging-counter-display" style="position: fixed; top: ${storedScavengingElementPosition.top}; right: ${storedScavengingElementPosition.right}; z-index: 50; cursor: move; padding: 20px; border-radius: 5px; background: white; display: flex; flex-direction: column; text-align: start;">
                <div style="margin-bottom: 10px;">
                    Scavenging Executions: <span id="scavenging-counter">${scavengingCounter}</span>
                </div>
                <div>
                    Next Cycle In: <span id="scavenging-timer">Calculating...</span>
                </div>
            </div>
        `;

        const container = document.getElementById('topContainer');
        if (container) {
            container.insertAdjacentHTML('afterbegin', displayHTML);
        }

        const scavengingDisplay = document.getElementById("scavenging-counter-display");
        if (scavengingDisplay) {
            makeElementDraggable(scavengingDisplay);
        }
    };

    const updateScavengingCounterDisplay = () => {
        scavengingCounter++;
        sessionStorage.setItem("scavengingCounter", scavengingCounter);

        const counterElement = document.getElementById("scavenging-counter");
        if (counterElement) {
            counterElement.textContent = scavengingCounter;
        }
    };

    let timerInterval;

    const updateScavengingTimerDisplay = (refreshTimeInSeconds) => {
        const refreshTimeInMiliseconds = refreshTimeInSeconds * 1000;
        const endTime = new Date().getTime() + refreshTimeInMiliseconds;
        timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;
            if (distance < 0) {
                clearInterval(timerInterval);
                document.getElementById("scavenging-timer").textContent = "Completed";
                document.title = "Scavenging Completed";
                return;
            }
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let timeString = "";
            if (hours > 0) {
                timeString += `${hours}h `;
            }
            timeString += `${minutes}m ${seconds}s`;

            document.getElementById("scavenging-timer").textContent = timeString;
            document.title = `Next Cycle In: ${timeString}`;

        }, 1000);
    };

    const loadExternalScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    function setValueToInput(querySelector, value) {
        const input = document.querySelector(querySelector);
        if (input) {
            input.value = value;
        } else {
            console.error(`No element found with selector ${querySelector}`);
        }
    };

    const clickButtons = async (querySelector) => {
        const sendButtons = document.querySelectorAll(querySelector);
        for (const sendButton of sendButtons) {
            sendButton.click();
            await delay(0.3, 1); // Delay between 0.3 to 1 seconds
        }
    };

    const startScavenging = async () => {
        createScavengingStatusDisplay()

        if (!isGroupActive()) {
            activateGroup();
        }
        await delay(1, 3);

        await loadExternalScript('https://cdn.jsdelivr.net/gh/truekardi/collective-rabble@main/collective-rabble.js');
        await delay(1, 4);

        setValueToInput('input.runTime_off', adjustableScavengingTimeInHours);
        setValueToInput('input.runTime_def', adjustableScavengingTimeInHours);
        await clickButtons('input#sendMass');
        await delay(4, 5);

        await clickButtons('input#sendMass');

        const newRefreshTimeInSeconds = getRefreshTime(adjustableRefreshTimeInHours);

        updateScavengingCounterDisplay();
        updateScavengingTimerDisplay(newRefreshTimeInSeconds);
        await delay(newRefreshTimeInSeconds);

        location.reload();
    };

    const showConfigForm = () => {
        const formHTML = `
        <div id="tm-config-overlay" style="position: fixed; top: ${storedScavengingElementPosition.top}; right: ${storedScavengingElementPosition.right}; aspect-ratio: 100 / 29; background: white; z-index: 50; display: flex; justify-content: center; align-items: center; padding: 20px; border-radius: 5px;">
            <div style="display: flex; flex-direction: column;">
                <div id="drag-handle" style="cursor: move;">
                    <h2>Configure Scavenging Bot</h2>
                </div>
                <label for="scavengingTime" style="align-self: start; margin-bottom: 5px;">Scavenging Time (hours):</label>
                <input type="number" id="scavengingTime" value="${adjustableScavengingTimeInHours}" min="0.6" step="0.1" style="margin-bottom: 10px;">
                <label for="refreshTime" style="align-self: start; margin-bottom: 5px;">Refresh Time (hours):</label>
                <input type="number" id="refreshTime" value="${adjustableRefreshTimeInHours}" min="0.1" step="0.1" style="margin-bottom: 10px;">
                <label for="groupName" style="align-self: start; margin-bottom: 5px;">Group Name:</label>
                <input type="text" id="groupName" value="${chosenScavengingGroupName}" style="margin-bottom: 10px;">
                <button id="startBtn">Start</button>
            </div>
        </div>
        `;

        // Insert the form as the first element inside the table with ID 'topContainer'
        const container = document.getElementById('topContainer');
        if (container) {
            container.insertAdjacentHTML('afterbegin', formHTML);

            const configForm = document.getElementById("tm-config-overlay");
            if (configForm) {
                makeElementDraggable(configForm, '#drag-handle');
            }

            document.getElementById('startBtn').addEventListener('click', () => {
                // saving scavenging time preset
                adjustableScavengingTimeInHours = parseFloat(document.getElementById('scavengingTime').value) || adjustableScavengingTimeInHours;
                localStorage.setItem("adjustableScavengingTimeInHours", adjustableScavengingTimeInHours);

                // saving refresh time preset
                adjustableRefreshTimeInHours = parseFloat(document.getElementById('refreshTime').value) || adjustableRefreshTimeInHours;
                localStorage.setItem("adjustableRefreshTimeInHours", adjustableRefreshTimeInHours);

                // saving group preset
                chosenScavengingGroupName = document.getElementById('groupName').value || chosenScavengingGroupName;
                sessionStorage.setItem("chosenScavengingGroupName", chosenScavengingGroupName);
                localStorage.setItem("chosenScavengingGroupName", chosenScavengingGroupName);

                document.getElementById('tm-config-overlay').remove();

                startScavenging();
                markScriptAsStarted();
            });
        }
    };

    function makeElementDraggable(draggableElement, handleSelector) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        let configDragHandle

        if (handleSelector) {
            configDragHandle = draggableElement.querySelector(handleSelector);
        } else {
            configDragHandle = draggableElement
        }

        configDragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // Call a function whenever the cursor moves
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Set the element's new position
            draggableElement.style.top = (draggableElement.offsetTop - pos2) + "px";
            draggableElement.style.right = (document.documentElement.clientWidth - draggableElement.offsetLeft - draggableElement.offsetWidth + pos1) + "px";
        }

        function closeDragElement() {
            // Stop moving when mouse button is released
            document.onmouseup = null;
            document.onmousemove = null;

            storedScavengingElementPosition.top = draggableElement.style.top
            storedScavengingElementPosition.right = draggableElement.style.right
            localStorage.setItem("scavengingElementPositionTop", storedScavengingElementPosition.top)
            localStorage.setItem("scavengingElementPositionRight", storedScavengingElementPosition.right)

        }
    }

    const isGroupActive = () => {
        const activeGroupElement = document.querySelector('strong.group-menu-item');
        return activeGroupElement && activeGroupElement.textContent.includes(chosenScavengingGroupName);
    };

    const activateGroup = () => {
        const groupLinks = document.querySelectorAll('a.group-menu-item');
        const groupLinkToActivate = Array.from(groupLinks).find(link => link.textContent.includes(chosenScavengingGroupName));
        if (groupLinkToActivate) {
            groupLinkToActivate.click();
        }
    };

    // Main execution logic
    if (hasScriptBeenStartedByConfig) {
        // If the script was already started, skip config and start scavenging
        startScavenging();
    } else {
        // If the script wasn't started before, show config form
        showConfigForm();
    }
})();
