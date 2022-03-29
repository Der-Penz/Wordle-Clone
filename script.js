import { VALID_WORDS } from './dictionary.js';
import { TARGET_WORDS } from './targetWords.js';

/**
 * toggles between light and dark theme
 */
$("input[type=checkbox].theme").on("change", function () {
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
var TO_GUESS = TARGET_WORDS[getDaily()].toUpperCase();
var gameEnded = true;
var pauseInput = false;
var indexSetted = true;
var gameMode = "daily";
var ctx = document.getElementById('guessChart');
var guessChart;
var guesses = [];

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

function checkForDaily(){
    if(!document.cookie.includes("playedDaily=true")){
        gameEnded = false;
        return;
    }
    showToast('<div style="text-align: center">Already played daily Wordle <br> press to play a random Wordle?</div>',
             "5000",
              "info",
              () => playRandom());
    gameEnded = true;
    guessIndex = 5;
    letterIndex = 0;
    let cookies = document.cookie.replace("playedDaily=true; ", "").split("; ");
    let states = cookies.pop().replace("states=", "");

    cookies.forEach((row, i) => {
        let word = row.split("=")[1];
        for (let j = 0; j < word.length; j++) {
            guessLetter(word.charAt(j));
        }
        
        guessIndex--;
        letterIndex = 0;
    });

    $(gridLetters).each(function (i, element) {
        let state = states.charAt(i);
        let cssColor = "var(--state-";
        switch (state) {
            case "g":
                cssColor += "green)";
                break;
            case "y":
                cssColor += "yellow)";
                break;
            case "r":
                cssColor += "grey)";
                break;
            case "n":
                cssColor = "var(--bg-primary)";
                break;
        }

        $(element).css("backgroundColor", cssColor);
        
    });
}

setTimeout(() => {
    checkForDaily();
    initChart();

}, 20 * 60);


/**
 * returns the daily wordle
 */
function getDaily(){
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


    if(indexSetted){
        setLetter("");
        indexSetted = false;
        return;
    }

    if(letterIndex != 0)
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
                color: "var(--state-font)"}).attr("state", letterColorPair[key]); 
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
 * shows a message on the webside
 */
function showToast(message, duration = "1500", type = "error", onClick = null){
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-center",
        "preventDuplicates": true,
        "onclick": onClick,
        "showDuration": "200",
        "hideDuration": "400",
        "timeOut": duration.toString(),
        "extendedTimeOut": "500",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    if(type == "error")
        toastr.error(message);
    else if(type == "info")
        toastr.info(message);
    else if(type = "success")        
        toastr.success(message);
    else if(type = "info")        
        toastr.info(message);
}

/**
 * handles the logic for checking whats right and if the player lost or won 
 */
function submitGuess(){
    if(pauseInput)
        return;
    pauseInput = true;

    let guessedWord = grid[guessIndex].reduce((word, letter) => word += letter);

    if(guessedWord.length < WORD_LENGTH){
        shakeRow();
        showToast("Word to short");
        pauseInput = false;
        return;
    }

    if(!isValidWord(guessedWord)){
        shakeRow();
        showToast("No valid input");
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
            showToast('<div style="text-align: center">You won GG<br>Press to play a random Wordle?</div>', "3000", "success", () => {playRandom(); togglePopup("stats"); });
            return;
        }

        guessIndex++;
        letterIndex = 0;
    
        if(guessIndex == NUMBER_OF_GUESSES){
            gameEnded = true;
            saveGame("0");
            showToast(`<div style="text-align: center">You lost: <p style="font-weight: 900">${TO_GUESS}</p> was the correct word<br>Press to play a random Wordle?</div>`, "5000", undefined, () => playRandom());
        }
    }, wait);
}

