/**
 * @author Pyle
 */

//var currentChiasmEdit = jQuery.parseJSON( clearedStateJSONText );
    
	function sortByTextAreaIds(a,b){
		var idA = $(a).find("textarea").first().attr("id");
		var idB = $(b).find("textarea").first().attr("id");
	    return idA > idB ? 1 : -1;  
	};


	function IndexToAsciiMarkerABA(index, numChiasmItems)
	{
	    return String.fromCharCode(AsciiA + offsetFromClosestEnd(index, numChiasmItems));		
	}
	
	function offsetFromClosestEnd(index, numChiasmItems)
	{
		var halfway = numChiasmItems/2;
	    var asciiMarker;
		if (index < halfway)
	    {
	       return index;	     
	    }
	    else
	    {
	    	//0 1 2           3            4
	       // 0 1 2 1(5 - 3 - 1) 0(5 - 4 - 1)
	       return numChiasmItems - index - 1;
	    }
	}
	
	function indexAABEditBoxesToIndexConcept(indexEditBox, conceptsCount)
	{
		var isEven = (indexEditBox%2 == 0);
		return isEven ? Math.round(indexEditBox/2) : conceptsCount - Math.round(indexEditBox/2);
	}
	
	function IndexToAsciiMarkerAAB(index)
	{
		var alphabetIndex = Math.floor(index/2);
	    asciiMarker = String.fromCharCode(AsciiA + alphabetIndex);
		return asciiMarker;		
	}

	function GetEndMarkerAAB(index)
	{
		var endchar;
		if (index % 2 == 0)
			endchar = ". ";
		else
			endchar = "' ";
		return endchar;
	}
	
	function GetEndMarkerABA(index, count)
	{
		var halfway = Math.round(count/2);
		var endchar;
		if (index < halfway)
			endchar = ". ";
		else
			endchar = "' ";
		return endchar;
	}
	
	var CompatibilityMode = true;
	var Spacing = 20; // px
	var AsciiA = 65;

	function ConceptToChiasmViewItem(concepts, iconcept, fIndent) {
	    var item = CreateChiasmViewItem(concepts, iconcept, fIndent ? "indent" : "flat");
	    return item;
	}
	
	/*
	 * preceded with "-level-A-[1/2]"
	 */
	function getBasicViewConceptId(indexABA, count)
	{
		var conceptMarker = IndexToAsciiMarkerABA(indexABA, count);
		var halfway = Math.round(count/2);
		var basicViewConceptId = "-level-" + conceptMarker + "-" + (indexABA < halfway ? 1 : 2);
		return basicViewConceptId;
	}
	
	function getViewConceptId(view, indexABA, count)
	{
		return view + getBasicViewConceptId(indexABA, count);
	}
	
	function getBasicViewCssId(indexABA, count)
	{
		var conceptMarker = IndexToAsciiMarkerABA(indexABA, count);
		//var isHalfway = Math.round(indexABA/2);
		var basicViewConceptId = "-level-" + conceptMarker;
		return basicViewConceptId;
	}
	
	function RemoveAllHighlighting()
	{
	    $(".chiasmItemHighlightedMainFocus").removeClass("chiasmItemHighlightedMainFocus");
      	$(".chiasmItemHighlightedSecondaryFocus").removeClass("chiasmItemHighlightedSecondaryFocus");
	}
	
	function highlightItem() {
		RemoveAllHighlighting();
		if ($("#itemHighlighting").attr("checked") == false)
			return false;
        $(this).addClass("chiasmItemHighlightedMainFocus");

        var previewId = $(this).attr("id");
        var view = previewId.split("-")[0];
        var matchingPairSelector = createMatchingPairSelectorFromViewElementId(previewId);
        $('#' + view + "-" + matchingPairSelector).addClass("chiasmItemHighlightedSecondaryFocus");
	}
	
	function removeHighlight()
	{
		RemoveAllHighlighting();
	}
	
	function CalculateMarginInPx(index, count)
	{
		var offset = offsetFromClosestEnd(index, count);
		return offset * Spacing;
	}
	
	function convertIndentToSpaces(marginValue)
	{
		var spaces = "";
		for (var i=20; i <= marginValue; i += 20) {
		  spaces += "&nbsp;&nbsp;&nbsp;&nbsp;"
		};
		return spaces;
	}
	
	function FindInsertionIndexForNewChiasmConcept()
	{
		return Math.round(mainOutline.body.concepts.length/2);
	}

	function CreateChiasmViewItem(concepts, newIndex, view)
	{		
		// 0 -> 0
		// 1 -> 1
		// 2 -> 1
		// 3 -> 2
		// 4 -> 2
		// 5 -> 3
		// 6 -> 3
		var conceptsCount = concepts.length;
	    //alert(newIndex + "/" + concepts.length);
		var newConcept = concepts[newIndex];
		$("#chiasm-" + view).insertAt(newIndex, "<div>" + newConcept.content + "</div>");
		var newItem = $("#chiasm-" + view).children("div:eq(" + newIndex + ")");								

		var chr = IndexToAsciiMarkerABA(newIndex, conceptsCount);
		var endchar = GetEndMarkerABA(newIndex, conceptsCount);
		var marginLeft = CalculateMarginInPx(newIndex, conceptsCount);
		var halfway = Math.round(conceptsCount/2);		
	    if (newIndex < halfway)
	    {
	       var marginleft = "";
	       if (!CompatibilityMode && view == "indent")
	       {
	       		marginleft = "{ margin-left:" + marginLeft + "px;}";
	       }
	       		
	       $("<style type='text/css'> ." + view + getBasicViewCssId(newIndex, conceptsCount) + " " + marginleft + " </style>").appendTo("head");
		}
	  	$(newItem).wrapInner("<span class='chiasmText'/>");
        $(newItem).addClass(view + getBasicViewCssId(newIndex, conceptsCount));
        $(newItem).attr("id", getViewConceptId(view, newIndex, conceptsCount));
	    $(newItem).prepend("<span class='itemMarker'>"+ chr + endchar +"</span>");
	    if (CompatibilityMode && view == "indent")
	    {
	    	var spaces = convertIndentToSpaces(marginLeft);	    
	    	$(newItem).prepend(spaces); 	
	    }
	    //$(newItem).hover(highlightItem, removeHighlight);
	    $(newItem).click(highlightItem);	

		return newItem;
	}
	
	function UpdateTableFromConcept(concepts, newIndex, tableBodyId, count)
	{		
		/*
		 * 
		 <table id="tableViewAAB" cols="4" class="tableViewAAB">
			<tr><td>A.</td><td>This is a test</td><td>A'</td><td>a parallel</td></tr>
			<tr><td>B.</td><td>last element</td></tr>				
		</table>
		 * 
		 */
 		var newConcept = concepts[newIndex];
 		//alert(newIndex + "->" + indexAAB + " " + newConcept.content);
		var asciiMarker = IndexToAsciiMarkerABA(newIndex, count);
		var endMarker = GetEndMarkerABA(newIndex, count);
		var halfway = Math.round(count/2);
		var fFirstConceptInPair = (newIndex < halfway);
		var rowIndex = offsetFromClosestEnd(newIndex, count);
		//alert (newIndex + asciiMarker + endMarker + newConcept.content);
		//alert(view + "/" + newIndex + "/" + newConcept.content + "/" + count );
		/*
		    $(item).wrapInner("<span class='chiasmText'/>");
            $(item).addClass("level-" + chr + "-" + view);
            $(item).attr("id", "level-" + chr + "-" + (index < halfway ? 1 : 2) + "-" + view);
		    $(item).prepend("<span class='itemMarker'>"+ chr + endchar +"</span>");
		    */
		var view = "tableAAB";
		var wrappedContent = "<span class='chiasmText'>" + newConcept.content + "</span>";
		var wrappedMarker = "<span class='itemMarker'>" + asciiMarker + endMarker + "</span>";
		var css = view + getBasicViewCssId(newIndex, count);
		var id = getViewConceptId(view, newIndex, count);
		var newTableData = "<td>" + wrappedMarker + "</td>" + 
			"<td id='" + id + "' class='" + css + "'>" + wrappedContent + "</td>";
		if (fFirstConceptInPair)
		{
			$(tableBodyId).insertAt(rowIndex, "<tr>" + newTableData + "</tr>");
		}
		else
		{
			$(tableBodyId).children().eq(rowIndex).append(newTableData);
		}
		
		//$("#" + id).hover(highlightItem, removeHighlight);
	    $("#" + id).click(highlightItem);	
		//var newItem = $(view).find("tr:eq(" + newIndex + ")");
		//return newItem;
	}
	
	function createBasicSelectorFromViewElementId(viewElementId)
	{
		var components = viewElementId.split('-');
		var newComponents = [components[1], components[2]];
		var basicSelector = newComponents.join("-");
		return basicSelector;
	}
	
	function createMatchingPairSelectorFromViewElementId(viewElementId)
	{
		var basicSelector = createBasicSelectorFromViewElementId(viewElementId);
		var components = viewElementId.split('-');
		var number = components[components.length - 1];
		var matchingPairNumber = (number == 1 ? 2 : 1);
		return basicSelector + "-" + matchingPairNumber;
	}
	
	function updateViewsChiasmContent(basicChiasmElementSelector, newValue)
	{
		$("#indent" + basicChiasmElementSelector).first().html(newValue);
		$("#flat" + basicChiasmElementSelector).first().html(newValue);
		$("#tableAAB" + basicChiasmElementSelector).first().html(newValue);
	}
	
	function updateScriptureCitation(element, editItemSelector)
	{
		var bookName = getBookName(mainOutline.head.ScriptureRange);
		var indexExited = getIndexOfOwningEditItem(element, editItemSelector);
		//alert(indexExited + contentExited)
		applyCitationMarkupForItemToViews(mainOutline.body.concepts, bookName, indexExited);
		refreshScriptureTagging();		
	}
	
	function getIndexOfOwningEditItem(element, editItemSelector)
	{
		return $(element).closest(editItemSelector).index(editItemSelector);
	}
	
	function updateViewsForEditedItem(textarea)
	{
		var newValue = $(textarea).val();
		var indexEditItem = getIndexOfOwningEditItem(textarea, ".chiasmEditItem");
		var count = mainOutline.body.concepts.length;
		var iconcept = indexAABEditBoxesToIndexConcept(indexEditItem, count);
		if (mainOutline.body.concepts[iconcept].content != newValue)
		{
			//alert(textarea.id + ":" + newValue + ": " + indexEditItem + "->" + iconcept + ": " + mainOutline.body.concepts[iconcept].content)
			mainOutline.body.concepts[iconcept].content = newValue;
			var chiasmElementId = getBasicViewConceptId(iconcept, count);
			updateViewsChiasmContent(chiasmElementId + " .chiasmText", newValue);
		}
		FitToContent(textarea.id,'','100');
	}
	
	function createdEditBoxesForConcepts(concepts)
	{
		// it's important to order the concepts in terms of the edit boxes
		for (iEditBox = 0; iEditBox < concepts.length; iEditBox++)
		{
			var iconcept = indexAABEditBoxesToIndexConcept(iEditBox, concepts.length);
		    //alert(newListIndex + halfway + endmarker);
		    createEditBoxForChiasmBody(concepts, iconcept);	    
		}
	}

