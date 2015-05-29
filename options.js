// Add event listeners to DOM
window.addEventListener("load", restore_options);
document.getElementById("toggleProfanity").addEventListener("click", toggleProfanity);
document.getElementById("save").addEventListener("click", save_options);
document.getElementById("close").addEventListener("click", function(){window.close();});

// Saves options to localStorage.
function save_options() {
  var listbox = document.getElementById("wordList");
  var wordList = listbox.value;
  localStorage.wordList = wordList;
  
  if (document.myForm.preserveFirst.checked) {
    localStorage.preserveFirst = "true";
  } else {
    localStorage.preserveFirst = "false";
  }
  
  if (document.myForm.filterSubstring.checked) {
    localStorage.filterSubstring = "true";
  } else {
    localStorage.filterSubstring = "false";
  }
}

// Restores form state to saved values from localStorage.
function restore_options() {
  var listFavorite = localStorage.wordList;
  if (!listFavorite) {
    return;
  }
  var listbox = document.getElementById("wordList");
  listbox.value = listFavorite;
  
  document.myForm.preserveFirst.checked = (localStorage.preserveFirst == "true");
  document.myForm.filterSubstring.checked = (localStorage.filterSubstring == "true");
}

// Displays the profanity list and hides the profanity button
function toggleProfanity() {
  var profanityListId = document.getElementById("profanityList");
  profanityListId.style.display = "block"; 
  
  var profanityButtonId = document.getElementById("profanityButton");
  profanityButtonId.style.display = "none"; 
}
