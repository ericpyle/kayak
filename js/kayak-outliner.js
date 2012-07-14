/**
 * @author Pyle
 */

	var numConceptCreated = 1; // number of concepts created (for unique ids)

	/*
	 * external variables
	 */
	var mainOutline;
	/*
	 * External methods
	 */
	var publishContentChangesElsewhere = publishContentChangesElsewhereDoNothing;
	var publishConceptInsertionElsewhere = publishConceptInsertionElsewhereDoNothing;
	var publishConceptDeletionElsewhere = publishConceptDeletionElsewhereDoNothing;
	var outlineMode = "";
	var formatPositionIntoLabel;
	
	function moveEditBox()
	{		
		var indexOldEditBox = $('.edit-state').index();
		if (indexOldEditBox != -1)
		{
	  		var orderNumOld = indexOldEditBox + 1;
	  		var fWasGhost = $('.edit-state').hasClass("ghost");
	  		var parent = $('.edit-state').parent();
	  		var textareaContent = $('.edit-state textarea').val();
	  		if (fWasGhost)
	  		{
	  			if (fWasGhost && textareaContent.length != 0)
	  			{
	  				// convert ghost to real
	  				convertGhostToReal($('.edit-state'));
	  			}
	  		}
	  		else
	  		{
	  			var positionList = new Array();
	  			getConceptPositions(positionList, indexOldEditBox);
	  			var positionObj = positionList[indexOldEditBox];
	  			var oldContent = positionObj.concept.content;
	  			if (oldContent != textareaContent)
	  			{
	  				// update mainOutline
	  				positionObj.concept.content = textareaContent;
	  				publishContentChangesElsewhere(positionObj.concepts, indexOldEditBox, mainOutline.head)
	  				//alert(textareaContent)
	  			}			 
	  		}
			convertTextarea();
		}
		moveEditBoxToNext(this);
		return false;
	}
	
	function initializeEditTextarea()
	{
		var idTextarea = $(".edit-state").find("textarea").attr("id");
		$('.edit-state textarea')
			.keyup(function(event) 
				{						
					// update content of chiasm
					var textAreaId = event.target.id;
					FitToContent(textAreaId,'','100');
					return false;
				})
			.keydown(function(event)
				{
					if (event.which == "13") // ENTER
					{
						updateContent();
						return false;
					}
				});		
		FitToContent(idTextarea,'','100');
		$('.edit-state textarea').first().putCursorAtEnd();
	}
	
	function applyLabelToConceptNode(element, label)
	{
		if ($(element).hasClass("ghost"))
			label = "("+ label +") ";
		else
			label = label + " ";
		$(element).find("label").text(label);
		adjustAutoLabeling();
	}
	
	function refreshAllLabels()
	{
		var positionList = new Array();
		getConceptPositions(positionList, -1);
		var irealConcept = -1;
		var positionObj;
		$("#outline .concept").each(function(iviewConcept, element){
			if ($(element).hasClass("ghost"))
			{				
				if (iviewConcept == 0)
				  	positionObj = createPositionObj(null, 0);
				else
					positionObj = createGhostPositionAfter(positionList[irealConcept]);
			}
			else
			{
				irealConcept++;
				positionObj = positionList[irealConcept];
				if (outlineMode == "Chiasm" && positionObj.position.length > 1)
				{
					// advance to level one position
					for (irealConcept++; irealConcept < positionList.length; irealConcept++) {
					  	if (positionList[irealConcept].position.length == 1)
					  	{
					  		positionObj = positionList[irealConcept];
					  		break;
					  	}
					};
				}
			}
			var label = formatPositionIntoLabel(positionObj, ghostExists(positionList));
			applyLabelToConceptNode(element, label);
		});
	}
	
	function adjustAutoLabeling()
	{
		if ($(".autoLabelingState").attr("id") == "chiasmAutoLabelingOn")
		{
			$(".markerEditLabel.autoLabelingOff").removeClass("autoLabelingOff");
		}
		if ($(".autoLabelingState").attr("id") == "chiasmAutoLabelingOff")
		{
			$(".concept .markerEditLabel").addClass("autoLabelingOff");
		}
	}
	
	function refreshPositionLabel(index, element)
	{
		var label = getPositionLabel(index, element);
		applyLabelToConceptNode(element, label);
		return label;
	}
	
	var AsciiA = 65;
	/*
	 * Move to common library (from kayak.js)
	 */
	function IndexToAsciiMarkerABA(index, numChiasmItems)
	{
		var isEven = numChiasmItems%2 == 0;
	    var halfway = numChiasmItems/2;
	    var asciiMarker;
		if (index < halfway)
	    {
	       asciiMarker = String.fromCharCode(AsciiA + index);	     
	    }
	    else
	    {
	    	//0 1 2           3            4
	       // 0 1 2 1(5 - 3 - 1) 0(5 - 4 - 1)
	       asciiMarker = String.fromCharCode(AsciiA + (numChiasmItems - index - 1));
	    }
		return asciiMarker;		
	}
			
	function switchOutlineMode(mode)
	{
		outlineMode = mode;
		if (outlineMode == "Chiasm")
			formatPositionIntoLabel = formatPositionIntoLabel_ABA;
		else if (outlineMode == "123")
			formatPositionIntoLabel = formatPositionIntoLabel_123;
		else if (outlineMode == "Panel")
			formatPositionIntoLabel = formatPositionIntoLabel_Panel;
	}
		
	function formatPositionIntoLabel_123(positionObj, ghostExists)
	{
		if (!positionObj)
			return "";
		//alert(positionObj.position.length)
		var label = positionObj.position[0];
		for (i = 1; i < positionObj.position.length; i++)
		{
			label = label + "." + positionObj.position[i];
		}
		return label + ".";
	}
	
	function formatPositionIntoLabel_Panel(positionObj, ghostExists)
	{
		if (!positionObj)
			return "";
		return getLabelForPanelIndex(mainOutline, positionObj.position[0] - 1) + ".";
	}
	
	/*
	 * Move to common library (from kayak.js)
	 */
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
	
	function formatPositionIntoLabel_ABA(positionObj, ghostExists)
	{
		if (!positionObj)
			return "";
		//alert(ghostExists)
		//alert(positionObj.position[0] + " " + (positionObj.concepts != null ? positionObj.concepts.length : 0));
		//alert(positionObj.position.length)
		var index = positionObj.position[0] - 1;
		if (positionObj.position.length > 1)
			alert("what's up?" + positionObj.concept.content + positionObj.position.length);
		var label = IndexToAsciiMarkerABA(index, 
			positionObj.concepts != null ? positionObj.concepts.length + (ghostExists ? 1 : 0) : 2);
		var count = $(".concept").length;
		//alert(index + "/" + count);
		var endMarker = GetEndMarkerABA(index, count);
		return label + endMarker;
	}
	
	function createEditBoxesForOutline(concepts)
	{
		for (var i=0; i < concepts.length; i++) {
			createEditBox(concepts, i);
		};
	}
	
	function createEditBox(concepts, iconcept)
	{
		var concept = concepts[iconcept];
		//var newConcept = createConcept(concept.content)
		//mainOutline.body.concepts.splice(iconcept, 0, concept);
		insertConceptInView($('#outline div').length, "", true, concept.content);
		if (outlineMode == "123")		
			if (concept.concepts)
			{
				for (var i=0; i < concept.concepts.length; i++) {
					createEditBox(concept.concepts, i);
				};
			}
	}
	
	function getIndexInPositionList(concept)
	{
		var positionList = new Array();
		getConceptPositions(positionList, -1);
		for (var i=0; i < positionList.length; i++) {
		  if (positionList[i].concept == concept)
		  	return i;
		};
	}
	
	function ghostExists(positionList)
	{
		return $('.concept').hasClass("ghost");
	}
	
	function getPositionLabel(indexTarget, element)
	{
		var positionList = new Array();
		getConceptPositions(positionList, indexTarget, element);
		var positionObj = positionList[indexTarget];
		if (positionObj == undefined || positionObj.position == undefined)
			return "(?.)";
		//format position backwards
		var label = formatPositionIntoLabel(positionObj, ghostExists(positionList));
		return label;
	}
	
	function createGhostPositionAfter(positionObj)
	{
		var ghostObj = createPositionObj(positionObj.concepts, -1);
		//successObj.concept = concept[i];
		ghostObj.position = positionObj.position.slice(0);
		ghostObj.position[ghostObj.position.length - 1] = positionObj.position[positionObj.position.length - 1] + 1;
		ghostObj.concept = undefined;
		return ghostObj;
	}
	
	function createPositionObj(concepts, iconcept, parentPos)
	{
		var positionObj = new Object();
		positionObj.concepts = concepts;
		positionObj.index = iconcept;
		if (concepts && concepts.length > 0 && iconcept >= 0)
			positionObj.concept = concepts[iconcept];
		positionObj.position = new Array();
		if (parentPos)
			positionObj.position = parentPos.position.slice(0);
		positionObj.position.push(iconcept + 1);
		return positionObj;
	}
	
	function getConceptPositions(positionList, indexTarget, element, concepts, currentIndex, parentPos)
	{
		if (concepts == undefined)
			concepts = mainOutline.body.concepts;
		if (currentIndex == undefined)
			currentIndex = new Object(0);
		if (positionList == undefined)
			positionList = new Array();
		var i = 0;
		for (i = 0; i < concepts.length; i++)
		{	
			var positionObj = createPositionObj(concepts, i, parentPos);
			positionList.push(positionObj);	
			if (currentIndex == indexTarget)
			{
				return true;
			}
			modifyVar(currentIndex, currentIndex + 1);	
			if (concepts[i].concepts)
			{				
				var fFinished = getConceptPositions(positionList, indexTarget, element, concepts[i].concepts, 
						currentIndex, positionObj);
				if (fFinished)
				{
					return true;
				}					
			}
		}
		
		return false;
	}
	
	function initializeEmptyView()
	{
		$(".concept").remove();
		mainOutline.body.concepts.splice(0, mainOutline.body.concepts.length);
		if (mainOutline.body.concepts.length == 0)
		{
			// create ghost
			nextRow = insertConceptInView(0, "ghost");
			moveEditBoxToNext(nextRow);
		}
	}
	/*
	 * TODO: delete multiple rows if parent is deleted.
	 */
	function deleteConcept(gonner)
	{
		var fDeletingGhost = $('.edit-state').hasClass("ghost");
		if (!fDeletingGhost)
		{
			var indexGonner = $(gonner).index();
			var positionList = new Array();
			getConceptPositions(positionList, -1);
			var positionObj = positionList[indexGonner];
			var nextRow;
			positionObj.concepts.splice(positionObj.index, 1);
			var nextCandidate = $(gonner).next();
			publishConceptDeletionElsewhere(positionObj.concepts, positionObj.index, mainOutline.head);
		}
		
		$(gonner).remove();
		
		if (!fDeletingGhost)
		{
			for (i = indexGonner + 1; i < positionList.length; i++)
			{
				if (positionList[i].position.length <= positionObj.position.length)
					break;
				gonner = nextCandidate;
				nextCandidate = $(gonner).next();
				$(gonner).remove();
			}
		}
		if (mainOutline.body.concepts.length == 0)
		{
			// create ghost
			nextRow = insertConceptInView(0, "ghost");
			moveEditBoxToNext(nextRow);
			return false;
		}
		refreshAllLabels();
		//alert(mainOutline.body.concepts.length)		
	}
	
	function initializeBtnDelete()
	{
		if (mainOutline.body.concepts.length == 0)
		{
			$("#btnDelete").removeAttr("href");
-			$("#btnDelete").unbind("click");
			return false;
		}
		$("#btnDelete").attr("href","#");
		$("#btnDelete").unbind("click"); // make sure we don't install multiple times
		$("#btnDelete").click(function(event)
		{
			deleteConcept($('.edit-state'));
			return false;
		});
	}
	
	function initializeCbIsPanelHead()
	{
		if (outlineMode == "Chiasm" || outlineMode == "123")
		{
			$("#btnSetPanelCycle").removeAttr("href");
			$("#btnSetPanelCycle").unbind("click");
			return false;
		}
		$("#btnSetPanelCycle").attr("href","#");
		$("#btnSetPanelCycle").unbind("click"); // make sure we don't install multiple times
		// TODO: determine if it should be checked or not.
		$("#btnSetPanelCycle").removeAttr("checked");
		$("#btnSetPanelCycle").click(function(event)
		{
			var fIsPanelHead = $("#btnSetPanelCycle").attr("checked");
			var index = $('.edit-state').index();
			var positionList = new Array();
			getConceptPositions(positionList, index);
			if ($('.edit-state').hasClass("ghost"))
			{
				// convert to real
				convertGhostToReal($('.edit-state'));
				getConceptPositions(positionList, index);
			}
			else
			{
				var textArea = $('.edit-state textarea');
				var newContent = $(textArea).val();
				positionObj = positionList[index];
				positionObj.concept.content = newContent;			
			}
			
			setPanelHeadInterval(mainOutline, index);
			refreshAllLabels();
			publishConceptInsertionElsewhere();
			return true;
		});
	}
	
	function initializeBtnSubpoint()
	{
		if (outlineMode == "Chiasm" || outlineMode == "Panel")
		{
			$("#btnSubpoint").removeAttr("href");
			$("#btnSubpoint").unbind("click");
			return false;
		}
		$("#btnSubpoint").attr("href","#");
		$("#btnSubpoint").unbind("click"); // make sure we don't install multiple times
		$("#btnSubpoint").click(function(event)
		{
			var index = $('.edit-state').index();
			var positionList = new Array();
			getConceptPositions(positionList, index);
			if ($('.edit-state').hasClass("ghost"))
			{
				// convert to real
				convertGhostToReal($('.edit-state'));
				getConceptPositions(positionList, index);
			}
			else
			{
				var textArea = $('.edit-state textarea');
				var newContent = $(textArea).val();
				positionObj = positionList[index];
				positionObj.concept.content = newContent;			
			}
			var newConcept = createConcept("");
			var positionObj = positionList[index];
			if (!positionObj.concept.concepts)
				positionObj.concept.concepts = new Array();
			positionObj.concept.concepts.push(newConcept);
			convertTextarea();
			var newConceptHtml = insertConceptAfterEditBoxInView("");
			moveEditBoxToNext(newConceptHtml);
			publishConceptInsertionElsewhere();
			return false;
		});
	}
	
	function initializeBtnAddPoint(offset)
	{	
		var aboveOrBelow;
		if (offset <= 0)
			aboveOrBelow = "Above";
		else
			aboveOrBelow = "Below"
		$("#btnAddPoint" + aboveOrBelow).attr("href","#");
		$("#btnAddPoint" + aboveOrBelow).unbind("click"); // make sure we don't install multiple times
		$("#btnAddPoint" + aboveOrBelow).click(function(event)
		{
			var index = $('.edit-state').index();
			if ($('.edit-state').hasClass("ghost"))
			{
				// convert to real
				convertGhostToReal($('.edit-state'));
			}
			else
			{
				var positionList = new Array();
				getConceptPositions(positionList, index);
				var textArea = $('.edit-state textarea');
				var newContent = $(textArea).val();
				positionObj = positionList[index];
				positionObj.concept.content = newContent;			
			}
			var newConceptHtml = createConceptItem(offset, index, "");
			convertTextarea();
			moveEditBoxToNext(newConceptHtml);
			return false;
		});
	}

	function createConceptItem(offset, index, content)
	{
		var positionList = new Array();
		getConceptPositions(positionList, -1);
		var positionObj = positionList[index];
		var newConcept = createConcept(content);
		// find index to insert next concept
		positionObj.concepts.splice(positionObj.index + offset, 0, newConcept);
		var newConceptHtml;
		if ((index + offset) >= positionList.length)
		{
			newConceptHtml = insertConceptInView(index + offset, "");
		}
		else
		{
			for (var i = index + offset; i < positionList.length; i++)
			{
				if (positionList[i].position.length <= positionObj.position.length)
				{
					newConceptHtml = insertConceptInView(i, "");
					break;
				}
			}
		}
		if (!newConceptHtml)
			newConceptHtml = insertConceptInView(positionList.length, "");
		publishConceptInsertionElsewhere(positionObj.concepts, positionObj.index + offset, mainOutline.head);
		return newConceptHtml;
	}
	
	function publishConceptInsertionElsewhereDoNothing(concepts, iconcept, head)
	{
		// let publication happen elsewhere
	}
	
	function PublishOutlineViewItems(concepts, parentSelector, parentItem)
	{
		var newOrderedList;
	  	if (!parentItem)
	  	{
	  		parentItem = $(parentSelector);
	  	} 
	  	
  		$(parentItem).append("<ol></ol>");
  		newOrderedList = $(parentItem).children(":last");
	  	
	  	for (var i = 0; i < concepts.length; i++) 
	  	{
			var concept = concepts[i];
			if (concept)
			{
				$(newOrderedList).append("<li><span class='conceptContent'>" + concept.content + "</span></li>");
				var newListItem = $(newOrderedList).children(":last");
				if (concept.concepts)
				{
					PublishOutlineViewItems(concept.concepts, null, newListItem);
				}
			}
		};
	}
	
	function publishContentToPreviewTabs(concepts, iconcept, newContent)
	{
		publishContent("#chiasm-indent", iconcept, newContent);
		publishContent("#chiasm-flat", iconcept, newContent);
		publishContent("#tableViewAAB", iconcept, newContent);
	}
	
	function publishContent(containerSelector, iconcept, newContent)
	{
		var viewConcept = $(containerSelector).find(".conceptContent").get(iconcept);
		$(viewConcept).first().html(newContent);
	}
	
	function moveEditBoxToNext(nextRow)
	{
		var indexRowEdit = $('.edit-state').index();
		if (indexRowEdit != -1)
		{
			if ($('.edit-state').first().hasClass("ghost"))
			{
				$('.edit-state').first().remove();
				refreshAllLabels();
			}
			else
			{
				var trashTextBoxId = $("#btnUpdateContent").attr("value");
				//FitToContent(trashTextBoxId,'','100');
				$('.edit-state').unbind("click");
				$('.edit-state').click(moveEditBox);
			    $('.edit-state').toggleClass('edit-state');
		    }
		}
		$(nextRow).unbind('click');		
		$(nextRow).toggleClass('edit-state');
		var txtContentId = $('.edit-state').find("label").attr("for");
		convertIntoTextarea();
		initializeEditTextarea();
		if ($("#head-editBoxControls").get(0) == undefined)
		{
			$("<div></div>").prependTo(".edit-state")
		    	.attr("id", "head-editBoxControls");
			var btnOptionalHtml = "";
		    if (outlineMode == "Panel")
		    	btnOptionalHtml = '<button id="btnSetPanelCycle"> Insert panel break </button> ';
			$("#head-editBoxControls")
				.append('<button id="btnAddPointAbove"> + point </button>')
				.append(btnOptionalHtml);
		}
		else
		{
			$("#head-editBoxControls").prependTo(".edit-state");	
		}
		if ($("#tail-editBoxControls").get(0) == undefined)
		{
		    $("<div></div>").appendTo(".edit-state")
		    	.attr("id", "tail-editBoxControls");
		    var btnOptionalHtml = "";
		    if (outlineMode == "123")
		    	btnOptionalHtml = '<button id="btnSubpoint"> &gt; subpoint </button> | ';
		    
			$("#tail-editBoxControls")
				.append('<button id="btnAddPointBelow"> + point </button>')
				.append('<button id="btnUpdateContent" type="button" value="'+ txtContentId +'">Enter</button>') 
				.append(btnOptionalHtml)
				.append('<button id="btnDelete"> x delete </button> | ');
			$("#btnUpdateContent").click(updateContent);
		}
		else
		{
			$("#tail-editBoxControls").appendTo(".edit-state");	
		}
		initializeCbIsPanelHead();
		initializeBtnDelete();
		initializeBtnSubpoint();
		initializeBtnAddPoint(0);
		initializeBtnAddPoint(1);
		var idTextarea = $(".edit-state").find("textarea").attr("id");
		$("#btnUpdateContent").attr("value", idTextarea);
	}
	
	function createConcept(content)
	{
		var emptyConceptText = '{"content" : "" }';
		var newConcept = jQuery.parseJSON( emptyConceptText );
		newConcept.content = content;
		return newConcept;
	}
	
	function convertGhostToReal(ghostNode)
	{
		var newContent = $(ghostNode).find("textarea").val();
		var indexRowEdit = $(ghostNode).index();
		//alert("indexRowEdit " + indexRowEdit );
		var orderNum = indexRowEdit + 1;
		
		var concept = createConcept(newContent);
		var positionList = new Array();
		var conceptPosition;
		if (indexRowEdit > 0 && mainOutline.body.concepts.length > 0)
		{
			getConceptPositions(positionList, indexRowEdit - 1);
			conceptPosition = createGhostPositionAfter(positionList[indexRowEdit - 1]);
			//alert(conceptPosition.index);
		}
		else
		{
			conceptPosition = createPositionObj(mainOutline.body.concepts, 0);
		}
		conceptPosition.concepts.splice(indexRowEdit, 0, concept);
		conceptPosition.concept = concept;
		//mainOutline.body.concepts[indexRowEdit].content = newContent;
		$(ghostNode).removeClass('ghost');
		var label = formatPositionIntoLabel(conceptPosition, ghostExists(positionList));
		applyLabelToConceptNode($(ghostNode), label);
		publishConceptInsertionElsewhere(conceptPosition.concepts, indexRowEdit, mainOutline.head);
	}

	function insertConceptAfterEditBoxInView(classesToAdd)
	{
		$("<div></div>").insertAfter('.edit-state');
		var nextRow = $(".edit-state").next();
		$(nextRow).addClass('concept');
		if (classesToAdd != undefined && classesToAdd.length != 0)
			$(nextRow).addClass(classesToAdd);
		//$(nextRow).addClass('edit-state');
		++numConceptCreated;
		$(nextRow).append('<label class="markerEditLabel" for="txtContent-' + numConceptCreated + '"></label>');
		$(nextRow).append('<textarea id="txtContent-' + numConceptCreated + '" cols="40" rows="1"></textarea>');
		refreshAllLabels();
		return nextRow;
	}
	
	function insertConceptInView(indexInView, classesToAdd, fAsReadOnlyContent, content)
	{
		//alert("insertConceptInView" + indexInView + content);
		$('#outline').insertAt(indexInView, "<div></div>");
		var nextRow = $('#outline').children("div:eq(" + indexInView + ")");
		$(nextRow).addClass('concept');
		if (classesToAdd != undefined && classesToAdd.length != 0)
			$(nextRow).addClass(classesToAdd);
		//$(nextRow).addClass('edit-state');
		++numConceptCreated;
		$(nextRow).append('<label class="markerEditLabel" for="txtContent-' + numConceptCreated + '"></label>');
		if (fAsReadOnlyContent)
		{
			$(nextRow).append('<span id="txtContent-' + numConceptCreated + '">' + content + '</span>')
					  .click(moveEditBox);
		}
		else
			$(nextRow).append('<textarea id="txtContent-' + numConceptCreated + '" cols="40" rows="1"></textarea>');
		refreshAllLabels();
		return nextRow;
	}
	
	function convertTextarea()
	{
		var idTextareaOld = $('.edit-state textarea').attr("id");
		var content = $('#' + idTextareaOld).val();
		$('.edit-state textarea').replaceWith('<span id="' + idTextareaOld + '">' + content + '</span>');
	}
	
	function convertIntoTextarea()
	{
		var txtContentId = $('.edit-state').find("label").attr("for");
		var content = $('#' + txtContentId).text();
		$('#' + txtContentId).replaceWith('<textarea id="' + txtContentId + '" cols="40" rows="1">' + content + '</textarea>');
	}

	function updateContent() {
	  	// get value of button, to get the textarea binding		  	
		var textAreaId = $("#btnUpdateContent").attr('value');
		//FitToContent(textAreaId,'','100');
		var selector = '#' + textAreaId;
		var newContent = $(selector).val();
		// get current index
		var indexRowEdit = $('.edit-state').index();
		var orderNum = indexRowEdit + 1;
		var positionObj;
		var positionList = new Array();
		getConceptPositions(positionList, -1);
		var fOnLastRow = indexRowEdit == ($('.concept').length - 1);
		if ($('.edit-state').hasClass("ghost"))
		{
			if (newContent.length == 0)
			{
				if (fOnLastRow)
				{
					$('.edit-state textarea').first().putCursorAtEnd();
					return false;
				}
			}
			else
			{
				// need to make real content now
				convertGhostToReal($('.edit-state'));
				positionList = new Array();
				getConceptPositions(positionList, -1);
				if (positionObj == null)
				{
					positionObj = positionList[indexRowEdit];
				}	
			}
		}
		else
		{
			positionObj = positionList[indexRowEdit];
			positionObj.concept.content = newContent;			
		}

		//alert(indexRowEdit + " " + newContent)
		convertTextarea();
		// if there are no following elements, establish a new ghost row
		var nextRow;
		if (fOnLastRow || positionObj &&
			positionList[indexRowEdit + 1].position.length < positionObj.position.length)
		{
			nextRow = insertConceptAfterEditBoxInView("ghost");
		}
		else
		{
			nextRow = $(".edit-state").next(".concept").get(0);
		}
		moveEditBoxToNext(nextRow);
		if (positionObj == null)
		{
			positionObj = positionList[indexRowEdit];
		}
		publishContentChangesElsewhere(positionObj.concepts, indexRowEdit, mainOutline.head);
		return false;
	}
	
	function publishConceptDeletionElsewhereDoNothing(concepts, indexOfDeletedConcept, head)
	{
		
	}
	
	function publishContentChangesElsewhereDoNothing(concepts, indexOfEditedConcept, head)
	{
		// let external definition do work
	}