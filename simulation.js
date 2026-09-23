// ========================================
// ACOUSTIC DOPPLER TRAINER
// Simulation Engine
// VERSION 1.2
// ========================================


// ========================================
// GLOBAL SIMULATION DATA
// ========================================

let sensors = [];

let target = {
    x: 0,
    y: 0,

    startX: 0,
    startY: 0,

    heading: 0,
    startHeading: 0,

    speed: 10,

    turnExecuted: false
};


// ========================================
// TRUE TARGET TRACK HISTORY
//
// Tactical Display 在 END SCENARIO 後
// 使用這份資料畫出完整真實航跡
// ========================================

let targetTrackHistory = [];


// ========================================
// ACOUSTIC PARAMETERS
// ========================================

// Instructor Control / app.js
// NEW SCENARIO 時會更新
let targetBaseFrequency = 500;


// Sound Speed
const SOUND_SPEED = 1500;       // m/s


// Sonobuoy Contact Range
const CONTACT_RANGE = 1900;     // yd


// ========================================
// SENSOR PATTERN PARAMETERS
// ========================================

// D1-D2-D3 / D4-D5-D6
// 基本相鄰距離
const SENSOR_SPACING = 2700;


// 每段距離隨機誤差
// 約 ±100 ~ ±200 yd
const SENSOR_ERROR_MIN = 100;
const SENSOR_ERROR_MAX = 200;


// ========================================
// RANDOM NUMBER
// ========================================

function randomBetween(min, max) {

    return (
        min +
        Math.random() *
        (max - min)
    );
}


// ========================================
// RANDOM ± ERROR
//
// 產生：
// -200 ~ -100
// 或
// +100 ~ +200
// ========================================

function randomSpacingError() {

    const magnitude =
        randomBetween(
            SENSOR_ERROR_MIN,
            SENSOR_ERROR_MAX
        );

    return (
        Math.random() < 0.5
            ? -magnitude
            : magnitude
    );
}


// ========================================
// GENERATE D1-D6 SENSOR POSITIONS
//
// 基本概念：
//
// D1 -------- D2 -------- D3
//    \           \           \
//     D4 -------- D5 -------- D6
//
// 或鏡像：
//
//      D1 -------- D2 -------- D3
//     /           /           /
//   D4 -------- D5 -------- D6
//
// 每次 NEW SCENARIO 隨機選擇
// 左下 / 右下交錯
// ========================================

function generateSensors() {

    // ====================================
    // TOP ROW HORIZONTAL SPACING
    // ====================================

    const topGap12 =
        SENSOR_SPACING +
        randomSpacingError();

    const topGap23 =
        SENSOR_SPACING +
        randomSpacingError();


    // ====================================
    // BOTTOM ROW HORIZONTAL SPACING
    // ====================================

    const bottomGap45 =
        SENSOR_SPACING +
        randomSpacingError();

    const bottomGap56 =
        SENSOR_SPACING +
        randomSpacingError();


    // ====================================
    // VERTICAL ROW SPACING
    // ====================================

    const rowGap =
        SENSOR_SPACING +
        randomSpacingError();


    // ====================================
    // STAGGER
    //
    // 約半個 2700 yd 間距
    //
    // + = 下排往右
    // - = 下排往左
    // ====================================

    const staggerMagnitude =
        SENSOR_SPACING / 2 +
        randomBetween(
            -150,
            150
        );


    const staggerDirection =
        Math.random() < 0.5
            ? -1
            : 1;


    const stagger =
        staggerMagnitude *
        staggerDirection;


    // ====================================
    // SMALL POSITION IMPERFECTION
    // ====================================

    const jitter1 =
        randomBetween(-100, 100);

    const jitter2 =
        randomBetween(-100, 100);

    const jitter3 =
        randomBetween(-100, 100);

    const jitter4 =
        randomBetween(-100, 100);

    const jitter5 =
        randomBetween(-100, 100);

    const jitter6 =
        randomBetween(-100, 100);


    // ====================================
    // CREATE SENSOR ARRAY
    // ====================================

    sensors = [

        // TOP ROW

        {
            id: "D1",
            x: 0,
            y:
                rowGap +
                jitter1
        },

        {
            id: "D2",
            x:
                topGap12,
            y:
                rowGap +
                jitter2
        },

        {
            id: "D3",
            x:
                topGap12 +
                topGap23,
            y:
                rowGap +
                jitter3
        },


        // BOTTOM ROW

        {
            id: "D4",
            x:
                stagger,
            y:
                jitter4
        },

        {
            id: "D5",
            x:
                stagger +
                bottomGap45,
            y:
                jitter5
        },

        {
            id: "D6",
            x:
                stagger +
                bottomGap45 +
                bottomGap56,
            y:
                jitter6
        }
    ];


    // ====================================
    // INITIAL SENSOR DATA
    // ====================================

    sensors.forEach(
        function (sensor) {

            sensor.range =
                Infinity;

            sensor.radialSpeed =
                0;

            sensor.frequency =
                targetBaseFrequency;

            sensor.hasContact =
                false;
        }
    );


    console.log(
        "D1-D6 SENSOR POSITIONS"
    );


    sensors.forEach(
        function (sensor) {

            console.log(
                sensor.id,
                "X =",
                sensor.x.toFixed(1),
                "Y =",
                sensor.y.toFixed(1)
            );
        }
    );


    console.log(
        "PATTERN =",
        staggerDirection > 0
            ? "BOTTOM ROW RIGHT"
            : "BOTTOM ROW LEFT"
    );
}


// ========================================
// GET SENSOR CENTER
// ========================================

