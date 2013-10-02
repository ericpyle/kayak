/**
 * @author Pyle
 */
var c = cons; /* global import */

//var currentChiasmEdit = jQuery.parseJSON( clearedStateJSONText );
    
	function sortByTextAreaIds(a,b){
		var idA = $(a).find("textarea").first().attr("id");
		var idB = $(b).find("textarea").first().attr("id");
	    return idA > idB ? 1 : -1;  
	};

	function indexAABEditBoxesToIndexConcept(indexEditBox, conceptsCount)
	{
		var isEven = (indexEditBox%2 == 0);
		return isEven ? Math.round(indexEditBox/2) : conceptsCount - Math.round(indexEditBox/2);
	}
	
	function ConceptToChiasmViewItem(concepts, iconcept, fIndent) {
		var layoutMode = fIndent ? "indent" : "flat";
		var view = layoutMode;
		var item = CreateChiasmViewItem(concepts, iconcept, view, jq("chiasm-" + view), { "includeId": true, "layoutMode": layoutMode });
	    return item;
	}
	
	function RemoveAllHighlighting()
	{
	    $(".chiasmItemHighlightedMainFocus").removeClass("chiasmItemHighlightedMainFocus");
      	$(".chiasmItemHighlightedSecondaryFocus").removeClass("chiasmItemHighlightedSecondaryFocus");
	}
	
	function highlightItem(e) {
		e.stopPropagation();
	    var fWasMainFocus = $(this).hasClass("chiasmItemHighlightedMainFocus");
		RemoveAllHighlighting();
		if ($("#itemHighlighting").attr("checked") == false)
		    return false;
		if (fWasMainFocus)
		    return false;
        var viewMatchingClass = $(this).attr("class");
        var view = viewMatchingClass.split("-")[0];
        var matchingClass = viewMatchingClass.substr(view.length);
        $("#chiasm-indent").children(".indent" + matchingClass).addClass("chiasmItemHighlightedSecondaryFocus");
        $("#chiasm-flat").children(".flat" + matchingClass).addClass("chiasmItemHighlightedSecondaryFocus");
        $("#tableViewAAB").find(".tableAAB" + matchingClass).addClass("chiasmItemHighlightedSecondaryFocus");

        $(this).siblings("." + viewMatchingClass).addClass("chiasmItemHighlightedSecondaryFocus");
        $(this).removeClass("chiasmItemHighlightedSecondaryFocus");
        $(this).addClass("chiasmItemHighlightedMainFocus");
	}
	
	function removeHighlight()
	{
		RemoveAllHighlighting();
	}
	
	function FindInsertionIndexForNewChiasmConcept()
	{
		return Math.round(mainOutline.body.concepts.length/2);
	}
		
	function CreateChiasmViewItem(concepts, newIndex, view, containerSelector, options)
	{	
		var result = generateChiasmConceptHtml(concepts, newIndex, view, options);
		var conceptsCount = concepts.length;
	    //alert(newIndex + "/" + concepts.length);
		var newConcept = concepts[newIndex];
		$(containerSelector).insertAt(newIndex, result.conceptHtml);
		if (result.conceptStyleDefinition){
			// make sure the style has not already been added.
			if ($("head style[type='text/css']").is(":contains('"+ result.conceptStyle +"')") == false)
				$(result.conceptStyleDefinition).appendTo("head");
		}
		var newItem = $(containerSelector).children("div:eq(" + newIndex + ")");
	    //$(newItem).hover(highlightItem, removeHighlight);
		$(newItem).click(highlightItem);
		return newItem;
	}

	function embedOutlineHere() {
		// find the concept to get the outline
		var label = $(this).closest("label");
		var conceptDiv = $(label).closest("div");
		var anchor = $(label).find("a[href]");
		var existingEmbeddedOutline = $(conceptDiv).find('.embeddedOutline').get(0);
		if (existingEmbeddedOutline) {
			$(anchor).text('+');
			clearRowWidths();
			$(existingEmbeddedOutline).remove();
			adjustRunnerContainers.call(this);
			return false;
		}

		var link = anchor.attr("href");
		var dbId = getDbIdFromUrl($.url(link));
		var embeddedOutline = fetchOutline(dbId);
		var embeddedOutlineContainer = $("<div class='embeddedOutline'></div>").appendTo(conceptDiv);
		var embeddedOutlineConcepts = embeddedOutline.body.concepts;
		var leadingWhitespaceMatches = $(conceptDiv).text().match(/^\s+/);
		var leadSpaceCount = leadingWhitespaceMatches ? leadingWhitespaceMatches[0].length: 0;
		var leadSpaces = "";
		for (var n = 0; n < leadSpaceCount; n++)
			leadSpaces += "&nbsp;";
		leadSpaces += "&nbsp;&nbsp;";
		if (embeddedOutline.head.contentType == "chiasm") {
			for (var i = 0; i < embeddedOutlineConcepts.length; i++) {				
				CreateChiasmViewItem(embeddedOutlineConcepts, i, "embedded-chiasm", embeddedOutlineContainer, { includeId: false, layoutMode: "indent", leadSpaces: leadSpaces });
			}
		}
		else if (embeddedOutline.head.contentType == "panel") {
			var panelHtml = generatePanelIndent(embeddedOutline, { leadSpaces: leadSpaces, includeId : false });
			$(panelHtml.html).appendTo(embeddedOutlineContainer);
			$(embeddedOutlineContainer).children('div').click(highlightItem);
		}
		else if (embeddedOutline.head.contentType == "outline") {
			var hierarchicalHtml = generateHierarchicalFlat(embeddedOutline, { leadSpaces: leadSpaces });
			$(hierarchicalHtml.html).appendTo(embeddedOutlineContainer);
		}
		$(embeddedOutlineContainer).find(".lnkToEmbeddedOutline").click(embedOutlineHere);
		$(anchor).text('-');
		clearRowWidths();
		$(embeddedOutlineContainer).css({ overflow: "auto", width: "100%" });
		adjustRunnerContainers.call(this);
		return false;
	}

	function adjustRunnerContainers() {
		// style="overflow:auto; width:100%;"
		if ($(this).parents(jq("BrowseByBook")).get(0))
			adjustHeightOfRunnerContainers();
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
 		var dto = cons.createDtoFromConcepts("chiasm", concepts);
 		var label = cons.getLabel(dto, newIndex);
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
		var wrappedContent = "<span class='conceptContent'>" + newConcept.content + "</span>";
		var wrappedMarker = "<span class='itemMarker'>" + label + "</span>";
		var css = view + getChiasmLevelFrag(newIndex, concepts);
		var id = getChiasmViewLevelId(view, newIndex, concepts);
		var newTableData = "<td>" + wrappedMarker + "</td>" + 
			"<td id='" + id + "' class='" + css + "'>" + wrappedContent + "</td>";
		if (fFirstConceptInPair)
		{
			$(tableBodyId).insertAt(rowIndex, "<tr>" + newTableData + "</tr>");
		}
		else
		{
			// search for the row of the matching class, and insert there.
			var secondRowIndex = $(tableBodyId).find("td." + css).parent("tr").index();
			$(tableBodyId).children().eq(secondRowIndex).append(newTableData);
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
			var chiasmElementId = getChiasmIdLevelFrag(iconcept, mainOutline.body.concepts);
			updateViewsChiasmContent(chiasmElementId + " .conceptContent", newValue);
		}
		FitToContent(textarea.id,'','100');
	}
	
	function loadCurrentChiasmIntoABAList()
	{
		var abaList = new Array();
		var count = mainOutline.body.concepts.length;
		/*
		 * Note: efficient to use abaList, but simple algorithm.
		 */
		var dto = cons.createDtoFromConcepts("chiasm", mainOutline.body.concepts);
		var labels = cons.getLabels(dto);
		for (iconcept = 0; iconcept < count; iconcept++)
		{
			var label = labels[iconcept];
		    //alert(newListIndex + halfway + endmarker);
		    abaList.splice(iconcept, 0, label + mainOutline.body.concepts[iconcept].content);
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
		
	function publishContentToChiasmView(concepts, iconcept, newContent)
	{
		var basicViewElementId = getChiasmIdLevelFrag(iconcept, concepts);
		updateViewsChiasmContent(basicViewElementId + " .conceptContent", newContent);
	}

	function InitializeHeaderInputBoxes() {
		$("#edit-title-chiasm").val(mainOutline.head.title);
		$("#edit-chiasm-scriptureRange").val(mainOutline.head.ScriptureRange);
		
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
					applyCitationMarkup(mainOutline, publishContentToChiasmView);
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
								var nextTextArea = $("#" + getChiasmViewLevelId("edit", 0, [""]));
								if ($(nextTextArea).length > 0)
								{
								  $(nextTextArea).first().putCursorAtEnd();	
								}
							}
							else
							{
								$(this).closest("tr").next().find("textarea").first().putCursorAtEnd();
							}
							applyCitationMarkup(mainOutline, publishContentToChiasmView);
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
							var combinedTitle = CombineTitleAuthorAndSource(mainOutline);
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
