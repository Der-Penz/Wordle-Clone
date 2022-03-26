import { VALID_WORDS } from './dictionary.js'
import { TARGET_WORDS } from './targetWords.js'


/**
 * toggles between light and dark theme
 */
$("input[type=checkbox]").on("change", function () {
    $("body").toggleClass("darkmode lightmode");
    localStorage.setItem("theme", $("body").attr("class"));
});

$(document).ready(function () {
    let theme = localStorage.getItem("theme");
    if(theme == null)
        theme = "darkmode";
    if(theme == "darkmode"){
        $("body").removeClass("lightmode");
        $("body").addClass("darkmode");
    }else{
        $("body").removeClass("darkmode");
        $("body").addClass("lightmode");
    }
});

const WORD_LENGTH = 5
const NUMBER_OF_GUESSES = 6;
const gridLetters = $(".letter");
const keyboard = $(".key");
const TO_GUESS = TARGET_WORDS[getDaily()].toUpperCase();
var gameEnded = false;
var pauseInput = false;
var indexSetted = true;

var fullClear = false;
var guessIndex = 0;
var letterIndex = 0;
var grid = [
            ["", "", "", "", ""],
            ["", "", "", "", ""],
            ["", "", "", "", ""],
            ["", "", "", "", ""],
            ["", "", "", "", ""],
            ["", "", "", "", ""],
           ]

/**
 * returns the daily wordle
 */
function getDaily() {
    let days = Math.floor(Date.now() / 1000 / 60 / 60 / 24);
    return (days * days) % TARGET_WORDS.length;
}

/**
 * adds a letter
 */
function guessLetter(letter){
    if(letterIndex == WORD_LENGTH)
        return;

    setLetter(letter);
    letterIndex++;
    indexSetted = false;
}

/**
 * removes a letter
 */
function removeLetter(){
    if(letterIndex == 0)
        return;

    if(indexSetted){
        setLetter("");
        indexSetted = false;
        return;
    }
    letterIndex--;
    setLetter("");
}

/**
 * sets the letter in the grid array and onto the actuall grid
 */
function setLetter(letter){
    grid[guessIndex][letterIndex] = letter.toUpperCase();
    
    let tile = $(gridLetters[guessIndex * WORD_LENGTH + letterIndex]);

    $(tile).attr("data", letter.toUpperCase());
    
    if(letter == "")
        return;
    scaleLetter(tile);
}   

/**
 * colors the current row in the right colors and plays flip animation 
 * @param {*} letterColorPair a pair index and color. e.G. 10 : "green" -> tenth letter element should be green
 */
function colorRow(letterColorPair){
    for (const key in letterColorPair) {
        let letter = gridLetters[key];
        let cssVar = `var(--state-${letterColorPair[key]})`;
        let sDelay = parseFloat($(":root").css("--animation-flip-duration")) * (key % WORD_LENGTH) * 0.9 + "s";
        let delay = (parseFloat(sDelay) + (parseFloat($(":root").css("--animation-flip-duration")) / 2)) * 1000;
        let fullDuration = delay + (parseFloat($(":root").css("--animation-flip-duration")) * 1000);
        
        $(letter).css("animationDelay", sDelay).addClass("flip")

        setTimeout(() => {
            $(letter).css({backgroundColor: cssVar,
                borderColor: cssVar,
                color: "var(--state-font)"}); 
            colorKey($(letter).attr("data"), letterColorPair[key]);
        }, delay);

        setTimeout(() => {
            $(letter).removeClass("flip");
        }, fullDuration);

        if(key % WORD_LENGTH == 4)
            return fullDuration;
    }
}

function colorKey(whichLetter, color){
    let cssVar = `var(--state-${color})`;

    $(keyboard).each(function (index, element) {
        if($(element).text().toUpperCase() != whichLetter)
            return;
        if($(element).attr("taged") == "grey" || $(element).attr("taged") == "green")
            return;
        if($(element).attr("taged") == "yellow" && color == "grey")
            return;

        $(element).css({backgroundColor: cssVar, color: "var(--state-font)"}).attr("taged", color);
    });
}

