// ========================================
// ACOUSTIC DOPPLER TRAINER
// Application Controller
// VERSION 1.1
// ========================================


// ========================================
// GLOBAL STATE
// ========================================

let simTime = 0;
let isRunning = false;
let timer = null;

let scenarioEnded = false;

// Instructor Settings
let scenarioMode = "NORMAL";
let instructorTargetSpeed = 10;

// Student Reports
// R1 → R2 → R3 → ... → Rn
let estimates = [];


// ========================================
// TIME FORMAT
// ========================================

function formatTime(seconds) {

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}


// ========================================
// ANGLE FORMAT
// ========================================

function formatAngle(angle) {

    if (
        angle === null ||
        angle === undefined ||
        !Number.isFinite(angle)
    ) {
        return "---°";
    }

    let normalized =
        Math.round(angle) % 360;

    if (normalized < 0) {
        normalized += 360;
    }

    return (
        String(normalized).padStart(3, "0") +
        "°"
    );
}


// ========================================
// ANGULAR ERROR
// ========================================

function calculateAngularError(
    estimatedAngle,
    trueAngle
) {

    let difference =
        Math.abs(
            estimatedAngle -
            trueAngle
        );

    difference =
        difference % 360;

    if (difference > 180) {

        difference =
            360 - difference;
    }

    return difference;
}


// ========================================
// GET D1-D6 CENTER
// ========================================

function getReportReferenceCenter() {

    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {

        return null;
    }


    const centerX =
        sensors.reduce(
            function (sum, sensor) {

                return (
                    sum +
                    sensor.x
                );
            },
            0
        ) /
        sensors.length;


    const centerY =
        sensors.reduce(
            function (sum, sensor) {

                return (
                    sum +
                    sensor.y
                );
            },
            0
        ) /
        sensors.length;


    return {
        x: centerX,
        y: centerY
    };
}


// ========================================
// CALCULATE TRUE BEARING
//
// D1-D6 CENTER → TARGET
//
// 000 = NORTH
// 090 = EAST
// 180 = SOUTH
// 270 = WEST
// ========================================

function calculateTrueBearing() {

    const center =
        getReportReferenceCenter();


    if (!center) {

        return null;
    }


    const dx =
        target.x -
        center.x;


    const dy =
        target.y -
        center.y;


    let bearing =
        Math.atan2(
            dx,
            dy
        ) *
        180 /
        Math.PI;


    bearing =
        (bearing + 360) %
        360;


    return bearing;
}


// ========================================
// UPDATE TIME DISPLAY
// ========================================

function updateDisplay() {

    const timeElement =
        document.getElementById(
            "scenarioTime"
        );


    if (timeElement) {

        timeElement.textContent =
            formatTime(simTime);
    }
}


// ========================================
// UPDATE REPORT HISTORY
//
// TRAINING:
// REPORT / TIME / BEARING / EST HDG
//
// ENDED:
// REPORT / TIME / EST BRG / TRUE BRG /
// BRG ERR / EST HDG / TRUE HDG / HDG ERR
// ========================================

