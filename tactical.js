// ========================================
// ACOUSTIC DOPPLER TRAINER
// Tactical Display
// ========================================

const tacticalCanvas =
    document.getElementById("tacticalCanvas");

const tacticalCtx =
    tacticalCanvas.getContext("2d");


// ========================================
// RESIZE CANVAS
// ========================================

function resizeTacticalCanvas() {

    const parent =
        tacticalCanvas.parentElement;

    tacticalCanvas.width =
        parent.clientWidth;

    tacticalCanvas.height =
        parent.clientHeight;

    drawTacticalDisplay();
}


// ========================================
// WORLD → CANVAS
//
// 顯示比例永遠以 D1-D6 為基準。
// END 後不因 Target 航跡重新縮放。
// ========================================

function worldToCanvas(x, y) {

    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {
        return {
            x: tacticalCanvas.width / 2,
            y: tacticalCanvas.height / 2
        };
    }


    const sensorX =
        sensors.map(function (sensor) {
            return sensor.x;
        });

    const sensorY =
        sensors.map(function (sensor) {
            return sensor.y;
        });


    let minX =
        Math.min(...sensorX);

    let maxX =
        Math.max(...sensorX);

    let minY =
        Math.min(...sensorY);

    let maxY =
        Math.max(...sensorY);


    // ====================================
    // PADDING
    // ====================================

    const paddingX = 1500;
    const paddingY = 1200;

    minX -= paddingX;
    maxX += paddingX;

    minY -= paddingY;
    maxY += paddingY;


    // 防止除以 0

    if (maxX === minX) {
        maxX += 1;
    }

    if (maxY === minY) {
        maxY += 1;
    }


    const px =
        (
            (x - minX) /
            (maxX - minX)
        ) *
        tacticalCanvas.width;


    const py =
        tacticalCanvas.height -
        (
            (y - minY) /
            (maxY - minY)
        ) *
        tacticalCanvas.height;


    return {
        x: px,
        y: py
    };
}


// ========================================
// GET D1-D6 CENTER
// ========================================

function getSensorCenter() {

    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {

        return {
            x: 0,
            y: 0
        };
    }


    const centerX =
        sensors.reduce(
            function (sum, sensor) {
                return sum + sensor.x;
            },
            0
        ) / sensors.length;


    const centerY =
        sensors.reduce(
            function (sum, sensor) {
                return sum + sensor.y;
            },
            0
        ) / sensors.length;


    return {
        x: centerX,
        y: centerY
    };
}


// ========================================
// DRAW SENSOR
// ========================================

function drawSensor(sensor) {

    const p =
        worldToCanvas(
            sensor.x,
            sensor.y
        );


    tacticalCtx.save();


    // ====================================
    // SENSOR SYMBOL
    // ====================================

    tacticalCtx.beginPath();

    tacticalCtx.arc(
        p.x,
        p.y,
        6,
        0,
        Math.PI * 2
    );

    tacticalCtx.fillStyle =
        "#d8e2ea";

    tacticalCtx.fill();


    // ====================================
    // SENSOR ID
    // ====================================

    tacticalCtx.font =
        "bold 14px Arial";

    tacticalCtx.fillStyle =
        "#d8e2ea";

    tacticalCtx.fillText(
        sensor.id,
        p.x + 10,
        p.y - 10
    );


    // ====================================
    // CONTACT DATA
    // ====================================

    tacticalCtx.font =
        "12px Arial";

    tacticalCtx.fillStyle =
        "#d8e2ea";


    if (
        sensor.hasContact &&
        Number.isFinite(sensor.frequency)
    ) {

        tacticalCtx.fillText(
            sensor.frequency.toFixed(2) +
            " Hz",
            p.x + 10,
            p.y + 8
        );

    } else {

        tacticalCtx.fillText(
            "NO CONTACT",
            p.x + 10,
            p.y + 8
        );
    }


    tacticalCtx.restore();
}