/**
 * handles the logic for checking whats right and if the player lost or won 
 */
function submitGuess(){
    if(pauseInput)
        return;
    pauseInput = true;
    let guessedWord = grid[guessIndex].reduce((word, letter) => word += letter);

    if(guessedWord.length < WORD_LENGTH || !isValidWord(guessedWord)){
        shakeRow();
        pauseInput = false;
        return;
    }

    let availableLetters = {};
    TO_GUESS.split("").forEach(char => {
        availableLetters[char] = availableLetters[char] ? (availableLetters[char] + 1) : 1;
    })

    let letterColorPair = [];

    //first check the green positions and save the remaining letters
    grid[guessIndex].forEach((letter,i) =>{
        if(letter == TO_GUESS.charAt(i)){
            letterColorPair[guessIndex * WORD_LENGTH + i] = "green";
            availableLetters[letter] = availableLetters[letter] ? (availableLetters[letter] - 1) : 0;
        }
        else
            letterColorPair[guessIndex * WORD_LENGTH + i] = "grey";        
    });

    //check the remaining letters if the are on different position
    grid[guessIndex].forEach((letter,i) =>{
        if(availableLetters[letter] > 0){
            letterColorPair[guessIndex * WORD_LENGTH + i] = "yellow";
            availableLetters[letter] = availableLetters[letter] ? (availableLetters[letter] - 1) : 0;
        }
    });

    let wait = colorRow(letterColorPair);

    setTimeout(() => {
        pauseInput = false;
        if(guessedWord == TO_GUESS){
            gameEnded = true;
            jumpRow();
            saveGame("1");
            return;
        }

        guessIndex++;
        letterIndex = 0;
    
        if(guessIndex == NUMBER_OF_GUESSES){
            alert(`You lost, ${TO_GUESS} was the correct word`);
            gameEnded = true;
            saveGame("0");
        }
    }, wait);
}

function handleKeyboardInput(pressedKey){
    if(gameEnded)
        return;

    if (pressedKey.key === "Enter") {
        submitGuess()
        return;
    }
    if (pressedKey.key === "Backspace" || pressedKey.key === "Delete") {
        if(fullClear){
            fullClear = false;
            letterIndex = 5;
            while(letterIndex != 0)
                removeLetter();
        }else
            removeLetter();
        return;
    }
    
    if (pressedKey.key.match(/^[a-z]$/)) {
        guessLetter(pressedKey.key);
        return;
    }
}

function handleMouseInput(letter){
    guessLetter(letter);
}

/**
 * checks if a word is valid
 */
function isValidWord(word){
    return VALID_WORDS.includes(word.toLowerCase());
}

/**
 * saves data from the game 
 */
function saveGame(isWin){
    localStorage.setItem("played", localStorage.getItem("played") != null ? parseInt(localStorage.getItem("played")) + 1 : 1);
    
    if(isWin == "1"){
        localStorage.setItem("wins", localStorage.getItem("wins") != null ? parseInt(localStorage.getItem("wins")) + 1 : 1);

        let maxStreak = localStorage.getItem("maxStreak");
        let streak = localStorage.getItem("streak");

        if(streak == null)
            streak = 1;
        else
            streak++;

        localStorage.setItem("streak", streak);

        if(maxStreak == null)
            maxStreak == 0;
        if(streak > maxStreak)
            maxStreak = streak;

        localStorage.setItem("maxStreak", maxStreak);

        let guessed = "guessedAt" + (guessIndex + 1);
        localStorage.setItem(guessed, localStorage.getItem(guessed) != null ? parseInt(localStorage.getItem(guessed)) + 1 : 1);
    }else{
        localStorage.setItem("streak", 0);
    }

    grid.forEach((element, i) => {
        let word = element.join("");        

        localStorage.setItem("row" + i, word);
    });
}   