function updateReportHistory() {

    const reportBody =
        document.getElementById(
            "reportHistoryBody"
        );


    if (!reportBody) {

        return;
    }


    const reportPanel =
        reportBody.closest(
            ".report-panel"
        );


    const reportHeader =
        reportPanel
            ? reportPanel.querySelector(
                ".report-header"
            )
            : null;


    // ====================================
    // TRAINING MODE HEADER
    // ====================================

    if (!scenarioEnded) {

        if (reportHeader) {

            reportHeader.style.gridTemplateColumns =
                "0.7fr 1fr 1fr 1fr";


            reportHeader.innerHTML = `
                <div>REPORT</div>
                <div>TIME</div>
                <div>BEARING</div>
                <div>EST HDG</div>
            `;
        }


        reportBody.classList.remove(
            "debrief-history"
        );
    }


    // ====================================
    // DEBRIEF HEADER
    // ====================================

    if (scenarioEnded) {

        if (reportHeader) {

            reportHeader.style.gridTemplateColumns =
                "0.7fr 0.9fr 1fr 1fr 0.9fr 1fr 1fr 0.9fr";


            reportHeader.innerHTML = `
                <div>REPORT</div>
                <div>TIME</div>
                <div>EST BRG</div>
                <div>TRUE BRG</div>
                <div>BRG ERR</div>
                <div>EST HDG</div>
                <div>TRUE HDG</div>
                <div>HDG ERR</div>
            `;
        }


        reportBody.classList.add(
            "debrief-history"
        );
    }


    reportBody.innerHTML = "";


    // ====================================
    // NO REPORTS
    // ====================================

    if (estimates.length === 0) {

        const emptyRow =
            document.createElement(
                "div"
            );


        emptyRow.className =
            "report-row report-empty";


        emptyRow.innerHTML =
            "<div>NO REPORTS</div>";


        reportBody.appendChild(
            emptyRow
        );


        return;
    }


    // ====================================
    // CREATE REPORT ROWS
    // ====================================

    estimates.forEach(
        function (estimate, index) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "report-row";


            const isLatest =
                index ===
                estimates.length - 1;


            const reportLabel =
                isLatest
                    ? estimate.report + " ★"
                    : estimate.report;


            // =================================
            // TRAINING VIEW
            // =================================

            if (!scenarioEnded) {

                row.style.gridTemplateColumns =
                    "0.7fr 1fr 1fr 1fr";


                row.innerHTML = `
                    <div>
                        ${reportLabel}
                    </div>

                    <div>
                        ${formatTime(estimate.time)}
                    </div>

                    <div>
                        ${formatAngle(estimate.bearing)}
                    </div>

                    <div>
                        ${formatAngle(estimate.heading)}
                    </div>
                `;
            }


            // =================================
            // DEBRIEF VIEW
            // =================================

            if (scenarioEnded) {

                row.style.gridTemplateColumns =
                    "0.7fr 0.9fr 1fr 1fr 0.9fr 1fr 1fr 0.9fr";


                row.innerHTML = `
                    <div>
                        ${reportLabel}
                    </div>

                    <div>
                        ${formatTime(estimate.time)}
                    </div>

                    <div>
                        ${formatAngle(estimate.bearing)}
                    </div>

                    <div>
                        ${formatAngle(estimate.trueBearing)}
                    </div>

                    <div>
                        ${formatAngle(estimate.bearingError)}
                    </div>

                    <div>
                        ${formatAngle(estimate.heading)}
                    </div>

                    <div>
                        ${formatAngle(estimate.trueHeading)}
                    </div>

                    <div>
                        ${formatAngle(estimate.headingError)}
                    </div>
                `;
            }


            reportBody.appendChild(
                row
            );
        }
    );


    reportBody.scrollTop =
        reportBody.scrollHeight;
}


// ========================================
// CLEAR FINAL RESULT
// ========================================

function clearFinalResult() {

    const values = {

        resultReport:
            "---",

        resultTime:
            "--:--",

        resultBearing:
            "---°",

        resultTrueBearing:
            "---°",

        resultBearingError:
            "---°",

        resultEstimatedHeading:
            "---°",

        resultTrueHeading:
            "---°",

        resultHeadingError:
            "---°",

        resultReportCount:
            "0",

        resultTargetSpeed:
            "--- KT",

        resultScenarioMode:
            "---"
    };


    Object.keys(values).forEach(
        function (id) {

            const element =
                document.getElementById(id);


            if (element) {

                element.textContent =
                    values[id];
            }
        }
    );
}


// ========================================
// LOCK STUDENT INPUT
// ========================================

function lockStudentInput() {

    const estimatePanel =
        document.querySelector(
            ".estimate-panel"
        );


    if (estimatePanel) {

        estimatePanel.classList.add(
            "scenario-locked"
        );
    }


    const bearingInput =
        document.getElementById(
            "estimateBearing"
        );


    const headingInput =
        document.getElementById(
            "estimateHeading"
        );


    if (bearingInput) {

        bearingInput.disabled = true;
    }


    if (headingInput) {

        headingInput.disabled = true;
    }
}


