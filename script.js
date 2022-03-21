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
    setLetterOnUI(letter);
    letterIndex++;
}

function removeLetter(){
    if(letterIndex == 0)
        return;

    letterIndex--;
    setLetterOnUI("");
    grid[guessIndex][letterIndex] = "";
}

function setLetterOnUI(letter){
    gridLetters[guessIndex * WORD_LENGTH + letterIndex].setAttribute("data", letter.toUpperCase());
}

function submitGuess(){

    let guessedWord = "";

    grid[guessIndex].forEach((letter,i) => guessedWord += letter);
    if(!isValidWord(guessedWord)){
        alert("NO VALID INPUT")
        return;
    }

    grid[guessIndex].forEach((letter,i) =>{
        if(letter == TO_GUESS.charAt(i)){
            $(gridLetters[guessIndex * WORD_LENGTH + i]).css("backgroundColor", "var(--state-green)");
            setKeyBoardColor(letter, "var(--state-green)", "green");
        }
        else if(TO_GUESS.includes(letter)){
            $(gridLetters[guessIndex * WORD_LENGTH + i]).css("backgroundColor", "var(--state-yellow)");
            setKeyBoardColor(letter, "var(--state-yellow)", "yellow");
        }else{
            $(gridLetters[guessIndex * WORD_LENGTH + i]).css("backgroundColor", "var(--state-grey)");
            setKeyBoardColor(letter, "var(--state-grey)", "grey");
        }
    });

    if(guessedWord == TO_GUESS){
        alert("You Won");
        gameEnded = true;
        return;
    }
    
    guessIndex++;
    letterIndex = 0;

    if(guessIndex == 6){
        alert("You lost");
        gameEnded = true;
    }
}

function setKeyBoardColor(keyWithLetter, color, type){
    $(keyboard).each(function (index, element) {
        if($(element).text().toUpperCase() != keyWithLetter)
            return;
        if($(element).attr("taged") == "green" || $(element).attr("taged") == "grey")
            return;
        $(element).css("backgroundColor", color);
        $(element).attr("taged", type);
    });
}

function handleKeyboardInput(pressedKey){
    if(gameEnded)
        return;

    if (pressedKey.key === "Enter" && letterIndex == WORD_LENGTH) {
        submitGuess()
        return;
    }
    if (pressedKey.key === "Backspace" || pressedKey.key === "Delete") {
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

$("html").keyup(handleKeyboardInput);

$(".key").on("click", function () {
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