/*
 * <label for="edit-level-A-1" class="markerEditLabel">A. </label>
   <textarea id="edit-level-A-1" cols="40" rows="1"></textarea>
 */
	function createEditBoxForChiasmBody(concepts, index) {
		// Level A <textarea id="text-level-A" cols="80" rows="1" onkeyup="FitToContent('text-level-A','','100');" style="overflow:hidden;">			
			var conceptsCount = concepts.length;
			var iLastEditBox = $(".chiasmEditItem").length;
			var concept = concepts[index];
			var content = concept.content;
			var asciiMarker = IndexToAsciiMarkerAAB(iLastEditBox);
			var endmarker = GetEndMarkerAAB(iLastEditBox);
			var editItemId = getViewConceptId("edit", index, conceptsCount);
			$("<div></div>")
				.addClass("chiasmEditItem")
				.prepend('<label class="markerEditLabel" for="' + editItemId + '">'+ asciiMarker + endmarker + '</label>')
				.appendTo("#editChiasmBody");
			var newInputBox = $("<textarea></textarea>")												
				.attr("id", editItemId)
				.attr("cols", "40")
				.attr("rows", "1")
				.text(content)				
				.appendTo("#editChiasmBody .chiasmEditItem:last")								
				.keydown (function(event)
					{
						if (event.which == "13") // ENTER
						{
							//$(this).selectRange(0, 0);
							updateViewsForEditedItem(event.target);
							updateScriptureCitation(this, ".chiasmEditItem");
							var nextTextArea = $(this).closest(".chiasmEditItem").next().find("textarea");
							if ($(nextTextArea).length > 0)
							{
							  $(nextTextArea).first().putCursorAtEnd();	
							}
							else
							{
								//alert("insert");
								var insertionIndex = FindInsertionIndexForNewChiasmConcept();
							  	// create a new level
							  	// update content of chiasm
							  	// create new JSON node
							  	var newConcept = insertConcept(mainOutline.body.concepts, insertionIndex, "");
							  	var count = mainOutline.body.concepts.length;
							  	
							  	var newItem = ConceptToChiasmViewItem(mainOutline.body.concepts, insertionIndex, true);
							  	var newItem2 = ConceptToChiasmViewItem(mainOutline.body.concepts, insertionIndex, false);
							  	UpdateTableFromConcept(mainOutline.body.concepts, insertionIndex, "#tableViewAAB", count);					  	
								var indexItem = $(newItem).index();	
								//alert(newItem + "" + count + " " + indexItem);
								var newInputBox = createEditBoxForChiasmBody(mainOutline.body.concepts, insertionIndex);
								/*
								 * IE9 seems to leave the old boxes highlighted, so force them to go away now.
								 */
								RemoveAllHighlighting();
								var bookName = getBookName(mainOutline.head.ScriptureRange);
            					/*
            					 * End workaround
            					 */
							  	newInputBox.putCursorAtEnd();
							}
							return false; // cancel event							
						}
						if (event.which == "8") // BACKSPACE
						{
							var currentTextareaValue = $(this).val();
							if (currentTextareaValue == "")
							{
								var numEditBoxes = $("#editChiasmBody").children(".chiasmEditItem").length;
								var currentIndex = $(this).closest(".chiasmEditItem").index(".chiasmEditItem");
								if (currentIndex > 0 && numEditBoxes == currentIndex + 1)
								{
									// since this is the last box, we can easily delete it.
									// but first find the previous sibling, so we can put our cursor there.
									var previousSibling = $(this).closest(".chiasmEditItem").prev();
									// now delete list item.
									var textAreaId = event.target.id;
									var chiasmElementId = textAreaId.substr("edit".length);
									// we need to delete the "indention" spacing if we're on an "even" index.
									var iconcept = indexAABEditBoxesToIndexConcept(currentIndex, mainOutline.body.concepts.length);
									//alert(currentIndex + " -> "+ iconcept);
									mainOutline.body.concepts.splice(iconcept, 1);
									$("#indent" + chiasmElementId).remove();
									$("#flat" + chiasmElementId).remove();
									var fFirstConceptInPair = (currentIndex % 2 == 0);
									if (fFirstConceptInPair)
									{
										// remove the whole row.
										$("#tableAAB" + chiasmElementId).parent().remove();
									}
									else
									{
										// otherwise, remove the td and the preceding td (marker)
										// remove the whole row.
										$("#tableAAB" + chiasmElementId).prev().remove();
										$("#tableAAB" + chiasmElementId).remove();
									}
									
									$(this).closest(".chiasmEditItem").remove();
									$(previousSibling).find("textarea").first().putCursorAtEnd();
									return false;
								}
							}
							
						}
					})
				.keyup(function(event) 
					{						
						// update content of chiasm
						updateViewsForEditedItem(event.target);
						return false;
					})
				.focusin(function(event) {
					if ($("#itemHighlighting").attr("checked") == false)
						return false;
					var textAreaId = event.target.id;
					FitToContent(textAreaId,'','100');
		  			var chiasmElementId = textAreaId.substr("edit-".length);
		  			$("#indent-" + chiasmElementId + "," + 
		  			  "#flat-" + chiasmElementId + "," + 
		  			  "#tableAAB-" + chiasmElementId).addClass("chiasmItemHighlightedMainFocus");
		  		    var matchingPairId = createMatchingPairSelectorFromViewElementId(textAreaId);
		  		    //alert("#indent" + matchingPairId)
		  			$("#indent-" + matchingPairId + "," + 
		  			  "#flat-" + matchingPairId + "," + 
		  			  "#tableAAB-" + matchingPairId + "").addClass("chiasmItemHighlightedSecondaryFocus");
		  			//apply highlight style
		  			return false;
				})
				.focusout(function(event) {
		  			RemoveAllHighlighting();
		  			updateScriptureCitation($("#" + event.target.id), ".chiasmEditItem");
		  			//apply highlight style
		  			return false;
				});
	    var tbId = getViewConceptId("edit", index, conceptsCount);
		FitToContent(tbId,'','100');
		//$("#editChiasmBody .chiasmEditItem").sort(sortByTextAreaIds).appendTo('#editChiasmBody');
		return newInputBox;

	}

	
	
	function loadCurrentChiasmIntoABAList()
	{
		var abaList = new Array();
		var count = mainOutline.body.concepts.length;
		/*
		 * Note: efficient to use abaList, but simple algorithm.
		 */
		for (iconcept = 0; iconcept < count; iconcept++)
		{
		    var marker = IndexToAsciiMarkerABA(iconcept, count);		    
		    var endmarker = GetEndMarkerABA(iconcept, count);
		    //alert(newListIndex + halfway + endmarker);
		    abaList.splice(iconcept, 0, marker + endmarker + mainOutline.body.concepts[iconcept].content);
		}
		//alert(abaList.length+abaList);
		return abaList;
	}
	
	function loadCurrentChiasmIntoTextBox(textBoxId)
	{
		var abaList = loadCurrentChiasmIntoABAList();
		var textbox  = document.getElementById(textBoxId);
		// alert();
		textbox.value = abaList.join('\n');		
	}
	
	function loadABAListToCurrentChiasm(abaArray)
	{
		if (abaArray.length == 0)
		{
			mainOutline.body.concepts = new Array();
			insertConcept(mainOutline.body.concepts, 0, "");
			return;
		}
		mainOutline.body.concepts = new Array();
		for (i = 0; i < abaArray.length; i++)
		{
			insertConcept(mainOutline.body.concepts, i, abaArray[i]);
		}
	}
	
	function CreateNewConcept(content)
	{
		var newConceptText = '{"content" : "" }';
	    var newConcept = jQuery.parseJSON( newConceptText );
	    newConcept.content = content;
	    return newConcept;
	}
	
	function replaceConcept(concepts, index, content)
	{
		var newConcept = CreateNewConcept(content);
		if (index < concepts.length)
	    	concepts[index] = newConcept;
	    return newConcept;		
	}
	
	function insertConcept(concepts, index, content)
	{
		var newConcept = CreateNewConcept(content);
		if (index < concepts.length)
	    	concepts.splice(index, 0, newConcept);
	    else
	    	concepts.push(newConcept)
	    return newConcept;
	}
	
	function importFromTextBoxToCurrentChiasm(textBoxId)
	{
		var fStripCounting = $("#stripCounting").attr("checked");
		var abaArray = trimChiasm(textBoxId, fStripCounting);
		loadABAListToCurrentChiasm(abaArray);
		//alert("import" + mainOutline.body.concepts.length);
		LoadAllViewsFromCurrentObj(createdEditBoxesForConcepts);
	}
	
	/*
	 * Returns the new content with citation markup
	 */
	function getCitationMarkup(content, bookName1)
	{
		if (content == null)
			return null;
		//alert("applyCitation")
		var pattCVerseRef=/(?:(?:[1-9]+[.:])?[1-9][0-9]*[-–—]?)+/g;		
		var matches2 = content.match(pattCVerseRef);
		//alert(matches2)
		if (matches2 == null)
			return null;
		var remainingContent = content;
		var finalContent = "";
		for (j = 0; j < matches2.length; j++)
		{
			var chVerseRange = matches2[j];
			var matchLocation = remainingContent.indexOf(chVerseRange);
			var segment = remainingContent.substring(0, matchLocation + chVerseRange.length);
			remainingContent = remainingContent.substring(matchLocation + chVerseRange.length);
			//alert(chVerseRange);
			var markup = '<cite class="bibleref" title="' + bookName1 + " " + chVerseRange + '">' + chVerseRange + "</cite>";
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
	
	
	/*
	 * returns false if no update happened, true if so.
	 */
	function applyCitationMarkupForItemToViews(concepts, bookName, indexAAB)
	{
		var content = concepts[indexAAB].content;
		var newContent = getCitationMarkup(content, bookName);
		if (newContent == null)
			return false; // did nothing
		publishContentToChiasmView(concepts, indexAAB, newContent);
		return true; // did something
	}
	
	function publishContentToChiasmView(concepts, indexAAB, newContent)
	{
		var basicViewElementId = getBasicViewConceptId(indexAAB, concepts.length);
		updateViewsChiasmContent(basicViewElementId + " .chiasmText", newContent);
	}
	
	function applyCitationMarkup(chiasmJSON)
	{
		var bookName1 = getBookName(chiasmJSON.head.ScriptureRange);
		// first establish context of chiasm
		if (bookName1 == null)
		{
			return;
		}
		var context = chiasmJSON.head.ScriptureRange;
		// next go through each of the items, and identify the verses
		for (i = 0; i < chiasmJSON.body.concepts.length; i++)
		{
			applyCitationMarkupForItemToViews(chiasmJSON.body.concepts, bookName1, i);
		}
	}
	
	function refreshScriptureTagging()
	{
		Logos.ReferenceTagging.tag();
	}

	function InitializeHeaderInputBoxes() {
		$("#edit-title-chiasm").text(mainOutline.head.title);
		$("#edit-chiasm-scriptureRange").text(mainOutline.head.ScriptureRange);
		
		$("#edit-title-chiasm, #edit-chiasm-scriptureRange").focusin(function(event) {
					if ($("#itemHighlighting").attr("checked") == false)
						return false;
					var textAreaId = event.target.id;
		  			var chiasmElementId = textAreaId.substr("edit".length);
		  			$("#indent" + chiasmElementId + "," + 
		  			  "#flat" + chiasmElementId + "," + 
		  			  "#tableAAB" + chiasmElementId + "").addClass("chiasmItemHighlightedMainFocus");
		  			//apply highlight style
		  			return false;
				})
				.focusout(function(event) {
					RemoveAllHighlighting();
					applyCitationMarkup(mainOutline);
					refreshScriptureTagging();					
		  			//apply highlight style
		  			return false;
				});
		// initialize edit title box
		$("#edit-title-chiasm, #edit-chiasm-scriptureRange").keydown (function(event)
					{
						if (event.which == "13") // ENTER
						{
							var currentIndex = $(this).closest("tr").index();
							var rowCountHead = $(this).closest("tbody").children().length;
							if (currentIndex == (rowCountHead - 1))
							{
								//$(this).selectRange(0, 0);
								var nextTextArea = $("#" + getViewConceptId("edit", 0, 1));
								if ($(nextTextArea).length > 0)
								{
								  $(nextTextArea).first().putCursorAtEnd();	
								}
							}
							else
							{
								$(this).closest("tr").next().find("textarea").first().putCursorAtEnd();
							}
							applyCitationMarkup(mainOutline);
							refreshScriptureTagging();
							return false; // cancel event							
						}
					})
				.keyup(function(event) 
					{						
						// update content of chiasm
						var textAreaId = event.target.id;
						var chiasmElementId = textAreaId.substr("edit".length);
						var newValue = $(this).val();
						if (chiasmElementId.indexOf("-title-") != -1)
						{
							mainOutline.head.title = newValue;
							var combinedTitle = CombineTitleAuthorAndSource();
							updateViewsChiasmContent(chiasmElementId, combinedTitle);
						}
						else if (chiasmElementId.indexOf("-scriptureRange") != -1)
						{
							mainOutline.head.ScriptureRange = newValue;
							updateViewsChiasmContent(chiasmElementId, newValue);							
						}

						// adjust text box
  						FitToContent(textAreaId,'','100');
					})
				;		
	}
	
	function CombineTitleAuthorAndSource()
	{
		var author = fetchAuthorProfileByOutline(mainOutline);
		var title = EmptyIfNull(mainOutline.head.title);
		var authorName = formatName(author, "", title.length > 0);
		var combinedTitle1 = (title.length > 0 && authorName.length > 0) ? (title + " by " + authorName) : 
			((title.length > 0) ? title : authorName);
			
		var combinedSource = fetchSourceProfile(mainOutline._id + "_source");
		var sourceDetails = formatCombinedSource(combinedSource, "");
		return (combinedTitle1.length > 0 && sourceDetails.length > 0) ? (combinedTitle1 + " in " + sourceDetails) :
			((combinedTitle.length > 0) ? combinedTitle : sourceDetails);
	}
	
	function JSONToPreviewPanel() {
		$("#tableViewAAB tr").remove();
		$(".chiasm div").remove();
		$(".chiasm ol").remove();  // outline
		
		var combinedTitle = CombineTitleAuthorAndSource();
		updateViewsChiasmContent("-title-chiasm", combinedTitle);
		updateViewsChiasmContent("-chiasm-scriptureRange", mainOutline.head.ScriptureRange);
	
		var count = mainOutline.body.concepts.length;
		
		if (mainOutline.head.contentType == "chiasm")
		{
			$(mainOutline.body.concepts).each(function(index)
			{
				ConceptToChiasmViewItem(mainOutline.body.concepts, index, true);
		    	ConceptToChiasmViewItem(mainOutline.body.concepts, index, false);
				UpdateTableFromConcept(mainOutline.body.concepts, index, "#tableViewAAB", count);
			});			
		}
		else if (mainOutline.head.contentType == "outline")
		{
			PublishOutlineViewItems(mainOutline.body.concepts, "#chiasm-" + "indent");			
		}
		
		
	}
	
	function publishOutlineToReadOnlyViews()
	{
		JSONToPreviewPanel();
		applyCitationMarkup(mainOutline);
		refreshScriptureTagging();		
	}
	
	function LoadAllViewsFromCurrentObj(doCreateEditBoxes)
	{
	    /*
		 * edit views
		 */
		$("#editChiasmBody div").remove();
		$("#outline div").remove();
		/*
		 * header edit boxes
		 */		
	    InitializeHeaderInputBoxes();
		//mainOutline.body.concepts.splice(0, mainOutline.body.concepts.length);
	    // search for chiasm to determine how many text boxes we need to display
		// Display in pairs: AA' BB' C
		doCreateEditBoxes(mainOutline.body.concepts);
		refreshAllLabels();
		publishOutlineToReadOnlyViews();
	}