// ========================================
// UNLOCK STUDENT INPUT
// ========================================

function unlockStudentInput() {

    const estimatePanel =
        document.querySelector(
            ".estimate-panel"
        );


    if (estimatePanel) {

        estimatePanel.classList.remove(
            "scenario-locked"
        );
    }


    const bearingInput =
        document.getElementById(
            "estimateBearing"
        );


    const headingInput =
        document.getElementById(
            "estimateHeading"
        );


    if (bearingInput) {

        bearingInput.disabled = false;

        bearingInput.value = "";
    }


    if (headingInput) {

        headingInput.disabled = false;

        headingInput.value = "";
    }
}


// ========================================
// PLAY
// ========================================

function playSimulation() {

    if (scenarioEnded) {

        alert(
            "Scenario 已結束。\n" +
            "請按 RESET 或 NEW SCENARIO。"
        );

        return;
    }


    if (isRunning) {

        return;
    }


    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {

        alert(
            "請先按 NEW SCENARIO 建立情境。"
        );

        return;
    }


    isRunning = true;


    const statusElement =
        document.getElementById(
            "statusValue"
        );


    if (statusElement) {

        statusElement.textContent =
            "RUNNING";
    }


    timer =
        setInterval(
            function () {

                // 1 real second =
                // 10 simulation seconds

                simTime += 10;


                updateTargetPosition(
                    10
                );


                updateAcousticData();


                updateDisplay();


                drawTacticalDisplay();

            },
            1000
        );
}


// ========================================
// PAUSE
// ========================================

function pauseSimulation() {

    if (scenarioEnded) {

        return;
    }


    isRunning = false;


    if (timer !== null) {

        clearInterval(timer);

        timer = null;
    }


    const statusElement =
        document.getElementById(
            "statusValue"
        );


    if (statusElement) {

        statusElement.textContent =
            "PAUSED";
    }
}


// ========================================
// RESET
//
// SAME SCENARIO → 00:00
//
// D1-D6:
// SAME POSITION
//
// TARGET:
// SAME START POSITION
// SAME TRUE HEADING
// SAME SPEED
// SAME BASE FREQUENCY
// ========================================

function resetSimulation() {

    isRunning = false;

    scenarioEnded = false;


    if (timer !== null) {

        clearInterval(timer);

        timer = null;
    }


    unlockStudentInput();


    simTime = 0;

    estimates = [];


    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {

        updateDisplay();

        updateReportHistory();

        clearFinalResult();


        const statusElement =
            document.getElementById(
                "statusValue"
            );


        if (statusElement) {

            statusElement.textContent =
                "READY";
        }


        return;
    }


    // ====================================
    // RESTORE TARGET START POSITION
    // ====================================

    target.x =
        target.startX;


    target.y =
        target.startY;


    // ====================================
    // RESTORE TRUE HEADING
    // ====================================

    if (
        Number.isFinite(
            target.startHeading
        )
    ) {

        target.heading =
            target.startHeading;
    }


    // ====================================
    // RESET TURN STATE
    // ====================================

    if (
        target.turnExecuted !==
        undefined
    ) {

        target.turnExecuted =
            false;
    }


    updateAcousticData();


    updateDisplay();


    updateReportHistory();


    clearFinalResult();


    drawTacticalDisplay();


    const statusElement =
        document.getElementById(
            "statusValue"
        );


    if (statusElement) {

        statusElement.textContent =
            "READY";
    }


    console.log(
        "SCENARIO RESET",
        "HDG =",
        target.heading,
        "SPD =",
        target.speed,
        "BASE FREQ =",
        targetBaseFrequency
    );
}


// ========================================
// NEW SCENARIO
// VERSION 1.1
// ========================================

