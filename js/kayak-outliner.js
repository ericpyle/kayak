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
	  			//if (oldContent != textareaContent) // embedMode labels may need to change as well.
	  			//{
	  				// update mainOutline
	  				positionObj.concept.content = textareaContent;
	  				publishContentChangesElsewhere(positionObj.concepts, indexOldEditBox, mainOutline.head)
	  				//alert(textareaContent)
	  			//}			 
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
		$(element).find("label").first().text(label);
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
				positionObj.concept = createConcept("");
				transferEmbedModeProperties(element, positionObj.concept);
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
			var label = formatPositionIntoLabel(positionObj, ghostExists());
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
		/* var count = positionObj.concepts != null ? positionObj.concepts.length + (ghostExists ? 1 : 0) : 2; */
		var adjustedConcepts = positionObj.concepts ? clone(positionObj.concepts) : [];
		if (ghostExists) {
			if (index == adjustedConcepts.length)
				adjustedConcepts.push(positionObj.concept); // this is the ghost item. preserve the concept as it was passed in.
			else
				adjustedConcepts.push(createConcept("ghost"));
		}
		var dto = cons.createDtoFromConcepts("chiasm", adjustedConcepts);
		/*
		if (ghostExists) {
			if (positionObj.concepts == null)
				positionObj.concepts = [];
			var newConcept = positionObj.concept ? positionObj.concept : createConcept("");
			if (index >= positionObj.concepts.length || positionObj.concepts[index] != newConcept)
				dto.concepts.splice(index, 0, newConcept);
		}*/
		
		var label = cons.getLabel(dto, index);
		//alert(index + "/" + count);
		return label;
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
		insertConceptInView($('#outline div').length, "", true, concept);
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
	
	function ghostExists()
	{
		return $('.concept').hasClass("ghost");
	}
	
	function getPositionLabel(indexTarget, element)
	{
		var positionList = new Array();
		getConceptPositions(positionList, indexTarget, {"element":element});
		var positionObj = positionList[indexTarget];
		if (positionObj == undefined || positionObj.position == undefined)
			return "(?.)";
		//format position backwards
		var label = formatPositionIntoLabel(positionObj, ghostExists());
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
	
	/*
	 * recursionParams: element, concepts, currentIndex, parentPos
	 */
	function getConceptPositions(positionList, indexTarget, recursionParams)
	{
		var element; 
		var concepts; 
		var currentIndex; 
		var parentPos;
		if (recursionParams)
		{
			element = recursionParams.element; 
			concepts = recursionParams.concepts; 
			currentIndex = recursionParams.currentIndex; 
			parentPos = recursionParams.parentPos;			
		}		
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
				var recursionParams2 = {"element": element, "concepts": concepts[i].concepts, "currentIndex": currentIndex, "parentPos": positionObj};
				var fFinished = getConceptPositions(positionList, indexTarget, recursionParams2);
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

	function initializeBtnEmbeddedLink() {
		$("#btnEmbeddedLink").attr("href", "#");
		$("#btnEmbeddedLink").off("click"); // make sure we don't install multiple times
		$("#btnEmbeddedLink").on("click", function (event) {
			var index = $('.edit-state').index();
			var fIsGhost = $('.edit-state').hasClass('ghost');
			if (fIsGhost) {
				convertGhostToReal($('.edit-state'));
			}
			var existingEmbeddedOutlineId = "";
			var concept = mainOutline.body.concepts[index];
			if (concept.embeddedOutlineId) {
				existingEmbeddedOutlineId = concept.embeddedOutlineId;
			}

			// insert text box...replace buttons...?
			var content = $('.edit-state textarea').val();
			if (content == null)
				content = "";
			$(".edit-state").append('<div id="dialog" title="Embed an outline..."></div>');
			$("#dialog").append('<div>Link to an existing outline with the same range.</div>');
			$("#dialog").append('<div style="background-color:#E2E4FF;">' + content + '</div>');
			
			$("#dialog").append('<label for="lnkEmbedded">http://</label>');
			$("#dialog").append('<textarea id="lnkEmbedded" cols="40" rows="1"></textarea>');
			$("#dialog").append('<div>Later, click on the [<a href="#" onclick="return false;">+</a>] link to see that outline.</div>');
			
			$("#dialog").dialog({
				autoOpen: false,
				modal: true,
				position: { my: "center", at: "center", of: "#btnEmbeddedLink" },
				width: 500,
				buttons: {
					"OK": function () {
						$(this).dialog("close");
						var urlLnkEmbedded = $(jq("lnkEmbedded")).val();
						var dbId = "";
						if (EmptyIfNull(urlLnkEmbedded).length == 0) {
							// remove the property below.
						}
						else if (isDbId(urlLnkEmbedded)) {
							dbId = urlLnkEmbedded;
						} else {
							var url = $.url(urlLnkEmbedded);
							var dbId = getDbIdFromUrl(url);
						}
						var index = $(".edit-state").index();
						var concept = mainOutline.body.concepts[index];
						if (EmptyIfNull(dbId).length == 0) {
							// remove the property if it exists.
							if (concept.embeddedOutlineId) {
								delete concept.embeddedOutlineId;
							}
							$(".edit-state .lnkToEmbeddedOutline").html("");
							return false;
						}
						concept.embeddedOutlineId = dbId;
						$(".edit-state .lnkToEmbeddedOutline").html("[" + wrapInHref(dbId) + "]");
						//$("<label class='lnkToEmbeddedOutline'>[<a href='#/"+ dbId + "'>+</a>] </label>").insertAfter(".edit-state textarea");
					},
					Cancel: function () {
						$(this).dialog("close");
					}
				}
			});
			$("#dialog").dialog("open");
			$(jq("lnkEmbedded")).val(existingEmbeddedOutlineId);
			FitToContent("lnkEmbedded", '', '100');
			$(jq("lnkEmbedded"))
				.keyup(function (event) {
					// update content of chiasm
					var textAreaId = event.target.id;
					FitToContent(this, '', '100');
					return false;
				});
			/*
			// validate?
			// copy url to concept.
			if ($('.edit-state').hasClass("ghost")) {
				// convert to real
				convertGhostToReal($('.edit-state'));
				//getConceptPositions(positionList, index);
			}
			convertTextarea();
			$("#lnkEmbedded").first().putCursorAtEnd();
			$("#head-editBoxControls").remove();
			$("#tail-editBoxControls").remove();
			$('.edit-state').removeClass('edit-state');
			*/
			false;
		});
	}
	
	function initializeBtnDelete()
	{
		if (mainOutline.body.concepts.length == 0)
		{
			$("#btnDelete").removeAttr("href");
			$("#btnDelete").unbind("click");
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
			var positionObj = positionList[index];
			insertSubpoint(positionObj, "");
			convertTextarea();
			var newConceptHtml = insertConceptAfterEditBoxInView("");
			moveEditBoxToNext(newConceptHtml);
			publishConceptInsertionElsewhere();
			return false;
		});
	}
	
	function insertSubpoint(positionObj, content)
	{
		return insertChildConcept(positionObj.concept, content);
	}
	
	function insertChildConcept(concept, content)
	{
		var newConcept = createConcept(content);
		if (!concept.concepts)
			concept.concepts = new Array();
		concept.concepts.push(newConcept);
		return newConcept;
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
				var lnk = "";
				if (concept.embeddedOutlineId)
					lnk = "[" + wrapInHref(concept.embeddedOutlineId) + "]";
				$(newOrderedList).append("<li><span class='conceptContent'>" + concept.content + "</span> <label><span class='lnkToEmbeddedOutline'>"+lnk+"</span></label></li>");
				var newListItem = $(newOrderedList).children(":last");
				if (concept.concepts)
				{
					PublishOutlineViewItems(concept.concepts, null, newListItem);
				}
			}
		};
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
		    	btnOptionalHtml = '<button id="btnSubpoint"> &gt; subpoint </button> ';
		    else if (outlineMode == "Chiasm") {
		    	btnOptionalHtml = '<button id="btnEmbedMode" style="margin-right:0px;padding-right:0px;"></button><button id="btnEmbedModeOptions" style="margin-left: 0px;padding-left:0px"></button> ';
		    }
			$("#tail-editBoxControls")
				.append('<button id="btnAddPointBelow"> + point </button>')
				.append('<button id="btnUpdateContent" type="button" value="'+ txtContentId +'">Enter</button>') 
				.append(btnOptionalHtml)
				.append('<button id="btnEmbeddedLink"> embed... </button> ')
				.append('<button id="btnDelete"> x delete </button> ');
			$("#btnUpdateContent").click(updateContent);
		}
		else
		{
			$("#tail-editBoxControls").appendTo(".edit-state");	
		}
		initializeCbIsPanelHead();
		initializeBtnDelete();
		initializeBtnEmbeddedLink();
		initializeBtnEmbedMode();
		initializeBtnSubpoint();
		initializeBtnAddPoint(0);
		initializeBtnAddPoint(1);
		var idTextarea = $(".edit-state").find("textarea").attr("id");
		$("#btnUpdateContent").attr("value", idTextarea);
	}

	function changeEmbedMode(concepts, index) {
		var embedModes = getOtherEmbedModes(concepts, index);
		if (embedModes[0].concepts) {
			concepts = embedModes[0].concepts;
		}
		else
			concepts[index] = embedModes[0].concept;
		return concepts;
	}

	function cleanupEmbeddedDependents(concepts, index) {
		var embeddedTypeOrig = concepts[index].embeddedType;
		var fCleanup = embeddedTypeOrig != null;
		if (!fCleanup)
			return;
		for (var i = index + 1; i < concepts.length; ++i) {
			var nextConcept = concepts[i];
			if (nextConcept.isHead)
				break;
			if (nextConcept.embeddedType == embeddedTypeOrig)
				delete nextConcept.embeddedType;
		}
	}

	function collectGroupings(concepts, imax) {
		var groupings = [];
		for (var i = 0; i < imax; i++) {
			var nextConcept = concepts[i];
			if (!nextConcept.embeddedType || !nextConcept.isHead || nextConcept.embeddedType != "panel")
				continue;
			// look ahead to see if we have a group.
			var grouping = { indexHead : null, groupCount: 0};
			var j = (i + 1);
			for (; j < imax; j++) {
				var groupConcept = concepts[j];
				if (!groupConcept.embeddedType || groupConcept.isHead || groupConcept.embeddedType != "panel") {
					break;
				}
			}
			if (j > (i + 1)) {
				var groupCount = j - i;
				grouping.indexHead = i;
				grouping.groupCount = groupCount;
				groupings.push(grouping);
			}
		}
		return groupings;
	}

	function addEmbedModesForMatchingPairs(conceptsPure, indexTarget, otherEmbedModes) {
		var halfway = Math.round(conceptsPure.length / 2);
		var fFirstConceptInPair = (indexTarget < halfway);
		if (!fFirstConceptInPair) {
			// look back at first half, and
			// find the groupings that we might be able to create our own grouping to match with.
			var groupings = collectGroupings(conceptsPure, halfway);
			// for each grouping, see if we can create a matching grouping on the other half of the chiasm
			for (var i = 0; i < groupings.length; i++) {
				var grouping = groupings[i];
				var matchingIndex = conceptsPure.length - grouping.indexHead - 1; // same distance from each end.
				var indexHeadMatch = matchingIndex + 1 - grouping.groupCount;
				if (indexHeadMatch < halfway)
					continue;
				if (indexHeadMatch != indexTarget)
					continue;
				/* a1, a2, b | b', a  => a1, a2, b | a1', a2' */
				// now scan through the matching range and see if we can form a matching group
				var fReadyForMatch = true;
				for (var j = 0; j < grouping.groupCount ; j++) {
					var indexMatching = indexHeadMatch + j;
					var conceptMatching = conceptsPure[indexMatching];
					if (conceptMatching.isHead || conceptMatching.embeddedType != null) {
						fReadyForMatch = false;
						break;
					}
				}
				if (fReadyForMatch) {
					var tryConcepts = clone(conceptsPure);
					tryConcepts[indexTarget].isHead = true;
					tryConcepts[indexTarget].embeddedType = "panel";
					for (var j = 1; j < grouping.groupCount ; j++) {
						var indexMatching = indexHeadMatch + j;
						var conceptMatching = tryConcepts[indexMatching];
						conceptMatching.embeddedType = "panel";
					}
					pushToEmbedModes(tryConcepts, indexTarget, otherEmbedModes);
					// add concepts, since this mode affects other concepts
					otherEmbedModes[otherEmbedModes.length - 1].concepts = tryConcepts;
				}
			}
		}
	}

	function pushToEmbedModes(tryConcepts, index, embedModes) {
		var dto = cons.createDtoFromConcepts("chiasm", tryConcepts);
		label = cons.getLabel(dto, index);
		embedModes.push({ concept: tryConcepts[index], label: label });
	}

	/* given the current embedMode (if any), return the most relavent other embedModes which the user could choose.
	*/
	function getOtherEmbedModes(concepts, index) {
		var otherEmbedModes = [];
		var concept = concepts[index];
//		var positionList = new Array();
//		getConceptPositions(positionList, -1, { concepts: clonedConcepts });
		// look at current state and display the next logical option
		if (!concept.embeddedType) {
			addEmbedModesForMatchingPairs(concepts, index, otherEmbedModes);
			
			if (index != 0 && concepts[index - 1].embeddedType) {
				// this is continuation, not a head
				var tryConcepts = clone(concepts);
				tryConcepts[index].embeddedType = "panel";
				pushToEmbedModes(tryConcepts, index, otherEmbedModes);
			}
			// in any case, add head as an option (A1, B1, C1, etc...)
			var tryConcepts2 = clone(concepts);
			tryConcepts2[index].isHead = true;
			tryConcepts2[index].embeddedType = "panel";
			pushToEmbedModes(tryConcepts2, index, otherEmbedModes);			
		}
		else if (concept.embeddedType == "panel") {
			var tryConcepts = clone(concepts);
			cleanupEmbeddedDependents(tryConcepts, index);
			delete tryConcepts[index].embeddedType;
			delete tryConcepts[index].isHead;
			pushToEmbedModes(tryConcepts, index, otherEmbedModes);
			otherEmbedModes[otherEmbedModes.length - 1].concepts = tryConcepts; // other concepts affected
		}
		//if (fGhost) {
		//	label.before = "(" + label.before;
		//	label.after += ")";
		//}		
		return otherEmbedModes;
	}

	function initializeBtnEmbedModeOptions(embedModes) {
		if (embedModes.length > 1) {
			$("#btnEmbedModeOptions").text("(1/" + embedModes.length + ")");
			$("#btnEmbedModeOptions").data("modes", embedModes);
			$("#btnEmbedModeOptions").data("nextModeIndex", 0);
			$("#btnEmbedModeOptions").attr("href", "#");
			$("#btnEmbedModeOptions").off("click"); // make sure we don't install multiple times
			$("#btnEmbedModeOptions").on("click", function (event) {
				advanceEmbedModeOption();
				false;
			});
			$("#btnEmbedModeOptions").show();
		} else {
			$("#btnEmbedModeOptions").hide();
		}
	}

	function advanceEmbedModeOption() {
		var modes = $("#btnEmbedModeOptions").data("modes");
		if (modes == null)
			return;
		var indexMode = $("#btnEmbedModeOptions").data("nextModeIndex");
		var indexNextMode = (indexMode + 1) < modes.length ? (indexMode + 1) : 0;
		$("#btnEmbedModeOptions").text("(" + (indexNextMode + 1) + "/" + modes.length + ")");
		$("#btnEmbedModeOptions").data("nextModeIndex", indexNextMode);
		var nextMode = modes[indexNextMode];
		$("#btnEmbedMode").text(nextMode.label.toString());
		$("#btnEmbedMode").data("mode", nextMode);

	}

	function initializeBtnEmbedModeBasic() {
		var index = $('.edit-state').index();
		var fGhost = $('.edit-state').hasClass("ghost");
		var existingGhost = $('.edit-state').data("ghostConcept");
		var clonedConcepts = cloneAndInsertGhostConcept(mainOutline.body.concepts, fGhost, index, existingGhost);
		var embedModes = getOtherEmbedModes(clonedConcepts, index);
		initializeBtnEmbedModeOptions(embedModes);
		$("#btnEmbedMode").text(embedModes[0].label.toString());
		$("#btnEmbedMode").data("mode", embedModes[0]);
	}

	function initializeBtnEmbedMode() {
		initializeBtnEmbedModeBasic();
		$("#btnEmbedMode").attr("href", "#");
		$("#btnEmbedMode").off("click"); // make sure we don't install multiple times
		$("#btnEmbedMode").on("click", function (event) {
			var index = $('.edit-state').index();
			var selectedMode = $("#btnEmbedMode").data("mode"); // todo
			var newConcepts = null;
			var fGhost = $('.edit-state').hasClass("ghost");
			if (!fGhost && selectedMode.concepts)
				newConcepts = selectedMode.concepts;
			else {
				var existingGhost = $('.edit-state').data("ghostConcept");
				var clonedConcepts = cloneAndInsertGhostConcept(mainOutline.body.concepts, fGhost, index, existingGhost);
				clonedConcepts[index] = selectedMode.concept;
				if (fGhost) {
					$('.edit-state').data("ghostConcept", clonedConcepts[index]);
					newConcepts = cloneAndRemoveGhostConcept(clonedConcepts, index);
				}
				else {
					newConcepts = clonedConcepts;
				}
			}
			mainOutline.body.concepts = newConcepts;
			refreshAllLabels();
			initializeBtnEmbedModeBasic();
			return false;
		});
	}

	function cloneAndInsertGhostConcept(concepts, fGhost, indexToIns, existingGhost) {
		var clonedConcepts = clone(concepts);
		if (fGhost) {
			var newConcept = existingGhost ? existingGhost : { content: "" };
			clonedConcepts.splice(indexToIns, 0, newConcept);
		}
		return clonedConcepts;
	}

	function cloneAndRemoveGhostConcept(concepts, indexToDel) {
		var clonedConcepts = clone(concepts);
		clonedConcepts.splice(indexToDel, 1);
		return clonedConcepts;
	}
	
	function createConcept(content)
	{
		var emptyConceptText = '{"content" : "" }';
		var newConcept = jQuery.parseJSON( emptyConceptText );
		newConcept.content = content;
		return newConcept;
	}

	function transferEmbedModeProperties(ghostNode, concept) {
		var ghostConcept = $(ghostNode).data("ghostConcept");
		if (ghostConcept) {
			concept.embeddedType = ghostConcept.embeddedType;
			if (ghostConcept.isHead)
				concept.isHead = true;
		}
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
		transferEmbedModeProperties(ghostNode, concept);		
		//mainOutline.body.concepts[indexRowEdit].content = newContent;
		$(ghostNode).removeClass('ghost');
		var label = formatPositionIntoLabel(conceptPosition, ghostExists());
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
		$(nextRow).append(' <label><span class="lnkToEmbeddedOutline"></span></label>');
		refreshAllLabels();
		return nextRow;
	}
	
	function insertConceptInView(indexInView, classesToAdd, fAsReadOnlyContent, concept)
	{
		var content = null;
		var lnk = "";
		if (concept) {
			content = concept.content;
			if (concept.embeddedOutlineId) {
				lnk = "[" + wrapInHref(concept.embeddedOutlineId) + "]";
			}
		}
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
		$(nextRow).append(' <label><span class="lnkToEmbeddedOutline">' + lnk + '</span></label>');
		refreshAllLabels();
		return nextRow;
	}
	
	function convertTextarea()
	{
		var idTextareaOld = $('.edit-state textarea').first().attr("id");
		var content = $('#' + idTextareaOld).val();
		$('.edit-state textarea').first().replaceWith('<span id="' + idTextareaOld + '">' + content + '</span>');
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