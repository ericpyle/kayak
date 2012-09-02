/*
 * @author Eric Pyle
 */

	function GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode)
	{
		var results = {};
		var bookNameLong = BookCodeToName[bookCode];
		var chapters = BookStats[bookCode].chapters;
		var chapterHtml = "";
		var bookHeadDivId = "bv-book-head-"+ bookCode;
		var bookTailDivId = "bv-book-tail-"+ bookCode;		
		results[bookCode] = { "bookHeadDivId": bookHeadDivId, 
							 "bookHeadDiv" : "<div id='"+ bookHeadDivId + "' class='bv-book' style='overflow:auto; width:250px;'><h3>" + bookNameLong + "</h3> <div></div></div>",
							 "bookTailDivId": bookTailDivId,
							 "bookTailDiv" : "<div id='"+ bookTailDivId + "' class='bv-book' style='overflow:auto; width:250px;'><div></div></div>",
							 "chapters" : []
							 };
		// see if book has any outlines
		var bookSlice = getBookSlice(outlinesKeyedByBCVRange, [bookCode]);
		if (bookSlice.outlines.length == 0)
			return results;
		for (var i=1; i <= chapters; i++) {
			
			var cssChapter = "bv-ch";
			var bcRange = [bookCode, i];
			var chSlice = getChapterSlice(outlinesKeyedByBCVRange, bcRange);
			if (chSlice.outlines.length > 0)
			{
				cssChapter += " ch-options";
				if (chSlice.outlines.length > 1)
					cssChapter += " ch-options-multiple";
			}
			var paddingLR = "5px";
			if (i < 10)
				paddingLR = "10.5px";
			results[bookCode].chapters.push("<div class='"+ cssChapter + "' style='padding:5px;padding-left:"+paddingLR+";padding-right:"+paddingLR+";display:run-in;float:left;'> " + i + " </div>")
		}
		return results;
	}
	
	function GenerateOutlineExpansion(outline)
	{
		var results = [];
		
		return results;
	}

	function DisplayBooksAndChapters()
	{
		$("#BrowseByBook div").remove();
		var outlinesKeyedByBCVRange = indexOutlinesByBCVRange(getDbRows());
		
		for(var property in BookStats) {
			if(typeof BookStats[property] == "string" || property.length == 3) {
				var bookCode = property;
				var results = GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode);
				
				$("#BrowseByBook").append(results[bookCode].bookHeadDiv);
				var chapters = results[bookCode].chapters;
				for (var i=0; i < chapters.length; i++) {
				  $(jq(results[bookCode].bookHeadDivId)).append(chapters[i]);
				};				
			}
		}
		
		$(".ch-options").click(doChapterOptions);
	}
	
	function doChapterOptions()
	{
		var indexCh = parseInt($(this).text());
		var bookId = $(this).parent(".bv-book");
		var bookCode = bookId.attr("id").substr(bookId.length - 4, 3);
		//alert(book + " " + indexCh);
		
		var outlinesKeyedByBCVRange = indexOutlinesByBCVRange(getDbRows());
		var bcRange = [bookCode, indexCh];
		var chSlice = getChapterSlice(outlinesKeyedByBCVRange, bcRange);
		var dbId = chSlice.outlines[0];
		
		var results = GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode);
		$(jq(results[bookCode].bookHeadDivId + " div")).remove();
		$(jq(results[bookCode].bookTailDivId + " div")).remove();
		
		var chapters = results[bookCode].chapters;
		for (var i=0; i < indexCh; i++) {
		  $(jq(results[bookCode].bookHeadDivId)).append(chapters[i]);
		};
		
		if (indexCh < chapters.length){
			if($(jq(results[bookCode].bookTailDivId)).length == 0)
				$(jq(results[bookCode].bookHeadDivId)).after(results[bookCode].bookTailDiv);
			for (var i=indexCh; i < chapters.length; i++) {
			  $(jq(results[bookCode].bookTailDivId)).append(chapters[i]);
			};
		} 
		else
		{
			$(jq(results[bookCode].bookTailDivId)).remove();
		}
	
		$(jq(results[bookCode].bookHeadDivId)).find("div.ch-options").click(doChapterOptions);
		$(jq(results[bookCode].bookTailDivId)).find("div.ch-options").click(doChapterOptions);
		// find widest range of context
		// split book into two: 1) up through chapter clicked upon
		// 2) next chapter through end of book
		// If outline is entire book, add expansion under all the chapters.
		// (alternatively, split after first chapter in range?)
		
		// TODO: pick outline by fewest number of verses in range
		// TODO:
		
		//pageToAndSelectOutline(dbId);
		return false;
	}
	
	function DisplayBooksAndChapterFormat()
	{
		for(var property in BookStats) {
			if(typeof BookStats[property] == "string" || property.length == 3) {
				var bookNameLong = "";
				if (property.substr(0,1) == "1" || property.substr(0,1) == "2" || property.substr(0,1) == "3")
				{
					bookNameLong = property.substr(0,1) + " " + property.substr(1,1).toUpperCase() + property.substr(2,1).toLowerCase(); // BookCodeToName[property];					
				}
				else
				 	bookNameLong = property.substr(0,1).toUpperCase() + property.substr(1,2).toLowerCase(); // BookCodeToName[property];
				var chapterVerseHtml = "1:1";
				
				$("#BrowseByBook").append("<div>" + bookNameLong + " "+ chapterVerseHtml +"</div>")
			}
		}
	}
	
	/* 
	{"id":"974c87bd5ec2e4afb24a0ce0d1000c9f","key":[["GEN",1,1],"chiasm"],"value":{"_id":"974c87bd5ec2e4afb24a0ce0d1000c9f","head":{"ScriptureRange":"Genesis 1:1","contentType":"chiasm"}}},
	{"id":"A74c87bd5ec2e4afb24a0ce0d1000c9f","key":[["GEN",1,1,"GEN",1,2],"chiasm"],"value":{"_id":"A74c87bd5ec2e4afb24a0ce0d1000c9f","head":{"ScriptureRange":"Genesis 1:1-2","contentType":"chiasm"}}},
    */
	function filterOutlinesByBooks(outlinesKeyedByBCVRange, bookTargets)
	{
		var matchingOutlineRows = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  var bcvRange = outlineRow.key[0];
		  // filter 
		  // matchingOutlineRows
		}
		return matchingOutlineRows;
	}


