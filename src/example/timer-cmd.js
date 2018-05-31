import { 
    startTimer, 
    stopTimer, 
    getSecsRemaining, 
    getTimerStats } from './timer';


// ------------------ Timer / CMD integration
const cmds = newCmds();

cmds.add({
    syntax: [
        Match(Any(["start", "set"])),
        Match(Any(["timer", "clock", "alarm"])),
        Var("name", Word()),
        Optional(Match(["for"])),
        Var("duration", Numeric()),
        Var("timeUnit", Any(["second", "seconds", "minute", "minutes", "hour", "hours", "our", "ours"]))
    ],

    run: ({ name, duration, timeUnit }) => {
        const multiplier = 1000;
        if (timeUnit.startsWith("min")) {
            multiplier *= 60;
        }
        if (timeUnit.startsWith("hour") || timeUnit.startsWith("our")) {
            multiplier *= 60 * 60;
        }
        timers.startTimer(name, duration * multiplier);

        return function undoTimer() {
            timers.stopTimer(name);
        };
    },

    describe: ({ name, duration, timeUnit }) => {
        return `${name} for ${duration} ${timeUnit}`;
    },

    refinement: ({ name, duration, timeUnit }) => {
        if (duration && timeUnit) {
            return false;
        }
        else {
            return {
                question: "How long",
                cmd: {
                    syntax: [],
                    run: ({ }) => { },
                    describe: null,
                }
            };
        }
    },

});

cmds.add({
    syntax: [
        Match(Any(["stop"])),
        Match(Any(["timer", "clock", "alarm"])),
        Var("name", Word()),
    ],

    run: ({ name }) => {
        timers.stopTimer(name);
    },

    startedAlert: ({ name, duration, timeUnit }) => {
        return `${name} stopped`;
    },

    askRun: ({ name }) => {
        return `stop ${name}`;
    },

});