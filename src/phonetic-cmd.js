import { wordsToNumbers } from 'words-to-numbers';
import { stopwords } from './stopwords';

const matchWordsToPhrase = (words, phrase) => {
    const wordCount = phrase.split(' ').length;
    const matched = [];
    for (let w = 0; w < wordCount && w < words.length; w++) {
        matched.push(words[w]);
    }
    return matched;
};

const stripStopwords = (words) => {
    let stripped = words;
    stopwords.forEach((stopword) => stripped = stripped.replace(stopword, ""))
    return stripped;
};

const txtToWords = (txt) => {
    return txt.split(" ").
        map(word => stripStopwords(word.trim())).
        filter(word => word.length > 0);
};

const phraseDistance = (phrase1, phrase2) => {
    return new Levenshtein(phrase1, phrase2).distance;
};

const spokenWordToNumericStr = (word) => {
    let numStr = word;
    if (word === "for") {
        numStr = "four";
    }
    else if (word === "won") {
        numStr = "one";
    }
    else if (word === "to" || word === "too") {
        numStr = "two";
    }
    else if (word === "ate") {
        numStr = "eight";
    }
    return numStr;
};

const wordsToNumber = (words) => {
    let curNumber = 0;
    let lastWordWasStop = false;
    let consumed = 0;
    for (; consumed < words.length; consumed++) {
        const word = words[consumed];
        if (!lastWordWasStop && stopwords.find(word)) {
            lastWordWasStop = true;
            continue;
        }

        const numericWord = spokenWordToNumericStr(word);

    }

    if (lastWordWasStop) {
        consumed = Math.max(consumed - 1, 0);
    }
    return {
        consumed,
        number: curNumber,
    }
};

// -------------------- Cmd stuff
const createCmds = () => {

    // Takes a function logger(txt) to ask clarifying questions
    const newCmds = (logger) => {
        const cmds = [];
        const contextualCmds = [];

        const allCmds() => {
            return cmds.concat(cmds, contextualCmds);
        };

        const addCmd = (cmd) => {
            cmds.push(cmd);
        };

        const remainingWords = (markedWords) => {
            return markedWords.filter((mWord) => !mWord.used);
        };

        const parseRunParams = (syntax, words, isPartial, runParamMap = {}) => {
            // name-to-value map for cmd.run()
            let paramMap = { ...runParamMap };
            let markedWords = words.map(
                (word) => ({ word, used: false })
            );
            let s = 0;
            for (; s < syntax.length &&
                remainingWords(markedWords).length > 0;
                s++) {

                const directive = syntax[s];
                try {
                    const dResult = directive([...markedWords], { ...paramMap });
                    markedWords = { ...markedWords, ...dResult.markedWords };
                    paramMap = { ...paramMap, ...dResult.paramMap };
                }
                catch (e) {
                    // Don't let stopwords break parsing!
                    let remaining = remainingWords(markedWords);
                    if (stopwords.find(remaining[0])) {
                        remaining.splice(0, 1);
                        const subSyntax = [...syntax];
                        subSyntax.splice(0, s);

                        return parseRunParams(subSyntax, remaining, isPartial, paramMap);
                    }

                    return null;
                }
            }

            if (s < syntax.length) {
                return null;
            }

            return paramMap;
        };

        const isPartialMatch = (cmd, words) => {

        };

        // Interprets some txt string into:
        /*
         * {
         *   cmdResponse: 'Did you mean X?' || false,
         *   
         *   // cmds available only because of the cmdResponse,
         *   // these take priority over other cmds
         *   contextualCmds: [],
         * 
         *   // cmds that MUST come next, all other cmds are
         *   // temporarily disabled
         *   immediateCmds: [],
         * }
         */
        const interpretNone = () => ({
            cmdResponse: false,
            contextualCmds: [],
            immediateCmds: [],
        });

        const interpretPartially = (cmds) => {
            let cmdResponse = '';

            return {
                cmdResponse,
                contextualCmds,
                immediateCmds: [],
            }
        };

        const interpretExactly = (cmd) => {
            return {
                cmdResponse: cmd.getMessage(),
                contextualCmds: cmd.cccc(),
                immediateCmds: [],
            };
        };

        const interpret = (txt) => {
            const interpretation = interpretNone();

            const words = txtToWords(txt);
            const exactMatches = allCmds().reduce((matches, cmd) => {
                if (parseRunParams(cmd, words)) {
                    matches.push(cmd);
                }
            }, []);

            if (exactMatches.length === 0) {
                const partialMatches = allCmds.reduce((matches, cmd) => {
                    if (isPartialMatch(cmd, words)) {
                        matches.push(cmd);
                    }
                }, []);
                if (partialMatches.length === 0) {
                    return interpretNone();
                }
                else {
                    return interpretPartially(partialMatches);
                }
            }
            else if (exactMatches.length === 1) {
                return interpretExactly(exactMatches[0]);
            }
            else {
                return interpretMultiExactly(exactMatches);
            }
        };

        // Add generic functions: repeat last

        return {
            addCmd,
            interpret: (txt) => {
                const {
                    contextualCmds,
                    cmdResponse,
                } = interpret(cmds, txt);

            }
        };
    };

    const CMD = (cmdNames, argHandler) => {
        const error = cmdNames.reduce((error, cmd) =>
            stopwords.find(cmd) ?
                `Cannot add cmd ${cmd}, it exists in stopwords!` : null, null);
        if (error) {
            throw new Error(error);
        }
    };
}