/*
	 *   var result = getChapterSlice(outlines, ["GEN",1]);
  		 var expected = {"outlines":["974c87bd5ec2e4afb24a0ce0d1000c9f","A74c87bd5ec2e4afb24a0ce0d1000c9f"]};
  		 ["GEN",1,1,"GEN",1,2]
  		 	0,  1,2  "3", 4,5
	 */
	function getBookSlice(outlinesKeyedByBCVRange, targetB)
	{
		var results = {};
		var matchingOutlines = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  var bcvRange = outlineRow.key[0];
		  // TODO: expand to include other books
		  if (targetB[0] == bcvRange[0])
		  {		  	
		  	 matchingOutlines.push(outlineRow.id);
		  }
		};		
		results["outlines"] = matchingOutlines;		
		return results;
	}

	/*
	 *   var result = getChapterSlice(outlines, ["GEN",1]);
  		 var expected = {"outlines":["974c87bd5ec2e4afb24a0ce0d1000c9f","A74c87bd5ec2e4afb24a0ce0d1000c9f"]};
  		 ["GEN",1,1,"GEN",1,2]
  		 	0,  1,2  "3", 4,5
	 */
	function getChapterSlice(outlinesKeyedByBCVRange, targetBC)
	{
		var results = {};
		var matchingOutlines = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  var bcvRange = outlineRow.key[0];
		  // TODO: expand to include other books
		  if (targetBC[0] == bcvRange[0])
		  {
		  	if (bcvRange.length == 3 && targetBC[1] != bcvRange[1])
		  		continue;
		  	if (bcvRange.length == 6 && (targetBC[1] < bcvRange[1] || targetBC[1] > bcvRange[4]))
		  		continue;		  	
		  	 matchingOutlines.push(outlineRow.id);
		  }
		};		
		results["outlines"] = matchingOutlines;		
		return results;
	}
	
	function outlineInSet(outlineSet, idTarget)
	{
	  for (var j=0; j < outlineSet.length; j++) {
		 if (idTarget == outlineSet[j])
		 {
		 	return true;
		 } 
	  };
	  return false;
	}

	/*
	 * 
	 * var result = getVerseSlice(outlines, ["GEN",1,1]);
  	   var expected = {"outlines":["974c87bd5ec2e4afb24a0ce0d1000c9f","A74c87bd5ec2e4afb24a0ce0d1000c9f"]};
  	   		 ["GEN",1,1,"GEN",1,2]
  		 	    0,  1,2  "3", 4,5
	 */
	function getVerseSlice(outlinesKeyedByBCVRange, targetBCV)
	{
		var results = {"outlines":[]};
		var chapterSliceResult = getChapterSlice(outlinesKeyedByBCVRange, targetBCV);
		if (chapterSliceResult.outlines.length == 0)
			return results;
		
		var matchingOutlines = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  
		  // first only search in outlines who fit the right book and chapter range
		  if (!outlineInSet(chapterSliceResult.outlines, outlineRow.id))
		  	continue;
		  
		  var bcvRange = outlineRow.key[0];
		  // TODO: expand to include other chapters
		  if (targetBCV[1] >= bcvRange[1])
		  {
		  	if (bcvRange.length == 3 && targetBCV[2] != bcvRange[2])
		  		continue;
		  	if (bcvRange.length == 6 && targetBCV[1] > bcvRange[4])
		  		continue;
		  	if (bcvRange.length == 6 && targetBCV[1] == bcvRange[4] && (targetBCV[2] < bcvRange[2] || targetBCV[2] > bcvRange[5]))
		  		continue;
		  	 matchingOutlines.push(outlineRow.id);
		  }
		};		
		results["outlines"] = matchingOutlines;
		return results;	
	}
	
	function parseBookCode(bookName)
	{
		var endChar = bookName.substr(bookName.length - 1, 1);
		if (endChar == ".")
			bookName = bookName.substr(0, bookName.length - 1); // strip off the endChar
		if (!bookName || bookName == "")
			return null;
		
		if (!bookName || bookName == "")
			return null;
		
		var bookCode = BookNameToCode[bookName.toLowerCase()];
		if (!bookCode)
		{
			// try matching the bookcode
			var testBookCode = bookName.toUpperCase();
			if (testBookCode.length == 4)
			{
				var secondChar = testBookCode.substr(1, 1);
				if (secondChar == " ")
				{
					// remove the space
					testBookCode = testBookCode.substr(0,1) + testBookCode.substr(2,2);					
				}
			}
			if (testBookCode.length == 3)
			{
				if(BookCodeToName[testBookCode])
					bookCode = testBookCode;
			}			
		}
		return bookCode;
	}
	
	function parseBCVRange(scriptureRange)
	{
		var bcvRange = [];
		if (!scriptureRange || scriptureRange == "")
			return bcvRange;
		// TODO: handle multiple books (1 Sam - 2 Sam)
		var bookName = getBookName(scriptureRange); // kayak-common.js			
		var bookCode = parseBookCode(bookName);
		if (!bookCode)
			return bcvRange;
		
		bcvRange.push(bookCode);
		var cvRef = scriptureRange.substr(bookName.length, scriptureRange.length - bookName.length);
		var pattCVerseRef=/(?:(?:[1-9][0-9]?[0-9]?[.:])?[1-9][0-9]?[-–—]?)/g;		
		var matches2 = cvRef.match(pattCVerseRef);
		if (!matches2 || matches2.length == 0)
			return bcvRange;
		
		var chapter1 = getChapter(matches2[0]);
		var verse1 = null;
		if (chapter1)
		{
			bcvRange.push(chapter1);
			verse1 = getVerse(matches2[0], true /* expect colon to precede verse */);
			if (verse1)
				bcvRange.push(verse1); // first Verse
			else
				bcvRange.push(1); // no verses specified, just start at verse 1
		}
		
		if (matches2.length == 1)
			return bcvRange;
		
		bcvRange.push(bookCode);
		var chapter2 = getChapter(matches2[1], true /* expect colon followed by verse */);		
		if (chapter2)
		{
			var verse2 = getVerse(matches2[1]);
			// bcvRange.push(chapters2[0]);
			if (verse1)
			{
				if (verse2)
				{
					bcvRange.push(chapter2);
					bcvRange.push(verse2); 
				}
				else
				{
					// wrong format, oh well.
					bcvRange.push(chapter2);
					bcvRange.push(null); 
				}
			}
			else
			{
				bcvRange.push(chapter2);  // TODO: need test for this
				bcvRange.push(-1); 
			}
		}
		else
		{
			var verse2 = getVerse(matches2[1]);
			if (verse2)
			{
				if (verse1)
				{
					// the verse2 is actually a continuation of verse1 (GEN 1:2-3), so use the first chapter we found,
					// followed by verse2
					var verse2 = getVerse(matches2[1]);
					bcvRange.push(chapter1);
					bcvRange.push(verse2);
				}
				else
				{
					// assume that verse2 is actually a continuation of chapter1 (GEN 1-2), so use verse2 as 
					// the second chapter.
					bcvRange.push(verse2);
					bcvRange.push(-1); 
				}	
			}
			else
			{
				// wrong format, oh well.
				bcvRange.push(null);
				bcvRange.push(null);				
			}
		}
		return bcvRange;
	}
	
	function indexOutlinesByBCVRange(outlineRows)
	{
		var newRows = [];
		// {"id":"kyk:2011-06-06T18:47:27.748Z:ol","key":["kyk:2011-06-06T18:47:27.748Z:ol","chiasm: egreene"],"value":{"_id":"kyk:2011-06-06T18:47:27.748Z:ol","_rev":"21-d1ed85705c82e14deec99f48f7dc6ff1","head":{"submissionTimestamp":[2011,6,6,"18:47:27.748Z"],"bcvRange":["Matt",7,6],"author":{"guid":"kyk:2011-06-05T18:47:27.748Z:ps","authorShortname":"egreene"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"guid":"kyk:2011-06-06T18:47:27.848Z:sr","details":"1999"},"title":"","ScriptureRange":"Matthew 7:6","contentType":"chiasm"},"body":{"concepts":[{"content":"dogs"},{"content":"pigs"},{"content":"trample under feet"},{"content":"turn and tear to pieces"}]}}},
// to 
// 		  {"id":"56e905abc996fa0a1b824d4118002410","key":[["GEN",1,1],"chiasm"],"value":{"_id":"56e905abc996fa0a1b824d4118002410","head":{"ScriptureRange":"Genesis 1:1","contentType":"chiasm"}}},

		for (var irow=0; irow < outlineRows.length; irow++) {
		  	var outlineRow = outlineRows[irow];
		  	var outline = outlineRow.value; 		  			  	
		  	// create new key
		  	var bcvRange = parseBCVRange(outline.head.ScriptureRange);
		  	if (bcvRange.length == 0)
		  		continue; // skip outlines without BCVRange	  		  	
		  	var newKey = [bcvRange, outline.head.contentType];		  	
		  	var newRow = { id : outline._id, key: newKey, value : outline };		  	
		  	newRows.push(newRow);
		};
		
		return newRows;
	}