// ========================================
// DRAW SENSOR CENTER
// Bearing Reference Point
// ========================================

function drawSensorCenter() {

    const center =
        getSensorCenter();

    const p =
        worldToCanvas(
            center.x,
            center.y
        );


    tacticalCtx.save();

    tacticalCtx.strokeStyle =
        "#6f8797";

    tacticalCtx.fillStyle =
        "#6f8797";

    tacticalCtx.lineWidth = 1;


    // Cross

    tacticalCtx.beginPath();

    tacticalCtx.moveTo(
        p.x - 7,
        p.y
    );

    tacticalCtx.lineTo(
        p.x + 7,
        p.y
    );

    tacticalCtx.moveTo(
        p.x,
        p.y - 7
    );

    tacticalCtx.lineTo(
        p.x,
        p.y + 7
    );

    tacticalCtx.stroke();


    // Center Circle

    tacticalCtx.beginPath();

    tacticalCtx.arc(
        p.x,
        p.y,
        3,
        0,
        Math.PI * 2
    );

    tacticalCtx.fill();


    tacticalCtx.restore();
}


// ========================================
// CALCULATE BEARING LINE END
// ========================================

function getBearingLineEnd(
    center,
    bearing
) {

    const bearingRad =
        bearing *
        Math.PI / 180;


    const lineLength =
        20000;


    return {

        x:
            center.x +
            lineLength *
            Math.sin(bearingRad),

        y:
            center.y +
            lineLength *
            Math.cos(bearingRad)
    };
}


// ========================================
// DRAW ONE BEARING LINE
// ========================================

function drawBearingLine(
    estimate,
    index,
    isLatest
) {

    if (
        !Number.isFinite(estimate.bearing)
    ) {
        return;
    }


    const center =
        getSensorCenter();


    const endWorld =
        getBearingLineEnd(
            center,
            estimate.bearing
        );


    const start =
        worldToCanvas(
            center.x,
            center.y
        );


    const rawEnd =
        worldToCanvas(
            endWorld.x,
            endWorld.y
        );


    const dx =
        rawEnd.x - start.x;

    const dy =
        rawEnd.y - start.y;


    let scale = 1;

    const margin = 35;


    if (dx > 0) {

        scale =
            Math.min(
                scale,
                (
                    tacticalCanvas.width -
                    margin -
                    start.x
                ) / dx
            );
    }


    if (dx < 0) {

        scale =
            Math.min(
                scale,
                (
                    margin -
                    start.x
                ) / dx
            );
    }


    if (dy > 0) {

        scale =
            Math.min(
                scale,
                (
                    tacticalCanvas.height -
                    margin -
                    start.y
                ) / dy
            );
    }


    if (dy < 0) {

        scale =
            Math.min(
                scale,
                (
                    margin -
                    start.y
                ) / dy
            );
    }


    scale =
        Math.max(
            0,
            Math.min(scale, 1)
        );


    const end = {

        x:
            start.x +
            dx * scale,

        y:
            start.y +
            dy * scale
    };


    tacticalCtx.save();


    // OLD REPORT

    if (!isLatest) {

        tacticalCtx.strokeStyle =
            "rgba(216, 226, 234, 0.25)";

        tacticalCtx.fillStyle =
            "rgba(216, 226, 234, 0.55)";

        tacticalCtx.lineWidth = 1;

        tacticalCtx.setLineDash(
            [5, 5]
        );
    }


    // LATEST REPORT

    if (isLatest) {

        tacticalCtx.strokeStyle =
            "#d8e2ea";

        tacticalCtx.fillStyle =
            "#d8e2ea";

        tacticalCtx.lineWidth = 2;

        tacticalCtx.setLineDash([]);
    }


    // Bearing Line

    tacticalCtx.beginPath();

    tacticalCtx.moveTo(
        start.x,
        start.y
    );

    tacticalCtx.lineTo(
        end.x,
        end.y
    );

    tacticalCtx.stroke();


    // Label

    tacticalCtx.setLineDash([]);

    tacticalCtx.font =
        isLatest
            ? "bold 13px Arial"
            : "11px Arial";


    const label =
        estimate.report +
        " " +
        String(
            Math.round(
                estimate.bearing
            )
        ).padStart(3, "0") +
        "°";


    const textWidth =
        tacticalCtx.measureText(
            label
        ).width;


    let labelX =
        end.x + 6;

    let labelY =
        end.y;


    if (
        labelX +
        textWidth >
        tacticalCanvas.width - 5
    ) {

        labelX =
            end.x -
            textWidth -
            6;
    }


    if (labelY < 15) {
        labelY = 15;
    }


    if (
        labelY >
        tacticalCanvas.height - 5
    ) {

        labelY =
            tacticalCanvas.height - 5;
    }


    tacticalCtx.fillText(
        label,
        labelX,
        labelY
    );


    tacticalCtx.restore();
}


