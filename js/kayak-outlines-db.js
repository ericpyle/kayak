﻿/**
 * @author Pyle
 */

			/*
			dbMain.get('all', 
      			function(resp) {
      				getResponse = resp;
      				exampleRows = getResponse.rows;
		        	// TODO: normalize '_id' vs 'id'
		        	//alert("get: records" + resp.rows.length); // +  ", hello:" + resp.hello);		        	
		      	});

			db.put('sample-record', { hello: 'world' }, 
				function(resp) {
					putResponse = resp;
	        		// TODO: normalize '_id' vs 'id'
	        		alert("put: " + resp._id);
      			});
      		db.get('sample-record', 
      			function(resp) {
      				getResponse = resp;
		        	// TODO: normalize '_id' vs 'id'
		        	alert("get: " + resp._id +  ", hello:" + resp.hello);		        	
		      	});
		      	*/

		var putResponse;
		var getResponse;
		var dbMain;
		var exampleRows;
		function LoadPersonsAndAuthoredOutlines()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{
				alert("here already?");
				LoadExamplesToTableCallback(getResponse);				
	      		//LoadAuthorResultsCallback(getResponse);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		}
		
		function loadDataSet(fNeedRenderToPage)
		{
			if (dbMain)
			{
				//_design/personProfiles/_view/personsAndOutlinesAuthored
				dbMain.get('_design/everything/_view/byDocId', 
		      			function(resp) {
		      				getResponse = resp;
		      				//$("body").data("personsAndOutlinesAuthored", getResponse);
		      				
		      				if (fNeedRenderToPage)
		      				{
			      				LoadExamplesToTableCallback(getResponse);
		      					//LoadAuthorResultsCallback(getResponse);	
		      				}		      				
				      	});
			}
			/* DEBUG ONLY */
			else 
			{
				if (!getResponse)
					getResponse = authorsAndOutlinesResponse;
				if (fNeedRenderToPage)
				{
					LoadExamplesToTableCallback(getResponse);
	      			//LoadAuthorResultsCallback(getResponse);
				}								
			}
		}
		
		function LoadExamplesToTable()
		{
			if (dbMain)
			// _design/outlines/_view/all
			dbMain.get('_design/everything/_view/byDocId', 
	      			function(resp) {
	      				LoadExamplesToTableCallback(resp);
			      	});
		}
		
		function LoadExamplesToTableCallback(resp)
		{
			var dataTable1 = $("#exampleTable").data("dataTable");
			dataTable1.fnClearTable(false);
			exampleRows = resp.rows;
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc || (doc.head.contentType != "chiasm" && doc.head.contentType != "outline"))
					continue;
				var authorProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				doc.head.author && rowDoc._id == doc.head.author.guid )
						    		return true;
						    	return false;
						}, true );
  				var submitterProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				doc.head.submittedBy && rowDoc._id == doc.head.submittedBy.guid )
						    		return true;
						    	return false;
						}, true );
				
				var dataTable1 = $("#exampleTable").data("dataTable");
				var iSettings = dataTable1.fnAddData(
					[	
						formatBCVRange(doc.head.bcvRange, "") + "<br/>" + doc.head.contentType, 
						doc.head.title,
						formatName(authorProfile, ""), 
						formatSource(doc, ""), 
						formatSubmissionTimestamp(doc.head.submissionTimestamp), 
						formatName(submitterProfile, "")],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.addClass("exampleRow")
					.attr("id", exampleRows[i].id)
					.click(function(event) 
					{
						selectOutlineRow($(this)); 
		  				return false;
					});
				dataTable1.fnDraw();
			};			
		}
		
		function fetchOutline(rowId)
		{
			for(var irow=0; irow<exampleRows.length; ++irow)
			{
				if (exampleRows[irow].id == rowId)
				{
					return exampleRows[irow].value;
				}
			}
			return null;
		}
		
		function selectOutlineRow(outlineRow)
		{
			var rowId = $(outlineRow).attr("id");
			var hadSelection = $(outlineRow).hasClass("outlineRowSelected");
			$(".outlineRowSelected").removeClass("outlineRowSelected");
			$("#outlineSelectedOptions").remove();
			var docToLoad; 
			if (!hadSelection)
			{
				// load the selected outline
				$(outlineRow).addClass("outlineRowSelected");
				//alert(rowId);									
				docToLoad = fetchOutline(rowId);
			} 
			else
			{
				// load a blank outline
				docToLoad = createBlankOutline("chiasm");
			}
			
			if ($(outlineRow).hasClass("outlineRowSelected"))
			{
				var editText = "Edit Outline";
				var rowHtml = "";
				var editLink = '<a href="#" id="btnJumpToEditTab">'+ editText +'</a>';
				rowHtml = '<tr id="outlineSelectedOptions" class="selectedRowOptions"><td colspan="6"><button id="btnJumpToViewTab" type="button">View</button> ' + editLink + '</td></tr>';
				// add some extra options
				$(outlineRow).after(rowHtml);
				$("#btnJumpToViewTab").click(function(event){
					$("#tabsMain").tabs('select',"#View");
					return false;
				});
				$("#btnJumpToEditTab").click(function(event){
					$("#tabsMain").tabs('select',"#EditView");
					return false;
				});
			}
			
			if (docToLoad)
				loadJSONToOutline(docToLoad);
		}
		
		function formatBCVRange(range, sdefault)
		{
			if (!range || range.length == 0)
				return sdefault;
			return range[0] + " " + range[1] + 
				(range.length > 2 ? ":" + range[2] : "") +
				(range.length > 4 ? "-" + (range[3] != range[0] ? range[3] + " " : "") + range[4]: "") +
				(range.length > 5 ? ":" + range[5]: ""); 
		}
		
		function formatSource(outline, sdefault)
		{
			var sourceProfile = fetchSourceProfile(outline._id + "_source");
			return formatCombinedSource(sourceProfile, sdefault);
		}
		
		/*
		 * Formats a structure holding information about common source info and outline specific info
		 */
		function formatCombinedSource(profile, sdefault)
		{
			if (!profile)
				return sdefault;
			
			/*
			"_id" : "",
			"outline" : 
			{
				"_id" : "",
				"source" : 
				{
					"details" : "",
					"website" : ""
				}
			},
			"source" : 
			{
				"_id" : "",
				"media" : "",
				"details" : "",
				"website" : "",
				"publisherDetails" : ""
			}
			*/
			var source = (EmptyIfNull(profile.source.details) + 
				(profile.outline && profile.outline.source && profile.outline.source.details ? 
					", " + EmptyIfNull(profile.outline.source.details) : "" ));
			if (source.length == 0)
				return sdefault;
			else
				return source;
		}
		
		function formatName(personProfile, sdefault, fNameOnly)
		{
			if (!personProfile)
				return sdefault;
			var title = AorB(personProfile.name.title, "");
			var first = AorB(personProfile.name.first, "");
			var middle = AorB(personProfile.name.middle, "");
			var last = AorB(personProfile.name.last, "");
			var first2 = (first.length > 0 ? ((title.length > 0 ? " " : "") + first) : "");
			var middle2 = (middle.length > 0 ? ((first2.length > 0 ? " " : "") + middle) : "");
			var combined1 = title + first2 + middle2; 
			var last2 = (last.length > 0 ? ((combined1.length > 0 ? " " : "") + last) : "");
			return title + first2 + middle2 + last2 +
				(!fNameOnly && personProfile.organization && personProfile.organization.name ? ", " + personProfile.organization.name : "");
		}
		
		function formatSubmissionTimestamp(timestamp)
		{
			if (!timestamp)
				return "";
			return timestamp[1] + "/" + timestamp[2] + "/" + timestamp[0];
		}
		
		var authorColumns = function(doc, key)
		{
			if (!doc || !key)
				return "";
				
			if (doc.name)
			switch (key)
			{
				case "name.title":
					return EmptyIfNull(doc.name.title);
				case "name.first":
					return EmptyIfNull(doc.name.first);
				case "name.middle":
					return EmptyIfNull(doc.name.middle);
				case "name.last":
					return EmptyIfNull(doc.name.last);
				case "name.suffix":
					return EmptyIfNull(doc.name.suffix);
			}

			if (doc.organization)
			switch (key)
			{
				case "organization.name":
					return EmptyIfNull(doc.organization.name);
				case "organization.website":
					return EmptyIfNull(doc.organization.website);
			}
			return "";		
		}
		
		var authorRows;
		function LoadAuthorResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{				
	      		LoadAuthorResultsCallback(getResponse);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		}
		
		/*
		 * return the fields and keywords matched.
		 */
		function QueryByAuthorMatches(personProfile, keywords)
		{
			var matches = {};
			if (!personProfile || personProfile.head.contentType != "personProfile")
				return matches;
			for (i in keywords)
			{
				var keyword = keywords[i];
				// skip whitespace
				if (keyword.length == 0)
					continue;
				lookupAuthorKeyword(personProfile, "name.title", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.first", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.middle", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.last", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.suffix", matches, keyword);
				lookupAuthorKeyword(personProfile, "organization.name", matches, keyword);
				lookupAuthorKeyword(personProfile, "organization.website", matches, keyword);				
			}
			return matches;
		}
		
		function lookupAuthorKeyword(personProfile, key, matches, keyword)
		{
			if (authorColumns(personProfile, key).toLowerCase().indexOf(keyword.toLowerCase()) != -1)
			{
					if (!matches[key])
						matches[key] = [keyword];
					else
						matches[key].push(keyword);
			}
		}
		
		function LoadNewProfileForm()
		{
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (editMode == "save-outline-submitter")
			{
				LoadNewSubmitterForm();
			}
			else if (editMode == "save-outline-author")
			{
				LoadNewAuthorForm();
			}
			else if (editMode == "save-outline-source")
			{
				$("#sourceSearchResults").hide();
				$("#sourceHeading").text("Enter Source Details");				
				var emptyProfile = CreateEmptySourceFormData()
				var sourceEditMode = $("#sourceDetailBlock").data("edit-mode");
				if (sourceEditMode == "editCommon")
				{
					$("#sourceOutlineDetails").hide();
				}
				else
				{
					$("#sourceOutlineDetails").show();
				}

				$("[name='updateSourceDetails']").populate(emptyProfile);
				$("#sourceDetailBlock").attr("style", "background: #white;");	
			}

		}
		
		function LoadNewAuthorForm()
		{	
			$("#authorResults").hide();
			$("#authorHeading").text("Enter Author Details");
			$("#authorDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewAuthorSearchResults()
		{
			var dataTable1 = $("#authorResults").data("dataTable");
			dataTable1.fnClearTable(false);
			SwitchToAuthorProfileSearchResults();
		}
		
		function SwitchToAuthorProfileSearchResults()
		{
			ClearSubmitterResults();
			ClearSourceResults();
			
			$("#authorResults").show();
			$("#authorHeading").text("Search Results");
		}
		
		function ClearSubmitterResults()
		{
			$("#submitterProfileResults").hide();
			var dataTable1 = $("#submitterProfileResults").data("dataTable");
			dataTable1.fnClearTable(false);
			$("#authorDetailBlock").hide();
		}
		
		function LoadNewSubmitterForm()
		{
			$("#submitterProfileResults").hide();
			$("#submitterHeading").text("Enter Submitter Details");
			$("#authorDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewSubmitterSearchResults()
		{
			var dataTable1 = $("#submitterProfileResults").data("dataTable");
			dataTable1.fnClearTable(false);
			SwitchToSubmitterProfileSearchResults();
		}
		
		function SwitchToSubmitterProfileSearchResults()
		{
			ClearAuthorResults();
			ClearSourceResults();
			
			$("#submitterProfileResults").show();
			$("#submitterHeading").text("Search Results");
		}
		
		function ClearAuthorResults()
		{
			$("#authorDetailBlock").hide();
			$("#authorResults").hide();
			var dataTable1 = $("#authorResults").data("dataTable");
			dataTable1.fnClearTable(true);
		}
		
		function PrepareNewSourceSearchResults()
		{
			var dataTable1 = $("#sourceSearchResults").data("dataTable");
			dataTable1.fnClearTable(false);
			SwitchToSourceProfileSearchResults();
		}
		
		function SwitchToSourceProfileSearchResults()
		{
			ClearAuthorResults();
			ClearSubmitterResults();
			$("#sourceDetailBlock").hide();
			$("#sourceSearchResults").show();
			$("#sourceHeading").text("Search Results");
		}
		
		function ClearSourceResults()
		{
			$("#sourceDetailBlock").hide();
			$(".sourceSearchResults").hide();
			var dataTable1 = $("#sourceSearchResults").data("dataTable");
			dataTable1.fnClearTable(true);
		}
		
		/*
		 * Use this instead of Object.keys().length == 0, since that isn't 
		 * compatible with Opera or Blackbery browser.
		 */
		function hasKeys(obj) {
			if (!obj)
				return false;
		
		    for(var prop in obj) {
		        // hasOwnProperty check is important because 
		        // we don't want to count properties on the prototype chain
		        // such as "get", "put", "size", or others.
		        if(obj.hasOwnProperty(prop)) {
		            return true;
		        }
		    }
		
		    return false;
		};
		
		function matchByNewAuthorFormFields(doc)
		{
			var personProfile = $("[name='updateAuthorProfile']").getJSON();
			if (doc.name.first ==  personProfile.name.first && 
				doc.name.last == personProfile.name.last &&
				EmptyIfNull(doc.name.middle) == personProfile.name.middle &&
				EmptyIfNull(doc.name.suffix) ==  personProfile.name.suffix &&
				(!doc.name.title ? personProfile.name.title == "(Title)" :  personProfile.name.title ) &&
				(!doc.organization ? personProfile.organization.name.length == 0 && personProfile.organization.website.length == 0 :
					(EmptyIfNull(doc.organization.name) == personProfile.organization.name &&
					EmptyIfNull(doc.organization.website) == personProfile.organization.website)))				
			{
				return true;	
			}
			return false;
		}
		
		function removeMalformedWords(list)
		{
			var wellformed = [];
			for (var i=0; i < list.length; i++) {
			  var word = list[i];
			  if (word.length == 0 || word.search(/[a-zA-Z]/) == -1)
			  	continue;
			  wellformed.push(word);
			};
			return wellformed;
		}
		
		function matchByAuthorKeywords(doc)
		{
			//var keywords = removeMalformedWords($("#authorResults_filter input").val().split(" "));
			return matchByKeywords(doc, null, QueryByAuthorMatches);
		}
		
		function matchBySubmitterKeywords(doc)
		{
			//var keywords = removeMalformedWords($("#submitterProfileResults_filter input").val().split(" "));
			return matchByKeywords(doc, null, QueryByAuthorMatches);
		}
		
		function matchBySourceKeywords(doc)
		{
			//var keywords = removeMalformedWords($("#sourceSearchResults_filter input").val().split(" "));
			return matchByKeywords(doc, null, QueryByAuthorMatches);
		}
		
		function matchByKeywords(doc, keywords, query)
		{
			if (keywords && keywords.length > 0)
			{
				var matches = query(doc, keywords);
				if (!hasKeys(matches))
					return false;
			}
			return true;
		}
		
		function collectProfileDocs(matchContentType, authorRows, matchesCondition, fFindFirstOnly)
		{
			var profileDocs = [];
			if (matchContentType == "personProfile" && !authorRows)
				authorRows = getResponse.rows;
			for (var i=0; i < authorRows.length; ++i) {
				var doc = authorRows[i].value;
				if (doc && doc.head.contentType == matchContentType)
				{
					if (!matchesCondition(doc))
						continue;
					if (fFindFirstOnly)
						return doc;
					profileDocs.push(doc);
				}
			}
			if (fFindFirstOnly)
				return null;
			return profileDocs;
		}

		function DocsAuthored(personProfile, authorRows)
		{
			var authoredDocs = [];
			for (var i=0; i < authorRows.length; i++) {
				var doc = authorRows[i].value;
				if (doc && doc._id != personProfile._id)
					continue;
				// now get the docs authored by this person.
				var countAuthored = 0;
				for (var inext=0; inext < authorRows.length; inext++) {					
					var nextDoc = authorRows[inext].value;
					if (nextDoc && (nextDoc.head.contentType == "chiasm" || nextDoc.head.contentType == "outline" ) && 
						nextDoc.head.author && nextDoc.head.author.guid == personProfile._id)
						authoredDocs.push(nextDoc);
					else
						continue;
				};
			};
			return authoredDocs;
		}
		
		function DocsSubmitted(personProfile, authorRows)
		{
			var submittedDocs = [];
			for (var i=0; i < authorRows.length; i++) {
				var doc = authorRows[i].value;
				if (doc && doc.head && doc.head.submittedBy && 
					doc.head.submittedBy.guid == personProfile._id)
				{
					submittedDocs.push(doc);							
				}
			};
			return submittedDocs;
		}
		
		/*
		 * Utility
		 */
		function jq(myid) { 
   			return '#' + myid.replace(/(:|\.)/g,'\\$1');
 		}

		function LoadAuthorResultsCallback(resp, fSubmitter)
		{
			//alert("loadAuthorResultsCallback");
			// first clear current results
			if (fSubmitter)
			{
				PrepareNewSubmitterSearchResults();
			}
			else
			{
				PrepareNewAuthorSearchResults();
			}
			authorRows = resp.rows;
			var peopleDocs = [];
			try {
			 	peopleDocs = collectProfileDocs("personProfile", authorRows, 
			 		fSubmitter ? matchBySubmitterKeywords : matchByAuthorKeywords);
			}
			catch (err)
			{
				alert("caught error ("+ err.name +"): " + err.message);
			}
			
			//alert(peopleDocs.length);
			peopleDocs.sort(sortByFirstName);
			for (var idoc=0; idoc < peopleDocs.length; ++idoc)
			{
				var profile = peopleDocs[idoc];
				
				var dataTable1 = $(fSubmitter ? "#submitterProfileResults" : "#authorResults").data("dataTable");
				var iSettings = dataTable1.fnAddData(
					[	authorColumns(profile, "name.title"), 
						authorColumns(profile, "name.first"), 
						authorColumns(profile, "name.middle"), 
						authorColumns(profile, "name.last"), 
						authorColumns(profile, "name.suffix"), 
						authorColumns(profile, "organization.name") + "<br/>" + authorColumns(profile, "organization.website"),
						fSubmitter ? DocsSubmitted(profile, authorRows).length : DocsAuthored(profile, authorRows).length],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.attr("id", profile._id)
					.addClass("creditRow")
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow, fetchPersonProfile, "[name='updateAuthorProfile']");
		  				return false;
					});
				
				// Add some special markup
				var cells = $(drow.nTr).children("td");
				var cellOrg = $(cells)[5];
				var txtCell = $(cellOrg).html();
				$((cells)[0]).addClass("personName");
				$((cells)[1]).addClass("personName");
				$((cells)[2]).addClass("personName");
				$((cells)[3]).addClass("personName");
				$((cells)[4]).addClass("personName");
				dataTable1.fnDraw();
			}
		};
		
		function fetchPersonProfile(idProfile)
		{
			var authorProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
				if (rowDoc._id == idProfile)
			    		return true;
			    	return false;
			}, true );
			return authorProfile;
		}
		
		function fetchSourceProfile(idProfile)
		{
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc)
					continue;
				var guid = idProfile.substring(0, idProfile.length - "_source".length);
				if (doc._id != guid)
					continue;
				if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline")
				{
					//alert(JSON.stringify(doc));
					// create a profile
					var sourceFormFields = CreateEmptySourceFormData();
					sourceFormFields._id = guid;
					sourceFormFields.outline._id = guid;
					if (doc.head.source){
						sourceFormFields.outline.source.details = EmptyIfNull(doc.head.source.details);					
						sourceFormFields.outline.source.website = EmptyIfNull(doc.head.source.website);
					}
					// get source profile
					var commonSourceProfile = getCommonSourceProfile(doc, exampleRows);
					fillCommonSourceData(sourceFormFields, commonSourceProfile);
					//if (doc.head.source)
					//	alert(doc.head.source.guid + JSON.stringify(sourceFormFields));
					return sourceFormFields;
				}
				if (doc.head.contentType == "sourceProfile")
				{
					//alert(JSON.stringify(doc));
					// create a profile
					var sourceFormFields = CreateEmptySourceFormData();
					sourceFormFields._id = guid;
					// get source profile
					fillCommonSourceData(sourceFormFields, doc);
					//if (doc.head.source)
					//	alert(doc.head.source.guid + JSON.stringify(sourceFormFields));
					return sourceFormFields;					
				}
			}
			return null;
		}
		
		function fillCommonSourceData(sourceFormFields, commonSourceProfile)
		{
			if (commonSourceProfile)
			{
				sourceFormFields.source._id = commonSourceProfile._id;
				sourceFormFields.source.media = EmptyIfNull(commonSourceProfile.media);
				sourceFormFields.source.details = EmptyIfNull(commonSourceProfile.details);
				sourceFormFields.source.website = EmptyIfNull(commonSourceProfile.website);
				sourceFormFields.source.publisherDetails = EmptyIfNull(commonSourceProfile.publisherDetails);
			}
			return sourceFormFields;
		}
		
		function CreateEmptySourceFormData()
		{
			return { 
						"_id" : "",
						"outline" : 
						{
							"_id" : "",
							"source" : 
							{
								"details" : "",
								"website" : ""
							}
						},
						"source" : 
						{
							"_id" : "",
							"media" : "",
							"details" : "",
							"website" : "",
							"publisherDetails" : ""
						}
				};
		}
		
		function removeAllRowSelections()
		{
			$(".creditRowSelected").removeClass("creditRowSelected");
			// remove extra options
			$("#creditRowSelectedOptions").remove();

		}
		
		function selectCreditRow(creditRow, fetchProfile, formSelector)
		{
			var hadSelection = $(creditRow).hasClass("creditRowSelected");
			removeAllRowSelections();
			if (!hadSelection)
				$(creditRow).addClass("creditRowSelected");
			if ($(creditRow).hasClass("creditRowSelected"))
			{
				var editMode = $("#save-outline-credits").data("edit-mode");
				var editModeText = "Edit Profile";
				var editModeId = "editProfile";
				var rowHtml = "";
				if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
				{
					var editLink = '<a href="#" id="'+ editModeId +'">'+ editModeText +'</a>';
					rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="7"><button id="btnCreditOk" type="button">OK</button> ' + editLink + '</td></tr>';
					
				}
				else if (editMode == "save-outline-source")
				{
					var idProfile = $(".creditRowSelected").attr("id");
					var profile = fetchProfile(idProfile);
					//alert(JSON.stringify(profile));
					editModeId = "editCommon";
					editModeText = "Edit Common";
					// need to restrict editing outline to specific outline
					if (profile._id == mainOutline._id || profile._id == "newOutlineStub")
					{
						editModeId = "editProfile";
						editModeText = "Edit Common + Specific";
					}
					var editLink = '<a href="#" id="'+ editModeId +'">'+ editModeText +'</a>';
					var copyLink = '<a id="copyToNewProfile" href="#">Copy to New</a>';
					if (idProfile == "56e905abc996fa0a1b824d411800044e_source")
						rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="3"><button id="btnCreditOk" type="button">OK</button></td></tr>';
					else
						rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="3"><button id="btnCreditOk" type="button">OK</button> ' + editLink  + " | " + copyLink + '</td></tr>';						
				}
				// add some extra options
				$(creditRow).after(rowHtml);							
				$("#editProfile, #copyToNewProfile, #editCommon").click(function(event){
					// show search
					var idProfile = $(".creditRowSelected").attr("id");
					var editMode = event.target.id;
					loadEditForm(idProfile, fetchProfile, editMode, formSelector);
					return false;
				});

				$("#btnCreditOk").click(function(event){
					var idProfile = $(".creditRowSelected").attr("id");
					var profile = fetchProfile(idProfile);
					var editMode = $("#save-outline-credits").data("edit-mode");
					if (editMode == "save-outline-author"){
						stageSelectedAuthorProfile(profile);
						$("#authorSpecification").hide();
					}
					if (editMode == "save-outline-submitter"){
						stageSelectedSubmitterProfile(profile);
						$("#submitterSpecification").hide();
					}
					if (editMode == "save-outline-source"){
						stageSelectedSourceProfile(profile);
						$("#sourceSpecification").hide();
					}
					return false;
				});				
			}
		}
		
		function loadEditForm(idProfile, fetchProfile, editMode, formSelector)
		{
			var profile = fetchProfile(idProfile);
			// TODO: change to "formSelector"
			$(formSelector).data("profile-original", profile);
			$(formSelector).data("edit-mode", editMode);
			//alert(idProfile);
			LoadNewProfileForm();
			if (profile){
				$(formSelector).populate(profile);
				$(formSelector).find("textarea").each( function(index) 
					{
						FitToContent(this,'','100');
					});
			}
		}
				
		function sortByLastName(a,b){
			var lastNameA = authorColumns(a, "name.last");
			var lastNameB = authorColumns(b, "name.last");
			if (lastNameA == lastNameB)
				return sortByFirstName(a,b); 
		    return lastNameA.toLowerCase() > lastNameB.toLowerCase() ? 1 : -1;  
		};
		
		function sortByFirstName(a,b){
			var nameA = authorColumns(a, "name.first");
			var nameB = authorColumns(b, "name.first");
			if (nameA == nameB)
			{
				if (authorColumns(a, "name.last") != authorColumns(b, "name.last"))
					return sortByLastName(a,b);
				else
					return 0;
			}
				
		    return nameA.toLowerCase() > nameB.toLowerCase() ? 1 : -1;  
		};
		
		function LoadSubmitterResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{	
	      		LoadAuthorResultsCallback(getResponse, true);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		};
		
		function LoadSourceResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{	
	      		LoadSourceResultsCallback(getResponse);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		};
		
		function getCommonSourceProfile(doc, sourceRows)
		{
			var sourceDoc = collectProfileDocs("sourceProfile", sourceRows, 
		 		function(rowDoc){
					if (rowDoc.head.contentType == "sourceProfile" && 
						doc.head.source && rowDoc._id == doc.head.source.guid )
						{
							return true;
						}				    		
				    	return false;
				}, true );
			return sourceDoc;
		}
		
		function findOutlinesAndUnreferencedSources(rows)
		{
			var profiles = [];
			var sourceGuids = [];
			var sources = [];
			for (var i=0; i < rows.length; ++i) {
				var doc = rows[i].value;
				if (!doc)
					continue;
				if (doc.head.contentType == "chiasm" || 
					doc.head.contentType == "outline")
				{
					profiles.push(doc);
					if (doc.head.source && doc.head.source.guid)
					{
						sourceGuids[doc.head.source.guid] = true;	
					}
				}
				if (doc.head.contentType == "sourceProfile")
				{
					sources.push(doc);
				}
			}
			for (var isource=0; isource < sources.length; ++isource)
			{
				var source = sources[isource];
				if (!sourceGuids[source._id])
				{
					profiles.push(source);
				}
			}
			return profiles;			
		}
		
		function fetchAuthorProfileByOutline(outlineDoc)
		{
			return collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				outlineDoc.head.author && rowDoc._id == outlineDoc.head.author.guid)
						    		return true;
						    	return false;
						}, true );
		}
		
		function LoadSourceResultsCallback(resp)
		{
			PrepareNewSourceSearchResults();
			if (!exampleRows)
				exampleRows = resp.rows;
			// TODO: factor in the search keywords here
			// but for now just show all
			// TODO: Add sort as well
			var profiles = findOutlinesAndUnreferencedSources(exampleRows);
			for (var i=0; i < profiles.length; ++i) {
				var doc = profiles[i];
				var authorDetails = "";
				var sourceDetails = "";
				var rowId = "";
				if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline")
				{
					var authorProfile = fetchAuthorProfileByOutline(doc);
					authorDetails = formatName(authorProfile, "");
					sourceDetails = formatSource(doc, "");
					rowId = doc._id;
				}
				if (doc.head.contentType == "sourceProfile")
				{
					// this is unreferenced source, so it doesn't have any associated outline details
					var sourceFormFields = CreateEmptySourceFormData();
					var combinedSource = fillCommonSourceData(sourceFormFields, doc);				
					rowId = combinedSource.source._id; 
					sourceDetails = formatCombinedSource(combinedSource, "");
				}
				// TODO: add source rows not referenced in document, findOutlinesAndUnreferencedSources
				
				// TODO: use "resp.rows" for sourceRows
				//var sourceDoc = getCommonSourceProfile(doc, sourceRows);
				
				// skip blank source
				if (sourceDetails.length == 0)
					continue;
				var dataTable1 = $("#sourceSearchResults").data("dataTable");
				var profile = fetchSourceProfile(doc._id + "_source");
				var iSettings = dataTable1.fnAddData(
					[	EmptyIfNull(profile.source.details), 
						EmptyIfNull(profile.outline.source.details), 
						authorDetails ],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.attr("id", rowId + "_source")
					.addClass("creditRow")
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow, fetchSourceProfile, "[name='updateSourceDetails']");
		  				return false;
					});
				
				// Add some special markup
				var cells = $(drow.nTr).children("td");				
				$((cells)[0]).addClass("sourceDetails");
				$((cells)[1]).addClass("sourceDetails");
				dataTable1.fnDraw();
			};
		}
		
	function injectSearchButton(idDtFilter, idbtnSearch, placeholder)
	{
		
		$(jq(idDtFilter + ' label input')).appendTo(jq(idDtFilter));
		if (placeholder)
			$(jq(idDtFilter + ' input')).attr("placeholder", placeholder);
	    $(jq(idDtFilter + '  label')).remove();
	    $(jq(idDtFilter)).append('<br/><button id="'+ idbtnSearch +'" type="button">Search</button>')
	    $(jq(idbtnSearch)).click(function(event)
	    {
	    	var btn = event.target;
	    	$(btn).siblings(".dataTables_filter input").keyup();
	    	return false;
	    });
	}
	
	function initializeTable(idTable, tableOptions, idSearchButton, txtPlaceholder)
	{
		var dataTable1 = $(jq(idTable)).dataTable(tableOptions);
		injectSearchButton(idTable + "_filter", idSearchButton, txtPlaceholder);
		$(jq(idTable)).data("dataTable", dataTable1);

	}
	
		function InitializeDbStuff()
	{
		// /_design/outlines/_view
		// /_design/personalProfiles/_view
		$("#submitterIsAuthor").click(function(event) {
			var fSubmitterIsAuthor = $("#submitterIsAuthor").attr("checked");
			if (fSubmitterIsAuthor)
			{
				var submitterProfile = $("#save-outline-submitter").data('profile-submitter');
		    	if (submitterProfile)
		    		stageSelectedAuthorProfile(submitterProfile, true);
			    else
			    {
    			    var authorProfile = $("#save-outline-author").data('profile-author');
				    if (authorProfile)
				    	stageSelectedSubmitterProfile(authorProfile, true);	
			    }
			} 
			return true;
		});
		
		$("#btnCreateNewAuthor, #btnCreateNewSubmitter, #btnCreateNewSource").click(function(event) {
								$("#sourceDetailBlock").data("edit-mode", "editProfile");
								LoadNewProfileForm();
				  				return false;
							});
									
		$("#sourceDetailBlock div textarea").keyup(function(event) 
					{											
  						FitToContent(event.target,'','100');
					});
					
		$("#btnClearSourceOutlineDetails").click(function(event) 
		{
			// load current form data into JSON
			var sourceDetails = $("[name='updateSourceDetails']").getJSON();
			//alert(JSON.stringify(sourceDetails));
			sourceDetails.outline.source.details = "";
			sourceDetails.outline.source.website = "";
			// write back to the form
			$("[name='updateSourceDetails']").populate(sourceDetails);
			// run fit to content.
			$("[name='updateSourceDetails']").find("textarea").each( function(index) 
							{
								FitToContent(this,'','100');
							});
			return false;
		});
		
		$("#btnSubmitterSearch").click(function(event) {
						LoadSubmitterResults();
		  				return false;
					});
		$("#btnClearSubmitterSearch").click(function(event) {
						$("#submitterSearch").val("");
						LoadSubmitterResults();
		  				return false;
					});


		$("#btnClearSourceSearch").click(function(event) {
						$("#sourceSearch").val("");
						LoadSourceResults();
		  				return false;
					});
				
		$("#btnPublishOutline").click(publishOutline);
		
		$("#save-outline-author").click(function(event){
			$("#save-outline-credits").data("edit-mode", "save-outline-author");
			// show search
			var stagedProfile = $("#save-outline-author").data("profile-author");
			switchToSearchResultsOnProfile(stagedProfile);
			$("#submitterSpecification").hide();
			$("#sourceSpecification").hide();
			$("#authorSpecification").show();
			return false;
		});
		
		$("#save-outline-submitter").click(function(event){
			$("#save-outline-credits").data("edit-mode", "save-outline-submitter");
			// show search
			var stagedProfile = $("#save-outline-submitter").data("profile-submitter");
			switchToSearchResultsOnProfile(stagedProfile);
			$("#authorSpecification").hide();
			$("#sourceSpecification").hide();
			$("#submitterSpecification").show();
			return false;
		});
		$("#save-outline-source").click(function(event){
			$("#save-outline-credits").data("edit-mode", "save-outline-source");
			// show search
			var stagedProfile = $("#save-outline-source").data("profile-source");
			switchToSearchResultsOnProfile(stagedProfile);
			$("#submitterSpecification").hide();
			$("#authorSpecification").hide();
			$("#sourceSpecification").show();
			return false;
		});
		
		$("#btnAuthorCancel").click(function(event) {
			$("#authorSpecification").hide();
			ClearEditMode();
			return false;
		});
		
		$("#btnAuthorOk").click(function(event) {
			var selectedRow = $(".creditRowSelected");
			var profile = getSelectedPersonProfile(selectedRow);
			stageSelectedAuthorProfile(profile);
			//alert("btnAuthorOk : "+ profile.name.middle);
			$("#authorSpecification").hide();
			return false;
		});
		
		$("#btnSubmitterOk").click(function(event) {
			var selectedRow = $(".creditRowSelected");
			var profile = getSelectedPersonProfile(selectedRow);
			stageSelectedSubmitterProfile(profile);
			$("#submitterSpecification").hide();
			return false;
		});
		$("#btnSourceOk").click(function(event) {
			var selectedRow = $(".creditRowSelected");
			var profile = getSelectedSourceProfile(selectedRow);
			stageSelectedSourceProfile(profile);
			$("#sourceSpecification").hide();
			return false;
		});
		
		$("#btnAuthoredWithKayak").click(function(event)
		{
			stageKayakAsSource();
			return false;
		});
		
		$("#btnAuthoredWithKayak").parent("td").parent("tr").find("a").click(function(event) {
			stageKayakAsSource();
			return false;
		});
		
		function stageKayakAsSource()
		{
			var profile = fetchSourceProfile("56e905abc996fa0a1b824d411800044e_source");
			stageSelectedSourceProfile(profile);
			$("#sourceSpecification").hide();
		}
		
		$("#btnSubmitterCancel").click(function(event) {
			$("#submitterSpecification").hide();
			ClearEditMode();
			return false;
		});
		
		$("#btnSourceCancel").click(function(event) {
			$("#sourceSpecification").hide();
			ClearEditMode();
			return false;
		});
		
		function ClearEditMode()
		{
			$("#save-outline-credits").data("edit-mode", "");
		}
		
		function getSelectedPersonProfile(selectedRow)
		{
			if (selectedRow && selectedRow.length != 0)
			{
				var personProfileId = $(selectedRow).attr("id");		
				return collectProfileDocs("personProfile", authorRows, function(rowDoc){
						if (rowDoc._id == personProfileId)
					    		return true;
					    	return false;
					}, true );
			}
			return null;
		}
		
		function getSelectedSourceProfile(selectedRow)
		{
			if (selectedRow && selectedRow.length != 0)
			{
				var sourceProfileId = $(selectedRow).attr("id");
				var sourceProfile = fetchSourceProfile(sourceProfileId);		
				return sourceProfile;
			}
			return null;
		}
		
		$("#btnCancelSubmitAuthor").click(function(event) {
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (editMode == "save-outline-author")
				SwitchToAuthorProfileSearchResults();
			else if (editMode == "save-outline-submitter")
				SwitchToSubmitterProfileSearchResults();
			//var profile = $(jq(editMode)).data("profile-" + (editMode == "save-outline-author" ? "author" : "submitter"));
			//switchToSearchResultsOnProfile(profile);
			return false;
		});
		
		$("#btnCancelSubmitSource").click(function(event) {
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (editMode == "save-outline-author")
				SwitchToAuthorProfileSearchResults();
			else if (editMode == "save-outline-submitter")
				SwitchToSubmitterProfileSearchResults();
			else if (editMode == "save-outline-source")
				SwitchToSourceProfileSearchResults();
			//var profile = $(jq(editMode)).data("profile-" + (editMode == "save-outline-author" ? "author" : "submitter"));
			//switchToSearchResultsOnProfile(profile);
			return false;
		});
		
		$("#btnSubmitSource").click(function(event) {
			
			return false;
		});
		
		$("#btnSubmitAuthor").click(submitAuthor);
		
		$("#btnSubmitSource").click(submitSource);

		LoadPersonsAndAuthoredOutlines();
	}
	
		function createTimeStampArray(dateNow)
	{
		var sdate = stringifyDateNow(dateNow);
		var time = sdate.split("T")[1];
		return [dateNow.getFullYear(), dateNow.getMonth() + 1, dateNow.getDate(), 
				time];
	}
	
	function setOrReset(stagedProfile, objToSetOrReset, propertyToSet, setFunc)
	{
		if (!stagedProfile || !stagedProfile._id || stagedProfile._id.length == 0)
		{
			if (objToSetOrReset[propertyToSet])
				delete objToSetOrReset[propertyToSet];
		}
		else
		{
			if (!objToSetOrReset[propertyToSet])
				objToSetOrReset[propertyToSet] = {};
			setFunc(objToSetOrReset, propertyToSet, stagedProfile);
		}
	}
	
	function publishOutline(event)
	{


		// disable clicking of publishing outline until
		// at minimum, the following has been specified:
		// 1) An outline with more than 0 concepts
		// or 2) Author Specified
		// or 3) Source Specified
		// or 4) Submitter Specified
		var authorProfileStaged = $("#save-outline-author").data('profile-author');
		var submitterProfileStaged = $("#save-outline-submitter").data('profile-submitter');
		var sourceStaged = $("#save-outline-source").data('profile-source');
		var fIsNewOutline = !mainOutline._id;			
		var fCanPublish = (mainOutline.body.concepts.length > 0 || 
			authorProfileStaged && authorProfileStaged._id ||
			submitterProfileStaged && submitterProfileStaged._id ||
			sourceStaged && sourceStaged._id);
		if (!fCanPublish)
		{			
			alert("Cannot publish an empty outline without specifying author, source, or submitter");
			return false;
		}
	
		// next see if any changes need to be made
		setOrReset(authorProfileStaged, mainOutline.head, "author", function(objToSetOrReset, propertyToSet, stagedProfile) 
		{
			objToSetOrReset[propertyToSet].guid = stagedProfile._id;
		});			
		setOrReset(submitterProfileStaged, mainOutline.head, "submittedBy", function(objToSetOrReset, propertyToSet, stagedProfile) 
		{
			objToSetOrReset[propertyToSet].guid = stagedProfile._id;
		});
		// we want to save the guid of the common outline, not our outline.
		setOrReset(sourceStaged, mainOutline.head, "source", function(objToSetOrReset, propertyToSet, stagedProfile) 
		{
			objToSetOrReset[propertyToSet] = stagedProfile.outline.source;
			objToSetOrReset[propertyToSet].guid = stagedProfile.source._id;
		});

		var mainOutlineJSON_current = JSON.stringify(mainOutline);
		var mainOutlineJSON_orig = $("body").data("mainOutlineJSON-orig");
		if (!fIsNewOutline && mainOutlineJSON_current == mainOutlineJSON_orig)
		{
			alert("No changes have been made that need to be saved.")
			return false;	
		}
		
		else
		{
			$(this).unbind(event);
			/* NOTE: need to fill in the following
			
				"submissionTimestamp": [\
					2011,\
					6,\
					6,\
					"10:30:00.000Z"\
			// bcvRange
			// authorShortname				
			
			**/
			
			var dateNow = new Date();
			if (fIsNewOutline)
			{
				var suffix = "";
				if (mainOutline.head.contentType == "chiasm")
					suffix = ":oc";
				else if (mainOutline.head.contentType == "outline")
					suffix = ":oh";
				var newId = createIDFromDateNow(dateNow, suffix);
				mainOutline._id = newId;
				mainOutline.head.submissionTimestamp = createTimeStampArray(dateNow);
			}
			else
			{
				// detect if any data has changed.
				mainOutline.head.modifiedTimestamp = createTimeStampArray(dateNow);
			}
			if (authorProfileStaged)
			{
				var authorProfile = authorProfileStaged;
				mainOutline.head.author.authorShortname = 
					authorProfile.name.first[0].toLowerCase() + 
					EmptyIfNull(EmptyIfNull(authorProfile.name.middle)[0]).toLowerCase() + 
					authorProfile.name.last.toLowerCase();
			}
			
			if (dbMain)
			{
				dbMain.put(mainOutline._id, mainOutline, function(resp) {
			        alert("Remember to check for ok: " + JSON.stringify(resp));
			        loadDataSet(true);
			        selectOutlineRow(jq(mainOutline._id));
					$("#btnPublishOutline").click(publishOutline);
			    });
			}					
		    else // DEBUG
		    {
		    	
		    	var rowId = mainOutline._id;
		    	var newRow = {"id" : rowId, "key" : [rowId, 1], "value" : mainOutline};
		    	if (!replaceRow(getResponse.rows, newRow.id, newRow))
		    	{
		    		getResponse.rows.push(newRow);
		    		getResponse.total_rows += 1;
		    	}			    	
		    	
		    	loadDataSet(true);
		    	selectOutlineRow(jq(mainOutline._id));
		 		$(this).click(publishOutline);   	
		    }
				
		}
		alert("Changes have been published");
		return false;
	}

	
	/*
	 * Return date Now in the format of "2012-05-06T12:41:44.546Z" (24chars)
	 */
	function stringifyDateNow(dateNow)
	{
		if (!dateNow)
			dateNow = new Date();
		var sdate = JSON.stringify(dateNow);
		return sdate.substr(1, sdate.length - 2);
	}
	
	/*
	 * "kyk:2012-05-06T12:41:44.546Z" (28 chars) . (p[rofile] s[ource] p[erson]) (o[utline] c[hiasm], h[ierchical])
	 */
	function createIDFromDateNow(dateNow, suffix)
	{
		if (!dateNow)
			dateNow = new Date();
		var newId = stringifyDateNow(dateNow);
		newId = "kyk:" + newId + EmptyIfNull(suffix);
		return newId;
	}
	
	function submitSource(event)
	{
		$(this).unbind(event); // TODO: use on/off
		
		var profileOriginal =  $("#sourceDetailBlock").data("profile-original");
	    var editMode = $("#sourceDetailBlock").data("edit-mode"); // editProfile / editCommon / copyToNewProfile
	    var updatedProfile = $("[name='updateSourceDetails']").getJSON();
	    //alert(JSON.stringify(updatedProfile));
	    if (editMode == "editProfile" || editMode == "editCommon")
	    {
	    	if (dbMain){
				// dbMain.put(personProfile._id, personProfile, function(resp) {		       
			    // });
		    }
		    else  // Debug
		    {	
		    	// first save any changes to the common source details.
		    	var commonSourceId = "";
		    	if (profileOriginal.source._id.length > 0)
		    	{
		    		commonSourceId = profileOriginal.source._id;
		    		var newRow = {"id" : commonSourceId, "key" : [commonSourceId, 0], "value" : clone(updatedProfile.source) };
		    		newRow.value["head"] = { "contentType": "sourceProfile" };
		    		//alert(JSON.stringify(newRow));
		    		replaceRow(exampleRows, commonSourceId, newRow, true);
		    	}
		    	if (editMode == "editProfile" && profileOriginal.outline._id.length > 0)
		    	{
		    		if (commonSourceId.length > 0)
		    			updatedProfile.outline.source["guid"] = commonSourceId;

		    		graftSource(exampleRows, profileOriginal.outline._id, updatedProfile.outline.source);
		    	}
		    	updateStagedProfilesIfNeeded(updatedProfile);
		    	switchToSearchResultsOnProfile(updatedProfile);
		    }	
	    }
	    else if (editMode == "copyToNewProfile")
	    {
	    	var profileSwitchTo = clone(updatedProfile);
	    	var newGuid = "";
	    	if (updatedProfile.source.details.length > 0 || 
	    		updatedProfile.source.website.length > 0 || 
	    		updatedProfile.source.publisherDetails.length > 0 ||
	    		updatedProfile.source.media.length > 0)
	    	{
	    		if (updatedProfile.source.details != profileOriginal.source.details || 
	    			updatedProfile.source.website != profileOriginal.source.website ||
	    			updatedProfile.source.publisherDetails != profileOriginal.source.publisherDetails ||
	    			updatedProfile.source.media != profileOriginal.source.media)
    			{
    				// something has changed, so create a new common
			    	newGuid = createIDFromDateNow();
			    	var newRow = {"id" : newGuid, "key" : [newGuid, 0], "value" : clone(updatedProfile.source) };
			        newRow.value._id = newGuid;
		    		newRow.value["head"] = { "contentType": "sourceProfile" };				
		    		// replace authorRow with new profile
		    		exampleRows.splice(0, 0, newRow);
	    		}
	    		else
	    		{
	    			newGuid = updatedProfile.source._id;
	    		}
	    		profileSwitchTo._id = newGuid;
    		}
    		
    		var outlineSource = updatedProfile.outline.source;
    		if (outlineSource.details.length > 0 ||
    			outlineSource.website.length > 0)
	    	{		    		
	    		var newOutlineSource = clone(outlineSource);
	    		if (newGuid.length > 0)
	    			newOutlineSource["guid"] = newGuid;
	    		
	    		var guidNewOutlineStub = "newOutlineStub";
	    		var newOutlineStub;
	    		if (!findAndDo(exampleRows, guidNewOutlineStub, function(rows, indexFound) { 
	    				newOutlineStub = rows[indexFound].value;
	    			}))
				{
					newOutlineStub = createBlankOutline();
	    			newOutlineStub._id = guidNewOutlineStub;
	    			var newRow = {"id" : guidNewOutlineStub, "key" : [guidNewOutlineStub, 0], "value" : newOutlineStub };
	    			exampleRows.splice(0, 0, newRow);
				}
		
				//alert(JSON.stringify(outlineSource));
				newOutlineStub.head.source = newOutlineSource;
				profileSwitchTo._id = guidNewOutlineStub;
	    	}
		    updateStagedProfilesIfNeeded(profileSwitchTo);
		    switchToSearchResultsOnProfile(profileSwitchTo);
	    }
		
		$(this).click(submitSource);
		return false;
		
	}
	
	function submitAuthor(event)
	{
		// TODO: replace with on/off?
		$(this).unbind(event);
		// first do some checking (don't create blank profile)
		// submit new profile
		var personProfile = $("[name='updateAuthorProfile']").getJSON();
		//alert(JSON.stringify(personProfile));	
		if (personProfile.name.first.length == 0)
		{
			alert("Form requires First name");
			return false;
		}
		if (personProfile.name.last.length == 0)
		{
			alert("Form requires Last name");
			return false;
		}

		// use a timestamp as the guid.
		
		
		personProfile.head = {"contentType" : "personProfile"};
		
		// only add interesting title. Not the default.fpu
		if (personProfile.name.title == "(Title)")
		{
			personProfile.name.title = "";
		}

		var queryResults = $("[name='updateAuthorProfile']").find("[name='_id']");
		var personProfileId = queryResults ? queryResults[0].value : null;
		var fIsNewProfile = !personProfileId || personProfileId.length == 0;
		//alert(personProfileId);
		if (fIsNewProfile)
		{
			// check that identical entry doesn't exist already
			var matchingDoc = collectProfileDocs("personProfile", authorRows, matchByNewAuthorFormFields, true);
			if (matchingDoc)
			{
				alert("Warning: A matching person profile already exists.");
			}
			
			var newId = createIDFromDateNow();
			// add head information
			personProfile._id = newId;
		}
		else
		{
			var matchingDocs = collectProfileDocs("personProfile", authorRows, matchByNewAuthorFormFields, false);
			if (matchingDocs.length > 0)
			{
				for (var i=0; i < matchingDocs.length; i++) {
				  if (matchingDocs[i]._id == personProfileId)
				  	switchToSearchResultsOnProfile(personProfile);
				  	$(this).click(submitAuthor);
				  	return true; // no changes.
				};
				alert("Warning: A matching person profile already exists.");
			}
			var personProfileRev = $("[name='updateAuthorProfile']").find("[name='_rev']");
			
			// verify some overlap in profiles?
			/*
			var oldProfile = collectProfileDocs("personProfile", authorRows, function(rowDoc){
					if (rowDoc._id == personProfileId)
				    		return true;
				    	return false;
				}, true );
			*/
			
			// verify that record with this Id/Rev matches some information?
			// Make sure the record in memory matches this Rev.
		}
		
		// now post to server.
		//alert(JSON.stringify(personProfile));
		if (dbMain)
			dbMain.put(personProfile._id, personProfile, function(resp) {
		        alert("Remember to check for ok: " + JSON.stringify(resp));
		        // update selected author if it matches
		        updateStagedProfilesIfNeeded(personProfile);
		        loadDataSet(false);
				// now load results
				switchToSearchResultsOnProfile(personProfile);
				$("#btnSubmitAuthor").click(submitAuthor);
		    });
	    else  // Debug
	    {
	    	updateStagedProfilesIfNeeded(personProfile);
	    	var newRow = {"id" : personProfile._id, "key" : [personProfile._id, 0], "value" : personProfile};				
	    	if (fIsNewProfile)
	    	{

				//alert(JSON.stringify(newRow));					
				// append to our getResponse until we can replace it with the server response
				getResponse.total_rows += 1;
				getResponse.rows.push(newRow);
	    	}
	    	else
	    	{
	    		// replace authorRow with new profile
	    		replaceRow(authorRows, personProfile._id, newRow);
	    	}
	    	switchToSearchResultsOnProfile(personProfile);
	    }
	    $(this).click(submitAuthor);
		//alert("btnSubmitAuthor : "+ profile.name.middle);
		return false;
	}
	
	function replaceRow(rows, targetId, newRow)
	{

		return findAndDo(rows, targetId, function(rows, indexToReplace)
		{
			rows.splice(indexToReplace, 1, newRow);
		});
	}
	
	function graftSource(rows, targetId, outlineSource)
	{

		findAndDo(rows, targetId, function(rows, indexToReplace)
		{
			var outline = rows[indexToReplace].value;
			
			//alert(JSON.stringify(outlineSource));
			outline.head.source = outlineSource;
			//alert(JSON.stringify(outline));
		});
	}
	
	function findAndDo(rows, targetId, doSomething)
	{
		var indexToReplace = -1;
		for (var i=0; i < rows.length; i++) {
		  	if (rows[i].value._id == targetId)
		  	{
		  		indexToReplace = i;
		  		break;
		  	}
		};
		if (indexToReplace >= 0)
		{
			doSomething(rows, indexToReplace);
			return true;
		}
		return false;
	}
	
	function stageSelectedAuthorProfile(profile, fIgnoreSubmitterIsAuthor)
	{
		$("#save-outline-author")
			.text(formatName(profile, "Click to specify"))
			.data('profile-author', profile);
		var fSubmitterIsAuthor = $("#submitterIsAuthor").attr("checked");
		if (fSubmitterIsAuthor && !fIgnoreSubmitterIsAuthor)
		{
			$("#save-outline-submitter")
				.text(formatName(profile, "Click to specify"))
				.data('profile-submitter', profile);
		}
		//alert("stageSelected : "+ profile.name.middle);	
	}
	
	function stageSelectedSubmitterProfile(profile, fIgnoreSubmitterIsAuthor)
	{
		$("#save-outline-submitter")
			.text(formatName(profile, "Click to specify"))
			.data('profile-submitter', profile);
		var fSubmitterIsAuthor = $("#submitterIsAuthor").attr("checked");
		if (fSubmitterIsAuthor && !fIgnoreSubmitterIsAuthor)
		{
			$("#save-outline-author")
				.text(formatName(profile, "Click to specify"))
				.data('profile-author', profile);
		}
		//alert("stageSelected : "+ profile.name.middle);	
	}
	
	function stageSelectedSourceProfile(profile)
	{
		$("#save-outline-source")
			.text(formatCombinedSource(profile, "Click to specify"))
			.data('profile-source', profile);	
	}
	
	function updateStagedProfilesIfNeeded(profile)
	{
		var authorProfileStaged = $("#save-outline-author").data('profile-author');
        if (authorProfileStaged && authorProfileStaged._id == profile._id)
        {
        	stageSelectedAuthorProfile(profile, true);
        }
        var submitterProfileStaged = $("#save-outline-submitter").data('profile-submitter');
        if (submitterProfileStaged && submitterProfileStaged._id == profile._id)
        {
        	stageSelectedSubmitterProfile(profile, true);
        }
        var sourceProfileStaged = $("#save-outline-source").data('profile-source');
        if (sourceProfileStaged && sourceProfileStaged._id == profile._id)
        {
        	stageSelectedSourceProfile(profile);
        }
	}
		
	function switchToSearchResultsOnProfile(profile)
	{
					// create new search string based on updated profile
			var keywords = "";
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (profile)
			{
				if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
				{
					keywords = convertToKeywordString(
						[profile.name.first,
						profile.name.middle,
						profile.name.last]);
					if (profile.organization)
					{
						var keywords2 = convertToKeywordString( 
							[profile.organization.name,
							profile.organization.website]);
						keywords += " " + keywords2;
					}
				}
				else
				{
					keywords = convertToKeywordString(
						[profile.source.details,
						profile.source.website,
						profile.outline.source.details,
						profile.outline.source.website]);
				}
				// TODO: calculate keywords for sources
			}			
			if (editMode == "save-outline-submitter")
			{
				$("#submitterProfileResults_filter input").val(keywords);
			} 
			else if (editMode == "save-outline-author")
			{
				$("#authorResults_filter input").val(keywords);
			}
			else if (editMode == "save-outline-source")
			{
				$("#sourceSearchResults_filter input").val(keywords);
				LoadSourceResultsCallback(getResponse);
				if (profile)
				{
					var parentRow = $(jq(profile._id + "_source"));
					selectCreditRow(parentRow, fetchSourceProfile, "[name='updateSourceDetails']");
				}
			}

			if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
			{
				LoadAuthorResultsCallback(getResponse, editMode == "save-outline-submitter");
				// now highlight the new row.
				if (profile)
				{
					var parentRow = $(jq(profile._id));
					selectCreditRow(parentRow, fetchPersonProfile, "[name='updateAuthorProfile']");
				}
				$("[name='updateAuthorProfile']").find("[name='_id']").val(""); // reset id, to make sure we don't accidentally use an old id.
				$("[name='updateAuthorProfile']").find("[name='_rev']").val("");
			}
		
	}
	
	function convertToKeywordString(list)
	{
		var keywords = "";
		for (var i=0; i < list.length; i++) {
			var word = list[i];
		   if (word && word.search(/[a-zA-Z]/) != -1)
		   {
		   		if (i > 0)
		   			keywords += " ";
		   		keywords += word;
		   }

		};
		return keywords;
	}		

