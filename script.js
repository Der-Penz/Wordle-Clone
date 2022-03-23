import { VALID_WORDS } from './dictionary.js'
import { TARGET_WORDS } from './targetWords.js'

$("body").on("change", function () {
    toggleTheme();
});

function toggleTheme(){
    $("body").toggleClass("darkmode lightmode");
}

const WORD_LENGTH = 5
const gridLetters = $(".letter");
const keyboard = $(".key");
const TO_GUESS = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)].toUpperCase();
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

function guessLetter(letter){
    if(letterIndex == WORD_LENGTH)
        return;

    grid[guessIndex][letterIndex] = letter.toUpperCase();
    setLetter(letter);

    letterIndex++;
}

function removeLetter(){
    if(letterIndex == 0)
        return;

    letterIndex--;
    setLetter("");
    grid[guessIndex][letterIndex] = "";
}

function setLetter(letter){
    let tile = $(gridLetters[guessIndex * WORD_LENGTH + letterIndex]);

    $(tile).attr("data", letter.toUpperCase());
    
    if(letter == "")
        return;
    scaleLetter(tile);
}

function colorLetter(which, color){
    let cssVar = `var(--state-${color})`;

    flipLetter($(which).addClass("flip"));

    setTimeout(() => {
        $(which).css({backgroundColor: cssVar,
            borderColor: cssVar,
            color: "var(--state-font)"});    
    }, 200);

    setTimeout(() => {
        flipLetter($(which).removeClass("flip"));
    }, 400);
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

    //first check the right ones
    grid[guessIndex].forEach((letter,i) =>{
        if(letter == TO_GUESS.charAt(i)){
            colorLetter(gridLetters[guessIndex * WORD_LENGTH + i], "green");
            colorKey(letter, "green");
            availableLetters[letter] = availableLetters[letter] ? (availableLetters[letter] - 1) : 0;
        }
    });

    //check the other ones after the on on the right spots to prevent bugs
    grid[guessIndex].forEach((letter,i) =>{
        if(letter == TO_GUESS.charAt(i)){}
        else if(availableLetters[letter] > 0){
            colorLetter(gridLetters[guessIndex * WORD_LENGTH + i], "yellow");
            colorKey(letter, "yellow");
            availableLetters[letter] = availableLetters[letter] ? (availableLetters[letter] - 1) : 0;
        }else{
            colorLetter(gridLetters[guessIndex * WORD_LENGTH + i], "grey");
            colorKey(letter, "grey");
        }
    });

    setTimeout(() => {
        if(guessedWord == TO_GUESS){
            jumpRow();
            gameEnded = true;
            return;
        }

        guessIndex++;
        letterIndex = 0;
    
        if(guessIndex == 6){
            alert("You lost, word was " + TO_GUESS);
            gameEnded = true;
        }
    }, 600);
    
  
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

function isValidWord(word){
    return VALID_WORDS.includes(word.toLowerCase());
}

function getCurrentRow(){
    return gridLetters.slice(guessIndex * WORD_LENGTH, guessIndex * WORD_LENGTH + WORD_LENGTH);
}

function scaleLetter(tile){
    $(tile).addClass("filled");

    setTimeout(() => {
        $(tile).removeClass("filled");
    }, 300);
}

function flipLetter(tile){
    $(tile).addClass("flip");

    setTimeout(() => {
        $(tile).removeClass("flip");
    }, 600);
}

function jumpRow(){
    $(gridLetters).removeClass("win");

    let toShake = getCurrentRow();
    setTimeout(() => {
        $(toShake).each(function (i, element) {
            $(element).css("animationDelay", (i * 0.1) + "s").addClass("win");
        });
    }, 1);

    setTimeout(() => {
        $(toShake).removeClass("win");
    }, 700);
}

function shakeRow(){
    $(gridLetters).removeClass("wrong");

    let toShake = getCurrentRow();
    setTimeout(() => {
        $(toShake).addClass("wrong");
    }, 1);

    setTimeout(() => {
        $(toShake).removeClass("wrong");
    }, 600);
}

$("html").keyup(handleKeyboardInput);

$(".key").on("click", function () {
    if(gameEnded)
        return;

    if($(this).hasClass("delete")){
        removeLetter();
        return;
    }

    if($(this).hasClass("enter")){
        submitGuess();
        return;
    }

    handleMouseInput($(this).text());
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

ScrollReveal().reveal('.letter', {interval: 30 });
ScrollReveal().reveal('.key', {delay: 700, duration: 1000});

