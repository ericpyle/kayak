/**
 * @author Pyle
 */

		function loadJSONToOutline(doc)
	    {
	    	//mainOutline = jQuery.parseJSON( jsonText );
	    	mainOutline = clone(doc);
	    	changeUrlToSelectedId(doc._id);
	    	LoadContentTypeModeFromOutline();
	    	LoadOutlineFromCurrentState();
	    	stageOutlineToSave();
	    	return false;
	    };
	    
	    function LoadContentTypeModeFromOutline()
	    {
	    	var contentTypeMode = "modeChiasm";
	    	if (mainOutline.head.contentType == "outline")
	    		contentTypeMode = "modeHierarchical";
	    	else if (mainOutline.head.contentType == "chiasm")
	    		contentTypeMode = "modeChiasm";
	    	else if (mainOutline.head.contentType == "panel")
	    		contentTypeMode = "modePanel";
	    	$("#edit-outline-contentType").val(contentTypeMode);
	    }
	    
		publishConceptInsertionElsewhere = function(concepts, iconceptInserted, head)
	    {
	    	publishOutlineToReadOnlyViews();
	    }
	    
	    publishConceptDeletionElsewhere = function(concepts, iconceptInserted, head)
	    {
	    	publishOutlineToReadOnlyViews();
	    }
	    
	    publishContentChangesElsewhere = function(concepts, iconceptChangedContent, head) {
	    	
	    	if (mainOutline.head.contentType == "chiasm")
	    	{
		    	var positionList = new Array();
				getConceptPositions(positionList, -1);
				positionObj = positionList[iconceptChangedContent];
		    	var fUpdated = applyCitationMarkupForItemToViews(positionObj.concepts, 
		    		getBookName(head.ScriptureRange), positionObj.index, head.ScriptureRange, publishContentToChiasmView);
		    	
		    	if (!fUpdated)
		    	{
		    		publishContentToChiasmView(positionObj.concepts, positionObj.index, positionObj.concept.content);
		    	}
	    	}
	    	else if (mainOutline.head.contentType == "outline")
	    	{
	    		publishOutlineToReadOnlyViews();
	    	}
	    	else if (mainOutline.head.contentType == "panel")
	    	{
	    		publishOutlineToReadOnlyViews();
	    	}
	    	refreshScriptureTagging();
	    	//alert("changed" + iconceptChangedContent);
	    }
	    
	    function LoadOutlineToBulkEditBox()
	    {
	    	$("#outlineContainer").empty();
			$("#outlineContainer").append('<div id="outlineBulkEdit"></div>');
			$('#bulkEditABA').contents().clone().appendTo('#outlineBulkEdit');
			loadCurrentChiasmIntoTextBox('tbImport');
	    }
	    
	    function LoadOutlineToChiasmEdit()
	    {
		  	$("#outlineContainer").empty();  				
			$("#outlineContainer").append('<div id="outline"></div>');
			if (mainOutline.body.concepts.length == 1 && mainOutline.body.concepts[0].content == "")
			{
				mainOutline = createBlankOutline("chiasm");
				LoadAllViewsFromCurrentObj();
				initializeEmptyView();
			}
			else if (mainOutline.body.concepts.length == 0)
			{
				LoadAllViewsFromCurrentObj();
				initializeEmptyView();	  					
			}	  					
			else
				LoadAllViewsFromCurrentObj(createEditBoxesForOutline);
			$("body").data("mainOutlineJSON-orig", JSON.stringify(mainOutline));
	    }
	    
	    function LoadOutlineFromCurrentState()
	    {
	    	var editControl = $("#edit-outline-editControl").val();
	    	//alert(editControl + "<>" +  mainOutline.head.contentType);
	    	if (mainOutline.head.contentType == undefined)
	    		mainOutline.head.contentType = "chiasm";  // default    	
	    	if (mainOutline.head.contentType == "chiasm")
  			{
  				$("#edit-outline-panelOptions-row").attr('style', "display:none;");
  				$("#edit-outline-editControl-row").removeAttr('style');
  				switchOutlineMode("Chiasm");
	  			if (editControl == "chiasmABBA")
	  			{
	  				LoadOutlineToChiasmEdit();
	  				return false;
	  			}
	  			if (editControl == "chiasmAABB")
	  			{
					$("#outlineContainer").empty();
					$("#outlineContainer").append('<div id="editChiasmBody">')
					if (mainOutline.body.concepts.length == 0)
					{
						mainOutline = createBlankOutline("chiasm");
						insertConcept(mainOutline.body.concepts, 0, "");
					}
					mainOutline.head.contentType = "chiasm";
					LoadAllViewsFromCurrentObj(createdEditBoxesForConcepts);
					$("body").data("mainOutlineJSON-orig", JSON.stringify(mainOutline));
	  				return false;
	  			}  	
	  			if (editControl == "chiasmBulk")
	  			{
					LoadOutlineToBulkEditBox();
	  				return false;
	  			}
  				return false;
  			}
  			if (mainOutline.head.contentType == "outline")
  			{
  				$("#edit-outline-panelOptions-row").attr('style', "display:none;");
  				$("#edit-outline-editControl-row").attr('style', "display:none;");
  				$("#outlineContainer").empty();
  				switchOutlineMode("123");
  				$("#outlineContainer").append('<div id="outline"></div>');
  				if (mainOutline.body.concepts.length == 1 && mainOutline.body.concepts[0].content == "")
  				{
  					mainOutline = createBlankOutline("outline");
  					initializeEmptyView();
  				}
  				else if (mainOutline.body.concepts.length == 0)
  				{
  					initializeEmptyView();
  				}
  				else
  					LoadAllViewsFromCurrentObj(createEditBoxesForOutline);
  				$("body").data("mainOutlineJSON-orig", JSON.stringify(mainOutline));
  				return false;
  			}
  			if (mainOutline.head.contentType == "panel")
  			{
   				$("#edit-outline-editControl-row").attr('style', "display:none;");
  				$("#edit-outline-panelOptions-row").removeAttr('style');
  				$("#outlineContainer").empty();
  				switchOutlineMode("Panel");
  				$("#outlineContainer").append('<div id="outline"></div>');
  				if (mainOutline.body.concepts.length == 1 && mainOutline.body.concepts[0].content == "")
  				{
  					mainOutline = createBlankOutline("panel");
  					mainOutline.head["contentParams"] = {"repeat" : 0, "header": false};
  					initializeEmptyView();
  				}
  				else if (mainOutline.body.concepts.length == 0)
  				{
  					mainOutline.head["contentParams"] = {"repeat" : 0, "header": false};
  					initializeEmptyView();
  				}
  				else
  				{
  					if (!mainOutline.head.contentParams || !mainOutline.head.contentParams.repeat )
  						mainOutline.head["contentParams"] = {"repeat" : 0 };
  					LoadAllViewsFromCurrentObj(createEditBoxesForOutline);
  				}

  				$("body").data("mainOutlineJSON-orig", JSON.stringify(mainOutline));
  				return false;
  			}
  			
  			
	    };
	    
	    function LoadSearchInputWithKeywords(personProfile, selector)
	    {
	    	if (personProfile)
  			{
	  			var keywords = convertToKeywordString(
										[authorColumns(personProfile, "name.first"),
										authorColumns(personProfile, "name.middle"),
										authorColumns(personProfile, "name.last"),
										authorColumns(personProfile, "organization.name"),
										authorColumns(personProfile, "organization.website")]);
				$(selector).val(keywords);
			}
			else
			{
				$(selector).val("");
			}
	    	
	    }
	    
	    function LoadPersonProfileSearchResultsFromOutline(authorProfile, submitterProfile)
	    {
	    	LoadSearchInputWithKeywords(authorProfile, "#authorSearch");
	    	LoadSearchInputWithKeywords(submitterProfile, "#submitterSearch");
			LoadAuthorResultsCallback(getResponse);
			
			if (authorProfile)
			{
				var parentRow = $(jq(authorProfile._id));
				selectCreditRow(parentRow, fetchPersonProfile, "[name='updateAuthorProfile']");
			}
			if (submitterProfile)
			{
				var parentRow = $(jq(submitterProfile._id));
				selectCreditRow(parentRow, fetchPersonProfile, "[name='updateAuthorProfile']");
			}
  			return true;
	    }
	    
	    function matchAuthorByCurrentOutline(doc)
	    {
	    	if (mainOutline && doc.head.contentType == "personProfile" && 
	    		mainOutline.head.author && doc._id == mainOutline.head.author.guid )
	    		return true;
	    	return false;
	    }
	    
	    function matchSubmitterByCurrentOutline(doc)
	    {
	    	if (mainOutline && doc.head.contentType == "personProfile" && 
	    		mainOutline.head.submittedBy && doc._id == mainOutline.head.submittedBy.guid )
	    		return true;
	    	return false;
	    }
		
		function onChangeOutlineContentType()
		{
			ApplyOutlineContentType();
  			return LoadOutlineFromCurrentState();
		}
		
		function ApplyOutlineContentType()
		{
			var contentType = $("#edit-outline-contentType").val();
			if (contentType == "modeChiasm")
				mainOutline.head.contentType = "chiasm";
			else if (contentType == "modeHierarchical")
				mainOutline.head.contentType = "outline";
			else if (contentType== "modePanel")
				mainOutline.head.contentType = "panel";
		}
		
		function InitializeEditForm()
		{
			$("#itemHighlighting").click(function() {
	  			var fEnableHighlighting = $("#itemHighlighting").attr("checked");
	  			if (!fEnableHighlighting)
	  			{
					RemoveAllHighlighting();
	  			}
	  			return true;
			});
			
			$("#btnCreateNewOutline, #btnNewOutline_Edit").click(function(event) {
				// load a blank outline
				removeAnyRowSelectionAndOptions("#exampleTable", "outlineRowSelected", "outlineSelectedOptions");
				var	docToLoad = createBlankOutline("chiasm");
				loadJSONToOutline(docToLoad);
				$("#tabsMain").tabs('select',"#EditView");
				
				return false;
			});
			
			$("#btnBulkEditOutline").click(function(event) {
				LoadOutlineToBulkEditBox();
				$("#btnBulkCancel").click(function(event) {
					LoadOutlineFromCurrentState();
					return false;
				});
				return false;
			});
			
			$("#btnApplyHead_Edit").click(function(event)
			{
				ApplyOutlineHeadChanges();
				return publishOutlineToReadOnlyViews();
			});
			
			$("#btnApplyCitation_Cite").click(function(event)
			{
				applyCitationToOutline();
				return publishOutlineToReadOnlyViews();
			});
			
			$("#chiasmAutoLabelingOn, #chiasmAutoLabelingOff").click(function(event){
				
				$(".autoLabelingState").removeClass("autoLabelingState");
				$(this).addClass("autoLabelingState");
				adjustAutoLabeling();			
			});
			
			$("#cbPanelHasHeaders").click(function() {
	  			var fPanelHasHeaders = $("#cbPanelHasHeaders").attr("checked");
	  			if (fPanelHasHeaders)
	  				mainOutline.head.contentParams["header"] = true;
				else
					mainOutline.head.contentParams["header"] = false;
				LoadAllViewsFromCurrentObj();
	  			return true;
			});
			
			$("#edit-outline-contentType").change(onChangeOutlineContentType);
			
			$("#edit-outline-editControl").change(function() {
	  			return LoadOutlineFromCurrentState();  		
			});
		}
		
		function ApplyOutlineHeadChanges()
		{
			mainOutline.head.ScriptureRange = $("#edit-chiasm-scriptureRange").val();
			mainOutline.head.title = $("#edit-title-chiasm").val();
			ApplyOutlineContentType();			
		}
		
	function showTab(event, ui)
	{
		//get the index from URL hash
      	var tabSelect = ui.tab.hash;
		if (tabSelect == "#Cite")
		{
			$("#save-outline-title").text(AorB(mainOutline.head.title, "") );
			$("#save-outline-scriptureRange").text(AorB(mainOutline.head.ScriptureRange, ""));
		}
	}
	
	function stageOutlineToSave()
	{
		if (mainOutline)
		{
			var authorRows = getDbRows();
			var authorProfile = collectProfileDocs("personProfile", authorRows, matchAuthorByCurrentOutline, true);
			stageSelectedAuthorProfile(authorProfile, true);
			var submitterProfile = collectProfileDocs("personProfile", authorRows, matchSubmitterByCurrentOutline, true);
			stageSelectedSubmitterProfile(submitterProfile, true);				
			//LoadPersonProfileSearchResultsFromOutline(authorProfile, submitterProfile);
			var sourceProfile = fetchSourceProfile(mainOutline._id + "_source");
			stageSelectedSourceProfile(sourceProfile);
		}
	}

	function publishOutlineToReadOnlyViews()
	{
		JSONToPreviewPanel();
		if (mainOutline.head.contentType == "chiasm")
		{
			applyCitationMarkup(mainOutline, publishContentToPreviewTabs);
		}
		else if (mainOutline.head.contentType == "outline")
		{
			applyCitationMarkup(mainOutline, publishContentToPreviewTabs);
		}
		else if (mainOutline.head.contentType == "panel")
		{
			applyCitationMarkup(mainOutline, publishContentToPreviewTabs);
		}
		refreshScriptureTagging();		
	}
	
	function JSONToPreviewPanel() {
		$("#tableViewAAB tr").remove();
		$("#chiasm-flat").addClass("chiasm");
		$(".chiasm div").remove();
		$(".chiasm ol").remove();  // outline
		$("#chiasm-flat").removeClass("chiasm");
		
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
			$("#chiasm-flat").addClass("chiasm");
		}
		else if (mainOutline.head.contentType == "outline")
		{
			PublishOutlineViewItems(mainOutline.body.concepts, "#chiasm-" + "indent");
			var result = generateHierarchicalFlat(mainOutline);
			$("#chiasm-flat").append(result.html);			
		}
		else if (mainOutline.head.contentType == "panel")
		{
			var result = generatePanelIndent(mainOutline);
			$("#chiasm-indent").append(result.html);
			$("#chiasm-indent div").click(highlightItem);
			
			var result = generatePanelFlat(mainOutline);
			$("#chiasm-flat").append(result.html);
			$("#chiasm-flat div").click(highlightItem);
			$("#chiasm-flat").addClass("chiasm");
		}
	}
	
	function LoadAllViewsFromCurrentObj(doCreateEditBoxes)
	{
	    /*
		 * edit views
		 */
		if (doCreateEditBoxes)
		{
			$("#editChiasmBody div").remove();
			$("#outline div").remove();
		}
			
		/*
		 * header edit boxes
		 */		
	    InitializeHeaderInputBoxes();
		//mainOutline.body.concepts.splice(0, mainOutline.body.concepts.length);
	    // search for chiasm to determine how many text boxes we need to display
		// Display in pairs: AA' BB' C
		if (doCreateEditBoxes)
			doCreateEditBoxes(mainOutline.body.concepts);
		refreshAllLabels();
		publishOutlineToReadOnlyViews();
	}
	
	function importFromTextBoxToCurrentChiasm(textBoxId)
	{
		var fStripCounting = $("#stripCounting").attr("checked");
		var abaArray = trimChiasm(textBoxId, fStripCounting);
		loadABAListToCurrentChiasm(abaArray);
		//alert("import" + mainOutline.body.concepts.length);
		LoadAllViewsFromCurrentObj(createdEditBoxesForConcepts);
	}
	