/**
 * JSON.stringify(mainOutline, null, '\t')
 * Find \n Replace: \\\n
 */
var authorsAndOutlinesResponse = {
	"total_rows": 16,
	"offset": 0,
	"rows": [
		{
			"id": "56e905abc996fa0a1b824d411800044e",
			"key": [ "56e905abc996fa0a1b824d411800044e", 0 ],
			"value" : 
			{
				"_id": "56e905abc996fa0a1b824d411800044e",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "website",
				"details": "kayak",
				"website": "ericlovesallison.org/BibleTools/kayak",
				"publisherDetails" : ""
			}
		},
		{
			"id": "56e905abc996fa0a1b824d4118000762",
			"key": [ "56e905abc996fa0a1b824d4118000762", 0 ],
			"value" : 
			{
				"_id": "56e905abc996fa0a1b824d4118000762",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "book",
				"details": "Covenant Sequence In Leviticus and Deuteronomy",
				"website": "",
				"publisherDetails" : ""
			}
		},
		{
			"id": "56e905abc996fa0a1b824d4118000c10",
			"key": [ "56e905abc996fa0a1b824d4118000c10", 0 ],
			"value" :
			{
				"_id": "56e905abc996fa0a1b824d4118000c10",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "website",
				"details": "Biblical Horizons",
				"website": "http://www.biblicalhorizons.com",
				"publisherDetails" : ""
			}
		},
		{
			"id": "56e905abc996fa0a1b824d41180014e4",
			"key": [ "56e905abc996fa0a1b824d41180014e4", 0 ],
			"value" :
			{
				"_id": "56e905abc996fa0a1b824d41180014e4",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "class",
				"details": "Redeemer Seminary, Greek Class",
				"website": "http://www.redeemerseminary.org",
				"publisherDetails" : ""
			}
		},
		{
			"id": "56e905abc996fa0a1b824d41180018ba",
			"key": [ "56e905abc996fa0a1b824d41180018ba", 0 ],
			"value" :
			{
				"_id": "56e905abc996fa0a1b824d41180018ba",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "email",
				"details": "Biblical Horizons Yahoogroup",
				"website": "",
				"publisherDetails" : ""
			}
		},
		{
			"id": "56e905abc996fa0a1b824d4118002410",
			"key": [ "56e905abc996fa0a1b824d4118002410", 0 ],
			"value" :
			{
				"_id": "56e905abc996fa0a1b824d4118002410",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "book",
				"details": "Not yet referenced",
				"website": "",
				"publisherDetails" : ""
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48000d42",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48000d42",
				"_rev": "1-5398f44a2a0cac6af8806f9cee16bcc9",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"first": "James",
					"last": "Jordan",
					"middle": "B."
				},
				"organization": {
					"name": "Biblical Horizons",
					"website": "http://www.biblicalhorizons.com/"
				},
				"urls": [
					"http://www.facebook.com/pages/James-B-Jordan/120290590930"
				]
			}
		},
		{
			"id": "17d028b6aebef1b207d226613300290b",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				1,
				"jbjordan"
			],
			"value": {
				"_id": "17d028b6aebef1b207d226613300290b",
				"_rev": "16-98f02b889f27179807a232c07b1fc4af",
				"head": {
					"submissionTimestamp": [
						2011,
						6,
						6,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Matt",
						1,
						1,
						"Matt",
						28,
						20
					],
					"authorShortname": "jbjordan",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000d42",
						"shortname": "jbjordan"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968"
					},
					"source": {
						"guid": "56e905abc996fa0a1b824d4118000c10",
						"details": "#94, Apr 1997",
						"website": "http://www.biblicalhorizons.com/biblical-horizons/no-94-toward-a-chiastic-understanding-of-the-gospel-according-to-matthew-part-1/"
					},
					"title": "",
					"ScriptureRange": "Matthew 1:1-28:20",
					"contentType": "chiasm"
				},
				"body": {
					"concepts": [
						{
							"content": "Genealogy (past), 1:1-17"
						},
						{
							"content": "First Mary and Jesus’ birth, 1:18-25"
						},
						{
							"content": "Gifts of wealth at birth, 2:1-12"
						},
						{
							"content": "Descent into Egypt; murder of children, 2:13-21"
						},
						{
							"content": "Judea avoided, 2:22-23"
						},
						{
							"content": "Baptism of Jesus, 3:1–8:23"
						},
						{
							"content": "Crossing the sea, 8:24–11:1"
						},
						{
							"content": "John’s ministry, 11:2-19"
						},
						{
							"content": "Rejection of Jesus, 11:20-24"
						},
						{
							"content": "Gifts for the new children, 11:25-30"
						},
						{
							"content": "Attack of Pharisees, 12:1-13"
						},
						{
							"content": "Pharisees determine to kill the innocent Servant, 12:14-21"
						},
						{
							"content": "Condemnation of Pharisees, 12:22-45"
						},
						{
							"content": "Gifts for the new children, 13:1-52"
						},
						{
							"content": "Rejection of Jesus, 13:53-58"
						},
						{
							"content": "John’s death, 14:1-12"
						},
						{
							"content": "Crossing the sea, 14:13–16:12"
						},
						{
							"content": "Transfiguration of Jesus, 16:13–18:35"
						},
						{
							"content": "Judean ministry, 19:1–20:34"
						},
						{
							"content": "Ascent into Jerusalem; judgment on Jews, 21:1–27:56"
						},
						{
							"content": "Gift of wealth at death, 27:57-66"
						},
						{
							"content": "Last Marys and Jesus’ resurrection, 28:1-15"
						},
						{
							"content": "Commission (future), 28:16-20"
						}
					]
				}
			}
		},
		{
			"id": "17d028b6aebef1b207d2266133003419",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				1,
				"jbjordan"
			],
			"value": {
				"_id": "17d028b6aebef1b207d2266133003419",
				"_rev": "14-cce370309bbe943ceb0c29f428597319",
				"head": {
					"submissionTimestamp": [
						2011,
						10,
						18,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Deut",
						1,
						1,
						"Deut",
						34,
						12
					],
					"authorShortname": "jbjordan",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000d42"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968"
					},
					"source": {
						"guid": "56e905abc996fa0a1b824d4118000762",
						"details": "p. 57"
					},
					"title": "Covenant/Re-creation Pattern",
					"ScriptureRange": "Deuteronomy 1:1-34:12",
					"contentType": "outline"
				},
				"body": {
					"concepts": [
						{
							"content": "Taking Hold – Transcendence – Initiation, 1:1-5"
						},
						{
							"content": "Historical Overview – Breakdown and Renewal of Order, 1:6-4:43"
						},
						{
							"content": "Stipulations – Given with view to the coming Distribution of the Land, 4:44-26:19"
						},
						{
							"content": "Sanctions – Witnesses, 27-30"
						},
						{
							"content": "Succession – Rest – Enhancements– Continuity, 31-34."
						}
					]
				}
			}
		},
		{
			"id": "17d028b6aebef1b207d226613300400c",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				1,
				"jbjordan"
			],
			"value": {
				"_id": "17d028b6aebef1b207d226613300400c",
				"_rev": "9-13b471f95678883c86d252e44b6a8f47",
				"head": {
					"submissionTimestamp": [
						2011,
						10,
						20,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Deut",
						1,
						6,
						"Deut",
						4,
						43
					],
					"authorShortname": "jbjordan",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000d42"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968"
					},
					"source": {
						"guid": "56e905abc996fa0a1b824d4118000762",
						"details": "p. 59"
					},
					"title": "Covenant Breakdown and Renewal",
					"ScriptureRange": "Deuteronomy 1:6-4:43",
					"contentType": "outline"
				},
				"body": {
					"concepts": [
						{
							"content": "Covenant Breakdown, 1:6-46",
							"concepts": [
								{
									"content": "God initiated covenant, 1:6-8"
								},
								{
									"content": "New socio-political order, 1:9-18"
								},
								{
									"content": "Disobedience to stipulations, rejection of distributed grant, 1:19-33"
								},
								{
									"content": "Judgment: the people to be restructured, 1:34-40"
								},
								{
									"content": "Loss of inheritance, 1:41-46"
								}
							]
						},
						{
							"content": "Covenant Renewal, 2:1-4:40",
							"concepts": [
								{
									"content": "God initiates all actions in 2:1-3:11"
								},
								{
									"content": "Historical prelude to the distribution of the land:",
									"concepts": [
										{
											"content": "Esau, 2:1-8"
										},
										{
											"content": "Moab, 2:9-13 (defeat of giant is condition for inheritance)"
										},
										{
											"content": "Ammon, 2:14-23"
										},
										{
											"content": "Sihon, 2:24-37"
										},
										{
											"content": "Og, 3:1-11 (giant finally defeated)"
										}
									]
								},
								{
									"content": "Distribution of land and accompanying rules, 3:12-4:24"
								},
								{
									"content": "Sanctions, 4:25-31"
								},
								{
									"content": "Continuity: think back and pass it on, 4:32-40"
								}
							]
						},
						{
							"content": "Moses sets up the essential geographical/hierarchical order for the land, 4:41-43"
						}
					]
				}
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48000e6d",
			"key": [
				"4d43cfb36ad257f3746df55c48000e6d",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48000e6d",
				"_rev": "1-233c8cea8c494c7125171a4edcc4d700",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"title": "Prof.",
					"last": "Greene",
					"first": "Elliott",
					"middle": ""
				},
				"organization": {
					"name": "Redeemer Seminary",
					"website": "http://www.redeemerseminary.org/"
				},
				"urls": [
					"http://www.ccef.org/authors/elliott-greene",
					"http://www.redeemerseminary.org/faculty.html"
				]
			}
		},
		{
			"id": "17d028b6aebef1b207d2266133000d6a",
			"key": [
				"4d43cfb36ad257f3746df55c48000e6d",
				1,
				"egreene"
			],
			"value": {
				"_id": "17d028b6aebef1b207d2266133000d6a",
				"_rev": "13-00ea0c1449cb7a0fcd2449675eaef228",
				"head": {
					"submissionTimestamp": [
						2011,
						6,
						6,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Matt",
						7,
						6
					],
					"authorShortname": "egreene",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000e6d"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968"
					},
					"source": {
						"guid": "56e905abc996fa0a1b824d41180014e4",
						"details": "1999"
					},
					"title": "",
					"ScriptureRange": "Matthew 7:6",
					"contentType": "chiasm"
				},
				"body": {
					"concepts": [
						{
							"content": "dogs"
						},
						{
							"content": "pigs"
						},
						{
							"content": "trample under feet"
						},
						{
							"content": "turn and tear to pieces"
						}
					]
				}
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48001cbd",
			"key": [
				"4d43cfb36ad257f3746df55c48001cbd",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48001cbd",
				"_rev": "1-4d2650aed56e9f4eb1b64e141d31cd6c",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"last": "Hilleke",
					"first": "Thomas"
				}
			}
		},
		{
			"id": "17d028b6aebef1b207d2266133001adf",
			"key": [
				"4d43cfb36ad257f3746df55c48001cbd",
				1,
				"thilleke"
			],
			"value": {
				"_id": "17d028b6aebef1b207d2266133001adf",
				"_rev": "15-2fd46c58f48790ddb2ae9800c9e76d24",
				"head": {
					"submissionTimestamp": [
						2011,
						6,
						18,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Jonah",
						1,
						1,
						"Jonah",
						4,
						11
					],
					"authorShortname": "thilleke",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48001cbd"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968"
					},
					"source": {
						"guid": "56e905abc996fa0a1b824d41180018ba"
					},
					"title": "The Names of God in Jonah",
					"contentType": "chiasm",
					"ScriptureRange": "Jonah 1:1-4:11"
				},
				"body": {
					"concepts": [
						{
							"content": "1:1-4, Yahweh deals with Yonah"
						},
						{
							"content": "1:5-8, Elohim, God of water deals with the unconverted Gentiles"
						},
						{
							"content": "1:9, Yonah invokes the name Yahweh Elohim"
						},
						{
							"content": "1:10-17, Yahweh deals with the converted Gentiles and Yonah"
						},
						{
							"content": "2:1, Yonah invokes the name Yahweh Elohim"
						},
						{
							"content": "2:2-6, Yahweh deals with Yonah"
						},
						{
							"content": "2:6, Yonah invokes the name Yahweh Elohim"
						},
						{
							"content": "2:7-3:3, Yahweh deals with Yonah"
						},
						{
							"content": "3:3-4:1, Elohim deals with Gentiles before and after conversion. They do not offer sacrifice and take vows like the salty ones."
						},
						{
							"content": "4:2-5, Yahweh deals with Yonah (Yonah invokes the name El in 4:2 as part of his prayer to Yahweh)"
						},
						{
							"content": "4:6, Yahweh Elohim deals with Yonah"
						},
						{
							"content": "4:7-9, Elohim deals with Yonah"
						},
						{
							"content": "4:10-11, Yahweh deals with Yonah"
						}
					]
				}
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48002968",
			"key": [
				"4d43cfb36ad257f3746df55c48002968",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48002968",
				"_rev": "1-556cb597e4d0c295b339b8aa12f4fc91",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"first": "Eric",
					"last": "Pyle",
					"middle": "Daniel"
				},
				"organization": {
					"name": "Wycliffe Bible Translators",
					"website": "http://www.wycliffe.org"
				},
				"urls": [
					"http://www.facebook.com/eric.d.pyle"
				]
			}
		},
		{
			"id" : "774c87bd5ec2e4afb24a0ce0d1000c9f",
			"key": [
				"774c87bd5ec2e4afb24a0ce0d1000c9f", 2, "chiasm: unspecified author"],
			"value" :
			{
			   "_id": "774c87bd5ec2e4afb24a0ce0d1000c9f",
			   "_rev": "1-ca82b9dc8d4baef5b3ac381196e0b74d",
			   "head": {
			       "submissionTimestamp": [
			           2011,
			           12,
			           28,
			           "10:30:00.000Z"
			       ],
			       "bcvRange": [
			       ],
			       "title": "testing",
			       "ScriptureRange": "",
			       "contentType": "chiasm"
			   },
			   "body": {
			       "concepts": [
			           {
			               "content": "puppies"
			           },
			           {
			               "content": "piglets"
			           },
			           {
			               "content": "squeal"
			           },
			           {
			               "content": "wimper"
			           }
			       ]
			   }
			}
		}
	]
};