function getSimulationSensorCenter() {

    if (
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
// GENERATE TARGET
//
// 設計目標：
//
// 1. Heading 隨機
// 2. Speed 使用 Instructor Control
// 3. 起始距離 = 500 × Speed
// 4. 航線盡量穿越 D1-D6 聲標區
// 5. 避免極端偏離，只接觸一兩枚聲標
// ========================================

function generateTarget() {

    // ====================================
    // TRUE HEADING
    // 000 - 359
    // ====================================

    const targetHeading =
        Math.floor(
            Math.random() * 360
        );


    // ====================================
    // TARGET SPEED
    // ====================================

    let targetSpeed = 10;


    if (
        typeof instructorTargetSpeed !==
        "undefined" &&
        Number.isFinite(
            Number(
                instructorTargetSpeed
            )
        ) &&
        Number(
            instructorTargetSpeed
        ) > 0
    ) {

        targetSpeed =
            Number(
                instructorTargetSpeed
            );
    }


    // ====================================
    // SENSOR CENTER
    // ====================================

    const center =
        getSimulationSensorCenter();


    // ====================================
    // START DISTANCE
    //
    // 500 × Target Speed
    // ====================================

    const startDistance =
        500 *
        targetSpeed;


    // ====================================
    // CROSS TRACK OFFSET
    //
    // 為了讓 Target 更容易穿過
    // 多枚 D1-D6
    //
    // 原本 ±1500
    // 現縮小到 ±650 yd
    // ====================================

    const crossTrackOffset =
        randomBetween(
            -650,
            650
        );


    const headingRad =
        targetHeading *
        Math.PI /
        180;


    // ====================================
    // AIM POINT
    //
    // 以 D1-D6 中央區域為主要穿越點
    // ====================================

    const aimX =
        center.x +
        crossTrackOffset *
        Math.cos(
            headingRad
        );


    const aimY =
        center.y -
        crossTrackOffset *
        Math.sin(
            headingRad
        );


    // ====================================
    // TARGET START POSITION
    // ====================================

    const targetX =
        aimX -
        startDistance *
        Math.sin(
            headingRad
        );


    const targetY =
        aimY -
        startDistance *
        Math.cos(
            headingRad
        );


    // ====================================
    // CREATE TARGET
    // ====================================

    target = {

        x:
            targetX,

        y:
            targetY,

        startX:
            targetX,

        startY:
            targetY,

        heading:
            targetHeading,

        startHeading:
            targetHeading,

        speed:
            targetSpeed,

        turnExecuted:
            false
    };


    // ====================================
    // RESET TRUE TRACK HISTORY
    // ====================================

    targetTrackHistory = [

        {
            x: targetX,
            y: targetY,
            time: 0
        }
    ];


    console.log(
        "TARGET",
        "HDG =",
        target.heading,
        "SPD =",
        target.speed,
        "BASE FREQ =",
        targetBaseFrequency,
        "X =",
        target.x.toFixed(1),
        "Y =",
        target.y.toFixed(1)
    );
}


// ========================================
// UPDATE TARGET POSITION
// ========================================

function updateTargetPosition(deltaTime) {

    if (
        typeof target === "undefined" ||
        !target
    ) {
        return;
    }


    const headingRad =
        target.heading *
        Math.PI /
        180;


    // ====================================
    // MOVEMENT
    //
    // Speed × 0.5626 × Time
    //
    // 單位：
    // KT → yd/sec
    // ====================================

    const distance =
        target.speed *
        0.5626 *
        deltaTime;


    target.x +=
        distance *
        Math.sin(
            headingRad
        );


    target.y +=
        distance *
        Math.cos(
            headingRad
        );


    // ====================================
    // SAVE TRUE TRACK
    // ====================================

    if (
        typeof targetTrackHistory ===
        "undefined"
    ) {

        targetTrackHistory = [];
    }


    targetTrackHistory.push({

        x:
            target.x,

        y:
            target.y,

        time:
            (
                typeof simTime !==
                "undefined"
                    ? simTime
                    : 0
            )
    });
}


// ========================================
// UPDATE ACOUSTIC DATA
//
// Doppler Shift 由 RADIAL SPEED 決定
//
// APPROACHING
// radialSpeed > 0
// frequency > base frequency
//
// CPA
// radialSpeed ≈ 0
// frequency ≈ base frequency
//
// OPENING
// radialSpeed < 0
// frequency < base frequency
//
// Range 只決定 CONTACT
// ========================================

function updateAcousticData() {

    if (
        !sensors ||
        sensors.length === 0
    ) {
        return;
    }


    const headingRad =
        target.heading *
        Math.PI /
        180;


    sensors.forEach(
        function (sensor) {

            // =================================
            // RANGE
            // =================================

            const dx =
                sensor.x -
                target.x;


            const dy =
                sensor.y -
                target.y;


            sensor.range =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            // =================================
            // RADIAL SPEED
            //
            // + = APPROACHING
            // - = OPENING
            // =================================

            if (
                sensor.range > 0
            ) {

                sensor.radialSpeed =
                    target.speed *
                    (
                        dx *
                        Math.sin(
                            headingRad
                        ) +

                        dy *
                        Math.cos(
                            headingRad
                        )
                    ) /
                    sensor.range;

            } else {

                sensor.radialSpeed =
                    0;
            }


            // =================================
            // KT → M/S
            // =================================

            const radialSpeedMS =
                sensor.radialSpeed *
                0.514444;


            // =================================
            // DOPPLER FREQUENCY
            //
            // Moving Source:
            //
            // f' = f × c / (c - Vr)
            // =================================

            sensor.frequency =
                targetBaseFrequency *
                SOUND_SPEED /
                (
                    SOUND_SPEED -
                    radialSpeedMS
                );


            // =================================
            // CONTACT
            //
            // 1900 yd
            // =================================

            sensor.hasContact =
                sensor.range <=
                CONTACT_RANGE;
        }
    );
}