/**
 * calculates the stats new and shows the popup
 */
function toggleStats(){
    let played = localStorage.getItem("played");
    if(played == null)
        played = 0;
    $(".value[stats-type=played]").text(played);

    let winPercentage = Number(parseInt(localStorage.getItem("wins")) / parseInt(localStorage.getItem("played")));
    if(isNaN(winPercentage))
        winPercentage = 0;
    $(".value[stats-type=win]").text(winPercentage.toFixed(2) * 100);

    let streak = localStorage.getItem("streak");
    if(streak == null)
        streak = 0;
    $(".value[stats-type=streak]").text(streak);

    let maxStreak = localStorage.getItem("maxStreak");
    if(maxStreak == null)
        maxStreak = 0;
    $(".value[stats-type=maxStreak]").text(maxStreak);

    $(".stats-popup").toggleClass("hide");
}

/**
 * returns the current Letters in the row
 */
function getCurrentRow(){
    return gridLetters.slice(guessIndex * WORD_LENGTH, guessIndex * WORD_LENGTH + WORD_LENGTH);
}

/**
 * scale animation for a given element
 */
function scaleLetter(element){
    $(element).addClass("filled");

    setTimeout(() => {
        $(element).removeClass("filled");
    }, (parseFloat($(":root").css("--animation-jump-duration")) * 1000));
}

/**
 * jump animation for the current row
 */
function jumpRow(){
    let toShake = getCurrentRow();
    let fullDuration = (parseFloat($(":root").css("--animation-jump-duration")));
    $(toShake).each(function (i, element) {
        $(element).css("animationDelay", (i * 0.1) + "s").addClass("win");
        if(i == 4)
            fullDuration = (fullDuration + (i * 0.1)) * 1000;
    });

    setTimeout(() => {
        $(toShake).removeClass("win");
    }, fullDuration);

    setTimeout(() => {
        toggleStats();
    }, fullDuration + 150);
}

/**
 * wrong animation for the current row
 */
function shakeRow(){
    let toShake = getCurrentRow();

    $(toShake).addClass("wrong");

    setTimeout(() => {
        $(toShake).removeClass("wrong");
    }, (parseFloat($(":root").css("--animation-wrong-duration")) * (parseInt($(":root").css("--animation-wrong-iterations"))) * 1000));
}

$("html").keyup(handleKeyboardInput);

$(".key").on("click", function () {
    if(gameEnded)
        return;

    if($(this).hasClass("delete"))
        removeLetter();
    else if($(this).hasClass("enter"))
        submitGuess();
    else
        handleMouseInput($(this).text());

    $(this).addClass("filled");

    setTimeout(() => {
        $(this).removeClass("filled");
    }, (parseFloat($(":root").css("--animation-jump-duration")) * 1000));
});

/**
 * selects a letter on click
 */
$(".letter").on("click", function (e) {
    if(gameEnded)
        return;
    let i = $(e.target).attr("index");
    if(!(i < guessIndex * WORD_LENGTH + WORD_LENGTH && i >= guessIndex * WORD_LENGTH)){
        console.log(i);
        return;
    }
    indexSetted = true;
    letterIndex = i % WORD_LENGTH;
});

$("html").keydown(function (e) { 
    if(e.key == "Control")
        fullClear = true;
});

$("html").keyup(function (e) { 
    if(e.key == "Control")
        fullClear = false;
});

$(".icon").on("click", function () {

    let iconType = $(this).attr("iconType");

    switch (iconType) {
        case "stats":
            toggleStats();
            
            break;
        case "help":
            alert("show help");
            break;
        case "settings":
            alert("show settings");
            break;
    
        default:
            return;
    }
});

ScrollReveal().reveal('.letter', {interval: 30});
ScrollReveal().reveal('.key', {delay: 900, duration: 500});