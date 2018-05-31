const synth = window.speechSynthesis;

const speak = (txt, { voice, pitch, rate }) => {
    if (synth.speaking) {
        synth.cancel();
    }
    var utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = voice;
    utterThis.pitch = pitch;
    utterThis.rate = rate;
    synth.speak(utterThis);
};

export const getDefaultVoice = () => {
    const voices = synth.getVoices();
    return synth.getVoices()[voices.length - 1];
}

export const speechFactory = (voice, pitch, rate) =>
    (txt) =>
        speak(txt, { voice, pitch, rate });

export const defaultSpeaker = () =>
    speechFactory(getDefaultVoice(), 1.8, 1);