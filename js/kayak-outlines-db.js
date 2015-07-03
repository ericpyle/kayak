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
		var dbMain;
		function LoadPersonsAndAuthoredOutlines()
		{
			var getResponse = getDb();
			var fNeedRenderToPage = true;
			if (getResponse)
			{
				LoadExamplesToTableCallback(getResponse.rows);				
	      		//LoadAuthorResultsCallback(getResponse);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		}
		
		function loadDataSet(fNeedRenderToPage, doSomethingAfterLoad)
		{
			var getResponse = null;
			if (dbMain)
			{
				//_design/personProfiles/_view/personsAndOutlinesAuthored
				try
				{
					dbMain.get('_design/everything/_view/byDocId', 
		      			function(resp) {
		      				if (resp)
		      				{
			      				cacheDbInDom(resp);
			      				getResponse = resp;			      				
			      				//$("body").data("personsAndOutlinesAuthored", getResponse);
			      				
			      				if (fNeedRenderToPage)
			      				{
				      				LoadExamplesToTableCallback(getResponse.rows);
				      				InitializeAfterDbSetup();
			      					//LoadAuthorResultsCallback(getResponse);	
			      				}
			      				if (doSomethingAfterLoad)
			      					doSomethingAfterLoad();			      				
			      			}
			      			else
			      			{			      				
			      				alert("error: " + JSON.stringify(resp));
			      			}
			      			
				      	});	
				}
				catch(err)
				{
					alert("error loading database." + JSON.stringify(err));
				}

			}
			else
			//if (!getResponse)
			{	
				getResponse = getDb(true);				
				if (fNeedRenderToPage)
				{					
					LoadExamplesToTableCallback(getResponse.rows);
	      			//LoadAuthorResultsCallback(getResponse);
				}
				if (doSomethingAfterLoad)
  					doSomethingAfterLoad();
			}
		}
		
		function cacheDbInDom(resp)
		{
			$("body").data("getResponse", resp);
			return resp;	
		}
		
		function getDb(fLoadFakeCacheIfMissing)
		{
			var getResponse = $("body").data("getResponse");
			if (fLoadFakeCacheIfMissing && getResponse == null)
			{
				getResponse = cacheDbInDom(authorsAndOutlinesResponse);
				alert("Couldn't download tables from internet. Try refreshing your page. Otherwise your changes will not be saved.");
			}
			return getResponse;
		}
		
		function getDbRows()
		{
			return getDb().rows;
		}

		function getUserFriendlyContentType(contentType) {
		    if (contentType == "outline")
		        return "hierarchical";
		    return contentType;
		}
		
		function LoadExamplesToTableCallback(exampleRows)
		{
			var dataTable1 = $("#exampleTable").data("dataTable");
			dataTable1.fnClearTable(false);
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc || (doc.head.contentType != "chiasm" && doc.head.contentType != "outline" && doc.head.contentType != "panel"))
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
  				var contentType = getUserFriendlyContentType(doc.head.contentType);
				var iSettings = dataTable1.fnAddData(
					[	
						formatScriptureRange(doc.head.ScriptureRange, "") + "<br/>" + "<i>" + contentType + "</i>",
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
			var exampleRows = getDbRows();
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
			if (!outlineRow)
				return false;
			var rowId = $(outlineRow).attr("id");
			var hadSelection = $(outlineRow).hasClass("outlineRowSelected");
			removeOutlineRowSelection(outlineRow);
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
				installOutlineRowOptions(outlineRow);
			
			if (docToLoad)
				loadJSONToOutline(docToLoad);
		}
		
		function installOutlineRowOptions(outlineRow)
		{
			if (!outlineRow)
				return false;
			if ($("#outlineSelectedOptions").length > 0)
				return false;	// already installed
			var editText = "Edit";
			var rowHtml = "";
			var editLink = '<a href="#" id="btnJumpToEditTab">Edit</a>';
			var citeLink = '<a href="#" id="btnJumpToCiteTab">Cite</a>';
			rowHtml = '<tr id="outlineSelectedOptions" class="selectedRowOptions"><td colspan="6"><button id="btnJumpToViewTab" type="button">View</button> ' 
				+ editLink + " | " + citeLink  + '</td></tr>';
			// add some extra options
			$(outlineRow).after(rowHtml);
			$("#btnJumpToViewTab").click(function(event){
				$("#tabsMain").tabs("option", "active", getTabIndex("#View"));
				return false;
			});
			$("#btnJumpToEditTab").click(function(event){
				$("#tabsMain").tabs("option", "active", getTabIndex("#EditView"));
				return false;
			});
			$("#btnJumpToCiteTab").click(function(event){
				$("#tabsMain").tabs("option", "active", getTabIndex("#Cite"));
				return false;
			});
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
		
		function formatScriptureRange(range, sdefault)
		{
			return range;
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
			var commonSource = EmptyIfNull(profile.source.details);			
			var specificSource = 
				profile.outline && profile.outline.source && profile.outline.source.details ? 
					EmptyIfNull(profile.outline.source.details) : "";
			var source = commonSource.length > 0 ? commonSource + (specificSource.length > 0 ? ", " + specificSource : "") : specificSource;
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
			var timeArray = timestamp[3].split(':');
			var dateTime = new Date(timestamp[0], timestamp[1], timestamp[2], timeArray[0], timeArray[1]);
			var timeAMPM = formatAMPM(dateTime);
			return timestamp[1] + "/" + timestamp[2] + "/" + timestamp[0] + " " + timeAMPM;
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
		
		function LoadAuthorResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{				
	      		LoadAuthorResultsCallback(getDbRows());
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
				var emptyProfile = CreateEmptySourceFormData();
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
			$("#personDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewAuthorSearchResults()
		{
			var dataTable1 = $("#authorResults").data("dataTable");
			dataTable1.fnClearTable(true);
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
			dataTable1.fnClearTable(true);
			$("#personDetailBlock").hide();
		}
		
		function LoadNewSubmitterForm()
		{
			$("#submitterProfileResults").hide();
			$("#submitterHeading").text("Enter Submitter Details");
			$("#personDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewSubmitterSearchResults()
		{
			var dataTable1 = $("#submitterProfileResults").data("dataTable");
			dataTable1.fnClearTable(true);
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
			$("#personDetailBlock").hide();
			$("#authorResults").hide();
			var dataTable1 = $("#authorResults").data("dataTable");
			dataTable1.fnClearTable(true);
		}
		
		function PrepareNewSourceSearchResults()
		{
			var dataTable1 = $("#sourceSearchResults").data("dataTable");
			dataTable1.fnClearTable(true);
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
			var personProfile = $("[name='updatePersonProfile']").getJSON();
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
					if (nextDoc && (nextDoc.head.contentType == "chiasm" || nextDoc.head.contentType == "outline" || nextDoc.head.contentType == "panel" ) && 
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
		
		function LoadAuthorResultsCallback(authorRows, fSubmitter)
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
						selectCreditRow(parentRow);
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
			var authorProfile = collectProfileDocs("personProfile", getDbRows(), function(rowDoc){
				if (rowDoc._id == idProfile)
			    		return true;
			    	return false;
			}, true );
			return authorProfile;
		}
		
		function fetchSourceProfile(idProfile)
		{
		    var guid = "";
		    var sourceguid = "";
		    var outlineSourceDetails = "";
		    var components = idProfile.split("_");
		    if (components.length == 2)
		        guid = components[0];
		    else if (components.length == 3) {
		        sourceguid = components[0];
		        outlineSourceDetails = unescape(components[1]);
		    }
			var exampleRows = getDbRows();
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc)
				    continue;
				if (sourceguid == "" && doc._id != guid)
					continue;
				if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline" || doc.head.contentType == "panel")
				{
				    if (sourceguid != ""){
				        if (doc.head.source && doc.head.source.guid == sourceguid && doc.head.source.details == outlineSourceDetails)
				            guid = doc._id;
				        else
				            continue;
				    }
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
				    if (sourceguid != "")
				        continue;
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
		
		function removeOutlineRowSelection(outlineRow)
		{
			removeRowSelectionAndOptions(outlineRow, "outlineRowSelected", "outlineSelectedOptions");
		}
		
		function removeAllCreditRowSelections(creditRow)
		{
			removeRowSelectionAndOptions(creditRow, "creditRowSelected", "creditRowSelectedOptions");
		}
		
		function removeRowSelectionAndOptions(row, classSelectedRow, idOptions)
		{
			$('tr.' + classSelectedRow).removeClass(classSelectedRow);
			var table = $(row).parent("tbody").parent("table"); // could be empty set
			removeAnyRowSelectionAndOptions(table, classSelectedRow, idOptions);
		}
		
		function removeAnyRowSelectionAndOptions(table, classSelectedRow, idOptions)
		{
			if (table == null || $(table)[0] == null || $(table)[0].tagName != "TABLE")
				return;
			var oTable = $(table).data("dataTable");
			if (!oTable)
				return;
			var selectedRow = oTable.$('tr.' + classSelectedRow);
			if (selectedRow)
				selectedRow.removeClass(classSelectedRow);
			// remove extra options
			$(jq(idOptions)).remove();
		}
		
		function installCreditRowOptions(creditRow)
		{
			if ($("#creditRowSelectedOptions").length > 0)
				return false; // already installed
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
				var profile = fetchSourceProfile(idProfile);
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
				if (idProfile == "kyk:1845-12-23T03:22:15.481Z:sr_source")
					rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="3"><button id="btnCreditOk" type="button">OK</button></td></tr>';
				else
					rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="3"><button id="btnCreditOk" type="button">OK</button> ' + editLink  + " | " + copyLink + '</td></tr>';						
			}
			// add some extra options
			$(creditRow).after(rowHtml);
			var fetchProfile;
			var formSelector;
			if (editMode == "save-outline-author" || editMode == "save-outline-submitter"){
				fetchProfile = fetchPersonProfile;
				formSelector = "[name='updatePersonProfile']";
			}
			if (editMode == "save-outline-source"){
				fetchProfile = fetchSourceProfile;
				formSelector = "[name='updateSourceDetails']";
			}
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
		
		function pageToRow(domTableSelector, datatableRowSelector)
		{
			var oTable = $(domTableSelector).data("dataTable");		
			var selectedRow = oTable.$(datatableRowSelector);
			if (TestNoResults(selectedRow))
				return;
			var indexOfSelectedRow = oTable.$('tr').index(selectedRow);
			var oSettings = oTable.fnSettings();
			var targetPage = Math.floor(indexOfSelectedRow/oSettings._iDisplayLength);
			oTable.fnPageChange(targetPage);
			return $(datatableRowSelector);
		}
		
		function TestNoResults(results)
		{
			return !results || results.length == 0;
		}
		
		function selectCreditRow(creditRow)
		{
			if (TestNoResults(creditRow))
				return false;
			var hadSelection = $(creditRow).hasClass("creditRowSelected");
			removeAllCreditRowSelections(creditRow);
			if (!hadSelection)
				$(creditRow).addClass("creditRowSelected");
			if ($(creditRow).hasClass("creditRowSelected"))
			{
				var editMode = $("#save-outline-credits").data("edit-mode");
				installCreditRowOptions(creditRow);				
			}
		}
		
		function loadEditForm(idProfile, fetchProfile, editMode, formSelector)
		{
			var profile = null;
			if (idProfile)
				profile = fetchProfile(idProfile);
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
	      		LoadAuthorResultsCallback(getDbRows(), true);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		};
		
		function LoadSourceResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{	
	      		LoadSourceResultsCallback(getDbRows());
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
					doc.head.contentType == "outline" || 
					doc.head.contentType == "panel" )
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
			var exampleRows = getDbRows();
			return collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				outlineDoc.head.author && rowDoc._id == outlineDoc.head.author.guid)
						    		return true;
						    	return false;
						}, true );
		}
		
		function LoadSourceResultsCallback(exampleRows)
		{
			PrepareNewSourceSearchResults();
			// TODO: factor in the search keywords here
			// but for now just show all
		    // TODO: Add sort as well
			var combinedSourceProfiles = [];
			var profiles = findOutlinesAndUnreferencedSources(exampleRows);
			for (var i=0; i < profiles.length; ++i) {
			    var doc = profiles[i];
			    var sourceDetails = "";
			    if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline" || doc.head.contentType == "panel")
			    {
			        sourceDetails = formatSource(doc, "");
			    }
			    if (doc.head.contentType == "sourceProfile")
			    {
			        // this is unreferenced source, so it doesn't have any associated outline details
			        var sourceFormFields = CreateEmptySourceFormData();
			        var combinedSource = fillCommonSourceData(sourceFormFields, doc);
			        sourceDetails = formatCombinedSource(combinedSource, "");
			    }
			    // TODO: add source rows not referenced in document, findOutlinesAndUnreferencedSources
				
			    // TODO: use "resp.rows" for sourceRows
			    //var sourceDoc = getCommonSourceProfile(doc, sourceRows);
				
			    // skip blank source
			    if (sourceDetails.length == 0)
			        continue;
			    var combinedSourceprofile = fetchSourceProfile(doc._id + "_source");
			    combinedSourceProfiles.push(combinedSourceprofile);
			}

			var mergedSourceProfiles = mergeDuplicateSourceProfiles(combinedSourceProfiles);
			for (var i = 0; i < mergedSourceProfiles.length; ++i) {
			    var profile = mergedSourceProfiles[i];
			    var authorProfilesUsed = {};
			    if (profile.outline._id != "") {
			        if (typeof profile.outline._id == "string") {
			            collectAuthorProfilesUsed(profile.outline._id, authorProfilesUsed);
			        }
			        else {
			            for (var ioutline = 0; ioutline < profile.outline._id.length; ++ioutline) {
			                var outlineId = profile.outline._id[ioutline];
			                collectAuthorProfilesUsed(outlineId, authorProfilesUsed);
			            }
			        }
			    }
			    var authorDetails = combineAuthorsInCell(authorProfilesUsed);
			    var rowId = createSourceRowId(profile);

				var dataTable1 = $("#sourceSearchResults").data("dataTable");
				var iSettings = dataTable1.fnAddData(
					[	EmptyIfNull(profile.source.details), 
						EmptyIfNull(profile.outline.source.details), 
						authorDetails ],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.attr("id", rowId)
					.addClass("creditRow")
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow);
		  				return false;
					});
				
				// Add some special markup
				var cells = $(drow.nTr).children("td");				
				$((cells)[0]).addClass("sourceDetails");
				$((cells)[1]).addClass("sourceDetails");
				dataTable1.fnDraw();
			};
		}

		function collectAuthorProfilesUsed(outlineId, authorProfilesUsed) {
		    var doc = fetchOutline(outlineId);
		    var authorProfile = fetchAuthorProfileByOutline(doc);
		    if (authorProfile != null && !authorProfilesUsed[authorProfile._id])
		        authorProfilesUsed[authorProfile._id] = authorProfile;
		}

		function combineAuthorsInCell(dict) {
		    var authorDetails = "";
		    var authors = [];
		    for (var id in dict) {
		        var authorProfile = dict[id];
		        authors.push(authorProfile);
		    }
		    authors.sort(sortByFirstName);
		    for (i = 0; i < authors.length; i++ ){
                var authorProfile = authors[i];
                var formattedAuthorDetails = formatName(authorProfile, "", true);
                if (i == 3) {
                    authorDetails += "... (" + (authors.length - i) + " more)";
                    break;
                }
		        if (formattedAuthorDetails.length > 0 && authorDetails.length > 0) {
		            authorDetails += "; ";
		        }
		        authorDetails += formattedAuthorDetails;
		    }
		    return authorDetails;
		}

		function mergeDuplicateSourceProfiles(combinedSourceProfiles) {
		    if (combinedSourceProfiles.length <= 1)
		        return combinedSourceProfiles;
		    // first sort them by content
		    var sortedSourceProfiles = combinedSourceProfiles.sort(compareSourceProfileContent);
		    // now see if we can find matching ones.
		    var mergedSourceProfiles = [];
		    var mergedSourceProfile = null;
		    var prevProfile = clone(combinedSourceProfiles[0]);
		    for (var i = 1; i < combinedSourceProfiles.length; i++) {
		        var currentProfile = clone(combinedSourceProfiles[i]);
		        if (compareSourceProfileContent(prevProfile, currentProfile) == 0) {
		            if (mergedSourceProfile != prevProfile) {
		                mergedSourceProfile = prevProfile;
		            }		                
		            if (typeof mergedSourceProfile._id == "string") {
		                mergedSourceProfile._id = [mergedSourceProfile._id, currentProfile._id];
		                mergedSourceProfile.outline._id = mergedSourceProfile._id;
		                if (mergedSourceProfiles.indexOf(mergedSourceProfile) == -1)
		                    mergedSourceProfiles.push(mergedSourceProfile);
		            }
		            else {
		                mergedSourceProfile._id.push(currentProfile._id);
		                mergedSourceProfile.outline._id = mergedSourceProfile._id;
		            }
		            prevProfile = mergedSourceProfile;
		        }
		        else {
		            if (mergedSourceProfiles.indexOf(prevProfile) == -1)
		                mergedSourceProfiles.push(prevProfile);
		            mergedSourceProfiles.push(currentProfile);
		            prevProfile = currentProfile;
		        }
		    }

		    return mergedSourceProfiles;
		}

		function compareSourceProfileContent(a, b) {
		    // remove id fields, and stringify for string compare.
		    var acontent = deleteIdFieldsAndReturnStringifiedContent(a);
		    var bcontent = deleteIdFieldsAndReturnStringifiedContent(b);
		    return acontent.localeCompare(bcontent);
		}

		function deleteIdFieldsAndReturnStringifiedContent(a) {
		    var aclone = clone(a);
		    delete aclone._id;
		    delete aclone.outline._id;
		    //delete aclone.source._id;
		    return JSON.stringify(aclone);
		}

		function createSourceRowId(combinedSourceProfile) {
		    if (typeof combinedSourceProfile._id == "string")
		        return combinedSourceProfile._id + "_source";
		    return combinedSourceProfile.source._id + "_" + escape(combinedSourceProfile.outline.source.details) + "_source";
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
		// NOTE: event functions cannot be cloned, so do them after clone.
		tableOptions["fnDrawCallback"] = function ( oSettings ) {
	           	var outlineRowSelected = $(".outlineRowSelected");
	            if (outlineRowSelected.length > 0)
	            {
	                installOutlineRowOptions(outlineRowSelected);
	            }
	            var creditRowSelected = $(".creditRowSelected");
	            if (creditRowSelected.length > 0)
	            {
	            	installCreditRowOptions(creditRowSelected);
	            }	            
	       };
		var dataTable1 = $(jq(idTable)).dataTable(tableOptions);
		injectSearchButton(idTable + "_filter", idSearchButton, txtPlaceholder);
		$(jq(idTable)).data("dataTable", dataTable1);
	}
	
	function isDbId(testId) {
		return testId && testId.substr(testId.length - 2, testId.length) == "ol" &&
			testId.substr(0, 3) == "kyk";
	}

	function SelectUrlSpecifiedDb()
	{
		var dbId = getDbIdFromUrl($.url());
		if (isDbId(dbId))
		{
			// TODO: verify db id format?
			pageToAndSelectOutline(dbId);
		}
	}
	
	function pageToAndSelectOutline(dbId, goToTabSelector)
	{
		var newRow = pageToRow(jq("exampleTable"), jq(dbId));
		selectOutlineRow(newRow);
		if (!goToTabSelector)
			goToTabSelector = "#View";
		$("#tabsMain").tabs("option", "active", getTabIndex(goToTabSelector));
	}

	function getTabIndex(selector) {
		return $(selector).index() - 1;
	}
	
	function changeUrlToSelectedId(rowId)
	{
		var url = $.url();
		var newHash = "";
		if (rowId)
			newHash = "#/" + rowId; // "#!/blah" google indexing -> ?_escaped_fragment_=/blah
		if (document.location.hash != newHash)
			document.location.hash = newHash;
	}
	
	function InitializeDbStuff()
	{
		LoadPersonsAndAuthoredOutlines();
		
		// /_design/outlines/_view
		// /_design/personalProfiles/_view
		$("#submitterIsAuthor").click(function(event) {
			var fSubmitterIsAuthor = this.checked;
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
								if (event.target.id == "btnCreateNewSource")
								{
									$("#sourceDetailBlock").data("edit-mode", "editProfile");
									loadEditForm(null, null, "editProfile", "[name='updateSourceDetails']");
									return false;	
								}								
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
				
		$("#btnPublishOutline, #btnPublishOutline_Edit").click(publishOutline);
		
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
			var profile = fetchSourceProfile("kyk:1845-12-23T03:22:15.481Z:sr_source");
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
			var authorRows = getDbRows();
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
		
		$("#btnSubmitPersonProfile").click(submitPersonProfile);
		
		$("#btnSubmitSource").click(submitSource);
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
	
	function applyCitationToOutline()
	{
		var authorProfileStaged = $("#save-outline-author").data('profile-author');
		var submitterProfileStaged = $("#save-outline-submitter").data('profile-submitter');
		var sourceStaged = $("#save-outline-source").data('profile-source');
		
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
	}
	
	function publishOutline(event)
	{


		// disable clicking of publishing outline until
		// at minimum, the following has been specified:
		// 1) An outline with more than 0 concepts
		// or 2) Author Specified
		// or 3) Source Specified
		// or 4) Submitter Specified
		ApplyOutlineHeadChanges();
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
		applyCitationToOutline();
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
			if (sourceStaged && sourceStaged.outline && sourceStaged.outline._id == "newOutlineStub")
			{
				var exampleRows = getDbRows(); 
				findAndDo(exampleRows, "newOutlineStub", function(rows, indexFound) {
						rows.splice(indexFound, 1); 
	    				//alert("removed newOutlineStub")
	    		});
				// if guid is newOutlineStub then replace that row
			}

			
			var dateNow = new Date();
			if (fIsNewOutline)
			{
				var newId = createIDFromDate(dateNow, ":ol");
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
					
					if (resp.ok)
			        {
			        	mainOutline["_rev"] = resp.rev;
			        	publishOutlineChangesToTableView(mainOutline);
			        }
			        //alert("Remember to check for ok: " + JSON.stringify(resp));
					$("#btnPublishOutline, #btnPublishOutline_Edit").click(publishOutline);
			    });
			}								
		    else // DEBUG
		    {		    	
		    	publishOutlineChangesToTableView(mainOutline);
		 		$(this).click(publishOutline);   	
		    }
				
		}
		
		return false;
	}

	function publishOutlineChangesToTableView(outline)
	{
		var rowId = outline._id;
    	var newRow = {"id" : rowId, "key" : [rowId, 1], "value" : outline};
    	var getResponse = getDb();
    	if (!replaceRow(getResponse.rows, newRow.id, newRow))
    	{
    		getResponse.rows.push(newRow);
    		getResponse.total_rows += 1;
    	}			    	
    	cacheDbInDom(getResponse);
    	LoadPersonsAndAuthoredOutlines();
    	// clear outline table to prepare for the new row item
		$("#exampleTable_filter input").val("");
		$("#exampleTable_filter input").keyup();
    	var newRowInTable = pageToRow(jq("exampleTable"), jq(outline._id));
    	selectOutlineRow(newRowInTable);
    	alert("Changes have been published");
    	DisplayBooksAndChapters();    	
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
	 * "kyk:2012-05-06T12:41:44.546Z" (28 chars) . (sr [source] ps [person]) (ol [outline])
	 */
	function createIDFromDateNow(suffix)
	{
		return createIDFromDate(null, suffix);
	}
	
	function createIDFromDate(dateNow, suffix)
	{
		if (!dateNow)
			dateNow = new Date();
		var newId = stringifyDateNow(dateNow);
		newId = "kyk:" + newId + EmptyIfNull(suffix);
		return newId;
	}
	
	function publishSourceProfileChangesToTableView(updatedProfile, profileOriginal, dbRows)
	{
		var editMode = $("#sourceDetailBlock").data("edit-mode");
    	var commonSourceId = "";
    	if (editMode == "editProfile" || editMode == "editCommon")    	
    	{
    		if (profileOriginal && profileOriginal.source._id.length > 0)
	    	{
	    		commonSourceId = profileOriginal.source._id;
	    		var newRow = {"id" : commonSourceId, "key" : [commonSourceId, 0], "value" : clone(updatedProfile.source) };
	    		newRow.value["head"] = { "contentType": "sourceProfile" };
	    		//alert(JSON.stringify(newRow));
	    		replaceRow(dbRows, commonSourceId, newRow, true);
	    	}
    	}
    	if (editMode == "editProfile" && profileOriginal && profileOriginal.outline._id.length > 0)
    	{
    		if (commonSourceId.length > 0)
    			updatedProfile.outline.source["guid"] = commonSourceId;

    		graftSource(dbRows, profileOriginal.outline._id, updatedProfile.outline.source);
    	}
    	updateStagedProfilesIfNeeded(updatedProfile);
    	switchToSearchResultsOnProfile(updatedProfile);
	}
	
	function SpecificSourceHasContent(testSpecificSource)
	{
		return testSpecificSource.details.length > 0 || 
	    		testSpecificSource.website.length > 0;
	}
	
	function CommonSourceHasContent(testCommonSource)
	{
		return testCommonSource.details.length > 0 || 
	    		testCommonSource.website.length > 0 || 
	    		testCommonSource.publisherDetails.length > 0;
	}
	
	function CommonSourceHasChanged(testCommonSource, originalSource)
	{
		return testCommonSource.details != originalSource.details || 
	    	testCommonSource.website != originalSource.website ||
	    	testCommonSource.publisherDetails != originalSource.publisherDetails ||
	    	testCommonSource.media != originalSource.media;
	}
	
	function submitSource(event)
	{
		var exampleRows = getDbRows();
		var profileOriginal =  $("#sourceDetailBlock").data("profile-original");
	    var editMode = $("#sourceDetailBlock").data("edit-mode"); // editProfile / editCommon / copyToNewProfile
	    var updatedProfile = $("[name='updateSourceDetails']").getJSON();
	    updatedProfile.source.head = {"contentType" : "sourceProfile"};
	    //alert(JSON.stringify(updatedProfile));
	    if (!CommonSourceHasContent(updatedProfile.source) && 
	    	!SpecificSourceHasContent(updatedProfile.outline.source))
    	{
    		alert("Source update requires that you fill in some information.")
    		return;
    	}
    	$(this).unbind(event); // TODO: use on/off
	    
	    var profileSwitchTo = null;
	    if (editMode == "copyToNewProfile" || !profileOriginal)
	    {
	    	profileSwitchTo = clone(updatedProfile);
	    	var newGuid = "";
	    	if (CommonSourceHasContent(updatedProfile.source))
	    	{
	    		if (!profileOriginal || CommonSourceHasChanged(updatedProfile.source, profileOriginal.source))
    			{
    				// something has changed, so create a new common
			    	newGuid = createIDFromDateNow(":sr");
			    	profileSwitchTo.source._id = newGuid;
			    	var newRow = {"id" : newGuid, "key" : [newGuid, 0], "value" : profileSwitchTo.source };
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
    		else
    		{
    			// no content. 
    			// apparently this only has outline source details.
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
	    }
		else if (editMode == "editProfile" || editMode == "editCommon")
	    {	    	
	    	if (profileOriginal)
	    		profileSwitchTo = updatedProfile;
	    }
	    
	    findAndDo(exampleRows, profileSwitchTo.source._id, function(rows, indexFound) 
	    {
	    	var docToUpdate = rows[indexFound].value;
	    	if (docToUpdate._rev)
	    		profileSwitchTo.source["_rev"] = docToUpdate._rev;
	    });
	    
	    var specificDetailsMsg = "Outline specific details will be updated after publishing the outline.";
	    // TODO: do I need to write the db cache back to the DOM?
		if (dbMain && CommonSourceHasContent(updatedProfile.source) && 
			(!profileOriginal || CommonSourceHasChanged(updatedProfile.source, profileOriginal.source)))
		{
			try
			{
				dbMain.put(profileSwitchTo.source._id, profileSwitchTo.source, function(resp) {
			        if (resp.ok)
			        {
			        	profileSwitchTo["_rev"] = resp.rev;
			        	alert("Common Source Profile Changes Published. (" + specificDetailsMsg + ")"); // Debug: " + JSON.stringify(resp));
					    publishSourceProfileChangesToTableView(profileSwitchTo, profileOriginal, exampleRows);
			        }
			        else
			        {
			        	alert("error saving source to database." + JSON.stringify(profileSwitchTo)+ "err: " +  JSON.stringify(resp));
			        }
			    });
		    }
		    catch(err)
		    {
		    	alert("error saving source to database." + JSON.stringify(profileSwitchTo)+ "err: " +  JSON.stringify(err));
		    }
		 }
	    else
	    {
	    	if (!CommonSourceHasContent(updatedProfile.source))
	    	{
	    		alert(specificDetailsMsg);
	    	}
	    	publishSourceProfileChangesToTableView(profileSwitchTo, profileOriginal, exampleRows);
	    }
		
		$(this).click(submitSource);
		return false;
		
	}
	
	function submitPersonProfile(event)
	{
		var authorRows = getDbRows();
		// TODO: replace with on/off?
		// first do some checking (don't create blank profile)
		// submit new profile
		var personProfile = $("[name='updatePersonProfile']").getJSON();
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
		$(this).unbind(event);	
		
		personProfile.head = {"contentType" : "personProfile"};
		
		// only add interesting title. Not the default.fpu
		if (personProfile.name.title == "(Title)")
		{
			personProfile.name.title = "";
		}

		var queryResults = $("[name='updatePersonProfile']").find("[name='_id']");
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
			
			var newId = createIDFromDateNow(":ps");
			// add head information
			personProfile._id = newId;
			// remove revision since this is a new object.
			delete personProfile._rev;
		}
		else
		{
			var matchingDocs = collectProfileDocs("personProfile", authorRows, matchByNewAuthorFormFields, false);
			if (matchingDocs.length > 0)
			{
				for (var i=0; i < matchingDocs.length; i++) {
				  if (matchingDocs[i]._id == personProfileId)
				  	switchToSearchResultsOnProfile(personProfile);
				  	$(this).click(submitPersonProfile);
				  	return true; // no changes.
				};
				alert("Warning: A matching person profile already exists.");
			}
			var personProfileRev = $("[name='updatePersonProfile']").find("[name='_rev']");
			
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
		        if (resp.ok)
		        {
		        	personProfile["_rev"] = resp.rev;
		        	alert("Person Profile Published."); // Debug: " + JSON.stringify(resp));
				    updateStagedProfilesIfNeeded(personProfile);
				    publishPersonProfileChangesToTableView(personProfile);
		        	loadDataSet(false);		        	
		        }
				$("#btnSubmitPersonProfile").click(submitPersonProfile);
		    });
	    else  // Debug
	    {
	    	updateStagedProfilesIfNeeded(personProfile);
	    	publishPersonProfileChangesToTableView(personProfile);
	    	$(this).click(submitPersonProfile);
	    }
	    
		//alert("btnSubmitPersonProfile : "+ profile.name.middle);
		return false;
	}
	
	function publishPersonProfileChangesToTableView(personProfile)
	{
		var newRow = {"id" : personProfile._id, "key" : [personProfile._id, 0], "value" : personProfile};
		
		var getResponse = getDb();
		if (!replaceRow(getResponse.rows, newRow.id, newRow))
    	{
    		getResponse.rows.push(newRow);
    		getResponse.total_rows += 1;
    	}
    	cacheDbInDom(getResponse);
	    // TODO: lookup _rev version later
	    switchToSearchResultsOnProfile(personProfile);
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
	
	var defaultCitationLinkContent = "Click to search/specify";
	
	function stageSelectedAuthorProfile(profile, fIgnoreSubmitterIsAuthor)
	{
		$("#save-outline-author")
			.text(formatName(profile, defaultCitationLinkContent))
			.data('profile-author', profile);
		var fSubmitterIsAuthor = $("#submitterIsAuthor").is(":checked");
		if (fSubmitterIsAuthor && !fIgnoreSubmitterIsAuthor)
		{
			$("#save-outline-submitter")
				.text(formatName(profile, defaultCitationLinkContent))
				.data('profile-submitter', profile);
		}
		//alert("stageSelected : "+ profile.name.middle);	
	}
	
	function stageSelectedSubmitterProfile(profile, fIgnoreSubmitterIsAuthor)
	{
		$("#save-outline-submitter")
			.text(formatName(profile, defaultCitationLinkContent))
			.data('profile-submitter', profile);
		var fSubmitterIsAuthor = $("#submitterIsAuthor").is(":checked");
		if (fSubmitterIsAuthor && !fIgnoreSubmitterIsAuthor)
		{
			$("#save-outline-author")
				.text(formatName(profile, defaultCitationLinkContent))
				.data('profile-author', profile);
		}
		//alert("stageSelected : "+ profile.name.middle);	
	}
	
	function stageSelectedSourceProfile(profile)
	{
		$("#save-outline-source")
			.text(formatCombinedSource(profile, defaultCitationLinkContent))
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
						profile.outline.source.details]);
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
				LoadSourceResultsCallback(getDbRows());
				if (profile)
				{
				    var parentRow = pageToRow(jq("sourceSearchResults"), jq(createSourceRowId(profile)));
				    if (!parentRow) {
				        var profileFakeMerged = clone(profile);
				        profileFakeMerged._id = [profileFakeMerged._id, profileFakeMerged._id];
				        profileFakeMerged.outline.source._id = profileFakeMerged._id;
                        parentRow = pageToRow(jq("sourceSearchResults"), jq(createSourceRowId(profileFakeMerged)));
				    }

					selectCreditRow(parentRow);
				}
			}

			if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
			{
				LoadAuthorResultsCallback(getDbRows(), editMode == "save-outline-submitter");
				// now highlight the new row.
				if (profile)
				{
					var tableId = null;
					if (editMode == "save-outline-author")
						tableId = jq("authorResults");
					if (editMode == "save-outline-submitter")
						tableId = jq("submitterProfileResults");
					var parentRow = pageToRow(tableId, jq(profile._id));
					selectCreditRow(parentRow);
				}
				$("[name='updatePersonProfile']").find("[name='_id']").val(""); // reset id, to make sure we don't accidentally use an old id.
				$("[name='updatePersonProfile']").find("[name='_rev']").val("");
			}
		
	}
	
	function findRow(table, rowId)
	{
		var oTable = $(table).data("dataTable");
		var selectedRow = oTable.$(rowId);
		return selectedRow;
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
 * JSON.stringify(getDb(), null, '\t')
 * Find \n Replace: \\\n
 * Or better: use Firefox->Console and expand the GET https://cloudbow.cloudant.com/kayak/_design/everything/_view/byDocId	.
 */
	var authorsAndOutlinesResponse = {
	    "total_rows": 383, "offset": 0, "rows": [
        { "id": "56e905abc996fa0a1b824d4118002410", "key": ["56e905abc996fa0a1b824d4118002410", "source: Not yet referenced"], "value": { "_id": "56e905abc996fa0a1b824d4118002410", "_rev": "1-bf320b4c33040147e4aded024bdefdbd", "head": { "contentType": "sourceProfile" }, "media": "book", "details": "Not yet referenced", "website": "", "publisherDetails": "" } },
        { "id": "774c87bd5ec2e4afb24a0ce0d1000c9f", "key": ["774c87bd5ec2e4afb24a0ce0d1000c9f", "outline: epyle"], "value": { "_id": "774c87bd5ec2e4afb24a0ce0d1000c9f", "_rev": "20-ee5f49b0ba9c8d3be2478a17ff1cc746", "head": { "submissionTimestamp": [2011, 12, 28, "10:30:00.000Z"], "bcvRange": [], "title": "testing", "ScriptureRange": "Genesis 1:10", "contentType": "outline", "source": { "details": "", "website": "", "guid": "kyk:1845-12-23T03:22:15.481Z:sr" }, "modifiedTimestamp": [2013, 10, 1, "02:31:30.387Z"], "author": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps", "authorShortname": "epyle" } }, "body": { "concepts": [{ "content": "puppies", "embeddedOutlineId": "kyk:2011-10-20T19:00:00.001Z:ol" }, { "content": "wimper", "embeddedOutlineId": "kyk:2013-09-20T02:37:27.599Z:ol" }, { "content": "piglets", "embeddedOutlineId": "kyk:2013-08-20T16:04:26.425Z:ol" }, { "content": "squeel" }] } } },
        { "id": "kyk:1845-12-23T03:22:15.481Z:sr", "key": ["kyk:1845-12-23T03:22:15.481Z:sr", "source: kayak"], "value": { "_id": "kyk:1845-12-23T03:22:15.481Z:sr", "_rev": "2-9803b75049eb3c4e9e32b103c17f59cd", "head": { "contentType": "sourceProfile" }, "media": "website", "details": "kayak", "website": "ericlovesallison.org/BibleTools/kayak", "publisherDetails": "" } },
        { "id": "kyk:1974-12-23T03:22:15.481Z:ps", "key": ["kyk:1974-12-23T03:22:15.481Z:ps", "person: Pyle, Eric"], "value": { "_id": "kyk:1974-12-23T03:22:15.481Z:ps", "_rev": "3-df8e1c679c8938bf7d912476b664151b", "name": { "title": "", "first": "Eric", "middle": "", "last": "Pyle", "suffix": "" }, "organization": { "name": "Wycliffe Bible Translators", "website": "http://www.wycliffe.org" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2011-06-05T18:47:27.748Z:ps", "key": ["kyk:2011-06-05T18:47:27.748Z:ps", "person: Greene, Elliott"], "value": { "_id": "kyk:2011-06-05T18:47:27.748Z:ps", "_rev": "2-b7ebc5f9aec26013507d8b42ef57cec4", "head": { "contentType": "personProfile" }, "name": { "title": "Prof.", "last": "Greene", "first": "Elliott", "middle": "" }, "organization": { "name": "Redeemer Seminary", "website": "http://www.redeemerseminary.org/" }, "urls": ["http://www.ccef.org/authors/elliott-greene", "http://www.redeemerseminary.org/faculty.html"] } },
        { "id": "kyk:2011-06-06T18:47:27.848Z:sr", "key": ["kyk:2011-06-06T18:47:27.848Z:sr", "source: Redeemer Seminary, Greek Class"], "value": { "_id": "kyk:2011-06-06T18:47:27.848Z:sr", "_rev": "2-c36f57fd24b8fec09a4547ee6e75d061", "head": { "contentType": "sourceProfile" }, "media": "class", "details": "Redeemer Seminary, Greek Class", "website": "http://www.redeemerseminary.org", "publisherDetails": "" } },
        { "id": "kyk:2011-06-06T19:00:00.001Z:ol", "key": ["kyk:2011-06-06T19:00:00.001Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2011-06-06T19:00:00.001Z:ol", "_rev": "24-b738ec8d95ff7949df2c1f5db4f36d42", "head": { "submissionTimestamp": [2011, 6, 6, "19:00:00.001Z"], "bcvRange": ["Matt", 1, 1, "Matt", 28, 20], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "#94, Apr 1997", "website": "www.biblicalhorizons.com/biblical-horizons/no-94-toward-a-chiastic-understanding-of-the-gospel-according-to-matthew-part-1/", "guid": "kyk:2011-06-06T19:00:00.004Z:sr" }, "title": "", "ScriptureRange": "Matthew 1:1-28:20", "contentType": "chiasm", "modifiedTimestamp": [2013, 6, 3, "18:50:25.631Z"] }, "body": { "concepts": [{ "content": "Genealogy (past), 1:1-17" }, { "content": "First Mary and Jesus’ birth, 1:18-25" }, { "content": "Gifts of wealth at birth, 2:1-12" }, { "content": "Descent into Egypt; murder of children, 2:13-21" }, { "content": "Judea avoided, 2:22-23" }, { "content": "Baptism of Jesus, 3:1–8:23" }, { "content": "Crossing the sea, 8:24–11:1" }, { "content": "John’s ministry, 11:2-19" }, { "content": "Rejection of Jesus, 11:20-24" }, { "content": "Gifts for the new children, 11:25-30" }, { "content": "Attack of Pharisees, 12:1-13" }, { "content": "Pharisees determine to kill the innocent Servant, 12:14-21" }, { "content": "Condemnation of Pharisees, 12:22-45" }, { "content": "Gifts for the new children, 13:1-52" }, { "content": "Rejection of Jesus, 13:53-58" }, { "content": "John’s death, 14:1-12" }, { "content": "Crossing the sea, 14:13–16:12" }, { "content": "Transfiguration of Jesus, 16:13–18:35" }, { "content": "Judean ministry, 19:1–20:34" }, { "content": "Ascent into Jerusalem; judgment on Jews, 21:1–27:56" }, { "content": "Gift of wealth at death, 27:57-66" }, { "content": "Last Marys and Jesus’ resurrection, 28:1-15" }, { "content": "Commission (future), 28:16-20" }] } } },
        { "id": "kyk:2011-06-06T19:00:00.002Z:ps", "key": ["kyk:2011-06-06T19:00:00.002Z:ps", "person: Jordan, James"], "value": { "_id": "kyk:2011-06-06T19:00:00.002Z:ps", "_rev": "2-cd07b6aea919bb26ca74f5d7840f7e85", "head": { "contentType": "personProfile" }, "name": { "first": "James", "last": "Jordan", "middle": "B." }, "organization": { "name": "Biblical Horizons", "website": "http://www.biblicalhorizons.com/" }, "urls": ["http://www.facebook.com/pages/James-B-Jordan/120290590930"] } },
        { "id": "kyk:2011-06-06T19:00:00.004Z:sr", "key": ["kyk:2011-06-06T19:00:00.004Z:sr", "source: Biblical Horizons"], "value": { "_id": "kyk:2011-06-06T19:00:00.004Z:sr", "_rev": "3-cf8fd94781c18d20792c623e40f1770e", "media": "website", "details": "Biblical Horizons", "website": "www.biblicalhorizons.com", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2011-06-18T18:47:27.747Z:ps", "key": ["kyk:2011-06-18T18:47:27.747Z:ps", "person: Hilleke, Thomas"], "value": { "_id": "kyk:2011-06-18T18:47:27.747Z:ps", "_rev": "2-cce8c771127891e98e8310a97dafd1b3", "head": { "contentType": "personProfile" }, "name": { "last": "Hilleke", "first": "Thomas" } } },
        { "id": "kyk:2011-06-18T18:47:27.748Z:ol", "key": ["kyk:2011-06-18T18:47:27.748Z:ol", "chiasm: thilleke"], "value": { "_id": "kyk:2011-06-18T18:47:27.748Z:ol", "_rev": "23-297086784afb152104ccc41186ef4980", "head": { "submissionTimestamp": [2011, 6, 18, "18:47:27.748Z"], "bcvRange": ["Jonah", 1, 1, "Jonah", 4, 11], "author": { "guid": "kyk:2011-06-18T18:47:27.747Z:ps", "authorShortname": "thilleke" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "guid": "kyk:2011-06-18T18:47:27.948Z:sr" }, "title": "The Names of God in Jonah", "contentType": "chiasm", "ScriptureRange": "Jonah 1:1-4:11" }, "body": { "concepts": [{ "content": "1:1-4, Yahweh deals with Yonah" }, { "content": "1:5-8, Elohim, God of water deals with the unconverted Gentiles" }, { "content": "1:9, Yonah invokes the name Yahweh Elohim" }, { "content": "1:10-17, Yahweh deals with the converted Gentiles and Yonah" }, { "content": "2:1, Yonah invokes the name Yahweh Elohim" }, { "content": "2:2-6, Yahweh deals with Yonah" }, { "content": "2:6, Yonah invokes the name Yahweh Elohim" }, { "content": "2:7-3:3, Yahweh deals with Yonah" }, { "content": "3:3-4:1, Elohim deals with Gentiles before and after conversion. They do not offer sacrifice and take vows like the salty ones." }, { "content": "4:2-5, Yahweh deals with Yonah (Yonah invokes the name El in 4:2 as part of his prayer to Yahweh)" }, { "content": "4:6, Yahweh Elohim deals with Yonah" }, { "content": "4:7-9, Elohim deals with Yonah" }, { "content": "4:10-11, Yahweh deals with Yonah" }] } } },
        { "id": "kyk:2011-06-18T18:47:27.948Z:sr", "key": ["kyk:2011-06-18T18:47:27.948Z:sr", "source: Biblical Horizons Yahoogroup"], "value": { "_id": "kyk:2011-06-18T18:47:27.948Z:sr", "_rev": "3-217da62ee113d78a53854edb1edbc214", "head": { "contentType": "sourceProfile" }, "media": "email", "details": "Biblical Horizons Yahoogroup", "website": "", "publisherDetails": "" } },
        { "id": "kyk:2011-10-18T19:00:00.001Z:ol", "key": ["kyk:2011-10-18T19:00:00.001Z:ol", "outline: jbjordan"], "value": { "_id": "kyk:2011-10-18T19:00:00.001Z:ol", "_rev": "22-ff71488ca01a11ada5f926d0a6db8108", "head": { "submissionTimestamp": [2011, 10, 18, "19:00:00.001Z"], "bcvRange": ["Deut", 1, 1, "Deut", 34, 12], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "guid": "kyk:2011-10-18T19:00:00.002Z:sr", "details": "p. 57" }, "title": "Covenant/Re-creation Pattern", "ScriptureRange": "Deuteronomy 1:1-34:12", "contentType": "outline" }, "body": { "concepts": [{ "content": "Taking Hold – Transcendence – Initiation, 1:1-5" }, { "content": "Historical Overview – Breakdown and Renewal of Order, 1:6-4:43" }, { "content": "Stipulations – Given with view to the coming Distribution of the Land, 4:44-26:19" }, { "content": "Sanctions – Witnesses, 27-30" }, { "content": "Succession – Rest – Enhancements– Continuity, 31-34." }] } } },
        { "id": "kyk:2011-10-18T19:00:00.002Z:sr", "key": ["kyk:2011-10-18T19:00:00.002Z:sr", "source: Covenant Sequence In Leviticus and Deuteronomy"], "value": { "_id": "kyk:2011-10-18T19:00:00.002Z:sr", "_rev": "5-7545b66aff99f72a8032277624357f4c", "head": { "contentType": "sourceProfile" }, "media": "book", "details": "Covenant Sequence In Leviticus and Deuteronomy", "website": "", "publisherDetails": "" } },
        { "id": "kyk:2011-10-20T19:00:00.001Z:ol", "key": ["kyk:2011-10-20T19:00:00.001Z:ol", "outline: jbjordan"], "value": { "_id": "kyk:2011-10-20T19:00:00.001Z:ol", "_rev": "24-a9ef9b102e1fce5d0872bf1b700185f3", "head": { "submissionTimestamp": [2011, 10, 20, "19:00:00.001Z"], "bcvRange": ["Deut", 1, 6, "Deut", 4, 43], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 59", "website": "", "guid": "kyk:2011-10-18T19:00:00.002Z:sr" }, "title": "Covenant Breakdown and Renewal", "ScriptureRange": "Deuteronomy 1:6-4:43", "contentType": "outline", "modifiedTimestamp": [2013, 10, 1, "03:18:55.092Z"] }, "body": { "concepts": [{ "content": "Covenant Breakdown, 1:6-46", "concepts": [{ "content": "God initiated covenant, 1:6-8" }, { "content": "New socio-political order, 1:9-18" }, { "content": "Disobedience to stipulations, rejection of distributed grant, 1:19-33" }, { "content": "Judgment: the people to be restructured, 1:34-40" }, { "content": "Loss of inheritance, 1:41-46" }] }, { "content": "Covenant Renewal, 2:1-4:40", "concepts": [{ "content": "God initiates all actions in 2:1-3:11" }, { "content": "Historical prelude to the distribution of the land:", "concepts": [{ "content": "Esau, 2:1-8" }, { "content": "Moab, 2:9-13 (defeat of giant is condition for inheritance)" }, { "content": "Ammon, 2:14-23" }, { "content": "Sihon, 2:24-37" }, { "content": "Og, 3:1-11 (giant finally defeated)" }] }, { "content": "Distribution of land and accompanying rules, 3:12-4:24" }, { "content": "Sanctions, 4:25-31" }, { "content": "Continuity: think back and pass it on, 4:32-40" }] }, { "content": "Moses sets up the essential geographical/hierarchical order for the land, 4:41-43" }] } } },
        { "id": "kyk:2012-05-23T19:01:53.713Z:ol", "key": ["kyk:2012-05-23T19:01:53.713Z:ol", "chiasm: pjleithart"], "value": { "_id": "kyk:2012-05-23T19:01:53.713Z:ol", "_rev": "4-2a1e4a9d425942fbf981a35744796507", "head": { "contentType": "chiasm", "title": "Don't neglect Levites", "ScriptureRange": "Deut 12:1-32", "submissionTimestamp": [2012, 5, 23, "19:01:53.713Z"], "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "modifiedTimestamp": [2012, 5, 23, "19:08:54.451Z"], "source": { "details": "p. 35", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" } }, "body": { "concepts": [{ "content": "Observe carefully in land, v. 1" }, { "content": "Destroy Canaanite worship, vv. 2-4" }, { "content": "Worship at central sanctuary, vv. 5-14" }, { "content": "Meat and blood, vv. 15-18" }, { "content": "Don't neglect Levites, v. 19" }, { "content": "Meat and blood, vv. 20-25 (\"well with you\"' \"do what is right,\" v. 25)" }, { "content": "Worship at central sanctuary, vv. 26-28 (\"well with you; \"do what is right,\" v.28)" }, { "content": "Beware Canaanite worship, vv. 29-31" }, { "content": "Be careful to do commands, v.32" }] } } },
        { "id": "kyk:2012-05-23T19:05:05.116Z:ps", "key": ["kyk:2012-05-23T19:05:05.116Z:ps", "person: Leithart, Peter"], "value": { "_id": "kyk:2012-05-23T19:05:05.116Z:ps", "_rev": "1-22ae6982b85cdfbad3439a4b373917c2", "name": { "title": "Dr.", "first": "Peter", "middle": "J.", "last": "Leithart", "suffix": "" }, "organization": { "name": "", "website": "www.leithart.com" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-05-23T19:08:13.954Z:sr", "key": ["kyk:2012-05-23T19:08:13.954Z:sr", "source: A House For My Name"], "value": { "_id": "kyk:2012-05-23T19:08:13.954Z:sr", "_rev": "1-d979ff939abf7f00e9a56b6237952787", "media": "book", "details": "A House For My Name", "website": "", "publisherDetails": "www.canonpress.com", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-05-24T17:14:10.438Z:ol", "key": ["kyk:2012-05-24T17:14:10.438Z:ol", "chiasm: gwenham"], "value": { "_id": "kyk:2012-05-24T17:14:10.438Z:ol", "_rev": "3-270b8f8899efd9b8e8bae3a44bf48381", "head": { "contentType": "chiasm", "title": "Babel", "ScriptureRange": "Gen 11:1-9", "submissionTimestamp": [2012, 5, 24, "17:14:10.438Z"], "source": { "details": "p. 235", "website": "", "guid": "kyk:2012-05-25T15:51:49.181Z:sr" }, "modifiedTimestamp": [2012, 5, 25, "15:54:18.738Z"], "author": { "guid": "kyk:2012-05-25T15:50:38.980Z:ps", "authorShortname": "gwenham" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" } }, "body": { "concepts": [{ "content": "The whole earth has one language (v.1)" }, { "content": "Settled there (v.2)" }, { "content": "Said to one another (v.3)" }, { "content": "Come, let us make bricks (v.3)" }, { "content": "Let us build (v.4)" }, { "content": "City and tower (v.4)" }, { "content": "Lord came down (v.5)" }, { "content": "City and tower (v.5)" }, { "content": "That man had built (v.7)" }, { "content": "Come, let us confuse (v.7)" }, { "content": "One another's speech (v.7)" }, { "content": "Scattered from there (v.8)" }, { "content": "Confused language of the whole earth (v.9)" }] } } },
        { "id": "kyk:2012-05-25T15:50:38.980Z:ps", "key": ["kyk:2012-05-25T15:50:38.980Z:ps", "person: Wenham, Gordon"], "value": { "_id": "kyk:2012-05-25T15:50:38.980Z:ps", "_rev": "1-1b63752fd6952d7a301baf2d34f9300d", "name": { "title": "", "first": "Gordon", "middle": "", "last": "Wenham", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-05-25T15:51:49.181Z:sr", "key": ["kyk:2012-05-25T15:51:49.181Z:sr", "source: Genesis 1-15"], "value": { "_id": "kyk:2012-05-25T15:51:49.181Z:sr", "_rev": "1-2de89151c4d4e41168e42e5173b0653e", "media": "", "details": "Genesis 1-15", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-05-26T08:23:13Z:ol", "key": ["kyk:2012-05-26T08:23:13Z:ol", "chiasm: pjleithart"], "value": { "_id": "kyk:2012-05-26T08:23:13Z:ol", "_rev": "4-0c3134cab61db284d2726e6da46ffc2d", "head": { "contentType": "chiasm", "title": "The prosperity of Jacob's house", "ScriptureRange": "Gen 28:10-32:32", "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2012, 5, 26, "08:23:13Z"], "source": { "details": "p. 63", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" }, "modifiedTimestamp": [2012, 5, 26, "12:12:49.428Z"] }, "body": { "concepts": [{ "content": "Jacob fleeing land; God appears at Bethel (28:10-22)" }, { "content": "Jacob arrives at Haran, marries (29:1-30)" }, { "content": "Jacob's children (29:31-30:24)" }, { "content": "Jacob's flocks (30:25-43)" }, { "content": "Jacob leaves Haran (31:1-55)" }, { "content": "Jacob reentering land; God appears at Peniel (32:1-32)" }] } } },
        { "id": "kyk:2012-05-26T12:22:19.659Z:ol", "key": ["kyk:2012-05-26T12:22:19.659Z:ol", "chiasm: dadorsey"], "value": { "_id": "kyk:2012-05-26T12:22:19.659Z:ol", "_rev": "4-4189dfd6f24b07c41aa8aebfd68e01c9", "head": { "contentType": "chiasm", "title": "The Covenant of Abraham", "ScriptureRange": "Gen 12:1-21:7", "submissionTimestamp": [2012, 5, 26, "12:22:19.659Z"], "author": { "guid": "kyk:2012-05-26T12:29:27.509Z:ps", "authorShortname": "dadorsey" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 56", "website": "", "guid": "kyk:2012-05-26T12:37:11.954Z:sr" }, "modifiedTimestamp": [2012, 6, 17, "20:03:38.622Z"] }, "body": { "concepts": [{ "content": "Promise of seed, 12:1-9" }, { "content": "Abram in Egypt, 12:10-20" }, { "content": "Lot settles in Sodom, 13:1-18" }, { "content": "Abram intervenes on behalf of Lot, 14:1-24" }, { "content": "Promise of a son, 15:1-21" }, { "content": "Ishmael's birth, 16:1-16" }, { "content": "Covenant of circumcision, 17:1-17" }, { "content": "Ishmael and Abraham circumcised, 17:22-27" }, { "content": "Promise of a son, 18:1-15" }, { "content": "Abraham intercedes on behalf of Sodom and Lot, 18:16-33" }, { "content": "Lot flees from Sodom, 19:1-38" }, { "content": "Abraham in Gerar, 20:1-18" }, { "content": "Birth of Isaac, 21:1-7" }] } } },
        { "id": "kyk:2012-05-26T12:29:27.509Z:ps", "key": ["kyk:2012-05-26T12:29:27.509Z:ps", "person: Dorsey, David"], "value": { "_id": "kyk:2012-05-26T12:29:27.509Z:ps", "_rev": "1-8857066c32bc7e88e4d66d1d87bd50ff", "name": { "title": "", "first": "David", "middle": "A", "last": "Dorsey", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-05-26T12:37:11.954Z:sr", "key": ["kyk:2012-05-26T12:37:11.954Z:sr", "source: The Literary Structure of the Old Testament: A Commentary on Gen"], "value": { "_id": "kyk:2012-05-26T12:37:11.954Z:sr", "_rev": "1-65970e247dbc1f236fbbf7743b2116cc", "media": "book", "details": "The Literary Structure of the Old Testament: A Commentary on Genesis-Malachi", "website": "", "publisherDetails": "Grand Rapids, MI: Baker, 1999", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-05-26T18:56:34.722Z:ol", "key": ["kyk:2012-05-26T18:56:34.722Z:ol", "chiasm: gwenham"], "value": { "_id": "kyk:2012-05-26T18:56:34.722Z:ol", "_rev": "2-5c5088d45c75b0c3f7c8371ec053a81b", "head": { "contentType": "chiasm", "title": "Yahweh's Third Speech (the sign of the covenant)", "ScriptureRange": "Gen 17:1-25", "submissionTimestamp": [2012, 5, 26, "18:56:34.722Z"], "author": { "guid": "kyk:2012-05-25T15:50:38.980Z:ps", "authorShortname": "gwenham" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "pp. 17-18", "website": "", "guid": "kyk:2012-05-26T19:05:10.812Z:sr" }, "modifiedTimestamp": [2012, 5, 26, "19:07:04.484Z"] }, "body": { "concepts": [{ "content": "Abraham is 99 (v.1a)" }, { "content": "Yahweh appears (v.1b)" }, { "content": "Yahweh's first speech (vv. 1b-2)" }, { "content": "Abraham falls on his face (v.3a)" }, { "content": "Second speech: name change, nations, kings (vv. 4-8)" }, { "content": "Third speech: the sign of the covenant (vv. 9-14)" }, { "content": "Fourth speech: name change, nations, kings (vv. 15-16)" }, { "content": "Abraham falls on his face (v.17)" }, { "content": "Fifth speech (vv. 19-21)" }, { "content": "Yahweh departs (v.22)" }, { "content": "Abraham is 99, Ishmael is 13 (vv. 24-25)" }] } } },
        { "id": "kyk:2012-05-26T19:05:10.812Z:sr", "key": ["kyk:2012-05-26T19:05:10.812Z:sr", "source: Genesis 16-50 [Word Biblical Commentary #2]"], "value": { "_id": "kyk:2012-05-26T19:05:10.812Z:sr", "_rev": "1-c719c3c14404c8967b8b7aba52981e42", "media": "book", "details": "Genesis 16-50 [Word Biblical Commentary #2]", "website": "", "publisherDetails": "Waco, TX: Word, 1994", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-05-28T18:54:44.272Z:ol", "key": ["kyk:2012-05-28T18:54:44.272Z:ol", "chiasm: sferguson"], "value": { "_id": "kyk:2012-05-28T18:54:44.272Z:ol", "_rev": "2-dbeffe6d4f17e294b4039059a8152305", "head": { "contentType": "chiasm", "title": "The Suffering Servant", "ScriptureRange": "Isaiah 52:13-53:12", "submissionTimestamp": [2012, 5, 28, "18:54:44.272Z"], "author": { "guid": "kyk:2012-05-28T18:55:41.431Z:ps", "authorShortname": "sferguson" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 105, Ch. 7, \"Christ, the Sin-Bearer\"", "website": "", "guid": "kyk:2012-05-28T19:02:03.431Z:sr" }, "modifiedTimestamp": [2012, 5, 28, "19:02:23.649Z"] }, "body": { "concepts": [{ "content": "Exaltation following his suffering (52:13-15)" }, { "content": "The servant's multifaceted suffering (53:1-3)" }, { "content": "The significance of his suffering: wounded for our transgressions (53:4-6)" }, { "content": "The servant's multifaceted suffering (53:7-9)" }, { "content": "Exaltation following his suffering (53:10-12)" }] } } },
        { "id": "kyk:2012-05-28T18:55:41.431Z:ps", "key": ["kyk:2012-05-28T18:55:41.431Z:ps", "person: Ferguson, Sinclair"], "value": { "_id": "kyk:2012-05-28T18:55:41.431Z:ps", "_rev": "1-55a2d70a7e0318df141769cbb6a84b1a", "name": { "title": "", "first": "Sinclair", "middle": "", "last": "Ferguson", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-05-28T19:02:03.431Z:sr", "key": ["kyk:2012-05-28T19:02:03.431Z:sr", "source: Atonement"], "value": { "_id": "kyk:2012-05-28T19:02:03.431Z:sr", "_rev": "1-dff251e288efd8e42653b0d49400649a", "media": "book", "details": "Atonement", "website": "", "publisherDetails": "2010, P&R Publishing Co.", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-05-28T19:13:55.739Z:ol", "key": ["kyk:2012-05-28T19:13:55.739Z:ol", "outline: jbjordan"], "value": { "_id": "kyk:2012-05-28T19:13:55.739Z:ol", "_rev": "2-c7b9fc162582d58eb97b8821ddf4e677", "head": { "contentType": "outline", "title": "The Seven Eras of Church History", "ScriptureRange": "Revelation 2-3", "submissionTimestamp": [2012, 5, 28, "19:13:55.739Z"], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 8-9, Introduction", "website": "", "guid": "kyk:2012-05-28T19:16:54.047Z:sr" }, "modifiedTimestamp": [2012, 5, 28, "19:17:12.143Z"] }, "body": { "concepts": [{ "content": "Ephesus — \"garden\" — Creation to Abram" }, { "content": "Smyrna — \"prison\" — Abram to Moses" }, { "content": "Pergamos — \"wilderness\" — Moses to David" }, { "content": "Thyatira — \"kingdom\" — David to Elijah" }, { "content": "Sardis — \"remnant\" — Elijah to Jeremiah" }, { "content": "Philadelphia — \"world witness\" Daniel to the Maccabees" }, { "content": "Laodicea — \"communion with God\" — Maccabees to Jesus" }] } } },
        { "id": "kyk:2012-05-28T19:16:54.047Z:sr", "key": ["kyk:2012-05-28T19:16:54.047Z:sr", "source: Crisis, Opportunity, and the Christian future"], "value": { "_id": "kyk:2012-05-28T19:16:54.047Z:sr", "_rev": "1-f2fc0e62e291565ba8c8b703850d6271", "media": "book", "details": "Crisis, Opportunity, and the Christian future", "website": "", "publisherDetails": "Athanasius Press", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-05-28T19:46:44.832Z:ol", "key": ["kyk:2012-05-28T19:46:44.832Z:ol", "chiasm: epyle"], "value": { "_id": "kyk:2012-05-28T19:46:44.832Z:ol", "_rev": "2-5e6ad7b51079a7eab20fd8865acb3d23", "head": { "contentType": "chiasm", "title": "The grace of God", "ScriptureRange": "1 Cor 15:10", "author": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps", "authorShortname": "epyle" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "kyk:1845-12-23T03:22:15.481Z:sr" }, "submissionTimestamp": [2012, 5, 28, "19:46:44.832Z"], "modifiedTimestamp": [2013, 9, 17, "03:50:42.872Z"] }, "body": { "concepts": [{ "content": "by the grace of God I am what I am", "embeddedOutlineId": "kyk:2012-05-28T19:46:44.832Z:ol" }, { "content": "his grace toward me was not in vain" }, { "content": "I worked harder than any" }, { "content": "not I but the grace of God with me" }] } } },
        { "id": "kyk:2012-05-29T18:33:14.533Z:ol", "key": ["kyk:2012-05-29T18:33:14.533Z:ol", "chiasm: dadorsey"], "value": { "_id": "kyk:2012-05-29T18:33:14.533Z:ol", "_rev": "2-a629a2f422fa1f0e75fd3db0324d34c6", "head": { "contentType": "chiasm", "title": "Aaron's status as priest", "ScriptureRange": "Numbers 10:11-21:20", "author": { "guid": "kyk:2012-05-26T12:29:27.509Z:ps", "authorShortname": "dadorsey" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 85", "website": "", "guid": "kyk:2012-05-26T12:37:11.954Z:sr" }, "submissionTimestamp": [2012, 5, 29, "18:33:14.533Z"], "modifiedTimestamp": [2012, 5, 29, "18:43:31.155Z"] }, "body": { "concepts": [{ "content": "Journey begins from Sinai (10:11-36)" }, { "content": "Complaints about hardship, manna, no food (11:1-35)" }, { "content": "Miriam punished for her sin (12:1-16)" }, { "content": "Rebellion at Kadesh (13:1-14:45)" }, { "content": "Ritual regulations (15:1-36)" }, { "content": "Rebellion against Aaron (15:37-16:50)" }, { "content": "Aaron's rod (17:1-13)" }, { "content": "Duties and privileges of priests (18:1-32)" }, { "content": "Ritual regulations (19:1-22)" }, { "content": "Rebellion of Moses and Aaron (20:1-21)" }, { "content": "Aaron dies (20:22-29)" }, { "content": "Complaints about hardship, manna, no food (21:4-9)" }, { "content": "Journey ends; camped on plains of Moab (21:10-20)" }] } } },
        { "id": "kyk:2012-06-07T11:57:50.375Z:ol", "key": ["kyk:2012-06-07T11:57:50.375Z:ol", "chiasm: akay"], "value": { "_id": "kyk:2012-06-07T11:57:50.375Z:ol", "_rev": "6-9b7fb005219ce5f82981b4f0a97f8209", "head": { "contentType": "chiasm", "title": "Looking unto Jesus", "ScriptureRange": "Psalm 123:1-4", "submissionTimestamp": [2012, 6, 7, "11:57:50.375Z"], "source": { "details": "sermon", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 6, 12, "18:34:52.160Z"], "submittedBy": { "guid": "kyk:2012-06-07T16:58:26.738Z:ps" }, "author": { "guid": "kyk:2012-06-07T16:58:26.738Z:ps", "authorShortname": "akay" } }, "body": { "concepts": [{ "content": "I look up (1a)" }, { "content": "Yahweh sits to judge righteously (1b)" }, { "content": "We look humbly for grace (2a)" }, { "content": "Handmaid / Bride (2b)" }, { "content": "We look not to our enemies but to Yahweh (2c)" }, { "content": "We plead for the grace of our Bridegroom (3a)" }, { "content": "They reward us with contempt (3b)" }, { "content": "They sit to scoff (4a)" }, { "content": "They look down (4b)" }] } } },
        { "id": "kyk:2012-06-07T16:58:26.738Z:ps", "key": ["kyk:2012-06-07T16:58:26.738Z:ps", "person: Kay, Arthur"], "value": { "_id": "kyk:2012-06-07T16:58:26.738Z:ps", "_rev": "1-3200c4e5c7fcbf6bd7e633a2d2fa6c66", "name": { "title": "Rev.", "first": "Arthur", "middle": "", "last": "Kay", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-06-09T19:35:29.832Z:ol", "key": ["kyk:2012-06-09T19:35:29.832Z:ol", "chiasm: akay"], "value": { "_id": "kyk:2012-06-09T19:35:29.832Z:ol", "_rev": "2-6b5263fd9c18545bea14e5b32e2d2725", "head": { "contentType": "chiasm", "title": "Vengeance belongs to Yahweh", "ScriptureRange": "Psalm 120:1-7", "author": { "guid": "kyk:2012-06-07T16:58:26.738Z:ps", "authorShortname": "akay" }, "submittedBy": { "guid": "kyk:2012-06-07T16:58:26.738Z:ps" }, "submissionTimestamp": [2012, 6, 9, "19:35:29.832Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 6, 10, "17:58:52.532Z"] }, "body": { "concepts": [{ "content": "In my trouble I cried to YHWH, and He heard me." }, { "content": "Deliver my soul, O YHWH, from lying lips, from a deceitful tongue." }, { "content": "What shall be given to you? Or what shall be done to you, O false tongue?" }, { "content": "Sharp arrows of the Mighty, with coals of broom." }, { "content": "Woe is me, that I live in Mesech; I dwell in the tents of Kedar!" }, { "content": "My soul has long dwelt with a hater of peace." }, { "content": "I am for peace; but when I speak, they are for war." }] } } },
        { "id": "kyk:2012-06-24T17:24:42.387Z:ps", "key": ["kyk:2012-06-24T17:24:42.387Z:ps", "person: Kerr, Kelly"], "value": { "_id": "kyk:2012-06-24T17:24:42.387Z:ps", "_rev": "1-90b68a8c6e2cec409e380b0bbec80789", "name": { "title": "", "first": "Kelly", "middle": "", "last": "Kerr", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-06-24T17:27:37.020Z:ol", "key": ["kyk:2012-06-24T17:27:37.020Z:ol", "chiasm: kkerr"], "value": { "_id": "kyk:2012-06-24T17:27:37.020Z:ol", "_rev": "4-617e435584af405da6b974f3b52887cc", "head": { "contentType": "chiasm", "title": "Mark Chiasm", "ScriptureRange": "Mark 1:1-16:20", "submittedBy": { "guid": "kyk:2012-06-24T17:24:42.387Z:ps" }, "submissionTimestamp": [2012, 6, 24, "17:27:37.020Z"], "author": { "guid": "kyk:2012-06-24T17:24:42.387Z:ps", "authorShortname": "kkerr" }, "source": { "details": "", "website": "", "guid": "kyk:2011-06-18T18:47:27.948Z:sr" }, "modifiedTimestamp": [2012, 7, 1, "17:27:18.842Z"] }, "body": { "concepts": [{ "content": "Jesus baptized & begins his ministry (Mark 1:1-15)" }, { "content": "Jesus calls Peter/Andrew & James/John (Mk 1:16-20)" }, { "content": "Jesus heals a man with a demon (1:21-28)" }, { "content": "Jesus lifts up Peter's mother-in-law/many gathered at the door (1:29-34)" }, { "content": "Jesus prays & tells leper to present himself to the priest with the offering/Jesus charged with blasphemy (1:35-2:12)" }, { "content": "Jesus reclining at table/questioned about fasting/Sabbath/plot to kill Jesus (2:13-3:12) " }, { "content": "Teaching disciples/Jesus' family tries to seize him (3:13-21)" }, { "content": "Blasphemy against the Spirit (3:22-30)" }, { "content": "Parables (3:31-4:34)" }, { "content": "Jesus calms storm/heals a woman, girl & man with demon (5)" }, { "content": "Jesus not doing mighty acts in Nazareth (6:1-6)" }, { "content": "Jesus & disciples heal/death of John the Baptist (6:7-29)" }, { "content": "Jesus feeds 5,000 (6:30-44)" }, { "content": "Disciples' hard heart/Jesus heals the sick(6:45-56)" }, { "content": "Defilement and the traditions of men (7:1-23)" }, { "content": "Syrophoenician's faith/Jesus heals a man (7:24-37)" }, { "content": "Jesus feeds 4,000 & its lesson (8:1-21)" }, { "content": "Jesus heals blind man & foretells death & resurrection (8:22-9:1)" }, { "content": "Jesus transfigured (9:2-13)" }, { "content": "Jesus heals boy with unclean spirit (9:14-32)" }, { "content": "Illustrations of parables (9:33-10:52)" }, { "content": "Triumphal entry/the temple blasphemes God (11:1-12:44)" }, { "content": "Teaching disciples/family will turn against family members (13)" }, { "content": "Jesus reclining at table/Lord’s Supper/plot to kill Jesus (14:1-31)" }, { "content": "Jesus prays & he is presented to the high priest and offers himself/charged with blasphemy (14:32-15:47)" }, { "content": "Jesus is resurrected/Marys at the stone of the tomb (16:1-8)" }, { "content": "Jesus appears to Mary Magdalene, who had 7 demons (16:9-11)" }, { "content": "Jesus appears to 2 of his disciples (16:12-13)" }, { "content": "Jesus commissions his disciples to baptize & ascends to heaven (16:14-20)" }] } } },
        { "id": "kyk:2012-07-16T13:50:48.481Z:ol", "key": ["kyk:2012-07-16T13:50:48.481Z:ol", "panel: pjleithart"], "value": { "_id": "kyk:2012-07-16T13:50:48.481Z:ol", "_rev": "3-53e9195e20f9d6118476eb28ff070ab1", "head": { "contentType": "panel", "title": "Dividing & Filling of God's three-story house", "ScriptureRange": "Genesis 1", "contentParams": { "repeat": 4, "header": true }, "submissionTimestamp": [2012, 7, 16, "13:50:48.481Z"], "modifiedTimestamp": [2012, 7, 23, "18:15:31.795Z"], "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 45", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" } }, "body": { "concepts": [{ "content": "Dividing" }, { "content": "Day 1: Light/dark" }, { "content": "Day 2: Waters above/below" }, { "content": "Day 3: Waters/land" }, { "content": "Filling" }, { "content": "Day 4: Sun, moon, stars" }, { "content": "Day 5: Birds and fish" }, { "content": "Day 6: Land animals and man" }, { "content": "Day 7: Sabbath" }] } } },
        { "id": "kyk:2012-08-11T13:56:27.048Z:ol", "key": ["kyk:2012-08-11T13:56:27.048Z:ol", "panel: pjleithart"], "value": { "_id": "kyk:2012-08-11T13:56:27.048Z:ol", "_rev": "4-f5e815bd0b448b35c18f26be665ed67b", "head": { "contentType": "panel", "title": "The sign of the covenant", "ScriptureRange": "Genesis 17:1-27", "contentParams": { "repeat": 5, "header": false }, "submissionTimestamp": [2012, 8, 11, "13:56:27.048Z"], "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 69", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" }, "modifiedTimestamp": [2012, 8, 11, "14:02:34.306Z"] }, "body": { "concepts": [{ "content": "vv. 1-2 Yahweh promises to multiply" }, { "content": "v. 3 Abram falls on his face" }, { "content": "vv. 4-6 Abraham father of nations" }, { "content": "v. 7 Yahweh will carry out oath" }, { "content": "vv. 9-14 Sign of the covenant" }, { "content": "v. 16 Yahweh promises to bless Sarai" }, { "content": "vv. 17-18 Abraham falls on his face" }, { "content": "v. 19 Sarah mother of Isaac" }, { "content": "vv. 19-21 Yahweh will carry out oath" }, { "content": "vv. 23-27 Sign of the covenant" }] } } },
        { "id": "kyk:2012-08-11T14:12:18.150Z:ol", "key": ["kyk:2012-08-11T14:12:18.150Z:ol", "panel: pjleithart"], "value": { "_id": "kyk:2012-08-11T14:12:18.150Z:ol", "_rev": "5-da4820723a51435190b45e8607664143", "head": { "contentType": "panel", "title": "Scattered", "ScriptureRange": "Genesis 11:1-9", "contentParams": { "repeat": 6, "header": false }, "submissionTimestamp": [2012, 8, 11, "14:12:18.150Z"], "modifiedTimestamp": [2012, 9, 15, "15:16:35.697Z"], "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 67", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" } }, "body": { "concepts": [{ "content": "v. 1 one language / one kind of speech" }, { "content": "v. 2 there" }, { "content": "v. 3 each other" }, { "content": "v. 4 build a city" }, { "content": "v. 5 name" }, { "content": "v. 5 scattered" }, { "content": "v. 6 one people / one language" }, { "content": "v. 7 there" }, { "content": "v. 7 each other" }, { "content": "v. 8 building a city" }, { "content": "v. 9 its name" }, { "content": "v. 9 scattered" }] } } },
        { "id": "kyk:2012-08-11T14:23:53.058Z:ol", "key": ["kyk:2012-08-11T14:23:53.058Z:ol", "panel: pjleithart"], "value": { "_id": "kyk:2012-08-11T14:23:53.058Z:ol", "_rev": "3-0f6cd7a19bd6cb3d5aacb78b85070838", "head": { "contentType": "panel", "title": "Tabernacle \"house\"", "ScriptureRange": "", "contentParams": { "repeat": 4, "header": true }, "submissionTimestamp": [2012, 8, 11, "14:23:53.058Z"], "modifiedTimestamp": [2012, 8, 11, "14:28:08.943Z"], "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 84", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" } }, "body": { "concepts": [{ "content": "Tabernacle" }, { "content": "Courtyard" }, { "content": "Holy Place" }, { "content": "Most Holy Place" }, { "content": "House" }, { "content": "\"Kitchen\"" }, { "content": "\"Living Room\"" }, { "content": "\"Throne Room\"" }, { "content": "Sinai" }, { "content": "Base (people)" }, { "content": "Middle (elders)" }, { "content": "Top (Moses)" }, { "content": "Israel" }, { "content": "People" }, { "content": "Priests" }, { "content": "High Priest" }] } } },
        { "id": "kyk:2012-08-13T04:37:27.482Z:ps", "key": ["kyk:2012-08-13T04:37:27.482Z:ps", "person: Capezza, Rick"], "value": { "_id": "kyk:2012-08-13T04:37:27.482Z:ps", "_rev": "1-9896a821c00c413fb9aedf67615877fc", "name": { "title": "Dr.", "first": "Rick", "middle": "", "last": "Capezza", "suffix": "" }, "organization": { "name": "Chaplain, St. Luke's Regional Medical Center", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-08-13T04:40:38.085Z:ol", "key": ["kyk:2012-08-13T04:40:38.085Z:ol", "chiasm: rcapezza"], "value": { "_id": "kyk:2012-08-13T04:40:38.085Z:ol", "_rev": "4-9438adde1f70809ab45267f4971d241d", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ps. 50:1-23", "submissionTimestamp": [2012, 8, 12, "04:40:38.085Z"], "author": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps", "authorShortname": "rcapezza" }, "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 8, 12, "04:47:03.342Z"], "submittedBy": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps" } }, "body": { "concepts": [{ "content": "El, Elohim, Yahweh (1)" }, { "content": "“he does not keep silence” (3)" }, { "content": "“I will testify against you” (7)" }, { "content": "“Not for your sacrifices do I rebuke you” (8)" }, { "content": "Continuous sacrifice (8)" }, { "content": "Salvation (15)" }, { "content": "Honor/Dishonor (15-16)" }, { "content": "Apostasy (“cast my words behind you”) (17)" }, { "content": "Continuous slander (20)" }, { "content": "“I rebuke you” (21)" }, { "content": "“[I] lay the charge before you” (21)" }, { "content": "“I have been silent” (21)" }, { "content": "Eloah, Elohim (22-23)" }] } } },
        { "id": "kyk:2012-08-13T04:43:12.246Z:ol", "key": ["kyk:2012-08-13T04:43:12.246Z:ol", "chiasm: rcapezza"], "value": { "_id": "kyk:2012-08-13T04:43:12.246Z:ol", "_rev": "2-477390a55698905501f77fb4278ae753", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ps. 50:1-6", "author": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps", "authorShortname": "rcapezza" }, "submittedBy": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps" }, "submissionTimestamp": [2012, 8, 12, "04:43:12.246Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 8, 12, "04:43:28.327Z"] }, "body": { "concepts": [{ "content": "Elohim (1)" }, { "content": "Earth [creation] (1)" }, { "content": "\"Zion, perfection of beauty\" [cult] (2)" }, { "content": "“Our God” [covenant] (3a)" }, { "content": "Heavens (4a)" }, { "content": "Earth (4b)" }, { "content": "“his people” [covenant] (4b)" }, { "content": "“ratify my covenant by sacrifice” [cult] (5)" }, { "content": "Heavens [creation] (6)" }, { "content": "Elohim (6)" }] } } },
        { "id": "kyk:2012-08-13T04:45:05.072Z:ol", "key": ["kyk:2012-08-13T04:45:05.072Z:ol", "chiasm: rcapezza"], "value": { "_id": "kyk:2012-08-13T04:45:05.072Z:ol", "_rev": "2-b39a8450288e18d315c3f70b746e21b8", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ps. 50:7-15", "author": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps", "authorShortname": "rcapezza" }, "submittedBy": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps" }, "submissionTimestamp": [2012, 8, 12, "04:45:05.072Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 8, 12, "04:45:38.070Z"] }, "body": { "concepts": [{ "content": "\"I will charge you\" (7)." }, { "content": "improper sacrifices (8)" }, { "content": "bulls and goats (9)" }, { "content": "\"mine is all life\" (10)" }, { "content": "“I know all...” (11)" }, { "content": "\"for mine is the world and its fullness\" (12)" }, { "content": "bulls and goats (13)" }, { "content": "proper sacrifices (14)" }, { "content": "\"I will rescue you\" (15)" }] } } },
        { "id": "kyk:2012-08-13T04:46:25.497Z:ol", "key": ["kyk:2012-08-13T04:46:25.497Z:ol", "chiasm: rcapezza"], "value": { "_id": "kyk:2012-08-13T04:46:25.497Z:ol", "_rev": "2-0492225fbfc7514bf574dad435bbab35", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ps. 50:16-23", "author": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps", "authorShortname": "rcapezza" }, "submittedBy": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps" }, "submissionTimestamp": [2012, 8, 12, "04:46:25.497Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 8, 13, "00:18:17.205Z"] }, "body": { "concepts": [{ "content": "Law (16)" }, { "content": "\"you despise my words\" (17)" }, { "content": "man delights in sin (18)" }, { "content": "mouth of evil (19)" }, { "content": "mouth of slander (20)" }, { "content": "they imagine God is like man (21)" }, { "content": "God-forgetters (22)" }, { "content": "Sacrifice (23)" }] } } },
        { "id": "kyk:2012-08-13T04:53:47.343Z:ol", "key": ["kyk:2012-08-13T04:53:47.343Z:ol", "chiasm: rcapezza"], "value": { "_id": "kyk:2012-08-13T04:53:47.343Z:ol", "_rev": "2-db4b119ca416134298377a94399fccbe", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Jonah 1:17-2:10", "author": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps", "authorShortname": "rcapezza" }, "submittedBy": { "guid": "kyk:2012-08-13T04:37:27.482Z:ps" }, "submissionTimestamp": [2012, 8, 12, "04:53:47.343Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2012, 8, 12, "04:53:55.290Z"] }, "body": { "concepts": [{ "content": "Jonah swallowed by a fish (1:17)" }, { "content": "Jonah calls on God for salvation (2:1-2)" }, { "content": "Descending into the abyss (2:3-4)" }, { "content": "Death and resurrection of Jonah (2:5-6)" }, { "content": "Looking up at God’s temple / prayer has arisen (2:7) " }, { "content": "Jonah praises God for salvation (2:8-9)" }, { "content": "Jonah vomited out (2:10)" }] } } },
        { "id": "kyk:2012-09-17T17:04:01.179Z:ol", "key": ["kyk:2012-09-17T17:04:01.179Z:ol", "chiasm: jamotyer"], "value": { "_id": "kyk:2012-09-17T17:04:01.179Z:ol", "_rev": "2-41304fbfe612b6e0047390d4bfca5606", "head": { "contentType": "chiasm", "title": "The Lion's roar: universal judgment and its grounds", "ScriptureRange": "Amos 1:2-3:8", "submissionTimestamp": [2012, 9, 17, "17:04:01.179Z"], "author": { "guid": "kyk:2012-09-17T17:05:01.875Z:ps", "authorShortname": "jamotyer" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 794-795, Amos", "website": "", "guid": "kyk:2012-09-17T17:09:05.258Z:sr" }, "modifiedTimestamp": [2012, 9, 17, "17:09:15.987Z"] }, "body": { "concepts": [{ "content": "The Lion's roar: the LORD's voice, 1:2" }, { "content": "Against the pagan peoples, 1:3-2:3" }, { "content": "Against the chosen peoples, 2:4-3:2" }, { "content": "The Lion's roar: the prophetic word, 3:3-8" }] } } },
        { "id": "kyk:2012-09-17T17:05:01.875Z:ps", "key": ["kyk:2012-09-17T17:05:01.875Z:ps", "person: Motyer, J."], "value": { "_id": "kyk:2012-09-17T17:05:01.875Z:ps", "_rev": "2-2778caabacd4223bcffcef2a47b9a613", "name": { "title": "", "first": "J.", "middle": "A.", "last": "Motyer", "suffix": "" }, "organization": { "name": "Trinity College, Bristol, UK", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-09-17T17:09:05.258Z:sr", "key": ["kyk:2012-09-17T17:09:05.258Z:sr", "source: New Bible Commentary"], "value": { "_id": "kyk:2012-09-17T17:09:05.258Z:sr", "_rev": "1-ce275ff3c0e803f29d976e50cc0c6313", "media": "book", "details": "New Bible Commentary", "website": "", "publisherDetails": "Inter-Varsity Press, 2001", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-09-17T17:15:13.373Z:ol", "key": ["kyk:2012-09-17T17:15:13.373Z:ol", "chiasm: jamotyer"], "value": { "_id": "kyk:2012-09-17T17:15:13.373Z:ol", "_rev": "2-cbf9368805e186bbcb15e3d8741508d4", "head": { "contentType": "chiasm", "title": "An enemy around the land: the Lord's anger", "ScriptureRange": "Amos 3:9-6:14", "submissionTimestamp": [2012, 9, 17, "17:15:13.373Z"], "modifiedTimestamp": [2012, 9, 17, "17:17:03.356Z"], "author": { "guid": "kyk:2012-09-17T17:05:01.875Z:ps", "authorShortname": "jamotyer" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 794-795, Amos", "website": "", "guid": "kyk:2012-09-17T17:09:05.258Z:sr" } }, "body": { "concepts": [{ "content": "The shattered kingdom, 3:9-15" }, { "content": "The leading women, 4:1-3" }, { "content": "Religion without repentance, 4:4-13" }, { "content": "Religion without reformation, 5:1-27" }, { "content": "The leading men, 6:1-7" }, { "content": "The shattered kingdom, 6:8-14" }] } } },
        { "id": "kyk:2012-09-17T17:22:26.987Z:ol", "key": ["kyk:2012-09-17T17:22:26.987Z:ol", "chiasm: jamotyer"], "value": { "_id": "kyk:2012-09-17T17:22:26.987Z:ol", "_rev": "2-273191c6ce912e7bf633009b6fddbda1", "head": { "contentType": "chiasm", "title": "The Lord God: judgment and hope", "ScriptureRange": "Amos 7:1-9:15", "submissionTimestamp": [2012, 9, 17, "17:22:26.987Z"], "modifiedTimestamp": [2012, 9, 17, "17:23:19.923Z"], "author": { "guid": "kyk:2012-09-17T17:05:01.875Z:ps", "authorShortname": "jamotyer" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 794-795, Amos", "website": "", "guid": "kyk:2012-09-17T17:09:05.258Z:sr" } }, "body": { "concepts": [{ "content": "The devastation that will not be, 7:1-6" }, { "content": "Discriminating judgment, 7:7-9" }, { "content": "The inescapable word, 7:10-17" }, { "content": "'In that day'" }, { "content": "The inescapable judgment, 9:1-6" }, { "content": "Discriminating judgment, 9:7-10" }, { "content": "The hope that will be, 9:11-15" }] } } },
        { "id": "kyk:2012-10-08T17:15:10.957Z:ps", "key": ["kyk:2012-10-08T17:15:10.957Z:ps", "person: Barach, John"], "value": { "_id": "kyk:2012-10-08T17:15:10.957Z:ps", "_rev": "1-fa241f46f4bbfad66c9e1f1dac56f2cf", "name": { "title": "Pastor", "first": "John", "middle": "", "last": "Barach", "suffix": "" }, "organization": { "name": "The Bucer Institute", "website": "barach.us" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-10-08T17:16:50.948Z:sr", "key": ["kyk:2012-10-08T17:16:50.948Z:sr", "source: Bucer lectures"], "value": { "_id": "kyk:2012-10-08T17:16:50.948Z:sr", "_rev": "1-5f6af293467825bea13e7b155a44ca07", "media": "class", "details": "Bucer lectures", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-10-08T17:17:22.097Z:ol", "key": ["kyk:2012-10-08T17:17:22.097Z:ol", "chiasm: jbarach"], "value": { "_id": "kyk:2012-10-08T17:17:22.097Z:ol", "_rev": "1-a278b319e505efb1c28e41d385fa9b0c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Phil 1-4", "author": { "guid": "kyk:2012-10-08T17:15:10.957Z:ps", "authorShortname": "jbarach" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "Philippians", "website": "", "guid": "kyk:2012-10-08T17:16:50.948Z:sr" }, "submissionTimestamp": [2012, 10, 8, "17:17:22.097Z"] }, "body": { "concepts": [{ "content": "Greetings & grace (1:1-2)" }, { "content": "Thanksgiving for their partnership (1:3-8)" }, { "content": "Prayer for love to abound in discernment (1:9-11): “approve what is valuable.”" }, { "content": "Paul’s situation: advance in spite of ill-will (1:12-18a): rejoice." }, { "content": "Paul’s expectation & plans (1:18b-26)" }, { "content": "Conduct: unity (1:27-30)" }, { "content": "Having the “in Christ Jesus” thinking (2:1-11)" }, { "content": "Conduct: unity (2:12-18)" }, { "content": "Paul’s plans: send Timothy & Epaphroditus (2:19-30)" }, { "content": "Enemies of the gospel (3:1-4:4 ??): inclusio “rejoice in the Lord.”" }, { "content": "Prayer & discernment  (4:5-9): “think on these things.”  (Or: 4:2-9: love, prayer…?)" }, { "content": "Their partnership (4:10-20)" }, { "content": "Greetings and grace (4:21-23)" }] } } },
        { "id": "kyk:2012-10-08T17:20:24.070Z:ps", "key": ["kyk:2012-10-08T17:20:24.070Z:ps", "person: Heil, John"], "value": { "_id": "kyk:2012-10-08T17:20:24.070Z:ps", "_rev": "1-643e9f04b75a4f1135e59f85737ad091", "name": { "title": "", "first": "John", "middle": "Paul", "last": "Heil", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-10-08T17:22:15.237Z:sr", "key": ["kyk:2012-10-08T17:22:15.237Z:sr", "source: Philippians: Let Us Rejoice in Being Conformed to Christ"], "value": { "_id": "kyk:2012-10-08T17:22:15.237Z:sr", "_rev": "1-ed947ed91a6f21091e848c6a1be3e5c0", "media": "book", "details": "Philippians: Let Us Rejoice in Being Conformed to Christ", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-10-08T17:22:39.239Z:ol", "key": ["kyk:2012-10-08T17:22:39.239Z:ol", "chiasm: jpheil"], "value": { "_id": "kyk:2012-10-08T17:22:39.239Z:ol", "_rev": "1-339e43fef8179b57c3f74f85b2b2acbc", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Phil 1-4", "author": { "guid": "kyk:2012-10-08T17:20:24.070Z:ps", "authorShortname": "jpheil" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "kyk:2012-10-08T17:22:15.237Z:sr" }, "submissionTimestamp": [2012, 10, 8, "17:22:39.239Z"] }, "body": { "concepts": [{ "content": "Grace from the Lord Jesus Christ to the Holy Ones (1:1-2)" }, { "content": "My prayer that you may abound and be filled to glory and praise of God (1:3-11)" }, { "content": "I rejoice and I will be joyful (1:12-18)" }, { "content": "Death in my body is gain, but remaining in the flesh is for your faith (1:19-30)" }, { "content": "Joy in humility for the day of Christ who humbled himself to the point of death (2:1-16)" }, { "content": "Rejoice with those who neared death for the work of Christ (2:17-30)" }, { "content": "Gain in faith in the death of Christ and the body of his glory (3:1-21)" }, { "content": "Rejoice in the Lord, rejoice (4:1-5)" }, { "content": "Glory to God who will fulfill you as I am filled and abound (4:6-20)" }, { "content": "Greeting from holy ones and grace from the Lord Jesus Christ (4:21-23)" }] } } },
        { "id": "kyk:2012-10-08T17:46:20.715Z:sr", "key": ["kyk:2012-10-08T17:46:20.715Z:sr", "source: Ephesians : Empowerment to Walk in Love for the Unity of All in "], "value": { "_id": "kyk:2012-10-08T17:46:20.715Z:sr", "_rev": "1-fb280aee5ab6bec240acdaa8ec73a48a", "media": "", "details": "Ephesians : Empowerment to Walk in Love for the Unity of All in Christ", "website": "www.scribd.com/doc/71153330/5/The-Chiastic-Structures-of-Ephesians", "publisherDetails": "Society of Biblical Literature, Atlanta (2007)", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-10-08T17:47:54.017Z:ol", "key": ["kyk:2012-10-08T17:47:54.017Z:ol", "chiasm: jpheil"], "value": { "_id": "kyk:2012-10-08T17:47:54.017Z:ol", "_rev": "1-b5532a5f169c5a06298511ab01fdde0f", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ephesians 1-6", "author": { "guid": "kyk:2012-10-08T17:20:24.070Z:ps", "authorShortname": "jpheil" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "kyk:2012-10-08T17:46:20.715Z:sr" }, "submissionTimestamp": [2012, 10, 8, "17:47:54.017Z"] }, "body": { "concepts": [{ "content": "Grace and Peace (1:1-2)" }, { "content": "To the Praise of His Glory in Love (1:3-14)" }, { "content": "The Gift of Christ in Love as Head Over All to the Church (1:15-23)" }, { "content": "Walking by the Great Love with Which He Loved Us (2:1-10)" }, { "content": "The One New Person as the Gift of Peace in Love (2:11-22)" }, { "content": "Paul's Gift to Make Known the Mystery of Christ in Love (3:1-13)" }, { "content": "To Know the Love of Christ That Surpasses Knowledge (3:14-21)" }, { "content": "Walk toward the Unity of All in Love (4:1-16)" }, { "content": "Walk as the New Person in the Truth of Christ's Love (4:17-32)" }, { "content": "Walk in Love as Christ Loved Us (5:1-6)" }, { "content": "Walk as Children of Live in Love (5:7-14)" }, { "content": "Walk in Love as Those who Are Wise (5:15-6:9)" }, { "content": "To Be Empowered in Love to Withstand Evil (6:10-13)" }, { "content": "Beloved Tychicus Will Encourage Your Hearts in Love (6:14-22)" }, { "content": "Peace, Love, and Grace (6:23-24)" }] } } },
        { "id": "kyk:2012-10-08T18:11:45.151Z:ol", "key": ["kyk:2012-10-08T18:11:45.151Z:ol", "chiasm: egreene"], "value": { "_id": "kyk:2012-10-08T18:11:45.151Z:ol", "_rev": "5-fe036354f876e3b4af9e13fcce6fe375", "head": { "contentType": "chiasm", "title": "Justified by \"the Faith\" not by \"the Law\"", "ScriptureRange": "Galatians 1:6-4:31", "submissionTimestamp": [2012, 10, 8, "18:11:45.151Z"], "author": { "guid": "kyk:2012-10-08T18:12:20.476Z:ps", "authorShortname": "egreene" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "modifiedTimestamp": [2012, 10, 8, "18:30:51.186Z"], "source": { "details": "", "website": "", "guid": "kyk:2012-10-08T18:16:58.060Z:sr" } }, "body": { "concepts": [{ "content": "Curse Upon The False Preachers (1:6-10)" }, { "content": "Paul's Conversion From the Old Era to Christ (1:11-24)" }, { "content": "Jews & Gentiles Are Now Equal In The New Covenant (2:1-10)" }, { "content": "Justified Through Faith In Christ, Not From Works Of The Law (2:11-21)" }, { "content": "Law's Inability: \"Works Of The Law\" Can Not Give The Spirit (3:1-5)" }, { "content": "Abraham's Faith And Sons of Faith (3:6-9)" }, { "content": "Christ Suffered The Law's Curse, Establishing The Faith (3:10-14)" }, { "content": "Abraham's One-Seed and God's Promise (3:15-18)" }, { "content": "Law's Purpose: \"The Law\" Points Out Transgressions (3:19-22)" }, { "content": "Justified Through The Faith, No Longer Under The Law (3:23-29)" }, { "content": "Jews & Gentiles Are Now Adopted In The New Covenant (4:1-7)" }, { "content": "Galatians' Reversion From Christ To The Old Era (4:8-20)" }, { "content": "Cast Out The Old Covenant (4:21-31)" }] } } },
        { "id": "kyk:2012-10-08T18:12:20.476Z:ps", "key": ["kyk:2012-10-08T18:12:20.476Z:ps", "person: Greene, Eric"], "value": { "_id": "kyk:2012-10-08T18:12:20.476Z:ps", "_rev": "1-ade31d018b5ba04ffb49e918b783eaab", "name": { "title": "", "first": "Eric", "middle": "", "last": "Greene", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2012-10-08T18:16:58.060Z:sr", "key": ["kyk:2012-10-08T18:16:58.060Z:sr", "source: Galatians Outline"], "value": { "_id": "kyk:2012-10-08T18:16:58.060Z:sr", "_rev": "1-cdc23f9340260faaefaddf726e7e6906", "media": "", "details": "Galatians Outline", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2012-10-08T18:17:12.973Z:ol", "key": ["kyk:2012-10-08T18:17:12.973Z:ol", "chiasm: egreene"], "value": { "_id": "kyk:2012-10-08T18:17:12.973Z:ol", "_rev": "1-36d07da46e44103b635f8978f82e78a1", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Galatians 1-6", "author": { "guid": "kyk:2012-10-08T18:12:20.476Z:ps", "authorShortname": "egreene" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "kyk:2012-10-08T18:16:58.060Z:sr" }, "submissionTimestamp": [2012, 10, 8, "18:17:12.973Z"] }, "body": { "concepts": [{ "content": "Introduction: Paul's Apostleship Is From God (1:1-5)" }, { "content": "Justified by \"the Faith\" not by \"the Law\" (1:6-4:31)" }, { "content": "Life in the \"the Spirit\" and \"the fruit\" (5:1-6:15)" }, { "content": "Conclusion: Paul Bears The Marks Of Christ (6:16-18)" }] } } },
        { "id": "kyk:2012-10-08T18:24:58.603Z:ol", "key": ["kyk:2012-10-08T18:24:58.603Z:ol", "chiasm: egreene"], "value": { "_id": "kyk:2012-10-08T18:24:58.603Z:ol", "_rev": "3-39288b619cafe1e5de7e8af953d4fa08", "head": { "contentType": "chiasm", "title": "Life in \"the Spirit\" and \"the fruit\"", "ScriptureRange": "Galatians 5:1-6:15", "author": { "guid": "kyk:2012-10-08T18:12:20.476Z:ps", "authorShortname": "egreene" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "kyk:2012-10-08T18:16:58.060Z:sr" }, "submissionTimestamp": [2012, 10, 8, "18:24:58.603Z"], "modifiedTimestamp": [2012, 10, 8, "18:31:42.925Z"] }, "body": { "concepts": [{ "content": "Liberty From Old Law Bondage (5:1-6)" }, { "content": "God's Judgment on Troublemakers (5:7-12)" }, { "content": "Fulfill the Law – Love Your Neighbor (5:13-15)" }, { "content": "Walk in the Spirit (5:16-25)" }, { "content": "Fulfill the Law of Christ – Bear Burdens (6:1-5)" }, { "content": "God's Blessing on Spirit-Sowers (6:6-10)" }, { "content": "Fear and Failure of Old Law People (6:11-15)" }] } } },
        { "id": "kyk:2013-03-08T15:44:01.344Z:ol", "key": ["kyk:2013-03-08T15:44:01.344Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T15:44:01.344Z:ol", "_rev": "1-ad7d527f4b2849870e6a9d6bd894ca7f", "head": { "contentType": "chiasm", "title": "Heptamerous structure of creation", "ScriptureRange": "Genesis 1:3-2:3", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "15:44:01.344Z"] }, "body": { "concepts": [{ "content": "Light, 1:3-5" }, { "content": "Form: firmament, 1:6-8" }, { "content": "Filling: sea and land; grain plants and fruit trees, 1:9-13" }, { "content": "Lights filling the firmament, 1:14-19" }, { "content": "Filling: fish in sea, birds on land (swarms), 1:20-23" }, { "content": "Form: man over all, 1:24-31" }, { "content": "Sabbath (fullness of light), 2:1-3" }] } } },
        { "id": "kyk:2013-03-08T15:50:25.042Z:ol", "key": ["kyk:2013-03-08T15:50:25.042Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T15:50:25.042Z:ol", "_rev": "1-c87f0db6aa44c664fb707ba986164b11", "head": { "contentType": "chiasm", "title": "General heptamerous schema", "ScriptureRange": "", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "15:50:25.042Z"] }, "body": { "concepts": [{ "content": "Some form of Light, or of God's Presence" }, { "content": "A firmament between God & man" }, { "content": "Land, plants, separations between land and sea, Jew and Gentile" }, { "content": "Lights, rulers" }, { "content": "Swarms, multitudes, commands" }, { "content": "Man" }, { "content": "Sabbath" }] } } },
        { "id": "kyk:2013-03-08T15:59:33.735Z:ol", "key": ["kyk:2013-03-08T15:59:33.735Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T15:59:33.735Z:ol", "_rev": "1-7cc6e83ec2e2a44708367e23849a6af2", "head": { "contentType": "chiasm", "title": "Heptamerous creation of man", "ScriptureRange": "Genesis 2", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "15:59:33.735Z"] }, "body": { "concepts": [{ "content": "Creation of man, the human light, 2:1-7" }, { "content": "The garden, between Eden and world, 2:8" }, { "content": "Trees, and waters to the lands, 2:9-14" }, { "content": "Man put into garden, 2:15" }, { "content": "Trees and commands, 2:16-17" }, { "content": "Animals and woman, 2:18-25" }, { "content": "Sabbath: fall of man, no sabbath for him!, 3:1-24" }] } } },
        { "id": "kyk:2013-03-08T16:01:31.318Z:ol", "key": ["kyk:2013-03-08T16:01:31.318Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:01:31.318Z:ol", "_rev": "1-43832559de089f44fe335421f77a4200", "head": { "contentType": "chiasm", "title": "Heptamerous creation of Israel", "ScriptureRange": "Leviticus 23", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:01:31.318Z"] }, "body": { "concepts": [{ "content": "Sabbath day: the first day, light" }, { "content": "Passover: established the firmament people" }, { "content": "Firstfruits: of the land" }, { "content": "Pentecost: law and full establishment of the people" }, { "content": "Trumpets: gathering the host" }, { "content": "Covering: restoring man" }, { "content": "Clouds/Booths: festive rest with God" }, { "content": "The Geography of the Biblical Narrative" }] } } },
        { "id": "kyk:2013-03-08T16:03:56.311Z:ol", "key": ["kyk:2013-03-08T16:03:56.311Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:03:56.311Z:ol", "_rev": "1-8b7e305c36e71ed366d9ef420521c231", "head": { "contentType": "chiasm", "title": "Heptamerous event structure of the Bible", "ScriptureRange": "", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:03:56.311Z"] }, "body": { "concepts": [{ "content": "Eden" }, { "content": "Cataclysm (Flood)" }, { "content": "Period of early empires and Shemitees" }, { "content": "Babel: confusion of tongues" }, { "content": "Abram enters land from North" }, { "content": "Sojourn south in Egypt" }, { "content": "Moses and Joshua take the land" }, { "content": "Babylon: confusion of tongues (Daniel 5)" }, { "content": "Period of later empires and Jews" }, { "content": "Cataclysm: AD 70 (\"end like a flood\")" }, { "content": "Millennium and New Jerusalem" }] } } },
        { "id": "kyk:2013-03-08T16:13:45.619Z:ol", "key": ["kyk:2013-03-08T16:13:45.619Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:13:45.619Z:ol", "_rev": "1-b0dfac9422b0b9bcdc5f9ff7291436ef", "head": { "contentType": "chiasm", "title": "Chiasm of the Hexateuch (From Abram to Joshua)", "ScriptureRange": "", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:13:45.619Z"] }, "body": { "concepts": [{ "content": "Abram settles in the Land, which is also Egypt (beginning of 430 years), Gen. 12-50" }, { "content": "Judgment on Egypt, Ex. 1-11" }, { "content": "Passover, Ex. 12-13" }, { "content": "Crossing the Red Sea, Ex. 14-15" }, { "content": "Law from Yahweh at Sinai, Ex. 16-31" }, { "content": "Rebellion at the Golden Calf, Ex. 32-34" }, { "content": "Building the Symbolic House of Yahweh, Ex. 35-40" }, { "content": "Covering, Lev. 1-7" }, { "content": "Narrative of Priests’ investiture and rebellion; death of sons, Lev. 8-10" }, { "content": "Cleanness, Lev. 11-15" }, { "content": "Day of Covering, Lev. 16" }, { "content": "Holiness, 17:1-24:9" }, { "content": "Narrative of Israelite rebellion; death of a son, Lev. 24:10-23" }, { "content": "Redemption, Lev. 25-27" }, { "content": "Building the People-House of Yahweh, Num. 1-10" }, { "content": "Rebellion in the Wilderness, Num. 11-36" }, { "content": "Law from Moses in the Plains of Moab, Deuteronomy 1-34" }, { "content": "Crossing the Jordan, Josh. 1-4" }, { "content": "Passover, Josh. 5" }, { "content": "Judgment on Canaan, Josh. 6-12" }, { "content": "Settlement in the Land, Josh. 13-24" }] } } },
        { "id": "kyk:2013-03-08T16:16:55.441Z:ol", "key": ["kyk:2013-03-08T16:16:55.441Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:16:55.441Z:ol", "_rev": "2-cb5e22778f48542b905d2274557c8e1d", "head": { "contentType": "chiasm", "title": "The First Seven Books", "ScriptureRange": "", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:16:55.441Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 3, 8, "16:24:30.163Z"] }, "body": { "concepts": [{ "content": "Genesis - narratives" }, { "content": "Exodus - narrative, house description" }, { "content": "Leviticus - law from God" }, { "content": "Numbers - narrative, camp description, and law: pivot, death of High Priest" }, { "content": "Deuteronomy - law from Moses" }, { "content": "Joshua - narrative, land description" }, { "content": "Judges - narratives" }] } } },
        { "id": "kyk:2013-03-08T16:19:17.520Z:ol", "key": ["kyk:2013-03-08T16:19:17.520Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:19:17.520Z:ol", "_rev": "1-9db81465382a256272f97b1365a0192d", "head": { "contentType": "chiasm", "title": "Chiastic Structure of Genesis (Generations)", "ScriptureRange": "Genesis", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:19:17.520Z"] }, "body": { "concepts": [{ "content": "Generations of Heaven and Earth - Garden; Fall; Brother-Murder" }, { "content": "Generations of Adam - Righteous men; Intermarriage" }, { "content": "Generations of Noah - Transition from old world to new world; New priestly people" }, { "content": "Generations of Sons of Noah" }, { "content": "Tower of Babel" }, { "content": "Generations of Shem" }, { "content": "Generations of Terah - Abram moves from old world to new; New priestly people" }, { "content": "Generations of Ishmael and Isaac - Jacob as righteous man; Sons sin in the area of intermarriage" }, { "content": "Generations of Esau and Jacob - Brother-Murder; Restoration to Garden (Goshen)" }] } } },
        { "id": "kyk:2013-03-08T16:32:05.756Z:ol", "key": ["kyk:2013-03-08T16:32:05.756Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:32:05.756Z:ol", "_rev": "1-680894fe049d5fc2330a07aed697cfbd", "head": { "contentType": "chiasm", "title": "Chiastic structure of Exodus", "ScriptureRange": "Exodus", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:32:05.756Z"] }, "body": { "concepts": [{ "content": "Israel in Pharaoh’s house, building for Pharaoh, 1:1-2:10" }, { "content": "Moses acts as judge, kills a man, rejected by Israel, 2:11-14" }, { "content": "Moses in the wilderness with Jethro; God speaks at Sinai, 2:15-4:20" }, { "content": "God claims the firstborn, 4:21-23" }, { "content": "Circumcision: blood displayed, 4:24-26" }, { "content": "Meeting with the elders of Israel, 4:27-31" }, { "content": "Initial meetings with Pharaoh; directions for plagues, 5:1-7:13" }, { "content": "The Nine Plagues, 7:14-10:29" }, { "content": "Final meeting with Pharaoh; directions for Passover, 11:1-12:20" }, { "content": "Meeting with the elders of Israel, 12:21-28" }, { "content": "Passover: blood displayed, 12:29-51" }, { "content": "God claims the firstborn, 13:1-16" }, { "content": "Israel in the wilderness with Jethro; God speaks at Sinai, ch. 14-31" }, { "content": "Moses acts as judge, men are killed, because he was rejected by Israel, ch. 32-34" }, { "content": "Israel in Yahweh’s camp, building for Yahweh, ch. 35-40" }] } } },
        { "id": "kyk:2013-03-08T16:35:07.139Z:ol", "key": ["kyk:2013-03-08T16:35:07.139Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-03-08T16:35:07.139Z:ol", "_rev": "1-11802500946065a40ec23d8134c9d4e3", "head": { "contentType": "chiasm", "title": "Exodus as a Reversal of Genesis", "ScriptureRange": "", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 3, 8, "16:35:07.139Z"] }, "body": { "concepts": [{ "content": "Eden, God’s house" }, { "content": "Fall and killing of a man" }, { "content": "Worship instituted by Enosh in land exiled from Eden" }, { "content": "Flood" }, { "content": "New priestly people (Shem)" }, { "content": "Babel" }, { "content": "Circumcision instituted" }, { "content": "Claim of Abraham’s firstborn (animal substitute)" }, { "content": "Jacob in Laban’s land: leaves, marries, has children, God tells him to leave, goes back" }, { "content": "Joseph rejected by his brothers" }, { "content": "Israel in Pharaoh’s house" }, { "content": "Israel in Pharaoh’s house" }, { "content": "Moses rejected by his brothers" }, { "content": "Moses in Jethro’s land: leaves, marries, has children, God tells him to leave, goes back" }, { "content": "Claim of Moses’ firstborn (circumcision)" }, { "content": "Passover instituted (animal substitute)" }, { "content": "Plagues on Egypt" }, { "content": "New priestly people (firstborn)" }, { "content": "Red Sea crossing" }, { "content": "Worship instituted at Sinai" }, { "content": "Fall at Golden Calf; men killed" }, { "content": "Tabernacle, God’s house" }] } } },
        { "id": "kyk:2013-06-03T03:45:16.319Z:ps", "key": ["kyk:2013-06-03T03:45:16.319Z:ps", "person: Pail, Erik"], "value": { "_id": "kyk:2013-06-03T03:45:16.319Z:ps", "_rev": "1-dc210c99e6241bd468c1c5ad7d3ee173", "name": { "title": "", "first": "Erik", "middle": "", "last": "Pail", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-06-03T17:05:44.809Z:ol", "key": ["kyk:2013-06-03T17:05:44.809Z:ol", "chiasm: jbarach"], "value": { "_id": "kyk:2013-06-03T17:05:44.809Z:ol", "_rev": "4-a0dec8788ed85fdbd4576f1c90fed36b", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "1 Peter", "submissionTimestamp": [2013, 6, 3, "17:05:44.809Z"], "author": { "guid": "kyk:2012-10-08T17:15:10.957Z:ps", "authorShortname": "jbarach" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "2013-05-21", "website": "groups.yahoo.com/group/bibhorizon/message/192313", "guid": "kyk:2011-06-18T18:47:27.948Z:sr" }, "modifiedTimestamp": [2013, 6, 3, "18:49:18.978Z"] }, "body": { "concepts": [{ "content": "Greeting (1:1-2)" }, { "content": "Joy in trial because of inheritance/salvation (1:3-21)" }, { "content": "Fervent love for brothers, begotten by God's Word (1:22-2:3)" }, { "content": "Conduct among Gentiles: spiritual temple abstaining from flesh (2:4-12)" }, { "content": "Honor for all & for king; loving brothers (2:13-17)" }, { "content": "Servants (2:18-20)" }, { "content": "Christ (2:21-25)" }, { "content": "Wives (3:1-6)" }, { "content": "Honor wife; love brothers (3:7-12)" }, { "content": "Conduct contrasted with Gentiles (3:13-4:7)" }, { "content": "Fervent love (4:8-11)" }, { "content": "Joy in trial because of future exaltation (4:12-5:11)" }, { "content": "Farewell (5:12-14)" }] } } },
        { "id": "kyk:2013-06-03T18:05:37.679Z:ps", "key": ["kyk:2013-06-03T18:05:37.679Z:ps", "person: Doolittle, Dan"], "value": { "_id": "kyk:2013-06-03T18:05:37.679Z:ps", "_rev": "1-43715e62a697fd994caff1e7faecf8e9", "name": { "title": "Dr.", "first": "Dan", "middle": "", "last": "Doolittle", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-06-03T18:08:46.352Z:ol", "key": ["kyk:2013-06-03T18:08:46.352Z:ol", "chiasm: ddoolittle"], "value": { "_id": "kyk:2013-06-03T18:08:46.352Z:ol", "_rev": "2-af8cf242b8ae7b80aa3cfecc153cf3ee", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 3:1-4:17", "author": { "guid": "kyk:2013-06-03T18:05:37.679Z:ps", "authorShortname": "ddoolittle" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "2013-05-29", "website": "groups.yahoo.com/group/bibhorizon/message/192588", "guid": "kyk:2011-06-18T18:47:27.948Z:sr" }, "submissionTimestamp": [2013, 6, 3, "18:08:46.352Z"], "modifiedTimestamp": [2013, 6, 3, "18:48:15.606Z"] }, "body": { "concepts": [{ "content": "3.1-2  Repent!  (John)" }, { "content": "3.3-6  Isaiah quote" }, { "content": "3.7-12  Judgment on the Pharisees" }, { "content": "3.13-17  The Baptism of Jesus" }, { "content": "4.1-11  Judgment on Satan" }, { "content": "4.12-16  Isaiah quote" }, { "content": "4.17  Repent!   (Jesus)" }] } } },
        { "id": "kyk:2013-06-03T18:20:50.870Z:ps", "key": ["kyk:2013-06-03T18:20:50.870Z:ps", "person: Sedlak, Jon"], "value": { "_id": "kyk:2013-06-03T18:20:50.870Z:ps", "_rev": "2-613479112b94fdc700f102324d799a31", "name": { "title": "", "first": "Jon", "middle": "", "last": "Sedlak", "suffix": "" }, "organization": { "name": "Epexegesis", "website": "http://www.thisexplainsmore.com/" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-06-03T18:22:27.041Z:sr", "key": ["kyk:2013-06-03T18:22:27.041Z:sr", "source: Epexegesis"], "value": { "_id": "kyk:2013-06-03T18:22:27.041Z:sr", "_rev": "1-59e36b326bc8bb835dc9b9b2f0b25448", "media": "", "details": "Epexegesis", "website": "www.thisexplainsmore.com", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2013-06-03T18:23:51.228Z:ol", "key": ["kyk:2013-06-03T18:23:51.228Z:ol", "chiasm: jsedlak"], "value": { "_id": "kyk:2013-06-03T18:23:51.228Z:ol", "_rev": "3-030d744f4b66d84b51e3c279ceaf1cd8", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 22", "author": { "guid": "kyk:2013-06-03T18:20:50.870Z:ps", "authorShortname": "jsedlak" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "2013-03-29", "website": "www.thisexplainsmore.com/2013/03/psalm-22-literary-structure-translation.html?m=1", "guid": "kyk:2013-06-03T18:22:27.041Z:sr" }, "submissionTimestamp": [2013, 6, 3, "18:23:51.228Z"], "modifiedTimestamp": [2013, 6, 3, "18:46:24.353Z"] }, "body": { "concepts": [{ "content": "vv. 1-2" }, { "content": "vv. 3-5" }, { "content": "vv. 6-8" }, { "content": "vv. 9-11" }, { "content": "vv. 12-15a" }, { "content": "v. 15b" }, { "content": "vv. 16-18" }, { "content": "vv. 19-21" }, { "content": "vv. 25-27" }, { "content": "vv. 28-31" }] } } },
        { "id": "kyk:2013-06-09T03:30:27.805Z:sr", "key": ["kyk:2013-06-09T03:30:27.805Z:sr", "source: two-age.org"], "value": { "_id": "kyk:2013-06-09T03:30:27.805Z:sr", "_rev": "1-cf1a3a9568c9cd64231ae1042918eb37", "media": "website", "details": "two-age.org", "website": "two-age.biblicaltheology.org", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2013-06-09T03:30:58.764Z:ps", "key": ["kyk:2013-06-09T03:30:58.764Z:ps", "person: Doerfel, James"], "value": { "_id": "kyk:2013-06-09T03:30:58.764Z:ps", "_rev": "1-fa3dc9335abec5155fd17c83e9eecf87", "name": { "title": "", "first": "James", "middle": "", "last": "Doerfel", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-06-09T03:31:35.017Z:ol", "key": ["kyk:2013-06-09T03:31:35.017Z:ol", "chiasm: jdoerfel"], "value": { "_id": "kyk:2013-06-09T03:31:35.017Z:ol", "_rev": "1-edcdb23baca3e6ff2315d947f5a19365", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "1 Corinthians 11:17-34", "author": { "guid": "kyk:2013-06-09T03:30:58.764Z:ps", "authorShortname": "jdoerfel" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "kyk:2013-06-09T03:30:27.805Z:sr" }, "submissionTimestamp": [2013, 6, 8, "03:31:35.017Z"] }, "body": { "concepts": [{ "content": "when you come together (18a)" }, { "content": "divisions and heresies (18b-19a)" }, { "content": "when you come together... not to eat... each takes his own before another (20-21a)" }, { "content": "hungry and drunk (21)" }, { "content": "despise the church of God (22b)" }, { "content": "in the same... he was betrayed (23c)" }, { "content": "in remembrance of me (24d, 25d)" }, { "content": "eat this bread and drink this cup (26a)" }, { "content": "you do proclaim the Lord's death till He comes (26b)." }, { "content": "eat this bread and drink this cup (27a)" }, { "content": "in an unworthy manner (27b)" }, { "content": "guilty of the body and blood of the Lord (27c)" }, { "content": "not discerning the Lord's body (29c)" }, { "content": "weak and sick (30)" }, { "content": "when come together to eat... wait for one another (33)" }, { "content": "the remaining matters (34)" }, { "content": "when I come (34)" }] } } },
        { "id": "kyk:2013-07-03T13:31:22.302Z:ol", "key": ["kyk:2013-07-03T13:31:22.302Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-03T13:31:22.302Z:ol", "_rev": "6-20d9547c6ff5cc5de21dc5a67724cbc9", "head": { "contentType": "chiasm", "title": "Disciples clueless & Jesus' authority over darkness", "ScriptureRange": "John 13:27-30", "submissionTimestamp": [2013, 7, 3, "13:31:22.302Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 29, "11:43:02.371Z"], "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" } }, "body": { "concepts": [{ "content": "Then after he had taken the morsel, Satan entered into him. (27a)" }, { "content": "Jesus said to him, \"What you are going to do, do quickly.\" (27b)" }, { "content": "Now no one at the table knew why he said this to him. (28)" }, { "content": "Some thought that, because Judas had the moneybag, Jesus was telling him, \"Buy what we need for the feast,\" or that he should give something to the poor. (29)" }, { "content": "So, after receiving the morsel of bread, he immediately went out. (30a)" }, { "content": "And it was night. (30b)" }] } } },
        { "id": "kyk:2013-07-03T13:37:34.266Z:ps", "key": ["kyk:2013-07-03T13:37:34.266Z:ps", "person: Neumann, Bill"], "value": { "_id": "kyk:2013-07-03T13:37:34.266Z:ps", "_rev": "2-c9bcc2ec0fc7597152a24ab30973f689", "name": { "title": "", "first": "Bill", "middle": "", "last": "Neumann", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-07-07T18:19:43.306Z:ol", "key": ["kyk:2013-07-07T18:19:43.306Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-07T18:19:43.306Z:ol", "_rev": "3-468b65db7dbed452a8f756a2df3e4161", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 117", "submissionTimestamp": [2013, 7, 7, "18:19:43.306Z"], "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 26, "18:06:54.330Z"] }, "body": { "concepts": [{ "content": "Praise the Lord, all nations; laud Him, all peoples! (1)" }, { "content": "For His lovingkindness prevails over us, (2a)" }, { "content": "And the faithfulness of the Lord is everlasting. (2b)" }, { "content": "Praise the Lord! (2c)" }] } } },
        { "id": "kyk:2013-07-07T18:38:11.303Z:ol", "key": ["kyk:2013-07-07T18:38:11.303Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-07T18:38:11.303Z:ol", "_rev": "4-d7d478b06fd32d556f5572a5feb43de3", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 97", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 8, "18:38:11.303Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 26, "18:05:20.677Z"] }, "body": { "concepts": [{ "content": "The Lord reigns; let the earth rejoice; let the many islands be glad. (1)" }, { "content": "Clouds and thick darkness surround Him; (2a)" }, { "content": "Righteousness and justice are the foundation of His throne. (2b)" }, { "content": "Fire goes before Him, and burns up His adversaries round about. (3)" }, { "content": "His lightnings lit up the world; the earth saw and trembled. (4)" }, { "content": "The mountains melted like wax at the presence of the Lord, at the presence of the Lord of the whole earth. (5)" }, { "content": "The heavens declare His righteousness, (6a)" }, { "content": "And all the peoples have seen His glory. (6b)" }, { "content": "Let all those be ashamed who serve graven images, who boast themselves of idols. (7a)" }, { "content": "Worship Him, all you gods. (7b)" }, { "content": "Zion heard this and was glad, and the daughters of Judah have rejoiced (8a)" }, { "content": "Because of Thy judgments, O Lord. (8b)" }, { "content": "For Thou art the Lord Most High over all the earth; (9a)" }, { "content": "Thou art exalted far above all gods. (9b)" }, { "content": "Hate evil, you who love the Lord, (10a)" }, { "content": "Who preserves the souls of His godly ones; He delivers them from the hand of the wicked. (10b)" }, { "content": "Light is sown like seed for the righteous, (11a)" }, { "content": "And gladness for the upright in heart. Be glad in the Lord, you righteous ones; and give thanks to His holy name. (11b-12)" }] } } },
        { "id": "kyk:2013-07-09T04:38:04.015Z:ol", "key": ["kyk:2013-07-09T04:38:04.015Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-09T04:38:04.015Z:ol", "_rev": "2-6fff0a28b469d9edf8ae96d4daecbcbd", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Luke 1:68-78", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 9, "04:38:04.015Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 25, "06:18:38.539Z"] }, "body": { "concepts": [{ "content": "visited us (68)" }, { "content": "salvation (69)" }, { "content": "prophets (70)" }, { "content": "deliverance from our enemies (71)" }, { "content": "our fathers (72a)" }, { "content": "covenant (72b)" }, { "content": "oath (73a)" }, { "content": "our father (73b)" }, { "content": "delivered from the hand of our enemies (74)" }, { "content": "prophet (76)" }, { "content": "salvation (77)" }, { "content": "shall visit us (78)" }] } } },
        { "id": "kyk:2013-07-09T04:54:53.386Z:ol", "key": ["kyk:2013-07-09T04:54:53.386Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-09T04:54:53.386Z:ol", "_rev": "4-4e5b0104a0e5753ad25125a612b1b5e4", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Proverbs 9:1-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 9, "04:54:53.386Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "05:03:52.606Z"] }, "body": { "concepts": [{ "content": "Wisdom (1)", "embeddedType": "panel", "isHead": true }, { "content": "her house (1)", "embeddedType": "panel" }, { "content": "she calls from the tops of the heights of the city (3b)", "embeddedType": "panel" }, { "content": "whoever is naive, let him turn in here! (4a)", "embeddedType": "panel" }, { "content": "to him who lacks understanding she says, (4b)", "embeddedType": "panel" }, { "content": "meat, wine (5)", "embeddedType": "panel" }, { "content": "Forsake folly and live and proceed in the way of understanding. (6)", "embeddedType": "panel" }, { "content": "scoffer (7-8a)" }, { "content": "wise (8b-9a)" }, { "content": "increase (9b)" }, { "content": "The fear of the Lord is the beginning of wisdom (10a)" }, { "content": "and the knowledge of the Holy One is understanding (10b)" }, { "content": "multiplied, added (11)" }, { "content": "wise (12a)" }, { "content": "scoff (12b)" }, { "content": "Folly (13)", "embeddedType": "panel", "isHead": true }, { "content": "her house (14a)", "embeddedType": "panel" }, { "content": "on the high places of the city, calling (14b)", "embeddedType": "panel" }, { "content": "whoever is naive, let him turn in here! (16a)", "embeddedType": "panel" }, { "content": "to him who lacks understanding she says, (16b)", "embeddedType": "panel" }, { "content": "water, bread (17)", "embeddedType": "panel" }, { "content": "But he does not know that the dead are there, her guests are in the depths of Sheol. (18)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-09T18:06:23.375Z:ol", "key": ["kyk:2013-07-09T18:06:23.375Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-09T18:06:23.375Z:ol", "_rev": "2-5519c3a121bff3d9639b86247fd948a7", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 1:18-21", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 9, "18:06:23.375Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 25, "06:23:03.416Z"] }, "body": { "concepts": [{ "content": "Jesus (18a)" }, { "content": "Mary (18b)" }, { "content": "the Holy Spirit (18c)" }, { "content": "Joseph (19)" }, { "content": "behold: an angel of the Lord (20a)" }, { "content": "Joseph (20b)" }, { "content": "the Holy Spirit (20c)" }, { "content": "Mary (21a)" }, { "content": "Jesus (21b)" }] } } },
        { "id": "kyk:2013-07-09T18:11:28.478Z:ol", "key": ["kyk:2013-07-09T18:11:28.478Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-09T18:11:28.478Z:ol", "_rev": "3-1f2d98e74f14fa931bc129b408af4eb5", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 1:18-25", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 9, "18:11:28.478Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "05:47:47.726Z"] }, "body": { "concepts": [{ "content": "behold: an angel of the Lord [embedded] (18-21)", "embeddedOutlineId": "kyk:2013-07-09T18:06:23.375Z:ol" }, { "content": "that what was spoken by the Lord through the prophet might be fulfilled (22)" }, { "content": "the angel of the Lord [embedded] (23-25)", "embeddedOutlineId": "kyk:2013-07-09T18:16:59.901Z:ol" }] } } },
        { "id": "kyk:2013-07-09T18:16:59.901Z:ol", "key": ["kyk:2013-07-09T18:16:59.901Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-09T18:16:59.901Z:ol", "_rev": "3-88cdddba361e9a797ab68229a271c81f", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 1:23-25", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 9, "18:16:59.901Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "06:24:24.055Z"] }, "body": { "concepts": [{ "content": "virgin (23a)", "embeddedType": "panel", "isHead": true }, { "content": "shall bear a Son (23b)", "embeddedType": "panel" }, { "content": "call His name Immanuel (23c)", "embeddedType": "panel" }, { "content": "Joseph (24a)" }, { "content": "the angel of the Lord (24b)" }, { "content": "Joseph (24c)" }, { "content": "virgin (25a)", "embeddedType": "panel", "isHead": true }, { "content": "gave birth to a Son (25b)", "embeddedType": "panel" }, { "content": "called His name Jesus (25c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-12T04:39:32.758Z:ps", "key": ["kyk:2013-07-12T04:39:32.758Z:ps", "person: Sexton, Jeremy"], "value": { "_id": "kyk:2013-07-12T04:39:32.758Z:ps", "_rev": "1-f1bb78f57ac6821a42831bc05ed9a69d", "name": { "title": "", "first": "Jeremy", "middle": "", "last": "Sexton", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-07-12T07:59:36.628Z:ol", "key": ["kyk:2013-07-12T07:59:36.628Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-07-12T07:59:36.628Z:ol", "_rev": "3-18cf2c32f76d176c2b59e3dda2706640", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 18:24-30", "contentParams": { "repeat": 4, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 12, "07:59:36.628Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 25, "06:32:53.711Z"] }, "body": { "concepts": [{ "content": "one who owed him ten thousand talents (24)" }, { "content": "repayment to be made (25)" }, { "content": "\"Have patience with me, and I will repay you everything.\" (26)" }, { "content": "felt compassion and released him and forgave him the debt (27)" }, { "content": "one... who owed him a hundred denarii (28a)" }, { "content": "\"Pay back what you owe.\" (28b)" }, { "content": "\"Have patience with me, and I will repay you.\" (29)" }, { "content": "unwilling... threw him into prison. (30)" }] } } },
        { "id": "kyk:2013-07-16T15:05:10.720Z:ol", "key": ["kyk:2013-07-16T15:05:10.720Z:ol", "chiasm: dadorsey"], "value": { "_id": "kyk:2013-07-16T15:05:10.720Z:ol", "_rev": "2-b2a2690e7c0571ac6aee6323442275fa", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Isaiah", "author": { "guid": "kyk:2012-05-26T12:29:27.509Z:ps", "authorShortname": "dadorsey" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 7, 16, "15:05:10.720Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 16, "15:16:13.044Z"] }, "body": { "concepts": [{ "content": "Condemnation, pleading, promise of future restoration, 1:1-12:6" }, { "content": "Oracles to the nations, 13:1-26:21" }, { "content": "Woes, 27:1-35:10" }, { "content": "historical narrative, 36:1-39:8" }, { "content": "Yahweh triumps over idols, 40:1-48:22" }, { "content": "Servant Songs, 49:1-54:17" }, { "content": "Condemnation, pleading, promise of future restoration, 55:1-66:24" }] } } },
        { "id": "kyk:2013-07-16T15:35:08.762Z:sr", "key": ["kyk:2013-07-16T15:35:08.762Z:sr", "source: Biblical Horizons Conference 2013"], "value": { "_id": "kyk:2013-07-16T15:35:08.762Z:sr", "_rev": "1-50e265602a63a3af82fb176f3476dba4", "media": "", "details": "Biblical Horizons Conference 2013", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2013-07-16T15:35:50.357Z:ol", "key": ["kyk:2013-07-16T15:35:50.357Z:ol", "panel: pjleithart"], "value": { "_id": "kyk:2013-07-16T15:35:50.357Z:ol", "_rev": "1-f07b3c6261c98bb89deeef1bd589e09d", "head": { "contentType": "panel", "title": "Creation Week", "ScriptureRange": "Isaiah", "contentParams": { "repeat": 8, "header": true }, "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "July 16, 9:45am", "website": "", "guid": "kyk:2013-07-16T15:35:08.762Z:sr" }, "submissionTimestamp": [2013, 7, 16, "15:35:50.357Z"] }, "body": { "concepts": [{ "content": "Creation Week" }, { "content": "Light/darkness" }, { "content": "Firmament" }, { "content": "Sea/land/plants" }, { "content": "Sun, moon, starts" }, { "content": "Swarming things" }, { "content": "Adam and Eve" }, { "content": "Sabbath" }, { "content": "Isaiah" }, { "content": "Light in darkness, 9:2 (center of chs 1-12)" }, { "content": "Babylon as false firmament, chs. 13-14" }, { "content": "Warnings against Egypt, 30:5-7; 31:1-3" }, { "content": "Hezekiah as faithful king" }, { "content": "Yahweh superior to idols" }, { "content": "Servant and Daughter Zion" }, { "content": "Sabbath, 56:2, 3, 6; 58:13; 66:23" }] } } },
        { "id": "kyk:2013-07-17T13:52:42.957Z:ol", "key": ["kyk:2013-07-17T13:52:42.957Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2013-07-17T13:52:42.957Z:ol", "_rev": "1-ccddb4b82b1a0fed2a0ad26a92603eb5", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Jeremiah", "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "July 17, 8:45am", "website": "", "guid": "kyk:2013-07-16T15:35:08.762Z:sr" }, "submissionTimestamp": [2013, 7, 17, "13:52:42.957Z"] }, "body": { "concepts": [{ "content": "Jeremiah, oracles to Israel, and responses, ch. 1-19" }, { "content": "Pashur, ch. 20" }, { "content": "Siege events, ch. 21-24" }, { "content": "Jehoiakim, 4th year, ch. 25" }, { "content": "Jehoiakim, beginning, ch. 26" }, { "content": "Zedekiah, beginning, ch. 27" }, { "content": "Zedekiah, 4th year, ch. 28; letter to exiles, ch. 29" }, { "content": "New Covenant, ch. 30-31" }, { "content": "Zedekiah, 10th year, ch. 32-33" }, { "content": "Zedekiah, end, ch. 34" }, { "content": "Jehoiakim, middle, ch. 35" }, { "content": "Jehoiakim, 4th year, ch. 36" }, { "content": "Siege events, ch. 37-44" }, { "content": "Baruch, ch. 45" }, { "content": "Oracles to nations, history, and responses ch. 46-52; Lamentations" }] } } },
        { "id": "kyk:2013-07-17T15:21:28.241Z:ol", "key": ["kyk:2013-07-17T15:21:28.241Z:ol", "chiasm: pjleithart"], "value": { "_id": "kyk:2013-07-17T15:21:28.241Z:ol", "_rev": "1-820a28499eddf2f985a290f61ef42417", "head": { "contentType": "chiasm", "title": "Obedient Servant", "ScriptureRange": "Isaiah 50:1-51:11", "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "July 17, 9:45am", "website": "", "guid": "kyk:2013-07-16T15:35:08.762Z:sr" }, "submissionTimestamp": [2013, 7, 17, "15:21:28.241Z"] }, "body": { "concepts": [{ "content": "Lord dries sea, 50:1-3 (ransom)" }, { "content": "Lord awakens ear and gives tongue, 50:4-5" }, { "content": "Vindication against enemies, 50:6-9 (moth, garment)" }, { "content": "Light and darkness, 50:10-11" }, { "content": "Look to rock, 51:1-3" }, { "content": "Light to nations, 51:4-5 (righteousness/salvation)" }, { "content": "Vindication against enemies, 51:6-8 (moth, garment)" }, { "content": "Call on Lord to awake, 51:9a (righteousness/salvation)" }, { "content": "Lord dries sea, brings captives back, 51:9-11 (ransomed)" }] } } },
        { "id": "kyk:2013-07-19T16:07:18.812Z:ps", "key": ["kyk:2013-07-19T16:07:18.812Z:ps", "person: Conti, Cristina"], "value": { "_id": "kyk:2013-07-19T16:07:18.812Z:ps", "_rev": "1-6df5ff1e79a8fde87c2ae47948efc8b6", "name": { "title": "", "first": "Cristina", "middle": "", "last": "Conti", "suffix": "" }, "organization": { "name": "Salvation Army Seminary", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-07-19T16:08:58.081Z:sr", "key": ["kyk:2013-07-19T16:08:58.081Z:sr", "source: Global Bible Commentary"], "value": { "_id": "kyk:2013-07-19T16:08:58.081Z:sr", "_rev": "1-050397c2cf78671ccde1630188f0908c", "media": "", "details": "Global Bible Commentary", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2013-07-19T16:09:53.249Z:ol", "key": ["kyk:2013-07-19T16:09:53.249Z:ol", "chiasm: cconti"], "value": { "_id": "kyk:2013-07-19T16:09:53.249Z:ol", "_rev": "1-604bd7d138dfd5c6f89fd4632209dd67", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "James", "author": { "guid": "kyk:2013-07-19T16:07:18.812Z:ps", "authorShortname": "cconti" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "4.28.2008", "website": "www.leithart.com/2008/04/28/chiasm-of-james/", "guid": "kyk:2013-07-19T16:08:58.081Z:sr" }, "submissionTimestamp": [2013, 7, 19, "16:09:53.249Z"] }, "body": { "concepts": [{ "content": "Joy in trial, 1:2-8" }, { "content": "Rich fade, 1:9-11" }, { "content": "Lustfulness, 1:12-15" }, { "content": "Perfect Gift, 1:16-25" }, { "content": "Restraining the tongue, 1:26" }, { "content": "Religion in deed, 1:27" }, { "content": "Distinctions of rich and poor, 2:1-13" }, { "content": "Faith in works, 2:14-26" }, { "content": "Restraining the tongue, 3:1-12" }, { "content": "Wisdom as perfect gift, 3:13-18" }, { "content": "Lustfulness and sin, 4:1-12" }, { "content": "Ways of the rich, 4:13-5:6" }, { "content": "Patience in suffering, 5:7-20" }] } } },
        { "id": "kyk:2013-07-25T05:52:53.773Z:ol", "key": ["kyk:2013-07-25T05:52:53.773Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-25T05:52:53.773Z:ol", "_rev": "3-87c69ccf01ca5861131d4cdc70a46f4f", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 115", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 25, "05:52:53.773Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "04:40:43.728Z"] }, "body": { "concepts": [{ "content": "to Thy name give glory (1)" }, { "content": "the nations say, \"where is their God?\" (2)" }, { "content": "our God is in the heavens (3)" }, { "content": "idols cannot speak, cannot see, cannot hear, cannot smell, cannot feel, cannot walk, cannot make a sound, (4-7)", "embeddedType": "panel", "isHead": true }, { "content": "those who make them are like them (8a)", "embeddedType": "panel" }, { "content": "everyone who trusts in them (8b)" }, { "content": "trust in the Lord (9-11)" }, { "content": "He will bless us, (12-15a)", "embeddedType": "panel", "isHead": true }, { "content": "Maker of heaven and earth (15b)", "embeddedType": "panel" }, { "content": "the heavens are the heavens of the Lord (16a)" }, { "content": "the earth He has given to the sons of men (16b)" }, { "content": "praise the Lord (17-18)" }] } } },
        { "id": "kyk:2013-07-25T06:15:24.405Z:ol", "key": ["kyk:2013-07-25T06:15:24.405Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-25T06:15:24.405Z:ol", "_rev": "1-775bd564d9fb9440ff5f9fe1643eaf0e", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 54", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 25, "06:15:24.405Z"] }, "body": { "concepts": [{ "content": "save me by Thy name and judge/vindicate me (1)" }, { "content": "give ear to the words of my mouth (2)" }, { "content": "strangers ... violent men (3a)" }, { "content": "they have not set God before them (3b)" }, { "content": "Behold, God is my helper ... the sustainer of my soul (4)" }, { "content": "my foes (5)" }, { "content": "I will give thanks (6)" }, { "content": "(His name) has delivered me (7)" }] } } },
        { "id": "kyk:2013-07-25T06:57:20.650Z:ol", "key": ["kyk:2013-07-25T06:57:20.650Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-25T06:57:20.650Z:ol", "_rev": "2-c8f7f8d0b578deaa9b158edf0ab7c943", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 2:1-12", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 25, "06:57:20.650Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "06:27:44.112Z"] }, "body": { "concepts": [{ "content": "magi arrived (1)" }, { "content": "we saw His star (2a)", "embeddedType": "panel", "isHead": true }, { "content": "worship Him (2b)", "embeddedType": "panel" }, { "content": "Herod & the magi (3-4)" }, { "content": "Bethlehem (5a)" }, { "content": "for so it has been written by the prophet (5b)" }, { "content": "Bethlehem (6)" }, { "content": "Herod & the magi (7-8)" }, { "content": "they saw the star (9-10)", "embeddedType": "panel", "isHead": true }, { "content": "worshipped Him (11)", "embeddedType": "panel" }, { "content": "magi departed (12)" }] } } },
        { "id": "kyk:2013-07-25T13:28:04.641Z:ol", "key": ["kyk:2013-07-25T13:28:04.641Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-25T13:28:04.641Z:ol", "_rev": "3-e80edd7881ee146aa2d35a0d84d755d7", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 2:13-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 25, "13:28:04.641Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "05:51:59.224Z"] }, "body": { "concepts": [{ "content": "Behold, an angel of the Lord appeared to Joseph in a dream (13a)", "embeddedType": "panel", "isHead": true }, { "content": "saying, \"arise, take the Child & His mother (13b)", "embeddedType": "panel" }, { "content": "flee to Egypt (13c)", "embeddedType": "panel" }, { "content": "for Herod is going to search for the Child to destroy Him.\" (13d)", "embeddedType": "panel" }, { "content": "he arose and took the Child & His mother (14a)", "embeddedType": "panel" }, { "content": "and departed for Egypt and was there (14b-15a)", "embeddedType": "panel" }, { "content": "that what was spoken by the Lord through the prophet might be fulfilled (15b)", "embeddedType": "panel" }, { "content": "Herod ... slew all the male children (16)" }, { "content": "Then that which was spoken through Jeremiah the prophet was fulfilled (17)" }, { "content": "Rachel weeping for her children ... because they were no more (18)" }, { "content": "Behold, an angel of the Lord appeared in a dream to Joseph (19)", "embeddedType": "panel", "isHead": true }, { "content": "saying, \"arise, take the Child & His mother (20a)", "embeddedType": "panel" }, { "content": "go to Israel (20b)", "embeddedType": "panel" }, { "content": "for those who sought the child's life are dead.\" (20c)", "embeddedType": "panel" }, { "content": "he arose and took the Child & His mother (21)", "embeddedType": "panel" }, { "content": "and departed for the regions of Galilee and resided (22)", "embeddedType": "panel" }, { "content": "that what was spoken through the prophets might be fulfilled (23)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-25T13:33:40.597Z:ol", "key": ["kyk:2013-07-25T13:33:40.597Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-07-25T13:33:40.597Z:ol", "_rev": "2-26db3c35f04b0054a6ac97704d8cd9b1", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 2:13-15", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 25, "13:33:40.597Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "05:52:51.108Z"] }, "body": { "concepts": [{ "content": "Behold, an angel of the Lord appeared to Joseph in a dream (13a)" }, { "content": "saying, \"arise, take the Child & His mother (13b)" }, { "content": "flee to Egypt (13c)" }, { "content": "for Herod is going to search for the Child to destroy Him.\" (13d)" }, { "content": "he arose and took the Child & His mother (14a)" }, { "content": "and departed for Egypt and was there (14b-15a)" }, { "content": "that what was spoken by the Lord through the prophet might be fulfilled (15b)" }] } } },
        { "id": "kyk:2013-07-25T13:38:22.845Z:ol", "key": ["kyk:2013-07-25T13:38:22.845Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-07-25T13:38:22.845Z:ol", "_rev": "1-7e7f00d9d452bc6307e2c1b4e3d9f1dc", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 2:19-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "contentParams": { "repeat": 0 }, "submissionTimestamp": [2013, 7, 25, "13:38:22.845Z"] }, "body": { "concepts": [{ "content": "Behold, an angel of the Lord appeared in a dream to Joseph (19)" }, { "content": "saying, \"arise, take the Child & His mother (20a)" }, { "content": "go to Israel (20b)" }, { "content": "for those who sought the child's life are dead.\" (20c)" }, { "content": "he arose and took the Child & His mother (21)" }, { "content": "and departed for the regions of Galilee and resided (22-23a)" }, { "content": "that what was spoken through the prophets might be fulfilled (23b)" }] } } },
        { "id": "kyk:2013-07-28T18:56:58.389Z:ol", "key": ["kyk:2013-07-28T18:56:58.389Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-28T18:56:58.389Z:ol", "_rev": "2-6024196ea578e84bff81fd7fe8612425", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 3:1-3", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 29, "18:56:58.389Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "06:38:42.265Z"] }, "body": { "concepts": [{ "content": "preaching in the wilderness (1)", "embeddedType": "panel", "isHead": true }, { "content": "repent (2)", "embeddedType": "panel" }, { "content": "the one referred to by Isaiah the prophet (3a)" }, { "content": "crying in the wilderness (3b)", "embeddedType": "panel", "isHead": true }, { "content": "make ready ... make straight (3c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-28T19:16:30.720Z:ol", "key": ["kyk:2013-07-28T19:16:30.720Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-28T19:16:30.720Z:ol", "_rev": "3-d2b1364dcb7f98bda80c266d47560471", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 3:4-11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 29, "19:16:30.720Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 2, 16, "16:55:15.944Z"] }, "body": { "concepts": [{ "content": "John had camel hair clothing, a leather belt, and ate locusts & wild honey [like a prophet] (4)" }, { "content": "they were being baptized by him in the Jordan River, as they confessed  their sins (5-7a)", "embeddedOutlineId": "kyk:2014-02-16T16:46:54.038Z:ol" }, { "content": "flee from the wrath to come (7b)" }, { "content": "bring forth fruit in keeping with repentance (8)" }, { "content": "you say (9a)", "embeddedType": "panel", "isHead": true }, { "content": "\"we have Abraham for our father\" (9b)", "embeddedType": "panel" }, { "content": "I say (9c)", "embeddedType": "panel", "isHead": true }, { "content": "God is able from these stones to raise up children to Abraham (9d)", "embeddedType": "panel" }, { "content": "bear good fruit (10a)" }, { "content": "cut down & thrown into the fire (10b)" }, { "content": "I baptize you with water for repentance (11a)" }, { "content": "the one coming after me is stronger than me; I'm not worthy to untie his sandals (11b)" }] } } },
        { "id": "kyk:2013-07-28T19:32:45.047Z:ol", "key": ["kyk:2013-07-28T19:32:45.047Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-28T19:32:45.047Z:ol", "_rev": "3-728587c9019f8287e0c90ab075b076dd", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 3:11-17", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 29, "19:32:45.047Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 2, 16, "17:04:51.161Z"] }, "body": { "concepts": [{ "content": "He will baptize you with the Holy Spirit (11c)", "embeddedType": "panel", "isHead": true }, { "content": "He will gather His wheat ... He will burn up the chaff (12)", "embeddedType": "panel" }, { "content": "Jesus arrived ... to be baptized by him (John) (13-14)", "embeddedOutlineId": "kyk:2014-02-16T17:01:38.980Z:ol" }, { "content": "\"Permit it\" (15a)" }, { "content": "\"it is fitting for us to fulfill all righteousness\" (15b)" }, { "content": "he permitted Him (15c)" }, { "content": "being baptized, Jesus went up (16a)" }, { "content": "he saw the Spirit of God descending as a dove, coming upon Him (16b)", "embeddedType": "panel", "isHead": true }, { "content": "\"This is My beloved Son, in whom I am well-pleased.\" (17)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-29T11:08:25.975Z:ol", "key": ["kyk:2013-07-29T11:08:25.975Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-29T11:08:25.975Z:ol", "_rev": "1-f14175ddd19226d7388932cb11e14dee", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Isaiah 40", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 29, "11:08:25.975Z"] }, "body": { "concepts": [{ "content": "hard service (1-2)" }, { "content": "the way (3-4)" }, { "content": "see (5)" }, { "content": "all flesh ... withers (6-8)" }, { "content": "say ... \"Here is your God\" (9-11)" }, { "content": "measured ... marked ... dust (12)" }, { "content": "informed ... understanding (13-14a)" }, { "content": "Who taught Him in the path of justice and taught Him knowledge? (14b)" }, { "content": "informed ... understanding (14c)" }, { "content": "scales ... dust (15-17)" }, { "content": "God is not like an idol (18-20)" }, { "content": "the earth's inhabitants ... wither (21-24)" }, { "content": "see (25-26)" }, { "content": "my way (27)" }, { "content": "weary & tired (28-31)" }] } } },
        { "id": "kyk:2013-07-29T11:14:54.850Z:ol", "key": ["kyk:2013-07-29T11:14:54.850Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-29T11:14:54.850Z:ol", "_rev": "1-8971a03c1db26e487a983f9391936373", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ecclesiastes 4:13-5:9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 29, "11:14:54.850Z"] }, "body": { "concepts": [{ "content": "about a king (4:13-16)" }, { "content": "guard your words before God (5:1-2)" }, { "content": "dream (5:3a)" }, { "content": "effort (5:3b)" }, { "content": "many words (5:3c)" }, { "content": "pay what you vow (5:4)" }, { "content": "better not vow than vow and not pay (5:5)" }, { "content": "your words (5:6a)" }, { "content": "work (5:6b)" }, { "content": "dreams (5:7a)" }, { "content": "fear God (5:7b)" }, { "content": "about a king (5:8-9)" }] } } },
        { "id": "kyk:2013-07-29T11:16:44.127Z:ol", "key": ["kyk:2013-07-29T11:16:44.127Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-29T11:16:44.127Z:ol", "_rev": "2-a3647676ce64d5a642e5811bc85e40f8", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ecclesiastes 5:10-6:2", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 29, "11:16:44.127Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "05:07:57.072Z"] }, "body": { "concepts": [{ "content": "not satified with money (5:10)" }, { "content": "advantage (5:11)", "embeddedType": "panel", "isHead": true }, { "content": "working (5:12a)", "embeddedType": "panel" }, { "content": "eats (5:12b)", "embeddedType": "panel" }, { "content": "a grievous evil (5:13-14a)" }, { "content": "nothing in his hand (5:14b)" }, { "content": "came naked from his mother's womb ... will return as he came (5:15a)" }, { "content": "nothing in his hand (5:15b)" }, { "content": "a grievous evil (5:16a)" }, { "content": "advantage (5:16a)", "embeddedType": "panel", "isHead": true }, { "content": "toil (5:16b)", "embeddedType": "panel" }, { "content": "eats (5:17)", "embeddedType": "panel" }, { "content": "reward & wealth & eating (5:18-6:2)" }] } } },
        { "id": "kyk:2013-07-30T10:46:07.662Z:ol", "key": ["kyk:2013-07-30T10:46:07.662Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-30T10:46:07.662Z:ol", "_rev": "2-fc8e252b25ed34f9742f3759c2662aef", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Revelation 21:24-27a", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 30, "10:46:07.662Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 7, 30, "10:48:33.013Z"] }, "body": { "concepts": [{ "content": "the nations shall walk by its light (24a)" }, { "content": "their glory (24b)" }, { "content": "there shall be no night there (25)" }, { "content": "the glory & honor of the nations (26)" }, { "content": "nothing unclean and no one who practices abomination and lying (27a)" }] } } },
        { "id": "kyk:2013-07-30T10:51:43.322Z:ol", "key": ["kyk:2013-07-30T10:51:43.322Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-30T10:51:43.322Z:ol", "_rev": "3-38638fa1f0427f9bdcc80df73bdd8d96", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Revelation 21:23-22:5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 30, "10:51:43.322Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "15:10:35.008Z"] }, "body": { "concepts": [{ "content": "no need of the sun...(21:23a)", "embeddedType": "panel", "isHead": true }, { "content": "for the glory of God has illumined it (21:23b)", "embeddedType": "panel" }, { "content": "there shall be no night there [embedded] (21:24-27a)", "embeddedOutlineId": "kyk:2013-07-30T10:46:07.662Z:ol" }, { "content": "those whose names are written in the Lamb's book of life (22:27b)" }, { "content": "the throne of God and of the Lamb (22:1)" }, { "content": "the tree of life...healing of the nations (22:2)" }, { "content": "no longer be any curse (22:3a)" }, { "content": "the throne of God and of the Lamb (22:3b)" }, { "content": "His name shall be on their foreheads (22:4)" }, { "content": "there shall no longer be night (22:5a)" }, { "content": "they shall not have need of the light...(22:5b)", "embeddedType": "panel", "isHead": true }, { "content": "because the Lord God shall illumine them (22:5c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-30T10:54:31.849Z:ol", "key": ["kyk:2013-07-30T10:54:31.849Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-30T10:54:31.849Z:ol", "_rev": "2-e28e5bff25df6c5745e302debaf88648", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Revelation 22:6-20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 30, "10:54:31.849Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "09:27:43.612Z"] }, "body": { "concepts": [{ "content": "he said, \"these words are faithful and true\" (6)", "embeddedType": "panel", "isHead": true }, { "content": "\"I am coming quickly\" (7)", "embeddedType": "panel" }, { "content": "I, John, am the one who heard and saw these things (8)", "embeddedType": "panel", "isHead": true }, { "content": "the words of this book (twice) (9-10)", "embeddedType": "panel" }, { "content": "let the one who... let the one who... let the one who... let the one who... (11)" }, { "content": "\"Behold, I am coming quickly... (12)" }, { "content": "\"I am...\" (13)" }, { "content": "enter...the city (14)" }, { "content": "outside are... (15)" }, { "content": "\"I am...\" (16)" }, { "content": "\"Come\" (17a)" }, { "content": "let the one who... let the one who... (17b)" }, { "content": "I testify (18a)", "embeddedType": "panel", "isHead": true }, { "content": "the words of this book (twice) (18b-19)", "embeddedType": "panel" }, { "content": "he who testifies (20a)", "embeddedType": "panel", "isHead": true }, { "content": "\"I am coming quickly\" (20b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-31T00:23:10.466Z:ol", "key": ["kyk:2013-07-31T00:23:10.466Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-31T00:23:10.466Z:ol", "_rev": "2-25fe5a08f14fe0c13614457c4178fa77", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Exodus 1:1-21", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 31, "00:23:10.466Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "14:56:29.194Z"] }, "body": { "concepts": [{ "content": "households (1-4)" }, { "content": "multiplied and became very mighty (5-7)" }, { "content": "\"Behold, the people of the sons of Israel are more and mightier than we\" (8-9)" }, { "content": "\"let us deal wisely with them, lest they multiply\" (10)" }, { "content": "to afflict them with their burdens (11)" }, { "content": "the more they afflicted them, the more they multiplied and the more they broke forth, (12a)" }, { "content": "so that they were in dread of the sons of Israel (12b)" }, { "content": "to labor rigorously... made their lives bitter with hard labor (13-14)" }, { "content": "kill the sons... but they feared God and let the boys live [embedded] (15-18)", "embeddedOutlineId": "kyk:2013-07-31T00:24:30.568Z:ol" }, { "content": "\"the Hebrew women are not as the Egyptian women; for they are vigorous\" (19)" }, { "content": "multiplied and became very mighty (20)" }, { "content": "households (21)" }] } } },
        { "id": "kyk:2013-07-31T00:24:30.568Z:ol", "key": ["kyk:2013-07-31T00:24:30.568Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-31T00:24:30.568Z:ol", "_rev": "3-88ebb37e57c1d6cb506ab8d539d4df29", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Exodus 1:15-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 31, "00:24:30.568Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "04:21:17.988Z"] }, "body": { "concepts": [{ "content": "the king of Egypt spoke to the midwives (15)", "embeddedType": "panel", "isHead": true }, { "content": "\"if it is a son, then you shall put him to death\" (16)", "embeddedType": "panel" }, { "content": "but the midwives feared God (17a)" }, { "content": "and let the boys live (17b)" }, { "content": "the king of Egypt said to the midwives (18a)", "embeddedType": "panel", "isHead": true }, { "content": "\"Why have you let the boys live?\" (18b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-07-31T00:39:17.899Z:ol", "key": ["kyk:2013-07-31T00:39:17.899Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-31T00:39:17.899Z:ol", "_rev": "2-738d46e5acc6843df5033f7123b40e2b", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ecclesiastes 11:1-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 31, "00:39:17.899Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 8, 3, "23:04:08.517Z"] }, "body": { "concepts": [{ "content": "cast your bread (1)" }, { "content": "you do not know what misfortune may occur (2)" }, { "content": "the clouds (3a)" }, { "content": "wherever the tree falls, there it is (3b)" }, { "content": "the clouds (4)" }, { "content": "you do not know the activity of God (5)" }, { "content": "sow your seed (6)" }] } } },
        { "id": "kyk:2013-07-31T00:48:12.003Z:ol", "key": ["kyk:2013-07-31T00:48:12.003Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-07-31T00:48:12.003Z:ol", "_rev": "3-f81bfcc6f5ac620161694ab2d3eeabbd", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ecclesiastes 11:7-12:2", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 7, 31, "00:48:12.003Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "05:11:34.227Z"] }, "body": { "concepts": [{ "content": "the light...the sun (11:7)" }, { "content": "years (11:8a)", "embeddedType": "panel", "isHead": true }, { "content": "rejoice in them all (11:8b)", "embeddedType": "panel" }, { "content": "remember the days of darkness (11:8c)" }, { "content": "childhood (11:9a)" }, { "content": "your heart (11:9b)" }, { "content": "know that God will bring you to judgment for all these things (11:9c)" }, { "content": "your heart (11:10a)" }, { "content": "childhood (11:10b)" }, { "content": "remember also your Creator in the days of your youth, before the evil days come (12:1a)" }, { "content": "years (12:1b)", "embeddedType": "panel", "isHead": true }, { "content": "\"I have no delight in them\" (12:1c)", "embeddedType": "panel" }, { "content": "the sun, the light (12:2)" }] } } },
        { "id": "kyk:2013-08-02T23:08:50.105Z:sr", "key": ["kyk:2013-08-02T23:08:50.105Z:sr", "source: God's Empowering Presence: the Holy Spirit in the letters of Pau"], "value": { "_id": "kyk:2013-08-02T23:08:50.105Z:sr", "_rev": "1-b13e112874ee4fdf5c146d3572740e2f", "media": "book", "details": "God's Empowering Presence: the Holy Spirit in the letters of Paul", "website": "", "publisherDetails": "Baker Academic, 1994.", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2013-08-02T23:12:06.980Z:ps", "key": ["kyk:2013-08-02T23:12:06.980Z:ps", "person: Fee, Gordon"], "value": { "_id": "kyk:2013-08-02T23:12:06.980Z:ps", "_rev": "1-bd304ad7414ddbab60c24f87aa79fbf3", "name": { "title": "Dr.", "first": "Gordon", "middle": "D.", "last": "Fee", "suffix": "" }, "organization": { "name": "Regent College", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-08-02T23:13:57.047Z:ol", "key": ["kyk:2013-08-02T23:13:57.047Z:ol", "chiasm: gdfee"], "value": { "_id": "kyk:2013-08-02T23:13:57.047Z:ol", "_rev": "1-a54a47419a40807b0036fb0ef869d1fb", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:3-4", "author": { "guid": "kyk:2013-08-02T23:12:06.980Z:ps", "authorShortname": "gdfee" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "source": { "details": "p.479-480", "website": "", "guid": "kyk:2013-08-02T23:08:50.105Z:sr" }, "submissionTimestamp": [2013, 8, 3, "23:13:57.047Z"] }, "body": { "concepts": [{ "content": "concerning His Son" }, { "content": "who came..." }, { "content": "who was declared Son of God in power..." }, { "content": "Jesus Christ our Lord" }] } } },
        { "id": "kyk:2013-08-02T23:16:43.101Z:ol", "key": ["kyk:2013-08-02T23:16:43.101Z:ol", "chiasm: gdfee"], "value": { "_id": "kyk:2013-08-02T23:16:43.101Z:ol", "_rev": "1-7d4c24adcc8e2b609f42ad830954bcec", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:3-4", "author": { "guid": "kyk:2013-08-02T23:12:06.980Z:ps", "authorShortname": "gdfee" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "source": { "details": "p.479-480", "website": "", "guid": "kyk:2013-08-02T23:08:50.105Z:sr" }, "submissionTimestamp": [2013, 8, 3, "23:16:43.101Z"] }, "body": { "concepts": [{ "content": "from the seed of David" }, { "content": "according to the flesh" }, { "content": "according to the Spirit of holiness" }, { "content": "from the resurrection from the dead" }] } } },
        { "id": "kyk:2013-08-08T14:57:51.938Z:ol", "key": ["kyk:2013-08-08T14:57:51.938Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-08T14:57:51.938Z:ol", "_rev": "3-17a86c89a12606eafedf238aa61fab7c", "head": { "contentType": "chiasm", "title": "Where is your pupil focused?", "ScriptureRange": "Proverbs 7:1-27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 8, "14:57:51.938Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "15:05:56.177Z"] }, "body": { "concepts": [{ "content": "keep my words... treasure my commandments... keep my commandments and live, and my teaching as the pupil of your eye (1-2)" }, { "content": "bind them (3)", "embeddedType": "panel", "isHead": true }, { "content": "say to wisdom, \"you are my sister\" and call understanding your intimate friend, (4)", "embeddedType": "panel" }, { "content": "a strange woman...who flatters with her words (5)", "embeddedType": "panel" }, { "content": "my house (6)" }, { "content": "simple ones... sons (7a)" }, { "content": "a young man lacking sense(lit. heart) (7b)" }, { "content": "he steps the way to her house (8)" }, { "content": "in the twilight, in the evening of the day (9a)" }, { "content": "in the pupil of the night and the darkness (9b)" }, { "content": "behold, a woman (comes) to meet him (10a)" }, { "content": "cunning of heart (10b)" }, { "content": "boisterous and rebellious (11a)" }, { "content": "doesn't remain at home (11b-12)" }, { "content": "she seizes him (13a)", "embeddedType": "panel", "isHead": true }, { "content": "she says, \"... let us... let us...\" (become intimate) [embedded] (13b-20)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-08-08T15:00:53.014Z:ol" }, { "content": "her many persuasions... her flattering lips (21)", "embeddedType": "panel" }, { "content": "my sons, listen to me, and pay attention to the words of my mouth [embedded] (22-27)", "embeddedOutlineId": "kyk:2013-08-08T15:04:14.325Z:ol" }] } } },
        { "id": "kyk:2013-08-08T15:00:53.014Z:ol", "key": ["kyk:2013-08-08T15:00:53.014Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-08T15:00:53.014Z:ol", "_rev": "1-f5d2c25e2fd815edba873afe8c5fa1be", "head": { "contentType": "chiasm", "title": "The trap: \"I'm ready, he's gone, let us...\"", "ScriptureRange": "Proverbs 7:14-20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 8, "15:00:53.014Z"] }, "body": { "concepts": [{ "content": "I... I... I... I... I... (six \"I\" statements) (14-17)" }, { "content": "let us... let us... (become intimate) (18)" }, { "content": "the man... he... he... he... (19-20)" }] } } },
        { "id": "kyk:2013-08-08T15:04:14.325Z:ol", "key": ["kyk:2013-08-08T15:04:14.325Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-08T15:04:14.325Z:ol", "_rev": "2-63cc644b8320a2fe6c5b92aba32740e4", "head": { "contentType": "chiasm", "title": "The choice: Pay attention to wise words or die!", "ScriptureRange": "Proverbs 7:22-27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 8, "15:04:14.325Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "04:52:51.733Z"] }, "body": { "concepts": [{ "content": "suddenly he follows her (22a)", "embeddedType": "panel", "isHead": true }, { "content": "fetters... arrow pierces his liver... snare... it will cost him his life (22b-23)", "embeddedType": "panel" }, { "content": "my sons, listen to me, and pay attention to the words of my mouth (24)" }, { "content": "do not turn aside... do not stray... (25)", "embeddedType": "panel", "isHead": true }, { "content": "mortally wounded... slain... the chambers of death (26-27)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-08-09T11:45:45.158Z:ol", "key": ["kyk:2013-08-09T11:45:45.158Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-09T11:45:45.158Z:ol", "_rev": "3-039d57ad62658514dc9b476ad4b3ffe1", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Exodus 3:1-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 9, "11:45:45.158Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "15:02:41.961Z"] }, "body": { "concepts": [{ "content": "Jethro his father-in-law (1a)" }, { "content": "Horeb, the mountain of God (1b)" }, { "content": "the angel of the Lord appeared to him in a blazing fire (2a)", "embeddedType": "panel", "isHead": true }, { "content": "from the midst of the bush (2b)", "embeddedType": "panel" }, { "content": "I must turn aside now, and see this great sight [embedded] (2c-3)", "embeddedOutlineId": "kyk:2013-08-09T11:48:05.743Z:ol" }, { "content": "the Lord saw (4a)" }, { "content": "he turned aside to look (4b)" }, { "content": "God called to him (4c)", "embeddedType": "panel", "isHead": true }, { "content": "from the midst of the bush (4d)", "embeddedType": "panel" }, { "content": "the place on which you are standing [embedded] (5)", "embeddedOutlineId": "kyk:2013-08-09T11:50:57.470Z:ol" }, { "content": "the God of your father Abraham... Isaac... Jacob (6)" }] } } },
        { "id": "kyk:2013-08-09T11:48:05.743Z:ol", "key": ["kyk:2013-08-09T11:48:05.743Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-09T11:48:05.743Z:ol", "_rev": "2-abe38bb1a332a319b3a3b4d1ccf654b0", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Exodus 3:2c-3", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 9, "11:48:05.743Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "14:59:46.483Z"] }, "body": { "concepts": [{ "content": "the bush was not consumed (2c)" }, { "content": "I must turn aside now, and see this great sight (3a)" }, { "content": "the bush is not burned up (3b)" }] } } },
        { "id": "kyk:2013-08-09T11:50:57.470Z:ol", "key": ["kyk:2013-08-09T11:50:57.470Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-09T11:50:57.470Z:ol", "_rev": "1-65232d3298f1126863d8dee9541cbbb8", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Exodus 3:5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 9, "11:50:57.470Z"] }, "body": { "concepts": [{ "content": "don't come near here; remove your sandals (5a)" }, { "content": "the place on which you are standing (5b)" }, { "content": "is holy ground (5c)" }] } } },
        { "id": "kyk:2013-08-09T14:11:46.128Z:ol", "key": ["kyk:2013-08-09T14:11:46.128Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-09T14:11:46.128Z:ol", "_rev": "36-fecf976ec1b3e005b58f862a60dfb73e", "head": { "contentType": "chiasm", "title": "Ring Structures in Romans (ordered as per UBS GNT)", "ScriptureRange": "Romans 1:1-16 & 15:13-16:27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 9, "14:11:46.128Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2015, 3, 12, "22:23:38.356Z"] }, "body": { "concepts": [{ "content": "Paul, a slave of Messiah Jesus, a called apostle, set apart for[=purpose] (proclaiming) the gospel of God (1:1)", "embeddedType": "panel", "isHead": true }, { "content": "which He promised beforehand (1:2a)", "embeddedType": "panel" }, { "content": "through His prophets in the writings (which are) holy (1:2b)", "embeddedType": "panel" }, { "content": "through whom we received grace and apostleship (1:5a)", "embeddedType": "panel" }, { "content": "to bring about[=purpose] the obedience of[=produced by] faith (1:5b)", "embeddedType": "panel" }, { "content": "among all the non-Jews (1:5c)", "embeddedType": "panel" }, { "content": "for the sake of His reputation[=name/fame] (1:5d)", "embeddedType": "panel" }, { "content": "grace to you (from) the Lord Jesus Christ (1:7c-h)" }, { "content": "and peace from God our Father (1:7e-f)" }, { "content": "(Of) first (importance), I thank my God for you all (1:8a-c)" }, { "content": "because your faith (1:8d)", "isHead": true, "embeddedType": "panel" }, { "content": " is being proclaimed throughout the whole world[=kosmos] (1:8d)", "embeddedType": "panel" }, { "content": "God is my witness whom I serve in my spirit [embedded] (1:9)", "embeddedOutlineId": "kyk:2014-01-02T13:48:50.475Z:ol" }, { "content": "my prayers (1:9e-10a)", "embeddedType": "panel", "isHead": true }, { "content": "that I may succeed by the will of God to come to you (1:10b-e)", "embeddedType": "panel" }, { "content": "to see you ... contribute ... your company ... to come to you ... hindered [embedded] (1:11-13d)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-01-02T18:10:20.216Z:ol" }, { "content": "fruit (1:13f) ... I am a debtor/under obligation (1:14b)", "embeddedType": "panel" }, { "content": "I am eager to preach the gospel to you also who are in Rome. (1:15)", "isHead": true, "embeddedType": "panel" }, { "content": "I am not ashamed to proclaim the gospel (1:16a-b)", "embeddedType": "panel" }, { "content": "for (the gospel) is God's ability [=power] to save (1:16c-d)" }, { "content": "each and every person who trusts (Christ and what he has done) (1:16e)" }, { "content": "from (Christ's) faithfulness (1:17c)", "isHead": true, "embeddedType": "panel" }, { "content": "into[=purpose] (our) faith/faithfulness (1:17d)", "embeddedType": "panel" }, { "content": "any person who God has put right with himself, that person will live (forever) (1:17e)" }, { "content": "God is showing his wrath against people who are not right (1:18-29)" }, { "content": "filled/full of evil things (1:29)" }, { "content": "full/filled of good things (15:14b-c)" }, { "content": "But I have written to you quite boldly in part (of my letter), as (though) to remind you (of it) again (15:15a)" }, { "content": "by means of the non-Jews having been sanctified by the Holy Spirit (15:16f)" }, { "content": "what Christ produced through me (15:18b)", "isHead": true, "embeddedType": "panel" }, { "content": "resulting in the obedience (15:18c)", "embeddedType": "panel" }, { "content": " of the non-Jews (15:18d)" }, { "content": "by the power of miraculous signs and wonders and by the power of God's Spirit (15:19a-b)" }, { "content": "from Jerusalem to Illyricum I have fully proclaimed the gospel of Christ. (15:19c-d)", "isHead": true, "embeddedType": "panel" }, { "content": "I make it my ambition to proclaim the gospel where Christ has not been named (15:20-21)", "embeddedType": "panel" }, { "content": "hindered ... to come to you ... to see you ... your company ... contribute (15:22-27)", "isHead": true, "embeddedType": "panel" }, { "content": "they are debtors/under obligation (15:27) ... fruit (15:28)", "embeddedType": "panel" }, { "content": "your prayers (15:30-31)", "embeddedType": "panel", "isHead": true }, { "content": "that I may come to you in joy by the will of God and be refreshed in your company (15:32)", "embeddedType": "panel" }, { "content": "I commend to you Phoebe, a deaconess and patron [embedded] (16:1-2)", "embeddedOutlineId": "kyk:2014-09-15T18:13:40.821Z:ol" }, { "content": "your obedience (16:19a)", "isHead": true, "embeddedType": "panel" }, { "content": "has reached all (16:19b)", "embeddedType": "panel" }, { "content": "I am rejoicing over you (16:19c)" }, { "content": "Now the God of peace will break satan under your feet quickly (16:20a)" }, { "content": "the grace of our Lord Jesus be with you (16:20b)" }, { "content": "according to my gospel and the proclamation of Jesus Christ (16:25)", "embeddedType": "panel", "isHead": true }, { "content": "but now (this mystery/secret) has been manifested (16:26a)", "embeddedType": "panel" }, { "content": "through the prophetic writings (16:26b)", "embeddedType": "panel" }, { "content": "according to the command of the eternal God (16:26c)", "embeddedType": "panel" }, { "content": "to bring about[=purpose] the obedience of[=produced by] faith (16:26d)", "embeddedType": "panel" }, { "content": "for the benefit[=advantage] of all the non-Jews (this proclamation) has been made known (16:26e)", "embeddedType": "panel" }, { "content": "to the only wise God, through Jesus Christ, to Him(=God) (be) the glory forever, Amen (16:27)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-08-14T18:30:03.534Z:ol", "key": ["kyk:2013-08-14T18:30:03.534Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-14T18:30:03.534Z:ol", "_rev": "1-9689cdb6ac81a342fda7ca88925701d6", "head": { "contentType": "chiasm", "title": "Do justice for the destitute!", "ScriptureRange": "Psalm 82", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 15, "18:30:03.534Z"] }, "body": { "concepts": [{ "content": "God as judge (1a)" }, { "content": "gods (1b)" }, { "content": "unjust judgment (2a)" }, { "content": "the wicked (2b)" }, { "content": "vindicate the weak & fatherless (3a)" }, { "content": "do justice to the destitute (3b)" }, { "content": "rescue the weak & needy (4a)" }, { "content": "the wicked (4b)" }, { "content": "(results?) of unjust judgment (5)" }, { "content": "gods (6-7)" }, { "content": "God as judge (8b)" }] } } },
        { "id": "kyk:2013-08-14T18:37:36.342Z:ol", "key": ["kyk:2013-08-14T18:37:36.342Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-14T18:37:36.342Z:ol", "_rev": "3-d26271668485d06e08adbef5d53f9c58", "head": { "contentType": "chiasm", "title": "Arminianism vs. Calvinism OR Man's side: [servant] balanced with God's side: [chosen]", "ScriptureRange": "Psalm 105", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 15, "18:37:36.342Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 4, "04:36:11.323Z"] }, "body": { "concepts": [{ "content": "Give thanks to the Lord, (1a)" }, { "content": "Call on His name (1b)" }, { "content": "Make known His deeds... His wonderful acts (1c-2)" }, { "content": "Boast in His holy name (3)" }, { "content": "Seek the Lord (4)" }, { "content": "Remember His wonderful acts (5a)" }, { "content": "the judgments (5b)" }, { "content": "seed of Abraham (6a)", "embeddedType": "panel", "isHead": true }, { "content": "His servant (6b)", "embeddedType": "panel" }, { "content": "sons of Jacob (6c)", "embeddedType": "panel", "isHead": true }, { "content": "His chosen ones (6b)", "embeddedType": "panel" }, { "content": "His judgments (7)" }, { "content": "He has remembered His covenant (8a)" }, { "content": "He is reliable (8b-11)" }, { "content": "very few, and strangers (12-13)" }, { "content": "(did so many things) (14-44)" }, { "content": "so that they might (obey His commands) (45a)" }, { "content": "Praise the Lord! (45b)" }] } } },
        { "id": "kyk:2013-08-14T18:43:36.750Z:ps", "key": ["kyk:2013-08-14T18:43:36.750Z:ps", "person: Señor, VeeWood"], "value": { "_id": "kyk:2013-08-14T18:43:36.750Z:ps", "_rev": "1-638530a74ed109cefe280fda8045ab61", "name": { "title": "", "first": "VeeWood", "middle": "C.", "last": "Señor", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-08-14T18:44:31.331Z:ps", "key": ["kyk:2013-08-14T18:44:31.331Z:ps", "person: Nibbler, Romane"], "value": { "_id": "kyk:2013-08-14T18:44:31.331Z:ps", "_rev": "1-008b7467ff2c3d7c6a85b96ab30e825f", "name": { "title": "", "first": "Romane", "middle": "T.", "last": "Nibbler", "suffix": "" }, "organization": { "name": "", "website": "" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-08-19T06:36:40.467Z:ol", "key": ["kyk:2013-08-19T06:36:40.467Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-19T06:36:40.467Z:ol", "_rev": "4-c71cc344e5f29920ee1692476e96762c", "head": { "contentType": "chiasm", "title": "How to draw near to God (as a group); [1st panel=legal side, 2nd panel=practical side]", "ScriptureRange": "James 4:6-10", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 19, "06:36:40.467Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 28, "19:19:04.677Z"] }, "body": { "concepts": [{ "content": "God sets (Himself) against the proud (lit. the ones who shine beyond, or appear over & above) (6a)" }, { "content": "but He gives grace to humble (people = poor, downcast, humiliated, lacking confidence, etc.) (6b)" }, { "content": "therefore (you.pl.) submit to God (7a)" }, { "content": "then (you.pl.) resist the devil (7b)" }, { "content": "and he will flee from you(pl.) (7c)" }, { "content": "(you.pl.) draw near to God (8a)" }, { "content": "and He will draw near to you(pl.) (8b)" }, { "content": "(you.pl.) cleanse (your.pl.) hands, (you.pl.)sinners(voc.) (8c)" }, { "content": "(you.pl.) purify (your.pl.) hearts, (you.pl.)double-souled-ones(voc.) (8d)" }, { "content": "(you.pl.) be miserable and mourn and weep. Laughter must change into mourning and joy into sorrow. (9)" }, { "content": "humble yourselves before the Lord (10a)" }, { "content": "He will lift you(pl.) up (10b)" }] } } },
        { "id": "kyk:2013-08-20T12:11:09.520Z:ol", "key": ["kyk:2013-08-20T12:11:09.520Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-20T12:11:09.520Z:ol", "_rev": "11-737a28a5efde4ac618d7a667b825af4c", "head": { "contentType": "chiasm", "title": "The sermon to crowds of followers, & disciples too: Am I a disciple or just a part of the crowd of followers?", "ScriptureRange": "Matthew 4:25-8:1", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 20, "12:11:09.520Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 7, 30, "14:56:52.865Z"] }, "body": { "concepts": [{ "content": "many crowds followed Him (4:25)" }, { "content": "He went up toward the mountain (5:1)" }, { "content": "He began to teach them (=disciples, & crowds too) (5:2)" }, { "content": "un-salty salt [embedded] (5:3-16)", "embeddedOutlineId": "kyk:2013-08-20T15:40:21.531Z:ol" }, { "content": "Jesus came to fulfill/accomplish/keep/teach the Law & the Prophets (5:17-18)", "embeddedOutlineId": "kyk:2014-07-30T14:54:38.484Z:ol" }, { "content": "fulfill your vows: be true to your word [embedded] (5:19-48)", "embeddedType": "panel", "isHead": true, "embeddedOutlineId": "kyk:2013-08-20T15:52:34.734Z:ol" }, { "content": "public vs. secret rewards for religious works (6:1-6)", "embeddedType": "panel" }, { "content": "Father knows needs before asked (6:7-8)", "embeddedType": "panel", "isHead": true, "embeddedOutlineId": "kyk:2014-07-17T18:51:29.314Z:ol" }, { "content": "Our Father ... hallowed be Thy name, Thy kingdom come (6:9-10a)", "embeddedType": "panel" }, { "content": "Thy will be done on earth as it is in heaven (6:10b)" }, { "content": "give us tomorrow's bread today (6:11)" }, { "content": "forgiveness (6:12)", "embeddedOutlineId": "kyk:2014-07-17T17:10:58.259Z:ol" }, { "content": "do not lead us into temptation/trials (6:13a)" }, { "content": "but deliver us from the evil one (6:13b)" }, { "content": "forgiveness (6:14-15)", "embeddedOutlineId": "kyk:2014-07-17T18:04:30.492Z:ol" }, { "content": "public vs. secret rewards for fasting (6:16-18)", "embeddedOutlineId": "kyk:2014-07-17T17:55:39.882Z:ol" }, { "content": "you cannot serve God and money [embedded] (6:19-24)", "embeddedOutlineId": "kyk:2013-08-20T16:01:20.678Z:ol" }, { "content": "do not be anxious (6:25-32)", "embeddedType": "panel", "isHead": true }, { "content": "seek the kingdom (of God) and His righteousness [embedded] (6:31-34)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-09-25T20:57:33.462Z:ol" }, { "content": "equal standards for judges and the judged ones (7:1-5)", "embeddedType": "panel", "isHead": true }, { "content": "askers, givers & good gifts (7:6-11)", "embeddedType": "panel" }, { "content": "treating others as you want to be treated is (the fulfillment/goal of) the Law & the Prophets (7:12)" }, { "content": "false prophets: good label/bad contents [embedded] (7:13-27)", "embeddedOutlineId": "kyk:2013-08-20T16:04:26.425Z:ol" }, { "content": "when Jesus finished his speech, the crowds were amazed at His teaching (7:28-29)" }, { "content": "as He was coming down from the mountain (8:1a)" }, { "content": "many crowds followed Him (8:1b)" }] } } },
        { "id": "kyk:2013-08-20T15:40:21.531Z:ol", "key": ["kyk:2013-08-20T15:40:21.531Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-20T15:40:21.531Z:ol", "_rev": "4-58bebb13ce420a44c52555a1e2989bd8", "head": { "contentType": "chiasm", "title": "What you are and why", "ScriptureRange": "Matthew 5:3-16", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 20, "15:40:21.531Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 7, 30, "13:49:57.649Z"] }, "body": { "concepts": [{ "content": "blessed are those who have good character (3-12)", "embeddedOutlineId": "kyk:2014-07-30T13:47:00.807Z:ol" }, { "content": "un-salty salt (13)" }, { "content": "good works are meant to be on display so that people may see them and glorify the Father (14-16)", "embeddedOutlineId": "kyk:2014-07-30T10:14:10.577Z:ol" }] } } },
        { "id": "kyk:2013-08-20T15:52:34.734Z:ol", "key": ["kyk:2013-08-20T15:52:34.734Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-20T15:52:34.734Z:ol", "_rev": "5-8e073a5bd5a38efd98b801f56904af8b", "head": { "contentType": "chiasm", "title": "be perfect, be true to your word", "ScriptureRange": "Matthew 5:19-48", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 20, "15:52:34.734Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 7, 30, "14:00:07.807Z"] }, "body": { "concepts": [{ "content": "your righteousness must surpass the Scribes & Pharisees (19-20)" }, { "content": "you shall not commit murder: don't hate, draw near after being reconciled [embedded] (21-26)", "embeddedOutlineId": "kyk:2013-09-25T07:10:30.852Z:ol" }, { "content": "you shall not commit adultery: don't lust, resist personal sin, don't divorce [embedded] (27-32)", "embeddedOutlineId": "kyk:2013-09-25T17:38:01.173Z:ol" }, { "content": "fulfill your vows to the Lord: be true to your word [embedded] (33-37)", "embeddedOutlineId": "kyk:2013-09-25T18:05:04.985Z:ol" }, { "content": "do not resist evil against you personally [embedded] (38-42)", "embeddedOutlineId": "kyk:2013-09-25T20:10:59.637Z:ol" }, { "content": "love your enemies: be like your Father [embedded] (43-47)", "embeddedOutlineId": "kyk:2013-09-25T07:19:11.186Z:ol" }, { "content": "be perfect as your heavenly Father is perfect (48)" }] } } },
        { "id": "kyk:2013-08-20T16:01:20.678Z:ol", "key": ["kyk:2013-08-20T16:01:20.678Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-20T16:01:20.678Z:ol", "_rev": "1-fdd6e1fd4d540913932249d1cfc2e20e", "head": { "contentType": "chiasm", "title": "Who are you going to serve? God or money?", "ScriptureRange": "Matthew 6:19-24", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 20, "16:01:20.678Z"] }, "body": { "concepts": [{ "content": "treasure on earth or in heaven; your heart will be where your treasure is (19-21)" }, { "content": "clean eyes => light inside; bad eyes => darkness inside (22-23)" }, { "content": "two masters: God vs. Money (24)" }] } } },
        { "id": "kyk:2013-08-20T16:04:26.425Z:ol", "key": ["kyk:2013-08-20T16:04:26.425Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-20T16:04:26.425Z:ol", "_rev": "2-cefb7cd630500765198971f7c3370343", "head": { "contentType": "chiasm", "title": "Life or destruction? You can't fake your way in.", "ScriptureRange": "Matthew 7:13-27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 20, "16:04:26.425Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 7, 24, "12:38:52.745Z"] }, "body": { "concepts": [{ "content": "two gates, paths, travellers, destinations: destruction (13)" }, { "content": "two gates, paths, travellers, destinations: life (14)" }, { "content": "false prophets: good label/bad contents (15-23)" }, { "content": "two houses: safety (24-25)" }, { "content": "two houses: destruction (26-27)" }] } } },
        { "id": "kyk:2013-08-27T12:15:55.141Z:ol", "key": ["kyk:2013-08-27T12:15:55.141Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-27T12:15:55.141Z:ol", "_rev": "6-74a5a27f145cf28f974a236849739279", "head": { "contentType": "chiasm", "title": "It's no mystery!", "ScriptureRange": "Romans 16:25-27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 27, "12:15:55.141Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 25, "05:05:30.708Z"] }, "body": { "concepts": [{ "content": "Now to the One who is able to strengthen/establish you (25a)" }, { "content": "according to my gospel (25b)", "embeddedType": "panel", "isHead": true }, { "content": "and the proclamation of Jesus Christ, (25c)", "embeddedType": "panel" }, { "content": "according to the revelation of the mystery/secret (25d)" }, { "content": "(which) from all eternity (25e)" }, { "content": "has been kept (in) silence (25f)" }, { "content": "but (this mystery/secret) has been manifested (26a)" }, { "content": "now (26b)" }, { "content": "and through the prophetic writings according to the command of the eternal God (26c)" }, { "content": "to bring about[=purpose] the obedience produced by faith (26d)", "embeddedType": "panel", "isHead": true }, { "content": "for the benefit[=advantage] of all the non-Jews (this proclamation) has been made known (26e)", "embeddedType": "panel" }, { "content": "to the only wise God, through Jesus Christ,--to Him (=God) (be) the glory forever, Amen. (27)" }] } } },
        { "id": "kyk:2013-08-30T11:01:03.238Z:ol", "key": ["kyk:2013-08-30T11:01:03.238Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-08-30T11:01:03.238Z:ol", "_rev": "4-24e26165df844fd6d0b9852527465007", "head": { "contentType": "panel", "title": "Two (sets of) good Jews follow Jesus", "ScriptureRange": "Mark 1:16-20", "contentParams": { "repeat": 7, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 30, "11:01:03.238Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "10:57:12.205Z"] }, "body": { "concepts": [{ "content": "going along (16a)" }, { "content": "He saw (16b)" }, { "content": "Simon and Andrew (16c)" }, { "content": "casting a net (16d)" }, { "content": "\"Follow Me\" [embedded](17)", "embeddedOutlineId": "kyk:2014-09-14T10:37:46.416Z:ol" }, { "content": "left the nets (18a)" }, { "content": "and followed Him (18b)" }, { "content": "going on (19a)" }, { "content": "He saw (19b)" }, { "content": "James and John (19c)" }, { "content": "in the boat mending the nets (19d)" }, { "content": "He called them [embedded](20a)", "embeddedOutlineId": "kyk:2014-09-14T10:42:12.934Z:ol" }, { "content": "they left their father in the boat (20b)" }, { "content": "and went away to follow Him (20c)" }] } } },
        { "id": "kyk:2013-08-30T11:04:10.320Z:ol", "key": ["kyk:2013-08-30T11:04:10.320Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T11:04:10.320Z:ol", "_rev": "10-27b20d6924418f2435bb43778bc0ae8c", "head": { "contentType": "chiasm", "title": "Insiders and outsiders both follow Jesus", "ScriptureRange": "Mark 1:16-2:14", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 30, "11:04:10.320Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "10:55:51.850Z"] }, "body": { "concepts": [{ "content": "Simon & Andrew, & James & John(good Jews)...\"Follow Me!\" [embedded](1:16-20)", "embeddedOutlineId": "kyk:2013-08-30T11:01:03.238Z:ol" }, { "content": "deliverance of man in synagogue(a good Jew)...authority over unclean spirits [embedded](1:21-27)", "embeddedOutlineId": "kyk:2014-09-14T11:40:28.436Z:ol" }, { "content": "the news about Him went out everywhere (1:28)" }, { "content": "He touched & healed Simon's mother-in-law(a good Jew) [embedded](1:29-31)", "embeddedOutlineId": "kyk:2014-09-14T14:32:00.525Z:ol" }, { "content": "the whole city gathered at the door [embedded](1:32-34)", "embeddedOutlineId": "kyk:2014-09-14T14:29:07.789Z:ol" }, { "content": "\"everyone is looking for You\" [note focus on Simon] [embedded](1:35-39)", "embeddedOutlineId": "kyk:2014-09-14T14:23:24.191Z:ol" }, { "content": "He touched & cleansed a leper(a bad Jew) [embedded](1:40-44)", "embeddedOutlineId": "kyk:2014-09-14T15:41:29.356Z:ol" }, { "content": "he spread the news...they were coming to Him from everywhere (1:45)" }, { "content": "healing a paralytic(a bad Jew)...authority to forgive sins [embedded](2:1-13)", "embeddedOutlineId": "kyk:2014-09-14T17:43:56.843Z:ol" }, { "content": "Matthew(a bad Jew)...\"Follow Me!\" [embedded](2:14)", "embeddedOutlineId": "kyk:2014-09-14T17:36:34.803Z:ol" }] } } },
        { "id": "kyk:2013-08-30T11:15:07.556Z:ol", "key": ["kyk:2013-08-30T11:15:07.556Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T11:15:07.556Z:ol", "_rev": "34-005a8fd40f972a3e97c577cff6e71dda", "head": { "contentType": "chiasm", "title": "The overall structure of Mark", "ScriptureRange": "Mark 1:1-16:8", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 30, "11:15:07.556Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2015, 2, 2, "03:05:17.541Z"] }, "body": { "concepts": [{ "content": "witness of John [embedded] (1:1-8)", "embeddedOutlineId": "kyk:2013-10-28T11:14:15.717Z:ol" }, { "content": "baptism (1:9)" }, { "content": "torn heavens (1:10)", "embeddedType": "panel", "isHead": true }, { "content": "Father's testimony \"My beloved Son\" (1:11)", "embeddedType": "panel" }, { "content": "wilderness temptation (1:12-13)" }, { "content": "Gospel of the Kingdom (1:14-15)" }, { "content": "insiders and outsiders both follow Jesus [embedded] (1:16-2:14)", "embeddedOutlineId": "kyk:2013-08-30T11:04:10.320Z:ol" }, { "content": "the Son of Man is above the Law & people gather to Him [embedded] (2:15-3:12)", "embeddedOutlineId": "kyk:2013-08-31T18:30:59.525Z:ol" }, { "content": "Jesus appoints the twelve to be with him and to advance the Kingdom [embedded](3:13-19)", "embeddedOutlineId": "kyk:2014-09-15T04:30:59.236Z:ol" }, { "content": "the \"insanity\" of Jesus: Satan is defeated! [embedded] (3:20-35)", "embeddedOutlineId": "kyk:2013-09-23T23:27:13.925Z:ol" }, { "content": "parables of good fruit (4:1-34)" }, { "content": "amazed at Jesus' authority [embedded] (4:35-41)", "embeddedOutlineId": "kyk:2015-02-02T02:56:39.254Z:ol" }, { "content": "demons driven out (5:1-20)" }, { "content": "two daughters & a crowd--one touches the King's garment, one is touched by the King [embedded] (5:21-43)", "embeddedOutlineId": "kyk:2014-04-03T10:37:35.423Z:ol" }, { "content": "unbelief of those who should see [embedded] (6:1-6)", "embeddedOutlineId": "kyk:2013-11-05T05:42:30.968Z:ol" }, { "content": "disciples' place in the Kingdom--power with suffering [embedded] (6:7-30)", "embeddedOutlineId": "kyk:2013-09-02T06:31:30.169Z:ol" }, { "content": "Pharisees' guilt--inner defilement [embedded] (6:31-8:10)", "embeddedOutlineId": "kyk:2013-09-02T06:35:20.854Z:ol" }, { "content": "Pharisees seek a sign (8:11)", "embeddedType": "panel", "isHead": true }, { "content": "no sign shall be given to this generation (8:12-13)", "embeddedType": "panel" }, { "content": "Pharisees' leaven--no understanding & hardened hearts (8:14-21)" }, { "content": "\"what do you see?\" [embedded](8:22-26)", "embeddedOutlineId": "kyk:2014-01-01T07:46:17.094Z:ol" }, { "content": "\"who do you say I am?\" [embedded](8:27-30)", "embeddedOutlineId": "kyk:2014-01-01T07:43:18.157Z:ol" }, { "content": "satan's plea--avoid suffering(8:31-38)" }, { "content": "some see the Kingdom (9:1-13)", "embeddedType": "panel", "isHead": true }, { "content": "unbelieving generation (9:14-29)", "embeddedType": "panel" }, { "content": "Pharisees' guilt--not doing God's will [embedded] (9:30-10:34)", "embeddedOutlineId": "kyk:2013-09-02T08:12:33.473Z:ol" }, { "content": "disciples' place in the Kingdom--suffering and slavery [embedded] (10:35-45)", "embeddedOutlineId": "kyk:2013-11-05T05:11:46.743Z:ol" }, { "content": "belief of one who is blind [embedded] (10:46-52)", "embeddedOutlineId": "kyk:2013-09-02T08:17:57.825Z:ol" }, { "content": "crowds throw down their garments to welcome Jesus as King (11:1-11)" }, { "content": "moneychangers driven out [embedded] (11:12-26)", "embeddedOutlineId": "kyk:2013-09-02T06:36:32.952Z:ol" }, { "content": "questioning Jesus' authority [embedded] (11:27-33)", "embeddedOutlineId": "kyk:2015-02-02T03:02:00.560Z:ol" }, { "content": "parable of bad fruit (12:1-12)" }, { "content": "the wisdom of Jesus: Christ's enemies are under His feet! [embedded] (12:13-37)", "embeddedOutlineId": "kyk:2013-09-24T00:04:05.272Z:ol" }, { "content": "Jesus returns as King [embedded] (12:38-14:11)", "embeddedOutlineId": "kyk:2013-09-02T06:46:58.998Z:ol" }, { "content": "the Son of Man is under the Law: strike the Shepherd & scatter the sheep [embedded] (14:12-50)", "embeddedOutlineId": "kyk:2013-08-31T18:34:43.095Z:ol" }, { "content": "insiders and outsiders both reject Jesus [embedded] (14:51-15:21)", "embeddedOutlineId": "kyk:2013-08-31T13:34:30.949Z:ol" }, { "content": "crucifixion of the King [embedded] (15:22-37)", "embeddedOutlineId": "kyk:2014-11-01T18:16:17.906Z:ol" }, { "content": "the bitter drink [embedded] (15:34-37)", "embeddedOutlineId": "kyk:2014-11-01T17:42:39.801Z:ol" }, { "content": "torn curtain (15:38)", "embeddedType": "panel", "isHead": true }, { "content": "centurian's testimony \"the Son of God\" (15:39)", "embeddedType": "panel" }, { "content": "burial [embedded] (15:40-16:1)", "embeddedOutlineId": "kyk:2013-08-30T18:08:38.491Z:ol" }, { "content": "witness of an angel [embedded] (16:2-8)", "embeddedOutlineId": "kyk:2013-08-30T19:07:36.508Z:ol" }] } } },
        { "id": "kyk:2013-08-30T18:08:38.491Z:ol", "key": ["kyk:2013-08-30T18:08:38.491Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T18:08:38.491Z:ol", "_rev": "3-fbfd27ea0b1dba30c6d94ae5e4b72400", "head": { "contentType": "chiasm", "title": "Burial of Jesus", "ScriptureRange": "Mark 15:40-16:1", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 30, "18:08:38.491Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:26:22.253Z"] }, "body": { "concepts": [{ "content": "onlooking women at the cross (15:40)", "embeddedType": "panel", "isHead": true }, { "content": "who were serving him (15:41) & it was the day before the Sabbath (15:42)", "embeddedType": "panel" }, { "content": "Joseph waits for the kingdom of God (15:43a)" }, { "content": "Joseph asks for Jesus' body (15:43b)" }, { "content": "Pilate wonders if Jesus is dead (15:44a)" }, { "content": "the centurion affirms Jesus' death (15:44b-45a)" }, { "content": "Pilate grants Joseph's request (15:45b)" }, { "content": "Joseph lays Jesus in a tomb (15:46)" }, { "content": "onlooking women at the tomb (15:47)", "embeddedType": "panel", "isHead": true }, { "content": "after the Sabbath passed (16:1a) & they brought spices in order to anoint him (16:1b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-08-30T19:07:36.508Z:ol", "key": ["kyk:2013-08-30T19:07:36.508Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T19:07:36.508Z:ol", "_rev": "3-457337332449d552988a95051b5f0670", "head": { "contentType": "chiasm", "title": "Amazed? Don't be. Keep seeking Jesus the Nazarene, crucified, risen--the tomb is empty!", "ScriptureRange": "Mark 16:2-8", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "19:07:36.508Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:25:14.657Z"] }, "body": { "concepts": [{ "content": "they came to the tomb (2)", "isHead": true, "embeddedType": "panel" }, { "content": "they were speaking to one another (3a)", "embeddedType": "panel" }, { "content": "looking up, they saw [embedded] (3b-4)", "embeddedOutlineId": "kyk:2013-08-30T19:09:54.565Z:ol" }, { "content": "having entered the tomb, they saw an angel (5a)" }, { "content": "they were amazed (5b)" }, { "content": "\"do not be amazed\" (6a)" }, { "content": "\"you are seeking (or Keep seeking!) Jesus the Nazarene, the one who has been crucified\" (6b)" }, { "content": "\"He is raised\" (6c)" }, { "content": "\"He is not here\" (6d)" }, { "content": "\"behold the place where they laid Him\" (6e)" }, { "content": "\"you will see Him\" [embedded] (7)", "embeddedOutlineId": "kyk:2013-08-30T19:13:13.867Z:ol" }, { "content": "they fled from the tomb (8a)", "isHead": true, "embeddedType": "panel" }, { "content": "they said nothing to anyone [embedded] (8c)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-08-30T19:15:20.460Z:ol" }] } } },
        { "id": "kyk:2013-08-30T19:09:54.565Z:ol", "key": ["kyk:2013-08-30T19:09:54.565Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T19:09:54.565Z:ol", "_rev": "3-4ea4054eaa87ee71ffca53b4dbce017b", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 16:3-4", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "19:09:54.565Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:24:57.622Z"] }, "body": { "concepts": [{ "content": "who will roll away the stone? (3b)" }, { "content": "looking up, they saw (4a)" }, { "content": "the stone had been rolled away (4b)" }] } } },
        { "id": "kyk:2013-08-30T19:13:13.867Z:ol", "key": ["kyk:2013-08-30T19:13:13.867Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T19:13:13.867Z:ol", "_rev": "3-15317443b4cf0ef57a7b234c30b1624b", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 16:7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "19:13:13.867Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:24:41.520Z"] }, "body": { "concepts": [{ "content": "go, tell His disciples & Peter (7a)" }, { "content": "He goes before you to Galilee, there you will see Him (7b)" }, { "content": "just as He told you (7c)" }] } } },
        { "id": "kyk:2013-08-30T19:15:20.460Z:ol", "key": ["kyk:2013-08-30T19:15:20.460Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-30T19:15:20.460Z:ol", "_rev": "3-3e10b649732da4cc5fc36b22673e0591", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 16:8", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "19:15:20.460Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:24:25.293Z"] }, "body": { "concepts": [{ "content": "trembling & astonishment gripped them (8b)" }, { "content": "they said nothing to anyone (8c)" }, { "content": "they were afraid (8d)" }] } } },
        { "id": "kyk:2013-08-31T13:34:30.949Z:ol", "key": ["kyk:2013-08-31T13:34:30.949Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T13:34:30.949Z:ol", "_rev": "6-31409357bb54fb78175e5fc099cae7bb", "head": { "contentType": "chiasm", "title": "Insiders and outsiders both reject Jesus", "ScriptureRange": "Mark 14:51-15:21", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "13:34:30.949Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "20:00:10.318Z"] }, "body": { "concepts": [{ "content": "John Mark(an insider)--runs away naked (14:51-52)" }, { "content": "Jesus before the High priest(an insider) (14:53-62)", "embeddedType": "panel", "isHead": true }, { "content": "condemned to death for blasphemy(by insiders) (14:63-64)", "embeddedType": "panel" }, { "content": "spit upon, beaten, slapped(by insiders) (14:65)", "embeddedType": "panel" }, { "content": "Peter's denials(an insider among outsiders) (14:66-72)" }, { "content": "Jesus before Pilate(an outsider) [embedded] (15:1-7)", "embeddedType": "panel", "isHead": true, "embeddedOutlineId": "kyk:2014-11-01T19:42:14.764Z:ol" }, { "content": "\"What evil has He done?\" [embedded] (15:8-15)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-08-31T13:36:40.995Z:ol" }, { "content": "mocked, beaten, spit upon(by outsiders) [embedded] (15:16-20)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-08-31T13:39:06.597Z:ol" }, { "content": "Simon of Cyrene(an outsider)--forced to carry His cross (15:21)" }] } } },
        { "id": "kyk:2013-08-31T13:36:40.995Z:ol", "key": ["kyk:2013-08-31T13:36:40.995Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T13:36:40.995Z:ol", "_rev": "5-1ef2cbb831c6084164724ed197bb4baf", "head": { "contentType": "chiasm", "title": "The release of Barabbas & condemnation of the Son(=bar) of the Father(=Abba)", "ScriptureRange": "Mark 15:8-15", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "13:36:40.995Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "19:14:38.748Z"] }, "body": { "concepts": [{ "content": "the multitude request Pilate to release someone (8)", "isHead": true, "embeddedType": "panel" }, { "content": "Jesus handed over & multitude stirred to release Barabbas [embedded] (10-11)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-11-01T19:08:20.813Z:ol" }, { "content": "the multitude shout \"crucify Him!\" (13)" }, { "content": "\"What evil has He done?\" (14a)" }, { "content": "all the more they shout \"crucify Him!\" (14b)" }, { "content": "Pilate wants to satisfy the multitude (15a)", "isHead": true, "embeddedType": "panel" }, { "content": "he released Barabbas (15b) and handed over Jesus (15c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-08-31T13:39:06.597Z:ol", "key": ["kyk:2013-08-31T13:39:06.597Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T13:39:06.597Z:ol", "_rev": "3-fe2ee61ec63e112d835dfc1183ed20b5", "head": { "contentType": "chiasm", "title": "The protectors of the King mock, beat & spit upon Him", "ScriptureRange": "Mark 15:16-20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 8, 31, "13:39:06.597Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "18:35:55.505Z"] }, "body": { "concepts": [{ "content": "so that He might be crucified (15d)" }, { "content": "the soldiers take Him into the Praetorium (16)" }, { "content": "they dress Him up in purple (17)" }, { "content": "they mock Him \"Hail, King of the Jews!\" (18a)" }, { "content": "they keep beating (19a)" }, { "content": "& spitting upon Him (19b)" }, { "content": "they kneel & bow before Him (19b)" }, { "content": "they took the purple off Him (20a)" }, { "content": "they lead Him out (20b)" }, { "content": "so that they might crucify Him (20c)" }] } } },
        { "id": "kyk:2013-08-31T18:30:59.525Z:ol", "key": ["kyk:2013-08-31T18:30:59.525Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T18:30:59.525Z:ol", "_rev": "4-126cea2b3c32a9c7c74e000fc2683f93", "head": { "contentType": "chiasm", "title": "the Son of Man is above the Law & people gather to Him", "ScriptureRange": "Mark 2:15-3:12", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 1, "18:30:59.525Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:24:05.135Z"] }, "body": { "concepts": [{ "content": "many tax-gatherers and sinners were following Him (2:15-16)", "embeddedType": "panel", "isHead": true }, { "content": "those who are sick need a physician (2:17)", "embeddedType": "panel" }, { "content": "when the Bridegroom is there the rules change (2:18-22)" }, { "content": "the Son of Man is Lord over the Sabbath (2:23-28)" }, { "content": "it's lawful to break the Sabbath to do good (3:1-6)" }, { "content": "multitudes followed Him (3:7-9)", "embeddedType": "panel", "isHead": true }, { "content": "He healed many--He's the Son of God! (3:10-12)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-08-31T18:34:43.095Z:ol", "key": ["kyk:2013-08-31T18:34:43.095Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T18:34:43.095Z:ol", "_rev": "3-8527ef290699eeeeb15ba6767637167c", "head": { "contentType": "chiasm", "title": "the Son of Man is under the Law: strike the Shepherd & scatter the sheep", "ScriptureRange": "Mark 14:12-50", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 1, "18:34:43.095Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:23:48.696Z"] }, "body": { "concepts": [{ "content": "a strange sign: a man carrying a water pot (12-16)" }, { "content": "betrayal of the Son of Man predicted (17-21)" }, { "content": "the cup of the covenant (22-25)" }, { "content": "they went out to the Mount of Olives (26)" }, { "content": "You will all fall away because it stands written, \"I will strike down the Shepherd & the sheep will be scattered.\" (27-31)" }, { "content": "they came to Gethsemane (32a)" }, { "content": "the cup of suffering [embedded] (32b-42a)", "embeddedOutlineId": "kyk:2013-08-31T18:36:57.519Z:ol" }, { "content": "\"behold, the one who betrays Me is at hand!\" (42b)" }, { "content": "a strange sign: betrayal with a kiss [embedded] (43-50)", "embeddedOutlineId": "kyk:2013-08-31T18:38:26.631Z:ol" }] } } },
        { "id": "kyk:2013-08-31T18:36:57.519Z:ol", "key": ["kyk:2013-08-31T18:36:57.519Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T18:36:57.519Z:ol", "_rev": "2-be6ac5b43573cb3289b919852e4e23d9", "head": { "contentType": "chiasm", "title": "the cup of suffering", "ScriptureRange": "Mark 14:32b-42a", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 1, "18:36:57.519Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:23:24.613Z"] }, "body": { "concepts": [{ "content": "\"sit here\" (32b)" }, { "content": "distressed with Peter, James & John (33)" }, { "content": "\"keep watch\" (34)" }, { "content": "prays that the hour might pass Him by (35)" }, { "content": "\"remove this cup from Me\" (36)" }, { "content": "\"keep watch\" (37-38)" }, { "content": "distressed with Peter, James & John (39-41)" }, { "content": "\"arise, let us be going\" (42a)" }] } } },
        { "id": "kyk:2013-08-31T18:38:26.631Z:ol", "key": ["kyk:2013-08-31T18:38:26.631Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-08-31T18:38:26.631Z:ol", "_rev": "3-5a6b399a19d86676a068a6e89ca64107", "head": { "contentType": "chiasm", "title": "a strange sign: betrayal with a kiss", "ScriptureRange": "Mark 14:43-50", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 1, "18:38:26.631Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:23:04.645Z"] }, "body": { "concepts": [{ "content": "swords and clubs (43)" }, { "content": "\"I shall kiss\" (44a)", "embeddedType": "panel", "isHead": true }, { "content": "\"seize Him\" (44b)", "embeddedType": "panel" }, { "content": "kissed Him (45)", "embeddedType": "panel", "isHead": true }, { "content": "seized Him (46)", "embeddedType": "panel" }, { "content": "swords and clubs (47-50)" }] } } },
        { "id": "kyk:2013-09-01T03:42:10.491Z:ol", "key": ["kyk:2013-09-01T03:42:10.491Z:ol", "chiasm: unspecified author"], "value": { "_id": "kyk:2013-09-01T03:42:10.491Z:ol", "_rev": "1-b43b0f02f7a6bb80e17b40c35d0ab3d3", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "", "submissionTimestamp": [2013, 8, 31, "03:42:10.491Z"] }, "body": { "concepts": [{ "content": "a", "embeddedType": "panel", "isHead": true }, { "content": "b", "embeddedType": "panel" }, { "content": "a", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-09-02T04:36:16.812Z:ol", "key": ["kyk:2013-09-02T04:36:16.812Z:ol", "chiasm: unspecified author"], "value": { "_id": "kyk:2013-09-02T04:36:16.812Z:ol", "_rev": "1-879fb16aab9e850233974d71e8105e42", "head": { "contentType": "chiasm", "title": "Establish true worship", "ScriptureRange": "", "submissionTimestamp": [2013, 9, 1, "04:36:16.812Z"] }, "body": { "concepts": [{ "content": "Seek Lord in place He chooses, v. 5" }, { "content": "Bring offerings and contributions, v. 6", "embeddedType": "panel", "isHead": true }, { "content": "Rejoice with house, v.7", "embeddedType": "panel" }, { "content": "Rest given, vv.8-9" }, { "content": "Bring offerings and contributes, vv. 10-11", "embeddedType": "panel", "isHead": true }, { "content": "Rejoice with house, v. 12", "embeddedType": "panel" }, { "content": "Offer offerings in place Lord chooses, vv. 13-14" }] } } },
        { "id": "kyk:2013-09-02T05:31:00.505Z:ol", "key": ["kyk:2013-09-02T05:31:00.505Z:ol", "chiasm: pjleithart"], "value": { "_id": "kyk:2013-09-02T05:31:00.505Z:ol", "_rev": "5-04304450e0277469fd311cc9e4f1981b", "head": { "contentType": "chiasm", "title": "II. Establish True Worship", "ScriptureRange": "Deuteronomy 12:5-14", "submissionTimestamp": [2013, 9, 2, "05:31:00.505Z"], "source": { "details": "p. 35", "website": "", "guid": "kyk:2012-05-23T19:08:13.954Z:sr" }, "modifiedTimestamp": [2013, 9, 5, "01:57:03.581Z"], "author": { "guid": "kyk:2012-05-23T19:05:05.116Z:ps", "authorShortname": "pjleithart" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" } }, "body": { "concepts": [{ "content": "Seek Lord in place He chooses, v. 5" }, { "content": "Bring offerings and contributions, v. 6", "embeddedType": "panel", "isHead": true }, { "content": "Rejoice with house, v.7", "embeddedType": "panel" }, { "content": "Rest given, vv.8-9" }, { "content": "Bring offerings and contributions, vv. 10-11", "embeddedType": "panel", "isHead": true }, { "content": "Rejoice with house, v. 12", "embeddedType": "panel" }, { "content": "Offer offerings in place Lord chooses, vv. 13-14" }] } } },
        { "id": "kyk:2013-09-02T06:27:37.433Z:ol", "key": ["kyk:2013-09-02T06:27:37.433Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:27:37.433Z:ol", "_rev": "2-d568e98da297f801073e5317eb6e2883", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 5:3-5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:27:37.433Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:22:01.695Z"] }, "body": { "concepts": [{ "content": "among the tombs (3a)" }, { "content": "no one was able to bind him (3b)" }, { "content": "shackles (4a)" }, { "content": "chains (4b)" }, { "content": "chains (4c)" }, { "content": "shackles (4d)" }, { "content": "no one was strong enough to subdue him (4e)" }, { "content": "among the tombs (5)" }] } } },
        { "id": "kyk:2013-09-02T06:29:15.495Z:ol", "key": ["kyk:2013-09-02T06:29:15.495Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:29:15.495Z:ol", "_rev": "2-470c34b1dce3dff94a1ca4ef78835f61", "head": { "contentType": "chiasm", "title": "Insiders and outsiders are both healed by touching Jesus", "ScriptureRange": "Mark 5:21-43", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:29:15.495Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:22:33.300Z"] }, "body": { "concepts": [{ "content": "\"please come and lay your hands on her\"(an insider) (21-24)" }, { "content": "\"if I just touch His garments I shall get well\"(an outsider) (25-28)" }, { "content": "she was healed of her affliction (29-34)" }, { "content": "taking her by the hand, \"little girl, arise!\" (35-43)" }] } } },
        { "id": "kyk:2013-09-02T06:31:30.169Z:ol", "key": ["kyk:2013-09-02T06:31:30.169Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:31:30.169Z:ol", "_rev": "2-d82b350a3f81386a0310f6faa8690f09", "head": { "contentType": "chiasm", "title": "disciples' place in the Kingdom--power with suffering", "ScriptureRange": "Mark 6:7-30", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:31:30.169Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:22:18.053Z"] }, "body": { "concepts": [{ "content": "the twelve are sent out (7-13)" }, { "content": "Herod's conclusion (14-16)" }, { "content": "how Herod killed John the Baptist (17-29)" }, { "content": "the twelve report back (30)" }] } } },
        { "id": "kyk:2013-09-02T06:35:20.854Z:ol", "key": ["kyk:2013-09-02T06:35:20.854Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:35:20.854Z:ol", "_rev": "2-1e1af7db8287394948962db49a456dad", "head": { "contentType": "chiasm", "title": "What makes a Jew/Gentile unclean? And how to get clean! [1st panel=Jews, 2nd panel=Gentiles]", "ScriptureRange": "Mark 6:31-8:10", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:35:20.854Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:21:45.728Z"] }, "body": { "concepts": [{ "content": "feeding of the five thousand (6:31-52)" }, { "content": "the fringe of Jewish society touch Jesus' fringe (6:53-56)" }, { "content": "the children eat their bread with unclean hands (7:1-5)" }, { "content": "Pharisees' guilt--inner defilement (7:6-23)" }, { "content": "the unclean eat the crumbs of the children's bread (7:24-30)" }, { "content": "Jesus touches the fringe of Gentile society (7:31-37)" }, { "content": "feeding of the four thousand (8:1-10)" }] } } },
        { "id": "kyk:2013-09-02T06:36:32.952Z:ol", "key": ["kyk:2013-09-02T06:36:32.952Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:36:32.952Z:ol", "_rev": "2-4bbb34661743c0d553d2ed2c24ad4345", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 11:12-26", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:36:32.952Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:21:28.647Z"] }, "body": { "concepts": [{ "content": "cursing the fig tree (12-14)" }, { "content": "moneychangers driven out (15-19)" }, { "content": "the fig tree withers (20-26)" }] } } },
        { "id": "kyk:2013-09-02T06:45:41.922Z:ol", "key": ["kyk:2013-09-02T06:45:41.922Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:45:41.922Z:ol", "_rev": "2-a7a54aaa132112bc153fe793a5459250", "head": { "contentType": "chiasm", "title": "questioning Jesus' authority", "ScriptureRange": "Mark 11:27-33", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:45:41.922Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:21:13.796Z"] }, "body": { "concepts": [{ "content": "\"by what authority are You doing these things?\" (27-28)" }, { "content": "\"if you answer one question, then I will answer your question.\" (29)" }, { "content": "\"Was John's baptism from heaven or from men?\" (30)" }, { "content": "if we say \"from heaven\" but shall we say \"from men\"? (31-32)" }, { "content": "\"we don't know.\" (33a)" }, { "content": "\"neither will I tell you by what authority I do these things.\" (33b)" }] } } },
        { "id": "kyk:2013-09-02T06:46:58.998Z:ol", "key": ["kyk:2013-09-02T06:46:58.998Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:46:58.998Z:ol", "_rev": "5-63e8854c3ccd1b0402ade757aac081f3", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 12:38-14:11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:46:58.998Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 12, 30, "19:48:30.084Z"] }, "body": { "concepts": [{ "content": "a small gift of great value [embedded] (12:38-44)", "embeddedOutlineId": "kyk:2014-12-28T10:17:50.476Z:ol" }, { "content": "Jesus returns as King [embedded] (13:1-37)", "embeddedOutlineId": "kyk:2014-12-29T19:45:45.139Z:ol" }, { "content": "a valuable gift \"wasted\" [embedded] (14:1-11)", "embeddedOutlineId": "kyk:2013-09-02T06:48:04.888Z:ol" }] } } },
        { "id": "kyk:2013-09-02T06:48:04.888Z:ol", "key": ["kyk:2013-09-02T06:48:04.888Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T06:48:04.888Z:ol", "_rev": "3-fd808a664f12432f7875fa7a86510830", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:1-11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "06:48:04.888Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 12, 28, "10:44:56.572Z"] }, "body": { "concepts": [{ "content": "chief priests & scribes seek to seize Him by stealth [embedded] (1-2)", "embeddedOutlineId": "kyk:2014-12-28T10:23:03.431Z:ol" }, { "content": "a valuable gift wasted [embedded] (3-9)", "embeddedOutlineId": "kyk:2014-12-28T10:36:59.921Z:ol" }, { "content": "Judas seeks how to betray Him at an opportune time [embedded] (10-11)", "embeddedOutlineId": "kyk:2014-12-28T10:25:23.476Z:ol" }] } } },
        { "id": "kyk:2013-09-02T08:12:33.473Z:ol", "key": ["kyk:2013-09-02T08:12:33.473Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T08:12:33.473Z:ol", "_rev": "3-12a9d0c89559a3aee95ee4a1c1be6b15", "head": { "contentType": "chiasm", "title": "Pharisees' guilt--not doing God's will", "ScriptureRange": "Mark 9:30-10:34", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "08:12:33.473Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:20:24.400Z"] }, "body": { "concepts": [{ "content": "the Son of Man will be killed and three days later He will rise again (9:30-32)" }, { "content": "if anyone wants to be first he shall be last of all (9:33-35)" }, { "content": "receive like a child (9:36-37)", "embeddedType": "panel", "isHead": true }, { "content": "don't hinder others (9:38-40)", "embeddedType": "panel" }, { "content": "ease of salvation (9:41)", "embeddedType": "panel" }, { "content": "remove stumbling blocks (9:42-50)", "embeddedType": "panel" }, { "content": "Pharisees' guilt--not doing God's will (10:1-12)" }, { "content": "receive like a child (10:13-16)", "embeddedType": "panel", "isHead": true }, { "content": "don't hinder others (10:13-16)", "embeddedType": "panel" }, { "content": "difficulty of salvation (10:17-27)", "embeddedType": "panel" }, { "content": "remove stumbling blocks (10:28-30)", "embeddedType": "panel" }, { "content": "many who are first will be last; and the last, first (10:31)" }, { "content": "the Son of Man will be killed and three days later He will rise again (10:32-34)" }] } } },
        { "id": "kyk:2013-09-02T08:14:15.868Z:ol", "key": ["kyk:2013-09-02T08:14:15.868Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T08:14:15.868Z:ol", "_rev": "2-b9638ea3c1e7ab5e9925184b27795c0a", "head": { "contentType": "chiasm", "title": "disciples' place in the Kingdom--suffering and slavery (part 1, suffering)", "ScriptureRange": "Mark 10:35-41", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "08:14:15.868Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:20:03.177Z"] }, "body": { "concepts": [{ "content": "James and John (35a)" }, { "content": "we want You to do something for us (35b-36)" }, { "content": "to sit on Your right and on Your left (37)" }, { "content": "are you able to drink the cup or be baptized with the baptism? (38)" }, { "content": "we are able, the cup you shall drink, you shall be baptized with the baptism (39)" }, { "content": "to sit on My right or on My left (40a)" }, { "content": "this is not Mine to give (40b)" }, { "content": "James and John (41)" }] } } },
        { "id": "kyk:2013-09-02T08:15:27.326Z:ol", "key": ["kyk:2013-09-02T08:15:27.326Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T08:15:27.326Z:ol", "_rev": "2-e246bdeb1e2b2d28b70e44a7d640a38d", "head": { "contentType": "chiasm", "title": "disciples' place in the Kingdom--suffering and slavery (part 2, slavery)", "ScriptureRange": "Mark 10:42-45", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "08:15:27.326Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:19:48.423Z"] }, "body": { "concepts": [{ "content": "rulers lord it over & great men execise authority (42)" }, { "content": "whoever wishes to be great shall be your servant (43)" }, { "content": "whoever wishes to be first shall be the slave of all (44)" }, { "content": "the Son of Man didn't come to be served but to serve & give His life as a ransom (45)" }] } } },
        { "id": "kyk:2013-09-02T08:17:57.825Z:ol", "key": ["kyk:2013-09-02T08:17:57.825Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-02T08:17:57.825Z:ol", "_rev": "5-4dc24c2019ad040b0633776249e1a34d", "head": { "contentType": "chiasm", "title": "belief of one who is blind", "ScriptureRange": "Mark 10:46-52", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 2, "08:17:57.825Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:19:34.226Z"] }, "body": { "concepts": [{ "content": "Bartimaeus(=\"son of defiled\"), a blind beggar (46a)", "isHead": true, "embeddedType": "panel" }, { "content": "he was sitting by the way (46b)", "embeddedType": "panel" }, { "content": "many were rebuking him so that he should be silent [embedded] (48a)", "embeddedOutlineId": "kyk:2013-11-08T07:01:04.458Z:ol" }, { "content": "Jesus stood still (49a)" }, { "content": "He said \"call him\", and they called the blind man (49b)" }, { "content": "\"take courage, (49c)" }, { "content": "He is calling you.\" [embedded] (49e)", "embeddedOutlineId": "kyk:2013-11-08T07:03:54.144Z:ol" }, { "content": "and came to Jesus (50b)" }, { "content": "Jesus answered him, \"what do you want Me to do for you?\" (51a)" }, { "content": "Jesus said to him, \"your faith has healed(lit.saved) you.\" [embedded] (52a)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-11-08T07:12:22.680Z:ol" }, { "content": "he followed Him in the way (52c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-09-04T04:08:00.769Z:ol", "key": ["kyk:2013-09-04T04:08:00.769Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-04T04:08:00.769Z:ol", "_rev": "3-e897b0ed83e53c895e1649a1ea5846f6", "head": { "contentType": "chiasm", "title": "it's lawful to break the Sabbath to do good", "ScriptureRange": "Mark 3:1-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 4, "04:08:00.769Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:19:19.484Z"] }, "body": { "concepts": [{ "content": "they were watching Him to see if He would heal him on the Sabbath (2a)", "embeddedType": "panel", "isHead": true }, { "content": "in order that they might accuse Him (2b)", "embeddedType": "panel" }, { "content": "He said to the man, \"Rise & come forward!\" (3)" }, { "content": "\"Is it lawful on the Sabbath to do good or to do evil, to save a soul or to kill?\" (4)" }, { "content": "He said to the man, \"Stretch out the hand!\" (5a)" }, { "content": "his hand was restored (5b)", "embeddedType": "panel", "isHead": true }, { "content": "they gave counsel against Him as to how they might destroy Him (6)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-09-05T13:34:29.970Z:ps", "key": ["kyk:2013-09-05T13:34:29.970Z:ps", "person: Krantz, Jeffrey"], "value": { "_id": "kyk:2013-09-05T13:34:29.970Z:ps", "_rev": "1-10c11d9371fc10f547bfc65867c36aef", "name": { "title": "", "first": "Jeffrey", "middle": "H.", "last": "Krantz", "suffix": "" }, "organization": { "name": "", "website": "http://www.preachingpeace.org" }, "head": { "contentType": "personProfile" } } },
        { "id": "kyk:2013-09-05T13:36:13.843Z:ol", "key": ["kyk:2013-09-05T13:36:13.843Z:ol", "chiasm: jhkrantz"], "value": { "_id": "kyk:2013-09-05T13:36:13.843Z:ol", "_rev": "2-9c6252be937548b9000dcb1dd9ef7a62", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:1-16:8", "author": { "guid": "kyk:2013-09-05T13:34:29.970Z:ps", "authorShortname": "jhkrantz" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "Crucified Son of Man or Mighty One?", "website": "www.preachingpeace.org/2010/04/06/mark_chiasm/", "guid": "" }, "submissionTimestamp": [2013, 9, 5, "13:36:13.843Z"], "modifiedTimestamp": [2014, 4, 15, "00:49:28.257Z"] }, "body": { "concepts": [{ "content": "Beginning – John points to Jesus 1:4-8" }, { "content": "Jesus’ baptism – The splitting of the heavens, “You are my son,” 1:9-11" }, { "content": "Jesus is tested in the wilderness 1:12-13" }, { "content": "The parable of the sower 4:1-9" }, { "content": "Raising of the young girl 5:21-43" }, { "content": "The death of John the Baptist 6:14-29" }, { "content": "Stilling of the second storm (exorcism of the deep) 6:45-52" }, { "content": "Peter’s confession 8:27-30" }, { "content": "– Jesus’ first passion prediction 8:31-33" }, { "content": "Transfiguration 9:2-10" }, { "content": "Exorcism of possessed boy 9:14-29" }, { "content": "Appearance of the rich (young) man 10:17-22" }, { "content": "Raising of the young man in Secret Mark (followed Mark 10:34)" }, { "content": "Parable of the vineyard 12:1-11" }, { "content": "Jesus is tested in the temple 12:13-27" }, { "content": "Jesus dies, the temple veil is split “Truly this was God’s son.” 15:33-39" }, { "content": "The “post-runner” the young man, points to Jesus 16:1-8" }] } } },
        { "id": "kyk:2013-09-10T04:07:10.166Z:ol", "key": ["kyk:2013-09-10T04:07:10.166Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-10T04:07:10.166Z:ol", "_rev": "1-a3f71eb58a0cdacd65c73aab64bb02e3", "head": { "contentType": "chiasm", "title": "Being properly fed", "ScriptureRange": "Proverbs 30:8-9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 10, "04:07:10.166Z"] }, "body": { "concepts": [{ "content": "deception & lies (8a)" }, { "content": "give neither poverty (8b)" }, { "content": "nor riches (8c)" }, { "content": "feed me with the food that is my portion (8d)" }, { "content": "lest I be full & deny Thee (9a)" }, { "content": "or lest I be in want & steal (9b)" }, { "content": "profane the name of my God (9c)" }] } } },
        { "id": "kyk:2013-09-10T12:15:41.777Z:ol", "key": ["kyk:2013-09-10T12:15:41.777Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-10T12:15:41.777Z:ol", "_rev": "3-bd72e681a6777d231c0bccd2d4d1c04b", "head": { "contentType": "chiasm", "title": "arresting \"I AM\"", "ScriptureRange": "John 18:3-10", "submissionTimestamp": [2013, 9, 10, "12:15:41.777Z"], "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "15:08:42.772Z"] }, "body": { "concepts": [{ "content": "six hundred soldiers, officers from the chief priests & the Pharisees (3a)" }, { "content": "lanterns & torches & weapons (3b)" }, { "content": "Jesus, knowing all things (4a)" }, { "content": "\"whom do you seek?\" (4b)", "embeddedType": "panel", "isHead": true }, { "content": "\"Jesus the Nazarene\" (5a)", "embeddedType": "panel" }, { "content": "\"I am\" (5b)", "embeddedType": "panel" }, { "content": "Judas ... standing with them (5c)" }, { "content": "\"I am\" (6a)" }, { "content": "they drew back, & fell to the ground (6b)" }, { "content": "\"whom do you seek?\" (7a)", "embeddedType": "panel", "isHead": true }, { "content": "\"Jesus the Nazarene\" (7b)", "embeddedType": "panel" }, { "content": "\"I am\" (8a)", "embeddedType": "panel" }, { "content": "that the word might be fulfilled which He spoke [embedded] (8b-9)", "embeddedOutlineId": "kyk:2013-09-10T12:27:10.731Z:ol" }, { "content": "a sword (10a)" }, { "content": "the high priest's slave (10b)" }] } } },
        { "id": "kyk:2013-09-10T12:27:10.731Z:ol", "key": ["kyk:2013-09-10T12:27:10.731Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-10T12:27:10.731Z:ol", "_rev": "1-14e96aa45f2919c460d3afe8caa28a40", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "John 18:8-9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 10, "12:27:10.731Z"], "modifiedTimestamp": [2013, 9, 10, "12:27:10.744Z"] }, "body": { "concepts": [{ "content": "\"let these go their way\" (8b)" }, { "content": "that the word might be fulfilled which He spoke (9a)" }, { "content": "\"of those whom Thou hast given Me I lost not one\" (9b)" }] } } },
        { "id": "kyk:2013-09-20T02:37:27.599Z:ol", "key": ["kyk:2013-09-20T02:37:27.599Z:ol", "panel: unspecified author"], "value": { "_id": "kyk:2013-09-20T02:37:27.599Z:ol", "_rev": "2-f0a1d83cb292214b6409ca4f5e592874", "head": { "contentType": "panel", "title": "panel with embedded", "ScriptureRange": "", "contentParams": { "repeat": 2, "header": false }, "submissionTimestamp": [2013, 9, 19, "02:37:27.599Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 19, "04:31:01.791Z"] }, "body": { "concepts": [{ "content": "a", "embeddedOutlineId": "kyk:2013-09-20T02:37:27.599Z:ol" }, { "content": "b" }, { "content": "a" }, { "content": "b" }] } } },
        { "id": "kyk:2013-09-23T22:33:09.809Z:ol", "key": ["kyk:2013-09-23T22:33:09.809Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-23T22:33:09.809Z:ol", "_rev": "2-6f828ba3b3092a143f6ff5a6d530e703", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 3:31-32", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "22:33:09.809Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:18:17.517Z"] }, "body": { "concepts": [{ "content": "and outside standing they sent to Him calling Him (31b)" }, { "content": "was sitting around Him a multitude (32a)", "isHead": true, "embeddedType": "panel" }, { "content": "they are saying to him, \"behold, Your mother and Your brothers\" (32b)", "embeddedType": "panel" }, { "content": "\"outside they are seeking You.\" (32c)" }] } } },
        { "id": "kyk:2013-09-23T22:35:36.447Z:ol", "key": ["kyk:2013-09-23T22:35:36.447Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-23T22:35:36.447Z:ol", "_rev": "2-2caf8fdd8f6ede6f171a14ca03002033", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 3:33-35", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "22:35:36.447Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:17:59.425Z"] }, "body": { "concepts": [{ "content": "He is answering them, \"Who are My mother and brothers?\" (33)" }, { "content": "looking around at those around Him in a circle sitting (34a)", "isHead": true, "embeddedType": "panel" }, { "content": "He is saying, \"behold, My mother and My brothers\" (34b)", "embeddedType": "panel" }, { "content": "whoever does the will of God, (35a)" }] } } },
        { "id": "kyk:2013-09-23T22:46:16.092Z:ol", "key": ["kyk:2013-09-23T22:46:16.092Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-23T22:46:16.092Z:ol", "_rev": "2-10a32b1f6b20c31190217574d702ad0f", "head": { "contentType": "chiasm", "title": "Who is in My family?", "ScriptureRange": "Mark 3:31-35", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "22:46:16.092Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:17:41.544Z"] }, "body": { "concepts": [{ "content": "His mother and His brothers came, (31a)" }, { "content": "they are saying to him, \"behold, Your mother and Your brothers\" [embedded] (31b-32)", "embeddedOutlineId": "kyk:2013-09-23T22:33:09.809Z:ol" }, { "content": "He is saying, \"behold, My mother and My brothers\" [embedded] (33-35a)", "embeddedOutlineId": "kyk:2013-09-23T22:35:36.447Z:ol" }, { "content": "this one is My brother and sister and mother. (35b)" }] } } },
        { "id": "kyk:2013-09-23T22:59:16.935Z:ol", "key": ["kyk:2013-09-23T22:59:16.935Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-23T22:59:16.935Z:ol", "_rev": "2-1f23a8664b35cd848251e264f1cb2b22", "head": { "contentType": "chiasm", "title": "Blasphemy against the Holy Spirit", "ScriptureRange": "Mark 3:28-29", "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submissionTimestamp": [2013, 9, 24, "22:59:16.935Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:17:23.680Z"] }, "body": { "concepts": [{ "content": "all will be forgiven to the sons of men (28a)", "isHead": true, "embeddedType": "panel" }, { "content": "the sins (28b)", "embeddedType": "panel" }, { "content": "and the blasphemies whichever they blaspheme (28c)" }, { "content": "but whoever blasphemes against the Holy Spirit (29a)" }, { "content": "never has forgiveness (29b)", "isHead": true, "embeddedType": "panel" }, { "content": "but is guilty of an eternal sin (29c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-09-23T23:03:07.035Z:ol", "key": ["kyk:2013-09-23T23:03:07.035Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-23T23:03:07.035Z:ol", "_rev": "2-31717169941e0f35f75f27390125ce90", "head": { "contentType": "chiasm", "title": "the strong one is bound!", "ScriptureRange": "Mark 3:27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "23:03:07.035Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:17:05.421Z"] }, "body": { "concepts": [{ "content": "the strong one's house (27a)", "isHead": true, "embeddedType": "panel" }, { "content": "to plunder his things (27b)", "embeddedType": "panel" }, { "content": "unless he first (has) bound the strong one (27c)" }, { "content": "his house (27e)", "isHead": true, "embeddedType": "panel" }, { "content": "he will plunder (27d)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-09-23T23:09:35.725Z:ol", "key": ["kyk:2013-09-23T23:09:35.725Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-09-23T23:09:35.725Z:ol", "_rev": "3-849ad6e6d4bd06e5bbb552f3d40fa988", "head": { "contentType": "panel", "title": "Satan is finished!", "ScriptureRange": "Mark 3:23-26", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "23:09:35.725Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:16:46.548Z"] }, "body": { "concepts": [{ "content": "calling them to Himself, by parables He was saying, \"How can Satan cast out Satan?\" (23)" }, { "content": "\"if a kingdom is divided against itself, that kingdom cannot stand\" (24)" }, { "content": "\"if a house is divided against itself, that house will not be able to stand\" (25)" }, { "content": "\"if (let's assume) Satan did rebel against himself and was divided, (then) he cannot stand\" (26a)" }, { "content": "\"BUT he is meeting his end! (lit. he is having an end)\" (26b)" }] } } },
        { "id": "kyk:2013-09-23T23:27:13.925Z:ol", "key": ["kyk:2013-09-23T23:27:13.925Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-23T23:27:13.925Z:ol", "_rev": "3-7195f1eb272c4d2a65d99e0c86e02bbe", "head": { "contentType": "chiasm", "title": "the \"insanity\" of Jesus: Satan is defeated!", "ScriptureRange": "Mark 3:20-35", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "23:27:13.925Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:16:27.479Z"] }, "body": { "concepts": [{ "content": "He came home (lit. into a house) (20a)" }, { "content": "a multitude come together (20b)" }, { "content": "His own came out to take hold of Him (21)" }, { "content": "the scribes kept on saying, \"He has Beelzebul\" (22a)" }, { "content": "\"by the ruler of the demons He casts out the demons\" (22b)" }, { "content": "Satan is finished! [embedded] (23-26)", "embeddedOutlineId": "kyk:2013-09-23T23:09:35.725Z:ol" }, { "content": "the strong one is bound [embedded] (27)", "embeddedOutlineId": "kyk:2013-09-23T23:03:07.035Z:ol" }, { "content": "blasphemes against the Holy Spirit [embedded] (28-29)", "embeddedOutlineId": "kyk:2013-09-23T22:59:16.935Z:ol" }, { "content": "they kept on saying, \"He has an unclean spirit\" (30)" }, { "content": "His mother & His brothers came and outside standing they sent to Him calling Him (31)" }, { "content": "a multitude was sitting around Him (32)" }, { "content": "Who is My family? [embedded] (31-35)", "embeddedOutlineId": "kyk:2013-09-23T22:46:16.092Z:ol" }] } } },
        { "id": "kyk:2013-09-24T00:04:05.272Z:ol", "key": ["kyk:2013-09-24T00:04:05.272Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-09-24T00:04:05.272Z:ol", "_rev": "4-26c7df26111b4d4f38ca1afaa1f0097d", "head": { "contentType": "panel", "title": "the wisdom of Jesus", "ScriptureRange": "Mark 12:13-37", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "00:04:05.272Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:18:50.902Z"] }, "body": { "concepts": [{ "content": "Jesus answers the Pharisees & Herodians (13-17)" }, { "content": "Jesus answers the Sadducees (18-27)" }, { "content": "Jesus answers a Scribe (28-34)" }, { "content": "Jesus questions them [embedded] (35-37)", "embeddedOutlineId": "kyk:2013-09-24T12:45:51.605Z:ol" }] } } },
        { "id": "kyk:2013-09-24T12:45:51.605Z:ol", "key": ["kyk:2013-09-24T12:45:51.605Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-24T12:45:51.605Z:ol", "_rev": "3-6d2d745876c4cbb1c5beba0769c3ae53", "head": { "contentType": "chiasm", "title": "Jesus questions them: Christ's enemies are under His feet!", "ScriptureRange": "Mark 12:35-37", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 24, "12:45:51.605Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:18:34.403Z"] }, "body": { "concepts": [{ "content": "Jesus was replying by teaching in the Temple, (35a)" }, { "content": "\"How are the scribes saying that the Christ is David's son? (35b)" }, { "content": "\"David himself said in the Holy Spirit, 'the Lord said to my Lord, (36a)" }, { "content": "\"sit at my right hand until I put your enemies under your feet.\" ' (36b)" }, { "content": "\"David himself is calling Him Lord, (37a)" }, { "content": "\"and how is He his son?\" (37b)" }, { "content": "a great multitude was gladly hearing Him (37c)" }] } } },
        { "id": "kyk:2013-09-25T07:10:30.852Z:ol", "key": ["kyk:2013-09-25T07:10:30.852Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-25T07:10:30.852Z:ol", "_rev": "2-d42447d0b913c62bf1ffb739e5f51186", "head": { "contentType": "chiasm", "title": "you shall not commit murder: don't hate, draw near after being reconciled", "ScriptureRange": "Matthew 5:21-26", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 25, "07:10:30.852Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 25, "07:24:52.208Z"] }, "body": { "concepts": [{ "content": "you have heard that it was said to the ancients (21a)", "isHead": true, "embeddedType": "panel" }, { "content": "you shall not commit murder (21b)", "embeddedType": "panel" }, { "content": "angry (22a)", "isHead": true, "embeddedType": "panel" }, { "content": "legal matters (22b)", "embeddedType": "panel" }, { "content": "Gehenna of fire (22c)", "embeddedType": "panel" }, { "content": "presenting your offering at the altar (23a)" }, { "content": "there remember that your brother has something against you (23b)" }, { "content": "leave your offering there before the altar, & go your way (24a)" }, { "content": "first be reconciled to your brother (24b)" }, { "content": "then come & present your offering (24c)" }, { "content": "make friends (25a)", "isHead": true, "embeddedType": "panel" }, { "content": "legal matters (25b)", "embeddedType": "panel" }, { "content": "prison (25c)", "embeddedType": "panel" }, { "content": "truly I say to you (26a)", "isHead": true, "embeddedType": "panel" }, { "content": "you shall not come out of there, until you have paid up the last cent (26b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-09-25T07:19:11.186Z:ol", "key": ["kyk:2013-09-25T07:19:11.186Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-25T07:19:11.186Z:ol", "_rev": "1-297a22d509a5113dd922b47bb7298dec", "head": { "contentType": "chiasm", "title": "love your enemies: be like your Father", "ScriptureRange": "Matthew 5:43-47", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 25, "07:19:11.186Z"] }, "body": { "concepts": [{ "content": "you have heard that it was said, \"you shall love your neighbor, & hate your enemy.\" (43)" }, { "content": "love your enemies (44a)" }, { "content": "pray for those who persecute you (44b)" }, { "content": "in order that you may be sons of your Father who is in heaven (45a)" }, { "content": "He causes His sun to rise on evil & good, and sends rain on righteous & unrighteous (45b)" }, { "content": "if you love those who love you, what reward have you? (46)" }, { "content": "if you greet your brothers only, what more do you do (than others)? (47)" }] } } },
        { "id": "kyk:2013-09-25T17:38:01.173Z:ol", "key": ["kyk:2013-09-25T17:38:01.173Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-25T17:38:01.173Z:ol", "_rev": "1-51ca4afba343e03d80346fa28adbc662", "head": { "contentType": "chiasm", "title": "you shall not commit adultery: don't lust, resist personal sin, don't divorce", "ScriptureRange": "Matthew 5:27-32", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 25, "17:38:01.173Z"] }, "body": { "concepts": [{ "content": "lust is adultery (27-28)" }, { "content": "resist personal sin (29-30)" }, { "content": "divorce is either caused by or causes adultery (31-32)" }] } } },
        { "id": "kyk:2013-09-25T18:05:04.985Z:ol", "key": ["kyk:2013-09-25T18:05:04.985Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-09-25T18:05:04.985Z:ol", "_rev": "1-51d559269239ecef52372ae84531d6ad", "head": { "contentType": "panel", "title": "fulfill your vows to the Lord: be true to your word", "ScriptureRange": "Matthew 5:33-37", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 25, "18:05:04.985Z"] }, "body": { "concepts": [{ "content": "Again, you heard, \"you shall not make false vows, but shall fulfill your vows to the Lord\" (33)" }, { "content": "But I say to you, \"make no oath at all\" (34a)" }, { "content": "either by heaven (34b)" }, { "content": "or by the earth (35a)" }, { "content": "or by Jerusalem (35b)" }, { "content": "nor by your head (36)" }, { "content": "but let your word \"yes\" (mean) \"yes\", (and) \"no\" (mean) \"no\"; anything more than these is from the evil one. (37)" }] } } },
        { "id": "kyk:2013-09-25T20:10:59.637Z:ol", "key": ["kyk:2013-09-25T20:10:59.637Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-09-25T20:10:59.637Z:ol", "_rev": "1-011844a1dd9d9a4ebc2d4c12e50adaf6", "head": { "contentType": "panel", "title": "do not resist evil against you personally: allow the evil person to double the injury", "ScriptureRange": "Matthew 5:38-42", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 26, "20:10:59.637Z"] }, "body": { "concepts": [{ "content": "you have heard that it was said, \"an eye for an eye & a tooth for a tooth\" (38)" }, { "content": "but I say to you, \"do not resist the evil person\" (39a)" }, { "content": "your body: (if) anyone slaps you... (39b)" }, { "content": "your clothing: to the one who wants to sue you... (40)" }, { "content": "your service: (if) anyone forces you... (41)" }, { "content": "your money: give to the one who asks you, do not refuse the one who wants to borrow from you (42)" }] } } },
        { "id": "kyk:2013-09-25T20:57:33.462Z:ol", "key": ["kyk:2013-09-25T20:57:33.462Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-09-25T20:57:33.462Z:ol", "_rev": "1-da25816c3b24e3c2a47b30bb7dc2c246", "head": { "contentType": "chiasm", "title": "seek the kingdom (of God) and His righteousness", "ScriptureRange": "Mathew 6:31-34", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 9, 26, "20:57:33.462Z"] }, "body": { "concepts": [{ "content": "do not be anxious (31)" }, { "content": "all these things [=food & clothing] (32a)" }, { "content": "the Gentiles eagerly seek (32b)" }, { "content": "you seek the kingdom (of God) and His righteousness (33a)" }, { "content": "all these things will be provided to you (33b)" }, { "content": "do not be anxious (34)" }] } } },
        { "id": "kyk:2013-09-28T14:13:46.860Z:ol", "key": ["kyk:2013-09-28T14:13:46.860Z:ol", "chiasm: epyle"], "value": { "_id": "kyk:2013-09-28T14:13:46.860Z:ol", "_rev": "1-025063488aa07cd861ee9a9c408802c6", "head": { "contentType": "chiasm", "title": "the Son: redeemer and enthroned king", "ScriptureRange": "Hebrews 1:2-3", "author": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps", "authorShortname": "epyle" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 9, 28, "14:13:46.860Z"] }, "body": { "concepts": [{ "content": "appointed heir of all things (2)" }, { "content": "he made the aeons (2)" }, { "content": "bearing up all things by his might word (3)" }, { "content": "sat down at the right hand [of God] (3)" }] } } },
        { "id": "kyk:2013-09-28T14:25:18.218Z:ol", "key": ["kyk:2013-09-28T14:25:18.218Z:ol", "chiasm: unspecified author"], "value": { "_id": "kyk:2013-09-28T14:25:18.218Z:ol", "_rev": "1-be5359b74631135c98361fdb4e0d543e", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Hebrews 1:5-14", "submissionTimestamp": [2013, 9, 28, "14:25:18.218Z"] }, "body": { "concepts": [{ "content": "to which of the angels did He ever say (v5)" }, { "content": "when again the Firstborn is brought into the world (v. 6)" }, { "content": "unto the angels, He says (v.7)" }, { "content": "unto the Son (v.8)" }, { "content": "when the Son shall change heaven and earth which he made (v 10)" }, { "content": "unto which of the angels has he ever said (v13)" }] }, "_conflicts": ["1-b11e99514332ef4e8f60b1d25542d4d1"] } },
        { "id": "kyk:2013-09-28T14:26:56.665Z:ol", "key": ["kyk:2013-09-28T14:26:56.665Z:ol", "chiasm: epyle"], "value": { "_id": "kyk:2013-09-28T14:26:56.665Z:ol", "_rev": "3-3d987e6952bd6013bb47e3093ddb36cf", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Hebrews 1:5-13", "submissionTimestamp": [2013, 9, 28, "14:26:56.665Z"], "author": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps", "authorShortname": "epyle" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 28, "14:39:51.520Z"] }, "body": { "concepts": [{ "content": "to which of the angels did He ever say (v. 5)" }, { "content": "when again the Firstborn is brought into the world (v. 6)" }, { "content": "unto the angels, He says (v. 7)" }, { "content": "unto the Son (vv. 8-9)" }, { "content": "when the Son shall change heaven and earth which he made (vv. 10-12)" }, { "content": "unto which of the angels has he ever said (v13)" }] } } },
        { "id": "kyk:2013-09-28T14:38:29.915Z:ol", "key": ["kyk:2013-09-28T14:38:29.915Z:ol", "chiasm: epyle"], "value": { "_id": "kyk:2013-09-28T14:38:29.915Z:ol", "_rev": "2-ab1f71021f481a4dabb6e3a2eafb9e1e", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Hebrews 1:5-13", "author": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps", "authorShortname": "epyle" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "submissionTimestamp": [2013, 9, 28, "14:38:29.915Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 9, 28, "14:38:50.473Z"] }, "body": { "concepts": [{ "content": "Sonship was not spoken of to the angels (v. 5)" }, { "content": "angels should bow to the Son (v. 6)", "isHead": true, "embeddedType": "panel" }, { "content": "angels were created to be winds and fiery flames (v. 7)", "embeddedType": "panel" }, { "content": "the Son was enthroned and anointed to rule (vv. 8-9)", "isHead": true, "embeddedType": "panel" }, { "content": "the Son created heaven and earth, and his reign shall endure through his changing that creation (vv. 10-12)", "embeddedType": "panel" }, { "content": "Ruling to inherit victory over enemies was not spoken to the angels (v. 13)" }] } } },
        { "id": "kyk:2013-10-02T00:56:13.388Z:ol", "key": ["kyk:2013-10-02T00:56:13.388Z:ol", "chiasm: unspecified author"], "value": { "_id": "kyk:2013-10-02T00:56:13.388Z:ol", "_rev": "3-40067db5f9a6636cc30b14cd014d7828", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 7:6", "submissionTimestamp": [2013, 10, 1, "00:56:13.388Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 10, 1, "01:28:32.144Z"] }, "body": { "concepts": [{ "content": "dogs", "embeddedOutlineId": "kyk:2013-10-02T01:08:03.556Z:ol" }, { "content": "pigs" }, { "content": "trample" }, { "content": "turn to attack you" }] } } },
        { "id": "kyk:2013-10-02T01:08:03.556Z:ol", "key": ["kyk:2013-10-02T01:08:03.556Z:ol", "panel: unspecified author"], "value": { "_id": "kyk:2013-10-02T01:08:03.556Z:ol", "_rev": "2-6e86ba7fe8c06260ee33b92b4d686108", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 7:6", "submissionTimestamp": [2013, 10, 1, "01:08:03.556Z"], "contentParams": { "repeat": 3 }, "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 10, 1, "01:08:35.980Z"] }, "body": { "concepts": [{ "content": "don't give", "isHead": true, "embeddedType": "panel" }, { "content": "what is holy", "embeddedType": "panel" }, { "content": "to the dogs", "embeddedType": "panel" }, { "content": "don't throw", "isHead": true, "embeddedType": "panel" }, { "content": "your pearls", "embeddedType": "panel" }, { "content": "before the pigs", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-10-04T03:18:38.938Z:ol", "key": ["kyk:2013-10-04T03:18:38.938Z:ol", "chiasm: dadorsey"], "value": { "_id": "kyk:2013-10-04T03:18:38.938Z:ol", "_rev": "2-7d72a9d6e310443a5a7dc9fb67051a6c", "head": { "contentType": "chiasm", "title": "David's patience", "ScriptureRange": "1 Samuel 21:1-31:13", "submissionTimestamp": [2013, 10, 3, "03:18:38.938Z"], "author": { "guid": "kyk:2012-05-26T12:29:27.509Z:ps", "authorShortname": "dadorsey" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 132", "website": "", "guid": "kyk:2012-05-26T12:37:11.954Z:sr" }, "modifiedTimestamp": [2013, 10, 3, "03:20:54.326Z"] }, "body": { "concepts": [{ "content": "Saul kills Yahweh's priests, 21:1-22:23" }, { "content": "David saves Keilah from Philistines, 23:1-18" }, { "content": "Ziphites betray David; David spares Saul's life, 23:19-24:22" }, { "content": "David and Abigail, 25:1-44" }, { "content": "Ziphites betray David; David spares Saul's life, 26:1-25" }, { "content": "David protects Judean towns, 27:1-12" }, { "content": "Yahweh kills Saul, 28:1-31:13" }] } } },
        { "id": "kyk:2013-10-26T12:53:27.650Z:ol", "key": ["kyk:2013-10-26T12:53:27.650Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-10-26T12:53:27.650Z:ol", "_rev": "1-c9cac92e6252403d3c1062487779f2ea", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Ecclesiastes 6:3-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 10, 26, "12:53:27.650Z"] }, "body": { "concepts": [{ "content": "if a man lives many years (3a)", "isHead": true, "embeddedType": "panel" }, { "content": "not satisfied with good things (3b)", "embeddedType": "panel" }, { "content": "burial (3c)", "embeddedType": "panel" }, { "content": "better the miscarriage than he (3d)" }, { "content": "it goes into obscurity (4a)" }, { "content": "its name is covered in obscurity (4b)" }, { "content": "it is better off than he (5)" }, { "content": "if the man lives a thousand years twice (6a)", "isHead": true, "embeddedType": "panel" }, { "content": "does not enjoy good things (6b)", "embeddedType": "panel" }, { "content": "do not all go to one place? (6c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-10-26T18:03:51.151Z:ol", "key": ["kyk:2013-10-26T18:03:51.151Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-10-26T18:03:51.151Z:ol", "_rev": "2-011ea0180e9e98571916c671594b824f", "head": { "contentType": "chiasm", "title": "about fools", "ScriptureRange": "Proverbs 26:4-12", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 10, 26, "18:03:51.151Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 8, 1, "23:50:26.441Z"] }, "body": { "concepts": [{ "content": "his folly (4)", "isHead": true, "embeddedType": "panel" }, { "content": "wise in his own eyes (5)", "embeddedType": "panel" }, { "content": "violence (6a)", "isHead": true, "embeddedType": "panel" }, { "content": "who sends a message by the hand of a fool (6b)", "embeddedType": "panel" }, { "content": "so is a proverb in the mouth of fools (7)" }, { "content": "so is he who gives honour to a fool (8)" }, { "content": "so is a proverb in the mouth of fools (9)" }, { "content": "wounds everyone (10a)", "isHead": true, "embeddedType": "panel" }, { "content": "who hires a fool (10b)", "embeddedType": "panel" }, { "content": "his folly (11)", "isHead": true, "embeddedType": "panel" }, { "content": "wise in his own eyes (12)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2013-10-28T09:59:02.497Z:ol", "key": ["kyk:2013-10-28T09:59:02.497Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-10-28T09:59:02.497Z:ol", "_rev": "2-002b222487997a36d3d07cf416034bec", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:2-3", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 10, 28, "09:59:02.497Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:16:08.489Z"] }, "body": { "concepts": [{ "content": "who will prepare Your way (2b)" }, { "content": "the voice of someone shouting (3a)" }, { "content": "in the desert (3b)" }, { "content": "get the way ready for the Lord, make His paths straight (3c)" }] } } },
        { "id": "kyk:2013-10-28T10:13:06.708Z:ol", "key": ["kyk:2013-10-28T10:13:06.708Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-10-28T10:13:06.708Z:ol", "_rev": "2-aacfd56b7bff851e1d25ae8c13fdf65c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:3-4", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 10, 28, "10:13:06.708Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:15:50.175Z"] }, "body": { "concepts": [{ "content": "the voice of someone shouting [embedded] (3a)", "embeddedOutlineId": "kyk:2013-10-28T09:59:02.497Z:ol" }, { "content": "in the desert (3b)" }, { "content": "John appeared, baptizing (4a)" }, { "content": "in the desert (4b)" }, { "content": "and proclaiming (4c)" }] } } },
        { "id": "kyk:2013-10-28T11:14:15.717Z:ol", "key": ["kyk:2013-10-28T11:14:15.717Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-10-28T11:14:15.717Z:ol", "_rev": "2-9b74351afbb899ca5abc6b0e08616c9d", "head": { "contentType": "chiasm", "title": "Witness of John", "ScriptureRange": "Mark 1:1-8", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 10, 28, "11:14:15.717Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:15:30.828Z"] }, "body": { "concepts": [{ "content": "just as it stands written in Isaiah the prophet, \"Behold, I send my messenger before Your face\" (2a)" }, { "content": "John appeared, baptizing [embedded] (4a)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-10-28T10:13:06.708Z:ol" }, { "content": "and proclaiming (4c)", "embeddedType": "panel" }, { "content": "a baptism of repentance for the forgiveness of sins (4d)" }, { "content": "the whole Judean countryside and all the people of Jerusalem were going out to him (5a)" }, { "content": "and they were being baptized by him in the Jordan River, confessing their sins (5b)" }, { "content": "John wore clothes made of camel's hair and a leather belt around his waist and ate locusts and wild honey (6)", "isHead": true, "embeddedType": "panel" }, { "content": "and proclaiming (7a)", "embeddedType": "panel" }, { "content": "the One stronger than me is coming after me, I'm not even worthy to stoop down (like a slave) and untie the straps of his sandals. ... Jesus came from Nazareth of Galilee. [embedded] (7b-9)" }] } } },
        { "id": "kyk:2013-11-05T05:11:46.743Z:ol", "key": ["kyk:2013-11-05T05:11:46.743Z:ol", "panel: unspecified author"], "value": { "_id": "kyk:2013-11-05T05:11:46.743Z:ol", "_rev": "2-a8b3a73247e8dc0c205bde9d59ff9e21", "head": { "contentType": "panel", "title": "disciples' place in the Kingdom--suffering and slavery", "ScriptureRange": "Mark 10:35-45", "contentParams": { "repeat": 0 }, "submissionTimestamp": [2013, 11, 5, "05:11:46.743Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 11, 5, "05:13:43.229Z"] }, "body": { "concepts": [{ "content": "the cup & baptism of suffering [embedded] (35-41)", "embeddedOutlineId": "kyk:2013-09-02T08:14:15.868Z:ol" }, { "content": "slave of all [embedded] (42-45)", "embeddedOutlineId": "kyk:2013-09-02T08:15:27.326Z:ol" }] } } },
        { "id": "kyk:2013-11-05T05:42:30.968Z:ol", "key": ["kyk:2013-11-05T05:42:30.968Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-05T05:42:30.968Z:ol", "_rev": "2-f3d88d2e88de48f233d2083321020598", "head": { "contentType": "chiasm", "title": "unbelief of those who should see", "ScriptureRange": "Mark 6:1-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 5, "05:42:30.968Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:15:03.158Z"] }, "body": { "concepts": [{ "content": "He comes home to teach (1-2a)" }, { "content": "they are amazed at His wisdom (2b)" }, { "content": "and His miracles (2c)" }, { "content": "\"isn't this the carpenter, the son of Mary, & brother of James, Joses, Judas, & Simon? Aren't His sisters here with us?\" (3a)" }, { "content": "they were stumbled because of Him (3b)" }, { "content": "Jesus said, \"a prophet is not without honor except in his home town (4a)" }, { "content": "and among His relatives & in His house.\" (4b)" }, { "content": "He could do no miracle except healing a few sick people (5)" }, { "content": "He is amazed at their unbelief (6a)" }, { "content": "He goes around teaching (6b)" }] } } },
        { "id": "kyk:2013-11-05T12:14:21.802Z:ol", "key": ["kyk:2013-11-05T12:14:21.802Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-05T12:14:21.802Z:ol", "_rev": "9-07e84b8cf183d21238bac79d1e914dd0", "head": { "contentType": "chiasm", "title": "Jesus was appointed Son of God in power! (Greek)", "ScriptureRange": "Romans 1:3c-4c", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 5, "12:14:21.802Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2015, 3, 12, "21:07:28.137Z"] }, "body": { "concepts": [{ "content": "ἐκ σπέρματος Δαυεὶδ [source: from seed of David] (3c)" }, { "content": "κατὰ σάρκα [reference: with regard to flesh[=as a human]] (3d)" }, { "content": "τοῦ ὁρισθέντος υἱοῦ θεοῦ ἐν δυνάμει [who was appointed (by God as the) Son of God in (a new and) power(ful role)] (4a)" }, { "content": "κατὰ πνεῦμα ἁγιωσύνης [reference: with regard to (the Holy) Spirit of[=who produces] holiness[=purifies (us)] (4b)" }, { "content": "ἐξ ἀναστάσεως νεκρῶν [time: from when (he) was raised (by God) from (the) dead; OR means: by (his) resurrection from (the) dead] (4c)" }] } } },
        { "id": "kyk:2013-11-05T13:39:21.779Z:ol", "key": ["kyk:2013-11-05T13:39:21.779Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-05T13:39:21.779Z:ol", "_rev": "3-3c28bfedd364a1af7efd04c0b4647937", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 5, "13:39:21.779Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 4, 22, "22:21:33.839Z"] }, "body": { "concepts": [] } } },
        { "id": "kyk:2013-11-06T05:38:55.706Z:ol", "key": ["kyk:2013-11-06T05:38:55.706Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T05:38:55.706Z:ol", "_rev": "2-b2d7acb783b6627747bab8823144b7f6", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 16:10b-11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "05:38:55.706Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:09:29.308Z"] }, "body": { "concepts": [{ "content": "Greet those who are of the household of Aristobulus. (10b)" }, { "content": "Greet Herodion, my fellow Jew (=kinsman). (11a)" }, { "content": "Greet those of the household of Narcissus, who are in the Lord. (11b)" }] } } },
        { "id": "kyk:2013-11-06T05:40:20.567Z:ol", "key": ["kyk:2013-11-06T05:40:20.567Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T05:40:20.567Z:ol", "_rev": "5-028557b19e852beedb943612eff1714f", "head": { "contentType": "chiasm", "title": "Greet all the fellow workers", "ScriptureRange": "Romans 16:4-16", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "05:40:20.567Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "05:37:06.916Z"] }, "body": { "concepts": [{ "content": "to whom not only do I give thanks, but also all the churches of the Gentiles; (4b)" }, { "content": "also greet the church that is in their house. (5a)" }, { "content": "Greet Epaenetus, my beloved, who is the first convert to Christ from Asia. (5b)" }, { "content": "Greet Mary, who has labored hard for you. (6)" }, { "content": "Greet Andronicus and Junias, my fellow Jews (=kinsmen) and my fellow prisoners, (7a)" }, { "content": "who are outstanding among the apostles, who also were in Christ before me. (7b)" }, { "content": "Greet Ampliatus, my beloved in the Lord. (8)" }, { "content": "Greet Urbanus, our fellow worker in Christ, (9a)" }, { "content": "and Stachys my beloved. (9b)" }, { "content": "Greet Apelles, the approved in Christ. (10a)" }, { "content": "Greet Herodion, my fellow Jew (=kinsman). [embedded] (11a)", "embeddedOutlineId": "kyk:2013-11-06T05:38:55.706Z:ol" }, { "content": "Greet Tryphaena and Tryphosa, laborers in the Lord. Greet Persis the beloved, who has labored hard in the Lord. (12)" }, { "content": "Greet Rufus, a choice man in the Lord, also his mother and mine. (13)" }, { "content": "Greet Asyncritus, Phlegon, Hermes, Patrobas, Hermas and the brothers and sisters with them. Greet Philologus and Julia, Nereus and his sister, and Olympas, and all the Lord's people who are with them. Greet one another with a holy kiss. (14-16a)" }, { "content": "All the churches of Christ greet you. (16b)" }] } } },
        { "id": "kyk:2013-11-06T06:58:49.158Z:ol", "key": ["kyk:2013-11-06T06:58:49.158Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T06:58:49.158Z:ol", "_rev": "3-39dc40c7515ae3782f36590f55752ce2", "head": { "contentType": "chiasm", "title": "People who greet you", "ScriptureRange": "Romans 16:21-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "06:58:49.158Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 16, "18:48:54.749Z"] }, "body": { "concepts": [{ "content": "The grace of our Lord Jesus be with you (20b)" }, { "content": "Timothy, my fellow worker, greets you; and so do Lucius, Jason, and Sosipater, my fellow Jews. (21)" }, { "content": "I, Tertius, the writer of this letter, greet you in the Lord. (22)" }, { "content": "My host Gaius, in whose house the church meets, greets you; Erastus, the city treasurer, and our brother Quartus greet you. (23)" }, { "content": "[[The grace of our Lord Jesus Christ be with you all, Amen.]] (24)" }] } } },
        { "id": "kyk:2013-11-06T07:41:50.969Z:ol", "key": ["kyk:2013-11-06T07:41:50.969Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T07:41:50.969Z:ol", "_rev": "7-f99e171622355a67a1ae20d71a6ce14d", "head": { "contentType": "chiasm", "title": "the greetings sandwich structure", "ScriptureRange": "Romans 16:3-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "07:41:50.969Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "18:29:55.364Z"] }, "body": { "concepts": [{ "content": "people you must greet [embedded] (3-16)", "embeddedOutlineId": "kyk:2014-09-15T17:43:41.333Z:ol" }, { "content": "Now I encourage you to watch out [embedded](17-20)", "embeddedOutlineId": "kyk:2014-09-15T18:26:26.827Z:ol" }, { "content": "people who greet you [embedded] (21-23)", "embeddedOutlineId": "kyk:2013-11-06T06:58:49.158Z:ol" }] } } },
        { "id": "kyk:2013-11-06T07:52:40.756Z:ol", "key": ["kyk:2013-11-06T07:52:40.756Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T07:52:40.756Z:ol", "_rev": "4-0df9747f3a91184a47222287a30499d1", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "07:52:40.756Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "15:04:33.538Z"] }, "body": { "concepts": [] } } },
        { "id": "kyk:2013-11-06T12:22:44.461Z:ol", "key": ["kyk:2013-11-06T12:22:44.461Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T12:22:44.461Z:ol", "_rev": "12-a0407b392f3baa44ee1bfe5e8886e89d", "head": { "contentType": "chiasm", "title": "Paul and the gospel (Greek)", "ScriptureRange": "Romans 1:1-7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "12:22:44.461Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2015, 3, 12, "20:38:19.346Z"] }, "body": { "concepts": [{ "content": "Παῦλος δοῦλος Χριστοῦ Ἰησοῦ, κλητὸς ἀπόστολος [(From) Paul, a slave of Christ[=Messiah] Jesus, a called (by Jesus/God) apostle,] (1a)" }, { "content": "ἀφωρισμένος [set apart] (1b)" }, { "content": "εἰς εὐαγγέλιον θεοῦ [for[=purpose] (of proclaiming) the good message of[=source:from] God] (1c)" }, { "content": "ὃ προεπηγγείλατο διὰ τῶν προφητῶν αὐτοῦ ἐν γραφαῖς ἁγίαις [which He/God promised beforehand through[=means] His prophets in the writings[=OT] (which are) holy] (2)" }, { "content": "περὶ τοῦ υἱοῦ αὐτοῦ [concerning His Son] (3a)" }, { "content": "τοῦ γενομένου [He came into being [=was born]] (3b)" }, { "content": "τοῦ ὁρισθέντος υἱοῦ θεοῦ ἐν δυνάμει [He was appointed the Son of God in power] [embedded] (4a)", "embeddedOutlineId": "kyk:2013-11-05T12:14:21.802Z:ol" }, { "content": "Ἰησοῦ Χριστοῦ τοῦ κυρίου ἡμῶν [Jesus Christ[=Messiah] our Lord[=one & only true God, Tetragrammaton in LXX]] (4d)" }, { "content": "διʼ οὗ ἐλάβομεν χάριν καὶ ἀποστολὴν [through whom[=Jesus] we received grace and apostleship] (5a)" }, { "content": "εἰς ὑπακοὴν πίστεως [to bring about[=purpose] the obedience of[=produced by] faith] (5b)" }, { "content": "ὑπὲρ τοῦ ὀνόματος αὐτοῦ [for the sake of His reputation[=name/fame]] [embedded] (5d)", "embeddedOutlineId": "kyk:2013-11-06T12:38:17.608Z:ol" }, { "content": "πᾶσιν τοῖς οὖσιν ἐν Ῥώμῃ ἀγαπητοῖς θεοῦ, [To all those who are in Rome who are loved by God,] [embedded] (6b-7b)", "embeddedOutlineId": "kyk:2013-11-06T13:13:48.092Z:ol" }] } } },
        { "id": "kyk:2013-11-06T12:38:17.608Z:ol", "key": ["kyk:2013-11-06T12:38:17.608Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T12:38:17.608Z:ol", "_rev": "5-76fe6b5dbf14664d885e8df7514db08f", "head": { "contentType": "chiasm", "title": "for the sake of His reputation", "ScriptureRange": "Romans 1:5c-6a", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "12:38:17.608Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "05:30:26.889Z"] }, "body": { "concepts": [{ "content": "ἐν πᾶσιν τοῖς ἔθνεσιν [among all the nations/non-Jews] (5c)" }, { "content": "ὑπὲρ τοῦ ὀνόματος αὐτοῦ [for the sake of His reputation[=name/fame]] (5d)" }, { "content": "ἐν οἷς ἐστε καὶ ὑμεῖς [among whom you also are] (6a)" }] } } },
        { "id": "kyk:2013-11-06T13:13:48.092Z:ol", "key": ["kyk:2013-11-06T13:13:48.092Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-06T13:13:48.092Z:ol", "_rev": "6-14f221c93288e50d3cc5f5492ec81d54", "head": { "contentType": "chiasm", "title": "the recipients in Rome", "ScriptureRange": "Romans 1:6b-7b", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 6, "13:13:48.092Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 10, 15, "14:27:34.595Z"] }, "body": { "concepts": [{ "content": "κλητοὶ Ἰησοῦ Χριστοῦ [ones called by[=subj.gen.] Jesus Christ[=Messiah]] (6b)" }, { "content": "πᾶσιν τοῖς οὖσιν ἐν Ῥώμῃ ἀγαπητοῖς θεοῦ [To all those who are in Rome who are loved by[=subj.gen.] God] (7a)" }, { "content": "κλητοῖς ἁγίοις [(his) holy people (because he) called (you)] (7b)" }] } } },
        { "id": "kyk:2013-11-08T07:01:04.458Z:ol", "key": ["kyk:2013-11-08T07:01:04.458Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-08T07:01:04.458Z:ol", "_rev": "2-7e5cca384c48ad504a11b64e8ef27456", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 10:47-48", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 8, "07:01:04.458Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:14:40.579Z"] }, "body": { "concepts": [{ "content": "he began to shout, \"Son of David, Jesus, have mercy on me!\" (47)" }, { "content": "many were rebuking him so that he should be silent (48a)" }, { "content": "but he was shouting all the more, \"Son of David, have mercy on me!\" (48b)" }] } } },
        { "id": "kyk:2013-11-08T07:03:54.144Z:ol", "key": ["kyk:2013-11-08T07:03:54.144Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-08T07:03:54.144Z:ol", "_rev": "2-d464d7680a67d690df7cf20140d1e812", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 10:49-50", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 8, "07:03:54.144Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:14:18.795Z"] }, "body": { "concepts": [{ "content": "\"get up, (49d)" }, { "content": "He is calling you.\" (49e)" }, { "content": "he threw off his cloak, jumped up, (50a)" }] } } },
        { "id": "kyk:2013-11-08T07:12:22.680Z:ol", "key": ["kyk:2013-11-08T07:12:22.680Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-11-08T07:12:22.680Z:ol", "_rev": "2-e0d27900ce188837834865bf4d5d7ff9", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 10:51-52", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 11, 8, "07:12:22.680Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 1, 1, "07:13:52.126Z"] }, "body": { "concepts": [{ "content": "the blind man said to Him, \"Master, to be able to see.\" (51b)" }, { "content": "Jesus said to him, \"your faith has healed(lit.saved) you.\" (52a)" }, { "content": "immediately he regained his sight (52b)" }] } } },
        { "id": "kyk:2013-12-26T11:12:41.582Z:ol", "key": ["kyk:2013-12-26T11:12:41.582Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-26T11:12:41.582Z:ol", "_rev": "1-8b1501c41ac2307691612969e61ce5c7", "head": { "contentType": "chiasm", "title": "flesh and Spirit", "ScriptureRange": "Galatians 5:15-26", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 26, "11:12:41.582Z"] }, "body": { "concepts": [{ "content": "Now if you keep biting and devouring one another, watch out lest you be destroyed by one another. (15)" }, { "content": "But I say, keep walking by the Spirit (16a)" }, { "content": "and you will never fulfill the lust of the flesh. For the flesh lusts against the Spirit and the Spirit against the flesh. For these keep opposing each other so that you cannot keep doing what you want. (16b-17)" }, { "content": "But if you are led by the Spirit, you are not under the Law. (18)" }, { "content": "Now the works of the flesh are quite plain. These are (19a)", "isHead": true, "embeddedType": "panel" }, { "content": "sexual immorality, impurity, sensuality (19b)", "embeddedType": "panel" }, { "content": "idolatry, sorcery (20a)", "embeddedType": "panel" }, { "content": "enmities, strife, jealousy, rage, selfish ambition, dissensions, causing divisions, envyings (20b-21a)", "embeddedType": "panel" }, { "content": "drunkenness, orgies & things like these (21b)", "embeddedType": "panel" }, { "content": "I forewarn you that those who keep on practicing such things will not inherit the kingdom of God. (21c)" }, { "content": "But the fruit of the Spirit is (22a)", "isHead": true, "embeddedType": "panel" }, { "content": "love (22b)", "embeddedType": "panel" }, { "content": "joy, peace (22c)", "embeddedType": "panel" }, { "content": "patience, kindness, goodness, faithfulness, gentleness (22d-23a)", "embeddedType": "panel" }, { "content": "self-control (23b)", "embeddedType": "panel" }, { "content": "against such things there is no law. (23c)" }, { "content": "Now those who belong to Christ have crucified the flesh with its passions and lusts. (24)" }, { "content": "If we keep living by the Spirit, let us keep in step with the Spirit. (25)" }, { "content": "We must not become conceited, provoking one another, envying one another. (26)" }] } } },
        { "id": "kyk:2013-12-26T14:18:00.480Z:ol", "key": ["kyk:2013-12-26T14:18:00.480Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-26T14:18:00.480Z:ol", "_rev": "1-e57e34e628b09223bb16b99d44d2eb32", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Galatians 3:24-25", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 26, "14:18:00.480Z"] }, "body": { "concepts": [{ "content": "The Law stood as our guardian (to lead us) to Christ, (24a)" }, { "content": "so that by faith (24b)" }, { "content": "we might be made right (with God). (24c)" }, { "content": "Now that faith has come (25a)" }, { "content": "we are no longer under a guardian. (25b)" }] } } },
        { "id": "kyk:2013-12-26T14:22:39.747Z:ol", "key": ["kyk:2013-12-26T14:22:39.747Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-26T14:22:39.747Z:ol", "_rev": "1-d93be20acc10d917f5a45ed8b3e11fd6", "head": { "contentType": "chiasm", "title": "All in Christ are one", "ScriptureRange": "Galatians 3:26-29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 26, "14:22:39.747Z"] }, "body": { "concepts": [{ "content": "You are all sons of God through faith (26a)" }, { "content": "in Messiah Jesus; (26b)" }, { "content": "for as many as were baptized into (union with) Christ, have clothed yourselves with Christ (27)" }, { "content": "There is no longer Jew or Gentile, slave or free, male or female; (28a)" }, { "content": "for you are all one (28b)" }, { "content": "in Messiah Jesus. (28c)" }, { "content": "And if you belong to Christ, then you are descendants of Abraham (29a)" }] } } },
        { "id": "kyk:2013-12-26T14:29:53.139Z:ol", "key": ["kyk:2013-12-26T14:29:53.139Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-26T14:29:53.139Z:ol", "_rev": "1-70194ddd73c083d822e38c1bcf065f91", "head": { "contentType": "chiasm", "title": "Redeemed!", "ScriptureRange": "Galatians 3:29-4:7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 26, "14:29:53.139Z"] }, "body": { "concepts": [{ "content": "heirs according to promise ... the heir (3:29-4:1a)" }, { "content": "children (1b, 3a)" }, { "content": "slaves under guardians, stewards, & elemental spirits (1c-2a, 3b)" }, { "content": "until the appointed time (2b, 4a)" }, { "content": "God sent forth his Son (4b)" }, { "content": "born of a woman (4c)" }, { "content": "born under the Law (4d)" }, { "content": "so that he might redeem those under the Law (5a)" }, { "content": "so that we might receive sonship. Now because you are sons (5b-6a)" }, { "content": "God sent forth the Spirit of his Son into our hearts crying \"Abba Father\" (6b)" }, { "content": "no longer (7a)" }, { "content": "are you a slave (7b)" }, { "content": "but a son; and if a son (7c)" }, { "content": "also an heir through God (7d)" }] } } },
        { "id": "kyk:2013-12-26T14:32:44.695Z:ol", "key": ["kyk:2013-12-26T14:32:44.695Z:ol", "panel: tleper"], "value": { "_id": "kyk:2013-12-26T14:32:44.695Z:ol", "_rev": "1-66039e0371eb2aaf504d2a78b059b1dc", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Galatians 4:1b-4a", "contentParams": { "repeat": 3 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 26, "14:32:44.695Z"] }, "body": { "concepts": [{ "content": "he is a child (1b)" }, { "content": "he is no different from a slave, although he is master of all, but he is under guardians and stewards (1c-2a)" }, { "content": "until the time set by his father. (2b)" }, { "content": "It was the same way with us. When we were children (3a)" }, { "content": "we were enslaved under the elemental spirits of the universe; (3b)" }, { "content": "But when the fulness of time came (4a)" }] } } },
        { "id": "kyk:2013-12-29T09:27:11.475Z:ol", "key": ["kyk:2013-12-29T09:27:11.475Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-29T09:27:11.475Z:ol", "_rev": "1-ba714764480dfeea4ccbb6be7bb71762", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 29, "09:27:11.475Z"] }, "body": { "concepts": [{ "content": "ascribe to the Lord, O sons of the mighty (1a)" }, { "content": "ascribe to the Lord ... strength (1b)" }, { "content": "ascribe to the Lord the glory due His name ... (2)" }, { "content": "the voice of the Lord is upon the waters ... the Lord is over many waters (3)" }, { "content": "the voice of the Lord is powerful, the voice of the Lord is majestic (4)" }, { "content": "the voice of the Lord breaks the cedars; yes, the Lord breaks the cedars of Lebanon. (5)" }, { "content": "and He makes Lebanon skip like a calf and Sirion like a young wild ox. (6)" }, { "content": "the voice of the Lord hews out flames of fire. the voice of the Lord shakes the wilderness (7-8a)" }, { "content": "the Lord shakes the wilderness of Kadesh (8b)" }, { "content": "the voice of the Lord makes the deer to calve (9a)" }, { "content": "and strips the forests bare (9b)" }, { "content": "and in His temple everything says, \"Glory!\" (9c)" }, { "content": "the Lord sat at the flood (10a)" }, { "content": "the Lord sits as King forever (10b)" }, { "content": "the Lord will give strength (11a)" }, { "content": "the Lord will bless His people ... (11b)" }] } } },
        { "id": "kyk:2013-12-30T09:12:34.408Z:ol", "key": ["kyk:2013-12-30T09:12:34.408Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-30T09:12:34.408Z:ol", "_rev": "6-2873f3ecb5f98ed94c27aceb1f85a941", "head": { "contentType": "chiasm", "title": "I, Paul (part 1)", "ScriptureRange": "Philemon 1:9-10", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 30, "09:12:34.408Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 12, 31, "02:32:09.473Z"] }, "body": { "concepts": [{ "content": "yet I prefer to appeal to you on the basis of love. (9a)" }, { "content": "It is as none other than Paul—an old man and now also a prisoner of Christ Jesus (9b)" }, { "content": "that I appeal to you (10a)" }] } } },
        { "id": "kyk:2013-12-31T01:08:11.042Z:ol", "key": ["kyk:2013-12-31T01:08:11.042Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T01:08:11.042Z:ol", "_rev": "2-a95db48a9619861303146e329b8ff42f", "head": { "contentType": "chiasm", "title": "Paul's prayers", "ScriptureRange": "Philemon 1:4-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "01:08:11.042Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 12, 31, "02:04:49.345Z"] }, "body": { "concepts": [{ "content": "I always thank my God as I remember you in my prayers, (4)" }, { "content": "because I hear about your love (5a)" }, { "content": "and your faith (5b)" }, { "content": "which you have toward the Lord Jesus (5c)" }, { "content": "for all his holy people. (5d)" }, { "content": "(I pray) that your partnership with us in the faith may be effective in deepening your understanding of every good thing we share for the sake of Christ. (6)" }] } } },
        { "id": "kyk:2013-12-31T02:07:27.619Z:ol", "key": ["kyk:2013-12-31T02:07:27.619Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T02:07:27.619Z:ol", "_rev": "1-c2ede7a314373d00e55bedef7e241e19", "head": { "contentType": "chiasm", "title": "my child Onesimus", "ScriptureRange": "Philemon 1:10", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "02:07:27.619Z"] }, "body": { "concepts": [{ "content": "for my child (10b)" }, { "content": "whom I gave birth to (while I was) in chains. (10c)" }, { "content": "Onesimus (10d)" }] } } },
        { "id": "kyk:2013-12-31T02:08:24.172Z:ol", "key": ["kyk:2013-12-31T02:08:24.172Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T02:08:24.172Z:ol", "_rev": "1-6361fbfb2de2ba9953179769ae082efe", "head": { "contentType": "chiasm", "title": "Philemon's goodness", "ScriptureRange": "Philemon 1:14", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "02:08:24.172Z"] }, "body": { "concepts": [{ "content": "so that not as forced (14b)" }, { "content": "your goodness would be (14c)" }, { "content": "but voluntary. (14d)" }] } } },
        { "id": "kyk:2013-12-31T02:09:30.887Z:ol", "key": ["kyk:2013-12-31T02:09:30.887Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T02:09:30.887Z:ol", "_rev": "1-dfa4b821a1a9637a85667f57c025bd5f", "head": { "contentType": "chiasm", "title": "the usefulness of Onesimus", "ScriptureRange": "Philemon 1:16-17", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "02:09:30.887Z"] }, "body": { "concepts": [{ "content": "no longer as a slave, (16a)" }, { "content": "but better than a slave, as a dear brother. (16b)" }, { "content": "He is very dear to me but even dearer to you, both as a fellow man and as a brother in the Lord. (16c)" }, { "content": "So if you consider me a partner, (17a)" }, { "content": "welcome him as you would welcome me. (17b)" }] } } },
        { "id": "kyk:2013-12-31T02:10:25.661Z:ol", "key": ["kyk:2013-12-31T02:10:25.661Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T02:10:25.661Z:ol", "_rev": "2-ac75a719ac43daa98e9be65f8c89a0be", "head": { "contentType": "chiasm", "title": "I, Paul (part 2)", "ScriptureRange": "Philemon 1:18-19", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "02:10:25.661Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 12, 31, "02:31:44.548Z"] }, "body": { "concepts": [{ "content": "charge it to me. (18b)" }, { "content": "I, Paul, am writing this with my own hand. (19a)" }, { "content": "I will pay it back (19b)" }] } } },
        { "id": "kyk:2013-12-31T02:11:30.389Z:ol", "key": ["kyk:2013-12-31T02:11:30.389Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T02:11:30.389Z:ol", "_rev": "1-1533c2033252675809b16bbfb5e98079", "head": { "contentType": "chiasm", "title": "Philemon's prayers", "ScriptureRange": "Philemon 1:22", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "02:11:30.389Z"] }, "body": { "concepts": [{ "content": "And one thing more: Prepare a guest room for me, (22a)" }, { "content": "because I hope in answer to your prayers (22b)" }, { "content": "to be restored to you (22c)" }] } } },
        { "id": "kyk:2013-12-31T02:34:07.424Z:ol", "key": ["kyk:2013-12-31T02:34:07.424Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2013-12-31T02:34:07.424Z:ol", "_rev": "2-8218ecfb2fa4d5e59ae9e79105b93c6f", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Philemon 1:1-25", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2013, 12, 31, "02:34:07.424Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2013, 12, 31, "02:40:03.875Z"] }, "body": { "concepts": [{ "content": "Paul, a prisoner of Christ Jesus, and Timothy our brother, (1a)", "isHead": true, "embeddedType": "panel" }, { "content": "To Philemon our dear friend and fellow worker and to Apphia our sister and Archippus our fellow soldier—and to the church that meets in your home: (1b-2)", "embeddedType": "panel" }, { "content": "Grace and peace to you from God our Father and the Lord Jesus Christ. (3)", "embeddedType": "panel" }, { "content": "Paul's prayers [embedded] (4-6)", "embeddedOutlineId": "kyk:2013-12-31T01:08:11.042Z:ol" }, { "content": "Your love has given me great joy and encouragement, (7a)", "isHead": true, "embeddedType": "panel" }, { "content": "because you, brother, have refreshed the hearts of the Lord’s people. (7b)", "embeddedType": "panel" }, { "content": "Therefore, although in Christ I could be bold and order you to do what you ought to do, (8)", "embeddedType": "panel" }, { "content": "I, Paul (part one) [embedded] (9-10)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-12-30T09:12:34.408Z:ol" }, { "content": "my child Onesimus [embedded] (10)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-12-31T02:07:27.619Z:ol" }, { "content": "Formerly he was useless to you, (11a)" }, { "content": "but now he has become useful both to you and to me. (11b)" }, { "content": "I am sending him—who is my very heart—back to you. (12)" }, { "content": "I would have liked to keep him with me (13a)", "isHead": true, "embeddedType": "panel" }, { "content": "so that he could take your place in helping me while I am in chains for the gospel. (13b)", "embeddedType": "panel" }, { "content": "But I did not want to do anything without your consent, (14a)", "isHead": true, "embeddedType": "panel" }, { "content": "Philemon's goodness [embedded] (14)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-12-31T02:08:24.172Z:ol" }, { "content": "Perhaps the reason he was separated from you for a little while was that you might have him back forever (15)" }, { "content": "the usefulness of Onesimus [embedded] 16-17", "embeddedOutlineId": "kyk:2013-12-31T02:09:30.887Z:ol" }, { "content": "If he has done you any wrong or owes you anything, (18a)" }, { "content": "I, Paul (part two) [embedded] (18-19)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2013-12-31T02:10:25.661Z:ol" }, { "content": "not to mention that you owe me your very self. (19c)", "embeddedType": "panel" }, { "content": "I do wish, brother, that I may have some benefit from you in the Lord; (20a)", "isHead": true, "embeddedType": "panel" }, { "content": "refresh my heart in Christ. (20b)", "embeddedType": "panel" }, { "content": "Confident of your obedience, I write to you, knowing that you will do even more than I ask. (21)", "embeddedType": "panel" }, { "content": "Philemon's prayers [embedded] (22)", "embeddedOutlineId": "kyk:2013-12-31T02:11:30.389Z:ol" }, { "content": "Epaphras, my fellow prisoner in Christ Jesus, sends you greetings (23)", "isHead": true, "embeddedType": "panel" }, { "content": "(And so do) Mark, Aristarchus, Demas and Luke, my fellow workers. (24)", "embeddedType": "panel" }, { "content": "The grace of the Lord Jesus Christ be with your spirit. (25)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-01-01T07:43:18.157Z:ol", "key": ["kyk:2014-01-01T07:43:18.157Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-01-01T07:43:18.157Z:ol", "_rev": "2-513aa92c15d9eabab848afbdd2820ce2", "head": { "contentType": "panel", "title": "\"Who do you say I am?\"", "ScriptureRange": "Mark 8:27-30", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 1, "07:43:18.157Z"], "modifiedTimestamp": [2014, 1, 1, "07:44:42.254Z"], "source": { "details": "", "website": "", "guid": "" } }, "body": { "concepts": [{ "content": "setting (8:27a)" }, { "content": "\"who do people say I am?\" (8:27b)" }, { "content": "partial insight (8:28)" }, { "content": "\"who do you say I am?\" (8:29)" }, { "content": "warning not to tell (8:30)" }] } } },
        { "id": "kyk:2014-01-01T07:46:17.094Z:ol", "key": ["kyk:2014-01-01T07:46:17.094Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-01-01T07:46:17.094Z:ol", "_rev": "1-6911a2a2f39b5bbb6a7243958184e136", "head": { "contentType": "panel", "title": "\"What do you see?\"", "ScriptureRange": "Mark 8:22-26", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 1, "07:46:17.094Z"] }, "body": { "concepts": [{ "content": "setting (8:22-23a)" }, { "content": "\"what do you see?\" (8:23b)" }, { "content": "partial sight (8:24)" }, { "content": "see clearly (8:25)" }, { "content": "warning not to tell (8:26)" }] } } },
        { "id": "kyk:2014-01-02T13:48:50.475Z:ol", "key": ["kyk:2014-01-02T13:48:50.475Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-02T13:48:50.475Z:ol", "_rev": "2-45c91cdb6a17fb1ced44804a941ecde8", "head": { "contentType": "chiasm", "title": "serving God", "ScriptureRange": "Romans 1:8-10", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 2, "13:48:50.475Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "06:38:50.403Z"] }, "body": { "concepts": [{ "content": "(Of) first (importance), I thank my God (8a)" }, { "content": "through Jesus Christ (8b)", "isHead": true, "embeddedType": "panel" }, { "content": "for you all, (8c)", "embeddedType": "panel" }, { "content": "because (the news of) your faith is being proclaimed in the whole world [κόσμῳ]. (8d)" }, { "content": "For God is my witness (9a)" }, { "content": "whom I serve in my spirit (9b)" }, { "content": "in (the proclamation of) the gospel (9c)" }, { "content": "of his Son, (9d)", "isHead": true, "embeddedType": "panel" }, { "content": "how unceasingly I make mention of you (9e)", "embeddedType": "panel" }, { "content": "always in my prayers, asking (10a)" }] } } },
        { "id": "kyk:2014-01-02T13:58:55.302Z:ol", "key": ["kyk:2014-01-02T13:58:55.302Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-02T13:58:55.302Z:ol", "_rev": "3-97823a02281114ab599204f228275e02", "head": { "contentType": "chiasm", "title": "Belly slaves", "ScriptureRange": "Romans 16:17-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 2, "13:58:55.302Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 4, 22, "21:55:29.189Z"] }, "body": { "concepts": [{ "content": "contrary to the teaching which you learned [embedded] (17)", "embeddedOutlineId": "kyk:2014-01-02T14:06:03.397Z:ol" }, { "content": "such men do not serve our Lord Christ (18a)" }, { "content": "but their own belly (18b)" }, { "content": "through smooth talk and flattery they deceive the hearts of naive people (18c)" }] } } },
        { "id": "kyk:2014-01-02T14:06:03.397Z:ol", "key": ["kyk:2014-01-02T14:06:03.397Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-02T14:06:03.397Z:ol", "_rev": "4-5e276e137fb67785a166a842ef518eef", "head": { "contentType": "chiasm", "title": "division-makers and stumble-blockers are contrary to what you were taught!", "ScriptureRange": "Romans 16:17", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 2, "14:06:03.397Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "14:57:24.943Z"] }, "body": { "concepts": [{ "content": "to keep watching out for (17b)" }, { "content": "those who divisions and stumbling blocks (17c)" }, { "content": "contrary to the teaching which you learned (17d)" }, { "content": "keep making (17e)" }, { "content": "and keep turning away from them. (17f)" }] } } },
        { "id": "kyk:2014-01-02T14:23:39.609Z:ol", "key": ["kyk:2014-01-02T14:23:39.609Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-02T14:23:39.609Z:ol", "_rev": "3-685648a86f0f9b9f6a051341187011de", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 2, "14:23:39.609Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "15:06:18.267Z"] }, "body": { "concepts": [] } } },
        { "id": "kyk:2014-01-02T18:10:20.216Z:ol", "key": ["kyk:2014-01-02T18:10:20.216Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-02T18:10:20.216Z:ol", "_rev": "4-b01bc96910126e6606d402ec6f7676a2", "head": { "contentType": "chiasm", "title": "mutual encouragement", "ScriptureRange": "Romans 1:10-13", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 2, "18:10:20.216Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 25, "04:28:57.315Z"] }, "body": { "concepts": [{ "content": "if somehow now at last (10b)" }, { "content": "I may succeed (10c)" }, { "content": "by the will of God (10d)", "isHead": true, "embeddedType": "panel" }, { "content": "to come to you. (10e)", "embeddedType": "panel" }, { "content": "For I long to see you, (11a)" }, { "content": "that I may impart some spiritual gift to you in order that you may be established, (11b)" }, { "content": "that is (that we may) be mutually encouraged by our trust in one another, both your (trust in me) and mine (in you) (12)" }, { "content": "Now I do not want you to be ignorant, brothers, (13a)" }, { "content": "that often I have planned (13b)", "isHead": true, "embeddedType": "panel" }, { "content": "to come to you (13b)", "embeddedType": "panel" }, { "content": "and have been prevented (13d)" }, { "content": "until now (13e)" }] } } },
        { "id": "kyk:2014-01-04T15:06:31.584Z:ol", "key": ["kyk:2014-01-04T15:06:31.584Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-04T15:06:31.584Z:ol", "_rev": "1-bd0000e4ec0ccdf56e7ea6d47bd6cfd5", "head": { "contentType": "chiasm", "title": "Grief Relief", "ScriptureRange": "Psalm 119:25-32", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 4, "15:06:31.584Z"] }, "body": { "concepts": [{ "content": "My soul cleaves to the dust (25a)", "isHead": true, "embeddedType": "panel" }, { "content": "Revive me according to Your word. (25b)", "embeddedType": "panel" }, { "content": "I have told of my ways, and You have answered me; (26a)", "isHead": true, "embeddedType": "panel" }, { "content": "teach me Your statutes. (26b)", "embeddedType": "panel" }, { "content": "Make me understand the way of Your precepts, (27a)", "embeddedType": "panel" }, { "content": "so I will meditate on Your wonders. (27b)", "embeddedType": "panel" }, { "content": "My soul weeps because of grief; strengthen me according to Your word. (28)" }, { "content": "Remove the false way from me, (29a)", "isHead": true, "embeddedType": "panel" }, { "content": "and graciously grant me Your law. (29b)", "embeddedType": "panel" }, { "content": "I have chosen the faithful way; (30a)", "embeddedType": "panel" }, { "content": "I have placed Your ordinances before me. (30b)", "embeddedType": "panel" }, { "content": "I cling to Your testimonies; O Lord, do not put me to shame! (31)", "isHead": true, "embeddedType": "panel" }, { "content": "I shall run the way of Your commandments, for You will enlarge my heart. (32)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-01-13T05:24:22.392Z:ol", "key": ["kyk:2014-01-13T05:24:22.392Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-01-13T05:24:22.392Z:ol", "_rev": "1-65bd6df64f4145e6a95662f2049cbe7d", "head": { "contentType": "chiasm", "title": "Restrained ... taught ... & loving it!", "ScriptureRange": "Psalm 119:97-104", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 1, 13, "05:24:22.392Z"] }, "body": { "concepts": [{ "content": "O how I love Thy law! It is my meditation all the day (97)" }, { "content": "Thy commandments make me wiser than my enemies ... I have more insight than all my teachers (98-99a)", "isHead": true, "embeddedType": "panel" }, { "content": "Thy testimonies are my meditation (99b)", "embeddedType": "panel" }, { "content": "I understand more than the aged, (100a)", "embeddedType": "panel" }, { "content": "because I have observed Thy precepts. (100b)", "isHead": true, "embeddedType": "panel" }, { "content": "I have restrained my feet from every evil way, (101a)", "embeddedType": "panel" }, { "content": "that I may keep Thy word. (101b)", "isHead": true, "embeddedType": "panel" }, { "content": "I have not turned aside from Thine ordinances, (102a)", "embeddedType": "panel" }, { "content": "for Thou Thyself hast taught me. (102b)", "isHead": true, "embeddedType": "panel" }, { "content": "How sweet are Thy words to my taste (sweeter) than honey to my mouth! (103)", "embeddedType": "panel" }, { "content": "From Thy precepts I get understanding, (104a)", "embeddedType": "panel" }, { "content": "therefore I hate every false way. (104b)" }] } } },
        { "id": "kyk:2014-02-15T01:48:00.215Z:ol", "key": ["kyk:2014-02-15T01:48:00.215Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-02-15T01:48:00.215Z:ol", "_rev": "2-ae5f0d3dcea0dd031f31bec60dd4c213", "head": { "contentType": "chiasm", "title": "Hope Sustained", "ScriptureRange": "Psalm 119:113-120", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 2, 15, "01:48:00.215Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 2, 15, "01:52:57.693Z"] }, "body": { "concepts": [{ "content": "I hate double-minded people (113a)" }, { "content": "I love your law (113b)" }, { "content": "You are my hiding place & my shield (114a)" }, { "content": "I hope in your word (114b)" }, { "content": "Get out of my life (115a)", "isHead": true, "embeddedType": "panel" }, { "content": "you evil-minded people (115b)", "embeddedType": "panel" }, { "content": "so I can keep the commands of my God (115c)" }, { "content": "Sustain me as you promised (116a)", "isHead": true, "embeddedType": "panel" }, { "content": "that I may live (116b)", "embeddedType": "panel" }, { "content": "Do not let my hope be crushed (116c)" }, { "content": "Support me (117a)", "isHead": true, "embeddedType": "panel" }, { "content": "that I may be rescued (117b)", "embeddedType": "panel" }, { "content": "then I will continually meditate on your decrees (117c)" }, { "content": "You reject (118a)", "isHead": true, "embeddedType": "panel" }, { "content": "all who stray from your decrees (118b)", "embeddedType": "panel" }, { "content": "they are deceitful & false (118c)" }, { "content": "You skim off the wicked like scum (119a)" }, { "content": "I love your rules (119b)" }, { "content": "I tremble in fear of you; I fear your judgments (120)" }] } } },
        { "id": "kyk:2014-02-16T16:46:54.038Z:ol", "key": ["kyk:2014-02-16T16:46:54.038Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-02-16T16:46:54.038Z:ol", "_rev": "2-164dfef1a4198c0892b23a4d3c3d2215", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 3:5-7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 2, 16, "16:46:54.038Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 2, 16, "16:56:03.904Z"] }, "body": { "concepts": [{ "content": "all Jerusalem & all Judea & all the area near Jordan went out to him (5)" }, { "content": "they were being baptized by him in the Jordan River, as they confessed  their sins (6)" }, { "content": "he saw many of the Pharisees & Sadducees coming for baptism (7a)" }] } } },
        { "id": "kyk:2014-02-16T17:01:38.980Z:ol", "key": ["kyk:2014-02-16T17:01:38.980Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-02-16T17:01:38.980Z:ol", "_rev": "1-bac3f94ba62f5e993fc57414a3405f87", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 3:13-14", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 2, 16, "17:01:38.980Z"] }, "body": { "concepts": [{ "content": "Jesus comes to John (13a)" }, { "content": "to be baptized (13b)" }, { "content": "by him (13c)" }, { "content": "but John tried to prevent him saying, I have need (14a)" }, { "content": "by you (14b)" }, { "content": "to be baptized (14c)" }, { "content": "and [yet] you come to me? (14d)" }] } } },
        { "id": "kyk:2014-02-25T00:30:48.683Z:ol", "key": ["kyk:2014-02-25T00:30:48.683Z:ol", "chiasm: unspecified author"], "value": { "_id": "kyk:2014-02-25T00:30:48.683Z:ol", "_rev": "1-0fb83fd211271c0cf71ca5552875961d", "head": { "contentType": "chiasm", "title": "image of God", "ScriptureRange": "Genesis 1:27", "submissionTimestamp": [2014, 2, 24, "00:30:48.683Z"] }, "body": { "concepts": [{ "content": "So God created mankind " }, { "content": "in his own image," }, { "content": "in the image of God " }, { "content": "he created them;" }] } } },
        { "id": "kyk:2014-04-03T09:53:05.535Z:ol", "key": ["kyk:2014-04-03T09:53:05.535Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-04-03T09:53:05.535Z:ol", "_rev": "2-2b979fa5fe654b32509fba56df2bc74e", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 5:35-40", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 4, 3, "09:53:05.535Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 4, 3, "10:10:10.352Z"] }, "body": { "concepts": [{ "content": "they come saying daughter your died. why are you still bothering the teacher? (35)", "isHead": true, "embeddedType": "panel" }, { "content": "but Jesus says to the synagogue leader, don't be afraid, only believe. (36)", "embeddedType": "panel" }, { "content": "and he did not permit anyone to follow [along] with him except Peter and James and John the brother of James. (37)", "embeddedType": "panel" }, { "content": "and they come into the house of the synagogue leader, (38a)", "embeddedType": "panel" }, { "content": "and he sees a commotion (38b)", "isHead": true, "embeddedType": "panel" }, { "content": "and weeping (38c)", "embeddedType": "panel" }, { "content": "and wailing, loudly (38d)" }, { "content": "and having entered (39a)" }, { "content": "he says to them, (39b)" }, { "content": "why are you making a commotion (39c)", "isHead": true, "embeddedType": "panel" }, { "content": "and weeping? (39d)", "embeddedType": "panel" }, { "content": "the child not did die but is sleeping. (39e)", "isHead": true, "embeddedType": "panel" }, { "content": "and they were laughing at him. (40a)", "embeddedType": "panel" }, { "content": "but having put out everyone he takes the father of the child and the mother and the ones with him, (40b)", "embeddedType": "panel" }, { "content": "and goes into where was the child. (40c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-04-03T09:55:46.302Z:ol", "key": ["kyk:2014-04-03T09:55:46.302Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-04-03T09:55:46.302Z:ol", "_rev": "3-b68ad792c663777efdd2a379a60018de", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 5:30b-32", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 4, 3, "09:55:46.302Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 4, 3, "10:09:46.557Z"] }, "body": { "concepts": [{ "content": "having turned around in the crowd (30b)" }, { "content": "he was saying, who touched my garments? (30c)" }, { "content": "and his disciples were saying to him, you see the crowd pressing against you, (31a)" }, { "content": "and you say, who touched me? (31b)" }, { "content": "and he was looking around to see the one who had done this. (32)" }] } } },
        { "id": "kyk:2014-04-03T10:07:04.836Z:ol", "key": ["kyk:2014-04-03T10:07:04.836Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-04-03T10:07:04.836Z:ol", "_rev": "3-73d2df9476fcba5ba87250d46e487ef4", "head": { "contentType": "chiasm", "title": "an inclusio wrapper for 5:22b-23", "ScriptureRange": "Mark 5:22-24a", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 4, 3, "10:07:04.836Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 4, 3, "10:10:57.786Z"] }, "body": { "concepts": [{ "content": "and one of the synagogue leaders, named Jairus, comes (22a)" }, { "content": "[middle section used as parts in larger chiasm from 3:22-43]" }, { "content": "and he (=Jesus) went with him. (24a)" }] } } },
        { "id": "kyk:2014-04-03T10:37:35.423Z:ol", "key": ["kyk:2014-04-03T10:37:35.423Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-04-03T10:37:35.423Z:ol", "_rev": "2-3e6a2083ba208cc5a1a2e24bcf045c4b", "head": { "contentType": "chiasm", "title": "two daughters & a crowd - one touches the King's garment, one is touched by the King", "ScriptureRange": "Mark 5:21-43", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 4, 3, "10:37:35.423Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 4, 3, "10:52:17.910Z"] }, "body": { "concepts": [{ "content": "and having seen him he falls down at the feet of him (22b)", "isHead": true, "embeddedType": "panel" }, { "content": "and he earnestly begs him saying, (23a)", "embeddedType": "panel" }, { "content": "\"my daughter is at [the] final point [of death],\" (23b)", "embeddedType": "panel" }, { "content": "\"that having come\" (23c)", "isHead": true, "embeddedType": "panel" }, { "content": "\"you may put the (your) hands on her\" (23d)", "embeddedType": "panel" }, { "content": "\"that she may be healed and may live.\" (23e)", "embeddedType": "panel" }, { "content": "and a large crowd were following him and they were pressing against him. (24b)", "isHead": true, "embeddedType": "panel" }, { "content": "a woman with a flow of blood for twelve years and many other problems heard about Jesus, came in the crowd and touched his garment. (25-27)", "embeddedType": "panel" }, { "content": "for she was saying, \"if I touch even the garment of him I will be healed.\" (28)", "embeddedType": "panel" }, { "content": "and immediately was dried up the fountain of her blood and she knew in (her) body that she had been cured from the affliction. (29)" }, { "content": "and immediately Jesus knew within himself that power had gone out from him (30a)" }, { "content": "you see the crowd pressing against you, [embedded] (30a-32)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-04-03T09:55:46.302Z:ol" }, { "content": "now the woman was fearing and trembling, having known what had happened to her, she came and fell down before him and told him the whole truth. (33)", "embeddedType": "panel" }, { "content": "and he said to her, \"daughter, your faith has healed you. Go in peace and be healed from your affliction.\" (34)", "embeddedType": "panel" }, { "content": "and having entered [embedded] (35-40)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-04-03T09:53:05.535Z:ol" }, { "content": "and having grasped the hand of the child (41a)", "embeddedType": "panel" }, { "content": "he says to her, \"talitha koum,\" which means little girl, to you I say, arise, and immediately the little girl arose and she was walking around. For she was twelve years old. (41b-42a)", "embeddedType": "panel" }, { "content": "and they were totaly amazed. (42b)", "isHead": true, "embeddedType": "panel" }, { "content": "and he earnestly gave orders to them (43a)", "embeddedType": "panel" }, { "content": "that no one should know this, and he said to give her [something] to eat. (43b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-05-13T00:19:08.440Z:ol", "key": ["kyk:2014-05-13T00:19:08.440Z:ol", "panel: jbjordan"], "value": { "_id": "kyk:2014-05-13T00:19:08.440Z:ol", "_rev": "2-f7be2244af53fc831588809ad06d93b1", "head": { "contentType": "panel", "title": "Festival Year", "ScriptureRange": "Rev 1-22", "contentParams": { "repeat": 7, "header": false }, "submissionTimestamp": [2014, 5, 12, "00:19:08.440Z"], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 24", "website": "", "guid": "kyk:2014-05-13T00:20:25.754Z:sr" }, "modifiedTimestamp": [2014, 5, 12, "00:20:45.650Z"] }, "body": { "concepts": [{ "content": "Sabbath" }, { "content": "Passover" }, { "content": "Firstfruits" }, { "content": "Pentecost" }, { "content": "Trumpets" }, { "content": "Bowls" }, { "content": "Booths" }, { "content": "Light (Day of the Lord)" }, { "content": "Establishment of Firmament People" }, { "content": "Plants" }, { "content": "Lights" }, { "content": "Summoning swarms of people to God" }, { "content": "Man" }, { "content": "Great Sabbath" }, { "content": "Rev 1" }, { "content": "Rev 2-3" }, { "content": "Rev 4-5" }, { "content": "Rev 6-7" }, { "content": "Rev 8-15" }, { "content": "Rev 16-19" }, { "content": "Rev 20-22" }] } } },
        { "id": "kyk:2014-05-13T00:20:25.754Z:sr", "key": ["kyk:2014-05-13T00:20:25.754Z:sr", "source: The Vindication of Jesus Christ"], "value": { "_id": "kyk:2014-05-13T00:20:25.754Z:sr", "_rev": "1-b5740d22e5f31395335f3ae038fb9809", "media": "", "details": "The Vindication of Jesus Christ", "website": "", "publisherDetails": "", "head": { "contentType": "sourceProfile" } } },
        { "id": "kyk:2014-05-13T00:26:40.301Z:ol", "key": ["kyk:2014-05-13T00:26:40.301Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2014-05-13T00:26:40.301Z:ol", "_rev": "2-c6b3b1b39f6007095180b282d6558d96", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Rev 1:1-22:21", "submissionTimestamp": [2014, 5, 12, "00:26:40.301Z"], "modifiedTimestamp": [2014, 5, 12, "00:28:38.958Z"], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 24", "website": "", "guid": "kyk:2014-05-13T00:20:25.754Z:sr" } }, "body": { "concepts": [{ "content": "Prelude to the Seven Churches, ch. 1" }, { "content": "The Seven Churches, ch. 2-3" }, { "content": "Prelude to the Sealed Book, ch. 4-5" }, { "content": "The Sealed Book, ch. 6-7" }, { "content": "The Trumpets, ch. 8-12" }, { "content": "Postlude to the Trumpets, ch. 13-15" }, { "content": "The Bowls, ch. 16" }, { "content": "Postlude to the Bowls, ch. 17-22" }] } } },
        { "id": "kyk:2014-05-13T00:31:39.444Z:ol", "key": ["kyk:2014-05-13T00:31:39.444Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2014-05-13T00:31:39.444Z:ol", "_rev": "2-5939395cc6baae84462fa4d99b253654", "head": { "contentType": "chiasm", "title": "Glorified Jesus to Glorified Bride", "ScriptureRange": "Rev 1-21", "submissionTimestamp": [2014, 5, 12, "00:31:39.444Z"], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 25", "website": "", "guid": "kyk:2014-05-13T00:20:25.754Z:sr" }, "modifiedTimestamp": [2014, 5, 12, "00:33:45.816Z"] }, "body": { "concepts": [{ "content": "Jesus descends to earth to meet John" }, { "content": "The Seven Churches" }, { "content": "Jesus ascends to heaven" }, { "content": "The Seven Seals" }, { "content": "The Seven Trumpets" }, { "content": "The Church ascends to heaven (ch. 12-15)" }, { "content": "The Seven Bowls" }, { "content": "The Church descends to earth (ch. 21)" }] }, "_conflicts": ["1-a39add16a625b27771f4427f417459b1", "1-9090b40e36bed223e342a39b3055df84"] } },
        { "id": "kyk:2014-05-13T00:41:01.480Z:ol", "key": ["kyk:2014-05-13T00:41:01.480Z:ol", "chiasm: jbjordan"], "value": { "_id": "kyk:2014-05-13T00:41:01.480Z:ol", "_rev": "2-bd7adb296ec71991008c02e16c774e51", "head": { "contentType": "chiasm", "title": "Dragon & Sea Beast", "ScriptureRange": "Rev 1:1-22:21", "submissionTimestamp": [2014, 5, 12, "00:41:01.480Z"], "modifiedTimestamp": [2014, 5, 12, "00:41:55.323Z"], "author": { "guid": "kyk:2011-06-06T19:00:00.002Z:ps", "authorShortname": "jbjordan" }, "submittedBy": { "guid": "kyk:1974-12-23T03:22:15.481Z:ps" }, "source": { "details": "p. 26", "website": "", "guid": "kyk:2014-05-13T00:20:25.754Z:sr" } }, "body": { "concepts": [{ "content": "John and Jesus, 1" }, { "content": "Churches, 2-3" }, { "content": "Throne/s in Heaven, 4-5" }, { "content": "Horses, 6:1-8 (first four seals)" }, { "content": "Saints Under Alter, 6:9-11 (5th seal)" }, { "content": "Judgment Starts, 6:12-17 (6th seal)" }, { "content": "Saints Sealed on Earth, 7" }, { "content": "Seven Trumpets Appear, 8:1-2" }, { "content": "Pentecostal Era Begins, 8:3-5" }, { "content": "Plants, 8:7" }, { "content": "Gentiles, 8:8-9" }, { "content": "Drink, 8:10-11" }, { "content": "Heavens, 8:11-12" }, { "content": "Army of Lies, 9:1-11" }, { "content": "Army of Saints, 9:12-11:6" }, { "content": "Massacre, 11:7-13" }, { "content": "Dragon, 12" }, { "content": "Sea Beast, 13:1-10" }, { "content": "Massacre, 13:15" }, { "content": "Army of Saints, 14:1-3" }, { "content": "Army that does not lie, 14:4-5" }, { "content": "Heavens, 14:6-7" }, { "content": "Drink, 14:8" }, { "content": "Gentiles, 14:9-13" }, { "content": "Plants, 14:14-16" }, { "content": "Pentecostal Era Ends, 14:18" }, { "content": "Seven Bowls Appear, 15:1" }, { "content": "Saints in Heaven, 15:2-4" }, { "content": "Judgment Restarts, 15:5-18:24" }, { "content": "Saints in Heaven, 19:1-10" }, { "content": "Horses, 19:11-21" }, { "content": "Throne/s in Heaven, 20" }, { "content": "Church, 21:1-22:5" }, { "content": "John and Jesus, 22:6-21" }] } } },
        { "id": "kyk:2014-07-12T16:46:07.527Z:ol", "key": ["kyk:2014-07-12T16:46:07.527Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-12T16:46:07.527Z:ol", "_rev": "1-5a610ac0acba4b5b157479638ba4ef80", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 119:73-80", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 12, "16:46:07.527Z"] }, "body": { "concepts": [{ "content": "your hands made me and established me (73a)" }, { "content": "give me understanding that I may learn your commandments (73b)" }, { "content": "may those who fear you see me and be glad (74a)" }, { "content": "because I hope in your word (74b)" }, { "content": "I know, O Yahweh, that your judgments are right (75a)" }, { "content": "in faithfulness you have afflicted me (75b)" }, { "content": "let your covenant loyalty comfort me (76a)", "isHead": true, "embeddedType": "panel" }, { "content": "according to your word to your servant (76b)", "embeddedType": "panel" }, { "content": "let your compassion come to me so that I may live (77a)", "isHead": true, "embeddedType": "panel" }, { "content": "because your law is my delight (77b)", "embeddedType": "panel" }, { "content": "let the arrogant be ashamed (78a)" }, { "content": "because they slandered me with falsehood (78b)" }, { "content": "I will meditate on your precepts (78c)" }, { "content": "may those who fear you turn to me (79a)" }, { "content": "they know your testimonies (79b)" }, { "content": "may my heart be complete in your statutes that I may not be ashamed (80)" }] } } },
        { "id": "kyk:2014-07-12T17:15:51.372Z:ol", "key": ["kyk:2014-07-12T17:15:51.372Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-12T17:15:51.372Z:ol", "_rev": "1-fa7398cec857a8b2be3b14ff0b2b5fbe", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Psalm 119:137-144", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 12, "17:15:51.372Z"] }, "body": { "concepts": [{ "content": "O Yahweh, you are righteous (137a)", "isHead": true, "embeddedType": "panel" }, { "content": "upright (137b)", "embeddedType": "panel" }, { "content": "your judgments (137c)", "embeddedType": "panel" }, { "content": "you commanded (138a)", "embeddedType": "panel" }, { "content": "righteous (138b)", "embeddedType": "panel" }, { "content": "your testimonies (138c)", "embeddedType": "panel" }, { "content": "altogether trustworthy (138d)", "embeddedType": "panel" }, { "content": "my zeal destroyed me (139a)", "isHead": true, "embeddedType": "panel" }, { "content": "because my foes have forgotten your words (139b)", "embeddedType": "panel" }, { "content": "your word has been exceedingly refined and your servant loves it (140)" }, { "content": "I am insignificant and despised (141a)", "isHead": true, "embeddedType": "panel" }, { "content": "I have not forgotten your precepts (141b)", "embeddedType": "panel" }, { "content": "your righteousness is righteous forever (142a)", "isHead": true, "embeddedType": "panel" }, { "content": "your law is truth (142b)", "embeddedType": "panel" }, { "content": "anguish and distress have found me (143a)", "embeddedType": "panel" }, { "content": "your commandments are my delight (143b)", "embeddedType": "panel" }, { "content": "righteous (144a)", "embeddedType": "panel" }, { "content": "your testimonies (144b)", "embeddedType": "panel" }, { "content": "give me understanding that I may live (144c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-07-17T17:10:58.259Z:ol", "key": ["kyk:2014-07-17T17:10:58.259Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-07-17T17:10:58.259Z:ol", "_rev": "1-f4907adfdf0fed21534a1c142451e298", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 6:12", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 17, "17:10:58.259Z"] }, "body": { "concepts": [{ "content": "forgive us our debts (12a)" }, { "content": "as we also forgive our debtors (12b)" }] } } },
        { "id": "kyk:2014-07-17T17:20:42.765Z:ol", "key": ["kyk:2014-07-17T17:20:42.765Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-07-17T17:20:42.765Z:ol", "_rev": "1-c9584380a18ff0276c90fb0acaee1b60", "head": { "contentType": "panel", "title": "", "ScriptureRange": "", "contentParams": { "repeat": 2 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 17, "17:20:42.765Z"] }, "body": { "concepts": [{ "content": "for if you forgive people their transgressions (14a)" }, { "content": "your heavenly Father will also forgive you (14b)" }, { "content": "but if you do not forgive people (15a)" }, { "content": "your Father will not forgive your transgressions (15b)" }] } } },
        { "id": "kyk:2014-07-17T17:27:01.808Z:ol", "key": ["kyk:2014-07-17T17:27:01.808Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-17T17:27:01.808Z:ol", "_rev": "1-d64634b6e057052270dda8ff67d78e4a", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 6:17", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 17, "17:27:01.808Z"] }, "body": { "concepts": [{ "content": "anoint (17b)" }, { "content": "your (sg.) (17c)" }, { "content": "head (17d)" }, { "content": "face (17e)" }, { "content": "your (sg.) (17f)" }, { "content": "wash (17g)" }] } } },
        { "id": "kyk:2014-07-17T17:55:39.882Z:ol", "key": ["kyk:2014-07-17T17:55:39.882Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-07-17T17:55:39.882Z:ol", "_rev": "1-4544fd5de5e0e481a0861d559109c54e", "head": { "contentType": "panel", "title": "fasting", "ScriptureRange": "Matthew 6:16-18", "contentParams": { "repeat": 4, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 17, "17:55:39.882Z"] }, "body": { "concepts": [{ "content": "whenever you fast, don't be like sad-faced play-actors (16a)" }, { "content": "for they disfigure their faces (16b)" }, { "content": "so that they may appear fasting to people (16c)" }, { "content": "though they have their reward from people, I assure you that God will not reward them. (16d)" }, { "content": "but while you (sg.) are fasting (17a)" }, { "content": "make yourself look nice (17b)", "embeddedOutlineId": "kyk:2014-07-17T17:27:01.808Z:ol" }, { "content": "so that you (sg.) may not appear fasting to people but only to your (sg.) Father who is in secret (18a)" }, { "content": "and your (sg.) Father, who sees what is done in secret, will reward you (sg.) (18b)" }] } } },
        { "id": "kyk:2014-07-17T18:04:30.492Z:ol", "key": ["kyk:2014-07-17T18:04:30.492Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-07-17T18:04:30.492Z:ol", "_rev": "1-d92101ee7ef5589b85d428e28fca891c", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 6:14-15", "contentParams": { "repeat": 2, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 17, "18:04:30.492Z"] }, "body": { "concepts": [{ "content": "for if you forgive people their transgressions (14a)" }, { "content": "your heavenly Father will also forgive you (14b)" }, { "content": "but if you do not forgive people (15a)" }, { "content": "your Father will not forgive your transgressions (15b)" }] } } },
        { "id": "kyk:2014-07-17T18:51:29.314Z:ol", "key": ["kyk:2014-07-17T18:51:29.314Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-07-17T18:51:29.314Z:ol", "_rev": "1-24a863c4434dcad8032d1f36e0209387", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Matthew 6:7-8", "contentParams": { "repeat": 2, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 18, "18:51:29.314Z"] }, "body": { "concepts": [{ "content": "While you are praying do not keep praying the same prayers, not thinking about the meaning, like non-Jews (7a)" }, { "content": "for they think that they will be heard by repeating words over and over. (7b)" }, { "content": "Don't be like them (8a)" }, { "content": "for your Father knows your needs even before you ask him (8b)" }] } } },
        { "id": "kyk:2014-07-30T10:14:10.577Z:ol", "key": ["kyk:2014-07-30T10:14:10.577Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T10:14:10.577Z:ol", "_rev": "1-3761dc718e9089a85734d06b6c86ad1f", "head": { "contentType": "chiasm", "title": "Shine, so that they may see and glorify your Father!", "ScriptureRange": "Matthew 5:14-16", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "10:14:10.577Z"] }, "body": { "concepts": [{ "content": "you are the light of the cosmos (14a)", "isHead": true, "embeddedType": "panel" }, { "content": "a city on a hill cannot be hidden (14b)", "embeddedType": "panel" }, { "content": "nor do they light a lamp (15a)" }, { "content": "and put it under a basket (15b)" }, { "content": "but on a lampstand (15c)" }, { "content": "and it gives light all those in the house (15d)" }, { "content": "like this, let your light shine before people (16a)", "isHead": true, "embeddedType": "panel" }, { "content": "that they may see your good works and glorify your Father in heaven (16b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-07-30T13:28:46.625Z:ol", "key": ["kyk:2014-07-30T13:28:46.625Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T13:28:46.625Z:ol", "_rev": "2-d188fde487c90f9f1d4f334b5b14d097", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 5:11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "13:28:46.625Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 7, 30, "13:50:54.848Z"] }, "body": { "concepts": [{ "content": "when people insult you (11b)" }, { "content": "and persecute you (11c)" }, { "content": "and tell all kinds of evil lies about you (11d)" }] } } },
        { "id": "kyk:2014-07-30T13:35:04.548Z:ol", "key": ["kyk:2014-07-30T13:35:04.548Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T13:35:04.548Z:ol", "_rev": "1-87e6373135815fc46aff405f3abea9c1", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 5:10-11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "13:35:04.548Z"] }, "body": { "concepts": [{ "content": "God will bless (10a)", "isHead": true, "embeddedType": "panel" }, { "content": "those who are persecuted (10b)", "embeddedType": "panel" }, { "content": "because of righteousness (10c)", "embeddedType": "panel" }, { "content": "because theirs is the kingdom of heaven (10d)" }, { "content": "God will bless you (11a)", "isHead": true, "embeddedType": "panel" }, { "content": "when people persecute you (11c)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-07-30T13:28:46.625Z:ol" }, { "content": "because of me (11e)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-07-30T13:47:00.807Z:ol", "key": ["kyk:2014-07-30T13:47:00.807Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T13:47:00.807Z:ol", "_rev": "1-14887dabcee52d55c9faa6937981f671", "head": { "contentType": "chiasm", "title": "God will bless!", "ScriptureRange": "Matthew 5:3-12", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "13:47:00.807Z"] }, "body": { "concepts": [{ "content": "God will bless those who are poor in spirit (3a)" }, { "content": "because theirs is the kingdom of heaven (3b)", "isHead": true, "embeddedType": "panel" }, { "content": "God will bless those who mourn (4a)", "embeddedType": "panel" }, { "content": "because God will comfort them (4b)", "embeddedType": "panel" }, { "content": "God will bless those who are humble (5a)", "isHead": true, "embeddedType": "panel" }, { "content": "because God will give the whole earth to them (5b)", "embeddedType": "panel" }, { "content": "God will bless those who hunger and thirst for righteousness (6a)", "isHead": true, "embeddedType": "panel" }, { "content": "because God will satisfy them (6b)", "embeddedType": "panel" }, { "content": "God will bless those who are merciful (7a)" }, { "content": "because God will be merciful to them (7b)" }, { "content": "God will bless those who are pure in heart (8a)", "isHead": true, "embeddedType": "panel" }, { "content": "because they will see God face to face (8b)", "embeddedType": "panel" }, { "content": "God will bless those who make peace (9a)", "isHead": true, "embeddedType": "panel" }, { "content": "because God will call them his children (9b)", "embeddedType": "panel" }, { "content": "because theirs is the kingdom of heaven (10d)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-07-30T13:35:04.548Z:ol" }, { "content": "rejoice and be glad (12a)", "embeddedType": "panel" }, { "content": "because your reward in heaven is great (12b)", "embeddedType": "panel" }, { "content": "for this is how they persecuted the prophets who lived long before your time (12c)" }] } } },
        { "id": "kyk:2014-07-30T14:49:19.204Z:ol", "key": ["kyk:2014-07-30T14:49:19.204Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T14:49:19.204Z:ol", "_rev": "1-2a1fdfccde0430936643d96988447750", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 5:17", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "14:49:19.204Z"] }, "body": { "concepts": [{ "content": "that I came to abolish (17b)" }, { "content": "the Law or the Prophets (17c)" }, { "content": "I did not come to abolish (17d)" }] } } },
        { "id": "kyk:2014-07-30T14:50:42.808Z:ol", "key": ["kyk:2014-07-30T14:50:42.808Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T14:50:42.808Z:ol", "_rev": "1-b417ff0a87c4340b04a42b788b1f51bf", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 5:18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "14:50:42.808Z"] }, "body": { "concepts": [{ "content": "until heaven and earth disappear (18b)" }, { "content": "not even the smallest detail will disappear from the Law (18c)" }, { "content": "until all things take place (18d)" }] } } },
        { "id": "kyk:2014-07-30T14:54:38.484Z:ol", "key": ["kyk:2014-07-30T14:54:38.484Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-07-30T14:54:38.484Z:ol", "_rev": "1-b03ce79b3075f758dcd672d07e0a1045", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Matthew 5:17-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 7, 30, "14:54:38.484Z"] }, "body": { "concepts": [{ "content": "do not misunderstand (17a)", "isHead": true, "embeddedType": "panel" }, { "content": "the Law or the Prophets (17c)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-07-30T14:49:19.204Z:ol" }, { "content": "but to fulfill (17e)" }, { "content": "I assure you (18a)", "isHead": true, "embeddedType": "panel" }, { "content": "not even the smallest detail will disappear from the Law (18c)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-07-30T14:50:42.808Z:ol" }] } } },
        { "id": "kyk:2014-08-24T18:28:42.829Z:ol", "key": ["kyk:2014-08-24T18:28:42.829Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-08-24T18:28:42.829Z:ol", "_rev": "1-5deb7d0b61d028f4933b20858796d2a2", "head": { "contentType": "chiasm", "title": "Jacob deceived Isaac", "ScriptureRange": "Genesis 26:35-27:46", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 8, 24, "18:28:42.829Z"] }, "body": { "concepts": [{ "content": "Rebekah & Isaac - family misery for thirty-seven years (26:35)" }, { "content": "Isaac & Esau - Is. wanted to bless E instead of J (27:1-4)", "isHead": true, "embeddedType": "panel" }, { "content": "Rebekah & Jacob - R manipulated instead of praying & trusting God (27:5-17)", "embeddedType": "panel" }, { "content": "Isaac & Jacob - J deceived Is.; R's sin now becomes J's sin (27:18-29)" }, { "content": "Isaac & Esau - Esau wept for what he lost many years ago (27:30-40)", "isHead": true, "embeddedType": "panel" }, { "content": "Rebekah & Jacob - consequences of their scheming & deceiving (27:41-45)", "embeddedType": "panel" }, { "content": "Rebekah & Isaac - miserable condition much worse (27:46)" }] } } },
        { "id": "kyk:2014-09-14T10:37:46.416Z:ol", "key": ["kyk:2014-09-14T10:37:46.416Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T10:37:46.416Z:ol", "_rev": "1-be298c4102b88abfdbfdbab0b5cbbf66", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:16d-18a", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "10:37:46.416Z"] }, "body": { "concepts": [{ "content": "casting a net (16d)" }, { "content": "they were fishers (16e)" }, { "content": "\"Follow Me\" (17a)" }, { "content": "\"I will make you fishers of men\" (17b)" }, { "content": "left the nets (18a)" }] } } },
        { "id": "kyk:2014-09-14T10:42:12.934Z:ol", "key": ["kyk:2014-09-14T10:42:12.934Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T10:42:12.934Z:ol", "_rev": "2-2fc7369dff70c850a1fa6de839e35d14", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:19d-20b", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "10:42:12.934Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 14, "10:44:24.509Z"] }, "body": { "concepts": [{ "content": "in the boat mending the nets (19d)" }, { "content": "He called them (20a)" }, { "content": "they left their father in the boat (20b)" }] } } },
        { "id": "kyk:2014-09-14T11:40:28.436Z:ol", "key": ["kyk:2014-09-14T11:40:28.436Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T11:40:28.436Z:ol", "_rev": "3-0c9f5e2658c511607faffc26234b7b47", "head": { "contentType": "chiasm", "title": "authority over unclean spirits", "ScriptureRange": "Mark 1:21-27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "11:40:28.436Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "11:00:34.148Z"] }, "body": { "concepts": [{ "content": "deliverance of man in synagogue(a good Jew) [embedded](21-27c)", "embeddedOutlineId": "kyk:2014-09-14T11:46:57.960Z:ol" }, { "content": "He commands unclean spirits and they obey him (27d)" }] } } },
        { "id": "kyk:2014-09-14T11:44:24.697Z:ol", "key": ["kyk:2014-09-14T11:44:24.697Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T11:44:24.697Z:ol", "_rev": "1-4afd25ed067cb5a30b4ea3354ce9a77b", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:25c-26c", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "11:44:24.697Z"] }, "body": { "concepts": [{ "content": "\"be quiet!\" (25c)", "isHead": true, "embeddedType": "panel" }, { "content": "\"and come out of him!\" (25d)", "embeddedType": "panel" }, { "content": "the unclean spirit convulsed him (26a)" }, { "content": "and cried out with a loud voice (26b)", "isHead": true, "embeddedType": "panel" }, { "content": "it came out of him (26c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-09-14T11:46:57.960Z:ol", "key": ["kyk:2014-09-14T11:46:57.960Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T11:46:57.960Z:ol", "_rev": "3-f6dca4d931140704a12ad6729b221c8a", "head": { "contentType": "chiasm", "title": "deliverance of man in synagogue", "ScriptureRange": "Mark 1:21-27c", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "11:46:57.960Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "11:01:55.013Z"] }, "body": { "concepts": [{ "content": "they were amazed (22a)", "isHead": true, "embeddedType": "panel" }, { "content": "at his teaching (22b)", "embeddedType": "panel" }, { "content": "having authority (22d)", "embeddedType": "panel" }, { "content": "a man with an unclean spirit (23b)" }, { "content": "he cried out (23c)" }, { "content": "saying (24a)" }, { "content": "\"what do we have to do with you, Jesus?\" (24b)" }, { "content": "\"have you come to destroy us?\" (24c)" }, { "content": "\"I know who you are--the Holy One of God!\" (24d)" }, { "content": "Jesus rebuked him (25a)" }, { "content": "saying (25b)" }, { "content": "\"be quiet!\" (25c)" }, { "content": "the unclean spirit convulsed him [embedded](26a)", "embeddedOutlineId": "kyk:2014-09-14T11:44:24.697Z:ol" }, { "content": "everyone was amazed (27a)", "isHead": true, "embeddedType": "panel" }, { "content": "what is this? a new teaching (27b)", "embeddedType": "panel" }, { "content": "with authority (27c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-09-14T14:16:25.453Z:ol", "key": ["kyk:2014-09-14T14:16:25.453Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T14:16:25.453Z:ol", "_rev": "1-8e560ad57290459565cc311e345f28d4", "head": { "contentType": "chiasm", "title": "I came for this purpose", "ScriptureRange": "Mark 1:38-39", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "14:16:25.453Z"] }, "body": { "concepts": [{ "content": "\"let us go to other villages\" (38a)" }, { "content": "\"so that I may preach there also\" (38b)" }, { "content": "\"I came out for this purpose\" (38c)" }, { "content": "he went out (39a)" }, { "content": "in order to preach (39b)" }, { "content": "in their synagogues throughout all Galilee (39c)" }] } } },
        { "id": "kyk:2014-09-14T14:23:24.191Z:ol", "key": ["kyk:2014-09-14T14:23:24.191Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T14:23:24.191Z:ol", "_rev": "2-9d423d5ddf8c5d664b44dea5f399fcad", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:34b-39", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "14:23:24.191Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "11:06:24.987Z"] }, "body": { "concepts": [{ "content": "he cast out many demons (34b)" }, { "content": "he came out and went away and was praying (35b)" }, { "content": "Simon & those with him hunted him down (36)" }, { "content": "they found him and said, \"Everyone is looking for you\" (37)" }, { "content": "\"I came out for this purpose\" [embedded](38c)", "embeddedOutlineId": "kyk:2014-09-14T14:16:25.453Z:ol" }, { "content": "and in order to cast out demons (39d)" }] } } },
        { "id": "kyk:2014-09-14T14:29:07.789Z:ol", "key": ["kyk:2014-09-14T14:29:07.789Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T14:29:07.789Z:ol", "_rev": "3-a16407e83797dd549af49d25c0b6e76a", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 1:32-34", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "14:29:07.789Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 14, "14:41:42.383Z"] }, "body": { "concepts": [{ "content": "when evening had come after sunset (32a)" }, { "content": "they were bringing to him all those who were ill (32b)", "isHead": true, "embeddedType": "panel" }, { "content": "and those who were demonized (32c)", "embeddedType": "panel" }, { "content": "the whole city had gathered together at the door (33a)" }, { "content": "he healed many who were ill (34a)", "isHead": true, "embeddedType": "panel" }, { "content": "and cast out many demons and didn't allow the demons to speak because they knew him (34b)", "embeddedType": "panel" }, { "content": "in the early morning while still dark (35a)" }] } } },
        { "id": "kyk:2014-09-14T14:32:00.525Z:ol", "key": ["kyk:2014-09-14T14:32:00.525Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T14:32:00.525Z:ol", "_rev": "1-a72ea8932d200f746f0826028e973c79", "head": { "contentType": "chiasm", "title": "He touched & healed Simon's mother-in-law", "ScriptureRange": "Mark 1:29-31", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "14:32:00.525Z"] }, "body": { "concepts": [{ "content": "they went into Simon's house and his mother-in-law was lying down (29-30a)" }, { "content": "since she was having fever (30b)" }, { "content": "they speak to him about her (30c)" }, { "content": "he raises her by taking her hand (31a)" }, { "content": "the fever left her (31b)" }, { "content": "she was serving them (31c)" }] } } },
        { "id": "kyk:2014-09-14T15:41:29.356Z:ol", "key": ["kyk:2014-09-14T15:41:29.356Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T15:41:29.356Z:ol", "_rev": "1-2c237604c894af7ac66e592acf621718", "head": { "contentType": "chiasm", "title": "He touches a leper to cleanse him", "ScriptureRange": "Mark 1:40-43", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "15:41:29.356Z"] }, "body": { "concepts": [{ "content": "a leper comes to him (40a)" }, { "content": "he urges him (40b)" }, { "content": "saying to him (40c)", "isHead": true, "embeddedType": "panel" }, { "content": "\"if you are willing\" (40d)", "embeddedType": "panel" }, { "content": "\"(I know) you are able to cleanse me\" (40e)", "embeddedType": "panel" }, { "content": "being filled with compassion and stretching out his hand, he touched him (41a)" }, { "content": "he says to him (41b)", "isHead": true, "embeddedType": "panel" }, { "content": "\"I am willing\" (41c)", "embeddedType": "panel" }, { "content": "\"be cleansed,\" and immediately the leprosy left him and he was cleansed (41d-42)", "embeddedType": "panel" }, { "content": "and being deeply moved because of him (43a)" }, { "content": "he sent him out (43b)" }] } } },
        { "id": "kyk:2014-09-14T17:36:34.803Z:ol", "key": ["kyk:2014-09-14T17:36:34.803Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-14T17:36:34.803Z:ol", "_rev": "1-8be04815bc5bea72d1a3df93d23ca821", "head": { "contentType": "panel", "title": "calling of Levi", "ScriptureRange": "Mark 2:14", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "17:36:34.803Z"] }, "body": { "concepts": [{ "content": "going along (14a)" }, { "content": "He saw (14b)" }, { "content": "Levi (=Matthew) (14c)" }, { "content": "sitting in the tax office (14d)" }, { "content": "\"Follow Me\" (14e)" }, { "content": "rising up (14f)" }, { "content": "he followed Him (14g)" }] } } },
        { "id": "kyk:2014-09-14T17:38:08.216Z:ol", "key": ["kyk:2014-09-14T17:38:08.216Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T17:38:08.216Z:ol", "_rev": "1-63ce5de220a0854c09d9a8d0a989a405", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 2:5-9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "17:38:08.216Z"] }, "body": { "concepts": [{ "content": "he said to the paralytic, \"your sins are forgiven\" (5b)" }, { "content": "the scribes were reasoning in their hearts (6-7a)" }, { "content": "Who is able to forgive sins except One--God? (7b)" }, { "content": "Jesus knew that they were reasoning in their hearts (8)" }, { "content": "which is easier, to say to the paralytic, \"your sins are forgiven\" (9a)" }] } } },
        { "id": "kyk:2014-09-14T17:39:27.494Z:ol", "key": ["kyk:2014-09-14T17:39:27.494Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T17:39:27.494Z:ol", "_rev": "1-f8c8d935c36977c8dcfdc4466bcc0ae7", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 2:9-11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "17:39:27.494Z"] }, "body": { "concepts": [{ "content": "or to say, \"stand, pick up your mat, and walk\" (9b)" }, { "content": "in order that you may know that the Son of Man has authority to forgive sins (10a)" }, { "content": "he says to the paralytic, \"stand, pick up your mat, and go home\" (10b-11)" }] } } },
        { "id": "kyk:2014-09-14T17:43:56.843Z:ol", "key": ["kyk:2014-09-14T17:43:56.843Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-14T17:43:56.843Z:ol", "_rev": "2-d9ef28aa109e229b4b0b11defebe815e", "head": { "contentType": "chiasm", "title": "authority to forgive sins", "ScriptureRange": "Mark 2:1-13", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 14, "17:43:56.843Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "12:15:16.746Z"] }, "body": { "concepts": [{ "content": "he came in (1)", "isHead": true, "embeddedType": "panel" }, { "content": "many gathered together (2a)", "embeddedType": "panel" }, { "content": "he was speaking the word to them (2b)", "embeddedType": "panel" }, { "content": "they came bringing a paralytic (3)", "isHead": true, "embeddedType": "panel" }, { "content": "because of the crowd they tore open the roof (4)", "embeddedType": "panel" }, { "content": "Jesus saw their faith (5a)", "embeddedType": "panel" }, { "content": "Who is able to forgive sins except One--God? [embedded](7b)", "embeddedOutlineId": "kyk:2014-09-14T17:38:08.216Z:ol" }, { "content": "in order that you may know that the Son of Man has authority to forgive sins [embedded](10a)", "embeddedOutlineId": "kyk:2014-09-14T17:39:27.494Z:ol" }, { "content": "the paralytic rose, took his mat, and went out (12a)", "isHead": true, "embeddedType": "panel" }, { "content": "everyone was astonished and glorified God (12b)", "embeddedType": "panel" }, { "content": "we have never seen anything like this (12c)", "embeddedType": "panel" }, { "content": "he went out (13a)", "isHead": true, "embeddedType": "panel" }, { "content": "all the crowd was coming to him (13b)", "embeddedType": "panel" }, { "content": "he was teaching them (13c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-09-15T04:28:35.015Z:ol", "key": ["kyk:2014-09-15T04:28:35.015Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-15T04:28:35.015Z:ol", "_rev": "1-d8779d569da8390a13e409ce7b64c166", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 3:13", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "04:28:35.015Z"] }, "body": { "concepts": [{ "content": "he went up the mountain and summons (13a)" }, { "content": "whom he wanted (13b)" }, { "content": "and they came to him (13c)" }] } } },
        { "id": "kyk:2014-09-15T04:30:59.236Z:ol", "key": ["kyk:2014-09-15T04:30:59.236Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-15T04:30:59.236Z:ol", "_rev": "2-03e6a41e912336a4a8f03cd5d41d5828", "head": { "contentType": "chiasm", "title": "Jesus appoints the twelve in the Kingdom", "ScriptureRange": "Mark 3:13-19", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "04:30:59.236Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 15, "12:16:30.494Z"] }, "body": { "concepts": [{ "content": "whom he wanted [embedded](13b)", "embeddedOutlineId": "kyk:2014-09-15T04:28:35.015Z:ol" }, { "content": "he appointed the twelve (14a)", "isHead": true, "embeddedType": "panel" }, { "content": "he named them (14b)", "embeddedType": "panel" }, { "content": "in order that they might be with him (14c)" }, { "content": "and in order that he might send them to preach & to have authority to cast out demons (14d-15)" }, { "content": "he appointed the twelve (16a)", "isHead": true, "embeddedType": "panel" }, { "content": "he named them (16b-19a)", "embeddedType": "panel" }, { "content": "who also betrayed him (19b)" }] } } },
        { "id": "kyk:2014-09-15T17:43:41.333Z:ol", "key": ["kyk:2014-09-15T17:43:41.333Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-15T17:43:41.333Z:ol", "_rev": "1-911b3227a258a6a3f6fa20ec12073daa", "head": { "contentType": "chiasm", "title": "People you must greet", "ScriptureRange": "Romans 16:3-16", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "17:43:41.333Z"] }, "body": { "concepts": [{ "content": "Greet Prisca and Aquila, my fellow workers in Christ Jesus, who for my life risked their own necks, (3-4a)" }, { "content": "Greet all the fellow workers [embedded](4-16)", "embeddedOutlineId": "kyk:2013-11-06T05:40:20.567Z:ol" }] } } },
        { "id": "kyk:2014-09-15T18:02:47.034Z:ol", "key": ["kyk:2014-09-15T18:02:47.034Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-15T18:02:47.034Z:ol", "_rev": "1-5d0b93f1dbf0d51a07aa4b1cccac121d", "head": { "contentType": "chiasm", "title": "the basis of prayer", "ScriptureRange": "Romans 15:30", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "18:02:47.034Z"] }, "body": { "concepts": [{ "content": "through our Lord Jesus Christ (30b)" }, { "content": "and through the love of the Spirit (30c)" }, { "content": "to strive together with me in prayer (30d)" }, { "content": "on my behalf (30e)" }, { "content": "before God (30f)" }] } } },
        { "id": "kyk:2014-09-15T18:06:13.708Z:ol", "key": ["kyk:2014-09-15T18:06:13.708Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-15T18:06:13.708Z:ol", "_rev": "2-55cbcbaaf3438dfe2f4aa0bd1c76755e", "head": { "contentType": "panel", "title": "your prayers", "ScriptureRange": "Romans 15:30-33", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "18:06:13.708Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "05:32:34.854Z"] }, "body": { "concepts": [{ "content": "Now I encourage you, [brothers & sisters,] (30a)" }, { "content": "to strive together with me in prayer [embedded](30d)", "embeddedOutlineId": "kyk:2014-09-15T18:02:47.034Z:ol" }, { "content": "that I may be rescued from those who are disobedient in Judea (31a)" }, { "content": "and my service may be pleasing to the Lord's people in Jerusalem (31b)" }, { "content": "so that after coming to you in joy (32a)" }, { "content": "through the will of God I may be refreshed in your company (32b)" }, { "content": "Now the God of peace be with you all, Amen. (33)" }] } } },
        { "id": "kyk:2014-09-15T18:13:40.821Z:ol", "key": ["kyk:2014-09-15T18:13:40.821Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-15T18:13:40.821Z:ol", "_rev": "2-4b7e8c232a7858cd9d8f7499142a179e", "head": { "contentType": "chiasm", "title": "welcome Phoebe", "ScriptureRange": "Romans 15:30-16:23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "18:13:40.821Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "05:35:21.988Z"] }, "body": { "concepts": [{ "content": "Now I encourage you to strive together with me in prayer [embedded](15:30-33)", "embeddedOutlineId": "kyk:2014-09-15T18:06:13.708Z:ol" }, { "content": "I commend to you (16:1a)" }, { "content": "our sister Phoebe, a deaconess of the church at Cenchreae (16:1b)" }, { "content": "that you welcome her in the Lord in a way worthy of the Lord's people (16:2a)" }, { "content": "and stand alongside her in whatever matter she may have need (16:2b)" }, { "content": "for she has been a patron of many (16:2c)" }, { "content": "and of myself as well (16:2d)" }, { "content": "Now I encourage you to watch out for belly slaves [embedded](16:3-24)", "embeddedOutlineId": "kyk:2013-11-06T07:41:50.969Z:ol" }] } } },
        { "id": "kyk:2014-09-15T18:26:26.827Z:ol", "key": ["kyk:2014-09-15T18:26:26.827Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-15T18:26:26.827Z:ol", "_rev": "2-89c78d78d5b4cee369223dd974507816", "head": { "contentType": "panel", "title": "watch out!", "ScriptureRange": "Romans 16:17-20", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 15, "18:26:26.827Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 16, "18:50:50.740Z"] }, "body": { "concepts": [{ "content": "Now I encourage you, brothers & sisters, (17a)" }, { "content": "to watch and turn away from those who keep making divisions & stumbling blocks [embedded](17d)", "embeddedOutlineId": "kyk:2014-01-02T14:06:03.397Z:ol" }, { "content": "for such men are not enslaved to our Lord Christ but their own belly [embedded](18)", "embeddedOutlineId": "kyk:2014-01-02T13:58:55.302Z:ol" }, { "content": "your obedience has reached all (19a)" }, { "content": "therefore I am rejoicing over you (19b)" }, { "content": "I want you to be wise about what is good, but innocent about what is evil (19c)" }, { "content": "Now the God of peace will break satan under your feet quickly (20a)" }] } } },
        { "id": "kyk:2014-09-20T05:41:34.635Z:ol", "key": ["kyk:2014-09-20T05:41:34.635Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:41:34.635Z:ol", "_rev": "1-d6b05ab3fcda80fd3e9ca7dc4d6f6ad1", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:14", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:41:34.635Z"] }, "body": { "concepts": [{ "content": "Now, my brothers and sisters, as to myself, I too am persuaded about you (14a)" }, { "content": "that you yourselves are full of honesty, (14b)" }, { "content": "since you have been filled with every (aspect of) knowledge (about the gospel), (14c)" }, { "content": "with the result that you are able also to admonish one another. (14d)" }] } } },
        { "id": "kyk:2014-09-20T05:43:39.843Z:ol", "key": ["kyk:2014-09-20T05:43:39.843Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:43:39.843Z:ol", "_rev": "1-e8874f84dd3c891e788079cb2dd12835", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:15-16", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:43:39.843Z"] }, "body": { "concepts": [{ "content": "because of the grace given me (15b)" }, { "content": "by God (15c)" }, { "content": "to be a servant of Christ Jesus (16a)" }, { "content": "to the non-Jews, (16b)" }, { "content": "I serve like a priest in preaching the gospel (16c)" }, { "content": "from God, (16d)" }, { "content": "in order that the offering consisting of the non-Jews may be acceptable/pleasing (to God), (16e)" }] } } },
        { "id": "kyk:2014-09-20T05:45:54.895Z:ol", "key": ["kyk:2014-09-20T05:45:54.895Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:45:54.895Z:ol", "_rev": "1-3f7d0608f9c97c79b3a03c0ca4883745", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:16-19", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:45:54.895Z"] }, "body": { "concepts": [{ "content": "by means of their having been sanctified by the Holy Spirit. (16f)" }, { "content": "Therefore I have (this) boast in Christ Jesus--the (things done) in association with God; (17)" }, { "content": "for I will not dare to speak of any of the things (18a)", "isHead": true, "embeddedType": "panel" }, { "content": "which Christ has not accomplished through me (18b)", "embeddedType": "panel" }, { "content": "to bring about the obedience of the non-Jews, (18c)" }, { "content": "by (what I have) said (18d)", "isHead": true, "embeddedType": "panel" }, { "content": "and done, (18e)", "embeddedType": "panel" }, { "content": "by the power of signs and wonders, (19a)" }, { "content": "by the power of the Spirit of God; (19b)" }] } } },
        { "id": "kyk:2014-09-20T05:49:14.245Z:ol", "key": ["kyk:2014-09-20T05:49:14.245Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:49:14.245Z:ol", "_rev": "1-5bb632e918da02678854f9830f7d7637", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:22-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:49:14.245Z"] }, "body": { "concepts": [{ "content": "For this reason, I have also been hindered these many times (22a)" }, { "content": "from coming to you; (22b)" }, { "content": "but now, because I no longer have place (for me to work) in these regions, (23a)" }, { "content": "and because I have a desire to come to you (23b)" }, { "content": "for many years, (23c)" }] } } },
        { "id": "kyk:2014-09-20T05:52:18.364Z:ol", "key": ["kyk:2014-09-20T05:52:18.364Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:52:18.364Z:ol", "_rev": "2-4556270765f4efb3b1c2c385de10fd8c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:19-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:52:18.364Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "06:03:37.571Z"] }, "body": { "concepts": [{ "content": "so that from Jerusalem and round about as far as Illyricum (19c)" }, { "content": "I have fulfilled the message of the gospel of Christ, (19d)" }, { "content": "but I have made it my earnest endeavour to preach the gospel (20a)" }, { "content": "where Christ was not known, (20b)" }, { "content": "that upon another man's foundation (20c)" }, { "content": "I might not be building, (20d)" }, { "content": "but, as it stands written, \"Those who were not told about him will see, and those who have not heard will understand.\" (21)" }, { "content": "but now, because I no longer have place (for me to work) in these regions, [embedded](23a)", "embeddedOutlineId": "kyk:2014-09-20T05:49:14.245Z:ol" }] } } },
        { "id": "kyk:2014-09-20T05:55:21.050Z:ol", "key": ["kyk:2014-09-20T05:55:21.050Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:55:21.050Z:ol", "_rev": "1-a2d90d4d83ce12245890a75d883b7b04", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:55:21.050Z"] }, "body": { "concepts": [{ "content": "I know that when I (do) come to you (29a)" }, { "content": "(it will be) in/with/by the fullness of Christ's blessing (29b)" }, { "content": "I will come. (29c)" }] } } },
        { "id": "kyk:2014-09-20T05:56:44.581Z:ol", "key": ["kyk:2014-09-20T05:56:44.581Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T05:56:44.581Z:ol", "_rev": "2-b2b7299ad9d100e91e2a14103b75fe08", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "05:56:44.581Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 9, 20, "06:01:22.871Z"] }, "body": { "concepts": [{ "content": "and they owe it to them; (27b)" }, { "content": "for if the non-Jews have participated in the Jews' spiritual blessings, (27c)" }, { "content": "they also owe it (to them) (27d)" }] } } },
        { "id": "kyk:2014-09-20T06:00:34.684Z:ol", "key": ["kyk:2014-09-20T06:00:34.684Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T06:00:34.684Z:ol", "_rev": "1-b610164af4715b612764213f6a2c8251", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 15:24-29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "06:00:34.684Z"] }, "body": { "concepts": [{ "content": "whenever I travel to Spain; for I am hoping to see you while passing through and to be sent onward by you from there (24a)", "isHead": true, "embeddedType": "panel" }, { "content": "having first in some measure had my fill of your company. (24b)", "embeddedType": "panel" }, { "content": "But now I am travelling to Jerusalem (25a)" }, { "content": "in order to minister to the Lord's people. (25b)" }, { "content": "For Macedonia and Achaia resolved (26a)", "isHead": true, "embeddedType": "panel" }, { "content": "to (financially) participate with the poor among the Lord's people in Jerusalem. (26b)", "embeddedType": "panel" }, { "content": "They resolved to do this (27a)", "isHead": true, "embeddedType": "panel" }, { "content": "for if the non-Jews have participated in the Jews' spiritual blessings, [embedded](27c)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-09-20T05:56:44.581Z:ol" }, { "content": "to render them service in the things necessary for their bodily welfare. (27e)" }, { "content": "So, after I have completed this task and sealed for them this fruit, (28a)" }, { "content": "I will set out for Spain by way of you; (28b)", "isHead": true, "embeddedType": "panel" }, { "content": "(it will be) in/with/by the fullness of Christ's blessing [embedded](29b)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-09-20T05:55:21.050Z:ol" }] } } },
        { "id": "kyk:2014-09-20T07:15:12.038Z:ol", "key": ["kyk:2014-09-20T07:15:12.038Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T07:15:12.038Z:ol", "_rev": "1-99d31a4b03f46ed64ae6440d36b58770", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:15c-16b", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "07:15:12.038Z"] }, "body": { "concepts": [{ "content": "to proclaim the gospel. (15c)" }, { "content": "For I am not ashamed (16a)" }, { "content": "of the gospel, (16b)" }] } } },
        { "id": "kyk:2014-09-20T07:17:38.090Z:ol", "key": ["kyk:2014-09-20T07:17:38.090Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T07:17:38.090Z:ol", "_rev": "1-f5d661a95adffb964a887cbf9b26c9bf", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:15a-16a", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "07:17:38.090Z"] }, "body": { "concepts": [{ "content": "so (as far as it depends on me) I am eager (15a)" }, { "content": "to you also who are in Rome (15b)" }, { "content": "For I am not ashamed [embedded](16a)", "embeddedOutlineId": "kyk:2014-09-20T07:15:12.038Z:ol" }] } } },
        { "id": "kyk:2014-09-20T07:20:23.976Z:ol", "key": ["kyk:2014-09-20T07:20:23.976Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T07:20:23.976Z:ol", "_rev": "1-777582278432173702a3f4a86b9cb492", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:13-16", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "07:20:23.976Z"] }, "body": { "concepts": [{ "content": "in order that I may obtain some fruit (13f)", "isHead": true, "embeddedType": "panel" }, { "content": "among you also (13g)", "embeddedType": "panel" }, { "content": "even as (I have also done) among the rest of the nations/non-Jews. (13h)" }, { "content": "Both to Greeks and to non-Greeks, both to the wise and to the foolish, (14a)" }, { "content": "I am obligated (by God), (14b)", "isHead": true, "embeddedType": "panel" }, { "content": "to you also who are in Rome [embedded](15b)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-09-20T07:17:38.090Z:ol" }] } } },
        { "id": "kyk:2014-09-20T13:10:24.382Z:ol", "key": ["kyk:2014-09-20T13:10:24.382Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T13:10:24.382Z:ol", "_rev": "1-fe7cb0f4d6c815c05406156305510a4c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "13:10:24.382Z"] }, "body": { "concepts": [{ "content": "For his invisible attributes (20a)" }, { "content": "since the creation of the world (20b)" }, { "content": "being understood by the things that were made (20c)" }, { "content": "are clearly seen, (20d)" }] } } },
        { "id": "kyk:2014-09-20T13:12:02.703Z:ol", "key": ["kyk:2014-09-20T13:12:02.703Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T13:12:02.703Z:ol", "_rev": "1-90c066f686649725473bc519eda20f7c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:19-20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "13:12:02.703Z"] }, "body": { "concepts": [{ "content": "because that which (may be) known about God (19a)" }, { "content": "is manifest among them; (19b)" }, { "content": "for God manifested (the knowledge about God) to them. (19c)" }, { "content": "being understood by the things that were made [embedded](20c)", "embeddedOutlineId": "kyk:2014-09-20T13:10:24.382Z:ol" }] } } },
        { "id": "kyk:2014-09-20T13:15:24.848Z:ol", "key": ["kyk:2014-09-20T13:15:24.848Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T13:15:24.848Z:ol", "_rev": "1-8df195807122f7a0a5b1c3048c8888fe", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Romans 1:16-20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "13:15:24.848Z"] }, "body": { "concepts": [{ "content": "for (the gospel) is the power of God (16c)" }, { "content": "for the purpose of salvation (16d)" }, { "content": "to each and every person who trusts, both to the Jew first and (also) to the Greek (16e)" }, { "content": "for the righteousness of God in (the gospel) (17a)" }, { "content": "is revealed (17b)" }, { "content": "from faith to faith (17c)" }, { "content": "as it stands written, \"but the righteous person from faith will live.\" (17d)" }, { "content": "For is revealed (18a)" }, { "content": "the wrath of God from heaven (18b)" }, { "content": "against all ungodliness and unrighteousness of people who are suppressing the truth by unrighteousness, (18c)" }, { "content": "for God manifested (the knowledge about God) to them. [embedded](19c)", "embeddedOutlineId": "kyk:2014-09-20T13:12:02.703Z:ol" }, { "content": "both his eternal power and divinity, (20e)" }] } } },
        { "id": "kyk:2014-09-20T15:24:29.752Z:ol", "key": ["kyk:2014-09-20T15:24:29.752Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-20T15:24:29.752Z:ol", "_rev": "1-221a28cffa0cad3a1a7936e17cfdf652", "head": { "contentType": "panel", "title": "to the non-Jews & faith", "ScriptureRange": "Romans 1:13-20", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "15:24:29.752Z"] }, "body": { "concepts": [{ "content": "to the non-Jews [embedded](1:13-16)", "embeddedOutlineId": "kyk:2014-09-20T07:20:23.976Z:ol" }, { "content": "but the righteous from faith will live [embedded](1:16-20)", "embeddedOutlineId": "kyk:2014-09-20T13:15:24.848Z:ol" }] } } },
        { "id": "kyk:2014-09-20T15:28:53.154Z:ol", "key": ["kyk:2014-09-20T15:28:53.154Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T15:28:53.154Z:ol", "_rev": "1-070beb3342b4f2d5abd6068e51cd2500", "head": { "contentType": "chiasm", "title": "to the non-Jews & obedience", "ScriptureRange": "Romans 15:15-23", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "15:28:53.154Z"] }, "body": { "concepts": [{ "content": "to the non-Jews [embedded](15:15-16)", "embeddedOutlineId": "kyk:2014-09-20T05:43:39.843Z:ol" }, { "content": "to bring about the obedience of the non-Jews [embedded](15:16-19)", "embeddedOutlineId": "kyk:2014-09-20T05:45:54.895Z:ol" }, { "content": "where Christ was not known [embedded](15:19-23)", "embeddedOutlineId": "kyk:2014-09-20T05:52:18.364Z:ol" }] } } },
        { "id": "kyk:2014-09-20T15:42:44.089Z:ol", "key": ["kyk:2014-09-20T15:42:44.089Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-20T15:42:44.089Z:ol", "_rev": "6-5214fe3e7ea8277b713a4a5e7c7e0f48", "head": { "contentType": "chiasm", "title": "The overall structure of Romans", "ScriptureRange": "Romans 1:1-16:27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 20, "15:42:44.089Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 12, 6, "18:01:51.690Z"] }, "body": { "concepts": [{ "content": "Paul and the gospel about Jesus [embedded](1:1-7b)", "embeddedOutlineId": "kyk:2013-11-06T12:22:44.461Z:ol" }, { "content": "Paul and the Romans - part one [embedded](1:7c-13e)", "embeddedOutlineId": "kyk:2014-09-22T08:51:27.422Z:ol" }, { "content": "Paul and his burden for evangelism [embedded](1:13f-16b)", "embeddedOutlineId": "kyk:2014-09-20T07:20:23.976Z:ol" }, { "content": "the gospel from God [embedded](1:16c-20e)", "embeddedOutlineId": "kyk:2014-09-20T13:15:24.848Z:ol" }, { "content": "God gave them over to impurity [embedded](1:20f-2:1a)" }, { "content": "God judges those who judge [embedded](2:1b-16)" }, { "content": "we will all stand before the judgment seat of God [embedded](14:1-15:13)" }, { "content": "But I have written to you quite boldly in part (of my letter), as (though) to remind you (of it) again (15:14-15a)" }, { "content": "the non-Jews' obedience to the gospel [embedded](15:15b-19b)", "embeddedOutlineId": "kyk:2014-09-22T10:14:46.441Z:ol" }, { "content": "Paul and his involvement in evangelism [embedded](15:19c-29)", "embeddedOutlineId": "kyk:2014-09-22T10:29:21.105Z:ol" }, { "content": "Paul and the Romans - part two [embedded](15:30-16:23)", "embeddedOutlineId": "kyk:2014-09-15T18:13:40.821Z:ol" }, { "content": "Jesus is the mystery now made manifest [embedded](16:25-27)", "embeddedOutlineId": "kyk:2013-08-27T12:15:55.141Z:ol" }] } } },
        { "id": "kyk:2014-09-22T05:59:22.545Z:ol", "key": ["kyk:2014-09-22T05:59:22.545Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-09-22T05:59:22.545Z:ol", "_rev": "1-2fcdff0a125edc4503b0c2aedd13295c", "head": { "contentType": "chiasm", "title": "the grace-peace block", "ScriptureRange": "Romans 1:7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 22, "05:59:22.545Z"] }, "body": { "concepts": [{ "content": "grace to you (7c)" }, { "content": "and (7d)" }, { "content": "peace (7e)" }, { "content": "from God our Father (7f)" }, { "content": "and (7g)" }, { "content": "the Lord Jesus Christ (7h)" }] } } },
        { "id": "kyk:2014-09-22T08:51:27.422Z:ol", "key": ["kyk:2014-09-22T08:51:27.422Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-22T08:51:27.422Z:ol", "_rev": "1-2602c76b0413314a2ea664c7d7181ae9", "head": { "contentType": "panel", "title": "Paul and the Romans", "ScriptureRange": "Romans 1:7-13", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 22, "08:51:27.422Z"] }, "body": { "concepts": [{ "content": "grace and peace [embedded](7c-h)", "embeddedOutlineId": "kyk:2014-09-22T05:59:22.545Z:ol" }, { "content": "serving God [embedded](8-10)", "embeddedOutlineId": "kyk:2014-01-02T13:48:50.475Z:ol" }, { "content": "mutual encouragement [embedded](10-13)", "embeddedOutlineId": "kyk:2014-01-02T18:10:20.216Z:ol" }] } } },
        { "id": "kyk:2014-09-22T10:14:46.441Z:ol", "key": ["kyk:2014-09-22T10:14:46.441Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-22T10:14:46.441Z:ol", "_rev": "1-bf223e9230788434c97073fa25e478c0", "head": { "contentType": "panel", "title": "the non-Jews' obedience to the gospel", "ScriptureRange": "Romans 15:15-19", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 9, 22, "10:14:46.441Z"] }, "body": { "concepts": [{ "content": "Paul and the non-Jews [embedded](15:15b-16e)", "embeddedOutlineId": "kyk:2014-09-20T05:43:39.843Z:ol" }, { "content": "God and the non-Jews [embedded](15:16f-19b)", "embeddedOutlineId": "kyk:2014-09-20T05:45:54.895Z:ol" }] } } },
        { "id": "kyk:2014-09-22T10:29:21.105Z:ol", "key": ["kyk:2014-09-22T10:29:21.105Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-09-22T10:29:21.105Z:ol", "_rev": "1-bf3b70618acbdfbd3f14da6fb148a914", "head": { "contentType": "panel", "title": "Paul and his involvement in evangelism", "ScriptureRange": "Romans 15:19c-29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "contentParams": { "repeat": 0, "header": false }, "submissionTimestamp": [2014, 9, 22, "10:29:21.105Z"] }, "body": { "concepts": [{ "content": "going where Christ is not known [embedded](15:19c-23)", "embeddedOutlineId": "kyk:2014-09-20T05:52:18.364Z:ol" }, { "content": "the non-Jews participation with the Jews [embedded](15:24-29)", "embeddedOutlineId": "kyk:2014-09-20T06:00:34.684Z:ol" }] } } },
        { "id": "kyk:2014-10-26T00:09:54.677Z:ol", "key": ["kyk:2014-10-26T00:09:54.677Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T00:09:54.677Z:ol", "_rev": "5-f62f4313597647cb710f7a57427148fa", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Genesis 2:4", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "00:09:54.677Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 3, "06:57:43.706Z"] }, "body": { "concepts": [{ "content": "of the heavens (4b)" }, { "content": "and of the earth (4c)" }, { "content": "when they were created, (4d)" }, { "content": "in the day that Jehovah God made (4e)" }, { "content": "earth (4f)" }, { "content": "and heaven. (4g)" }] } } },
        { "id": "kyk:2014-10-26T00:15:57.873Z:ol", "key": ["kyk:2014-10-26T00:15:57.873Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T00:15:57.873Z:ol", "_rev": "1-a3ce089172cdbdc6acef4fdc39cdeab0", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Genesis 1:2", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "00:15:57.873Z"] }, "body": { "concepts": [{ "content": "And the earth was waste [~deep] and void; (2a)" }, { "content": "and darkness (2b)" }, { "content": "was upon the face of the deep [~waste] (2c)" }] } } },
        { "id": "kyk:2014-10-26T00:27:38.837Z:ol", "key": ["kyk:2014-10-26T00:27:38.837Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T00:27:38.837Z:ol", "_rev": "1-b7eaae1c198edb3901a76490e9d59924", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Genesis 1:7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "00:27:38.837Z"] }, "body": { "concepts": [{ "content": "which were under the firmament (7c)" }, { "content": "between the waters (7d)" }, { "content": "which were above the firmament (7e)" }] } } },
        { "id": "kyk:2014-10-26T00:36:03.357Z:ol", "key": ["kyk:2014-10-26T00:36:03.357Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T00:36:03.357Z:ol", "_rev": "2-72bfb7b0b29e8083df99e82387460433", "head": { "contentType": "chiasm", "title": "God made the firmament", "ScriptureRange": "Genesis 1:6-7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "00:36:03.357Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 10, 27, "22:20:04.674Z"] }, "body": { "concepts": [{ "content": "And God said, Let there be a firmament in the midst of the waters, (6a)" }, { "content": "and let it divide the waters from the waters. (6b)" }, { "content": "And God made the firmament, (7a)" }, { "content": "and divided the waters (7b)" }, { "content": "between the waters [embedded] (7d)", "embeddedOutlineId": "kyk:2014-10-26T00:27:38.837Z:ol" }] } } },
        { "id": "kyk:2014-10-26T00:44:42.006Z:ol", "key": ["kyk:2014-10-26T00:44:42.006Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T00:44:42.006Z:ol", "_rev": "2-9a171e4c339bcfa2c4517b9177d9d2b0", "head": { "contentType": "chiasm", "title": "Day 2 - it was so!", "ScriptureRange": "Genesis 1:6-8", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "00:44:42.006Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 10, 27, "22:21:13.778Z"] }, "body": { "concepts": [{ "content": "And God made the firmament, [embedded] (7a)", "embeddedOutlineId": "kyk:2014-10-26T00:36:03.357Z:ol" }, { "content": "and it was so. (7f)" }, { "content": "And God called the firmament Heaven. (8a)" }] } } },
        { "id": "kyk:2014-10-26T00:59:16.882Z:ol", "key": ["kyk:2014-10-26T00:59:16.882Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T00:59:16.882Z:ol", "_rev": "2-b980db6d72ae01e0937aad485d3279c6", "head": { "contentType": "chiasm", "title": "Day 1 - it was light!", "ScriptureRange": "Genesis 1:2-5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "00:59:16.882Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 10, 27, "22:19:01.818Z"] }, "body": { "concepts": [{ "content": "and darkness [embedded] (2b)", "embeddedOutlineId": "kyk:2014-10-26T00:15:57.873Z:ol" }, { "content": "and the Spirit of God moved upon the face of the waters. (2d)", "isHead": true, "embeddedType": "panel" }, { "content": "And God said, Let there be light: (3a)", "embeddedType": "panel" }, { "content": "and it was light. (3b)" }, { "content": "And God saw the light, that it was good: (4a)" }, { "content": "and God divided the light from the darkness. (4b)", "isHead": true, "embeddedType": "panel" }, { "content": "And God called the light Day, (5a)", "embeddedType": "panel" }, { "content": "and the darkness he called Night. (5b)" }] } } },
        { "id": "kyk:2014-10-26T10:07:15.058Z:ol", "key": ["kyk:2014-10-26T10:07:15.058Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T10:07:15.058Z:ol", "_rev": "1-d833764ea8e362edd9a8b20a157279ea", "head": { "contentType": "chiasm", "title": "Day 3a - it was so!", "ScriptureRange": "Genesis 1:9-10", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "10:07:15.058Z"] }, "body": { "concepts": [{ "content": "And God said, Let the waters under the heavens be gathered together unto one place, (9a)" }, { "content": "and let the dry land appear: (9b)" }, { "content": "and it was so. (9c)" }, { "content": "And God called the dry land Earth; (10a)" }, { "content": "and the gathering together of the waters called he Seas: (10b)" }] } } },
        { "id": "kyk:2014-10-26T10:34:19.721Z:ol", "key": ["kyk:2014-10-26T10:34:19.721Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T10:34:19.721Z:ol", "_rev": "1-6558d638a9e9a6cc7b02b22caedd9f0e", "head": { "contentType": "chiasm", "title": "Day 3b - it was so!", "ScriptureRange": "Genesis 1:10-12", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "10:34:19.721Z"] }, "body": { "concepts": [{ "content": "and God saw that it was good. (10c)" }, { "content": "And God said, Let the earth put forth grass, (11a)", "isHead": true, "embeddedType": "panel" }, { "content": "herbs yielding seed, (11b)", "embeddedType": "panel" }, { "content": "and fruit-trees bearing fruit after their kind, (11c)", "embeddedType": "panel" }, { "content": "wherein is the seed thereof, upon the earth: (11d)", "embeddedType": "panel" }, { "content": "and it was so. (11e)" }, { "content": "And the earth brought forth grass, (12a)", "isHead": true, "embeddedType": "panel" }, { "content": "herbs yielding seed after their kind, (12b)", "embeddedType": "panel" }, { "content": "and trees bearing fruit, (12c)", "embeddedType": "panel" }, { "content": "wherein is the seed thereof, after their kind: (12d)", "embeddedType": "panel" }, { "content": "and God saw that it was good. (12e)" }] } } },
        { "id": "kyk:2014-10-26T10:47:16.222Z:ol", "key": ["kyk:2014-10-26T10:47:16.222Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T10:47:16.222Z:ol", "_rev": "1-d737e9e0e26c6fc8619f62bc6f3643be", "head": { "contentType": "chiasm", "title": "the rule of the sun and moon", "ScriptureRange": "Genesis 1:16-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 26, "10:47:16.222Z"] }, "body": { "concepts": [{ "content": "the greater light to rule the day, (16b)", "isHead": true, "embeddedType": "panel" }, { "content": "and the lesser light to rule the night; (16c)", "embeddedType": "panel" }, { "content": "and the stars. (16d)", "isHead": true, "embeddedType": "panel" }, { "content": "And God set them in the firmament of heaven (17a)", "embeddedType": "panel" }, { "content": "to give light upon the earth, (17b)", "embeddedType": "panel" }, { "content": "and to rule over the day (18a)", "isHead": true, "embeddedType": "panel" }, { "content": "and over the night, (18b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-10-26T21:59:18.029Z:ol", "key": ["kyk:2014-10-26T21:59:18.029Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T21:59:18.029Z:ol", "_rev": "1-cbb328b83179932070e3f4cc34829140", "head": { "contentType": "chiasm", "title": "stars, part 1b", "ScriptureRange": "Genesis 1:14c-15", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 27, "21:59:18.029Z"] }, "body": { "concepts": [{ "content": "and let them be for signs, and for seasons, and for days and years: (14c)", "isHead": true, "embeddedType": "panel" }, { "content": "and let them be for lights in the firmament of heaven (15a)", "embeddedType": "panel" }, { "content": "to give light upon the earth: (15b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-10-26T22:03:34.102Z:ol", "key": ["kyk:2014-10-26T22:03:34.102Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T22:03:34.102Z:ol", "_rev": "1-f217680ad2eee5dd5839f2a0638e1074", "head": { "contentType": "chiasm", "title": "stars, part 2", "ScriptureRange": "Genesis 1:16-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "contentParams": { "repeat": 0 }, "submissionTimestamp": [2014, 10, 27, "22:03:34.102Z"] }, "body": { "concepts": [{ "content": "the stars [embedded] (16-18)", "embeddedOutlineId": "kyk:2014-10-26T10:47:16.222Z:ol" }, { "content": "and to divide the light from the darkness: (18c)", "isHead": true, "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-10-26T22:08:25.576Z:ol", "key": ["kyk:2014-10-26T22:08:25.576Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T22:08:25.576Z:ol", "_rev": "2-3cc67c20348bf22935ac34a609f93568", "head": { "contentType": "chiasm", "title": "stars, part 1", "ScriptureRange": "Genesis 1:14b-15b", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 27, "22:08:25.576Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 10, 27, "22:17:26.373Z"] }, "body": { "concepts": [{ "content": "to divide the day from the night; (14b)", "isHead": true, "embeddedType": "panel" }, { "content": "the stars [embedded] (14c-15b)", "embeddedOutlineId": "kyk:2014-10-26T21:59:18.029Z:ol" }] } } },
        { "id": "kyk:2014-10-26T22:16:54.842Z:ol", "key": ["kyk:2014-10-26T22:16:54.842Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T22:16:54.842Z:ol", "_rev": "1-5e05e0ded4a2e552b63fcda75c2f70f0", "head": { "contentType": "chiasm", "title": "Day 4 - it was so!", "ScriptureRange": "Genesis 1:14-18", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 27, "22:16:54.842Z"] }, "body": { "concepts": [{ "content": "And God said, Let there be lights in the firmament of heaven (14a)", "isHead": true, "embeddedType": "panel" }, { "content": "stars, part 1 [embedded] (14b-15b)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T22:08:25.576Z:ol" }, { "content": "and it was so. (15c)" }, { "content": "And God made the two great lights; (16a)", "isHead": true, "embeddedType": "panel" }, { "content": "stars, part 2 [embedded] (16b-18c)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T22:03:34.102Z:ol" }] } } },
        { "id": "kyk:2014-10-26T22:40:22.568Z:ol", "key": ["kyk:2014-10-26T22:40:22.568Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-26T22:40:22.568Z:ol", "_rev": "2-87237f763a03f5334ab8cc0d1a0b4e6f", "head": { "contentType": "chiasm", "title": "creatures, part 1", "ScriptureRange": "Genesis 1:20-21", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 27, "22:40:22.568Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 10, 28, "03:12:21.563Z"] }, "body": { "concepts": [{ "content": "And God said, Let the waters swarm with swarms of living creatures, (20a)", "isHead": true, "embeddedType": "panel" }, { "content": "and let birds fly above the earth in the open firmament of heaven. (20b)", "embeddedType": "panel" }, { "content": "And God created the great sea-monsters, (21a)" }, { "content": "and every living creature that moveth, wherewith the waters swarmed, (21b)", "isHead": true, "embeddedType": "panel" }, { "content": "after their kind, and every winged bird after its kind: (21c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-10-28T03:24:26.440Z:ol", "key": ["kyk:2014-10-28T03:24:26.440Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-28T03:24:26.440Z:ol", "_rev": "1-26fdb59759565c95ba4306e75a91470a", "head": { "contentType": "chiasm", "title": "image bearers", "ScriptureRange": "Genesis 1:27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 28, "03:24:26.440Z"] }, "body": { "concepts": [{ "content": "And God created (27a)", "isHead": true, "embeddedType": "panel" }, { "content": "humankind (27b)", "embeddedType": "panel" }, { "content": "in his own image, (27c)" }, { "content": "in the image of God (27d)" }, { "content": "created he it; (27e)", "isHead": true, "embeddedType": "panel" }, { "content": "male and female created he them. (27f)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-10-28T03:31:33.313Z:ol", "key": ["kyk:2014-10-28T03:31:33.313Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-28T03:31:33.313Z:ol", "_rev": "1-e9ae6e6f2ee3abe2573118eff1b46457", "head": { "contentType": "chiasm", "title": "human dominion over other creatures", "ScriptureRange": "Genesis 1:26-27", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 28, "03:31:33.313Z"] }, "body": { "concepts": [{ "content": "And God said, Let us make man in our image, after our likeness: (26)" }, { "content": "and let them have dominion over the fish of the sea, and over the birds of the heavens, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth. (26)" }, { "content": "image bearers [embedded] (27)", "embeddedOutlineId": "kyk:2014-10-28T03:24:26.440Z:ol" }] } } },
        { "id": "kyk:2014-10-28T03:36:14.474Z:ol", "key": ["kyk:2014-10-28T03:36:14.474Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-28T03:36:14.474Z:ol", "_rev": "1-32c998b13d98111cc67584edcb97b539", "head": { "contentType": "chiasm", "title": "God blessed humans", "ScriptureRange": "Genesis 1:26-28", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 28, "03:36:14.474Z"] }, "body": { "concepts": [{ "content": "human dominion over other creatures [embedded] (26-27)", "embeddedOutlineId": "kyk:2014-10-28T03:31:33.313Z:ol" }, { "content": "And God blessed them: and God said unto them, Be fruitful, and multiply, and replenish the earth, (28a)" }, { "content": "and subdue it; and have dominion over the fish of the sea, and over the birds of the heavens, and over every living thing that moveth upon the earth. (28b)" }] } } },
        { "id": "kyk:2014-10-28T04:00:08.654Z:ol", "key": ["kyk:2014-10-28T04:00:08.654Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-28T04:00:08.654Z:ol", "_rev": "1-0004da23996c35c4511e505e12d2beb9", "head": { "contentType": "chiasm", "title": "plants", "ScriptureRange": "Genesis 1:29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 28, "04:00:08.654Z"] }, "body": { "concepts": [{ "content": "And God said, Behold, I have given you (29a)" }, { "content": "every plant yielding seed, which is upon the face of all the earth, and every tree, in which is the fruit of a tree yielding seed; (29b)" }, { "content": "it will belong to you (29c)" }] } } },
        { "id": "kyk:2014-10-28T04:15:32.960Z:ol", "key": ["kyk:2014-10-28T04:15:32.960Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-28T04:15:32.960Z:ol", "_rev": "1-08a52e3fa04db9938780885383aa6667", "head": { "contentType": "chiasm", "title": "creatures, part 2", "ScriptureRange": "Genesis 1:29-30", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 28, "04:15:32.960Z"] }, "body": { "concepts": [{ "content": "plants [embedded] (29b)", "embeddedOutlineId": "kyk:2014-10-28T04:00:08.654Z:ol", "isHead": true, "embeddedType": "panel" }, { "content": "for food (29d)", "embeddedType": "panel" }, { "content": "and to every beast of the earth, and to every bird of the heavens, and to everything that creepeth upon the earth, everything that has the breath of life, (30a)" }, { "content": "I have given every green herb (30b)", "isHead": true, "embeddedType": "panel" }, { "content": "for food (30c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-10-28T04:42:03.367Z:ol", "key": ["kyk:2014-10-28T04:42:03.367Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-10-28T04:42:03.367Z:ol", "_rev": "1-c0c5fa5eeaaf0f1d5550b7565fee041b", "head": { "contentType": "chiasm", "title": "Days 4, 5, 6 - it was so!!!", "ScriptureRange": "Genesis 1:14-31", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 10, 28, "04:42:03.367Z"] }, "body": { "concepts": [{ "content": "Day Four - it was so! [embedded] (14-18c)", "embeddedOutlineId": "kyk:2014-10-26T22:16:54.842Z:ol", "isHead": true, "embeddedType": "panel" }, { "content": "and God saw that it was good. (18d)", "embeddedType": "panel" }, { "content": "Day Five - creatures, part 1 [embedded] (20-21c)", "embeddedOutlineId": "kyk:2014-10-26T22:40:22.568Z:ol" }, { "content": "and God saw that it was good. (21d)", "isHead": true, "embeddedType": "panel" }, { "content": "And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let birds multiply on the earth. (22)", "embeddedType": "panel" }, { "content": "Day Six-A - And God said, Let the earth bring forth living creatures after their kind, cattle, and creeping things, and beasts of the earth after their kind (24a)" }, { "content": "and it was so. (24b)" }, { "content": "And God made the beasts of the earth after their kind, and the cattle after their kind, and everything that creepeth upon the ground after its kind (25a)" }, { "content": "and God saw that it was good. (25b)", "isHead": true, "embeddedType": "panel" }, { "content": "God blessed humans [embedded] (26-28)", "embeddedOutlineId": "kyk:2014-10-28T03:36:14.474Z:ol", "embeddedType": "panel" }, { "content": "Day Six-B - creatures, part 2 [embedded] (29-30c)", "embeddedOutlineId": "kyk:2014-10-28T04:15:32.960Z:ol" }, { "content": "and it was so. (30d)", "isHead": true, "embeddedType": "panel" }, { "content": "And God saw everything that he had made, and, behold, it was very good. (31a)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-11-01T17:42:39.801Z:ol", "key": ["kyk:2014-11-01T17:42:39.801Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T17:42:39.801Z:ol", "_rev": "1-d9695f35a23c17876e3169feba097d45", "head": { "contentType": "chiasm", "title": "the bitter drink", "ScriptureRange": "Mark 15:34-37", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 1, "17:42:39.801Z"] }, "body": { "concepts": [{ "content": "And at the ninth hour Jesus shouted with a loud voice, “Eloi, Eloi, lema sabachthani?” which means, “My God, my God, why have you forsaken me?” (34)" }, { "content": "And some of the bystanders hearing it said, “Behold, he is calling Elijah.” (35)" }, { "content": "And someone ran and filled a sponge with sour wine, (36a)" }, { "content": "put it on a reed and gave it to him to drink, (36b)" }, { "content": "saying, “Wait, let us see whether Elijah will come to take him down.” (36c)" }, { "content": "And Jesus uttered a loud voice and breathed his last. (37)" }] } } },
        { "id": "kyk:2014-11-01T17:50:47.163Z:ol", "key": ["kyk:2014-11-01T17:50:47.163Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T17:50:47.163Z:ol", "_rev": "1-f907c9e441f2a2d585f4c2df110f85b1", "head": { "contentType": "chiasm", "title": "come down now from the cross", "ScriptureRange": "Mark 15:32", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 1, "17:50:47.163Z"] }, "body": { "concepts": [{ "content": "Let the Christ, the King of Israel, (32a)" }, { "content": "come down now from the cross, (32b)" }, { "content": "that we may see and believe. (32c)" }] } } },
        { "id": "kyk:2014-11-01T17:56:36.478Z:ol", "key": ["kyk:2014-11-01T17:56:36.478Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T17:56:36.478Z:ol", "_rev": "1-93d2065dcc029ba2b8d7a33bf89a6fb0", "head": { "contentType": "chiasm", "title": "the third hour", "ScriptureRange": "Mark 15:24-26", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 1, "17:56:36.478Z"] }, "body": { "concepts": [{ "content": "And they crucified him (24a)", "isHead": true, "embeddedType": "panel" }, { "content": "and divided his garments among them, casting lots for them, to decide what each should take. (24b)", "embeddedType": "panel" }, { "content": "And it was the third hour, (25a)" }, { "content": "and they crucified him. (25b)", "isHead": true, "embeddedType": "panel" }, { "content": "And the inscription of the charge against him read “The King of the Jews.” (26)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-11-01T18:16:17.906Z:ol", "key": ["kyk:2014-11-01T18:16:17.906Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T18:16:17.906Z:ol", "_rev": "1-397b61999603b5de6fe4eecef98d5fcf", "head": { "contentType": "chiasm", "title": "crucifixion of the King", "ScriptureRange": "Mark 15:22-37", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 1, "18:16:17.906Z"] }, "body": { "concepts": [{ "content": "And they brought him to the place called Golgotha (which means Place of a Skull). (22)", "isHead": true, "embeddedType": "panel" }, { "content": "And they offered him wine mixed with myrrh, but he did not take it. (23)", "embeddedType": "panel" }, { "content": "And it was the third hour [embedded] (25a)", "embeddedOutlineId": "kyk:2014-11-01T17:56:36.478Z:ol" }, { "content": "And with him they crucified two robbers one on his right and one on his left. (27)" }, { "content": "And those who passed by blasphemed him wagging their heads and saying “Aha! You who would destroy the temple and rebuild it in three days, (29)", "isHead": true, "embeddedType": "panel" }, { "content": "save yourself, (30a)", "embeddedType": "panel" }, { "content": "come down from the cross! (30b)", "embeddedType": "panel" }, { "content": "So also the chief priests with the scribes mocked him to one another, (31a)", "isHead": true, "embeddedType": "panel" }, { "content": "saying, “He saved others; he cannot save himself. (31b)", "embeddedType": "panel" }, { "content": "come down now from the cross [embedded] (32b)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-11-01T17:50:47.163Z:ol" }, { "content": "Those who were crucified with him also reviled him. (32d)" }, { "content": "And when the sixth hour had come, (33a)" }, { "content": "there was darkness over the whole land until the ninth hour. (33b)", "isHead": true, "embeddedType": "panel" }, { "content": "the bitter drink [embedded] (34-37)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-11-01T17:42:39.801Z:ol" }] } } },
        { "id": "kyk:2014-11-01T19:08:20.813Z:ol", "key": ["kyk:2014-11-01T19:08:20.813Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T19:08:20.813Z:ol", "_rev": "1-96bf128de42c29335421ba90b5e2b0e5", "head": { "contentType": "chiasm", "title": "what the chief priests do", "ScriptureRange": "Mark 15:9-12", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "19:08:20.813Z"] }, "body": { "concepts": [{ "content": "Pilate asks \"Do you want me to release the King of the Jews?\" (9)" }, { "content": "the chief priests handed Him over because of envy (10)", "isHead": true, "embeddedType": "panel" }, { "content": "the chief priests stir the multitude to release Barabbas (11)", "embeddedType": "panel" }, { "content": "Pilate asks \"What shall I do with the King of the Jews?\" (12)" }] } } },
        { "id": "kyk:2014-11-01T19:42:14.764Z:ol", "key": ["kyk:2014-11-01T19:42:14.764Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T19:42:14.764Z:ol", "_rev": "2-85d3a15a9c16b73da4e3ec202e219a92", "head": { "contentType": "chiasm", "title": "Jesus before Pilate", "ScriptureRange": "Mark 15:1-7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "19:42:14.764Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "19:56:35.288Z"] }, "body": { "concepts": [{ "content": "And as soon as it was morning, the chief priests held [Greek: ποιέω] a consultation with the elders and scribes and the whole council. (1a)" }, { "content": "And they bound Jesus (1b)" }, { "content": "and led him away and handed him over to Pilate. (1c)" }, { "content": "Pilate questioned Him (2a)" }, { "content": "“Are You the King of the Jews?” (2b)" }, { "content": "And he answered him, “You have said so.” (2c)" }, { "content": "Pilate again questioned Him [embedded] (4a)", "embeddedOutlineId": "kyk:2014-11-01T19:55:09.503Z:ol" }, { "content": "Now at the feast he used to release for them one prisoner for whom they asked. (6)" }, { "content": "There was the one called Barabbas who had been bound (7a)" }, { "content": "who had committed [Greek: ποιέω] murder. (7b)" }] } } },
        { "id": "kyk:2014-11-01T19:47:43.958Z:ol", "key": ["kyk:2014-11-01T19:47:43.958Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T19:47:43.958Z:ol", "_rev": "2-0421ef557d28d09c8d92a28d1d5a59bd", "head": { "contentType": "chiasm", "title": "\"they bring many charges against You\" - Pilate to Jesus", "ScriptureRange": "Mark 15:4-5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "19:47:43.958Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "19:50:27.333Z"] }, "body": { "concepts": [{ "content": "“Have you no answer to make? (4b)" }, { "content": "See how many charges they bring against you.” (4c)" }, { "content": "But Jesus made no further answer, so that Pilate was amazed. (5)" }] } } },
        { "id": "kyk:2014-11-01T19:55:09.503Z:ol", "key": ["kyk:2014-11-01T19:55:09.503Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-01T19:55:09.503Z:ol", "_rev": "2-fbd0895e24cedcd656fa35e72444b24b", "head": { "contentType": "chiasm", "title": "Pilate again questioned Jesus", "ScriptureRange": "Mark 15:3-5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "19:55:09.503Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "19:56:05.684Z"] }, "body": { "concepts": [{ "content": "And the chief priests were bringing many charges against Him. (3)" }, { "content": "Pilate again questioned Him (4a)" }, { "content": "See how many charges they bring against you.” [embedded] (4c)", "embeddedOutlineId": "kyk:2014-11-01T19:47:43.958Z:ol" }] } } },
        { "id": "kyk:2014-11-02T07:08:51.915Z:ol", "key": ["kyk:2014-11-02T07:08:51.915Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-02T07:08:51.915Z:ol", "_rev": "1-cb9166b444837ba1d37225ff82f5ae34", "head": { "contentType": "chiasm", "title": "finished work", "ScriptureRange": "Genesis 2:1", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "07:08:51.915Z"] }, "body": { "concepts": [{ "content": "they were finished (1a)" }, { "content": "the heavens and the earth and all their host (1b)" }, { "content": "God finished (2a)" }] } } },
        { "id": "kyk:2014-11-02T07:12:22.998Z:ol", "key": ["kyk:2014-11-02T07:12:22.998Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-02T07:12:22.998Z:ol", "_rev": "2-880a6bacfe07d8d9787846eb971ef93a", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Genesis 2:2", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "07:12:22.998Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 2, "12:06:38.106Z"] }, "body": { "concepts": [{ "content": "his work that he had made, (2c)" }, { "content": "and he rested (2d)" }, { "content": "on the seventh day (2e)" }, { "content": "from all (2f)" }, { "content": "his work that he had made. (2g)" }] } } },
        { "id": "kyk:2014-11-02T07:19:38.963Z:ol", "key": ["kyk:2014-11-02T07:19:38.963Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-11-02T07:19:38.963Z:ol", "_rev": "4-da70d0986d85271acef1c6fa08888487", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Genesis 2:3", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "07:19:38.963Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 3, "15:15:14.976Z"] }, "body": { "concepts": [{ "content": "because on it (3d)" }, { "content": "he rested from all (3e)" }, { "content": "his work that God had created and made. (3f-h)" }] } } },
        { "id": "kyk:2014-11-02T11:53:54.773Z:ol", "key": ["kyk:2014-11-02T11:53:54.773Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-02T11:53:54.773Z:ol", "_rev": "1-f49e69911722cae93f93a54ef288c80c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Genesis 2:3-4", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "11:53:54.773Z"] }, "body": { "concepts": [{ "content": "he had created (3g)", "isHead": true, "embeddedType": "panel" }, { "content": "God made (3h)", "embeddedType": "panel" }, { "content": "These are the generations [~accounts] (4a)" }, { "content": "when they were created [embedded] (4d)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T00:09:54.677Z:ol" }, { "content": "in the day that Jehovah God made [embedded] (4e)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T00:09:54.677Z:ol" }] } } },
        { "id": "kyk:2014-11-02T12:05:53.874Z:ol", "key": ["kyk:2014-11-02T12:05:53.874Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-02T12:05:53.874Z:ol", "_rev": "3-cf9eb1c5ee2cec630a4efd5484e74fa7", "head": { "contentType": "chiasm", "title": "Day 7 (core)", "ScriptureRange": "Genesis 2:2-3", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 2, "12:05:53.874Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 3, "07:06:22.915Z"] }, "body": { "concepts": [{ "content": "On the seventh day [embedded chiasm] (2e)", "embeddedOutlineId": "kyk:2014-11-02T07:12:22.998Z:ol" }, { "content": "God blessed (3a)" }, { "content": "the seventh day (3b)" }, { "content": "and set it apart as holy (3c)" }, { "content": "on the seventh day [embedded panel] (3d-h)", "embeddedOutlineId": "kyk:2014-11-02T07:19:38.963Z:ol" }] } } },
        { "id": "kyk:2014-11-03T07:10:46.179Z:ol", "key": ["kyk:2014-11-03T07:10:46.179Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-03T07:10:46.179Z:ol", "_rev": "1-adb3b0652019b02fda887a229a2d5de6", "head": { "contentType": "chiasm", "title": "Day 7", "ScriptureRange": "Genesis 2:1-4", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 3, "07:10:46.179Z"] }, "body": { "concepts": [{ "content": "the heavens and the earth and all their host [embedded] (1b)", "embeddedOutlineId": "kyk:2014-11-02T07:08:51.915Z:ol" }, { "content": "on the seventh day (2b)" }, { "content": "the seventh day [embedded] (3b)", "embeddedOutlineId": "kyk:2014-11-02T12:05:53.874Z:ol" }, { "content": "the heavens and the earth [embedded] (4b-g)", "embeddedOutlineId": "kyk:2014-10-26T00:09:54.677Z:ol" }] } } },
        { "id": "kyk:2014-11-03T07:25:00.431Z:ol", "key": ["kyk:2014-11-03T07:25:00.431Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-11-03T07:25:00.431Z:ol", "_rev": "2-c3279d64f60b21c66429b952c282d114", "head": { "contentType": "chiasm", "title": "Creation - the detailed view", "ScriptureRange": "Genesis 1:1-2:4", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 11, 3, "07:25:00.431Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 11, 3, "07:25:58.009Z"] }, "body": { "concepts": [{ "content": "creation inclusio, part one (1:1)" }, { "content": "Day 1 - it was light! [embedded] (1:2-5)", "isHead": true, "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T00:59:16.882Z:ol" }, { "content": "Day 2 - it was so! [embedded] (1:6-8)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T00:44:42.006Z:ol" }, { "content": "Day 3a - it was so! [embedded] (1:9-10)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T10:07:15.058Z:ol" }, { "content": "Day 3b - it was so! [embedded] (1:10-12)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-26T10:34:19.721Z:ol" }, { "content": "Days 4, 5, 6 - it was so!!! [embedded] (1:14-31)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-10-28T04:42:03.367Z:ol" }, { "content": "Day 7 [embedded] (2:1-4)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-11-03T07:10:46.179Z:ol" }, { "content": "creation inclusio, part two [embedded] (2:3-4)", "embeddedOutlineId": "kyk:2014-11-02T11:53:54.773Z:ol" }] } } },
        { "id": "kyk:2014-12-28T10:17:50.476Z:ol", "key": ["kyk:2014-12-28T10:17:50.476Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-12-28T10:17:50.476Z:ol", "_rev": "1-1df7ae55b6ebea1148ef401a24b3cc76", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Mark 12:38-44", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:17:50.476Z"] }, "body": { "concepts": [{ "content": "the scribes will receive greater condemnation (38-40)" }, { "content": "a small gift of great value (41-44)" }] } } },
        { "id": "kyk:2014-12-28T10:23:03.431Z:ol", "key": ["kyk:2014-12-28T10:23:03.431Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-28T10:23:03.431Z:ol", "_rev": "1-96acfe3f2dbec2c85c62efd748b99f95", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:1-2", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:23:03.431Z"] }, "body": { "concepts": [{ "content": "the Passover and the Festival of Unleavened Bread were after two days (1a)" }, { "content": "the chief priests and the scribes kept seeking (1b)" }, { "content": "how him[=Jesus] (1c)" }, { "content": "by stealth (they might) seize (and) (1d)" }, { "content": "they might kill (1e)" }, { "content": "they kept saying (2a)" }, { "content": "not at the Festival, lest there will be a riot of the people (2b)" }] } } },
        { "id": "kyk:2014-12-28T10:25:23.476Z:ol", "key": ["kyk:2014-12-28T10:25:23.476Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-28T10:25:23.476Z:ol", "_rev": "1-031fcf923cecf603bca38736b88dd9c6", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:10-11", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:25:23.476Z"] }, "body": { "concepts": [{ "content": "Judas Iscariot went to the chief priests (10a)", "isHead": true, "embeddedType": "panel" }, { "content": "in order to betray him[=Jesus] (10b)", "embeddedType": "panel" }, { "content": "when they heard, they rejoiced (11a)" }, { "content": "and promised to give him money (11b)" }, { "content": "he kept seeking (11c)", "isHead": true, "embeddedType": "panel" }, { "content": "a good opportunity how he might betray him[=Jesus] (11d)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-12-28T10:26:42.204Z:ol", "key": ["kyk:2014-12-28T10:26:42.204Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-28T10:26:42.204Z:ol", "_rev": "1-671e7ce14e1c6b9635260bb6e439e215", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:26:42.204Z"] }, "body": { "concepts": [{ "content": "I tell you the truth, wherever the good news is proclaimed in the whole world (9a)" }, { "content": "what this (woman) did (9b)" }, { "content": "will be told in memory of her (9c)" }] } } },
        { "id": "kyk:2014-12-28T10:30:52.946Z:ol", "key": ["kyk:2014-12-28T10:30:52.946Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-28T10:30:52.946Z:ol", "_rev": "1-25763314125fbde26ee881ce020b2a78", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:8-9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:30:52.946Z"] }, "body": { "concepts": [{ "content": "she did what she could (8a)" }, { "content": "she anointed my body beforehand for burial (8b)" }, { "content": "what this (woman) did [embedded] (9b)", "embeddedOutlineId": "kyk:2014-12-28T10:26:42.204Z:ol" }] } } },
        { "id": "kyk:2014-12-28T10:32:12.810Z:ol", "key": ["kyk:2014-12-28T10:32:12.810Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-28T10:32:12.810Z:ol", "_rev": "1-6941dc0f12f2b8196f7ac72aad6b63ee", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:7", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:32:12.810Z"] }, "body": { "concepts": [{ "content": "you always have the poor with you (7a)" }, { "content": "you can do good to the poor whenever you wish (7b)" }, { "content": "you do not always have me (7c)" }] } } },
        { "id": "kyk:2014-12-28T10:36:59.921Z:ol", "key": ["kyk:2014-12-28T10:36:59.921Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-28T10:36:59.921Z:ol", "_rev": "1-187daa1d60053a4d73465d2af365dc09", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 14:3-9", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 28, "10:36:59.921Z"] }, "body": { "concepts": [{ "content": "a woman anoints Jesus' head with perfume. (3b)" }, { "content": "some were angry saying, \"why did this waste of perfume happen?\" (4)", "isHead": true, "embeddedType": "panel" }, { "content": "\"this perfume could have been sold and the money given to the poor.\" (5a)", "embeddedType": "panel" }, { "content": "they harshly rebuked her. (5b)" }, { "content": "Jesus said, \"let her alone.\" (6a)" }, { "content": "\"why do you trouble her?\" (6b)" }, { "content": "\"she has done a beautiful thing to me.\" (6c)", "isHead": true, "embeddedType": "panel" }, { "content": "\"you can do good to the poor whenever you wish.\" [embedded] (7b)", "embeddedType": "panel", "embeddedOutlineId": "kyk:2014-12-28T10:32:12.810Z:ol" }, { "content": "\"she anointed my body beforehand for burial.\" [embedded] (8b)", "embeddedOutlineId": "kyk:2014-12-28T10:30:52.946Z:ol" }] } } },
        { "id": "kyk:2014-12-29T18:59:16.939Z:ol", "key": ["kyk:2014-12-29T18:59:16.939Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T18:59:16.939Z:ol", "_rev": "1-b43f7ac88c6b5c1e83e840779367b83c", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:34-36", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "18:59:16.939Z"] }, "body": { "concepts": [{ "content": "the Man left his house and put his slaves in charge, giving each of them work to do (34a)" }, { "content": "he commanded the doorkeeper to be alert (34b)" }, { "content": "so, you be alert! (35a)" }, { "content": "for you do not know when the Lord is coming, lest he find you sleeping (35b-36)" }] } } },
        { "id": "kyk:2014-12-29T19:02:40.455Z:ol", "key": ["kyk:2014-12-29T19:02:40.455Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:02:40.455Z:ol", "_rev": "1-5a0e3560234cf30edfe88dbcc08d2f6d", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:34-37", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:02:40.455Z"] }, "body": { "concepts": [{ "content": "be alert! [embedded] (34-36)", "embeddedOutlineId": "kyk:2014-12-29T18:59:16.939Z:ol" }, { "content": "what I am saying to you, I am saying to everyone, be alert! (37)" }] } } },
        { "id": "kyk:2014-12-29T19:04:26.232Z:ol", "key": ["kyk:2014-12-29T19:04:26.232Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:04:26.232Z:ol", "_rev": "1-d9723dcda66db0d568940a5e016d9ff6", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:32-33", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:04:26.232Z"] }, "body": { "concepts": [{ "content": "about that day or hour (32a)" }, { "content": "no one knows, neither the angels in heaven, or the Son, except the Father (32b)" }, { "content": "look out! (33a)" }, { "content": "be awake! (33b)" }, { "content": "for you do not know (33c)" }, { "content": "when the right time is (33d)" }] } } },
        { "id": "kyk:2014-12-29T19:06:56.004Z:ol", "key": ["kyk:2014-12-29T19:06:56.004Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-12-29T19:06:56.004Z:ol", "_rev": "1-60136d744337dcd67ac3ef6556a5ec67", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Mark 13:28-29", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "contentParams": { "repeat": 3 }, "submissionTimestamp": [2014, 12, 30, "19:06:56.004Z"] }, "body": { "concepts": [{ "content": "learn the parable from the fig tree (28a)" }, { "content": "when its branch is already tender and it puts forth leaves (28b)" }, { "content": "you know that summer is near (28c)" }, { "content": "so also you (29a)" }, { "content": "when you see these things happening (29b)" }, { "content": "you know that it is near--right at the door (29c)" }] } } },
        { "id": "kyk:2014-12-29T19:11:22.207Z:ol", "key": ["kyk:2014-12-29T19:11:22.207Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:11:22.207Z:ol", "_rev": "1-7b6393831144bc01ff47d01d602ecbe1", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:26-37", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:11:22.207Z"] }, "body": { "concepts": [{ "content": "you will see the Son of Man coming in clouds with great power and glory. He will gather his chosen ones from all over. (26-27)" }, { "content": "know that it is near [embedded] (28-29)", "embeddedOutlineId": "kyk:2014-12-29T19:06:56.004Z:ol" }, { "content": "there is no way this generation will pass away until all these things happen (30)" }, { "content": "the atmosphere and the earth will pass away (31a)" }, { "content": "there is no way my words will pass away (31b)" }, { "content": "look out! be awake! [embedded] (32-33)", "embeddedOutlineId": "kyk:2014-12-29T19:04:26.232Z:ol" }, { "content": "the Man is coming, so be alert! [embedded] (34-37)", "embeddedOutlineId": "kyk:2014-12-29T19:02:40.455Z:ol" }] } } },
        { "id": "kyk:2014-12-29T19:14:09.059Z:ol", "key": ["kyk:2014-12-29T19:14:09.059Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:14:09.059Z:ol", "_rev": "1-e869538e7ea24518432469a35a7226c3", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:21-22", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:14:09.059Z"] }, "body": { "concepts": [{ "content": "then if someone says to you, \"look, here is the Messiah, or look there\" (21a)", "isHead": true, "embeddedType": "panel" }, { "content": "do not believe (them) (21b)", "embeddedType": "panel" }, { "content": "for false christs and false prophets will be raised up (22a)" }, { "content": "and they will perform signs and wonders (22b)", "isHead": true, "embeddedType": "panel" }, { "content": "so as to lead astray, if possible, the ones chosen (by God) (22c)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2014-12-29T19:15:41.042Z:ol", "key": ["kyk:2014-12-29T19:15:41.042Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-12-29T19:15:41.042Z:ol", "_rev": "1-b853d956885dc6d7e19dd3bf0c9a3c0a", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Mark 13:13", "contentParams": { "repeat": 0, "header": false }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:15:41.042Z"] }, "body": { "concepts": [{ "content": "the one who endures to the end (13b)" }, { "content": "this one will be saved (13c)" }] } } },
        { "id": "kyk:2014-12-29T19:17:13.267Z:ol", "key": ["kyk:2014-12-29T19:17:13.267Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:17:13.267Z:ol", "_rev": "1-39e49ce5f746311a5a680cf4891806ad", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:17:13.267Z"] }, "body": { "concepts": [{ "content": "unless the Lord shortened those days (20a)" }, { "content": "not any people would be saved (20b)" }, { "content": "but because of the chosen whom he chose (20c)" }, { "content": "(the Lord) shortened those days (20d)" }] } } },
        { "id": "kyk:2014-12-29T19:21:44.888Z:ol", "key": ["kyk:2014-12-29T19:21:44.888Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:21:44.888Z:ol", "_rev": "1-c1debe333a474dcb9e732f80b61040aa", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:13-20", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:21:44.888Z"] }, "body": { "concepts": [{ "content": "who will be saved [embedded] (13b-c)", "embeddedOutlineId": "kyk:2014-12-29T19:15:41.042Z:ol" }, { "content": "when you see the abomination that causes desolation [spoken of by Daniel] set up where it should not be (14a)" }, { "content": "note to the reader: understand what this means (14b)" }, { "content": "then those who are in Judea should flee to the mountains (14c)" }, { "content": "let no one on the roof of his house go down or enter the house (15a)", "isHead": true, "embeddedType": "panel" }, { "content": "to take anything out (15b)", "embeddedType": "panel" }, { "content": "let no one in the field go back (16a)", "isHead": true, "embeddedType": "panel" }, { "content": "to take his cloak (16b)", "embeddedType": "panel" }, { "content": "woe to pregnant women or nursing mothers in those days (17)" }, { "content": "be praying in order that it may not take place in winter (18)" }, { "content": "those days will be tribulation of such extent that has never happened from creation until now and never will be again (19)" }, { "content": "some will be saved [embedded] (20)", "embeddedOutlineId": "kyk:2014-12-29T19:17:13.267Z:ol" }] } } },
        { "id": "kyk:2014-12-29T19:26:09.730Z:ol", "key": ["kyk:2014-12-29T19:26:09.730Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:26:09.730Z:ol", "_rev": "1-71d6a5d13118fb2f8905a16fdb4bab55", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 13:11-13", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:26:09.730Z"] }, "body": { "concepts": [{ "content": "when they arrest you and betray you (11a)" }, { "content": "do not worry beforehand what you may say (11b)", "isHead": true, "embeddedType": "panel" }, { "content": "but in that hour whatever is given to you (11c)", "embeddedType": "panel" }, { "content": "this you shall say (11d)" }, { "content": "for you are not the ones speaking (11e)", "isHead": true, "embeddedType": "panel" }, { "content": "but (it is) the Holy Spirit (11f)", "embeddedType": "panel" }, { "content": "betrayed and put to death and hated by everyone because of my fame (12-13a)" }] } } },
        { "id": "kyk:2014-12-29T19:27:38.360Z:ol", "key": ["kyk:2014-12-29T19:27:38.360Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-12-29T19:27:38.360Z:ol", "_rev": "1-7e9e9ec7436a524a69e5847c21892df2", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Mark 13:9", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:27:38.360Z"] }, "body": { "concepts": [{ "content": "you yourselves look out! they will betray you and you will be beaten and will stand before kings (9a)" }, { "content": "as a testimony to them (9b)" }] } } },
        { "id": "kyk:2014-12-29T19:30:01.081Z:ol", "key": ["kyk:2014-12-29T19:30:01.081Z:ol", "panel: tleper"], "value": { "_id": "kyk:2014-12-29T19:30:01.081Z:ol", "_rev": "1-59bb50cc22e0957bef0dc70f96116e9d", "head": { "contentType": "panel", "title": "", "ScriptureRange": "Mark 13:7-8", "contentParams": { "repeat": 3 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:30:01.081Z"] }, "body": { "concepts": [{ "content": "when you hear of wars and threats of wars, do not be panic (7a)" }, { "content": "it is necessary (for these things) to occur (7b)" }, { "content": "but the end is not yet (7c)" }, { "content": "ethnic communities and kingdoms will rise up against each other (8a)" }, { "content": "there will be earthquakes in many places, and there will be famines (8b)" }, { "content": "these things are (only) the beginning of great pains (8c)" }] } } },
        { "id": "kyk:2014-12-29T19:33:30.817Z:ol", "key": ["kyk:2014-12-29T19:33:30.817Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:33:30.817Z:ol", "_rev": "1-3096f64f9e82ceeb06776ee57d1fc1e5", "head": { "contentType": "chiasm", "title": "\"christian\" antichrists", "ScriptureRange": "Mark 13:5-6", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:33:30.817Z"] }, "body": { "concepts": [{ "content": "lest someone deceive you (5b)" }, { "content": "many will come on my(=Jesus') name saying \"I AM\" (6a)" }, { "content": "they will deceive many (6b)" }] } } },
        { "id": "kyk:2014-12-29T19:45:45.139Z:ol", "key": ["kyk:2014-12-29T19:45:45.139Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2014-12-29T19:45:45.139Z:ol", "_rev": "2-d2c9663553839a2d48bba4ec3edb6ab7", "head": { "contentType": "chiasm", "title": "Jesus returns as King", "ScriptureRange": "Mark 13:1-37", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2014, 12, 30, "19:45:45.139Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2014, 12, 30, "19:56:13.185Z"] }, "body": { "concepts": [{ "content": "\"Hey teacher, check out the buildings!\" And Jesus said, \"There is no way that even one stone will be left on another which will not be thrown down!\" (1-2)" }, { "content": "\"When will these (destructive) things happen?\" (3-4)" }, { "content": "\"What will be the sign when all these (destructive) things are about to be accomplished?\" (4b)" }, { "content": "Jesus began by saying to them, \"Look out!\" (5a)" }, { "content": "many \"christian\" antichrists will come [embedded] (5b-6)", "embeddedOutlineId": "kyk:2014-12-29T19:33:30.817Z:ol" }, { "content": "beginning painful signs [embedded] (7-8)", "embeddedOutlineId": "kyk:2014-12-29T19:30:01.081Z:ol" }, { "content": "you will be betrayed and will stand as a testimony to kings [embedded] (9)", "embeddedOutlineId": "kyk:2014-12-29T19:27:38.360Z:ol" }, { "content": "it is of foremost necessity that the good news be proclaimed to all the ethnic communities (10)" }, { "content": "betrayed and given what to say [embedded] (11-13a)", "embeddedOutlineId": "kyk:2014-12-29T19:26:09.730Z:ol" }, { "content": "the final horrific trauma [embedded] (13b-20)", "embeddedOutlineId": "kyk:2014-12-29T19:21:44.888Z:ol" }, { "content": "false messiahs and false prophets [embedded] (21-22)", "embeddedOutlineId": "kyk:2014-12-29T19:14:09.059Z:ol" }, { "content": "\"now you look out!\" (23a)" }, { "content": "\"I have warned you about all these things ahead of time\" (23b)" }, { "content": "in those days, after that tribulation, the sun, moon, stars, and heavenly powers will totally freak out (24-25)" }, { "content": "the atmosphere and the earth will pass away [embedded] (26-37)", "embeddedOutlineId": "kyk:2014-12-29T19:11:22.207Z:ol" }] } } },
        { "id": "kyk:2015-01-10T12:33:14.701Z:ol", "key": ["kyk:2015-01-10T12:33:14.701Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2015-01-10T12:33:14.701Z:ol", "_rev": "2-8d89687926915099398c3e1de59010a1", "head": { "contentType": "chiasm", "title": "Love litmus test", "ScriptureRange": "1 Corinthians 13:4-5", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 1, 10, "12:33:14.701Z"], "source": { "details": "", "website": "", "guid": "" }, "modifiedTimestamp": [2015, 2, 1, "10:27:54.478Z"] }, "body": { "concepts": [{ "content": "This kind of love keeps on drinking up suffering with zero payback (4a)" }, { "content": "This kind of love continues to be kind (4b)" }, { "content": "is never jealous (4c)" }, { "content": "never brags (4d)" }, { "content": "is never puffed up with pride (4e)" }, { "content": "never behaves disgracefully (5a)" }, { "content": "never pursues things for self (5b)" }, { "content": "never gets hot-n-bothered (5c)" }] } } },
        { "id": "kyk:2015-02-02T02:51:35.044Z:ol", "key": ["kyk:2015-02-02T02:51:35.044Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2015-02-02T02:51:35.044Z:ol", "_rev": "1-5b67e65c57a0cb0aa3a30d301d43ccd7", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 4:39", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 2, 2, "02:51:35.044Z"] }, "body": { "concepts": [{ "content": "he rebuked the wind (39a)" }, { "content": "he told the lake, \"Shut up! Be (already) silenced!\" (39b)" }, { "content": "the wind ceased (39c)" }] } } },
        { "id": "kyk:2015-02-02T02:53:53.131Z:ol", "key": ["kyk:2015-02-02T02:53:53.131Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2015-02-02T02:53:53.131Z:ol", "_rev": "1-e8bee786ddba6e6dca410e16e6c6c9a4", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 4:37-39", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 2, 2, "02:53:53.131Z"] }, "body": { "concepts": [{ "content": "the mega-windstorm (37a)" }, { "content": "the pounding waves (37b)" }, { "content": "the water-filled boat (37c)" }, { "content": "Jesus is asleep (38a)" }, { "content": "they rouse him (38b)" }, { "content": "\"You do care, don't you, that we are being destroyed?\" (38c)" }, { "content": "he told the lake, \"Shut up! Be (already) silenced!\" [embedded] (39b)", "embeddedOutlineId": "kyk:2015-02-02T02:51:35.044Z:ol" }, { "content": "the mega-calm (39d)" }] } } },
        { "id": "kyk:2015-02-02T02:56:39.254Z:ol", "key": ["kyk:2015-02-02T02:56:39.254Z:ol", "panel: tleper"], "value": { "_id": "kyk:2015-02-02T02:56:39.254Z:ol", "_rev": "1-36f8b2276219b68729016ee39269211f", "head": { "contentType": "panel", "title": "amazed at Jesus' authority", "ScriptureRange": "Mark 4:35-41", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 2, 2, "02:56:39.254Z"] }, "body": { "concepts": [{ "content": "setting: cross-over counter attack (35-36)" }, { "content": "Jesus is contrary: he is sleeping in our storm and we force him to wake up [embedded] (37-39)", "embeddedOutlineId": "kyk:2015-02-02T02:53:53.131Z:ol" }, { "content": "our unbelief: no faith to stop the storm (40)" }, { "content": "our mega-fear: wind, waves, & the mystery of his call (41a)" }, { "content": "our response: \"Who is this awesome storm-stopper anyway?!\" (41b)" }] } } },
        { "id": "kyk:2015-02-02T02:59:06.671Z:ol", "key": ["kyk:2015-02-02T02:59:06.671Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2015-02-02T02:59:06.671Z:ol", "_rev": "1-34ec19e08a67de4f1a34fe7de0ab5656", "head": { "contentType": "chiasm", "title": "", "ScriptureRange": "Mark 11:29-30", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 2, 2, "02:59:06.671Z"] }, "body": { "concepts": [{ "content": "\"I will ask you one question\" (29a)", "isHead": true, "embeddedType": "panel" }, { "content": "\"you answer me\" (29b)", "embeddedType": "panel" }, { "content": "\"then I will answer you about my authority\" (29c)" }, { "content": "\"was John's baptism from heaven or from men?\" (30a)", "isHead": true, "embeddedType": "panel" }, { "content": "\"you answer me\" (30b)", "embeddedType": "panel" }] } } },
        { "id": "kyk:2015-02-02T03:02:00.560Z:ol", "key": ["kyk:2015-02-02T03:02:00.560Z:ol", "panel: tleper"], "value": { "_id": "kyk:2015-02-02T03:02:00.560Z:ol", "_rev": "1-9c7c60ca2910b7fe13549514ae38ed7b", "head": { "contentType": "panel", "title": "questioning Jesus' authority", "ScriptureRange": "Mark 11:27-33", "contentParams": { "repeat": 0 }, "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 2, 2, "03:02:00.560Z"] }, "body": { "concepts": [{ "content": "setting: the religious big-wigs' tree has been ruined by Jesus, and they question his authority (27-28)" }, { "content": "Jesus is contrary: he refuses to be manipulated by them [embedded] (29-30)", "embeddedOutlineId": "kyk:2015-02-02T02:59:06.671Z:ol" }, { "content": "our unbelief: corporate religious dialogue - \"(since we are correct,) 'that' cannot be from heaven!\" (31)" }, { "content": "our ongoing fear: the crowds will kill us if we expose our sinful attitudes (32)" }, { "content": "our response: stubborn refusal to respond to him and he does not respond to us (33)" }] } } },
        { "id": "kyk:2015-04-09T12:12:12.153Z:ol", "key": ["kyk:2015-04-09T12:12:12.153Z:ol", "chiasm: tleper"], "value": { "_id": "kyk:2015-04-09T12:12:12.153Z:ol", "_rev": "1-a5c8d253dc6af289fd87307cb50355c3", "head": { "contentType": "chiasm", "title": "Lord, help me!", "ScriptureRange": "Matthew 15:22-28", "author": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps", "authorShortname": "tleper" }, "submittedBy": { "guid": "kyk:2013-07-03T13:37:34.266Z:ps" }, "submissionTimestamp": [2015, 4, 9, "12:12:12.153Z"] }, "body": { "concepts": [{ "content": "behold, a Canaanite woman who had left those borders (22a)", "isHead": true, "embeddedType": "panel" }, { "content": "have mercy on me... (22b)", "embeddedType": "panel" }, { "content": "my daughter is severely demonized (22c)", "embeddedType": "panel" }, { "content": "he did not answer to her (23a)" }, { "content": "the disciples kept asking him to send her away because she continues to shout behind them (23b)" }, { "content": "he talks about only being sent to the lost sheep of Israel (24)" }, { "content": "she was going on falling at his feet and continually saying, \"Lord, be helping me\" (25)" }, { "content": "he talks about how the children's bread should not be thrown to the dogs (26)" }, { "content": "she agrees with him and as support says that dogs keep eating the crumbs that keep falling (27)" }, { "content": "then Jesus answers to her (28a)" }, { "content": "O woman, great is your faith (28b)", "isHead": true, "embeddedType": "panel" }, { "content": "let it be done for you as you are wanting (28c)", "embeddedType": "panel" }, { "content": "her daughter was healed (28d)", "embeddedType": "panel" }] } } }
	    ]
	};