const WordFilter = () => (wordIter) => [{ wordIter.current, penalty: 0 }];

// Directives

// Map a filtered match to the run function's input param name
export const Var = (name, filter = Word()) =>
    (words, isPartial) => {
        const toReturn = Require(filter)(words, isPartial);
        toReturn.paramMap[name] = toReturn.filtered[0];
        return toReturn;

        let parsedTokens = filter([], words, isPartial);

        return {
            paramMap: {[name]: parsedTokens.match},
            remainingWords: parsedTokens.remaining,
            filtered: parsedTokens.match,
        }

        return {
            ...context,
            params: { ...context.params, [name]: parsedTokens }
        };
    };

// Don't require the Var to be set (undefined) or to exist in txt
export const Option = (name, defaultVal=undefined, filter = Word()) => 
(words, isPartial) => {
    try{
        return Var(name, filter)(words, isPartial);
    }
    finally {
        return {

        };
    }
};

// Filters & Mappers

// Grabs a phrase of fixed word count
export const Phrase = (wordCount) => (wordIter, context) => {

};

// Grabs all words up to a given stop word, or till the end of input
export const StopPhrase = (stopword) => (words, isPartial) => {

}

// Grabs 1 of any word
export const Word = FixedPhrase(1);

export const Map = (phraseToReplacementMap) =>
    (words, isPartial) => {
        const mappedWords = [...words];
        for (let phrase in phraseToReplacementMap) {
            const matchedWords = matchWordsToPhrase(mappedWords, phrase);
            if (matchedWords.join(' ') === phrase) {
                phraseMatched = true;
                mappedWords.splice(0, matchedWords.length,
                    phraseToReplacementMap[phrase]);
                return [{
                    remaining: mappedWords, 
                    penalty: 0, 
                    match: null }];
            }
        }
    }

export const Any = (phraseWhitelist) =>
    ({remaining, penalty, curMatch}, isPartial) => {
        let exactSeen = false;
        const validResults = whitelist.map((allowed) => {
            const matchedWords = matchWordsToPhrase(remaining, allowed);
            const phrasePenalty = phraseDistance(allowed, matchedWords.join(' '));
            exactSeen = exactSeen || phrasePenalty === 0;

            const withRemovals = [...remaining];
            withRemovals.splice(0, matchedWords.length);
            return {
                remaining: withRemovals, 
                penalty: phrasePenalty + penalty, 
                match: [...curMatch, ...matchedWords] };
            })
            .filter((scored) =>
                (!exactSeen && isPartial) ||
                scored.penalty === 0);

        if (validResults.length === 0) {
            throw new Error('No matches for whitelist');
        }
        return validResults;
    };

export const None = (phraseBlacklist, wordCount) =>
    ({remaining, penalty, curMatch}, isPartial) => {
        for (let b = 0; b < phraseBlacklist.length; b++) {
            const disallowed = phraseBlacklist[b];
            const matchedWords = matchWordsToPhrase(remaining, disallowed);
            if (matchedWords.join(' ') === disallowed) {
                throw new Error(`${disallowed} found in None()`);
            }
        };

        const withRemovals = [...remaining];
        withRemovals.splice(0, wordCount);
        return [{
            penalty, 
            match: [...curMatch, ...withRemovals.splice(0, wordCount).join(' ')],
            remaining: withRemovals, 
        }];
    };

export const Number = (maxNumber=Number.MAX_VALUE) => 
({remaining, penalty, curMatch}, isPartial) => {
    const numericStr = spokenWordToNumericStr(word);
    const asNum = numericStr;
};