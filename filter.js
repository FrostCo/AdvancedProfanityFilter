chrome.extension.sendRequest({localstorage: "wordList"}, function(response) {
	// Parse profanity word list
	var wordList = parseWordList(response.wordList);
	
	var html = document.body.innerHTML;
	for (var i = 0; i < html.length; i++) {
		for (var x = 0; x < wordList.length; x++) {
			if (html[i].toLowerCase() == wordList[x].substring(wordList[x].length - 1)) {
				if (checkProfanity(html, i, wordList[x])) {
					html = replaceWithStars(html, i, wordList[x].length);
				}
			}
		}
	}
});

function checkProfanity(html, i, word) {
	if (html.length < word.length) {
		return false;
	} else {
		for (var x = 0; x < word.length; x++) {
			if (word.charAt(word.length - 1 - x) != html.charAt(i - x)) {
				return false;
			}
		}
	}
	
	return true;
}

function replaceWithStars(html, i, numStars) {
	var stars = "";
	for (var x = 0; x < numStars; x++) {
		stars = stars + "*";
	}
	html = html.substring(0, i-numStars) + stars + html.substring(i);
	
	return html;
}

function parseWordList(wordListString) {
	wordListString = wordListString.toLowerCase();
	
	var parsedWordList = [];
	var startIndex = 0;
	var endIndex = 0;
	var wordStarted = false;
	for (var i = 0; i < wordListString.length; i++) {
		if (wordListString[i] == ",") {
			endIndex = findPrevChar(wordListString, i);
			if (startIndex < endIndex) {
				parsedWordList.push(wordListString.substring(startIndex, endIndex));
			}
			wordStarted = false;
			startIndex = i + 1;
			endIndex = startIndex;
		} else if (wordListString[i] == " ") {
			if (!wordStarted) {
				startIndex = i + 1;
				endIndex = startIndex;
			}
		} else {
			if (!wordStarted) {
				wordStarted = true;
			}
		}
	}
	endIndex = findPrevChar(wordListString, i);
	if (startIndex < endIndex) {
		parsedWordList.push(wordListString.substring(startIndex, endIndex));
	}
	
	return parsedWordList;
}

function findPrevChar(wordListString, i) {
	while (i > 0) {
		if (i != " ") {
			return i;
		}
		i--;
	}
	
	return i;
}
