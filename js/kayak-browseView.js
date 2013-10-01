/*
 * @author Eric Pyle
 */
    function createChapterOrVerseDiv(bcOrbcvRange, outlinesKeyedByBCVRange)
    {
        var ins = (bcOrbcvRange.length == 2) ? "ch" : "vs";
        var getSlice = (bcOrbcvRange.length == 2) ? getChapterSlice : getVerseSlice;
        var i = (bcOrbcvRange.length == 2) ? bcOrbcvRange[1] : bcOrbcvRange[2];

        var cssOptions = "";
        if (i < 10)
            cssOptions += " bv-"+ins+"-underten";
        var slice = getSlice(outlinesKeyedByBCVRange, bcOrbcvRange);
        if (slice.outlines.length > 0) {
            cssOptions += " "+ins+"-options";
            if (slice.outlines.length > 1)
                cssOptions += " " + ins + "-options-multiple";
            // see if any of the outlines start here
            for (var ioutline = 0; ioutline < slice.outlines.length; ioutline++) {
                var outlineId = slice.outlines[ioutline];
                var bcvrange = getSelectedBCVRange(outlinesKeyedByBCVRange, outlineId);
                if (!bcvrange || bcvrange.length == 0 || bcvrange.length == 1)
                    continue;
                if (bcOrbcvRange.length == 2)
                {
                    if (bcvrange[0] == bcOrbcvRange[0] &&
                        bcvrange[1] == bcOrbcvRange[1]) {
                        cssOptions += " ch-options-rangeStart";
                        break;
                    }
                }
                else
                {
                    if (bcvrange[0] == bcOrbcvRange[0] &&
                        bcvrange[1] == bcOrbcvRange[1] &&
                        bcvrange[2] == bcOrbcvRange[2]) {
                        cssOptions += " vs-options-rangeStart";
                        break;
                    }
                }
            }
        }
        return "<div class='bv-" + ins + cssOptions + "'> " + i + " </div>";
    }

	function GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode, chOrVsMode)
	{
		var results = {};
		var bookNameLong = BookCodeToName[bookCode];
		var chapters = BookStats[bookCode].chapters;
		var chapterHtml = "";
		var bookHeadDivId = "bv-book-head-"+ bookCode;
		var bookTailDivId = "bv-book-tail-"+ bookCode;		
		results[bookCode] = { "bookHeadDivId": bookHeadDivId, 
		    "bookHeadDiv": "<div id='" + bookHeadDivId + "' class='bv-book' style='overflow:auto; width:250px;'><p><b> " + bookNameLong + " </b><a class='bv-book-show-verses' href='#'>Show verses</a><div></div></div>",
							 "bookTailDivId": bookTailDivId,
							 "bookTailDiv" : "<div id='"+ bookTailDivId + "' class='bv-book' style='overflow:auto; width:250px;'><div></div></div>",
							 "chapters": [],
							 "chaptersAndVerses": []
							 };
		// see if book has any outlines
		var bookSlice = getBookSlice(outlinesKeyedByBCVRange, [bookCode]);
		if (bookSlice.outlines.length == 0)
			return results;
		for (var i=1; i <= chapters; i++) {
			
		    var bcRange = [bookCode, i];
		    var chDiv = createChapterOrVerseDiv(bcRange, outlinesKeyedByBCVRange);
		    results[bookCode].chapters.push(chDiv);

		    if (chOrVsMode != "chapters") {
		        var bookStats = getBookStats(bcRange);
		        var verses = bookStats.verses;
		        var versesDivs = "";
		        for (var v = 1; v <= verses; v++) {
		            var bcvRange = [bookCode, i, v];
		            var vsDiv = createChapterOrVerseDiv(bcvRange, outlinesKeyedByBCVRange);
		            versesDivs += vsDiv;
		        }
		        results[bookCode].chaptersAndVerses.push(versesDivs);
		    }

		}
		return results;
	}
    
	function formatBookAndChapterCode(bookCode, ch, chapters) {
	    if (typeof ch == "string") {
	        if (ch.length == 0)
	            return bookCode;
	        else
	            ch = parseInt(ch);
	    }	            	    
	    var chFormatted = ch;
	    if (ch < 10) {
	        chFormatted = "0" + chFormatted;
	    }
	    if (chapters > 100 && ch < 100) {
	        chFormatted = "0" + chFormatted;
	    }
	    return bookCode + chFormatted;
	}
	
	function docIsOutline(outline)
	{
		return outline._id.substr(outline._id.length - 3, 2) == "ol";
	}
	
	function DisplayOutlineExpansion(outline, container)
	{	
		$(container).append("<div id='bv-outline-selected-body' style='overflow:auto; width:100%;'></div>");
		var bodySelector = $(jq("bv-outline-selected-body"));
		if (outline.head.contentType == "chiasm")
		{
			$(outline.body.concepts).each(function(index)
			{
				CreateChiasmViewItem(outline.body.concepts, index, "indent-bv", bodySelector, { "includeId": true, "layoutMode": "indent" });
			});
			applyCitationMarkup(outline, publishContentToSequentialPreviewTabs, "bv", container);
		}
		else if (outline.head.contentType == "outline")
		{
			var result = generateHierarchicalFlat(outline);
			$(bodySelector).append(result.html);
			applyCitationMarkup(outline, publishContentToSequentialPreviewTabs, "bv", container);		
		}
		else if (outline.head.contentType == "panel")
		{			
			var result = generatePanelIndent(outline, { includeId:false });
			$("<table class='outline-table'></table>").appendTo(bodySelector)
				.append(result.html)
				.children('div').click(highlightItem);

			applyCitationMarkup(outline, publishContentToPanelTablePreviewTab, "bv", container);
		}
		$(bodySelector).find(".lnkToEmbeddedOutline").click(embedOutlineHere);
		$(container).prepend("<div id='bv-outline-selected-head'> (" + outline.head.ScriptureRange + ") "+
			" <a id='bv-head-goEdit' href='#' style='font-size:small;'>Go edit...</a> " +
			" <a id='bv-head-details-toggle' href='#' style='font-size:small;'>Show details...</a> " +
			 "</div>");
		$(jq("bv-head-goEdit")).click(goEdit);
		$(jq("bv-head-details-toggle")).click(toggleHeadDetails);		
		refreshScriptureTagging();
	}
	
	function goEdit()
	{
		var data = $(jq("bv-outline-selected")).data("outline-selected");
		pageToAndSelectOutline(data.outlineId, "#EditView");
		return false;
	}
	
	function toggleHeadDetails()
	{
		var headDetails = $(jq("bv-head-details"));
		if (headDetails.length == 0){
			var data = $(jq("bv-outline-selected")).data("outline-selected");
			var combinedTitle = CombineTitleAuthorAndSource(data.outline);
			$(this).after("<div id='bv-head-details'>" + combinedTitle + "</div>");
			$(jq("bv-head-details-toggle")).text("Hide details");
		}
		else{			
			headDetails.remove();
			$(jq("bv-head-details-toggle")).text("Show details...");
		}
		return false;
	}

	function DisplayBooksAndChapters()
	{
		$("#BrowseByBook div").remove();
		
		/*
		 *	<div class='table'>
				<div class='row'>
					<div class='cell'>Scripture/Outlines...</div>
					<div class='cell runner-container'>
			 			<div class='runner-header'>Banner</div>
						<div class='runner'></div>
						<div class='runner'></div>
					</div>
				</div>	
			</div>
		 */
		
		$("#BrowseByBook").append("<div class='table'></div>");
		//$("#BrowseByBook").append("<table></table>");
		var outlinesKeyedByBCVRange = indexOutlinesByBCVRange(getDbRows());
		
		for(var property in BookStats) {
			if(typeof BookStats[property] == "string" || property.length == 3) {
				var bookCode = property;
				var results = GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode, "chapters");
				var row = "<div class='row'><div class='cell'>" + results[bookCode].bookHeadDiv + "</div><div class='cell runner-container'></div></div>";
				//var row = "<tr><td>"+ results[bookCode].bookHeadDiv +"</td><td></td></tr>";				
				$("#BrowseByBook .table").append(row);				
				var chapters = results[bookCode].chapters;
				for (var i=0; i < chapters.length; i++) {
				    $(jq(results[bookCode].bookHeadDivId)).append(chapters[i]);
				};
		    }
		}
				
		$(".ch-options").click(doChapterOptions);
		$(".bv-book-show-verses").click(showVerses);
		$(jq('bv-book-head-GEN')).parent().next().append("<div class='runner'></div><div class='runner-header'>The Book of the Ox/Priest (am ~2553)</div><div class='runner atomicSeries'></div>")
		$(jq('bv-book-head-EXO')).parent().next().append("<div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-LEV')).parent().next().append("<div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-NUM')).parent().next().append("<div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-DEU')).parent().next().append("<div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-JOS')).parent().next().append("<div class='runner'></div><div class='runner atomicSeries'></div>");
		
		$(jq('bv-book-head-JDG')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner-header'>The Book of the Lion/King (am 2905 to 3020) History</div><div class='runner atomicSeries'></div>")
		$(jq('bv-book-head-RUT')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-1SA')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-2SA')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		
		$(jq('bv-book-head-JOB')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner-header'>The Book of the Lion/King (am 2905 to 3020) Wisdom</div><div class='runner atomicSeries'></div>")
		$(jq('bv-book-head-PSA')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-PRO')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-ECC')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-SNG')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		
		$(jq('bv-book-head-1KI')).parent().next().append("<div class='runner atomicPair runner-head'></div><div class='runner'></div><div class='runner'></div><div class='runner-header'>The Book of the Eagle/Prophet (am 3200 to 3300) History</div><div class='runner atomicSeries'></div>")
		$(jq('bv-book-head-2KI')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-1CH')).parent().next().append("<div class='runner atomicPair runner-head'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-2CH')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-EZR')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-NEH')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-EST')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		
		$(jq('bv-book-head-ISA')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner'></div><div class='runner-header'>The Book of the Eagle/Prophet (am 3200 to 3300) Writings</div><div class='runner atomicSeries'></div>")
		$(jq('bv-book-head-JER')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-LAM')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-EZK')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-DAN')).parent().next().append("<div class='runner'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-HOS')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-JOL')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-AMO')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-OBA')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-JON')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-MIC')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-NAM')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-HAB')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-ZEP')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-HAG')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-ZEC')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");
		$(jq('bv-book-head-MAL')).parent().next().append("<div class='runner atomicPair'></div><div class='runner'></div><div class='runner'></div><div class='runner atomicSeries'></div>");

		//adjustHeightOfRunnerContainers();
	}

	function showVerses() {
	    var bookHeadDivId = $(this).closest('.bv-book').attr('id');
	    var bookCode = extractBookCode(bookHeadDivId);
	    var outlinesKeyedByBCVRange = indexOutlinesByBCVRange(getDbRows());
	    var results = GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode, "verses");

	    var chapters = results[bookCode].chapters;
	    var chaptersAndVerses = results[bookCode].chaptersAndVerses;
	    // remove bookHeadDiv children (chapters)
	    $(jq("bv-outline-selected")).remove();
	    removeChapters(results[bookCode]);
	    doChapterOrVerseOptionsInternal([bookCode, null, null]);
	    //for (var i = 0; i < chapters.length; i++) {
	    //    $(jq(results[bookCode].bookHeadDivId)).append("<table class='bv-chvss'><tr><td style='vertical-align:top;'><div class='bv-ch'><b>" + (i + 1) + "</b></div></td><td>" + chaptersAndVerses[i] + "</td></tr></table>"); // <div style='clear:both;'/>
	    //};
	    $(this).unbind('click');
	    $(this).text("Show chapters");
	    $(this).removeClass("bv-book-show-chapters");
	    $(this).addClass("bv-book-show-verses");
	    $(this).click(showChapters);
	    return false;
	}
	
	function showChapters() {
	    var bookHeadDivId = $(this).closest('.bv-book').attr('id');
	    var bookCode = extractBookCode(bookHeadDivId);
	    var outlinesKeyedByBCVRange = indexOutlinesByBCVRange(getDbRows());
	    var results = GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode, "chapters");

	    var chapters = results[bookCode].chapters;
	    $(jq("bv-outline-selected")).remove();
	    removeVerses(results[bookCode]);
	    doChapterOrVerseOptionsInternal([bookCode, null]);

	    $(this).unbind('click');
	    $(this).text("Show verses");
	    $(this).removeClass("bv-book-show-verses");
	    $(this).addClass("bv-book-show-chapters");
	    $(this).click(showVerses);
	    return false;
	}

	function adjustHeightOfRunnerContainers()
	{
		// adjust column widths
	  	var widthCol0px = $(jq("bv-outline-selected")).parent().css('width');
	  	var widthCol0 = $(jq("bv-outline-selected")).parent().width();	  	
	  	if (widthCol0px){
	  		var rowWidth = widthCol0 + 300;	  	
		  	$(".row").each(function(index) {
		    	$(this).children(".cell").first().css('width', widthCol0px);
		    	$(this).width(rowWidth);	
		  	});
		  	//$(".table").width(rowWidth);
		  	
	  	}
	  	else
	  	{
	  		var rowWidth = "auto";	
	  		$(".row").each(function(index) {
		    	$(this).width(rowWidth);		    	
		  	});
		  	//$(".table").width(rowWidth);
	  	}
	  	
		$(".row").each(function(index) {
	    	var heightCol0 = $(this).children(".cell").first().css('height');
	    	$(this).children(".runner-container").first().css('height', heightCol0);
	  	});
	  	

	}
		
	function getNextOptionId(outlinesKeyedByBCVRange, bcRange, outlineContainerId)
	{
		var previousSelection = $(jq(outlineContainerId)).data("outline-selected");
		$(jq(outlineContainerId)).remove();
		var chSlice;
		if (bcRange.length == 2)
		    chSlice = getChapterSlice(outlinesKeyedByBCVRange, bcRange);
		else
		    chSlice = getVerseSlice(outlinesKeyedByBCVRange, bcRange);
		// select the next outline
		var nextOptionId = null;		
		if (previousSelection && previousSelection.bcRange[0] == bcRange[0] && previousSelection.bcRange[1] == bcRange[1] && 
            (previousSelection.bcRange.length == 2 || previousSelection.bcRange.length == 3 && previousSelection.bcRange[2] == bcRange[2]))
		{		        
			for (var i=0; i < chSlice.outlines.length; i++) {
			  if (chSlice.outlines[i] == previousSelection.outlineId)
			  {
			  	var inext = i+1;
			  	if (inext < chSlice.outlines.length)
			  	{
			  		nextOptionId = chSlice.outlines[inext];
			  		break;
			  	}		  	 
			  }
			}; 
		}
		else
		{
			// start with the first one
			nextOptionId = chSlice.outlines[0];
		}
		return nextOptionId;
	}
	
	/*
	 * evaluate: could be faster to parse the ScriptureRange if outlines are many
	 */
	function getSelectedBCVRange(outlinesKeyedByBCVRange, selectedOutlineId)
	{
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow =	outlinesKeyedByBCVRange[i];
		  if (outlineRow.id == selectedOutlineId)
		  	return outlineRow.key[0];
		}; 
		return [];
	}
	
	function collectElementsInBCVRange(chaptersContainer, outlinesKeyedByBCVRange, selectedOutlineId, bcRange)
	{
	    var optionSelector;
	    if (bcRange.length == 2)
	        optionSelector = ".bv-ch.ch-options";
	    else
	        optionSelector = ".bv-vs.vs-options";

		var bookCode = bcRange[0];
		var headFound = false;
		var elementsInBcvRange = [];
		$(chaptersContainer).find(optionSelector).each(function (index)
		{
		    var bcRangeTest;
		    var bcOrBcvRange = getBCorBCV.call(this);
		    var indexCh = bcOrBcvRange[1];
		    var getSlice;
			if (bcRange.length == 2) {
			    bcRangeTest = [bookCode, indexCh];
			    getSlice = getChapterSlice;
			}
			else {
			    var indexVs = bcOrBcvRange[2];
				bcRangeTest = [bookCode, indexCh, indexVs];
				getSlice = getVerseSlice;
			}
				
			var slice = getSlice(outlinesKeyedByBCVRange, bcRangeTest);
			for (var i=0; i < slice.outlines.length; i++) {
				if (slice.outlines[i] == selectedOutlineId)
				{
				  	headFound = true;
				  	elementsInBcvRange.push(this);
				  	break;  	 
				}			  
			};
			if (headFound)
			{
				// we're finished.
				return elementsInBcvRange;
			}			    
			//CreateChiasmViewItem(outline.body.concepts, index, "indent-bv", container);
		});
		return elementsInBcvRange;
	}
	
	function highlightElements(elements)
	{
		for (var i=0; i < elements.length; i++) {
		  var selector = elements[i];
		  $(selector).addClass("ch-selected");
		};
	}
	
	function extractBookCode(bookId) {
	    return bookId.substr(bookId.length - 3, 3);
	}

	function removeChapters(bookDiv) {
	    removeBookDivs(bookDiv, "div");
	    $(".ch-selected").removeClass("ch-selected");
	}

	function removeBookDivs(bookDiv, childContainer) {
	    $(jq(bookDiv.bookHeadDivId + " " + childContainer)).remove();
	    $(jq(bookDiv.bookTailDivId + " " + childContainer)).remove();
	}

	function removeVerses(bookDiv) {
	    removeBookDivs(bookDiv, "table");
	    $(".vs-selected").removeClass("vs-selected");
	}

	function doChapterOrVerseOptions() {
	}

	function getBCorBCV() {
	    var bcOrBcvRange;
	    var mode = $(this).hasClass("bv-ch") ? "chapters" : "verses";
	    var indexFuzzy = parseInt($(this).text());
	    var bookId = $(this).closest(".bv-book").attr("id");
	    var bookCode = extractBookCode(bookId);
	    if (mode == "chapters") {
	        var indexCh = indexFuzzy;
	        bcOrBcvRange = [bookCode, indexCh];
	    }
	    if (mode == "verses") {
	        var indexVs = indexFuzzy;
	        indexCh = parseInt($(this).parent().prev().children().first().text());
	        bcOrBcvRange = [bookCode, indexCh, indexVs];
	    }
	    return bcOrBcvRange;
	}

	function doChapterOptions() {
	    var bcOrBcvRange = getBCorBCV.call(this);
	    doChapterOrVerseOptionsInternal(bcOrBcvRange);
	    return false;
	}

	function clearRowWidths()
	{
	    // clear the widths before re-establishing it
	    $(".row").each(function(index) {
	        $(this).css('width', "");
	        $(this).children(".cell").first().css('width', "");
	    });
	}

	function doChapterOrVerseOptionsInternal(bcOrBcvRange)
	{
	    var indexCh = bcOrBcvRange[1];
	    var fResetChapters = !indexCh;
		var bookCode = bcOrBcvRange[0];
		var outlinesKeyedByBCVRange = indexOutlinesByBCVRange(getDbRows());
		
		var results = GenerateBookAndChaptersHtml(outlinesKeyedByBCVRange, bookCode, "verses");
		removeChapters(results[bookCode]);
		removeVerses(results[bookCode]);
		clearRowWidths();

		
		var chapterDivs = results[bookCode].chapters;
		var bookStats = getBookStats([bcOrBcvRange[0]]);

		var outlineContainerId = "bv-outline-selected";
		var nextOptionId;
		if (fResetChapters)
		    nextOptionId = null;
        else
		    nextOptionId = getNextOptionId(outlinesKeyedByBCVRange, bcOrBcvRange, outlineContainerId);
		var indexHeadEnd = indexCh;
		if (nextOptionId == null || fResetChapters)
		{
		    indexHeadEnd = bookStats.chapters;
		    // don't show any (clear/reset)
		    $(jq(outlineContainerId)).data("outline-selected", null);
		}
		
		var bcOrBcvRangeForDiv = bcOrBcvRange.slice(0);
	    // $(jq(results[bookCode].bookHeadDivId)).append("<table class='bv-chvss'><tr><td style='vertical-align:top;'><div class='bv-ch'><b>" + (i + 1) + "</b></div></td><td>" + chaptersAndVerses[i] + "</td></tr></table>");
		for (var i = 0; i < indexHeadEnd; i++) {
		    var verseEnd = -1;
		    if (nextOptionId != null && (bcOrBcvRange[1] == (i + 1)) && bcOrBcvRange[2]) {
		        verseEnd = bcOrBcvRange[2];
		    }
		    var appendHtml = buildAppendHtml(i + 1, bcOrBcvRangeForDiv, outlinesKeyedByBCVRange, 1, verseEnd);
		    $(jq(results[bookCode].bookHeadDivId)).append(appendHtml);
		};
		
	    // ** TODO ** for verses view, we need to append table/row/td structures, not just the verse numbers.
		// $(jq(results[bookCode].bookHeadDivId)).append("<table class='bv-chvss'><tr><td style='vertical-align:top;'><div class='bv-ch'><b>" + (i + 1) + "</b></div></td><td>" + chaptersAndVerses[i] + "</td></tr></table>"); // <div style='clear:both;'/>
		if (indexHeadEnd < bookStats.chapters) {
			if($(jq(results[bookCode].bookTailDivId)).length == 0)
				$(jq(results[bookCode].bookHeadDivId)).after(results[bookCode].bookTailDiv);
			for (var i = indexHeadEnd; i < bookStats.chapters; i++) {
			    var appendHtml = "";
			    if (nextOptionId != null && bcOrBcvRange[1] == i && bcOrBcvRange[2]) {
			        appendHtml += buildAppendHtml(i, bcOrBcvRangeForDiv, outlinesKeyedByBCVRange, bcOrBcvRange[2] + 1, -1);
			    }
			    appendHtml += buildAppendHtml(i + 1, bcOrBcvRangeForDiv, outlinesKeyedByBCVRange, 1, -1);
			    $(jq(results[bookCode].bookTailDivId)).append(appendHtml);
			};
		} 
		else
		{
			$(jq(results[bookCode].bookTailDivId)).remove();
		}
	
		$(jq(results[bookCode].bookHeadDivId)).find("div.ch-options").click(doChapterOptions);
		$(jq(results[bookCode].bookTailDivId)).find("div.ch-options").click(doChapterOptions);
		$(jq(results[bookCode].bookHeadDivId)).find("div.vs-options").click(doChapterOptions);
		$(jq(results[bookCode].bookTailDivId)).find("div.vs-options").click(doChapterOptions);
		
        if (nextOptionId != null) {
		    $(jq(results[bookCode].bookHeadDivId)).after("<div id='" + outlineContainerId + "'></div>");
		    var outline = findOutline(nextOptionId, outlinesKeyedByBCVRange);
		    $(jq(outlineContainerId)).data("outline-selected", { "outlineId": nextOptionId, "bcRange": bcOrBcvRange, "outline": outline });
		    // highlight selected
		    var selectedBcvRange = getSelectedBCVRange(outlinesKeyedByBCVRange, nextOptionId);
		    var collectedChaptersInRangeHead = collectElementsInBCVRange($(jq(results[bookCode].bookHeadDivId)), outlinesKeyedByBCVRange, nextOptionId, bcOrBcvRange);
		    highlightElements(collectedChaptersInRangeHead);
		    var collectedChaptersInRangeTail = collectElementsInBCVRange($(jq(results[bookCode].bookTailDivId)), outlinesKeyedByBCVRange, nextOptionId, bcOrBcvRange);
		    highlightElements(collectedChaptersInRangeTail);

		    DisplayOutlineExpansion(outline, jq(outlineContainerId));
		}

		adjustHeightOfRunnerContainers();
		// find widest range of context
		// split book into two: 1) up through chapter clicked upon
		// 2) next chapter through end of book
		// If outline is entire book, add expansion under all the chapters.
		// (alternatively, split after first chapter in range?)
		
		// TODO: pick outline by fewest number of verses in range
		// TODO:		
		return false;
	}

	function findOutline(idTarget, outlinesKeyedByBCVRange) {
	    for (var i = 0; i < outlinesKeyedByBCVRange.length; i++) {
	        var outlineRow = outlinesKeyedByBCVRange[i];
	        if (outlineRow.id == idTarget)
	            return outlineRow.value;
	    }
	}

	function createVerseTableRowFrag(ichapter) {
	    return "<table class='bv-chvss'><tr><td style='vertical-align:top;'><div class='bv-ch'><b>" + (ichapter) + "</b></div></td><td>";
	}

	function closeVerseTableRowFrag()
	{
	    return "</td></tr></table>";
	}

	function buildAppendHtml(ch, bcOrBcvRangeForDiv, outlinesKeyedByBCVRange, verseBegin, verseEnd) {
	    bcOrBcvRangeForDiv[1] = ch;
	    var appendHtml = "";
	    if (bcOrBcvRangeForDiv.length == 2) {
	        appendHtml = createChapterOrVerseDiv(bcOrBcvRangeForDiv, outlinesKeyedByBCVRange);
	    } else {	        	        
	        var bcstats = getBookStats([bcOrBcvRangeForDiv[0], bcOrBcvRangeForDiv[1]]);	        
	        if (verseEnd == -1)
	            verseEnd = bcstats.verses;
	        if (verseBegin > verseEnd)
	            return "";
	        if (verseBegin != 1)
	            appendHtml = createVerseTableRowFrag("<span style='display:none;'>" + ch + "</span>"); // continuing head div into tail div
	        else
	            appendHtml = createVerseTableRowFrag(ch);
	        for (var ivs = verseBegin; ivs <= verseEnd; ivs++) {
	            bcOrBcvRangeForDiv[2] = ivs;
	            appendHtml += createChapterOrVerseDiv(bcOrBcvRangeForDiv, outlinesKeyedByBCVRange);
	        }
	        appendHtml += closeVerseTableRowFrag();
	    }
	    return appendHtml;
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
		results["outlines"] = orderByRangeStart(matchingOutlines, targetBC, outlinesKeyedByBCVRange);
		return results;
	}

	function orderByRangeStart(outlineIds, targetBCorBCV, outlinesKeyedByBCVRange) {
	    var sorted = [];
	    var unsorted = [];
	    // for now do two passes. 
	    // Pass One: push any that match on start of range;
	    // Pass Two: push remaining
	    for (var i = 0; i < outlineIds.length; i++)
	    {
	        var outlineId = outlineIds[i];
	        var bcvRange = getSelectedBCVRange(outlinesKeyedByBCVRange, outlineId);
	        if (targetBCorBCV.length == 2) {
	            if (bcvRange[0] == targetBCorBCV[0] && bcvRange[1] == targetBCorBCV[1])
	                sorted.push(outlineId);
	            else
	                unsorted.push(outlineId);
	        }
	        else {
	            if (bcvRange[0] == targetBCorBCV[0] && bcvRange[1] == targetBCorBCV[1] && bcvRange[2] == targetBCorBCV[2])
	                sorted.push(outlineId);
	            else
	                unsorted.push(outlineId);
	        }
	    }
	    return sorted.concat(unsorted);
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
		  	if (bcvRange.length == 6 && targetBCV[1] == bcvRange[1] && (targetBCV[2] < bcvRange[2]))
		  	    continue;
		  	if (bcvRange.length == 6 && targetBCV[1] == bcvRange[4] && (targetBCV[2] > bcvRange[5]))
		  	    continue;

		  	 matchingOutlines.push(outlineRow.id);
		  }
		};		
		results["outlines"] = orderByRangeStart(matchingOutlines, targetBCV, outlinesKeyedByBCVRange);
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
		var pattCVerseRef = /(?:[1-9][0-9]?[0-9]?){1}(?:[.:][1-9][0-9]?[-–—]?)?/g;
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
			else {
			    bcvRange.push(-1); // no verses specified, just start at verse 1
			}
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

	function getBookStats(bcRange) {
	    if (bcRange.length == 1 || EmptyIfNull(bcRange[1]).length == 0)
	        return BookStats[bcRange[0]];
	    var bookChapterCode = formatBookAndChapterCode(bcRange[0], bcRange[1], BookStats[bcRange[0]].chapters);
	    return BookStats[bookChapterCode];
	}

	function completeBCVRange(bcvRange) {
	    var completedBcvRange = bcvRange.slice(0);
	    if (bcvRange.length == 6) {
	        // fill in chapter and verses
	        if (bcvRange[2] == -1) {
	            completedBcvRange[2] = 1;
	        }
	        if (bcvRange[5] == -1) {
	            var bookStats = getBookStats(bcvRange);
	            completedBcvRange[5] = bookStats.verses;
	        }            
	    } else if (bcvRange.length == 3) {
	        if (bcvRange[2] == -1) {
	            completedBcvRange[2] = 1;
	            completedBcvRange.push(bcvRange[0]);
	            completedBcvRange.push(bcvRange[1]);
	            var bookStats = getBookStats(bcvRange);
	            completedBcvRange.push(bookStats.verses);
	        }	        
	    }
	    else if (bcvRange.length == 1){
	        completedBcvRange = [];
	        completedBcvRange.push(bcvRange[0]);
	        completedBcvRange.push(1);
	        completedBcvRange.push(1);
	        completedBcvRange.push(bcvRange[0]);
	        var lastChapter = BookStats[bcvRange[0]].chapters;
	        completedBcvRange.push(lastChapter);
	        var bookStats = getBookStats([bcvRange[0], lastChapter]);
	        completedBcvRange.push(bookStats.verses);
	    }

	    return completedBcvRange;
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
		  	var completedBcvRange = completeBCVRange(bcvRange);
		  	var newKey = [completedBcvRange, outline.head.contentType];
		  	var newRow = { id : outline._id, key: newKey, value : outline };		  	
		  	newRows.push(newRow);
		};
		
		return newRows.sort(sortByBCVRange);
	}

	function sortByBCVRange(oa, ob) {
		var a = oa.key[0];
		var b = ob.key[0];
		if (a[0] < b[0])
			return -1;
		if (a[0] > b[0])
			return 1;
		if (a[1] < b[1])
			return -1;
		if (a[1] > b[1])
			return 1;
		if (a[2] < b[2])
			return -1;
		if (a[2] > b[2])
			return 1;
		if (a[4] < b[4])
			return -1;
		if (a[4] > b[4])
			return 1;
		if (a[5] < b[5])
			return -1;
		if (a[5] > b[5])
			return 1;
		return 0;
	}