function newScenario() {

    // ====================================
    // STOP CURRENT SIMULATION
    // ====================================

    isRunning = false;

    scenarioEnded = false;


    if (timer !== null) {

        clearInterval(timer);

        timer = null;
    }


    // ====================================
    // GET INSTRUCTOR SETTINGS
    // ====================================

    const modeInput =
        document.getElementById(
            "scenarioModeInput"
        );


    const speedInput =
        document.getElementById(
            "targetSpeedInput"
        );


    const baseFrequencyInput =
        document.getElementById(
            "targetBaseFrequencyInput"
        );


    // ====================================
    // CHECK HTML ELEMENTS
    // ====================================

    if (!modeInput) {

        console.error(
            "scenarioModeInput not found"
        );

        alert(
            "系統錯誤：找不到 Scenario Mode。"
        );

        return;
    }


    if (!speedInput) {

        console.error(
            "targetSpeedInput not found"
        );

        alert(
            "系統錯誤：找不到 Target Speed。"
        );

        return;
    }


    if (!baseFrequencyInput) {

        console.error(
            "targetBaseFrequencyInput not found"
        );

        alert(
            "系統錯誤：找不到 Target Base Frequency。"
        );

        return;
    }


    // ====================================
    // SCENARIO MODE
    // ====================================

    scenarioMode =
        modeInput.value;


    // ====================================
    // TARGET SPEED
    // ====================================

    const selectedSpeed =
        Number(
            speedInput.value
        );


    if (
        !Number.isFinite(
            selectedSpeed
        ) ||
        selectedSpeed < 1 ||
        selectedSpeed > 40
    ) {

        alert(
            "Target Speed 必須設定為 1～40 KT。"
        );

        return;
    }


    instructorTargetSpeed =
        selectedSpeed;


    // ====================================
    // TARGET BASE FREQUENCY
    // ====================================

    const selectedBaseFrequency =
        Number(
            baseFrequencyInput.value
        );


    if (
        !Number.isFinite(
            selectedBaseFrequency
        ) ||
        selectedBaseFrequency < 1 ||
        selectedBaseFrequency > 5000
    ) {

        alert(
            "Target Base Frequency 必須設定為 1～5000 Hz。"
        );

        return;
    }


    targetBaseFrequency =
        selectedBaseFrequency;


    // ====================================
    // RESET TRAINING STATE
    // ====================================

    simTime = 0;

    estimates = [];


    unlockStudentInput();


    // ====================================
    // GENERATE NEW SCENARIO
    // ====================================

    generateSensors();


    generateTarget();


    updateAcousticData();


    // ====================================
    // ACTIVE SETTINGS DISPLAY
    // ====================================

    const activeMode =
        document.getElementById(
            "activeMode"
        );


    const activeSpeed =
        document.getElementById(
            "activeSpeed"
        );


    const activeBaseFrequency =
        document.getElementById(
            "activeBaseFrequency"
        );


    if (activeMode) {

        activeMode.textContent =
            scenarioMode;
    }


    if (activeSpeed) {

        activeSpeed.textContent =
            instructorTargetSpeed +
            " KT";
    }


    if (activeBaseFrequency) {

        activeBaseFrequency.textContent =
            targetBaseFrequency +
            " Hz";
    }


    // ====================================
    // RESET DISPLAY
    // ====================================

    updateDisplay();


    updateReportHistory();


    clearFinalResult();


    // ====================================
    // TACTICAL DISPLAY
    // ====================================

    if (
        typeof resizeTacticalCanvas ===
        "function"
    ) {

        resizeTacticalCanvas();
    }


    if (
        typeof drawTacticalDisplay ===
        "function"
    ) {

        drawTacticalDisplay();
    }


    // ====================================
    // STATUS
    // ====================================

    const statusElement =
        document.getElementById(
            "statusValue"
        );


    if (statusElement) {

        statusElement.textContent =
            "READY";
    }


    console.log(
        "NEW SCENARIO",
        "MODE =",
        scenarioMode,
        "SPEED =",
        instructorTargetSpeed,
        "BASE FREQ =",
        targetBaseFrequency,
        "TARGET HDG =",
        target.heading
    );
}


// ========================================
// SUBMIT STUDENT ESTIMATE
// ========================================