// ========================================
// DRAW ALL REPORT BEARINGS
// ========================================

function drawReportBearings() {

    if (
        typeof estimates === "undefined" ||
        !estimates ||
        estimates.length === 0
    ) {
        return;
    }


    estimates.forEach(
        function (estimate, index) {

            const isLatest =
                index ===
                estimates.length - 1;


            drawBearingLine(
                estimate,
                index,
                isLatest
            );
        }
    );
}


// ========================================
// DRAW TRUE TARGET TRACK
//
// 優先使用 simulation.js 的
// targetTrackHistory
//
// TRUE TRACK = RED
// ========================================

function drawTrueTargetTrack() {

    let trackPoints = [];


    // ====================================
    // 使用完整真實航跡
    // ====================================

    if (
        typeof targetTrackHistory !== "undefined" &&
        Array.isArray(targetTrackHistory) &&
        targetTrackHistory.length >= 2
    ) {

        trackPoints =
            targetTrackHistory.filter(
                function (point) {

                    return (
                        Number.isFinite(point.x) &&
                        Number.isFinite(point.y)
                    );
                }
            );
    }


    // ====================================
    // FALLBACK
    // START → REPORTS → END
    // ====================================

    if (
        trackPoints.length < 2 &&
        typeof target !== "undefined"
    ) {

        trackPoints = [];


        if (
            Number.isFinite(target.startX) &&
            Number.isFinite(target.startY)
        ) {

            trackPoints.push({
                x: target.startX,
                y: target.startY
            });
        }


        if (
            typeof estimates !== "undefined" &&
            Array.isArray(estimates)
        ) {

            estimates.forEach(
                function (estimate) {

                    if (
                        Number.isFinite(estimate.targetX) &&
                        Number.isFinite(estimate.targetY)
                    ) {

                        trackPoints.push({
                            x: estimate.targetX,
                            y: estimate.targetY
                        });
                    }
                }
            );
        }


        if (
            Number.isFinite(target.x) &&
            Number.isFinite(target.y)
        ) {

            trackPoints.push({
                x: target.x,
                y: target.y
            });
        }
    }


    if (trackPoints.length < 2) {
        return;
    }


    tacticalCtx.save();

    tacticalCtx.beginPath();

    tacticalCtx.strokeStyle =
        "#ff0000";

    tacticalCtx.lineWidth = 4;

    tacticalCtx.lineCap =
        "round";

    tacticalCtx.lineJoin =
        "round";

    tacticalCtx.setLineDash([]);


    trackPoints.forEach(
        function (point, index) {

            const p =
                worldToCanvas(
                    point.x,
                    point.y
                );


            if (index === 0) {

                tacticalCtx.moveTo(
                    p.x,
                    p.y
                );

            } else {

                tacticalCtx.lineTo(
                    p.x,
                    p.y
                );
            }
        }
    );


    tacticalCtx.stroke();

    tacticalCtx.restore();
}


