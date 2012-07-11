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
					$("#outlineContainer").empty();
					$("#outlineContainer").append('<div id="outlineBulkEdit"></div>');
					$('#bulkEditABA').contents().clone().appendTo('#outlineBulkEdit');
					loadCurrentChiasmIntoTextBox('tbImport');
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
  				//$("#edit-outline-editControl");
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
  				//$("#edit-outline-editControl");
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
			applyCitationMarkup(mainOutline, publishContentToChiasmView);
		}
		else if (mainOutline.head.contentType == "outline")
		{
			applyCitationMarkup(mainOutline, publishContentToHierachical);
		}
		else if (mainOutline.head.contentType == "panel")
		{
			applyCitationMarkup(mainOutline, publishContentToChiasmView);
		}
		refreshScriptureTagging();		
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
	