function submitEstimate() {

    if (scenarioEnded) {

        alert(
            "Scenario 已結束，無法再提交 Report。"
        );

        return;
    }


    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {

        alert(
            "請先建立 Scenario。"
        );

        return;
    }


    const bearingInput =
        document.getElementById(
            "estimateBearing"
        );


    const headingInput =
        document.getElementById(
            "estimateHeading"
        );


    if (
        !bearingInput ||
        !headingInput
    ) {

        console.error(
            "Estimate input elements not found."
        );

        return;
    }


    if (
        bearingInput.value === "" ||
        headingInput.value === ""
    ) {

        alert(
            "請輸入 Bearing 及 Estimated Heading。"
        );

        return;
    }


    const bearing =
        Number(
            bearingInput.value
        );


    const heading =
        Number(
            headingInput.value
        );


    if (
        !Number.isFinite(bearing) ||
        !Number.isFinite(heading)
    ) {

        alert(
            "輸入資料格式錯誤。"
        );

        return;
    }


    if (
        bearing < 0 ||
        bearing > 359 ||
        heading < 0 ||
        heading > 359
    ) {

        alert(
            "Bearing / Heading 必須為 000–359。"
        );

        return;
    }


    // ====================================
    // CAPTURE TRUE DATA AT REPORT TIME
    // ====================================

    const trueBearing =
        calculateTrueBearing();


    const trueHeading =
        target.heading;


    const bearingError =
        calculateAngularError(
            bearing,
            trueBearing
        );


    const headingError =
        calculateAngularError(
            heading,
            trueHeading
        );


    // ====================================
    // REPORT NUMBER
    // ====================================

    const reportNumber =
        estimates.length + 1;


    // ====================================
    // CREATE REPORT
    // ====================================

    const estimate = {

        report:
            "R" + reportNumber,

        time:
            simTime,

        // Student Estimate

        bearing:
            bearing,

        heading:
            heading,

        // Hidden Truth

        trueBearing:
            trueBearing,

        trueHeading:
            trueHeading,

        // Hidden Error

        bearingError:
            bearingError,

        headingError:
            headingError,

        // Hidden Target Position

        targetX:
            target.x,

        targetY:
            target.y,

        targetSpeed:
            target.speed,

        targetBaseFrequency:
            targetBaseFrequency
    };


    estimates.push(
        estimate
    );


    // Training view still hides truth

    updateReportHistory();


    drawTacticalDisplay();


    console.log(
        estimate.report,
        "TIME =",
        formatTime(
            estimate.time
        ),
        "BRG =",
        estimate.bearing,
        "HDG =",
        estimate.heading
    );


    bearingInput.value = "";

    headingInput.value = "";


    bearingInput.focus();


    alert(
        estimate.report +
        " RECORDED\n" +
        "TIME: " +
        formatTime(
            estimate.time
        )
    );
}


// ========================================
// GET FINAL ESTIMATE
// ========================================

function getFinalEstimate() {

    if (
        estimates.length === 0
    ) {

        return null;
    }


    return estimates[
        estimates.length - 1
    ];
}


// ========================================
// END SCENARIO
// ========================================