// ========================================
// DRAW TARGET START POSITION
// ========================================

function drawTargetStartPosition() {

    if (
        typeof target === "undefined" ||
        !Number.isFinite(target.startX) ||
        !Number.isFinite(target.startY)
    ) {
        return;
    }


    const p =
        worldToCanvas(
            target.startX,
            target.startY
        );


    tacticalCtx.save();


    tacticalCtx.beginPath();

    tacticalCtx.arc(
        p.x,
        p.y,
        5,
        0,
        Math.PI * 2
    );

    tacticalCtx.fillStyle =
        "#8fa4b5";

    tacticalCtx.fill();


    tacticalCtx.font =
        "bold 11px Arial";

    tacticalCtx.fillStyle =
        "#8fa4b5";

    tacticalCtx.fillText(
        "START",
        p.x + 8,
        p.y - 7
    );


    tacticalCtx.restore();
}


// ========================================
// DRAW REPORT TARGET POSITIONS
// ========================================

function drawReportTargetPositions() {

    if (
        typeof estimates === "undefined" ||
        !estimates ||
        estimates.length === 0
    ) {
        return;
    }


    estimates.forEach(
        function (estimate) {

            if (
                !Number.isFinite(estimate.targetX) ||
                !Number.isFinite(estimate.targetY)
            ) {
                return;
            }


            const p =
                worldToCanvas(
                    estimate.targetX,
                    estimate.targetY
                );


            tacticalCtx.save();


            tacticalCtx.beginPath();

            tacticalCtx.arc(
                p.x,
                p.y,
                5,
                0,
                Math.PI * 2
            );

            tacticalCtx.fillStyle =
                "#6fa7c4";

            tacticalCtx.fill();


            tacticalCtx.font =
                "bold 11px Arial";

            tacticalCtx.fillStyle =
                "#8fc3dc";

            tacticalCtx.fillText(
                estimate.report,
                p.x + 8,
                p.y - 8
            );


            tacticalCtx.restore();
        }
    );
}


// ========================================
// DRAW TARGET END POSITION
// ========================================

function drawTargetEndPosition() {

    if (
        typeof target === "undefined" ||
        !Number.isFinite(target.x) ||
        !Number.isFinite(target.y)
    ) {
        return;
    }


    const p =
        worldToCanvas(
            target.x,
            target.y
        );


    tacticalCtx.save();


    tacticalCtx.beginPath();

    tacticalCtx.arc(
        p.x,
        p.y,
        6,
        0,
        Math.PI * 2
    );

    tacticalCtx.fillStyle =
        "#ff0000";

    tacticalCtx.fill();


    tacticalCtx.font =
        "bold 11px Arial";

    tacticalCtx.fillStyle =
        "#ff0000";

    tacticalCtx.fillText(
        "END",
        p.x + 9,
        p.y + 4
    );


    tacticalCtx.restore();
}


// ========================================
// DRAW TRUE HEADING ARROW
//
// 使用最後 Report 時的 Target 位置。
// 如果沒有 Report，則使用 END 位置。
// ========================================

