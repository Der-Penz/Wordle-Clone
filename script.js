
$("body").on("change", function () {
    toggleTheme();
});
function toggleTheme(){
    $("body").toggleClass("darkmode lightmode");
}

const WORD_LENGTH = 5
const keyboard = $(".keyboard-container");
const guessGrid = $(".grid-container");
const TO_GUESS = "stone";

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
    letterIndex++;
    console.table(grid);
}

function removeLetter(){
    if(letterIndex == 0)
        return;
    letterIndex--;
    grid[guessIndex][letterIndex] = "";
    console.table(grid);
}

function submitGuess(){
    let guessedWord = "";

    grid[guessIndex].forEach(letter => guessedWord += letter);
    console.log(guessedWord);
}

function handleKeyboardInput(pressedKey){
    if (pressedKey.key === "Enter" && letterIndex == WORD_LENGTH) {
        submitGuess()
        return;
    }
    console.log(pressedKey.keyCode);
    if (pressedKey.key === "Backspace" || pressedKey.key === "Delete") {
        removeLetter();
        
        return;
    }
    
    if (pressedKey.key.match(/^[a-z]$/)) {
        guessLetter(pressedKey.key);
        return;
    }
}

 $("html").keyup(handleKeyboardInput);