function endScenario() {

    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {

        alert(
            "目前沒有 Scenario。"
        );

        return;
    }


    if (scenarioEnded) {

        alert(
            "Scenario 已經結束。"
        );

        return;
    }


    const finalEstimate =
        getFinalEstimate();


    if (!finalEstimate) {

        alert(
            "至少需要提交一筆 Report 才能結束 Scenario。"
        );

        return;
    }


    // ====================================
    // STOP SIMULATION
    // ====================================

    isRunning = false;


    if (timer !== null) {

        clearInterval(timer);

        timer = null;
    }


    scenarioEnded = true;


    // ====================================
    // FINAL REPORT DATA
    //
    // 使用最後一次 REPORT 當下
    // 儲存的 TRUE DATA
    // ====================================

    const estimatedBearing =
        finalEstimate.bearing;


    const trueBearing =
        finalEstimate.trueBearing;


    const bearingError =
        finalEstimate.bearingError;


    const estimatedHeading =
        finalEstimate.heading;


    const trueHeading =
        finalEstimate.trueHeading;


    const headingError =
        finalEstimate.headingError;


    // ====================================
    // RESULT ELEMENTS
    // ====================================

    const resultReport =
        document.getElementById(
            "resultReport"
        );


    const resultTime =
        document.getElementById(
            "resultTime"
        );


    const resultBearing =
        document.getElementById(
            "resultBearing"
        );


    const resultTrueBearing =
        document.getElementById(
            "resultTrueBearing"
        );


    const resultBearingError =
        document.getElementById(
            "resultBearingError"
        );


    const resultEstimatedHeading =
        document.getElementById(
            "resultEstimatedHeading"
        );


    const resultTrueHeading =
        document.getElementById(
            "resultTrueHeading"
        );


    const resultHeadingError =
        document.getElementById(
            "resultHeadingError"
        );


    const resultReportCount =
        document.getElementById(
            "resultReportCount"
        );


    const resultTargetSpeed =
        document.getElementById(
            "resultTargetSpeed"
        );


    const resultScenarioMode =
        document.getElementById(
            "resultScenarioMode"
        );


    // ====================================
    // DISPLAY FINAL RESULT
    // ====================================

    if (resultReport) {

        resultReport.textContent =
            finalEstimate.report;
    }


    if (resultTime) {

        resultTime.textContent =
            formatTime(
                finalEstimate.time
            );
    }


    if (resultBearing) {

        resultBearing.textContent =
            formatAngle(
                estimatedBearing
            );
    }


    if (resultTrueBearing) {

        resultTrueBearing.textContent =
            formatAngle(
                trueBearing
            );
    }


    if (resultBearingError) {

        resultBearingError.textContent =
            formatAngle(
                bearingError
            );
    }


    if (resultEstimatedHeading) {

        resultEstimatedHeading.textContent =
            formatAngle(
                estimatedHeading
            );
    }


    if (resultTrueHeading) {

        resultTrueHeading.textContent =
            formatAngle(
                trueHeading
            );
    }


    if (resultHeadingError) {

        resultHeadingError.textContent =
            formatAngle(
                headingError
            );
    }


    if (resultReportCount) {

        resultReportCount.textContent =
            estimates.length;
    }


    if (resultTargetSpeed) {

        resultTargetSpeed.textContent =
            finalEstimate.targetSpeed +
            " KT";
    }


    if (resultScenarioMode) {

        resultScenarioMode.textContent =
            scenarioMode;
    }


    // ====================================
    // LOCK STUDENT INPUT
    // ====================================

    lockStudentInput();


    // ====================================
    // STATUS
    // ====================================

    const statusElement =
        document.getElementById(
            "statusValue"
        );


    if (statusElement) {

        statusElement.textContent =
            "ENDED";
    }


    // ====================================
    // DEBRIEF VIEW
    // ====================================

    updateReportHistory();


    drawTacticalDisplay();


    console.log(
        "SCENARIO ENDED",

        "FINAL REPORT =",
        finalEstimate.report,

        "EST BRG =",
        estimatedBearing,

        "TRUE BRG =",
        trueBearing,

        "BRG ERROR =",
        bearingError,

        "EST HDG =",
        estimatedHeading,

        "TRUE HDG =",
        trueHeading,

        "HDG ERROR =",
        headingError
    );
}


// ========================================
// INITIAL DISPLAY
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateDisplay();


        updateReportHistory();


        clearFinalResult();


        unlockStudentInput();


        // Initial active settings

        const activeMode =
            document.getElementById(
                "activeMode"
            );


        const activeSpeed =
            document.getElementById(
                "activeSpeed"
            );


        const activeBaseFrequency =
            document.getElementById(
                "activeBaseFrequency"
            );


        if (activeMode) {

            activeMode.textContent =
                scenarioMode;
        }


        if (activeSpeed) {

            activeSpeed.textContent =
                instructorTargetSpeed +
                " KT";
        }


        if (activeBaseFrequency) {

            activeBaseFrequency.textContent =
                targetBaseFrequency +
                " Hz";
        }
    }
);