function handleKeyboardInput(pressedKey){
    if(gameEnded)
        return;

    if(pressedKey.key == "Control")
        fullClear = false;
        
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

function playRandom(){
    gameMode = "random";
    gameEnded = false;
    TO_GUESS = TARGET_WORDS[(Math.floor(Math.random() * TARGET_WORDS.length)) % TARGET_WORDS.length].toUpperCase();
    
    grid.forEach((e, i) => {
        e.forEach((el, j) => {
            e[j] = "";
        });
    });

    $(keyboard).each(function (index, element) {
        $(element).attr("taged", "false").css({backgroundColor: "var(--bg-secondary)", color: "var(--font-primary)"});
    });

    $(gridLetters).each(function (index, element) {
        // element == this
        $(element).attr("data", "").css({
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--bg-secondary)",
            color: "var(--font-primary)"});
    });

    guessIndex = 0;
    letterIndex = 0;

}

/**
 * saves data from the game 
 */
function saveGame(isWin){
    if(gameMode == "random")
        return;

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

    var date = new Date();
    date.setHours(23, 59, 59, 999);
    var expires = "expires=" + date.toUTCString();

    document.cookie = "playedDaily=true; " + expires;
    grid.forEach((element, i) => {
        let word = element.join("");

        document.cookie = `row${i}=${word}; ${expires} `;
    });
    let states = "";

    $(gridLetters).each((i, element) => {
        let state =  $(element).attr("state");

        switch (state) {
            case "green":
                states += "g";
                break;
            case "yellow":
                states += "y";
                break;
            case "grey":
                states += "r";
                break;
            case "none":
                states += "n";
                break;
        }
    });
    document.cookie = `states=${states}; ${expires} `;
}   

/**
 * calculates the stats new and shows the popup
 */
function updateStats(){
    let played = localStorage.getItem("played");
    if(played == null)
        played = 0;
    $(".value[stats-type=played]").text(played);

    let winPercentage = Number(parseInt(localStorage.getItem("wins")) / parseInt(localStorage.getItem("played")));
    if(isNaN(winPercentage))
        winPercentage = 0;

    $(".value[stats-type=win]").text((winPercentage * 100).toFixed(1));

    let streak = localStorage.getItem("streak");
    if(streak == null)
        streak = 0;
    $(".value[stats-type=streak]").text(streak);

    let maxStreak = localStorage.getItem("maxStreak");
    if(maxStreak == null)
        maxStreak = 0;
    $(".value[stats-type=maxStreak]").text(maxStreak);

    for (let i = 0; i < 6; i++) {
        guesses[i] = localStorage.getItem("guessedAt" + (i + 1)); 
        guessChart.data.datasets[0].data[i] = guesses[i];
    }
    guessChart.update();
}

function togglePopup(popup){
    $(`.popup[${popup}]`).toggleClass("hide");
    $(`.popup:not([${popup}])`).addClass("hide");

    if(popup == "stats")
        updateStats();
}

function initChart(){
    
    for (let i = 0; i < 6; i++) {
        guesses[i] = localStorage.getItem("guessedAt" + (i + 1));  
    }

    guessChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5', '6'],
            datasets: [{
                label: '',
                data: [guesses[0], guesses[1], guesses[2], guesses[3], guesses[4], guesses[5]],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            events: ['none']
        }
    });
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
        togglePopup("stats");
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

$("html").keydown(function (e) { 
    if(e.key == "Control")
        fullClear = true;

        









saveGame("0");





});

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
    if(!(i < guessIndex * WORD_LENGTH + WORD_LENGTH && i >= guessIndex * WORD_LENGTH))
        return;
    indexSetted = true;
    letterIndex = i % WORD_LENGTH;
});

$(".icon").on("click", function () {
    togglePopup($(this).attr("iconType"));
});

$(".button[random]").on("click", function () {
    playRandom();
    togglePopup("settings");
    document.activeElement.blur();
});

$(".button[switchEnter]").on("click", function () {
    $(".enter, .delete").toggleClass("switch");

});

ScrollReveal().reveal('.letter', {interval: 30});
ScrollReveal().reveal('.key', {delay: 900, duration: 500});