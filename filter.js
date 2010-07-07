var wordList;

chrome.extension.sendRequest({localstorage: "wordList"}, function(response) {
	wordList = parseWordList(response.wordList);
	removeProfanity();
	document.addEventListener('DOMSubtreeModified', removeProfanity, false);
});

function removeProfanity() {
	var regExList = [];
	var starList = [];
	for (var x = 0; x < wordList.length; x++) {
		regExList.push(new RegExp("\\b" + wordList[x] + "\\b", "gi" ));
		var starString = "";
		for (var y = 0; y < wordList[x].length; y++) {
			starString = starString + "*";
		}
		starList.push(starString);
	}
	var xPathResult = document.evaluate(
		'.//text()[normalize-space(.) != ""]',
		document,
		null,
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	
	for (var i = 0; i < xPathResult.snapshotLength; i++) {
		var textNode = xPathResult.snapshotItem(i);
		for (var z = 0; z < regExList.length; z++) {
			textNode.data = textNode.data.replace(regExList[z], starList[z]);
		}
	}
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