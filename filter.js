var wordList;
var preserveFirst;
var filterSubstring;
var readyWordList = false;
var readyPreserveFirst = false;
var readyFilterSubstring = false;

// Retrieve the localStorage from background page
var port = chrome.extension.connect({name: "getLocalStorage"});
port.postMessage({localStorage: "wordList"});
port.postMessage({localStorage: "preserveFirst"});
port.postMessage({localStorage: "filterSubstring"});
port.onMessage.addListener(function(msg) {
  if (msg.wordList) {
	wordList = msg.wordList.split(",");
	if (readyPreserveFirst && readyFilterSubstring) {
		// When all local storage retrieved, begin removing profanity
		removeProfanity();
	}
	readyWordList = true;
  }
  if (msg.preserveFirst) {
	preserveFirst = (msg.preserveFirst == "true");
	if (readyWordList && readyFilterSubstring) {
		// When all local storage retrieved, begin removing profanity
		removeProfanity();
	}
	readyPreserveFirst = true;
  }
  if (msg.filterSubstring) {
	filterSubstring = (msg.filterSubstring == "true");
	if (readyWordList && readyPreserveFirst) {
		// When all local storage retrieved, begin removing profanity
		removeProfanity();
	}
	readyFilterSubstring = true;
  }
});

// When DOM it modified, remove profanity again
document.addEventListener('DOMSubtreeModified', removeProfanity, false);

// Remove the profanity from the document
function removeProfanity() {
	var regExList = [];
	if (filterSubstring) {
		for (var x = 0; x < wordList.length; x++) {
			regExList.push(new RegExp("(" + wordList[x][0] + ")" + wordList[x].substring(1), "gi" ));
		}
	} else {
		for (var x = 0; x < wordList.length; x++) {
			regExList.push(new RegExp("\\b(" + wordList[x][0] + ")" + wordList[x].substring(1) + "\\b", "gi" ));
		}
	}
	var evalResult = document.evaluate(
		'.//text()[normalize-space(.) != ""]',
		document,
		null,
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	
	for (var i = 0; i < evalResult.snapshotLength; i++) {
		var textNode = evalResult.snapshotItem(i);
		for (var z = 0; z < regExList.length; z++) {
			textNode.data = textNode.data.replace(regExList[z], starReplace);
		}
	}
}

// Replace the profanity with a string of asterisks
function starReplace(strMatchingString, strFirstLetter) {
	var starString = "";
	if (!preserveFirst) {
		for (var i = 0; i < strMatchingString.length; i++) {
			starString = starString + "*";
		}
	} else {
		starString = strFirstLetter;
		for (var i = 1; i < strMatchingString.length; i++) {
			starString = starString + "*";
		}
	}
	
	return starString;
}