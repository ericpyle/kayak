/**
 * @author Pyle
 */


/*
	 * Returns the new content with citation markup
	 */
	function getCitationMarkup(content, bookName1, chRange)
	{
		if (content == null)
			return null;
		//alert("applyCitation")
		var pattCVerseRef=/(?:(?:[1-9][0-9]?[0-9]?[.:])?[1-9][0-9]*[-–—]?)+/g;		
		var matches2 = content.match(pattCVerseRef);
		//alert(matches2)
		if (matches2 == null)
			return null;
		var remainingContent = content;
		var finalContent = "";
		for (j = 0; j < matches2.length; j++)
		{
			var chVerseRange = matches2[j];
			var title = chVerseRange;
			var matchLocation = remainingContent.indexOf(chVerseRange);
			var segment = remainingContent.substring(0, matchLocation + chVerseRange.length);
			remainingContent = remainingContent.substring(matchLocation + chVerseRange.length);
			//alert(chVerseRange);
			if (chRange && chRange[0].length > 0 && chVerseRange.indexOf(":") == -1 && chVerseRange.indexOf(".") == -1)
			{
				title = chRange[0] + ":" + chVerseRange;
			}
			var markup = '<cite class="bibleref" title="' + bookName1 + " " + title + '">' + chVerseRange + "</cite>";
			finalContent += segment.replace(chVerseRange, markup);
		}
		if (remainingContent.length > 0 && remainingContent != content)
		{
			finalContent += remainingContent;
		}
		return finalContent;
	}
	
	function getBookName(scriptureRange)
	{
				// first establish context of chiasm
		if (scriptureRange == null)
		{
			return;
		}
		var context = scriptureRange;
		var pattBook1=/(?:[123]\ )?[A-Za-z][A-Za-z]+[\.]?/g;
		var matches = context.match(pattBook1);
		//alert(matches)
		var bookName1 = "";
		if (matches != null)
			bookName1 = matches[0];
		return bookName1;
	}
	
	function getChapterRange(scriptureRange)
	{
		var pattChSeg=/[\ \-]([1-9][0-9]?[0-9]?)[\.\:\ ]?/g;
		var pattVerse=/[\.\:]([1-9][0-9]?[0-9]?)?/g;
		var chMatches = scriptureRange.match(pattChSeg);
		var verseMatches = scriptureRange.match(pattVerse);
		var chapters = [];
		var pattCh=/([1-9][0-9]?[0-9]?)/;
		
		// crop each chapter segment into just the chapter
		var chBegin = chMatches[0].match(pattCh)[0];
		chapters.push(chBegin);		
		if (chMatches.length == 2 && (!verseMatches || (verseMatches.length == 0 || verseMatches.length == 2)))
		{
			var chEnd = chMatches[1].match(pattCh)[0];
			chapters.push(chEnd);
		}		
		return chapters;
	}
	
	
	/*
	 * returns false if no update happened, true if so.
	 */
	function applyCitationMarkupForItemToViews(concepts, bookName, iconcept, scriptureRange, publishContentToView)
	{
		var content = concepts[iconcept].content;
		var chRange = getChapterRange(scriptureRange);		
		var newContent = getCitationMarkup(content, bookName, chRange);
		if (newContent == null)
			return false; // did nothing
		publishContentToView(concepts, iconcept, newContent);
		return true; // did something
	}
	
	function updateScriptureCitation(element, editItemSelector, publishContentToView)
	{
		var bookName = getBookName(mainOutline.head.ScriptureRange);
		var indexExited = getIndexOfOwningEditItem(element, editItemSelector);
		//alert(indexExited + contentExited)
		applyCitationMarkupForItemToViews(mainOutline.body.concepts, bookName, indexExited, mainOutline.head.ScriptureRange, publishContentToView);
		refreshScriptureTagging();		
	}
	
	function applyCitationMarkup(outline, publishContentToView)
	{
		var scriptureRange = outline.head.ScriptureRange;
		var bookName1 = getBookName(scriptureRange);
		// first establish context of chiasm
		if (bookName1 == null)
		{
			return;
		}
		// next go through each of the items, and identify the verses
		for (i = 0; i < outline.body.concepts.length; i++)
		{
			applyCitationMarkupForItemToViews(outline.body.concepts, bookName1, i, scriptureRange, publishContentToView);
		}
	}
	
	function refreshScriptureTagging()
	{
		Logos.ReferenceTagging.tag();
	}
