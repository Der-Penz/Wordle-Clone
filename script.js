import { VALID_WORDS } from './dictionary.js'
import { TARGET_WORDS } from './targetWords.js'


/**
 * toggles between light and dark theme
 */
$("input[type=checkbox]").on("change", function () {
    $("body").toggleClass("darkmode lightmode");
});

const WORD_LENGTH = 5
const NUMBER_OF_GUESSES = 6;
const gridLetters = $(".letter");
const keyboard = $(".key");
// const TO_GUESS = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)].toUpperCase();
const TO_GUESS = "stone".toUpperCase();
var gameEnded = false;

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
 * adds a letter
 */
function guessLetter(letter){
    if(letterIndex == WORD_LENGTH)
        return;

    setLetter(letter);
    letterIndex++;
}

/**
 * removes a letter
 */
function removeLetter(){
    if(letterIndex == 0)
        return;

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
    let guessedWord = grid[guessIndex].reduce((word, letter) => word += letter);

    if(guessedWord.length < WORD_LENGTH || !isValidWord(guessedWord)){
        shakeRow();
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
        if(guessedWord == TO_GUESS){
            jumpRow();
            gameEnded = true;
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
    }else{
        localStorage.setItem("streak", 0);
    }
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

//under construction
//selectable index
// $(".letter").on("click", function (e) {
//     if(gameEnded)
//         return;
//     let i = $(e.target).attr("index");

//     if(!(i <= guessIndex * WORD_LENGTH + WORD_LENGTH && i > guessIndex * WORD_LENGTH))
//         return;
    
//     letterIndex = i - 1;
// });

$("html").keydown(function (e) { 
    if(e.key == "Control")
        fullClear = true;
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