function drawTrueHeadingArrow() {

    if (
        typeof target === "undefined"
    ) {
        return;
    }


    let trueX =
        target.x;

    let trueY =
        target.y;

    let trueHeading =
        target.heading;


    // 有 Report 時優先使用最後一筆資料

    if (
        typeof estimates !== "undefined" &&
        Array.isArray(estimates) &&
        estimates.length > 0
    ) {

        const finalEstimate =
            estimates[
                estimates.length - 1
            ];


        if (
            Number.isFinite(finalEstimate.targetX) &&
            Number.isFinite(finalEstimate.targetY)
        ) {

            trueX =
                finalEstimate.targetX;

            trueY =
                finalEstimate.targetY;
        }


        if (
            Number.isFinite(
                finalEstimate.trueHeading
            )
        ) {

            trueHeading =
                finalEstimate.trueHeading;
        }
    }


    if (
        !Number.isFinite(trueX) ||
        !Number.isFinite(trueY) ||
        !Number.isFinite(trueHeading)
    ) {
        return;
    }


    const start =
        worldToCanvas(
            trueX,
            trueY
        );


    const headingRad =
        trueHeading *
        Math.PI / 180;


    const arrowLength = 55;


    // Canvas:
    // East  = +X
    // North = -Y

    const endX =
        start.x +
        arrowLength *
        Math.sin(headingRad);


    const endY =
        start.y -
        arrowLength *
        Math.cos(headingRad);


    tacticalCtx.save();


    tacticalCtx.strokeStyle =
        "#8fc3dc";

    tacticalCtx.fillStyle =
        "#8fc3dc";

    tacticalCtx.lineWidth = 3;

    tacticalCtx.setLineDash([]);


    // Main Line

    tacticalCtx.beginPath();

    tacticalCtx.moveTo(
        start.x,
        start.y
    );

    tacticalCtx.lineTo(
        endX,
        endY
    );

    tacticalCtx.stroke();


    // Arrow Head

    const arrowAngle =
        Math.atan2(
            endY - start.y,
            endX - start.x
        );


    const headLength = 10;


    tacticalCtx.beginPath();

    tacticalCtx.moveTo(
        endX,
        endY
    );


    tacticalCtx.lineTo(
        endX -
        headLength *
        Math.cos(
            arrowAngle -
            Math.PI / 6
        ),

        endY -
        headLength *
        Math.sin(
            arrowAngle -
            Math.PI / 6
        )
    );


    tacticalCtx.lineTo(
        endX -
        headLength *
        Math.cos(
            arrowAngle +
            Math.PI / 6
        ),

        endY -
        headLength *
        Math.sin(
            arrowAngle +
            Math.PI / 6
        )
    );


    tacticalCtx.closePath();

    tacticalCtx.fill();


    // Heading Label

    tacticalCtx.font =
        "bold 12px Arial";


    tacticalCtx.fillText(
        "TRUE HDG " +
        String(
            Math.round(
                trueHeading
            )
        ).padStart(3, "0") +
        "°",

        endX + 8,
        endY
    );


    tacticalCtx.restore();
}


// ========================================
// DRAW DEBRIEF DATA
// ========================================

function drawDebriefDisplay() {

    if (
        typeof scenarioEnded === "undefined" ||
        !scenarioEnded
    ) {
        return;
    }


    // 1. 真實完整航跡
    drawTrueTargetTrack();

    // 2. 起始位置
    drawTargetStartPosition();

    // 3. Report 時真實位置
    drawReportTargetPositions();

    // 4. END
    drawTargetEndPosition();

    // 5. TRUE HDG
    drawTrueHeadingArrow();
}


// ========================================
// DRAW TACTICAL DISPLAY
// ========================================

function drawTacticalDisplay() {

    tacticalCtx.clearRect(
        0,
        0,
        tacticalCanvas.width,
        tacticalCanvas.height
    );


    if (
        typeof sensors === "undefined" ||
        !sensors ||
        sensors.length === 0
    ) {
        return;
    }


    // ====================================
    // 1. DEBRIEF
    //
    // END 後才顯示真實資料
    // ====================================

    drawDebriefDisplay();


    // ====================================
    // 2. STUDENT BEARING LINES
    // ====================================

    drawReportBearings();


    // ====================================
    // 3. BEARING REFERENCE CENTER
    // ====================================

    drawSensorCenter();


    // ====================================
    // 4. D1-D6
    //
    // IMPORTANT:
    // 聲標永遠最後畫。
    // 因此紅色航跡不會蓋掉聲標。
    // ====================================

    sensors.forEach(
        function (sensor) {

            drawSensor(sensor);
        }
    );
}


// ========================================
// WINDOW RESIZE
// ========================================

window.addEventListener(
    "resize",
    resizeTacticalCanvas
);